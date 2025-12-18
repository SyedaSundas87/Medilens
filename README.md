# 🏥 Medilens – AI-Powered Hospital Automation Platform

This repository contains the backend automation workflows for **Medilens**, an AI-powered hospital operations and patient assistance platform.  

Medilens automates complaint handling, centralizes CRM and ERP data, analyzes medical documents, provides AI-driven patient support, and enables intelligent operational decision-making. These workflows are designed to be consumed by a frontend dashboard or application via secure webhooks.

---

## 📂 Repository Structure

| Directory/File | Description |
|----------------|------------|
| `workflows/`   | n8n workflow JSON files for all Medilens features |
| `frontend/`    | Frontend UI files (optional) |
| `README.md`    | Project documentation |
| `LICENSE.md`   | Project license |
| `.gitignore`   | Ignored files and folders |

---
## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 🚀 Features

Medilens is composed of multiple independent but connected automation services. Each service solves a specific hospital or patient-facing problem.

---

## Feature 1: Complaint Management

### Overview
Automates hospital complaint management from submission to resolution, providing real-time visibility for support and admin teams.

### Problem
Manual complaint tracking is disorganized and unreliable. Complaints get lost in emails, spreadsheets become outdated, and teams struggle to track ownership or resolution status. This leads to delayed responses, frustrated patients, and poor operational visibility.

### Solution
- Receives complaints through a web form  
- Stores and updates complaints in a central Google Sheet  
- Allows admins to assign staff members  
- Enables one-click resolution  
- Keeps the dashboard updated in real time  

### Workflow Steps

| Step | Action |
|------|--------|
| 1    | New complaint submission triggers webhook |
| 2    | Complaint details parsed into structured format |
| 3    | Complaint added as a new row in “Complaints” sheet |
| 4    | All complaints fetched for dashboard display |
| 5    | Assignee updated when assigned |
| 6    | Status updated to “Solved” |
| 7    | Confirmation sent to frontend |

### Tools Used

| Tool | Purpose |
|------|--------|
| n8n | Workflow automation |
| Webhook Nodes | Receive complaint data |
| Google Sheets Nodes | Read, add, update complaints |
| Code Nodes | Parse and format data |
| Respond to Webhook | Send confirmation to frontend |

### Setup / Integration
1. Import and activate workflow JSON  
2. Copy webhook URLs: `/complaint?query=submit` and `/management?query=assign/solve`  
3. Send POST requests from frontend for submission, assignment, and resolution  

### Credentials
- Google Sheets API (service account + JSON key)  
⚠️ Webhooks should never be exposed publicly.

### Estimated Monthly Cost
- Google Sheets API: $0  
- n8n Self-hosted: $0  
- n8n Cloud: $20+

---

## Feature 2: Command Center

### Overview
An AI-powered command center that centralizes hospital CRM and ERP operational data, analyzes risks, and generates actionable AI suggestions for admin review and approval—while keeping the dashboard and hospital overview updated in real time.

### Problem
Operational data such as patient risk, doctor workload, bed availability, and appointments is spread across multiple sheets and systems. This fragmentation results in reactive decisions, inefficiencies, staff burnout, and compromised patient care.

### Solution
- Aggregates data from multiple Google Sheets  
- Uses AI to analyze risks and operational gaps  
- Generates structured AI suggestions in a central sheet  
- Sends AI suggestions and live operational data to the command center  
- Enables instant approval or rejection with system-wide updates  

### Workflow Steps

| Step | Action |
|------|--------|
| 1    | Trigger via Smarter Alert Webhook |
| 2    | Retrieve data from 7 Google Sheets |
| 3    | Merge node consolidates all data |
| 4    | AI analysis using LangChain + Gemini |
| 5    | Code node parses and appends suggestions |
| 6    | Responds with suggestions and aggregated data |
| 7    | Admin Approval Webhook updates status and notes |

### Tools Used

| Tool | Purpose |
|------|--------|
| n8n | Workflow orchestration |
| Google Sheets (x7) | Data storage and retrieval |
| Webhook Nodes | Trigger analysis and approvals |
| Google Gemini Chat Model | Risk analysis and insights |
| LangChain AI Agent | Structured AI output |
| Merge & Code Nodes | Data consolidation and parsing |
| Respond to Webhook | Send results to dashboard |

### Setup / Integration
1. Import and activate workflow JSON  
2. Share 7 Google Sheets with service account  
3. Copy Smarter Alert and Admin Approval webhook URLs  
4. Trigger workflows via frontend or backend POST requests  

### Credentials
- Google Sheets API  
- Google Gemini API  
⚠️ Webhooks must be securely called from backend only.

### Estimated Monthly Cost
- Google Gemini API: $5–$20  
- Google Sheets API: $0  
- n8n Self-hosted: $0  
- n8n Cloud: $20+

---

## Feature 3: Lab Reports & Prescription Analyzer

### Overview
Converts complex medical reports and prescriptions into clear, easy-to-understand explanations for patients.

### Problem
Medical reports and prescriptions contain technical terms and numbers that patients struggle to understand, causing confusion and anxiety.

### Solution
- Reads lab reports and prescriptions  
- Explains tests and medicines in plain language  
- Highlights normal vs attention-needed values  
- Sends structured explanations to frontend  

### Workflow Steps

| Step | Action |
|------|--------|
| 1    | User uploads image → OCR extracts text |
| 2    | Text sent to n8n webhook |
| 3    | AI agent analyzes using medical prompt |
| 4    | Output formatted into summary and explanations |
| 5    | Response returned to frontend |

### Tools Used
- n8n  
- Google Gemini Chat Model  
- LangChain AI Agent  
- Webhook Nodes  
- Respond to Webhook  

### Estimated Monthly Cost
- Google Gemini API: $5–$15  
- n8n Cloud: $20+  
- OCR: Provider-dependent  

---

## Feature 4: RAG Agent with Memory & Complaint Handling

### Overview
A fact-grounded hospital AI chatbot that provides reliable assistance, maintains session memory, and escalates complaints to human support when necessary.

### Problem
Standard chatbots tend to hallucinate, forget previous conversations, and cannot escalate complaints. This creates gaps in patient support and operational oversight.

### Solution
- Answers queries from hospital knowledge base (PDFs, manuals)  
- Maintains full chat history for context  
- Detects complaints automatically  
- Escalates complaints to human support if needed  
- Logs complaints and sends email alerts to responsible teams  

### Workflow Steps

| Step | Action |
|------|--------|
| 1    | Upload PDFs → embeddings → store in Supabase Vector Store |
| 2    | User sends chat → webhook |
| 3    | RAG Agent responds using vector DB + session memory |
| 4    | Complaint detection triggers Google Sheets logging + Gmail alert |
| 5    | Notify human support if escalation is required |

### Tools Used

| Tool | Purpose |
|------|--------|
| n8n | Workflow orchestration |
| Google Gemini Chat Model | AI responses |
| Google Gemini Embeddings | Vector creation for RAG agent |
| Supabase Vector Store | Knowledge base storage |
| Postgres | Session memory storage |
| Google Drive | PDF source |
| Google Sheets | Complaint logging |
| Gmail | Complaint alert emails |

### Setup / Integration
1. Upload hospital PDFs → run ingestion workflow → populate Supabase vector store  
2. Configure frontend webhook for chat input → send `chatInput` + optional `sessionId`  
3. Display chatbot responses on frontend  
4. Ensure complaint detection nodes are connected to Sheets + Gmail nodes for alerts  

### Credentials
- Google Gemini API (chat + embeddings)  
- Supabase API + DB URL  
- Postgres DB credentials  
- Google Drive OAuth  
- Google Sheets OAuth  
- Gmail OAuth  
⚠️ Keep all credentials backend-only. Webhooks should never be exposed publicly.

### Estimated Monthly Cost
- Google Gemini API: $10–$20  
- Supabase: free–$25 (depends on usage)  
- Postgres DB: self-hosted/free depending on setup  
- n8n Cloud: $20+  

---

## Feature 5: Symptom Checker & AI Triage

### Overview
AI-powered system for analyzing patient symptoms, selecting the appropriate specialist, and detecting emergencies.

### Problem
Patients often do not know which specialist to consult or the severity of their symptoms. Hospitals require faster triage to ensure timely care.

### Solution
- Accepts text, voice, or image-based symptom input  
- Automatically selects the correct specialist  
- Provides structured diagnosis, severity level, and care guidance  
- Detects emergencies and sends alert emails  

### Workflow Steps

| Step | Action |
|------|--------|
| 1    | Frontend sends symptom text/image/voice → webhook |
| 2    | Configure patient email, doctor email, booking URL |
| 3    | AI Specialist Selector determines the correct specialist |
| 4    | Route data to the corresponding specialist agent |
| 5    | Specialist agent outputs structured JSON: diagnosis, severity, remedies, first aid, lifestyle |
| 6    | JSON cleanup & normalization |
| 7    | Emergency detection → send email alerts and booking links |

### Tools Used
- n8n Cloud  
- Google Gemini  
- LangChain Agents  
- Webhook API  
- Gmail OAuth  
- JavaScript Node  
- Memory Buffer  

### Setup / Integration
1. Deploy n8n instance and import workflow JSON  
2. Connect frontend → webhook  
3. Add Google Gemini API key  
4. Configure Gmail OAuth with patient/doctor emails  
5. Test mild and emergency cases before going live  

### Estimated Monthly Cost
- AI calls: ~$0.001–$0.003 per user  
- n8n Cloud: $20–$50  
- Gmail: free  
*Example: 1,000 users/month → ~$3–$5 AI cost*

---

## Feature 6: Webcalling – AI Voice Appointment System

### Overview
Automated AI voice agent for handling appointment calls, booking, cancellations, and confirmations.

### Problem
Manual appointment calls result in missed calls, double bookings, staff overload, and poor patient experience.

### Solution
- Answers calls using Retell AI  
- Transcribes call and extracts patient, doctor, date, and intent using Gemini  
- Checks doctor availability and updates Google Calendar  
- Updates Google Sheets and sends email confirmations  

### Workflow Steps

| Step | Action |
|------|--------|
| 1    | Patient calls → Retell AI transcribes speech |
| 2    | Transcript sent to n8n webhook |
| 3    | Gemini extracts patient, doctor, date, and intent |
| 4    | Check doctor availability → update Google Calendar |
| 5    | Update Google Sheets + send email confirmation |
| 6    | Success response returned to Retell AI |

### Tools Used

| Tool | Purpose |
|------|--------|
| Retell AI | Voice calling and speech-to-text |
| n8n | Workflow orchestration |
| Google Gemini | Intent extraction |
| Google Calendar API | Appointment scheduling |
| Google Sheets API | Patient records |
| Gmail API | Confirmation emails |

### Setup / Integration
1. Create Retell AI agent → connect to n8n webhook  
2. Import workflow JSON → n8n  
3. Add Gemini API key → connect nodes  
4. Connect Calendar, Sheets, Gmail via OAuth  
5. Test call → verify booking, sheet entry, email  

### Estimated Monthly Cost
- Retell AI: $0.10–$0.30/minute (e.g., 1,000 calls × 2 min ≈ $200–$600)  
- Google Gemini: $5–$20  
- n8n Self-hosted: $5–$10 / Cloud: $20+  
- Google APIs: mostly free  

---

## 🔗 Summary
Medilens combines multiple AI-powered workflows to provide:

- **Operational Automation:** Centralized CRM/ERP data, AI-generated suggestions, real-time dashboards  
- **Patient Support:** Symptom triage, lab & prescription explanations, AI chat with memory  
- **Complaint Management:** Streamlined submission, assignment, and resolution  
- **Appointment Automation:** Voice AI booking system  
- **Emergency Handling:** Real-time alerts for critical cases  

Together, Medilens reduces manual work, improves response times, enhances patient experience, and enables data-driven decision-making in hospitals.

---

## 📄 License
This project is licensed under the MIT License.  
See LICENSE.md for details




