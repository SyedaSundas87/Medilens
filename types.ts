
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  experience: string;
  availableSlots: string[];
  image: string;
  status?: 'On Duty' | 'Off Duty' | 'Surgery';
  department?: string;
  maxLoad?: number;
  currentLoad?: number;
}

export interface Nurse {
  id: string;
  name: string;
  department: string;
  shift: 'Morning' | 'Evening' | 'Night';
  status: 'Active' | 'On Leave' | 'Off Duty';
  currentPatients?: number;
}

export interface Bed {
  id: string;
  number: string;
  type: string; // e.g., Semi-Private, ICU, Ventilator
  patientId?: string;
  department: string;
  status: 'Occupied' | 'Available' | 'Maintenance';
}

export interface Appointment {
  id: string;
  sessionId: string;
  patientName: string;
  contact: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
  doctorAvailability: string;
  rescheduledDateTime?: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
  type?: 'General' | 'Emergency' | 'Surgery';
  email?: string;
  phone?: string;
  patientId?: string;
  aiSuggestion?: string;
}

export interface SymptomRecord {
  id: string;
  date: string;
  summary: string;
  guidance: string;
  triageLevel: 'routine' | 'urgent' | 'emergency';
}

export interface EmergencyAlert {
  id: string;
  patientName: string;
  symptoms: string;
  timestamp: string;
  status: 'New' | 'Resolved';
  severity: 'emergency' | 'urgent';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'admin';
  appointments?: Appointment[];
  history?: SymptomRecord[];
}

export interface SymptomResponse {
  symptom_summary: string;
  input_type: 'text' | 'voice' | 'image';
  guidance: string;
  triage_level: 'routine' | 'urgent' | 'emergency';
  specialty_recommendation: string;
  n8n_payload: any;
}

export interface AdminStats {
  totalAppointments: number;
  activeDoctors: number;
  pendingRequests: number;
}

// --- NEW TYPES FOR COMMAND CENTER ---

export interface Complaint {
  complaintId: string;
  departmentId: string;
  type: string;
  details: string;
  status: string;
  category: string;
  priority: string;
  sentiment: string;
  suggestedActions: string;
  email: string;
  phone: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  complaintCode: string;
  assignedTo?: string; // Kept for backward compatibility with existing logic if needed
}

export interface PatientRisk {
  sessionId: string;
  patientName: string;
  age: number;
  symptoms: string;
  riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low';
  summary: string;
  reason: string;
  department: string;
  timestamp: string;
}

export interface AISuggestion {
  suggestionId: string;
  relatedSheet: string;
  entityId: string;
  patientName: string;
  action: string;
  reason: string;
  details: string;
  critical: 'Yes' | 'No';
  status: 'Pending' | 'Approved' | 'Rejected';
  assignedTo?: string;
  timestamp?: string;
  executed?: boolean;
  executedAt?: string;
  notes: string;
}

export interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low';
  symptoms: string;
  department: string;
  status: 'Admitted' | 'Outpatient' | 'In Observation' | 'Discharged';
  assignedBed: string;
  assignedDoctor: string;
  timestamp: string;
}
