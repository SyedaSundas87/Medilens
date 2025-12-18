
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
    sessionId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('medilens_session_id', sessionId);
  }
  return sessionId;
};

export const sendLabReportData = async (extractedText: string): Promise<LabReportResult> => {
  const sessionId = getSessionId();

  // Added 'text' and 'input' to payload to ensure N8n compatibility
  const payload = {
    sessionId,
    type: 'lab_report_analysis',
    extracted_data: extractedText,
    text: extractedText, // Added for compatibility
    input: extractedText // Added for compatibility
  };

  try {
    console.log(`Sending Lab Report to N8n (Session: ${sessionId}):`, payload);

    const PROXY = "https://corsproxy.io/?";
    // N8N WEBHOOK URL for LAB REPORTS
    const TARGET_URL = "https://n8nsundas.duckdns.org/webhook/labreports";
    
    const finalUrl = PROXY + encodeURIComponent(`${TARGET_URL}?sessionId=${sessionId}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s Timeout

    // Use fetch directly to send exactly 1 request as requested (no retries)
    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // --- 404 OR 500 FALLBACK ---
    // If server is down (500) or workflow missing (404), return offline analysis
    if (response.status === 404 || response.status >= 500) {
        console.warn(`Lab Webhook Error (${response.status}) - Using fallback data.`);
        return {
          status: 'success',
          analysis: "### Analysis (Offline Mode)\n\n**Note:** The lab analysis server is currently unreachable.\n\n**Recommendation:** Please show this report to a specialist for accurate interpretation.",
          recommendations: "Consult a specialist directly.",
          n8n_payload: { offline: true }
        };
    }

    const responseText = await response.text();
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

    console.log('N8N Lab Report Response:', result);
    
    // Normalize response for the UI
    return {
      status: result.status || 'success',
      analysis: result.analysis || result.response || result.output || result.text || result.message || JSON.stringify(result),
      recommendations: result.recommendations,
      n8n_payload: result
    };

  } catch (error: any) {
    console.error("Lab Report Webhook Error:", error);
    if (error.name === 'AbortError') {
       throw new Error("Analysis timed out. The document might be too complex or the server is busy.");
    }
    throw error;
  }
};
