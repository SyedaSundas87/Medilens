
import React from 'react';
import { User, Appointment } from '../types';
import { Calendar, Clock, FileText, User as UserIcon, LogOut, Activity, AlertCircle } from 'lucide-react';

interface Props {
  user: User;
  appointments: Appointment[];
  onLogout: () => void;
  onBookNew: () => void; // Redirect to booking
}

const PatientDashboard: React.FC<Props> = ({ user, appointments, onLogout, onBookNew }) => {
  // Filter appointments for this specific user
  const myAppointments = appointments.filter(a => a.patientName === user.name || a.patientId === user.id);
  const myHistory = user.history || [];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-teal font-bold text-xl">
             <UserIcon /> Patient Portal
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 hidden sm:block">Welcome, {user.name}</span>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Sidebar / Stats */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center text-teal mb-4">
                  <UserIcon size={40} />
                </div>
                <h2 className="font-bold text-xl">{user.name}</h2>
                <p className="text-gray-500 text-sm">{user.email}</p>
              </div>
              <div className="mt-6 border-t border-gray-100 pt-6 space-y-3">
                 <div className="flex justify-between text-sm">
                   <span className="text-gray-500">Total Visits</span>
                   <span className="font-semibold">{myAppointments.length}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-gray-500">Symptom Checks</span>
                   <span className="font-semibold text-teal">{myHistory.length}</span>
                 </div>
              </div>
            </div>

            <button 
              onClick={onBookNew}
              className="w-full bg-teal hover:bg-teal-dark text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Calendar size={18} /> Book New Appointment
            </button>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Appointments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <Calendar className="text-teal" size={20} /> My Appointments
                </h3>
              </div>
              
              {myAppointments.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  You have no appointments scheduled.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {myAppointments.map((apt) => (
                    <div key={apt.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-bold text-gray-800">{apt.doctorName}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1"><Clock size={14} /> {apt.date} at {apt.time}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium 
                        ${apt.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 
                          apt.status === 'Pending' ? 'bg-blue-100 text-blue-700' : 
                          apt.status === 'Completed' ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'}`}>
                        {apt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Symptom Checks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <FileText className="text-blue-primary" size={20} /> Past Symptom Checks
                </h3>
              </div>
              
              {myHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No symptom checks recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {myHistory.map((record) => (
                    <div key={record.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{record.date}</span>
                          <h4 className="font-bold text-gray-800 mt-1">{record.summary}</h4>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                          record.triageLevel === 'emergency' ? 'bg-red-50 text-red-600 border-red-100' : 
                          record.triageLevel === 'urgent' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                          'bg-green-50 text-green-600 border-green-100'
                        }`}>
                          {record.triageLevel}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50/50 p-3 rounded-lg border border-gray-100/50">
                        <span className="font-semibold text-gray-700">Guidance: </span> 
                        {record.guidance.length > 150 ? record.guidance.substring(0, 150) + '...' : record.guidance}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
