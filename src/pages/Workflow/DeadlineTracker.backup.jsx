import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Bell, AlertTriangle, AlertCircle, CheckCircle2, ArrowRight, User, Calendar } from 'lucide-react'
import { useWorkflow } from '../../context/WorkflowContext'
import MediaFlowLogo from '../../components/common/MediaFlowLogo'

export default function DeadlineTracker() {
  const { assignments, notifications, markRead } = useWorkflow()
  const [filter, setFilter] = useState('all') // 'all', 'overdue', 'urgent', 'normal'

  const now = new Date()

  // Process assignments with deadline calculations
  const processedAssignments = assignments
    .filter(a => a.deadline && !['submitted', 'approved', 'published'].includes(a.status))
    .map(a => {
      const deadlineDate = new Date(a.deadline)
      const timeDiff = deadlineDate - now
      const hoursDiff = timeDiff / (1000 * 60 * 60)

      let urgency = 'normal'
      let timeText = ''

      if (hoursDiff <= 0) {
        urgency = 'overdue'
        const overdueHours = Math.abs(Math.round(hoursDiff))
        timeText = `ডেডলাইন ${overdueHours} ঘণ্টা আগে পার হয়ে গেছে!`
      } else if (hoursDiff <= 1) {
        urgency = 'urgent'
        const mins = Math.round(hoursDiff * 60)
        timeText = `আর মাত্র ${mins} মিনিট বাকি!`
      } else {
        urgency = 'normal'
        const hrs = Math.round(hoursDiff)
        timeText = `${hrs} ঘণ্টা বাকি আছে`
      }

      return {
        ...a,
        urgency,
        timeText,
        hoursDiff
      }
    })
    .sort((a, b) => a.hoursDiff - b.hoursDiff)

  const overdueCount = processedAssignments.filter(a => a.urgency === 'overdue').length
  const urgentCount = processedAssignments.filter(a => a.urgency === 'urgent').length
  const normalCount = processedAssignments.filter(a => a.urgency === 'normal').length

  const filteredAssignments = processedAssignments.filter(a => {
    if (filter === 'all') return true
    return a.urgency === filter
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#f8fafc] dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-slate-800 pb-6">
        <div className="mb-3">
          <MediaFlowLogo variant="horizontal" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <span>⏰</span> ডেডলাইন ও নোটিফিকেশন ট্র্যাকার
        </h1>
        <p className="text-sm text-gray-600 dark:text-slate-400 max-w-2xl">
          রিয়েল-টাইম অ্যাসাইনমেন্ট ডেডলাইন অ্যালার্ট এবং নিউজরুম নোটিফিকেশন ড্যাশবোর্ড। ডেডলাইন পার হয়ে যাওয়া বা অল্প সময় বাকি থাকা অ্যাসাইনমেন্টগুলোর ওপর নজর রাখুন।
        </p>
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Overdue Card */}
        <button
          onClick={() => setFilter('overdue')}
          className={`p-6 rounded-3xl border transition-all text-left ${filter === 'overdue' ? 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/20' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${filter === 'overdue' ? 'bg-white/20 text-white' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-500'}`}>
              <AlertCircle size={24} />
            </div>
            <span className={`text-2xl font-black ${filter === 'overdue' ? 'text-white' : 'text-rose-600 dark:text-rose-400'}`}>
              {overdueCount}
            </span>
          </div>
          <h3 className={`font-bold text-base mb-1 ${filter === 'overdue' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            ডেডলাইন পার হয়ে গেছে
          </h3>
          <p className={`text-xs ${filter === 'overdue' ? 'text-rose-100' : 'text-gray-500 dark:text-slate-400'}`}>
            জরুরি ভিত্তিতে জমা দেওয়া প্রয়োজন
          </p>
        </button>

        {/* Urgent Card */}
        <button
          onClick={() => setFilter('urgent')}
          className={`p-6 rounded-3xl border transition-all text-left ${filter === 'urgent' ? 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-800'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${filter === 'urgent' ? 'bg-white/20 text-white' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-500'}`}>
              <AlertTriangle size={24} />
            </div>
            <span className={`text-2xl font-black ${filter === 'urgent' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}>
              {urgentCount}
            </span>
          </div>
          <h3 className={`font-bold text-base mb-1 ${filter === 'urgent' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            অল্প সময় বাকি (&lt; ১ ঘণ্টা)
          </h3>
          <p className={`text-xs ${filter === 'urgent' ? 'text-amber-100' : 'text-gray-500 dark:text-slate-400'}`}>
            ডেডলাইন খুব কাছে চলে এসেছে
          </p>
        </button>

        {/* Normal Card */}
        <button
          onClick={() => setFilter('normal')}
          className={`p-6 rounded-3xl border transition-all text-left ${filter === 'normal' ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg shadow-emerald-600/20' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-800'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${filter === 'normal' ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
              <CheckCircle2 size={24} />
            </div>
            <span className={`text-2xl font-black ${filter === 'normal' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {normalCount}
            </span>
          </div>
          <h3 className={`font-bold text-base mb-1 ${filter === 'normal' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            পর্যাপ্ত সময় আছে
          </h3>
          <p className={`text-xs ${filter === 'normal' ? 'text-emerald-100' : 'text-gray-500 dark:text-slate-400'}`}>
            ১ ঘণ্টার বেশি সময় বাকি আছে
          </p>
        </button>

        {/* Total Notifications Card */}
        <div className="p-6 rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
              <Bell size={24} />
            </div>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {notifications.length}
            </span>
          </div>
          <h3 className="font-bold text-base mb-1 text-gray-900 dark:text-white">
            মোট নোটিফিকেশন
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            সাম্প্রতিক নিউজরুম অ্যালার্ট ও আপডেট
          </p>
        </div>

      </div>

      {/* ─── Filter Tabs ─── */}
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-slate-800 pb-4 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${filter === 'all' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'}`}
        >
          <span>সব অ্যাসাইনমেন্ট</span>
          <span className="px-2 py-0.5 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-full text-xs">
            {processedAssignments.length}
          </span>
        </button>
        <button
          onClick={() => setFilter('overdue')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${filter === 'overdue' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-gray-200 dark:border-slate-700'}`}
        >
          <span>🔴 ডেডলাইন পার হয়ে গেছে</span>
          <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 rounded-full text-xs">
            {overdueCount}
          </span>
        </button>
        <button
          onClick={() => setFilter('urgent')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${filter === 'urgent' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-gray-200 dark:border-slate-700'}`}
        >
          <span>⚠️ অল্প সময় বাকি</span>
          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-xs">
            {urgentCount}
          </span>
        </button>
        <button
          onClick={() => setFilter('normal')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${filter === 'normal' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-gray-200 dark:border-slate-700'}`}
        >
          <span>🟢 পর্যাপ্ত সময় আছে</span>
          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold">
            {normalCount}
          </span>
        </button>
      </div>

      {/* ─── Main Content Grid: Assignments & Recent Notifications ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Deadline Assignment Cards */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <Clock size={20} className="text-rose-500" />
            <span>অ্যাসাইনমেন্ট ডেডলাইন ট্র্যাকিং</span>
          </h2>

          {filteredAssignments.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl p-12 text-center text-gray-400 dark:text-slate-500 shadow-sm">
              এই ফিল্টারে কোনো পেন্ডিং অ্যাসাইনমেন্ট নেই
            </div>
          ) : (
            filteredAssignments.map(a => (
              <div
                key={a.id}
                className={`bg-white dark:bg-slate-800 border rounded-3xl p-6 shadow-sm space-y-5 transition-all hover:shadow-md ${a.urgency === 'overdue' ? 'border-rose-200 dark:border-rose-800/50 border-l-8 border-l-rose-500' : a.urgency === 'urgent' ? 'border-amber-200 dark:border-amber-800/50 border-l-8 border-l-amber-500' : 'border-gray-200 dark:border-slate-700 border-l-8 border-l-emerald-500'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-600">
                      {a.categories?.[0] || 'জেনারেল'}
                    </span>
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${a.edition === 'online' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800' : a.edition === 'print' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-200 dark:border-purple-800' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200 dark:border-emerald-800'}`}>
                      {a.edition === 'online' ? '🌐 অনলাইন' : a.edition === 'print' ? '🗞️ প্রিন্ট' : '🔀 উভয় ভার্সন'}
                    </span>
                  </div>

                  <span className={`px-4 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-sm ${a.urgency === 'overdue' ? 'bg-rose-500 text-white' : a.urgency === 'urgent' ? 'bg-amber-500 text-white' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'}`}>
                    <Clock size={14} />
                    <span>{a.timeText}</span>
                  </span>
                </div>

                <h3 className="font-bold text-xl text-gray-900 dark:text-white leading-snug">{a.title}</h3>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-slate-700/50 text-xs text-gray-500 dark:text-slate-400">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-300">
                      <User size={15} className="text-indigo-500" />
                      <span>রিপোর্টার: {a.assignedTo?.name || 'স্টাফ রিপোর্টার'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={15} className="text-gray-400" />
                      <span>ডেডলাইন: {new Date(a.deadline).toLocaleString('bn-BD')}</span>
                    </div>
                  </div>

                  <Link
                    to={`/workflow/${a.id}`}
                    className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl transition-all shadow-sm"
                  >
                    <span>অ্যাসাইনমেন্ট খুলুন</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right 1 Column: Live Notifications Log */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <Bell size={20} className="text-indigo-500" />
              <span>রিয়েল-টাইম নোটিফিকেশন</span>
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4 max-h-[800px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-400 dark:text-slate-500">
                কোনো নোটিফিকেশন নেই
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${!n.read ? 'bg-indigo-50/60 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/50' : 'bg-slate-50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/80'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-transparent'}`} />
                      <p className={`text-xs leading-relaxed ${!n.read ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-600 dark:text-slate-300 font-medium'}`}>
                        {n.text}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500 pl-4.5">
                    <span>{n.time}</span>
                    {n.assignmentId && (
                      <Link
                        to={`/workflow/${n.assignmentId}`}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <span>খুলুন</span>
                        <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
