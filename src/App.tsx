import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rss, 
  Users, 
  Sparkles, 
  Search, 
  Clock, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';

import aggregatedDataRaw from './data/aggregated.json';
import { AggregatedData, Article } from './types';
import ArticleCard from './components/ArticleCard';
import StatsBadge from './components/StatsBadge';
import EmptyState from './components/EmptyState';

const data = (aggregatedDataRaw as unknown) as AggregatedData;

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'older'>('all');
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [visibleArticlesCount, setVisibleArticlesCount] = useState(12);
  const [activeTab, setActiveTab] = useState<'articles' | 'friends'>('articles');
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  // Extract date and format it precisely to the second (YYYY-MM-DD HH:mm:ss)
  const formattedLastBuild = useMemo(() => {
    if (!data.lastBuild) return '未知时间';
    const date = new Date(data.lastBuild);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }, []);

  // Filter & Search logic for articles
  const filteredArticles = useMemo(() => {
    let list: Article[] = [];
    
    const recent = data.recentArticles || [];
    const older = data.olderArticles || [];
    
    if (activeFilter === 'recent') {
      list = [...recent];
    } else if (activeFilter === 'older') {
      list = [...older];
    } else {
      list = [...recent, ...older];
    }

    if (selectedFriend) {
      list = list.filter(a => a.friendName === selectedFriend);
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => 
        a.title.toLowerCase().includes(q) || 
        a.snippet.toLowerCase().includes(q) || 
        a.friendName.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const timeA = new Date(a.pubDate).getTime();
      const timeB = new Date(b.pubDate).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [activeFilter, selectedFriend, searchQuery, sortOrder]);

  const handleLoadMore = () => {
    setVisibleArticlesCount(prev => prev + 12);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveFilter('all');
    setSelectedFriend(null);
    setSortOrder('desc');
    setVisibleArticlesCount(12);
  };

  const filteredFriends = useMemo(() => {
    const friends = data.friends || [];
    if (!friendSearchQuery.trim()) return friends;
    const q = friendSearchQuery.toLowerCase();
    return friends.filter(f => 
      f.name.toLowerCase().includes(q) || 
      (f.description && f.description.toLowerCase().includes(q))
    );
  }, [friendSearchQuery]);

  const recentCount = data.recentArticles?.length || 0;
  const olderCount = data.olderArticles?.length || 0;
  const totalCount = recentCount + olderCount;

  return (
    <div className="min-h-screen blog-bg pb-20 font-sans text-slate-800 selection:bg-sky-100 selection:text-[#0092d8]">
      
      {/* 1. Header Banner - Clean, solid outlines, premium blog-style */}
      <div className="bg-white border-b-2 border-slate-200 py-12 mb-8 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center">
            
            {/* Elegant Avatar with Main Blog Style Border */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="relative mb-4"
            >
              <div className="w-18 h-18 rounded-full bg-white border-2 border-[#0092d8] p-0.5 shadow-sm">
                <img 
                  src="https://avatars.githubusercontent.com/u/119206123?v=4" 
                  alt="Upxuu Avatar" 
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 bg-[#0092d8] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-white">
                ✓
              </div>
            </motion.div>

            {/* Clean Title */}
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-4"
            >
              Upxuu's <span className="text-[#0092d8]">Friend RSS</span> Hub
            </motion.h1>

            {/* Main Site Link (upxuu.com) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="mb-8"
            >
              <a 
                href="https://upxuu.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-sky-50 text-[#0092d8] border-2 border-[#0092d8] rounded-xl text-xs font-bold transition-all shadow-[2px_2px_0px_0px_rgba(0,146,216,0.12)] hover:shadow-[2px_2px_0px_0px_rgba(0,146,216,0.22)] cursor-pointer"
              >
                <span>访问主站 upxuu.com</span>
                <ExternalLink size={13} />
              </a>
            </motion.div>

            {/* Micro-dashboard Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl w-full"
            >
              <StatsBadge 
                icon={Users} 
                label="友情之桥" 
                value={`${data.friendsCount || 0} 位朋友`} 
              />
              <StatsBadge 
                icon={Rss} 
                label="订阅星轨" 
                value={`${data.activeFeedsCount || 0} 个 Feed`} 
              />
              <StatsBadge 
                icon={Sparkles} 
                label="近 3 天更新" 
                value={`${data.recentUpdatesCount || 0} 篇博文`} 
              />
              <StatsBadge 
                icon={Clock} 
                label="最近同步时间" 
                value={formattedLastBuild.split(' ')[1]} // Shows the precise time
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        
        {/* Navigation Tabs - Modern Sleek Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl flex border-2 border-slate-200/80 shadow-sm">
            <button
              onClick={() => setActiveTab('articles')}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeTab === 'articles'
                  ? 'bg-[#0092d8] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen size={14} />
              <span>动态聚合列表</span>
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeTab === 'friends'
                  ? 'bg-[#0092d8] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users size={14} />
              <span>友情链接星图 ({data.friendsCount || 0})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: ARTICLES GRID & FILTER PANEL */}
        {activeTab === 'articles' && (
          <div>
            {/* Filter and Control Panel - Sleek Minimal Design */}
            <div className="bg-white border-2 border-slate-200/80 rounded-xl p-4 md:p-5 mb-6 shadow-sm">
              <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
                
                {/* Search Bar */}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search size={15} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索博文标题、内容或博主..."
                    className="w-full pl-8.5 pr-4 py-2 rounded-lg border-2 border-slate-200 focus:border-[#0092d8] focus:ring-1 focus:ring-[#0092d8]/10 outline-none transition-all text-xs font-semibold placeholder-slate-400 font-sans"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-[10px] font-bold cursor-pointer"
                    >
                      清空
                    </button>
                  )}
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Scope filter */}
                  <div className="flex items-center rounded-lg bg-slate-100 p-0.5">
                    <button
                      onClick={() => { setActiveFilter('all'); setVisibleArticlesCount(12); }}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        activeFilter === 'all'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      全部 ({totalCount})
                    </button>
                    <button
                      onClick={() => { setActiveFilter('recent'); setVisibleArticlesCount(12); }}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        activeFilter === 'recent'
                          ? 'bg-[#0092d8] text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${activeFilter === 'recent' ? 'bg-white animate-pulse' : 'bg-[#0092d8]'}`}></span>
                      近3天 ({recentCount})
                    </button>
                    <button
                      onClick={() => { setActiveFilter('older'); setVisibleArticlesCount(12); }}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        activeFilter === 'older'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      历史归档 ({olderCount})
                    </button>
                  </div>

                  {/* Date sort order button */}
                  <button
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white border-2 border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-[11px] font-bold text-slate-600 cursor-pointer"
                    title={sortOrder === 'desc' ? '当前：最新发布优先' : '当前：最旧发布优先'}
                  >
                    <ArrowUpDown size={12} className="text-[#0092d8]" />
                    <span>{sortOrder === 'desc' ? '最新优先' : '最早优先'}</span>
                  </button>

                  {/* Reset all filters */}
                  {(searchQuery || selectedFriend || activeFilter !== 'all' || sortOrder !== 'desc') && (
                    <button
                      onClick={handleClearFilters}
                      className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-[#0092d8] border-2 border-sky-100 rounded-lg transition-all text-[11px] font-bold cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw size={11} />
                      <span>重置</span>
                    </button>
                  )}
                </div>

              </div>

              {/* Status bar of current filters */}
              {selectedFriend && (
                <div className="mt-3.5 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#0092d8] bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
                      🎯 当前博主: <strong className="font-extrabold">{selectedFriend}</strong>
                    </span>
                    <button
                      onClick={() => setSelectedFriend(null)}
                      className="text-[10px] text-slate-400 hover:text-[#0092d8] font-bold cursor-pointer"
                    >
                      清除过滤
                    </button>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">
                    筛选出 <strong className="text-slate-700 font-bold">{filteredArticles.length}</strong> 篇博文
                  </span>
                </div>
              )}
            </div>

            {/* Articles List display */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                  <span>{activeFilter === 'recent' ? '近 3 天博文更新' : activeFilter === 'older' ? '历史归档博文' : '博文聚合流'}</span>
                  <span className="text-[10px] font-bold text-white bg-[#0092d8] px-2 py-0.5 rounded">
                    {filteredArticles.length}
                  </span>
                </h2>
              </div>

              {filteredArticles.length > 0 ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <AnimatePresence mode="popLayout">
                      {filteredArticles.slice(0, visibleArticlesCount).map((article, idx) => (
                        <ArticleCard 
                          key={`${article.friendName}-${article.title}-${idx}`} 
                          article={article}
                          onFilterByFriend={(name) => {
                            setSelectedFriend(name);
                            window.scrollTo({ top: 220, behavior: 'smooth' });
                          }}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Load More Trigger */}
                  {filteredArticles.length > visibleArticlesCount && (
                    <div className="flex justify-center mt-10">
                      <button
                        onClick={handleLoadMore}
                        className="flex items-center gap-1 px-5 py-2.5 bg-[#0092d8] hover:bg-[#0077b0] text-white font-bold text-xs rounded-lg transition-colors shadow-sm hover:shadow cursor-pointer"
                      >
                        <span>加载更多博文</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState 
                  showClearButton={!!searchQuery || !!selectedFriend || activeFilter !== 'all'} 
                  onClearFilters={handleClearFilters}
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FRIENDS DIRECTORY (友链星图) */}
        {activeTab === 'friends' && (
          <div className="bg-white border-2 border-slate-200/80 rounded-xl p-5 shadow-sm mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-150">
              <div>
                <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                  <span>友情链接星图</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  已连接了 <strong className="text-[#0092d8] font-bold">{data.friendsCount || 0}</strong> 位朋友，其中有 <strong className="text-slate-700 font-bold">{data.activeFeedsCount || 0}</strong> 位配置了订阅源。
                </p>
              </div>

              {/* Friends search */}
              <div className="relative w-full md:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search size={14} />
                </div>
                <input
                  type="text"
                  value={friendSearchQuery}
                  onChange={(e) => setFriendSearchQuery(e.target.value)}
                  placeholder="检索好友名称或描述..."
                  className="w-full pl-8.5 pr-4 py-2 rounded-lg border-2 border-slate-200 focus:border-[#0092d8] focus:ring-1 focus:ring-[#0092d8]/10 outline-none text-xs font-semibold placeholder-slate-400"
                />
              </div>
            </div>

            {/* Grid of Friends cards */}
            {filteredFriends.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredFriends.map((friend, idx) => {
                  const hasRss = friend.rss && friend.rss.trim().length > 0;
                  
                  return (
                    <div 
                      key={`${friend.name}-${idx}`}
                      className={`relative flex flex-col justify-between p-4 rounded-xl border-2 transition-all duration-200 bg-slate-50/20 hover:bg-white ${
                        selectedFriend === friend.name
                          ? 'border-[#0092d8] bg-sky-50/10 shadow-sm'
                          : 'border-slate-200 hover:border-[#0092d8] hover:shadow-[3px_3px_0px_0px_rgba(0,146,216,0.12)]'
                      }`}
                    >
                      {/* RSS badge indicator */}
                      <div className="absolute top-3 right-3">
                        {hasRss ? (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-50 text-[#0092d8] border border-sky-100">
                            <Rss size={9} />
                            <span>RSS</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-400 border border-slate-150">
                            <span>无源</span>
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2.5 mb-3 items-start pr-12">
                        {/* Avatar */}
                        {friend.avatar ? (
                          <img 
                            src={friend.avatar} 
                            alt={friend.name}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                            className="w-8 h-8 rounded-full object-cover border border-slate-150 shrink-0" 
                          />
                        ) : null}
                        
                        <div 
                          style={{ display: friend.avatar ? 'none' : 'flex' }}
                          className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 text-slate-500 font-bold flex items-center justify-center text-xs shrink-0"
                        >
                          {friend.name.trim().charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 text-left">
                          <h4 className="text-xs font-bold text-slate-800 truncate">
                            {friend.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium line-clamp-2 mt-0.5" title={friend.description}>
                            {friend.description || '一位神秘的好友博主 🚀'}
                          </p>
                        </div>
                      </div>

                      {/* Card actions */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 mt-2">
                        <button
                          onClick={() => {
                            setSelectedFriend(friend.name);
                            setActiveTab('articles');
                            setActiveFilter('all');
                          }}
                          className={`flex-1 text-center py-1 rounded text-[10px] font-bold transition-all border cursor-pointer ${
                            selectedFriend === friend.name
                              ? 'bg-[#0092d8] text-white border-transparent'
                              : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {selectedFriend === friend.name ? '取消筛选' : '筛选博文'}
                        </button>

                        <a 
                          href={friend.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors text-[10px] flex items-center justify-center"
                          title="访问博主主页"
                        >
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <p className="text-xs text-slate-400 font-bold">未找到匹配的好友 🚀</p>
                <button 
                  onClick={() => setFriendSearchQuery('')}
                  className="mt-3 px-3 py-1 bg-[#0092d8] hover:bg-[#0077b0] text-white text-[10px] font-bold rounded-lg shadow-sm"
                >
                  重置检索
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 4. Sleek Minimal Footer */}
      <footer className="mt-16 border-t border-slate-200/85 pt-6 text-center px-4 max-w-4xl mx-auto">
        <p className="text-[10px] text-slate-400 font-bold">
          &copy; 2026 Upxuu Friend RSS Hub. All rights reserved.
        </p>
        <p className="text-[9px] text-slate-400/70 mt-1 font-mono font-medium">
          最后同步时间: {formattedLastBuild} (北京时间)
        </p>
      </footer>
      
    </div>
  );
}
