import React from 'react';
import { Clock, MapPin, Phone, Shield, CreditCard, HelpCircle, Building2, Stethoscope, AlertTriangle, Wifi, CheckCircle2 } from 'lucide-react';

const HospitalInfo: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center animate-[fadeIn_0.5s_ease-out]">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Hospital Information</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about Medilens Hospital services, facilities, and guidelines.
          </p>
        </div>

        {/* 1. Timings & Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Clock className="text-blue-500" /> Hospital Timings
            </h3>
            <ul className="space-y-4 text-sm text-gray-600">
              <li className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="font-medium">OPD (Mon-Sat)</span>
                <span className="text-blue-600 font-bold">8:00 AM - 8:00 PM</span>
              </li>
              <li className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="font-medium">Emergency Unit</span>
                <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded">24/7 Available</span>
              </li>
              <li className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="font-medium">Pharmacy</span>
                <span>8:00 AM - 10:00 PM</span>
              </li>
              <li className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="font-medium">Laboratory</span>
                <span>7:00 AM - 9:00 PM</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="font-medium">Visiting Hours</span>
                <span>10-12 PM & 5-7 PM</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Building2 className="text-blue-400" /> Contact Details
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-500"><MapPin size={20} /></div>
                <div>
                  <h4 className="font-bold text-gray-800">Address</h4>
                  <p className="text-gray-600 text-sm">Medilens Hospital, 45 Main Boulevard, Lahore, Pakistan</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-green-50 p-2 rounded-lg text-green-600"><Phone size={20} /></div>
                <div>
                  <h4 className="font-bold text-gray-800">Phone & Email</h4>
                  <p className="text-gray-600 text-sm">+92-42-1234-5678</p>
                  <p className="text-gray-600 text-sm">info@medilens.pk</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Services & Facilities */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-blue-50/50">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Stethoscope className="text-blue-600" /> Clinical Services
            </h3>
            <p className="text-gray-500 mt-2 text-sm">We offer a wide range of medical services to ensure holistic healthcare.</p>
          </div>
          <div className="p-8">
            <div className="flex flex-wrap gap-3">
              {[
                "General Medicine", "Cardiology", "Orthopedics", "Pediatrics", "Gynecology", 
                "Dermatology", "Radiology & Imaging", "Emergency & Trauma", "Neurology", 
                "ENT", "Gastroenterology", "Endocrinology", "Psychology"
              ].map(service => (
                <span key={service} className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium border border-gray-100 hover:border-blue-300 hover:text-blue-600 transition-colors cursor-default">
                  {service}
                </span>
              ))}
            </div>
          </div>
          
          <div className="p-8 border-t border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Wifi className="text-blue-400" /> Facilities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                "24/7 Emergency & ICU", "In-house Pharmacy", "Ambulance Services", "Diagnostic Lab",
                "Free Wi-Fi & Cafeteria", "Parking Area", "Waiting Lounge", "Private Rooms"
              ].map((facility, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" /> {facility}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Pricing & Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Charges */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-full">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <CreditCard className="text-orange-500" /> Charges & Fees
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-gray-600 font-medium">OPD Consultation</span>
                <span className="font-bold text-gray-800">PKR 2,000 - 3,000</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-gray-600 font-medium">Specialist Consultation</span>
                <span className="font-bold text-gray-800">PKR 3,500 - 5,000</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-gray-600 font-medium">Emergency Assessment</span>
                <span className="font-bold text-gray-800">PKR 1,000</span>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl mt-4">
                <h4 className="font-bold text-orange-800 text-sm mb-3">Room Charges (Per Night)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-orange-900/80">
                    <span>General Ward</span>
                    <span className="font-bold">PKR 5,000</span>
                  </div>
                  <div className="flex justify-between text-orange-900/80">
                    <span>Semi-Private</span>
                    <span className="font-bold">PKR 8,000</span>
                  </div>
                  <div className="flex justify-between text-orange-900/80">
                    <span>Private Room</span>
                    <span className="font-bold">PKR 12,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-full">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Shield className="text-blue-600" /> Rules & Guidelines
            </h3>
            <ul className="space-y-4">
              {[
                "Visitors must carry passes during visiting hours.",
                "Mobile phones must be on silent mode in patient areas.",
                "Smoking and photography are strictly prohibited.",
                "Patients should bring previous medical records.",
                "Discharge begins after doctor's final approval.",
                "Hospital is not responsible for lost belongings."
              ].map((rule, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <AlertTriangle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4. FAQs */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <HelpCircle className="text-purple-500" /> Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-bold text-gray-800 text-sm">How can I book an appointment?</h4>
              <p className="text-gray-500 text-sm">Via our website (Doctors tab) or by calling our reception desk.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-gray-800 text-sm">Is emergency service available at night?</h4>
              <p className="text-gray-500 text-sm">Yes, our emergency department is operational 24/7.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-gray-800 text-sm">Do you offer insurance assistance?</h4>
              <p className="text-gray-500 text-sm">Yes, our billing department helps with insurance documentation.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-gray-800 text-sm">Can attendants stay overnight?</h4>
              <p className="text-gray-500 text-sm">Yes, one attendant is allowed per patient in private rooms.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-gray-800 text-sm">Are telemedicine consultations available?</h4>
              <p className="text-gray-500 text-sm">Yes, for both general and specialist services.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-gray-800 text-sm">How can I get my medical records?</h4>
              <p className="text-gray-500 text-sm">Request them at the reception or via our patient portal.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HospitalInfo;