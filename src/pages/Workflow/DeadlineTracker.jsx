import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Bell, AlertTriangle, AlertCircle, CheckCircle2, User, Calendar, Activity, Info, ArrowRight } from 'lucide-react'
import { useWorkflow } from '../../context/WorkflowContext'
import MediaFlowLogo from '../../components/common/MediaFlowLogo'

export default function DeadlineTracker() {
  const { assignments, notifications, markRead } = useWorkflow()
  const [filter, setFilter] = useState('all')

  const now = new Date()

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
        timeText = overdueHours === 0 ? '??????? ??? ?????!' : `${overdueHours} ????? ??? ??? ????!`
      } else if (hoursDiff <= 1) {
        urgency = 'urgent'
        const mins = Math.round(hoursDiff * 60)
        timeText = `?? ????? ${mins} ????? ????!`
      } else {
        urgency = 'normal'
        const hrs = Math.round(hoursDiff)
        timeText = `${hrs} ????? ???? ???`
      }

      return { ...a, urgency, timeText, hoursDiff }
    })
    .sort((a, b) => a.hoursDiff - b.hoursDiff)

  const overdueCount = processedAssignments.filter(a => a.urgency === 'overdue').length
  const urgentCount = processedAssignments.filter(a => a.urgency === 'urgent').length
  const normalCount = processedAssignments.filter(a => a.urgency === 'normal').length

  const filteredAssignments = processedAssignments.filter(a => filter === 'all' || a.urgency === filter)

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 min-h-screen font-sans">
      
      {/* Smart Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200/50 dark:border-slate-800/50">
        <div>
          <div className="mb-4 inline-block">
            <MediaFlowLogo variant="horizontal" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-2 flex items-center gap-3">
            <Activity className="text-blue-600 dark:text-blue-400" size={32} />
            ??????? ??????? ?????????
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-slate-400 max-w-2xl font-medium">
            ???? ??????? ??????????? ??????-????? ????? ???????, ????????? ??? ???????????? ???????????? ??? ??? ??????
          </p>
        </div>
      </div>

      {/* Modern Glassmorphic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Overdue */}
        <button onClick={() => setFilter('overdue')} className={`relative overflow-hidden p-6 rounded-3xl border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-left ${filter === 'overdue' || (filter === 'all' && overdueCount > 0) ? 'bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-500/40 border-transparent text-white' : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-rose-200 dark:border-rose-900/50 hover:border-rose-400'}`}>
          {(filter === 'overdue' || overdueCount > 0) && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 animate-pulse"></div>}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className={`p-3.5 rounded-2xl flex items-center justify-center ${filter === 'overdue' || (filter === 'all' && overdueCount > 0) ? 'bg-white/20 text-white backdrop-blur-sm shadow-inner' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
              <AlertCircle size={28} className={overdueCount > 0 ? 'animate-pulse' : ''} />
            </div>
            <span className={`text-4xl font-black tracking-tighter ${filter === 'overdue' || (filter === 'all' && overdueCount > 0) ? 'text-white' : 'text-rose-600 dark:text-rose-400'}`}>
              {overdueCount}
            </span>
          </div>
          <h3 className={`font-bold text-lg mb-1 ${filter === 'overdue' || (filter === 'all' && overdueCount > 0) ? 'text-white' : 'text-gray-900 dark:text-white'}`}>??????? ?????</h3>
          <p className={`text-sm font-medium ${filter === 'overdue' || (filter === 'all' && overdueCount > 0) ? 'text-rose-100' : 'text-gray-500 dark:text-slate-400'}`}>?????????? ??? ????? ???????</p>
        </button>

        {/* Urgent */}
        <button onClick={() => setFilter('urgent')} className={`relative overflow-hidden p-6 rounded-3xl border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-left ${filter === 'urgent' ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/40 border-transparent text-white' : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-amber-200 dark:border-amber-900/50 hover:border-amber-400'}`}>
          {filter === 'urgent' && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className={`p-3.5 rounded-2xl flex items-center justify-center ${filter === 'urgent' ? 'bg-white/20 text-white backdrop-blur-sm shadow-inner' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
              <AlertTriangle size={28} />
            </div>
            <span className={`text-4xl font-black tracking-tighter ${filter === 'urgent' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}>
              {urgentCount}
            </span>
          </div>
          <h3 className={`font-bold text-lg mb-1 ${filter === 'urgent' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>???? ??? ????</h3>
          <p className={`text-sm font-medium ${filter === 'urgent' ? 'text-amber-100' : 'text-gray-500 dark:text-slate-400'}`}>? ?????? ?? ??? ???</p>
        </button>

        {/* Normal */}
        <button onClick={() => setFilter('normal')} className={`relative overflow-hidden p-6 rounded-3xl border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-left ${filter === 'normal' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/40 border-transparent text-white' : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-400'}`}>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className={`p-3.5 rounded-2xl flex items-center justify-center ${filter === 'normal' ? 'bg-white/20 text-white backdrop-blur-sm shadow-inner' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
              <CheckCircle2 size={28} />
            </div>
            <span className={`text-4xl font-black tracking-tighter ${filter === 'normal' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {normalCount}
            </span>
          </div>
          <h3 className={`font-bold text-lg mb-1 ${filter === 'normal' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>???????? ???</h3>
          <p className={`text-sm font-medium ${filter === 'normal' ? 'text-emerald-100' : 'text-gray-500 dark:text-slate-400'}`}>????? ???? ??? ???</p>
        </button>

        {/* Notifications Summary */}
        <div className="relative overflow-hidden p-6 rounded-3xl border border-indigo-200 dark:border-indigo-900/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md hover:border-indigo-400 transition-all text-left group shadow-sm">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3.5 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bell size={28} />
            </div>
            <span className="text-4xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400">
              {notifications.length}
            </span>
          </div>
          <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">????????? ? ?????</h3>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">????????? ??????????</p>
        </div>

      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-4">
        
        {/* Left: Timeline View */}
        <div className="xl:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-gray-200/60 dark:border-slate-800/60 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <Clock className="text-indigo-500" size={28} />
              ????????????? ????????
            </h2>
            <div className="bg-gray-100 dark:bg-slate-800 rounded-full p-1 flex">
               <button onClick={() => setFilter('all')} className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all ${filter==='all'?'bg-white dark:bg-slate-700 shadow text-gray-900 dark:text-white':'text-gray-500 hover:text-gray-700 dark:text-slate-400'}`}>?? ?????</button>
            </div>
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center opacity-70">
              <CheckCircle2 size={64} className="text-gray-300 dark:text-slate-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-500 dark:text-slate-400">?? ???????!</h3>
              <p className="text-gray-400">?? ??????????? ???? ??????? ????? ????</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-gray-200 dark:border-slate-700 ml-4 md:ml-6 space-y-8 pb-4">
              {filteredAssignments.map((a) => {
                const isOverdue = a.urgency === 'overdue'
                const isUrgent = a.urgency === 'urgent'
                
                return (
                  <div key={a.id} className="relative pl-8 md:pl-10 group">
                    {/* Timeline Node */}
                    <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 z-10 transition-transform duration-300 group-hover:scale-125 ${isOverdue ? 'bg-rose-500 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.6)]' : isUrgent ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                    
                    {/* Content Card */}
                    <div className={`bg-white dark:bg-slate-800 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border ${isOverdue ? 'border-rose-200 dark:border-rose-900/50 hover:border-rose-300' : 'border-gray-100 dark:border-slate-700 hover:border-indigo-300'}`}>
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                        <div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-black rounded-lg ${isOverdue ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20' : isUrgent ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20'}`}>
                              {a.timeText}
                            </span>
                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] uppercase tracking-wider font-bold rounded-lg border border-slate-200 dark:border-slate-600">
                              {a.categories?.[0] || '???????'}
                            </span>
                          </div>
                          <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {a.title}
                          </h3>
                        </div>
                        
                        <Link to={`/workflow/${a.id}`} className="shrink-0 w-12 h-12 rounded-2xl bg-gray-50 dark:bg-slate-700 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 transition-colors shadow-sm group-hover:shadow-md">
                          <ArrowRight size={20} />
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400 font-medium bg-gray-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700/50">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0">
                            <User size={16} />
                          </div>
                          <div className="truncate">
                            <span className="block text-[10px] text-gray-400 uppercase tracking-wide">?????????</span>
                            <span className="truncate block font-bold text-gray-800 dark:text-slate-200">{a.assignedTo?.name || '???????? ??? ????'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400 font-medium bg-gray-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700/50">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                            <Calendar size={16} />
                          </div>
                          <div>
                            <span className="block text-[10px] text-gray-400 uppercase tracking-wide">???????</span>
                            <span className="font-bold text-gray-800 dark:text-slate-200">{new Date(a.deadline).toLocaleString('bn-BD', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Smart Notification Panel */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-gray-200/60 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm h-full flex flex-col">
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center justify-between mb-6 border-b border-gray-200/50 dark:border-slate-700/50 pb-4">
              <span className="flex items-center gap-2">
                <Bell className="text-amber-500" size={24} />
                ???? ?????
              </span>
              {notifications.length > 0 && (
                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full font-bold shadow-sm animate-pulse">
                  {notifications.length} ????
                </span>
              )}
            </h2>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="text-center text-gray-400 py-10 opacity-70">
                  <Info size={48} className="mx-auto mb-3 opacity-30 text-blue-400" />
                  <p className="font-medium text-slate-500">???? ???? ?????????? ???</p>
                </div>
              ) : (
                notifications.map((notif, idx) => (
                  <div key={idx} className="group relative bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-default overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="text-sm text-gray-800 dark:text-slate-200 font-medium leading-relaxed">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(notif.time || Date.now()).toLocaleTimeString('bn-BD')}
                        </p>
                      </div>
                      <button onClick={() => markRead && markRead(notif.id)} className="shrink-0 p-2 rounded-full text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all" title="Mark as read">
                        <CheckCircle2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}
