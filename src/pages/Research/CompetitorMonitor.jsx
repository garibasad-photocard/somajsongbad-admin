import React, { useState, useEffect } from 'react';
import ResearchDashboard from './ResearchDashboard';
import { Target, Activity, ExternalLink, Loader2, RefreshCw, Eye } from 'lucide-react';
import api from '../../services/api';

export default function CompetitorMonitor() {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchCompetitors = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/research/competitors');
      setNews(res.data);
    } catch (error) {
      console.error('Error fetching competitor news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitors();
  }, []);

  const filteredNews = filter === 'all' 
    ? news 
    : news.filter(item => item.sourceId === filter);

  return (
    <ResearchDashboard>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl shadow-inner">
                <Target size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                প্রতিদ্বন্দ্বী নিউজ মনিটর
              </h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              শীর্ষস্থানীয় পত্রিকাগুলোর সর্বশেষ খবরগুলো রিয়েল-টাইমে ট্র্যাক করুন এবং দেখুন তারা কোন সংবাদ কভার করছে।
            </p>
          </div>
          
          <button 
            onClick={fetchCompetitors}
            className="px-5 py-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-semibold rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'রিফ্রেশ হচ্ছে...' : 'রিফ্রেশ করুন'}
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {[
            { id: 'all', name: 'সব পত্রিকা' },
            { id: 'prothomalo', name: 'প্রথম আলো' },
            { id: 'dailystar', name: 'ডেইলি স্টার' },
            { id: 'jugantor', name: 'যুগান্তর' },
            { id: 'somoy', name: 'সময় নিউজ' }
          ].map(source => (
            <button
              key={source.id}
              onClick={() => setFilter(source.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                filter === source.id
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {source.name}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading && news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={40} className="animate-spin text-rose-500 mb-4" />
            <p className="font-medium">প্রতিদ্বন্দ্বীদের ফিড লোড করা হচ্ছে...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((item) => (
              <div 
                key={item.id} 
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    {item.sourceName}
                  </span>
                  <div className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <Activity size={12} />
                    {new Date(item.pubDate).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 leading-snug flex-1">
                  {item.title}
                </h3>
                
                <a 
                  href={item.link} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900/50 rounded-xl transition-colors font-medium text-sm"
                >
                  <Eye size={16} /> বিস্তারিত পড়ুন
                </a>
              </div>
            ))}
            
            {filteredNews.length === 0 && (
              <div className="col-span-full flex justify-center py-10 text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                কোনো খবর পাওয়া যায়নি।
              </div>
            )}
          </div>
        )}

      </div>
    </ResearchDashboard>
  );
}
