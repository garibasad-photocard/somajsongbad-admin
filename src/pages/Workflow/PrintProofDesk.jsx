import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { CheckCircle, Clock, Eye, AlertTriangle, User, RefreshCw, XCircle, Pencil } from 'lucide-react'

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d
  const h = Math.floor(diff / 3600000)
  if (h < 1) return `${Math.floor(diff / 60000)} মিনিট আগে`
  if (h < 24) return `${h} ঘণ্টা আগে`
  return `${Math.floor(h / 24)} দিন আগে`
}

// Return to NM Modal
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

export default function PrintProofDesk() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [activePageFilter, setActivePageFilter] = useState(null)
  const [returnModal, setReturnModal] = useState(null)
  
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setActivePageFilter(null)
  }
  const [processing, setProcessing] = useState(null)

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const queueRes = await api.get('/print-workflow/my-queue')
      setAssignments(queueRes.data)
    } catch (err) { console.error('Failed to load queue:', err) }
    
    try {
      const statsRes = await api.get('/print-workflow/proof-stats')
      setStats(statsRes.data)
    } catch (err) { 
      console.error('Failed to load stats:', err) 
      setStats({ arrived: [], pending: [], completed: [], returned: [] })
    }
    
    setLoading(false)
  }

  useEffect(() => { fetchQueue() }, [])

  const handleApprove = async (id) => {
    setProcessing(id)
    try {
      await api.post(`/print-workflow/${id}/advance`, { targetStage: 'sent_to_page', note: 'প্রুফিং সম্পন্ন' })
      await fetchQueue()
    } catch (err) { alert(err.response?.data?.message || err.message) }
    setProcessing(null)
  }

  const handleReturnToNM = async (id, note) => {
    setProcessing(id)
    try {
      await api.post(`/print-workflow/${id}/advance`, { targetStage: 'proof_correction', note })
      await fetchQueue()
    } catch (err) { alert(err.response?.data?.message || err.message) }
    setProcessing(null)
  }

  const handleEdit = async (assignmentId) => {
    setProcessing(assignmentId)
    try {
      const res = await api.get(`/articles?assignmentId=${assignmentId}`)
      if (res.data && res.data.length > 0) {
        navigate(`/print/articles/edit/${res.data[0]._id}?assignmentId=${assignmentId}`)
      } else {
        alert("আর্টিকেল পাওয়া যায়নি!")
      }
    } catch (err) {
      alert("আর্টিকেল লোড করতে সমস্যা হয়েছে")
    }
    setProcessing(null)
  }

  const pendingCount = stats ? (stats.pending?.length || 0) : assignments.filter(a => a.printTrack?.workflowStage === 'sent_to_proof').length

  const pageStatsMap = {}
  assignments.filter(a => a.printTrack?.workflowStage === 'sent_to_proof').forEach(a => {
    const page = a.printTrack?.pagePlan?.pageNumber || 'অনির্ধারিত পাতা'
    if (!pageStatsMap[page]) pageStatsMap[page] = { pending: 0, completed: 0 }
    pageStatsMap[page].pending++
  })
  if (stats?.completed) {
    stats.completed.forEach(a => {
      const page = a.printTrack?.pagePlan?.pageNumber || 'অনির্ধারিত পাতা'
      if (!pageStatsMap[page]) pageStatsMap[page] = { pending: 0, completed: 0 }
      pageStatsMap[page].completed++
    })
  }
  const pageStats = Object.keys(pageStatsMap).map(page => ({
    page,
    pending: pageStatsMap[page].pending,
    completed: pageStatsMap[page].completed
  })).sort((a, b) => {
    if (a.page === 'অনির্ধারিত পাতা') return 1;
    if (b.page === 'অনির্ধারিত পাতা') return -1;
    return a.page.localeCompare(b.page);
  })

  let displayData = activeTab === 'pending' ? assignments : (stats ? stats[activeTab] : []) || []
  if (activePageFilter) {
    displayData = displayData.filter(a => {
      const page = a.printTrack?.pagePlan?.pageNumber || 'অনির্ধারিত পাতা'
      return page === activePageFilter
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle size={20} className="text-pink-600" />
            প্রিন্ট প্রুফ রিডিং ডেস্ক
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-500">বানান, ব্যাকরণ এবং তথ্যগত ভুল যাচাই করুন</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && <span className="px-2.5 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-semibold">{pendingCount} অপেক্ষায়</span>}
          <button onClick={fetchQueue} disabled={loading} className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div onClick={() => handleTabChange('arrived')} className={`cursor-pointer p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center transition-all ${activeTab === 'arrived' && !activePageFilter ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 ring-2 ring-indigo-200' : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100/50'}`}>
            <span className="text-2xl font-bold text-indigo-600">{stats.arrived?.length || 0}</span>
            <span className="text-xs text-indigo-600/80 mt-1">সব (All)</span>
          </div>
          <div onClick={() => handleTabChange('pending')} className={`cursor-pointer p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center transition-all ${activeTab === 'pending' && !activePageFilter ? 'bg-pink-100 dark:bg-pink-900/40 border-pink-300 ring-2 ring-pink-200' : 'bg-pink-50 dark:bg-pink-900/20 border-pink-100 dark:border-pink-800 hover:bg-pink-100/50'}`}>
            <span className="text-2xl font-bold text-pink-600">{stats.pending?.length || 0}</span>
            <span className="text-xs text-pink-600/80 mt-1">অপেক্ষমাণ (Pending)</span>
          </div>
          <div onClick={() => handleTabChange('completed')} className={`cursor-pointer p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center transition-all ${activeTab === 'completed' && !activePageFilter ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 ring-2 ring-emerald-200' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100/50'}`}>
            <span className="text-2xl font-bold text-emerald-600">{stats.completed?.length || 0}</span>
            <span className="text-xs text-emerald-600/80 mt-1">প্রুফ সম্পন্ন (Completed)</span>
          </div>
          <div onClick={() => handleTabChange('returned')} className={`cursor-pointer p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center transition-all ${activeTab === 'returned' && !activePageFilter ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-300 ring-2 ring-rose-200' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800 hover:bg-rose-100/50'}`}>
            <span className="text-2xl font-bold text-rose-600">{stats.returned?.length || 0}</span>
            <span className="text-xs text-rose-600/80 mt-1">ফেরত পাঠানো (Returned)</span>
          </div>
        </div>
      )}

      {pageStats.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {pageStats.map(ps => (
            <div key={ps.page} className="flex flex-col bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
              <div className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 font-bold text-xs text-center text-gray-700 dark:text-slate-300">
                {ps.page}
              </div>
              <div className="flex divide-x divide-gray-100 dark:divide-slate-700">
                <button 
                  onClick={() => { setActiveTab('pending'); setActivePageFilter(ps.page) }}
                  className={`flex-1 px-3 py-2 text-xs font-bold transition-colors ${activeTab === 'pending' && activePageFilter === ps.page ? 'bg-pink-600 text-white' : 'text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20'}`}
                >
                  অপেক্ষমাণ: {ps.pending}
                </button>
                <button 
                  onClick={() => { setActiveTab('completed'); setActivePageFilter(ps.page) }}
                  className={`flex-1 px-3 py-2 text-xs font-bold transition-colors ${activeTab === 'completed' && activePageFilter === ps.page ? 'bg-emerald-600 text-white' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                >
                  সম্পন্ন: {ps.completed}
                </button>
              </div>
            </div>
          ))}
          {activePageFilter && (
            <button 
              onClick={() => setActivePageFilter(null)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
            >
              <XCircle size={14} /> ফিল্টার মুছুন
            </button>
          )}
        </div>
      )}



      {loading ? (
        <div className="flex items-center justify-center py-16"><RefreshCw size={24} className="animate-spin text-gray-400" /></div>
      ) : displayData.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 w-full">শিরোনাম</th>
                  <th className="px-6 py-4">রিপোর্টার</th>
                  <th className="px-6 py-4">পেজ প্ল্যান</th>
                  <th className="px-6 py-4 text-right">সময়</th>
                  <th className="px-6 py-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {displayData.map(a => {
                  const isProcessing = processing === a._id
                  const pagePlan = a.printTrack?.pagePlan
                  
                  return (
                    <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[350px] cursor-pointer hover:text-pink-600 transition-colors" onClick={() => navigate(`/workflow/${a._id}`)} title={a.title}>
                            {a.title}
                          </h3>
                          {a.priority === 'high' && <span className="px-2 py-0.5 text-[10px] bg-red-100 text-red-700 rounded-full font-bold">জরুরি</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <User size={14} className="text-gray-400" />
                          {a.assignerName || a.assigneeName || 'অজানা'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {pagePlan ? (
                          <div className="flex items-center gap-2">
                            {pagePlan.pageNumber && <span className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-medium">পেজ: {pagePlan.pageNumber}</span>}
                            {pagePlan.column && <span className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-medium">কলাম: {pagePlan.column}</span>}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500 dark:text-slate-400 font-medium">
                        {formatTime(a.updatedAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {activeTab === 'pending' && (
                            <>
                              {pagePlan?.pageNumber ? (
                                <button onClick={() => handleApprove(a._id)} disabled={isProcessing} className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded shadow-sm flex items-center gap-1 transition-all">
                                  <CheckCircle size={12} /> পেজে পাঠান
                                </button>
                              ) : (
                                <button disabled className="px-3 py-1.5 bg-gray-200 text-gray-500 dark:bg-slate-800 dark:text-slate-400 text-xs font-medium rounded shadow-sm cursor-not-allowed" title="এডিটর পেজ নম্বর দেননি। দয়া করে এটি NM-তে ফেরত পাঠান।">
                                  <AlertTriangle size={12} /> পেজ নম্বর নেই
                                </button>
                              )}
                              
                              <button onClick={() => setReturnModal(a)} disabled={isProcessing} className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold rounded shadow-sm flex items-center gap-1 transition-all">
                                <XCircle size={12} /> ফেরত
                              </button>
                            </>
                          )}
                          <button onClick={() => handleEdit(a._id)} disabled={isProcessing} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded shadow-sm flex items-center gap-1 transition-all">
                            <Pencil size={12} /> এডিট করুন
                          </button>
                          <button onClick={() => navigate(`/workflow/${a._id}`)} className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 rounded transition-colors" title="বিস্তারিত দেখুন">
                            <Eye size={16} />
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
      ) : (
        <div className="text-center py-16 text-gray-400 dark:text-slate-600">
          <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">কোনো নিউজ নেই</p>
        </div>
      )}

      {returnModal && <ReturnToNMModal assignment={returnModal} onClose={() => setReturnModal(null)} onReturn={handleReturnToNM} />}
    </div>
  )
}
