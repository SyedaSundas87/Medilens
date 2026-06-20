
import React, { useState } from 'react';
import { MessageSquare, X, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { submitPublicComplaint } from '../services/adminService';
import { Complaint } from '../types';

const ComplaintWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'Medical Care Issues' as Complaint['type'],
    priority: 'Low' as Complaint['priority'],
    details: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await submitPublicComplaint(formData);
      
      let message = "Thank you. Your complaint has been submitted.";
      if (result && result.complaintId) {
        message = `Thank you. Your complaint ID is ${result.complaintId} and it has been assigned to our admin team.`;
      } else if (result) {
        if (typeof result === 'string') {
          message = result;
        } else if (typeof result === 'object') {
          if (result.message) {
            message = String(result.message);
          } else {
             message = JSON.stringify(result, null, 2);
          }
        }
      }
      setResponseMessage(message);
      setIsSuccess(true);
      // Reset after 5 seconds to give time to read
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setResponseMessage(null);
        setFormData({ name: '', phone: '', email: '', type: 'Service', priority: 'Low', details: '' });
      }, 5000);
    } catch (error: any) {
      console.error(error);
      setError("Failed to submit complaint. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${isOpen ? 'bg-gray-500' : 'bg-teal animate-bounce'} hover:bg-teal-dark text-white rounded-full p-4 shadow-lg transition-all duration-300 flex items-center gap-2 font-bold`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && <span className="hidden md:inline">Complaint Center</span>}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-[slideInUp_0.3s_ease-out] origin-bottom-right">
          <div className="bg-teal p-4 text-white">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <MessageSquare size={20} /> Submit a Complaint
            </h3>
            <p className="text-teal-100 text-xs">We value your feedback. Help us improve.</p>
          </div>

          <div className="p-6">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center animate-[fadeIn_0.3s_ease-out]">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="font-bold text-gray-800 text-lg">Submitted!</h4>
                <p className="text-gray-500 text-sm whitespace-pre-wrap mt-2">{responseMessage || "Thank you. Your complaint ID has been generated and assigned to our admin team."}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                  <input
                    required
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-teal outline-none"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your Name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                    <input
                      required
                      type="tel"
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-teal outline-none"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+123..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                    <input
                      required
                      type="email"
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-teal outline-none"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-teal outline-none"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  >
                    <option>Medical Care Issues</option>
                    <option>Appointment Issues</option>
                    <option>Staff Behavior</option>
                    <option>Billing Problems</option>
                    <option>Facilities & Cleanliness</option>
                    <option>Pharmacy Issues</option>
                    <option>Lab / Test Reports</option>
                    <option>Emergency Services</option>
                    <option>Technical Issues</option>
                    <option>Other Complaints</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Priority</label>
                  <div className="flex flex-wrap gap-2">
                    {['Low', 'Medium', 'High', 'Emergency'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: p as any })}
                        className={`flex-1 min-w-[70px] py-1.5 text-[10px] font-bold rounded-lg border uppercase ${
                          formData.priority === p 
                          ? (p === 'Emergency' ? 'bg-red-600 text-white border-red-700' : p === 'High' ? 'bg-red-500 text-white border-red-500' : p === 'Medium' ? 'bg-orange-400 text-white border-orange-400' : 'bg-teal text-white border-teal')
                          : 'bg-white text-gray-500 border-gray-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Details</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-teal outline-none resize-none"
                    value={formData.details}
                    onChange={e => setFormData({ ...formData, details: e.target.value })}
                    placeholder="Describe the issue..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal hover:bg-teal-dark text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Submit Complaint</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintWidget;
