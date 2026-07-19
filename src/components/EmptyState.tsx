import React from 'react';
import { motion } from 'motion/react';
import { Inbox, Compass } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  subMessage?: string;
  onClearFilters?: () => void;
  showClearButton?: boolean;
}

export default function EmptyState({
  message = "这里没有找到博文哦...",
  subMessage = "可能是没有找到符合该筛选条件的内容，或者最近没有更新。快清除筛选重试吧！",
  onClearFilters,
  showClearButton = false
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-sky-300 rounded-2xl bg-white text-center max-w-md mx-auto my-6"
    >
      <div className="p-3 bg-sky-50 text-[#0092d8] rounded-full mb-3.5 border border-sky-100">
        <Inbox size={24} />
      </div>

      <h3 className="text-sm font-bold text-slate-800 mb-1.5">
        {message}
      </h3>
      
      <p className="text-xs text-slate-400 max-w-xs mb-5 leading-relaxed font-medium">
        {subMessage}
      </p>

      {showClearButton && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0092d8] hover:bg-[#0077b0] text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Compass size={14} />
          <span>重置所有筛选条件</span>
        </button>
      )}
    </motion.div>
  );
}
