import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useSettings } from '../../context/SettingsContext'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { Video, ArrowLeft, Upload, Save, X, Image as ImageIcon, Search } from 'lucide-react'
import api from '../../services/api'
import SearchableSelect from '../../components/SearchableSelect'

export default function VideoUpload() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const assignmentId = searchParams.get('assignmentId')
  const navigate = useNavigate()
  const { categories, sources, positions } = useSettings()
  const { user } = useAuth()
  const { t } = useLanguage()

  // Form State
  const [language, setLanguage] = useState('bn')
  const [title, setTitle] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [category, setCategory] = useState('ভিডিও')
  const [subCategory, setSubCategory] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [source, setSource] = useState('')
  const [newsPositions, setNewsPositions] = useState([])
  const [coverImagePreview, setCoverImagePreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)

  useEffect(() => {
    if (id) {
      // Fetch existing video article
      const fetchArticle = async () => {
        try {
          const res = await api.get(`/articles/${id}`)
          const data = res.data
          setTitle(data.title || '')
          setSynopsis(data.synopsis || '')
          setCategory(data.category || 'ভিডিও')
          setSubCategory(data.subCategory || '')
          setVideoUrl(data.videoUrl || '')
          setSource(data.source || '')
          setNewsPositions(data.newsPositions || [])
          if (data.coverImage) {
            setCoverImagePreview(data.coverImage.startsWith('http') ? data.coverImage : `http://localhost:5001${data.coverImage}`)
          }
        } catch (err) {
          console.error(err)
        }
      }
      fetchArticle()
    }
  }, [id])

  const selectedCategory = categories.find((c) => c.name === category)
  const subCategories = selectedCategory?.subCategories || []

  const handleThumbUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploadingThumb(true)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const { media } = res.data
      setCoverImagePreview(`http://localhost:5001${media.url}`)
    } catch (err) {
      console.error(err)
    } finally {
      setUploadingThumb(false)
    }
  }

  const handleVideoFileUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploadingVideo(true)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const { media } = res.data
      setVideoUrl(`http://localhost:5001${media.url}`)
    } catch (err) {
      console.error(err)
      alert('ভিডিও আপলোড ব্যর্থ হয়েছে।')
    } finally {
      setUploadingVideo(false)
    }
  }

  const handleSave = async (status = 'published') => {
    if (!title || title.trim() === '') {
      alert('অনুগ্রহ করে ভিডিওর একটি শিরোনাম (Title) দিন।')
      return false
    }
    
    setSaving(true)
    try {
      // Ensure 'ভিডিও' is in newsPositions if not already
      const pos = [...newsPositions]
      if (!pos.includes('ভিডিও')) pos.push('ভিডিও')

      const payload = {
        title,
        synopsis,
        category,
        subCategory,
        videoUrl,
        source,
        newsPositions: pos,
        status,
        coverImage: coverImagePreview ? coverImagePreview.replace('http://localhost:5001', '') : '',
        assignmentId
      }

      if (id) {
        await api.put(`/articles/${id}`, payload)
        alert('ভিডিও সফলভাবে আপডেট হয়েছে!')
      } else {
        await api.post('/articles', payload)
        alert('ভিডিও সফলভাবে আপলোড ও পাবলিশ হয়েছে!')
      }
      navigate('/videos')
    } catch (err) {
      console.error(err)
      alert('ভিডিও সংরক্ষণ করতে সমস্যা হয়েছে।')
    } finally {
      setSaving(false)
    }
  }

  const togglePosition = (posName) => {
    setNewsPositions((prev) =>
      prev.includes(posName) ? prev.filter((p) => p !== posName) : [...prev, posName]
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft size={18} className="text-gray-600 dark:text-slate-400" />
          </button>
          <div className="flex items-center gap-2">
            <Video className="text-blue-600 dark:text-blue-500" size={24} />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {id ? 'ভিডিও আপডেট করুন' : 'নতুন ভিডিও আপলোড করুন'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            খসড়া (Draft)
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20"
          >
            {saving ? 'জমা হচ্ছে...' : 'জমা দিন'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
        {/* ভাষা */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">ভাষা*</label>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-slate-200 cursor-pointer">
              <input 
                type="radio" 
                name="language" 
                checked={language === 'bn'} 
                onChange={() => setLanguage('bn')}
                className="text-blue-600 focus:ring-blue-500"
              />
              বাংলা
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-slate-200 cursor-pointer">
              <input 
                type="radio" 
                name="language" 
                checked={language === 'en'} 
                onChange={() => setLanguage('en')}
                className="text-blue-600 focus:ring-blue-500"
              />
              ইংরেজি
            </label>
          </div>
        </div>

        {/* খবরের শিরোনাম */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">খবরের শিরোনাম*</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ভিডিওর শিরোনাম লিখুন..."
            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-gray-900 dark:text-white"
          />
          <span className="text-[10px] text-gray-400 mt-1 block">০/১২ শব্দ</span>
        </div>

        {/* সংক্ষিপ্ত বিবরণ */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">সংক্ষিপ্ত বিবরণ (একটি প্যারাতে লিখবেন)*</label>
          <textarea
            rows={4}
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            placeholder="ভিডিওর সংক্ষিপ্ত বিবরণ লিখুন..."
            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-gray-900 dark:text-white"
          />
          <span className="text-[10px] text-gray-400 mt-1 block">০/৭০ শব্দ</span>
        </div>

        {/* ক্যাটাগরি ও সাব-ক্যাটাগরি */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">ক্যাটাগরি*</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setSubCategory('')
              }}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">সাব-ক্যাটাগরি</label>
            <select
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            >
              <option value="">সাব-ক্যাটাগরি নির্বাচন করুন</option>
              {subCategories.map((sc, i) => (
                <option key={i} value={sc}>{sc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ভিডিও লিংক বা আপলোড */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">ভিডিও লিংক (এখানে ইউটিউব/ফেসবুক এর ভিডিও লিংক দিন অথবা সরাসরি ভিডিও আপলোড করুন)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-gray-900 dark:text-white"
            />
            <label className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors whitespace-nowrap">
              <Upload size={16} />
              {uploadingVideo ? 'আপলোড হচ্ছে...' : 'ভিডিও ফাইল আপলোড'}
              <input type="file" accept="video/*" className="hidden" onChange={handleVideoFileUpload} disabled={uploadingVideo} />
            </label>
          </div>
          {videoUrl && videoUrl.match(/\.(mp4|webm|mkv|mov|avi)$/i) && (
            <div className="mt-4 rounded-xl overflow-hidden max-w-md bg-black aspect-video flex items-center justify-center border border-gray-200 dark:border-slate-700">
              <video src={videoUrl} controls className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        {/* নিউজ সোর্স */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">নিউজ সোর্স*</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full max-w-xs border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          >
            <option value="">নিউজ সোর্স নির্বাচন করুন</option>
            {sources.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* ভিডিও থাম্বনেইল আপলোড করুন */}
        <div className="border-t border-gray-100 dark:border-slate-800 pt-6">
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">ভিডিও থাম্বনেইল আপলোড করুন (যদি প্রয়োজন হয়)</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 border border-gray-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500 px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 cursor-pointer transition-all">
              <Upload size={16} className="text-blue-500" />
              {uploadingThumb ? 'আপলোড হচ্ছে...' : 'Choose file'}
              <input type="file" accept="image/*" className="hidden" onChange={handleThumbUpload} disabled={uploadingThumb} />
            </label>
            <span className="text-xs text-gray-500">
              {coverImagePreview ? 'File selected' : 'No file chosen'}
            </span>
          </div>
          {coverImagePreview ? (
            <div className="mt-4 relative w-40 h-28 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm">
              <img src={coverImagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setCoverImagePreview('')}
                className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white p-1 rounded-full transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ) : videoUrl ? (
            <div className="mt-4 relative w-40 h-28 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm bg-black flex items-center justify-center">
              {(() => {
                const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
                if (ytMatch) {
                  return <img src={`https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`} alt="video thumbnail" className="w-full h-full object-cover" />
                }
                if (videoUrl.includes('facebook.com') || videoUrl.includes('fb.watch')) {
                  let embedUrl = videoUrl;
                  const reelMatch = videoUrl.match(/\/reel\/(\d+)/);
                  if (reelMatch && reelMatch[1]) {
                    embedUrl = `https://www.facebook.com/watch/?v=${reelMatch[1]}`;
                  }
                  return <iframe src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(embedUrl)}&show_text=false&width=200`} style={{ width: '100%', height: '100%', border: 'none', overflow: 'hidden' }} className="pointer-events-none" scrolling="no" frameBorder="0" allowFullScreen={true} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
                }
                if (videoUrl.startsWith('/uploads') || videoUrl.match(/\.(mp4|webm|ogg|mov)$/i)) {
                  const vSrc = videoUrl.startsWith('/uploads') ? `http://localhost:5001${videoUrl}` : videoUrl
                  return <video src={vSrc} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                }
                return <span className="text-white text-xs">🎥 Video Thumbnail</span>
              })()}
              <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[10px] text-white py-0.5 text-center font-medium">ভিডিও থাম্বনেইল (স্বয়ংক্রিয়)</div>
            </div>
          ) : null}
        </div>

        {/* Submit Button */}
        <div className="border-t border-gray-100 dark:border-slate-800 pt-6 flex justify-center">
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="w-full max-w-md py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl disabled:opacity-50 text-sm"
          >
            {saving ? 'জমা হচ্ছে...' : 'জমা দিন'}
          </button>
        </div>
      </div>
    </div>
  )
}
