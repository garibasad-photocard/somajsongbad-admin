import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Newspaper, User, Eye, CheckCircle, RefreshCw, Send, Edit2, XCircle, Edit3 } from 'lucide-react'
import OnlineArticlePreviewModal from '../../components/Modals/OnlineArticlePreviewModal'
import OnlineQuickEditModal from '../../components/Modals/OnlineQuickEditModal'

function ReturnModal({ assignment, onClose, onReturn }) {
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handle = async () => {
    if (!note.trim()) { alert('কারণ লিখুন'); return }
    setSubmitting(true)
    await onReturn(assignment._id, note)
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h3 className="font-semibold text-rose-600">চিফ রিপোর্টারকে ফেরত পাঠান</h3>
          <p className="text-xs text-gray-400 mt-0.5 truncate">"{assignment.title}"</p>
        </div>
        <div className="p-6">
          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">কী কারণে ফেরত দিচ্ছেন? <span className="text-rose-500">*</span></label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={4}
            placeholder="বিস্তারিত লিখুন..."
            className="w-full border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
          />
        </div>
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">বাতিল</button>
          <button onClick={handle} disabled={submitting || !note.trim()}
            className="px-5 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {submitting ? 'পাঠানো হচ্ছে...' : 'ফেরত পাঠান'}
          </button>
        </div>
      </div>
    </div>
  )
}

const STAGE_COLORS = {
  news_management_editing: { label: 'NM ডেস্কে', color: 'bg-cyan-100 text-cyan-700' },
  sent_to_proof:           { label: 'প্রুফে পাঠানো হয়েছে', color: 'bg-pink-100 text-pink-700' },
  published:               { label: 'পাবলিশড', color: 'bg-emerald-100 text-emerald-700' },
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

export default function OnlineNewsManagementDesk() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState('all')
  const [processing, setProcessing] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [returnModal, setReturnModal] = useState(null)

  const [previewData, setPreviewData] = useState(null)
  const [quickEditArticleId, setQuickEditArticleId] = useState(null)
  const [quickEditAssignmentId, setQuickEditAssignmentId] = useState(null)

  const fetchQueue = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setErrorMsg(null)
    try {
      // Assuming news_manager role has access to my-queue
      const res = await api.get('/print-workflow/my-queue')
      const onlineAssignments = res.data.filter(a => ['online', 'both', 'all'].includes(a.edition) && a.onlineTrack?.workflowStage)
      setAssignments(onlineAssignments)
    } catch (err) { 
      console.error(err) 
      setErrorMsg(err.message || 'Unknown error')
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

  const handleQuickEdit = (a) => {
    if (a.articleData?.articleId) {
      setQuickEditArticleId(a.articleData.articleId)
      setQuickEditAssignmentId(a._id)
    } else {
      alert('আর্টিকেল কন্টেন্ট পাওয়া যায়নি।')
    }
  }

  const getStage = (a) => a.onlineTrack?.workflowStage || 'assignment_created'

  const filtered = stageFilter === 'all' ? assignments :
                   stageFilter === 'pending' ? assignments.filter(a => getStage(a) === 'news_management_editing' && !a.isLocked) :
                   stageFilter === 'in_progress' ? assignments.filter(a => getStage(a) === 'news_management_editing' && a.isLocked) :
                   assignments.filter(a => getStage(a) === stageFilter)

  const pendingCount = assignments.filter(a => getStage(a) === 'news_management_editing' && !a.isLocked).length

  const counts = {
    all: assignments.length,
    pending: pendingCount,
    in_progress: assignments.filter(a => getStage(a) === 'news_management_editing' && a.isLocked).length,
    sent_to_proof: assignments.filter(a => getStage(a) === 'sent_to_proof').length,
    proof_correction: assignments.filter(a => getStage(a) === 'proof_correction').length,
    published: assignments.filter(a => getStage(a) === 'published').length,
  }

  const handlePublish = async (id) => {
    setProcessing(id)
    try {
      await api.put(`/workflow/${id}/online-track`, { workflowStage: 'published', status: 'published' })
      await fetchQueue()
    } catch (err) { alert('Error: ' + err.message) }
    setProcessing(null)
  }

  const handleSendToProof = async (id) => {
    setProcessing(id)
    try {
      await api.put(`/workflow/${id}/online-track`, { workflowStage: 'sent_to_proof', routingChoice: 'proof', status: 'review' })
      await fetchQueue()
    } catch (err) { alert('Error: ' + err.message) }
    setProcessing(null)
  }

  const handleReturn = async (id, note) => {
    try {
      await api.put(`/workflow/${id}/online-track`, { workflowStage: 'department_review', routingChoice: 'chief_reporter', editorNote: note, status: 'revision' })
      await fetchQueue()
    } catch (err) { alert('ত্রুটি: ' + err.message) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Newspaper size={20} className="text-cyan-600" />
            অনলাইন নিউজ ম্যানেজমেন্ট ডেস্ক
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-500">অনলাইন এডিশনের কন্টেন্ট সম্পাদনা ও প্রুফে প্রেরণ</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && <span className="px-2.5 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-semibold">{pendingCount} অপেক্ষায়</span>}
          <button onClick={fetchQueue} disabled={loading} className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        {[
          { key: 'all', label: 'সব (All)', value: counts.all, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-slate-800' },
          { key: 'pending', label: 'অপেক্ষায় (Pending)', value: counts.pending, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { key: 'in_progress', label: 'কাজ চলছে', value: counts.in_progress, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { key: 'sent_to_proof', label: 'প্রুফে পাঠানো', value: counts.sent_to_proof, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
          { key: 'proof_correction', label: 'প্রুফ কারেকশন', value: counts.proof_correction, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
          { key: 'published', label: 'পাবলিশড', value: counts.published, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map((s) => (
          <div key={s.key} onClick={() => setStageFilter(s.key)}
               className={`cursor-pointer p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center transition-all ${stageFilter === s.key ? `${s.bg} border-${s.color.split('-')[1]}-300 ring-2 ring-${s.color.split('-')[1]}-200 scale-[1.02]` : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800'}`}>
            <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
            <span className={`text-[11px] font-semibold ${s.color} opacity-80 mt-1 uppercase text-center`}>{s.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><RefreshCw size={24} className="animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-12 text-center">
          <CheckCircle size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <p className="text-gray-500 dark:text-slate-400 font-medium">কোনো অ্যাসাইনমেন্ট পাওয়া যায়নি। Debug: {assignments.length}</p>
          {errorMsg && <p className="text-red-500 mt-2 text-sm">{errorMsg}</p>}
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
                const stage = getStage(a)
                const cfg = STAGE_COLORS[stage] || { label: stage, color: 'bg-gray-100 text-gray-700' }
                
                let lastStageDate = a.updatedAt || a.createdAt;
                if (a.onlineTrack?.logs && a.onlineTrack.logs.length > 0) {
                  lastStageDate = a.onlineTrack.logs[a.onlineTrack.logs.length - 1].date;
                }
                const timeDiffMins = (new Date() - new Date(lastStageDate)) / (1000 * 60);
                const isSlaViolated = !a.isLocked && stage === 'news_management_editing' && timeDiffMins > 20;
                
                return (
                <tr key={a._id} className={`hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-colors ${isSlaViolated ? 'bg-red-50/50 dark:bg-red-900/10 border-l-4 border-l-red-500' : ''}`}>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white max-w-sm truncate" title={a.title}>
                    {a.title}
                    {isSlaViolated && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 animate-pulse">SLA BREACH</span>}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-300">
                      <User size={13} className="text-gray-400" />
                      {a.assignees?.map(as => as.name).join(', ') || a.assigneeName || 'অজানা'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] font-medium px-2.5 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-md">
                      {a.edition === 'print' || a.edition === 'both' ? 'পেজ: ' + (a.printEdition?.pageNumber || 'প্রথম পাতা') : (a.category || 'ক্যাটাগরি নেই')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500 dark:text-slate-400">
                    {formatTime(a.updatedAt)}
                    <div className="mt-1">
                      <span className={`px-1.5 py-0.5 text-[10px] rounded font-semibold ${cfg.color}`}>
                        {stage === 'news_management_editing' && a.isLocked ? 'কাজ চলছে' : 
                         stage === 'news_management_editing' ? 'অপেক্ষায়' : cfg.label}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setReturnModal(a)} disabled={processing === a._id}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md transition-colors shadow-sm" title="চিফ রিপোর্টারকে ফেরত পাঠান"
                      >
                        <XCircle size={13} />
                      </button>
                      <button onClick={() => navigate(a.edition === 'online' ? `/articles/edit/${a.articleData?.articleId}?assignmentId=${a._id}` : `/print/articles/edit/${a.articleData?.articleId}?assignmentId=${a._id}`)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors">
                        <Edit2 size={14} /> Full Edit
                      </button>
                      <button onClick={() => handleQuickEdit(a)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors">
                        <Edit3 size={14} /> Quick Edit
                      </button>
                      <button onClick={() => handlePreview(a)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors">
                        <Eye size={14} /> প্রিভিউ
                      </button>
                      {getStage(a) === 'news_management_editing' && (
                        <>
                          <button onClick={() => handleSendToProof(a._id)} disabled={processing === a._id}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-[11px] font-semibold rounded-md transition-colors shadow-sm" title="প্রুফ ডেস্কে পাঠান"
                          >
                            <Send size={11} /> প্রুফে পাঠান
                          </button>
                          <button onClick={() => handlePublish(a._id)} disabled={processing === a._id}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-semibold rounded-md transition-colors shadow-sm" title="সরাসরি পাবলিশ করুন"
                          >
                            <CheckCircle size={11} /> পাবলিশ
                          </button>
                        </>
                      )}
                      <button onClick={() => navigate(`/workflow/${a._id}`)}
                        className="p-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-md transition-colors"
                      >
                        <Eye size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {returnModal && <ReturnModal assignment={returnModal} onClose={() => setReturnModal(null)} onReturn={handleReturn} />}
      <OnlineArticlePreviewModal isOpen={!!previewData} onClose={() => setPreviewData(null)} articleData={previewData} />
      <OnlineQuickEditModal 
        isOpen={!!quickEditArticleId} 
        onClose={() => setQuickEditArticleId(null)} 
        articleId={quickEditArticleId} 
        assignmentId={quickEditAssignmentId}
        onSaved={() => fetchQueue(false)}
      />
    </div>
  )
}
