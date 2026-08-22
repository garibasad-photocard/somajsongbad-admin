import { useState, useEffect } from 'react'
import { Upload, Search, Trash2, Copy, X, Image as ImageIcon, Check, Crop, Plus, AlertCircle, FileText, BarChart3, Filter, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import api from '../services/api'
import ImageCropperModal from '../components/Media/ImageCropperModal'

export default function Media() {
  const { user } = useAuth()
  const { categories } = useSettings()
  const canDelete = ['super_admin', 'managing_editor', 'chief_editor'].includes(user?.role)

  const categoriesList = categories ? categories.map(c => c.name) : []
  const subCategoriesMap = categories ? categories.reduce((acc, c) => {
    acc[c.name] = c.subCategories?.length ? c.subCategories : ['সাধারণ']
    return acc
  }, {}) : {}

  const [activeTab, setActiveTab] = useState('media') // 'media' or 'album'
  const [selectedAlbum, setSelectedAlbum] = useState(null)
  const [media, setMedia] = useState([])
  const [searchName, setSearchName] = useState('')
  const [searchCategory, setSearchCategory] = useState('সব ক্যাটাগরি')
  const [searchSubCategory, setSearchSubCategory] = useState('সব সাব-ক্যাটাগরি')
  const [searchAlbum, setSearchAlbum] = useState('সব অ্যালবাম')
  const [selected, setSelected] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [duplicateConfirm, setDuplicateConfirm] = useState(null)
  
  // Media upload modal state matching user requirement perfectly
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFilesList, setUploadFilesList] = useState([null, null, null])
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadCaption, setUploadCaption] = useState('')
  const [isSharedCaption, setIsSharedCaption] = useState(true)
  const [uploadCaptionsList, setUploadCaptionsList] = useState(['', '', ''])
  const [uploadTags, setUploadTags] = useState('')
  const [uploadCategory, setUploadCategory] = useState('রাজনীতি')
  const [uploadSubCategory, setUploadSubCategory] = useState('সাধারণ')
  const [uploadAlbum, setUploadAlbum] = useState('')
  const [cropSlotIndex, setCropSlotIndex] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })

  useEffect(() => {
    if (categoriesList.length > 0 && !categoriesList.includes(uploadCategory)) {
      setUploadCategory(categoriesList[0])
      setUploadSubCategory(subCategoriesMap[categoriesList[0]]?.[0] || 'সাধারণ')
    }
  }, [categories])

  const fetchMedia = async () => {
    try {
      const res = await api.get('/media')
      setMedia(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchMedia()
  }, [])

  // 1. Filter approved media
  const approvedMedia = media.filter(m => m.status === 'approved')
  const albumList = [...new Set(approvedMedia.map(m => m.album).filter(Boolean))]

  // Group approved media by album
  const albumsMap = approvedMedia.reduce((acc, m) => {
    if (m.album) {
      if (!acc[m.album]) {
        acc[m.album] = {
          name: m.album,
          category: m.category || 'সাধারণ',
          subCategory: m.subCategory || 'সাধারণ',
          images: [],
          createdAt: m.createdAt
        }
      }
      acc[m.album].images.push(m)
    }
    return acc
  }, {})

  const filteredAlbums = Object.values(albumsMap).filter(al => {
    let matchName = true
    if (searchName.trim()) {
      const s = searchName.toLowerCase()
      matchName = al.name.toLowerCase().includes(s) || al.images.some(img => img.title?.toLowerCase().includes(s) || img.caption?.toLowerCase().includes(s) || img.tags?.some(t => t.toLowerCase().includes(s)))
    }
    let matchCat = true
    if (searchCategory !== 'সব ক্যাটাগরি') {
      matchCat = al.category === searchCategory
    }
    let matchSubCat = true
    if (searchSubCategory !== 'সব সাব-ক্যাটাগরি') {
      matchSubCat = al.subCategory === searchSubCategory
    }
    let matchAlbum = true
    if (searchAlbum !== 'সব অ্যালবাম') {
      matchAlbum = al.name === searchAlbum
    }
    return matchName && matchCat && matchSubCat && matchAlbum
  })

  // 2. Advanced Dynamic Multi-field Search Filter
  const filtered = approvedMedia.filter((m) => {
    // 1. Name/Title/Caption match
    let matchName = true
    if (searchName.trim()) {
      const s = searchName.toLowerCase()
      matchName = m.name?.toLowerCase().includes(s) || 
                  m.title?.toLowerCase().includes(s) || 
                  m.caption?.toLowerCase().includes(s) || 
                  m.tags?.some(t => t.toLowerCase().includes(s)) ||
                  m.customId?.toLowerCase().includes(s) ||
                  m.album?.toLowerCase().includes(s)
    }

    // 2. Category match
    let matchCat = true
    if (searchCategory !== 'সব ক্যাটাগরি') {
      matchCat = m.category === searchCategory
    }

    // 3. SubCategory match
    let matchSubCat = true
    if (searchSubCategory !== 'সব সাব-ক্যাটাগরি') {
      matchSubCat = m.subCategory === searchSubCategory
    }

    // 4. Album match
    let matchAlbum = true
    if (searchAlbum !== 'সব অ্যালবাম') {
      matchAlbum = m.album === searchAlbum
    }

    return matchName && matchCat && matchSubCat && matchAlbum
  })

  // 3. Dynamic Smart Dashboard Calculations
  const totalApproved = activeTab === 'album' 
    ? Object.keys(albumsMap).length 
    : approvedMedia.length

  const categoryCounts = categoriesList.reduce((acc, cat) => {
    if (activeTab === 'album') {
      acc[cat] = Object.values(albumsMap).filter(al => {
        let matchName = true
        if (searchName.trim()) {
          const s = searchName.toLowerCase()
          matchName = al.name.toLowerCase().includes(s) || al.images.some(img => img.title?.toLowerCase().includes(s) || img.caption?.toLowerCase().includes(s) || img.tags?.some(t => t.toLowerCase().includes(s)))
        }
        let matchAlbum = true
        if (searchAlbum !== 'সব অ্যালবাম') {
          matchAlbum = al.name === searchAlbum
        }
        return matchName && matchAlbum && al.category === cat
      }).length
    } else {
      acc[cat] = approvedMedia.filter(m => {
        let matchName = true
        if (searchName.trim()) {
          const s = searchName.toLowerCase()
          matchName = m.name?.toLowerCase().includes(s) || 
                      m.title?.toLowerCase().includes(s) || 
                      m.caption?.toLowerCase().includes(s) || 
                      m.tags?.some(t => t.toLowerCase().includes(s)) ||
                      m.customId?.toLowerCase().includes(s) ||
                      m.album?.toLowerCase().includes(s)
        }
        let matchAlbum = true
        if (searchAlbum !== 'সব অ্যালবাম') {
          matchAlbum = m.album === searchAlbum
        }
        return matchName && matchAlbum && m.category === cat
      }).length
    }
    return acc
  }, {})

  const handleDelete = async (id) => {
    try {
      await api.delete(`/media/${id}`)
      setMedia(media.filter((m) => m._id !== id))
      if (selected?._id === id) setSelected(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCopy = (url, id) => {
    const fullUrl = url.startsWith('http') ? url : `http://localhost:5001${url}`;
    navigator.clipboard.writeText(fullUrl)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const handleFiles = (files) => {
    const fileArr = Array.from(files)
    const newFiles = fileArr.length < 3 ? [...fileArr, ...new Array(3 - fileArr.length).fill(null)] : fileArr
    setUploadFilesList(newFiles)
    setUploadCaptionsList(new Array(newFiles.length).fill(''))
    setShowUploadModal(true)
  }

  const handleFolderSelect = (e) => {
    const files = Array.from(e.target.files).filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/') || f.type === 'application/pdf' || f.name.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm|mkv|mov|avi|pdf)$/i))
    if (files.length === 0) {
      alert('ফোল্ডারে কোনো ইমেজ, ভিডিও বা পিডিএফ পাওয়া যায়নি।')
      return
    }
    const newFiles = files.length < 3 ? [...files, ...new Array(3 - files.length).fill(null)] : files
    setUploadFilesList(newFiles)
    setUploadCaptionsList(new Array(newFiles.length).fill(''))
    if (files[0]?.webkitRelativePath) {
      const folderName = files[0].webkitRelativePath.split('/')[0]
      if (folderName) setUploadAlbum(folderName)
    }
    setShowUploadModal(true)
    e.target.value = null
  }

  const handleSlotFileChange = (index, file) => {
    if (!file) return
    const updated = [...uploadFilesList]
    updated[index] = file
    setUploadFilesList(updated)
  }

  const handleRemoveSlotFile = (index) => {
    const updated = [...uploadFilesList]
    updated[index] = null
    setUploadFilesList(updated)
    const updatedCap = [...uploadCaptionsList]
    updatedCap[index] = ''
    setUploadCaptionsList(updatedCap)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
  }

  const handleCropComplete = (croppedFile) => {
    if (cropSlotIndex !== null) {
      const updated = [...uploadFilesList]
      updated[cropSlotIndex] = croppedFile
      setUploadFilesList(updated)
      setCropSlotIndex(null)
    }
  }

  const handleModalSubmit = async (e) => {
    e.preventDefault()
    const activeIndices = uploadFilesList.map((f, i) => f ? i : null).filter(i => i !== null)
    if (activeIndices.length === 0) {
      alert('অনুগ্রহ করে অন্তত একটি ছবি সিলেক্ট করুন।')
      return
    }

    setUploading(true)
    setUploadProgress({ current: 0, total: activeIndices.length })
    const batchTaskId = `Task_${Date.now()}`
    let count = 0
    for (const idx of activeIndices) {
      count++
      setUploadProgress({ current: count, total: activeIndices.length })
      const file = uploadFilesList[idx]
      const captionToUse = isSharedCaption ? uploadCaption : uploadCaptionsList[idx]
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', uploadTitle)
      formData.append('caption', captionToUse)
      formData.append('tags', uploadTags)
      formData.append('category', uploadCategory)
      formData.append('subCategory', uploadSubCategory)
      formData.append('album', uploadAlbum)
      formData.append('status', 'approved') // Directly approve uploads from Media Library so they show up instantly in Media & Album tabs
      formData.append('taskId', batchTaskId) // Group images uploaded together

      try {
        const res = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        const { media: newMedia, duplicate } = res.data
        if (duplicate) {
          setDuplicateConfirm({ url: duplicate.startsWith('http') ? duplicate : `http://localhost:5001${duplicate}`, name: newMedia.name })
        }
      } catch (err) {
        console.error(err)
      }
    }
    await fetchMedia()
    setUploading(false)
    setUploadProgress({ current: 0, total: 0 })
    setShowUploadModal(false)
    setUploadFilesList([null, null, null])
    setUploadTitle('')
    setUploadCaption('')
    setUploadCaptionsList(['', '', ''])
    setUploadTags('')
    setUploadAlbum('')
    setSuccessMessage('মিডিয়া ও অ্যালবাম সফলভাবে আপলোড হয়েছে এবং সরাসরি লাইব্রেরিতে যুক্ত হয়েছে!')
    setTimeout(() => setSuccessMessage(null), 10000)
  }

  const subCats = subCategoriesMap[uploadCategory] || ['সাধারণ']

  return (
    <div className="space-y-8">
      {successMessage && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl text-emerald-800 dark:text-emerald-300 shadow-sm transition-all">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center flex-shrink-0">
              <Check size={18} className="text-emerald-600 dark:text-emerald-200" />
            </div>
            <p className="text-sm font-semibold">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800">
            <X size={18} />
          </button>
        </div>
      )}

      {/* HEADER & STATS - CLEAN ELEGANT ASSIGNMENT BOARD STYLE */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600 dark:text-blue-500" />
            মিডিয়া লাইব্রেরি ও অ্যানালিটিক্স
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {activeTab === 'album' 
              ? 'ক্যাটাগরি ও সাব-ক্যাটাগরি ভিত্তিক ফটো অ্যালবাম সমূহ'
              : searchName || searchCategory !== 'সব ক্যাটাগরি' || searchSubCategory !== 'সব সাব-ক্যাটাগরি' || searchAlbum !== 'সব অ্যালবাম'
                ? 'আপনার ফিল্টার অনুযায়ী মিডিয়া বিশ্লেষণ'
                : 'মিডিয়া লাইব্রেরির ক্যাটাগরি ভিত্তিক রিয়েল-টাইম লাইভ বিশ্লেষণ'}
          </p>
        </div>

        {/* MODERN TOGGLE TABS */}
        <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-inner">
          <button
            onClick={() => setActiveTab('media')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'media'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ImageIcon size={16} />
            <span>মিডিয়া</span>
          </button>
          <button
            onClick={() => setActiveTab('album')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'album'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={16} />
            <span>অ্যালবাম</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label 
            className={`flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-2xl transition-all shadow-lg ${
              activeTab === 'media'
                ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed shadow-none opacity-60'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer hover:shadow-emerald-600/20'
            }`}
            title={activeTab === 'media' ? 'অ্যালবাম ট্যাবে গিয়ে ফোল্ডার আপলোড করুন' : 'ফোল্ডার / অ্যালবাম আপলোড করুন'}
          >
            <Plus size={18} />
            <span>ফোল্ডার / অ্যালবাম আপলোড</span>
            <input
              type="file"
              webkitdirectory="true"
              directory="true"
              multiple
              disabled={activeTab === 'media'}
              className="hidden"
              onChange={handleFolderSelect}
            />
          </label>
          <button 
            disabled={activeTab === 'album'}
            onClick={() => {
              if (activeTab === 'album') return
              setUploadFilesList([null, null, null])
              setShowUploadModal(true)
            }}
            className={`flex items-center gap-2.5 text-sm font-bold px-6 py-3 rounded-2xl transition-all shadow-lg ${
              activeTab === 'album'
                ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed shadow-none opacity-60'
                : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-blue-600/20'
            }`}
            title={activeTab === 'album' ? 'মিডিয়া ট্যাবে গিয়ে নতুন মিডিয়া আপলোড করুন' : 'নতুন মিডিয়া আপলোড করুন'}
          >
            <Upload size={18} />
            <span>নতুন মিডিয়া আপলোড</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - Compact 8 per line */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {/* ALL Card */}
        <div 
          onClick={() => { setSearchCategory('সব ক্যাটাগরি'); setSearchSubCategory('সব সাব-ক্যাটাগরি'); setSearchAlbum('সব অ্যালবাম'); }}
          className={`rounded-xl p-2 border shadow-sm flex flex-col justify-center items-center text-center cursor-pointer transition-all ${
            searchCategory === 'সব ক্যাটাগরি'
              ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
              : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-blue-400'
          }`}
          title="সব ক্যাটাগরি (ALL)"
        >
          <p className={`text-lg font-bold mb-0.5 ${searchCategory === 'সব ক্যাটাগরি' ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
            {totalApproved}
          </p>
          <p className={`text-[10px] font-bold uppercase tracking-wider truncate w-full px-1 ${searchCategory === 'সব ক্যাটাগরি' ? 'text-white' : 'text-gray-600 dark:text-slate-400'}`}>
            ALL
          </p>
        </div>

        {/* Category Cards */}
        {categoriesList.map(cat => {
          const count = categoryCounts[cat]
          const isSelected = searchCategory === cat
          return (
            <div 
              key={cat}
              onClick={() => {
                if (isSelected) {
                  setSearchCategory('সব ক্যাটাগরি')
                  setSearchSubCategory('সব সাব-ক্যাটাগরি')
                } else {
                  setSearchCategory(cat)
                  setSearchSubCategory('সব সাব-ক্যাটাগরি')
                }
              }}
              className={`rounded-xl p-2 border shadow-sm flex flex-col justify-center items-center text-center cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : count > 0 
                    ? 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-blue-400' 
                    : 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700/50 opacity-60 hover:opacity-90'
              }`}
              title={cat}
            >
              <p className={`text-lg font-bold mb-0.5 ${isSelected ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
                {count}
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-wider truncate w-full px-1 ${isSelected ? 'text-white' : 'text-gray-600 dark:text-slate-400'}`}>
                {cat}
              </p>
            </div>
          )
        })}
      </div>

      {/* 4 DYNAMIC SEARCH FIELDS */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
            <Filter size={18} />
            <span>ডায়নামিক মাল্টি-ফিল্ড সার্চ ও ফিল্টারিং</span>
          </div>
          {(searchName || searchCategory !== 'সব ক্যাটাগরি' || searchSubCategory !== 'সব সাব-ক্যাটাগরি' || searchAlbum !== 'সব অ্যালবাম') && (
            <button 
              onClick={() => { setSearchName(''); setSearchCategory('সব ক্যাটাগরি'); setSearchSubCategory('সব সাব-ক্যাটাগরি'); setSearchAlbum('সব অ্যালবাম'); }}
              className="flex items-center gap-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-xl font-bold transition-colors"
            >
              <X size={14} />
              <span>ফিল্টার রিসেট করুন</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          {/* 1. Name Search */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">
              ১. নাম / ক্যাপশন / ট্যাগ
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="ছবির নাম, ক্যাপশন বা ট্যাগ..."
                className="w-full border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* 2. Category Search */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">
              ২. ক্যাটাগরি নির্বাচন
            </label>
            <select
              value={searchCategory}
              onChange={(e) => {
                setSearchCategory(e.target.value)
                setSearchSubCategory('সব সাব-ক্যাটাগরি')
              }}
              className="w-full border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            >
              <option value="সব ক্যাটাগরি">সব ক্যাটাগরি</option>
              {categoriesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 3. Sub Category Search (Dynamic) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">
              ৩. সাব-ক্যাটাগরি (ডায়নামিক)
            </label>
            <select
              value={searchSubCategory}
              onChange={(e) => setSearchSubCategory(e.target.value)}
              disabled={searchCategory === 'সব ক্যাটাগরি'}
              className="w-full border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="সব সাব-ক্যাটাগরি">সব সাব-ক্যাটাগরি</option>
              {searchCategory !== 'সব ক্যাটাগরি' && subCategoriesMap[searchCategory]?.map(sc => (
                <option key={sc} value={sc}>{sc}</option>
              ))}
            </select>
          </div>

          {/* 4. Album Search */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">
              ৪. ফটো অ্যালবাম নির্বাচন
            </label>
            <select
              value={searchAlbum}
              onChange={(e) => setSearchAlbum(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            >
              <option value="সব অ্যালবাম">সব অ্যালবাম</option>
              {albumList.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {activeTab === 'media' ? (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
              dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900'
            }`}
            onClick={() => {
              setUploadFilesList([null, null, null])
              setShowUploadModal(true)
            }}
          >
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-3">
              <ImageIcon size={22} className="text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-base font-semibold text-gray-700 dark:text-slate-300">ইমেজ, পিডিএফ বা ভিডিও এখানে ড্র্যাগ করে ছাড়ুন</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">বা উপরের "আপলোড করুন" বাটনে ক্লিক করে ফর্ম ওপেন করুন</p>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {filtered.map((m) => (
              <div
                key={m._id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden group cursor-pointer shadow-sm hover:shadow transition-shadow"
                onClick={() => setSelected(m)}
              >
                <div className="aspect-video bg-gray-100 dark:bg-slate-800 overflow-hidden relative flex items-center justify-center">
                  {m.url.match(/\.(mp4|webm|mkv|mov|avi)$/i) || m.type === 'video' ? (
                    <video src={m.url.startsWith('http') ? m.url : `http://localhost:5001${m.url}`} className="w-full h-full object-cover" />
                  ) : m.url.match(/\.pdf$/i) || m.type === 'pdf' ? (
                    <div className="text-xs font-bold text-red-500 bg-red-100 dark:bg-red-900/40 p-3 rounded-lg border border-red-200 dark:border-red-800">PDF File</div>
                  ) : (
                    <img src={m.url.startsWith('http') ? m.url : `http://localhost:5001${m.url}`} alt={m.name} className="w-full h-full object-cover" />
                  )}
                  {m.category && (
                    <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      {m.category}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">{m.title || m.name}</p>
                  {m.caption && <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate mt-0.5">{m.caption}</p>}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100 dark:border-slate-800">
                    <span className="text-[11px] text-gray-400 dark:text-slate-500">{m.size}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(m.url, m._id) }}
                        className="p-1 text-gray-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="URL কপি করুন"
                      >
                        {copiedId === m._id ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                      {canDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(m._id) }}
                          className="p-1 text-gray-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title="ডিলিট করুন"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700">
              কোনো মিডিয়া পাওয়া যায়নি
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredAlbums.map((al) => {
              const coverImg = al.images[0]
              return (
                <div
                  key={al.name}
                  onClick={() => setSelectedAlbum(al)}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl hover:border-blue-500 transition-all flex flex-col"
                >
                  <div className="aspect-[4/3] bg-gray-100 dark:bg-slate-800 overflow-hidden relative flex items-center justify-center">
                    {coverImg ? (
                      coverImg.url.match(/\.(mp4|webm|mkv|mov|avi)$/i) || coverImg.type === 'video' ? (
                        <video src={coverImg.url.startsWith('http') ? coverImg.url : `http://localhost:5001${coverImg.url}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : coverImg.url.match(/\.pdf$/i) || coverImg.type === 'pdf' ? (
                        <div className="text-xs font-bold text-red-500 bg-red-100 p-3 rounded-lg border border-red-200">PDF File</div>
                      ) : (
                        <img src={coverImg.url.startsWith('http') ? coverImg.url : `http://localhost:5001${coverImg.url}`} alt={al.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      )
                    ) : (
                      <Sparkles size={32} className="text-gray-300" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                    
                    <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg">
                      {al.category}
                    </div>

                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                      <Sparkles size={12} className="text-amber-400" />
                      <span>{al.images.length} টি ছবি</span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-base font-extrabold text-white truncate drop-shadow-md">{al.name}</p>
                      <p className="text-xs text-gray-300 truncate mt-0.5">{al.subCategory}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between border-t border-gray-100 dark:border-slate-800/80">
                    <span className="text-xs font-semibold text-gray-600 dark:text-slate-400">অ্যালবাম ভিউ ওপেন করুন</span>
                    <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors text-gray-500 dark:text-slate-300">
                      →
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredAlbums.length === 0 && (
            <div className="text-center py-16 text-sm text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-sm">
              কোনো ফটো অ্যালবাম পাওয়া যায়নি
            </div>
          )}

          {/* Album Details Modal */}
          {selectedAlbum && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setSelectedAlbum(null)}>
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 my-8 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-blue-600 text-white font-bold px-2.5 py-0.5 rounded-full">{selectedAlbum.category}</span>
                      <span className="text-xs bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold px-2.5 py-0.5 rounded-full">{selectedAlbum.subCategory}</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">{selectedAlbum.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">মোট {selectedAlbum.images.length} টি ছবি রয়েছে</p>
                  </div>
                  <button onClick={() => setSelectedAlbum(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {selectedAlbum.images.map((m) => (
                      <div
                        key={m._id}
                        className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden group cursor-pointer shadow-sm hover:shadow transition-shadow"
                        onClick={() => setSelected(m)}
                      >
                        <div className="aspect-video bg-gray-100 dark:bg-slate-700 overflow-hidden relative flex items-center justify-center">
                          {m.url.match(/\.(mp4|webm|mkv|mov|avi)$/i) || m.type === 'video' ? (
                            <video src={m.url.startsWith('http') ? m.url : `http://localhost:5001${m.url}`} className="w-full h-full object-cover" />
                          ) : m.url.match(/\.pdf$/i) || m.type === 'pdf' ? (
                            <div className="text-xs font-bold text-red-500 bg-red-100 p-3 rounded-lg border border-red-200">PDF File</div>
                          ) : (
                            <img src={m.url.startsWith('http') ? m.url : `http://localhost:5001${m.url}`} alt={m.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">{m.title || m.name}</p>
                          {m.caption && <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate mt-0.5">{m.caption}</p>}
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100 dark:border-slate-700">
                            <span className="text-[11px] text-gray-400 dark:text-slate-500">{m.size}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCopy(m.url, m._id) }}
                                className="p-1 text-gray-400 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50/20 rounded"
                                title="URL copy"
                              >
                                {copiedId === m._id ? <Check size={12} /> : <Copy size={12} />}
                              </button>
                              {canDelete && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(m._id) }}
                                  className="p-1 text-gray-400 dark:text-slate-400 hover:text-red-600 hover:bg-red-50/20 rounded"
                                  title="Delete"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Main Preview Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selected.title || selected.name}</p>
              <button onClick={() => setSelected(null)} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:text-slate-300">
                <X size={18} />
              </button>
            </div>
            {selected.url.match(/\.(mp4|webm|mkv|mov|avi)$/i) || selected.type === 'video' ? (
              <video src={selected.url.startsWith('http') ? selected.url : `http://localhost:5001${selected.url}`} controls className="w-full max-h-96 object-contain bg-black" />
            ) : selected.url.match(/\.pdf$/i) || selected.type === 'pdf' ? (
              <div className="p-12 text-center bg-gray-50 dark:bg-slate-800 text-red-500 font-semibold">
                📄 {selected.name} (PDF File)
                <br /><br />
                <a href={selected.url.startsWith('http') ? selected.url : `http://localhost:5001${selected.url}`} target="_blank" rel="noreferrer" className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-block mt-2">
                  পিডিএফ ওপেন করুন
                </a>
              </div>
            ) : (
              <img src={selected.url.startsWith('http') ? selected.url : `http://localhost:5001${selected.url}`} alt={selected.name} className="w-full max-h-96 object-contain bg-gray-50 dark:bg-slate-800" />
            )}
            <div className="p-4 space-y-2 border-t border-gray-100 dark:border-slate-800">
              {selected.caption && <p className="text-xs text-gray-600 dark:text-slate-300"><strong className="text-gray-900 dark:text-white">ক্যাপশন:</strong> {selected.caption}</p>}
              {selected.tags && selected.tags.length > 0 && (
                <div className="flex gap-1">
                  {selected.tags.map((t, i) => <span key={i} className="text-[10px] bg-gray-100 dark:bg-slate-800 text-blue-600 px-2 py-0.5 rounded">{t}</span>)}
                </div>
              )}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-gray-400 dark:text-slate-500">{selected.size} | {selected.category}</span>
                <button
                  onClick={() => handleCopy(selected.url, selected._id)}
                  className="flex items-center gap-2 text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {copiedId === selected._id ? <Check size={13} /> : <Copy size={13} />}
                  URL কপি করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Media Upload Modal Form */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-100 dark:border-slate-800 my-8">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">মিডিয়া ও অ্যালবাম আপলোড</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">ফোল্ডারে যতগুলো ছবি থাকবে সবগুলোই এই অ্যালবামে যুক্ত হবে (কোনো ফিক্সড সংখ্যা নেই)</p>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-6">
              {/* Multi Image & Folder Upload Slots */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-bold text-gray-800 dark:text-slate-200">
                    ছবি আপলোডের তালিকা (মোট {uploadFilesList.filter(Boolean).length} টি ফাইল নির্বাচিত)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadFilesList([...uploadFilesList, null])
                      setUploadCaptionsList([...uploadCaptionsList, ''])
                    }}
                    className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <Plus size={14} />
                    <span>আরও স্লট যোগ করুন</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[380px] overflow-y-auto p-1">
                  {uploadFilesList.map((file, idx) => (
                    <div key={idx} className="relative border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-800/30 min-h-[160px] text-center group hover:border-blue-500 transition-colors">
                      {file ? (
                        <div className="w-full flex flex-col items-center space-y-3">
                          {/* Cross button on thumbnail to cancel/remove image */}
                          <button
                            type="button"
                            onClick={() => handleRemoveSlotFile(idx)}
                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform z-10"
                            title="ছবি বাতিল করুন"
                          >
                            <X size={14} />
                          </button>

                          <div 
                            onClick={(e) => { e.stopPropagation(); if (file.type?.startsWith('image/')) setCropSlotIndex(idx); }}
                            className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-200 dark:bg-slate-700 shadow-inner flex items-center justify-center relative cursor-pointer group/thumb border border-gray-300 dark:border-slate-600 hover:border-blue-500 transition-all"
                            title="ক্লিক করে ছবি এডিট করুন"
                          >
                            {file.type?.startsWith('image/') ? (
                              <>
                                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                                  <span className="text-[10px] text-white font-bold px-1.5 py-0.5 bg-blue-600 rounded">এডিট করুন</span>
                                </div>
                              </>
                            ) : (
                              <FileText size={28} className="text-blue-500" />
                            )}
                          </div>
                          <p className="text-xs font-medium text-gray-700 dark:text-slate-300 truncate max-w-[140px]">{file.name}</p>
                          
                          {/* Photo Editing Option */}
                          {file.type?.startsWith('image/') && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setCropSlotIndex(idx) }}
                              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl shadow transition-all"
                            >
                              <Crop size={13} />
                              <span>ছবি এডিট করুন</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer py-4">
                          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Plus size={20} />
                          </div>
                          <span className="text-xs font-bold text-gray-600 dark:text-slate-400">স্লট {idx + 1} নির্বাচন করুন</span>
                          <span className="text-[10px] text-gray-400 mt-1">ক্লিক করে ফাইল নিন</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf,video/*"
                            className="hidden"
                            onChange={(e) => handleSlotFileChange(idx, e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Title & Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-2">
                    ছবির / অ্যালবামের নাম (Name)
                  </label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="যেমন- খালেদা জিয়া, তারেক রহমান, মডেল বর্ষা ইত্যাদি"
                    className="w-full text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-2">
                    হ্যাস ট্যাগ
                  </label>
                  <input
                    type="text"
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    placeholder="যেমন: #politics #bnp #bangladesh"
                    className="w-full text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Caption Mode Section */}
              <div className="space-y-4 bg-gray-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-gray-200 dark:border-slate-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-200 dark:border-slate-700 pb-3">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">
                    ছবির ক্যাপশন মোড নির্বাচন করুন
                  </label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        name="captionMode"
                        checked={isSharedCaption}
                        onChange={() => setIsSharedCaption(true)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span>একই ইভেন্টের জন্য একটি ক্যাপশন</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        name="captionMode"
                        checked={!isSharedCaption}
                        onChange={() => setIsSharedCaption(false)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span>প্রতিটি ছবির আলাদা ক্যাপশন</span>
                    </label>
                  </div>
                </div>

                {isSharedCaption ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-2">
                      সব ছবির সাধারণ ক্যাপশন (Shared Caption)
                    </label>
                    <textarea
                      value={uploadCaption}
                      onChange={(e) => setUploadCaption(e.target.value)}
                      placeholder="একই ইভেন্টের সব ছবির জন্য একটি সাধারণ ক্যাপশন লিখুন..."
                      rows={3}
                      className="w-full text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm resize-none"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {uploadFilesList.map((file, idx) => file && (
                      <div key={idx} className="space-y-2">
                        <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 truncate">
                          স্লট {idx + 1}: {file.name}
                        </label>
                        <textarea
                          value={uploadCaptionsList[idx]}
                          onChange={(e) => {
                            const updatedCap = [...uploadCaptionsList]
                            updatedCap[idx] = e.target.value
                            setUploadCaptionsList(updatedCap)
                          }}
                          placeholder={`স্লট ${idx + 1} এর নির্দিষ্ট ক্যাপশন লিখুন...`}
                          rows={3}
                          className="w-full text-xs border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm resize-none"
                        />
                      </div>
                    ))}
                    {uploadFilesList.filter(f => f !== null).length === 0 && (
                      <p className="text-xs text-gray-400 italic col-span-3 text-center py-2">
                        আলাদা ক্যাপশন লেখার জন্য প্রথমে উপরে ছবি নির্বাচন করুন।
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Category & Sub Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-2">
                    ক্যাটাগরি ফর্ম
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => {
                      setUploadCategory(e.target.value)
                      const defaultSub = subCategoriesMap[e.target.value]?.[0] || 'সাধারণ'
                      setUploadSubCategory(defaultSub)
                    }}
                    className="w-full text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                  >
                    {categoriesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-2">
                    সাব ক্যাটাগরি ফর্ম
                  </label>
                  <select
                    value={uploadSubCategory}
                    onChange={(e) => setUploadSubCategory(e.target.value)}
                    className="w-full text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                  >
                    {subCats.map(sc => (
                      <option key={sc} value={sc}>{sc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-2">
                    ফটো অ্যালবাম / ফোল্ডার নাম
                  </label>
                  <input
                    type="text"
                    value={uploadAlbum}
                    onChange={(e) => setUploadAlbum(e.target.value)}
                    placeholder="অ্যালবামের নাম লিখুন..."
                    className="w-full text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Warning Note */}
              <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/50">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span><strong>নোট:</strong> ফোল্ডারে যত ছবি থাকবে (১০, ২০ বা ৫০টির বেশি) সবগুলোই অ্যালবামে আসবে। এখানে ফিক্সড কোনো ছবির সংখ্যা নেই। আপলোড সম্পন্ন হলে সরাসরি মিডিয়া ও অ্যালবাম পেজে দেখা যাবে।</span>
              </div>

              {/* Submit / Upload Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  <Upload size={16} />
                  <span>{uploading ? `আপলোড হচ্ছে (${uploadProgress.current}/${uploadProgress.total})...` : 'লাইব্রেরি ও অ্যালবামে যোগ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate confirmation dialog */}
      {duplicateConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-yellow-50">
              <p className="text-sm font-semibold text-yellow-800">ডুপ্লিকেট ছবি</p>
              <button onClick={() => setDuplicateConfirm(null)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              <img src={duplicateConfirm.url} alt={duplicateConfirm.name} className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-slate-700 mb-4" />
              <p className="text-sm text-gray-700 dark:text-slate-300 mb-4">
                এ ধরণের ছবি মিডিয়ায় রয়েছে। আপনি আবার ব্যবহারের জন্য নিতে চান?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDuplicateConfirm(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800 transition-colors"
                >
                  না বাটন
                </button>
                <button
                  onClick={() => setDuplicateConfirm(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  হ্যাঁ বাটন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {cropSlotIndex !== null && uploadFilesList[cropSlotIndex] && (
        <ImageCropperModal
          file={uploadFilesList[cropSlotIndex]}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropSlotIndex(null)}
        />
      )}
    </div>
  )
}
