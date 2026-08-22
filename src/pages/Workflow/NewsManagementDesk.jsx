import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Newspaper, User, Eye, CheckCircle, Play, RefreshCw, Pencil } from 'lucide-react'

const STAGE_COLORS = {
  sent_to_news_management: { label: 'NM-তে নতুন এসেছে', color: 'bg-blue-100 text-blue-700' },
  news_management_editing: { label: 'এডিটিং চলছে', color: 'bg-blue-200 text-blue-800' },
  page_planning:           { label: 'পেজ প্ল্যানিং', color: 'bg-violet-100 text-violet-700' },
  sent_to_own_page:        { label: 'নিজ পাতায়', color: 'bg-cyan-100 text-cyan-700' },
  proof_correction:        { label: 'প্রুফ সংশোধন', color: 'bg-rose-100 text-rose-700' },
  sent_to_proof:           { label: 'প্রুফে আছে', color: 'bg-violet-100 text-violet-700' },
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

function PagePlanModal({ assignment, onClose, onPlan }) {
  const [pageNumber, setPageNumber] = useState(assignment.printTrack?.pagePlan?.pageNumber || '')
  const [column, setColumn] = useState(assignment.printTrack?.pagePlan?.column || '')
  const [position, setPosition] = useState(assignment.printTrack?.pagePlan?.position || '')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handle = async () => {
    setSubmitting(true)
    const plan = { pageNumber, column, position }
    await onPlan(assignment._id, plan, note)
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">পেজ প্ল্যানিং ও প্রুফে পাঠানো</h3>
          <p className="text-xs text-gray-400 mt-0.5 truncate">"{assignment.title}"</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">পেজ নম্বর</label>
              <input type="text" value={pageNumber} onChange={e => setPageNumber(e.target.value)} placeholder="যেমন: ১, ২, বা খেলার পাতা"
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">কলাম</label>
              <input type="text" value={column} onChange={e => setColumn(e.target.value)} placeholder="যেমন: ৩ কলাম"
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">পজিশন (ঐচ্ছিক)</label>
            <input type="text" value={position} onChange={e => setPosition(e.target.value)} placeholder="যেমন: টপ স্টোরি, বটম রাইট"
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">নোট (প্রুফ রিডারের জন্য)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 resize-none" />
          </div>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">বাতিল</button>
          <button onClick={handle} disabled={submitting || !pageNumber}
            className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
          >{submitting ? 'পাঠানো হচ্ছে...' : 'প্রুফে পাঠান'}</button>
        </div>
      </div>
    </div>
  )
}

export default function NewsManagementDesk() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState('all')
  const [planModal, setPlanModal] = useState(null)
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

  const handleStartEditing = async (id) => {
    setProcessing(id)
    try {
      await api.post(`/print-workflow/${id}/advance`, { targetStage: 'news_management_editing', nmEditing: { editorId: user._id, editorName: user.name } })
      navigate(`/workflow/${id}`)
    } catch (err) { 
      alert(err.response?.data?.message || err.message) 
      setProcessing(null)
    }
  }
  
  const handleStartPlanning = async (id) => {
    setProcessing(id)
    try {
      await api.post(`/print-workflow/${id}/advance`, { targetStage: 'page_planning', note: 'পেজ প্ল্যানিং চলছে' })
      await fetchQueue()
    } catch (err) { alert(err.response?.data?.message || err.message) }
    setProcessing(null)
  }

  const handlePlanAndSendToProof = async (id, pagePlan, note) => {
    setProcessing(id)
    try {
      await api.post(`/print-workflow/${id}/advance`, { targetStage: 'sent_to_proof', pagePlan, note })
      await fetchQueue()
    } catch (err) { alert(err.response?.data?.message || err.message) }
    setProcessing(null)
  }
  
  const handleApproveProofCorrection = async (id) => {
    setProcessing(id)
    try {
      await api.post(`/print-workflow/${id}/advance`, { targetStage: 'proof_approved', note: 'সংশোধন অনুমোদিত' })
      await fetchQueue()
    } catch (err) { alert(err.response?.data?.message || err.message) }
    setProcessing(null)
  }

  const filtered = stageFilter === 'all' ? assignments : assignments.filter(a => a.printTrack?.workflowStage === stageFilter)
  const pendingCount = assignments.filter(a => ['sent_to_news_management', 'news_management_editing'].includes(a.printTrack?.workflowStage)).length

  const counts = {
    all: assignments.length,
    sent_to_news_management: assignments.filter(a => a.printTrack?.workflowStage === 'sent_to_news_management').length,
    news_management_editing: assignments.filter(a => ['news_management_editing', 'page_planning'].includes(a.printTrack?.workflowStage)).length,
    sent_to_proof: assignments.filter(a => a.printTrack?.workflowStage === 'sent_to_proof').length,
    proof_correction: assignments.filter(a => a.printTrack?.workflowStage === 'proof_correction').length,
    sent_to_own_page: assignments.filter(a => a.printTrack?.workflowStage === 'sent_to_own_page').length,
    sent_to_page: assignments.filter(a => ['sent_to_page', 'page_makeup', 'executive_review', 'printed', 'published'].includes(a.printTrack?.workflowStage)).length,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Newspaper size={20} className="text-blue-600" />
            নিউজ ম্যানেজমেন্ট ডেস্ক
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-500">কপি এডিটিং, হেডলাইন এবং পেজ প্ল্যানিং</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{pendingCount} অপেক্ষায়</span>}
          <button onClick={fetchQueue} disabled={loading} className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 mb-2">
        {[
          { key: 'all', label: 'সব (All)', value: counts.all, active: 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 ring-2 ring-indigo-200', inactive: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100/50', text: 'text-indigo-600' },
          { key: 'sent_to_news_management', label: 'নতুন এসেছে', value: counts.sent_to_news_management, active: 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 ring-2 ring-blue-200', inactive: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 hover:bg-blue-100/50', text: 'text-blue-600' },
          { key: 'news_management_editing', label: 'এডিটিং চলছে', value: counts.news_management_editing, active: 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 ring-2 ring-amber-200', inactive: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800 hover:bg-amber-100/50', text: 'text-amber-600' },
          { key: 'sent_to_proof', label: 'প্রুফে আছে', value: counts.sent_to_proof, active: 'bg-violet-100 dark:bg-violet-900/40 border-violet-300 ring-2 ring-violet-200', inactive: 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800 hover:bg-violet-100/50', text: 'text-violet-600' },
          { key: 'proof_correction', label: 'প্রুফ সংশোধন', value: counts.proof_correction, active: 'bg-rose-100 dark:bg-rose-900/40 border-rose-300 ring-2 ring-rose-200', inactive: 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800 hover:bg-rose-100/50', text: 'text-rose-600' },
          { key: 'sent_to_own_page', label: 'নিজ পাতায়', value: counts.sent_to_own_page, active: 'bg-cyan-100 dark:bg-cyan-900/40 border-cyan-300 ring-2 ring-cyan-200', inactive: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-800 hover:bg-cyan-100/50', text: 'text-cyan-600' },
          { key: 'sent_to_page', label: 'পেজে পাঠানো', value: counts.sent_to_page, active: 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 ring-2 ring-emerald-200', inactive: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100/50', text: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.key} 
               onClick={() => setStageFilter(s.key)}
               className={`cursor-pointer p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center transition-all ${stageFilter === s.key ? `${s.active} scale-[1.02]` : s.inactive}`}>
            <span className={`text-2xl font-bold ${s.text}`}>{s.value}</span>
            <span className={`text-[11px] font-semibold ${s.text} opacity-80 mt-1 uppercase text-center`}>{s.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><RefreshCw size={24} className="animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-600">
          <Newspaper size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">কোনো নিউজ নেই</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
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
                const stage = a.printTrack?.workflowStage
                const cfg = STAGE_COLORS[stage] || { label: stage, color: 'bg-gray-100 text-gray-700' }
                const isProcessing = processing === a._id
                
                return (
                  <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white max-w-sm truncate cursor-pointer hover:text-blue-600 transition-colors" title={a.title} onClick={() => navigate(`/workflow/${a._id}`)}>
                      {a.title}
                      {a.priority === 'high' && <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-red-100 text-red-700 rounded-full font-bold">জরুরি</span>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-300">
                        <User size={13} className="text-gray-400" />
                        {a.assignerName || a.assigneeName || 'অজানা'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-medium px-2.5 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-md">
                        {a.edition === 'print' || a.edition === 'both' ? 'পেজ: ' + (a.printTrack?.pagePlan?.pageNumber && a.printTrack.pagePlan.pageNumber !== 'N/A' ? a.printTrack.pagePlan.pageNumber : (a.printEdition?.pageNumber || 'প্রথম পাতা')) : (a.category || 'ক্যাটাগরি নেই')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 dark:text-slate-400">
                      {formatTime(a.updatedAt)}
                      <div className="mt-1">
                        <span className={`px-1.5 py-0.5 text-[10px] rounded font-semibold ${cfg.color}`}>{cfg.label}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {stage === 'sent_to_news_management' && (
                          <button onClick={() => handleStartEditing(a._id)} disabled={isProcessing} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-md shadow-sm flex items-center gap-1 transition-all">
                            <Play size={12} /> এডিটিং শুরু
                          </button>
                        )}
                        {['news_management_editing', 'page_planning', 'sent_to_proof', 'sent_to_own_page'].includes(stage) && (
                          <button onClick={() => navigate(`/workflow/${a._id}`)} disabled={isProcessing} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold rounded-md transition-colors shadow-sm">
                            <Pencil size={12} /> এডিট করুন
                          </button>
                        )}
                        {stage === 'proof_correction' && (
                          <button onClick={() => handleApproveProofCorrection(a._id)} disabled={isProcessing} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold rounded-md transition-colors shadow-sm">
                            <CheckCircle size={12} /> ঠিক আছে
                          </button>
                        )}
                        <button onClick={() => navigate(`/workflow/${a._id}`)} className="p-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-md transition-colors" title="বিস্তারিত দেখুন">
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
        </div>
      )}

      {planModal && <PagePlanModal assignment={planModal} onClose={() => setPlanModal(null)} onPlan={handlePlanAndSendToProof} />}
    </div>
  )
}
