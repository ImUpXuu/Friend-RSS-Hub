import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Copy, Check, Sparkles, Calendar } from 'lucide-react';
import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  onFilterByFriend?: (friendName: string) => void;
}

// Utility to calculate human-readable relative time
export function getRelativeTime(pubDateStr: string): string {
  const pubDate = new Date(pubDateStr);
  const now = new Date();
  const diffMs = now.getTime() - pubDate.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMs < 0 || diffSec < 60) {
    return '刚刚';
  } else if (diffMin < 60) {
    return `${diffMin} 分钟前`;
  } else if (diffHour < 24) {
    return `${diffHour} 小时前`;
  } else if (diffDay === 1) {
    return '昨天';
  } else if (diffDay === 2) {
    return '前天';
  } else if (diffDay < 30) {
    return `${diffDay} 天前`;
  } else {
    const y = pubDate.getFullYear();
    const m = String(pubDate.getMonth() + 1).padStart(2, '0');
    const d = String(pubDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

// Minimalist avatar background styles matching our clean blue theme
const AVATAR_COLORS = [
  'bg-sky-50 text-[#0092d8] border-sky-100',
  'bg-slate-50 text-slate-600 border-slate-100',
  'bg-indigo-50 text-indigo-600 border-indigo-100',
];

function getAvatarFallbackStyle(name: string) {
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export default function ArticleCard({ article, onFilterByFriend }: ArticleCardProps) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(article.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const formattedTime = getRelativeTime(article.pubDate);
  const fallbackStyle = getAvatarFallbackStyle(article.friendName);
  const initialLetter = article.friendName.trim().charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.25 }}
      className="relative group bg-white border-2 border-slate-200/80 rounded-2xl p-5 md:p-6 transition-all duration-200 shadow-sm hover:shadow-[4px_4px_0px_0px_rgba(0,146,216,0.15)] hover:border-[#0092d8] flex flex-col justify-between"
    >
      {/* 3-day recent updates neat badge */}
      {article.isRecent && (
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-[#0092d8] border border-sky-100">
          <Sparkles size={10} className="fill-current animate-pulse" />
          <span>最新</span>
        </div>
      )}

      <div>
        {/* Author row */}
        <div className="flex items-center gap-2.5 mb-3.5">
          {/* Avatar */}
          {!imgError && article.friendAvatar ? (
            <img
              src={article.friendAvatar}
              alt={article.friendName}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-7 h-7 rounded-full object-cover border border-slate-100 shrink-0"
            />
          ) : (
            <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${fallbackStyle}`}>
              {initialLetter}
            </div>
          )}

          {/* Author Name */}
          <button
            onClick={() => onFilterByFriend && onFilterByFriend(article.friendName)}
            className="text-xs font-bold text-slate-700 hover:text-[#0092d8] transition-colors text-left truncate cursor-pointer hover:underline max-w-[60%]"
            title={`筛选 ${article.friendName} 的文章`}
          >
            {article.friendName}
          </button>

          {/* Published Time */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400 ml-auto font-medium">
            <Calendar size={11} />
            <span title={new Date(article.pubDate).toLocaleString()}>{formattedTime}</span>
          </div>
        </div>

        {/* Title */}
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-2 group/title"
        >
          <h4 className="text-base font-bold text-slate-950 group-hover/title:text-[#0092d8] transition-colors line-clamp-2 leading-snug">
            {article.title}
          </h4>
        </a>

        {/* Snippet */}
        <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3 font-medium">
          {article.snippet}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 mt-auto">
        {/* Copy Link Button */}
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
            copied
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
          }`}
          title="复制文章链接"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? '已复制' : '复制'}</span>
        </button>

        {/* Read More Button */}
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[#0092d8] hover:bg-[#0077b0] text-white border border-transparent transition-all shadow-sm hover:shadow"
        >
          <span>阅读全文</span>
          <ExternalLink size={11} />
        </a>
      </div>
    </motion.div>
  );
}
