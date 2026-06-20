
export interface LabReportResult {
  status: string;
  analysis: string;
  recommendations?: string;
  n8n_payload: any;
}

// Helper to get or create a persistent session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('medilens_session_id');
  if (!sessionId) {
    sessionId = `session_${Math.floor(Date.now() / 1000)}_${Math.random().toString(36).substr(2, 6)}`;
    sessionStorage.setItem('medilens_session_id', sessionId);
  }
  return sessionId;
};

export const sendLabReportData = async (extractedText: string, patientEmail: string): Promise<LabReportResult> => {
  const sessionId = getSessionId();

  // 1. Validation before sending
  if (!extractedText || extractedText.trim() === '') {
    throw new Error("Extracted data is empty. Please ensure the report was scanned correctly.");
  }
  if (!sessionId) {
    throw new Error("Session ID is missing. Please refresh the page.");
  }
  if (!patientEmail || !patientEmail.includes('@')) {
    throw new Error("A valid patient email is required.");
  }

  const payload = {
    extracted_data: extractedText,
    sessionId: sessionId,
    patientEmail: patientEmail
  };

  // 2. Log the request payload before sending (for debugging)
  console.log("--- API REQUEST PAYLOAD ---");
  console.log(JSON.stringify(payload, null, 2));
  console.log("---------------------------");

  try {
    // Using our backend proxy to avoid CORS issues and keep API keys secure
    // The proxy will forward this to https://minal09.app.n8n.cloud/webhook-test/labreports
    const finalUrl = `/api/labreports`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s Timeout for large reports

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Note: x-api-key is handled by our server proxy for security
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`API Response Status: ${response.status}`);
    
    // --- 404 OR 500 FALLBACK ---
    if (response.status === 404 || response.status >= 500) {
        const errorText = await response.text();
        console.error(`Lab Webhook Error (${response.status}):`, errorText);
        
        return {
          status: 'success',
          analysis: "### Analysis (Offline Mode)\n\n**Note:** The lab analysis server is currently unreachable or returned an error.\n\n**Recommendation:** Please show this report to a specialist for accurate interpretation.",
          recommendations: "Consult a specialist directly.",
          n8n_payload: { offline: true, error: errorText }
        };
    }

    const responseText = await response.text();
    console.log("--- API RESPONSE DATA ---");
    console.log(responseText);
    console.log("--------------------------");

    let result;
    try {
        result = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
        console.warn("N8n returned non-JSON for lab report:", responseText);
        result = { analysis: responseText };
    }

    if (!response.ok) {
        throw new Error(`N8n Server Error: ${response.status}`);
    }

    // Normalize response for the UI
    return {
      status: result.status || 'success',
      analysis: result.analysis || result.response || result.output || result.text || result.message || JSON.stringify(result),
      recommendations: result.recommendations,
      n8n_payload: result
    };

  } catch (error: any) {
    console.error("Lab Report API Error:", error);
    if (error.name === 'AbortError') {
       throw new Error("Analysis timed out. The document might be too complex or the server is busy.");
    }
    throw error;
  }
};
