
import React, { useState, useRef } from 'react';
import { FileText, Upload, CheckCircle2, ArrowRight, Loader2, AlertCircle, RefreshCw, FileImage, Activity, ShieldCheck, Brain, ChevronRight } from 'lucide-react';
import { analyzeMedicalDocument } from '../services/geminiService';
import { sendLabReportData, LabReportResult } from '../services/labService';

const LabReportAnalyzer: React.FC = () => {
  const [step, setStep] = useState<'upload' | 'review' | 'result'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [extractedText, setExtractedText] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [result, setResult] = useState<LabReportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMimeType(file.type); // Capture correct mime type
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setImagePreview(result);
        setImageBase64(result.split(',')[1]); // Extract base64
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imageBase64) return;
    
    setLoading(true);
    setLoadingText("Scanning document details...");
    setError(null);

    try {
      // Step 1: Gemini Extract with correct MIME type
      const extracted = await analyzeMedicalDocument(imageBase64, mimeType);
      setExtractedText(extracted);
      setStep('review');
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to analyze document.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToSystem = async () => {
    setLoading(true);
    setLoadingText("Consulting with Specialists...");
    setError(null);

    try {
      // Step 2: Send to N8n
      const response = await sendLabReportData(extractedText);
      setResult(response);
      setStep('result');
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to connect to the hospital system.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setImagePreview(null);
    setImageBase64(null);
    setMimeType('image/jpeg');
    setExtractedText('');
    setResult(null);
    setError(null);
  };

  // --- PARSING LOGIC FOR CLEAN OUTPUT ---
  const renderFormattedAnalysis = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    
    return (
      <div className="space-y-4 text-left font-sans">
        {lines.map((line, index) => {
          let trimmed = line.trim();
          if (!trimmed) return null;
          
          // Remove Markdown divider
          if (trimmed.startsWith('---') || trimmed.startsWith('___')) return <hr key={index} className="border-gray-200 my-6" />;

          // 1. HEADERS (###, ##, #)
          // Regex to catch Headers, remove the # and any * inside them
          const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)/);
          if (headerMatch) {
            const cleanHeader = headerMatch[2].replace(/\*/g, '').trim();
            // Determine size based on # count, though we'll standardize mainly on H3 style
            return (
              <div key={index} className="mt-8 mb-4 pb-2 border-b border-teal/20">
                <h3 className="text-xl font-bold text-teal-dark flex items-center gap-2">
                  <Activity size={20} className="text-teal" />
                  {cleanHeader}
                </h3>
              </div>
            );
          }

          // 2. BULLET POINTS (* or -)
          // Handle lines starting with * or - (allowing for indentation)
          const bulletMatch = trimmed.match(/^\s*[\*\-]\s+(.*)/);
          if (bulletMatch) {
            let content = bulletMatch[1];
            
            // Check for "**Key:** Value" pattern
            // Split by the first colon to separate Label from Value
            // Also handle "**Label** - Value" or "**Label** Value"
            
            // We temporarily strip ** to check for the colon structure cleanly
            const cleanCheck = content.replace(/\*\*/g, '');
            const colonIndex = cleanCheck.indexOf(':');

            // If it looks like a Key-Value pair (e.g. "Finding: Normal")
            if (content.includes('**') && colonIndex > -1 && colonIndex < 40) {
                 const label = cleanCheck.substring(0, colonIndex + 1);
                 const value = cleanCheck.substring(colonIndex + 1);
                 
                 return (
                   <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-3 hover:shadow-sm transition-shadow">
                     <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                       <span className="font-bold text-gray-900 min-w-[150px] text-sm uppercase tracking-wide">{label.replace(':', '')}</span>
                       <span className="text-gray-700 text-sm leading-relaxed">{value}</span>
                     </div>
                   </div>
                 );
            }

            // Standard Bullet (Handle bolding inline)
            // Split by ** to toggle bolding
            const parts = content.split('**');
            return (
              <div key={index} className="flex items-start gap-3 mb-3 ml-2">
                <div className="mt-1.5 shrink-0">
                   <div className="w-2 h-2 rounded-full bg-teal/60"></div>
                </div>
                <p className="text-gray-700 leading-relaxed text-sm">
                   {parts.map((part, i) => (i % 2 === 1 ? <strong key={i} className="font-semibold text-gray-900">{part}</strong> : part))}
                </p>
              </div>
            );
          }

          // 3. INDENTED SUB-BULLETS (  * or     *)
          // Usually handled by regex above, but strict indentation handling
          if (/^\s{2,}/.test(line) && (trimmed.startsWith('*') || trimmed.startsWith('-'))) {
             const cleanContent = trimmed.replace(/^[\*\-]\s*/, '').replace(/\*\*/g, '');
             return (
               <div key={index} className="ml-8 mb-2 pl-4 border-l-2 border-gray-200 py-1">
                  <p className="text-sm text-gray-600">{cleanContent}</p>
               </div>
             )
          }

          // 4. BOLD TEXT WRAPPERS (Paragraphs that are just text but might have bolding)
          if (trimmed.includes('**')) {
             const parts = trimmed.split('**');
             return (
               <p key={index} className="text-gray-700 leading-relaxed mb-3">
                 {parts.map((part, i) => (i % 2 === 1 ? <span key={i} className="font-semibold text-gray-900">{part}</span> : part))}
               </p>
             );
          }

          // 5. STANDARD PARAGRAPHS
          return <p key={index} className="text-gray-600 leading-relaxed mb-3">{trimmed}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-10 animate-[fadeIn_0.5s_ease-out]">
        <h2 className="text-4xl font-serif font-bold text-gray-800 mb-4 flex justify-center items-center gap-3">
          <FileText className="text-teal" size={36} /> 
          <span>Lab & Prescription <span className="text-teal">Analyzer</span></span>
        </h2>
        <div className="w-20 h-1 bg-teal mx-auto rounded-full mb-6"></div>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Upload a photo of your medical reports. Our AI digitizes the data and our specialists provide a detailed, easy-to-understand breakdown.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl shadow-teal/10 border border-gray-100 overflow-hidden min-h-[500px] transition-all duration-500">
        
        {/* PROGRESS BAR */}
        <div className="h-2 bg-gray-50 w-full flex">
          <div className={`h-full bg-teal transition-all duration-700 ease-out ${step === 'upload' ? 'w-1/3' : step === 'review' ? 'w-2/3' : 'w-full'}`}></div>
        </div>

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="p-8 md:p-12 flex flex-col items-center justify-center h-full animate-[fadeIn_0.3s_ease-out]">
            <div 
              className={`w-full max-w-xl border-3 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group ${
                imagePreview ? 'border-teal bg-teal/5' : 'border-gray-200 hover:border-teal hover:bg-teal/5'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative w-full">
                  <img src={imagePreview} alt="Preview" className="max-h-72 w-auto mx-auto rounded-xl shadow-lg" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl text-white font-bold backdrop-blur-sm">
                    <RefreshCw className="mr-2" /> Change Image
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-white p-6 rounded-full shadow-lg shadow-teal/10 text-teal mb-6 group-hover:scale-110 transition-transform">
                    <Upload size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Upload Report</h3>
                  <p className="text-gray-500 text-center max-w-xs">Drag & drop or click to upload your lab report or prescription (JPG, PNG)</p>
                </>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>

            {error && (
              <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100 animate-[shake_0.4s_ease-in-out]">
                <AlertCircle size={20} /> <span className="font-medium">{error}</span>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!imagePreview || loading}
              className="mt-10 bg-teal hover:bg-teal-dark text-white text-lg font-bold py-4 px-12 rounded-full shadow-xl shadow-teal/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transition-all transform hover:-translate-y-1"
            >
              {loading ? <><Loader2 className="animate-spin" /> {loadingText}</> : <><Brain size={20} /> Analyze Document</>}
            </button>
          </div>
        )}

        {/* STEP 2: REVIEW EXTRACTION */}
        {step === 'review' && (
          <div className="flex flex-col h-full animate-[fadeIn_0.3s_ease-out]">
            <div className="grid grid-cols-1 md:grid-cols-2 flex-grow min-h-[400px]">
              {/* Left: Image */}
              <div className="p-8 bg-gray-50 border-r border-gray-100 flex flex-col items-center justify-center">
                 <h3 className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-4 flex items-center gap-2 w-full">
                    <FileImage size={14} /> Original Document
                 </h3>
                 <img src={imagePreview!} alt="Original" className="max-h-[500px] w-auto object-contain rounded-lg shadow-md bg-white p-2" />
              </div>

              {/* Right: Extracted Text */}
              <div className="p-8 flex flex-col h-full overflow-hidden">
                <h3 className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                    <FileText size={14} /> Digitized Content
                </h3>
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex-grow overflow-y-auto shadow-inner">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-600 leading-relaxed">
                    {extractedText}
                  </pre>
                </div>
              </div>
            </div>
            
            {/* Actions Footer */}
            <div className="p-6 border-t border-gray-100 bg-white flex justify-between items-center z-10">
                <button 
                  onClick={reset}
                  className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitToSystem}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-blue-200 flex items-center gap-2 transition-all transform hover:-translate-y-1"
                >
                  {loading ? <><Loader2 className="animate-spin" /> {loadingText}</> : <><CheckCircle2 /> Confirm & Analyze</>}
                </button>
            </div>
          </div>
        )}

        {/* STEP 3: RESULT */}
        {step === 'result' && result && (
          <div className="p-8 md:p-12 animate-[fadeIn_0.5s_ease-out]">
            
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-bold text-sm mb-4">
                    <CheckCircle2 size={16} /> Analysis Ready
                </div>
                <h2 className="text-3xl font-serif font-bold text-gray-800">Medical Interpretation</h2>
                <p className="text-gray-500 mt-2">Verified by Medilens Intelligent System</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto">
              {/* Header Strip */}
              <div className="bg-gradient-to-r from-teal to-blue-500 h-2"></div>
              
              <div className="p-8 md:p-10">
                 {/* Render the Cleaned Markdown */}
                 {renderFormattedAnalysis(result.analysis)}

                 {/* Recommendations Section */}
                 {result.recommendations && (
                    <div className="mt-10 pt-8 border-t border-dashed border-gray-200">
                        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                            <h5 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                                <ShieldCheck size={20} /> Recommended Next Steps
                            </h5>
                            <p className="text-blue-900/80 text-sm leading-relaxed">
                                {result.recommendations}
                            </p>
                        </div>
                    </div>
                 )}
              </div>
            </div>

            <div className="mt-12 text-center">
                <button
                onClick={reset}
                className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 px-10 rounded-full shadow-lg transition-all flex items-center gap-2 mx-auto"
                >
                <RefreshCw size={18} /> Process Another Report
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabReportAnalyzer;
