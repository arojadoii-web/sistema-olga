import express from "express";
import path from "path";
import multer from "multer";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";

import { SunatService } from "./services/sunat.js";
import { invoiceTemplate } from "./services/templates.js";

dotenv.config();

const app = express();
const PORT = 3000;

  const uploadDir = path.join(process.cwd(), "certs");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, "certificate.p12");
    },
  });

  const upload = multer({ storage });

  app.use(express.json());

  // API Routes
  app.get("/api/sunat/status", (req, res) => {
    const certExists = fs.existsSync(path.join(uploadDir, "certificate.p12")) || !!process.env.SUNAT_CERT_BASE64;
    res.json({
      status: "ok",
      environment: process.env.SUNAT_ENVIRONMENT || "beta",
      ruc: process.env.SUNAT_RUC ? "Configured" : "Missing",
      certificate: certExists ? "Uploaded" : "Missing",
    });
  });

  app.post("/api/sunat/upload-cert", upload.single("certificate"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    res.json({ message: "Certificate uploaded successfully" });
  });

  app.post("/api/sunat/test-bill", async (req, res) => {
    console.log("Starting test-bill request...");
    const sunat = new SunatService();
    try {
      const data = {
        id: "F001-" + Math.floor(Math.random() * 1000000).toString().padStart(8, '0'),
        date: new Date().toISOString().split('T')[0],
        typeCode: "01", // Factura
        currency: "PEN",
        ruc: process.env.SUNAT_RUC,
        companyName: process.env.SUNAT_COMPANY_NAME || "SISTEMA OLGA",
        companyAddress: process.env.SUNAT_COMPANY_ADDRESS || "CHINCHA - ICA",
        clientDocType: "6", // RUC
        clientDocNumber: "20123456789", // RUC PRUEBA DE CLIENTE VALIDO EN SUNAT (different from emisor)
        clientName: "CLIENTE PRUEBA",
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

      console.log("Generating XML for:", data.id);
      const xml = invoiceTemplate(data);
      console.log("XML length:", xml.length);
      const fileName = `${data.ruc}-${data.typeCode}-${data.id}`;
      console.log("Sending to SUNAT with fileName:", fileName);
      const result = await sunat.sendInvoice(xml, fileName);
      console.log("SUNAT Response received");
      
      res.json({ message: "Invoice sent", result });
    } catch (error: any) {
      console.error("Error in test-bill:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sunat/send-sale", async (req, res) => {
    const sale = req.body;
    const sunat = new SunatService();
    try {
      if (!process.env.SUNAT_RUC) {
        throw new Error("RUC no configurado en el servidor");
      }

      // Convert sale data to template format
      const data = {
        id: sale.documentNumber,
        date: sale.date,
        typeCode: sale.documentType === 'Factura' ? '01' : '03',
        currency: 'PEN', // Fixed for now as per template
        ruc: process.env.SUNAT_RUC,
        companyName: process.env.SUNAT_COMPANY_NAME || "SISTEMA OLGA",
        companyAddress: process.env.SUNAT_COMPANY_ADDRESS || "CHINCHA - ICA",
        clientDocType: sale.clientDocType === 'RUC' ? '6' : (sale.clientDocType === 'DNI' ? '1' : '1'),
        clientDocNumber: sale.clientDocNumber,
        clientName: sale.clientName,
        taxableAmount: (sale.total / 1.18).toFixed(2),
        taxAmount: (sale.total - (sale.total / 1.18)).toFixed(2),
        totalAmount: sale.total.toFixed(2),
        items: sale.items.map((item: any) => ({
          description: item.productName,
          quantity: item.quantity,
          price: (item.unitPrice / 1.18).toFixed(2),
          priceWithTax: item.unitPrice.toFixed(2),
          tax: (item.total - (item.total / 1.18)).toFixed(2),
          total: (item.total / 1.18).toFixed(2)
        }))
      };

      const xml = invoiceTemplate(data);
      const fileName = `${data.ruc}-${data.typeCode}-${data.id}`;
      const result = await sunat.sendInvoice(xml, fileName);
      
      res.json({ message: "Comprobante enviado exitosamente", result });
    } catch (error: any) {
      console.error("Error sending sale to SUNAT:", error);
      res.status(500).json({ error: error.message });
    }
  });

// Export the Express app for Vercel Serverless Functions
export default app;

// Only listen if not in Vercel Serverless environment
if (!process.env.VERCEL) {
  async function startLocalServer() {
    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  startLocalServer().catch(err => {
    console.error("Critical server failure:", err);
  });
}
