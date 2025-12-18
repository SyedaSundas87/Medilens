
import React, { useState, useRef, useEffect } from 'react';
import { Activity, Heart, Menu, X, Volume2, Pause, Loader2, LogIn, UserPlus, Leaf, Utensils, Sun, Zap, Wind, PlusCircle, AlertTriangle, ArrowRight, Stethoscope, Home, CheckCircle2, Info, FileText, Building2, FlaskConical, MessageSquare, Clock, Plus, Phone, ArrowUpRight, Lock } from 'lucide-react';
import SymptomChecker from './components/SymptomChecker';
import DoctorList from './components/DoctorList';
import AdminDashboard from './components/AdminDashboard';
import PatientDashboard from './components/PatientDashboard';
import LabReportAnalyzer from './components/LabReportAnalyzer';
import HospitalInfo from './components/HospitalInfo';
import AuthModal from './components/AuthModal';
import ComplaintWidget from './components/ComplaintWidget'; 
import RagChatWidget from './components/RagChatWidget';
import VoiceBookingSection from './components/VoiceBookingSection';
import { INITIAL_APPOINTMENTS, DOCTORS, CONTACT_INFO } from './constants';
import { Appointment, Doctor, SymptomResponse, User, SymptomRecord, EmergencyAlert } from './types';
import { generateSpeech } from './services/geminiService';
import { bookAppointmentWebhook } from './services/bookingService';
import { updateUser, login } from './services/authService';

// Audio decoding helper
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// PCM to AudioBuffer helper
function pcmToAudioBuffer(data: Uint8Array, ctx: AudioContext, sampleRate: number): AudioBuffer {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

// Formatted Guidance Component
const FormattedGuidance = ({ text }: { text: string }) => {
  const parseSections = (raw: string) => {
    let sections: Record<string, any> = {};
    let general = "";
    const gridKeys = [
      { id: 'homeRemedies', label: 'Home Remedies', icon: <Home size={20} />, textCol: 'text-indigo-700', bgCol: 'bg-indigo-50', border: 'border-indigo-100' },
      { id: 'herbalTreatments', label: 'Herbal Treatments', icon: <Leaf size={20} />, textCol: 'text-emerald-700', bgCol: 'bg-emerald-50', border: 'border-emerald-100' },
      { id: 'diet', label: 'Diet & Nutrition', icon: <Utensils size={20} />, textCol: 'text-orange-700', bgCol: 'bg-orange-50', border: 'border-orange-100' },
      { id: 'exercise', label: 'Physical Activity', icon: <Zap size={20} />, textCol: 'text-blue-700', bgCol: 'bg-blue-50', border: 'border-blue-100' },
      { id: 'yoga', label: 'Yoga & Mindfulness', icon: <Wind size={20} />, textCol: 'text-violet-700', bgCol: 'bg-violet-50', border: 'border-violet-100' },
      { id: 'lifestyleChanges', label: 'Lifestyle Changes', icon: <Sun size={20} />, textCol: 'text-amber-700', bgCol: 'bg-amber-50', border: 'border-amber-100' },
    ];
    try {
      const json = JSON.parse(raw);
      if (typeof json === 'object' && json !== null) {
        ['diagnosis', 'severity', 'firstAid', 'emergencyReason', 'generalWellness', 'General wellness tips'].forEach(k => {
            if (json[k]) sections[k] = json[k];
        });
        gridKeys.forEach(k => {
          if (json[k.id]) sections[k.id] = json[k.id];
        });
        if (!sections.generalWellness && !sections['General wellness tips']) {
             general = json.response || json.summary || json.intro || "";
        }
      }
    } catch (e) {
      general = raw;
    }
    return { general, sections, gridKeys };
  };
  const { general, sections, gridKeys } = parseSections(text);
  const hasSections = Object.keys(sections).length > 0;
  const renderContent = (content: any) => {
    if (Array.isArray(content)) {
      if (content.length === 0) return <span className="text-gray-400 italic text-sm">None</span>;
      return (
        <ul className="space-y-2.5 mt-2">
          {content.map((item, idx) => (
            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-teal mt-0.5 shrink-0" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      );
    }
    if (typeof content === 'string') {
        if (content.includes('\n')) {
             return (
                <ul className="space-y-2.5 mt-2">
                {content.split('\n').map((item, idx) => item.trim() && (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-teal mt-0.5 shrink-0" />
                        <span className="leading-relaxed">{item.replace(/^- /, '')}</span>
                    </li>
                ))}
                </ul>
             );
        }
        return <p className="text-sm text-gray-700 leading-relaxed mt-1">{content}</p>;
    }
    return null;
  };
  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {(sections.diagnosis || sections.severity) && (
        <div className="bg-gradient-to-br from-teal/5 to-white rounded-2xl p-6 border border-teal/10 flex flex-col md:flex-row gap-6 items-start shadow-sm">
            <div className="bg-white p-4 rounded-full shadow-sm text-teal shrink-0">
                <Stethoscope size={32} />
            </div>
            <div className="flex-grow space-y-3">
                {sections.diagnosis && (
                    <div>
                        <h4 className="text-xs font-bold text-teal uppercase tracking-widest mb-1">Potential Analysis</h4>
                        <h2 className="text-2xl md:text-3xl font-serif text-gray-800">{sections.diagnosis}</h2>
                    </div>
                )}
                {sections.severity && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">Severity Level:</span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                            String(sections.severity).toLowerCase().includes('high') ? 'bg-red-50 text-red-700 border-red-200' :
                            String(sections.severity).toLowerCase().includes('moderate') ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            'bg-green-50 text-green-700 border-green-200'
                        }`}>
                            <Activity size={14} /> {sections.severity}
                        </span>
                    </div>
                )}
            </div>
        </div>
      )}
      {(sections.generalWellness || sections['General wellness tips'] || general) && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-teal"></div>
             <h4 className="flex items-center gap-2 font-bold text-gray-800 text-lg mb-3">
                <Info size={20} className="text-teal" /> General Overview
             </h4>
             <p className="text-gray-600 leading-relaxed text-base">
                {sections.generalWellness || sections['General wellness tips'] || general}
             </p>
        </div>
      )}
      {hasSections && (
        <div>
            <h4 className="font-bold text-gray-800 mb-5 px-1 flex items-center gap-2 font-serif">
                <Leaf size={18} className="text-teal" /> Wellness Recommendations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {gridKeys.map((k) => {
                const content = sections[k.id];
                if (!content || content === 'N/A' || content === 'None' || content === 'null') return null;
                if (Array.isArray(content) && content.length === 0) return null;
                return (
                <div key={k.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-50">
                        <div className={`p-2.5 rounded-lg ${k.bgCol} ${k.textCol}`}>
                            {k.icon}
                        </div>
                        <h5 className="font-bold text-gray-800 text-sm uppercase tracking-wide">{k.label}</h5>
                    </div>
                    <div className="pl-1 flex-grow">
                        {renderContent(content)}
                    </div>
                </div>
                );
            })}
            </div>
        </div>
      )}
      {(sections.firstAid || sections.emergencyReason) && (
        <div className="space-y-4 pt-4 border-t border-gray-100 mt-4">
             {sections.firstAid && sections.firstAid !== 'N/A' && sections.firstAid !== 'None' && (
                <div className="p-5 rounded-xl border bg-red-50 border-red-100 flex gap-4">
                    <div className="bg-white p-2 rounded-full text-red-600 shadow-sm h-fit shrink-0">
                        <PlusCircle size={24} />
                    </div>
                    <div>
                        <h5 className="font-bold text-red-800 mb-1">First Aid / Immediate Actions</h5>
                        <div className="text-red-700/90 text-sm leading-relaxed">
                            {renderContent(sections.firstAid)}
                        </div>
                    </div>
                </div>
             )}
             {sections.emergencyReason && sections.emergencyReason !== 'N/A' && !sections.emergencyReason.toLowerCase().includes('no emergency') && (
                <div className="p-5 rounded-xl border bg-red-100 border-red-200 text-red-900 flex gap-4 items-center animate-pulse">
                    <AlertTriangle size={24} className="shrink-0" />
                    <div>
                        <h5 className="font-bold text-sm uppercase tracking-wide mb-1">Emergency Warning</h5>
                        <p className="font-medium">{sections.emergencyReason}</p>
                    </div>
                </div>
             )}
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'admin' | 'patient' | 'lab-analysis' | 'hospital-info'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Data States
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [doctors, setDoctors] = useState<Doctor[]>(DOCTORS); 
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  
  const [doctorFilter, setDoctorFilter] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<SymptomResponse | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [currentSource, setCurrentSource] = useState<AudioBufferSourceNode | null>(null);
  const resultSectionRef = useRef<HTMLDivElement>(null);

  // Scroll to top whenever the main view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (view !== 'home') {
      setView('home');
      setTimeout(() => {
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(id);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') setView('admin');
    else setView('home'); 
  };

  const handleAdminDemo = async () => {
    try {
      const user = await login('admin@medilens.com', 'admin123');
      handleAuthSuccess(user);
    } catch (e) {
      console.error("Admin demo login failed", e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('home');
  };

  const handleBooking = async (doctor: Doctor, time: string, name: string) => {
    if (!currentUser) return; 
    
    // Create new appointment object
    const now = new Date();
    const formattedNow = now.toLocaleString('en-US', { 
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: true 
    });

    const newAppointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      sessionId: `SESS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      patientName: name,
      patientId: currentUser.id,
      contact: currentUser.email || 'N/A',
      doctorName: doctor.name,
      department: doctor.department || doctor.specialty || 'General',
      date: time.split(' ')[0],
      time: time.split(' ')[1],
      email: currentUser.email,
      phone: '000-000-0000',
      status: 'Confirmed',
      doctorAvailability: 'Available',
      createdAt: formattedNow,
      updatedAt: formattedNow,
      notes: 'Booked via Medilens Online Portal'
    };

    // Update Local App State
    setAppointments([newAppointment, ...appointments]);

    // Persist to User Profile (if patient)
    if (currentUser.role === 'patient') {
      const updatedUser = { 
        ...currentUser, 
        appointments: [newAppointment, ...(currentUser.appointments || [])] 
      };
      await updateUser(updatedUser);
      setCurrentUser(updatedUser);
    }

    try {
      await bookAppointmentWebhook(newAppointment);
      alert(`Appointment Confirmed with ${doctor.name} at ${time.split(' ')[1]}! Details sent to hospital system.`);
    } catch (error) {
      console.error("Booking sync failed:", error);
      alert(`Appointment Confirmed locally, but system sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSymptomResult = async (data: SymptomResponse) => {
    setAiResponse(data);
    setDoctorFilter(null);
    
    // 1. Check for Emergency and Trigger Alert
    if (data.triage_level === 'emergency' || data.triage_level === 'urgent') {
      const newAlert: EmergencyAlert = {
        id: `alert-${Date.now()}`,
        patientName: currentUser ? currentUser.name : 'Guest Patient',
        symptoms: data.symptom_summary,
        timestamp: new Date().toLocaleTimeString(),
        status: 'New',
        severity: data.triage_level
      };
      setEmergencyAlerts(prev => [newAlert, ...prev]);
    }

    // 2. Save to user history if logged in and PERSIST it
    if (currentUser) {
      const newRecord: SymptomRecord = {
        id: `check-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        summary: data.symptom_summary,
        guidance: data.guidance,
        triageLevel: data.triage_level
      };
      
      const updatedUser = { 
        ...currentUser, 
        history: [newRecord, ...(currentUser.history || [])] 
      };
      
      await updateUser(updatedUser);
      setCurrentUser(updatedUser);
    }

    setTimeout(() => {
      resultSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleUpdateDoctor = (updatedDoctor: Doctor) => {
    setDoctors(prevDocs => prevDocs.map(d => d.id === updatedDoctor.id ? updatedDoctor : d));
  };

  const handleResolveAlert = (alertId: string) => {
    setEmergencyAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'Resolved' } : a));
  };

  const handleSpecialistClick = (specialty: string) => {
    if (specialty === "Specialist Review") setDoctorFilter(null);
    else setDoctorFilter(specialty);
    scrollToSection('doctors');
  };

  const handlePlayTTS = async (text: string) => {
    if (isPlayingAudio && currentSource) {
      try { currentSource.stop(); } catch (e) {}
      setCurrentSource(null);
      setIsPlayingAudio(false);
      return;
    }
    try {
      setAudioLoading(true);
      let speechText = text;
      try {
          const json = JSON.parse(text);
          const parts = [];
          if (json.diagnosis) parts.push(`Potential diagnosis: ${json.diagnosis}`);
          if (json.generalWellness) parts.push(json.generalWellness);
          else if (json['General wellness tips']) parts.push(json['General wellness tips']);
          if (json.emergencyReason && json.emergencyReason !== 'N/A') parts.push("Emergency Note: " + json.emergencyReason);
          if (parts.length > 0) speechText = parts.join(". ");
      } catch (e) {}

      const base64Audio = await generateSpeech(speechText.substring(0, 500)); 
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass(); 
      const audioBytes = decodeBase64(base64Audio);
      const audioBuffer = pcmToAudioBuffer(audioBytes, ctx, 24000);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setIsPlayingAudio(false);
        setCurrentSource(null);
        setTimeout(() => ctx.close(), 100); 
      };
      source.start(0);
      setCurrentSource(source);
      setIsPlayingAudio(true);
    } catch (e) {
      console.error("TTS Playback Error:", e);
    } finally {
      setAudioLoading(false);
    }
  };

  if (view === 'admin') {
    return (
      <AdminDashboard 
        appointments={appointments} 
        doctors={doctors} 
        onLogout={handleLogout} 
        onUpdateDoctor={handleUpdateDoctor}
        emergencyAlerts={emergencyAlerts}
        onResolveAlert={handleResolveAlert}
      />
    );
  }

  return (
    <div className="font-sans text-gray-800 bg-cream min-h-screen flex flex-col">
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        onLoginSuccess={handleAuthSuccess}
        initialMode={authMode}
      />
      <ComplaintWidget />
      <RagChatWidget />
      <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('home')}>
            <span className="text-2xl font-serif font-bold text-text-main">Medilens</span>
          </div>
          <nav className="hidden lg:flex items-center gap-10">
            <button onClick={() => { setView('home'); scrollToSection('home'); }} className={`text-sm font-medium transition-colors ${view === 'home' ? 'text-teal' : 'text-text-body hover:text-teal'}`}>Home</button>
            <button onClick={() => { setView('home'); scrollToSection('symptoms'); }} className="text-sm text-text-body hover:text-teal font-medium transition-colors">Symptoms</button>
            <button onClick={() => setView('lab-analysis')} className={`text-sm font-medium transition-colors ${view === 'lab-analysis' ? 'text-teal' : 'text-text-body hover:text-teal'}`}>Lab Reports</button>
            <button onClick={() => setView('hospital-info')} className={`text-sm font-medium transition-colors ${view === 'hospital-info' ? 'text-teal' : 'text-text-body hover:text-teal'}`}>Contact</button>
            {currentUser ? (
              <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                <span className="text-sm font-medium text-text-main">{currentUser.name.split(' ')[0]}</span>
                <button onClick={() => setView(currentUser.role === 'admin' ? 'admin' : 'patient')} className="text-teal font-bold text-sm hover:underline">Dashboard</button>
                <button onClick={handleLogout} className="text-red-500 text-xs hover:text-red-700 uppercase tracking-wide">Logout</button>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                 <button onClick={handleAdminDemo} className="flex items-center gap-1 text-sm font-bold text-teal bg-teal/10 px-4 py-2 rounded-full hover:bg-teal hover:text-white transition-colors">
                   <Lock size={14} /> Admin Demo
                 </button>
                 <button onClick={() => { setAuthMode('login'); setAuthModalOpen(true); }} className="text-teal font-bold text-sm hover:opacity-80 transition-opacity">Login</button>
                <button onClick={() => { setAuthMode('signup'); setAuthModalOpen(true); }} className="bg-teal hover:bg-teal-dark text-white px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2">Join Us <ArrowRight size={14} /></button>
              </div>
            )}
          </nav>
          <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X /> : <Menu />}</button>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 p-4 flex flex-col gap-4 shadow-lg absolute w-full z-50">
            <button onClick={() => { setView('home'); scrollToSection('home'); }} className="text-left hover:text-teal py-2">Home</button>
            <button onClick={() => { setView('home'); scrollToSection('symptoms'); }} className="text-left hover:text-teal py-2">Symptoms</button>
            <button onClick={() => { setView('lab-analysis'); setMobileMenuOpen(false); }} className="text-left hover:text-teal py-2">Lab Reports</button>
            <button onClick={() => { setView('hospital-info'); setMobileMenuOpen(false); }} className="text-left hover:text-teal py-2">Contact</button>
            <hr className="border-gray-100" />
            {currentUser ? (
               <>
                 <div className="font-bold text-teal">{currentUser.name}</div>
                 <button onClick={() => setView(currentUser.role === 'admin' ? 'admin' : 'patient')} className="text-left hover:text-teal py-2">Dashboard</button>
                 <button onClick={handleLogout} className="text-left text-red-500 py-2">Logout</button>
               </>
            ) : (
               <>
                <button onClick={handleAdminDemo} className="text-left hover:text-teal py-2 font-bold text-teal">Admin Demo</button>
                <button onClick={() => { setAuthMode('login'); setAuthModalOpen(true); }} className="text-left hover:text-teal py-2">Login</button>
                <button onClick={() => { setAuthMode('signup'); setAuthModalOpen(true); }} className="text-left font-bold text-teal py-2">Sign Up</button>
               </>
            )}
          </div>
        )}
      </header>
      {view === 'patient' && currentUser ? (
        <PatientDashboard user={currentUser} appointments={appointments} onLogout={handleLogout} onBookNew={() => { setView('home'); setTimeout(() => scrollToSection('doctors'), 100); }} />
      ) : view === 'lab-analysis' ? (
        <main className="flex-grow bg-white"><div className="container mx-auto px-4 py-8"><div className="mb-6"><button onClick={() => setView('home')} className="flex items-center gap-2 text-text-body hover:text-teal transition-colors"><ArrowRight className="rotate-180" size={18} /> Back to Home</button></div><LabReportAnalyzer /></div></main>
      ) : view === 'hospital-info' ? (
        <main className="flex-grow bg-white"><div className="container mx-auto px-4 py-8"><div className="mb-6"><button onClick={() => setView('home')} className="flex items-center gap-2 text-text-body hover:text-teal transition-colors"><ArrowRight className="rotate-180" size={18} /> Back to Home</button></div><HospitalInfo /></div></main>
      ) : (
        <>
          <section id="home" className="relative bg-hero-gradient pt-24 pb-20 lg:pt-32 lg:pb-48 overflow-visible">
            <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
                <div className="max-w-3xl animate-[fadeIn_0.5s_ease-out]">
                    <span className="text-teal font-serif italic text-lg mb-4 block">About Us</span>
                    <h1 className="text-5xl lg:text-7xl font-serif text-text-main leading-tight mb-6">Better Technologies for <span className="text-teal">Healthcare</span></h1>
                    <p className="text-text-body text-lg leading-relaxed mb-8 font-light max-w-2xl mx-auto">If you are in need of high-quality, professional and friendly Medical care, look no further than our clinic. We combine AI with human expertise.</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <button onClick={() => scrollToSection('doctors')} className="bg-teal hover:bg-teal-dark text-white px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-xl">Get Quote Now</button>
                        <button onClick={() => setView('hospital-info')} className="border border-teal text-teal hover:bg-teal hover:text-white px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all">Learn More</button>
                    </div>
                </div>
            </div>
            <div className="hidden lg:flex absolute bottom-0 left-0 right-0 justify-center translate-y-2/3 z-20 container mx-auto px-4 gap-8">
                <div onClick={() => scrollToSection('symptoms')} className="bg-white p-8 shadow-xl w-80 cursor-pointer hover:-translate-y-2 transition-transform group border-t-4 border-teal">
                    <div className="w-14 h-14 bg-teal rounded-full flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform"><Activity size={28} /></div>
                    <h3 className="text-xl font-bold text-gray-800 mb-3">Symptom Check</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">AI-powered symptom analysis is one of the major services that we offer. Check your health instantly.</p>
                </div>
                <div onClick={() => setView('lab-analysis')} className="bg-white p-8 shadow-xl w-80 cursor-pointer hover:-translate-y-2 transition-transform group border-t-4 border-teal">
                    <div className="w-14 h-14 bg-teal rounded-full flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform"><Stethoscope size={28} /></div>
                    <h3 className="text-xl font-bold text-gray-800 mb-3">Lab Analysis</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Upload reports and get detailed breakdowns. We offer comprehensive digital analysis services.</p>
                </div>
                <div onClick={() => setView('hospital-info')} className="bg-white p-8 shadow-xl w-80 cursor-pointer hover:-translate-y-2 transition-transform group border-t-4 border-teal">
                    <div className="w-14 h-14 bg-teal rounded-full flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform"><PlusCircle size={28} /></div>
                    <h3 className="text-xl font-bold text-gray-800 mb-3">Emergency Help</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Emergency help is one of the major services that we offer. Contact us 24/7 for immediate support.</p>
                </div>
            </div>
          </section>
          <div className="h-64 hidden lg:block"></div>
          <section id="symptoms" className="py-24 container mx-auto px-4">
             <div className="text-center mb-16"><span className="text-teal font-serif italic text-lg block mb-2">Our Technology</span><h2 className="text-4xl font-serif text-text-main mb-4">Smart Symptom Checker</h2><div className="w-20 h-0.5 bg-teal mx-auto"></div><p className="text-text-body mt-6 max-w-2xl mx-auto">Use our advanced AI to analyze your symptoms via text, voice, or images. Get instant wellness guidance.</p></div>
              <SymptomChecker onResult={handleSymptomResult} />
              {aiResponse && (
                <div ref={resultSectionRef} className="max-w-4xl mx-auto mt-12 animate-[slideInUp_0.3s_ease-out]">
                  <div className={`bg-white shadow-2xl p-8 md:p-12 relative overflow-hidden ${aiResponse.triage_level === 'emergency' ? 'border-l-8 border-red-500' : aiResponse.triage_level === 'urgent' ? 'border-l-8 border-orange-400' : 'border-l-8 border-teal'}`}>
                    <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6"><div><h3 className="text-3xl font-serif text-text-main mb-2">Analysis Results</h3><p className="text-text-body text-sm">Based on your input. Review carefully.</p></div><button onClick={() => handlePlayTTS(aiResponse.guidance)} className="bg-teal/10 hover:bg-teal text-teal hover:text-white px-6 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-2">{audioLoading ? <Loader2 className="animate-spin" size={16} /> : <Volume2 size={16} />} Listen</button></div>
                    <div className="mb-10"><FormattedGuidance text={aiResponse.guidance} /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-gray-100"><div className="bg-gray-50 p-6"><span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Recommendation</span><div className="flex justify-between items-center"><span className="text-xl font-serif text-teal">{aiResponse.specialty_recommendation}</span><button onClick={() => handleSpecialistClick(aiResponse.specialty_recommendation)} className="text-sm font-bold text-text-main hover:text-teal underline">Book Now</button></div></div><div className={`p-6 ${aiResponse.triage_level === 'emergency' ? 'bg-red-50' : aiResponse.triage_level === 'urgent' ? 'bg-orange-50' : 'bg-green-50'}`}><span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Triage Status</span><span className={`text-xl font-bold uppercase ${aiResponse.triage_level === 'emergency' ? 'text-red-600' : aiResponse.triage_level === 'urgent' ? 'text-orange-600' : 'text-green-600'}`}>{aiResponse.triage_level}</span></div></div>
                  </div>
                </div>
              )}
          </section>
          <VoiceBookingSection />
          <section id="doctors" className="py-24 bg-[#F8FDFD]"><div className="container mx-auto px-4"><div className="text-center mb-16"><span className="text-teal font-serif italic text-lg block mb-2">Professional Team</span><h2 className="text-4xl font-serif text-text-main mb-4">Our Qualified Doctors</h2><div className="w-20 h-0.5 bg-teal mx-auto"></div></div><DoctorList currentUser={currentUser} onBook={handleBooking} onRequestLogin={() => { setAuthMode('login'); setAuthModalOpen(true); }} filter={doctorFilter} onClearFilter={() => setDoctorFilter(null)} /></div></section>
        </>
      )}
      <footer className="bg-white border-t border-gray-100 py-16"><div className="container mx-auto px-4"><div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12"><div className="col-span-1 md:col-span-2"><span className="text-3xl font-serif font-bold text-teal block mb-6">Medilens</span><p className="text-text-body leading-relaxed max-w-sm">Leading the way in medical excellence with advanced AI technology and compassionate care.</p></div><div><h4 className="font-bold text-text-main mb-6 uppercase tracking-wider text-sm">Quick Links</h4><ul className="space-y-4 text-text-body text-sm"><li><button onClick={() => setView('home')} className="hover:text-teal">Home</button></li><li><button onClick={() => scrollToSection('doctors')} className="hover:text-teal">Doctors</button></li><li><button onClick={() => setView('lab-analysis')} className="hover:text-teal">Services</button></li><li><button onClick={() => setView('hospital-info')} className="hover:text-teal">Contact</button></li></ul></div><div><h4 className="font-bold text-text-main mb-6 uppercase tracking-wider text-sm">Get in Touch</h4><ul className="space-y-4 text-text-body text-sm"><li className="flex gap-3"><Phone size={18} className="text-teal" /> {CONTACT_INFO.phone}</li><li className="flex gap-3"><MessageSquare size={18} className="text-teal" /> {CONTACT_INFO.supportEmail}</li><li className="flex gap-3"><Building2 size={18} className="text-teal" /> Lahore, Pakistan</li></ul></div></div><div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400"><p>© 2025 Medilens. All rights reserved.</p><div className="flex gap-6 mt-4 md:mt-0"><a href="#" className="hover:text-teal">Privacy Policy</a><a href="#" className="hover:text-teal">Terms of Service</a></div></div></div></footer>
    </div>
  );
};

export default App;
