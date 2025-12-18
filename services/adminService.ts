
import { Appointment, Doctor, Nurse, Bed, PatientRisk, AISuggestion, Complaint, PatientRecord } from '../types';

// --- WEBHOOK CONFIG ---
const CORS_PROXY = "https://corsproxy.io/?";
const SMARTER_ALERT_WEBHOOK = "https://feiruun.app.n8n.cloud/webhook-test/smarter-alert";
const COMPLAINTS_WEBHOOK_BASE = "https://feiruun.app.n8n.cloud/webhook/complaints";
const MANAGE_COMPLAINTS_WEBHOOK_BASE = "https://feiruun.app.n8n.cloud/webhook/manage-complaints";

// --- ROBUST FALLBACK DATA (Prevents 404 empty states) ---
const FALLBACK_STORE = {
  doctors: [
    { 
      id: "DR001", 
      name: "Dr. Ben Smith", 
      specialty: "Endocrinologist", 
      department: "Endocrinology", 
      status: "On Duty" as const, 
      currentLoad: 10, 
      maxLoad: 12, 
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200&h=200",
      email: "ben.s@medilens.pk",
      phone: "+92 42 1234 5678",
      experience: "15 yrs",
      availableSlots: ["Mon 09:00", "Wed 09:00"]
    },
    { 
      id: "DR002", 
      name: "Dr. Anya Sharma", 
      specialty: "Dermatology", 
      department: "Dermatology", 
      status: "Surgery" as const, 
      currentLoad: 5, 
      maxLoad: 10, 
      image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200",
      email: "anya.s@medilens.pk",
      phone: "+92 42 1234 5678",
      experience: "10 yrs",
      availableSlots: ["Tue 10:00", "Thu 10:00"]
    }
  ],
  nurses: [
    { id: "NR001", name: "Nurse David Davis", department: "ICU", shift: "Night" as const, status: "Active" as const, currentPatients: 4 },
    { id: "NR002", name: "Nurse Sam Williams", department: "Emergency", shift: "Morning" as const, status: "Active" as const, currentPatients: 7 }
  ],
  patients: [
    { id: "PT005", name: "Alexa Jones", age: 12, gender: "Female" as const, riskLevel: "High" as const, symptoms: "Irregular period", department: "Gynecology", status: "Awaiting Bed" as any, assignedBed: "N/A", assignedDoctor: "Dr. Sana Iqbal", timestamp: new Date().toLocaleString() }
  ],
  beds: [
    { id: "BED001", number: "BED001", type: "ICU", status: "Available" as const, department: "Critical Care" },
    { id: "BED010", number: "BED010", type: "Ward", status: "Occupied" as const, patientId: "PT007", department: "General Ward" }
  ],
  risks: [
    { sessionId: "724014", patientName: "Ivan Drago", age: 75, symptoms: "Fatigue", riskLevel: "Low" as const, summary: "Stable condition.", reason: "Observation", department: "Internal Medicine", timestamp: new Date().toLocaleString() }
  ],
  suggestions: [
    { suggestionId: "SUG001", relatedSheet: "Patients", entityId: "PT005", patientName: "Alexa Jones", action: "Assign bed immediately", reason: "High risk patient", details: "Critical triage required", critical: "Yes" as const, status: "Pending" as const, notes: "AI Alert" }
  ],
  appointments: [] as Appointment[],
  complaints: [] as Complaint[]
};

// --- INTERNAL DATA STORE ---
let LATEST_DATA = {
  nurses: [] as Nurse[],
  beds: [] as Bed[],
  risks: [] as PatientRisk[],
  suggestions: [] as AISuggestion[],
  complaints: [] as Complaint[],
  patients: [] as PatientRecord[],
  doctors: [] as Doctor[],
  appointments: [] as Appointment[]
};

/**
 * Intelligent mapper to translate mixed n8n keys into frontend models.
 */
const mapN8nItem = (item: any): { type: string; data: any } | null => {
  const data = (item && item.json) ? item.json : (item || {});

  // Handle complaint mapping if n8n returns them
  if (data.id && (data.details || data.type)) {
     return {
       type: 'complaint',
       data: {
         id: data.id,
         name: data.name || 'Anonymous',
         contact: data.contact || 'N/A',
         type: data.type || 'Other',
         details: data.details || '',
         priority: data.priority || 'Low',
         status: data.status || 'Pending',
         assignedTo: data.assignedTo || '',
         createdAt: data.createdAt || new Date().toLocaleString(),
         department: data.department || ''
       }
     };
  }

  // 1. DOCTORS
  if (data.doctor_id) {
    return {
      type: 'doctor',
      data: {
        id: data.doctor_id,
        name: data.name || 'Unknown Doctor',
        specialty: data.specialty || 'General',
        department: data.department || 'General',
        status: data.status || 'On Duty',
        currentLoad: Number(data.current_load) || 0,
        maxLoad: Number(data.max_load) || 10,
        image: data.image || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200&h=200",
        email: data.email || 'N/A',
        phone: data.phone || 'N/A',
        experience: data.experience || 'N/A',
        availableSlots: Array.isArray(data.availableSlots) ? data.availableSlots : []
      }
    };
  }
  
  // 2. NURSES
  if (data.nurse_id) {
    return {
      type: 'nurse',
      data: {
        id: data.nurse_id,
        name: data.name || 'Unknown Nurse',
        department: data.department || 'General',
        shift: data.shift || 'Morning',
        status: data.status || 'Active',
        currentPatients: Number(data.current_patients) || 0
      }
    };
  }

  // 3. PATIENTS
  if (data.patient_id) {
    return {
      type: 'patient',
      data: {
        id: data.patient_id,
        name: data.name || 'Guest',
        age: Number(data.age) || 0,
        gender: data.gender || 'Other',
        riskLevel: data.risk_level || 'Low',
        symptoms: data.symptoms || 'None reported',
        department: data.department || 'General',
        status: data.status || 'Outpatient',
        assignedBed: data.assigned_bed || 'N/A',
        assignedDoctor: data.assigned_doctor || 'Unassigned',
        timestamp: data.timestamp || new Date().toLocaleString()
      }
    };
  }

  // 4. BEDS
  if (data.bed_id) {
    return {
      type: 'bed',
      data: {
        id: data.bed_id,
        number: data.bed_id,
        type: data.type || 'Standard',
        status: data.status || 'Available',
        patientId: data.patient_id || 'N/A',
        department: data.department || 'General'
      }
    };
  }

  // 5. SESSIONS / RISKS
  if (data.sessionid && data.patientName && data.summary) {
    return {
      type: 'risk',
      data: {
        sessionId: String(data.sessionid),
        patientName: data.patientName,
        age: Number(data.age) || 0,
        symptoms: data.symptoms || '',
        riskLevel: data.riskLevel || 'Low',
        summary: data.summary || '',
        reason: data.reason || '',
        department: data.department || 'General',
        timestamp: data.timestamp || new Date().toLocaleString()
      }
    };
  }

  // 6. APPOINTMENTS (Keys with spaces from n8n)
  if (data['Session ID']) {
    return {
      type: 'appointment',
      data: {
        id: data['Session ID'],
        sessionId: data['Session ID'],
        patientName: data['Patient Name'],
        contact: data.Contact || '',
        doctorName: data.Doctor || '',
        department: data.Department || 'General',
        date: data['Appointment Date'] || '',
        time: data.Time || '',
        status: data.Status || 'Confirmed',
        doctorAvailability: data['Doctor Availability'] || 'Available',
        rescheduledDateTime: data['Rescheduled Date/Time'] || '',
        createdAt: data['Created At'] || '',
        updatedAt: data['Updated At'] || '',
        notes: data.Notes || ''
      }
    };
  }

  // 7. AI SUGGESTIONS
  if (data.suggestionId) {
    return {
      type: 'suggestion',
      data: {
        suggestionId: data.suggestionId,
        relatedSheet: data.relatedSheet || '',
        entityId: data.entityId || '',
        patientName: data.patientName || '',
        action: data.action || '',
        reason: data.reason || '',
        details: data.details || '',
        critical: data.critical === 'True' ? 'Yes' : 'No',
        status: data.status || 'Pending',
        notes: data.notes || ''
      }
    };
  }

  return null;
};

export const fetchDashboardData = async () => {
  return LATEST_DATA;
};

export const triggerSmarterAlert = async () => {
  try {
    const targetUrl = SMARTER_ALERT_WEBHOOK;
    const proxyUrl = CORS_PROXY + encodeURIComponent(targetUrl);
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refresh_all', timestamp: new Date().toISOString() })
    });
    
    let items = [];
    if (response.ok) {
      const rawData = await response.json();
      items = Array.isArray(rawData) ? rawData : (rawData.data || rawData.items || []);
    } else {
      console.warn(`Webhook Error: ${response.status}. Using local fallbacks.`);
      const merged = { ...FALLBACK_STORE };
      LATEST_DATA = { 
        ...LATEST_DATA, 
        ...merged,
        doctors: merged.doctors as Doctor[],
        nurses: merged.nurses as Nurse[]
      };
      return LATEST_DATA;
    }

    const newStore = {
      nurses: [] as Nurse[],
      beds: [] as Bed[],
      risks: [] as PatientRisk[],
      suggestions: [] as AISuggestion[],
      complaints: LATEST_DATA.complaints,
      patients: [] as PatientRecord[],
      doctors: [] as Doctor[],
      appointments: [] as Appointment[]
    };

    items.forEach((item: any) => {
      const mapped = mapN8nItem(item);
      if (!mapped) return;
      
      switch(mapped.type) {
        case 'doctor': newStore.doctors.push(mapped.data); break;
        case 'nurse': newStore.nurses.push(mapped.data); break;
        case 'patient': newStore.patients.push(mapped.data); break;
        case 'bed': newStore.beds.push(mapped.data); break;
        case 'risk': newStore.risks.push(mapped.data); break;
        case 'appointment': newStore.appointments.push(mapped.data); break;
        case 'suggestion': newStore.suggestions.push(mapped.data); break;
      }
    });

    LATEST_DATA = newStore;
    return LATEST_DATA;
  } catch (e) {
    console.error("Critical Webhook failure. Reverting to safe state.", e);
    return LATEST_DATA;
  }
};

/**
 * Integrated with: https://feiruun.app.n8n.cloud/webhook/complaints?action=submit
 */
export const submitPublicComplaint = async (complaintData: any) => {
  const generatedId = `c-${Date.now()}`;
  const newComplaint = { id: generatedId, ...complaintData, status: 'Pending', createdAt: new Date().toLocaleString() };
  
  try {
    const url = `${COMPLAINTS_WEBHOOK_BASE}?action=submit`;
    const proxyUrl = CORS_PROXY + encodeURIComponent(url);
    await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newComplaint)
    });
  } catch (e) {
    console.error("Failed to sync complaint to webhook", e);
  }

  LATEST_DATA.complaints = [newComplaint, ...LATEST_DATA.complaints];
  return newComplaint;
};

/**
 * Integrated with: https://feiruun.app.n8n.cloud/webhook/complaints?action=refresh
 */
export const triggerRefreshWebhook = async () => {
  try {
    const url = `${COMPLAINTS_WEBHOOK_BASE}?action=refresh`;
    const proxyUrl = CORS_PROXY + encodeURIComponent(url);
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      const items = Array.isArray(data) ? data : (data.items || data.data || []);
      const newComplaints: Complaint[] = [];
      
      items.forEach((item: any) => {
        const mapped = mapN8nItem(item);
        if (mapped && mapped.type === 'complaint') {
          newComplaints.push(mapped.data);
        }
      });

      if (newComplaints.length > 0) {
        LATEST_DATA.complaints = newComplaints;
      }
    }
  } catch (e) {
    console.error("Refresh complaints webhook failed", e);
  }
  return null;
};

/**
 * Integrated with: https://feiruun.app.n8n.cloud/webhook/manage-complaints?action=assign (or ?action=solve)
 */
export const updateComplaintStatus = async (id: string, status: Complaint['status'], assignedTo?: string) => {
  const action = status === 'Resolved' ? 'solve' : 'assign';
  const url = `${MANAGE_COMPLAINTS_WEBHOOK_BASE}?action=${action}`;
  const proxyUrl = CORS_PROXY + encodeURIComponent(url);
  
  const payload = { id, status, assignedTo };

  try {
    await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error("Manage complaint webhook failed", e);
  }

  LATEST_DATA.complaints = LATEST_DATA.complaints.map(c => c.id === id ? { ...c, status, assignedTo: assignedTo || c.assignedTo } : c);
  return true;
};

export const handleAiSuggestion = async (suggestionId: string, action: AISuggestion['status']) => {
  LATEST_DATA.suggestions = LATEST_DATA.suggestions.map(s => s.suggestionId === suggestionId ? { ...s, status: action } : s);
  return true;
};

export const getDashboardSummary = (appointments: Appointment[]) => {
  const activeAppts = LATEST_DATA.appointments.length > 0 ? LATEST_DATA.appointments : appointments;
  
  return {
    totalPatients: LATEST_DATA.patients.length || 120,
    highRisk: LATEST_DATA.risks.filter(r => String(r.riskLevel || '').toLowerCase().includes('high')).length,
    appointmentsToday: activeAppts.length || 8,
    activeAppointments: activeAppts.filter(a => a.status !== 'Completed').length,
    completedAppointments: activeAppts.filter(a => a.status === 'Completed').length,
    totalComplaints: LATEST_DATA.complaints.length,
    pendingComplaints: LATEST_DATA.complaints.filter(c => c.status === 'Pending').length,
    newComplaintsToday: 0,
    avgWaitTime: 18,
    resources: {
      beds: { used: LATEST_DATA.beds.filter(b => b.status === 'Occupied').length, total: LATEST_DATA.beds.length || 20 },
      ventilators: { used: 4, total: 10 },
      surgeryRooms: { used: 3, total: 6 },
      ambulances: { used: 5, total: 8 }
    },
    appointmentTypes: { General: 45, Emergency: 12, Surgery: 8, Followup: 24 }
  };
};
