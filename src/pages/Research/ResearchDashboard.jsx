import React, { useState, useEffect } from 'react';
import { Database, Rss, TrendingUp, Lightbulb, ShieldCheck, Target, Calendar, Search, ChevronRight, Sparkles, BarChart2, MessageSquare, Clock, Bookmark, Bell, FileEdit, Brain } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ResearchDashboard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: '/research', icon: Search, label: 'ওভারভিউ', color: 'text-indigo-500', bgHover: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20' },
    { id: '/research/archive', icon: Database, label: 'আর্কাইভ সার্চ', color: 'text-blue-500', bgHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20' },
    { id: '/research/news-feed', icon: Rss, label: 'লাইভ নিউজ ফিড', color: 'text-orange-500', bgHover: 'hover:bg-orange-50 dark:hover:bg-orange-900/20' },
    { id: '/research/trends', icon: TrendingUp, label: 'ট্রেন্ড বিশ্লেষণ', color: 'text-emerald-500', bgHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20' },
    { id: '/research/ai', icon: Sparkles, label: 'AI অ্যাসিস্ট্যান্ট', color: 'text-purple-500', bgHover: 'hover:bg-purple-50 dark:hover:bg-purple-900/20' },
    { id: '/research/ai-tools', icon: Lightbulb, label: 'স্মার্ট কন্টেন্ট টুলস', color: 'text-fuchsia-500', bgHover: 'hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20' },
    { id: '/research/fact-checker', icon: ShieldCheck, label: 'ফ্যাক্ট-চেকার', color: 'text-teal-500', bgHover: 'hover:bg-teal-50 dark:hover:bg-teal-900/20' },
    { id: '/research/competitor-monitor', icon: Target, label: 'নিউজ মনিটর', color: 'text-rose-500', bgHover: 'hover:bg-rose-50 dark:hover:bg-rose-900/20' },
    { id: '/research/planner', icon: Calendar, label: 'স্টোরি প্ল্যানার', color: 'text-pink-500', bgHover: 'hover:bg-pink-50 dark:hover:bg-pink-900/20' },
    { id: '/research/saved', icon: Bookmark, label: 'সংরক্ষিত রিসার্চ', color: 'text-amber-500', bgHover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20' },
    { id: '/research/alerts', icon: Bell, label: 'কি-ওয়ার্ড অ্যালার্ট', color: 'text-red-500', bgHover: 'hover:bg-red-50 dark:hover:bg-red-900/20' },
    { id: '/research/notes', icon: FileEdit, label: 'রিসার্চ নোটস', color: 'text-emerald-500', bgHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20' },
    { id: '/research/intelligence', icon: Brain, label: 'AI ইন্টেলিজেন্স', color: 'text-indigo-500', bgHover: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20' },
  ];

  // Feature cards for the Overview page
  const features = [
    {
      title: 'আর্কাইভ সার্চ',
      desc: 'হাজারো পুরোনো সংবাদের মধ্য থেকে প্রয়োজনীয় তথ্য ও রেফারেন্স দ্রুত খুঁজে বের করুন।',
      icon: Database,
      color: 'from-blue-500 to-cyan-400',
      shadow: 'shadow-blue-500/20',
      link: '/research/archive'
    },
    {
      title: 'AI রিসার্চ অ্যাসিস্ট্যান্ট',
      desc: 'জেমিনি এআই-কে প্রশ্ন করে যেকোনো বিষয়ের ব্যাকগ্রাউন্ড বা ফ্যাক্ট-চেক জেনে নিন।',
      icon: Sparkles,
      color: 'from-purple-500 to-fuchsia-400',
      shadow: 'shadow-purple-500/20',
      link: '/research/ai'
    },
    {
      title: 'লাইভ নিউজ ফিড',
      desc: 'অন্যান্য শীর্ষস্থানীয় পত্রিকার সর্বশেষ খবরগুলো এক পলকে মনিটর করুন।',
      icon: Rss,
      color: 'from-orange-500 to-amber-400',
      shadow: 'shadow-orange-500/20',
      link: '/research/news-feed'
    },
    {
      title: 'স্মার্ট কন্টেন্ট টুলস',
      desc: 'এসইও ট্যাগ, খবরের সামারি এবং নতুন স্টোরি আইডিয়া জেনারেট করুন এক ক্লিকে।',
      icon: Lightbulb,
      color: 'from-fuchsia-500 to-pink-400',
      shadow: 'shadow-fuchsia-500/20',
      link: '/research/ai-tools'
    },
    {
      title: 'ফ্যাক্ট-চেকার',
      desc: 'ইন্টারনেটে ছড়িয়ে থাকা যেকোনো সন্দেহজনক খবর বা দাবির সত্যতা যাচাই করুন।',
      icon: ShieldCheck,
      color: 'from-teal-500 to-emerald-400',
      shadow: 'shadow-teal-500/20',
      link: '/research/fact-checker'
    },
    {
      title: 'নিউজ মনিটর',
      desc: 'প্রথম আলো, ডেইলি স্টারসহ অন্যান্য পত্রিকার সর্বশেষ খবর রিয়েল-টাইমে ট্র্যাক করুন।',
      icon: Target,
      color: 'from-rose-500 to-red-400',
      shadow: 'shadow-rose-500/20',
      link: '/research/competitor-monitor'
    },
    {
      title: 'ট্রেন্ড বিশ্লেষণ',
      desc: 'বর্তমানের সবচেয়ে আলোচিত ও ভাইরাল টপিকগুলো খুঁজে বের করে স্টোরি আইডিয়া তৈরি করুন।',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-400',
      shadow: 'shadow-emerald-500/20',
      link: '/research/trends'
    },
    {
      title: 'স্টোরি প্ল্যানার',
      desc: 'ভবিষ্যতের বড় ইভেন্টগুলোর জন্য আগে থেকেই নিউজ কভারেজের রূপরেখা সাজিয়ে রাখুন।',
      icon: Calendar,
      color: 'from-pink-500 to-rose-400',
      shadow: 'shadow-pink-500/20',
      link: '/research/planner'
    },
    {
      title: 'সংরক্ষিত রিসার্চ',
      desc: 'আপনার সেভ করা গুরুত্বপূর্ণ আর্টিকেল, তথ্য ও লিংকসমূহ এক জায়গায়।',
      icon: Bookmark,
      color: 'from-amber-500 to-orange-400',
      shadow: 'shadow-amber-500/20',
      link: '/research/saved'
    },
    {
      title: 'কি-ওয়ার্ড অ্যালার্ট',
      desc: 'নির্দিষ্ট বিষয়ের খবর এলে সাথে সাথে নোটিফিকেশন পান।',
      icon: Bell,
      color: 'from-red-500 to-rose-400',
      shadow: 'shadow-red-500/20',
      link: '/research/alerts'
    },
    {
      title: 'রিসার্চ নোটস',
      desc: 'আপনার নিজস্ব চিন্তা, তথ্য ও খসড়া সংরক্ষণের জায়গা।',
      icon: FileEdit,
      color: 'from-emerald-500 to-teal-400',
      shadow: 'shadow-emerald-500/20',
      link: '/research/notes'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* Header Area with Subtle Gradient */}
      <div className="relative z-10 px-6 pt-6 pb-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 flex items-center gap-3 tracking-tight">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Search size={20} className="stroke-[2.5]" />
              </div>
              রিসার্চ সেন্টার
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">আপনার সংবাদের জন্য প্রয়োজনীয় সকল তথ্য, বিশ্লেষণ ও আইডিয়া</p>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System Online
          </div>
        </div>
        
        {/* Individual Block Navigation Tabs */}
        <div className="relative mt-5 mb-2">
          <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.id)}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-[13.5px] transition-all duration-300 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 border border-blue-500/50'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5'
                  }`}
                >
                  <tab.icon 
                    size={18} 
                    className={`transition-transform duration-300 ${isActive ? 'text-white scale-110' : tab.color + ' group-hover:scale-110'}`} 
                  />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 relative">
        
        {/* Background decorative elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/5 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/5 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 p-6 md:p-8">
          {children || (
            <div className="max-w-6xl mx-auto">
              
              {/* Grid of Features */}
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                প্রধান টুলসসমূহ
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, idx) => (
                  <div 
                    key={idx}
                    onClick={() => navigate(feature.link)}
                    className="group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden relative"
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-5 dark:opacity-10 rounded-bl-full group-hover:scale-110 transition-transform duration-500`}></div>
                    
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-5 shadow-lg ${feature.shadow}`}>
                      <feature.icon size={24} />
                    </div>
                    
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {feature.title}
                    </h4>
                    
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                      {feature.desc}
                    </p>
                    
                    <div className="flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                      অ্যাক্সেস করুন <ChevronRight size={16} className="ml-1" />
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
