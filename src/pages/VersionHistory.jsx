import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { History, Search, Filter, Eye, X, User, Calendar, RefreshCcw, GitCompare, Layers } from 'lucide-react'
import api from '../services/api'
import { useSettings } from '../context/SettingsContext'
import DiffViewer from '../components/DiffViewer'

export default function VersionHistory() {
  const { categories } = useSettings()
  
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [authorFilter, setAuthorFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
  const [versionToView, setVersionToView] = useState(null)
  const [versionContent, setVersionContent] = useState(null)
  const [loadingVersionContent, setLoadingVersionContent] = useState(false)
  
  // Diff Viewer
  const [compareMode, setCompareMode] = useState(false)
  const [previousVersionContent, setPreviousVersionContent] = useState(null)
  const [compareToVersionId, setCompareToVersionId] = useState('')

  const availableVersionsToCompare = useMemo(() => {
    if (!versionToView) return [];
    return logs.filter(l => 
      (l.articleId?._id === versionToView.articleId?._id || l.articleId === versionToView.articleId?._id) &&
      l.versionNumber < versionToView.versionNumber
    ).sort((a, b) => b.versionNumber - a.versionNumber)
  }, [logs, versionToView])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (categoryFilter) params.append('category', categoryFilter)
      if (authorFilter) params.append('savedBy', authorFilter)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      const res = await api.get(`/articles/versions/all?${params.toString()}`)
      setLogs(res.data)
    } catch (err) {
      console.error('Failed to fetch versions', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchLogs()
  }, [])

  // Group logs by Article
  const groupedLogs = useMemo(() => {
    const groups = {}
    logs.forEach(log => {
      const artId = log.articleId?._id || 'unknown'
      if (!groups[artId]) {
        groups[artId] = {
          article: log.articleId,
          versions: []
        }
      }
      groups[artId].versions.push(log)
    })
    return Object.values(groups)
  }, [logs])

  // View full version content
  useEffect(() => {
    if (!versionToView) {
      setVersionContent(null)
      setPreviousVersionContent(null)
      setCompareMode(false)
      setCompareToVersionId('')
      return
    }
    const fetchFullVersion = async () => {
      setLoadingVersionContent(true)
      try {
        const res = await api.get(`/articles/versions/${versionToView._id}`)
        setVersionContent(res.data)

        if (compareMode) {
          let prevIdToFetch = compareToVersionId
          if (!prevIdToFetch && availableVersionsToCompare.length > 0) {
            prevIdToFetch = availableVersionsToCompare[0]._id
            setCompareToVersionId(prevIdToFetch)
          }

          if (prevIdToFetch) {
            const prevRes = await api.get(`/articles/versions/${prevIdToFetch}`)
            setPreviousVersionContent(prevRes.data)
          } else {
            setPreviousVersionContent(null) // No previous version
          }
        }
      } catch (err) {
        console.error('Failed to fetch full version content', err)
      } finally {
        setLoadingVersionContent(false)
      }
    }
    fetchFullVersion()
  }, [versionToView, compareMode, compareToVersionId, availableVersionsToCompare])

  const handleResetFilters = () => {
    setSearchQuery('')
    setCategoryFilter('')
    setAuthorFilter('')
    setDateFrom('')
    setDateTo('')
    // Need to trigger fetch after state updates, but since React state is async, 
    // it's better to fetch immediately with empty params:
    setLoading(true)
    api.get(`/articles/versions/all`).then(res => {
      setLogs(res.data)
      setLoading(false)
    })
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <History className="text-blue-600" />
            ভার্সন হিস্ট্রি ও অডিট লগ
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            পুরো সিস্টেমের সকল আর্টিকেলের পরিবর্তনের ইতিহাস ও স্ন্যাপশট ট্র্যাক করুন।
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative col-span-1 lg:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="আর্টিকেলের শিরোনাম দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          >
            <option value="">সকল ক্যাটাগরি</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="রিপোর্টার / এডিটরের নাম..."
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />

          <div className="flex gap-2">
            <button 
              onClick={fetchLogs}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <Filter size={16} /> ফিল্টার
            </button>
            <button 
              onClick={handleResetFilters}
              className="px-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-lg flex items-center justify-center transition-colors"
              title="রিসেট ফিল্টার"
            >
              <RefreshCcw size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 border-t border-gray-100 dark:border-slate-800 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">শুরুর তারিখ:</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-xs px-2 py-1 dark:text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">শেষের তারিখ:</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-xs px-2 py-1 dark:text-white" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4">আর্টিকেল ও ক্যাটাগরি</th>
                <th className="px-5 py-4 w-64">ভার্সন সমূহ</th>
                <th className="px-5 py-4 w-40">সর্বশেষ সংরক্ষণকারী</th>
                <th className="px-5 py-4 w-40">সর্বশেষ আপডেট</th>
                <th className="px-5 py-4 text-right w-24">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-gray-500">লোড হচ্ছে...</td>
                </tr>
              ) : groupedLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-gray-500">
                    কোনো ভার্সন ইতিহাস পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                groupedLogs.map((group, idx) => {
                  const latestLog = group.versions[0]
                  return (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <Link to={`/articles/edit/${group.article?._id}`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline line-clamp-2 leading-snug mb-1">
                        {group.article?.title || 'Unknown Article'}
                      </Link>
                      {group.article?.category && (
                        <span className="inline-block text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700">
                          {group.article.category}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {group.versions.map(v => (
                          <button
                            key={v._id}
                            onClick={() => { setCompareMode(false); setVersionToView(v); }}
                            className="text-xs font-bold bg-blue-50 hover:bg-blue-600 hover:text-white dark:bg-blue-900/30 dark:hover:bg-blue-600 text-blue-600 dark:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-800/50 transition-colors shadow-sm"
                            title={`${new Date(v.createdAt).toLocaleString('bn-BD')} - ${v.savedBy || 'System'}`}
                          >
                            v{v.versionNumber}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-300">
                        <User size={14} className="text-gray-400" />
                        {latestLog.savedBy || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {new Date(latestLog.createdAt).toLocaleString('bn-BD', {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button 
                        onClick={() => { setCompareMode(false); setVersionToView(latestLog); }}
                        className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm transition-colors"
                      >
                        <Layers size={14} /> হিস্ট্রি
                      </button>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Version Viewer Modal */}
      {versionToView && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex justify-end" onClick={() => setVersionToView(null)}>
          <div className="w-[600px] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-in-right" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <History className="text-blue-600" size={18} />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                    {compareMode ? 'ভার্সন কম্পেয়ার' : `ভার্সন v${versionToView.versionNumber}`}
                  </h3>
                  <div className="flex gap-2 items-center text-xs mt-0.5">
                    <span className="text-gray-500 dark:text-slate-400">{new Date(versionToView.createdAt).toLocaleString('bn-BD')}</span>
                    <span className="text-gray-300">•</span>
                    <span className="font-semibold text-blue-700 dark:text-blue-400">By: {versionToView.savedBy || 'System'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {compareMode && availableVersionsToCompare.length > 0 && (
                  <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800/50">
                    <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">তুলনা করুন:</span>
                    <select 
                      value={compareToVersionId} 
                      onChange={(e) => setCompareToVersionId(e.target.value)}
                      className="text-xs font-bold text-purple-800 dark:text-purple-200 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 rounded px-2 py-0.5 outline-none"
                    >
                      {availableVersionsToCompare.map(v => (
                        <option key={v._id} value={v._id}>
                          v{v.versionNumber} ({new Date(v.createdAt).toLocaleDateString('bn-BD')})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex bg-gray-200 dark:bg-slate-700 p-1 rounded-lg">
                  <button 
                    onClick={() => setCompareMode(false)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${!compareMode ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}
                  >
                    <Eye size={12} className="inline mr-1" /> ভিউ
                  </button>
                  <button 
                    onClick={() => setCompareMode(true)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${compareMode ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}
                  >
                    <GitCompare size={12} className="inline mr-1" /> কম্পেয়ার
                  </button>
                </div>
                <button onClick={() => setVersionToView(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingVersionContent ? (
                <div className="text-center py-10 text-gray-500">লোড হচ্ছে...</div>
              ) : versionContent?.contentSnapshot ? (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {versionContent.contentSnapshot.title || 'শিরোনাম নেই'}
                    </h1>
                    <div className="flex gap-2">
                      {versionContent.contentSnapshot.categories?.map((c, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200">{c}</span>
                      ))}
                    </div>
                  </div>
                  
                  {versionContent.contentSnapshot.coverImage && (
                    <img src={versionContent.contentSnapshot.coverImage.startsWith('/uploads') ? `http://localhost:5001${versionContent.contentSnapshot.coverImage}` : versionContent.contentSnapshot.coverImage} alt="Cover" className="w-full h-48 object-cover rounded-xl" />
                  )}

                  <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                    {compareMode && !previousVersionContent && (
                      <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm mb-4">
                        এটিই প্রথম ভার্সন। তুলনা করার জন্য এর আগে কোনো ভার্সন নেই।
                      </div>
                    )}
                    
                    {versionContent.contentSnapshot.blocks?.length > 0 ? (
                      versionContent.contentSnapshot.blocks.map((block, i) => {
                        const prevBlock = previousVersionContent?.contentSnapshot?.blocks?.[i]
                        const oldText = prevBlock?.content?.replace(/<[^>]*>?/gm, '') || ''
                        const newText = block.content?.replace(/<[^>]*>?/gm, '') || ''

                        return (
                        <div key={i}>
                          {block.type === 'text' && (
                            compareMode && previousVersionContent ? (
                              <div className="p-4 border rounded-xl bg-gray-50 dark:bg-slate-800/50 dark:border-slate-700">
                                <DiffViewer oldText={oldText} newText={newText} />
                              </div>
                            ) : (
                              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: block.content }} />
                            )
                          )}
                          {block.type === 'highlight' && (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-200 rounded-r-lg text-sm font-medium">
                              {block.text}
                            </div>
                          )}
                          {block.type === 'embed' && (
                            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg overflow-x-auto text-xs font-mono text-gray-600 dark:text-slate-400">
                              {block.code}
                            </div>
                          )}
                          {block.type === 'related' && (
                            <div className="p-3 border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/10 rounded-lg flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
                              <span className="font-semibold text-xs bg-blue-600 text-white px-2 py-0.5 rounded">সম্পর্কিত</span>
                              {block.title}
                            </div>
                          )}
                        </div>
                      )})
                    ) : (
                      <p className="text-gray-500 text-sm text-center italic py-4">কোনো কন্টেন্ট নেই</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">কোনো তথ্য পাওয়া যায়নি।</div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex justify-end">
              <button onClick={() => setVersionToView(null)} className="px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 text-sm rounded-lg transition-colors">
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
