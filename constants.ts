
import { Doctor, Appointment } from './types';

// Updated Doctor Data
export const DOCTORS: Doctor[] = [
  {
    id: 'D001',
    name: "Dr. Ayesha Khan",
    specialty: "Cardiology",
    department: "Internal Medicine",
    maxLoad: 25,
    currentLoad: 18,
    email: "ayesha.k@medilens.pk",
    phone: "+92 42 1234 5678",
    experience: "10+ yrs",
    availableSlots: ["Mon 09:00", "Tue 09:00", "Wed 09:00", "Thu 09:00", "Fri 09:00"], 
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200&h=200",
    status: 'On Duty'
  },
  {
    id: 'D002',
    name: "Dr. Ahmed Raza",
    specialty: "Orthopedics",
    department: "Surgery",
    maxLoad: 20,
    currentLoad: 12,
    email: "ahmed.r@medilens.pk",
    phone: "+92 42 1234 5678",
    experience: "12 yrs",
    availableSlots: ["Tue 14:00", "Thu 14:00", "Sat 14:00"],
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200",
    status: 'Surgery'
  },
  {
    id: 'D003',
    name: "Dr. Sana Iqbal",
    specialty: "Pediatrics",
    department: "Child Health",
    maxLoad: 30,
    currentLoad: 28,
    email: "sana.i@medilens.pk",
    phone: "+92 42 1234 5678",
    experience: "8 yrs",
    availableSlots: ["Mon 10:00", "Wed 10:00", "Fri 10:00"],
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200",
    status: 'On Duty'
  },
  {
    id: 'D004',
    name: "Dr. Bilal Malik",
    specialty: "Dermatology",
    department: "Specialist OPD",
    maxLoad: 15,
    currentLoad: 5,
    email: "bilal.m@medilens.pk",
    phone: "+92 42 1234 5678",
    experience: "9 yrs",
    availableSlots: ["Mon 15:00", "Wed 15:00", "Fri 15:00"],
    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200&h=200",
    status: 'Off Duty'
  },
  {
    id: 'D005',
    name: "Dr. Maria Hassan",
    specialty: "Gynecology",
    department: "Obstetrics",
    maxLoad: 20,
    currentLoad: 10,
    email: "maria.h@medilens.pk",
    phone: "+92 42 1234 5678",
    experience: "15 yrs",
    availableSlots: ["Mon 11:00", "Wed 11:00", "Sat 11:00"],
    image: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=200&h=200",
    status: 'On Duty'
  },
  {
    id: 'D006',
    name: "Dr. Farhan Ali",
    specialty: "Neurology",
    department: "Brain & Spine",
    maxLoad: 12,
    currentLoad: 11,
    email: "farhan.a@medilens.pk",
    phone: "+92 42 1234 5678",
    experience: "14 yrs",
    availableSlots: ["Tue 11:00", "Thu 11:00", "Sat 11:00"],
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200&h=200",
    status: 'On Duty'
  }
];

// Updated Appointments to match new Appointment interface
export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    sessionId: 'SESS-001',
    patientName: "Hina Khan",
    contact: "+92 311 1234567",
    doctorName: "Dr. Ayesha Khan",
    department: "Cardiology",
    date: "2025-11-28",
    time: "09:30",
    status: 'Confirmed',
    doctorAvailability: 'Available',
    createdAt: '2025-11-27 10:00 AM',
    updatedAt: '2025-11-27 10:05 AM',
    notes: 'Recurring chest pain issues.'
  },
  {
    id: 'a2',
    sessionId: 'SESS-002',
    patientName: "Ahmed Ali",
    contact: "+92 312 2345678",
    doctorName: "Dr. Ahmed Raza",
    department: "Orthopedics",
    date: "2025-11-28",
    time: "14:30",
    status: 'Confirmed',
    doctorAvailability: 'Busy',
    createdAt: '2025-11-27 11:00 AM',
    updatedAt: '2025-11-27 11:00 AM',
    notes: 'Follow-up for knee surgery.'
  },
  {
    id: 'a3',
    sessionId: 'SESS-003',
    patientName: "Sara Ahmed",
    contact: "sara.a@domain.com",
    doctorName: "Dr. Farhan Ali",
    department: "Neurology",
    date: "2025-11-28",
    time: "11:00",
    status: 'Pending',
    doctorAvailability: 'Available',
    createdAt: '2025-11-27 01:00 PM',
    updatedAt: '2025-11-27 01:00 PM',
    notes: 'Severe migraine episodes.'
  },
  {
    id: 'a4',
    sessionId: 'SESS-004',
    patientName: "Usman Tariq",
    contact: "+92 314 4567890",
    doctorName: "Dr. Sana Iqbal",
    department: "Pediatrics",
    date: "2025-11-28",
    time: "12:00",
    status: 'Completed',
    doctorAvailability: 'Available',
    createdAt: '2025-11-26 09:00 AM',
    updatedAt: '2025-11-28 12:45 PM',
    notes: 'Routine child check-up.'
  }
];

export const CONTACT_INFO = {
  adminEmail: "info@medilens.pk",
  supportEmail: "info@medilens.pk",
  phone: "+92-42-1234-5678",
  address: "Medilens Hospital, 45 Main Boulevard, Lahore, Pakistan"
};
