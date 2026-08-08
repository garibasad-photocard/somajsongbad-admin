import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkflow } from '../../context/WorkflowContext'
import { useAuth } from '../../context/AuthContext'
import { Check, X, Clock, User, Tag, FileText, ArrowLeft, AlertCircle } from 'lucide-react'

export default function AssignmentApproval({ editionFilter }) {
  const navigate = useNavigate()
  const { assignments, updateStatus, updateAssigneeTaskStatus } = useWorkflow()
  const { user } = useAuth()
  const [processingId, setProcessingId] = useState(null)

  const queueTitle = editionFilter === 'online'
    ? '🌐 অনলাইন অ্যাপ্রুভাল কিউ'
    : editionFilter === 'print'
    ? '🗞️ প্রিন্ট অ্যাপ্রুভাল কিউ'
    : editionFilter === 'multimedia'
    ? '🎥 মাল্টিমিডিয়া অ্যাপ্রুভাল কিউ'
    : user?.role === 'editor' && user?.edition === 'online'
    ? '🌐 অনলাইন অ্যাপ্রুভাল কিউ'
    : user?.role === 'editor' && user?.edition === 'print'
    ? '🗞️ প্রিন্ট অ্যাপ্রুভাল কিউ'
    : user?.role === 'editor' && user?.edition === 'multimedia'
    ? '🎥 মাল্টিমিডিয়া অ্যাপ্রুভাল কিউ'
    : '🔀 সাধারণ ও ডুয়াল-ট্র্যাক অ্যাপ্রুভাল কিউ';

  // Filter both self_pending and pending assignments based on user role and assignee
  const pendingAssignments = useMemo(() => {
    if (!assignments) return []
    return assignments.filter(a => {
      let isVisibleToUser = false;
      
      // Determine if assignment belongs to the user
      const isMine = (a.assignees?.some(u => u.name === user?.name || String(u.id) === String(user?._id) || String(u.id) === String(user?.id))) ||
                     (a.assignedTo?.name === user?.name || String(a.assignedTo?.id) === String(user?._id) || String(a.assignedTo?.id) === String(user?.id)) ||
                     (a.assigneeName === user?.name || String(a.assigneeId) === String(user?._id) || String(a.assigneeId) === String(user?.id));

      if (['chief_editor', 'managing_editor', 'editor', 'admin', 'super_admin'].includes(user?.role) || !user?.role || isMine) {
        isVisibleToUser = true;
      }

      if (!isVisibleToUser) return false;

      // ─── Edition and Track Filter ───
      const filterToUse = editionFilter || (user?.role === 'editor' ? user?.edition : null);
      
      if (filterToUse === 'online') {
        if (!['online', 'both', 'all'].includes(a.edition)) return false;
        if (!a.onlineTrack || !['pending', 'review'].includes(a.onlineTrack.status)) return false;
        return true;
      }
      
      if (filterToUse === 'print') {
        if (!['print', 'both', 'all'].includes(a.edition)) return false;
        if (!a.printTrack || !['pending', 'review'].includes(a.printTrack.status)) return false;
        return true;
      }
      
      if (filterToUse === 'multimedia') {
        if (!['multimedia', 'all'].includes(a.edition)) return false;
        if (!a.multimediaTrack || !['pending', 'review', 'in_production'].includes(a.multimediaTrack.status)) return false;
        return true;
      }

      // If no specific desk filter (e.g., Central Editor looking at all)
      return a.status === 'pending' || a.status === 'self_pending';
    })
  }, [assignments, user, editionFilter])

  // Calculate last 24 hours count
  const last24HoursCount = useMemo(() => {
    const now = new Date()
    return pendingAssignments.filter(a => {
      const dt = new Date(a.createdAt || a.updatedAt || Date.now())
      const diffHrs = (now - dt) / (1000 * 60 * 60)
      return diffHrs <= 24
    }).length
  }, [pendingAssignments])

  // Desk/Category breakdown
  const deskBreakdown = useMemo(() => {
    const counts = {}
    pendingAssignments.forEach(a => {
      const cat = a.categories?.[0] || a.category || 'সাধারণ'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return Object.entries(counts).map(([cat, count]) => `${cat}: ${count}`).join(', ') || 'কোনো ডেস্ক নেই'
  }, [pendingAssignments])

  const handleApprove = async (id) => {
    setProcessingId(id)
    const target = assignments.find(a => (a.id || a._id) === id)
    
    if (target?.status === 'pending') {
      // Reporter accepting their assigned task
      const assignee = target.assignees?.find(u => u.name === user?.name || String(u.id) === String(user?._id) || String(u.id) === String(user?.id)) ||
                       (target.assignedTo?.name === user?.name || String(target.assignedTo?.id) === String(user?._id) ? target.assignedTo : null) ||
                       (target.assigneeName === user?.name || String(target.assigneeId) === String(user?._id) ? { id: target.assigneeId, name: target.assigneeName } : null);

      if (assignee && assignee.id) {
        await updateAssigneeTaskStatus(id, assignee.id, 'accepted', 'অ্যাসাইনমেন্ট গ্রহণ করেছেন');
      } else {
        // Fallback for global accept
        await updateStatus(id, 'accepted', 'অ্যাসাইনমেন্ট গ্রহণ করা হয়েছে', user?.name || 'ব্যবহারকারী');
      }
    } else if (target?.status === 'self_pending') {
      // Editor approving a self-assignment request
      await updateStatus(id, 'accepted', 'সেলফ অ্যাসাইনমেন্ট অনুমোদন করা হয়েছে', user?.name || 'এডিটর');
    }

    setProcessingId(null)
  }

  const handleReject = async (id) => {
    const reason = window.prompt("রিজেক্ট করার কারণ লিখুন (বাধ্যতামূলক):")
    if (!reason) {
      alert("কারণ না জানালে রিজেক্ট করা যাবে না।")
      return
    }
    setProcessingId(id)
    const target = assignments.find(a => (a.id || a._id) === id)
    
    if (target?.status === 'pending') {
      // Reporter rejecting their assigned task
      const assignee = target.assignees?.find(u => u.name === user?.name || String(u.id) === String(user?._id) || String(u.id) === String(user?.id)) ||
                       (target.assignedTo?.name === user?.name || String(target.assignedTo?.id) === String(user?._id) ? target.assignedTo : null) ||
                       (target.assigneeName === user?.name || String(target.assigneeId) === String(user?._id) ? { id: target.assigneeId, name: target.assigneeName } : null);

      if (assignee && assignee.id) {
        await updateAssigneeTaskStatus(id, assignee.id, 'rejected', reason);
      } else {
        await updateStatus(id, 'rejected', reason, user?.name || 'ব্যবহারকারী');
      }
    } else {
      const nextStatus = target?.status === 'pending' ? 'rejected' : 'self_rejected'
      await updateStatus(id, nextStatus, reason, user?.name || 'অ্যাডমিন')
    }
    setProcessingId(null)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-[#f8fafc] dark:bg-slate-900 min-h-screen">
      {/* Header section matching mockup */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
        <div>
          <p className="text-xs font-bold text-amber-600 dark:text-amber-500 tracking-wider uppercase mb-1">
            টাস্ক ও অনুমোদন প্যানেল
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {queueTitle} ({pendingAssignments.length}টি)
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {user?.role === 'editor' && user?.edition === 'online' 
              ? '→ শুধু online এবং both অ্যাসাইনমেন্ট | onlineTrack.status = pending/review | printTrack দেখতে পাবেন না'
              : user?.role === 'editor' && user?.edition === 'print'
              ? '→  শুধু print এবং both অ্যাসাইনমেন্ট | printTrack.status = pending/review | printDate, pageNumber ফর্ম থাকবে | onlineTrack দেখতে পাবেন না'
              : 'যাকে অ্যাসাইন করা হয়েছে তিনি এখান থেকে টাস্ক গ্রহণ (Accept) করতে পারবেন। এডিটররা সেলফ অ্যাসাইনমেন্ট অনুমোদন করতে পারবেন।'}
          </p>
        </div>
        <button 
          onClick={() => navigate('/workflow/all')}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors self-start md:self-auto pt-2 md:pt-0"
        >
          <ArrowLeft size={16} />
          <span>অ্যাসাইনমেন্ট বোর্ডে ফিরে যান</span>
        </button>
      </div>

      {/* 3 Summary Stats Cards matching mockup */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
            অপেক্ষমান টাস্ক / অনুরোধ
          </p>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-500">
            {pendingAssignments.length}
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
            ২৪ ঘণ্টার মধ্যে জমা
          </p>
          <p className="text-3xl font-black text-gray-900 dark:text-white">
            {last24HoursCount}
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
            ডেস্ক অনুযায়ী
          </p>
          <p className="text-lg font-bold text-gray-800 dark:text-slate-200 truncate">
            {deskBreakdown}
          </p>
        </div>
      </div>

      {/* Pending Requests List / Empty State */}
      <div className="mt-8">
        {pendingAssignments.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center shadow-sm flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Check size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              কোনো অপেক্ষমান টাস্ক নেই
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm">
              বর্তমানে আপনার গ্রহণের জন্য কোনো নতুন টাস্ক বা এডিটরের অনুমোদনের জন্য কোনো সেলফ অ্যাসাইনমেন্ট অপেক্ষমান নেই।
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingAssignments.map((a) => {
              const isAssignedToMe = (a.assignees?.some(u => u.name === user?.name || String(u.id) === String(user?._id) || String(u.id) === String(user?.id))) ||
                                     (a.assignedTo?.name === user?.name || String(a.assignedTo?.id) === String(user?._id) || String(a.assignedTo?.id) === String(user?.id)) ||
                                     (a.assigneeName === user?.name || String(a.assigneeId) === String(user?._id) || String(a.assigneeId) === String(user?.id));

              return (
                <div key={a.id || a._id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.status === 'pending' ? (
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                          isAssignedToMe 
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50 animate-pulse' 
                            : 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/50'
                        }`}>
                          {isAssignedToMe ? 'আপনার জন্য অ্যাসাইন করা হয়েছে (নতুন)' : 'রিপোর্টারের গ্রহণের অপেক্ষায়'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-lg border border-amber-200 dark:border-amber-800/50">
                          সেলফ অ্যাসাইনমেন্ট (অনুমোদনের অপেক্ষায়)
                        </span>
                      )}

                      {a.edition === 'online' && (
                        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                          🌐 অনলাইন ভার্সন
                        </span>
                      )}
                      {a.edition === 'print' && (
                        <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-lg border border-purple-200 dark:border-purple-800/50">
                          🗞️ প্রিন্ট ভার্সন
                        </span>
                      )}
                      {a.edition === 'both' && (
                        <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-800/50">
                          🔀 উভয় (Online + Print)
                        </span>
                      )}

                      {a.assignmentType && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-lg border border-purple-200 dark:border-purple-800/40">
                          <FileText size={12} />
                          {a.assignmentType}
                        </span>
                      )}
                      {(a.categories?.[0] || a.category) && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700">
                          <Tag size={12} />
                          {a.categories?.[0] || a.category}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {a.title}
                    </h3>

                    {a.instructions || a.description ? (
                      <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2">
                        {a.instructions || a.description}
                      </p>
                    ) : null}

                    {/* ─── Mini Track Management Forms (Matching Blueprint) ─── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                      {/* Online Track Form */}
                      {['online', 'both'].includes(a.edition) && (!user?.edition || ['online', 'both'].includes(user?.edition)) && (
                        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-900/10 space-y-3">
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block border-b border-emerald-200 dark:border-emerald-800/50 pb-1.5">
                            🌐 অনলাইন ডেস্ক ফর্ম (Online Track)
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="block text-[11px] font-medium text-gray-600 dark:text-slate-400 mb-1">হোমপেজ পজিশন</label>
                              <select
                                defaultValue={a.onlineTrack?.homepagePosition || ''}
                                onChange={(e) => updateOnlineTrack(a.id || a._id, { homepagePosition: e.target.value })}
                                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                <option value="">নির্বাচন করুন</option>
                                <option value="lead">Lead Story (লিড)</option>
                                <option value="top-5">Top 5 (শীর্ষ ৫)</option>
                                <option value="sidebar">Sidebar (সাইডবার)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-gray-600 dark:text-slate-400 mb-1">স্ট্যাটাস</label>
                              <select
                                defaultValue={a.onlineTrack?.status || 'pending'}
                                onChange={(e) => updateOnlineTrack(a.id || a._id, { status: e.target.value })}
                                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-emerald-700 dark:text-emerald-400"
                              >
                                <option value="pending">Pending</option>
                                <option value="review">Review</option>
                                <option value="approved">Approved</option>
                                <option value="revision">Revision</option>
                                <option value="published">Published</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Print Track Form */}
                      {['print', 'both'].includes(a.edition) && (!user?.edition || ['print', 'both'].includes(user?.edition)) && (
                        <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-900/10 space-y-3">
                          <span className="text-xs font-bold text-purple-800 dark:text-purple-300 block border-b border-purple-200 dark:border-purple-800/50 pb-1.5">
                            🗞️ প্রিন্ট ডেস্ক ফর্ম (Print Track)
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="block text-[11px] font-medium text-gray-600 dark:text-slate-400 mb-1">পেজ নম্বর</label>
                              <input
                                type="text"
                                placeholder="যেমন: পেজ ১, কলাম ২"
                                defaultValue={a.printTrack?.pageNumber || ''}
                                onBlur={(e) => updatePrintTrack(a.id || a._id, { pageNumber: e.target.value })}
                                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-gray-600 dark:text-slate-400 mb-1">স্ট্যাটাস</label>
                              <select
                                defaultValue={a.printTrack?.status || 'pending'}
                                onChange={(e) => updatePrintTrack(a.id || a._id, { status: e.target.value })}
                                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-purple-700 dark:text-purple-400"
                              >
                                <option value="pending">Pending</option>
                                <option value="review">Review</option>
                                <option value="approved">Approved</option>
                                <option value="revision">Revision</option>
                                <option value="sent_to_press">Sent to Press</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-6 flex-wrap text-xs text-gray-500 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-300">
                        <User size={14} className="text-blue-500" />
                        <span>
                          {a.assignees?.length > 0 
                            ? a.assignees.map(u => u.name).join(', ') 
                            : (a.assignedTo?.name || a.assigneeName || 'রিপোর্টার')}
                        </span>
                      </div>
                      {a.deadline && (
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-amber-500" />
                          <span>ডেডলাইন: {new Date(a.deadline).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0">
                    <button
                      disabled={processingId === (a.id || a._id)}
                      onClick={() => handleApprove(a.id || a._id)}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-2 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow ${
                        a.status === 'pending' && !isAssignedToMe 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      <Check size={16} />
                      <span>
                        {a.status === 'pending' 
                          ? (isAssignedToMe ? 'অ্যাসাইনমেন্ট গ্রহণ করুন' : 'সরাসরি গ্রহণ দেখান') 
                          : 'অনুমোদন দিন'}
                      </span>
                    </button>
                    <button
                      disabled={processingId === (a.id || a._id)}
                      onClick={() => handleReject(a.id || a._id)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 font-medium text-sm px-5 py-2.5 rounded-xl transition-all"
                    >
                      <X size={16} />
                      <span>{a.status === 'pending' && isAssignedToMe ? 'অপারগতা জানান' : 'বাতিল করুন'}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
