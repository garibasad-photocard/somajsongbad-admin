import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import {
  CheckCircle, XCircle, User, Eye, Send, RefreshCw, Edit2
} from 'lucide-react'
import OnlineArticlePreviewModal from '../../components/Modals/OnlineArticlePreviewModal'

const STAGE_COLORS = {
  reporter_submitted:  { label: 'রিপোর্টার জমা দিয়েছে', color: 'bg-orange-100 text-orange-700' },
  returned_to_creator: { label: 'রিভিউ করুন', color: 'bg-amber-100 text-amber-700' },
  department_review:   { label: 'ডিপার্টমেন্ট রিভিউ', color: 'bg-indigo-100 text-indigo-700' },
  revision_required:   { label: 'সংশোধন পাঠানো হয়েছে', color: 'bg-red-100 text-red-700' },
  department_approved: { label: 'অনুমোদিত', color: 'bg-green-100 text-green-700' }
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d
  const h = Math.floor(diff / 3600000)
  if (h < 1) return `${Math.floor(diff / 60000)} মিনিট আগে`
  if (h < 24) return `${h} ঘণ্টা আগে`
  return `${Math.floor(h / 24)} দিন আগে`
}

// Routing Modal
function RoutingModal({ assignment, onClose, onRoute }) {
  const [choice, setChoice] = useState('news_management')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handle = async () => {
    setSubmitting(true)
    const targetStage = choice === 'news_management' 
      ? (assignment.edition === 'online' ? 'news_management_editing' : 'sent_to_news_management')
      : (assignment.edition === 'online' ? 'published' : 'sent_to_own_page')
    await onRoute(assignment._id, targetStage, note, choice)
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">পরবর্তী ধাপ নির্বাচন করুন</h3>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">"{assignment.title}"</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all"
              style={{ borderColor: choice === 'news_management' ? '#3b82f6' : '#e5e7eb' }}
              onClick={() => setChoice('news_management')}
            >
              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${choice === 'news_management' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                {choice === 'news_management' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">নিউজ ম্যানেজমেন্টে পাঠান</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Copy Editing, Headline, Page Planning → তারপর Proof</p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all"
              style={{ borderColor: choice === 'own_page' ? '#8b5cf6' : '#e5e7eb' }}
              onClick={() => setChoice('own_page')}
            >
              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${choice === 'own_page' ? 'border-violet-500 bg-violet-500' : 'border-gray-300'}`}>
                {choice === 'own_page' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{assignment.edition === 'online' ? 'সরাসরি পাবলিশ করুন' : 'সরাসরি নিজ পাতায় পাঠান'}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{assignment.edition === 'online' ? 'সরাসরি লাইভ হবে' : 'নিজস্ব Sub Editor → Proof → Page Makeup'}</p>
              </div>
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">নোট (ঐচ্ছিক)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="পাঠানোর কারণ বা নির্দেশনা লিখুন..."
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">বাতিল</button>
          <button onClick={handle} disabled={submitting}
            className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {submitting ? 'পাঠানো হচ্ছে...' : 'পাঠান'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Revision Modal
function RevisionModal({ assignment, onClose, onSend }) {
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handle = async () => {
    setSubmitting(true)
    await onSend(assignment._id, note)
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h3 className="font-semibold text-red-600">রিপোর্টারকে আবার সংশোধনের জন্য পাঠান</h3>
          <p className="text-xs text-gray-400 mt-0.5 truncate">"{assignment.title}"</p>
        </div>
        <div className="p-6">
          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">সংশোধনের কারণ <span className="text-red-500">*</span></label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={4}
            placeholder="কী কী পরিবর্তন করতে হবে তা বিস্তারিত লিখুন..."
            className="w-full border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          />
        </div>
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">বাতিল</button>
          <button onClick={handle} disabled={submitting || !note.trim()}
            className="px-5 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {submitting ? 'পাঠানো হচ্ছে...' : 'পাঠিয়ে দিন'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DepartmentQueue() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [stageFilter, setStageFilter] = useState('all')
  const [routingModal, setRoutingModal] = useState(null)
  const [revisionModal, setRevisionModal] = useState(null)
  const [processing, setProcessing] = useState(null)
  const [previewData, setPreviewData] = useState(null);

  const fetchQueue = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const res = await api.get('/print-workflow/my-queue')
      setAssignments(res.data)
    } catch (err) {
      console.error('Failed to fetch department queue', err)
    }
    if (showLoading) setLoading(false)
  }

  useEffect(() => { 
    fetchQueue() 
    const interval = setInterval(() => {
      fetchQueue(false)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handlePreview = async (a) => {
    try {
      if (a.articleData?.articleId) {
        const res = await api.get(`/articles/${a.articleData.articleId}`)
        setPreviewData(res.data)
      } else {
        alert('আর্টিকেল কন্টেন্ট পাওয়া যায়নি।')
      }
    } catch (err) {
      console.error(err)
      alert('প্রিভিউ লোড করতে সমস্যা হয়েছে।')
    }
  }

  const handleAdvance = async (id, targetStage, note, routingChoice) => {
    setProcessing(id)
    try {
      const assignment = assignments.find(a => a._id === id);
      if (assignment?.edition === 'online') {
        await api.put(`/workflow/${id}/online-track`, { workflowStage: targetStage, routingChoice, editorNote: note, status: targetStage === 'published' ? 'published' : 'review' })
      } else {
        await api.post(`/print-workflow/${id}/advance`, { targetStage, note })
      }
      await fetchQueue()
    } catch (err) {
      alert('ত্রুটি: ' + (err.response?.data?.message || err.message))
    }
    setProcessing(null)
  }

  const handleRevision = async (id, note) => {
    setProcessing(id)
    try {
      const assignment = assignments.find(a => a._id === id);
      if (assignment?.edition === 'online') {
        await api.put(`/workflow/${id}/online-track`, { workflowStage: 'revision_required', editorNote: note, status: 'revision' })
      } else {
        await api.post(`/print-workflow/${id}/advance`, { targetStage: 'revision_required', note })
      }
      await fetchQueue()
    } catch (err) {
      alert('ত্রুটি: ' + (err.response?.data?.message || err.message))
    }
    setProcessing(null)
  }

  const getStage = (a) => (a.edition === 'online' || a.edition === 'both') ? (a.onlineTrack?.workflowStage || 'assignment_created') : (a.printTrack?.workflowStage || 'assignment_created')

  const filtered = stageFilter === 'all'
    ? assignments
    : assignments.filter(a => getStage(a) === stageFilter)

  const pendingCount = assignments.filter(a =>
    ['reporter_submitted', 'returned_to_creator', 'department_review'].includes(getStage(a))
  ).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">ডিপার্টমেন্ট কিউ</h1>
          <p className="text-xs text-gray-400 dark:text-slate-500">রিপোর্টারের জমা দেওয়া নিউজ রিভিউ করুন</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">{pendingCount} অপেক্ষায়</span>
          )}
          <button onClick={fetchQueue} disabled={loading}
            className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Smart Filter Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { key: 'all', label: 'মোট নিউজ', value: assignments.length, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-slate-800' },
          { key: 'reporter_submitted', label: 'জমা দিয়েছে', value: assignments.filter(a => getStage(a) === 'reporter_submitted').length, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { key: 'returned_to_creator', label: 'রিভিউ করুন', value: assignments.filter(a => getStage(a) === 'returned_to_creator').length, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { key: 'department_review', label: 'রিভিউ চলছে', value: assignments.filter(a => getStage(a) === 'department_review').length, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { key: 'revision_required', label: 'সংশোধনে গেছে', value: assignments.filter(a => getStage(a) === 'revision_required').length, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
          { key: 'department_approved', label: 'অনুমোদিত', value: assignments.filter(a => getStage(a) === 'department_approved').length, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map(stat => (
          <div key={stat.key} onClick={() => setStageFilter(stat.key)}
               className={`cursor-pointer p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center transition-all ${stageFilter === stat.key ? `${stat.bg} border-${stat.color.split('-')[1]}-300 ring-2 ring-${stat.color.split('-')[1]}-200 scale-[1.02]` : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800'}`}>
            <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            <span className={`text-[11px] font-semibold ${stat.color} opacity-80 mt-1 uppercase text-center`}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={24} className="animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">কোনো নিউজ নেই</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400 font-medium">
                <th className="py-3 px-4 font-medium">শিরোনাম</th>
                <th className="py-3 px-4 font-medium">রিপোর্টার</th>
                <th className="py-3 px-4 font-medium">পেজ প্ল্যান / ক্যাটাগরি</th>
                <th className="py-3 px-4 font-medium">সময়</th>
                <th className="py-3 px-4 font-medium text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
              {filtered.map(a => {
                let lastStageDate = a.updatedAt || a.createdAt;
                if (a.onlineTrack?.logs && a.onlineTrack.logs.length > 0) {
                  lastStageDate = a.onlineTrack.logs[a.onlineTrack.logs.length - 1].date;
                }
                const timeDiffMins = (new Date() - new Date(lastStageDate)) / (1000 * 60);
                const isSlaViolated = !a.isLocked && timeDiffMins > 15 && ['reporter_submitted', 'submitted', 'review', 'department_review'].includes(getStage(a));

                return (
                  <tr key={a._id} className={`hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-colors ${isSlaViolated ? 'bg-red-50/50 dark:bg-red-900/10 border-l-4 border-l-red-500' : ''}`}>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white max-w-sm truncate" title={a.title}>
                      {a.title}
                      {isSlaViolated && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 animate-pulse">SLA BREACH</span>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-300">
                        <User size={13} className="text-gray-400" />
                        {a.assigneeName || a.assignees?.[0]?.name || 'অজানা'}
                      </div>
                    </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] font-medium px-2.5 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-md">
                      {a.edition === 'print' || a.edition === 'both' ? 'পেজ: ' + (a.printEdition?.pageNumber || 'প্রথম পাতা') : (a.category || 'ক্যাটাগরি নেই')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500 dark:text-slate-400">
                    {formatTime(a.updatedAt)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setRevisionModal(a)} disabled={processing === a._id}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md transition-colors shadow-sm" title="রিপোর্টারকে ফেরত পাঠান"
                      >
                        <XCircle size={13} />
                      </button>
                      <button onClick={() => navigate('/workflow/' + a._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold rounded-md transition-colors shadow-sm"
                      >
                        <Edit2 size={12} /> এডিট করুন
                      </button>
                      <button onClick={() => setRoutingModal(a)} disabled={processing === a._id}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-md transition-colors shadow-sm" title="সামনে পাঠান"
                      >
                        <Send size={13} />
                      </button>
                      <button onClick={() => handlePreview(a)}
                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-md transition-colors shadow-sm" title="প্রিভিউ"
                      >
                        <Eye size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {routingModal && <RoutingModal assignment={routingModal} onClose={() => setRoutingModal(null)} onRoute={handleAdvance} />}
      {revisionModal && <RevisionModal assignment={revisionModal} onClose={() => setRevisionModal(null)} onSend={handleRevision} />}
      <OnlineArticlePreviewModal isOpen={!!previewData} onClose={() => setPreviewData(null)} articleData={previewData} />
    </div>
  )
}
