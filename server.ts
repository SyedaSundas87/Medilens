import express from "express";
import { createServer as createViteServer } from "vite";
import Retell from 'retell-sdk';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "8080", 10);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Route for Voice Call
  app.post("/api/voice/call", async (req, res) => {
    try {
      const { appointment_id } = req.body;
      
      if (!appointment_id) {
        return res.status(400).json({ error: "appointment_id is required" });
      }

      const client = new Retell({
        apiKey: process.env.RETELL_API_KEY || '',
      });

      const webCallResponse = await client.call.createWebCall({
        agent_id: 'agent_ecd2267dc481a2f59273c8d939',
        retell_llm_dynamic_variables: {
          appointment_id: appointment_id
        }
      });

      res.json(webCallResponse);
    } catch (error: any) {
      console.error("Voice call error:", error);
      res.status(500).json({ error: "Failed to initiate voice call", details: error.message });
    }
  });

  // API Proxy for RAG
  app.post("/api/rag", async (req, res) => {
    try {
      const query = new URLSearchParams(req.query as any).toString();
      const TARGET_URL = `https://n8nsundas.duckdns.org/webhook/RAG${query ? '?' + query : ''}`;
      const API_KEY = process.env.RAG_API_KEY || '';
      
      console.log(`[RAG Webhook] Hitting URL: ${TARGET_URL}`);
      console.log(`[RAG Webhook] Using API Key: ${API_KEY.substring(0, 5)}...`);

      const response = await fetch(TARGET_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json',
          'x-api-key': API_KEY,
          'rag_api_key': API_KEY
        },
        body: JSON.stringify(req.body)
      });
      const data = await response.text();
      console.log(`[RAG Webhook] Response Status: ${response.status}`);
      res.status(response.status).send(data);
    } catch (error: any) {
      console.error("[RAG Webhook] Error:", error);
      res.status(500).json({ error: "Failed to connect to n8n", details: error.message });
    }
  });

  // API Proxy for Triage
  app.post("/api/hospital", async (req, res) => {
    try {
      const query = new URLSearchParams(req.query as any).toString();
      const TARGET_URL = `https://n8nsundas.duckdns.org/webhook/hospital${query ? '?' + query : ''}`;
      const API_KEY = process.env.HOSPITAL_API_KEY || '';
      
      console.log(`[Hospital Webhook] Hitting URL: ${TARGET_URL}`);
      console.log(`[Hospital Webhook] Using API Key: ${API_KEY.substring(0, 5)}...`);

      const response = await fetch(TARGET_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(req.body)
      });
      const data = await response.text();
      console.log(`[Hospital Webhook] Response Status: ${response.status}`);
      res.status(response.status).send(data);
    } catch (error: any) {
      console.error("[Hospital Webhook] Error:", error);
      res.status(500).json({ error: "Failed to connect to n8n", details: error.message });
    }
  });

  // API Proxy for Lab Reports
  app.post("/api/labreports", async (req, res) => {
    try {
      const query = new URLSearchParams(req.query as any).toString();
      // PRODUCTION WEBHOOK URL
      const TARGET_URL = `https://n8nsundas.duckdns.org/webhook/labreports${query ? '?' + query : ''}`;
      const API_KEY = process.env.REPORTS_API_KEY || '';
      
      console.log(`Proxying Lab Report to: ${TARGET_URL}`);
      console.log(`[Lab Reports Webhook] Using API Key: ${API_KEY.substring(0, 5)}...`);
      console.log("Payload Size:", JSON.stringify(req.body).length);

      const response = await fetch(TARGET_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json',
          'x-api-key': API_KEY,
          'reports_api_key': API_KEY,
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(req.body)
      });
      
      console.log(`N8n Response Status: ${response.status}`);
      const data = await response.text();
      console.log("N8n Response Data:", data);
      
      if (!response.ok) {
        console.error(`N8n Server Error (${response.status}):`, data);
      }
      
      res.status(response.status).send(data);
    } catch (error: any) {
      console.error("Lab Report Proxy Error:", error);
      res.status(500).json({ error: "Failed to connect to n8n", details: error.message });
    }
  });

  // API Proxy for Booking
  app.post("/api/medical-booking", async (req, res) => {
    try {
      const query = new URLSearchParams(req.query as any).toString();
      const TARGET_URL = `https://n8nsundas.duckdns.org/webhook-test/medical-booking${query ? '?' + query : ''}`;
      const response = await fetch(TARGET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(req.body)
      });
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to connect to n8n", details: error.message });
    }
  });

  // API Proxy for Smarter Alert (Dashboard Data)
  app.post("/api/admin/dashboard/data", async (req, res) => {
    try {
      const TARGET_URL = "https://n8ndigitalstudio.duckdns.org/webhook/v1/admin/dashboard/data";
      console.log(`Proxying request to: ${TARGET_URL} with method POST`);
      console.log("Request body:", JSON.stringify(req.body));

      const API_KEY = process.env.COMPLAINTS_API_KEY || "";

      const response = await fetch(TARGET_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify(req.body)
      });
      
      console.log(`Webhook response status: ${response.status}`);
      const data = await response.text();
      console.log("Webhook response data length:", data.length);
      
      res.status(response.status).send(data);
    } catch (error: any) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to connect to n8n", details: error.message });
    }
  });

  // API Proxy for Complaints
  app.post("/api/admin/complaints", async (req, res) => {
    try {
      const query = new URLSearchParams(req.query as any).toString();
      const TARGET_URL = `https://n8ndigitalstudio.duckdns.org/webhook/complaints${query ? '?' + query : ''}`;
      
      const API_KEY = process.env.COMPLAINTS_API_KEY || "";
      
      const response = await fetch(TARGET_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify(req.body)
      });
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to connect to n8n", details: error.message });
    }
  });

  // API Proxy for Manage Complaints
  app.post("/api/admin/manage-complaints", async (req, res) => {
    try {
      const query = new URLSearchParams(req.query as any).toString();
      const TARGET_URL = `https://feiruun.app.n8n.cloud/webhook/manage-complaints${query ? '?' + query : ''}`;
      const response = await fetch(TARGET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(req.body)
      });
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to connect to n8n", details: error.message });
    }
  });

  // API Proxy for New Complaint Submission (Secured)
  app.post("/api/complaints/v1/submit", async (req, res) => {
    try {
      const TARGET_URL = "https://n8ndigitalstudio.duckdns.org/webhook/v1/complaints";
      // API Key should ideally be in process.env, fallback provided for preview context
      const API_KEY = process.env.COMPLAINTS_API_KEY || "";
      
      const response = await fetch(TARGET_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify(req.body)
      });
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (error: any) {
      console.error("Complaint submission error:", error);
      res.status(500).json({ error: "Failed to submit complaint", details: error.message });
    }
  });

  // API Proxy for AI Suggestion
  app.post("/api/admin/ai/suggestion", async (req, res) => {
    try {
      const TARGET_URL = "https://n8ndigitalstudio.duckdns.org/webhook/v1/admin/ai/suggestion";
      console.log(`Proxying request to: ${TARGET_URL} with method POST`);
      
      const API_KEY = process.env.COMPLAINTS_API_KEY || "";
      
      const response = await fetch(TARGET_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify(req.body)
      });
      
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (error: any) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to connect to n8n", details: error.message });
    }
  });

  // API Proxy for Processing AI Suggestion (Approve/Reject)
  app.post("/api/admin/ai/process-suggestion", async (req, res) => {
    try {
      const query = new URLSearchParams(req.query as any).toString();
      const TARGET_URL = `https://n8ndigitalstudio.duckdns.org/webhook/hospital/process-suggestion${query ? '?' + query : ''}`;
      console.log(`Proxying request to: ${TARGET_URL} with method POST`);
      
      // API Key for secure access
      const API_KEY = process.env.COMPLAINTS_API_KEY || "";

      const response = await fetch(TARGET_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify(req.body)
      });
      
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (error: any) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to connect to n8n", details: error.message });
    }
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.use((req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
