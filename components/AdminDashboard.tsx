
import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, Doctor, EmergencyAlert, Nurse, Bed, PatientRisk, AISuggestion, Complaint, PatientRecord } from '../types';
import { fetchDashboardData, getDashboardSummary, updateComplaintStatus, handleAiSuggestion, triggerRefreshWebhook, triggerSmarterAlert } from '../services/adminService';
import { 
  LayoutDashboard, Users, CalendarCheck, AlertTriangle, Stethoscope, 
  LogOut, RefreshCw, Bed as BedIcon, Activity, BrainCircuit, 
  MessageSquare, CheckCircle, Search, Filter, ClipboardList, Check, X,
  ChevronDown, ChevronUp, Bell, Settings, Menu, Clock, PieChart, Zap, Truck, UserPlus, CheckCircle2, ArrowUpDown, FileText, Info, Plus, Info as InfoIcon,
  Building2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  appointments: Appointment[];
  doctors: Doctor[];
  emergencyAlerts: EmergencyAlert[];
  onLogout: () => void;
  onUpdateDoctor: (doc: Doctor) => void;
  onResolveAlert: (alertId: string) => void;
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

const AdminDashboard: React.FC<Props> = ({ appointments: initialAppointments, doctors: initialDoctors, emergencyAlerts, onLogout }) => {
  
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
  
  const [sortConfig, setSortConfig] = useState<{ key: 'createdAt' | 'type' | 'priority'; direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, string>>({});

  const refreshAll = async () => {
    setLoading(true);
    try {
      const data = await triggerSmarterAlert();
      // Also refresh complaints from their specific webhook
      await triggerRefreshWebhook();
      
      const updatedData = await fetchDashboardData();
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

  const handleComplaintAction = async (id: string, action: 'assign' | 'solve', value?: string) => {
    setLoading(true);
    if (action === 'solve') await updateComplaintStatus(id, 'Resolved');
    else if (action === 'assign' && value) await updateComplaintStatus(id, 'In Progress', value);
    await refreshAll();
  };

  const handleAIAction = async (suggestionId: string, action: 'Approved' | 'Rejected') => {
    setLoading(true);
    await handleAiSuggestion(suggestionId, action);
    await refreshAll();
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
  }, [commandTab]);

  const appointmentData = [
    { name: 'General', count: summary.appointmentTypes.General, color: '#1abc9c' },
    { name: 'Emerg.', count: summary.appointmentTypes.Emergency, color: '#e74c3c' },
    { name: 'Surgery', count: summary.appointmentTypes.Surgery, color: '#f39c12' },
    { name: 'Followup', count: summary.appointmentTypes.Followup, color: '#3498db' },
  ];

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
             <button onClick={refreshAll} disabled={loading} className="flex items-center gap-2 text-sm font-bold text-teal bg-teal/5 hover:bg-teal/10 px-4 py-2 rounded-full transition-colors border border-teal/20">
               <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {loading ? 'Updating...' : 'Refresh All'}
             </button>
             <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-bold text-xs">AD</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {mainView === 'overview' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                 {[
                   { label: 'Today Appts', val: summary.appointmentsToday, color: 'text-blue-600', icon: <CalendarCheck size={16}/> },
                   { label: 'Total Patients', val: patients.length || summary.totalPatients, color: 'text-gray-800', icon: <Users size={16}/> },
                   { label: 'High Risk', val: summary.highRisk, color: 'text-red-600', icon: <Activity size={16}/> },
                   { label: 'Staff On Duty', val: doctors.length + nurses.filter(n => n.status === 'Active').length, color: 'text-indigo-600', icon: <Users size={16}/> },
                   { label: 'Available Beds', val: beds.filter(b => b.status === 'Available').length, color: 'text-green-600', icon: <BedIcon size={16}/> },
                   { label: 'Pending AI', val: suggestions.filter(s => s.status === 'Pending').length, color: 'text-purple-600', icon: <BrainCircuit size={16}/> },
                 ].map((card, idx) => (
                   <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-28 hover:border-teal/30 transition-all">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{card.label}</span>
                        <div className={`${card.color} opacity-80`}>{card.icon}</div>
                      </div>
                      <div className={`text-2xl font-bold ${card.color}`}>{card.val}</div>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {mainView === 'command' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full animate-[fadeIn_0.2s_ease-out]">
               <div className="border-b border-gray-200 flex overflow-x-auto no-scrollbar">
                 {['patients', 'doctors', 'nurses', 'beds', 'appointments', 'risk', 'ai'].map(tab => (
                   <button key={tab} onClick={() => setCommandTab(tab as any)} className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${commandTab === tab ? 'border-teal text-teal bg-teal/5' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                     {tab === 'ai' ? 'AI Insight' : tab === 'risk' ? 'Critical Logs' : tab}
                   </button>
                 ))}
               </div>

               <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between">
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-teal outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
               </div>

               <div className="flex-1 overflow-auto">
                 <table className="w-full text-left border-collapse">
                   <thead className="bg-gray-100 text-gray-500 uppercase text-[10px] font-bold sticky top-0 z-10 shadow-sm">
                     <tr>
                        {commandTab === 'patients' && <>
                          <th className="p-4">ID</th><th className="p-4">Name</th><th className="p-4">Risk</th>
                          <th className="p-4">Symptoms</th><th className="p-4">Dept</th><th className="p-4">Bed</th>
                        </>}
                        {commandTab === 'doctors' && <>
                          <th className="p-4">ID</th><th className="p-4">Name</th><th className="p-4">Dept</th>
                          <th className="p-4">Specialty</th><th className="p-4 text-center">Load</th><th className="p-4">Status</th>
                        </>}
                        {commandTab === 'nurses' && <>
                          <th className="p-4">ID</th><th className="p-4">Name</th><th className="p-4">Dept</th>
                          <th className="p-4">Shift</th><th className="p-4">Status</th><th className="p-4 text-center">Patients</th>
                        </>}
                        {commandTab === 'beds' && <>
                          <th className="p-4">Bed ID</th><th className="p-4">Type</th><th className="p-4">Patient</th>
                          <th className="p-4">Dept</th><th className="p-4">Status</th>
                        </>}
                        {commandTab === 'appointments' && <>
                          <th className="p-4">Session</th><th className="p-4">Patient</th><th className="p-4">Doctor</th>
                          <th className="p-4">Dept</th><th className="p-4">Date</th><th className="p-4">Status</th>
                        </>}
                        {commandTab === 'risk' && <>
                          <th className="p-4">Session</th><th className="p-4">Patient</th><th className="p-4">Risk</th>
                          <th className="p-4">Summary</th><th className="p-4">Dept</th>
                        </>}
                        {commandTab === 'ai' && <>
                          <th className="p-4">ID</th><th className="p-4">Target</th><th className="p-4">Action</th>
                          <th className="p-4">Reason</th><th className="p-4">Severity</th><th className="p-4">Status</th>
                        </>}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 text-sm">
                      {commandTab === 'patients' && patients.filter(p => String(p.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map((p, i) => (
                        <HighlightRow key={i} isRisk={String(p.riskLevel || '').toLowerCase().includes('high')}>
                          <td className="p-4 font-mono text-[10px] text-gray-400">{p.id}</td><td className="p-4 font-bold text-gray-800">{p.name}</td>
                          <td className="p-4"><StatusBadge status={p.riskLevel}/></td><td className="p-4 text-xs text-gray-500 truncate max-w-[150px]">{p.symptoms}</td>
                          <td className="p-4 text-xs">{p.department}</td><td className="p-4 font-bold text-teal">{p.assignedBed}</td>
                        </HighlightRow>
                      ))}
                      {commandTab === 'doctors' && doctors.filter(d => String(d.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map((d, i) => (
                        <HighlightRow key={i}>
                          <td className="p-4 font-mono text-[10px] text-gray-400">{d.id}</td><td className="p-4 font-bold text-gray-800">{d.name}</td>
                          <td className="p-4 text-xs">{d.department}</td><td className="p-4 text-teal font-medium">{d.specialty}</td>
                          <td className="p-4 text-center font-bold text-gray-700">{d.currentLoad}/{d.maxLoad}</td><td className="p-4"><StatusBadge status={d.status}/></td>
                        </HighlightRow>
                      ))}
                      {commandTab === 'nurses' && nurses.filter(n => String(n.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map((n, i) => (
                        <HighlightRow key={i}>
                          <td className="p-4 font-mono text-[10px] text-gray-400">{n.id}</td><td className="p-4 font-bold text-gray-800">{n.name}</td>
                          <td className="p-4 text-xs">{n.department}</td><td className="p-4 text-xs">{n.shift}</td>
                          <td className="p-4"><StatusBadge status={n.status}/></td><td className="p-4 text-center font-bold">{n.currentPatients}</td>
                        </HighlightRow>
                      ))}
                      {commandTab === 'beds' && beds.filter(b => String(b.number || '').toLowerCase().includes(searchTerm.toLowerCase())).map((b, i) => (
                        <HighlightRow key={i}>
                          <td className="p-4 font-bold text-gray-800">{b.number}</td><td className="p-4 text-xs">{b.type}</td>
                          <td className="p-4 text-xs font-mono">{b.patientId || '-'}</td><td className="p-4 text-xs">{b.department}</td>
                          <td className="p-4"><StatusBadge status={b.status}/></td>
                        </HighlightRow>
                      ))}
                      {commandTab === 'risk' && risks.filter(r => String(r.patientName || '').toLowerCase().includes(searchTerm.toLowerCase())).map((r, i) => (
                        <HighlightRow key={i} isRisk={String(r.riskLevel || '').toLowerCase().includes('high')}>
                          <td className="p-4 font-mono text-[10px] text-gray-400">{r.sessionId}</td><td className="p-4 font-bold text-gray-800">{r.patientName}</td>
                          <td className="p-4"><StatusBadge status={r.riskLevel}/></td><td className="p-4 text-xs leading-relaxed text-gray-600 italic">{r.summary}</td>
                          <td className="p-4 text-xs font-bold text-teal">{r.department}</td>
                        </HighlightRow>
                      ))}
                      {commandTab === 'ai' && suggestions.filter(s => String(s.patientName || '').toLowerCase().includes(searchTerm.toLowerCase())).map((sg, i) => (
                        <HighlightRow key={i} isRisk={sg.critical === 'Yes'}>
                          <td className="p-4 font-mono text-[10px] text-gray-400">{sg.suggestionId}</td><td className="p-4 font-bold text-gray-800">{sg.patientName}</td>
                          <td className="p-4 font-bold text-teal text-xs">{sg.action}</td><td className="p-4 text-xs text-gray-500 italic">{sg.reason}</td>
                          <td className="p-4 text-center"><StatusBadge status={sg.critical === 'Yes' ? 'Critical' : 'Low'}/></td>
                          <td className="p-4"><StatusBadge status={sg.status}/></td>
                        </HighlightRow>
                      ))}
                      {commandTab === 'appointments' && dashboardAppointments.filter(a => String(a.patientName || '').toLowerCase().includes(searchTerm.toLowerCase())).map((a, i) => (
                         <HighlightRow key={i}>
                           <td className="p-4 font-mono text-[10px] text-gray-400">{a.sessionId}</td><td className="p-4 font-bold text-gray-800">{a.patientName}</td>
                           <td className="p-4 text-teal font-medium">{a.doctorName}</td><td className="p-4 text-xs">{a.department}</td>
                           <td className="p-4 text-xs whitespace-nowrap">{a.date}</td><td className="p-4"><StatusBadge status={a.status}/></td>
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
                   <button onClick={() => triggerRefreshWebhook().then(() => refreshAll())} className="flex items-center gap-2 bg-teal/10 text-teal px-4 py-2 rounded-lg text-sm font-bold border border-teal/20">
                     <RefreshCw size={14} /> Refresh
                   </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100 text-gray-500 uppercase text-[10px] font-bold sticky top-0 z-10">
                    <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Details</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Assigned To</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {processedComplaints.map(complaint => (
                      <HighlightRow key={complaint.id} isPending={complaint.status === 'Pending'}>
                        <td className="p-4 font-mono text-[10px] text-gray-400">{complaint.id}</td>
                        <td className="p-4 font-bold text-gray-800">{complaint.name}</td>
                        <td className="p-4">{complaint.type}</td>
                        <td className="p-4 text-xs text-gray-500 truncate max-w-[200px]" title={complaint.details}>{complaint.details}</td>
                        <td className="p-4"><StatusBadge status={complaint.status}/></td>
                        <td className="p-4">{complaint.assignedTo || '-'}</td>
                        <td className="p-4 text-right flex gap-2 justify-end">
                          {complaint.status === 'Pending' && (
                             <button onClick={() => {
                               const staff = window.prompt("Enter staff name to assign:");
                               if (staff) handleComplaintAction(complaint.id, 'assign', staff);
                             }} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Assign">
                               <UserPlus size={16} />
                             </button>
                          )}
                          {complaint.status !== 'Resolved' && (
                            <button onClick={() => handleComplaintAction(complaint.id, 'solve')} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Mark Resolved">
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                        </td>
                      </HighlightRow>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
