import { useState, useEffect } from 'react'
import { Plus, Trash2, Power, Link as LinkIcon, Radio, Edit2, Check, X } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function BreakingNews() {
  const { user } = useAuth()
  const [newsList, setNewsList] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [text, setText] = useState('')
  const [link, setLink] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({ text: '', link: '' })

  const isAdmin = ['super_admin', 'managing_editor', 'admin', 'chief_editor', 'news_manager', 'chief_reporter', 'editor', 'sub_editor', 'reporter'].includes(user?.role)

  const fetchNews = async () => {
    try {
      const res = await api.get('/breaking-news')
      setNewsList(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchNews()
    }
  }, [isAdmin])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return

    try {
      await api.post('/breaking-news', { text, link, isActive })
      setText('')
      setLink('')
      setIsActive(true)
      fetchNews()
    } catch (err) {
      console.error(err)
    }
  }

  const toggleStatus = async (id) => {
    try {
      await api.put(`/breaking-news/${id}`)
      fetchNews()
    } catch (err) {
      console.error(err)
    }
  }

  const deleteNews = async (id) => {
    if (!window.confirm('আপনি কি নিশ্চিত?')) return
    try {
      await api.delete(`/breaking-news/${id}`)
      fetchNews()
    } catch (err) {
      console.error(err)
    }
  }

  const startEdit = (news) => {
    setEditingId(news._id)
    setEditData({ text: news.text, link: news.link || '' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditData({ text: '', link: '' })
  }

  const saveEdit = async (id) => {
    if (!editData.text.trim()) return
    try {
      await api.patch(`/breaking-news/${id}`, { text: editData.text, link: editData.link })
      setEditingId(null)
      fetchNews()
    } catch (err) {
      console.error(err)
    }
  }

  if (!isAdmin) {
    return <div className="p-8 text-center text-red-500 font-medium">Access Denied</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-slate-800 pb-4">
        <Radio className="text-red-500" size={24} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ব্রেকিং নিউজ (Breaking News)</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">ওয়েবসাইটের স্ক্রল বারে ব্রেকিং নিউজ যোগ করুন</p>
        </div>
      </div>

      {/* Add Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">খবরের শিরোনাম <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="যেমন: বিশ্বকাপ ফাইনালে চ্যাম্পিয়ন হলো বাংলাদেশ..."
            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
            required
          />
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">লিংক (ঐচ্ছিক)</label>
            <div className="relative">
              <LinkIcon size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="url"
                value={link}
                onChange={e => setLink(e.target.value)}
                placeholder="https://..."
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex items-end pb-1 gap-2">
            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-4 py-2 rounded-lg">
              <input 
                type="checkbox" 
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">সক্রিয় রাখুন (Active)</span>
            </label>
            
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2 h-[42px]"
            >
              <Plus size={18} /> যোগ করুন
            </button>
          </div>
        </div>
      </form>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Radio size={14} className="text-red-500" /> সব ব্রেকিং নিউজ
          </h3>
          <span className="text-xs font-medium bg-red-100 text-red-700 px-2.5 py-1 rounded-full">{newsList.length} টি</span>
        </div>
        
        {loading ? (
          <div className="p-10 text-center text-gray-500">লোড হচ্ছে...</div>
        ) : newsList.length === 0 ? (
          <div className="p-10 text-center text-gray-500 border-t border-gray-100 dark:border-slate-800">কোনো ব্রেকিং নিউজ নেই</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {newsList.map(news => (
              <div key={news._id} className={`p-4 flex items-center justify-between transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50 ${!news.isActive && editingId !== news._id ? 'opacity-60 bg-gray-50 dark:bg-slate-900/50' : ''}`}>
                {editingId === news._id ? (
                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      type="text"
                      value={editData.text}
                      onChange={e => setEditData({...editData, text: e.target.value})}
                      className="w-full bg-white dark:bg-slate-800 border border-red-300 dark:border-red-900/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:text-white"
                      placeholder="খবরের শিরোনাম"
                    />
                    <div className="flex items-center gap-2">
                      <LinkIcon size={14} className="text-gray-400" />
                      <input
                        type="url"
                        value={editData.link}
                        onChange={e => setEditData({...editData, link: e.target.value})}
                        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs dark:text-white"
                        placeholder="লিংক (ঐচ্ছিক)"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1">
                    <h4 className={`font-medium ${!news.isActive ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                      {news.text}
                    </h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      {news.link && (
                        <a href={news.link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <LinkIcon size={10} /> লিংক দেখুন
                        </a>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(news.createdAt).toLocaleString('bn-BD')}
                      </span>
                      {news.createdBy && (
                        <span className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-500 px-2 py-0.5 rounded">
                          By: {news.createdBy.name}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2 ml-4">
                  {editingId === news._id ? (
                    <>
                      <button 
                        onClick={() => saveEdit(news._id)}
                        title="সেভ করুন"
                        className="p-2 rounded-lg border border-green-200 text-green-600 bg-green-50 hover:bg-green-100 transition-colors"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={cancelEdit}
                        title="বাতিল করুন"
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 bg-gray-50 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => toggleStatus(news._id)}
                        title={news.isActive ? 'বন্ধ করুন' : 'চালু করুন'}
                        className={`p-2 rounded-lg border transition-colors ${
                          news.isActive 
                            ? 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100' 
                            : 'text-gray-400 border-gray-200 hover:text-gray-600 hover:bg-gray-100 dark:border-slate-700 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Power size={16} />
                      </button>
                      <button 
                        onClick={() => startEdit(news)}
                        title="এডিট"
                        className="p-2 rounded-lg border border-blue-200 text-blue-500 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteNews(news._id)}
                        title="ডিলিট"
                        className="p-2 rounded-lg border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
