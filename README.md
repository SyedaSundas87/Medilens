# Medilens Hospital AI Automation System

A comprehensive, production-ready hospital operations automation platform built on **n8n**, powered by **Google Gemini AI**, **Retell AI**, and **Supabase/PostgreSQL**. This system automates the full spectrum of hospital administrative workflows — from voice-based appointment booking to intelligent complaint handling, AI-powered symptom triage, lab report analysis, and a real-time admin command center — reducing manual overhead, improving patient experience, and enabling data-driven hospital management.

---

## Table of Contents

- [Introduction](#introduction)
- [Demo](#demo)
- [UI Preview](#ui-preview)
- [Workflow Screenshots](#workflow-screenshots)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [System Architecture](#system-architecture)
- [Workflow Modules](#workflow-modules)
  - [1. Hospital Admin Command Center](#1-hospital-admin-command-center)
  - [2. Department-Based Complaint Management](#2-department-based-complaint-management)
  - [3. Lab Report & Prescription Analyzer](#3-lab-report--prescription-analyzer)
  - [4. Voice Appointment Booking System](#4-voice-appointment-booking-system)
  - [5. Symptom Checker & Medical Triage](#5-symptom-checker--medical-triage)
  - [6. RAG Knowledge Base Agent (Parts 1 & 2)](#6-rag-knowledge-base-agent-parts-1--2)
  - [7. Retell AI Voice Agent](#7-retell-ai-voice-agent)
- [Tech Stack](#tech-stack)
- [Security & Compliance](#security--compliance)
- [Setup Guide](#setup-guide)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Introduction

Medilens is a modular, AI-first hospital automation system that replaces manual, error-prone administrative processes with intelligent, always-on workflows. Each module is a self-contained n8n workflow that can be deployed independently or together as a unified platform. The system connects hospital staff, patients, and administrators through voice, chat, email, and a real-time dashboard — all orchestrated without writing a single line of backend server code.

---
## Demo 
## Voice Agent Demo:

[![Voice Agent Demo](https://img.youtube.com/vi/migZQqh0CoA/0.jpg)](https://youtu.be/migZQqh0CoA)

## Full Medilens Demo:

[![Medilens Full Demo](https://img.youtube.com/vi/L5w1mAUsjp0/0.jpg)](https://youtu.be/L5w1mAUsjp0)

## UI Preview

A complete, production-ready frontend built in Google AI Studio connects to every backend module. Here's what the system looks like in action:

| Hospital Admin Command Center | Complaint Management |
|---|---|
| ![Command Center UI](https://github.com/MaryumAkram16/medilens/blob/main/medilens-command-center.png?raw=true) | ![Complaints UI](https://github.com/MaryumAkram16/medilens/blob/main/medilens-complaints.png?raw=true) |

| Lab Report & Prescription Analyzer | RAG Knowledge Base Chat |
|---|---|
| ![Lab Analyzer UI](https://github.com/MaryumAkram16/medilens/blob/main/medilens-lab-analyzer.jpeg?raw=true) | ![RAG Chat UI](https://github.com/MaryumAkram16/medilens/blob/main/medilens-rag-ai.jpeg?raw=true) |

| Symptom Checker & Triage | Voice Appointment Agent |
|---|---|
| ![Symptom Checker UI](https://github.com/MaryumAkram16/medilens/blob/main/medilens-symptom-checker.png?raw=true) | ![Voice Agent UI](https://github.com/MaryumAkram16/medilens/blob/main/medilens-voice-agent.PNG?raw=true) |

---

## Workflow Screenshots

| Command Center | Complaint Management |
|---|---|
| ![Command Center Workflow](https://github.com/MaryumAkram16/medilens/blob/main/command%20center.PNG?raw=true) | ![Complaint Management Workflow](https://github.com/MaryumAkram16/medilens/blob/main/complaint-management.PNG?raw=true) |

| Lab Report Analyzer | Voice Appointment Booking |
|---|---|
| ![Lab Analyzer Workflow](https://github.com/MaryumAkram16/medilens/blob/main/lab%20analyzer.PNG?raw=true) | ![Voice Booking Workflow](https://github.com/MaryumAkram16/medilens/blob/main/voice-booking.PNG?raw=true) |

| Hospital Triage | RAG Knowledge Base |
|---|---|
| ![Hospital Triage Workflow](https://github.com/MaryumAkram16/medilens/blob/main/Hospital%20Triage.PNG?raw=true) | ![RAG Workflow](https://github.com/MaryumAkram16/medilens/blob/main/RAG.PNG?raw=true) |

| Retell Voice Agent | |
|---|---|
| ![Retell Voice Agent Workflow](https://github.com/MaryumAkram16/medilens/blob/main/retell%20voice%20agent.PNG?raw=true) | |

---

## Problem Statement

Modern hospitals face critical operational challenges:

- **Appointment Overload**: Receptionists spend hours manually booking, cancelling, and rescheduling appointments, leading to errors and long patient wait times.
- **Reactive Complaint Handling**: Patient complaints are logged inconsistently, routed slowly to departments, and rarely tracked to resolution — damaging trust and compliance.
- **Inaccessible Medical Records**: Patients receive lab reports or prescriptions full of medical jargon they cannot understand, with no 24/7 support to explain results.
- **Delayed Risk Response**: High-risk patients and overloaded doctors are identified too late, with no proactive AI-driven intervention or bed management.
- **Siloed Data**: Patient records, appointments, beds, staff schedules, and complaint logs exist in isolated systems with no unified view for administrators.
- **Knowledge Gaps**: Hospital staff and patients cannot quickly access policy documents, service information, or department details without calling in.

---

## Solution

The Medilens Hospital AI Automation System addresses each of these challenges through six purpose-built workflow modules:

- **Automates appointment booking, cancellation, and rescheduling** via a voice AI receptionist available 24/7.
- **Intelligently routes and escalates complaints** with AI sentiment analysis, department mapping, and Slack alerting for high-priority issues.
- **Translates complex medical documents** into plain-language explanations, delivered instantly by email.
- **Provides real-time hospital dashboard data** including bed occupancy, staff status, risk patients, and AI-generated operational suggestions.
- **Triages patient symptoms** using a specialist-routing AI that identifies the right doctor and flags emergencies with automated alerts.
- **Answers hospital knowledge-base questions** through a RAG-powered chatbot that pulls accurate information from uploaded hospital documents — no hallucination.

---

## System Architecture

The platform is built on an event-driven, webhook-based architecture:

```
Patient / Staff Input
        │
        ▼
   Voice Agent (Retell AI)  ──────────────────────────────┐
   Web Webhook / Chat UI                                   │
        │                                                  │
        ▼                                                  ▼
   n8n Workflow Orchestration ◄──── Google Gemini AI (LLM)
        │                                  │
        ├── Supabase / PostgreSQL           ├── Embeddings (RAG)
        ├── Gmail (Notifications)          └── Structured Output Parsing
        ├── Slack (Alerts)
        └── Google Drive / Pinecone (RAG Knowledge Base)
```

**Data Flow:**
1. Input arrives via voice call, HTTP webhook, or chat widget
2. n8n validates, authenticates, and routes the request
3. AI agents (Gemini) analyze intent and generate structured responses
4. Supabase/Postgres stores and retrieves all records
5. Email/Slack notifications are dispatched for confirmations and alerts
6. Responses are returned to patients, staff, or admin dashboards in real time

---

## Workflow Modules

### 1. Hospital Admin Command Center

**File:** `command_center.json`

![Command Center Workflow](https://github.com/MaryumAkram16/medilens/blob/main/command%20center.PNG?raw=true)


The Command Center is the operational brain of the hospital. It consists of three interconnected sub-workflows that together provide administrators with a unified real-time view of hospital operations and AI-powered suggestions.

#### Sub-Workflow A: AI Suggestion Generator

**Trigger:** `POST /v1/admin/ai/suggestion`

Fetches live data across all hospital tables (doctors, nurses, patients, beds, appointments, risk patients), formats operational statistics, and passes them to a Google Gemini AI agent. The agent generates structured suggestions for:

- Monitoring and escalating high-risk patients
- Reassigning overloaded doctors
- Optimizing bed assignments
- Resolving appointment conflicts

All suggestions are stored in the `ai_suggestions` table with a `pending` status, unique IDs, and ISO-formatted timestamps.

**Key Nodes:**
- `Fetch All Hospital Data (Supabase)` — Runs a single CTE query across 6 tables
- `Format Dashboard Data` — Computes occupancy rates, status counts, and department groupings
- `AI Operations Agent` (Gemini) — Generates actionable suggestions in strict JSON format
- `Structured Output Parser` — Validates and normalizes AI output
- `Store Suggestions (Supabase)` — Persists each suggestion as an individual record

#### Sub-Workflow B: Dashboard Data API

**Trigger:** `POST /v1/admin/dashboard/data`

Aggregates all hospital data plus previously generated AI suggestions and returns a unified JSON payload to the frontend dashboard. Includes summary statistics (total/on-duty counts, occupancy rates, risk levels) and raw data arrays for all entities.

**Key Nodes:**
- `Query Hospital Data` — Fetches doctors, nurses, patients, beds, appointments, risk patients, and AI suggestions in one query
- `Calculate Dashboard Stats` — Computes frontend-ready metrics
- `Fetch AI Suggestions` + `Aggregate AI Suggestions` — Fetches and formats suggestions separately
- `Combine Data Streams` + `Merge AI Suggestions` — Merges all data streams into a single response object

#### Sub-Workflow C: Process Suggestion (Approve / Reject)

**Trigger:** `POST /hospital/process-suggestion`

Handles admin approval or rejection of AI suggestions with full idempotency protection and cascading updates to the relevant hospital tables.

**Security:** API key validation via `x-api-key` header (key: `hoAsB5yO7F90KXhQ`)

**Flow:**
1. Validates API key → returns 401 if invalid
2. Checks current suggestion status → returns early if already processed
3. Routes to Approve or Reject branch via a Switch node
4. Updates `ai_suggestions` table with the new status
5. Determines the correct primary key for the related table (patients, doctors, beds, etc.)
6. Updates the `ai_suggestion` field on the corresponding entity record
7. Returns a success or error response

---

### 2. Department-Based Complaint Management

**File:** `Complaint_Management.json`

![Complaint Management Workflow](https://github.com/MaryumAkram16/medilens/blob/main/complaint-management.PNG?raw=true)


A full-featured complaint intake, analysis, and resolution system with AI sentiment detection, department routing, audit logging, and Slack alerting for high-priority cases.

#### Sub-Workflow A: Submit Complaint

**Trigger:** `POST /v1/complaints`

Handles end-to-end complaint submission with multiple layers of protection and enrichment.

**Security & Validation Pipeline:**
- **Rate Limiting** — In-memory IP-based limiter (max 10 requests/minute) → returns 429
- **API Key Validation** — Checks `x-api-key` header → returns 401 if missing/invalid
- **Field Validation** — Ensures `name`, `email`, `phone`, `details`, `type`, `priority` are all present → returns 400
- **Duplicate Detection** — Queries database for existing `complaint_code` → returns 409 if found

**AI Processing:**
- Passes complaint text to a **Google Gemini agent** with a structured output parser
- Determines `sentiment` (Positive / Neutral / Negative) and a specific `suggested_action`
- Looks up the responsible department from `complaint_services` table by complaint type

**Storage & Notifications:**
- Saves enriched complaint to `complaints` table including AI outputs, department assignment, and timestamps
- Records an entry in `audit_logs`
- Sends a **confirmation email** to the patient via Gmail with their complaint code
- If priority is `High`, fires a **Slack alert** to the `#all-complaint-management` channel

#### Sub-Workflow B: Complaints Summary API

**Trigger:** `POST /complaints`

Fetches all complaints, aggregates them, and computes a structured summary:
- Total, Pending, Resolved counts
- Priority breakdown (Low / Medium / High)
- Grouping by category and department ID
- Raw complaint data array and record count

Returns JSON suitable for dashboard charts and admin reporting.

---

### 3. Lab Report & Prescription Analyzer

**File:** `lab_report_analyzer.json`

![Lab Report Analyzer Workflow](https://github.com/MaryumAkram16/medilens/blob/main/lab%20analyzer.PNG?raw=true)


A production-grade medical document interpretation service. Patients upload extracted text from lab results, prescriptions, imaging reports, or clinical notes and receive a detailed, plain-language explanation — delivered by email.

**Trigger:** `POST /labreports`

#### Security Pipeline:
- Records request start time for latency tracking
- Validates `x-api-key` header against environment variable → returns 401 if invalid
- Validates `extracted_data` (non-empty, 10–50,000 characters) and `sessionId` (alphanumeric, 4–64 chars) → returns 400 if invalid
- Hashes the `sessionId` for PHI-safe logging (no raw session IDs stored)

#### AI Analysis:
- Routes to a **Google Gemini AI agent** with a detailed medical analysis system prompt
- Analyzes the document for test values, reference ranges, medications, imaging findings, and doctor notes
- Produces a structured markdown report with sections for: Report Overview, Detailed Analysis (with Normal/Abnormal status icons), Points Requiring Attention, Medications Summary, Unclear Parts, and a mandatory medical disclaimer
- **Session memory** (5-message window) allows multi-turn follow-up questions within the same session

#### Output & Logging:
- Normalizes AI output (strips markdown fences, handles Gemini vs Claude response formats)
- Logs request metadata (session hash, latency, report/response length, model used) to `analysis_logs` in Supabase — no raw PHI stored
- Sends the full analysis report to the **patient's email** via Gmail
- Returns a structured JSON response with the analysis, request ID, model used, and latency

---

### 4. Voice Appointment Booking System

**File:** `Medilens_Voice_Appointment_Booking.json`

![Voice Appointment Booking Workflow](https://github.com/MaryumAkram16/medilens/blob/main/voice-booking.PNG?raw=true)


A complete voice-AI backend powering a 24/7 automated medical receptionist. Built to integrate with **Retell AI**, all endpoints verify the `x-retell-signature` header before processing. Every voice interaction is logged to the `voice_logs` table.

The system handles six distinct patient use cases:

#### Use Case 1: Check Doctor Availability

**Trigger:** `POST /doctor_availibility`

- Extracts patient details and desired department from Retell call variables
- Rate-limits to 20 requests per session
- Queries `doctor_schedule` for available slots on or after today in the specified department (ILIKE match for fuzzy department names)
- Groups slots by doctor and date, returns up to 20 available time slots as JSON
- Returns a structured "No doctors available" message if no slots are found

#### Use Case 2: Book Appointment

**Trigger:** `POST /book_appointment`

- Validates booking input: email format, phone length (min 10 digits), and `schedule_id` presence
- Attempts to reserve the doctor slot by updating `doctor_schedule` status to `Booked`
- If slot is already taken, returns a race-condition-safe "slot just booked" error
- Inserts a new record into the `appointments` table
- Fetches the full appointment record and sends a **confirmation email** to the patient
- Creates a **Google Calendar event** for the appointment with the patient as an attendee
- Returns a confirmation message to the voice agent

#### Use Case 3: Check Appointment Status

**Trigger:** `POST /cancel_status`

- Looks up appointment by `appointment_id` from the `appointments` table
- Formats appointment details (patient name, doctor, department, date, time, phone, email) into a readable text block
- Returns the formatted appointment info to the voice agent for reading back to the patient

#### Use Case 4: Confirm Cancellation

**Trigger:** `POST /confirm_cancellation`

- Cancels the appointment by setting `status = 'cancelled'` in the `appointments` table
- Simultaneously frees the corresponding `doctor_schedule` slot back to `Available`
- Fetches appointment details, generates a cancellation confirmation message
- Sends a **cancellation email** to the patient
- Returns confirmation to the voice agent

#### Use Case 5: Reschedule Check

**Trigger:** `POST /reschedule_check`

- Fetches the patient's current appointment details
- Finds the next available slot in the same department, at or after the current appointment time
- Formats both the current appointment and the next available slot
- Returns a combined message for the voice agent to read options to the patient

#### Use Case 6: Confirm Reschedule

**Trigger:** `POST /confirm_reschedule`

- Fetches the selected new slot from `doctor_schedule` by date and time
- Combines slot details with the patient's name from call variables
- Updates the `appointments` table with the new date, time, and `Booked` status
- Marks the new slot as booked in `doctor_schedule`
- Sends a **reschedule confirmation email** to the patient
- Returns a confirmation message to the voice agent

#### Bonus — Complaint Status via Voice

**Trigger:** `POST /complaint_status`

- Patients can check their complaint status by providing their name and complaint ID during a voice call
- Fetches complaint from `complaints` table by `complaint_code`
- Generates a contextual status message based on current status (Resolved / Pending / In Progress)
- **Escalation Logic**: If a complaint is Pending for more than 48 hours, sets `escalate = true` and sends a **Slack alert** to the support channel
- Returns the status message to the voice agent

---

### 5. Symptom Checker & Medical Triage

**File:** `safe_symptom_checker.json`

![Symptom Checker & Triage Workflow](https://github.com/MaryumAkram16/medilens/blob/main/Hospital%20Triage.PNG?raw=true)


A production-hardened AI medical triage system that accepts patient symptom descriptions, routes them to the appropriate specialist AI, assesses severity, and triggers emergency protocols when needed.

**Trigger:** `POST /hospital`

#### Security Pipeline:
- **Rate Limiter** — IP-based, 10 requests/60 seconds with automatic memory cleanup every 5 minutes → returns 429
- **Auth Check** — Validates `Authorization: Bearer <token>` header → returns 401
- **Input Validator** — Requires `text` (symptoms), `sessionId`, and `patientEmail` → returns 400

#### AI Triage Flow:
1. **Specialist Selector** (Gemini + session memory) — Analyzes symptoms and outputs exactly one specialist name from a list of 11 (Dermatologist, Cardiologist, Neurologist, ENT, Gastrologist, Endocrinologist, Gynecologist, Orthopedic, General Physician, Pediatrician, Psychologist)
2. **Specialist Prompt Builder** — Dynamically constructs a system prompt specific to the selected specialist, including their emergency trigger conditions
3. **Dynamic Specialist Agent** (Gemini) — Performs full clinical assessment and returns structured JSON with: `diagnosis`, `severity`, `homeRemedies`, `herbalTreatments`, `yoga`, `exercise`, `lifestyleChanges`, `diet`, `firstAid`, `emergencyReason`
4. **Parse & Normalize** — Strips markdown fences, extracts JSON, normalizes all array fields, and provides a safe fallback if parsing fails

#### Emergency Protocol:
- If `severity == "emergency"`, triggers parallel actions:
  - Sends a **patient warning email** with first aid instructions and emergency booking link
  - Sends a **doctor alert email** with full patient details and assessment
- Returns emergency response with booking link and alert status

#### Logging:
- All triage events are logged to `triage_logs` in Supabase (session ID, email, symptoms, IP, specialist, severity, diagnosis)
- No raw PHI is retained beyond what is logged for audit

---

### 6. RAG Knowledge Base Agent (Parts 1 & 2)

**Files:** `safe_medilens_rag_agent_part_1.json`, `safe_medilens_rag_agent_part_2.json`

![RAG Knowledge Base Agent Workflow](https://github.com/MaryumAkram16/medilens/blob/main/RAG.PNG?raw=true)


A two-part Retrieval-Augmented Generation (RAG) system that allows patients and staff to ask questions about Medilens Hospital and receive accurate, document-grounded answers — with zero hallucination.

#### Part 1: Document Ingestion Pipeline

**Trigger:** Manual execution

Ingests all PDF documents from a designated Google Drive folder into a Pinecone vector store for semantic search.

**Flow:**
1. Searches a specific Google Drive folder for all PDF files
2. Processes PDFs in batches to avoid memory limits
3. Downloads each PDF as binary data
4. Loads and splits document text into overlapping chunks (200-character overlap for context preservation)
5. Generates embeddings using **Gemini Embedding 001** (`models/gemini-embedding-001`)
6. Upserts all vectors into a **Pinecone** index under the `medilens` namespace

Re-run this workflow whenever new hospital documents (policies, service guides, department info) are added to the Drive folder.

#### Part 2: RAG Chat Agent

**Trigger:** `POST /RAG`

**Security:** Validates `x-api-key` header → returns 401 JSON error if invalid

Provides an intelligent, context-aware chat interface backed by the ingested knowledge base.

**Flow:**
1. Validates API key
2. Routes to the **RAG Agent** (Gemini + Pinecone tool + PostgreSQL chat memory)
3. The agent uses the `Pinecone Vector Store` as a retrieval tool (top-5 results, `medilens` namespace)
4. If the knowledge base does not contain the answer, the agent responds with: *"I'm sorry, I could not find this information in our hospital knowledge base"* — no guessing or hallucination
5. All interactions are logged to `rag_logs` in Supabase
6. Responds to the website via webhook

**Complaint Detection & Escalation:**
- After every response, an IF node scans the agent output for complaint signals (keywords: "not satisfied", "complain", "talk to human", "someone", etc.)
- If detected:
  - Routes to the **Complaint Replier Agent** — a separate Gemini agent that responds empathetically and confirms the complaint has been forwarded
  - Fetches full conversation history from `n8n_chat_histories` in Supabase
  - Formats each message as `User:` / `Bot:` entries
  - Sends a **complaint escalation email** to the customer service team with the full chat transcript
- **Error Trigger** node catches any workflow-level failures and also routes to the email alert

**Chat Memory:** Uses PostgreSQL-backed persistent chat memory (keyed by `sessionId`), meaning conversation context is preserved across page reloads and multiple sessions.

---

### 7. Retell AI Voice Agent

**File:** `Medilens_Voice_Agent_Retell.json`

![Retell AI Voice Agent Conversation Flow](https://github.com/MaryumAkram16/medilens/blob/main/retell%20voice%20agent.PNG?raw=true)


This is the Retell AI conversation flow configuration — the voice-side counterpart to the n8n booking backend. It defines the full voice agent personality, conversation structure, intent routing, variable extraction, and every tool call that connects to the n8n webhooks. Import this directly into your Retell AI dashboard to recreate the complete `Medi` voice receptionist.

#### Agent Identity & Behavior

- **Agent Name:** Medi — the friendly voice receptionist for Medilens Hospital
- **Voice:** `retell-Cimo` (warm, professional, calm)
- **Language:** `en-US`
- **Interruption Sensitivity:** `0.9` (highly responsive to patient interruptions)
- **Max Call Duration:** 60 minutes
- **LLM Model:** GPT-4.1 (cascading) — used across all conversation nodes
- **Post-Call Analysis:** GPT-4.1-mini for call summary and PII detection

**Global Prompt rules enforced across all flows:**
- Speak warmly and never sound robotic; never mention AI or internal systems
- Ask only one question at a time; never repeat a question already answered
- Spell names and email addresses back letter by letter to confirm
- Read phone numbers in grouped digit format (e.g., "four one five - eight nine two - three two four five")
- Immediately redirect emergencies (accidents, bleeding, unconsciousness) to the emergency department
- Never diagnose, provide medical advice, or discuss treatment options

---

#### Conversation Flow Architecture

The agent uses a **node-based conversation flow** with a single Welcome Node as the entry point and four component flows that handle each use case. Each component is a self-contained sub-flow that can exit back to the main flow or end the call.

```
Welcome Node (Intent Detection)
        │
        ├── schedule_appointment  → Book a new appointment
        ├── cancel_appointment    → Cancel an existing appointment
        ├── reschedule_appointment → Reschedule an existing appointment
        └── Complaint             → Track a complaint by ID
```

---

#### Component 1: `schedule_appointment`

Handles new appointment booking end-to-end within a single voice call.

**Conversation Steps:**
1. Greets the patient and asks for their **full name** (with spelling confirmation)
2. Collects **phone number** (reads back in grouped digits)
3. Collects **email address** (spells username letter by letter + domain)
4. Asks which **department** they want to book with
5. Says: *"I will check the available slots"* → triggers tool call

**Tool Calls:**
- `doctor_availibility` → `POST YOUR_N8N_INSTANCE_URL/webhook/doctor_availibility`
  - Sends: `name`, `phone_no`, `email`, `department`, `appointment_id`
  - Returns: `consolidated_data` — list of available doctor slots
- Agent reads available slots to patient and asks which time they prefer
- Extracts: `doctor_name`, `appointment_date`, `appointment_time` from patient reply
- `book_appointment` → `POST YOUR_N8N_INSTANCE_URL/webhook/book_appointment`
  - Sends: `name`, `phone_no`, `email`, `department`, `doctor_name`, `appointment_date`, `appointment_time`, `appointment_id`, `schedule_id`
  - Returns: booking confirmation message or failure reason

**Error Handling:** If the patient fails to provide all details (name, phone, email, department), a retry conversation node prompts them to provide the missing information again before re-attempting extraction.

---

#### Component 2: `cancel_appointment`

Handles appointment cancellation with a two-step confirm-before-cancel flow.

**Conversation Steps:**
1. Asks for **patient name** (with spelling confirmation)
2. Asks for **appointment ID**
3. Triggers appointment lookup → reads appointment details back to patient
4. Asks: *"Do you want me to proceed with cancellation?"*
5. If YES → triggers cancellation; if NO → politely ends

**Tool Calls:**
- `cancel-appointment-` → `POST YOUR_N8N_INSTANCE_URL/webhook/cancel_status`
  - Sends: `patient_name`, `appointment_id`
  - Returns: `appointment_info` — formatted appointment details read back to patient
- `confirm_cancellation` → `POST YOUR_N8N_INSTANCE_URL/webhook/confirm_cancellation`
  - Sends: `patient_name`, `appointment_id`
  - Returns: cancellation confirmation message

**Safety:** The agent always reads the appointment details back and requires explicit verbal confirmation ("yes") before cancelling. A "no" response exits gracefully with a polite farewell.

---

#### Component 3: `reschedule_appointment`

Handles rescheduling by first verifying the current appointment, then offering the next available slot.

**Conversation Steps:**
1. Asks for **patient name** (with spelling confirmation)
2. Asks for **appointment ID**
3. Looks up current appointment → reads details back
4. Asks: *"Do you want me to proceed with rescheduling?"*
5. If YES → checks next available slot and presents it to patient
6. Patient confirms → reschedule is confirmed

**Tool Calls:**
- `appointment_check` → `POST YOUR_N8N_INSTANCE_URL/webhook/reschedule_check`
  - Sends: `patient_name`, `appointment_id`
  - Returns: current appointment details + next available slot
- `check_slot` → `POST YOUR_N8N_INSTANCE_URL/webhook/confirm_reschedule`
  - Sends: `appointment_id`, `appointment_date`, `slot_start_time`, `slot_end_time`
  - Returns: reschedule confirmation message

---

#### Component 4: `Complaint` (Status Tracking)

Allows patients to check the status of an existing complaint by providing their name and complaint ID during the call.

**Conversation Steps:**
1. Asks for **patient name** (with spelling confirmation)
2. Asks for **complaint ID**
3. Triggers complaint lookup → reads status back to patient

**Tool Call:**
- `complaint_check` → `POST YOUR_N8N_INSTANCE_URL/webhook/complaint_status`
  - Sends: `name`, `complaint_id`
  - Returns: `message` — contextual status (Resolved / Pending / In Progress) plus escalation if pending > 48 hours

---

#### Importing into Retell AI

1. Log in to your [Retell AI Dashboard](https://app.retellai.com)
2. Navigate to **Agents → Import Agent**
3. Upload `Medilens_Voice_Agent_Retell.json`
4. After import, go to each component's **Tools** section and update all webhook URLs from `YOUR_N8N_INSTANCE_URL` to your actual n8n production webhook base URL
5. If using a Retell knowledge base for the FAQs component, create a knowledge base in Retell, copy its ID, and replace `YOUR_KNOWLEDGE_BASE_ID` in the FAQs node instruction
6. Set your **Agent ID** (auto-generated on import — note it down for API calls)
7. Test using Retell's built-in call simulator before going live

---

## Tech Stack

| Layer | Technology |
|---|---|
| Workflow Orchestration | n8n |
| AI / LLM | Google Gemini (gemini-pro, gemini-flash) |
| Voice AI | Retell AI |
| Vector Store | Pinecone |
| Database | Supabase (PostgreSQL) |
| Embeddings | Google Gemini Embedding 001 |
| Email | Gmail (OAuth2 / Service Account) |
| Alerts | Slack (OAuth2) |
| Calendar | Google Calendar |
| File Storage | Google Drive |
| Document Ingestion | n8n LangChain nodes (PDF loader, text splitter) |
| Runtime Logic | JavaScript (n8n Code nodes) |

---

## Security & Compliance

- **API Key Authentication** — All public-facing webhooks validate an `x-api-key` or `Authorization: Bearer` header
- **Retell Signature Verification** — All voice agent webhooks verify the `x-retell-signature` header to prevent spoofed calls
- **Rate Limiting** — IP-based rate limiting (10 req/min) on patient-facing endpoints
- **Input Validation** — All inputs are validated for type, length, format, and required fields before processing
- **PHI Protection** — Session IDs are hashed before logging; no raw patient audio or identifying data is stored in workflow logs
- **Idempotency** — Suggestion processing and appointment booking include duplicate/conflict detection to prevent double-processing
- **Data Encryption** — All data in transit uses HTTPS/TLS
- **Audit Trail** — All complaint submissions are recorded in `audit_logs`; all RAG interactions in `rag_logs`; all triage events in `triage_logs`

---

## Setup Guide

### Prerequisites

- n8n instance (Cloud or self-hosted, v1.0+)
- Supabase project with the following tables: `doctors`, `nurses`, `patients`, `beds`, `appointments`, `risk_patients`, `ai_suggestions`, `doctor_schedule`, `voice_logs`, `complaints`, `complaint_services`, `audit_logs`, `analysis_logs`, `triage_logs`, `rag_logs`, `n8n_chat_histories`
- Google Cloud project with Gmail API, Google Drive API, and Google Calendar API enabled
- Google Gemini API key (PaLM/Gemini)
- Pinecone account and index named `n8n-rag`
- Retell AI account and agent configured
- Slack workspace with an OAuth2 app and a `#all-complaint-management` channel

### 1. Import Workflows

1. Download all `.json` files from this repository
2. In n8n, go to **Workflows → Import from File** for each file
3. Import in this recommended order:
   - `command_center.json`
   - `Complaint_Management.json`
   - `lab_report_analyzer.json`
   - `Medilens_Voice_Appointment_Booking.json`
   - `safe_symptom_checker.json`
   - `safe_medilens_rag_agent_part_1.json`
   - `safe_medilens_rag_agent_part_2.json`

> The Retell AI voice agent is configured separately — see **Step 6: Retell AI Voice Agent Import** below.

### 2. Configure Credentials

For each workflow, configure the following credential types in n8n:

| Credential | Used In |
|---|---|
| PostgreSQL (Supabase) | All workflows |
| Google Gemini (PaLM) API | All AI agent nodes |
| Gmail OAuth2 | Complaint Management, Lab Analyzer, Voice Booking, Symptom Checker, RAG Agent |
| Slack OAuth2 | Complaint Management, Voice Booking (complaint escalation) |
| Google Calendar OAuth2 | Voice Appointment Booking |
| Google Drive OAuth2 | RAG Ingestion (Part 1) |
| Supabase API | Lab Analyzer, Symptom Checker, RAG Agent |
| Pinecone API | RAG Agent (Parts 1 & 2) |

### 3. Configure Environment Variables

Replace the following placeholder values in the workflow nodes:

| Placeholder | Where | Description |
|---|---|---|
| `{{API_KEY}}` | Command Center, Voice Booking | API key for admin endpoints |
| `{{API_KEY}}` | Lab Analyzer, Symptom Checker, RAG Agent | API key for patient-facing endpoints |
| `{{DOCTOR_EMAIL}}` | Symptom Checker | Email address to receive emergency alerts |
| `{{ALERT_EMAIL}}` | RAG Agent | Email address for complaint escalations |
| `{{Your_Drive_ID}}` | RAG Part 1 | Google Drive folder ID for hospital PDFs |

### 4. RAG Document Ingestion

1. Upload all hospital policy/service PDF documents to the configured Google Drive folder
2. Open the `RAG ingestion production part 1` workflow in n8n
3. Click **Execute Workflow** to run the ingestion manually
4. Verify that vectors appear in your Pinecone index under the `medilens` namespace
5. Re-run whenever new documents are added

### 5. Activate n8n Workflows

After configuring all credentials and environment variables, activate every workflow in n8n by toggling the **Active** switch at the top of each workflow. Copy the **Production Webhook URL** from each webhook trigger node — you will need these in the next step.

### 6. Retell AI Voice Agent Import

Rather than manually recreating the agent in the Retell dashboard, import the pre-built configuration file directly:

1. Log in to your [Retell AI Dashboard](https://app.retellai.com)
2. Navigate to **Agents → Import Agent** and upload `Medilens_Voice_Agent_Retell.json`
3. Once imported, open the agent and go to each component's **Tools** section
4. Update every webhook URL — replace `YOUR_N8N_INSTANCE_URL` with your actual n8n production base URL across all four components:

| Component | Tool Name | Full Webhook URL to Set |
|---|---|---|
| `schedule_appointment` | `doctor_availibility` | `https://YOUR_N8N_URL/webhook/doctor_availibility` |
| `schedule_appointment` | `book_appointment` | `https://YOUR_N8N_URL/webhook/book_appointment` |
| `cancel_appointment` | `cancel-appointment-` | `https://YOUR_N8N_URL/webhook/cancel_status` |
| `cancel_appointment` | `confirm_cancellation` | `https://YOUR_N8N_URL/webhook/confirm_cancellation` |
| `reschedule_appointment` | `appointment_check` | `https://YOUR_N8N_URL/webhook/reschedule_check` |
| `reschedule_appointment` | `check_slot` | `https://YOUR_N8N_URL/webhook/confirm_reschedule` |
| `Complaint` | `complaint_check` | `https://YOUR_N8N_URL/webhook/complaint_status` |

5. If using a Retell knowledge base for FAQs, create one in Retell, copy the generated ID, and replace `YOUR_KNOWLEDGE_BASE_ID` in the FAQs component conversation node instruction
6. Ensure all tools send the `x-retell-signature` header (Retell handles this automatically)
7. Use Retell's built-in **Call Simulator** to test each flow before going live

---

## API Reference

### Command Center

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/v1/admin/ai/suggestion` | None | Trigger AI suggestion generation |
| `POST` | `/v1/admin/dashboard/data` | None | Fetch full dashboard data |
| `POST` | `/hospital/process-suggestion` | `x-api-key` | Approve or reject a suggestion |

**Process Suggestion Request Body:**
```json
{
  "suggestionId": "SUG001",
  "status": "Approved",
  "timestamp": "2026-03-20T10:00:00Z"
}
```

### Complaint Management

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/v1/complaints` | `x-api-key` | Submit a new complaint |
| `POST` | `/complaints` | None | Fetch complaints summary |

**Submit Complaint Request Body:**
```json
{
  "name": "Maryum Akram",
  "email": "patient@example.com",
  "phone": "+92300000000",
  "details": "Staff was very rude during my visit.",
  "type": "Staff Behavior",
  "priority": "High",
  "complaintId": "CMP001"
}
```

### Lab Report Analyzer

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/labreports` | `x-api-key` (header) | Analyze a medical document |

**Request Body:**
```json
{
  "extracted_data": "Hemoglobin: 8.5 g/dL (Reference: 12-16)...",
  "sessionId": "session-abc123",
  "patientEmail": "patient@example.com"
}
```

### Symptom Checker

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/hospital` | `Authorization: Bearer <token>` | Submit symptoms for triage |

**Request Body:**
```json
{
  "text": "I have had a severe headache for 3 days with vision changes.",
  "sessionId": "triage-session-001",
  "patientEmail": "patient@example.com"
}
```

### RAG Agent

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/RAG` | `x-api-key` (header) | Chat with hospital knowledge base |

**Request Body:**
```json
{
  "chatInput": "What are the visiting hours for the ICU?",
  "sessionId": "chat-session-001"
}
```

---

## Troubleshooting

| Issue | Possible Cause | Solution |
|---|---|---|
| Voice agent not responding | Retell signature not verified | Confirm `x-retell-signature` is in the request headers; ensure n8n workflow is activated |
| AI suggestions not generating | Gemini API quota | Check Google Gemini API usage limits; verify credentials in n8n |
| Complaint email not sent | Gmail OAuth2 expired | Re-authorize Gmail credentials in n8n settings |
| RAG agent hallucinating | Documents not ingested | Re-run the RAG ingestion workflow; verify vectors in Pinecone |
| Slot booking race condition | Concurrent requests | The `RETURNING schedule_id` query handles this; confirm PostgreSQL version supports it |
| 429 errors on symptom checker | Rate limit triggered | Wait 60 seconds; or increase `MAX_REQUESTS` in the Rate Limiter code node |
| Appointment not in calendar | Google Calendar OAuth scope | Ensure `calendar.events` scope is granted in the OAuth2 credential |
| Complaint not escalated | Keyword not matched | Add additional trigger keywords to the IF node in the RAG agent complaint detection logic |

---

## Cost Estimation

This section breaks down the monthly cost for running the full Medilens Hospital AI Automation System. Costs are estimated based on **three deployment tiers**: a small clinic or pilot deployment, a mid-sized hospital, and a large hospital with high call volume. All prices are in USD and verified as of March 2026.

---

### Tool-by-Tool Pricing Breakdown

#### 1. n8n (Workflow Orchestration)

All six workflow modules run on n8n. You have two options:

| Option | Cost | Notes |
|---|---|---|
| **n8n Cloud – Starter** | ~$20/month | 2,500 executions/month. Fine for low-volume pilots |
| **n8n Cloud – Pro** | ~$50/month | 10,000 executions/month. Recommended for production |
| **n8n Self-Hosted (VPS)** | $5–$20/month | Unlimited executions. Requires a DigitalOcean/Hetzner VPS. Best ROI at scale |

> **Recommendation:** Self-host on a $10–20/month VPS (e.g., DigitalOcean Droplet or Hetzner CX21) for unlimited executions. This is the most cost-effective option for any hospital running more than ~500 automations per month.

---

#### 2. Retell AI (Voice Agent)

Powers the 24/7 voice appointment booking, cancellation, rescheduling, and complaint status flows.

Retell uses **pay-as-you-go** pricing. The advertised base rate is $0.07/min (voice engine only). Real production costs once LLM + telephony are included run **$0.11–$0.15/minute**.

| Component | Cost |
|---|---|
| Voice Engine (ElevenLabs / OpenAI) | $0.07–$0.08/min |
| LLM (Gemini Flash) | ~$0.006–$0.01/min |
| Telephony (Twilio/Retell) | ~$0.015/min |
| **Realistic Total** | **~$0.11–$0.15/min** |
| Additional Concurrent Calls (beyond 20 free) | $8/month per slot |
| Enterprise Plan (white-glove, custom) | From $8,000/month |

> **Example:** A hospital handling 500 voice calls/month, averaging 5 minutes each = 2,500 minutes × $0.13 = **~$325/month** in voice costs.

---

#### 3. Google Gemini API (AI / LLM)

Used across all six modules: complaint analysis, lab report interpretation, symptom triage, specialist selection, RAG responses, and AI operational suggestions.

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Use In This System |
|---|---|---|---|
| Gemini 2.5 Flash | $0.30 | $2.50 | Most agent nodes (recommended) |
| Gemini 2.5 Flash-Lite | $0.10 | $0.40 | Routing, classification tasks |
| Gemini 2.5 Pro | $1.25 | $10.00 | Complex lab analysis, RAG agent |
| **Free Tier** | **$0** | **$0** | Up to 1,000 requests/day — good for testing |

> **Estimation:** A mid-sized hospital running ~5,000 AI agent calls/month (complaints, triage, lab reports, dashboard suggestions) with ~2,000 tokens average per call = ~10M tokens/month. Using Gemini 2.5 Flash: **~$3–$25/month** depending on task mix. Heavier lab/RAG analysis with Pro model could reach **$50–$150/month**.

---

#### 4. Supabase (Database + Storage)

All hospital data (patients, doctors, beds, appointments, complaints, voice logs, AI suggestions, RAG logs, chat history) is stored here.

| Plan | Cost | Includes |
|---|---|---|
| **Free** | $0 | 500 MB DB, 50K MAUs, pauses after 7 days inactivity — not suitable for production |
| **Pro** | $25/month | 8 GB DB, 100K MAUs, no auto-pause, backups |
| **Pro + Compute Upgrade** | $25 + $25–$110/month | Needed if DB handles high concurrent queries |
| **Team** | $599/month | For multi-team hospitals with SSO/audit logs |
| **Enterprise (HIPAA)** | Custom | Required for HIPAA-compliant deployments |

> **Recommendation:** The **Pro plan at $25/month** is sufficient for most hospitals at launch. Add a compute upgrade ($25–$50/month) if query latency becomes an issue with high patient volume.

---

#### 5. Pinecone (Vector Store for RAG)

Used only by the RAG Knowledge Base Agent to store and query hospital document embeddings.

| Plan | Cost | Includes |
|---|---|---|
| **Starter (Free)** | $0 | 2 GB storage, 1M read units/month, 2M write units/month — enough for a small document set |
| **Standard** | $50/month minimum | Pay-as-you-go: $0.33/GB storage, $8.25/M read units, $2/M write units |
| **Enterprise (HIPAA)** | $500/month minimum | HIPAA compliance bundled |
| HIPAA Add-on (Standard) | +$190/month | For HIPAA on Standard plan |

> **Estimation:** A hospital with 50–100 PDF documents (~1 GB of vectors) running ~10,000 RAG queries/month: storage ~$0.33 + reads ~$0.08 = well within the **free Starter tier**. Only upgrade to Standard if you have large document libraries or high chat volume.

---

#### 6. Gmail (Email Notifications)

Used for appointment confirmations, cancellation emails, lab report delivery, complaint confirmations, and emergency triage alerts.

| Option | Cost |
|---|---|
| Google Workspace (Business Starter) | $6/user/month |
| Personal Gmail (OAuth2) | Free (500 sends/day via API) |

> **Recommendation:** For a production hospital, use **Google Workspace at $6/month** for one shared service account email. This gives a professional sender address and removes daily sending limits.

---

#### 7. Slack (High-Priority Alerts)

Used for high-priority complaint alerts and complaint escalation notifications from the voice agent.

| Plan | Cost |
|---|---|
| Free | $0 (limited message history) |
| Pro | $7.25/user/month |

> A single shared Slack workspace on the **free plan** is sufficient for alert delivery. No per-user cost needed if alerts go to one channel.

---

### Monthly Cost Summary by Deployment Tier

| Tool | Small Clinic / Pilot | Mid-Size Hospital | Large Hospital |
|---|---|---|---|
| **n8n** | $0 (self-hosted VPS) | $20/month (Cloud Pro) | $20/month (Cloud Pro or self-hosted) |
| **VPS for n8n** | $5–$10/month | $10–$20/month | $20–$50/month |
| **Retell AI (Voice)** | ~$70/month (500 min) | ~$325/month (2,500 min) | ~$1,300/month (10,000 min) |
| **Google Gemini API** | ~$5–$10/month | ~$25–$50/month | ~$100–$200/month |
| **Supabase** | $25/month (Pro) | $25–$75/month | $75–$599/month |
| **Pinecone** | $0 (Free Starter) | $0–$50/month | $50/month (Standard) |
| **Gmail / Google Workspace** | $0–$6/month | $6/month | $6/month |
| **Slack** | $0 (Free) | $0–$7/month | $7/month |
| **Total Estimate** | **~$105–$135/month** | **~$410–$530/month** | **~$1,550–$2,230/month** |

---

### Volume Definitions

| Tier | Voice Calls/Month | AI Agent Calls/Month | Active Patients |
|---|---|---|---|
| **Small Clinic / Pilot** | ~300–500 | ~1,000–2,000 | <500 |
| **Mid-Size Hospital** | ~1,500–2,500 | ~5,000–8,000 | 500–5,000 |
| **Large Hospital** | ~7,000–10,000 | ~20,000–30,000 | 5,000+ |

---

### Cost-Saving Tips

- **Self-host n8n** on a $10–$20/month VPS (Hetzner, DigitalOcean, or Vultr) to get unlimited executions and eliminate the biggest variable cost driver at scale
- **Use Gemini 2.5 Flash-Lite** ($0.10/$0.40 per 1M tokens) for routing, classification, and simple agent tasks instead of Pro models
- **Use Pinecone's free Starter tier** until your hospital document corpus exceeds 2 GB or RAG query volume exceeds 1M/month
- **Use Gmail personal OAuth2** during the pilot phase (free, up to 500 emails/day) before moving to Google Workspace
- **Use Retell AI's 20 free concurrent calls** — for most hospitals this is more than sufficient without paying extra concurrency fees
- **Batch non-urgent Gemini requests** (e.g., AI suggestion generation) using the Batch API for a 50% discount on token costs

---

### HIPAA Compliance Additional Costs

If the hospital operates under HIPAA regulations, the following add-ons apply:

| Component | HIPAA Cost |
|---|---|
| Retell AI (BAA available) | Included in Enterprise plan — contact sales |
| Supabase (HIPAA) | Enterprise plan — custom pricing |
| Pinecone (HIPAA) | $190/month add-on on Standard, or Enterprise plan at $500+/month |
| n8n Self-Hosted | Full data control — no additional fee |

> **Note:** For HIPAA-compliant hospital deployments, budget an additional **$200–$700/month** across Supabase and Pinecone add-ons. All pricing is subject to change — verify with each vendor before procurement.

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a new branch (`feature/your-feature` or `fix/issue-description`)
3. Make your changes with clear, descriptive commit messages
4. Test all affected workflows end-to-end before submitting
5. Open a Pull Request with a detailed description of your changes

For major changes, please open an issue first to discuss what you'd like to change.
