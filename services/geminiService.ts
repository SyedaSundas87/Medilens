import { GoogleGenAI, Modality, Type } from "@google/genai";
import { SymptomResponse } from '../types';

// Initialize Gemini
// Fix: Use mandatory named parameter and direct environment variable access
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const REFUSAL_MESSAGE = "I am a symptoms checker designed to help you understand your disease and symptoms. I cannot help you with other matters.";

/**
 * Analyzes a medical image to extract symptoms description.
 * Throws an error with a specific message if content is Off-Topic.
 */
export const analyzeImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<string> => {
  try {
    // Fix: Use gemini-3-flash-preview for multimodal vision tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: "Deeply analyze this medical image. 1. Identify which body part is shown. 2. Describe the visible symptoms (e.g., redness, swelling, rash, wound). 3. Describe the condition shown for disease diagnosis purposes. Provide the findings in clear text format. If the image is unrelated to health/medical symptoms (e.g. a selfie without symptoms, a car, landscape, general object), refuse politely by returning strictly the text: 'OFF_TOPIC'." }
        ]
      }
    });

    const text = response.text || "";
    if (text.includes("OFF_TOPIC")) {
      throw new Error(REFUSAL_MESSAGE);
    }
    return text;
  } catch (error) {
    console.error("Gemini Image Analysis Error:", error);
    throw error;
  }
};

/**
 * NEW: Analyzes Lab Reports and Prescriptions (OCR & Detail Extraction)
 */
export const analyzeMedicalDocument = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<string> => {
  try {
    // Fix: Use gemini-3-flash-preview for advanced vision and OCR
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: `You are an expert medical data transcriber. Analyze this image of a Lab Report or Doctor's Prescription. 
            
            Task:
            1. Extract EVERY single detail visible in the image.
            2. If it is a Lab Report, extract: Patient Name, Date, Test Names, Measured Values, Units, Reference Ranges, and any flagged/abnormal results.
            3. If it is a Prescription, extract: Doctor Name, Patient Name, Date, Medicine Names, Dosages, Frequencies, and Instructions.
            4. Format the output as a clean, structured text summary.
            5. Do NOT summarize or leave out small details. Transcribe everything accurately.
            
            If the image is NOT a medical document, return strictly: "INVALID_DOCUMENT".` 
          }
        ]
      }
    });

    const text = response.text || "";
    if (text.includes("INVALID_DOCUMENT")) {
      throw new Error("The uploaded image does not appear to be a valid medical lab report or prescription.");
    }
    return text;
  } catch (error) {
    console.error("Gemini Document Analysis Error:", error);
    throw error;
  }
};

/**
 * Transcribes audio to text for symptom reporting.
 * Throws an error with a specific message if content is Off-Topic.
 */
export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  try {
    // Fix: Use gemini-3-flash-preview for audio-to-text transcription
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: 'audio/webm', data: base64Audio } },
          { text: "Transcribe the audio to tell the symptoms. If the user is describing health issues, symptoms, or medical concerns, provide the transcription in text form. If the user talks about other topics (e.g. sports, movies, coding, general chat) or asks non-medical questions, refuse politely by returning strictly the text: 'OFF_TOPIC'." }
        ]
      }
    });

    const text = response.text || "";
    if (text.includes("OFF_TOPIC")) {
      throw new Error(REFUSAL_MESSAGE);
    }
    return text;
  } catch (error) {
    console.error("Gemini Audio Transcription Error:", error);
    throw error;
  }
};

/**
 * Generates follow-up questions based on initial symptoms.
 */
export const generateFollowUpQuestions = async (symptoms: string): Promise<string[]> => {
  try {
    // Fix: Use gemini-3-flash-preview and Type.ARRAY for structured JSON output
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: `Analyze this user input describing symptoms: "${symptoms}".
            1. First, check if this is related to health, body, or medical issues. If NOT (e.g. "I like coding", "Hello", "Sports"), return strictly JSON: ["OFF_TOPIC"].
            2. If YES, generate 5 short, relevant, diagnostic follow-up questions to help a doctor understand the case better.
            3. Return ONLY a JSON array of strings.` 
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "A medical follow-up question or 'OFF_TOPIC'."
          }
        }
      }
    });

    const text = response.text || "[]";
    const result = JSON.parse(text);

    if (Array.isArray(result)) {
      if (result.length > 0 && result[0] === "OFF_TOPIC") {
        throw new Error(REFUSAL_MESSAGE);
      }
      return result.slice(0, 5);
    }
    return [];
  } catch (error) {
    // If it's a refusal error, propagate it
    if (error instanceof Error && error.message === REFUSAL_MESSAGE) throw error;
    
    console.error("Gemini Follow-up Error:", error);
    // Fallback if AI parsing fails but it wasn't off-topic
    return [
      "How long have you been experiencing these symptoms?",
      "On a scale of 1-10, how severe is the discomfort?",
      "Do you have any fever or chills?",
      "Have you taken any medications for this recently?",
      "Do you have any known allergies or pre-existing conditions?"
    ];
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data generated");
    }
    return base64Audio;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
};