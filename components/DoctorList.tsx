
import React, { useState } from 'react';
import { DOCTORS } from '../constants';
import { Doctor, User } from '../types';
import { Calendar, Clock, Star, X, User as UserIcon, Loader2, Filter } from 'lucide-react';

interface Props {
  currentUser: User | null;
  onBook: (doctor: Doctor, time: string, name: string) => Promise<void>;
  onRequestLogin: () => void;
  filter?: string | null;
  onClearFilter?: () => void;
}

const DoctorList: React.FC<Props> = ({ currentUser, onBook, onRequestLogin, filter, onClearFilter }) => {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [patientName, setPatientName] = useState(currentUser?.name || '');
  const [isBooking, setIsBooking] = useState(false);

  // Update name if user logs in while modal is open (rare but possible)
  React.useEffect(() => {
    if (currentUser) {
      setPatientName(currentUser.name);
    }
  }, [currentUser]);

  const handleBookClick = (doctor: Doctor) => {
    if (!currentUser) {
      onRequestLogin();
      return;
    }
    setSelectedDoctor(doctor);
    setSelectedSlot('');
    setPatientName(currentUser.name);
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDoctor && selectedSlot && patientName) {
      setIsBooking(true);
      try {
        await onBook(selectedDoctor, selectedSlot, patientName);
        setSelectedDoctor(null);
        setSelectedSlot('');
      } catch (error) {
        // Error handling is mostly done in onBook, but we stop loading here
      } finally {
        setIsBooking(false);
      }
    }
  };

  // --- Filtering Logic ---
  const filteredDoctors = filter 
    ? DOCTORS.filter(doc => doc.specialty.toLowerCase().includes(filter.toLowerCase()) || filter.toLowerCase().includes(doc.specialty.toLowerCase()))
    : DOCTORS;

  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h3 className="text-3xl font-bold text-gray-800 text-center mb-2">Our Specialists</h3>
        <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">Browse our experienced medical professionals.</p>
        
        {/* Filter Badge */}
        {filter && (
          <div className="flex justify-center mb-8 animate-[fadeIn_0.3s_ease-out]">
            <div className="inline-flex items-center gap-2 bg-teal/10 text-teal px-4 py-2 rounded-full border border-teal/20 shadow-sm">
              <Filter size={16} />
              <span className="font-medium">Filtering by: <strong>{filter}</strong></span>
              <button 
                onClick={onClearFilter}
                className="ml-2 hover:bg-teal/20 p-1 rounded-full transition-colors"
                title="Clear Filter"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {filteredDoctors.length === 0 ? (
            <div className="text-center p-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                <p className="text-gray-500 text-lg mb-2">No doctors found matching "{filter}".</p>
                <button 
                  onClick={onClearFilter}
                  className="text-teal font-bold hover:underline"
                >
                  View all doctors
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDoctors.map((doc) => (
                <div key={doc.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-gray-100 flex flex-col group">
                <div className="p-6 flex items-center gap-4 border-b border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-teal opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <img src={doc.image} alt={doc.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-teal" />
                    <div>
                    <h4 className="font-bold text-lg text-gray-800">{doc.name}</h4>
                    <p className="text-teal font-medium">{doc.specialty}</p>
                    <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                        <Star size={12} className="text-yellow-400 fill-current" /> {doc.experience} Experience
                    </p>
                    </div>
                </div>
                <div className="p-6 flex-grow">
                    <p className="text-sm text-gray-500 mb-4">Available Slots:</p>
                    <div className="flex flex-wrap gap-2">
                    {doc.availableSlots.map(slot => (
                        <span key={slot} className="bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">
                        {slot.split(' ')[1]}
                        </span>
                    ))}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                   <p className="text-xs text-center text-teal font-semibold">
                     Use the Voice Agent to book an appointment
                   </p>
                </div>
                </div>
            ))}
            </div>
        )}
      </div>

      {/* Booking Modal (Kept logical code in case needed later, but UI trigger removed) */}
      {selectedDoctor && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-teal p-5 flex justify-between items-center text-white">
              <div>
                <h3 className="font-bold text-lg">Book Appointment</h3>
                <p className="text-teal-100 text-xs">with {selectedDoctor.name}</p>
              </div>
              <button onClick={() => setSelectedDoctor(null)} className="hover:bg-teal-dark p-1 rounded transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={submitBooking} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Time Slot</label>
                <div className="grid grid-cols-2 gap-3">
                  {selectedDoctor.availableSlots.map(slot => (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-3 rounded-lg border text-sm transition-all flex items-center justify-center gap-2 ${selectedSlot === slot ? 'bg-teal text-white border-teal shadow-md' : 'border-gray-200 text-gray-600 hover:border-teal hover:text-teal'}`}
                    >
                      <Clock size={14} />
                      {slot.split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    readOnly
                    value={patientName}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Booking under your account email: {currentUser.email}</p>
              </div>

              <button 
                type="submit" 
                disabled={!selectedSlot || isBooking}
                className="w-full bg-coral hover:bg-red-600 text-white font-bold py-3.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-coral/20 mt-2 flex justify-center items-center gap-2"
              >
                {isBooking ? <Loader2 className="animate-spin" size={20} /> : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorList;
