import React from 'react';
import { 
  FileText, 
  GitBranch, 
  Filter, 
  LayoutDashboard, 
  BellRing, 
  CheckSquare, 
  UserCheck, 
  Database,
  ArrowDown
} from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Blood Request Submission',
      desc: 'A patient relative or hospital creates an emergency request specifying patient name, required blood group, units, hospital address, and contact details.',
      icon: FileText,
      color: 'text-red-400 bg-red-500/10 border-red-500/30'
    },
    {
      num: '02',
      title: 'Compatibility Matrix Rules',
      desc: 'The backend engine checks clinical compatibility rules (e.g. O- donors for all groups, A+ donors for A+ and AB+ recipients).',
      icon: GitBranch,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30'
    },
    {
      num: '03',
      title: 'Availability & Proximity Filtering',
      desc: 'Donors currently set to "Available" in the requested city are filtered and ranked based on compatibility score and approximate distance.',
      icon: Filter,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    },
    {
      num: '04',
      title: 'Hospital Candidate Listing',
      desc: 'Matching potential donors appear on the hospital dashboard with privacy-protected contact placeholders.',
      icon: LayoutDashboard,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      num: '05',
      title: 'Real-Time In-App Alert',
      desc: 'Compatible donors receive instant in-app alerts and notifications via WebSockets.',
      icon: BellRing,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    },
    {
      num: '06',
      title: 'Donor Acceptance or Decline',
      desc: 'The donor reviews request urgency and accepts or declines. Accepting unlocks contact info for hospital coordination.',
      icon: CheckSquare,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    },
    {
      num: '07',
      title: 'Clinical Donation Verification',
      desc: 'The hospital coordinates donation, conducts medical screening, and verifies completion on the dashboard.',
      icon: UserCheck,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/30'
    },
    {
      num: '08',
      title: 'Blood Bank Inventory Log',
      desc: 'Authorized blood bank staff update reported stock units independently through authorized transactions.',
      icon: Database,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
          Workflow Architecture
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white">
          The LIFORA Matching Workflow
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Step-by-step breakdown of how emergency requests transition from submission to clinical donation verification.
        </p>
      </div>

      {/* Steps Vertical Timeline */}
      <div className="space-y-6 relative">
        {steps.map((step, idx) => {
          const IconComponent = step.icon;
          return (
            <div key={step.num} className="relative">
              <div className="glass-panel p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 border-slate-800">
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center font-bold text-xl shrink-0 ${step.color}`}>
                  <IconComponent className="w-7 h-7" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Step {step.num}</span>
                    <h3 className="text-lg font-bold text-white">{step.title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className="flex justify-center my-2">
                  <ArrowDown className="w-5 h-5 text-slate-700 animate-bounce" />
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
