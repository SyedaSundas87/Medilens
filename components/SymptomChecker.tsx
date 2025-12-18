
import React, { useState, useRef } from 'react';
import { sendToTriage } from '../services/triageService';
import { analyzeImage, transcribeAudio, generateFollowUpQuestions } from '../services/geminiService';
import { SymptomResponse } from '../types';
import { Mic, Image as ImageIcon, Type, Send, Loader2, AlertCircle, FileText, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

interface Props {
  onResult: (data: SymptomResponse) => void;
}

const SymptomChecker: React.FC<Props> = ({ onResult }) => {
  // Navigation State
  const [step, setStep] = useState<'input' | 'followup'>('input');
  
  // Input State
  const [activeTab, setActiveTab] = useState<'text' | 'voice' | 'image'>('text');
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Processing...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Media State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  
  // Data State
  const [processedInitialInput, setProcessedInitialInput] = useState<string>(''); // The text extracted from voice/image/text
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  };

  const switchTab = (tab: 'text' | 'voice' | 'image') => {
    setActiveTab(tab);
    setErrorMsg(null);
  };

  // --- LOGIC: Step 1 (Process Initial Input & Get Questions) ---

  const processInputToQuestions = async (text: string) => {
    setLoading(true);
    setLoadingText("Analyzing symptoms...");
    setErrorMsg(null);
    try {
      // 1. Generate Questions via Gemini
      const generatedQuestions = await generateFollowUpQuestions(text);
      
      // 2. Set State for Step 2
      setProcessedInitialInput(text);
      setQuestions(generatedQuestions);
      setAnswers(new Array(generatedQuestions.length).fill(''));
      setStep('followup');
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Could not analyze symptoms.");
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    await processInputToQuestions(textInput);
  };

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const base64 = await blobToBase64(audioBlob);
        setAudioBase64(base64);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setErrorMsg("Microphone access denied. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleVoiceSubmit = async () => {
    if (!audioBase64) return;
    setLoading(true);
    setLoadingText("Transcribing audio...");
    setErrorMsg(null);
    try {
      // Transcribe first
      const transcription = await transcribeAudio(audioBase64);
      // Then generate questions
      await processInputToQuestions(transcription);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to process audio.");
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageMimeType(file.type);
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
      const base64 = await blobToBase64(file);
      setImageBase64(base64);
      setErrorMsg(null);
    }
  };

  const handleImageSubmit = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setLoadingText("Analyzing medical image...");
    setErrorMsg(null);
    try {
      // Analyze Image first, passing correct Mime Type
      const analysis = await analyzeImage(imageBase64, imageMimeType);
      // Then generate questions
      await processInputToQuestions(analysis);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to analyze image.");
      setLoading(false);
    }
  };

  // --- LOGIC: Step 2 (Submit Final Data to N8n) ---

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setLoadingText("Sending to specialist...");
    setErrorMsg(null);
    
    try {
      // Combine Data
      const finalPayload = `INITIAL REPORT:\n${processedInitialInput}\n\nFOLLOW-UP DETAILS:\n` + 
        questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || 'Not answered'}`).join('\n');
      
      console.log("Sending Payload to N8n:", finalPayload);

      // Send to N8n (Using Test Webhook as requested)
      const result = await sendToTriage('text', finalPayload);
      onResult(result);
      
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to connect to triage.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-w-2xl mx-auto my-8 relative z-10 transition-all duration-300">
      <div className="bg-teal p-6 text-white text-center">
        <h2 className="text-2xl font-bold">
          {step === 'input' ? "How are you feeling today?" : "Just a few more details"}
        </h2>
        <p className="text-teal-100 mt-2">
          {step === 'input' 
            ? "Describe your symptoms for triage assessment." 
            : "Help our AI understand your condition better."}
        </p>
      </div>

      {/* --- STEP 1: INITIAL INPUT --- */}
      {step === 'input' && (
        <>
          <div className="flex border-b border-gray-200">
            <button 
              type="button" onClick={(e) => { e.preventDefault(); switchTab('text'); }}
              className={`flex-1 py-4 flex justify-center items-center gap-2 font-medium transition-colors ${activeTab === 'text' ? 'text-teal border-b-2 border-teal' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Type size={20} /> Text
            </button>
            <button 
              type="button" onClick={(e) => { e.preventDefault(); switchTab('voice'); }}
              className={`flex-1 py-4 flex justify-center items-center gap-2 font-medium transition-colors ${activeTab === 'voice' ? 'text-teal border-b-2 border-teal' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Mic size={20} /> Voice
            </button>
            <button 
              type="button" onClick={(e) => { e.preventDefault(); switchTab('image'); }}
              className={`flex-1 py-4 flex justify-center items-center gap-2 font-medium transition-colors ${activeTab === 'image' ? 'text-teal border-b-2 border-teal' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <ImageIcon size={20} /> Image
            </button>
          </div>

          <div className="p-6 min-h-[250px] flex flex-col justify-between animate-[fadeIn_0.3s_ease-out]">
            <div className="flex-grow">
              {activeTab === 'text' && (
                <div className="space-y-4">
                  <textarea
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent outline-none resize-none h-32 text-gray-700"
                    placeholder="E.g., I have a headache and mild fever..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                  <button
                    type="button" onClick={handleTextSubmit} disabled={loading || !textInput}
                    className="w-full bg-teal hover:bg-teal-dark text-white font-bold py-3 px-6 rounded-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <><Loader2 className="animate-spin" /> {loadingText}</> : <><ArrowRight size={20} /> Continue</>}
                  </button>
                </div>
              )}

              {activeTab === 'voice' && (
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    <button
                      type="button" onClick={isRecording ? stopRecording : startRecording}
                      className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse shadow-red-300 shadow-lg' : 'bg-blue-pastel hover:bg-blue-dark shadow-blue-200 shadow-lg'} text-white`}
                    >
                      <Mic size={32} />
                    </button>
                  </div>
                  <p className="text-gray-600">{isRecording ? "Listening... Tap to stop." : audioBase64 ? "Recording saved." : "Tap microphone to record."}</p>
                  {audioBase64 && (
                    <button
                      type="button" onClick={handleVoiceSubmit} disabled={loading}
                      className="w-full bg-teal hover:bg-teal-dark text-white font-bold py-3 px-6 rounded-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <><Loader2 className="animate-spin" /> {loadingText}</> : <><ArrowRight size={20} /> Continue</>}
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'image' && (
                <div className="space-y-4 text-center">
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-teal hover:bg-teal/5 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-md" />
                    ) : (
                      <div className="text-gray-400 flex flex-col items-center">
                        <ImageIcon size={48} className="mb-2" />
                        <p>Click to upload a photo</p>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>
                  <button
                    type="button" onClick={handleImageSubmit} disabled={loading || !imageBase64}
                    className="w-full bg-teal hover:bg-teal-dark text-white font-bold py-3 px-6 rounded-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <><Loader2 className="animate-spin" /> {loadingText}</> : <><ArrowRight size={20} /> Continue</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* --- STEP 2: FOLLOW-UP QUESTIONS --- */}
      {step === 'followup' && (
        <div className="p-6 animate-[slideInRight_0.3s_ease-out]">
          <div className="mb-6 p-4 bg-teal/5 border border-teal/10 rounded-lg">
            <h4 className="text-xs font-bold text-teal uppercase mb-1">We understood:</h4>
            <p className="text-sm text-gray-700 italic">"{processedInitialInput}"</p>
          </div>

          <form className="space-y-5">
            {questions.map((q, idx) => (
              <div key={idx} className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  {idx + 1}. {q}
                </label>
                <input
                  type="text"
                  value={answers[idx]}
                  onChange={(e) => handleAnswerChange(idx, e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent outline-none text-sm"
                />
              </div>
            ))}
          </form>

          <div className="flex gap-3 mt-8">
            <button 
              type="button" 
              onClick={() => setStep('input')}
              disabled={loading}
              className="px-4 py-3 text-gray-500 font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={18} /> Back
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={loading}
              className="flex-grow bg-teal hover:bg-teal-dark text-white font-bold py-3 px-6 rounded-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg shadow-teal/20"
            >
              {loading ? <><Loader2 className="animate-spin" /> {loadingText}</> : <><CheckCircle2 size={20} /> Analyze & Diagnose</>}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="mx-6 mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2 animate-[shake_0.5s_ease-in-out] border border-red-100">
          <AlertCircle size={20} className="shrink-0 mt-0.5" /> 
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;
