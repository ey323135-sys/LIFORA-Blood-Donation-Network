import React from 'react';
import { Droplet } from 'lucide-react';

export default function BloodGroupBadge({ bloodGroup, size = 'md' }) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base font-bold'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30 border border-red-400/40 tracking-wider ${sizeClasses[size] || sizeClasses.md}`}>
      <Droplet className="w-3.5 h-3.5 fill-white text-white" />
      {bloodGroup}
    </span>
  );
}
