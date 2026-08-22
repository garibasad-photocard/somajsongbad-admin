import { useState, useEffect, useMemo } from 'react';
import ResearchDashboard from './ResearchDashboard';
import { Rss, Loader2, AlertCircle, Clock, Filter } from 'lucide-react';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';

export default function NewsFeed() {
  const [feeds, setFeeds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchFeeds = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/rss');
      
      if (res.data.disabled) {
        setDisabled(true);
        setError(res.data.message || 'RSS ফিড বর্তমানে বন্ধ আছে।');
      } else {
        setFeeds(res.data.feeds || []);
      }
    } catch (err) {
      console.error('Error fetching feeds:', err);
      setError('লাইভ ফিড লোড করতে সমস্যা হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  const sources = useMemo(() => {
    const uniqueSources = new Set(feeds.map(f => f.source).filter(Boolean));
    return ['all', ...Array.from(uniqueSources)];
  }, [feeds]);

  const filteredFeeds = useMemo(() => {
    if (filter === 'all') return feeds;
    return feeds.filter(f => f.source === filter);
  }, [feeds, filter]);

  return (
    <ResearchDashboard>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Rss size={24} className="text-orange-500" />
            লাইভ নিউজ ফিড (অন্যান্য মিডিয়া)
          </h2>
          <button 
            onClick={fetchFeeds}
            disabled={isLoading}
            className="text-sm px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Rss size={16} />}
            রিফ্রেশ করুন
          </button>
        </div>

        {/* Source Filter */}
        {!isLoading && !error && feeds.length > 0 && sources.length > 1 && (
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 custom-scrollbar">
            <div className="flex items-center gap-2 text-slate-500 shrink-0">
              <Filter size={16} />
              <span className="text-sm font-medium">সোর্স:</span>
            </div>
            {sources.map(source => (
              <button
                key={source}
                onClick={() => setFilter(source)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === source
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {source === 'all' ? 'সব পত্রিকা' : source}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/30">
            <AlertCircle size={20} />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
            <p className="text-slate-500">নিউজ ফিড লোড হচ্ছে...</p>
          </div>
        )}

        {!isLoading && !error && filteredFeeds.length === 0 && (
          <div className="text-center py-20 text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            কোনো নিউজ পাওয়া যায়নি।
          </div>
        )}

        {!isLoading && !error && filteredFeeds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFeeds.map((news, idx) => (
              <a 
                key={idx}
                href={news.link}
                target="_blank"
                rel="noreferrer"
                className="block bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
              >
                <div className="flex gap-4">
                  {news.imageUrl && (
                    <img 
                      src={news.imageUrl} 
                      alt={news.title}
                      className="w-24 h-24 object-cover rounded-lg shrink-0 border border-slate-100 dark:border-slate-700"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                        {news.source}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock size={12} />
                        {news.pubDate ? formatDistanceToNow(new Date(news.pubDate), { addSuffix: true, locale: bn }) : ''}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {news.title}
                    </h3>
                    {news.summary && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                        {news.summary}
                      </p>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </ResearchDashboard>
  );
}
