import forge from 'node-forge';
import { SignedXml } from 'xml-crypto';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import JSZip from 'jszip';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import https from 'https';
import dns from 'dns';

// Persistent cache for resolved DNS IPs to prevent extra requests
const dnsCache: Record<string, string> = {};

// Custom DNS-over-HTTPS resolution function using public Secure JSON DNS APIs
async function resolveDoh(hostname: string): Promise<string> {
  if (dnsCache[hostname]) {
    return dnsCache[hostname];
  }

  // List of DoH endpoints to query
  const dohEndpoints = [
    `https://dns.google/resolve?name=${hostname}&type=A`,
    `https://cloudflare-dns.com/dns-query?name=${hostname}&type=A`
  ];

  for (const endpoint of dohEndpoints) {
    try {
      console.log(`SUNAT DNS: Querying resolver DoH: ${endpoint}`);
      const headers = endpoint.includes('cloudflare') ? { 'accept': 'application/json' } : {};
      const response = await axios.get(endpoint, { headers, timeout: 4000 });
      if (response?.data?.Answer && response.data.Answer.length > 0) {
        const ip = response.data.Answer.find((ans: any) => ans.type === 1)?.data;
        if (ip && /^[0-9.]+$/.test(ip)) {
          dnsCache[hostname] = ip;
          console.log(`SUNAT DNS: Resolved ${hostname} to ${ip} via DoH`);
          return ip;
        }
      }
    } catch (err: any) {
      console.warn(`SUNAT DNS: DoH attempt failed for ${endpoint}: ${err.message || err}`);
    }
  }

  // Robust Hardcoded Fallback Public IPs of SUNAT Servers in Peru
  console.log("SUNAT DNS: Falling back to static IP mapping");
  if (hostname.includes('e-beta.sunat.gob.pe')) {
    dnsCache[hostname] = '200.41.15.49';
    return '200.41.15.49';
  } else if (hostname.includes('e-comprobantes.sunat.gob.pe')) {
    dnsCache[hostname] = '190.108.97.241';
    return '190.108.97.241';
  } else if (hostname.includes('e-facturacion.sunat.gob.pe')) {
    dnsCache[hostname] = '190.108.97.241';
    return '190.108.97.241';
  }

  throw new Error(`Could not resolve ${hostname} via public DNS or fallback`);
}

// Custom DNS lookup to resolve SUNAT hostnames using dynamic cache / DoH
// to bypass Vercel's DNS resolution and UDP port 53 blockages.
function getDnsSafeAgent(hostname: string): https.Agent {
  const customLookup = (
    host: string,
    options: any,
    callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void
  ) => {
    // If it's already an IP address, resolve instantly
    if (/^[0-9.]+$/.test(host)) {
      return callback(null, host, 4);
    }

    const cachedIp = dnsCache[host];
    if (cachedIp) {
      console.log(`SUNAT Socket: Internally mapping ${host} -> IP ${cachedIp}`);
      return callback(null, cachedIp, 4);
    }

    // Default to OS DNS system if not pre-resolved
    dns.lookup(host, options, callback);
  };

  return new https.Agent({
    lookup: customLookup,
    keepAlive: true,
    servername: hostname, // CRITICAL: This sets the correct SNI hostname for SSL Handshake
    rejectUnauthorized: false, // Prevents failure if IP mismatch or invalid self-signed SUNAT headers
  });
}

export class SunatService {
  private ruc: string;
  private user: string;
  private pass: string;
  private certPass: string;
  private certPath: string;
  private certBase64Override?: string;

  constructor(certBase64Override?: string, certPassOverride?: string) {
    this.ruc = process.env.SUNAT_RUC || '';
    this.user = process.env.SUNAT_USERNAME || '';
    this.pass = process.env.SUNAT_PASSWORD || '';
    this.certPass = certPassOverride || process.env.SUNAT_CERT_PASSWORD || '';
    this.certBase64Override = certBase64Override;
    
    // Resolve certificate path with robust fallbacks without referencing __dirname
    const possiblePaths = [
      path.join(process.cwd(), 'certs', 'certificate.p12'),
      path.join(process.cwd(), '..', 'certs', 'certificate.p12'),
      '/app/applet/certs/certificate.p12',
      '/certs/certificate.p12',
    ];
    
    const foundPath = possiblePaths.find(p => fs.existsSync(p));
    this.certPath = foundPath || possiblePaths[0];
    console.log("SunatService: Initialized with certPath =", this.certPath, "Exists?", !!foundPath, "HasOverride?", !!certBase64Override);
  }

  private async getKeys() {
    let p12Der: string;
    
    if (this.certBase64Override) {
      console.log("SunatService: Loading certificate from headers override.");
      p12Der = Buffer.from(this.certBase64Override, 'base64').toString('binary');
    } else if (process.env.SUNAT_CERT_BASE64) {
      console.log("SunatService: Loading certificate from SUNAT_CERT_BASE64 env variable.");
      p12Der = Buffer.from(process.env.SUNAT_CERT_BASE64, 'base64').toString('binary');
    } else {
      if (!fs.existsSync(this.certPath)) {
        throw new Error(`Certificate not found at: ${this.certPath} and SUNAT_CERT_BASE64 is not set`);
      }
      p12Der = fs.readFileSync(this.certPath, 'binary');
    }
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, this.certPass);
    
    const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag];
    if (!keyBag || !keyBag[0] || !keyBag[0].key) throw new Error("Private key not found in P12");
    const key = keyBag[0].key;

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag];
    if (!certBag || !certBag[0] || !certBag[0].cert) throw new Error("Certificate not found in P12");
    const cert = certBag[0].cert;

    return {
      privateKey: forge.pki.privateKeyToPem(key),
      certificate: forge.pki.certificateToPem(cert),
      certAsn1: cert
    };
  }

  async sendInvoice(xmlString: string, fileName: string) {
    const { privateKey, certificate } = await this.getKeys();

    // 1. Sign XML
    const pureCert = certificate
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\n|\r/g, '');

    console.log("--- DEBUG SUNAT SIGNATURE ---");
    console.log("XML Type:", typeof xmlString);
    console.log("XML Length:", xmlString?.length);
    console.log("XML Content (first 500 chars):", xmlString?.substring(0, 500));
    
    if (!xmlString || typeof xmlString !== 'string') {
      throw new Error(`Invalid XML input: received ${typeof xmlString}`);
    }

    // Parse XML to Document to ensure it's valid and for structure check
    const parser = new DOMParser({
        errorHandler: (level, msg) => {
            if (level === 'error') console.error(`[xmldom ${level}]`, msg);
        }
    });
    const doc = parser.parseFromString(xmlString, 'text/xml');
    
    // Check if parsing failed
    if (!doc || !doc.documentElement || doc.getElementsByTagName('parsererror').length > 0) {
      console.error("XML Parsing Error detected.");
      throw new Error("Invalid XML document source: parser error");
    }

    // Verify ExtensionContent exists
    const extNamespace = 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2';
    const extensionContent = doc.getElementsByTagNameNS(extNamespace, 'ExtensionContent')[0]
      || doc.getElementsByTagName('ext:ExtensionContent')[0]
      || doc.getElementsByTagName('ExtensionContent')[0];
    
    if (!extensionContent) {
      console.error("Structure check failed: <ext:ExtensionContent> not found.");
      throw new Error("Required node <ext:ExtensionContent> not found in XML structure. The UBL 2.1 structure is mandatory for SUNAT.");
    }

    const sig = new SignedXml();

    sig.signingKey = privateKey;

    (sig as any).keyInfoProvider = {
      getKeyInfo: (key: any, prefix: string) =>
        `<${prefix}:X509Data><${prefix}:X509Certificate>${pureCert}</${prefix}:X509Certificate></${prefix}:X509Data>`
    };

    sig.addReference(
      "//*[local-name()='Invoice']",
      [
        "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
        "http://www.w3.org/2001/10/xml-exc-c14n#"
      ],
      "http://www.w3.org/2001/04/xmlenc#sha256",
      "", // uri
      null as any,
      null as any,
      true // isEmptyUri
    );

    sig.signatureAlgorithm =
     "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";

    let signedXml = '';
    try {
      console.log("Computing signature with xml-crypto 2.1.6 (Direct insertion)...");
      
      // Strip XML declaration for signing to prevent issues with xml-crypto XPath parser
      const xmlToSign = xmlString.replace(/^<\?xml.*?\?>\s*/, '').trim();
      
      sig.computeSignature(xmlToSign, {
        prefix: "ds",
        attrs: {
          Id: "SIGN-EMISOR"
        },
        location: {
          reference: "//*[local-name()='ExtensionContent']",
          action: "append"
        }
      });
      
      signedXml = sig.getSignedXml();
      console.log("Signature computed and inserted into ExtensionContent.");
    } catch (e: any) {
      console.error("Signature computation failed. Error:", e);
      throw new Error(`Signature computation failed: ${e.message}`);
    }

    
    if (!signedXml.startsWith('<?xml')) {
      signedXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + signedXml;
    }
    
    console.log("ROOT TAG CHECK:");
    console.log(
     signedXml.match(/<[a-zA-Z0-9:]*Invoice[^>]*>/)?.[0]
    );

    console.log("SIGNED XML FINAL:");
    console.log(signedXml);
    
    console.log("Signed XML prepared. Length:", signedXml.length);

    // 2. Zip
    const zip = new JSZip();
    // Ensure XML declaration is correct and followed by newline if needed, but usually just the string is fine
    zip.file(`${fileName}.xml`, signedXml);
    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });

    // 3. Prepare SOAP
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.sunat.gob.pe" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
   <soapenv:Header>
      <wsse:Security>
         <wsse:UsernameToken>
            <wsse:Username>${this.ruc}${this.user}</wsse:Username>
            <wsse:Password>${this.pass}</wsse:Password>
         </wsse:UsernameToken>
      </wsse:Security>
   </soapenv:Header>
   <soapenv:Body>
      <ser:sendBill>
         <fileName>${fileName}.zip</fileName>
         <contentFile>${zipContent.toString('base64')}</contentFile>
      </ser:sendBill>
   </soapenv:Body>
</soapenv:Envelope>`.trim();

    const isProduction = process.env.SUNAT_ENVIRONMENT === 'production';
    
    const urls = isProduction 
      ? [
          'https://e-facturacion.sunat.gob.pe/ol-ti-itcpfegem/billService',
          'https://e-comprobantes.sunat.gob.pe/ol-it-wsspfegem/billService'
        ]
      : [
          'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService'
        ];

    let lastError: any = null;

    for (const connectUrl of urls) {
      try {
        const parsedUrl = new URL(connectUrl);
        const hostname = parsedUrl.hostname;

        // Perform public DNS-over-HTTPS pre-resolution
        let ip = dnsCache[hostname];
        try {
          ip = await resolveDoh(hostname);
        } catch (e: any) {
          console.warn(`SUNAT: DNS-over-HTTPS pre-resolution failed for ${hostname} (will fallback): ${e.message || e}`);
          if (!ip) {
            if (hostname.includes('e-beta.sunat.gob.pe')) {
              ip = '190.108.97.234';
            } else {
              ip = '190.108.97.241';
            }
          }
        }

        const ipUrl = connectUrl.replace(hostname, ip);
        const httpsAgent = new https.Agent({
          keepAlive: true,
          servername: hostname, // CRITICAL: This sets the correct SNI hostname for SSL Handshake
          rejectUnauthorized: false, // Prevents failure if IP mismatch or invalid self-signed SUNAT headers
        });

        console.log(`SUNAT: Attempting connection to IP-replaced URL: ${ipUrl} (Host: ${hostname})`);
        const response = await axios.post(ipUrl, soapEnvelope, {
          headers: { 
            'Host': hostname, // Explicit Host header for routing in SUNAT gateway
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'urn:sendBill'
          },
          httpsAgent,
          timeout: 45000 // 45 seconds timeout
        });
        
        const responseData = response.data;
        if (responseData.includes('<soap-env:Fault') || responseData.includes('<soap:Fault')) {
          const match = responseData.match(/<faultstring>(.*?)<\/faultstring>/) || responseData.match(/<soap-env:Fault.*?>.*?<faultstring>(.*?)<\/faultstring>/s);
          const faultMessage = match ? match[1] : 'Unknown SOAP Fault';
          throw new Error(`SUNAT SOAP Fault: ${faultMessage}`);
        }

        console.log(`SUNAT: Request successful using URL: ${connectUrl}`);
        return responseData;
      } catch (error: any) {
        lastError = error;
        console.warn(`SUNAT: Failed attempt on URL: ${connectUrl}. Error: ${error.message || error}`);
        // If it is a SOAP Fault, it means we reached SUNAT but the parameters/credentials were rejected (so do not retry as it is a semantic rejection)
        if (error.message && error.message.includes('SUNAT SOAP Fault')) {
          break;
        }
      }
    }

    // If all attempts failed
    if (lastError && lastError.response) {
      console.error('SUNAT Error Response:', lastError.response.data);
      throw new Error(`SUNAT Error (${lastError.response.status}): ${JSON.stringify(lastError.response.data)}`);
    }
    throw lastError;
  }
}
