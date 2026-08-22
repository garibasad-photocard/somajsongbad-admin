import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { AlertTriangle, ChevronRight,
  Printer, TrendingUp, RefreshCw
} from 'lucide-react'

// Stage configuration with colors and icons
const STAGE_CONFIG = {
  assignment_created:      { label: 'অ্যাসাইনমেন্ট তৈরি',            color: 'bg-slate-100 text-slate-700',    dot: 'bg-slate-400',    group: 'reporter' },
  assigned_to_reporter:    { label: 'রিপোর্টারকে দেওয়া হয়েছে',        color: 'bg-yellow-100 text-yellow-800',  dot: 'bg-yellow-400',   group: 'reporter' },
  reporter_working:        { label: 'রিপোর্টার লিখছে',                color: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-400',   group: 'reporter' },
  reporter_submitted:      { label: 'রিপোর্টার জমা দিয়েছে',           color: 'bg-orange-100 text-orange-700',  dot: 'bg-orange-400',   group: 'department' },
  returned_to_creator:     { label: 'ক্রিয়েটরের কাছে ফিরেছে',         color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-400',    group: 'department' },
  department_review:       { label: 'ডিপার্টমেন্ট রিভিউ',             color: 'bg-indigo-100 text-indigo-700',  dot: 'bg-indigo-400',   group: 'department' },
  revision_required:       { label: 'সংশোধন দরকার',                    color: 'bg-red-100 text-red-700',        dot: 'bg-red-400',      group: 'department' },
  department_approved:     { label: 'ডিপার্টমেন্ট অনুমোদিত',           color: 'bg-green-100 text-green-700',    dot: 'bg-green-400',    group: 'department' },
  sent_to_news_management: { label: 'NM ডেস্কে পাঠানো',               color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-400',     group: 'nm' },
  sent_to_own_page:        { label: 'নিজ পাতায় (সরাসরি)',              color: 'bg-cyan-100 text-cyan-700',      dot: 'bg-cyan-400',     group: 'nm' },
  news_management_editing: { label: 'NM এডিটিং চলছে',                 color: 'bg-blue-200 text-blue-800',      dot: 'bg-blue-500',     group: 'nm' },
  page_planning:           { label: 'পেজ প্ল্যানিং',                   color: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-400',   group: 'nm' },
  sent_to_proof:           { label: 'প্রুফে পাঠানো',                   color: 'bg-pink-100 text-pink-700',      dot: 'bg-pink-400',     group: 'proof' },
  proof_correction:        { label: 'প্রুফ সংশোধন (NM ফেরত)',          color: 'bg-rose-100 text-rose-700',      dot: 'bg-rose-400',     group: 'proof' },
  proof_approved:          { label: 'প্রুফ অনুমোদিত',                   color: 'bg-teal-100 text-teal-700',      dot: 'bg-teal-400',     group: 'proof' },
  sent_to_page:            { label: 'পেজে পাঠানো',                     color: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-400',  group: 'page' },
  page_makeup:             { label: 'পেজ মেকআপ চলছে',                  color: 'bg-lime-100 text-lime-700',      dot: 'bg-lime-500',     group: 'page' },
  executive_review:        { label: 'এক্সিকিউটিভ রিভিউ',               color: 'bg-amber-200 text-amber-800',    dot: 'bg-amber-500',    group: 'exec' },
  makeup_correction:       { label: 'মেকআপ সংশোধন',                    color: 'bg-orange-200 text-orange-800',  dot: 'bg-orange-500',   group: 'exec' },
  ready_for_print:         { label: 'প্রিন্টের জন্য প্রস্তুত',          color: 'bg-green-200 text-green-800',    dot: 'bg-green-600',    group: 'exec' },
  printed:                 { label: 'ছাপা হয়েছে',                       color: 'bg-gray-200 text-gray-700',      dot: 'bg-gray-400',     group: 'exec' }
}

const GROUP_CONFIG = {
  reporter:   { label: 'রিপোর্টার স্তর',         color: 'border-purple-300',  headerColor: 'bg-purple-50 text-purple-700' },
  department: { label: 'ডিপার্টমেন্ট স্তর',       color: 'border-indigo-300',  headerColor: 'bg-indigo-50 text-indigo-700' },
  nm:         { label: 'নিউজ ম্যানেজমেন্ট',       color: 'border-blue-300',    headerColor: 'bg-blue-50 text-blue-700' },
  proof:      { label: 'প্রুফ ডেস্ক',             color: 'border-pink-300',    headerColor: 'bg-pink-50 text-pink-700' },
  page:       { label: 'পেজ ডেস্ক',               color: 'border-emerald-300', headerColor: 'bg-emerald-50 text-emerald-700' },
  exec:       { label: 'এক্সিকিউটিভ',             color: 'border-amber-300',   headerColor: 'bg-amber-50 text-amber-700' }
}

function StatCard({ stage, label, count, color, dot, onClick }) {
  const isBottleneck = count >= 5
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-md hover:scale-[1.02] text-left w-full ${isBottleneck ? 'border-red-300 bg-red-50' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}
    >
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{label}</p>
        <p className={`text-xl font-bold ${isBottleneck ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{count}</p>
      </div>
      {isBottleneck && <AlertTriangle size={14} className="text-red-500 shrink-0" />}
      <ChevronRight size={13} className="text-gray-400 shrink-0" />
    </button>
  )
}

export default function PrintWorkflowDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await api.get('/print-workflow/dashboard-stats')
      setStats(res.data)
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Failed to fetch stats', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 60000) // auto-refresh every 60s
    return () => clearInterval(interval)
  }, [])

  const totalActive = stats.reduce((sum, s) => s.stage !== 'printed' ? sum + s.count : sum, 0)
  const totalPrinted = stats.find(s => s.stage === 'printed')?.count || 0
  const bottlenecks = stats.filter(s => s.count >= 5 && s.stage !== 'printed')

  // Group stats by workflow group
  const grouped = {}
  stats.forEach(s => {
    const cfg = STAGE_CONFIG[s.stage]
    if (!cfg) return
    const g = cfg.group
    if (!grouped[g]) grouped[g] = []
    grouped[g].push(s)
  })

  const groupOrder = ['reporter', 'department', 'nm', 'proof', 'page', 'exec']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Printer size={20} className="text-purple-600" />
            প্রিন্ট ওয়ার্কফ্লো ড্যাশবোর্ড
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
            সর্বশেষ আপডেট: {lastRefresh.toLocaleTimeString('bn-BD')}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          রিফ্রেশ
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-xl p-4 shadow">
          <p className="text-purple-200 text-xs">মোট সক্রিয়</p>
          <p className="text-3xl font-bold">{totalActive}</p>
          <p className="text-purple-200 text-xs mt-1">প্রিন্ট হওয়া বাদে</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-xl p-4 shadow">
          <p className="text-green-200 text-xs">ছাপা হয়েছে</p>
          <p className="text-3xl font-bold">{totalPrinted}</p>
          <p className="text-green-200 text-xs mt-1">আজকের মোট</p>
        </div>
        <div className={`rounded-xl p-4 shadow ${bottlenecks.length > 0 ? 'bg-gradient-to-br from-red-500 to-red-700 text-white' : 'bg-gradient-to-br from-slate-500 to-slate-700 text-white'}`}>
          <p className="text-slate-200 text-xs">বটলনেক</p>
          <p className="text-3xl font-bold">{bottlenecks.length}</p>
          <p className="text-slate-200 text-xs mt-1">৫+ আটকে থাকা স্টেজ</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl p-4 shadow">
          <p className="text-blue-200 text-xs">প্রুফে আছে</p>
          <p className="text-3xl font-bold">{stats.find(s => s.stage === 'sent_to_proof')?.count || 0}</p>
          <p className="text-blue-200 text-xs mt-1">প্রুফ ডেস্কে</p>
        </div>
      </div>

      {/* Bottleneck Alert */}
      {bottlenecks.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-600" />
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">বটলনেক সতর্কতা</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {bottlenecks.map(b => (
              <span key={b.stage} className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg text-xs font-medium">
                {STAGE_CONFIG[b.stage]?.label}: {b.count}টি
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stage Groups */}
      {groupOrder.map(groupKey => {
        const groupStages = grouped[groupKey]
        if (!groupStages || groupStages.length === 0) return null
        const groupCfg = GROUP_CONFIG[groupKey]
        const groupTotal = groupStages.reduce((sum, s) => sum + s.count, 0)

        return (
          <div key={groupKey} className={`rounded-xl border-2 ${groupCfg.color} overflow-hidden`}>
            <div className={`flex items-center justify-between px-4 py-2.5 ${groupCfg.headerColor}`}>
              <span className="text-sm font-semibold">{groupCfg.label}</span>
              <span className="text-lg font-bold">{groupTotal}</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {groupStages.map(s => {
                const cfg = STAGE_CONFIG[s.stage] || {}
                return (
                  <StatCard
                    key={s.stage}
                    stage={s.stage}
                    label={cfg.label || s.label}
                    count={s.count}
                    color={cfg.color}
                    dot={cfg.dot}
                    onClick={() => navigate(`/workflow/print?stage=${s.stage}`)}
                  />
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Flow Diagram (simplified) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <TrendingUp size={14} />
          ওয়ার্কফ্লো পথ
        </h3>
        <div className="flex items-center flex-wrap gap-1 text-xs">
          {Object.entries(STAGE_CONFIG).map(([stage, cfg], idx, arr) => (
            <span key={stage} className="flex items-center gap-1">
              <span className={`px-2 py-1 rounded-full ${cfg.color} font-medium`}>{cfg.label}</span>
              {idx < arr.length - 1 && <ChevronRight size={12} className="text-gray-400" />}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
