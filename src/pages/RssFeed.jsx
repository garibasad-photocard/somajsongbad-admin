import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rss, Edit3, ExternalLink, Search, Loader2, Settings, Power, PowerOff, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RssFeed() {
  const { user } = useAuth();
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [rssEnabled, setRssEnabled] = useState(true);
  const navigate = useNavigate();

  const canToggle = ['super_admin', 'managing_editor', 'admin', 'chief_editor'].includes(user?.role);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/rss/status');
      setRssEnabled(res.data.enabled);
    } catch (err) {
      console.error('Could not get RSS status', err);
    }
  };

  const fetchFeeds = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/rss');
      if (res.data.disabled) {
        setRssEnabled(false);
        setFeeds([]);
      } else {
        setRssEnabled(true);
        setFeeds(res.data.feeds || []);
      }
    } catch (err) {
      console.error('Error fetching RSS feeds:', err);
      setError('ফিড লোড করতে সমস্যা হয়েছে। দয়া করে পরে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchFeeds();
  }, []);

  const handleToggle = async () => {
    if (!canToggle) return;
    setToggling(true);
    try {
      const newState = !rssEnabled;
      await api.put('/rss/toggle', { enabled: newState });
      setRssEnabled(newState);
      if (newState) {
        // If enabling, reload feeds
        await fetchFeeds();
      } else {
        setFeeds([]);
      }
    } catch (err) {
      console.error('Failed to toggle RSS:', err);
    } finally {
      setToggling(false);
    }
  };

  const handleDraft = (news) => {
    navigate('/articles/new', { state: { rssData: news } });
  };

  const sources = [...new Set(feeds.map(f => f.source))];

  const filteredFeeds = feeds.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.summary?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = sourceFilter ? item.source === sourceFilter : true;
    return matchesSearch && matchesSource;
  });

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
            <Rss className="text-orange-500" size={28} />
            এআই নিউজ ফিড
          </h1>
          <p className="text-gray-500 dark:text-slate-400">প্রথম আলো, যুগান্তর ও অন্যান্য মাধ্যম থেকে লেটেস্ট খবর</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={fetchFeeds}
            disabled={loading || !rssEnabled}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            রিফ্রেশ
          </button>

          {/* Toggle Button - only for admins */}
          {canToggle && (
            <button
              onClick={handleToggle}
              disabled={toggling}
              title={rssEnabled ? 'RSS ফিড বন্ধ করুন' : 'RSS ফিড চালু করুন'}
              className={`relative flex items-center gap-2.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm border ${
                rssEnabled
                  ? 'bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-green-200 dark:shadow-green-900/30'
                  : 'bg-red-500 hover:bg-red-600 text-white border-red-600 shadow-red-200 dark:shadow-red-900/30'
              } ${toggling ? 'opacity-70 cursor-wait' : ''}`}
            >
              {toggling ? (
                <Loader2 size={16} className="animate-spin" />
              ) : rssEnabled ? (
                <Power size={16} />
              ) : (
                <PowerOff size={16} />
              )}
              {rssEnabled ? 'চালু আছে' : 'বন্ধ আছে'}

              {/* Live indicator dot */}
              {rssEnabled && !toggling && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
                </span>
              )}
            </button>
          )}

          {/* Settings */}
          <button
            onClick={() => navigate('/master-data')}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-sm font-medium"
          >
            <Settings size={16} />
            ফিড সেটিং
          </button>
        </div>
      </div>

      {/* Disabled Banner */}
      {!rssEnabled && (
        <div className="mb-6 flex items-center gap-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-2xl px-6 py-5">
          <div className="flex-shrink-0 w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center">
            <AlertCircle className="text-orange-500" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-orange-800 dark:text-orange-200 mb-1">RSS ফিড বর্তমানে বন্ধ আছে</h3>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              নতুন নিউজ আসছে না। {canToggle ? 'উপরের সবুজ বাটনে ক্লিক করে আবার চালু করুন।' : 'অ্যাডমিনকে চালু করতে বলুন।'}
            </p>
          </div>
          {canToggle && (
            <button
              onClick={handleToggle}
              disabled={toggling}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <Power size={15} />
              এখনই চালু করুন
            </button>
          )}
        </div>
      )}

      {/* Search & Filter — only when enabled */}
      {rssEnabled && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={18} />
              <input
                type="text"
                placeholder="খবর খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-slate-900"
              />
            </div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full sm:w-48 px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-slate-900"
            >
              <option value="">সব মাধ্যম</option>
              {sources.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-slate-500">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
          <p>ফিড লোড হচ্ছে, দয়া করে অপেক্ষা করুন...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-6 rounded-xl text-center border border-red-100 dark:border-red-800/50">
          <p>{error}</p>
        </div>
      ) : !rssEnabled ? null : filteredFeeds.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <p className="text-gray-500 dark:text-slate-400 text-lg">কোনো খবর পাওয়া যায়নি।</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">{filteredFeeds.length}টি খবর পাওয়া গেছে</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeeds.map((news, index) => (
              <div key={index} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                {news.imageUrl && (
                  <div className="h-48 overflow-hidden bg-gray-100 dark:bg-slate-800">
                    <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-md">
                      {news.source}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-slate-500">
                      {new Date(news.pubDate).toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-snug line-clamp-2" title={news.title}>
                    {news.title}
                  </h3>
                  <p className="text-gray-600 dark:text-slate-400 text-sm mb-4 line-clamp-3 flex-1">
                    {news.summary}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-100 dark:border-slate-800">
                    <a 
                      href={news.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 flex-1 py-2 px-3 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ExternalLink size={16} /> মূল খবর
                    </a>
                    <button 
                      onClick={() => handleDraft(news)}
                      className="flex items-center justify-center gap-1.5 flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Edit3 size={16} /> এডিট ও ড্রাফট
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
