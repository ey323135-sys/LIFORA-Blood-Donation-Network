import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BloodGroupBadge from '../components/BloodGroupBadge';
import LeafletMap from '../components/LeafletMap';
import { requestService } from '../services/requestService';
import API from '../services/api';
import { 
  HeartHandshake, 
  Search, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Building2, 
  Droplet, 
  Users, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  MapPin,
  AlertCircle
} from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState({
    totalDonors: 0,
    availableDonors: 0,
    activeBloodRequests: 0,
    totalBloodRequests: 0,
    requestsFulfilled: 0,
    registeredHospitals: 0,
    registeredBloodBanks: 0,
    totalInventoryUnits: 0
  });

  const [searchCity, setSearchCity] = useState('');
  const [searchBloodGroup, setSearchBloodGroup] = useState('');
  const [activeRequests, setActiveRequests] = useState([]);

  useEffect(() => {
    const loadPublicData = async () => {
      try {
        const statsRes = await API.get('/stats/public').catch(() => null);
        if (statsRes && statsRes.success && statsRes.stats) {
          setStats(statsRes.stats);
        }

        const res = await requestService.getRequests().catch(() => null);
        if (res && res.success && res.requests) {
          setActiveRequests(res.requests.slice(0, 4));
        }
      } catch (err) {
        console.warn('Public requests preview error:', err.message);
      }
    };

    loadPublicData();
  }, []);

  const sampleMapDonors = [
    { name: 'Arthur P.', bloodGroup: 'O+', city: 'New Delhi', isAvailable: true, lat: 28.6180, lng: 77.2120 },
    { name: 'Samantha R.', bloodGroup: 'O-', city: 'New Delhi', isAvailable: true, lat: 28.6250, lng: 77.2150 },
    { name: 'Michael C.', bloodGroup: 'A+', city: 'New Delhi', isAvailable: true, lat: 28.6100, lng: 77.2000 }
  ];

  const sampleMapHospitals = [
    { hospitalName: 'Metro Care Super Specialty Hospital', phone: '+1 800-555-0244', address: 'Plot 14, Ring Road, New Delhi', lat: 28.6139, lng: 77.2090 }
  ];

  const sampleMapBloodBanks = [
    { bloodBankName: 'Red Cross Central Blood Bank', phone: '+1 800-555-0377', address: '22 Civic Center Boulevard, New Delhi', lat: 28.6280, lng: 77.2189 }
  ];

  return (
    <div className="space-y-24 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* Status pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider animate-pulse-slow">
              <Zap className="w-3.5 h-3.5" /> Emergency Donor Matching Operational
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
              Every Second Matters. <br />
              <span className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
                Every Donor Counts.
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
              LIFORA is a digital blood donation emergency platform connecting patients, hospitals, and blood banks with compatible, available donors in real time.
            </p>

            {/* Hero CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/register?role=requester" className="btn-primary w-full sm:w-auto text-base !py-4 !px-8 shadow-2xl">
                <Search className="w-5 h-5 mr-2" /> Find Blood Urgently
              </Link>
              <Link to="/register?role=donor" className="btn-secondary w-full sm:w-auto text-base !py-4 !px-8">
                <HeartHandshake className="w-5 h-5 mr-2 text-red-500" /> Become a Donor
              </Link>
            </div>

            {/* Platform Trust Pill */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified Hospitals</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-sky-400" /> Instant In-App Notifications</span>
              <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-red-400" /> Clinical Compatibility Engine</span>
            </div>

          </div>
        </div>
      </section>

      {/* Impact Statistics (Real Database Records) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-6 text-center border-slate-800">
            <span className="block font-heading font-extrabold text-4xl text-white mb-1">{stats.totalBloodRequests || 0}</span>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total Blood Requests</span>
          </div>
          <div className="glass-panel p-6 text-center border-slate-800">
            <span className="block font-heading font-extrabold text-4xl text-emerald-400 mb-1">{stats.activeBloodRequests || 0}</span>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Active Requests</span>
          </div>
          <div className="glass-panel p-6 text-center border-slate-800">
            <span className="block font-heading font-extrabold text-4xl text-sky-400 mb-1">{stats.totalDonors || 0}</span>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Registered Donors ({stats.availableDonors || 0} Available)</span>
          </div>
          <div className="glass-panel p-6 text-center border-slate-800">
            <span className="block font-heading font-extrabold text-4xl text-rose-400 mb-1">{(stats.registeredHospitals || 0) + (stats.registeredBloodBanks || 0)}</span>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Hospitals & Blood Banks</span>
          </div>
        </div>
      </section>

      {/* Live Map & Emergency Network Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full mb-2">
                <MapPin className="w-3.5 h-3.5" /> Interactive Network Map
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Live Hospital & Donor Distribution</h2>
              <p className="text-xs text-slate-400 mt-1">
                Visualizing verified hospitals, central blood banks, and approximate donor locations in real time.
              </p>
            </div>
            <Link to="/how-it-works" className="btn-outline text-xs">
              Learn Matching Algorithm <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <LeafletMap 
            hospitals={sampleMapHospitals}
            bloodBanks={sampleMapBloodBanks}
            donors={sampleMapDonors}
            height="420px"
          />
        </div>
      </section>

      {/* How LIFORA Works Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">How LIFORA Works</h2>
          <p className="text-sm text-slate-400 mt-2">
            A seamless 4-step emergency blood coordination process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 relative group">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center font-bold text-lg mb-4">
              01
            </div>
            <h3 className="text-base font-bold text-white mb-2">Submit Request</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Patients, relatives, or hospitals submit emergency requests with patient details and required blood group.
            </p>
          </div>

          <div className="glass-card p-6 relative group">
            <div className="w-12 h-12 rounded-xl bg-sky-600/20 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold text-lg mb-4">
              02
            </div>
            <h3 className="text-base font-bold text-white mb-2">Matching Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The backend applies clinical blood compatibility rules and location filtering to find available donors.
            </p>
          </div>

          <div className="glass-card p-6 relative group">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-lg mb-4">
              03
            </div>
            <h3 className="text-base font-bold text-white mb-2">In-App Notification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Matching donors receive real-time alerts and can accept or decline the request instantly.
            </p>
          </div>

          <div className="glass-card p-6 relative group">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">
              04
            </div>
            <h3 className="text-base font-bold text-white mb-2">Clinical Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hospitals coordinate donation, verify clinical completion, and update inventory status.
            </p>
          </div>
        </div>
      </section>

      {/* Blood Donation Awareness & Medical FAQ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 sm:p-12">
          <div className="max-w-3xl mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Blood Donation Awareness & Safety</h2>
            <p className="text-xs text-slate-400 mt-1">
              Key guidelines every donor and requester should know before participating.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Who can donate blood?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Healthy adults aged 18–65 weighing over 50kg, with normal blood pressure and hemoglobin levels, free from active infections.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> How often can I donate?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Whole blood can be donated every 56 days (approx. 8 weeks) for men, and every 12 weeks for women, allowing the body to replenish iron.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Universal Donors
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Type O-Negative donors are universal red cell donors, critical for emergency transfusions when a patient's blood type is unknown.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-slate-900 p-8 sm:p-14 overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Ready to save a life today?
            </h2>
            <p className="text-sm text-red-100 leading-relaxed">
              Register as a volunteer donor on LIFORA. Your commitment can turn an emergency into a saved life.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link to="/register?role=donor" className="btn-secondary !bg-white !text-slate-900 !border-white hover:!bg-slate-100 text-sm font-bold">
                Register as Volunteer Donor
              </Link>
              <Link to="/register?role=hospital" className="btn-outline !text-white !border-white/50 hover:!bg-white/10 text-sm">
                Register Hospital Facility
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
