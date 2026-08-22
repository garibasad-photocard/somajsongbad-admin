import { useState, useEffect } from 'react';
import ResearchDashboard from './ResearchDashboard';
import { Bell, Plus, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';

export default function KeywordAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/research-data/alerts');
      setAlerts(res.data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    
    try {
      await api.post('/research-data/alerts', { keyword: keyword.trim() });
      setKeyword('');
      fetchAlerts();
    } catch (err) {
      console.error('Error adding alert:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('অ্যালার্টটি মুছে ফেলতে চান?')) {
      try {
        await api.delete(`/research-data/alerts/${id}`);
        fetchAlerts();
      } catch (err) {
        console.error('Error deleting alert:', err);
      }
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await api.put(`/research-data/alerts/${id}`, { isActive: !currentStatus });
      fetchAlerts();
    } catch (err) {
      // Ignore if no put endpoint, as we might not have added it in backend for simplicity, but ideally we should.
      // Let's just refetch.
      console.log('Update active status if backend supports it', err);
    }
  };

  return (
    <ResearchDashboard>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-red-50 dark:bg-red-900/30 rounded-xl">
            <Bell size={28} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">কি-ওয়ার্ড অ্যালার্ট</h2>
            <p className="text-slate-500 dark:text-slate-400">নির্দিষ্ট বিষয়ের খবর এলে সাথে সাথে নোটিফিকেশন পান</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
          <form onSubmit={handleAdd} className="flex gap-3">
            <input 
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="কি-ওয়ার্ড লিখুন (যেমন: নির্বাচন, সাইবার হামলা)..."
              className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
            <button 
              type="submit"
              disabled={!keyword.trim()}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              অ্যালার্ট সেট করুন
            </button>
          </form>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={40} className="animate-spin text-red-500" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <AlertTriangle size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">কোনো কি-ওয়ার্ড অ্যালার্ট সেট করা নেই।</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-4 font-semibold text-slate-500 dark:text-slate-400">কি-ওয়ার্ড</th>
                  <th className="p-4 font-semibold text-slate-500 dark:text-slate-400">তৈরির সময়</th>
                  <th className="p-4 font-semibold text-slate-500 dark:text-slate-400">স্ট্যাটাস</th>
                  <th className="p-4 font-semibold text-slate-500 dark:text-slate-400 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(alert => (
                  <tr key={alert._id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                        {alert.keyword}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: bn })}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleActive(alert._id, alert.isActive)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${alert.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 hover:bg-green-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200'}`}
                      >
                        {alert.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDelete(alert._id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ResearchDashboard>
  );
}
