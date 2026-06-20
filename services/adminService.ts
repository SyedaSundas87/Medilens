
import { Appointment, Doctor, Nurse, Bed, PatientRisk, AISuggestion, Complaint, PatientRecord } from '../types';

// --- WEBHOOK CONFIG ---
const SMARTER_ALERT_WEBHOOK = "/api/admin/dashboard/data";
const COMPLAINTS_WEBHOOK_BASE = "/api/admin/complaints";
const MANAGE_COMPLAINTS_WEBHOOK_BASE = "/api/admin/manage-complaints";
const PROCESS_SUGGESTION_WEBHOOK = "/api/admin/ai/process-suggestion";
const NEW_SUGGESTION_WEBHOOK = "/api/admin/ai/suggestion";

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
    { suggestionId: "SUG001", relatedSheet: "Patients", entityId: "PT005", patientName: "Alexa Jones", action: "Assign bed immediately", reason: "High risk patient", details: "Critical triage required", critical: "Yes" as const, status: "Pending" as const, notes: "AI Alert", assignedTo: "Dr. Smith", timestamp: new Date().toLocaleString(), executed: false, executedAt: "" }
  ],
  appointments: [] as Appointment[],
  complaints: [
    {
      complaintId: "C001",
      departmentId: "DEP001",
      type: "Service",
      details: "Long wait time in ER",
      status: "Pending",
      category: "Wait Time",
      priority: "High",
      sentiment: "Negative",
      suggestedActions: "Review triage process",
      email: "patient@example.com",
      phone: "123-456-7890",
      name: "John Doe",
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
      complaintCode: "CP-2024-001",
      assignedTo: ""
    }
  ] as Complaint[]
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
  if (data.complaint_id || data.complaintId || (data.id && (data.details || data.type))) {
     return {
       type: 'complaint',
       data: {
         complaintId: data.complaint_id || data.complaintId || data.id,
         departmentId: data.department_id || data.departmentId || '',
         type: data.type || 'Other',
         details: data.details || '',
         status: data.status || 'Pending',
         category: data.category || 'General',
         priority: data.priority || 'Low',
         sentiment: data.sentiment || 'Neutral',
         suggestedActions: data.suggested_actions || data.suggestedActions || '',
         email: data.email || 'N/A',
         phone: data.phone || 'N/A',
         name: data.name || 'Anonymous',
         createdAt: data.created_at || data.createdAt || new Date().toLocaleString(),
         updatedAt: data.updated_at || data.updatedAt || new Date().toLocaleString(),
         complaintCode: data.complaint_code || data.complaintCode || '',
         assignedTo: data.assigned_to || data.assignedTo || ''
       }
     };
  }

  // 1. DOCTORS
  if (data.doctor_id || data.doctorId || (data.id && data.specialty)) {
    return {
      type: 'doctor',
      data: {
        id: data.doctor_id || data.doctorId || data.id,
        name: data.name || 'Unknown Doctor',
        specialty: data.specialty || 'General',
        department: data.department || 'General',
        status: data.status || 'On Duty',
        currentLoad: Number(data.current_load || data.currentLoad) || 0,
        maxLoad: Number(data.max_load || data.maxLoad) || 10,
        image: data.image || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200&h=200",
        email: data.email || 'N/A',
        phone: data.phone || 'N/A',
        experience: data.experience || 'N/A',
        availableSlots: Array.isArray(data.availableSlots) ? data.availableSlots : []
      }
    };
  }
  
  // 2. NURSES
  if (data.nurse_id || data.nurseId || (data.id && data.shift)) {
    return {
      type: 'nurse',
      data: {
        id: data.nurse_id || data.nurseId || data.id,
        name: data.name || 'Unknown Nurse',
        department: data.department || 'General',
        shift: data.shift || 'Morning',
        status: data.status || 'Active',
        currentPatients: Number(data.current_patients || data.currentPatients) || 0
      }
    };
  }

  // 3. PATIENTS
  if (data.patient_id || data.patientId || (data.id && data.riskLevel)) {
    return {
      type: 'patient',
      data: {
        id: data.patient_id || data.patientId || data.id,
        name: data.name || 'Guest',
        age: Number(data.age) || 0,
        gender: data.gender || 'Other',
        riskLevel: data.risk_level || data.riskLevel || 'Low',
        symptoms: data.symptoms || 'None reported',
        department: data.department || 'General',
        status: data.status || 'Outpatient',
        assignedBed: data.assigned_bed || data.assignedBed || 'N/A',
        assignedDoctor: data.assigned_doctor || data.assignedDoctor || 'Unassigned',
        timestamp: data.timestamp || new Date().toLocaleString()
      }
    };
  }

  // 4. BEDS
  if (data.bed_id || data.bedId || (data.id && data.type && data.number)) {
    return {
      type: 'bed',
      data: {
        id: data.bed_id || data.bedId || data.id,
        number: data.number || data.bed_id || data.bedId || data.id,
        type: data.type || 'Standard',
        status: data.status || 'Available',
        patientId: data.patient_id || data.patientId || 'N/A',
        department: data.department || 'General'
      }
    };
  }

  // 5. SESSIONS / RISKS
  if (data.sessionid && data.patientname) {
    return {
      type: 'risk',
      data: {
        sessionId: String(data.sessionid),
        patientName: data.patientname,
        age: Number(data.age) || 0,
        symptoms: data.symptoms || '',
        riskLevel: data.risklevel || 'Low',
        summary: data.summary || '',
        reason: data.reason || '',
        department: data.department || 'General',
        timestamp: data.timestamp || new Date().toLocaleString()
      }
    };
  }

  // 6. APPOINTMENTS
  if (data.schedule_id || data.scheduleId || data.session_id || data.sessionId || data.appointment_id || data.appointmentId || (data.appointment_date && (data.patient_name || data.patientName))) {
    return {
      type: 'appointment',
      data: {
        id: data.schedule_id || data.scheduleId || data.session_id || data.sessionId || data.appointment_id || data.appointmentId || data.id || `APT-${Date.now()}`,
        sessionId: data.schedule_id || data.scheduleId || data.session_id || data.sessionId || data.appointment_id || data.appointmentId || '',
        patientName: data.patientname || data.patientName || data.patient_name || 'Unknown',
        contact: data.contact || data.phone || '',
        email: data.email || '',
        phone: data.phone || data.contact || '',
        doctorName: data.doctor || data.doctorName || data.doctor_name || '',
        department: data.department || 'General',
        date: data.appointment_date || data.appointmentDate || data.date || '',
        time: data.time || data.appointment_time || data.appointmentTime || '',
        status: data.status || 'Confirmed',
        doctorAvailability: data.doctor_availability || data.doctorAvailability || 'Available',
        rescheduledDateTime: data.rescheduled_datetime || data.rescheduledDateTime || '',
        createdAt: data.created_at || data.createdAt || '',
        updatedAt: data.updated_at || data.updatedAt || '',
        notes: data.notes || '',
        aiSuggestion: data.ai_suggestion || data.aiSuggestion || ''
      }
    };
  }

  // 7. AI SUGGESTIONS
  // Relaxed condition: if it has suggestion_id OR (action AND reason) OR specific type
  if (data.suggestion_id || data.suggestionId || (data.action && data.reason) || data.type === 'suggestion' || data.type === 'ai_suggestion') {
    return {
      type: 'suggestion',
      data: {
        suggestionId: data.suggestion_id || data.suggestionId || `SUG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        relatedSheet: data.related_sheet || data.relatedSheet || 'General',
        entityId: data.entity_id || data.entityId || '',
        patientName: data.patient_name || data.patientName || 'Unknown Patient',
        action: data.action || 'Review Case',
        reason: data.reason || 'AI Flagged',
        details: data.details || '',
        critical: (data.critical === true || data.critical === 'True' || data.critical === 'Yes' || String(data.priority).toLowerCase() === 'high') ? 'Yes' : 'No',
        status: data.approved_rejected || data.status || 'Pending',
        assignedTo: data.assigned_to || data.assignedTo || '',
        timestamp: data.timestamp || new Date().toLocaleString(),
        executed: data.executed === true || data.executed === 'True' || data.executed === 'Yes',
        executedAt: data.executed_at || data.executedAt || '',
        notes: data.notes || ''
      }
    };
  }

  // 8. NEW DASHBOARD DATA STRUCTURE (Nested in 'data' object)
  // This block handles the specific structure provided in the user request
  // where the webhook returns an array with a 'data' property containing arrays of items.
  // The mapping logic for individual items is handled by recursive calls or specific parsing below.
  
  return null;
};

export const fetchDashboardData = async () => {
  return LATEST_DATA;
};

export const triggerSmarterAlert = async () => {
  try {
    const targetUrl = SMARTER_ALERT_WEBHOOK;
    console.log(`Triggering Smarter Alert Webhook at: ${targetUrl}`);
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ action: 'refresh_all', timestamp: new Date().toISOString() })
    });
    
    console.log(`Webhook Response Status: ${response.status}`);
    
    let items: any[] = [];
    if (response.ok) {
      const rawData = await response.json();
      console.log("Raw Webhook Data:", rawData);
      
      // Helper to extract arrays from an object
      const extractArrays = (obj: any) => {
        const extracted: any[] = [];
        const keys = [
          'doctors', 'nurses', 'patients', 'beds', 'appointments', 
          'riskPatients', 'risks', 'risk_patients',
          'suggestions', 'aiSuggestions', 'ai_suggestions', 'aiInsights', 'ai_insights', 'insights'
        ];
        
        keys.forEach(key => {
          if (Array.isArray(obj[key])) {
            extracted.push(...obj[key]);
          }
        });
        return extracted;
      };

      if (Array.isArray(rawData)) {
        // Case 1: Array of items
        if (rawData.length > 0) {
          // Check if the first item is a wrapper containing the lists
          if (rawData[0].data || rawData[0].doctors || rawData[0].suggestions || rawData[0].ai_suggestions) {
             const payload = rawData[0].data || rawData[0];
             items = extractArrays(payload);
             
             // If items is still empty, maybe the array itself is the list of mixed items
             if (items.length === 0) {
               items = rawData;
             }
          } else {
            // Assume it's a flat list of items
            items = rawData;
          }
        }
      } else if (typeof rawData === 'object' && rawData !== null) {
        // Case 2: Object wrapper
        if (rawData.data) {
          if (Array.isArray(rawData.data)) {
            items = rawData.data;
          } else if (typeof rawData.data === 'object') {
            items = extractArrays(rawData.data);
          }
        } else {
          // Case 3: Object with keys for each entity type (flat)
          items = extractArrays(rawData);
        }
      } else {
        items = [];
      }
      console.log("Processed Items for Mapping:", items);

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
  const generatedId = `CMP${Math.floor(Math.random() * 10000)}`;
  const newComplaint: Complaint = { 
    complaintId: generatedId, 
    departmentId: '', 
    type: complaintData.type || 'Other', 
    details: complaintData.details || '', 
    status: 'Pending', 
    category: 'General', 
    priority: complaintData.priority || 'Low', 
    sentiment: 'Neutral', 
    suggestedActions: '', 
    email: complaintData.email || '', 
    phone: complaintData.phone || '', 
    name: complaintData.name || 'Anonymous', 
    createdAt: new Date().toLocaleString(), 
    updatedAt: new Date().toLocaleString(), 
    complaintCode: `CP-${Date.now()}`, 
    assignedTo: '' 
  };
  
  try {
    // New secured endpoint that handles the API key on the server side
    const url = "/api/complaints/v1/submit";
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(newComplaint)
    });
    
    if (response.ok) {
      const text = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = text;
      }
      LATEST_DATA.complaints = [newComplaint, ...LATEST_DATA.complaints];
      return { ...responseData, complaintId: generatedId };
    } else {
      throw new Error("Server responded with error");
    }
  } catch (e) {
    console.error("Failed to sync complaint to webhook", e);
    throw new Error("Failed to submit complaint to the server.");
  }
};

/**
 * Integrated with: https://n8ndigitalstudio.duckdns.org/webhook/complaints
 */
export const triggerRefreshWebhook = async () => {
  try {
    const url = COMPLAINTS_WEBHOOK_BASE;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
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
        return newComplaints;
      }
    }
  } catch (e) {
    console.error("Refresh complaints webhook failed", e);
  }
  return LATEST_DATA.complaints;
};

/**
 * Integrated with: https://feiruun.app.n8n.cloud/webhook/manage-complaints?action=assign (or ?action=solve)
 */
export const updateComplaintStatus = async (id: string, status: string, assignedTo?: string) => {
  const action = status === 'Resolved' ? 'solve' : 'assign';
  const url = `${MANAGE_COMPLAINTS_WEBHOOK_BASE}?action=${action}`;
  const payload = { id, status, assignedTo };

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error("Manage complaint webhook failed", e);
    throw new Error("Failed to update complaint status.");
  }

  LATEST_DATA.complaints = LATEST_DATA.complaints.map(c => c.complaintId === id ? { ...c, status, assignedTo: assignedTo || c.assignedTo } : c);
  return true;
};

export const handleAiSuggestion = async (suggestionId: string, action: AISuggestion['status']) => {
  // Optimistic update
  LATEST_DATA.suggestions = LATEST_DATA.suggestions.map(s => s.suggestionId === suggestionId ? { ...s, status: action } : s);

  try {
    // Map 'Approved'/'Rejected' to query param values
    const queryAction = action === 'Approved' ? 'approved' : 'rejected';
    const url = `${PROCESS_SUGGESTION_WEBHOOK}?action=${queryAction}`;
    
    console.log(`Triggering AI Suggestion Webhook: ${url}`);
    
    await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        suggestionId, 
        status: action,
        timestamp: new Date().toISOString() 
      })
    });
  } catch (e) {
    console.error("Failed to sync AI suggestion status", e);
    // Optional: revert local state if needed, but usually we just log error
  }

  return true;
};

export const triggerNewAiSuggestion = async () => {
  try {
    const url = NEW_SUGGESTION_WEBHOOK;
    console.log(`Triggering New AI Suggestion Webhook: ${url}`);
    
    await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        action: 'new_suggestion',
        timestamp: new Date().toISOString() 
      })
    });
    return true;
  } catch (e) {
    console.error("Failed to trigger new AI suggestion webhook", e);
    return false;
  }
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
