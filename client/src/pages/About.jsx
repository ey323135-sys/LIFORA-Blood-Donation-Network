import React from 'react';
import { ShieldCheck, HeartHandshake, Building2, Droplet, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
          Our Mission & Vision
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white">
          About LIFORA Emergency Network
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Bridging the critical gap between emergency blood requirements and verified volunteer donors through technology.
        </p>
      </div>

      {/* Problem vs Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* The Problem */}
        <div className="glass-panel p-8 space-y-4 border-red-900/30">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">The Critical Challenge</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            During medical emergencies, trauma surgeries, and acute anemia crises, finding compatible blood donors is often fragmented. Families post panicked messages across messaging apps and social media, wasting valuable minutes while hospitals struggle to coordinate with unverified lists.
          </p>
        </div>

        {/* The Solution */}
        <div className="glass-panel p-8 space-y-4 border-emerald-900/30">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">The LIFORA Solution</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            LIFORA provides a centralized, real-time emergency network. When a request is created, our algorithm filters compatible blood groups, checks live donor availability, and notifies matching donors in the vicinity through instant in-app alerts while preserving privacy.
          </p>
        </div>
      </div>

      {/* Stakeholder Connectivity */}
      <div className="glass-panel p-8 sm:p-12 space-y-8">
        <h2 className="text-2xl font-bold text-white text-center">Connecting the Ecosystem</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-sm">Volunteer Donors</h4>
            <p className="text-xs text-slate-400">Set availability, receive instant requests, and accept donations safely.</p>
          </div>

          <div className="glass-card p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-sm">Hospitals</h4>
            <p className="text-xs text-slate-400">Publish emergency requests, review donor matches, and verify clinical completion.</p>
          </div>

          <div className="glass-card p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
              <Droplet className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-sm">Blood Banks</h4>
            <p className="text-xs text-slate-400">Report inventory units across all 8 blood groups to inform regional emergency supply.</p>
          </div>

          <div className="glass-card p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-sm">Administrators</h4>
            <p className="text-xs text-slate-400">Verify facility licenses, audit logs, and maintain system integrity.</p>
          </div>
        </div>
      </div>

      {/* Medical Safety Disclaimer */}
      <div className="p-8 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-3">
        <h3 className="font-bold text-base text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" /> Platform Limitations & Medical Safety Principles
        </h3>
        <p className="text-xs sm:text-sm leading-relaxed text-amber-200/90">
          LIFORA serves strictly as an emergency coordination and communication aid. Software matches are preliminary notifications based on self-reported blood group and availability data. <strong>Software matching DOES NOT constitute medical authorization or clinical compatibility verification.</strong> 
        </p>
        <p className="text-xs leading-relaxed text-amber-200/80">
          All blood grouping, infectious disease screening, crossmatching, and donor eligibility assessments MUST be performed independently by certified blood bank technicians and qualified medical staff prior to any blood transfusion.
        </p>
      </div>

    </div>
  );
}
