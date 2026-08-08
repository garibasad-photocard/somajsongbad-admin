import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { useSettings } from '../../context/SettingsContext'
import { useWorkflow } from '../../context/WorkflowContext'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { mockArticles } from '../../data/articles'
import {
  Bold, Italic, List, ListOrdered, Heading2,
  Quote, Link2, Save, Eye, ArrowLeft, Upload,
  Plus, Trash2, Highlighter, Code, Newspaper, FileText,
  X, Search, GripVertical, Image as ImageIcon, FolderOpen, Mic, History, MessageSquare, LayoutTemplate, Sparkles, Printer, Video
} from 'lucide-react'
import api from '../../services/api'
import SearchableSelect from '../../components/SearchableSelect'
import AIAssistantModal from '../../components/Articles/AIAssistantModal'
import SocialCardGenerator from '../../components/Articles/SocialCardGenerator'
import { bdLocations } from '../../utils/bdLocations'
import ImageCropperModal from '../../components/Media/ImageCropperModal'
import OnlineArticlePreviewModal from '../../components/Modals/OnlineArticlePreviewModal'

// ── Shared Media Library (localStorage) ──
const DEFAULT_MEDIA = [
  { id: 1, name: 'dhaka-skyline.jpg', url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?w=400', size: '1.2 MB', date: '২০ জুন', category: '' },
  { id: 2, name: 'election-banner.jpg', url: 'https://images.unsplash.com/photo-1494172961521-33799ddd43a5?w=400', size: '850 KB', date: '১৯ জুন', category: '' },
  { id: 3, name: 'cricket-team.jpg', url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400', size: '2.1 MB', date: '১৮ জুন', category: '' },
  { id: 4, name: 'flood-relief.jpg', url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=400', size: '1.5 MB', date: '১৭ জুন', category: '' },
  { id: 5, name: 'gold-market.jpg', url: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400', size: '920 KB', date: '১৬ জুন', category: '' },
  { id: 6, name: 'tech-startup.jpg', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400', size: '1.8 MB', date: '১৫ জুন', category: '' },
]

function getMediaLibrary() {
  try {
    const s = localStorage.getItem('cms_media_library')
    return s ? JSON.parse(s) : DEFAULT_MEDIA
  } catch { return DEFAULT_MEDIA }
}

function addToMediaLibrary(item) {
  const lib = getMediaLibrary()
  // avoid duplicates by name
  if (lib.find(m => m.name === item.name)) return
  const updated = [item, ...lib]
  localStorage.setItem('cms_media_library', JSON.stringify(updated))
}

function getUsedImages() {
  try { return JSON.parse(localStorage.getItem('cms_used_images') || '[]') } catch { return [] }
}

function markImageUsed(url) {
  const used = getUsedImages()
  if (!used.includes(url)) {
    localStorage.setItem('cms_used_images', JSON.stringify([...used, url]))
  }
}

// ── Helpers ──
function calculateVisualHash(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    if (!dataUrl.startsWith('blob:') && !dataUrl.startsWith('data:')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 9
      canvas.height = 8
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, 9, 8)
      const data = ctx.getImageData(0, 0, 9, 8).data
      const grays = []
      for (let i = 0; i < data.length; i += 4) {
        grays.push(data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114)
      }
      let hash = ''
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          hash += grays[y * 9 + x] < grays[y * 9 + x + 1] ? '1' : '0'
        }
      }
      resolve(hash)
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

function hammingDistance(h1, h2) {
  if (!h1 || !h2 || h1.length !== h2.length) return 999
  let d = 0
  for (let i = 0; i < h1.length; i++) {
    if (h1[i] !== h2[i]) d++
  }
  return d
}

function FieldLabel({ children }) {
  return <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{children}</label>
}

// ── Voice Typing Button ──
function VoiceButton({ onAppend }) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const shouldListenRef = useRef(false)

  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRec) return
    const recognition = new SpeechRec()
    recognition.continuous = true // Keep listening across sentences
    recognition.interimResults = false
    recognition.lang = 'bn-BD'
    
    recognition.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          let transcript = e.results[i][0].transcript.trim()
          
          // Punctuation mapping
          transcript = transcript.replace(/দাঁড়ি|দাড়ি|দাঁড়ি|দাড়ি|dari/gi, '।')
          transcript = transcript.replace(/কোমা|কমা|comma/gi, ',')
          transcript = transcript.replace(/প্রশ্নবোধক চিহ্ন|প্রশ্নবোধক|question mark/gi, '?')
          transcript = transcript.replace(/বিস্ময়সূচক চিহ্ন|বিস্ময়সূচক চিহ্ন|বিস্ময়সূচক|বিস্ময়সূচক|exclamation mark/gi, '!')
          transcript = transcript.replace(/সেমিকোলন|semicolon/gi, ';')
          transcript = transcript.replace(/কোলন|colon/gi, ':')

          onAppend(transcript)
        }
      }
    }
    
    recognition.onend = () => {
      // Browser stopped listening (either due to silence or manual stop)
      setIsListening(false)
      shouldListenRef.current = false
    }
    
    recognition.onerror = (e) => {
      console.log('Speech error:', e.error)
      setIsListening(false)
      shouldListenRef.current = false
    }
    
    recognitionRef.current = recognition
    
    return () => {
      shouldListenRef.current = false
      if (recognitionRef.current) recognitionRef.current.stop()
    }
  }, [onAppend])

  const toggle = () => {
    if (isListening) {
      shouldListenRef.current = false
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      shouldListenRef.current = true
      try { recognitionRef.current?.start() } catch(e) {}
      setIsListening(true)
    }
  }

  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) return null

  return (
    <button type="button" onClick={toggle} title="ভয়েস টাইপিং"
      className={`p-1 rounded-full transition-colors flex-shrink-0 ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800'}`}>
      <Mic size={14} />
    </button>
  )
}

// ── Media Picker Modal ──
function MediaPickerModal({ onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const [media, setMedia] = useState(getMediaLibrary)
  const [confirm, setConfirm] = useState(null) // { url, name }
  const usedImages = getUsedImages()

  const filtered = media.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))

  const handleClick = (m) => {
    if (usedImages.includes(m.url)) {
      setConfirm(m)
    } else {
      markImageUsed(m.url)
      onSelect(m.url)
      onClose()
    }
  }

  const handleConfirm = () => {
    markImageUsed(confirm.url)
    onSelect(confirm.url)
    setConfirm(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ImageIcon size={16} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">মিডিয়া লাইব্রেরি থেকে ছবি বেছুন</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:text-slate-300"><X size={18} /></button>
        </div>
        <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-500" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="মিডিয়া খুঁজুন..." autoFocus
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="p-4 grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {filtered.map(m => {
            const isUsed = usedImages.includes(m.url)
            return (
              <button key={m.id} onClick={() => handleClick(m)}
                className={`relative rounded-xl overflow-hidden border-2 transition-all text-left hover:border-blue-500 hover:shadow-md hover:scale-[1.02] ${
                  isUsed ? 'border-amber-300' : 'border-gray-200 dark:border-slate-700'
                }`}>
                <img src={m.url} alt={m.name} className="w-full h-28 object-cover" />
                {isUsed && (
                  <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    ব্যবহৃত
                  </div>
                )}
                {m.category && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {m.category}
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs text-gray-700 dark:text-slate-300 truncate font-medium">{m.name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">{m.size} · {m.date}</p>
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && <p className="col-span-3 text-center py-8 text-sm text-gray-400 dark:text-slate-500">কোনো মিডিয়া পাওয়া যায়নি</p>}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 rounded-b-xl flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> ব্যবহৃত ছবি</span>
          <span className="flex items-center gap-1 text-[10px] text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span> ক্যাটাগরি ট্যাগ</span>
          <p className="text-xs text-gray-400 dark:text-slate-500 ml-auto">ছবিতে ক্লিক করে বেছুন</p>
        </div>
      </div>

      {/* Duplicate confirmation dialog */}
      {confirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]" onClick={() => setConfirm(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-600 text-sm">⚠️</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">ছবি আগেই ব্যবহৃত হয়েছে</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{confirm.name}</p>
              </div>
            </div>
            <div className="p-5">
              <img src={confirm.url} alt={confirm.name} className="w-full h-32 object-cover rounded-xl mb-3" />
              <p className="text-sm text-gray-700 dark:text-slate-300">এই ছবিটি আগে অন্য একটি আর্টিকেলে ব্যবহার করা হয়েছে। আবার ব্যবহার করতে চান?</p>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800 flex gap-2 justify-end">
              <button onClick={() => setConfirm(null)}
                className="text-sm text-gray-500 dark:text-slate-400 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800">না, বাদ দিন</button>
              <button onClick={handleConfirm}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">হ্যাঁ, ব্যবহার করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
function InputField({ label, ...props }) {
  const [cursorPos, setCursorPos] = useState(0)
  const val = props.value || ''
  
  const handleSelect = (e) => setCursorPos(e.target.selectionStart || 0)
  const handleChange = (e) => {
    setCursorPos(e.target.selectionStart || 0)
    if (props.onChange) props.onChange(e)
  }

  const textBefore = val.slice(0, cursorPos)
  const textAfter = val.slice(cursorPos)
  const wordsBefore = textBefore.trim().split(/\s+/).filter(Boolean).length
  const wordsAfter = textAfter.trim().split(/\s+/).filter(Boolean).length
  const totalWords = wordsBefore + wordsAfter
  const totalChars = val.length

  const handleVoiceAppend = (text) => {
    const prefix = (textBefore && !textBefore.endsWith(' ') && !textBefore.endsWith('\n')) ? ' ' : ''
    const suffix = (textAfter && !textAfter.startsWith(' ') && !textAfter.startsWith('\n')) ? ' ' : ''
    const newVal = textBefore + prefix + text + suffix + textAfter
    if (props.onChange) props.onChange({ target: { value: newVal } })
    setCursorPos(textBefore.length + prefix.length + text.length)
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-1">
        <div className="flex items-center gap-1.5">
          <FieldLabel>{label}</FieldLabel>
          <VoiceButton onAppend={handleVoiceAppend} />
        </div>
        <span className="text-[10px] text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
          শব্দ: <strong>{totalWords}</strong> | বর্ণ: <strong>{totalChars}</strong> | আগে: <strong>{wordsBefore}</strong> | পরে: <strong>{wordsAfter}</strong>
        </span>
      </div>
      <textarea 
        {...props} 
        rows={props.rows || 1}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyUp={handleSelect}
        onClick={handleSelect}
        className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 resize-y min-h-[42px] overflow-auto" 
      />
    </div>
  )
}
function TextAreaField({ label, rows = 3, ...props }) {
  const [cursorPos, setCursorPos] = useState(0)
  const val = props.value || ''
  
  const handleSelect = (e) => setCursorPos(e.target.selectionStart || 0)
  const handleChange = (e) => {
    setCursorPos(e.target.selectionStart || 0)
    if (props.onChange) props.onChange(e)
  }

  const textBefore = val.slice(0, cursorPos)
  const textAfter = val.slice(cursorPos)
  const wordsBefore = textBefore.trim().split(/\s+/).filter(Boolean).length
  const wordsAfter = textAfter.trim().split(/\s+/).filter(Boolean).length
  const totalWords = wordsBefore + wordsAfter
  const totalChars = val.length

  const handleVoiceAppend = (text) => {
    const prefix = (textBefore && !textBefore.endsWith(' ') && !textBefore.endsWith('\n')) ? ' ' : ''
    const suffix = (textAfter && !textAfter.startsWith(' ') && !textAfter.startsWith('\n')) ? ' ' : ''
    const newVal = textBefore + prefix + text + suffix + textAfter
    if (props.onChange) props.onChange({ target: { value: newVal } })
    setCursorPos(textBefore.length + prefix.length + text.length)
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-1">
        <div className="flex items-center gap-1.5">
          <FieldLabel>{label}</FieldLabel>
          <VoiceButton onAppend={handleVoiceAppend} />
        </div>
        <span className="text-[10px] text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
          শব্দ: <strong>{totalWords}</strong> | বর্ণ: <strong>{totalChars}</strong> | আগে: <strong>{wordsBefore}</strong> | পরে: <strong>{wordsAfter}</strong>
        </span>
      </div>
      <textarea 
        {...props} 
        rows={rows}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyUp={handleSelect}
        onClick={handleSelect}
        className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 resize-y min-h-[80px] overflow-auto" 
      />
    </div>
  )
}

function SelectField({ label, value, onChange, children }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select value={value} onChange={onChange} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        {children}
      </select>
    </div>
  )
}

// ── Multi-Select Dropdown ──
function SortableChip({ id, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  
  return (
    <span 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 border border-blue-200 cursor-grab active:cursor-grabbing"
    >
      <GripVertical size={10} className="opacity-50" />
      {id}
      <button 
        type="button" 
        onClick={(e) => { e.stopPropagation(); onRemove(id) }} 
        onPointerDown={(e) => e.stopPropagation()}
        className="hover:text-blue-900 focus:outline-none ml-0.5"
      >
        <X size={10} />
      </button>
    </span>
  )
}

function MultiSelectDropdown({ label, options, selected, onChange, max = 3 }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  
  const toggle = (val) => {
    if (selected.includes(val)) onChange(selected.filter((v) => v !== val))
    else if (selected.length < max) onChange([...selected, val])
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = selected.indexOf(active.id)
      const newIndex = selected.indexOf(over.id)
      onChange(arrayMove(selected, oldIndex, newIndex))
    }
  }

  return (
    <div className="relative" ref={ref}>
      <FieldLabel>{label}</FieldLabel>
      <div 
        onClick={() => setOpen(!open)}
        className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 cursor-pointer min-h-[38px] flex flex-wrap gap-1.5 items-center"
      >
        {selected.length === 0 ? (
          <span className="text-gray-400 dark:text-slate-500">পজিশন বেছে নিন (সর্বোচ্চ {max}টি)</span>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={selected} strategy={horizontalListSortingStrategy}>
              {selected.map((s) => (
                <SortableChip key={s} id={s} onRemove={toggle} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-2 space-y-0.5 max-h-56 overflow-y-auto">
          {selected.length >= max && (
            <p className="text-[10px] text-orange-600 px-2 py-1 mb-1 bg-orange-50 rounded">সর্বোচ্চ {max}টি পজিশন বেছে নেওয়া যাবে</p>
          )}
          {options.filter(opt => opt.isActive !== false).map((opt) => {
            const isSelected = selected.includes(opt.name)
            const isDisabled = !isSelected && selected.length >= max
            return (
              <label key={opt.id} className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800 cursor-pointer'}`}>
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  onChange={() => toggle(opt.name)}
                  disabled={isDisabled}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className={`text-sm ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-700 dark:text-slate-300'}`}>{opt.name}</span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── YouTube ID ──
function getYoutubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  return m ? m[1] : null
}
function getEmbedType(url) {
  if (!url) return null
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('facebook.com')) return 'facebook'
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter'
  if (url.includes('instagram.com')) return 'instagram'
  return 'other'
}

// ── Toolbar Button ──
function TB({ onClick, active, title, children }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={`p-1.5 rounded transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800'}`}>
      {children}
    </button>
  )
}

function TextBlock({ block, onChange, onDelete, onAddBelow }) {
  const { user } = useAuth()
  const [stats, setStats] = useState({ totalWords: 0, totalChars: 0, wordsBefore: 0, wordsAfter: 0 })
  const [showComment, setShowComment] = useState(false)
  const [newComment, setNewComment] = useState('')

  const updateStats = (ed) => {
    const text = ed.getText()
    const { from } = ed.state.selection
    
    // Using simple substring on plain text
    const textBefore = text.slice(0, from)
    const textAfter = text.slice(from)
    
    const wordsBefore = textBefore.trim().split(/\s+/).filter(Boolean).length
    const wordsAfter = textAfter.trim().split(/\s+/).filter(Boolean).length
    
    setStats({
      totalWords: wordsBefore + wordsAfter,
      totalChars: text.length,
      wordsBefore,
      wordsAfter
    })
  }

  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false })],
    content: block.content || '<p></p>',
    onUpdate: ({ editor }) => {
      onChange(block.id, editor.getHTML())
      updateStats(editor)
    },
    onSelectionUpdate: ({ editor }) => {
      updateStats(editor)
    }
  })

  return (
    <div className="group relative border border-transparent hover:border-gray-200 dark:border-slate-700 rounded-xl">
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 rounded-t-xl transition-colors">
        <VoiceButton onAppend={(text) => editor?.commands.insertContent(' ' + text + ' ')} />
        <div className="w-px h-4 bg-gray-300 dark:bg-slate-700 mx-1"></div>
        <TB title="Bold" active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={13} /></TB>
        <TB title="Italic" active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={13} /></TB>
        <TB title="H2" active={editor?.isActive('heading', { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={13} /></TB>
        <TB title="Bullet" active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={13} /></TB>
        <TB title="Ordered" active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={13} /></TB>
        <TB title="Quote" active={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote size={13} /></TB>
        <TB title="Link" onClick={() => { const u = prompt('লিংক:'); if (u) editor?.chain().focus().setLink({ href: u }).run() }}><Link2 size={13} /></TB>
        <div className="flex-1" />
        <TB title="Comment" onClick={() => setShowComment(!showComment)}>
          <MessageSquare size={13} className={block.editorComment || (block.comments && block.comments.length > 0) ? "text-amber-500" : ""} />
        </TB>
        <button onClick={() => onDelete(block.id)} className="p-1 text-gray-300 hover:text-red-500 rounded"><Trash2 size={13} /></button>
      </div>
      
      {showComment && (
        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 border-b border-amber-100 dark:border-amber-800/30 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={14} />
              <span>ইন-আর্টিকেল প্যারাগ্রাফ কমেন্ট ও অ্যানোটেশন</span>
            </h4>
            <span className="text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded font-bold">
              এডিটর ও রিপোর্টার কোলাবোরেশন
            </span>
          </div>

          {/* Comments List */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {(block.comments || []).length === 0 ? (
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70 italic py-1">কোনো কমেন্ট নেই। নতুন কমেন্ট যোগ করুন নিচে।</p>
            ) : (
              (block.comments || []).map(c => (
                <div key={c.id || Math.random()} className={`p-3 rounded-2xl border transition-all space-y-1.5 ${c.resolved ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50' : 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-700/50 shadow-sm'}`}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                      <span>👤</span> {c.authorName || 'এডিটর'}
                    </span>
                    <span className="text-gray-400 dark:text-slate-500">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-slate-300 font-medium pl-1">{c.text}</p>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        const updatedComments = (block.comments || []).map(item => item.id === c.id ? { ...item, resolved: !item.resolved } : item);
                        onChange(block.id, { comments: updatedComments });
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 ${c.resolved ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
                    >
                      {c.resolved ? '✅ সমাধান হয়েছে (Resolved)' : '⚠️ সমাধান করুন (Resolve)'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Input */}
          <div className="flex gap-2 pt-2 border-t border-amber-200/50 dark:border-amber-800/50">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="নির্দিষ্ট এই প্যারাগ্রাফের ওপর কমেন্ট লিখুন..."
              className="flex-1 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700/50 rounded-xl px-3 py-1.5 text-xs text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={() => {
                if (!newComment.trim()) return;
                const newObj = {
                  id: Date.now(),
                  text: newComment.trim(),
                  authorName: user?.name || 'এডিটর',
                  author: user?._id || null,
                  resolved: false,
                  createdAt: new Date().toISOString()
                };
                onChange(block.id, { comments: [...(block.comments || []), newObj] });
                setNewComment('');
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-1.5 rounded-xl transition-all shadow-sm"
            >
              কমেন্ট যোগ করুন
            </button>
          </div>

          {/* Legacy Editor Note */}
          <div className="pt-2 border-t border-amber-200/50 dark:border-amber-800/50">
            <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">সাধারণ এডিটর নোট / লিগ্যাসি কমেন্ট</label>
            <textarea
              value={block.editorComment || ''}
              onChange={(e) => onChange(block.id, { editorComment: e.target.value })}
              placeholder="রিপোর্টারকে কোনো সাধারণ ফিডব্যাক দিতে এখানে লিখুন..."
              className="w-full text-xs text-gray-800 dark:text-slate-200 bg-white/50 dark:bg-slate-800/50 border border-amber-200/80 dark:border-amber-700/50 rounded-xl p-2.5 placeholder-amber-300 focus:outline-none resize-y min-h-[60px] overflow-auto"
              rows={2}
            />
          </div>
        </div>
      )}

      <EditorContent editor={editor}
        className="prose prose-sm max-w-none px-4 py-3 min-h-[120px] resize-y overflow-auto [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[100px]" />
      
      <div className="px-4 pb-2 flex justify-end opacity-50 hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
          শব্দ: <strong>{stats.totalWords}</strong> | বর্ণ: <strong>{stats.totalChars}</strong> | আগে: <strong>{stats.wordsBefore}</strong> | পরে: <strong>{stats.wordsAfter}</strong>
        </span>
      </div>

      <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <AddBlockMenu onAdd={(type) => onAddBelow(block.id, type)} />
      </div>
    </div>
  )
}

// ── Highlight Block ──
function HighlightBlock({ block, onChange, onDelete, onAddBelow }) {
  return (
    <div className="group relative">
      <div className="border-l-4 border-red-500 bg-red-50 rounded-r-xl px-4 py-3 space-y-2">
        <div className="flex items-start gap-2">
          <Highlighter size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <textarea
            value={block.text}
            onChange={(e) => onChange(block.id, { text: e.target.value })}
            placeholder="হাইলাইট উদ্ধৃতি লিখুন..."
            rows={2}
            className="flex-1 text-sm font-medium text-gray-800 dark:text-slate-200 italic bg-transparent focus:outline-none resize-none placeholder-red-300"
          />
          <button onClick={() => onDelete(block.id)} className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={13} /></button>
        </div>
        <input
          value={block.attribution || ''}
          onChange={(e) => onChange(block.id, { attribution: e.target.value })}
          placeholder="— দায়িত্বশীল ব্যক্তি (ঐচ্ছিক)"
          className="w-full text-xs text-gray-500 dark:text-slate-400 bg-transparent focus:outline-none border-t border-red-200 pt-2 placeholder-red-300"
        />
      </div>
      <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <AddBlockMenu onAdd={(type) => onAddBelow(block.id, type)} />
      </div>
    </div>
  )
}

// ── Embed Block ──
function EmbedBlock({ block, onChange, onDelete, onAddBelow }) {
  const type = getEmbedType(block.url || '')
  const ytId = type === 'youtube' ? getYoutubeId(block.url) : null

  return (
    <div className="group relative border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800">
        <Code size={13} className="text-purple-500" />
        <span className="text-xs font-medium text-gray-600 dark:text-slate-400">এম্বেড</span>
        <div className="flex-1" />
        <button onClick={() => onDelete(block.id)} className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={13} /></button>
      </div>
      <div className="p-3 space-y-2">
        <input
          value={block.url || ''}
          onChange={(e) => onChange(block.id, { url: e.target.value })}
          placeholder="YouTube, Facebook, Twitter/X, Instagram URL..."
          className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <input
          value={block.caption || ''}
          onChange={(e) => onChange(block.id, { caption: e.target.value })}
          placeholder="ক্যাপশন (ঐচ্ছিক)..."
          className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-600 dark:text-slate-400"
        />
        {block.url && ytId && (
          <div className="rounded-lg overflow-hidden">
            <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-48" allowFullScreen title="yt" />
          </div>
        )}
        {block.url && !ytId && type && type !== 'youtube' && (
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-600 font-medium capitalize">{type} এম্বেড</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 truncate">{block.url}</p>
          </div>
        )}
      </div>
      <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <AddBlockMenu onAdd={(type) => onAddBelow(block.id, type)} />
      </div>
    </div>
  )
}

// ── Pdf Block ──
function PdfBlock({ block, onChange, onDelete, onAddBelow }) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const { media } = res.data
      onChange(block.id, { pdfUrl: media.url && media.url.startsWith('http') ? media.url : `https://somajsongbad-backend.onrender.com${media.url}`, pdfName: file.name })
    } catch (err) {
      console.error(err)
      alert('পিডিএফ আপলোড ব্যর্থ হয়েছে।')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="group relative border border-red-200 rounded-xl overflow-hidden bg-white dark:bg-slate-900 mb-4">
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-slate-800 border-b border-red-100 dark:border-slate-700">
        <FileText size={13} className="text-red-500" />
        <span className="text-xs font-medium text-red-700 dark:text-red-400">পিডিএফ ডকুমেন্ট</span>
        <div className="flex-1" />
        <button onClick={() => onDelete(block.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={13} /></button>
      </div>
      <div className="p-4 flex flex-col gap-3">
        {block.pdfUrl ? (
          <div className="flex flex-col gap-2">
             <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
               <FileText className="text-red-600" size={24} />
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-semibold text-red-900 truncate">{block.pdfName || 'Document.pdf'}</p>
                 <a href={block.pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-red-600 hover:underline">ভিউ করুন</a>
               </div>
               <button onClick={() => onChange(block.id, { pdfUrl: '', pdfName: '' })} className="text-red-400 hover:text-red-600" title="রিমুভ করুন">
                 <Trash2 size={16} />
               </button>
             </div>
             <iframe src={block.pdfUrl} className="w-full h-[500px] border rounded-lg" title="PDF Preview" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-red-200 dark:border-slate-700 rounded-lg bg-red-50/50 dark:bg-slate-800/50">
            <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleUpload} disabled={uploading} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex flex-col items-center gap-2 text-red-500 hover:text-red-600 transition-colors">
              <Upload size={24} />
              <span className="text-sm font-medium">{uploading ? 'আপলোড হচ্ছে...' : 'পিডিএফ ফাইল আপলোড করুন'}</span>
            </button>
          </div>
        )}
      </div>
      <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <AddBlockMenu onAdd={(type) => onAddBelow(block.id, type)} />
      </div>
    </div>
  )
}

// ── Related News Block ──
function RelatedBlock({ block, onDelete, onAddBelow }) {
  return (
    <div className="group relative border border-blue-200 rounded-xl overflow-hidden bg-blue-50">
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 border-b border-blue-200">
        <Newspaper size={13} className="text-blue-600" />
        <span className="text-xs font-medium text-blue-700">আরও পড়ুন</span>
        <div className="flex-1" />
        <button onClick={() => onDelete(block.id)} className="p-1 text-blue-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={13} /></button>
      </div>
      <div className="flex items-center gap-3 px-3 py-3">
        {block.thumbnail && (
          <img src={block.thumbnail} alt="" className="w-20 h-14 object-cover rounded-lg flex-shrink-0" />
        )}
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 leading-tight">{block.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-blue-600">{block.category}</span>
            <span className="text-xs text-gray-400 dark:text-slate-500">{block.date}</span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <AddBlockMenu onAdd={(type) => onAddBelow(block.id, type)} />
      </div>
    </div>
  )
}

// ── Add Block Menu ──
function AddBlockMenu({ onAdd }) {
  const [open, setOpen] = useState(false)
  const options = [
    { type: 'text',      icon: <Bold size={13} />,       label: 'টেক্সট' },
    { type: 'highlight', icon: <Highlighter size={13} />, label: 'হাইলাইট' },
    { type: 'embed',     icon: <Code size={13} />,        label: 'এম্বেড' },
    { type: 'pdf',       icon: <FileText size={13} />,    label: 'পিডিএফ' },
    { type: 'related',   icon: <Newspaper size={13} />,   label: 'রিলেটেড নিউজ' },
  ]
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 shadow-sm rounded-full px-2.5 py-0.5 text-xs text-gray-500 dark:text-slate-400 hover:text-blue-600 hover:border-blue-400 transition-colors"
      >
        <Plus size={11} /> ব্লক যোগ
      </button>
      {open && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-20 min-w-[140px]">
          {options.map((o) => (
            <button
              key={o.type}
              onClick={() => { onAdd(o.type); setOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-600 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              {o.icon} {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Related News Picker Modal ──
function RelatedNewsPicker({ onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = mockArticles.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">সম্পর্কিত নিউজ বেছে নিন</h3>
          <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:text-slate-300"><X size={18} /></button>
        </div>
        <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-500" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="নিউজ খুঁজুন..." autoFocus
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
          {filtered.map((a) => (
            <button key={a.id} onClick={() => { onSelect(a); onClose() }}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-blue-50 transition-colors text-left">
              <img src={a.thumbnail} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 dark:text-slate-200 font-medium line-clamp-2">{a.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-blue-600">{a.category}</span>
                  <span className="text-xs text-gray-400 dark:text-slate-500">{a.date}</span>
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-center py-8 text-sm text-gray-400 dark:text-slate-500">কোনো নিউজ পাওয়া যায়নি</p>}
        </div>
      </div>
    </div>
  )
}

// ── Block Editor ──
function BlockEditor({ blocks, setBlocks }) {
  const [relatedPickerFor, setRelatedPickerFor] = useState(null)

  const createBlock = (type) => ({
    id: Date.now() + Math.random(),
    type,
    content: type === 'text' ? '<p></p>' : '',
    text: '',
    url: '',
    caption: '',
    attribution: '',
    pdfUrl: '',
    pdfName: '',
  })

  const addBlockBelow = (afterId, type) => {
    if (type === 'related') { setRelatedPickerFor(afterId); return }
    const newBlock = createBlock(type)
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === afterId)
      const next = [...prev]
      next.splice(idx + 1, 0, newBlock)
      return next
    })
  }

  const updateBlock = (id, changes) => {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, ...changes } : b))
  }

  const deleteBlock = (id) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
  }

  const insertRelated = (afterId, article) => {
    const newBlock = { id: Date.now(), type: 'related', ...article }
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === afterId)
      const next = [...prev]
      next.splice(idx + 1, 0, newBlock)
      return next
    })
  }



  return (
    <div className="space-y-6 pb-4">
      {blocks.map((block) => (
        <div key={block.id}>
          {block.type === 'text' && (
            <TextBlock block={block}
              onChange={(id, content) => updateBlock(id, { content })}
              onDelete={deleteBlock}
              onAddBelow={addBlockBelow}
            />
          )}
          {block.type === 'highlight' && (
            <HighlightBlock block={block}
              onChange={(id, changes) => updateBlock(id, changes)}
              onDelete={deleteBlock}
              onAddBelow={addBlockBelow}
            />
          )}
          {block.type === 'embed' && (
            <EmbedBlock block={block}
              onChange={(id, changes) => updateBlock(id, changes)}
              onDelete={deleteBlock}
              onAddBelow={addBlockBelow}
            />
          )}
          {block.type === 'pdf' && (
            <PdfBlock block={block}
              onChange={(id, changes) => updateBlock(id, changes)}
              onDelete={deleteBlock}
              onAddBelow={addBlockBelow}
            />
          )}
          {block.type === 'related' && (
            <RelatedBlock block={block}
              onDelete={deleteBlock}
              onAddBelow={addBlockBelow}
            />
          )}
        </div>
      ))}

      {blocks.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
          <p className="text-sm text-gray-400 dark:text-slate-500 mb-3">এখানে কন্টেন্ট যোগ করুন</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {[
              { type: 'text',      label: 'টেক্সট',       icon: <Bold size={13} /> },
              { type: 'highlight', label: 'হাইলাইট',      icon: <Highlighter size={13} /> },
              { type: 'embed',     label: 'এম্বেড',        icon: <Code size={13} /> },
              { type: 'pdf',       label: 'পিডিএফ',       icon: <FileText size={13} /> },
              { type: 'related',   label: 'রিলেটেড',       icon: <Newspaper size={13} /> },
            ].map((o) => (
              <button key={o.type}
                onClick={() => {
                  if (o.type === 'related') { setRelatedPickerFor('start'); return }
                  setBlocks([createBlock(o.type)])
                }}
                className="flex items-center gap-1.5 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs text-gray-600 dark:text-slate-400 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-colors"
              >
                {o.icon} {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {blocks.length > 0 && (
        <div className="flex justify-center pt-2">
          <AddBlockMenu onAdd={(type) => {
            if (type === 'related') { setRelatedPickerFor('end'); return }
            setBlocks((prev) => [...prev, createBlock(type)])
          }} />
        </div>
      )}

      {relatedPickerFor && (
        <RelatedNewsPicker
          onSelect={(article) => {
            if (relatedPickerFor === 'start') {
              setBlocks([{ id: Date.now(), type: 'related', ...article }])
            } else if (relatedPickerFor === 'end') {
              setBlocks((prev) => [...prev, { id: Date.now(), type: 'related', ...article }])
            } else {
              insertRelated(relatedPickerFor, article)
            }
            setRelatedPickerFor(null)
          }}
          onClose={() => setRelatedPickerFor(null)}
        />
      )}
    </div>
  )
}
function PhotoGalleryBuilder({ gallery, setGallery }) {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  const [photographer, setPhotographer] = useState('');

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUrl(res.data.url);
    } catch (err) {
      console.error(err);
      alert('ছবি আপলোডে সমস্যা হয়েছে');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAdd = () => {
    if (!url) return alert('দয়া করে ছবির লিংক দিন');
    setGallery([...gallery, { id: Date.now(), url, caption, altText, photographer, order: gallery.length }]);
    setUrl(''); setCaption(''); setAltText(''); setPhotographer('');
  };

  const removePhoto = (id) => {
    setGallery(gallery.filter(g => g.id !== id));
  };

  const updatePhoto = (id, field, value) => {
    setGallery(gallery.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-7 shadow-sm space-y-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b pb-4 flex items-center gap-2">
        <ImageIcon size={20} className="text-blue-500" /> ফটোস্টোরি গ্যালারি
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
        <div className="flex gap-2 w-full">
          <input type="text" placeholder="ছবির লিংক (URL)" value={url} onChange={e => setUrl(e.target.value)} className="flex-1 border p-2 rounded text-sm dark:bg-slate-800 dark:border-slate-600" />
          <label className={`px-4 py-2 rounded text-sm font-medium cursor-pointer flex items-center gap-2 whitespace-nowrap ${isUploading ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
            {isUploading ? 'আপলোড হচ্ছে...' : <><Upload size={16} /> ব্রাউজ</>}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </div>
        <input type="text" placeholder="ক্যাপশন (যা ছবির নিচে দেখাবে)" value={caption} onChange={e => setCaption(e.target.value)} className="w-full border p-2 rounded text-sm dark:bg-slate-800 dark:border-slate-600" />
        <input type="text" placeholder="Alt Text (গুগল এসইও এর জন্য)" value={altText} onChange={e => setAltText(e.target.value)} className="w-full border p-2 rounded text-sm dark:bg-slate-800 dark:border-slate-600" />
        <input type="text" placeholder="ফটোগ্রাফারের নাম" value={photographer} onChange={e => setPhotographer(e.target.value)} className="w-full border p-2 rounded text-sm dark:bg-slate-800 dark:border-slate-600" />
        <div className="md:col-span-2 flex justify-end">
          <button type="button" onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded font-medium flex items-center gap-2 hover:bg-blue-700">
            <Plus size={16} /> ছবিটি যুক্ত করুন
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {gallery.length === 0 ? (
          <div className="text-center p-8 text-gray-400 bg-gray-50 dark:bg-slate-800/20 rounded-xl border border-dashed">
            এখনো কোনো ছবি যুক্ত করা হয়নি
          </div>
        ) : (
          gallery.map((img, idx) => (
            <div key={img.id || idx} className="flex gap-4 p-4 border rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 items-start">
              <img src={img.url} alt={img.altText} className="w-24 h-24 object-cover rounded-lg border bg-gray-100" />
              <div className="flex-1 space-y-3">
                <input type="text" value={img.caption} onChange={e => updatePhoto(img.id, 'caption', e.target.value)} placeholder="ক্যাপশন" className="w-full border p-2 rounded text-sm" />
                <div className="flex gap-4">
                  <input type="text" value={img.altText} onChange={e => updatePhoto(img.id, 'altText', e.target.value)} placeholder="Alt Text" className="w-full border p-2 rounded text-sm" />
                  <input type="text" value={img.photographer} onChange={e => updatePhoto(img.id, 'photographer', e.target.value)} placeholder="ফটোগ্রাফার" className="w-full border p-2 rounded text-sm w-1/3" />
                </div>
              </div>
              <button type="button" onClick={() => removePhoto(img.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── Main ──
export default function PhotoStoryEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const rssData = location.state?.rssData

  const { categories, sources, positions, journalists, enableAiRewrite } = useSettings()
  const { assignments, updateStatus } = useWorkflow()
  const [isRewriting, setIsRewriting] = useState(false)

  const [lockedBy, setLockedBy] = useState(null)
  const [currentId, setCurrentId] = useState(id)
  const [lastSaved, setLastSaved] = useState(null)
  const [submissionTracking, setSubmissionTracking] = useState(null)
  const [cropFile, setCropFile] = useState(null)
  
  const { user } = useAuth()
  const { t } = useLanguage()

  // ── Lock / Unlock Logic ──
  useEffect(() => {
    if (!id) return; // Only lock existing articles

    const lockArticle = async () => {
      try {
        await api.post(`/articles/${id}/lock`);
      } catch (err) {
        if (err.response && err.response.status === 423) {
          setLockedBy(err.response.data.lockedBy || 'Another user');
        }
      }
    };

    lockArticle();

    // Setup heartbeat to keep lock alive every 10 mins
    const interval = setInterval(lockArticle, 10 * 60 * 1000);

    const unlockOnLeave = () => {
      const token = localStorage.getItem('cms_token') || localStorage.getItem('token');
      if (token) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        fetch(`${apiUrl}/articles/${id}/unlock`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          keepalive: true
        }).catch(err => console.error('Unlock failed on leave', err));
      }
    };

    window.addEventListener('beforeunload', unlockOnLeave);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', unlockOnLeave);
      unlockOnLeave();
    };
  }, [id]);
  
  const searchParams = useSearchParams()[0]
  const assignmentId = searchParams.get('assignmentId') || location.state?.assignmentId

  const [edition, setEdition] = useState('online')
  const [photoGallery, setPhotoGallery] = useState([])
  const [title, setTitle] = useState('')
  const [headlineB, setHeadlineB] = useState('')
  const [abTestWinner, setAbTestWinner] = useState(null)
  const [viewsA, setViewsA] = useState(0)
  const [viewsB, setViewsB] = useState(0)
  const [shortHeadline, setShortHeadline] = useState('')
  const [stripHeadline, setStripHeadline] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [byline, setByline] = useState('')
  const [source, setSource] = useState('')
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [division, setDivision] = useState('')
  const [district, setDistrict] = useState('')
  const [upazila, setUpazila] = useState('')
  const [newsPositions, setNewsPositions] = useState([])
  const [tags, setTags] = useState('')
  const [status, setStatus] = useState('draft')
  const [saving, setSaving] = useState(false)
  const [coverImagePreview, setCoverImagePreview] = useState('')
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [duplicateConfirm, setDuplicateConfirm] = useState(null)
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [isAIGenerating, setIsAIGenerating] = useState(false)
  const [assigneeName, setAssigneeName] = useState('')
  const [photoCaption, setPhotoCaption] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoCaption, setVideoCaption] = useState('')
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDesc, setMetaDesc] = useState('')
  const [sharedToFacebook, setSharedToFacebook] = useState(false)
  const [sharedToTwitter, setSharedToTwitter] = useState(false)
  const [sharedToInstagram, setSharedToInstagram] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [enableAudioReader, setEnableAudioReader] = useState(true)
  const [enableComments, setEnableComments] = useState(true)
  const [printPageNumber, setPrintPageNumber] = useState('')
  const [printPlacementTag, setPrintPlacementTag] = useState('')
  const [printReady, setPrintReady] = useState(false)
  const [printPriority, setPrintPriority] = useState(3)
  const [printEditionObj, setPrintEditionObj] = useState({})
  const [showCardGenerator, setShowCardGenerator] = useState(false)
  const [blocks, setBlocks] = useState([
    { id: 1, type: 'text', content: '<p>এখানে আর্টিকেলের মূল লেখা শুরু করুন...</p>' }
  ])

  const handleAiRewrite = async () => {
    const contentText = blocks.filter(b => b.type === 'text').map(b => b.content).join('\n')
    if (!title && !contentText.trim()) {
      alert('রিরাইট করার জন্য শিরোনাম বা বিস্তারিত সংবাদ থাকা প্রয়োজন।')
      return
    }
    setIsRewriting(true)
    try {
      const res = await api.post('/ai/rewrite', {
        title: title || '',
        content: contentText
      })
      if (res.data) {
        if (res.data.headline) setTitle(res.data.headline)
        if (res.data.synopsis) setSynopsis(res.data.synopsis)
        if (res.data.tags && Array.isArray(res.data.tags)) {
          const currentTags = typeof tags === 'string' ? tags.split(',').map(t=>t.trim()).filter(Boolean) : []
          const newTags = res.data.tags.filter(t => !currentTags.includes(t))
          setTags([...currentTags, ...newTags].join(', '))
        }
        if (res.data.news) {
          setBlocks([{ id: Date.now(), type: 'text', content: res.data.news }])
        }
      }
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || 'এআই রিরাইট করতে সমস্যা হয়েছে।')
    } finally {
      setIsRewriting(false)
    }
  }

  // -- Auto Save Logic --
  const payloadRef = useRef({})
  const lastSavedStrRef = useRef('')

  useEffect(() => {
    payloadRef.current = {
      title, headlineB, abTestWinner, shortHeadline, stripHeadline, synopsis, blocks,
      category, subCategory, division, district, upazila,
      newsPositions, source, byline, tags, metaTitle, metaDesc,
      photoCaption, status: 'draft', assigneeName, isPremium, enableAudioReader, enableComments,
      coverImage: coverImagePreview ? coverImagePreview.startsWith('https://somajsongbad-backend.onrender.com') ? coverImagePreview.replace('https://somajsongbad-backend.onrender.com', '') : coverImagePreview : '',
      videoUrl, videoCaption,
      assignmentId,
      edition,
      printEdition: {
        pageNumber: printPageNumber,
        placementTag: printPlacementTag,
        readyForPrint: printReady,
        printPriority: printPriority
      }
    }
  })

  useEffect(() => {
    const t = setTimeout(() => {
      lastSavedStrRef.current = JSON.stringify(payloadRef.current)
    }, 2000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const timer = setInterval(async () => {
      const currentPayload = payloadRef.current
      const currentStr = JSON.stringify(currentPayload)
      
      // Auto save only if there are changes and title is provided (required by DB)
      if (currentStr !== lastSavedStrRef.current && currentPayload.title && currentPayload.title.trim() !== '') {
        try {
          if (currentId) {
            await api.put(`/articles/${currentId}`, currentPayload)
            setLastSaved(new Date())
            lastSavedStrRef.current = currentStr
          } else {
            const res = await api.post('/articles', currentPayload)
            if (res.data && res.data._id) {
              setCurrentId(res.data._id)
              setLastSaved(new Date())
              lastSavedStrRef.current = currentStr
              // Update URL so refreshing doesn't lose the article
              window.history.replaceState(null, '', `/articles/edit/${res.data._id}`)
            }
          }
        } catch (err) {
          console.error('Autosave error', err)
        }
      }
    }, 5000) // 5 seconds
    
    return () => clearInterval(timer)
  }, [currentId])
  // ----------------------

  // Article or Assignment data fetch
  useEffect(() => {
    const fetchData = async () => {
      if (currentId) {
        try {
          const res = await api.get(`/articles/${currentId}`)
          const a = res.data
          if (a.editorialStage && a.editorialStage.submissionTracking) {
            setSubmissionTracking(a.editorialStage.submissionTracking)
          }
          setEdition(a.edition || 'online')
          setPhotoGallery(a.photoGallery || [])
          setTitle(a.title || '')
          setHeadlineB(a.headlineB || '')
          setAbTestWinner(a.abTestWinner || null)
          setViewsA(a.viewsA || 0)
          setViewsB(a.viewsB || 0)
          setShortHeadline(a.shortHeadline || '')
          setStripHeadline(a.stripHeadline || '')
          setSynopsis(a.synopsis || '')
          setByline(a.byline || '')
          setSource(a.author || '')
          setCategory(a.category || '')
          setSubCategory(a.subCategory || '')
          setDivision(a.division || '')
          setDistrict(a.district || '')
          setUpazila(a.upazila || '')
          setTags(a.tags || '')
          setAssigneeName(a.assigneeName || '')
          setNewsPositions(a.newsPositions || [])
          setMetaTitle(a.metaTitle || '')
          setMetaDesc(a.metaDesc || '')
          setPhotoCaption(a.photoCaption || '')
          setVideoUrl(a.videoUrl || '')
          setVideoCaption(a.videoCaption || '')
          setSharedToFacebook(a.sharedToFacebook || false)
          setSharedToTwitter(a.sharedToTwitter || false)
          setSharedToInstagram(a.sharedToInstagram || false)
          setIsPremium(a.isPremium || false)
          setEnableAudioReader(a.enableAudioReader !== false) // default to true if undefined
          setEnableComments(a.enableComments !== false) // default to true if undefined
          setPrintPageNumber(a.printEdition?.pageNumber || '')
          setPrintPlacementTag(a.printEdition?.placementTag || '')
          setPrintReady(a.printEdition?.readyForPrint || false)
          setPrintPriority(a.printEdition?.printPriority || 3)
          setPrintEditionObj(a.printEdition || {})
          setCoverImagePreview(a.coverImage ? (a.coverImage.startsWith('http') ? a.coverImage : `https://somajsongbad-backend.onrender.com${a.coverImage}`) : '')
          if (a.blocks && a.blocks.length > 0) setBlocks(a.blocks)
          else if (a.content) setBlocks([{ id: 1, type: 'text', content: a.content }])
        } catch (err) {
          console.error('Failed to load article:', err)
        }
      } else if (assignmentId) {
        const found = assignments?.find(a => a.id === assignmentId)
        if (found) {
          setTitle(found.title || '')
          setCategory(found.categories?.[0] || '')
          if (found.articleData) {
            setSynopsis(found.articleData.synopsis || '')
            if (found.articleData.coverImagePreview) {
              setCoverImagePreview(found.articleData.coverImagePreview)
            }
            if (found.articleData.videoUrl) {
              setVideoUrl(found.articleData.videoUrl)
            }
            if (found.articleData.videoCaption) {
              setVideoCaption(found.articleData.videoCaption)
            }
            if (found.articleData.blocks && found.articleData.blocks.length > 0) {
              const bWithIds = found.articleData.blocks.map((b, i) => ({
                ...b,
                id: b.id || Date.now() + i
              }))
              setBlocks(bWithIds)
            }
          }
          if (found.sourceUrl) {
            setSource(`RSS`) // Just put RSS or specific logic. Maybe "External Source"
          }
        }
      } else if (rssData) {
        setTitle(rssData.title || '')
        setShortHeadline(rssData.title || '')
        setSource(rssData.source ? `RSS: ${rssData.source}` : '')
        setCoverImagePreview(rssData.imageUrl || '')
        if (rssData.summary) {
          setBlocks([{ id: 1, type: 'text', content: `<p>${rssData.summary}</p>` }])
        }
      }
    }
    fetchData()
  }, [id, assignmentId, assignments, rssData])

  // Pre-calculate media hashes in background
  useEffect(() => {
    const initHashes = async () => {
      let lib = getMediaLibrary()
      let updated = false
      for (let m of lib) {
        if (!m.vHash && m.url) {
          m.vHash = await calculateVisualHash(m.url)
          updated = true
        }
      }
      if (updated) {
        localStorage.setItem('cms_media_library', JSON.stringify(lib))
      }
    }
    initHashes()
  }, [])

  const selectedCategory = categories.find((c) => c.name === category)
  const subCategories = selectedCategory?.subCategories || []

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // Clear immediately to allow same file re-upload
    if (!file) return

    // Open image cropper & color correction modal
    setCropFile(file)
  }

  const handleCropComplete = async (croppedFile) => {
    setCropFile(null)
    const formData = new FormData()
    formData.append('file', croppedFile)
    
    try {
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const { media, duplicate } = res.data
      
      if (duplicate) {
        setDuplicateConfirm({ url: duplicate && duplicate.startsWith('http') ? duplicate : `https://somajsongbad-backend.onrender.com${duplicate}`, name: media.name })
        return
      }

      setCoverImagePreview(media.url && media.url.startsWith('http') ? media.url : `https://somajsongbad-backend.onrender.com${media.url}`)
      markImageUsed(media.url && media.url.startsWith('http') ? media.url : `https://somajsongbad-backend.onrender.com${media.url}`)
    } catch (err) {
      console.error(err)
    }
  }

  const handleVideoUpload = async (e) => {
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
      setVideoUrl(media.url && media.url.startsWith('http') ? media.url : `https://somajsongbad-backend.onrender.com${media.url}`)
    } catch (err) {
      console.error(err)
      alert('ভিডিও আপলোড ব্যর্থ হয়েছে।')
    } finally {
      setUploadingVideo(false)
    }
  }

  const handleSubmitComponent = async (component) => {
    // First save the current draft state
    const saved = await handleSave('draft')
    if (saved === false) return; // Validation failed
    
    setSaving(true)
    try {
      await api.post(`/articles/${currentId}/submit-component`, { component })
      let successMsg = 'ছবি/মিডিয়া সফলভাবে সাবমিট করা হয়েছে'
      if (component === 'text') successMsg = 'টেক্সট সফলভাবে সাবমিট করা হয়েছে'
      if (component === 'video') successMsg = 'ভিডিও সফলভাবে সাবমিট করা হয়েছে'
      alert(successMsg)
      
      // Update local state to reflect submission
      if (assignmentId) {
        updateStatus(assignmentId, 'submitted', `${component === 'text' ? 'Text' : component === 'video' ? 'Video' : 'Media'} Submitted`, 'Contributor')
      }
      
      // Reload article data
      const res = await api.get(`/articles/${currentId}`)
      if (res.data.editorialStage && res.data.editorialStage.submissionTracking) {
        setSubmissionTracking(res.data.editorialStage.submissionTracking)
      }
    } catch (err) {
      console.error(err)
      alert('সাবমিট করতে সমস্যা হয়েছে')
    } finally {
      setSaving(false)
    }
  }

  const unlockAndNavigate = async (path, articleId = currentId) => {
    if (articleId) {
      try {
        await api.post(`/articles/${articleId}/unlock`);
      } catch (err) {
        console.error('Explicit unlock failed', err);
      }
    }
    navigate(path);
  };

  const handleSave = async (status = 'draft') => {
    if (!title || title.trim() === '') {
      alert('অনুগ্রহ করে আর্টিকেলের একটি মেইন হেডলাইন (Title) দিন। হেডলাইন ছাড়া সেভ হবে না।');
      return false;
    }
    
    setSaving(true)
    try {
      const payload = {
        title,
        headlineB,
        shortHeadline,
        stripHeadline,
        synopsis,
        blocks,
        category,
        subCategory,
        division,
        district,
        upazila,
        newsPositions,
        articleType: 'photo_story',
        photoGallery,
        source,
        byline,
        tags: typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : tags,
        metaTitle,
        metaDesc,
        photoCaption,
        status,
        assigneeName,
        sharedToFacebook,
        sharedToTwitter,
        sharedToInstagram,
        coverImage: coverImagePreview ? coverImagePreview.startsWith('https://somajsongbad-backend.onrender.com') ? coverImagePreview.replace('https://somajsongbad-backend.onrender.com', '') : coverImagePreview : '',
        videoUrl,
        videoCaption,
        assignmentId,
        edition,
        printEdition: {
          ...printEditionObj,
          pageNumber: printPageNumber,
          placementTag: printPlacementTag,
          readyForPrint: printReady,
          printPriority: printPriority
        }
      }

      if (currentId) {
        await api.put(`/articles/${currentId}`, payload)
      } else {
        const res = await api.post('/articles', payload)
        if (res.data && res.data._id) {
          setCurrentId(res.data._id)
        }
      }

      if (assignmentId && status === 'published') {
        updateStatus(assignmentId, 'submitted', 'আর্টিকেল লেখা সম্পন্ন।', 'Reporter')
      }

      if (status === 'draft') {
        setLastSaved(new Date())
        lastSavedStrRef.current = JSON.stringify(payload)
        return // Do not navigate away on draft save
      }

      if (status === 'published') {
        const platforms = []
        if (sharedToFacebook) platforms.push('Facebook')
        if (sharedToTwitter) platforms.push('X')
        if (sharedToInstagram) platforms.push('Instagram')
        
        if (platforms.length > 0) {
          alert(`আর্টিকেলটি সফলভাবে পাবলিশ হয়েছে এবং স্বয়ংক্রিয়ভাবে ${platforms.join(', ')} -এ শেয়ার করা হয়েছে!`)
        } else {
          alert('আর্টিকেলটি সফলভাবে পাবলিশ হয়েছে!')
        }
      }

      await unlockAndNavigate(assignmentId ? `/workflow/${assignmentId}` : '/articles', articleId)
    } catch (err) {
      console.error(err)
      alert('আর্টিকেল সেভ করতে সমস্যা হয়েছে! দয়া করে ইন্টারনেট কানেকশন চেক করুন বা আবার চেষ্টা করুন।')
    } finally {
      return true
    }
  }

  const handleAIRequest = async () => {
    if (blocks.length === 0 || !blocks[0].content || blocks[0].content.length < 20) {
      alert("এআই সাজেশনের জন্য পর্যাপ্ত লেখা নেই। দয়া করে আগে কিছু লিখুন।");
      return;
    }
    setShowAIModal(true);
    setIsAIGenerating(true);
    try {
      const content = blocks.map(b => b.content.replace(/<[^>]+>/g, '')).join('\n');
      const res = await api.post('/ai/suggest', { content });
      setAiSuggestions(res.data);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "এআই জেনারেট করতে সমস্যা হয়েছে!";
      alert(errorMsg);
      setShowAIModal(false);
    } finally {
      setIsAIGenerating(false);
    }
  }

  const applyAISuggestions = (suggestions) => {
    if (suggestions.title) setMetaTitle(suggestions.title);
    if (suggestions.summary) setMetaDesc(suggestions.summary);
    if (suggestions.tags) {
      const existing = tags ? tags + ', ' : '';
      setTags(existing + suggestions.tags.join(', '));
    }
    setShowAIModal(false);
  }

  // Real-time SEO & Reading Time Calculations
  const calculatedSeoScore = (() => {
    let score = 40;
    if (title && title.length > 10) score += 15;
    if (synopsis && synopsis.length > 20) score += 15;
    if (metaTitle && metaTitle.length > 10) score += 15;
    if (metaDesc && metaDesc.length > 20) score += 15;
    if (tags && tags.length > 3) score += 10;
    return Math.min(100, score);
  })();

  const estimatedReadingTime = (() => {
    const text = blocks.map(b => b.content ? b.content.replace(/<[^>]+>/g, '') : '').join(' ');
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const time = Math.max(1, Math.ceil(wordCount / 200));
    return { wordCount, time };
  })();

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-6 px-4">
      
      {/* Locked Overlay */}
      {lockedBy && (
        <div className="absolute inset-0 z-[60] bg-white/70 dark:bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl border border-red-200 dark:border-red-900/50">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl max-w-md text-center border border-red-100 dark:border-red-900/30">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">আর্টিকেলটি লক করা আছে</h3>
            <p className="text-gray-600 dark:text-slate-400 mb-6">
              বর্তমানে <strong>{lockedBy}</strong> এই আর্টিকেলটি এডিট করছেন। 
              একসাথে দুজন এডিট করলে ডেটা মুছে যাওয়ার সম্ভাবনা থাকে বলে আপনার জন্য এডিটিং সাময়িকভাবে বন্ধ রাখা হয়েছে।
            </p>
            <button 
              onClick={() => unlockAndNavigate('/articles')}
              className="bg-gray-900 dark:bg-slate-800 hover:bg-gray-800 dark:hover:bg-slate-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
            >
              ফিরে যান
            </button>
          </div>
        </div>
      )}

      {/* ── Top Bar ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => unlockAndNavigate(assignmentId ? `/workflow/${assignmentId}` : '/articles')}
            className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 transition-colors bg-gray-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
            <ArrowLeft size={16} />
            {assignmentId ? 'Assignment-এ ফিরুন' : 'আর্টিকেল লিস্টে ফিরুন'}
          </button>
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">LIVE / DRAFT</span>
          </div>
          {/* Print Version Link */}
          <button
            onClick={() => navigate(currentId ? `/print/articles/edit/${currentId}` : `/print/articles/new${assignmentId ? `?assignmentId=${assignmentId}` : ''}`)}
            className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
            title="প্রিন্ট সংস্করণে এই স্টোরি লিখুন"
          >
            <Printer size={14} /> প্রিন্ট ভার্সন
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {lastSaved && (
            <span className="text-xs font-medium text-gray-400 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-gray-100 dark:border-slate-700/50">
              অটো-সেভ: {lastSaved.toLocaleTimeString('bn-BD')}
            </span>
          )}

          <button onClick={handleAIRequest} disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-indigo-500/20">
            🪄 AI ম্যাজিক
          </button>

          <button onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-2 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors shadow-sm">
            <Eye size={16} /> প্রিভিউ
          </button>

          <button onClick={() => handleSave('draft')} disabled={saving}
            className="flex items-center gap-2 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <Save size={16} /> ড্রাফট সেভ
          </button>

          <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700/50">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-blue-600 dark:text-blue-400">
              <input type="checkbox" checked={sharedToFacebook} onChange={e => setSharedToFacebook(e.target.checked)} className="rounded text-blue-600" />
              FB Share
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-sky-500">
              <input type="checkbox" checked={sharedToTwitter} onChange={e => setSharedToTwitter(e.target.checked)} className="rounded text-sky-500" />
              X Share
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-pink-600 dark:text-pink-400">
              <input type="checkbox" checked={sharedToInstagram} onChange={e => setSharedToInstagram(e.target.checked)} className="rounded text-pink-600" />
              Insta Share
            </label>
          </div>

          {assignmentId ? (
            <div className="flex gap-2">
              <button onClick={() => handleSubmitComponent('text')} disabled={saving || (submissionTracking && submissionTracking.text && submissionTracking.text.isSubmitted)}
                className={`flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-md ${(submissionTracking && submissionTracking.text && submissionTracking.text.isSubmitted) ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/20'}`}>
                <Newspaper size={16} /> {(submissionTracking && submissionTracking.text && submissionTracking.text.isSubmitted) ? 'টেক্সট সাবমিটেড' : 'টেক্সট জমা দিন'}
              </button>
              <button onClick={() => handleSubmitComponent('media')} disabled={saving || (submissionTracking && submissionTracking.media && submissionTracking.media.isSubmitted)}
                className={`flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-md ${(submissionTracking && submissionTracking.media && submissionTracking.media.isSubmitted) ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/20'}`}>
                <ImageIcon size={16} /> {(submissionTracking && submissionTracking.media && submissionTracking.media.isSubmitted) ? 'ছবি সাবমিটেড' : 'ছবি জমা দিন'}
              </button>
              <button onClick={() => handleSubmitComponent('video')} disabled={saving || (submissionTracking && submissionTracking.video && submissionTracking.video.isSubmitted)}
                className={`flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-md ${(submissionTracking && submissionTracking.video && submissionTracking.video.isSubmitted) ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700 hover:shadow-purple-500/20'}`}>
                <Video size={16} /> {(submissionTracking && submissionTracking.video && submissionTracking.video.isSubmitted) ? 'ভিডিও সাবমিটেড' : 'ভিডিও জমা দিন'}
              </button>
            </div>
          ) : (
            <button onClick={() => handleSave('published')} disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-emerald-500/20">
              <Eye size={16} /> {saving ? 'সেভ হচ্ছে...' : 'প্রকাশ করুন'}
            </button>
          )}
        </div>
      </div>

      {/* Assignment banner */}
      {assignmentId && (
        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0 animate-ping" />
          <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
            এই আর্টিকেলটি একটি <span className="font-bold">Workflow Assignment</span>-এর অংশ। জমা দিলে সম্পাদক রিভিউ করবেন।
          </p>
        </div>
      )}

      {/* ── Top Dashboard Header (2 Cards Grid) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Real-time SEO Score & Analytics */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <Sparkles size={14} />
              <span>রিয়েল-টাইম SEO স্কোর</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-gray-900 dark:text-white">{calculatedSeoScore}</span>
              <span className="text-sm font-bold text-gray-400">/ 100</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ml-2 ${
                calculatedSeoScore >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400' : 
                calculatedSeoScore >= 50 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400' : 
                'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400'
              }`}>
                {calculatedSeoScore >= 80 ? 'EXCELLENT' : calculatedSeoScore >= 50 ? 'GOOD' : 'NEEDS WORK'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Meta Title, Description, Tags ও Synopsis পূরণ করলে স্কোর বাড়বে।
            </p>
          </div>

          <div className="flex flex-col gap-3 border-l border-gray-100 dark:border-slate-800 pl-6 my-auto">
            <div>
              <span className="block text-[11px] font-bold text-gray-400 uppercase">মোট শব্দ</span>
              <span className="text-lg font-extrabold text-gray-800 dark:text-slate-200">{estimatedReadingTime.wordCount} শব্দ</span>
            </div>
            <div>
              <span className="block text-[11px] font-bold text-gray-400 uppercase">পড়ার সময়</span>
              <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{estimatedReadingTime.time} মিনিট</span>
            </div>
          </div>
        </div>

        {/* Card 2: Headline A/B Testing Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <span>⚖️ হেডলাইন A/B টেস্টিং</span>
            </div>
            {abTestWinner && (
              <button onClick={() => setAbTestWinner(null)} className="text-[11px] font-bold text-rose-600 hover:text-rose-700 border border-rose-200 dark:border-rose-800/50 px-2.5 py-1 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors">
                🔄 টেস্ট রিসেট করুন
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border transition-all ${abTestWinner === 'A' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm' : 'border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50'}`}>
              <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">হেডলাইন A (মূল)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-gray-900 dark:text-white">{viewsA} <span className="text-xs font-medium text-gray-500">ভিউ</span></span>
                {abTestWinner === 'A' ? (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">🏆 উইনার</span>
                ) : !abTestWinner && headlineB ? (
                  <button onClick={() => setAbTestWinner('A')} className="text-[11px] font-bold bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors">উইনার করুন</button>
                ) : null}
              </div>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${abTestWinner === 'B' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm' : 'border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50'}`}>
              <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">হেডলাইন B (বিকল্প)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-gray-900 dark:text-white">{viewsB} <span className="text-xs font-medium text-gray-500">ভিউ</span></span>
                {abTestWinner === 'B' ? (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">🏆 উইনার</span>
                ) : !abTestWinner && headlineB ? (
                  <button onClick={() => setAbTestWinner('B')} className="text-[11px] font-bold bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors">উইনার করুন</button>
                ) : null}
              </div>
            </div>
          </div>

          {!headlineB && (
            <p className="text-xs text-gray-400 italic">বিকল্প হেডলাইন বক্সে দ্বিতীয় শিরোনাম লিখলে A/B টেস্টিং স্বয়ংক্রিয়ভাবে শুরু হবে।</p>
          )}
        </div>
      </div>

      {/* ── Main Layout Grid (md:col-span-8 and md:col-span-4) ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Main Center Column (md:col-span-8) */}
        <div className="md:col-span-8 space-y-6">

          {/* Card 1: Headlines Bundle */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-7 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📰</span> শিরোনাম গুচ্ছ
              </h3>
              {enableAiRewrite && (
                <button
                  type="button"
                  onClick={handleAiRewrite}
                  disabled={isRewriting}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  {isRewriting ? 'রিরাইট হচ্ছে...' : 'এআই দিয়ে রিরাইট করুন'}
                </button>
              )}
            </div>

            {/* Main Headline Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 rounded-lg flex items-center justify-center text-xs font-black">A</div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">মেইন হেডলাইন <span className="text-rose-500">*</span></label>
                  <VoiceButton onAppend={(text) => setTitle(prev => {
                    const p = prev || ''
                    return p + (p.endsWith(' ') ? '' : ' ') + text
                  })} />
                </div>
                <div className="flex items-center gap-3">
                  {headlineB && (
                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-slate-700 shadow-sm">
                      <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">ভিউ: {viewsA}</span>
                      {abTestWinner === 'A' ? (
                        <span className="text-[10px] font-bold text-emerald-600">🏆 উইনার</span>
                      ) : !abTestWinner ? (
                        <button onClick={() => setAbTestWinner('A')} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200 transition-colors font-bold">উইনার করুন</button>
                      ) : null}
                    </div>
                  )}
                  {(() => {
                    const val = title || ''
                    const totalWords = val.trim().split(/\s+/).filter(Boolean).length
                    const totalChars = val.length
                    return (
                      <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        শব্দ: <strong>{totalWords}</strong> | বর্ণ: <strong>{totalChars}</strong>
                      </span>
                    )
                  })()}
                </div>
              </div>
              <textarea rows={1} value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="আর্টিকেলের মূল শিরোনাম লিখুন..."
                className={`w-full text-2xl font-bold text-gray-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 border ${abTestWinner === 'A' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-gray-200 dark:border-slate-700/80'} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-gray-400 resize-y min-h-[58px] overflow-auto`} />
            </div>
            
            {/* Alternative Headline (B) Input */}
            <div className={`bg-amber-50/50 dark:bg-amber-950/20 border ${abTestWinner === 'B' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-amber-200 dark:border-amber-800/50'} p-4 rounded-xl space-y-2 transition-all`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-amber-200 text-amber-800 dark:bg-amber-500 dark:text-slate-950 rounded-lg flex items-center justify-center text-xs font-black">B</div>
                  <label className="block text-xs font-bold text-amber-900 dark:text-amber-400">বিকল্প হেডলাইন (A/B Testing)</label>
                </div>
                {headlineB && (
                  <div className="flex items-center gap-2 bg-amber-100/80 dark:bg-amber-900/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 shadow-sm">
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400">ভিউ: {viewsB}</span>
                    {abTestWinner === 'B' ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">🏆 উইনার</span>
                    ) : !abTestWinner ? (
                      <button onClick={() => setAbTestWinner('B')} className="text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded hover:bg-amber-300 transition-colors font-bold">উইনার করুন</button>
                    ) : null}
                  </div>
                )}
              </div>
              <textarea rows={1} value={headlineB} onChange={(e) => setHeadlineB(e.target.value)}
                placeholder="পাঠকদের জন্য দ্বিতীয় একটি শিরোনাম দিয়ে টেস্ট করুন..."
                className="w-full text-sm text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-700/50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-amber-400/60 resize-y min-h-[42px] overflow-auto" />
            </div>

            {/* Short Headline & Strip Headline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <InputField label="শর্ট হেডলাইন" type="text" value={shortHeadline} onChange={(e) => setShortHeadline(e.target.value)} placeholder="সংক্ষিপ্ত শিরোনাম..." />
              <InputField label="স্ট্রিপ হেডলাইন" type="text" value={stripHeadline} onChange={(e) => setStripHeadline(e.target.value)} placeholder="স্ক্রলিং স্ট্রিপের জন্য..." />
            </div>
          </div>

          {/* Card 2: Synopsis */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-7 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-4">
              <span>📝</span> সিনপসিস (Synopsis)
            </h3>
            <TextAreaField label="সিনপসিস বিবরণ" value={synopsis} onChange={(e) => setSynopsis(e.target.value)} placeholder="আর্টিকেলের সংক্ষিপ্ত বিবরণ লিখুন..." rows={3} />
          </div>

          {/* Card 3: Photo Story Intro */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-7 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText size={18} className="text-blue-500" /> ফটোস্টোরির ভূমিকা (Intro)
              </h3>
            </div>
            <BlockEditor blocks={blocks} setBlocks={setBlocks} />
          </div>

          <PhotoGalleryBuilder gallery={photoGallery} setGallery={setPhotoGallery} />

          {/* Cover Photo Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-7 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-8">
              <div className="flex-1 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>🖼️</span> কভার ফটো
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shadow-sm">
                      <Upload size={16} className="text-indigo-600 dark:text-indigo-400" /> লোকাল থেকে ব্রাউজ
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                    <button
                      onClick={() => setShowMediaPicker(true)}
                      className="flex items-center gap-2 border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl px-4 py-2.5 text-sm font-bold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-sm">
                      <FolderOpen size={16} /> মিডিয়া থেকে নিন
                    </button>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                  <button
                    onClick={() => setShowCardGenerator(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-teal-500/20">
                    <LayoutTemplate size={18} /> ফটোকার্ড তৈরি করুন
                  </button>
                </div>
                
                <InputField label="ফটো ক্যাপশন" type="text" value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} placeholder="ছবির বিবরণ লিখুন..." />
              </div>
              <div className="w-full sm:w-72 flex-shrink-0 flex flex-col justify-center">
                {coverImagePreview ? (
                  <div className="relative group rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 aspect-video flex items-center justify-center">
                    <img src={coverImagePreview} alt="cover" className="w-full h-full object-cover" />
                    <button onClick={() => setCoverImagePreview('')}
                      className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 hover:bg-white text-gray-700 hover:text-rose-600 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl h-44 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 text-sm font-medium gap-2 bg-slate-50/50 dark:bg-slate-800/30">
                    <ImageIcon size={28} className="text-gray-300 dark:text-slate-600" />
                    <span>ছবি বেছে নিন</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Video Link / Upload Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-7 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-8">
              <div className="flex-1 space-y-5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-4">
                  <span>🎥</span> ভিডিও সংযুক্ত করুন (ঐচ্ছিক)
                </h3>
                <div>
                  <FieldLabel>ভিডিও লিংক (ইউটিউব/ফেসবুক লিংক দিন অথবা সরাসরি ভিডিও ফাইল আপলোড করুন)</FieldLabel>
                  <div className="flex flex-wrap sm:flex-nowrap gap-3 mt-2">
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="flex-1 border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                    />
                    <label className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all shadow-sm whitespace-nowrap">
                      <Upload size={16} />
                      {uploadingVideo ? 'আপলোড হচ্ছে...' : 'ভিডিও ফাইল আপলোড'}
                      <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={uploadingVideo} />
                    </label>
                  </div>
                </div>
                <InputField label="ভিডিও ক্যাপশন" type="text" value={videoCaption} onChange={(e) => setVideoCaption(e.target.value)} placeholder="ভিডিওর বিবরণ লিখুন..." />
              </div>
              <div className="w-full sm:w-72 flex-shrink-0 flex flex-col justify-center">
                {videoUrl ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-black aspect-video flex items-center justify-center shadow-md">
                    {videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/) ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)[1]}`}
                        className="w-full h-full border-none"
                        allowFullScreen
                        title="YouTube Preview"
                      />
                    ) : videoUrl.includes('facebook.com') || videoUrl.includes('fb.watch') ? (
                      <iframe
                        src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl.includes('/reel/') ? `https://www.facebook.com/watch/?v=${videoUrl.match(/\/reel\/(\d+)/)?.[1] || ''}` : videoUrl)}&show_text=false&width=256`}
                        className="w-full h-full border-none overflow-hidden"
                        scrolling="no"
                        frameBorder="0"
                        allowFullScreen
                        title="Facebook Preview"
                      />
                    ) : (
                      <video src={videoUrl} controls className="w-full h-full object-contain" />
                    )}
                    <button onClick={() => setVideoUrl('')}
                      className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 hover:bg-white text-gray-700 hover:text-rose-600 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl h-44 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 text-sm font-medium gap-2 bg-slate-50/50 dark:bg-slate-800/30">
                    <span className="text-2xl">🎥</span>
                    <span>ভিডিও প্রিভিউ</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {showMediaPicker && (
            <MediaPickerModal
              onSelect={(url) => setCoverImagePreview(url)}
              onClose={() => setShowMediaPicker(false)}
            />
          )}
        </div>

        {/* Right Sidebar Widgets (md:col-span-4) */}
        <div className="md:col-span-4 space-y-6">

          {/* Widget 0: Edition Selector */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
              <span>📍</span> কোথায় প্রকাশ হবে? (Edition)
            </h3>
            <div className="flex flex-col gap-3 pt-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="radio" name="edition" value="online" checked={edition === 'online'} onChange={(e) => setEdition(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">🌐 শুধু অনলাইন</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="radio" name="edition" value="print" checked={edition === 'print'} onChange={(e) => setEdition(e.target.value)} className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300" />
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-purple-600 transition-colors">🖨️ শুধু প্রিন্ট</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="radio" name="edition" value="both" checked={edition === 'both'} onChange={(e) => setEdition(e.target.value)} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300" />
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-emerald-600 transition-colors">🌐 + 🖨️ অনলাইন ও প্রিন্ট (উভয়)</span>
              </label>
            </div>
          </div>

          {/* Widget 1: Print Edition Settings */}
          <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-2 border-b border-indigo-200 dark:border-indigo-800/50 pb-4">
              <Printer size={18} /> প্রিন্ট এডিশন সেটিংস
            </h3>
            
            <div className="space-y-4">
              <SelectField label="পৃষ্ঠা নির্ধারণ" value={printPageNumber} onChange={(e) => setPrintPageNumber(e.target.value)}>
                <option value="">-- পেজ সিলেক্ট করুন --</option>
                <option value="প্রথম পাতা">প্রথম পাতা</option>
                <option value="শেষ পাতা">শেষ পাতা</option>
                <option value="খবর (২)">খবর (২)</option>
                <option value="খবর (৩)">খবর (৩)</option>
                <option value="খেলাধুলা">খেলাধুলা</option>
                <option value="বিনোদন">বিনোদন</option>
              </SelectField>

              <SelectField label="প্লেসমেন্ট ট্যাগ" value={printPlacementTag} onChange={(e) => setPrintPlacementTag(e.target.value)}>
                <option value="">-- প্লেসমেন্ট ট্যাগ --</option>
                <option value="লিড নিউজ">লিড নিউজ</option>
                <option value="সেকেন্ড লিড">সেকেন্ড লিড</option>
                <option value="শোল্ডার নিউজ">শোল্ডার নিউজ</option>
                <option value="বটম নিউজ">বটম নিউজ</option>
                <option value="সিঙ্গেল কলাম">সিঙ্গেল কলাম</option>
                <option value="বক্স নিউজ">বক্স নিউজ</option>
              </SelectField>

              <SelectField label="প্রায়োরিটি" value={printPriority} onChange={(e) => setPrintPriority(Number(e.target.value))}>
                <option value={1}>১ - সর্বোচ্চ প্রায়োরিটি (লিড)</option>
                <option value={2}>২ - উচ্চ প্রায়োরিটি</option>
                <option value={3}>৩ - সাধারণ প্রায়োরিটি</option>
              </SelectField>

              <label className="flex items-center gap-2 mt-4 cursor-pointer">
                <input type="checkbox" checked={printReady} onChange={e => setPrintReady(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                <span className="text-sm font-bold text-indigo-800 dark:text-indigo-300">প্রিন্টের জন্য প্রস্তুত (Ready for Print)</span>
              </label>
            </div>
          </div>

          {/* Widget 2: Byline & Assignment */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-4">
              <span>👤</span> বাইলাইন ও অ্যাসাইনমেন্ট
            </h3>
            
            <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl shadow-sm">
              <input type="checkbox" id="isPremium" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500" />
              <label htmlFor="isPremium" className="text-sm font-bold text-amber-900 dark:text-amber-400 cursor-pointer flex-1">
                Premium Article 💎
                <span className="block text-xs font-normal text-amber-700 dark:text-amber-500 mt-0.5">পাঠকদের পড়তে সাবস্ক্রাইব করতে হবে</span>
              </label>
            </div>
            
            <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-4 rounded-xl shadow-sm">
              <input type="checkbox" id="enableAudioReader" checked={enableAudioReader} onChange={(e) => setEnableAudioReader(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
              <label htmlFor="enableAudioReader" className="text-sm font-bold text-blue-900 dark:text-blue-400 cursor-pointer flex-1">
                AI Audio Reader 🎙️
                <span className="block text-xs font-normal text-blue-700 dark:text-blue-500 mt-0.5">আর্টিকেলে অডিও নিউজ রিডার অপশন দেখান</span>
              </label>
            </div>
            
            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-xl shadow-sm">
              <input type="checkbox" id="enableComments" checked={enableComments} onChange={(e) => setEnableComments(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
              <label htmlFor="enableComments" className="text-sm font-bold text-emerald-900 dark:text-emerald-400 cursor-pointer flex-1">
                পাঠকদের মন্তব্য (Comments) 💬
                <span className="block text-xs font-normal text-emerald-700 dark:text-emerald-500 mt-0.5">এই আর্টিকেলে পাঠকরা মন্তব্য করতে পারবেন</span>
              </label>
            </div>

            <SelectField label="সোর্স / ডেস্ক" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">সোর্স বেছে নিন</option>
              {sources.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </SelectField>

            <div>
              <FieldLabel>বাইলাইন (সাংবাদিক)</FieldLabel>
              <SearchableSelect 
                options={journalists.map(j => ({ value: j.name, label: `${j.name} — ${j.designation}` }))}
                value={byline}
                onChange={setByline}
                placeholder="সাংবাদিক বেছে নিন..."
                className="w-full text-sm"
              />
            </div>

            <div>
              <FieldLabel>এসাইন টু (Assign To)</FieldLabel>
              <SearchableSelect 
                options={journalists.map(j => ({ value: j.name, label: `${j.name} — ${j.designation}` }))}
                value={assigneeName}
                onChange={setAssigneeName}
                placeholder="কাউকে এসাইন করুন..."
                className="w-full text-sm"
              />
            </div>
          </div>

          {/* Widget 2: Categories */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-4">
              <span>📁</span> ক্যাটাগরি ও বিন্যাস
            </h3>
            
            <SelectField label="ক্যাটাগরি" value={category} onChange={(e) => { setCategory(e.target.value); setSubCategory('') }}>
              <option value="">ক্যাটাগরি বেছে নিন</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </SelectField>
            
            <SelectField label="সাব-ক্যাটাগরি" value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
              <option value="">সাব-ক্যাটাগরি বেছে নিন</option>
              {subCategories.map((s, i) => <option key={i} value={s}>{s}</option>)}
            </SelectField>
            {category === 'বাংলাদেশ' && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <SelectField label="বিভাগ" value={division} onChange={(e) => { setDivision(e.target.value); setDistrict(''); setUpazila(''); }}>
                    <option value="">বিভাগ নির্বাচন করুন</option>
                    {Object.keys(bdLocations).map(div => <option key={div} value={div}>{div}</option>)}
                  </SelectField>
                </div>
                <div className="flex-1">
                  <SelectField label="জেলা" value={district} onChange={(e) => { setDistrict(e.target.value); setUpazila(''); }}>
                    <option value="">জেলা নির্বাচন করুন</option>
                    {division && bdLocations[division] && Object.keys(bdLocations[division]).map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </SelectField>
                </div>
                <div className="flex-1">
                  <SelectField label="উপজেলা" value={upazila} onChange={(e) => setUpazila(e.target.value)}>
                    <option value="">উপজেলা নির্বাচন করুন</option>
                    {division && district && bdLocations[division]?.[district]?.map(upz => (
                      <option key={upz} value={upz}>{upz}</option>
                    ))}
                  </SelectField>
                </div>
              </div>
            )}
            <MultiSelectDropdown 
              label="হোম পেজ পজিশন" 
              options={positions} 
              selected={newsPositions} 
              onChange={setNewsPositions} 
              max={3} 
            />
            <div>
              <FieldLabel>ট্যাগ (কমা দিয়ে আলাদা)</FieldLabel>
              <textarea rows={1} value={tags} onChange={(e) => setTags(e.target.value)}
                placeholder="যেমন: নির্বাচন, অর্থনীতি"
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 resize-y min-h-[42px] overflow-auto" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">SEO সেটিংস</h3>
            <div>
              <FieldLabel>Meta Title</FieldLabel>
              <textarea rows={1} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="SEO শিরোনাম (৬০ অক্ষরের মধ্যে)" maxLength={60}
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 resize-y min-h-[42px] overflow-auto" />
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{metaTitle.length}/60</p>
            </div>
            <div>
              <FieldLabel>Meta Description</FieldLabel>
              <textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)}
                placeholder="SEO বিবরণ (১৬০ অক্ষরের মধ্যে)" maxLength={160} rows={3}
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{metaDesc.length}/160</p>
            </div>
          </div>
        </div>
      </div>



      {/* Duplicate confirmation dialog for local upload */}
      {duplicateConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]" onClick={() => setDuplicateConfirm(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-600 text-sm">⚠️</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">এই ছবি মিডিয়াতে আছে</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{duplicateConfirm.name}</p>
              </div>
            </div>
            <div className="p-5">
              <img src={duplicateConfirm.url} alt={duplicateConfirm.name} className="w-full h-32 object-cover rounded-xl mb-3" />
              <p className="text-sm text-gray-700 dark:text-slate-300">এ ধরণের ছবি মিডিয়ায় রয়েছে। আপনি আবার ব্যবহারের জন্য নিতে চান।</p>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800 flex gap-2 justify-end">
              <button onClick={() => setDuplicateConfirm(null)}
                className="text-sm text-gray-500 dark:text-slate-400 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800">না, বাদ দিন</button>
              <button onClick={() => {
                setCoverImagePreview(duplicateConfirm.url)
                markImageUsed(duplicateConfirm.url)
                setDuplicateConfirm(null)
              }}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">হ্যাঁ, ব্যবহার করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Modal */}
      {showAIModal && (
        <AIAssistantModal
          suggestions={aiSuggestions}
          onApply={applyAISuggestions}
          onCancel={() => setShowAIModal(false)}
          isGenerating={isAIGenerating}
        />
      )}

      {/* Social Card Generator */}
      <SocialCardGenerator 
        isOpen={showCardGenerator} 
        onClose={() => setShowCardGenerator(false)}
        coverImage={coverImagePreview}
        title={title}
        blocks={blocks}
      />

      {/* Image Cropper and Color Correction Modal */}
      {cropFile && (
        <ImageCropperModal
          file={cropFile}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropFile(null)}
        />
      )}

      {/* Article Preview Modal (Responsive Web Preview) */}
      <OnlineArticlePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        articleData={{
          title,
          byline,
          content: blocks.map(b => b.content || '').join(''),
          synopsis,
          coverImagePreview
        }}
      />

    </div>
  )
}
