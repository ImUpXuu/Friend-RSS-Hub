import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsBadgeProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

export default function StatsBadge({ icon: Icon, label, value }: StatsBadgeProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-[#0092d8] rounded-xl shadow-[3px_3px_0px_0px_rgba(0,146,216,0.12)] hover:shadow-[3px_3px_0px_0px_rgba(0,146,216,0.2)] transition-all duration-200">
      <div className="p-2 rounded-lg bg-sky-50 text-[#0092d8] shrink-0">
        <Icon size={16} />
      </div>
      <div className="min-w-0 text-left">
        <p className="text-[10px] font-bold text-[#0092d8] tracking-wider uppercase leading-none mb-1.5">{label}</p>
        <p className="text-xs md:text-sm font-bold text-slate-800 truncate leading-none">{value}</p>
      </div>
    </div>
  );
}
