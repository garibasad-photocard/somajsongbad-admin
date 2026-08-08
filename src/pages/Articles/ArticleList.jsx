import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Pencil, Trash2, Eye, EyeOff, Share2 } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useSettings } from '../../context/SettingsContext'
import SearchableSelect from '../../components/SearchableSelect'

const statusConfig = {
  draft: { label: 'ড্রাফট', class: 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400' },
  writing: { label: 'লেখা হচ্ছে', class: 'bg-blue-100 text-blue-700' },
  submitted: { label: 'রিভিউতে', class: 'bg-yellow-100 text-yellow-700' },
  correction_needed: { label: 'কারেকশন', class: 'bg-orange-100 text-orange-700' },
  approved: { label: 'অনুমোদিত', class: 'bg-indigo-100 text-indigo-700' },
  published: { label: 'প্রকাশিত', class: 'bg-green-100 text-green-700' },
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getInitials(name) {
  if (!name) return '—'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

function MediaThumbnail({ coverImage, thumbnail, videoUrl, className = "w-16 h-12" }) {
  const imgUrl = coverImage || thumbnail
  if (imgUrl && !imgUrl.includes('unsplash.com')) {
    const src = imgUrl.startsWith('/uploads') ? `http://localhost:5001${imgUrl}` : imgUrl
    return <img src={src} alt="thumbnail" className={`${className} object-cover rounded-lg flex-shrink-0 border border-gray-200 dark:border-slate-700 shadow-sm`} />
  }
  if (videoUrl) {
    const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
    if (ytMatch) {
      return (
        <div className={`relative ${className} flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm bg-black flex items-center justify-center`}>
          <img src={`https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`} alt="video thumbnail" className="w-full h-full object-cover opacity-90" />
          <span className="absolute inset-0 flex items-center justify-center text-white bg-black/30 text-xs">🎥</span>
        </div>
      )
    }
    if (videoUrl.includes('facebook.com') || videoUrl.includes('fb.watch')) {
      let embedUrl = videoUrl;
      const reelMatch = videoUrl.match(/\/reel\/(\d+)/);
      if (reelMatch && reelMatch[1]) {
        embedUrl = `https://www.facebook.com/watch/?v=${reelMatch[1]}`;
      }
      return (
        <div className={`relative ${className} flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm bg-black flex items-center justify-center`}>
          <iframe src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(embedUrl)}&show_text=false&width=200`} style={{ width: '100%', height: '100%', border: 'none', overflow: 'hidden' }} className="pointer-events-none opacity-90" scrolling="no" frameBorder="0" allowFullScreen={true} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
          <span className="absolute inset-0 flex items-center justify-center text-white bg-black/30 text-xs pointer-events-none">🎥</span>
        </div>
      )
    }
    if (videoUrl.startsWith('/uploads') || videoUrl.match(/\.(mp4|webm|ogg|mov)$/i)) {
      const vSrc = videoUrl.startsWith('/uploads') ? `http://localhost:5001${videoUrl}` : videoUrl
      return (
        <div className={`relative ${className} flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm bg-black flex items-center justify-center`}>
          <video src={vSrc} className="w-full h-full object-cover opacity-90" muted playsInline preload="metadata" />
          <span className="absolute inset-0 flex items-center justify-center text-white bg-black/30 text-xs">🎥</span>
        </div>
      )
    }
    return (
      <div className={`${className} rounded-lg bg-slate-900 border border-slate-700 flex flex-col items-center justify-center text-white text-[10px] font-bold shadow-sm flex-shrink-0`}>
        <span className="text-xs">🎥</span>
        <span>Video</span>
      </div>
    )
  }
  return (
    <div className={`${className} rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-[10px] text-gray-400 dark:text-slate-500 flex-shrink-0`}>
      কোনো ছবি নেই
    </div>
  )
}

export default function ArticleList({ filterCategory, defaultType, hideTypeFilter, title }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { journalists } = useSettings()
  const [articles, setArticles] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchArticles = async () => {
    try {
      const endpoint = filterCategory ? `/articles?category=${encodeURIComponent(filterCategory)}` : '/articles'
      const res = await api.get(endpoint)
      setArticles(res.data)
    } catch (err) {
      console.error('Failed to fetch articles', err)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [filterCategory])

  const handleDelete = async (id) => {
    if (confirm('আপনি কি নিশ্চিত যে এই আর্টিকেল মুছে ফেলতে চান?')) {
      try {
        await api.delete(`/articles/${id}`)
        setArticles(articles.filter(a => a._id !== id))
      } catch (err) {
        console.error('Failed to delete', err)
      }
    }
  }

  const handleQuickUpdate = async (id, data) => {
    try {
      const res = await api.put(`/articles/${id}`, data)
      setArticles(articles.map(a => a._id === id ? res.data : a))
    } catch (err) {
      console.error('Failed to update article', err)
    }
  }

  const getStatusLabel = (statusKey) => {
    switch (statusKey) {
      case 'published': return t.published
      case 'approved': return t.approved
      case 'submitted': return t.inReview
      case 'writing': return t.writing
      case 'correction_needed': return t.correction
      case 'draft': return t.draft
      default: return statusKey
    }
  }

  const filtered = articles.filter((a) => {
    // Role-based filtering
    if (user?.role === 'reporter') {
      const isMine = a.authorId?._id === user._id || a.assigneeName === user.name
      if (!isMine) return false
    }

    if (defaultType && a.articleType !== defaultType) return false;

    if (filterCategory === 'ভিডিও') {
      const isVideoItem = a.category === 'ভিডিও' || a.newsPositions?.includes('ভিডিও')
      if (!isVideoItem) return false
    } else if (!filterCategory) {
      // Exclude video items from the main Articles list
      if (a.category === 'ভিডিও') return false
    }

    const matchSearch = (a.title || '').toLowerCase().includes(search.toLowerCase()) || 
                        (a.category || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || a.status === statusFilter || a.editorialStatus === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-4">
      {filterCategory === 'ভিডিও' ? (
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🎥</span> আপলোডেড ভিডিও লিস্ট (Uploaded Video List)
          </h1>
          <Link to="/video-upload" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
            + নতুন ভিডিও আপলোড
          </Link>
        </div>
      ) : (
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📰</span> {title || 'সব নিউজ / আর্টিকেল লিস্ট'}
          </h1>
          {!hideTypeFilter && (
            <Link to="/articles/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              + নতুন আর্টিকেল
            </Link>
          )}
          {defaultType === 'photo_story' && (
            <Link to="/photo-stories/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              + নতুন ফটোস্টোরি
            </Link>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="relative w-80">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchArticles}
            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400 dark:text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900"
          >
            <option value="all">{t.allStatus}</option>
            <option value="published">{t.published}</option>
            <option value="approved">{t.approved}</option>
            <option value="submitted">{t.inReview}</option>
            <option value="writing">{t.writing}</option>
            <option value="correction_needed">{t.correction}</option>
            <option value="draft">{t.draft}</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
              <th className="text-left text-xs text-gray-500 dark:text-slate-400 font-medium px-5 py-3">{t.title}</th>
              <th className="text-left text-xs text-gray-500 dark:text-slate-400 font-medium px-3 py-3">{t.category}</th>
              <th className="text-left text-xs text-gray-500 dark:text-slate-400 font-medium px-3 py-3">{t.status}</th>
              <th className="text-left text-xs text-gray-500 dark:text-slate-400 font-medium px-3 py-3">{t.date}</th>
              <th className="text-left text-xs text-gray-500 dark:text-slate-400 font-medium px-3 py-3">{t.reporter_col}</th>
              <th className="text-right text-xs text-gray-500 dark:text-slate-400 font-medium px-5 py-3">{t.action}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <MediaThumbnail coverImage={a.coverImage} thumbnail={a.thumbnail} videoUrl={a.videoUrl} className="w-16 h-12" />
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-sm text-gray-800 dark:text-slate-200 max-w-xs truncate font-medium">{a.title || t.unnamed}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {a.sharedToFacebook && <span title="ফেসবুকে শেয়ার করা হয়েছে" className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800"><Share2 size={10} /> FB</span>}
                        {a.sharedToTwitter && <span title="টুইটারে শেয়ার করা হয়েছে" className="flex items-center gap-1 text-[10px] font-bold text-sky-500 bg-sky-50 dark:bg-sky-900/30 px-1.5 py-0.5 rounded border border-sky-100 dark:border-sky-800"><Share2 size={10} /> X</span>}
                        {a.sharedToInstagram && <span title="ইনস্টাগ্রামে শেয়ার করা হয়েছে" className="flex items-center gap-1 text-[10px] font-bold text-pink-600 bg-pink-50 dark:bg-pink-900/30 px-1.5 py-0.5 rounded border border-pink-100 dark:border-pink-800"><Share2 size={10} /> IG</span>}
                      </div>
                      {a.assigneeName && (
                        <span className="text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full w-max border border-blue-100">
                          Assigned to: {a.assigneeName}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-gray-500 dark:text-slate-400">{a.category || '—'}</td>
                <td className="px-3 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusConfig[a.status]?.class || 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'}`}>
                    {getStatusLabel(a.status)}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-gray-500 dark:text-slate-400">{formatDate(a.createdAt)}</td>
                <td className="px-3 py-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center justify-center" title={a.authorId?.name || 'Admin'}>
                    {getInitials(a.authorId?.name || 'Admin')}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-32">
                      <SearchableSelect
                        options={journalists?.map(j => ({ value: j.name, label: j.name })) || []}
                        value={a.assigneeName || ''}
                        onChange={(val) => handleQuickUpdate(a._id, { assigneeName: val })}
                        placeholder="এসাইন টু..."
                      />
                    </div>

                    <button
                      onClick={() => handleQuickUpdate(a._id, { isHidden: !a.isHidden })}
                      title={a.isHidden ? "পাবলিক করুন" : "হাইড করুন"}
                      className={`p-1.5 rounded transition-colors ${a.isHidden ? 'text-orange-500 bg-orange-50 hover:bg-orange-100' : 'text-gray-400 dark:text-slate-500 hover:text-orange-600 hover:bg-orange-50'}`}
                    >
                      {a.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>

                    <Link
                      to={(filterCategory === 'ভিডিও' || a.category === 'ভিডিও') ? `/video-upload/edit/${a._id}` : `/articles/edit/${a._id}`}
                      title="এডিট করুন"
                      className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Pencil size={14} />
                    </Link>
                    <button onClick={() => handleDelete(a._id)} title="মুছুন" className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400 dark:text-slate-500">{t.noArticlesFound}</p>
          </div>
        )}
      </div>

    </div>
  )
}
