import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter, User, CheckCircle, Clock, Link2, ExternalLink, X, Bookmark } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'

export default function EditorialCalendar() {
  const { user } = useAuth()
  const { journalists, categories } = useSettings()

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()) // 0-11
  const [events, setEvents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('')
  const [reporterFilter, setReporterFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Modals & Selection states
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [linkingAssignmentId, setLinkingAssignmentId] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)

  // New Event Form State
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('রাজনীতি')
  const [assignedReporter, setAssignedReporter] = useState('')
  const [status, setStatus] = useState('planned')
  const [isHoliday, setIsHoliday] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  const monthNamesBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ]

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
      const params = new URLSearchParams()
      params.append('month', monthStr)
      if (categoryFilter) params.append('category', categoryFilter)
      if (reporterFilter) params.append('reporterId', reporterFilter)
      if (statusFilter) params.append('status', statusFilter)

      const [evRes, assRes] = await Promise.all([
        api.get(`/calendar?${params.toString()}`),
        api.get('/workflow') // get assignments for linking
      ])
      setEvents(evRes.data)
      setAssignments(assRes.data || [])
    } catch (err) {
      console.error('Failed to fetch calendar events', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [currentYear, currentMonth, categoryFilter, reporterFilter, statusFilter])

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    if (!title || !date) return
    try {
      setSubmitLoading(true)
      let reporterName = 'নিজস্ব প্রতিবেদক'
      if (assignedReporter) {
        const matched = journalists.find(j => (j.id || j._id) === assignedReporter)
        if (matched) reporterName = matched.name
      }

      const payload = {
        title,
        date,
        description,
        category,
        assignedReporter: assignedReporter || undefined,
        assignedReporterName: reporterName,
        status,
        isHoliday
      }

      const res = await api.post('/calendar', payload)
      setEvents([...events, res.data])
      setShowAddModal(false)
      setTitle('')
      setDescription('')
      setIsHoliday(false)
    } catch (err) {
      console.error('Failed to create event', err)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleLinkAssignment = async (e) => {
    e.preventDefault()
    if (!selectedEvent || !linkingAssignmentId) return
    try {
      setLinkLoading(true)
      const res = await api.put(`/calendar/${selectedEvent._id}/link-assignment`, {
        assignmentId: linkingAssignmentId
      })
      setEvents(events.map(ev => ev._id === selectedEvent._id ? res.data : ev))
      setSelectedEvent(res.data)
      alert('অ্যাসাইনমেন্ট সফলভাবে লিংক করা হয়েছে!')
    } catch (err) {
      console.error('Failed to link assignment', err)
    } finally {
      setLinkLoading(false)
    }
  }

  const handleStatusChange = async (evId, newStatus) => {
    try {
      const res = await api.put(`/calendar/${evId}/status`, { status: newStatus })
      setEvents(events.map(ev => ev._id === evId ? res.data : ev))
      if (selectedEvent?._id === evId) setSelectedEvent(res.data)
    } catch (err) {
      console.error('Failed to update event status', err)
    }
  }

  // Generate calendar days
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay() // 0 is Sunday, 6 is Saturday

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  
  // We want Saturday to be index 0 (Bangladesh week start: Sat-Fri)
  // getDay(): Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
  // Shift so Sat=0, Sun=1, ... Fri=6
  const startOffset = (firstDay + 1) % 7

  const daysArray = []
  for (let i = 0; i < startOffset; i++) {
    daysArray.push(null) // blank spaces before first day
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i)
  }

  // Color mapping for categories
  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'রাজনীতি': return 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
      case 'বাণিজ্য': return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
      case 'খেলাধুলা': return 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
      case 'বিনোদন': return 'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800'
      case 'জাতীয়': return 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
      default: return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in pb-20">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-violet-900 via-purple-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-purple-500/30">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
            <CalendarIcon size={16} />
            <span>নিউজরুম ইভেন্ট ও সংবাদ পরিকল্পনা</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">এডিটরিয়াল ক্যালেন্ডার</h1>
          <p className="text-sm text-purple-200 max-w-2xl">
            মাসিক ইভেন্ট, জাতীয় কর্মসূচি এবং অ্যাসাইনমেন্ট প্ল্যানিং বোর্ড। ইভেন্টের তারিখ দেখে অগ্রিম সংবাদ পরিকল্পনা করুন এবং সরাসরি অ্যাসাইনমেন্ট লিংক করুন।
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-pink-500/30"
          >
            <Plus size={16} />
            <span>➕ নতুন ইভেন্ট তৈরি</span>
          </button>
        </div>
      </div>

      {/* Navigation & Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
        
        {/* Month Navigation */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-gray-600 dark:text-slate-300"
              title="পূর্ববর্তী মাস"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 font-black text-base text-purple-700 dark:text-purple-400 min-w-[140px] text-center">
              {monthNamesBn[currentMonth]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-gray-600 dark:text-slate-300"
              title="পরবর্তী মাস"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <Filter size={16} className="text-gray-400 flex-shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-36 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
            >
              <option value="">সব ক্যাটাগরি</option>
              {categories.map((c) => (
                <option key={c.id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <User size={16} className="text-gray-400 flex-shrink-0" />
            <select
              value={reporterFilter}
              onChange={(e) => setReporterFilter(e.target.value)}
              className="w-full sm:w-44 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
            >
              <option value="">সব রিপোর্টার</option>
              {journalists.map((j) => (
                <option key={j.id || j.name} value={j.id || j._id}>{j.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <Bookmark size={16} className="text-gray-400 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-36 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
            >
              <option value="">সব স্ট্যাটাস</option>
              <option value="planned">পরিকল্পিত (Planned)</option>
              <option value="confirmed">নিশ্চিত (Confirmed)</option>
              <option value="completed">সম্পন্ন (Completed)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Monthly Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Weekday Headers (Saturday to Friday) */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-center text-xs font-bold text-gray-500 dark:text-slate-400 py-3 uppercase tracking-wider">
          <div>শনিবার</div>
          <div>রবিবার</div>
          <div>সোমবার</div>
          <div>মঙ্গলবার</div>
          <div>বুধবার</div>
          <div>বৃহস্পতিবার</div>
          <div>শুক্রবার</div>
        </div>

        {/* Days Grid */}
        {loading ? (
          <div className="p-24 text-center text-gray-500 font-medium">ক্যালেন্ডার ইভেন্ট লোড হচ্ছে...</div>
        ) : (
          <div className="grid grid-cols-7 auto-rows-[minmax(130px,_auto)] divide-x divide-y divide-gray-200 dark:divide-slate-800">
            {daysArray.map((day, index) => {
              if (day === null) {
                return <div key={`blank-${index}`} className="bg-gray-50/50 dark:bg-slate-900/30 pointer-events-none" />
              }

              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayEvents = events.filter(ev => ev.date === dateStr)
              const isToday = dateStr === new Date().toISOString().split('T')[0]

              return (
                <div key={day} className={`p-2 transition-colors hover:bg-gray-50/50 dark:hover:bg-slate-800/30 flex flex-col justify-between overflow-hidden ${
                  isToday ? 'bg-purple-50/40 dark:bg-purple-950/20' : ''
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-700 dark:text-slate-200'
                    }`}>
                      {day}
                    </span>
                    <button
                      onClick={() => { setDate(dateStr); setShowAddModal(true); }}
                      className="opacity-0 hover:opacity-100 focus:opacity-100 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-gray-400 hover:text-gray-600 transition-all text-[10px]"
                      title="এই তারিখে ইভেন্ট যোগ করুন"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                    {dayEvents.map(ev => (
                      <div
                        key={ev._id}
                        onClick={() => { setSelectedEvent(ev); setLinkingAssignmentId(ev.relatedAssignmentId?._id || ''); }}
                        className={`p-1.5 rounded-xl border text-[11px] font-bold cursor-pointer hover:shadow-md transition-all line-clamp-2 ${ev.isHoliday ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800' : getCategoryColor(ev.category)}`}
                        title={ev.title}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[9px] font-extrabold uppercase opacity-80 flex items-center gap-1">
                            {ev.isHoliday ? <span className="text-red-600 dark:text-red-400">🏖️ ছুটি</span> : ev.category}
                          </span>
                          {ev.relatedAssignmentId && <Link2 size={10} className="text-purple-600 dark:text-purple-400" title="অ্যাসাইনমেন্ট লিংক করা আছে" />}
                        </div>
                        <p className="leading-snug truncate">{ev.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected Event Detail & Assignment Linking Panel */}
      {selectedEvent && (
        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-purple-500/30 shadow-2xl relative space-y-6 animate-fade-in">
          <button
            onClick={() => setSelectedEvent(null)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all"
          >
            <X size={18} />
          </button>

          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              {selectedEvent.isHoliday && <span className="px-2.5 py-1 bg-red-600 text-white rounded-lg flex items-center gap-1">🏖️ ছুটির দিন</span>}
              {!selectedEvent.isHoliday && <span className="px-2.5 py-1 bg-purple-600 text-white rounded-lg">{selectedEvent.category}</span>}
              <span className="text-purple-300 bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-lg">
                তারিখ: {selectedEvent.date}
              </span>
              <span className={`px-2.5 py-1 rounded-lg border text-xs uppercase font-extrabold ${
                selectedEvent.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' :
                selectedEvent.status === 'confirmed' ? 'bg-blue-500/20 border-blue-500 text-blue-400' :
                'bg-amber-500/20 border-amber-500 text-amber-400'
              }`}>
                {selectedEvent.status}
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight pt-1">{selectedEvent.title}</h2>
            <p className="text-sm text-slate-300 leading-relaxed pt-1">{selectedEvent.description || 'কোনো বর্ণনা দেওয়া নেই।'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
            
            {/* Left: Quick Status & Reporter info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                <User size={16} className="text-purple-400" />
                <span>অ্যাসাইনড রিপোর্টার: <strong>{selectedEvent.assignedReporter?.name || selectedEvent.assignedReporterName || 'নিজস্ব প্রতিবেদক'}</strong></span>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase">ইভেন্ট স্ট্যাটাস আপডেট করুন</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedEvent._id, 'planned')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedEvent.status === 'planned' ? 'bg-amber-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    পরিকল্পিত
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedEvent._id, 'confirmed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedEvent.status === 'confirmed' ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    নিশ্চিত
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedEvent._id, 'completed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedEvent.status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    সম্পন্ন
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Assignment Linking Pannel */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-purple-400 uppercase flex items-center gap-1.5">
                  <Link2 size={14} />
                  <span>অ্যাসাইনমেন্ট লিঙ্কিং (Link Assignment)</span>
                </label>
                {selectedEvent.relatedAssignmentId && (
                  <Link
                    to={`/workflow/${selectedEvent.relatedAssignmentId._id}`}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-all"
                  >
                    <span>অ্যাসাইনমেন্ট দেখুন</span>
                    <ExternalLink size={12} />
                  </Link>
                )}
              </div>

              <form onSubmit={handleLinkAssignment} className="space-y-3">
                <select
                  value={linkingAssignmentId}
                  onChange={(e) => setLinkingAssignmentId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- একটি অ্যাসাইনমেন্ট সিলেক্ট করুন --</option>
                  {assignments.map(ass => (
                    <option key={ass._id} value={ass._id}>
                      {ass.title} ({ass.status})
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={linkLoading || !linkingAssignmentId}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-purple-600/20"
                >
                  <Link2 size={14} />
                  <span>🔗 অ্যাসাইনমেন্ট লিংক করুন</span>
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl p-6 space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarIcon size={20} className="text-purple-600" />
                <span>নতুন ক্যালেন্ডার ইভেন্ট তৈরি করুন</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">ইভেন্ট শিরোনাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বাজেট অধিবেশন কাভারেজ..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">ক্যাটাগরি</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isHoliday"
                  checked={isHoliday}
                  onChange={(e) => setIsHoliday(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-slate-700 dark:border-gray-600"
                />
                <label htmlFor="isHoliday" className="text-sm font-bold text-gray-700 dark:text-slate-300 cursor-pointer">এটি একটি ছুটির দিন (Mark as Holiday)</label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">বরাদ্দকৃত রিপোর্টার (Assigned Reporter)</label>
                <select
                  value={assignedReporter}
                  onChange={(e) => setAssignedReporter(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                >
                  <option value="">-- সিলেক্ট করুন (অথবা নিজস্ব প্রতিবেদক) --</option>
                  {journalists.map((j) => (
                    <option key={j.id || j.name} value={j.id || j._id}>{j.name} ({j.designation})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">বর্ণনা / কাভারেজ পরিকল্পনা</label>
                <textarea
                  rows="3"
                  placeholder="ইভেন্টের বিস্তারিত কাভারেজ পরিকল্পনা বা নির্দেশনা লিখুন..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold text-sm rounded-xl transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2"
                >
                  {submitLoading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
