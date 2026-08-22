import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { CheckCircle, Eye, User, RefreshCw, XCircle, Pencil, Edit3 } from 'lucide-react'
import OnlineArticlePreviewModal from '../../components/Modals/OnlineArticlePreviewModal'
import OnlineQuickEditModal from '../../components/Modals/OnlineQuickEditModal'

const STAGE_COLORS = {
  sent_to_proof: { label: 'প্রুফে অপেক্ষমাণ', color: 'bg-pink-100 text-pink-700' },
  published:     { label: 'পাবলিশড', color: 'bg-emerald-100 text-emerald-700' },
  proof_correction: { label: 'NM ডেস্কে ফেরত', color: 'bg-amber-100 text-amber-700' }
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

function ReturnToNMModal({ assignment, onClose, onReturn }) {
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
          <h3 className="font-semibold text-rose-600">নিউজ ম্যানেজমেন্টে ফেরত পাঠান</h3>
          <p className="text-xs text-gray-400 mt-0.5 truncate">"{assignment.title}"</p>
        </div>
        <div className="p-6">
          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">কী সংশোধন করতে হবে? <span className="text-rose-500">*</span></label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={4}
            placeholder="প্রুফ রিডিংয়ে পাওয়া ভুলগুলো বিস্তারিত লিখুন..."
            className="w-full border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
          />
        </div>
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">বাতিল</button>
          <button onClick={handle} disabled={submitting || !note.trim()}
            className="px-5 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {submitting ? 'পাঠানো হচ্ছে...' : 'NM ডেস্কে ফেরত পাঠান'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OnlineProofDesk() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState('all')
  const [returnModal, setReturnModal] = useState(null)
  const [processing, setProcessing] = useState(null)

  const [previewData, setPreviewData] = useState(null)
  const [quickEditArticleId, setQuickEditArticleId] = useState(null)
  const [quickEditAssignmentId, setQuickEditAssignmentId] = useState(null)

  const fetchQueue = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const res = await api.get('/print-workflow/my-queue')
      const onlineAssignments = res.data.filter(a => ['online', 'both', 'all'].includes(a.edition) && a.onlineTrack?.workflowStage)
      setAssignments(onlineAssignments)
    } catch (err) { console.error('Failed to load assignments:', err) }
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
  const filtered = stageFilter === 'all' ? assignments : assignments.filter(a => {
    if (stageFilter === 'in_progress') return getStage(a) === 'sent_to_proof' && a.isLocked;
    if (stageFilter === 'sent_to_proof') return getStage(a) === 'sent_to_proof' && !a.isLocked;
    return getStage(a) === stageFilter;
  })
  const pendingCount = assignments.filter(a => getStage(a) === 'sent_to_proof' && !a.isLocked).length

  const counts = {
    all: assignments.length,
    sent_to_proof: assignments.filter(a => getStage(a) === 'sent_to_proof' && !a.isLocked).length,
    in_progress: assignments.filter(a => getStage(a) === 'sent_to_proof' && a.isLocked).length,
    proof_correction: assignments.filter(a => getStage(a) === 'proof_correction').length,
    published: assignments.filter(a => getStage(a) === 'published').length,
  }

  const handlePublish = async (id) => {
    setProcessing(id)
    try {
      await api.put(`/workflow/${id}/online-track`, { workflowStage: 'published', status: 'published' })
      await fetchQueue()
    } catch (err) { alert('ত্রুটি: ' + err.message) }
    setProcessing(null)
  }

  const handleReturn = async (id, note) => {
    try {
      await api.put(`/workflow/${id}/online-track`, { workflowStage: 'proof_correction', routingChoice: 'news_management', editorNote: note, status: 'revision' })
      await fetchQueue()
    } catch (err) { alert('ত্রুটি: ' + err.message) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle size={20} className="text-pink-600" />
            অনলাইন প্রুফ ডেস্ক
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-500">অনলাইন এডিশনের বানান সংশোধন ও ফাইনাল পাবলিশ</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && <span className="px-2.5 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-semibold">{pendingCount} প্রুফের অপেক্ষায়</span>}
          <button onClick={fetchQueue} disabled={loading} className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {[
          { key: 'all', label: 'সব (All)', value: counts.all, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-slate-800' },
          { key: 'sent_to_proof', label: 'অপেক্ষমাণ (Pending)', value: counts.sent_to_proof, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { key: 'in_progress', label: 'কাজ চলছে', value: counts.in_progress, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { key: 'proof_correction', label: 'NM ডেস্কে ফেরত', value: counts.proof_correction, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
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
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-12 text-center shadow-sm">
          <CheckCircle size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <p className="text-gray-500 dark:text-slate-400 font-medium">কোনো অ্যাসাইনমেন্ট পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400 font-medium">
                <th className="py-3 px-4 font-medium">শিরোনাম</th>
                <th className="py-3 px-4 font-medium">রিপোর্টার</th>
                <th className="py-3 px-4 font-medium">ক্যাটাগরি</th>
                <th className="py-3 px-4 font-medium">সময়</th>
                <th className="py-3 px-4 font-medium text-center">স্ট্যাটাস</th>
                <th className="py-3 px-4 font-medium text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
              {filtered.map(a => {
                const stage = getStage(a)
                const stageCfg = STAGE_COLORS[stage] || { label: stage, color: 'bg-gray-100 text-gray-700' }
                const isEditing = stage === 'sent_to_proof'
                
                let lastStageDate = a.updatedAt || a.createdAt;
                if (a.onlineTrack?.logs && a.onlineTrack.logs.length > 0) {
                  lastStageDate = a.onlineTrack.logs[a.onlineTrack.logs.length - 1].date;
                }
                const timeDiffMins = (new Date() - new Date(lastStageDate)) / (1000 * 60);
                const isSlaViolated = !a.isLocked && stage === 'sent_to_proof' && timeDiffMins > 10;
                
                return (
                <tr key={a._id} className={`hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-colors ${isSlaViolated ? 'bg-red-50/50 dark:bg-red-900/10 border-l-4 border-l-red-500' : isEditing ? 'border-l-4 border-l-pink-500' : ''}`}>
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
                      {a.category || 'ক্যাটাগরি নেই'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                    {formatTime(a.updatedAt)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 text-[10px] rounded font-semibold whitespace-nowrap ${stage === 'sent_to_proof' && a.isLocked ? 'bg-amber-100 text-amber-700' : stageCfg.color}`}>
                      {stage === 'sent_to_proof' && a.isLocked ? 'কাজ চলছে' : 
                       stage === 'sent_to_proof' ? 'অপেক্ষমাণ' : stageCfg.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setReturnModal(a)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors">
                              <XCircle size={14} /> ফেরত পাঠান
                            </button>
                            <button onClick={() => navigate(a.edition === 'online' ? `/articles/edit/${a.articleData?.articleId}?assignmentId=${a._id}` : `/print/articles/edit/${a.articleData?.articleId}?assignmentId=${a._id}`)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors">
                              <Pencil size={14} /> Full Edit
                            </button>
                            <button onClick={() => handleQuickEdit(a)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors">
                              <Edit3 size={14} /> Quick Edit (SpellCheck)
                            </button>
                            <button onClick={() => handlePreview(a)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors">
                              <Eye size={14} /> প্রিভিউ
                            </button>
                            {getStage(a) === 'sent_to_proof' && (
                              <button onClick={() => handlePublish(a._id)} disabled={processing === a._id} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors">
                                <CheckCircle size={14} /> পাবলিশ করুন
                              </button>
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
      {returnModal && <ReturnToNMModal assignment={returnModal} onClose={() => setReturnModal(null)} onReturn={handleReturn} />}
      <OnlineArticlePreviewModal isOpen={!!previewData} onClose={() => setPreviewData(null)} articleData={previewData} />
      <OnlineQuickEditModal 
        isOpen={!!quickEditArticleId} 
        onClose={() => setQuickEditArticleId(null)} 
        articleId={quickEditArticleId} 
        assignmentId={quickEditAssignmentId}
        onSaved={() => fetchQueue(false)}
        spellcheckEnabled={true}
      />
    </div>
  )
}
