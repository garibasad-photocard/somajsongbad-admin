import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  Newspaper, CheckCircle, XCircle, AlertCircle,
  Plus, Tag, UserCheck, RefreshCw, Flame, ArrowRight, ExternalLink, Trash2
} from 'lucide-react'
import api from '../../services/api'
import MediaFlowLogo from '../../components/common/MediaFlowLogo'
import { useNavigate } from 'react-router-dom'

export default function NewsTipPipeline() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ headline: '', tipContent: '', source: '' })
  const [actionLoading, setActionLoading] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [expandedTips, setExpandedTips] = useState({})

  const toggleExpand = (id) => {
    setExpandedTips(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const isEditor = ['super_admin', 'admin', 'chief_editor', 'executive_editor', 'managing_editor', 'news_manager', 'chief_reporter'].includes(user?.role)

  const fetchTips = async () => {
    try {
      setLoading(true)
      const res = await api.get('/news-tips')
      setTips(res.data)
    } catch (err) {
      console.error('Failed to fetch news tips', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTips()
    const interval = setInterval(fetchTips, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.headline.trim()) return
    try {
      setActionLoading('create')
      await api.post('/news-tips', formData)
      setFormData({ headline: '', tipContent: '', source: '' })
      setShowForm(false)
      fetchTips()
      showSuccess('উড়তি খবর সফলভাবে জমা হয়েছে!')
    } catch (err) {
      console.error('Failed to create tip', err)
      alert('খবর জমা দিতে সমস্যা হয়েছে: ' + (err.response?.data?.message || err.message))
    } finally {
      setActionLoading(null)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      setActionLoading(id)
      await api.put(`/news-tips/${id}/status`, { status })
      fetchTips()
      showSuccess('স্ট্যাটাস আপডেট করা হয়েছে!')
    } catch (err) {
      console.error('Failed to update status', err)
    } finally {
      setActionLoading(null)
    }
  }

  const convertToBreaking = async (id) => {
    try {
      setActionLoading(id)
      await api.post(`/news-tips/${id}/convert-breaking`)
      fetchTips()
      showSuccess('🔥 ব্রেকিং নিউজ সম্প্রচার শুরু হয়েছে!')
    } catch (err) {
      console.error('Failed to convert to breaking', err)
    } finally {
      setActionLoading(null)
    }
  }

  const convertToArticle = async (id) => {
    try {
      setActionLoading(id)
      const res = await api.post(`/news-tips/${id}/convert-article`)
      fetchTips()
      showSuccess('📝 নতুন আর্টিকেল ড্রাফট তৈরি হয়েছে!')
      if (res.data && res.data.article) {
        setTimeout(() => navigate(`/articles/edit/${res.data.article._id}`), 1500)
      }
    } catch (err) {
      console.error('Failed to convert to article', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই খবরটি ডিলিট করতে চান? এটি আর ফিরিয়ে আনা যাবে না।')) {
      try {
        setActionLoading(id)
        await api.delete(`/news-tips/${id}`)
        fetchTips()
        showSuccess('খবরটি ডিলিট করা হয়েছে।')
      } catch (err) {
        console.error('Failed to delete tip', err)
        alert('ডিলিট করতে সমস্যা হয়েছে: ' + (err.response?.data?.message || err.message))
      } finally {
        setActionLoading(null)
      }
    }
  }

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const unverifiedTips = tips.filter(t => t.verificationStatus === 'unverified')
  const verifiedTips = tips.filter(t => t.verificationStatus === 'verified')
  const falseTips = tips.filter(t => t.verificationStatus === 'false')

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">

      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="mb-3">
            <MediaFlowLogo variant="horizontal" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <span>💡</span> উড়তি খবর ভেরিফিকেশন ফ্লো
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 max-w-2xl">
            বিভিন্ন উৎস থেকে পাওয়া উড়তি খবর ও লিড যাচাই করুন। সত্য ও যাচাইকৃত খবরকে এক ক্লিকে সরাসরি
            <span className="font-semibold text-amber-600 dark:text-amber-400"> ব্রেকিং নিউজ টিকার বা পূর্ণাঙ্গ আর্টিকেলে</span> রূপান্তর করুন।
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTips}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold text-sm rounded-xl transition-all shadow-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>রিফ্রেশ</span>
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-600/20"
          >
            <Plus size={18} className={showForm ? 'rotate-45 transition-transform' : 'transition-transform'} />
            <span>+ নতুন উড়তি খবর যোগ</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 p-4 rounded-xl font-medium">
          <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ─── Submit Tip Form ─── */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 w-full overflow-hidden shadow-lg">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>💡</span> নতুন উড়তি খবর বা লিড জমা দিন
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <XCircle size={20} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block">
                খবরের শিরোনাম (Headline) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: মতিঝিলে নতুন বাণিজ্যিক ভবন উদ্বোধনের খবর..."
                value={formData.headline}
                onChange={e => setFormData({ ...formData, headline: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block">বিস্তারিত বিবরণ / লিড কনটেন্ট</label>
                <textarea
                  rows={4}
                  placeholder="খবরের বিস্তারিত তথ্য, ঘটনাস্থল বা প্রেক্ষাপট লিখুন..."
                  value={formData.tipContent}
                  onChange={e => setFormData({ ...formData, tipContent: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y min-h-[110px]"
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block">তথ্যের উৎস (Source) [ঐচ্ছিক]</label>
                  <input
                    type="text"
                    placeholder="যেমন: প্রত্যক্ষদর্শী, গোপন সূত্র..."
                    value={formData.source}
                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-3 rounded-xl flex items-start gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 text-amber-500 mt-0.5" />
                  <span>জমা দেওয়ার পর খবরটি <b>'উড়তি খবর (Unverified)'</b> কলামে জমা হবে এবং এডিটর তা যাচাই করবেন।</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold text-sm py-2.5 px-4 rounded-xl transition-all"
              >
                বাতিল করুন
              </button>
              <button
                type="submit"
                disabled={actionLoading === 'create'}
                className="flex items-center justify-center gap-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl transition-all shadow-sm"
              >
                {actionLoading === 'create' ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                <span>জমা দিন</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Columns / Board View ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Column 1: Unverified */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl">
            <h2 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <span>💡</span>
              <span>নতুন উড়তি খবর (অপেক্ষমান)</span>
            </h2>
            <span className="px-2.5 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold rounded-full">
              {unverifiedTips.length}
            </span>
          </div>

          {unverifiedTips.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 text-center text-sm text-gray-400 dark:text-slate-500 shadow-sm">
              কোনো অপেক্ষমান উড়তি খবর নেই
            </div>
          ) : (
            unverifiedTips.map(t => (
              <div key={t._id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-100 dark:border-amber-800/50">
                    ⏳ এডিটরের অপেক্ষায়
                  </span>
                  <span className="text-[11px] text-gray-400 dark:text-slate-500">
                    {new Date(t.createdAt).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-snug">{t.headline}</h3>

                {t.tipContent && (
                  <div>
                    <p className={`text-sm text-gray-600 dark:text-slate-300 whitespace-pre-line ${expandedTips[t._id] ? '' : 'line-clamp-3'}`}>
                      {t.tipContent}
                    </p>
                    <button
                      onClick={() => toggleExpand(t._id)}
                      className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 font-bold mt-1"
                    >
                      {expandedTips[t._id] ? '▲ সংক্ষেপ করুন' : '▼ বিস্তারিত দেখুন'}
                    </button>
                  </div>
                )}

                {t.source && (
                  <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    <Tag size={12} />
                    <span>উৎস: {t.source}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5 text-xs text-gray-500 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-300">
                      <UserCheck size={14} className="text-amber-500" />
                      <span>প্রেরক: {t.receivedByName || 'Reporter'}</span>
                    </div>
                    <button onClick={() => handleDelete(t._id)} className="text-rose-400 hover:text-rose-600 transition-colors p-1" title="ডিলিট করুন">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Editor Action Panel */}
                {isEditor && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-gray-200 dark:border-slate-700 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateStatus(t._id, 'verified')}
                      disabled={actionLoading === t._id}
                      className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-2 rounded-lg transition-all shadow-sm"
                    >
                      <CheckCircle size={14} />
                      <span>যাচাই করুন</span>
                    </button>
                    <button
                      onClick={() => updateStatus(t._id, 'false')}
                      disabled={actionLoading === t._id}
                      className="flex items-center justify-center gap-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 text-rose-600 border border-rose-200 dark:border-rose-800/50 font-bold text-xs py-2 px-2 rounded-lg transition-all"
                    >
                      <XCircle size={14} />
                      <span>ভুয়া খবর</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Column 2: Verified */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl">
            <h2 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle size={18} />
              <span>যাচাইকৃত ও অনুমোদিত</span>
            </h2>
            <span className="px-2.5 py-0.5 bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-full">
              {verifiedTips.length}
            </span>
          </div>

          {verifiedTips.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 text-center text-sm text-gray-400 dark:text-slate-500 shadow-sm">
              কোনো যাচাইকৃত খবর নেই
            </div>
          ) : (
            verifiedTips.map(t => (
              <div key={t._id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all border-l-4 border-l-emerald-500">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                    ✅ যাচাই সম্পন্ন
                  </span>
                  <span className="text-[11px] text-gray-400 dark:text-slate-500">
                    {new Date(t.createdAt).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-snug">{t.headline}</h3>

                {t.tipContent && (
                  <div>
                    <p className={`text-sm text-gray-600 dark:text-slate-300 whitespace-pre-line ${expandedTips[t._id] ? '' : 'line-clamp-3'}`}>
                      {t.tipContent}
                    </p>
                    <button
                      onClick={() => toggleExpand(t._id)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold mt-1"
                    >
                      {expandedTips[t._id] ? '▲ সংক্ষেপ করুন' : '▼ বিস্তারিত দেখুন'}
                    </button>
                  </div>
                )}

                {t.source && (
                  <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    <Tag size={12} />
                    <span>উৎস: {t.source}</span>
                  </div>
                )}

                {/* Converted badges */}
                {t.convertedToBreaking && (
                  <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 px-3 py-2 rounded-xl text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <Flame size={14} className="animate-pulse" />
                      <span>ব্রেকিং নিউজ লাইভ আছে</span>
                    </div>
                    <ExternalLink size={14} className="cursor-pointer hover:text-rose-700" onClick={() => navigate('/breaking-news')} />
                  </div>
                )}

                {t.convertedToArticle && (
                  <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-xl text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <Newspaper size={14} />
                      <span>আর্টিকেল ড্রাফট তৈরি হয়েছে</span>
                    </div>
                    {t.linkedArticleId && (
                      <ArrowRight size={14} className="cursor-pointer hover:text-indigo-700" onClick={() => navigate(`/articles/edit/${t.linkedArticleId}`)} />
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-1.5 text-xs text-gray-500 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-300">
                      <UserCheck size={14} className="text-emerald-500" />
                      <span>প্রেরক: {t.receivedByName || 'Reporter'}</span>
                    </div>
                    <button onClick={() => handleDelete(t._id)} className="text-rose-400 hover:text-rose-600 transition-colors p-1" title="ডিলিট করুন">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Conversion Actions */}
                {isEditor && !t.convertedToBreaking && !t.convertedToArticle && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-gray-200 dark:border-slate-700 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => convertToBreaking(t._id)}
                      disabled={actionLoading === t._id}
                      className="flex items-center justify-center gap-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 px-2 rounded-lg transition-all shadow-sm"
                    >
                      <Flame size={14} />
                      <span>ব্রেকিং করুন</span>
                    </button>
                    <button
                      onClick={() => convertToArticle(t._id)}
                      disabled={actionLoading === t._id}
                      className="flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-2 rounded-lg transition-all shadow-sm"
                    >
                      <Newspaper size={14} />
                      <span>আর্টিকেল</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Column 3: False / Rejected */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-4 rounded-xl">
            <h2 className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <XCircle size={18} />
              <span>ভুয়া / বাতিলকৃত খবর</span>
            </h2>
            <span className="px-2.5 py-0.5 bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold rounded-full">
              {falseTips.length}
            </span>
          </div>

          {falseTips.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 text-center text-sm text-gray-400 dark:text-slate-500 shadow-sm">
              কোনো ভুয়া বা বাতিল খবর নেই
            </div>
          ) : (
            falseTips.map(t => (
              <div key={t._id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all border-l-4 border-l-rose-500">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-rose-700 dark:text-rose-300 font-bold bg-rose-50 dark:bg-rose-900/30 px-2.5 py-1 rounded-lg border border-rose-100 dark:border-rose-800/50">
                    ❌ ভুয়া / বাতিল
                  </span>
                  <span className="text-[11px] text-gray-400 dark:text-slate-500">
                    {new Date(t.createdAt).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-gray-500 dark:text-slate-400 leading-snug line-through decoration-rose-400/50">{t.headline}</h3>

                {t.tipContent && (
                  <div>
                    <p className={`text-sm text-gray-400 dark:text-slate-500 whitespace-pre-line ${expandedTips[t._id] ? '' : 'line-clamp-3'}`}>
                      {t.tipContent}
                    </p>
                    <button
                      onClick={() => toggleExpand(t._id)}
                      className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 font-bold mt-1"
                    >
                      {expandedTips[t._id] ? '▲ সংক্ষেপ করুন' : '▼ বিস্তারিত দেখুন'}
                    </button>
                  </div>
                )}

                {t.source && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-500 font-medium">
                    <Tag size={12} />
                    <span>উৎস: {t.source}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5 text-xs text-gray-500 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-300">
                      <UserCheck size={14} className="text-rose-500" />
                      <span>প্রেরক: {t.receivedByName || 'Reporter'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateStatus(t._id, 'unverified')}
                        disabled={actionLoading === t._id}
                        className="text-amber-500 hover:text-amber-700 transition-colors p-1"
                        title="পুনরায় যাচাই করুন"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(t._id)}
                        className="text-rose-400 hover:text-rose-600 transition-colors p-1"
                        title="ডিলিট করুন"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
