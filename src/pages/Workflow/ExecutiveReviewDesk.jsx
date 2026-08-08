import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { CheckCircle, XCircle, Clock, Eye, AlertTriangle, User, RefreshCw, Printer } from 'lucide-react'

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d
  const h = Math.floor(diff / 3600000)
  if (h < 1) return `${Math.floor(diff / 60000)} মিনিট আগে`
  if (h < 24) return `${h} ঘণ্টা আগে`
  return `${Math.floor(h / 24)} দিন আগে`
}

// Return to Makeup Modal
function ReturnToMakeupModal({ assignment, onClose, onReturn }) {
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handle = async () => {
    if (!note.trim()) { alert('সংশোধনের কারণ লিখুন'); return }
    setSubmitting(true)
    await onReturn(assignment._id, note)
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h3 className="font-semibold text-rose-600">মেকআপে ফেরত পাঠান</h3>
          <p className="text-xs text-gray-400 mt-0.5 truncate">"{assignment.title}"</p>
        </div>
        <div className="p-6">
          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">কী সংশোধন করতে হবে? <span className="text-rose-500">*</span></label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={4}
            placeholder="মেকআপের ভুলগুলো বিস্তারিত লিখুন..."
            className="w-full border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
          />
        </div>
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">বাতিল</button>
          <button onClick={handle} disabled={submitting || !note.trim()}
            className="px-5 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {submitting ? 'পাঠানো হচ্ছে...' : 'মেকআপে ফেরত পাঠান'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ExecutiveReviewDesk() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState('all')
  const [returnModal, setReturnModal] = useState(null)
  const [processing, setProcessing] = useState(null)

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const res = await api.get('/print-workflow/my-queue')
      setAssignments(res.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { fetchQueue() }, [])

  const handleApprove = async (id) => {
    setProcessing(id)
    try {
      await api.post(`/print-workflow/${id}/advance`, { targetStage: 'ready_for_print', note: 'এক্সিকিউটিভ এডিটর দ্বারা অনুমোদিত' })
      await fetchQueue()
    } catch (err) { alert(err.response?.data?.message || err.message) }
    setProcessing(null)
  }

  const handleReturnToMakeup = async (id, note) => {
    setProcessing(id)
    try {
      await api.post(`/print-workflow/${id}/advance`, { targetStage: 'makeup_correction', note })
      await fetchQueue()
    } catch (err) { alert(err.response?.data?.message || err.message) }
    setProcessing(null)
  }

  const filtered = stageFilter === 'all' ? assignments : assignments.filter(a => a.printTrack?.workflowStage === stageFilter)
  const pendingCount = assignments.filter(a => a.printTrack?.workflowStage === 'executive_review').length

  return (
    <div className="space-y-4 max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle size={24} className="text-indigo-600" />
            এক্সিকিউটিভ রিভিউ ডেস্ক
          </h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">প্রিন্টের আগে চূড়ান্ত অনুমোদন</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold shadow-sm">{pendingCount} অপেক্ষায়</span>}
          <button onClick={fetchQueue} disabled={loading} className="p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm bg-white dark:bg-slate-900">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap bg-white dark:bg-slate-900 p-2 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
        {[
          { key: 'all', label: 'সব' },
          { key: 'executive_review', label: 'রিভিউয়ের জন্য অপেক্ষায়' },
          { key: 'ready_for_print', label: 'প্রিন্টের জন্য প্রস্তুত' },
          { key: 'printed', label: 'ছাপা হয়েছে' }
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setStageFilter(key)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${stageFilter === key ? 'bg-indigo-600 text-white shadow-md' : 'bg-transparent text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
          >{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><RefreshCw size={28} className="animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-gray-300 dark:text-slate-600" />
          </div>
          <p className="text-gray-500 dark:text-slate-400 font-medium text-lg">কোনো নিউজ নেই</p>
          <p className="text-sm text-gray-400 mt-1">এই মুহূর্তে রিভিউ করার মতো কোনো আইটেম নেই</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => {
            const isProcessing = processing === a._id
            const stage = a.printTrack?.workflowStage
            const pagePlan = a.printTrack?.pagePlan
            
            return (
              <div key={a._id} className="bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/30 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-wider rounded-full font-bold ${stage === 'ready_for_print' ? 'bg-emerald-100 text-emerald-700' : stage === 'printed' ? 'bg-gray-100 text-gray-600' : 'bg-indigo-100 text-indigo-700'}`}>
                        {stage === 'ready_for_print' ? 'প্রস্তুত' : stage === 'printed' ? 'ছাপা হয়েছে' : 'রিভিউ'}
                      </span>
                      {a.priority === 'high' && <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-wider bg-red-100 text-red-700 rounded-full font-bold">জরুরি</span>}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug mb-3 line-clamp-2" title={a.title}>{a.title}</h3>

                    {/* Page Plan Info for context */}
                    {pagePlan && (
                      <div className="mb-3 text-xs flex flex-wrap gap-1.5 font-medium">
                        {pagePlan.pageNumber && <span className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-1 rounded-md border border-purple-100 dark:border-purple-800/50 flex items-center gap-1"><Printer size={12}/> পেজ {pagePlan.pageNumber}</span>}
                        {pagePlan.column && <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-800/50">{pagePlan.column}</span>}
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-md"><User size={12} />{a.assigneeName || 'অজানা'}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={12} />{formatTime(a.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-slate-800">
                  {stage === 'executive_review' ? (
                    <>
                      <button onClick={() => handleApprove(a._id)} disabled={isProcessing} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
                        <CheckCircle size={16} /> প্রিন্টের অনুমতি
                      </button>
                      <button onClick={() => setReturnModal(a)} disabled={isProcessing} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-800 hover:bg-rose-50 text-rose-600 text-sm font-semibold border border-rose-200 dark:border-rose-800/50 rounded-lg transition-colors">
                        <XCircle size={16} /> মেকআপে ফেরত
                      </button>
                    </>
                  ) : (
                    <button onClick={() => navigate(`/workflow/${a._id}`)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg transition-colors">
                      <Eye size={16} /> বিস্তারিত দেখুন
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {returnModal && <ReturnToMakeupModal assignment={returnModal} onClose={() => setReturnModal(null)} onReturn={handleReturnToMakeup} />}
    </div>
  )
}
