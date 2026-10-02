import React from 'react';
import { Link } from 'react-router-dom';
import { Droplet, Heart, Shield, Phone, Mail, MapPin, AlertTriangle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-600/30">
                <Droplet className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="font-heading font-extrabold text-2xl tracking-tight text-white">
                LIFORA
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-400">
              Digital Blood Donation Emergency Network connecting registered donors, hospitals, and blood banks to accelerate life-saving emergency care.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Phone className="w-4 h-4 text-red-500" />
              <span>Emergency Hotline: +1 800-LIFORA-911</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="font-heading font-semibold text-white text-sm tracking-wide uppercase mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/" className="hover:text-red-400 transition-colors">Home Platform</Link></li>
              <li><Link to="/about" className="hover:text-red-400 transition-colors">About LIFORA</Link></li>
              <li><Link to="/how-it-works" className="hover:text-red-400 transition-colors">How Matching Works</Link></li>
              <li><Link to="/contact" className="hover:text-red-400 transition-colors">Contact Support</Link></li>
              <li><Link to="/register" className="hover:text-red-400 transition-colors">Register as Donor</Link></li>
            </ul>
          </div>

          {/* User Roles */}
          <div>
            <h4 className="font-heading font-semibold text-white text-sm tracking-wide uppercase mb-4">Platform Roles</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/register?role=donor" className="hover:text-red-400 transition-colors">Volunteer Donor Portal</Link></li>
              <li><Link to="/register?role=requester" className="hover:text-red-400 transition-colors">Patient / Family Requester</Link></li>
              <li><Link to="/register?role=hospital" className="hover:text-red-400 transition-colors">Hospital Emergency Network</Link></li>
              <li><Link to="/register?role=bloodbank" className="hover:text-red-400 transition-colors">Blood Bank Inventory Hub</Link></li>
              <li><Link to="/login" className="hover:text-red-400 transition-colors">Admin Portal Access</Link></li>
            </ul>
          </div>

          {/* Safety & Medical Disclaimer */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-white text-sm tracking-wide uppercase mb-2 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" /> Medical Safety
            </h4>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-[11px] leading-relaxed text-slate-400 space-y-1.5">
              <div className="flex items-start gap-1.5 text-amber-400 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Preliminary Coordination Notice</span>
              </div>
              <p>
                LIFORA is a preliminary coordination network. Software matches do NOT confirm clinical compatibility. Blood grouping, viral testing, crossmatching, and donor qualification MUST be conducted by licensed healthcare professionals.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} LIFORA Emergency Blood Network. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Built for rapid medical emergency response</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 ml-1 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
}
