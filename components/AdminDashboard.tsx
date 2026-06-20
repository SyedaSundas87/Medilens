
import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, Doctor, EmergencyAlert, Nurse, Bed, PatientRisk, AISuggestion, Complaint, PatientRecord } from '../types';
import { fetchDashboardData, getDashboardSummary, updateComplaintStatus, handleAiSuggestion, triggerRefreshWebhook, triggerSmarterAlert, triggerNewAiSuggestion } from '../services/adminService';
import { 
  LayoutDashboard, Users, CalendarCheck, AlertTriangle, Stethoscope, 
  LogOut, RefreshCw, Bed as BedIcon, Activity, BrainCircuit, 
  MessageSquare, CheckCircle, Search, Filter, ClipboardList, Check, X,
  ChevronDown, ChevronUp, Bell, Settings, Menu, Clock, PieChart as PieChartIcon, Zap, Truck, UserPlus, CheckCircle2, ArrowUpDown, FileText, Info, Plus, Info as InfoIcon,
  Building2, UserRound
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import Footer from './Footer';

interface Props {
  appointments: Appointment[];
  doctors: Doctor[];
  emergencyAlerts: EmergencyAlert[];
  onLogout: () => void;
  onUpdateDoctor: (doc: Doctor) => void;
  onResolveAlert: (alertId: string) => void;
  onViewChange: (view: any) => void;
}

const StatusBadge = ({ status }: { status: string | undefined }) => {
  const s = String(status || 'N/A');
  const lower = s.toLowerCase();
  
  let color = 'bg-gray-100 text-gray-600';
  if (['active', 'available', 'resolved', 'approved', 'on duty', 'completed', 'confirmed', 'admitted', 'yes', 'true'].includes(lower)) color = 'bg-green-100 text-green-700';
  if (['occupied', 'in progress', 'pending', 'on leave', 'in observation', 'outpatient', 'moderate', 'surgery', 'medium'].includes(lower)) color = 'bg-orange-100 text-orange-700';
  if (['maintenance', 'rejected', 'off duty', 'cancelled', 'critical', 'high', 'emergency', 'discharged', 'busy', 'no', 'false'].includes(lower)) color = 'bg-red-100 text-red-700';
  if (['low'].includes(lower)) color = 'bg-blue-100 text-blue-700';
  
  return <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border border-transparent ${color}`}>{s}</span>;
};

interface HighlightRowProps {
  children?: React.ReactNode;
  isRisk?: boolean;
  isPending?: boolean;
}

const HighlightRow: React.FC<HighlightRowProps> = ({ children, isRisk, isPending }) => (
  <tr className={`border-b border-gray-100 transition-colors ${
    isRisk ? 'bg-red-50 hover:bg-red-100' : 
    isPending ? 'bg-orange-50 hover:bg-orange-100' : 
    'hover:bg-teal/5 odd:bg-white even:bg-gray-50'
  }`}>
    {children}
  </tr>
);

const AdminDashboard: React.FC<Props> = ({ appointments: initialAppointments, doctors: initialDoctors, emergencyAlerts, onLogout, onViewChange }) => {
  
  const [mainView, setMainView] = useState<'overview' | 'command' | 'complaints'>('overview');
  const [commandTab, setCommandTab] = useState<'patients' | 'doctors' | 'nurses' | 'beds' | 'appointments' | 'risk' | 'ai'>('patients');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(getDashboardSummary(initialAppointments));
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [risks, setRisks] = useState<PatientRisk[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [dashboardAppointments, setDashboardAppointments] = useState<Appointment[]>(initialAppointments);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'In Progress' | 'Resolved'>('All');
  
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const refreshAll = async () => {
    setLoading(true);
    console.log("Refreshing dashboard data...");
    try {
      const data = await triggerSmarterAlert();
      console.log("Smarter alert data triggered:", data);
      // Also refresh complaints from their specific webhook
      await triggerRefreshWebhook();
      console.log("Complaints webhook triggered");
      
      const updatedData = await fetchDashboardData();
      console.log("Fetched updated dashboard data:", updatedData);
      
      if (updatedData) {
        setNurses(updatedData.nurses || []);
        setBeds(updatedData.beds || []);
        setRisks(updatedData.risks || []);
        setSuggestions(updatedData.suggestions || []);
        setComplaints(updatedData.complaints || []);
        setPatients(updatedData.patients || []);
        setDashboardAppointments(updatedData.appointments.length > 0 ? updatedData.appointments : initialAppointments);
        if (updatedData.doctors && updatedData.doctors.length > 0) setDoctors(updatedData.doctors);
        setSummary(getDashboardSummary(updatedData.appointments.length > 0 ? updatedData.appointments : initialAppointments));
      }
    } catch (e) {
      console.error("Dashboard refresh failed", e);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    refreshAll();
  }, [initialAppointments]);

  const handleRefreshComplaints = async () => {
    setLoading(true);
    try {
      const updatedComplaints = await triggerRefreshWebhook();
      if (updatedComplaints) {
        setComplaints(updatedComplaints);
      }
    } catch (e) {
      console.error("Failed to refresh complaints", e);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const handleComplaintAction = async (id: string, action: 'assign' | 'solve', value?: string) => {
    setLoading(true);
    if (action === 'solve') await updateComplaintStatus(id, 'Resolved');
    else if (action === 'assign' && value) await updateComplaintStatus(id, 'In Progress', value);
    await refreshAll();
  };

  const handleAIAction = async (suggestionId: string, action: 'Approved' | 'Rejected') => {
    // Optimistic update
    setSuggestions(prev => prev.map(s => s.suggestionId === suggestionId ? { ...s, status: action } : s));
    
    // Call service to trigger webhook and update global store
    await handleAiSuggestion(suggestionId, action);
    
    // We do NOT call refreshAll() here to avoid overwriting the optimistic update 
    // with potentially stale data from the server if it hasn't processed the change yet.
  };

  const availableDepartments = useMemo(() => {
    let list: string[] = [];
    switch(commandTab) {
      case 'doctors': list = doctors.map(d => d.department || 'General'); break;
      case 'nurses': list = nurses.map(n => n.department); break;
      case 'beds': list = beds.map(b => b.department); break;
      case 'patients': list = patients.map(p => p.department); break;
      case 'appointments': list = dashboardAppointments.map(a => a.department); break;
      case 'risk': list = risks.map(r => r.department); break;
      default: list = [];
    }
    return Array.from(new Set(list)).filter(Boolean).sort();
  }, [commandTab, doctors, nurses, beds, patients, dashboardAppointments, risks]);

  useEffect(() => {
    setFilterDept('All');
    setSearchTerm('');
    setSortConfig(null);
  }, [commandTab]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data: any[]) => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const renderSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={12} className="ml-1 text-gray-400" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="ml-1 text-teal" /> : <ChevronDown size={12} className="ml-1 text-teal" />;
  };

  const processedComplaints = [...complaints]
    .filter(c => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = (String(c.name || '').toLowerCase().includes(search) || 
                             String(c.details || '').toLowerCase().includes(search));
      const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-30`}>
        <div className="p-4 flex items-center justify-center border-b border-gray-100 h-16">
           {sidebarOpen ? (
             <h1 className="text-xl font-bold text-teal flex items-center gap-2">
               <Activity className="fill-current" /> Medilens<span className="text-gray-400 font-light">Admin</span>
             </h1>
           ) : <Activity className="text-teal" size={28} />}
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button onClick={() => setMainView('overview')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${mainView === 'overview' ? 'bg-teal text-white shadow-md shadow-teal/30' : 'text-gray-600 hover:bg-gray-50'}`}>
            <LayoutDashboard size={20} /> {sidebarOpen && "Dashboard"}
          </button>
          <div className="pt-4 pb-2">
            {sidebarOpen && <p className="text-xs font-bold text-gray-400 uppercase px-3 mb-2">Operations</p>}
            <button onClick={() => { setMainView('command'); setCommandTab('patients'); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${mainView === 'command' ? 'bg-white border border-teal text-teal font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Building2 size={18} /> {sidebarOpen && "Command Center"}
            </button>
          </div>
          <button onClick={() => setMainView('complaints')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${mainView === 'complaints' ? 'bg-teal text-white shadow-md shadow-teal/30' : 'text-gray-600 hover:bg-gray-50'}`}>
            <MessageSquare size={20} /> {sidebarOpen && "Complaints"}
            {sidebarOpen && summary.pendingComplaints > 0 && <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{summary.pendingComplaints}</span>}
          </button>
        </nav>
        <div className="p-4 border-t border-gray-100">
           <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium">
             <LogOut size={18} /> {sidebarOpen && "Logout"}
           </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-teal"><Menu size={20} /></button>
            <h2 className="text-lg font-bold text-gray-700">{mainView === 'overview' ? 'Hospital Overview' : mainView === 'complaints' ? 'Complaint Management' : 'Command Center'}</h2>
          </div>
          <div className="flex items-center gap-4">
             {mainView !== 'complaints' && (
               <button 
                 onClick={refreshAll} 
                 disabled={loading} 
                 className="flex items-center gap-2 text-sm font-bold text-teal bg-teal/5 hover:bg-teal/10 px-4 py-2 rounded-full transition-colors border border-teal/20"
               >
                 <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 
                 {loading ? 'Updating...' : 'Refresh Dashboard'}
               </button>
             )}
             <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-bold text-xs">AD</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {mainView === 'overview' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                   { label: 'Today Appointments', val: dashboardAppointments.length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CalendarCheck size={20}/>, status: 'green' },
                   { label: 'Total Patients', val: patients.length || summary.totalPatients, color: 'text-blue-600', bg: 'bg-blue-50', icon: <Users size={20}/>, status: 'green' },
                   { label: 'Doctors On Duty', val: doctors.filter(d => d.status === 'On Duty').length, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: <Stethoscope size={20}/>, status: 'green' },
                   { label: 'Nurses On Duty', val: nurses.filter(n => n.status === 'Active').length, color: 'text-cyan-600', bg: 'bg-cyan-50', icon: <UserRound size={20}/>, status: 'green' },
                   { label: 'Available Beds', val: beds.filter(b => b.status === 'Available').length, color: beds.filter(b => b.status === 'Available').length < 5 ? 'text-red-600' : 'text-emerald-600', bg: beds.filter(b => b.status === 'Available').length < 5 ? 'bg-red-50' : 'bg-emerald-50', icon: <BedIcon size={20}/>, status: beds.filter(b => b.status === 'Available').length < 5 ? 'red' : 'green' },
                   { label: 'High Risk Patients', val: summary.highRisk, color: summary.highRisk > 0 ? 'text-red-600' : 'text-emerald-600', bg: summary.highRisk > 0 ? 'bg-red-50' : 'bg-emerald-50', icon: <Activity size={20}/>, status: summary.highRisk > 0 ? 'red' : 'green' },
                   { label: 'AI Suggestions', val: suggestions.filter(s => s.status === 'Pending').length, color: suggestions.filter(s => s.status === 'Pending').length > 0 ? 'text-amber-600' : 'text-emerald-600', bg: suggestions.filter(s => s.status === 'Pending').length > 0 ? 'bg-amber-50' : 'bg-emerald-50', icon: <BrainCircuit size={20}/>, status: suggestions.filter(s => s.status === 'Pending').length > 0 ? 'yellow' : 'green' },
                   { label: 'Complaints', val: processedComplaints.filter(c => c.status === 'Pending').length, color: processedComplaints.filter(c => c.status === 'Pending').length > 0 ? 'text-red-600' : 'text-emerald-600', bg: processedComplaints.filter(c => c.status === 'Pending').length > 0 ? 'bg-red-50' : 'bg-emerald-50', icon: <MessageSquare size={20}/>, status: processedComplaints.filter(c => c.status === 'Pending').length > 0 ? 'red' : 'green' },
                 ].map((card, idx) => (
                   <div key={idx} className={`p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-28 hover:border-teal/30 transition-all ${card.bg}`}>
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{card.label}</span>
                        <div className={`${card.color} opacity-80 flex items-center gap-1`}>
                          {card.icon}
                          <div className={`w-2 h-2 rounded-full ${card.status === 'green' ? 'bg-emerald-500' : card.status === 'yellow' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                        </div>
                      </div>
                      <div className={`text-3xl font-bold ${card.color}`}>{card.val}</div>
                   </div>
                 ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patients vs Beds */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Patients vs Beds</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Occupied', value: beds.filter(b => b.status === 'Occupied').length },
                            { name: 'Available', value: beds.filter(b => b.status === 'Available').length }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#FF6B6B" />
                          <Cell fill="#4ECDC4" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Staff Distribution */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Staff Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Doctors', value: doctors.filter(d => d.status === 'On Duty').length },
                            { name: 'Nurses', value: nurses.filter(n => n.status === 'Active').length }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#45B7D1" />
                          <Cell fill="#96CEB4" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* High Risk vs Normal */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">High Risk vs Normal Patients</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'High/Critical Risk', value: summary.highRisk },
                            { name: 'Normal/Low Risk', value: (patients.length || summary.totalPatients) - summary.highRisk }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#FF8A66" />
                          <Cell fill="#A8E6CF" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Appointments by Status */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Appointments by Status</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Confirmed', value: dashboardAppointments.filter(a => a.status === 'Confirmed').length },
                            { name: 'Pending', value: dashboardAppointments.filter(a => a.status === 'Pending').length },
                            { name: 'Completed', value: dashboardAppointments.filter(a => a.status === 'Completed').length },
                            { name: 'Cancelled', value: dashboardAppointments.filter(a => a.status === 'Cancelled').length }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#4D96FF" />
                          <Cell fill="#FFD93D" />
                          <Cell fill="#6BCB77" />
                          <Cell fill="#FF6B6B" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* AI Dashboard Summary */}
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <BrainCircuit className="text-teal" size={20} />
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">AI Dashboard Summary</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Hospital operations are steady today with {dashboardAppointments.length} appointments and {patients.length || summary.totalPatients} active patients. Staffing levels are stable with {doctors.filter(d => d.status === 'On Duty').length} doctors and {nurses.filter(n => n.status === 'Active').length} nurses. {summary.highRisk > 0 || processedComplaints.filter(c => c.status === 'Pending').length > 0 ? `${summary.highRisk} high-risk patients and ${processedComplaints.filter(c => c.status === 'Pending').length} complaints require attention.` : 'No immediate high-risk alerts or complaints require attention.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {mainView === 'command' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full animate-[fadeIn_0.2s_ease-out]">
               <div className="border-b border-gray-200 flex overflow-x-auto no-scrollbar">
                 {['patients', 'doctors', 'nurses', 'beds', 'appointments', 'risk', 'ai'].map(tab => (
                   <button key={tab} onClick={() => setCommandTab(tab as any)} className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${commandTab === tab ? 'border-teal text-teal bg-teal/5' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                     {tab === 'ai' ? 'AI Suggestions' : tab === 'risk' ? 'Risk Patients' : tab}
                   </button>
                 ))}
               </div>

               <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative w-full max-w-md">
                      <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                      <input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-teal outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    
                    <div className="relative">
                      <select 
                        className="pl-3 pr-8 py-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-teal outline-none appearance-none bg-white cursor-pointer"
                        value={filterDept}
                        onChange={(e) => setFilterDept(e.target.value)}
                      >
                        <option value="All">All Departments</option>
                        {availableDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 top-3 text-gray-400 pointer-events-none" size={14} />
                    </div>

                    <button 
                      onClick={refreshAll} 
                      disabled={loading} 
                      className="flex items-center gap-2 px-3 py-2 text-teal bg-white hover:bg-teal/5 border border-teal/20 rounded-lg transition-colors text-sm font-medium"
                      title="Refresh Data"
                    >
                      <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>

                    {commandTab === 'ai' && (
                      <button 
                        className="flex items-center gap-2 px-3 py-2 text-white bg-teal hover:bg-teal-700 rounded-lg transition-colors text-sm font-medium shadow-sm"
                        title="New Suggestion"
                        onClick={async () => {
                          await triggerNewAiSuggestion();
                          alert("New suggestion request sent!");
                        }}
                      >
                        <Plus size={16} />
                        <span className="hidden sm:inline">New</span>
                      </button>
                    )}
                  </div>
               </div>

               <div className="flex-1 overflow-auto">
                 <table className="w-full text-left border-collapse">
                   <thead className="bg-gray-100 text-gray-500 uppercase text-[10px] font-bold sticky top-0 z-10 shadow-sm">
                     <tr>
                        {commandTab === 'patients' && <>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('id')}>Patient ID {renderSortIcon('id')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('name')}>Name {renderSortIcon('name')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('age')}>Age {renderSortIcon('age')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('gender')}>Gender {renderSortIcon('gender')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('riskLevel')}>Risk Level {renderSortIcon('riskLevel')}</th>
                          <th className="p-4">Symptoms</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('department')}>Department {renderSortIcon('department')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('status')}>Status {renderSortIcon('status')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('assignedBed')}>Assigned Bed {renderSortIcon('assignedBed')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('assignedDoctor')}>Assigned Doctor {renderSortIcon('assignedDoctor')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('timestamp')}>Timestamp {renderSortIcon('timestamp')}</th>
                          <th className="p-4">Action</th>
                        </>}
                        {commandTab === 'doctors' && <>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('id')}>Doctor ID {renderSortIcon('id')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('name')}>Name {renderSortIcon('name')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('specialty')}>Specialty {renderSortIcon('specialty')}</th>
                          <th className="p-4 text-center cursor-pointer hover:bg-gray-200" onClick={() => handleSort('currentLoad')}>Current Load {renderSortIcon('currentLoad')}</th>
                          <th className="p-4 text-center cursor-pointer hover:bg-gray-200" onClick={() => handleSort('maxLoad')}>Max Load {renderSortIcon('maxLoad')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('department')}>Department {renderSortIcon('department')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('status')}>Status {renderSortIcon('status')}</th>
                        </>}
                        {commandTab === 'nurses' && <>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('id')}>Nurse ID {renderSortIcon('id')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('name')}>Name {renderSortIcon('name')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('shift')}>Shift {renderSortIcon('shift')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('department')}>Department {renderSortIcon('department')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('status')}>Status {renderSortIcon('status')}</th>
                          <th className="p-4 text-center cursor-pointer hover:bg-gray-200" onClick={() => handleSort('currentPatients')}>Current Patients {renderSortIcon('currentPatients')}</th>
                        </>}
                        {commandTab === 'beds' && <>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('number')}>Bed ID {renderSortIcon('number')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('type')}>Type {renderSortIcon('type')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('status')}>Status {renderSortIcon('status')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('patientId')}>Patient ID {renderSortIcon('patientId')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('department')}>Department {renderSortIcon('department')}</th>
                          <th className="p-4">Action</th>
                        </>}
                        {commandTab === 'appointments' && <>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('sessionId')}>Schedule ID {renderSortIcon('sessionId')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('patientName')}>Patient Name {renderSortIcon('patientName')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('email')}>Email {renderSortIcon('email')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('phone')}>Phone {renderSortIcon('phone')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('doctorName')}>Doctor Name {renderSortIcon('doctorName')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('department')}>Department {renderSortIcon('department')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('date')}>Appointment Date {renderSortIcon('date')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('time')}>Appointment Time {renderSortIcon('time')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('status')}>Status {renderSortIcon('status')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('rescheduledDateTime')}>Rescheduled Datetime {renderSortIcon('rescheduledDateTime')}</th>
                          <th className="p-4">Notes</th>
                          <th className="p-4">AI Suggestion</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('createdAt')}>Created At {renderSortIcon('createdAt')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('updatedAt')}>Updated At {renderSortIcon('updatedAt')}</th>
                        </>}
                        {commandTab === 'risk' && <>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('sessionId')}>Session ID {renderSortIcon('sessionId')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('patientName')}>Patient Name {renderSortIcon('patientName')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('age')}>Age {renderSortIcon('age')}</th>
                          <th className="p-4">Symptoms</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('riskLevel')}>Risk Level {renderSortIcon('riskLevel')}</th>
                          <th className="p-4">Summary</th>
                          <th className="p-4">Reason</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('department')}>Department {renderSortIcon('department')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('timestamp')}>Timestamp {renderSortIcon('timestamp')}</th>
                          <th className="p-4">Action</th>
                        </>}
                        {commandTab === 'ai' && <>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('suggestionId')}>Suggestion ID {renderSortIcon('suggestionId')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('relatedSheet')}>Related Sheet {renderSortIcon('relatedSheet')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('entityId')}>Entity ID {renderSortIcon('entityId')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('patientName')}>Patient Name {renderSortIcon('patientName')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('action')}>Action {renderSortIcon('action')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('reason')}>Reason {renderSortIcon('reason')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('details')}>Details {renderSortIcon('details')}</th>
                          <th className="p-4 text-center cursor-pointer hover:bg-gray-200" onClick={() => handleSort('critical')}>Critical {renderSortIcon('critical')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('status')}>Approved/Rejected {renderSortIcon('status')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('assignedTo')}>Assigned To {renderSortIcon('assignedTo')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('timestamp')}>Created At {renderSortIcon('timestamp')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('executed')}>Executed {renderSortIcon('executed')}</th>
                          <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('executedAt')}>Executed At {renderSortIcon('executedAt')}</th>
                          <th className="p-4">Notes</th>
                        </>}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 text-sm">
                      {commandTab === 'patients' && getSortedData(patients.filter(p => 
                        (String(p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         String(p.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(p.symptoms || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
                        (filterDept === 'All' || p.department === filterDept)
                      )).map((p, i) => (
                        <HighlightRow key={i} isRisk={String(p.riskLevel || '').toLowerCase().includes('high') || String(p.riskLevel || '').toLowerCase().includes('critical')}>
                          <td className="p-4 font-mono text-[10px] text-gray-400">{p.id}</td>
                          <td className="p-4 font-bold text-gray-800">{p.name}</td>
                          <td className="p-4 text-xs">{p.age}</td>
                          <td className="p-4 text-xs">{p.gender}</td>
                          <td className="p-4"><StatusBadge status={p.riskLevel}/></td>
                          <td className="p-4 text-xs text-gray-500 truncate max-w-[150px]" title={p.symptoms}>{p.symptoms}</td>
                          <td className="p-4 text-xs">{p.department}</td>
                          <td className="p-4"><StatusBadge status={p.status}/></td>
                          <td className="p-4 font-bold text-teal">{p.assignedBed}</td>
                          <td className="p-4 text-xs">{p.assignedDoctor}</td>
                          <td className="p-4 text-[10px] text-gray-400">{p.timestamp}</td>
                          <td className="p-4 text-xs">
                            <button className="text-blue-600 hover:text-blue-800 font-medium">View</button>
                          </td>
                        </HighlightRow>
                      ))}
                      {commandTab === 'doctors' && getSortedData(doctors.filter(d => 
                        (String(d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         String(d.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(d.specialty || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
                        (filterDept === 'All' || d.department === filterDept)
                      )).map((d, i) => (
                        <HighlightRow key={i}>
                          <td className="p-4 font-mono text-[10px] text-gray-400">{d.id}</td>
                          <td className="p-4 font-bold text-gray-800">{d.name}</td>
                          <td className="p-4 text-teal font-medium">{d.specialty}</td>
                          <td className="p-4 text-center font-bold text-gray-700">{d.currentLoad}</td>
                          <td className="p-4 text-center text-gray-500">{d.maxLoad}</td>
                          <td className="p-4 text-xs">{d.department}</td>
                          <td className="p-4"><StatusBadge status={d.status}/></td>
                        </HighlightRow>
                      ))}
                      {commandTab === 'nurses' && getSortedData(nurses.filter(n => 
                        (String(n.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || String(n.id || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
                        (filterDept === 'All' || n.department === filterDept)
                      )).map((n, i) => (
                        <HighlightRow key={i}>
                          <td className="p-4 font-mono text-[10px] text-gray-400">{n.id}</td>
                          <td className="p-4 font-bold text-gray-800">{n.name}</td>
                          <td className="p-4 text-xs">{n.shift}</td>
                          <td className="p-4 text-xs">{n.department}</td>
                          <td className="p-4"><StatusBadge status={n.status}/></td>
                          <td className="p-4 text-center font-bold">{n.currentPatients}</td>
                        </HighlightRow>
                      ))}
                      {commandTab === 'beds' && getSortedData(beds.filter(b => 
                        (String(b.number || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         String(b.patientId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(b.type || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
                        (filterDept === 'All' || b.department === filterDept)
                      )).map((b, i) => (
                        <HighlightRow key={i}>
                          <td className="p-4 font-bold text-gray-800">{b.number}</td>
                          <td className="p-4 text-xs">{b.type}</td>
                          <td className="p-4"><StatusBadge status={b.status}/></td>
                          <td className="p-4 text-xs font-mono">{b.patientId || '-'}</td>
                          <td className="p-4 text-xs">{b.department}</td>
                          <td className="p-4 text-xs">
                            <button className="text-blue-600 hover:text-blue-800 font-medium">Manage</button>
                          </td>
                        </HighlightRow>
                      ))}
                      {commandTab === 'risk' && getSortedData(risks.filter(r => 
                        (String(r.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         String(r.sessionId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(r.symptoms || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(r.summary || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
                        (filterDept === 'All' || r.department === filterDept)
                      )).map((r, i) => (
                        <HighlightRow key={i} isRisk={String(r.riskLevel || '').toLowerCase().includes('high') || String(r.riskLevel || '').toLowerCase().includes('critical')}>
                          <td className="p-4 font-mono text-[10px] text-gray-400">{r.sessionId}</td>
                          <td className="p-4 font-bold text-gray-800">{r.patientName}</td>
                          <td className="p-4 text-xs">{r.age}</td>
                          <td className="p-4 text-xs text-gray-500 truncate max-w-[150px]" title={r.symptoms}>{r.symptoms}</td>
                          <td className="p-4"><StatusBadge status={r.riskLevel}/></td>
                          <td className="p-4 text-xs leading-relaxed text-gray-600 italic truncate max-w-[200px]" title={r.summary}>{r.summary}</td>
                          <td className="p-4 text-xs text-gray-500 truncate max-w-[150px]" title={r.reason}>{r.reason}</td>
                          <td className="p-4 text-xs font-bold text-teal">{r.department}</td>
                          <td className="p-4 text-[10px] text-gray-400">{r.timestamp}</td>
                          <td className="p-4 text-xs">
                            <button className="text-blue-600 hover:text-blue-800 font-medium">View</button>
                          </td>
                        </HighlightRow>
                      ))}
                      {commandTab === 'ai' && getSortedData(suggestions.filter(s => 
                        (String(s.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         String(s.suggestionId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(s.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(s.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(s.details || '').toLowerCase().includes(searchTerm.toLowerCase()))
                      )).map((sg, i) => (
                        <HighlightRow key={i} isRisk={sg.critical === 'Yes'}>
                          <td className="p-4 font-mono text-[10px] text-gray-400">{sg.suggestionId}</td>
                          <td className="p-4 text-xs">{sg.relatedSheet}</td>
                          <td className="p-4 font-mono text-[10px] text-gray-400">{sg.entityId}</td>
                          <td className="p-4 font-bold text-gray-800">{sg.patientName}</td>
                          <td className="p-4 font-bold text-teal text-xs">{sg.action}</td>
                          <td className="p-4 text-xs text-gray-500 italic">{sg.reason}</td>
                          <td className="p-4 text-xs text-gray-500 whitespace-normal break-words max-w-[300px]">{sg.details}</td>
                          <td className="p-4 text-center"><StatusBadge status={sg.critical === 'Yes' ? 'Critical' : 'Low'}/></td>
                          <td className="p-4">
                            {String(sg.status || 'Pending').toLowerCase() === 'pending' ? (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleAIAction(sg.suggestionId, 'Approved')}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-md border border-green-200 transition-colors" 
                                  title="Approve"
                                >
                                  <Check size={14} />
                                </button>
                                <button 
                                  onClick={() => handleAIAction(sg.suggestionId, 'Rejected')}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-md border border-red-200 transition-colors" 
                                  title="Reject"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <StatusBadge status={sg.status}/>
                            )}
                          </td>
                          <td className="p-4 text-xs">{sg.assignedTo || '-'}</td>
                          <td className="p-4 text-[10px] text-gray-400">{sg.timestamp || '-'}</td>
                          <td className="p-4 text-center"><StatusBadge status={sg.executed ? 'Yes' : 'No'}/></td>
                          <td className="p-4 text-[10px] text-gray-400">{sg.executedAt || '-'}</td>
                          <td className="p-4 text-xs italic text-gray-500 whitespace-normal break-words max-w-[300px]">{sg.notes}</td>
                        </HighlightRow>
                      ))}
                      {commandTab === 'appointments' && getSortedData(dashboardAppointments.filter(a => 
                        (String(a.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         String(a.doctorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(a.sessionId || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
                        (filterDept === 'All' || a.department === filterDept)
                      )).map((a, i) => (
                         <HighlightRow key={i}>
                           <td className="p-4 font-mono text-[10px] text-gray-400">{a.sessionId}</td>
                           <td className="p-4 font-bold text-gray-800">{a.patientName}</td>
                           <td className="p-4 text-xs">{a.email || '-'}</td>
                           <td className="p-4 text-xs">{a.phone || a.contact || '-'}</td>
                           <td className="p-4 text-teal font-medium">{a.doctorName}</td>
                           <td className="p-4 text-xs">{a.department}</td>
                           <td className="p-4 text-xs whitespace-nowrap">{a.date}</td>
                           <td className="p-4 text-xs whitespace-nowrap">{a.time}</td>
                           <td className="p-4"><StatusBadge status={a.status}/></td>
                           <td className="p-4 text-xs text-gray-500">{a.rescheduledDateTime || '-'}</td>
                           <td className="p-4 text-xs italic text-gray-500 truncate max-w-[150px]" title={a.notes}>{a.notes}</td>
                           <td className="p-4 text-xs text-gray-500 truncate max-w-[150px]" title={a.aiSuggestion}>{a.aiSuggestion || '-'}</td>
                           <td className="p-4 text-[10px] text-gray-400">{a.createdAt}</td>
                           <td className="p-4 text-[10px] text-gray-400">{a.updatedAt}</td>
                         </HighlightRow>
                      ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {mainView === 'complaints' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full animate-[fadeIn_0.3s_ease-out]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Complaint Management</h3>
                  <p className="text-sm text-gray-500">Review and resolve patient feedback</p>
                </div>
                <div className="flex gap-4">
                   <div className="relative">
                     <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                     <input type="text" placeholder="Search complaints..." className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-teal outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                   </div>
                   <div className="relative">
                     <select 
                       className="pl-3 pr-8 py-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-teal outline-none appearance-none bg-white cursor-pointer"
                       value={filterStatus}
                       onChange={(e) => setFilterStatus(e.target.value as any)}
                     >
                       <option value="All">All Statuses</option>
                       <option value="Pending">Pending</option>
                       <option value="In Progress">In Progress</option>
                       <option value="Resolved">Resolved</option>
                     </select>
                     <ChevronDown className="absolute right-2 top-3 text-gray-400 pointer-events-none" size={14} />
                   </div>
                   <button onClick={handleRefreshComplaints} className="flex items-center gap-2 bg-teal/10 text-teal px-4 py-2 rounded-lg text-sm font-bold border border-teal/20">
                     <RefreshCw size={14} /> Refresh Complaint
                   </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100 text-gray-500 uppercase text-[10px] font-bold sticky top-0 z-10">
                    <tr>
                      <th className="p-4">Complaint ID</th>
                      <th className="p-4">Dept ID</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Details</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Sentiment</th>
                      <th className="p-4">Suggested Actions</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Created At</th>
                      <th className="p-4">Updated At</th>
                      <th className="p-4">Complaint Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {processedComplaints.map(complaint => (
                      <HighlightRow key={complaint.complaintId} isPending={complaint.status === 'Pending'}>
                        <td className="p-4 font-mono text-[10px] text-gray-400">{complaint.complaintId}</td>
                        <td className="p-4 text-xs">{complaint.departmentId}</td>
                        <td className="p-4 text-xs">{complaint.type}</td>
                        <td className="p-4 text-xs text-gray-500 truncate max-w-[150px]" title={complaint.details}>{complaint.details}</td>
                        <td className="p-4"><StatusBadge status={complaint.status}/></td>
                        <td className="p-4 text-xs">{complaint.category}</td>
                        <td className="p-4 text-xs font-bold">{complaint.priority}</td>
                        <td className="p-4 text-xs">{complaint.sentiment}</td>
                        <td className="p-4 text-xs italic text-gray-500 truncate max-w-[150px]" title={complaint.suggestedActions}>{complaint.suggestedActions}</td>
                        <td className="p-4 text-xs text-gray-400">{complaint.email}</td>
                        <td className="p-4 text-xs text-gray-400">{complaint.phone}</td>
                        <td className="p-4 font-bold text-gray-800">{complaint.name}</td>
                        <td className="p-4 text-[10px] text-gray-400">{complaint.createdAt}</td>
                        <td className="p-4 text-[10px] text-gray-400">{complaint.updatedAt}</td>
                        <td className="p-4 font-mono text-[10px] text-gray-400">{complaint.complaintCode}</td>
                      </HighlightRow>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="mt-auto">
            <Footer onViewChange={onViewChange} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
