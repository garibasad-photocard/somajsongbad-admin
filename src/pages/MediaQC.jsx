import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X, FileText, ExternalLink, Image as ImageIcon, Trash2, AlertCircle, BarChart3 } from 'lucide-react'
import api from '../services/api'

export default function MediaQC() {
  const navigate = useNavigate()
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [remarks, setRemarks] = useState({})
  const [processingId, setProcessingId] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [activeTab, setActiveTab] = useState('pending') // 'pending' | 'rejected'

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const res = await api.get('/media')
      setMedia(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedia()
  }, [])

  // Filter items
  const pendingMedia = media.filter(m => m.status === 'pending' || m.status === 'undefined' || !m.status)
  const rejectedMedia = media.filter(m => m.status === 'rejected')
  const approvedMedia = media.filter(m => m.status === 'approved')

  // Group media by taskId or title or upload batch/time
  const groupMedia = (mediaList) => {
    const groups = {}
    mediaList.forEach(m => {
      // Use taskId, or title, or if neither exists, group by upload timestamp (within same minute) or category
      let key = m.taskId || m.title || (m.createdAt ? m.createdAt.slice(0, 16) : 'Single Uploads')
      if (!groups[key]) {
        groups[key] = {
          key: key,
          title: m.title || 'মিডিয়া আপলোড সেট',
          category: m.category || 'সাধারণ',
          taskId: m.taskId || 'Batch',
          items: []
        }
      }
      groups[key].items.push(m)
    })
    return Object.values(groups)
  }

  const pendingGroups = groupMedia(pendingMedia)
  const rejectedGroups = groupMedia(rejectedMedia)

  const handleApprove = async (id) => {
    setProcessingId(id)
    try {
      await api.post(`/media/status`, { 
        id: id,
        status: 'approved', 
        qcRemarks: remarks[id] || 'Approved by Editor' 
      })
      // Update local state so it leaves pending list and joins approved list
      setMedia(media.map(m => (m._id === id || m.id === id || m.customId === id || m.name === id) ? { ...m, status: 'approved' } : m))
    } catch (err) {
      console.error(err)
      alert('Approval failed. Please check your connection or login session.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id) => {
    let qcReason = remarks[id]
    if (!qcReason?.trim()) {
      qcReason = window.prompt('অনুগ্রহ করে বাতিলের কারণ (QC remarks) লিখুন:')
      if (!qcReason?.trim()) {
        alert('বাতিল করার জন্য কারণ বলা আবশ্যক।')
        return
      }
      // Update remarks state with prompted value
      setRemarks(prev => ({ ...prev, [id]: qcReason }))
    }
    setProcessingId(id)
    try {
      await api.post(`/media/status`, { 
        id: id,
        status: 'rejected', 
        qcRemarks: qcReason 
      })
      // Update local state so it moves instantly to the rejected tab
      setMedia(media.map(m => (m._id === id || m.id === id || m.customId === id || m.name === id) ? { ...m, status: 'rejected', qcRemarks: qcReason } : m))
    } catch (err) {
      console.error(err)
      alert('Rejection failed')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই বাতিলকৃত মিডিয়াটি স্থায়ীভাবে ডিলিট করতে চান?')) return
    setProcessingId(id)
    try {
      await api.delete(`/media/${id}`)
      setMedia(media.filter(m => !(m._id === id || m.id === id || m.customId === id || m.name === id)))
    } catch (err) {
      console.error(err)
      alert('Failed to delete media')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRemarkChange = (id, val) => {
    setRemarks(prev => ({ ...prev, [id]: val }))
  }

  const getImageUrl = (path) => path?.startsWith('http') ? path : `http://localhost:5001${path}`

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 bg-[#f7f9fc] dark:bg-slate-900 min-h-screen">
      {/* Header section matching mockup perfectly */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
        <div>
          <p className="text-xs font-bold text-amber-700 dark:text-amber-500 tracking-widest uppercase mb-1">
            PHOTO DESK · QC & APPROVALS
          </p>
          <h1 className="text-3xl font-extrabold text-[#0f172a] dark:text-white mb-2 tracking-tight">
            মিডিয়া কোয়ালিটি কন্ট্রোল ও অনুমোদন
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">
            একই ইভেন্ট বা আপলোড সেটের ছবিগুলো পাশাপাশি প্রদর্শিত হয়। প্রতিটি ছবির নিচে ক্যাপশন ও Accept/Reject বাটন রয়েছে।
          </p>
        </div>
        <button 
          onClick={() => navigate('/media')}
          className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 px-5 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <span>Media library (মিডিয়া লাইব্রেরি)</span>
          <ExternalLink size={15} className="text-slate-400" />
        </button>
      </div>

      {/* QC STATS DASHBOARD - CLEAN ELEGANT ASSIGNMENT BOARD STYLE */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/60 pb-3">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 size={18} className="text-amber-600 dark:text-amber-500" />
            <span>মিডিয়া কিউসি রিয়েল-টাইম স্ট্যাটাস ড্যাশবোর্ড</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold">লাইভ কোয়ালিটি কন্ট্রোল ওভারভিউ</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-center items-center text-center">
            <p className="text-3xl font-bold text-gray-800 dark:text-white mb-1">{media.length}</p>
            <p className="text-[11px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider">মোট মিডিয়া</p>
          </div>
          <div className="bg-amber-50/50 dark:bg-slate-900/50 rounded-xl p-4 border border-amber-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-center items-center text-center">
            <p className="text-3xl font-bold text-amber-700 dark:text-amber-400 mb-1">{pendingMedia.length}</p>
            <p className="text-[11px] font-bold text-amber-800 dark:text-amber-500 uppercase tracking-wider">অপেক্ষমান (Pending)</p>
          </div>
          <div className="bg-emerald-50/50 dark:bg-slate-900/50 rounded-xl p-4 border border-emerald-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-center items-center text-center">
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mb-1">{approvedMedia.length}</p>
            <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-500 uppercase tracking-wider">অনুমোদিত (Approved)</p>
          </div>
          <div className="bg-rose-50/50 dark:bg-slate-900/50 rounded-xl p-4 border border-rose-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-center items-center text-center">
            <p className="text-3xl font-bold text-rose-700 dark:text-rose-400 mb-1">{rejectedMedia.length}</p>
            <p className="text-[11px] font-bold text-rose-800 dark:text-rose-500 uppercase tracking-wider">বাতিলকৃত (Rejected)</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-sm transition-all shadow-sm ${activeTab === 'pending' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-slate-700'}`}
        >
          <span>অপেক্ষমান মিডিয়া (Pending QC)</span>
          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${activeTab === 'pending' ? 'bg-amber-700 text-amber-50' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
            {pendingMedia.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-sm transition-all shadow-sm ${activeTab === 'rejected' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-slate-700'}`}
        >
          <span>রিজেক্ট মিডিয়া (Rejected Media)</span>
          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${activeTab === 'rejected' ? 'bg-rose-700 text-rose-50' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
            {rejectedMedia.length}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-500">
          <p className="text-sm font-medium animate-pulse">Loading QC assets...</p>
        </div>
      ) : activeTab === 'pending' ? (
        /* PENDING MEDIA TAB */
        pendingGroups.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-16 text-center shadow-sm flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Check size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              No assets pending quality control (কোনো মিডিয়া অপেক্ষমান নেই)
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md">
              সবগুলো আপলোড করা মিডিয়া চেক করা হয়েছে। অনুমোদিত মিডিয়াগুলো মিডিয়া লাইব্রেরিতে এবং বাতিল মিডিয়াগুলো রিজেক্ট ট্যাবে রয়েছে।
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {pendingGroups.map((group) => (
              <div key={group.key} className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden p-6 space-y-6">
                {/* Group / Event Header */}
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/60 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-800/50">
                        {group.category}
                      </span>
                      <span className="text-xs font-bold text-slate-400">· {group.items.length}টি ছবি (Upload Set)</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {group.title}
                    </h2>
                  </div>
                  <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold tracking-wider rounded-xl border border-amber-200 dark:border-amber-800/50 uppercase">
                    PENDING QC
                  </span>
                </div>

                {/* Grid of Images (Side by Side / পাশাপাশি) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {group.items.map((m) => (
                    <div key={m._id} className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-700/80 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                      {/* Image thumbnail */}
                      <div className="w-full aspect-video bg-slate-100 dark:bg-slate-900 relative overflow-hidden min-h-[200px]">
                        {m.url.match(/\.(mp4|webm|mov)$/i) || m.type === 'video' ? (
                          <video src={getImageUrl(m.url)} className="w-full h-full object-cover absolute inset-0" controls muted />
                        ) : m.url.match(/\.pdf$/i) || m.type === 'pdf' ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-50 dark:bg-rose-900/20 text-rose-600 p-4 text-center">
                            <FileText size={40} className="mb-2" />
                            <span className="text-xs font-bold">PDF Document</span>
                          </div>
                        ) : (
                          <img src={getImageUrl(m.url)} alt={m.name} className="w-full h-full object-cover absolute inset-0" />
                        )}
                        <span className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur text-white text-[10px] font-mono px-2 py-0.5 rounded">
                          {m.customId || `IMG_2026_${m._id.slice(-6).toUpperCase()}`}
                        </span>
                      </div>

                      {/* Content & Caption below image */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 mb-2">
                            {m.caption || m.title || m.name.replace(/\.[^/.]+$/, "")}
                          </p>

                          {/* Tags */}
                          <div className="flex flex-wrap items-center gap-1 mb-3">
                            {(m.tags && m.tags.length > 0 ? m.tags : ['#flood', '#sylhet']).map((tag, idx) => (
                              <span key={idx} className="text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* QC Remarks Input */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                              QC Remarks (বাতিলের কারণ)
                            </label>
                            <textarea
                              value={remarks[m._id] || ''}
                              onChange={(e) => handleRemarkChange(m._id, e.target.value)}
                              placeholder="বাতিল করতে চাইলে কারণ লিখুন..."
                              rows={2}
                              className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50 placeholder:text-slate-400 transition-all resize-none"
                            />
                          </div>
                        </div>

                        {/* Accept / Reject Buttons */}
                        <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-slate-800/80">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              disabled={processingId === m._id}
                              onClick={() => handleApprove(m._id)}
                              className="flex items-center justify-center gap-1.5 bg-[#785b0f] hover:bg-[#634b0c] text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm"
                            >
                              <Check size={14} />
                              <span>Accept</span>
                            </button>
                            <button
                              disabled={processingId === m._id}
                              onClick={() => handleReject(m._id)}
                              className="flex items-center justify-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm"
                            >
                              <X size={14} />
                              <span>Reject</span>
                            </button>
                          </div>
                          <button
                            onClick={() => setSelectedDetail(m)}
                            className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-center block w-full pt-1"
                          >
                            বিস্তারিত দেখুন (Details)
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* REJECTED MEDIA TAB */
        rejectedGroups.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-16 text-center shadow-sm flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              কোনো বাতিলকৃত মিডিয়া নেই (No Rejected Media)
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md">
              এডিটর কর্তৃক বাতিলকৃত কোনো ছবি বা ফাইল এই মুহূর্তে নেই। বাতিলকৃত মিডিয়াগুলো এখানে জমা হয় এবং পরবর্তীতে স্থায়ীভাবে ডিলিট করা যায়।
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {rejectedGroups.map((group) => (
              <div key={group.key} className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden p-6 space-y-6">
                {/* Group / Event Header */}
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/60 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-3 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg border border-rose-200 dark:border-rose-800/50">
                        {group.category}
                      </span>
                      <span className="text-xs font-bold text-slate-400">· {group.items.length}টি ছবি (Rejected Set)</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {group.title}
                    </h2>
                  </div>
                  <span className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs font-bold tracking-wider rounded-xl border border-rose-200 dark:border-rose-800/50 uppercase">
                    REJECTED
                  </span>
                </div>

                {/* Grid of Images (Side by Side / পাশাপাশি) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {group.items.map((m) => (
                    <div key={m._id} className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-700/80 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                      {/* Image thumbnail */}
                      <div className="w-full aspect-video bg-slate-100 dark:bg-slate-900 relative overflow-hidden min-h-[200px]">
                        {m.url.match(/\.(mp4|webm|mov)$/i) || m.type === 'video' ? (
                          <video src={getImageUrl(m.url)} className="w-full h-full object-cover absolute inset-0" controls muted />
                        ) : m.url.match(/\.pdf$/i) || m.type === 'pdf' ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-50 dark:bg-rose-900/20 text-rose-600 p-4 text-center">
                            <FileText size={40} className="mb-2" />
                            <span className="text-xs font-bold">PDF Document</span>
                          </div>
                        ) : (
                          <img src={getImageUrl(m.url)} alt={m.name} className="w-full h-full object-cover absolute inset-0" />
                        )}
                        <span className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur text-white text-[10px] font-mono px-2 py-0.5 rounded">
                          {m.customId || `IMG_2026_${m._id.slice(-6).toUpperCase()}`}
                        </span>
                      </div>

                      {/* Content & Caption below image */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 mb-2">
                            {m.caption || m.title || m.name.replace(/\.[^/.]+$/, "")}
                          </p>

                          {/* QC Remarks / Rejection Reason */}
                          <div className="mt-2 p-3 bg-rose-50/80 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 rounded-xl">
                            <h4 className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider mb-1">
                              বাতিল করার কারণ (Reason):
                            </h4>
                            <p className="text-xs text-rose-700 dark:text-rose-200 font-medium">
                              {m.qcRemarks || 'এডিটর কর্তৃক বাতিল করা হয়েছে।'}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-slate-800/80">
                          <button
                            disabled={processingId === m._id}
                            onClick={() => handleDelete(m._id)}
                            className="flex items-center justify-center gap-1.5 w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md hover:shadow-rose-600/20"
                          >
                            <Trash2 size={14} />
                            <span>স্থায়ীভাবে ডিলিট করুন (Delete)</span>
                          </button>
                          <button
                            onClick={() => setSelectedDetail(m)}
                            className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-center block w-full pt-1"
                          >
                            বিস্তারিত দেখুন (Details)
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Details Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={() => setSelectedDetail(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-gray-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Asset Details</h3>
              <button onClick={() => setSelectedDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <p><strong className="text-slate-900 dark:text-white">Asset ID:</strong> {selectedDetail.customId || `IMG_2026_${selectedDetail._id.slice(-6).toUpperCase()}`}</p>
              <p><strong className="text-slate-900 dark:text-white">File Name:</strong> {selectedDetail.name}</p>
              <p><strong className="text-slate-900 dark:text-white">File Size:</strong> {selectedDetail.size || 'N/A'}</p>
              <p><strong className="text-slate-900 dark:text-white">Category:</strong> {selectedDetail.category || 'সাধারণ'}</p>
              <p><strong className="text-slate-900 dark:text-white">Uploaded:</strong> {new Date(selectedDetail.createdAt || Date.now()).toLocaleString('bn-BD')}</p>
              <p><strong className="text-slate-900 dark:text-white">Status:</strong> <span className="font-bold uppercase">{selectedDetail.status}</span></p>
              {selectedDetail.qcRemarks && (
                <p><strong className="text-slate-900 dark:text-white">QC Remarks:</strong> {selectedDetail.qcRemarks}</p>
              )}
            </div>
            <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end">
              <button onClick={() => setSelectedDetail(null)} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
