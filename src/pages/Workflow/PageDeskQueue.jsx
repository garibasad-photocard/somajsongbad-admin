import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import api from '../../services/api'
import { Layout, CheckCircle, Clock, User, Eye, RefreshCw, ChevronRight, Printer, FileText } from 'lucide-react'

function formatTime(iso) {
  if (!iso) return ''
  const h = Math.floor((Date.now() - new Date(iso)) / 3600000)
  if (h < 1) return `${Math.floor((Date.now() - new Date(iso)) / 60000)} মিনিট আগে`
  if (h < 24) return `${h} ঘণ্টা আগে`
  return `${Math.floor(h / 24)} দিন আগে`
}

const STAGE_CFG = {
  sent_to_page: { label: 'পেজে এসেছে',    color: 'bg-emerald-100 text-emerald-700', pulse: true },
  page_makeup:  { label: 'মেকআপ চলছে',    color: 'bg-lime-100 text-lime-700',       pulse: false },
}

// MakeupApproveModal — sends to executive review
function SendToExecModal({ assignment, onClose, onSend }) {
  const [note, setNote] = useState('')
  const [execId, setExecId] = useState('')
  const [users, setUsers] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get('/users').then(r => {
      setUsers(r.data.filter(u => ['executive_editor', 'managing_editor', 'super_admin', 'admin'].includes(u.role)))
    }).catch(() => {})
  }, [])

  const handle = async () => {
    setSubmitting(true)
    await onSend(assignment._id, execId, note)
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">এক্সিকিউটিভ রিভিউতে পাঠান</h3>
          <p className="text-xs text-gray-400 mt-0.5 truncate">"{assignment.title}"</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">এক্সিকিউটিভ এডিটর</label>
            <select value={execId} onChange={e => setExecId(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">বেছে নিন...</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">নোট (ঐচ্ছিক)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="মেকআপ সম্পর্কে কোনো বিশেষ নির্দেশনা..."
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">বাতিল</button>
          <button onClick={handle} disabled={submitting || !execId}
            className="px-5 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg"
          >{submitting ? 'পাঠানো হচ্ছে...' : 'এক্সিকিউটিভে পাঠান'}</button>
        </div>
      </div>
    </div>
  )
}

export default function PageDeskQueue() {
  const { user } = useAuth()
  const { printPages } = useSettings()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageFilter, setPageFilter] = useState('all')
  const [execModal, setExecModal] = useState(null)
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

  const handleStartMakeup = async (id) => {
    setProcessing(id)
    try {
      await api.post(`/print-workflow/${id}/advance`, { targetStage: 'page_makeup', note: 'পেজ মেকআপ শুরু হয়েছে' })
      await fetchQueue()
    } catch (err) { alert(err.response?.data?.message || err.message) }
    setProcessing(null)
  }

  const handleSendToExec = async (id, execId, note) => {
    setProcessing(id)
    try {
      await api.post(`/print-workflow/${id}/advance`, {
        targetStage: 'executive_review',
        note: note || 'এক্সিকিউটিভ রিভিউতে পাঠানো হয়েছে',
        executiveEditorId: execId
      })
      await fetchQueue()
    } catch (err) { alert(err.response?.data?.message || err.message) }
    setProcessing(null)
  }

  const displayPages = printPages || []
  const filtered = pageFilter === 'all' ? assignments : assignments.filter(a => a.printTrack?.pagePlan?.pageNumber === pageFilter)
  const newItems = assignments.filter(a => a.printTrack?.workflowStage === 'sent_to_page').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Layout size={20} className="text-emerald-600" />
            পেজ ডেস্ক কিউ
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-500">পেজ মেকআপ ও এক্সিকিউটিভ রিভিউ পরিচালনা করুন</p>
        </div>
        <div className="flex items-center gap-2">
          {newItems > 0 && (
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">{newItems} নতুন</span>
          )}
          <button onClick={fetchQueue} disabled={loading} className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Smart Filter by Page */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div 
          onClick={() => setPageFilter('all')}
          className={`relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all duration-300 ${pageFilter === 'all' ? 'ring-2 ring-offset-2 ring-emerald-500 scale-[1.02] shadow-lg shadow-emerald-500/20' : 'opacity-85 hover:opacity-100 hover:scale-[1.02]'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 opacity-95" />
          <div className="relative z-10 text-white">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                <Layout size={18}/>
              </div>
              <span className="text-3xl font-bold tracking-tight">{assignments.length}</span>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-90">সব পেজ</p>
          </div>
        </div>

        {displayPages.map((page, idx) => {
          const count = assignments.filter(a => a.printTrack?.pagePlan?.pageNumber === page).length
          const colors = [
            'from-blue-600 to-blue-800',
            'from-emerald-500 to-emerald-700',
            'from-amber-500 to-amber-700',
            'from-purple-500 to-purple-700',
            'from-rose-500 to-rose-700',
            'from-cyan-600 to-cyan-800'
          ]
          const color = colors[idx % colors.length]
          return (
            <div 
              key={page}
              onClick={() => setPageFilter(page)}
              className={`relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all duration-300 ${pageFilter === page ? 'ring-2 ring-offset-2 ring-emerald-500 scale-[1.02] shadow-lg' : 'opacity-85 hover:opacity-100 hover:scale-[1.02]'}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-95`} />
              <div className="relative z-10 text-white">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                    <FileText size={18}/>
                  </div>
                  <span className="text-3xl font-bold tracking-tight">{count}</span>
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wider opacity-90">{page}</p>
              </div>
            </div>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><RefreshCw size={24} className="animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-600">
          <Layout size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">কোনো নিউজ নেই</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => {
            const stage = a.printTrack?.workflowStage
            const cfg = STAGE_CFG[stage] || {}
            const pagePlan = a.printTrack?.pagePlan
            const isProcessing = processing === a._id

            return (
              <div key={a._id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4">
                <div className="flex items-start gap-3">
                  {cfg.pulse && <span className="w-2 h-2 bg-emerald-400 rounded-full mt-1.5 shrink-0 animate-pulse" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                      {a.priority === 'high' && <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">জরুরি</span>}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{a.title}</h3>

                    {/* Page Plan Info */}
                    {pagePlan && pagePlan.pageNumber && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {pagePlan.pageNumber && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">পেজ {pagePlan.pageNumber}</span>
                        )}
                        {pagePlan.column && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">কলাম {pagePlan.column}</span>
                        )}
                        {pagePlan.position && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">{pagePlan.position}</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-400"><User size={11} />{a.assigneeName || 'অজানা'}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={11} />{formatTime(a.updatedAt)}</span>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/workflow/${a._id}`)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400">
                    <Eye size={14} />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                  {stage === 'sent_to_page' && (
                    <button onClick={() => handleStartMakeup(a._id)} disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <Layout size={13} />
                      {isProcessing ? 'শুরু হচ্ছে...' : 'মেকআপ শুরু করুন'}
                    </button>
                  )}
                  {stage === 'page_makeup' && (
                    <button onClick={() => setExecModal(a)} disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <Printer size={13} />
                      এক্সিকিউটিভে পাঠান
                    </button>
                  )}
                  <button onClick={() => navigate(`/workflow/${a._id}`)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-600 dark:text-slate-300 text-xs font-medium rounded-lg"
                  >
                    <Eye size={13} /> বিস্তারিত
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {execModal && (
        <SendToExecModal
          assignment={execModal}
          onClose={() => setExecModal(null)}
          onSend={handleSendToExec}
        />
      )}
    </div>
  )
}
