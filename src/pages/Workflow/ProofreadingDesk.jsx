import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, X, FileText, User, Clock, Tag, ExternalLink, ShieldCheck, AlertCircle, Users } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import MediaFlowLogo from '../../components/common/MediaFlowLogo'

export default function ProofreadingDesk({ editionFilter }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [articles, setArticles] = useState([])
  const [activeTab, setActiveTab] = useState('proofreader')
  const [editorNotes, setEditorNotes] = useState({})
  const [processingId, setProcessingId] = useState(null)
  
  const isProofreaderOrAbove = ['reporter', 'sub_editor', 'editor', 'chief_editor'].includes(user?.role)

  // Assign Modal States
  const [users, setUsers] = useState([])
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignArticle, setAssignArticle] = useState(null)
  const [assignData, setAssignData] = useState({ assigneeId: '', pageNumber: '', colSpan: '', note: '' })

  const fetchArticles = async () => {
    try {
      const url = editionFilter ? `/articles?edition=${editionFilter}` : '/articles'
      const res = await api.get(url)
      setArticles(res.data)
    } catch (err) {
      console.error('Failed to fetch articles for editorial desk', err)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users')
      setUsers(res.data)
    } catch (err) {
      console.error('Failed to fetch users', err)
    }
  }

  useEffect(() => {
    fetchArticles()
    fetchUsers()
  }, [])

  const handleApprove = async (id, stage) => {
    setProcessingId(id)
    try {
      const note = editorNotes[id] || ''
      await api.post(`/articles/${id}/approve`, { stage, note })
      // Clear note
      setEditorNotes(prev => ({ ...prev, [id]: '' }))
      await fetchArticles()
    } catch (err) {
      console.error('Approval failed', err)
      alert('অনুমোদন ব্যর্থ হয়েছে: ' + (err.response?.data?.message || err.message))
    }
    setProcessingId(null)
  }

  const handleReject = async (id) => {
    const note = editorNotes[id]
    if (!note) {
      alert('দয়া করে রিজেক্ট বা সংশোধনের কারণ (Editor Note) উল্লেখ করুন!')
      return
    }
    setProcessingId(id)
    try {
      await api.post(`/articles/${id}/reject`, { note })
      setEditorNotes(prev => ({ ...prev, [id]: '' }))
      await fetchArticles()
    } catch (err) {
      console.error('Rejection failed', err)
      alert('রিজেক্ট ব্যর্থ হয়েছে: ' + (err.response?.data?.message || err.message))
    }
    setProcessingId(null)
  }

  const openAssignModal = (article) => {
    setAssignArticle(article)
    setAssignData({ assigneeId: '', pageNumber: '', colSpan: '', note: '' })
    setAssignModalOpen(true)
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!assignData.assigneeId) {
      alert('দয়া করে একজন এডিটর নির্বাচন করুন!')
      return
    }
    setProcessingId(assignArticle._id)
    try {
      await api.post(`/articles/${assignArticle._id}/assign-editor`, assignData)
      setAssignModalOpen(false)
      await fetchArticles()
      alert('সফলভাবে অ্যাসাইন করা হয়েছে!')
    } catch (err) {
      console.error('Assign failed', err)
      alert('অ্যাসাইন ব্যর্থ হয়েছে: ' + (err.response?.data?.message || err.message))
    }
    setProcessingId(null)
  }

  const queues = useMemo(() => {
    const subEditorQueue = articles.filter(a => a.editorialStatus === 'submitted')
    const proofreaderQueue = articles.filter(a => a.editorialStatus === 'proofreading')
    const seniorQueue = articles.filter(a => a.editorialStatus === 'proofread' || a.editorialStatus === 'senior_review')
    const chiefQueue = articles.filter(a => a.editorialStatus === 'chief_review')
    const publishedQueue = articles.filter(a => a.editorialStatus === 'published' || a.status === 'published')
    const rejectedQueue = articles.filter(a => a.editorialStatus === 'rejected')

    return {
      sub_editor: subEditorQueue,
      proofreader: proofreaderQueue,
      senior_editor: seniorQueue,
      chief_editor: chiefQueue,
      published: publishedQueue,
      rejected: rejectedQueue
    }
  }, [articles])

  const displayedArticles = queues[activeTab] || []

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#f8fafc] dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
        <div>
          <div className="mb-3">
            <MediaFlowLogo variant="horizontal" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <span>🔍</span> প্রুফ রিডিং ডেস্ক
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 max-w-2xl">
            সাব-এডিটরদের এডিট করা নিউজগুলো এখানে প্রুফ রিডাররা চেক করেন। 
            <span className="font-semibold text-pink-600 dark:text-pink-400"> প্রুফ ডান হলে তা সরাসরি সিনিয়র এডিটরের কাছে চলে যায়।</span>
          </p>
        </div>
      </div>

      {/* ─── Tabs / Desk Categories ─── */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
        <button
          onClick={() => setActiveTab('proofreader')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTab === 'proofreader'
              ? 'bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-600/20'
              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-pink-400'
          }`}
        >
          <p className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'proofreader' ? 'text-pink-100' : 'text-gray-400 dark:text-slate-500'}`}>
            অপেক্ষমান (Pending)
          </p>
          <h3 className="text-sm font-bold mt-1">প্রুফ রিডার কিউ</h3>
          <span className={`inline-block mt-2 px-2.5 py-0.5 text-xs font-bold rounded-full ${
            activeTab === 'proofreader' ? 'bg-white text-pink-600' : 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
          }`}>
            {queues.proofreader.length}টি অপেক্ষায়
          </span>
        </button>

        <button
          onClick={() => setActiveTab('senior_editor')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTab === 'senior_editor'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-indigo-400'
          }`}
        >
          <p className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'senior_editor' ? 'text-indigo-100' : 'text-gray-400 dark:text-slate-500'}`}>
            সম্পন্ন (Completed)
          </p>
          <h3 className="text-sm font-bold mt-1">প্রুফ সম্পন্ন হয়েছে</h3>
          <span className={`inline-block mt-2 px-2.5 py-0.5 text-xs font-bold rounded-full ${
            activeTab === 'senior_editor' ? 'bg-white text-indigo-600' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
          }`}>
            {queues.senior_editor.length}টি
          </span>
        </button>
      </div>

      {/* ─── Article List in Selected Queue ─── */}
      <div className="space-y-4">
        {displayedArticles.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-16 text-center shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              এই কিউতে কোনো আর্টিকেল অপেক্ষায় নেই
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
              বর্তমানে আপনার ডেস্কে যাচাই বা অনুমোদনের জন্য নতুন কোনো নিউজ জমা পড়েনি।
            </p>
          </div>
        ) : (
          displayedArticles.map((a) => (
            <div key={a._id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 justify-between">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 text-xs font-bold rounded-lg">
                    {a.category || 'সাধারণ'}
                  </span>
                  {a.editorialStatus === 'submitted' && (
                    <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-xs font-bold rounded-lg">
                      ⏳ সাব-এডিটরের অপেক্ষায়
                    </span>
                  )}
                  {a.editorialStatus === 'proofreading' && (
                    <span className="px-3 py-1 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/50 text-xs font-bold rounded-lg">
                      ⏳ প্রুফ রিডারের অপেক্ষায়
                    </span>
                  )}
                  {a.editorialStatus === 'proofread' && (
                    <span className="px-3 py-1 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/50 text-xs font-bold rounded-lg">
                      ✅ প্রুফ দেখা সম্পন্ন
                    </span>
                  )}
                  {a.editorialStatus === 'senior_review' && (
                    <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 text-xs font-bold rounded-lg">
                      ⏳ সিনিয়র এডিটরের অপেক্ষায়
                    </span>
                  )}
                  {a.editorialStatus === 'chief_review' && (
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 text-xs font-bold rounded-lg">
                      ⏳ চিফ এডিটরের অপেক্ষায়
                    </span>
                  )}
                  {(a.editorialStatus === 'published' || a.status === 'published') && (
                    <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-xs font-bold rounded-lg">
                      ✅ প্রকাশিত
                    </span>
                  )}
                  {a.editorialStatus === 'rejected' && (
                    <span className="px-3 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 text-xs font-bold rounded-lg">
                      ❌ সংশোধন প্রয়োজন
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">
                  {a.title}
                </h2>

                {a.synopsis && (
                  <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2">
                    {a.synopsis}
                  </p>
                )}

                <div className="flex items-center gap-6 flex-wrap text-xs text-gray-500 dark:text-slate-400 pt-1 border-t border-gray-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-300">
                    <User size={14} className="text-indigo-500" />
                    <span>রিপোর্টার/লেখক: {a.authorId?.name || a.byline || 'স্টাফ রিপোর্টার'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-500" />
                    <span>জমা: {new Date(a.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {a.editorialStage?.lastStageNote && (
                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                      <FileText size={14} />
                      <span>মন্তব্য: {a.editorialStage.lastStageNote}</span>
                    </div>
                  )}
                  {a.printEdition?.pageNumber && (
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-800/50">
                      <FileText size={14} />
                      <span>পাতা: {a.printEdition.pageNumber} ({a.printEdition.colSpan} কলাম)</span>
                    </div>
                  )}
                  {a.editorialStage?.subEditorId && (
                    <div className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400 font-semibold bg-pink-50 dark:bg-pink-900/20 px-2.5 py-1 rounded-lg border border-pink-100 dark:border-pink-800/50">
                      <User size={14} />
                      <span>অ্যাসাইন করা হয়েছে: {users.find(u => u._id === a.editorialStage.subEditorId)?.name || 'Editor'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Area & Notes Form */}
              <div className="flex flex-col gap-3 justify-between w-full md:w-80 border-t md:border-t-0 pt-4 md:pt-0 md:border-l md:pl-6 border-gray-200 dark:border-slate-700">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">এডিটরের মন্তব্য / নির্দেশনা (Editor Note)</label>
                  <textarea
                    value={editorNotes[a._id] || ''}
                    onChange={(e) => setEditorNotes({ ...editorNotes, [a._id]: e.target.value })}
                    placeholder="সংশোধনের কারণ বা পরবর্তী ডেস্কের জন্য নোট লিখুন..."
                    rows={3}
                    className="w-full text-xs border border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    to={`/print/articles/edit/${a._id}`}
                    className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all shadow-sm"
                  >
                    <ExternalLink size={14} />
                    <span>নিউজ খুলে এডিট করুন</span>
                  </Link>

                  <button
                    onClick={() => openAssignModal(a)}
                    className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 font-bold text-xs rounded-xl transition-all"
                  >
                    <Users size={14} />
                    <span>নির্দিষ্ট কাউকে অ্যাসাইন করুন</span>
                  </button>

                  {activeTab === 'proofreader' && isProofreaderOrAbove && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled={processingId === a._id}
                        onClick={() => handleApprove(a._id, 'proofreading')}
                        className="flex items-center justify-center gap-1 py-2 px-3 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                      >
                        <Check size={14} />
                        <span>প্রুফ ডান (সিনিয়র এডিটর)</span>
                      </button>
                      <button
                        disabled={processingId === a._id}
                        onClick={() => handleReject(a._id)}
                        className="flex items-center justify-center gap-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 text-rose-600 border border-rose-200 dark:border-rose-800/50 font-bold text-xs rounded-xl transition-all"
                      >
                        <X size={14} />
                        <span>সংশোধনে ফেরত</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Assign Modal */}
      {assignModalOpen && assignArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-700">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="text-blue-500" size={20} />
                নির্দিষ্ট কাউকে অ্যাসাইন করুন
              </h3>
              <button onClick={() => setAssignModalOpen(false)} className="text-gray-400 hover:text-red-500">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">এডিটর / সাব-এডিটর নির্বাচন করুন *</label>
                <select
                  required
                  value={assignData.assigneeId}
                  onChange={e => setAssignData({...assignData, assigneeId: e.target.value})}
                  className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white"
                >
                  <option value="">নির্বাচন করুন</option>
                  {users.filter(u => ['editor', 'chief_editor', 'sub_editor'].includes(u.role)).map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">কোন পেজে যাবে?</label>
                  <select
                    value={assignData.pageNumber}
                    onChange={e => setAssignData({...assignData, pageNumber: e.target.value})}
                    className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white"
                  >
                    <option value="">নির্ধারিত নয়</option>
                    <option value="প্রথম পাতা">প্রথম পাতা</option>
                    <option value="শেষ পাতা">শেষ পাতা</option>
                    <option value="২য় পাতা">২য় পাতা</option>
                    <option value="৩য় পাতা">৩য় পাতা</option>
                    <option value="সম্পাদকীয়">সম্পাদকীয়</option>
                    <option value="খেলাধুলা">খেলাধুলা</option>
                    <option value="বিনোদন">বিনোদন</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">কত কলামে যাবে?</label>
                  <select
                    value={assignData.colSpan}
                    onChange={e => setAssignData({...assignData, colSpan: e.target.value})}
                    className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white"
                  >
                    <option value="">নির্ধারিত নয়</option>
                    <option value="1">১ কলাম</option>
                    <option value="2">২ কলাম</option>
                    <option value="3">৩ কলাম</option>
                    <option value="4">৪ কলাম</option>
                    <option value="8">৮ কলাম (লিড)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">বিশেষ নির্দেশনা (Note)</label>
                <textarea
                  value={assignData.note}
                  onChange={e => setAssignData({...assignData, note: e.target.value})}
                  placeholder="এডিট করার জন্য বিশেষ কোনো নির্দেশনা থাকলে লিখুন..."
                  rows={2}
                  className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setAssignModalOpen(false)} className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">বাতিল</button>
                <button type="submit" disabled={processingId === assignArticle._id} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md">
                  অ্যাসাইন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
