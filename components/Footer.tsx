
import React from 'react';
import { AlertCircle, ShieldAlert, Phone, MessageSquare, Building2, Heart } from 'lucide-react';
import { CONTACT_INFO } from '../constants';

interface FooterProps {
  onViewChange: (view: any) => void;
}

const Footer: React.FC<FooterProps> = ({ onViewChange }) => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Heart className="text-teal" size={28} />
              <span className="text-3xl font-serif font-bold text-teal">Medilens</span>
            </div>
            <p className="text-text-body leading-relaxed max-w-sm mb-6">
              Leading the way in medical excellence with advanced AI technology and compassionate care. 
              Bridging the gap between digital innovation and human expertise.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-text-main mb-6 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-4 text-text-body text-sm">
              <li><button onClick={() => onViewChange('home')} className="hover:text-teal transition-colors">Home</button></li>
              <li><a href="#doctors" className="hover:text-teal transition-colors">Doctors</a></li>
              <li><a href="#symptoms" className="hover:text-teal transition-colors">Symptom Checker</a></li>
              <li><button onClick={() => onViewChange('lab-analysis')} className="hover:text-teal transition-colors">Lab Reports</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-text-main mb-6 uppercase tracking-wider text-sm">Get in Touch</h4>
            <ul className="space-y-4 text-text-body text-sm">
              <li className="flex gap-3 items-center">
                <Phone size={18} className="text-teal" /> 
                <span>{CONTACT_INFO.phone}</span>
              </li>
              <li className="flex gap-3 items-center">
                <MessageSquare size={18} className="text-teal" /> 
                <span>{CONTACT_INFO.supportEmail}</span>
              </li>
              <li className="flex gap-3 items-center">
                <Building2 size={18} className="text-teal" /> 
                <span>Lahore, Pakistan</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Global Medical Disclaimer Section */}
        <div className="border-t border-gray-100 pt-10 pb-10">
          <div className="bg-slate-50 rounded-2xl p-6 md:p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="bg-white p-3 rounded-full shadow-sm text-amber-500 h-fit w-fit shrink-0">
                <ShieldAlert size={32} />
              </div>
              <div className="space-y-4">
                <h5 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  Medical Disclaimer
                </h5>
                <div className="text-sm text-gray-600 leading-relaxed space-y-3">
                  <p>
                    Medilens provides AI-generated health information for educational and informational purposes only. 
                    The information provided by this platform, including symptom analysis, lifestyle suggestions, 
                    herbal remedies, and report explanations, is not intended to replace professional medical advice, 
                    diagnosis, or treatment.
                  </p>
                  <p className="font-medium text-gray-800">
                    Always consult a qualified healthcare professional before making medical decisions. 
                    If you are experiencing a medical emergency, please contact emergency services or visit 
                    the nearest hospital immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Medilens. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <button onClick={() => onViewChange('medical-disclaimer')} className="hover:text-teal transition-colors">Medical Disclaimer</button>
            <a href="#" className="hover:text-teal transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-teal transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
