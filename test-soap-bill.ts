import forge from 'node-forge';
import { SignedXml } from 'xml-crypto';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import axios from 'axios';
import { invoiceTemplate } from './services/templates.js';

dotenv.config();

const data = {
    id: "F001-00000002", // "F001-00000002" for Factura (01) starting with F is correct for UBL 2.1
    date: "2025-02-19", // Real world today's calendar date to avoid SUNAT rejecting future dates
    typeCode: "01",
    currency: "PEN",
    ruc: "10410520376", // Realistic issuer RUC matching the cert
    companyName: "ROJAS DOMINGUEZ OLGA RICARDA", // Matches the cert name
    companyAddress: "HUANUCO - HUANUCO",
    clientDocType: "6",
    clientDocNumber: "20123456789",
    clientName: "CLIENTO PRUEBA",
    taxableAmount: "100.00",
    taxAmount: "18.00",
    totalAmount: "118.00",
    items: [
        {
            description: "PRODUCTO PRUEBA",
            quantity: 1,
            price: "100.00",
            priceWithTax: "118.00",
            tax: "18.00",
            total: "100.00"
        }
    ]
};

const xmlString = invoiceTemplate(data);

async function test() {
    const certPath = path.join(process.cwd(), 'certs', 'certificate.p12');
    if (!fs.existsSync(certPath)) {
        console.log("Certificate not found");
        return;
    }
    const certPass = process.env.SUNAT_CERT_PASSWORD || '123456';
    const p12Der = fs.readFileSync(certPath, 'binary');
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certPass);
    
    const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag]!;
    const key = keyBag[0]!.key!;

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag]!;
    const cert = certBag[0]!.cert!;

    console.log("Certificate subject attributes:");
    for (const attr of cert.subject.attributes) {
        console.log(`  ${attr.name} (${attr.shortName}): ${attr.value}`);
    }

    const privateKey = forge.pki.privateKeyToPem(key);
    const certificate = forge.pki.certificateToPem(cert);

    const pureCert = certificate
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\n|\r/g, '');

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

    sig.signatureAlgorithm = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";

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
    
    let signedXml = sig.getSignedXml();
    if (!signedXml.startsWith('<?xml')) {
      signedXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + signedXml;
    }
    fs.writeFileSync('signed_test.xml', signedXml, 'utf8');
    console.log("Saved signed XML to signed_test.xml successfully.");

    const fileName = `${data.ruc}-${data.typeCode}-${data.id}`;

    // Zip
    const zip = new JSZip();
    zip.file(`${fileName}.xml`, signedXml);
    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });

    // Try MODDATOS/moddatos
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.sunat.gob.pe" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
   <soapenv:Header>
      <wsse:Security>
         <wsse:UsernameToken>
            <wsse:Username>${data.ruc}MODDATOS</wsse:Username>
            <wsse:Password>moddatos</wsse:Password>
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

    const url = 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService';

    // Set variable matches for EXACT logging statement requested by the user
    const soapUrl = url;
    const documentType = data.typeCode;
    const xml = signedXml;
    const zipFileName = `${fileName}.zip`;

    console.log("================= BEFORE SOAP POST =================");
    console.log("SOAP URL:", soapUrl);
    console.log("DOCUMENT TYPE:", documentType);
    console.log("UBL VERSION:", xml.match(/<cbc:UBLVersionID>(.*?)<\/cbc:UBLVersionID>/)?.[1]);
    console.log("CUSTOMIZATION:", xml.match(/<cbc:CustomizationID>(.*?)<\/cbc:CustomizationID>/)?.[1]);
    console.log("ROOT NODE:", xml.match(/<([A-Za-z:]+)/)?.[1]);
    console.log("FILE NAME:", zipFileName);

    // Dynamic verification that the root node is correct for the document type
    const rootNodeMatch = xml.match(/<([A-Za-z:]+)/)?.[1] || '';
    const rootNodeLocalName = rootNodeMatch.includes(':') ? rootNodeMatch.split(':').pop() : rootNodeMatch;
    console.log("\n--- UBL 2.1 COMPLIANCE VERIFICATION ---");
    console.log("Verifying root node against document type...");
    if (documentType === "01") {
      if (rootNodeLocalName === "Invoice") {
        console.log("✓ VERIFIED: Factura ('01') has root node: <Invoice>");
      } else {
        console.warn("✗ WARNING: Factura ('01') root node mismatch! Expected <Invoice>, got: <" + rootNodeMatch + ">");
      }
    } else if (documentType === "03") {
      if (rootNodeLocalName === "Invoice") {
        console.log("✓ VERIFIED: Boleta ('03') has root node: <Invoice>");
      } else {
        console.warn("✗ WARNING: Boleta ('03') root node mismatch! Expected <Invoice>, got: <" + rootNodeMatch + ">");
      }
    } else if (documentType === "07" || documentType === "07") {
      if (rootNodeLocalName === "CreditNote") {
        console.log("✓ VERIFIED: Nota de Credito has root node: <CreditNote>");
      } else {
        console.warn("✗ WARNING: Nota de Credito root node mismatch! Expected <CreditNote>, got: <" + rootNodeMatch + ">");
      }
    } else if (documentType === "08" || documentType === "08") {
      if (rootNodeLocalName === "DebitNote") {
        console.log("✓ VERIFIED: Nota de Debito has root node: <DebitNote>");
      } else {
        console.warn("✗ WARNING: Nota de Debito root node mismatch! Expected <DebitNote>, got: <" + rootNodeMatch + ">");
      }
    }

    // Verify If document is UBL 2.1
    const ublVer = xml.match(/<cbc:UBLVersionID>(.*?)<\/cbc:UBLVersionID>/)?.[1];
    const custId = xml.match(/<cbc:CustomizationID>(.*?)<\/cbc:CustomizationID>/)?.[1];
    if (ublVer === "2.1") {
      console.log("✓ VERIFIED: Document contains UBLVersionID 2.1");
    } else {
      console.warn("✗ WARNING: Document is NOT UBL 2.1! got UBLVersionID:", ublVer);
    }
    if (custId === "2.0") {
      console.log("✓ VERIFIED: Document contains CustomizationID 2.0");
    } else {
      console.warn("✗ WARNING: CustomizationID mismatch! got:", custId);
    }
    console.log("----------------------------------------");

    console.log("\n================= EXACT SOAP XML ZIP SENT =================");
    console.log(soapEnvelope);
    console.log("=========================================================\n");

    console.log("Sending test soap invoice to Beta with MODDATOS...");
    try {
      const response = await axios.post(url, soapEnvelope, {
        headers: { 
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'urn:sendBill'
        }
      });
      console.log("Success! Status:", response.status);
      console.log("Response:", response.data);
    } catch (error: any) {
      if (error.response) {
        console.error("FAIL:", error.response.status);
        console.error(error.response.data);
      } else {
        console.error("FAIL:", error.message);
      }
    }
}

test().catch(console.error);
