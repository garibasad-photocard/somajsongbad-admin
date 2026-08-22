import { useState, useEffect } from 'react';
import api from '../../services/api';
import { TrendingUp, RefreshCw, PlusCircle, ExternalLink, Activity } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function TrendingDashboard() {
  const { t } = useLanguage();
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTrends = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/trending');
      if (res.data && res.data.topics) {
        setTrends(res.data.topics);
      } else {
        setTrends([]);
      }
    } catch (err) {
      console.error(err);
      setError('গুগল ট্রেন্ডস ডেটা লোড করতে সমস্যা হচ্ছে।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const handleCreateAssignment = (topicTitle) => {
    // This will route to assignment board or open a modal (to be integrated)
    // For now, let's copy to clipboard and alert
    navigator.clipboard.writeText(topicTitle);
    alert(`"${topicTitle}" কপি করা হয়েছে। অ্যাসাইনমেন্ট বোর্ডে গিয়ে পেস্ট করুন।`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 font-sans text-slate-900 dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
              <TrendingUp className="text-rose-500" size={28} />
              ট্রেন্ডিং টপিক রাডার
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
              Google Trends (বাংলাদেশ) থেকে আজকের সবচেয়ে আলোচিত বিষয়সমূহ
            </p>
          </div>
          <button 
            onClick={fetchTrends}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-4 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            রিফ্রেশ
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-xl font-bold border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Content Grid */}
        {!loading && !error && trends.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trends.map(trend => (
              <div key={trend.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                {trend.picture && (
                  <div className="h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                    <img src={trend.picture} alt={trend.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <h2 className="text-lg font-black leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {trend.title}
                    </h2>
                    {trend.traffic && (
                      <span className="shrink-0 bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] font-black px-2 py-1 rounded-md flex items-center gap-1 border border-rose-100 dark:border-rose-800/50">
                        <Activity size={10} />
                        {trend.traffic}
                      </span>
                    )}
                  </div>

                  {trend.news && trend.news.length > 0 && (
                    <div className="mb-4 flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">সম্পর্কিত খবর</p>
                      <ul className="space-y-2">
                        {trend.news.map((n, i) => (
                          <li key={i} className="text-sm font-medium text-slate-600 dark:text-slate-300 line-clamp-2">
                            <a href={n.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 flex items-start gap-1.5">
                              <ExternalLink size={12} className="shrink-0 mt-1 opacity-50" />
                              {n.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-700/50">
                    <button 
                      onClick={() => handleCreateAssignment(trend.title)}
                      className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl flex justify-center items-center gap-2 text-sm transition-colors shadow-sm"
                    >
                      <PlusCircle size={16} />
                      অ্যাসাইনমেন্ট তৈরি করুন
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && trends.length === 0 && (
          <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Activity size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">এই মুহূর্তে কোনো ট্রেন্ডিং টপিক পাওয়া যায়নি।</h3>
          </div>
        )}

      </div>
    </div>
  );
}
