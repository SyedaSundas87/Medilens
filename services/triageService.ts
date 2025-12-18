
import { SymptomResponse } from '../types';

// Helper to get or create a persistent session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('medilens_session_id');
  if (!sessionId) {
    // Generate new ID: user_{timestamp}_{random}
    sessionId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('medilens_session_id', sessionId);
  }
  return sessionId;
};

// Helper: Fetch with Retry
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 1000): Promise<Response> {
  try {
    const response = await fetch(url, options);
    // Retry on server errors
    if (retries > 0 && (response.status === 502 || response.status === 503 || response.status === 504)) {
      console.warn("Retrying triage webhook...");
      await new Promise(r => setTimeout(r, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    if (retries > 0) {
      await new Promise(r => setTimeout(r, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw err;
  }
}

// HELPER: Normalize N8n Data
const normalizeData = (input: any): any => {
  if (!input) return {};
  
  if (Array.isArray(input)) {
    return normalizeData(input[0]);
  }
  
  if (input.json) return normalizeData(input.json);
  if (input.body) return normalizeData(input.body);
  if (input.data && !input.diet && !input.diagnosis) return normalizeData(input.data);

  if (typeof input === 'object') {
    const cleaned: any = {};
    for (const key in input) {
      const cleanKey = key.trim(); 
      let value = input[key];
      const listFields = ['diet', 'yoga', 'exercise', 'lifestyleChanges', 'herbalTreatments', 'homeRemedies'];
      if (Array.isArray(value)) {
        if (value.length === 1 && typeof value[0] === 'string' && !listFields.includes(cleanKey)) {
          value = value[0]; 
        }
      }
      cleaned[cleanKey] = value;
    }
    return cleaned;
  }
  return input;
};

// INTELLIGENT PARSER: Fallback for unstructured text
const findBestResponseText = (obj: any): string | null => {
  if (!obj) return null;
  if (typeof obj === 'string') return (obj.length > 2 && obj !== "0") ? obj : null;
  
  const priorityKeys = ['response', 'output', 'text', 'message', 'answer', 'content', 'result', 'advice', 'summary'];
  for (const key of priorityKeys) {
    if (obj[key] && typeof obj[key] === 'string') return obj[key];
  }
  return null;
};

export const sendToTriage = async (
  inputType: 'text' | 'voice' | 'image',
  data: string
): Promise<SymptomResponse> => {
  const sessionId = getSessionId();

  const payload: any = {
    sessionId: sessionId,
  };

  if (inputType === 'text') {
    payload.text = data;
  } else if (inputType === 'voice') {
    payload.audioData = data;
  } else if (inputType === 'image') {
    payload.imageData = data;
  }

  try {
    console.log(`Sending payload to N8n (Session: ${sessionId}):`, payload);

    const PROXY = "https://corsproxy.io/?";
    // Smart Symptom Checker URL
    const TARGET_URL = "https://n8nsundas.duckdns.org/webhook/hospital";
    const finalUrl = PROXY + encodeURIComponent(`${TARGET_URL}?sessionId=${sessionId}`);

    const controller = new AbortController();
    // Increased timeout to 90 seconds to prevent premature aborts on slow AI workflows
    const timeoutId = setTimeout(() => controller.abort(), 90000); 

    const response = await fetchWithRetry(finalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // --- 404 FALLBACK ---
    if (response.status === 404) {
      console.warn("Triage Webhook 404 - Workflow Inactive. Using fallback data.");
      return {
          symptom_summary: "Offline Analysis",
          input_type: inputType,
          guidance: JSON.stringify({
              diagnosis: "Preliminary Assessment (Offline)",
              severity: "Low Risk",
              generalWellness: "The symptom checker server is currently offline. Based on general guidelines, please rest and stay hydrated. If symptoms worsen, consult a doctor immediately.",
              homeRemedies: ["Hydration", "Rest"],
              emergencyReason: "N/A"
          }),
          triage_level: 'routine',
          specialty_recommendation: "General Physician",
          n8n_payload: { offline: true }
      };
    }

    const responseText = await response.text();
    let rawResult;

    try {
        rawResult = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
        console.warn("N8n response was not JSON.");
        rawResult = { response: responseText };
    }

    if (!response.ok) {
        if (response.status >= 500) throw new Error("N8n Server Error (500/502/504). Please try again shortly.");
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('N8N Raw Response:', rawResult);

    // --- STEP 1: NORMALIZE DATA ---
    const cleanData = normalizeData(rawResult);
    console.log('Normalized Data:', cleanData);

    // --- STEP 2: DETECT STRUCTURE ---
    const medicalKeys = [
        'diagnosis', 'severity', 'firstAid', 'emergencyReason', 
        'homeRemedies', 'herbalTreatments', 'diet', 'yoga', 'exercise', 'lifestyleChanges', 
        'General wellness tips', 'generalWellness'
    ];
    
    const hasStructuredData = medicalKeys.some(key => key in cleanData);
    let guidanceText = "";

    if (hasStructuredData) {
        guidanceText = JSON.stringify(cleanData);
    } else {
        guidanceText = findBestResponseText(cleanData) || "Symptoms received. No specific advice returned.";
    }
    
    // Status Logic
    let statusText = cleanData.triage_status || cleanData.status || cleanData.severity || "routine";
    if (statusText === "routine" && cleanData.emergencyReason) {
        const reason = String(cleanData.emergencyReason).toLowerCase();
        if (!reason.includes("n/a") && !reason.includes("no emergency") && reason.length > 5) {
             statusText = "emergency";
        }
    }
    
    const statusLower = String(statusText).toLowerCase();
    let triageLevel: 'emergency' | 'urgent' | 'routine' = 'routine';
    
    if (statusLower.includes('emergency') || statusLower.includes('high') || statusLower.includes('critical')) triageLevel = 'emergency';
    else if (statusLower.includes('urgent') || statusLower.includes('moderate')) triageLevel = 'urgent';

    return {
      symptom_summary: cleanData.diagnosis || "Triage Analysis", 
      input_type: inputType,
      guidance: guidanceText,
      triage_level: triageLevel,
      specialty_recommendation: cleanData.specialty || "Specialist Review",
      n8n_payload: rawResult
    };

  } catch (error: any) {
    console.error("N8n Triage Webhook Error:", error);
    // Enhanced error message handling for aborts
    let msg = error.message;
    if (error.name === 'AbortError' || msg.includes('aborted')) {
        msg = "Request timed out. The AI analysis is taking longer than expected. Please try again.";
    }
    
    return {
      symptom_summary: "Connection Failed",
      input_type: inputType,
      guidance: `Error: ${msg}`,
      triage_level: 'routine',
      specialty_recommendation: "Support",
      n8n_payload: {}
    };
  }
};
