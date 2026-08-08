import { useState, useMemo, useRef, useEffect } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragOverlay
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSettings } from '../context/SettingsContext'
import { useWorkflow } from '../context/WorkflowContext'
import { useLanguage } from '../context/LanguageContext'
import { GripVertical, Eye, EyeOff, Save, CheckCircle, FileText, X, ChevronDown } from 'lucide-react'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })
}

function MediaThumbnail({ coverImage, videoUrl, className = "w-14 h-10" }) {
  if (coverImage && !coverImage.includes('unsplash.com')) {
    const src = coverImage.startsWith('/uploads') ? `http://localhost:5001${coverImage}` : coverImage
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
    <div className={`${className} bg-gray-100 dark:bg-slate-800 rounded-lg flex-shrink-0`} />
  )
}

const PAGE_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-teal-100 text-teal-700 border-teal-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-green-100 text-green-700 border-green-200',
]

// ── Page Selector Popover ──
function PageSelector({ item, positions, onPageChange, onClose, t }) {
  const ref = useRef(null)
  const selected = item.pages || []
  const MAX = 3

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const toggle = (pageName) => {
    if (selected.includes(pageName)) {
      onPageChange(item.id, selected.filter((p) => p !== pageName))
    } else {
      if (selected.length >= MAX) return
      onPageChange(item.id, [...selected, pageName])
    }
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl w-52 py-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 pb-2 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">{t.selectPageTitle}</p>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
          selected.length >= MAX ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
        }`}>
          {selected.length}/{MAX}
        </span>
      </div>

      {selected.length >= MAX && (
        <div className="mx-3 mt-2 px-2.5 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-xs text-orange-600">{t.maxPages}</p>
        </div>
      )}

      <div className="mt-1.5 space-y-0.5 px-1.5">
        {positions.map((pos, i) => {
          const isSelected = selected.includes(pos.name)
          const isDisabled = !isSelected && selected.length >= MAX
          return (
            <button
              key={pos.id}
              onClick={() => toggle(pos.name)}
              disabled={isDisabled}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs transition-colors text-left ${
                isSelected
                  ? 'bg-blue-50 text-blue-700'
                  : isDisabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800'
              }`}
            >
              <span className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-all ${
                isSelected
                  ? 'bg-blue-600 border-blue-600'
                  : isDisabled
                  ? 'border-gray-200 dark:border-slate-700'
                  : 'border-gray-300 dark:border-slate-600'
              }`}>
                {isSelected && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PAGE_COLORS[i % PAGE_COLORS.length].split(' ')[0]}`} />
              {pos.name}
            </button>
          )
        })}
      </div>

      {selected.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800 px-3">
          <button
            onClick={() => onPageChange(item.id, [])}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
          >
            <X size={11} /> {t.removeAll}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Sortable Item ──
function SortableNewsItem({ item, index, onToggleVisible, onPageChange, positions, t }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: item.id })

  const [showPageSelector, setShowPageSelector] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
  }

  const selectedPages = item.pages || []

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-slate-900 border rounded-xl px-3 py-2.5 group transition-colors ${
        isDragging ? 'border-blue-400 shadow-lg' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:border-slate-600'
      } ${!item.visible ? 'opacity-50' : ''}`}
    >
      {/* Main row */}
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-xs font-semibold flex items-center justify-center flex-shrink-0">
          {index + 1}
        </span>

        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-300 hover:text-gray-500 dark:text-slate-400 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
        >
          <GripVertical size={16} />
        </button>

        <MediaThumbnail coverImage={item.thumbnail} videoUrl={item.videoUrl} className="w-14 h-10" />

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-gray-800 dark:text-slate-200 truncate ${!item.visible ? 'line-through text-gray-400 dark:text-slate-500' : ''}`}>
            {item.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400 dark:text-slate-500">{item.date}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
              {t.published}
            </span>
          </div>
        </div>

        {/* Page assign button */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowPageSelector(!showPageSelector)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              selectedPages.length > 0
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 hover:text-gray-700 dark:text-slate-300'
            }`}
          >
            <FileText size={12} />
            {selectedPages.length > 0 ? (
              <span>{selectedPages.length}{t.pages}</span>
            ) : (
              <span>{t.assignPage}</span>
            )}
            <ChevronDown size={11} className={`transition-transform ${showPageSelector ? 'rotate-180' : ''}`} />
          </button>

          {showPageSelector && (
            <PageSelector
              item={item}
              positions={positions}
              onPageChange={onPageChange}
              onClose={() => setShowPageSelector(false)}
              t={t}
            />
          )}
        </div>

        {/* Visibility toggle */}
        <button
          onClick={() => onToggleVisible(item.id)}
          title={item.visible ? 'এই পেজ থেকে সরান' : 'এই পেজে দেখান'}
          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
            item.visible
              ? 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800'
              : 'text-gray-300 hover:text-green-600 hover:bg-green-50'
          }`}
        >
          {item.visible ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>
      </div>

      {/* Page badges row */}
      {selectedPages.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2 pl-[calc(1.5rem+0.75rem+1rem+3.5rem+0.75rem)] flex-wrap">
          {selectedPages.map((page, i) => (
            <span
              key={page}
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${PAGE_COLORS[
                positions.findIndex((p) => p.name === page) % PAGE_COLORS.length
              ]}`}
            >
              {page}
              <button
                onClick={() => onPageChange(item.id, selectedPages.filter((p) => p !== page))}
                className="opacity-60 hover:opacity-100 ml-0.5"
              >
                <X size={9} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Drag Overlay Card ──
function DragCard({ item }) {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border-2 border-blue-400 rounded-xl px-3 py-2.5 shadow-2xl w-[460px]">
      <GripVertical size={16} className="text-blue-400" />
      <MediaThumbnail coverImage={item.thumbnail} videoUrl={item.videoUrl} className="w-14 h-10" />
      <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate flex-1">{item.title}</p>
    </div>
  )
}

// ── Main Page ──
export default function NewsSort() {
  const { categories, positions, newsOrders, updateNewsOrders } = useSettings()
  const { assignments } = useWorkflow()
  const { t } = useLanguage()
  const [selectedCat, setSelectedCat] = useState('প্রচ্ছদ')

  // Workflow থেকে publish হওয়া সব আর্টিকেল বের করে ক্যাটাগরি অনুযায়ী গ্রুপ করা
  const publishedByCategory = useMemo(() => {
    const map = {}
    categories.forEach((c) => { map[c.name] = [] })

    assignments
      .filter((a) => a.status === 'published')
      .forEach((a) => {
        const cats = a.categories?.length ? [...a.categories] : [a.category].filter(Boolean)
        
        // All published articles should show in 'প্রচ্ছদ' tab by default
        if (!cats.includes('প্রচ্ছদ')) {
          cats.push('প্রচ্ছদ')
        }

        // If it has 'ভিডিও' in newsPositions, ensure it shows in 'ভিডিও' tab
        if (a.newsPositions?.includes('ভিডিও') && !cats.includes('ভিডিও')) {
          cats.push('ভিডিও')
        }

        cats.forEach((cat) => {
          if (!map[cat]) map[cat] = []
          const thumb = a.articleData?.coverImagePreview || a.thumbnail || ''
          map[cat].push({
            id: a.id,
            title: a.title,
            date: formatDate(a.publishedAt || a.createdAt),
            thumbnail: thumb.startsWith('/uploads') ? `http://localhost:5001${thumb}` : thumb,
            videoUrl: a.articleData?.videoUrl || '',
            visible: true,
            pages: [],
          })
        })
      })

    // Apply saved sorting and visibility
    Object.keys(map).forEach(cat => {
      const savedOrder = newsOrders?.[cat] || []
      if (savedOrder.length > 0) {
        // Map saved configuration
        const savedMap = {}
        savedOrder.forEach((s, idx) => {
          savedMap[s.id] = { index: idx, visible: s.visible !== false, pages: s.pages || [] }
        })
        
        // Apply visibility and pages
        map[cat] = map[cat].map(n => {
          if (savedMap[n.id]) {
            return { ...n, visible: savedMap[n.id].visible, pages: savedMap[n.id].pages }
          }
          return n
        })

        // Sort: items not in savedOrder (newest) come FIRST, followed by ordered items
        map[cat].sort((a, b) => {
          const idxA = savedMap[a.id] !== undefined ? savedMap[a.id].index : -1
          const idxB = savedMap[b.id] !== undefined ? savedMap[b.id].index : -1
          
          if (idxA === -1 && idxB !== -1) return -1 // a is new, comes first
          if (idxA !== -1 && idxB === -1) return 1  // b is new, comes first
          if (idxA === -1 && idxB === -1) return 0  // both new, keep original order (createdAt desc)
          return idxA - idxB // both saved, sort by saved index
        })
      }
    })

    return map
  }, [assignments, categories, newsOrders])

  const [newsByCategory, setNewsByCategory] = useState(publishedByCategory)

  // assignments পরিবর্তনের সাথে sync রাখতে merge ফাংশন
  const syncedNewsByCategory = useMemo(() => {
    const merged = {}
    Object.keys(publishedByCategory).forEach((cat) => {
      const existing = newsByCategory[cat] || []
      const fresh = publishedByCategory[cat]
      const existingIds = new Set(existing.map((n) => n.id))
      const newOnes = fresh.filter((n) => !existingIds.has(n.id))
      const stillPublished = existing.filter((n) => fresh.some((f) => f.id === n.id))
      merged[cat] = [...newOnes, ...stillPublished]
    })
    return merged
  }, [publishedByCategory, newsByCategory])

  const [activeId, setActiveId] = useState(null)
  const [saved, setSaved] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const currentNews = syncedNewsByCategory[selectedCat] || []
  const activeItem = currentNews.find((n) => n.id === activeId)

  const handleDragStart = ({ active }) => setActiveId(active.id)

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    setNewsByCategory((prev) => {
      const items = syncedNewsByCategory[selectedCat]
      const oldIdx = items.findIndex((n) => n.id === active.id)
      const newIdx = items.findIndex((n) => n.id === over.id)
      return { ...prev, [selectedCat]: arrayMove(items, oldIdx, newIdx) }
    })
  }

  const handleToggleVisible = (id) => {
    setNewsByCategory((prev) => {
      const items = syncedNewsByCategory[selectedCat]
      return {
        ...prev,
        [selectedCat]: items.map((n) =>
          n.id === id ? { ...n, visible: !n.visible } : n
        ),
      }
    })
  }

  const handlePageChange = (id, pages) => {
    setNewsByCategory((prev) => {
      const items = syncedNewsByCategory[selectedCat]
      return {
        ...prev,
        [selectedCat]: items.map((n) =>
          n.id === id ? { ...n, pages } : n
        ),
      }
    })
  }

  const handleSave = async () => {
    // Extract only ID and visibility to keep the settings payload small
    const ordersToSave = {}
    Object.keys(syncedNewsByCategory).forEach(cat => {
      ordersToSave[cat] = syncedNewsByCategory[cat].map(n => ({ id: n.id, visible: n.visible, pages: n.pages }))
    })
    const ok = await updateNewsOrders(ordersToSave)
    if (ok !== false) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  const visibleCount = currentNews.filter((n) => n.visible).length
  const assignedPageCount = currentNews.filter((n) => n.pages?.length > 0).length

  return (
    <div className="max-w-2xl space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t.sortNews}</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{t.sortDesc}</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-all ${
            saved
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {saved ? <><CheckCircle size={14} /> {t.saved}</> : <><Save size={14} /> {t.save}</>}
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => {
          const items = syncedNewsByCategory[cat.name] || []
          const count = items.filter((n) => n.visible).length
          const total = items.length
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCat === cat.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-700'
              }`}
            >
              {t[cat.name] || cat.name}
              {total > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  selectedCat === cat.name ? 'bg-blue-500 text-blue-100' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                }`}>
                  {count}/{total}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-2">
        <span>
          <span className="font-medium text-gray-700 dark:text-slate-300">{t[selectedCat] || selectedCat}</span>
          &nbsp;— {currentNews.length}{t.total} &nbsp;·&nbsp; {visibleCount}{t.visible}
          {assignedPageCount > 0 && (
            <>&nbsp;·&nbsp; <span className="text-blue-600 font-medium">{assignedPageCount}{t.pageAssigned}</span></>
          )}
        </span>
        <span className="text-gray-400 dark:text-slate-500">{t.clickPageBtn}</span>
      </div>

      {/* Sortable List */}
      {currentNews.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
          <p className="text-sm text-gray-400 dark:text-slate-500">{t.noNewsInCategory}</p>
          <p className="text-xs text-gray-300 mt-1">{t.publishFromWorkflow}</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={currentNews.map((n) => n.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {currentNews.map((item, index) => (
                <SortableNewsItem
                  key={item.id}
                  item={item}
                  index={index}
                  onToggleVisible={handleToggleVisible}
                  onPageChange={handlePageChange}
                  positions={positions}
                  t={t}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeItem ? <DragCard item={activeItem} /> : null}
          </DragOverlay>
        </DndContext>
      )}

    </div>
  )
}
