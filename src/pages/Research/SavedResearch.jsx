import React, { useState, useEffect } from 'react';
import ResearchDashboard from './ResearchDashboard';
import { Bookmark, ExternalLink, Trash2, Loader2, Link as LinkIcon, FileText, Bot } from 'lucide-react';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';

export default function SavedResearch() {
  const [savedItems, setSavedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSavedItems();
  }, []);

  const fetchSavedItems = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/research-data/saved');
      setSavedItems(res.data);
    } catch (err) {
      console.error('Error fetching saved research:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('সংরক্ষিত আইটেমটি মুছে ফেলতে চান?')) {
      try {
        await api.delete(`/research-data/saved/${id}`);
        fetchSavedItems();
      } catch (err) {
        console.error('Error deleting item:', err);
      }
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'article': return <FileText size={18} className="text-blue-500" />;
      case 'ai_response': return <Bot size={18} className="text-purple-500" />;
      case 'note': return <Bookmark size={18} className="text-amber-500" />;
      default: return <LinkIcon size={18} className="text-slate-500" />;
    }
  };

  const getTypeName = (type) => {
    switch(type) {
      case 'article': return 'আর্টিকেল';
      case 'ai_response': return 'AI রেসপন্স';
      case 'note': return 'নোট';
      default: return 'লিংক';
    }
  };

  return (
    <ResearchDashboard>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
            <Bookmark size={28} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">সংরক্ষিত রিসার্চ</h2>
            <p className="text-slate-500 dark:text-slate-400">আপনার সেভ করা গুরুত্বপূর্ণ আর্টিকেল, তথ্য ও লিংকসমূহ</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={40} className="animate-spin text-amber-500" />
          </div>
        ) : savedItems.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Bookmark size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">কোনো কিছু সেভ করা নেই।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedItems.map(item => (
              <div key={item._id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 px-2.5 py-1 rounded-lg">
                    {getTypeIcon(item.type)}
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{getTypeName(item.type)}</span>
                  </div>
                  <button 
                    onClick={() => handleDelete(item._id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 line-clamp-2">
                  {item.title || 'শিরোনাম নেই'}
                </h3>
                
                {item.content && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-3 flex-1">
                    {item.content}
                  </p>
                )}

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700">
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: bn })}
                  </span>
                  {item.link && (
                    <a 
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md transition-colors"
                    >
                      ওপেন করুন <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ResearchDashboard>
  );
}
