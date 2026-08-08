import { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Clock, Pencil, User, History, X, Eye, Check, AlertCircle, FileText, Printer, Layers, FileSpreadsheet, Activity, ExternalLink, Video } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useSettings } from '../context/SettingsContext'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

// --- Helper Functions ---
const getNextStatus = (currentStatus) => {
  const flow = {
    pending: 'writing',
    self_pending: 'writing',
    accepted: 'writing',
    writing: 'submitted',
    revision: 'submitted',
    submitted: 'review',
    review: 'approved',
    approved: 'published',
    published: null, // End of line
  }
  return flow[currentStatus] || null
}

const formatDateToBengali = (dateObj) => {
  const bnDays = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি']
  const bnMonths = ['জানু', 'ফেব্রি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে']
  const d = dateObj.getDate()
  const y = dateObj.getFullYear()
  const enToBn = (num) => num.toString().split('').map(n => '০১২৩৪৫৬৭৮৯'[n] || n).join('')
  return `${enToBn(d)} ${bnMonths[dateObj.getMonth()]} ${enToBn(y)}`
}

const enToBn = (num) => num.toString().split('').map(n => '০১২৩৪৫৬৭৮৯'[n] || n).join('')

const getTimeAgo = (date) => {
  if (!date) return ''
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'এইমাত্র';
  if (mins < 60) return `${enToBn(mins)} মিনিট`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${enToBn(hrs)} ঘণ্টা`;
  const days = Math.floor(hrs / 24);
  return `${enToBn(days)} দিন`;
};

const getTimeInCurrentStatus = (assignment) => {
  if (!assignment.logs || assignment.logs.length === 0) {
    return getTimeAgo(new Date(assignment.createdAt));
  }
  const lastLog = assignment.logs[assignment.logs.length - 1];
  return getTimeAgo(new Date(lastLog.date || assignment.updatedAt || assignment.createdAt));
};

export default function Dashboard({ dashboardType }) {
  const { t } = useLanguage()
  const { journalists } = useSettings()
  const { user } = useAuth()
  
  // Redirect proof readers to their specific desk
  if (user?.role === 'proof_reader') {
    if (user?.edition === 'online') {
      return <Navigate to="/workflow/online-proofreading" replace />
    }
    return <Navigate to="/workflow/print-proof" replace />
  }

  const [assignments, setAssignments] = useState([])
  const [mostReadArticles, setMostReadArticles] = useState([])
  const [showMostReadList, setShowMostReadList] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedStatModal, setSelectedStatModal] = useState(null)
  
  // Tab Switcher state based on explicit prop or user edition/role
  const [activeTab, setActiveTab] = useState(
    dashboardType && dashboardType !== 'central'
      ? dashboardType
      : dashboardType === 'central'
        ? 'split'
        : user?.edition === 'print' ? 'print' : user?.edition === 'both' ? 'split' : 'online'
  )
  
  // Global Activity Log
  const [showActivityLog, setShowActivityLog] = useState(false)
  const [activityLogs, setActivityLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  
  // Version Viewer State
  const [versionToView, setVersionToView] = useState(null)
  const [versionContent, setVersionContent] = useState(null)
  const [loadingVersionContent, setLoadingVersionContent] = useState(false)
  
  // Filters
  const [activeBureau, setActiveBureau] = useState('all')
  const [activeDesk, setActiveDesk] = useState('all')
  const [activeStatusFilter, setActiveStatusFilter] = useState('all')

  useEffect(() => {
    if (dashboardType && dashboardType !== 'central') {
      setActiveTab(dashboardType)
    } else if (dashboardType === 'central') {
      setActiveTab('split')
    } else {
      if (user?.edition === 'print') setActiveTab('print')
      else if (user?.edition === 'online') setActiveTab('online')
      else if (user?.edition === 'both' || ['managing_editor', 'chief_editor'].includes(user?.role)) setActiveTab('split')
    }
  }, [user, dashboardType])

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await api.get('/workflow')
        setAssignments(res.data)
        
        // Also fetch most read
        const mostReadRes = await api.get('/articles/analytics/most-read')
        setMostReadArticles(mostReadRes.data)
      } catch (err) {
        console.error('Failed to fetch data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAssignments()
  }, [])

  const fetchActivityLogs = async () => {
    setLoadingLogs(true)
    try {
      const res = await api.get('/articles/versions/all')
      setActivityLogs(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    if (!versionToView) {
      setVersionContent(null)
      return
    }
    const fetchFullVersion = async () => {
      setLoadingVersionContent(true)
      try {
        const res = await api.get(`/articles/versions/${versionToView._id}`)
        setVersionContent(res.data)
      } catch (err) {
        console.error('Failed to fetch full version content', err)
      } finally {
        setLoadingVersionContent(false)
      }
    }
    fetchFullVersion()
  }, [versionToView])

  // Derived filter options
  const desks = Array.from(new Set(assignments.map(a => Array.isArray(a.categories) ? a.categories[0] : a.category).filter(Boolean)))
  
  // Apply filters
  const filtered = assignments.filter(a => {
    const desk = Array.isArray(a.categories) ? a.categories[0] : a.category
    if (activeDesk !== 'all' && desk !== activeDesk) return false
    
    if (activeStatusFilter !== 'all') {
      const colMatches = {
        assigned: ['pending', 'accepted'],
        draft: ['writing', 'self_pending'],
        submitted: ['submitted'],
        correction: ['revision', 'correction_needed'],
        review: ['review'],
        queue: ['approved'],
        published: ['published']
      }
      if (!colMatches[activeStatusFilter]?.includes(a.status)) return false;
    }
    return true
  })

  // Columns for Online Kanban
  const columns = [
    { id: 'assigned', label: 'অ্যাসাইনড', statuses: ['pending', 'accepted'], color: 'bg-yellow-500' },
    { id: 'draft', label: 'খসড়া', statuses: ['writing', 'self_pending'], color: 'bg-blue-500' },
    { id: 'submitted', label: 'জমা দেওয়া', statuses: ['submitted'], color: 'bg-indigo-500' },
    { id: 'correction', label: 'সংশোধন', statuses: ['revision', 'correction_needed'], color: 'bg-red-500' },
    { id: 'review', label: 'রিভিউতে', statuses: ['review'], color: 'bg-purple-500' },
    { id: 'queue', label: 'কিউ', statuses: ['approved'], color: 'bg-green-500' },
    { id: 'published', label: 'প্রকাশিত', statuses: ['published'], color: 'bg-teal-500' },
  ]

  // Columns for Print Kanban
  const printColumns = [
    { id: 'assigned', label: 'অ্যাসাইনড', statuses: ['pending', 'accepted'], color: 'bg-purple-400' },
    { id: 'draft', label: 'খসড়া', statuses: ['writing', 'self_pending'], color: 'bg-blue-400' },
    { id: 'review', label: 'রিভিউতে', statuses: ['submitted', 'review'], color: 'bg-indigo-400' },
    { id: 'approved', label: 'অনুমোদিত', statuses: ['approved'], color: 'bg-emerald-500' },
    { id: 'sent_to_press', label: 'প্রেসে পাঠানো', statuses: ['sent_to_press', 'published'], color: 'bg-purple-600' },
  ]

  const today = new Date()

  if (loading) {
    return <div className="p-10 text-center text-gray-500">লোড হচ্ছে...</div>
  }

  // Render Selected Stat Modal
  const renderStatModal = () => (
      selectedStatModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-100 dark:bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700/60 shadow-2xl rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-gray-100 dark:bg-slate-900/50">
              <h3 className="text-lg font-black text-gray-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="text-purple-400" size={18} /> {selectedStatModal.title} 
                <span className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full">{selectedStatModal.articles.length}</span>
              </h3>
              <button onClick={() => setSelectedStatModal(null)} className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:text-white p-1 rounded-lg hover:bg-gray-100 dark:bg-slate-800 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-0">
              {selectedStatModal.articles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <FileText size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">কোনো নিউজ বা অ্যাসাইনমেন্ট নেই।</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
                  <thead className="bg-gray-100 dark:bg-gray-100 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-3">Desk</th>
                      <th className="px-5 py-3">Title</th>
                      <th className="px-5 py-3">Reporter</th>
                      <th className="px-5 py-3 text-right">Time in Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {selectedStatModal.articles.map(a => {
                      const baseDesk = Array.isArray(a.categories) ? a.categories[0] : a.category;
                      const printPage = a.printTrack?.pagePlan?.pageNumber || a.printTrack?.pageNumber;
                      const desk = selectedStatModal.deskPrefix === 'PRINT' ? (printPage || baseDesk) : baseDesk;
                      return (
                        <tr key={a._id} className="hover:bg-gray-50 dark:bg-gray-100 dark:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3 font-bold text-[10px] text-blue-400 tracking-wider uppercase whitespace-nowrap">{desk || 'GEN'}</td>
                          <td className="px-5 py-3 font-semibold text-gray-700 dark:text-slate-200 hover:text-blue-400 transition-colors">
                            <Link to={`/workflow/${a._id}`} className="line-clamp-2 block hover:underline leading-snug">{a.title}</Link>
                          </td>
                          <td className="px-5 py-3 text-xs whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <User size={12} className="text-slate-500" />
                              <span className="truncate max-w-[120px]">{a.assigneeName || a.authorName || 'Unassigned'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-[11px] whitespace-nowrap text-right text-slate-500 font-medium">
                            {getTimeInCurrentStatus(a)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )
  )

  // ─── Online View Component ───
  const renderOnlineDashboard = (isCompact = false) => {
    const onlineAssignments = filtered.filter(a => ['online', 'both'].includes(a.edition));
    
    return (
    <div className="space-y-6">
      {!isCompact && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3">
          {[
            { id: 'all', label: 'মোট', articles: onlineAssignments, color: 'text-gray-500 dark:text-slate-400' },
            { id: 'assigned', label: 'অ্যাসাইনড', articles: onlineAssignments.filter(a => ['pending', 'assignment_created', 'accepted'].includes(a.onlineTrack?.workflowStage || a.status)), color: 'text-[#F5B041]' },
            { id: 'draft', label: 'ড্রাফট', articles: onlineAssignments.filter(a => ['writing', 'self_pending'].includes(a.onlineTrack?.workflowStage || a.status)), color: 'text-[#2980B9]' },
            { id: 'dept_queue', label: 'ডিপার্টমেন্ট কিউ', articles: onlineAssignments.filter(a => ['reporter_submitted', 'submitted', 'review', 'department_review'].includes(a.onlineTrack?.workflowStage || a.status)), color: 'text-[#8E44AD]' },
            { id: 'nm_desk', label: 'NM ডেস্ক', articles: onlineAssignments.filter(a => ['department_approved', 'news_management_editing'].includes(a.onlineTrack?.workflowStage)), color: 'text-[#3498DB]' },
            { id: 'proof_desk', label: 'প্রুফ ডেস্ক', articles: onlineAssignments.filter(a => ['sent_to_proof', 'proof_correction'].includes(a.onlineTrack?.workflowStage)), color: 'text-[#E67E22]' },
            { id: 'correction', label: 'সংশোধন', articles: onlineAssignments.filter(a => ['revision', 'revision_required', 'correction_needed'].includes(a.onlineTrack?.workflowStage || a.status)), color: 'text-[#E74C3C]' },
            { id: 'published', label: 'পাবলিশড', articles: onlineAssignments.filter(a => (a.onlineTrack?.workflowStage || a.status) === 'published'), color: 'text-[#16A085]' },
            { id: 'most_read', label: 'সবচেয়ে পঠিত', articles: mostReadArticles, color: 'text-rose-500' }
          ].map(col => (
            <div 
              key={`stat-${col.id}`} 
              className={`bg-white dark:bg-[#0f172a] rounded-xl p-3 border border-gray-200 dark:border-slate-700/60 shadow-inner flex flex-col justify-center items-center text-center transition-all hover:shadow-lg cursor-pointer hover:border-blue-500/50 ${col.id === 'most_read' && showMostReadList ? 'ring-2 ring-rose-400 border-transparent' : ''}`} 
              onClick={() => {
                if (col.id === 'most_read') {
                  setShowMostReadList(!showMostReadList)
                } else {
                  setActiveStatusFilter(col.id)
                  setShowMostReadList(false)
                }
                setSelectedStatModal({ title: col.label, articles: col.articles, deskPrefix: 'ONLINE' })
              }}
            >
              <p className="text-2xl font-black text-gray-900 dark:text-white mb-0.5 leading-none">
                {col.id === 'most_read' ? <span className="flex items-center gap-1">🔥 {col.articles.length}</span> : col.articles.length}
              </p>
              <p className={`text-[9px] font-bold uppercase tracking-wider ${col.color}`}>{col.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Traffic Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0f172a] rounded-xl p-5 border border-gray-200 dark:border-slate-700/60 shadow-inner flex flex-col">
          <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-2 mb-6">
            <h3 className="text-lg font-black text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="text-blue-400" size={20} /> অনলাইন ট্রাফিক (লাইভ)
            </h3>
            <span className="text-xs font-black text-emerald-400 bg-emerald-900/30 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-emerald-800/50">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span> ১,৮০,৫৪২ অ্যাকটিভ রিডার
            </span>
          </div>
          
          <div className="flex-1 min-h-[150px] w-full flex items-end gap-2 mt-auto">
            {[30, 45, 40, 60, 55, 70, 85, 75, 90, 80, 95, 85, 70, 60, 75, 90, 100, 85, 95, 80, 70, 60, 50, 40].map((h, i) => (
              <div key={i} className="flex-1 bg-gradient-to-t from-blue-900/40 to-blue-500/80 rounded-t hover:from-blue-700 hover:to-blue-400 transition-colors cursor-pointer relative group" style={{height: `${h}%`}}>
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 border border-slate-600">{h}K Views</div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Read Articles (Compact) */}
        <div className="bg-white dark:bg-[#0f172a] rounded-xl p-5 border border-gray-200 dark:border-slate-700/60 shadow-inner flex flex-col h-full">
          <h3 className="text-lg font-black text-gray-800 dark:text-slate-100 flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3 mb-4">
            <span className="flex items-center gap-2">🔥 ট্রেন্ডিং নিউজ</span>
            <span className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2 py-1 rounded">গত ২৪ ঘণ্টা</span>
          </h3>
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            {mostReadArticles.slice(0, 5).map((a, i) => (
              <div key={i} className="flex gap-4 items-center group cursor-pointer hover:bg-gray-100 dark:bg-gray-100 dark:bg-slate-800/50 p-2 -mx-2 rounded-lg transition-colors border border-transparent hover:border-slate-700">
                <span className="text-2xl font-black text-slate-700 group-hover:text-blue-500 transition-colors w-6 text-center">{i+1}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-700 dark:text-slate-200 line-clamp-2 group-hover:text-gray-900 dark:text-white transition-colors leading-snug">{a.title}</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1 uppercase tracking-wider">{a.category}</p>
                </div>
                <span className="text-xs font-black text-blue-400 bg-blue-900/20 px-2 py-1 rounded border border-blue-900/30 whitespace-nowrap">{a.totalViews > 1000 ? (a.totalViews/1000).toFixed(1)+'K' : a.totalViews}</span>
              </div>
            ))}
            {mostReadArticles.length === 0 && (
              <div className="text-sm text-slate-500 italic text-center py-10">No trending articles yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Assignments Table */}
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-gray-200 dark:border-slate-700/60 shadow-inner overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50 dark:bg-gray-100 dark:bg-slate-900/50">
          <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="text-blue-400" size={16} /> সাম্প্রতিক অনলাইন অ্যাসাইনমেন্ট
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <select 
              value={activeDesk}
              onChange={(e) => setActiveDesk(e.target.value)}
              className="text-xs font-bold border border-slate-700 rounded-lg px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase tracking-wider"
            >
              <option value="all">ALL DESKS</option>
              {desks.map(desk => (
                <option key={desk} value={desk}>{desk}</option>
              ))}
            </select>
            <select 
              value={activeStatusFilter}
              onChange={(e) => setActiveStatusFilter(e.target.value)}
              className="text-xs font-bold border border-slate-700 rounded-lg px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase tracking-wider"
            >
              <option value="all">ALL STATUS</option>
              <option value="assigned">ASSIGNED</option>
              <option value="draft">DRAFT</option>
              <option value="review">REVIEW</option>
              <option value="queue">APPROVED</option>
              <option value="published">PUBLISHED</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-100 dark:bg-gray-100 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-wider">
              <tr>
                <th className="px-5 py-3">ডেস্ক</th>
                <th className="px-5 py-3">শিরোনাম</th>
                <th className="px-5 py-3">রিপোর্টার</th>
                <th className="px-5 py-3 text-center">স্ট্যাটাস</th>
                <th className="px-5 py-3 text-right">সময়</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {onlineAssignments.slice(0, 15).map(a => {
                const desk = Array.isArray(a.categories) ? a.categories[0] : a.category;
                return (
                  <tr key={a._id} className="hover:bg-gray-50 dark:bg-gray-100 dark:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3 font-bold text-[10px] text-blue-400 tracking-wider uppercase whitespace-nowrap">{desk}</td>
                    <td className="px-5 py-3 font-semibold text-gray-700 dark:text-slate-200 hover:text-blue-400 transition-colors">
                      <Link to={`/workflow/${a._id}`} className="line-clamp-1">{a.title}</Link>
                    </td>
                    <td className="px-5 py-3 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-slate-500" />
                        {a.assigneeName || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-center">
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 border border-slate-700 text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                        {a.onlineTrack?.status || a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs whitespace-nowrap text-right text-slate-500 font-medium">
                      {getTimeInCurrentStatus(a)}
                    </td>
                  </tr>
                )
              })}
              {onlineAssignments.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-slate-500 italic">No assignments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {renderStatModal()}
    </div>
    )
  };

  // ─── Print View Component ───
  const renderPrintDashboard = (isCompact = false) => {
    const printAssignments = assignments.filter(a => ['print', 'both'].includes(a.edition));
    
    return (
      <>
      <div className="space-y-6">
        {/* Top Metrics Row for Print */}
        {!isCompact && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { id: 'all', label: 'TOTAL ASSIGNED', articles: printAssignments, color: 'text-gray-500 dark:text-slate-400' },
              { id: 'accepted', label: 'ACCEPTED', articles: printAssignments.filter(a => a.status === 'accepted' || a.printTrack?.status === 'accepted'), color: 'text-blue-400' },
              { id: 'writing', label: 'IN PROGRESS', articles: printAssignments.filter(a => ['pending', 'writing'].includes(a.status) && a.status !== 'accepted'), color: 'text-[#F5B041]' },
              { id: 'review', label: 'REVIEW', articles: printAssignments.filter(a => ['review'].includes(a.status)), color: 'text-[#9B59B6]' },
              { id: 'approved', label: 'APPROVED', articles: printAssignments.filter(a => a.printTrack?.status === 'approved'), color: 'text-[#2980B9]' },
              { id: 'press', label: 'SENT TO PRESS', articles: printAssignments.filter(a => a.printTrack?.status === 'sent_to_press'), color: 'text-[#27AE60]' },
              { id: 'published', label: 'PUBLISHED', articles: printAssignments.filter(a => a.status === 'published'), color: 'text-slate-500' },
              { id: 'rejected', label: 'REJECTED', articles: printAssignments.filter(a => ['rejected', 'cancelled'].includes(a.status)), color: 'text-red-500' }
            ].map(col => (
              <div 
                key={`print-stat-${col.id}`} 
                onClick={() => setSelectedStatModal({ title: col.label, articles: col.articles, deskPrefix: 'PRINT' })}
                className="cursor-pointer bg-white dark:bg-[#0f172a] rounded-xl p-3 border border-gray-200 dark:border-slate-700/60 shadow-inner flex flex-col justify-center items-center text-center transition-all hover:shadow-lg hover:border-purple-500/50"
              >
                <p className="text-2xl font-black text-gray-900 dark:text-white mb-0.5 leading-none">{col.articles.length}</p>
                <p className={`text-[9px] font-bold uppercase tracking-wider ${col.color}`}>{col.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* My Submissions for Reporters */}
        {user?.role === 'reporter' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">আমার সাবমিশন (My Submissions)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
                <thead className="bg-gray-100 dark:bg-slate-800 text-[10px] uppercase font-bold tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3">শিরোনাম</th>
                    <th className="px-4 py-3 text-center">বর্তমান স্টেজ</th>
                    <th className="px-4 py-3 text-right">কতক্ষণ ধরে আছে?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {assignments
                    .filter(a => ['submitted', 'reporter_submitted', 'review', 'department_review', 'department_approved', 'nm_editing', 'sent_to_proof', 'proof_correction', 'news_management_editing'].includes(a.onlineTrack?.workflowStage || a.status))
                    .map(a => (
                    <tr key={`mysub-${a._id}`} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-slate-200">
                        <Link to={`/workflow/${a._id}`} className="hover:text-blue-500">{a.title}</Link>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-md text-xs font-bold uppercase whitespace-nowrap">
                          {a.onlineTrack?.workflowStage || a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                        {getTimeInCurrentStatus(a)}
                      </td>
                    </tr>
                  ))}
                  {assignments.filter(a => ['submitted', 'reporter_submitted', 'review', 'department_review', 'department_approved', 'nm_editing', 'sent_to_proof', 'proof_correction', 'news_management_editing'].includes(a.onlineTrack?.workflowStage || a.status)).length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-400">কোনো পেন্ডিং সাবমিশন নেই।</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Row (Hidden for Reporters) */}
        {user?.role !== 'reporter' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Editorial Progress (Donut Chart style) */}
            <div className="bg-white dark:bg-[#0f172a] rounded-xl p-5 border border-gray-200 dark:border-slate-700/60 shadow-inner flex flex-col items-center justify-center text-center">
              <h4 className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">EDITORIAL PROGRESS</h4>
              <div className="relative w-32 h-32 flex items-center justify-center mb-2">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="54" fill="transparent" stroke="currentColor" strokeWidth="16" className="text-slate-800" />
                  <circle cx="64" cy="64" r="54" fill="transparent" stroke="currentColor" strokeWidth="16" strokeDasharray="339" strokeDashoffset="100" className="text-purple-400 drop-shadow-lg" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">70%</span>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500">READY FOR PRESS</p>
            </div>

            {/* Press Deadline Countdown */}
            <div className="lg:col-span-2 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-gray-900 dark:text-white rounded-xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-center border border-purple-500/30">
              <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                <Printer size={150} />
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between z-10 h-full gap-4 md:gap-0">
                <div className="space-y-2 text-left">
                  <div className="inline-flex items-center gap-1.5 bg-purple-500/30 text-purple-200 text-xs px-3 py-1 rounded-full border border-purple-400/30 font-bold tracking-wide">
                    <Printer size={12} /> PRINT PRESS MAKEUP VIEW
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">আগামীকালের ই-পেপার ও প্রিন্ট এডিশন মেকআপ</h2>
                  <p className="text-sm text-purple-200/80">প্রতিটি পাতার কলাম বরাদ্দ এবং পেজ প্রুফিং স্ট্যাটাস মনিটর করুন।</p>
                </div>
                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center gap-4 text-center min-w-[200px] justify-center shadow-inner">
                  <Clock size={36} className="text-amber-400 flex-shrink-0 animate-pulse" />
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">প্রেসে পাঠানোর ডেডলাইন</span>
                    <span className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">রাত ১০:০০ টা</span>
                    <span className="text-xs text-gray-600 dark:text-slate-300 block mt-0.5 font-medium">বাকি আছে: <span className="font-bold text-emerald-400">৪ ঘণ্টা ১৫ মিনিট</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Print Assignments Table */}
        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-gray-200 dark:border-slate-700/60 shadow-inner overflow-hidden mt-6">
          <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50 dark:bg-gray-100 dark:bg-slate-900/50">
            <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="text-purple-400" size={16} /> RECENT PRINT ASSIGNMENTS
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
              <thead className="bg-gray-100 dark:bg-gray-100 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-wider">
                <tr>
                  <th className="px-5 py-3">Desk</th>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Reporter</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Time in Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {printAssignments.slice(0, 15).map(a => {
                  const baseDesk = Array.isArray(a.categories) ? a.categories[0] : a.category;
                  const printPage = a.printTrack?.pagePlan?.pageNumber || a.printTrack?.pageNumber;
                  const desk = printPage || baseDesk || 'GENERAL';
                  return (
                    <tr key={a._id} className="hover:bg-gray-50 dark:bg-gray-100 dark:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 font-bold text-[10px] text-purple-400 tracking-wider uppercase whitespace-nowrap">{desk}</td>
                      <td className="px-5 py-3 font-semibold text-gray-700 dark:text-slate-200 hover:text-purple-400 transition-colors">
                        <Link to={`/workflow/${a._id}`} className="line-clamp-1">{a.title}</Link>
                      </td>
                      <td className="px-5 py-3 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-slate-500" />
                          {a.assigneeName || 'Unassigned'}
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-center">
                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 border border-slate-700 text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                          {a.printTrack?.status || a.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs whitespace-nowrap text-right text-slate-500 font-medium">
                        {getTimeInCurrentStatus(a)}
                      </td>
                    </tr>
                  )
                })}
                {printAssignments.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-5 py-10 text-center text-slate-500 italic">No assignments found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {renderStatModal()}
      </>
    );
  };

  // ─── Multimedia View Component ───
  const renderMultimediaDashboard = (isCompact = false) => {
    const multimediaAssignments = assignments.filter(a => ['multimedia', 'all'].includes(a.edition));
    
    return (
      <div className="space-y-6">
        {/* Top Video Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Video Performance */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0f172a] rounded-xl p-5 border border-gray-200 dark:border-slate-700/60 shadow-inner flex gap-6">
            <div className="w-1/3 aspect-video bg-gradient-to-br from-pink-500/20 to-purple-500/10 rounded-lg border border-pink-500/20 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-pink-500/10 blur-xl group-hover:bg-pink-500/20 transition-all"></div>
              <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-gray-900 dark:text-white shadow-[0_0_15px_rgba(236,72,153,0.5)] z-10 relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <h4 className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">VIDEO PERFORMANCE</h4>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-4xl font-black text-gray-900 dark:text-white leading-none">1.58M</span>
                <span className="text-sm font-bold text-slate-500 mb-1">VIEWS</span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded w-max border border-transparent">
                ↑ 12% vs last wk
              </div>
            </div>
          </div>

          {/* Pipeline */}
          <div className="bg-white dark:bg-[#0f172a] rounded-xl p-5 border border-gray-200 dark:border-slate-700/60 shadow-inner flex flex-col justify-center">
            <h4 className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">CONTENT PRODUCTION PIPELINE</h4>
            <div className="flex gap-2">
              <div onClick={() => setSelectedStatModal({ title: 'IN PRODUCTION', articles: multimediaAssignments.filter(a=>a.multimediaTrack?.status === 'in_production'), deskPrefix: 'MULTIMEDIA' })} className="cursor-pointer flex-1 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-800/50 hover:border-blue-500/50 transition-colors rounded flex flex-col items-center justify-center p-2 relative overflow-hidden">
                <span className="text-2xl font-black text-gray-900 dark:text-white z-10">{multimediaAssignments.filter(a=>a.multimediaTrack?.status === 'in_production').length}</span>
                <span className="text-[9px] font-bold text-blue-400 uppercase mt-1 z-10">IN PROD.</span>
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-blue-800/20 skew-x-12 translate-x-2"></div>
              </div>
              <div onClick={() => setSelectedStatModal({ title: 'POST-PRODUCTION (REVIEW)', articles: multimediaAssignments.filter(a=>a.multimediaTrack?.status === 'review'), deskPrefix: 'MULTIMEDIA' })} className="cursor-pointer flex-1 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-800/50 hover:border-purple-500/50 transition-colors rounded flex flex-col items-center justify-center p-2 relative overflow-hidden">
                <span className="text-2xl font-black text-gray-900 dark:text-white z-10">{multimediaAssignments.filter(a=>a.multimediaTrack?.status === 'review').length}</span>
                <span className="text-[9px] font-bold text-purple-400 uppercase mt-1 z-10">POST-PROD.</span>
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-purple-800/20 skew-x-12 translate-x-2"></div>
              </div>
              <div onClick={() => setSelectedStatModal({ title: 'PUBLISHED', articles: multimediaAssignments.filter(a=>a.multimediaTrack?.status === 'published'), deskPrefix: 'MULTIMEDIA' })} className="cursor-pointer flex-1 bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-800/50 hover:border-emerald-500/50 transition-colors rounded flex flex-col items-center justify-center p-2 relative overflow-hidden">
                <span className="text-2xl font-black text-gray-900 dark:text-white z-10">{multimediaAssignments.filter(a=>a.multimediaTrack?.status === 'published').length}</span>
                <span className="text-[9px] font-bold text-emerald-400 uppercase mt-1 z-10">PUBLISHED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live & Social Reach */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#0f172a] rounded-xl p-5 border border-gray-200 dark:border-slate-700/60 shadow-inner">
             <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider">LIVE STREAMING</h4>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]"></span>
             </div>
             <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-full border-4 border-red-500/20 border-t-red-500 animate-[spin_3s_linear_infinite] flex items-center justify-center">
                 <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-full"></div>
               </div>
               <div>
                 <p className="text-2xl font-black text-gray-900 dark:text-white">45,210</p>
                 <p className="text-[10px] font-bold text-red-400">CONCURRENT VIEWERS</p>
               </div>
             </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b]/50 rounded-xl p-5 border border-gray-200 dark:border-slate-700/60 shadow-inner">
             <h4 className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">SOCIAL REACH (YOUTUBE + FACEBOOK)</h4>
             <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#1877F2] rounded"></div>
                    <span className="text-xs font-bold text-gray-600 dark:text-slate-300">2.4M</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#FF0000] rounded"></div>
                    <span className="text-xs font-bold text-gray-600 dark:text-slate-300">1.8M</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-gray-900 dark:text-white">4.2M</p>
                  <p className="text-[10px] font-bold text-slate-500">TOTAL REACH</p>
                </div>
             </div>
             <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full mt-4 flex overflow-hidden">
                <div className="h-full bg-[#1877F2] w-[57%]"></div>
                <div className="h-full bg-[#FF0000] w-[43%]"></div>
             </div>
          </div>
        </div>

        {/* Recent Multimedia Assignments Table */}
        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-gray-200 dark:border-slate-700/60 shadow-inner overflow-hidden mt-6">
          <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50 dark:bg-gray-100 dark:bg-slate-900/50">
            <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="text-pink-400" size={16} /> RECENT MULTIMEDIA ASSIGNMENTS
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
              <thead className="bg-gray-100 dark:bg-gray-100 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-wider">
                <tr>
                  <th className="px-5 py-3">Desk</th>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Reporter</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Time in Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {multimediaAssignments.slice(0, 15).map(a => {
                  const desk = Array.isArray(a.categories) ? a.categories[0] : a.category;
                  return (
                    <tr key={a._id} className="hover:bg-gray-50 dark:bg-gray-100 dark:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 font-bold text-[10px] text-pink-400 tracking-wider uppercase whitespace-nowrap">{desk}</td>
                      <td className="px-5 py-3 font-semibold text-gray-700 dark:text-slate-200 hover:text-pink-400 transition-colors">
                        <Link to={`/workflow/${a._id}`} className="line-clamp-1">{a.title}</Link>
                      </td>
                      <td className="px-5 py-3 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-slate-500" />
                          {a.assigneeName || 'Unassigned'}
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-center">
                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 border border-slate-700 text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                          {a.multimediaTrack?.status || a.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs whitespace-nowrap text-right text-slate-500 font-medium">
                        {getTimeInCurrentStatus(a)}
                      </td>
                    </tr>
                  )
                })}
                {multimediaAssignments.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-5 py-10 text-center text-slate-500 italic">No assignments found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
    };
  // ─── Top Management ERP Dashboard View ───
  const renderTopManagementView = () => {
    // Basic calcs
    const printAssignments = assignments.filter(a => ['print', 'both'].includes(a.edition));
    const onlineAssignments = assignments.filter(a => ['online', 'both'].includes(a.edition));
    const multimediaAssignments = assignments.filter(a => ['multimedia', 'all'].includes(a.edition));

    return (
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700/50">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 border-b border-gray-200 dark:border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
              <Layers className="text-blue-500" size={28} />
              TOP MANAGEMENT ERP DASHBOARD
            </h2>
            <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-100 dark:bg-slate-800/80 rounded-lg px-4 py-2 border border-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              <span className="text-sm font-bold text-gray-600 dark:text-slate-300">Live Sync Active</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
            
            {/* COLUMN 1: PRINT VERSION */}
            <div className="bg-white dark:bg-[#0f172a] rounded-xl p-5 border border-gray-200 dark:border-slate-700/60 shadow-inner flex flex-col gap-5">
              <h3 className="text-lg font-black text-gray-800 dark:text-slate-100 flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-3">
                <Printer className="text-purple-400" size={20} /> PRINT VERSION <span className="text-[10px] font-bold text-slate-500 ml-auto">(NEWSROOM AUTOMATION)</span>
              </h3>
              
              {/* Widget 1: Page Layout Status */}
              <div className="bg-gray-100 dark:bg-slate-800/40 rounded-lg p-4 border border-slate-700/30 hover:border-purple-500/30 transition-colors">
                <h4 className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex justify-between">
                  Page Layout Status
                  <span className="text-[9px] bg-slate-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-slate-300">TODAY</span>
                </h4>
                <div className="space-y-3.5">
                  {[
                    {name: 'Edition 1', val: 75, col: 'bg-purple-500'},
                    {name: 'Edition 2', val: 40, col: 'bg-blue-500'},
                    {name: 'City', val: 90, col: 'bg-emerald-500'},
                    {name: 'Sports', val: 15, col: 'bg-amber-500'}
                  ].map(p => (
                    <div key={p.name} className="flex items-center gap-3 text-sm">
                      <span className="w-20 text-gray-600 dark:text-slate-300 font-semibold text-xs">{p.name}</span>
                      <div className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-full h-2.5 border border-gray-200 dark:border-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${p.col} shadow-[0_0_5px_rgba(255,255,255,0.2)]`} style={{width: `${p.val}%`}}></div>
                      </div>
                      <span className="w-8 text-right text-xs font-bold text-gray-700 dark:text-slate-200">{p.val}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Widget 2: Editorial Progress */}
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="bg-gray-100 dark:bg-slate-800/40 rounded-lg p-4 border border-slate-700/30 flex flex-col items-center justify-center text-center hover:border-purple-500/30 transition-colors">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Editorial Progress</span>
                  <div className="relative w-20 h-20 flex items-center justify-center mb-1">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="34" fill="transparent" stroke="#1e293b" strokeWidth="10" />
                      <circle cx="40" cy="40" r="34" fill="transparent" stroke="#a855f7" strokeWidth="10" strokeDasharray="213" strokeDashoffset="53" className="drop-shadow-lg" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-black text-gray-900 dark:text-white">75%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-100 dark:bg-slate-800/40 rounded-lg p-4 border border-slate-700/30 flex flex-col justify-center hover:border-purple-500/30 transition-colors">
                  <div className="space-y-3 w-full">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-gray-600 dark:text-slate-300 flex items-center gap-2"><span className="w-2 h-2 rounded bg-blue-500"></span> Assigned</span>
                      <span className="text-gray-900 dark:text-white font-black bg-gray-100 dark:bg-slate-900 px-2 py-0.5 rounded">{printAssignments.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-gray-600 dark:text-slate-300 flex items-center gap-2"><span className="w-2 h-2 rounded bg-amber-500"></span> Review</span>
                      <span className="text-gray-900 dark:text-white font-black bg-gray-100 dark:bg-slate-900 px-2 py-0.5 rounded">{printAssignments.filter(a => a.printTrack?.status === 'review').length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-gray-600 dark:text-slate-300 flex items-center gap-2"><span className="w-2 h-2 rounded bg-emerald-500"></span> Press</span>
                      <span className="text-emerald-400 font-black bg-gray-100 dark:bg-slate-900 px-2 py-0.5 rounded">{printAssignments.filter(a => a.printTrack?.status === 'sent_to_press').length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget 3: Press Status */}
              <div className="bg-gray-100 dark:bg-slate-800/40 rounded-lg p-4 border border-slate-700/30 flex items-center justify-between mt-auto hover:border-purple-500/30 transition-colors">
                <div>
                  <h4 className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Printing Press Uptime</h4>
                  <div className="text-2xl font-black text-emerald-400 tracking-tight flex items-center gap-2">
                    <Activity size={18} /> 99.9%
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 dark:text-slate-400 block font-bold uppercase tracking-wider">Next Deadline</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30 mt-1 inline-block">10:00 PM</span>
                </div>
              </div>
            </div>

            {/* COLUMN 2: ONLINE VERSION */}
            <div className="bg-white dark:bg-[#0f172a] rounded-xl p-5 border border-gray-200 dark:border-slate-700/60 shadow-inner flex flex-col gap-5">
              <h3 className="text-lg font-black text-gray-800 dark:text-slate-100 flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-3">
                <Activity className="text-blue-400" size={20} /> ONLINE VERSION
              </h3>

              {/* Widget 1: Real-time Traffic */}
              <div className="bg-gray-100 dark:bg-slate-800/40 rounded-lg p-4 border border-slate-700/30 hover:border-blue-500/30 transition-colors">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Real-Time Traffic</h4>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded flex items-center gap-1 border border-emerald-800/50">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]"></span> 180K ACTIVE
                  </span>
                </div>
                {/* Fake Chart area */}
                <div className="h-28 w-full flex items-end gap-1.5 mt-2">
                  {[30, 45, 40, 60, 55, 70, 85, 75, 90, 80, 95, 85].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-blue-600/40 to-blue-400/80 rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer relative group" style={{height: `${h}%`}}>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-100 dark:bg-slate-900 text-gray-900 dark:text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100">{h}K</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Widget 2: Top Articles */}
              <div className="bg-gray-100 dark:bg-slate-800/40 rounded-lg p-4 border border-slate-700/30 hover:border-blue-500/30 transition-colors">
                <h4 className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex justify-between">
                  Top Articles 
                  <span className="text-[9px] bg-blue-900/40 text-blue-300 px-1.5 py-0.5 rounded">BY VIEWS</span>
                </h4>
                <div className="space-y-3.5">
                  {mostReadArticles.slice(0, 4).map((a, i) => (
                    <div key={i} className="flex gap-3 items-center group cursor-pointer">
                      <span className="text-base font-black text-slate-600 w-4 text-center group-hover:text-blue-500 transition-colors">{i+1}</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-700 dark:text-slate-200 line-clamp-1 group-hover:text-gray-900 dark:text-white transition-colors">{a.title}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{a.category}</p>
                      </div>
                      <span className="text-xs font-black text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-900/30">{a.totalViews > 1000 ? (a.totalViews/1000).toFixed(1)+'K' : a.totalViews}</span>
                    </div>
                  ))}
                  {mostReadArticles.length === 0 && (
                    <div className="text-xs text-slate-500 italic">No data</div>
                  )}
                </div>
              </div>

              {/* Widget 3: Subscriptions / Revenue */}
              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div className="bg-gray-100 dark:bg-slate-800/40 rounded-lg p-4 border border-slate-700/30 hover:border-blue-500/30 transition-colors text-center">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Avg. Session</span>
                  <span className="text-2xl font-black text-gray-900 dark:text-white">09:30</span>
                </div>
                <div className="bg-gray-100 dark:bg-slate-800/40 rounded-lg p-4 border border-slate-700/30 hover:border-blue-500/30 transition-colors text-center">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Bounce Rate</span>
                  <span className="text-2xl font-black text-amber-400">56.8%</span>
                </div>
              </div>
            </div>

            {/* COLUMN 3: MULTIMEDIA VERSION */}
            <div className="bg-white dark:bg-[#0f172a] rounded-xl p-5 border border-gray-200 dark:border-slate-700/60 shadow-inner flex flex-col gap-5">
              <h3 className="text-lg font-black text-gray-800 dark:text-slate-100 flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-3">
                <Video className="text-pink-400" size={20} /> MULTIMEDIA VERSION
              </h3>

              {/* Widget 1: Video Performance */}
              <div className="bg-gray-100 dark:bg-slate-800/40 rounded-lg p-4 border border-slate-700/30 hover:border-pink-500/30 transition-colors flex gap-4 items-center">
                <div className="w-28 h-20 bg-gray-100 dark:bg-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden group shadow-inner border border-gray-200 dark:border-slate-800">
                   <div className="absolute inset-0 bg-pink-500/10 group-hover:bg-pink-500/20 transition-colors"></div>
                   <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center z-10 shadow-[0_0_15px_rgba(236,72,153,0.5)] cursor-pointer hover:scale-110 transition-transform">
                     <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[10px] border-transparent border-l-white ml-1"></div>
                   </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Video Performance</h4>
                  <div className="text-2xl font-black text-gray-900 dark:text-white mb-0.5 tracking-tight">1.58M <span className="text-xs font-bold text-slate-500 uppercase">Views</span></div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold bg-emerald-900/20 inline-block px-1.5 py-0.5 rounded">↑ 12% vs last wk</div>
                </div>
              </div>

              {/* Widget 2: Content Production Pipeline */}
              <div className="bg-gray-100 dark:bg-slate-800/40 rounded-lg p-4 border border-slate-700/30 hover:border-pink-500/30 transition-colors">
                <h4 className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Content Production Pipeline</h4>
                <div className="relative h-14">
                  {/* Chevron Pipeline */}
                  <div className="absolute inset-0 flex">
                    <div className="flex-1 bg-blue-900/30 border border-blue-700/40 flex flex-col items-center justify-center text-[10px] font-black text-blue-300 relative uppercase tracking-wider">
                      <span className="text-lg text-gray-900 dark:text-white leading-none mb-1">{multimediaAssignments.filter(a => ['pending', 'accepted', 'in_production'].includes(a.status)).length}</span>
                      In Prod.
                      <div className="absolute right-0 top-0 bottom-0 w-4 bg-blue-900/30 translate-x-1/2 rotate-45 transform origin-left z-10 border-t border-r border-blue-700/40"></div>
                    </div>
                    <div className="flex-1 bg-purple-900/30 border border-purple-700/40 flex flex-col items-center justify-center text-[10px] font-black text-purple-300 relative ml-2 z-0 uppercase tracking-wider">
                      <span className="text-lg text-gray-900 dark:text-white leading-none mb-1">{multimediaAssignments.filter(a => a.multimediaTrack?.status === 'review').length}</span>
                      Post-Prod.
                      <div className="absolute right-0 top-0 bottom-0 w-4 bg-purple-900/30 translate-x-1/2 rotate-45 transform origin-left z-10 border-t border-r border-purple-700/40"></div>
                    </div>
                    <div className="flex-1 bg-emerald-900/30 border border-emerald-700/40 flex flex-col items-center justify-center text-[10px] font-black text-emerald-300 relative ml-2 z-0 uppercase tracking-wider">
                      <span className="text-lg text-emerald-400 leading-none mb-1">{multimediaAssignments.filter(a => a.multimediaTrack?.status === 'published').length}</span>
                      Published
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget 3: Live Streaming / Podcast */}
              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div className="bg-gray-100 dark:bg-slate-800/40 rounded-lg p-4 border border-slate-700/30 hover:border-pink-500/30 transition-colors flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-3">Live Streaming</span>
                  <div className="relative w-16 h-8 flex items-end justify-center overflow-hidden mb-2">
                    <div className="w-16 h-16 rounded-full border-[6px] border-slate-700 border-t-pink-500 transform rotate-45 absolute top-0"></div>
                  </div>
                  <span className="text-xl font-black text-gray-900 dark:text-white">12.5K</span>
                  <span className="text-[9px] font-bold text-slate-500 mt-1">Viewers Now</span>
                </div>
                
                <div className="bg-gray-100 dark:bg-slate-800/40 rounded-lg p-4 border border-slate-700/30 hover:border-pink-500/30 transition-colors flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-3 text-center">Social Reach</span>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-blue-400 font-black">f</span>
                      <div className="flex-1 mx-2 bg-gray-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden"><div className="w-[80%] h-full bg-blue-500 rounded-full"></div></div>
                      <span className="text-gray-700 dark:text-slate-200 font-bold text-[10px]">200K</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-sky-400 font-black">𝕏</span>
                      <div className="flex-1 mx-2 bg-gray-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden"><div className="w-[60%] h-full bg-sky-500 rounded-full"></div></div>
                      <span className="text-gray-700 dark:text-slate-200 font-bold text-[10px]">125K</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-pink-400 font-black">in</span>
                      <div className="flex-1 mx-2 bg-gray-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden"><div className="w-[45%] h-full bg-pink-500 rounded-full"></div></div>
                      <span className="text-gray-700 dark:text-slate-200 font-bold text-[10px]">53K</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
          
          <div className="mt-8 flex justify-center gap-4 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1">• Allocate more resources to Sports layout</span>
            <span className="flex items-center gap-1">• Focus on increasing video engagement</span>
            <span className="flex items-center gap-1">• Monitor server load for Online Edition</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 dark:bg-[#0f172a] text-gray-800 dark:text-gray-600 dark:text-slate-300 min-h-[calc(100vh-4rem)] p-4 -m-4 font-sans space-y-6 transition-colors duration-200">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500 dark:text-slate-400">
            <Calendar size={16} className="text-blue-600 dark:text-blue-500" />
            <span>সংস্করণ তারিখ</span>
          </div>
          <div className="flex items-center bg-white dark:bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-none">
            <button className="p-1.5 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-500 dark:text-slate-400"><ChevronLeft size={16} /></button>
            <div className="px-3 py-1.5 text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-600 dark:text-slate-300">
              06/22/2026 <Calendar size={14} className="text-gray-400 dark:text-slate-500" />
            </div>
            <button className="p-1.5 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-l border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-500 dark:text-slate-400"><ChevronRight size={16} /></button>
          </div>
          <button className="text-xs px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-500/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors font-medium">
            আজ
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-500 dark:text-slate-400 pl-2">22 Jun 2026</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            <span className="text-gray-500 dark:text-gray-500 dark:text-slate-400 font-normal mr-1">প্রতিবেদন</span> {formatDateToBengali(today)}
          </div>
          {['super_admin', 'managing_editor', 'admin', 'chief_editor'].includes(user?.role) && (
            <button 
              onClick={() => { setShowActivityLog(true); fetchActivityLogs(); }}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 transition-colors border border-blue-200 dark:border-blue-800"
            >
              <History size={14} /> অ্যাক্টিভিটি লগ
            </button>
          )}
        </div>
      </div>
{/* ─── Management Tab Switcher (Visible to Chief Editor / Management / both edition) ─── */}
      {(user?.edition === 'both' || ['managing_editor', 'chief_editor', 'admin', 'super_admin'].includes(user?.role)) && (
        <div className="flex bg-slate-200/70 dark:bg-gray-100 dark:bg-slate-900/80 p-1.5 rounded-2xl max-w-fit mx-auto shadow-inner border border-gray-300/50 dark:border-gray-200 dark:border-slate-800 backdrop-blur-md my-4">
          <button 
            onClick={() => setActiveTab('online')} 
            className={`flex items-center gap-2 px-6 py-3 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'online' 
                ? 'bg-white dark:bg-gray-100 dark:bg-slate-800 shadow-md text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-slate-700' 
                : 'text-gray-600 dark:text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-900 dark:text-white'
            }`}
          >
            <Activity size={16} /> 🌐 অনলাইন ড্যাশবোর্ড
          </button>
          <button 
            onClick={() => setActiveTab('print')} 
            className={`flex items-center gap-2 px-6 py-3 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'print' 
                ? 'bg-white dark:bg-gray-100 dark:bg-slate-800 shadow-md text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-slate-700' 
                : 'text-gray-600 dark:text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-900 dark:text-white'
            }`}
          >
            <Printer size={16} /> 🗞️ প্রিন্ট ড্যাশবোর্ড
          </button>
          <button 
            onClick={() => setActiveTab('multimedia')} 
            className={`flex items-center gap-2 px-6 py-3 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'multimedia' 
                ? 'bg-white dark:bg-gray-100 dark:bg-slate-800 shadow-md text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-slate-700' 
                : 'text-gray-600 dark:text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-900 dark:text-white'
            }`}
          >
            <Video size={16} /> 🎥 মাল্টিমিডিয়া
          </button>
          <button 
            onClick={() => setActiveTab('split')} 
            className={`flex items-center gap-2 px-6 py-3 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'split' 
                ? 'bg-white dark:bg-gray-100 dark:bg-slate-800 shadow-md text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-slate-700' 
                : 'text-gray-600 dark:text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-900 dark:text-white'
            }`}
          >
            <Layers size={16} /> 📊 ম্যানেজমেন্ট কম্বাইন্ড ওভারভিউ
          </button>
        </div>
      )}

      {/* ─── Render Active View ─── */}
      {activeTab === 'online' && renderOnlineDashboard(false)}
      {activeTab === 'print' && renderPrintDashboard(false)}
      {activeTab === 'multimedia' && renderMultimediaDashboard(false)}
      {activeTab === 'split' && renderTopManagementView()}

      {/* Global Activity Log Modal/Sidebar */}
      {showActivityLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setShowActivityLog(false)}>
          <div className="w-96 bg-white dark:bg-gray-100 dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-in-right" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                <History size={18} className="text-blue-600" /> অ্যাক্টিভিটি লগ (গ্লোবাল)
              </div>
              <button onClick={() => setShowActivityLog(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingLogs ? (
                <div className="text-center py-10 text-gray-500">লোড হচ্ছে...</div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-10 text-gray-500">কোনো লগ পাওয়া যায়নি।</div>
              ) : (
                activityLogs.map((log) => (
                  <div key={log._id} className="border border-gray-200 dark:border-gray-200 dark:border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:shadow-sm transition-all bg-gray-50/50 dark:bg-gray-50 dark:bg-gray-100 dark:bg-slate-800/30">
                    <div className="flex justify-between items-start mb-2">
                      <Link to={`/articles/edit/${log.articleId?._id}`} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline line-clamp-2">
                        {log.articleId?.title || 'Unknown Article'}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/50">
                        v{log.versionNumber}
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-500 dark:text-slate-400 font-medium">
                        {new Date(log.createdAt).toLocaleString('bn-BD')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-600 dark:text-slate-300 mb-1">{log.action}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-500 flex items-center gap-1">
                      <User size={12} /> By: {log.savedBy || 'Unknown'}
                    </p>
                    <button onClick={() => setVersionToView(log)}
                      className="mt-3 inline-flex items-center gap-1.5 bg-white dark:bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-400 text-xs px-3 py-1.5 rounded border border-blue-200 dark:border-slate-700 shadow-sm transition-colors">
                      <Eye size={12} /> ওই সময়ের লেখাটি দেখুন
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Version Viewer Modal */}
      {versionToView && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex justify-end" onClick={() => setVersionToView(null)}>
          <div className="w-[600px] bg-white dark:bg-gray-100 dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-in-right" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-gray-100 dark:bg-gray-100 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <History className="text-blue-600" size={18} />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">ভার্সন v{versionToView.versionNumber}</h3>
                  <div className="flex gap-2 items-center text-xs mt-0.5">
                    <span className="text-gray-500 dark:text-gray-500 dark:text-slate-400">{new Date(versionToView.createdAt).toLocaleString('bn-BD')}</span>
                    <span className="text-gray-300">•</span>
                    <span className="font-semibold text-blue-700 dark:text-blue-400">By: {versionToView.savedBy || 'System'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setVersionToView(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingVersionContent ? (
                <div className="text-center py-10 text-gray-500">লোড হচ্ছে...</div>
              ) : versionContent?.contentSnapshot ? (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {versionContent.contentSnapshot.title || 'শিরোনাম নেই'}
                    </h1>
                    <div className="flex gap-2">
                      {versionContent.contentSnapshot.categories?.map((c, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200">{c}</span>
                      ))}
                    </div>
                  </div>
                  
                  {versionContent.contentSnapshot.coverImage && (
                    <img src={versionContent.contentSnapshot.coverImage.startsWith('/uploads') ? `http://localhost:5001${versionContent.contentSnapshot.coverImage}` : versionContent.contentSnapshot.coverImage} alt="Cover" className="w-full h-48 object-cover rounded-xl" />
                  )}

                  <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-200 dark:border-slate-800">
                    {versionContent.contentSnapshot.blocks?.length > 0 ? (
                      versionContent.contentSnapshot.blocks.map((block, i) => (
                        <div key={i}>
                          {block.type === 'text' && (
                            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-600 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: block.content }} />
                          )}
                          {block.type === 'highlight' && (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-200 rounded-r-lg text-sm font-medium">
                              {block.text}
                            </div>
                          )}
                          {block.type === 'embed' && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-100 dark:bg-slate-800 rounded-lg overflow-x-auto text-xs font-mono text-gray-600 dark:text-gray-500 dark:text-slate-400">
                              {block.code}
                            </div>
                          )}
                          {block.type === 'related' && (
                            <div className="p-3 border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/10 rounded-lg flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
                              <span className="font-semibold text-xs bg-blue-600 text-gray-900 dark:text-white px-2 py-0.5 rounded">সম্পর্কিত</span>
                              {block.title}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm text-center italic py-4">কোনো কন্টেন্ট নেই</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">কোনো তথ্য পাওয়া যায়নি।</div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-gray-100 dark:bg-gray-100 dark:bg-slate-800/50 flex justify-end">
              <button onClick={() => setVersionToView(null)} className="px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-700 dark:text-slate-200 text-sm rounded-lg transition-colors">
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

