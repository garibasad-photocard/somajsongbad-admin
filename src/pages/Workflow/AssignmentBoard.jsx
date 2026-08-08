import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkflow } from '../../context/WorkflowContext'
import { useSettings } from '../../context/SettingsContext'
import {
  Plus, Clock, CheckCircle, FileText,
  ChevronRight, Filter, User, Sparkles, ClipboardList,
  Maximize2, Minimize2
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import SearchableSelect from '../../components/SearchableSelect'
import api from '../../services/api'

const getStatusConfig = (t) => ({
  pending:      { label: t.filterWaiting,       color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  self_pending: { label: t.filterNeedsApproval,  color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  self_approved:{ label: 'Approved',        color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-400' },
  self_rejected:{ label: 'Rejected',        color: 'bg-red-100 text-red-600',       dot: 'bg-red-300' },
  accepted:     { label: 'গৃহীত',           color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-400' },
  reporter_writing: { label: 'রিপোর্টার লিখছে',      color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
  writing:      { label: t.filterWriting,      color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
  reporter_submitted: { label: 'ডিপার্টমেন্টে জমা', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  submitted:    { label: t.filterSubmitted,      color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  department_review: { label: 'ডিপার্টমেন্ট রিভিউ', color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-400' },
  review:       { label: t.filterReview,     color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-400' },
  revision_required: { label: 'সংশোধন দরকার', color: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
  department_approved: { label: 'ডিপার্টমেন্ট অনুমোদিত', color: 'bg-teal-100 text-teal-700', dot: 'bg-teal-400' },
  nm_editing:   { label: 'NM এডিটিং', color: 'bg-cyan-100 text-cyan-700', dot: 'bg-cyan-400' },
  sent_to_proof: { label: 'প্রুফে', color: 'bg-pink-100 text-pink-700', dot: 'bg-pink-400' },
  proof_correction: { label: 'প্রুফ সংশোধন', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  proof_approved: { label: 'প্রুফ অনুমোদিত', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  final_submit: { label: 'সাবমিট', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  approved:     { label: t.filterApproved,       color: 'bg-green-100 text-green-700',   dot: 'bg-green-400' },
  revision:     { label: t.filterCorrection,     color: 'bg-red-100 text-red-700',       dot: 'bg-red-400' },
  published:    { label: t.filterPublished,       color: 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400',     dot: 'bg-gray-400' },
  rejected:     { label: 'Rejected',   color: 'bg-red-100 text-red-600',       dot: 'bg-red-300' },
  correction_needed: { label: 'কারেকশন দরকার', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
})

const PRINT_STAGE_LABELS = {
  assignment_created:      'অ্যাসাইনমেন্ট তৈরি',
  assigned_to_reporter:    'রিপোর্টারকে দেওয়া',
  reporter_working:        'রিপোর্টার লিখছে',
  reporter_submitted:      'ডিপার্টমেন্টে জমা',
  returned_to_creator:     'রিভিউতে ফেরত',
  department_review:       'ডিপার্টমেন্ট রিভিউ',
  revision_required:       'সংশোধন দরকার',
  department_approved:     'ডিপার্টমেন্ট অনুমোদিত',
  sent_to_news_management: 'NM ডেস্কে',
  sent_to_own_page:        'নিজ পাতায়',
  news_management_editing: 'NM এডিটিং',
  page_planning:           'পেজ প্ল্যানিং',
  sent_to_proof:           'প্রুফে',
  proof_correction:        'প্রুফ সংশোধন',
  proof_approved:          'প্রুফ অনুমোদিত',
  sent_to_page:            'পেজে পাঠানো',
  page_makeup:             'মেকআপ চলছে',
  executive_review:        'এক্সিকিউটিভ রিভিউ',
  makeup_correction:       'মেকআপ সংশোধন',
  ready_for_print:         'প্রিন্টের জন্য প্রস্তুত',
  printed:                 'ছাপা হয়েছে'
};


const PRIORITY_CONFIG = {
  high:   { label: 'জরুরি',   color: 'text-red-600 bg-red-50 border-red-200' },
  normal: { label: 'সাধারণ', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  low:    { label: 'কম',      color: 'text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700' },
}

function formatDeadline(dt) {
  if (!dt) return null
  const d = new Date(dt)
  const now = new Date()
  const diff = d - now
  const hrs = Math.floor(diff / 3600000)
  if (diff < 0) return { text: 'মেয়াদ শেষ', urgent: true }
  if (hrs < 2) return { text: `${Math.floor(diff / 60000)} মিনিট বাকি`, urgent: true }
  if (hrs < 24) return { text: `${hrs} ঘণ্টা বাকি`, urgent: hrs < 6 }
  return { text: `${Math.floor(hrs / 24)} দিন বাকি`, urgent: false }
}

// ── New Assignment Modal ──
export function NewAssignmentModal({ onClose, assignments = [], editionFilter = 'all' }) {
  const { createAssignment } = useWorkflow()
  const { categories, journalists, printPages } = useSettings()
  const [form, setForm] = useState({
    title: '', instructions: '',
    categories: [], priority: 'normal',
    deadline: '', assignees: [],
    assignmentType: '',
    edition: editionFilter === 'all' ? 'online' : editionFilter,
    printPage: '', printPosition: '',
    printEstimatedWords: '', printNotes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  
  const assignmentTypes = (() => {
    const stored = localStorage.getItem('cms_assignment_types')
    return stored ? JSON.parse(stored) : ['রিপোর্টিং', 'ফিচার', 'স্পেশাল স্টোরি', 'ফলোআপ', 'ইন্টারভিউ', 'ভিডিও স্টোরি', 'ইনভেস্টিগেশন']
  })()

  const [dbUsers, setDbUsers] = useState([])
  useEffect(() => {
    api.get('/users').then(r => setDbUsers(r.data)).catch(() => {})
  }, [])

  // Dragging State
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
      }
    }
    const handleMouseUp = () => {
      setIsDragging(false)
    }
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart])

  // Special Days Logic (Exact Original Options & Logic)
  const DEFAULT_SPECIAL_DAYS = [
    { id: 1, date: '2025-02-21', name: 'আন্তর্জাতিক মাতৃভাষা দিবস', type: 'জাতীয়', recurring: true, bg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300' },
    { id: 2, date: '2025-03-26', name: 'স্বাধীনতা দিবস', type: 'জাতীয়', recurring: true, bg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300' },
    { id: 3, date: '2025-12-16', name: 'বিজয় দিবস', type: 'জাতীয়', recurring: true, bg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300' },
    { id: 4, date: '2025-04-14', name: 'পহেলা বৈশাখ', type: 'সাংস্কৃতিক', recurring: true, bg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300' },
  ];
  const specialDaysAll = (() => {
    const stored = localStorage.getItem('cms_special_days');
    if (!stored) return DEFAULT_SPECIAL_DAYS;
    try { 
      const parsed = JSON.parse(stored);
      const bgs = ['bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300', 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300', 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300', 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300'];
      return parsed.map((item, i) => ({ ...item, bg: bgs[i % bgs.length] }));
    } catch { return DEFAULT_SPECIAL_DAYS }
  })()
  const deadlineDate = form.deadline ? new Date(form.deadline) : null;
  const activeSpecialDays = deadlineDate ? specialDaysAll.filter(sd => {
    const sdDate = new Date(sd.date);
    if (sd.recurring) {
      return sdDate.getMonth() === deadlineDate.getMonth() && sdDate.getDate() === deadlineDate.getDate();
    }
    return sdDate.getFullYear() === deadlineDate.getFullYear() && sdDate.getMonth() === deadlineDate.getMonth() && sdDate.getDate() === deadlineDate.getDate();
  }) : [];

  const schedule = (() => {
    try { return JSON.parse(localStorage.getItem('cms_shift_schedule') || '{}') } catch { return {} }
  })()
  const DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি']
  const dayName = DAYS[(form.deadline ? new Date(form.deadline) : new Date()).getDay()]

  const mergedJournalists = [
    ...journalists,
    ...dbUsers
      .filter(u => ['reporter', 'chief_reporter', 'sub_editor', 'desk_editor'].includes(u.role))
      .filter(u => !journalists.find(j => j.name === u.name))
      .map(u => ({ id: u._id, name: u.name, email: u.email, designation: u.designation || (u.role === 'reporter' ? 'রিপোর্টার' : u.role) }))
  ]

  const regularReporters = mergedJournalists.filter(j => schedule[j.name]?.[dayName] !== 'ছুটি')
  const holidayReporters = mergedJournalists.filter(j => schedule[j.name]?.[dayName] === 'ছুটি')

  const todayDate = new Date();
  const todayIsoDate = todayDate.toISOString().split('T')[0];
  const todayHolidays = (typeof specialDaysAll !== 'undefined' ? specialDaysAll : []).filter(sd => {
    const sdDate = new Date(sd.date);
    if (sd.recurring) {
      return sdDate.getMonth() === todayDate.getMonth() && sdDate.getDate() === todayDate.getDate();
    }
    return sd.date === todayIsoDate;
  });

  const regularOptions = regularReporters.map(j => ({ value: j.id.toString(), label: `${j.name} ${j.email ? `(${j.email})` : ''} — ${j.designation}` }))
  const holidayOptions = holidayReporters.map(j => ({ value: j.id.toString(), label: `[🏖️ ছুটি] ${j.name} ${j.email ? `(${j.email})` : ''} — ${j.designation}` }))

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const toggleCategory = (cat) => {
    setForm((p) => {
      const already = p.categories.includes(cat)
      if (already) return { ...p, categories: p.categories.filter(c => c !== cat) }
      if (p.categories.length >= 3) return p
      return { ...p, categories: [...p.categories, cat] }
    })
  }

  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.title || form.assignees.length === 0 || !form.deadline || form.categories.length === 0 || isSubmitting) return
    setIsSubmitting(true)
    
    const assignedUsers = form.assignees.map(idStr => {
      const j = mergedJournalists.find(x => x.id.toString() === idStr.toString());
      if (!j) return null;
      const isOvertime = holidayReporters.some(h => h.id.toString() === idStr.toString());
      return { id: j.id, name: j.name, designation: j.designation, isOvertime };
    }).filter(Boolean);

    try {
      await createAssignment({ 
        ...form, 
        assignees: assignedUsers,
        // Legacy fields for backward compatibility
        assignedTo: assignedUsers[0]
      })
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Assignment তৈরি করা যায়নি। লগইন আছেন কিনা নিশ্চিত করুন।')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6" onClick={onClose}>
      <div 
        style={{ transform: `translate(${position.x}px, ${position.y}px)`, resize: isMaximized ? 'none' : 'both', overflow: 'auto' }}
        className={`bg-[#f0f4f8] dark:bg-slate-950 rounded-2xl w-full shadow-2xl transition-shadow flex flex-col ${isMaximized ? 'h-full max-w-full !resize-none' : 'max-h-[92vh] max-w-6xl min-h-[500px] min-w-[320px]'}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div 
          className="flex items-center justify-between px-8 py-5 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex-shrink-0 cursor-move rounded-t-2xl"
          onMouseDown={(e) => {
            setIsDragging(true)
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
          }}
        >
          <div className="w-10"></div> {/* spacer for centering */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white pointer-events-none text-center flex-1">
            নতুন Assignment
          </h2>
          <div className="flex items-center gap-4 w-10 justify-end">
            <button onClick={() => setIsMaximized(!isMaximized)} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:text-slate-300 transition-colors">
              {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:text-slate-300 transition-colors">
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body - 2 Column Layout */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Left Sidebar Column (md:col-span-4) */}
            <div className="md:col-span-4 space-y-6">
              {/* Card 1: আজকের ছুটি */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5 mb-3 text-amber-700 dark:text-amber-500 font-bold text-base">
                  <span className="text-lg">🏖️</span>
                  <h3>আজকের ছুটি</h3>
                </div>
                {(holidayReporters.length === 0 && (!todayHolidays || todayHolidays.length === 0)) ? (
                  <p className="text-gray-600 dark:text-slate-400 text-sm font-medium">আজ কেউ ছুটিতে নেই</p>
                ) : (
                  <div className="space-y-1.5">
                    {todayHolidays && todayHolidays.map(h => (
                      <p key={`h-${h.id}`} className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        {h.name} ({h.type})
                      </p>
                    ))}
                    {holidayReporters.map(h => (
                      <p key={h.id} className="text-sm text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        {h.name} ({h.designation})
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 1.5: Workload Tracker */}
              {assignments.length > 0 && (
                <WorkloadTracker assignments={assignments} editionFilter={editionFilter} compact={true} />
              )}

              {/* Card 2: বিশেষ দিবস */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5 mb-6 text-indigo-700 dark:text-indigo-400 font-bold text-base">
                  <span className="text-lg">🗓️</span>
                  <h3>বিশেষ দিবস</h3>
                </div>
                <div className="space-y-5">
                  {specialDaysAll.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm ${item.bg || 'bg-purple-100 text-purple-600'}`}>
                        📅
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{item.date} ({item.type})</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Main Form Column (md:col-span-8) */}
            <div className="md:col-span-8 space-y-7">
              {/* Notice Banner */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800/80 flex items-center justify-between">
                <p className="text-base text-gray-700 dark:text-slate-300 font-medium">
                  রিপোর্টার অ্যাসাইনমেন্ট গ্রহণের পর স্টোরি যোগ করবেন।
                </p>
              </div>

              {/* ─── এডিশন নির্বাচন (Edition) ─── */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800/80 space-y-3">
                <label className="block text-sm font-bold text-gray-900 dark:text-white">
                  এডিশন (কোন ভার্সনে প্রকাশ হবে) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  {[
                    { id: 'online', label: '🌐 অনলাইন', desc: 'অনলাইন ডেস্ক' },
                    { id: 'print', label: '🗞️ প্রিন্ট', desc: 'প্রিন্ট ডেস্ক' },
                    { id: 'both', label: '🔀 অনলাইন + প্রিন্ট', desc: 'উভয় ডেস্ক' },
                    { id: 'multimedia', label: '🎥 মাল্টিমিডিয়া', desc: 'মাল্টিমিডিয়া ডেস্ক' },
                    { id: 'all', label: '✨ সব ভার্সন', desc: 'সকল ডেস্ক' },
                  ].map((ed) => (
                    <button
                      key={ed.id}
                      type="button"
                      onClick={() => set('edition', ed.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all text-center ${
                        form.edition === ed.id
                          ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-600 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-blue-400 font-medium'
                      }`}
                    >
                      <span className="text-sm mb-1">{ed.label}</span>
                      <span className="text-[11px] opacity-75 font-normal">{ed.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* শিরোনাম ও অ্যাসাইনমেন্ট ধরন */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800/80 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      শিরোনাম <span className="text-rose-500">*</span>
                    </label>
                    <textarea 
                      value={form.title} 
                      onChange={(e) => set('title', e.target.value)}
                      placeholder="নিউজের শিরোনাম লিখুন..."
                      rows={2}
                      className="w-full border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white resize-y" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      অ্যাসাইনমেন্ট ধরন (Assignment Type)
                    </label>
                    <select 
                      value={form.assignmentType} 
                      onChange={(e) => set('assignmentType', e.target.value)}
                      className="w-full border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
                    >
                      <option value="">সাধারণ (General)</option>
                      {assignmentTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                    নির্দেশনা
                  </label>
                  <textarea 
                    value={form.instructions} 
                    onChange={(e) => set('instructions', e.target.value)}
                    placeholder="রিপোর্টারকে কী কী করতে হবে..."
                    rows={4}
                    className="w-full border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white resize-y" 
                  />
                </div>
              </div>

              {/* ক্যাটাগরি */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800/80 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">
                    ক্যাটাগরি <span className="text-rose-500">*</span> <span className="text-gray-400 dark:text-slate-500 font-normal">(সর্বোচ্চ ৩টি)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {(() => {
                      const displayCategories = form.edition === 'print' && printPages 
                        ? printPages.map((p, i) => ({ id: `page-${i}`, name: p }))
                        : categories;
                      
                      return displayCategories.map((c) => {
                      const selected = form.categories.includes(c.name)
                      return (
                        <button key={c.id} onClick={() => toggleCategory(c.name)}
                          className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
                            selected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-blue-400'
                          }`}>
                          {c.name}
                        </button>
                      )
                    })})()}
                  </div>
                  {form.categories.length > 0 && (
                    <p className="text-xs font-semibold text-blue-600 mt-3">নির্বাচিত: {form.categories.join(', ')}</p>
                  )}
                </div>
              </div>

              {/* অগ্রাধিকার ও Deadline */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800/80 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">অগ্রাধিকার</label>
                    <select value={form.priority} onChange={(e) => set('priority', e.target.value)}
                      className="w-full border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white">
                      <option value="high">🔴 জরুরি</option>
                      <option value="normal">🔵 সাধারণ</option>
                      <option value="low">⚪ কম</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Deadline <span className="text-rose-500">*</span></label>
                    <input type="datetime-local" value={form.deadline} onChange={(e) => set('deadline', e.target.value)}
                      className="w-full border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white" />
                  </div>
                </div>

                {/* ── Special Days Notice Box ── */}
                <div className="border border-green-100 dark:border-green-900/30 rounded-2xl p-4 bg-green-50/50 dark:bg-green-900/10 min-h-[60px]">
                  <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-2">🎉 বিশেষ দিবস</p>
                  {!form.deadline ? (
                    <p className="text-xs text-green-600/70 dark:text-green-400/70 italic font-medium">দিবস দেখতে ডেডলাইন (তারিখ) সিলেক্ট করুন</p>
                  ) : activeSpecialDays.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {activeSpecialDays.map(sd => (
                        <span key={sd.id} className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300 font-bold shadow-sm">
                          {sd.name} ({sd.type})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-green-600/70 dark:text-green-400/70 italic font-medium">এই তারিখে কোনো বিশেষ দিবস নেই</p>
                  )}
                </div>
              </div>

              {/* ── Assignees (2 Column Layout) ── */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800/80 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Regular Assignees */}
                  <div>
                    <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">📝 এসাইন টু (নিয়মিত)</label>
                    <SearchableSelect 
                      isMulti
                      options={regularOptions}
                      value={form.assignees.filter(id => regularReporters.some(r => r.id.toString() === id))}
                      onChange={(vals) => {
                        const otherTabVals = form.assignees.filter(id => !regularReporters.some(r => r.id.toString() === id));
                        set('assignees', [...otherTabVals, ...vals]);
                      }}
                      placeholder="ইউজার বেছে নিন..."
                      className="w-full text-sm"
                      menuPlacement="top"
                      maxHeightClass="max-h-[360px]"
                    />
                    <p className="text-[11px] text-gray-500 font-medium mt-1.5">একাধিক ইউজার সিলেক্ট করতে পারবেন।</p>
                  </div>

                  {/* Overtime Assignees */}
                  <div>
                    <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">🏖️ ছুটি / ওভারটাইম</label>
                    <SearchableSelect 
                      isMulti
                      options={holidayOptions}
                      value={form.assignees.filter(id => holidayReporters.some(r => r.id.toString() === id))}
                      onChange={(vals) => {
                        const otherTabVals = form.assignees.filter(id => !holidayReporters.some(r => r.id.toString() === id));
                        set('assignees', [...otherTabVals, ...vals]);
                      }}
                      placeholder="ছুটিতে থাকা ইউজার বেছে নিন..."
                      className="w-full text-sm"
                      menuPlacement="top"
                      maxHeightClass="max-h-[360px]"
                    />
                    <p className="text-[11px] text-gray-500 font-medium mt-1.5">ছুটির দিনের জন্য ওভারটাইম অ্যাসাইন।</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex flex-col gap-3 rounded-b-2xl">
          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-xl px-4 py-3 font-medium">{error}</p>
          )}
          <div className="flex justify-end gap-4">
            <button onClick={onClose} className="text-sm font-bold text-gray-600 dark:text-slate-400 px-6 py-3 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              বাতিল
            </button>
            <button onClick={handleSubmit}
              disabled={!form.title || form.assignees.length === 0 || !form.deadline || form.categories.length === 0 || isSubmitting}
              className="text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-800 text-white px-8 py-3 rounded-xl transition-all shadow-sm hover:shadow">
              {isSubmitting ? 'প্রসেস হচ্ছে...' : 'Assignment দিন'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Self Assignment Modal ──
export function SelfAssignmentModal({ onClose, assignments = [], editionFilter = 'all' }) {
  const { createSelfAssignment } = useWorkflow()
  const { categories, journalists } = useSettings()
  const [form, setForm] = useState({
    title: '', instructions: '',
    categories: [], priority: 'normal',
    deadline: '', reporterId: '', assignmentType: '', edition: 'online'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [showOvertime, setShowOvertime] = useState(false)

  const assignmentTypes = (() => {
    const stored = localStorage.getItem('cms_assignment_types')
    return stored ? JSON.parse(stored) : ['রিপোর্টিং', 'ফিচার', 'স্পেশাল স্টোরি', 'ফলোআপ', 'ইন্টারভিউ', 'ভিডিও স্টোরি', 'ইনভেস্টিগেশন']
  })()

  // Dragging State
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
      }
    }
    const handleMouseUp = () => {
      setIsDragging(false)
    }
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart])

  // Special Days Logic (Exact Original Options & Logic)
  const DEFAULT_SPECIAL_DAYS = [
    { id: 1, date: '2025-02-21', name: 'আন্তর্জাতিক মাতৃভাষা দিবস', type: 'জাতীয়', recurring: true, bg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300' },
    { id: 2, date: '2025-03-26', name: 'স্বাধীনতা দিবস', type: 'জাতীয়', recurring: true, bg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300' },
    { id: 3, date: '2025-12-16', name: 'বিজয় দিবস', type: 'জাতীয়', recurring: true, bg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300' },
    { id: 4, date: '2025-04-14', name: 'পহেলা বৈশাখ', type: 'সাংস্কৃতিক', recurring: true, bg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300' },
  ];
  const specialDaysAll = (() => {
    const stored = localStorage.getItem('cms_special_days');
    if (!stored) return DEFAULT_SPECIAL_DAYS;
    try { 
      const parsed = JSON.parse(stored);
      const bgs = ['bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300', 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300', 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300', 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300'];
      return parsed.map((item, i) => ({ ...item, bg: bgs[i % bgs.length] }));
    } catch { return DEFAULT_SPECIAL_DAYS }
  })()

  const schedule = (() => {
    try { return JSON.parse(localStorage.getItem('cms_shift_schedule') || '{}') } catch { return {} }
  })()
  const DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি']
  const dayName = DAYS[(form.deadline ? new Date(form.deadline) : new Date()).getDay()]

  const regularReporters = journalists.filter(j => schedule[j.name]?.[dayName] !== 'ছুটি')
  const holidayReporters = journalists.filter(j => schedule[j.name]?.[dayName] === 'ছুটি')

  const todayDate = new Date();
  const todayIsoDate = todayDate.toISOString().split('T')[0];
  const todayHolidays = (typeof specialDaysAll !== 'undefined' ? specialDaysAll : []).filter(sd => {
    const sdDate = new Date(sd.date);
    if (sd.recurring) {
      return sdDate.getMonth() === todayDate.getMonth() && sdDate.getDate() === todayDate.getDate();
    }
    return sd.date === todayIsoDate;
  });

  const reporterOptions = [
    ...regularReporters.map(j => ({ value: j.id.toString(), label: `${j.name} — ${j.designation}` })),
    ...(showOvertime ? holidayReporters.map(j => ({ value: j.id.toString(), label: `[Overtime] ${j.name} — ${j.designation}` })) : [])
  ]

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const toggleCategory = (cat) => {
    setForm((p) => {
      const already = p.categories.includes(cat)
      if (already) return { ...p, categories: p.categories.filter(c => c !== cat) }
      if (p.categories.length >= 3) return p
      return { ...p, categories: [...p.categories, cat] }
    })
  }

  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.title || !form.reporterId || !form.deadline || form.categories.length === 0 || isSubmitting) return
    setIsSubmitting(true)
    const reporter = journalists.find((j) => j.id === Number(form.reporterId))
    setError('')
    try {
      await createSelfAssignment({
        ...form
      }, reporter)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Assignment তৈরি করা যায়নি।')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6" onClick={onClose}>
      <div 
        style={{ transform: `translate(${position.x}px, ${position.y}px)`, resize: isMaximized ? 'none' : 'both', overflow: 'auto' }}
        className={`bg-[#f0f4f8] dark:bg-slate-950 rounded-2xl w-full shadow-2xl transition-shadow flex flex-col ${isMaximized ? 'h-full max-w-full !resize-none' : 'max-h-[92vh] max-w-6xl min-h-[500px] min-w-[320px]'}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div 
          className="flex items-center justify-between px-8 py-5 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex-shrink-0 cursor-move rounded-t-2xl"
          onMouseDown={(e) => {
            setIsDragging(true)
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
          }}
        >
          <div className="w-10"></div> {/* spacer for centering */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white pointer-events-none text-center flex-1 flex items-center justify-center gap-3">
            <span className="text-purple-600 dark:text-purple-400">✨</span>
            Self Assignment
          </h2>
          <div className="flex items-center gap-4 w-10 justify-end">
            <button onClick={() => setIsMaximized(!isMaximized)} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:text-slate-300 transition-colors">
              {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:text-slate-300 transition-colors">
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body - 2 Column Layout */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Left Sidebar Column (md:col-span-4) */}
            <div className="md:col-span-4 space-y-6">
              {/* Card 1: আজকের ছুটি */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5 mb-3 text-amber-700 dark:text-amber-500 font-bold text-base">
                  <span className="text-lg">🏖️</span>
                  <h3>আজকের ছুটি</h3>
                </div>
                {(holidayReporters.length === 0 && (!todayHolidays || todayHolidays.length === 0)) ? (
                  <p className="text-gray-600 dark:text-slate-400 text-sm font-medium">আজ কেউ ছুটিতে নেই</p>
                ) : (
                  <div className="space-y-1.5">
                    {todayHolidays && todayHolidays.map(h => (
                      <p key={`h-${h.id}`} className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        {h.name} ({h.type})
                      </p>
                    ))}
                    {holidayReporters.map(h => (
                      <p key={h.id} className="text-sm text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        {h.name} ({h.designation})
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 1.5: Workload Tracker */}
              {assignments.length > 0 && (
                <WorkloadTracker assignments={assignments} editionFilter={editionFilter} compact={true} />
              )}

              {/* Card 2: বিশেষ দিবস */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5 mb-6 text-indigo-700 dark:text-indigo-400 font-bold text-base">
                  <span className="text-lg">🗓️</span>
                  <h3>বিশেষ দিবস</h3>
                </div>
                <div className="space-y-5">
                  {specialDaysAll.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm ${item.bg || 'bg-purple-100 text-purple-600'}`}>
                        📅
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{item.date} ({item.type})</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Main Form Column (md:col-span-8) */}
            <div className="md:col-span-8 space-y-7">
              {/* Notice Banner */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800/80 flex items-center justify-between">
                <p className="text-base text-purple-700 dark:text-purple-300 font-medium">
                  Self Assignment তৈরি করলে Assignment Editor-এর Approval লাগবে। Approved হলে লেখা শুরু করতে পারবেন।
                </p>
              </div>

              {/* রিপোর্টার নির্বাচন */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800/80 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                    রিপোর্টার <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect 
                    options={reporterOptions}
                    value={form.reporterId}
                    onChange={(val) => set('reporterId', val)}
                    placeholder="রিপোর্টার বেছে নিন..."
                    className="w-full text-sm"
                    maxHeightClass="max-h-[360px]"
                  />
                  {holidayReporters.length > 0 && (
                    <label className="flex items-center gap-2 mt-3 text-xs text-rose-600 dark:text-rose-400 font-semibold cursor-pointer">
                      <input type="checkbox" checked={showOvertime} onChange={e => setShowOvertime(e.target.checked)} className="rounded" />
                      ছুটিতে থাকা রিপোর্টারদের ওভারটাইম (Overtime) অ্যাসাইন করুন
                    </label>
                  )}
                </div>
              </div>

              {/* ─── এডিশন নির্বাচন (Edition) ─── */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800/80 space-y-3">
                <label className="block text-sm font-bold text-gray-900 dark:text-white">
                  এডিশন (কোন ভার্সনে প্রকাশ হবে) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3 pt-1">
                  {[
                    { id: 'online', label: '🌐 অনলাইন ভার্সন', desc: 'অনলাইন এডিটরের কিউতে যাবে' },
                    { id: 'print', label: '🗞️ প্রিন্ট ভার্সন', desc: 'প্রিন্ট এডিটরের কিউতে যাবে' },
                    { id: 'both', label: '🔀 উভয় (Online + Print)', desc: 'উভয় এডিটরের কিউতে যাবে' },
                  ].map((ed) => (
                    <button
                      key={ed.id}
                      type="button"
                      onClick={() => set('edition', ed.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all text-center ${
                        form.edition === ed.id
                          ? 'bg-purple-50/50 dark:bg-purple-900/20 border-purple-600 text-purple-600 dark:text-purple-400 shadow-sm font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-purple-400 font-medium'
                      }`}
                    >
                      <span className="text-sm mb-1">{ed.label}</span>
                      <span className="text-[11px] opacity-75 font-normal">{ed.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* স্টোরির শিরোনাম ও অ্যাসাইনমেন্ট ধরন */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800/80 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      স্টোরির শিরোনাম <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      value={form.title} 
                      onChange={(e) => set('title', e.target.value)}
                      placeholder="যে স্টোরিটি করতে চান..."
                      className="w-full border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      অ্যাসাইনমেন্ট ধরন
                    </label>
                    <select 
                      value={form.assignmentType} 
                      onChange={(e) => set('assignmentType', e.target.value)}
                      className="w-full border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 dark:text-white"
                    >
                      <option value="">সাধারণ (General)</option>
                      {assignmentTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                    স্টোরির বিবরণ
                  </label>
                  <textarea 
                    value={form.instructions} 
                    onChange={(e) => set('instructions', e.target.value)}
                    placeholder="কেন এই স্টোরি করতে চান, কী কী তথ্য থাকবে..."
                    rows={3}
                    className="w-full border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 dark:text-white resize-none" 
                  />
                </div>
              </div>

              {/* ক্যাটাগরি */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800/80 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">
                    ক্যাটাগরি <span className="text-rose-500">*</span> <span className="text-gray-400 dark:text-slate-500 font-normal">(সর্বোচ্চ ৩টি)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {categories.map((c) => {
                      const selected = form.categories.includes(c.name)
                      return (
                        <button key={c.id} onClick={() => toggleCategory(c.name)}
                          className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
                            selected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-purple-400'
                          }`}>
                          {c.name}
                        </button>
                      )
                    })}
                  </div>
                  {form.categories.length > 0 && (
                    <p className="text-xs font-semibold text-purple-600 mt-3">নির্বাচিত: {form.categories.join(', ')}</p>
                  )}
                </div>
              </div>

              {/* অগ্রাধিকার ও Deadline */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800/80 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">অগ্রাধিকার</label>
                    <select value={form.priority} onChange={(e) => set('priority', e.target.value)}
                      className="w-full border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 dark:text-white">
                      <option value="high">🔴 জরুরি</option>
                      <option value="normal">🔵 সাধারণ</option>
                      <option value="low">⚪ কম</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Deadline <span className="text-rose-500">*</span></label>
                    <input type="datetime-local" value={form.deadline} onChange={(e) => set('deadline', e.target.value)}
                      className="w-full border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 dark:text-white" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex flex-col gap-3 rounded-b-2xl">
          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-xl px-4 py-3 font-medium">{error}</p>
          )}
          <div className="flex justify-end gap-4">
            <button onClick={onClose} className="text-sm font-bold text-gray-600 dark:text-slate-400 px-6 py-3 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              বাতিল
            </button>
            <button onClick={handleSubmit}
              disabled={!form.title || !form.reporterId || !form.deadline || form.categories.length === 0}
              className="text-sm font-bold bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-slate-800 text-white px-8 py-3 rounded-xl transition-all shadow-sm hover:shadow">
              Approval-এ পাঠান
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Assignment Card ──
function AssignmentCard({ assignment, t }) {
  const navigate = useNavigate()
  const deadline = formatDeadline(assignment.deadline)
  const statusConfig = getStatusConfig(t)
  const status = statusConfig[assignment.status] || statusConfig.pending
  const priority = PRIORITY_CONFIG[assignment.priority] || PRIORITY_CONFIG.normal
  const isSelf = assignment.type === 'self'

  const handleDragStart = (e) => {
    e.dataTransfer.setData('assignmentId', assignment.id || assignment._id)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => navigate(`/workflow/${assignment.id || assignment._id}`)}
      className={`bg-white dark:bg-[#1e293b] border rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden flex flex-col gap-3 ${
        isSelf ? 'border-purple-200 dark:border-purple-900/50 hover:border-purple-400 dark:hover:border-purple-500' : 'border-gray-200 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-500'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-slate-400 tracking-wider flex-wrap">
          {isSelf && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30">
              <Sparkles size={10} /> SELF
            </span>
          )}
          {assignment.edition === 'online' && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[10px]">
              🌐 অনলাইন
            </span>
          )}
          {assignment.edition === 'print' && (
            <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 text-[10px]">
              🗞️ প্রিন্ট
            </span>
          )}
          {assignment.edition === 'both' && (
            <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 text-[10px]">
              🔀 অনলাইন + প্রিন্ট
            </span>
          )}
          {assignment.edition === 'multimedia' && (
            <span className="px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50 text-[10px]">
              🎥 মাল্টিমিডিয়া
            </span>
          )}
          {assignment.edition === 'all' && (
            <span className="px-1.5 py-0.5 rounded bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/50 text-[10px]">
              ✨ সব ভার্সন
            </span>
          )}
          <span>{assignment.categories?.[0]?.toUpperCase() || 'GENERAL'}</span>
          {assignment.assignmentType && (
            <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-slate-700 text-[10px]">
              {assignment.assignmentType}
            </span>
          )}
        </div>
        {deadline && (
          <div className={`flex items-center gap-1 text-[10px] font-medium ${deadline.urgent ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded' : 'text-gray-500 dark:text-slate-400'}`}>
            <Clock size={10} />
            {deadline.text}
          </div>
        )}
      </div>

      <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug line-clamp-3 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {assignment.title}
      </h4>

      {/* ─── Dual Track Status Box (matching blueprint) ─── */}
      {['both', 'online', 'print', 'multimedia', 'all'].includes(assignment.edition) && (
        <div className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-gray-200 dark:border-slate-700/80 text-[11px] space-y-1 my-1">
          {['online', 'both', 'all'].includes(assignment.edition) && (
            <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-medium">
              <span>🌐 অনলাইন:</span>
              <span className="font-bold">
                {assignment.onlineTrack?.status === 'published' ? '✅ পাবলিশড' : assignment.onlineTrack?.status === 'approved' ? '✅ অ্যাপ্রুভড' : assignment.onlineTrack?.status === 'review' ? '⏳ রিভিউতে আছে' : '⏳ পেন্ডিং'}
                {assignment.onlineTrack?.editorName ? ` (${assignment.onlineTrack.editorName})` : ''}
              </span>
            </div>
          )}
          {['print', 'both', 'all'].includes(assignment.edition) && (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-purple-800 dark:text-purple-300 font-medium">
                <span>🗞️ প্রিন্ট:</span>
                <span className="font-bold">
                  {assignment.printTrack?.workflowStage ? `🔹 ${PRINT_STAGE_LABELS[assignment.printTrack.workflowStage] || assignment.printTrack.workflowStage}` : assignment.printTrack?.status === 'sent_to_press' ? '✅ প্রেসে পাঠানো' : assignment.printTrack?.status === 'approved' ? '✅ অ্যাপ্রুভড' : assignment.printTrack?.status === 'review' ? '⏳ রিভিউতে আছে' : '⏳ পেন্ডিং'}
                  {assignment.printTrack?.editorName ? ` (${assignment.printTrack.editorName})` : ''}
                </span>
              </div>
              {assignment.printTrack?.pageNumber && (
                <div className="flex justify-end text-xs font-bold text-purple-700 dark:text-purple-400">
                  <span>পাতা: {assignment.printTrack.pageNumber}</span>
                </div>
              )}
            </div>
          )}
          {['multimedia', 'all'].includes(assignment.edition) && (
            <div className="flex items-center justify-between text-orange-800 dark:text-orange-300 font-medium">
              <span>🎥 মাল্টিমিডিয়া:</span>
              <span className="font-bold">
                {assignment.multimediaTrack?.status === 'published' ? '✅ পাবলিশড' : assignment.multimediaTrack?.status === 'approved' ? '✅ অ্যাপ্রুভড' : assignment.multimediaTrack?.status === 'in_production' ? '🎬 প্রোডাকশনে' : assignment.multimediaTrack?.status === 'review' ? '⏳ রিভিউতে আছে' : '⏳ পেন্ডিং'}
                {assignment.multimediaTrack?.contentType ? ` · ${assignment.multimediaTrack.contentType}` : ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Component Submission Tracking */}
      {assignment.articleData && assignment.articleData.submissionTracking && (
        <div className="flex gap-2 mt-1 flex-wrap">
          <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${assignment.articleData.submissionTracking.text?.isSubmitted ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}>
            📝 {assignment.articleData.submissionTracking.text?.isSubmitted 
                  ? `টেক্সট: ${new Date(assignment.articleData.submissionTracking.text.submittedAt).toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit'})}`
                  : 'টেক্সট: পেন্ডিং'}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${assignment.articleData.submissionTracking.media?.isSubmitted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}>
            📸 {assignment.articleData.submissionTracking.media?.isSubmitted 
                  ? `ছবি: ${new Date(assignment.articleData.submissionTracking.media.submittedAt).toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit'})}`
                  : 'ছবি: পেন্ডিং'}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50 dark:border-slate-800/50">
        <div className="flex flex-col gap-1.5 overflow-hidden">
          <div className="flex flex-col gap-1 text-[11px] text-gray-600 dark:text-slate-400 font-medium">
            {assignment.assignees?.length > 0 ? (
              assignment.assignees.map((u, idx) => (
                <div key={idx} className="flex items-center gap-1.5 truncate">
                  <User size={12} className="text-blue-500 flex-shrink-0" />
                  <span className="truncate">{u.name}</span>
                  {u.taskStatus && (() => {
                    const SC = { pending: { color: 'bg-yellow-400', label: 'অপেক্ষমাণ' }, accepted: { color: 'bg-blue-400', label: 'গৃহীত' }, writing: { color: 'bg-purple-400', label: 'লিখছেন' }, submitted: { color: 'bg-orange-400', label: 'জমা দেওয়া' }, review: { color: 'bg-indigo-400', label: 'রিভিউ' }, approved: { color: 'bg-green-400', label: 'অনুমোদিত' }, revision: { color: 'bg-red-400', label: 'সংশোধন' } };
                    const s = SC[u.taskStatus];
                    return s ? <span className={`w-2 h-2 rounded-full ${s.color}`} title={s.label} /> : null;
                  })()}
                </div>
              ))
            ) : (
              <div className="flex items-center gap-1 truncate">
                <User size={12} className="text-blue-500 flex-shrink-0" />
                <span>{assignment.assignedTo?.name || 'Unassigned'}</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-1.5 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 dark:group-hover:bg-slate-700 dark:group-hover:text-blue-400 rounded-lg transition-colors flex-shrink-0 ml-1">
          <ChevronRight size={14} />
        </div>
      </div>

      {/* Priority Line Indicator (Left side) */}
      <div className={`absolute top-0 left-0 w-1 h-full ${assignment.priority === 'high' ? 'bg-red-500' : assignment.priority === 'low' ? 'bg-gray-300 dark:bg-slate-600' : 'bg-blue-400'}`} />
    </div>
  )
}

// ── Smart Follow Up Alerts ──
function SmartFollowUpAlerts() {
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/trending/local')
      .then(res => {
        if (res.data && res.data.trending) setTrends(res.data.trending)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || trends.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 shadow-sm mb-6 animate-fadeIn">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={18} className="text-rose-600 dark:text-rose-400" />
        <h3 className="text-sm font-black text-rose-900 dark:text-rose-300">Smart Alerts: ফলো-আপ সাজেশন</h3>
        <span className="text-[10px] bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded-full font-bold ml-2">High Traffic</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trends.map(t => (
          <div key={t._id} className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 border border-white/50 dark:border-slate-700 hover:shadow-md transition-all group flex items-start gap-3">
            {t.featuredImage && (
              <img src={t.featuredImage.startsWith('http') ? t.featuredImage : `http://localhost:5001${t.featuredImage}`} alt="" className="w-12 h-12 rounded object-cover shrink-0" />
            )}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 mb-1 group-hover:text-rose-600 transition-colors">{t.title}</h4>
              <button className="text-[10px] font-black text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 flex items-center gap-1">
                <Plus size={10} /> ফলো-আপ অ্যাসাইন করুন
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Global Workload Tracker ──
function WorkloadTracker({ assignments, editionFilter, compact = false }) {
  const [selectedReporter, setSelectedReporter] = useState(null)

  // Group assignments by reporter
  const reporterLoad = {}
  assignments.forEach(a => {
    // Only count active assignments
    if (['published', 'rejected', 'self_rejected', 'approved'].includes(a.status)) return
    const rName = a.assigneeName || 'স্টাফ রিপোর্টার'
    if (!reporterLoad[rName]) reporterLoad[rName] = { count: 0, highPriority: 0, tasks: [] }
    reporterLoad[rName].count += 1
    if (a.priority === 'high') reporterLoad[rName].highPriority += 1
    reporterLoad[rName].tasks.push(a)
  })

  const loadData = Object.entries(reporterLoad).sort((a, b) => b[1].count - a[1].count)

  if (loadData.length === 0) return null

  const deskName = editionFilter === 'print' ? 'প্রিন্ট ডেস্ক' : editionFilter === 'online' ? 'অনলাইন ডেস্ক' : editionFilter === 'multimedia' ? 'মাল্টিমিডিয়া ডেস্ক' : 'সকল ডেস্ক'

  return (
    <>
      <div className={`bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 animate-fadeIn relative z-10 ${compact ? 'mb-0' : 'mb-6'}`}>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <User size={18} className="text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">ওয়ার্কলোড ট্র্যাকার</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{deskName}</span>
        </div>
        <div className={`grid ${compact ? 'grid-cols-2 gap-2' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3'}`}>
          {loadData.map(([name, data]) => (
            <div 
              key={name} 
              onClick={() => setSelectedReporter({ name, data })}
              className="group relative flex flex-col bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700/50 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md transition-all cursor-pointer"
            >
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate mb-1" title={name}>{name}</span>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400 leading-none">{data.count}</span>
                {data.highPriority > 0 && (
                  <span className="text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">
                    {data.highPriority} জরুরি
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popup Modal for Reporter's Assignments */}
      {selectedReporter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedReporter(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 font-black">
                  {selectedReporter.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedReporter.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedReporter.data.count} টি অ্যাক্টিভ টাস্ক</p>
                </div>
              </div>
              <button onClick={() => setSelectedReporter(null)} className="text-slate-400 hover:text-rose-500 transition-colors">✕</button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <ul className="space-y-3">
                {selectedReporter.data.tasks.map((t, idx) => (
                  <li key={t._id || idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">{idx + 1}</span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t.title}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">{t.category || 'সাধারণ'}</span>
                          {t.priority === 'high' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">জরুরি</span>}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Main Page ──
export default function AssignmentBoard({ defaultFilter = 'all', editionFilter = 'all' }) {
  const { assignments, updateStatus } = useWorkflow()
  const { printEditions } = useSettings()
  const { t } = useLanguage()
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState(defaultFilter)
  const [filterType, setFilterType] = useState('all')
  const [viewMode, setViewMode] = useState('board') // 'board' or 'list'
  const [printEditionFilter, setPrintEditionFilter] = useState('all')

  const editionAssignments = assignments.filter(a => {
    if (editionFilter === 'online' && !['online', 'both', 'all'].includes(a.edition)) return false;
    if (editionFilter === 'print' && !['print', 'both', 'all'].includes(a.edition)) return false;
    if (editionFilter === 'multimedia' && !['multimedia', 'all'].includes(a.edition)) return false;
    if (editionFilter === 'print' && !['print', 'both', 'all'].includes(a.edition)) return false;
    if (editionFilter === 'multimedia' && !['multimedia', 'all'].includes(a.edition)) return false;
    
    if (editionFilter === 'print' || editionFilter === 'all') {
      if (printEditionFilter !== 'all') {
         if (a.printEdition?.editions?.length > 0) {
           if (!a.printEdition.editions.includes(printEditionFilter)) return false;
         } else if (printEditionFilter !== 'প্রথম সংস্করণ') {
           return false;
         }
      }
    }
    return true;
  });

  useEffect(() => {
    setFilterStatus(defaultFilter)
  }, [defaultFilter])
  const filtered = editionAssignments.filter((a) => {
    if (filterStatus === 'rejected') {
      if (!['self_rejected', 'rejected'].includes(a.status)) return false
    } else if (filterStatus !== 'all' && a.status !== filterStatus) {
      return false
    }
    if (filterType !== 'all' && a.type !== filterType) return false
    return true
  })

  const selfPendingCount = editionAssignments.filter(a => a.status === 'self_pending').length

  const counts = {
    all:      editionAssignments.length,
    self_pending: editionAssignments.filter(a => a.status === 'self_pending').length,
    pending:  editionAssignments.filter(a => a.status === 'pending').length,
    writing:  editionAssignments.filter((a) => ['accepted', 'writing', 'reporter_writing'].includes(a.status)).length,
    submitted: editionAssignments.filter(a => ['submitted', 'reporter_submitted'].includes(a.status)).length,
    review:   editionAssignments.filter(a => ['review', 'department_review'].includes(a.status)).length,
    approved: editionAssignments.filter((a) => ['approved', 'proof_approved', 'final_submit'].includes(a.status)).length,
    revision: editionAssignments.filter(a => ['revision', 'revision_required', 'correction_needed'].includes(a.status)).length,
    published: editionAssignments.filter(a => a.status === 'published').length,
    rejected: editionAssignments.filter(a => ['self_rejected', 'rejected'].includes(a.status)).length,
    self:     editionAssignments.filter((a) => a.type === 'self').length,
  }

  const getOnlineColumns = () => [
    { id: 'pending', label: 'অ্যাসাইনমেন্ট তৈরি', statuses: ['pending', 'assignment_created', 'assigned_to_reporter'], color: 'bg-yellow-500' },
    { id: 'writing', label: 'রিপোর্টার কাজ করছেন', statuses: ['writing', 'reporter_working', 'accepted', 'self_pending'], color: 'bg-blue-600' },
    { id: 'submitted', label: 'রিপোর্টার সাবমিট', statuses: ['submitted', 'reporter_submitted'], color: 'bg-indigo-500' },
    { id: 'review', label: 'ডিপার্টমেন্ট রিভিউ', statuses: ['review', 'department_review'], color: 'bg-purple-500' },
    { id: 'nm_editing', label: 'NM ডেস্কে', statuses: ['department_approved', 'nm_editing', 'news_management_editing'], color: 'bg-cyan-500' },
    { id: 'proof', label: 'প্রুফ', statuses: ['sent_to_proof', 'proof_correction'], color: 'bg-pink-500' },
    { id: 'correction', label: 'সংশোধন', statuses: ['revision', 'correction_needed', 'revision_required'], color: 'bg-red-500' },
    { id: 'published', label: 'প্রকাশিত', statuses: ['published'], color: 'bg-teal-500' },
    { id: 'rejected', label: 'বাতিল/রিজেক্টেড', statuses: ['rejected', 'self_rejected', 'rejected_by_reporter'], color: 'bg-rose-600' },
  ];

  const getPrintColumns = () => [
    { id: 'pending', label: 'অ্যাসাইনড', statuses: ['pending', 'assignment_created', 'assigned_to_reporter'], color: 'bg-yellow-500' },
    { id: 'writing', label: 'লেখা হচ্ছে', statuses: ['writing', 'reporter_working', 'self_pending'], color: 'bg-blue-500' },
    { id: 'submitted', label: 'ডিপার্টমেন্টে জমা', statuses: ['submitted', 'reporter_submitted'], color: 'bg-indigo-500' },
    { id: 'review', label: 'ডিপার্টমেন্ট রিভিউ', statuses: ['review', 'department_review', 'returned_to_creator'], color: 'bg-purple-500' },
    { id: 'correction', label: 'সংশোধন', statuses: ['revision', 'correction_needed', 'revision_required', 'proof_correction', 'makeup_correction'], color: 'bg-red-500' },
    { id: 'nm_editing', label: 'NM ডেস্কে', statuses: ['department_approved', 'sent_to_news_management', 'news_management_editing'], color: 'bg-cyan-500' },
    { id: 'page_planning', label: 'পেজ প্ল্যানিং', statuses: ['sent_to_own_page', 'page_planning'], color: 'bg-orange-500' },
    { id: 'proof', label: 'প্রুফ', statuses: ['sent_to_proof', 'proof_approved'], color: 'bg-pink-500' },
    { id: 'page_makeup', label: 'পেজ মেকআপ', statuses: ['sent_to_page', 'page_makeup', 'executive_review'], color: 'bg-blue-600' },
    { id: 'ready_for_print', label: 'প্রিন্ট রেডি', statuses: ['ready_for_print', 'approved'], color: 'bg-green-500' },
    { id: 'printed', label: 'ছাপা হয়েছে', statuses: ['printed', 'published'], color: 'bg-teal-500' },
    { id: 'rejected', label: 'বাতিল/রিজেক্টেড', statuses: ['rejected', 'self_rejected'], color: 'bg-rose-600' },
  ];

  const columns = editionFilter === 'print' ? getPrintColumns() : getOnlineColumns();

  return (
    <div className="bg-gray-50 dark:bg-[#0f172a] text-gray-800 dark:text-slate-300 min-h-[calc(100vh-4rem)] p-4 -m-4 font-sans space-y-6 transition-colors duration-200">

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardList size={20} className="text-blue-600 dark:text-blue-500" />
            {t.assignmentBoard} {editionFilter === 'online' ? ' — 🌐 অনলাইন ভার্সন' : editionFilter === 'print' ? ' — 🗞️ প্রিন্ট ভার্সন' : ''}
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t.manageWorkflow}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-200 dark:bg-slate-800 p-1 rounded-lg">
            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400'}`}>List</button>
            <button onClick={() => setViewMode('board')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === 'board' ? 'bg-white dark:bg-slate-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400'}`}>Board</button>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg">
            <Plus size={16} /> {t.newAssignment}
          </button>
        </div>
      </div>

      {editionFilter === 'online' && <SmartFollowUpAlerts />}
      <WorkloadTracker assignments={editionAssignments} editionFilter={editionFilter} />

      {/* Stats - Matched to Dashboard style */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { id: 'all',       label: t.filterAll,            value: counts.all,      color: 'bg-gray-100 dark:bg-slate-800', textCard: 'text-gray-600 dark:text-slate-400', countCard: 'text-gray-800 dark:text-white' },
          { id: 'pending',   label: t.filterWaiting,        value: counts.pending,  color: 'bg-gray-100 dark:bg-slate-800', textCard: 'text-yellow-600 dark:text-yellow-400', countCard: 'text-gray-800 dark:text-white' },
          { id: 'writing',   label: t.filterWriting,        value: counts.writing,  color: 'bg-gray-100 dark:bg-slate-800', textCard: 'text-purple-600 dark:text-purple-400', countCard: 'text-gray-800 dark:text-white' },
          { id: 'submitted', label: t.filterSubmitted,      value: counts.submitted, color: 'bg-gray-100 dark:bg-slate-800', textCard: 'text-blue-600 dark:text-blue-400', countCard: 'text-gray-800 dark:text-white' },
          { id: 'review',    label: t.filterReview,         value: counts.review,   color: 'bg-gray-100 dark:bg-slate-800', textCard: 'text-indigo-600 dark:text-indigo-400', countCard: 'text-gray-800 dark:text-white' },
          { id: 'approved',  label: t.filterApproved,       value: counts.approved, color: 'bg-gray-100 dark:bg-slate-800', textCard: 'text-green-600 dark:text-green-400', countCard: 'text-gray-800 dark:text-white' },
          { id: 'revision',  label: t.filterCorrection,     value: counts.revision, color: 'bg-gray-100 dark:bg-slate-800', textCard: 'text-red-600 dark:text-red-400', countCard: 'text-gray-800 dark:text-white' },
          { id: 'published', label: t.filterPublished,      value: counts.published, color: 'bg-gray-100 dark:bg-slate-800', textCard: 'text-teal-600 dark:text-teal-400', countCard: 'text-gray-800 dark:text-white' },
          { id: 'rejected',  label: 'বাতিল/রিজেক্টেড',      value: counts.rejected, color: 'bg-gray-100 dark:bg-slate-800', textCard: 'text-red-600 dark:text-red-400', countCard: 'text-gray-800 dark:text-white' },
        ].map((s) => (
          <div key={s.label} 
               onClick={() => setFilterStatus(s.id)}
               className={`${s.color} rounded-xl p-3 border ${filterStatus === s.id ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900/50 shadow-md scale-[1.02]' : 'border-slate-700/50 hover:border-blue-300 dark:hover:border-slate-600 hover:shadow-md'} shadow-sm flex flex-col justify-center items-center text-center cursor-pointer transition-all`}>
            <p className={`text-2xl font-bold ${s.countCard} mb-0.5`}>{s.value}</p>
            <p className={`text-[11px] font-semibold ${s.textCard} uppercase tracking-wide`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white dark:bg-[#1e293b] p-3 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <Filter size={14} className="text-gray-400 dark:text-slate-500 mr-1" />
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all',          label: t.filterAll },
              { value: 'pending',      label: t.filterWaiting },
              { value: 'writing',      label: t.filterWriting },
              { value: 'submitted',    label: t.filterSubmitted },
              { value: 'review',       label: t.filterReview },
              { value: 'approved',     label: t.filterApproved },
              { value: 'revision',     label: t.filterCorrection },
              { value: 'published',    label: t.filterPublished },
              { value: 'rejected',     label: 'বাতিল/রিজেক্টেড' },
            ].map((f) => (
              <button key={f.value} onClick={() => setFilterStatus(f.value)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  filterStatus === f.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          { (editionFilter === 'print' || editionFilter === 'all') && (
            <select value={printEditionFilter} onChange={(e) => setPrintEditionFilter(e.target.value)}
              className="text-xs border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium">
              <option value="all">সব প্রিন্ট এডিশন</option>
              {printEditions?.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          )}
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="text-xs border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium">
            <option value="all">{t.allTypes}</option>
            <option value="assigned">Editor Assigned</option>
          </select>
        </div>
      </div>

      {/* Kanban Board OR List View */}
      {viewMode === 'board' ? (
        <div className="flex gap-4 items-start pb-10 overflow-x-auto min-h-[60vh] snap-x snap-mandatory scroll-smooth hide-scrollbar px-1">
          {columns.map((col) => {
            const colAssignments = filtered.filter(a => col.statuses.includes(a.status))
            
            const handleDrop = (e) => {
              e.preventDefault()
              const assignmentId = e.dataTransfer.getData('assignmentId')
              if (assignmentId) {
                // Determine the primary status for this column
                const newStatus = col.statuses[0]
                if (newStatus === 'rejected' || newStatus === 'self_rejected') {
                  const reason = window.prompt("রিজেক্ট করার কারণ লিখুন (বাধ্যতামূলক):")
                  if (!reason) {
                    alert("কারণ না জানালে রিজেক্ট করা যাবে না।")
                    return
                  }
                  updateStatus(assignmentId, newStatus, reason)
                } else {
                  updateStatus(assignmentId, newStatus, 'Moved from board')
                }
              }
            }
            
            return (
              <div 
                key={col.id} 
                className="flex flex-col gap-3 shrink-0 w-[85vw] sm:w-[300px] md:w-auto md:min-w-[280px] bg-gray-100 dark:bg-slate-900/50 p-3 rounded-2xl snap-center md:snap-align-none"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
              <div className="flex items-center justify-between px-1 pb-2 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.color}`} />
                  <h3 className="font-semibold text-sm text-gray-800 dark:text-slate-200">{col.label}</h3>
                </div>
                <span className="text-xs font-bold text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {colAssignments.length}
                </span>
              </div>
              
                <div className="flex flex-col gap-3 min-h-[300px]">
                  {colAssignments.map((a) => (
                    <AssignmentCard key={a.id || a._id} assignment={a} t={t} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden min-h-[60vh]">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Assignee</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filtered.map(a => (
                <tr key={a.id || a._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => window.location.href = `/workflow/${a.id || a._id}`}>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{a.title}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-400">{a.assigneeName || 'Unassigned'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-400">
                    <span className="px-2 py-1 text-[11px] font-medium rounded bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-slate-700">
                      {a.assignmentType || 'সাধারণ'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-400">{a.priority}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-400">{a.deadline ? new Date(a.deadline).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No assignments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <NewAssignmentModal onClose={() => setShowModal(false)} assignments={editionAssignments} editionFilter={editionFilter} />}
    </div>
  )
}
