import React, { useState } from 'react';
import ResearchDashboard from './ResearchDashboard';
import { Search, Calendar, User, Tag, Loader2, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';

export default function HistoricalSearch() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [externalSources, setExternalSources] = useState([]);
  
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  const categories = ['জাতীয়', 'রাজনীতি', 'আন্তর্জাতিক', 'খেলা', 'বিনোদন', 'অর্থনীতি', 'প্রযুক্তি', 'লাইফস্টাইল'];
  
  const externalPublishers = [
    { id: 'prothomalo.com', label: 'প্রথম আলো' },
    { id: 'bd-pratidin.com', label: 'বাংলাদেশ প্রতিদিন' },
    { id: 'thedailystar.net', label: 'ডেইলি স্টার' },
    { id: 'jugantor.com', label: 'যুগান্তর' },
    { id: 'samakal.com', label: 'সমকাল' }
  ];

  const handleSourceToggle = (id) => {
    setExternalSources(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() && !category && !startDate && !endDate) return;
    
    setIsLoading(true);
    setError('');
    setHasSearched(true);
    
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (category) params.append('category', category);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (externalSources.length > 0) params.append('externalSources', externalSources.join(','));
      
      const res = await api.get(`/research/archive?${params.toString()}`);
      
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setError('সার্চ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResearchDashboard>
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Search size={20} className="text-blue-500" />
            আর্কাইভ সার্চ (নিজস্ব নিউজ)
          </h2>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="যেকোনো বিষয়, শব্দ বা শিরোনাম দিয়ে খুঁজুন..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                সার্চ করুন
              </button>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-slate-400" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-transparent border border-slate-200 dark:border-slate-700 rounded p-1.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">সব ক্যাটাগরি</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border border-slate-200 dark:border-slate-700 rounded p-1.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-slate-400 text-sm">হতে</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border border-slate-200 dark:border-slate-700 rounded p-1.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* External Sources Checkboxes */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">বাহ্যিক সংবাদমাধ্যম (External Sources):</p>
              <div className="flex flex-wrap gap-3">
                {externalPublishers.map(pub => (
                  <label key={pub.id} className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 transition-colors">
                    <input 
                      type="checkbox" 
                      className="rounded text-blue-600 focus:ring-blue-500 bg-white border-slate-300"
                      checked={externalSources.includes(pub.id)}
                      onChange={() => handleSourceToggle(pub.id)}
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{pub.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-6 border border-red-100">
            {error}
          </div>
        )}

        {hasSearched && !isLoading && results.length === 0 && !error && (
          <div className="text-center py-12 text-slate-500">
            কোনো নিউজ পাওয়া যায়নি। অন্য কিছু লিখে খুঁজুন।
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-500 mb-2">
              {results.length} টি ফলাফল পাওয়া গেছে
            </p>
            {results.map((article) => (
              <div key={article._id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow group flex gap-4">
                {article.coverImage && (
                  <img src={article.coverImage} alt={article.title} className="w-32 h-24 object-cover rounded-lg shrink-0" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    <span className={`px-2 py-0.5 rounded ${article.isExternal ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'}`}>
                      {article.isExternal ? article.sourceName : (article.category || 'সাধারণ')}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {article.createdAt ? format(new Date(article.createdAt), 'dd MMM yyyy, p') : (article.pubDate ? format(new Date(article.pubDate), 'dd MMM yyyy, p') : '')}
                    </span>
                    {article.assigneeName && !article.isExternal && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {article.assigneeName}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-blue-600 transition-colors">
                    {article.isExternal ? (
                      <a href={article.link} target="_blank" rel="noreferrer" className="hover:underline">{article.title}</a>
                    ) : (
                      article.title
                    )}
                  </h3>
                  {article.synopsis && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {article.synopsis}
                    </p>
                  )}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {article.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex items-center">
                  {article.isExternal ? (
                    <button 
                      onClick={() => window.open(article.link, '_blank')}
                      className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                      title="মূল পত্রিকায় পড়ুন"
                    >
                      <ArrowRight size={20} />
                    </button>
                  ) : (
                    <button 
                      onClick={() => window.open(`/articles/edit/${article._id}`, '_blank')}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="আর্টিকেলটি খুলুন"
                    >
                      <ArrowRight size={20} />
                    </button>
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
