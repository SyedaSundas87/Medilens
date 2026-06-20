
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, Sparkles, AlertCircle, Mic, MicOff } from 'lucide-react';
import { transcribeAudio } from '../services/geminiService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isError?: boolean;
}

interface RagChatWidgetProps {
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

// Helper: Fetch with Retry for 502/504 errors
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 1000): Promise<Response> {
  try {
    const response = await fetch(url, options);
    // Retry only on server errors (502, 503, 504)
    if (retries > 0 && (response.status === 502 || response.status === 503 || response.status === 504)) {
      console.warn(`Retrying connection to ${url} (Status: ${response.status})... Attempts left: ${retries}`);
      await new Promise(r => setTimeout(r, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    return response;
  } catch (err: any) {
    // Don't retry if user cancelled (AbortError)
    if (err.name === 'AbortError') throw err;
    
    if (retries > 0) {
      console.warn(`Connection failed, retrying... Attempts left: ${retries}`);
      await new Promise(r => setTimeout(r, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw err;
  }
}

const RagChatWidget: React.FC<RagChatWidgetProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "Hello! I'm your Medilens AI Assistant. How can I help you with our services today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setLoading(true);
          try {
            const transcription = await transcribeAudio(base64Audio);
            if (transcription) {
              await sendMessage(transcription);
            }
          } catch (err: any) {
            console.error("Transcription error:", err);
            const errorMsg: Message = {
              id: Date.now().toString(),
              text: err.message || "Could not understand audio. Please try again.",
              sender: 'bot',
              timestamp: new Date(),
              isError: true
            };
            setMessages(prev => [...prev, errorMsg]);
          } finally {
            setLoading(false);
          }
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    await sendMessage(text);
  };

  const sendMessage = async (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // --- SESSION ID MANAGEMENT ---
      let sessionId = sessionStorage.getItem('rag_session_id');
      if (!sessionId) {
        const randomStr = Math.random().toString(36).substring(2, 7);
        sessionId = `user_${Date.now()}_${randomStr}`;
        sessionStorage.setItem('rag_session_id', sessionId);
      }

      // --- NETWORK REQUEST ---
      // Using our backend proxy to avoid CORS issues
      const finalUrl = `/api/rag?sessionId=${sessionId}`;
      
      const payload = {
        chatInput: userMsg.text,
        sessionId: sessionId
      };

      console.log("Triggering RAG Workflow via Backend Proxy:", finalUrl);
      console.log("Payload:", JSON.stringify(payload, null, 2));

      // 120s Timeout Signal (RAG can be slow)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error("RAG Request timed out after 120s");
        controller.abort();
      }, 120000);

      console.log("Starting fetch request...");
      const response = await fetchWithRetry(finalUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      console.log("Response received. Status:", response.status);

      clearTimeout(timeoutId);

      let botText = "I apologize, but I'm having trouble connecting to the server at the moment.";
      let isError = false;

      // --- ERROR HANDLING ---
      if (response.status === 404) {
        console.warn("RAG Webhook 404 - Workflow Inactive.");
        botText = "I'm currently offline (Error 404). Please contact support or check back later.";
        isError = true;
      } else if (response.ok) {
        const responseText = await response.text();
        try {
            const data = JSON.parse(responseText);
            if (data.output) botText = data.output;
            else if (data.text) botText = data.text;
            else if (data.message) botText = data.message;
            else if (data.response) botText = data.response;
            else if (Array.isArray(data) && data.length > 0) {
                 botText = data[0].output || data[0].text || JSON.stringify(data[0]);
            } else {
                 botText = typeof data === 'string' ? data : JSON.stringify(data);
            }
        } catch (e) {
            botText = responseText;
        }
      } else {
        console.error("Webhook Error Status:", response.status);
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("Error Response Body:", errorText);
        isError = true;
        if (response.status === 404) {
             botText = "I'm currently offline. The AI service is temporarily unavailable. Please try again later.";
        } else if (response.status === 500) {
             botText = "System Error (500). I encountered an internal issue. Please try rephrasing your question.";
        } else if (response.status === 502) {
             botText = "Error 502: Bad Gateway. The AI server is restarting. Please wait a moment.";
        } else if (response.status === 504) {
             botText = "Error 504: Gateway Timeout. The AI took too long to respond. Please try again.";
        } else {
             botText = `Server connection error (${response.status}). Please try again later.`;
        }
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        sender: 'bot',
        timestamp: new Date(),
        isError
      };
      
      setMessages(prev => [...prev, botMsg]);

    } catch (error: any) {
      console.error("Chat Error", error);
      let errorText = "Sorry, I encountered a network error. Please check your connection.";
      
      // Enhanced error check for AbortError or "signal is aborted" messages
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        errorText = "The request timed out. The AI is taking longer than expected. Please try again.";
      }

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 font-sans">
      {/* Trigger Button */}
      {!isOpen && (
        <button
            onClick={() => setIsOpen(true)}
            className="bg-teal hover:bg-teal-dark text-white p-4 rounded-full shadow-lg shadow-teal/30 transition-all duration-300 hover:scale-105 flex items-center gap-3 group"
        >
            <div className="relative">
                <Bot size={28} />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
                </span>
            </div>
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap font-bold text-sm">
                Chat with AI
            </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[350px] md:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-[slideInUp_0.3s_ease-out]">
          
          {/* Header */}
          <div className="bg-teal p-4 flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full text-white">
                <Sparkles size={18} />
              </div>
              <div className="text-white">
                <h3 className="font-bold text-sm leading-tight">Medilens Assistant</h3>
                <div className="flex items-center gap-1.5 opacity-90">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                    <p className="text-[10px] font-medium">Online</p>
                </div>
              </div>
            </div>
            <button 
                onClick={() => setIsOpen(false)} 
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-teal text-white rounded-tr-sm' 
                    : msg.isError 
                        ? 'bg-red-50 text-red-600 border border-red-100 rounded-tl-sm'
                        : 'bg-white text-gray-700 border border-gray-100 rounded-tl-sm'
                }`}>
                  {msg.isError && <AlertCircle size={14} className="inline mr-1 mb-0.5" />}
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
               <div className="flex justify-start">
                 <div className="bg-white text-gray-500 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2 text-xs">
                   <Loader2 size={14} className="animate-spin text-teal" /> 
                   <span className="animate-pulse">Thinking...</span>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100">
             <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={loading}
                  className={`p-2.5 rounded-full transition-all duration-200 ${
                    isRecording 
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  title={isRecording ? "Stop Recording" : "Voice Chat"}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <form onSubmit={handleSendMessage} className="relative flex-1 flex items-center gap-2 bg-gray-50 rounded-full border border-gray-200 px-2 py-2 focus-within:ring-2 focus-within:ring-teal/20 focus-within:border-teal transition-all">
                    <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isRecording ? "Listening..." : "Type your question..."}
                    disabled={isRecording}
                    className="flex-1 bg-transparent border-none text-sm text-gray-700 placeholder-gray-400 focus:ring-0 px-3 py-1 outline-none disabled:opacity-50"
                    />
                    <button 
                    type="submit" 
                    disabled={loading || !inputText.trim() || isRecording}
                    className={`p-2 rounded-full transition-all duration-200 ${
                        !inputText.trim() || isRecording
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-teal text-white shadow-md hover:bg-teal-dark hover:scale-105'
                    }`}
                    >
                    <Send size={16} className={inputText.trim() ? "ml-0.5" : ""} />
                    </button>
                </form>
             </div>
            <div className="text-center mt-2">
                <p className="text-[10px] text-gray-400">AI can make mistakes. Please verify important medical info.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RagChatWidget;
