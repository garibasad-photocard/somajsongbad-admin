import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Plus, Check, X, User, Clock, Tag, FileText, Lightbulb, ShieldAlert, ArrowRight, Video } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import MediaFlowLogo from '../../components/common/MediaFlowLogo'
import { useWorkflow } from '../../context/WorkflowContext'

export default function StoryPitchBoard({ editionFilter }) {
  const { user } = useAuth()
  
  const { fetchAssignments } = useWorkflow()
  const [pitches, setPitches] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ 
    title: '', description: '', category: 'জাতীয়', proposedDeadline: '', 
    edition: editionFilter === 'multimedia' ? 'multimedia' : 'online',
    isMultimediaRequest: editionFilter === 'multimedia',
    multimediaContentType: 'video', multimediaPlatform: [],
    multimediaScriptNote: '', multimediaThumbnailNote: ''
  })
  const [editorNotes, setEditorNotes] = useState({})
  const [selectedEditions, setSelectedEditions] = useState({})
  const [trackParams, setTrackParams] = useState({})
  const [loading, setLoading] = useState(false)

  const fetchPitches = async () => {
    try {
      let url = '/story-pitches'
      if (editionFilter) {
        url += `?edition=${editionFilter}`
      }
      const res = await api.get(url)
      setPitches(res.data)
    } catch (err) {
      console.error('Failed to fetch pitches', err)
    }
  }

  useEffect(() => {
    fetchPitches()
  }, [editionFilter])

  const handleSubmitPitch = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.description) {
      alert('শিরোনাম এবং বিবরণ পূরণ করা আবশ্যক!')
      return
    }
    setLoading(true)
    try {
      await api.post('/story-pitches', formData)
      setIsModalOpen(false)
      setFormData({ 
        title: '', description: '', category: 'জাতীয়', proposedDeadline: '', 
        edition: editionFilter === 'multimedia' ? 'multimedia' : 'online',
        isMultimediaRequest: editionFilter === 'multimedia',
        multimediaContentType: 'video', multimediaPlatform: [],
        multimediaScriptNote: '', multimediaThumbnailNote: ''
      })
      await fetchPitches()
    } catch (err) {
      console.error('Failed to submit pitch', err)
      alert('পিচ জমা দিতে সমস্যা হয়েছে: ' + (err.response?.data?.message || err.message))
    }
    setLoading(false)
  }

  const handleApprove = async (id) => {
    setLoading(true)
    try {
      const note = editorNotes[id] || 'স্টোরি পিচ অনুমোদিত হয়েছে এবং অ্যাসাইনমেন্ট তৈরি করা হয়েছে।'
      const edition = selectedEditions[id] || 'online'
      const params = trackParams[id] || {}
      await api.post(`/story-pitches/${id}/approve`, { note, edition, ...params })
      setEditorNotes(prev => ({ ...prev, [id]: '' }))
      await fetchPitches()
      await fetchAssignments()
    } catch (err) {
      console.error('Approval failed', err)
      alert('অনুমোদন ব্যর্থ হয়েছে: ' + (err.response?.data?.message || err.message))
    }
    setLoading(false)
  }

  const handleReject = async (id) => {
    const note = editorNotes[id]
    if (!note) {
      alert('দয়া করে বাতিলের কারণ (Editor Note) উল্লেখ করুন!')
      return
    }
    setLoading(true)
    try {
      await api.post(`/story-pitches/${id}/reject`, { note })
      setEditorNotes(prev => ({ ...prev, [id]: '' }))
      await fetchPitches()
    } catch (err) {
      console.error('Rejection failed', err)
      alert('বাতিল করতে সমস্যা হয়েছে: ' + (err.response?.data?.message || err.message))
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (confirm('আপনি কি নিশ্চিত যে এই পিচটি মুছে ফেলতে চান?')) {
      try {
        await api.delete(`/story-pitches/${id}`)
        setPitches(pitches.filter(p => p._id !== id))
      } catch (err) {
        console.error('Delete failed', err)
      }
    }
  }

  const handleParamChange = (id, field, value) => {
    setTrackParams(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value }
    }))
  }

  const submittedPitches = pitches.filter(p => p.status === 'submitted')
  const approvedPitches = pitches.filter(p => p.status === 'approved')
  const rejectedPitches = pitches.filter(p => p.status === 'rejected')

  const isEditor = user && ['super_admin', 'managing_editor', 'admin', 'chief_editor', 'editor'].includes(user.role)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#f8fafc] dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
        <div>
          <div className="mb-3">
            <MediaFlowLogo variant="horizontal" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <span>💡</span> স্টোরি পিচ ও প্ল্যানিং বোর্ড
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 max-w-2xl">
            রিপোর্টাররা নতুন স্টোরির আইডিয়া পিচ করবেন এবং এডিটররা অনুমোদন দিলে তা স্বয়ংক্রিয়ভাবে 
            <span className="font-semibold text-amber-600 dark:text-amber-400"> ডুয়াল-ট্র্যাক অ্যাসাইনমেন্টে</span> রূপান্তরিত হবে।
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg shadow-amber-600/20"
        >
          <Plus size={18} />
          <span>নতুন স্টোরি পিচ করুন</span>
        </button>
      </div>

      {/* ─── Columns / Board View ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Submitted / Pending */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl">
            <h2 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <Lightbulb size={18} />
              <span>নতুন পিচ (অপেক্ষমান)</span>
            </h2>
            <span className="px-2.5 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold rounded-full">
              {submittedPitches.length}
            </span>
          </div>

          {submittedPitches.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 text-center text-sm text-gray-400 dark:text-slate-500 shadow-sm">
              কোনো অপেক্ষমান পিচ নেই
            </div>
          ) : (
            submittedPitches.map(p => {
              const currentEdition = selectedEditions[p._id] || p.edition || 'online'
              const pParams = trackParams[p._id] || {}

              return (
                <div key={p._id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-lg border border-gray-200 dark:border-slate-600">
                        {p.category}
                      </span>
                      {p.edition && (
                        <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-800/50 uppercase">
                          {p.edition}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-800/50">
                      ⏳ এডিটরের অপেক্ষায়
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-snug">{p.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-300 whitespace-pre-line">{p.description}</p>

                  <div className="flex flex-col gap-1.5 text-xs text-gray-500 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-300">
                      <User size={14} className="text-amber-500" />
                      <span>রিপোর্টার: {p.authorId?.name || 'স্টাফ রিপোর্টার'}</span>
                    </div>
                    {p.proposedDeadline && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-indigo-500" />
                        <span>প্রস্তাবিত ডেডলাইন: {new Date(p.proposedDeadline).toLocaleDateString('bn-BD')}</span>
                      </div>
                    )}
                  </div>

                  {p.isMultimediaRequest && (
                    <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-100 dark:border-orange-800/50 space-y-2 mt-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 dark:text-orange-400">
                        <Video size={14} /> মাল্টিমিডিয়া রিকুয়েস্ট
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-gray-500 dark:text-slate-400 block mb-0.5">ধরন:</span>
                          <span className="font-medium text-gray-800 dark:text-slate-200 uppercase bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-orange-100 dark:border-slate-700">{p.multimediaContentType}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-slate-400 block mb-0.5">প্লাটফর্ম:</span>
                          <div className="flex flex-wrap gap-1">
                            {p.multimediaPlatform?.map(plat => (
                              <span key={plat} className="font-medium text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded">{plat}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {p.multimediaScriptNote && (
                        <div>
                          <span className="text-[10px] text-gray-500 dark:text-slate-400 block mb-0.5">স্ক্রিপ্ট/নোট:</span>
                          <p className="text-[11px] text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-1.5 rounded border border-orange-100 dark:border-slate-700">{p.multimediaScriptNote}</p>
                        </div>
                      )}
                      {p.multimediaThumbnailNote && (
                        <div>
                          <span className="text-[10px] text-gray-500 dark:text-slate-400 block mb-0.5">থাম্বনেইল রেফারেন্স:</span>
                          <p className="text-[11px] text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-1.5 rounded border border-orange-100 dark:border-slate-700">{p.multimediaThumbnailNote}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Editor Action Panel with Dual Track Settings */}
                  {isEditor && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700 space-y-4 pt-3 mt-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 dark:text-slate-300 block">কোন এডিশনে যাবে? (Dual Track)</label>
                        <select
                          value={currentEdition}
                          onChange={(e) => setSelectedEditions({ ...selectedEditions, [p._id]: e.target.value })}
                          className="w-full text-xs border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg p-2 font-medium text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="online">🌐 অনলাইন ভার্সন</option>
                          <option value="print">🗞️ প্রিন্ট ভার্সন</option>
                          <option value="both">🔀 উভয় ভার্সন (Both)</option>
                        </select>
                      </div>

                      {/* Online Track Settings */}
                      {(currentEdition === 'online' || currentEdition === 'both') && (
                        <div className="space-y-2 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
                          <p className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                            <span>🌐</span> অনলাইন ট্র্যাক অপশন
                          </p>
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-gray-600 dark:text-slate-400 block">হোমপেজ পজিশন</label>
                            <input
                              type="text"
                              value={pParams.homepagePosition || ''}
                              onChange={(e) => handleParamChange(p._id, 'homepagePosition', e.target.value)}
                              placeholder="যেমন: লিড নিউজ ১, দ্বিতীয় কলাম..."
                              className="w-full text-xs border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-gray-600 dark:text-slate-400 block">SEO শিরোনাম</label>
                            <input
                              type="text"
                              value={pParams.seoTitle || ''}
                              onChange={(e) => handleParamChange(p._id, 'seoTitle', e.target.value)}
                              placeholder="সার্চ ইঞ্জিনের জন্য শিরোনাম..."
                              className="w-full text-xs border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* Print Track Settings */}
                      {(currentEdition === 'print' || currentEdition === 'both') && (
                        <div className="space-y-2 p-3 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/50">
                          <p className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                            <span>🗞️</span> প্রিন্ট ট্র্যাক অপশন
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-medium text-gray-600 dark:text-slate-400 block">পেজ নম্বর</label>
                              <input
                                type="text"
                                value={pParams.pageNumber || ''}
                                onChange={(e) => handleParamChange(p._id, 'pageNumber', e.target.value)}
                                placeholder="যেমন: প্রথম পাতা"
                                className="w-full text-xs border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-medium text-gray-600 dark:text-slate-400 block">কলাম সংখ্যা</label>
                              <input
                                type="text"
                                value={pParams.column || ''}
                                onChange={(e) => handleParamChange(p._id, 'column', e.target.value)}
                                placeholder="যেমন: ৩ কলাম"
                                className="w-full text-xs border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 dark:text-white"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-gray-600 dark:text-slate-400 block">শব্দ সংখ্যা (Word Limit)</label>
                            <input
                              type="number"
                              value={pParams.wordLimit || ''}
                              onChange={(e) => handleParamChange(p._id, 'wordLimit', e.target.value)}
                              placeholder="যেমন: 350"
                              className="w-full text-xs border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 dark:text-white"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 dark:text-slate-300 block">এডিটরের মন্তব্য / নির্দেশনা</label>
                        <textarea
                          value={editorNotes[p._id] || ''}
                          onChange={(e) => setEditorNotes({ ...editorNotes, [p._id]: e.target.value })}
                          placeholder="অ্যাসাইনমেন্ট তৈরি বা বাতিলের কারণ লিখুন..."
                          rows={2}
                          className="w-full text-xs border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          disabled={loading}
                          onClick={() => handleApprove(p._id)}
                          className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-2 rounded-lg transition-all shadow-sm"
                        >
                          <Check size={14} />
                          <span>অনুমোদন করুন</span>
                        </button>
                        <button
                          disabled={loading}
                          onClick={() => handleReject(p._id)}
                          className="flex items-center justify-center gap-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 text-rose-600 border border-rose-200 dark:border-rose-800/50 font-bold text-xs py-2 px-2 rounded-lg transition-all"
                        >
                          <X size={14} />
                          <span>বাতিল করুন</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Column 2: Approved / Converted to Assignment */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl">
            <h2 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Check size={18} />
              <span>অনুমোদিত ও অ্যাসাইনমেন্ট</span>
            </h2>
            <span className="px-2.5 py-0.5 bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-full">
              {approvedPitches.length}
            </span>
          </div>

          {approvedPitches.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 text-center text-sm text-gray-400 dark:text-slate-500 shadow-sm">
              কোনো অনুমোদিত পিচ নেই
            </div>
          ) : (
            approvedPitches.map(p => (
              <div key={p._id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all border-l-4 border-l-emerald-500">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-lg border border-gray-200 dark:border-slate-600">
                    {p.category}
                  </span>
                  <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                    ✅ অ্যাসাইনমেন্ট তৈরি হয়েছে
                  </span>
                </div>

                <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-snug">{p.title}</h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 whitespace-pre-line">{p.description}</p>

                {p.editorNote && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300 font-medium space-y-1">
                    <p className="font-bold">এডিটরের মন্তব্য:</p>
                    <p>{p.editorNote}</p>
                  </div>
                )}

                <div className="flex flex-col gap-1.5 text-xs text-gray-500 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-300">
                    <User size={14} className="text-emerald-500" />
                    <span>রিপোর্টার: {p.authorId?.name || 'স্টাফ রিপোর্টার'}</span>
                  </div>
                  {p.assignedAssignmentId && (
                    <Link
                      to={`/workflow/${p.assignedAssignmentId._id}`}
                      className="flex items-center justify-center gap-1 w-full mt-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                    >
                      <span>অ্যাসাইনমেন্টটি খুলুন</span>
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Column 3: Rejected / Cancelled */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-4 rounded-xl">
            <h2 className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <X size={18} />
              <span>বাতিলকৃত পিচ</span>
            </h2>
            <span className="px-2.5 py-0.5 bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold rounded-full">
              {rejectedPitches.length}
            </span>
          </div>

          {rejectedPitches.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 text-center text-sm text-gray-400 dark:text-slate-500 shadow-sm">
              কোনো বাতিলকৃত পিচ নেই
            </div>
          ) : (
            rejectedPitches.map(p => (
              <div key={p._id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all border-l-4 border-l-rose-500">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-lg border border-gray-200 dark:border-slate-600">
                    {p.category}
                  </span>
                  <span className="text-xs text-rose-700 dark:text-rose-300 font-bold bg-rose-50 dark:bg-rose-900/30 px-2.5 py-1 rounded-lg border border-rose-100 dark:border-rose-800/50">
                    ❌ বাতিল
                  </span>
                </div>

                <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-snug">{p.title}</h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 whitespace-pre-line">{p.description}</p>

                {p.editorNote && (
                  <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl border border-rose-100 dark:border-rose-800/50 text-xs text-rose-800 dark:text-rose-300 font-medium space-y-1">
                    <p className="font-bold">বাতিলের কারণ:</p>
                    <p>{p.editorNote}</p>
                  </div>
                )}

                <div className="flex flex-col gap-1.5 text-xs text-gray-500 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-300">
                    <User size={14} className="text-rose-500" />
                    <span>রিপোর্টার: {p.authorId?.name || 'স্টাফ রিপোর্টার'}</span>
                  </div>
                </div>

                {p.isMultimediaRequest && (
                  <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-100 dark:border-orange-800/50 space-y-2 mt-3 opacity-75">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 dark:text-orange-400">
                      <Video size={14} /> মাল্টিমিডিয়া রিকুয়েস্ট
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-gray-500 dark:text-slate-400 block mb-0.5">ধরন:</span>
                        <span className="font-medium text-gray-800 dark:text-slate-200 uppercase bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-orange-100 dark:border-slate-700">{p.multimediaContentType}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-slate-400 block mb-0.5">প্লাটফর্ম:</span>
                        <div className="flex flex-wrap gap-1">
                          {p.multimediaPlatform?.map(plat => (
                            <span key={plat} className="font-medium text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded">{plat}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>

      {/* ─── Modal Form: Create New Pitch ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 mt-10 mb-10">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>💡</span> নতুন স্টোরি পিচ করুন
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitPitch} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block">
                  স্টোরির নাম / শিরোনাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="স্টোরির মূল শিরোনাম বা বিষয় লিখুন..."
                  className="w-full text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block">
                  স্টোরির সারসংক্ষেপ ও এঙ্গেল <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="স্টোরিটি কেন গুরুত্বপূর্ণ, কী এঙ্গেল নিয়ে লিখবেন এবং কী কী তথ্য থাকবে তা বিস্তারিত লিখুন..."
                  className="w-full text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block">ক্যাটাগরি</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl p-3 font-medium text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="জাতীয়">জাতীয়</option>
                    <option value="রাজনীতি">রাজনীতি</option>
                    <option value="সারাদেশ">সারাদেশ</option>
                    <option value="আন্তর্জাতিক">আন্তর্জাতিক</option>
                    <option value="খেলা">খেলা</option>
                    <option value="বিনোদন">বিনোদন</option>
                    <option value="বাণিজ্য">বাণিজ্য</option>
                    <option value="মতামত">মতামত</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block">প্রস্তাবিত ডেডলাইন</label>
                  <input
                    type="date"
                    value={formData.proposedDeadline}
                    onChange={(e) => setFormData({ ...formData, proposedDeadline: e.target.value })}
                    className="w-full text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block">কোন ভার্সনের জন্য? <span className="text-rose-500">*</span></label>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="edition" value="online" checked={formData.edition === 'online'} onChange={(e) => setFormData({ ...formData, edition: e.target.value, isMultimediaRequest: false })} className="accent-amber-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">🌐 অনলাইন</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="edition" value="print" checked={formData.edition === 'print'} onChange={(e) => setFormData({ ...formData, edition: e.target.value, isMultimediaRequest: false })} className="accent-amber-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">🗞️ প্রিন্ট</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="edition" value="both" checked={formData.edition === 'both'} onChange={(e) => setFormData({ ...formData, edition: e.target.value, isMultimediaRequest: false })} className="accent-amber-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">🔀 অনলাইন + প্রিন্ট</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="edition" value="multimedia" checked={formData.edition === 'multimedia'} onChange={(e) => setFormData({ ...formData, edition: e.target.value, isMultimediaRequest: true })} className="accent-orange-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">🎥 মাল্টিমিডিয়া</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="edition" value="all" checked={formData.edition === 'all'} onChange={(e) => setFormData({ ...formData, edition: e.target.value, isMultimediaRequest: false })} className="accent-pink-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">✨ সব ভার্সন</span>
                  </label>
                </div>
              </div>

              {formData.isMultimediaRequest && (
                <div className="space-y-4 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800/50">
                  <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-bold mb-2">
                    <Video size={16} /> মাল্টিমিডিয়া রিকুয়েস্ট অপশন
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block">কনটেন্ট ধরন</label>
                      <select
                        value={formData.multimediaContentType}
                        onChange={(e) => setFormData({ ...formData, multimediaContentType: e.target.value })}
                        className="w-full text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="video">ভিডিও (Video)</option>
                        <option value="graphics">গ্রাফিক্স (Graphics)</option>
                        <option value="audio">অডিও (Audio/Podcast)</option>
                        <option value="animation">এনিমেশন (Animation)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block">কোথায় যাবে? (Platform)</label>
                      <div className="flex flex-wrap gap-2">
                        {['Facebook', 'YouTube', 'TikTok', 'Website'].map(p => (
                          <label key={p} className="flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-800 px-2 py-1 border border-gray-200 dark:border-slate-700 rounded-lg">
                            <input
                              type="checkbox"
                              checked={formData.multimediaPlatform.includes(p)}
                              onChange={(e) => {
                                const newP = e.target.checked 
                                  ? [...formData.multimediaPlatform, p] 
                                  : formData.multimediaPlatform.filter(i => i !== p)
                                setFormData({ ...formData, multimediaPlatform: newP })
                              }}
                              className="accent-orange-600 rounded text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-[11px] font-medium text-gray-700 dark:text-slate-300">{p}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block">স্ক্রিপ্ট বা কনটেন্ট নোট (যদি থাকে)</label>
                    <textarea
                      rows={2}
                      value={formData.multimediaScriptNote}
                      onChange={(e) => setFormData({ ...formData, multimediaScriptNote: e.target.value })}
                      placeholder="ভিডিও বা গ্রাফিক্সের জন্য কোনো স্ক্রিপ্ট বা নির্দেশিকা থাকলে লিখুন..."
                      className="w-full text-xs border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block">থাম্বনেইল বা ভিজ্যুয়াল রেফারেন্স নোট</label>
                    <input
                      type="text"
                      value={formData.multimediaThumbnailNote}
                      onChange={(e) => setFormData({ ...formData, multimediaThumbnailNote: e.target.value })}
                      placeholder="থাম্বনেইলে কী লেখা থাকবে বা কী ছবি যাবে..."
                      className="w-full text-xs border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold text-sm rounded-xl transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-600/20"
                >
                  {loading ? 'জমা হচ্ছে...' : 'পিচ সাবমিট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
