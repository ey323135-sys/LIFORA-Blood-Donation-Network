import React from 'react';

export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'red', trend }) {
  const colorMap = {
    red: 'from-red-600/20 to-rose-600/10 border-red-500/30 text-red-400',
    blue: 'from-sky-600/20 to-blue-600/10 border-sky-500/30 text-sky-400',
    emerald: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/30 text-emerald-400',
    purple: 'from-purple-600/20 to-indigo-600/10 border-purple-500/30 text-purple-400',
    amber: 'from-amber-600/20 to-yellow-600/10 border-amber-500/30 text-amber-400'
  };

  const currentStyle = colorMap[color] || colorMap.red;

  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br ${currentStyle} border backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="font-heading font-extrabold text-3xl tracking-tight text-white">{value}</span>
        {trend && (
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            {trend}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-400 truncate">{subtitle}</p>
      )}
    </div>
  );
}
