import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { useSettings } from '../../context/SettingsContext'
import { useAuth } from '../../context/AuthContext'
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  Link2, Table, Image as ImageIcon, Save, ArrowLeft,
  Upload, X, Printer, CheckSquare, Square, AlignLeft, Eye, Mic, UserCheck, Send, Layout, CheckCircle, XCircle, Newspaper, Video
} from 'lucide-react'
import api from '../../services/api'
import ArticlePreviewModal from '../../components/Modals/ArticlePreviewModal'
import SearchableSelect from '../../components/SearchableSelect'

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
  return `${baseUrl}${path}`;
};
// ── Re-assign Modal (for Chief Reporter inside Editor) ──
function ReassignFromEditorModal({ assignmentId, edition, onClose }) {
  const [users, setUsers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/users').then(res => {
      const allUsers = res.data || []
      // Filter by edition: show users whose edition matches or is 'both'
      const editionUsers = allUsers.filter(u => {
        const roleOk = ['reporter', 'chief_reporter', 'journalist', 'sub_editor', 'desk_editor'].includes(u.role)
        const editionOk = !edition || !u.edition || u.edition === 'both' || u.edition === edition
        return roleOk && editionOk
      })
      setUsers(editionUsers)
    }).catch(err => {
      console.error('Failed to load users:', err)
    })
  }, [edition])

  const handleReassign = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      await api.put(`/workflow/${assignmentId}/status`, {
        status: 'pending',
        note: note || 'চিফ রিপোর্টার পুনরায় অ্যাসাইন করেছেন'
      })
      await api.put(`/workflow/${assignmentId}`, {
        assignedToId: selectedId
      })
      alert('সফলভাবে Re-assign করা হয়েছে!')
      onClose(true)
    } catch (e) {
      console.error(e)
      alert('Re-assign করতে সমস্যা হয়েছে।')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-6" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserCheck size={16} className="text-teal-600" /> Re-assign করুন
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">কাকে পাঠাবেন?</label>
            <SearchableSelect
              options={users.map(u => ({ value: u._id, label: `${u.name} — ${u.designation || u.role}` }))}
              value={selectedId}
              onChange={setSelectedId}
              placeholder="রিপোর্টার বেছে নিন"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">নির্দেশনা / নোট</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="কী করতে হবে তা লিখুন (ঐচ্ছিক)..."
              rows={3}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="text-sm text-gray-500 px-4 py-2 hover:bg-gray-100 rounded-lg">বাতিল</button>
          <button
            onClick={handleReassign}
            disabled={!selectedId || saving}
            className="text-sm bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white px-5 py-2 rounded-lg transition-colors"
          >
            {saving ? 'পাঠানো হচ্ছে...' : 'Re-assign করুন'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Voice Typing Button (Bangla) ──
function VoiceButton({ onAppend }) {
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'bn-BD'
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          let t = e.results[i][0].transcript.trim()
          t = t.replace(/দাঁড়ি|দাড়ি/gi, '৷')
               .replace(/কোমা|কমা/gi, ',')
               .replace(/প্রশ্নবোধক/gi, '?')
               .replace(/বিস্ময়সূচক/gi, '!')
          onAppend(t)
        }
      }
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    return () => rec.stop()
  }, [onAppend])

  const toggle = () => {
    if (listening) { recRef.current?.stop(); setListening(false) }
    else { try { recRef.current?.start() } catch(e){} ; setListening(true) }
  }

  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) return null
  return (
    <button type="button" onClick={toggle} title="ভয়েস টাইপিং"
      className={`p-1 rounded-full transition-all flex-shrink-0 ${
        listening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
      }`}>
      <Mic size={13}/>
    </button>
  )
}

const GRAPHIC_ASSETS = ['ফটো', 'ইনফোগ্রাফিক', 'ভিডিও', 'কার্টুন/স্কেচ', 'মানচিত্র']


function SectionCard({ title, icon, children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 dark:border-slate-800">
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-bold text-gray-800 dark:text-white">{title}</h3>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  )
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function InputField({ label, required, value, onChange, placeholder, maxLength, type = 'text' }) {
  const [cursorPos, setCursorPos] = useState(0)
  const val = value || ''
  const before = val.slice(0, cursorPos)
  const after  = val.slice(cursorPos)
  const wordsBefore = before.trim() ? before.trim().split(/\s+/).filter(Boolean).length : 0
  const wordsAfter  = after.trim()  ? after.trim().split(/\s+/).filter(Boolean).length  : 0
  const totalWords  = wordsBefore + wordsAfter

  const handleSel = (e) => setCursorPos(e.target.selectionStart || 0)
  const handleChg = (e) => { setCursorPos(e.target.selectionStart || 0); onChange?.(e) }
  const handleVoice = (text) => {
    const pre = before && !before.endsWith(' ') ? ' ' : ''
    const suf = after  && !after.startsWith(' ') ? ' ' : ''
    const nv  = before + pre + text + suf + after
    onChange?.({ target: { value: nv } })
    setCursorPos(before.length + pre.length + text.length)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1">
          <FieldLabel required={required}>{label}</FieldLabel>
          <VoiceButton onAppend={handleVoice}/>
        </div>
        <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">
          শব্দ: <strong>{totalWords}</strong> │ আগে: <strong>{wordsBefore}</strong> │ পরে: <strong>{wordsAfter}</strong>
        </span>
      </div>
      <textarea
        rows={1}
        value={value}
        onChange={handleChg}
        onSelect={handleSel}
        onKeyUp={handleSel}
        onClick={handleSel}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 resize-y min-h-[42px] overflow-auto"
      />
      {maxLength && <p className="text-right text-[10px] text-gray-400 mt-1">{(value||'').length}/{maxLength}</p>}
    </div>
  )
}

function TextAreaField({ label, value, onChange, placeholder, rows = 3, maxLength }) {
  const [cursorPos, setCursorPos] = useState(0)
  const val = value || ''
  const before = val.slice(0, cursorPos)
  const after  = val.slice(cursorPos)
  const wordsBefore = before.trim() ? before.trim().split(/\s+/).filter(Boolean).length : 0
  const wordsAfter  = after.trim()  ? after.trim().split(/\s+/).filter(Boolean).length  : 0
  const totalWords  = wordsBefore + wordsAfter
  const totalChars  = val.length

  const handleSel = (e) => setCursorPos(e.target.selectionStart || 0)
  const handleChg = (e) => { setCursorPos(e.target.selectionStart || 0); onChange?.(e) }
  const handleVoice = (text) => {
    const pre = before && !before.endsWith(' ') ? ' ' : ''
    const suf = after  && !after.startsWith(' ') ? ' ' : ''
    const nv  = before + pre + text + suf + after
    onChange?.({ target: { value: nv } })
    setCursorPos(before.length + pre.length + text.length)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1">
          <FieldLabel>{label}</FieldLabel>
          <VoiceButton onAppend={handleVoice}/>
        </div>
        <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">
          শব্দ: <strong>{totalWords}</strong> │ বর্ণ: <strong>{totalChars}</strong> │ আগে: <strong>{wordsBefore}</strong> │ পরে: <strong>{wordsAfter}</strong>
        </span>
      </div>
      <textarea
        value={value}
        onChange={handleChg}
        onSelect={handleSel}
        onKeyUp={handleSel}
        onClick={handleSel}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 resize-y min-h-[80px] overflow-auto"
      />
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span></span>
        {maxLength && <span>{val.length}/{maxLength}</span>}
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options, placeholder, required }) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <select
        value={value}
        onChange={onChange}
        className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

// ── Rich Text Editor (Body) ──
function RichEditor({ content, onChange }) {
  const [cursorWords, setCursorWords] = useState({ before: 0, after: 0 })
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false })],
    content: content || '<p></p>',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    onSelectionUpdate: ({ editor }) => {
      const { from } = editor.state.selection
      const fullText = editor.getText()
      // Approximate cursor position by character
      const textNode = editor.state.doc.textBetween(0, from, ' ')
      const textAfterNode = fullText.slice(textNode.length)
      const wb = textNode.trim() ? textNode.trim().split(/\s+/).filter(Boolean).length : 0
      const wa = textAfterNode.trim() ? textAfterNode.trim().split(/\s+/).filter(Boolean).length : 0
      setCursorWords({ before: wb, after: wa })
    }
  })

  // Sync content if it is loaded from API
  useEffect(() => {
    if (editor && content && editor.getText().trim() === '' && content !== '<p></p>') {
      editor.commands.setContent(content, false)
    }
  }, [editor, content])

  const totalWords = editor ? editor.getText().trim().split(/\s+/).filter(Boolean).length : 0
  const totalChars = editor ? editor.getText().length : 0

  const TB = ({ onClick, active, title, children }) => (
    <button type="button" onClick={onClick} title={title}
      className={`p-1.5 rounded-lg transition-colors ${
        active
          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400'
          : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
      }`}>
      {children}
    </button>
  )

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        {/* Voice */}
        <VoiceButton onAppend={(text) => editor?.commands.insertContent(' ' + text + ' ')}/>
        <div className="w-px h-5 bg-gray-300 dark:bg-slate-600 mx-1"/>
        <TB title="Bold"   active={editor?.isActive('bold')}   onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={14}/></TB>
        <TB title="Italic" active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={14}/></TB>
        <TB title="Underline" active={editor?.isActive('underline')} onClick={() => editor?.chain().focus().run()}><Underline size={14}/></TB>
        <TB title="Strike" active={editor?.isActive('strike')} onClick={() => editor?.chain().focus().toggleStrike().run()}><Strikethrough size={14}/></TB>
        <div className="w-px h-5 bg-gray-300 dark:bg-slate-600 mx-1"/>
        <TB title="Bullet"   active={editor?.isActive('bulletList')}  onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={14}/></TB>
        <TB title="Numbered" active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={14}/></TB>
        <div className="w-px h-5 bg-gray-300 dark:bg-slate-600 mx-1"/>
        <TB title="Link" onClick={() => { const url = prompt('লিংক দিন:'); if (url) editor?.chain().focus().setLink({ href: url }).run() }}><Link2 size={14}/></TB>
        <TB title="Paragraph" onClick={() => editor?.chain().focus().setParagraph().run()}><AlignLeft size={14}/></TB>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-5 py-4 min-h-[220px] dark:prose-invert resize-y overflow-auto [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[200px]"
      />
      <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
        <span className="text-[10px] text-gray-400 flex items-center gap-1">
          🎙️ ভয়েস বাটন চেপে বলুন
        </span>
        <span className="text-[10px] text-gray-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded font-mono">
          শব্দ: <strong>{totalWords}</strong> │ বর্ণ: <strong>{totalChars}</strong> │ আগে: <strong>{cursorWords.before}</strong> │ পরে: <strong>{cursorWords.after}</strong>
        </span>
      </div>
    </div>
  )
}

// ── Main Component ──
export default function PrintArticleEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const [assignmentId, setAssignmentId] = useState(location.state?.assignmentId || new URLSearchParams(location.search).get('assignmentId'))
  const { categories, printPages = [], printPositions = [], printEditions = [] } = useSettings()
  const { user } = useAuth()

  const [saving, setSaving] = useState(false)
  const [lockedBy, setLockedBy] = useState(null)
  const [lastSaved, setLastSaved] = useState(null)
  const [isBreakingNews, setIsBreakingNews] = useState(false)
  const [showReassign, setShowReassign] = useState(false)

  // Left column fields
  const [edition, setEdition] = useState('print')
  const [title, setTitle] = useState('')
  const [bannerHeadline, setBannerHeadline] = useState('')
  const [tagLine, setTagLine] = useState('')
  const [bodyContent, setBodyContent] = useState('<p></p>')
  const [intro, setIntro] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [coverImagePreview, setCoverImagePreview] = useState('')
  const [submissionTracking, setSubmissionTracking] = useState(null)
  const [photoCaption, setPhotoCaption] = useState('')
  const [byline, setByline] = useState(user?.name || '')
  const [source, setSource] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [externalNote, setExternalNote] = useState('')

  // Right sidebar — Print placement
  const [printPage, setPrintPage] = useState('প্রথম পাতা')
  const [printPosition, setPrintPosition] = useState('লিড স্টোরি')
  const [printEditionsSelected, setPrintEditionsSelected] = useState(['প্রথম সংস্করণ'])
  const [columnCount, setColumnCount] = useState(4)
  const [heightInches, setHeightInches] = useState(5)
  const [printPriority, setPrintPriority] = useState(1)
  const [readyForPrint, setReadyForPrint] = useState(false)
  const [graphicAssets, setGraphicAssets] = useState([])
  const [headlineFont, setHeadlineFont] = useState('Georgia, serif')
  const [headlineSize, setHeadlineSize] = useState(36)
  const [headlineWeight, setHeadlineWeight] = useState('bold')
  const [headlineLineH, setHeadlineLineH] = useState(1.15)
  const [headlineAlign, setHeadlineAlign] = useState('left')
  const [bodyFont, setBodyFont] = useState('Arial, sans-serif')
  const [bodySize, setBodySize] = useState(12)
  const [bodyWeight, setBodyWeight] = useState('normal')
  const [bodyLineH, setBodyLineH] = useState(1.65)
  const [template, setTemplate] = useState('photo-top')
  const [isJumpNews, setIsJumpNews] = useState(false)
  const [jumpPageNumber, setJumpPageNumber] = useState('দ্বিতীয় পাতা')
  const [jumpColumn, setJumpColumn] = useState(1)
  const [jumpHeadline, setJumpHeadline] = useState('প্রথম পৃষ্ঠার পর')
  const [jumpSplitWords, setJumpSplitWords] = useState(150)
  const [jumpColSpan, setJumpColSpan] = useState(2)
  const [jumpHeightInches, setJumpHeightInches] = useState(8)

  const [showPreviewModal, setShowPreviewModal] = useState(false)

  // Right sidebar — Category & Routing
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [assignedTo, setAssignedTo] = useState(user?.name || '')
  const [deadline, setDeadline] = useState('')
  const [locationField, setLocationField] = useState('')
  const [priority, setPriority] = useState('High')

  // Autosave
  const payloadRef = useRef({})
  const lastSavedStrRef = useRef('')

  // 🔒 Lock / Unlock Logic 🔒
  useEffect(() => {
    // Check if locked
    const checkLock = async () => {
      try {
        const res = await api.get(`/articles/${id}`);
        const article = res.data;
        if (article.lockedBy && article.lockedBy._id !== user?.id && article.lockedBy._id !== user?._id) {
          // If less than 30 mins, treat as locked
          const THIRTY_MINS = 30 * 60 * 1000;
          if (new Date() - new Date(article.lockedAt) < THIRTY_MINS) {
            setLockedBy(article.lockedBy.name || 'Another user');
          }
        }
      } catch (err) {
        console.error('Error checking lock status', err);
      }
    };

    if (id) checkLock();

    const lockArticle = async () => {
      if (id) {
        try {
          await api.post(`/articles/${id}/lock`);
        } catch (err) {
          if (err.response && err.response.status === 423) {
            setLockedBy(err.response.data.lockedBy || 'Another user');
          }
        }
      }
    };

    lockArticle();
    
    // Setup heartbeat to keep lock alive every 10 mins
    const interval = setInterval(lockArticle, 10 * 60 * 1000);

    const unlockOnLeave = () => {
      const token = localStorage.getItem('cms_token') || localStorage.getItem('token');
      if (token && id) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const url = `${apiUrl}/articles/${id}/unlock`;
        if (navigator.sendBeacon) {
          const headers = new Blob([JSON.stringify({ token: token })], { type: 'application/json' });
          navigator.sendBeacon(url, headers);
        } else {
          fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            keepalive: true
          }).catch(err => console.error('Unlock failed on leave', err));
        }
      }
    };

    window.addEventListener('beforeunload', unlockOnLeave);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', unlockOnLeave);
      unlockOnLeave();
    };
  }, [id]);


  const buildPayload = () => ({
    title, bannerHeadline, tagLine,
    synopsis: intro,
    byline, source,
    category, subCategory,
    coverImage: coverImage || '',
    photoCaption,
    isBreakingNews,
    edition,
    printEdition: {
      pageNumber: printPage,
      placementTag: printPosition,
      editions: printEditionsSelected,
      colSpan: columnCount,
      heightInches,
      headlineFont,
      headlineSize,
      headlineWeight,
      headlineLineH,
      headlineAlign,
      bodyFont,
      bodySize,
      bodyWeight,
      bodyLineH,
      template,
      printPriority,
      readyForPrint,
      graphicAssets,
      isJumpNews,
      jumpPageNumber,
      jumpColumn,
      jumpHeadline,
      jumpSplitWords,
      jumpColSpan,
      jumpHeightInches,
    },
    blocks: [{ type: 'text', content: bodyContent }],
    status: 'draft',
    ...(assignmentId && { assignmentId }),
  })

  useEffect(() => {
    payloadRef.current = buildPayload()
  })

  // Autosave every 5s
  useEffect(() => {
    const timer = setInterval(async () => {
      const payload = payloadRef.current
      const str = JSON.stringify(payload)
      if (str !== lastSavedStrRef.current && payload.title?.trim()) {
        try {
          if (id) {
            await api.put(`/articles/${id}`, payload)
          } else {
            const res = await api.post('/articles', payload)
            if (res.data?._id) {
              navigate(`/print/articles/edit/${res.data._id}`, { replace: true })
            }
          }
          setLastSaved(new Date())
          lastSavedStrRef.current = str
        } catch (err) {
          console.error('Autosave error', err)
          if (err.response && err.response.status === 423) {
            setLockedBy(err.response.data.lockedBy || 'Another user')
          }
        }
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [id, navigate])

  // Load existing article
  useEffect(() => {
    if (!id) return
    api.get(`/articles/${id}`).then(res => {
      const a = res.data
      if (!assignmentId && a.assignmentId) setAssignmentId(a.assignmentId)
      setEdition(a.edition || 'print')
      setTitle(a.title || '')
      setBannerHeadline(a.bannerHeadline || '')
      setTagLine(a.tagLine || '')
      setIntro(a.synopsis || '')
      setByline(a.byline || '')
      setSource(a.source || '')
      setCategory(a.category || '')
      setSubCategory(a.subCategory || '')
      setCoverImagePreview(getImageUrl(a.coverImage))
      setCoverImage(a.coverImage || '')
      setPhotoCaption(a.photoCaption || '')
      setIsBreakingNews(a.isBreakingNews || false)
      setPrintPage(a.printEdition?.pageNumber || 'প্রথম পাতা')
      setPrintPosition(a.printEdition?.placementTag || 'লিড স্টোরি')
      setPrintEditionsSelected(a.printEdition?.editions?.length > 0 ? a.printEdition.editions : ['প্রথম সংস্করণ'])
      setColumnCount(a.printEdition?.colSpan || a.printEdition?.columnCount || 4)
      setHeightInches(a.printEdition?.heightInches || 5)
      setHeadlineFont(a.printEdition?.headlineFont || 'Georgia, serif')
      setHeadlineSize(a.printEdition?.headlineSize || 36)
      setHeadlineWeight(a.printEdition?.headlineWeight || 'bold')
      setHeadlineLineH(a.printEdition?.headlineLineH || 1.15)
      setHeadlineAlign(a.printEdition?.headlineAlign || 'left')
      setBodyFont(a.printEdition?.bodyFont || 'Arial, sans-serif')
      setBodySize(a.printEdition?.bodySize || 12)
      setBodyWeight(a.printEdition?.bodyWeight || 'normal')
      setBodyLineH(a.printEdition?.bodyLineH || 1.65)
      setTemplate(a.printEdition?.template || 'photo-top')
      setPrintPriority(a.printEdition?.printPriority || 1)
      setReadyForPrint(a.printEdition?.readyForPrint || false)
      setGraphicAssets(a.printEdition?.graphicAssets || [])
      setIsJumpNews(a.printEdition?.isJumpNews || false)
      setJumpPageNumber(a.printEdition?.jumpPageNumber || 'দ্বিতীয় পাতা')
      setJumpColumn(a.printEdition?.jumpColumn || 1)
      setJumpHeadline(a.printEdition?.jumpHeadline || 'প্রথম পৃষ্ঠার পর')
      setJumpSplitWords(a.printEdition?.jumpSplitWords || 150)
      setJumpColSpan(a.printEdition?.jumpColSpan || 2)
      setJumpHeightInches(a.printEdition?.jumpHeightInches || 8)
      if (a.blocks?.length > 0) setBodyContent(a.blocks[0].content || '<p></p>')
      if (a.editorialStage && a.editorialStage.submissionTracking) {
        setSubmissionTracking(a.editorialStage.submissionTracking)
      }
    }).catch(console.error)
  }, [id])

  const explicitUnlock = async (articleId = id) => {
    if (articleId) {
      try {
        await api.post(`/articles/${articleId}/unlock`);
      } catch (err) {
        console.error('Explicit unlock failed', err);
      }
    }
  };

  const unlockAndNavigate = async (path, articleId = id) => {
    await explicitUnlock(articleId);
    navigate(path);
  };

  const handleSubmitComponent = async (component) => {
    // First save the current draft state
    setSaving(true)
    try {
      const payload = { ...buildPayload(), status: 'draft' }
      let savedId = id
      if (id) {
        await api.put(`/articles/${id}`, payload)
      } else {
        const res = await api.post('/articles', payload)
        savedId = res.data._id
      }
      
      await api.post(`/articles/${savedId}/submit-component`, { component })
      let successMsg = 'ছবি/মিডিয়া সফলভাবে সাবমিট করা হয়েছে'
      if (component === 'text') successMsg = 'টেক্সট সফলভাবে সাবমিট করা হয়েছে'
      if (component === 'video') successMsg = 'ভিডিও সফলভাবে সাবমিট করা হয়েছে'
      if (component === 'all') successMsg = 'সম্পূর্ণ কাজ সফলভাবে সাবমিট করা হয়েছে'
      
      if (component === 'all') {
        await explicitUnlock(savedId)
        alert(successMsg)
        navigate(assignmentId ? `/workflow/${assignmentId}` : '/print/articles')
      } else {
        alert(successMsg)
        const res = await api.get(`/articles/${savedId}`)
        if (res.data.editorialStage && res.data.editorialStage.submissionTracking) {
          setSubmissionTracking(res.data.editorialStage.submissionTracking)
        }
      }
    } catch (err) {
      console.error(err)
      alert('সাবমিট করতে সমস্যা হয়েছে')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async (status = 'draft') => {
    if (!title.trim()) { alert('শিরোনাম দিন।'); return }
    setSaving(true)
    try {
      const isAssigningOnline = status === 'assign_online';
      const finalStatus = isAssigningOnline ? 'published' : status;
      const payload = { ...buildPayload(), status: finalStatus };

      if (finalStatus === 'published') {
        payload.printEdition = { ...payload.printEdition, readyForPrint: true }
      }
      
      let articleId = id
      if (id) {
        await api.put(`/articles/${id}`, payload)
      } else {
        const res = await api.post('/articles', payload)
        articleId = res.data?._id
      }
      
      if (isAssigningOnline && assignmentId) {
         await api.put(`/workflow/${assignmentId}/status`, { 
             status: 'published', 
             note: 'অনলাইন এডিটরের কাছে পাঠানো হয়েছে' 
         });
         await api.put(`/workflow/${assignmentId}`, { edition: 'both' });
         await explicitUnlock(articleId);
         alert('নিউজটি সফলভাবে অনলাইন এডিটরের কাছে অ্যাসাইন করা হয়েছে!');
         navigate(`/workflow/${assignmentId}`);
         return;
      }
      
      setLastSaved(new Date())
      if (finalStatus === 'draft') return
      if (finalStatus === 'published' || finalStatus === 'submitted') {
        if (assignmentId && finalStatus === 'submitted') {
          try {
            // chief_reporter edits go to 'review' status for article editors
            const workflowStatus = user?.role === 'chief_reporter' ? 'review' : 'submitted';
            await api.put(`/workflow/${assignmentId}/assignee-status`, { 
              userId: user.id || user._id, 
              status: workflowStatus, 
              contentId: articleId,
              note: user?.role === 'chief_reporter' ? 'চিফ রিপোর্টার সম্পাদনা করেছেন, রিভিউর জন্য প্রস্তুত' : 'রিপোর্টার লেখা জমা দিয়েছেন' 
            });
            
            // If chief_reporter, automatically forward it to News Management Desk
            if (user?.role === 'chief_reporter') {
              try {
                await api.post(`/print-workflow/${assignmentId}/advance`, { 
                  targetStage: 'sent_to_news_management', 
                  note: 'চিফ রিপোর্টার রিভিউর জন্য জমা দিয়েছেন' 
                });
              } catch (e) {
                console.error('Failed to send to NM desk:', e);
              }
            }
          } catch (statusErr) {
            console.error('Failed to update assignee status:', statusErr);
            const workflowStatus = user?.role === 'chief_reporter' ? 'review' : 'submitted';
            await api.put(`/workflow/${assignmentId}/status`, { status: workflowStatus, note: user?.role === 'chief_reporter' ? 'চিফ রিপোর্টার রিভিউর জন্য জমা দিয়েছেন' : 'রিপোর্টার লেখা জমা দিয়েছেন' });
            
            if (user?.role === 'chief_reporter') {
              try {
                await api.post(`/print-workflow/${assignmentId}/advance`, { 
                  targetStage: 'sent_to_news_management', 
                  note: 'চিফ রিপোর্টার রিভিউর জন্য জমা দিয়েছেন' 
                });
              } catch (e) {
                console.error('Failed to send to NM desk:', e);
              }
            }
          }
        } else if (assignmentId && finalStatus === 'published') {
          try {
            await api.put(`/workflow/${assignmentId}/status`, { status: 'published', note: 'এডিটর সরাসরি প্রিন্টে প্রকাশ করেছেন' });
          } catch (err) {
            console.error('Failed to update assignment status:', err);
          }
        }
        await explicitUnlock(articleId)
        alert(finalStatus === 'submitted' ? 'আর্টিকেলটি রিভিউ এর জন্য জমা দেওয়া হয়েছে!' : 'প্রিন্ট আর্টিকেল সফলভাবে জমা দেওয়া হয়েছে!')
        navigate(assignmentId ? `/workflow/${assignmentId}` : '/print/articles')
      }
    } catch (err) {
      console.error(err)
      alert('সেভ করতে সমস্যা হয়েছে।')
    } finally {
      setSaving(false)
    }
  }

  const handleSendToProof = async () => {
    if (!assignmentId) return alert('অ্যাসাইনমেন্ট আইডি নেই!');
    if (!window.confirm('নিউজটি কি প্রুফ রিডিংয়ের জন্য পাঠাতে চান?')) return;
    
    setSaving(true);
    try {
      await handleSave('draft');
      const payload = {
        targetStage: 'sent_to_proof',
        note: 'এডিটর পেজ থেকে সরাসরি প্রুফে পাঠানো হয়েছে',
        pagePlan: { pageNumber: printPage, position: printPosition, edition: edition }
      };
      await api.post(`/print-workflow/${assignmentId}/advance`, payload);
      await explicitUnlock(id);
      alert('সফলভাবে প্রুফে পাঠানো হয়েছে!');
      navigate('/workflow/nm-desk');
    } catch (err) {
      console.error(err);
      alert('প্রুফে পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  }

  const handleSendToOwnPage = async () => {
    if (!assignmentId) return alert('অ্যাসাইনমেন্ট আইডি নেই!');
    if (!window.confirm('নিউজটি কি সরাসরি ইনডিজাইন (নিজ পাতায়) পাঠাতে চান?')) return;
    
    setSaving(true);
    try {
      await handleSave('published');
      const payload = {
        targetStage: 'sent_to_own_page',
        note: 'এডিটর পেজ থেকে সরাসরি নিজ পাতায় পাঠানো হয়েছে',
        pagePlan: { pageNumber: printPage, position: printPosition, edition: edition }
      };
      await api.post(`/print-workflow/${assignmentId}/advance`, payload);
      await explicitUnlock(id);
      alert('সফলভাবে নিজ পাতায় পাঠানো হয়েছে!');
      navigate('/workflow/nm-desk');
    } catch (err) {
      console.error(err);
      alert('নিজ পাতায় পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  }

  const handleProofApprove = async () => {
    if (!assignmentId) return alert('অ্যাসাইনমেন্ট আইডি নেই!');
    setSaving(true);
    try {
      await handleSave('published');
      await api.post(`/print-workflow/${assignmentId}/advance`, { targetStage: 'sent_to_page', note: 'প্রুফিং সম্পন্ন' });
      await explicitUnlock(id);
      alert('সাফল্যজনকভাবে নিউজটি পেজে পাঠানো হয়েছে!');
      navigate('/workflow/print-proof');
    } catch (err) {
      console.error(err);
      alert('পেজে পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  }

  const handleProofReturn = async (note) => {
    if (!assignmentId) return alert('অ্যাসাইনমেন্ট আইডি নেই!');
    setSaving(true);
    try {
      await handleSave('draft');
      await api.post(`/print-workflow/${assignmentId}/advance`, { targetStage: 'proof_correction', note });
      await explicitUnlock(id);
      alert('সফলভাবে NM ডেস্কে ফেরত পাঠানো হয়েছে!');
      navigate('/workflow/proof-desk');
    } catch (err) {
      console.error(err);
      alert('ফেরত পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const url = res.data.media?.url
      setCoverImage(url)
      setCoverImagePreview(getImageUrl(url))
    } catch (err) {
      console.error(err)
      alert('ছবি আপলোড ব্যর্থ হয়েছে।')
    }
  }

  const toggleGraphicAsset = (asset) => {
    setGraphicAssets(prev =>
      prev.includes(asset) ? prev.filter(a => a !== asset) : [...prev, asset]
    )
  }

  const categoryList = categories?.map(c => c.name).filter(Boolean) || []
  const selectedCategoryObj = categories?.find(c => c.name === category)
  const subCategoryList = selectedCategoryObj?.subCategories || []

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-0">
      
      {/* Locked Overlay */}
      {lockedBy && (
        <div className="fixed inset-0 z-[60] bg-white/70 dark:bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl max-w-md text-center border border-red-100 dark:border-red-900/30">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">আর্টিকেলটি লক করা আছে</h3>
            <p className="text-gray-600 dark:text-slate-400 mb-6">
              বর্তমানে <strong>{lockedBy}</strong> এই আর্টিকেলটি এডিট করছেন। 
              একই সাথে একাধিক এডিটর কাজ করলে সেভ করার সময় তথ্যের গরমিল হতে পারে। তাই দয়া করে তিনি শেষ করা পর্যন্ত অপেক্ষা করুন।
            </p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => navigate('/print-workflow/my-queue')}
                className="bg-gray-900 dark:bg-slate-800 hover:bg-gray-800 dark:hover:bg-slate-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
              >
                ফিরে যান
              </button>
              
              <button 
                onClick={async () => {
                  await explicitUnlock(id);
                  setLockedBy(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors shadow-md"
              >
                ফোর্স আনলক করুন
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Top Bar ── */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl mb-6 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => unlockAndNavigate(assignmentId ? `/workflow/${assignmentId}` : '/workflow/print')}
            className="flex items-center gap-2 text-slate-300 hover:text-white text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl transition-colors"
          >
            <ArrowLeft size={15} /> ফিরে যান
          </button>
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-indigo-400" />
            <span className="text-white font-bold text-base">প্রিন্ট সংস্করণ — স্টোরি রাইটিং</span>
          </div>
          {/* Breaking News Toggle */}
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl">
            <span className="text-xs text-slate-300 font-medium">ব্রেকিং নিউজ</span>
            <button
              onClick={() => setIsBreakingNews(p => !p)}
              className={`w-10 h-5 rounded-full relative transition-colors ${isBreakingNews ? 'bg-red-500' : 'bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isBreakingNews ? 'left-5' : 'left-0.5'}`} />
            </button>
            <span className={`text-xs font-bold ${isBreakingNews ? 'text-red-400' : 'text-slate-500'}`}>
              {isBreakingNews ? 'ON 🔴' : 'Off'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-emerald-400 font-medium">
              ✓ অটো-সেভ: {lastSaved.toLocaleTimeString('bn-BD')}
            </span>
          )}
          {user?.role === 'proof_reader' ? (
            <>
              <button
                onClick={handleProofApprove}
                disabled={saving}
                className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md"
              >
                <CheckCircle size={15} /> পেজে পাঠান
              </button>
              <button
                onClick={() => {
                  const note = window.prompt('কী সংশোধন করতে হবে তা লিখুন:');
                  if (note) handleProofReturn(note);
                }}
                disabled={saving}
                className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md"
              >
                <XCircle size={15} /> ফেরত পাঠান
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="flex items-center gap-2 border border-slate-500 text-slate-200 hover:border-slate-300 hover:text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
              >
                <Save size={15} /> ড্রাফট সেভ
              </button>
              {user?.role !== 'reporter' && (
                <button
                  onClick={() => {
                    if (window.confirm('এই নিউজটি অনলাইন এডিটরের কাছে পাঠাতে চান?')) {
                      handleSave('assign_online');
                    }
                  }}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md"
                >
                  🌐 অনলাইন এডিটরকে দিন
                </button>
              )}
              {user?.role === 'chief_reporter' && (
                <button
                  onClick={() => {
                    if (!assignmentId) {
                      alert('এই আর্টিকেলের সাথে কোনো অ্যাসাইনমেন্ট লিংক নেই। অ্যাসাইনমেন্ট পেজ থেকে Re-assign করুন।')
                      return
                    }
                    setShowReassign(true)
                  }}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md"
                >
                  <UserCheck size={16} /> Re-assign করুন
                </button>
              )}
              {['reporter', 'chief_reporter'].includes(user?.role) ? (
                <button
                  onClick={() => handleSave('submitted')}
                  disabled={saving}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md"
                >
                  {saving ? 'জমা হচ্ছে...' : '📤 রিভিউর জন্য জমা দিন'}
                </button>
              ) : (
                <>
                  {assignmentId && (
                    <>
                      <button
                        onClick={handleSendToProof}
                        disabled={saving}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md"
                      >
                        <Send size={15} /> প্রুফে পাঠান
                      </button>
                      <button
                        onClick={handleSendToOwnPage}
                        disabled={saving}
                        className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md"
                      >
                        <Layout size={15} /> নিজ পাতায় পাঠান
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleSave('published')}
                    disabled={saving}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md"
                  >
                    {saving ? 'জমা হচ্ছে...' : '🖨️ প্রিন্টে জমা দিন'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-8 space-y-5">

          {/* Card 1: Headlines */}
          <SectionCard title="শিরোনাম গুচ্ছ" icon="📰">
            <InputField
              label="প্রধান শিরোনাম"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="মূল শিরোনামটি এখানে লিখুন..."
              maxLength={100}
            />
            <InputField
              label="ব্যানার শিরোনাম"
              value={bannerHeadline}
              onChange={e => setBannerHeadline(e.target.value)}
              placeholder="ব্যানার / প্রিন্ট হেডলাইন (ঐচ্ছিক)..."
            />
            <InputField
              label="ট্যাগ লাইন / স্ট্রিপ"
              value={tagLine}
              onChange={e => setTagLine(e.target.value)}
              placeholder="স্ট্রিপ হেডলাইন বা ট্যাগ লাইন..."
            />
          </SectionCard>

          {/* Card 2: Main Body */}
          <SectionCard title="মূল সংবাদ লিখুন" icon="✍️">
            <RichEditor content={bodyContent} onChange={setBodyContent} />
          </SectionCard>

          {/* Card 3: Intro/Pitch */}
          <SectionCard title="পিচ / সারসংক্ষেপ (Intro)" icon="📝">
            <TextAreaField
              label="সংবাদের মূল বিষয়বস্তু ৩-৪ লাইনে সংক্ষিপ্ত সারসংক্ষেপ"
              value={intro}
              onChange={e => setIntro(e.target.value)}
              placeholder="সংবাদের মূল বিষয়বস্তু ৩-৪ লাইনে সংক্ষিপ্ত সারসংক্ষেপ..."
              rows={4}
              maxLength={500}
            />
          </SectionCard>

          {/* Card 4: Media */}
          <SectionCard title="মিডিয়া ও সংযুক্তি" icon="🖼️">
            <div className="space-y-4">
              <label className="block cursor-pointer">
                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${coverImagePreview ? 'border-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/20' : 'border-gray-200 dark:border-slate-700 hover:border-indigo-300'}`}>
                  {coverImagePreview ? (
                    <div className="relative">
                      <img src={coverImagePreview} alt="cover" className="max-h-52 mx-auto rounded-xl object-cover" />
                      <button
                        onClick={(e) => { e.preventDefault(); setCoverImagePreview(''); setCoverImage('') }}
                        className="absolute top-2 right-2 bg-white dark:bg-slate-900 rounded-full p-1 shadow"
                      >
                        <X size={14} className="text-gray-600" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload size={28} className="mx-auto text-gray-300" />
                      <p className="text-sm text-gray-400">ছবি, ভিডিও, অডিও, ডকুমেন্ট আপলোড করুন বা ড্র্যাগ করুন</p>
                      <p className="text-xs text-gray-300">JPG, PNG, MP4, PDF সাপোর্টেড</p>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*,video/*,audio/*,.pdf" className="hidden" onChange={handlePhotoUpload} />
              </label>
              <InputField
                label="ফটো ক্যাপশন"
                value={photoCaption}
                onChange={e => setPhotoCaption(e.target.value)}
                placeholder="ছবির বিবরণ লিখুন..."
              />
            </div>
          </SectionCard>

          {/* Card 5: External Sources */}
          <SectionCard title="বাহ্যিক সূত্র ও রেফারেন্স" icon="🔗">
            <div className="grid grid-cols-2 gap-4">
              <InputField label="URL" value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://..." />
              <InputField label="নোট" value={externalNote} onChange={e => setExternalNote(e.target.value)} placeholder="সূত্র সম্পর্কে নোট..." />
            </div>
          </SectionCard>
        </div>

        {/* 🗂️ RIGHT SIDEBAR 🗂️ */}
        <div className="lg:col-span-4 space-y-5">



          {/* Card A: Print Placement — indigo gradient */}
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-5 space-y-4">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Printer size={16} /> প্রিন্ট প্লেসমেন্ট ও লেআউট
              </h3>

              {/* Platform */}
              <div>
                <label className="block text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1.5">প্ল্যাটফর্ম</label>
                <div className="bg-white/20 text-white text-sm px-4 py-2.5 rounded-xl font-medium">📰 প্রিন্ট এডিশন</div>
              </div>

              {/* Target Page */}
              <div>
                <label className="block text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1.5">পৃষ্ঠা (Target Page)</label>
                <select
                  value={printPage}
                  onChange={e => setPrintPage(e.target.value)}
                  className="w-full bg-white/20 text-white text-sm px-4 py-2.5 rounded-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="" className="text-gray-900">পৃষ্ঠা নির্বাচন করুন</option>
                  {printPages.map(p => <option key={p} value={p} className="text-gray-900">{p}</option>)}
                </select>
              </div>

              {/* Position */}
              <div>
                <label className="block text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1.5">পজিশন</label>
                <select
                  value={printPosition}
                  onChange={e => setPrintPosition(e.target.value)}
                  className="w-full bg-white/20 text-white text-sm px-4 py-2.5 rounded-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="" className="text-gray-900">পজিশন নির্বাচন করুন</option>
                  {printPositions.map(p => <option key={p} value={p} className="text-gray-900">{p}</option>)}
                </select>
              </div>

              {/* Edition */}
              <div>
                <label className="block text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">প্রিন্ট এডিশন (একাধিক সিলেক্ট করা যাবে)</label>
                <div className="flex flex-col gap-2 bg-white/10 p-3 rounded-xl border border-white/20">
                  {printEditions.map(e => (
                    <label key={e} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printEditionsSelected.includes(e)}
                        onChange={(e_obj) => {
                          if (e_obj.target.checked) {
                            setPrintEditionsSelected([...printEditionsSelected, e]);
                          } else {
                            setPrintEditionsSelected(printEditionsSelected.filter(item => item !== e));
                          }
                        }}
                        className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 border-white/30 bg-white/20"
                      />
                      <span className="text-sm font-medium text-white">{e}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Column Count */}
              <div>
                <label className="block text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">কলাম সংখ্যা (Width)</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <button
                      key={`col-${n}`}
                      onClick={() => setColumnCount(n)}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${columnCount === n
                        ? 'bg-white text-indigo-700 shadow-md'
                        : 'bg-white/20 text-white hover:bg-white/30'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jump News Section */}
              <div className="mb-4 bg-white/10 p-3 rounded-lg border border-white/20">
                <label className="flex items-center space-x-2 text-sm font-semibold text-white cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={isJumpNews}
                    onChange={(e) => setIsJumpNews(e.target.checked)}
                    className="rounded border-white/30 text-indigo-500 focus:ring-indigo-500 bg-white/20"
                  />
                  <span>লিংক নিউজ (Jump News)</span>
                </label>
                
                {isJumpNews && (
                  <div className="space-y-3 mt-3">
                    <div>
                      <label className="block text-xs text-indigo-200 font-medium mb-1">লিংক পেজ</label>
                      <select 
                        value={jumpPageNumber} 
                        onChange={e => setJumpPageNumber(e.target.value)}
                        className="w-full rounded text-sm bg-white/20 border-white/30 text-white focus:ring-white focus:border-white"
                      >
                        {['দ্বিতীয় পাতা', 'তৃতীয় পাতা', 'চতুর্থ পাতা', 'পঞ্চম পাতা', 'ষষ্ঠ পাতা', 'সপ্তম পাতা', 'অষ্টম পাতা', 'নবম পাতা', 'দশম পাতা', 'একাদশ পাতা', 'শেষ পাতা'].map(p => (
                          <option key={p} value={p} className="text-black">{p}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-indigo-200 font-medium mb-1">কলাম</label>
                        <input 
                          type="number" 
                          min="1" max="12"
                          value={jumpColumn}
                          onChange={e => setJumpColumn(Number(e.target.value))}
                          className="w-full rounded text-sm bg-white/20 border-white/30 text-white focus:ring-white focus:border-white"
                        />
                      </div>
                      <div className="flex-[2]">
                        <label className="block text-xs text-indigo-200 font-medium mb-1">লিংকের শিরোনাম</label>
                        <input 
                          type="text" 
                          value={jumpHeadline}
                          onChange={e => setJumpHeadline(e.target.value)}
                          placeholder="প্রথম পৃষ্ঠার পর"
                          className="w-full rounded text-sm bg-white/20 border-white/30 text-white placeholder-white/50 focus:ring-white focus:border-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-indigo-200 font-medium mb-1">জাম্প বক্স প্রস্থ</label>
                        <select
                          value={jumpColSpan}
                          onChange={e => setJumpColSpan(Number(e.target.value))}
                          className="w-full rounded text-sm bg-white/20 border-white/30 text-white focus:ring-white focus:border-white"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                            <option key={n} value={n} className="text-black">{n} কলাম</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-indigo-200 font-medium mb-1">জাম্প বক্স উচ্চতা</label>
                        <input 
                          type="number" 
                          min="1" max="22" step="0.5"
                          value={jumpHeightInches}
                          onChange={e => setJumpHeightInches(Number(e.target.value))}
                          className="w-full rounded text-sm bg-white/20 border-white/30 text-white focus:ring-white focus:border-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Height in Inches */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-indigo-200 text-xs font-semibold uppercase tracking-wider">উচ্চতা (ইঞ্চি)</label>
                  <span className="text-white text-xs font-bold bg-white/20 px-2 py-0.5 rounded">{heightInches}"</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="22"
                  step="0.5"
                  value={heightInches}
                  onChange={(e) => setHeightInches(parseFloat(e.target.value))}
                  className="w-full accent-white"
                />
              </div>

              {/* ── Print Typography ── */}
              <div className="space-y-4">
                <h4 className="text-white text-xs font-black uppercase tracking-widest border-b border-white/10 pb-2 flex items-center gap-2">
                  📰 প্রিন্ট টাইপোগ্রাফি
                </h4>

                {/* Template */}
                <div>
                  <label className="block text-indigo-200 text-[10px] uppercase mb-1">টেমপ্লেট</label>
                  <select value={template} onChange={e => setTemplate(e.target.value)}
                    className="w-full bg-white/10 text-white text-xs px-3 py-2 rounded-lg border border-white/20 focus:outline-none">
                    <option value="photo-top" className="text-gray-900">উপরে ছবি</option>
                    <option value="photo-bottom" className="text-gray-900">নিচে ছবি</option>
                    <option value="photo-left" className="text-gray-900">বামে ছবি (অর্ধেক)</option>
                    <option value="photo-right" className="text-gray-900">ডানে ছবি (অর্ধেক)</option>
                    <option value="text-only" className="text-gray-900">শুধু লেখা (ছবি ছাড়া)</option>
                  </select>
                </div>

                {/* Headline group */}
                <div className="bg-indigo-950/60 border border-indigo-400/20 rounded-xl p-3 space-y-3">
                  <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">📰 হেডলাইন</p>

                  <div>
                    <label className="block text-indigo-200 text-[10px] uppercase mb-1">ফন্ট</label>
                    <select value={headlineFont} onChange={e => setHeadlineFont(e.target.value)}
                      className="w-full bg-white/10 text-white text-xs px-2 py-1.5 rounded-lg border border-white/20 focus:outline-none">
                      <option value="'Noto Serif Bengali', serif" className="text-gray-900">প্রথম আলো স্টাইল (Noto Serif)</option>
                      <option value='Georgia, serif' className="text-gray-900">Georgia (Serif)</option>
                      <option value='"Times New Roman", serif' className="text-gray-900">Times New Roman (Serif)</option>
                      <option value='Arial, sans-serif' className="text-gray-900">Arial (Sans-serif)</option>
                      <option value='Verdana, sans-serif' className="text-gray-900">Verdana (Sans-serif)</option>
                      <option value='"Courier New", monospace' className="text-gray-900">Courier New (Monospace)</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-indigo-200 text-[10px] uppercase mb-1">সাইজ (pt)</label>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setHeadlineSize(s => Math.max(12, s-1))}
                          className="w-6 h-6 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-bold">−</button>
                        <input type="number" value={headlineSize} onChange={e => setHeadlineSize(Number(e.target.value))}
                          className="w-10 text-center bg-white/10 text-white text-xs rounded border border-white/20 py-0.5 focus:outline-none"/>
                        <button onClick={() => setHeadlineSize(s => Math.min(96, s+1))}
                          className="w-6 h-6 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-bold">+</button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-indigo-200 text-[10px] uppercase mb-1">লাইন স্পেস</label>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setHeadlineLineH(v => parseFloat(Math.max(0.8, v-0.05).toFixed(2)))}
                          className="w-6 h-6 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-bold">−</button>
                        <input type="number" value={headlineLineH} step="0.05" onChange={e => setHeadlineLineH(parseFloat(e.target.value))}
                          className="w-12 text-center bg-white/10 text-white text-xs rounded border border-white/20 py-0.5 focus:outline-none"/>
                        <button onClick={() => setHeadlineLineH(v => parseFloat(Math.min(3, v+0.05).toFixed(2)))}
                          className="w-6 h-6 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-bold">+</button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-indigo-200 text-[10px] uppercase mb-1">ওয়েট</label>
                    <div className="flex gap-1">
                      {['normal','bold','black'].map(w => (
                        <button key={w} onClick={() => setHeadlineWeight(w)}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${
                            headlineWeight===w ? 'bg-white text-indigo-800' : 'bg-white/20 text-white hover:bg-white/30'
                          }`}>
                          {w==='normal'?'নরমাল':w==='bold'?'বোল্ড':'ব্ল্যাক'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-indigo-200 text-[10px] uppercase mb-1">এলাইনমেন্ট (Alignment)</label>
                    <div className="flex gap-1">
                      {['left','center','right'].map(a => (
                        <button key={a} onClick={() => setHeadlineAlign(a)}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all capitalize ${
                            headlineAlign===a ? 'bg-white text-indigo-800' : 'bg-white/20 text-white hover:bg-white/30'
                          }`}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Body group */}
                <div className="bg-emerald-950/40 border border-emerald-400/20 rounded-xl p-3 space-y-3">
                  <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest">📄 নিউজ বডি</p>

                  <div>
                    <label className="block text-emerald-200 text-[10px] uppercase mb-1">ফন্ট</label>
                    <select value={bodyFont} onChange={e => setBodyFont(e.target.value)}
                      className="w-full bg-white/10 text-white text-xs px-2 py-1.5 rounded-lg border border-white/20 focus:outline-none">
                      <option value="'Hind Siliguri', sans-serif" className="text-gray-900">প্রথম আলো স্টাইল (Hind Siliguri)</option>
                      <option value='Arial, sans-serif' className="text-gray-900">Arial (Sans-serif)</option>
                      <option value='Verdana, sans-serif' className="text-gray-900">Verdana (Sans-serif)</option>
                      <option value='Georgia, serif' className="text-gray-900">Georgia (Serif)</option>
                      <option value='"Times New Roman", serif' className="text-gray-900">Times New Roman (Serif)</option>
                      <option value='"Courier New", monospace' className="text-gray-900">Courier New (Monospace)</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-emerald-200 text-[10px] uppercase mb-1">সাইজ (pt)</label>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setBodySize(s => Math.max(6, s-1))}
                          className="w-6 h-6 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-bold">−</button>
                        <input type="number" value={bodySize} onChange={e => setBodySize(Number(e.target.value))}
                          className="w-10 text-center bg-white/10 text-white text-xs rounded border border-white/20 py-0.5 focus:outline-none"/>
                        <button onClick={() => setBodySize(s => Math.min(24, s+1))}
                          className="w-6 h-6 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-bold">+</button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-emerald-200 text-[10px] uppercase mb-1">লাইন স্পেস</label>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setBodyLineH(v => parseFloat(Math.max(1, v-0.05).toFixed(2)))}
                          className="w-6 h-6 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-bold">−</button>
                        <input type="number" value={bodyLineH} step="0.05" onChange={e => setBodyLineH(parseFloat(e.target.value))}
                          className="w-12 text-center bg-white/10 text-white text-xs rounded border border-white/20 py-0.5 focus:outline-none"/>
                        <button onClick={() => setBodyLineH(v => parseFloat(Math.min(4, v+0.05).toFixed(2)))}
                          className="w-6 h-6 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-bold">+</button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-emerald-200 text-[10px] uppercase mb-1">ওয়েট</label>
                    <div className="flex gap-1">
                      {['normal','bold','black'].map(w => (
                        <button key={w} onClick={() => setBodyWeight(w)}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${
                            bodyWeight===w ? 'bg-emerald-400 text-emerald-900' : 'bg-white/20 text-white hover:bg-white/30'
                          }`}>
                          {w==='normal'?'নরমাল':w==='bold'?'বোল্ড':'ব্ল্যাক'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mini Preview */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <label className="block text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-3 text-center">নিউজপেপার পেজ প্রিভিউ</label>
                <div className="w-[160px] h-[220px] bg-white mx-auto relative shadow-lg">
                  {/* Grid background */}
                  <div className="absolute inset-0 grid grid-cols-8 gap-[1px] opacity-10">
                    {[...Array(8)].map((_, i) => <div key={i} className="bg-blue-900 h-full w-full"></div>)}
                  </div>
                  {/* Active Area Preview */}
                  <div 
                    className="absolute bg-blue-600/80 border-2 border-blue-800 shadow-md transition-all duration-300 flex items-center justify-center overflow-hidden"
                    style={{
                      top: '0', 
                      left: '0',
                      width: `${(columnCount / 8) * 100}%`,
                      height: `${(heightInches / 22) * 100}%`
                    }}
                  >
                    <span className="text-white text-[10px] font-bold text-center leading-tight">
                      {columnCount} Col<br/>×<br/>{heightInches}"
                    </span>
                  </div>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">প্রিন্ট প্রায়োরিটি</label>
                <div className="flex gap-3">
                  {[
                    { val: 1, label: '১ উচ্চ' },
                    { val: 2, label: '২ মধ্যম' },
                    { val: 3, label: '৩ সাধারণ' },
                  ].map(p => (
                    <label key={p.val} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={printPriority === p.val}
                        onChange={() => setPrintPriority(p.val)}
                        className="accent-white"
                      />
                      <span className="text-white text-xs font-medium">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Ready for Print Toggle */}
              <div className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3">
                <span className="text-white text-sm font-medium">প্রিন্টের জন্য প্রস্তুত</span>
                <button
                  onClick={() => setReadyForPrint(p => !p)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${readyForPrint ? 'bg-emerald-400' : 'bg-white/30'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${readyForPrint ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Graphic Asset Checklist */}
              <div>
                <label className="block text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">গ্রাফিক অ্যাসেট চেকলিস্ট</label>
                <div className="space-y-1.5">
                  {GRAPHIC_ASSETS.map(asset => (
                    <label key={asset} className="flex items-center gap-2 cursor-pointer">
                      <button onClick={() => toggleGraphicAsset(asset)}>
                        {graphicAssets.includes(asset)
                          ? <CheckSquare size={16} className="text-emerald-300" />
                          : <Square size={16} className="text-white/50" />}
                      </button>
                      <span className="text-white/80 text-xs">{asset}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Category & Routing */}
          <SectionCard title="ক্যাটাগরি ও রাউটিং" icon="📂">
            <div>
              <FieldLabel>অ্যাসাইন করা হয়েছে</FieldLabel>
              <div className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                {assignedTo || user?.name || 'Current User'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>ক্যাটাগরি</FieldLabel>
                <select
                  value={category}
                  onChange={e => { setCategory(e.target.value); setSubCategory('') }}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                >
                  <option value="">বেছে নিন</option>
                  {categoryList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>সাব-ক্যাটাগরি</FieldLabel>
                <select
                  value={subCategory}
                  onChange={e => setSubCategory(e.target.value)}
                  disabled={!category || subCategoryList.length === 0}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">বেছে নিন</option>
                  {subCategoryList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <FieldLabel>ডেডলাইন</FieldLabel>
              <input
                type="datetime-local"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>

            <InputField
              label="লোকেশন"
              value={locationField}
              onChange={e => setLocationField(e.target.value)}
              placeholder="ঢাকা, বেইজ রুম..."
            />

            {/* Priority Pills */}
            <div>
              <FieldLabel>প্রায়োরিটি</FieldLabel>
              <div className="flex gap-2">
                {['High', 'Medium', 'Low'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                      priority === p
                        ? p === 'High' ? 'bg-red-500 text-white border-red-500'
                          : p === 'Medium' ? 'bg-amber-400 text-white border-amber-400'
                          : 'bg-green-500 text-white border-green-500'
                        : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-gray-400'
                    }`}
                  >
                    {p === 'High' ? '🔴 উচ্চ' : p === 'Medium' ? '🟡 মধ্যম' : '🟢 সাধারণ'}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Card C: Byline */}
          <SectionCard title="বাইলাইন ও সূত্র" icon="👤">
            <InputField
              label="রিপোর্টারের নাম"
              value={byline}
              onChange={e => setByline(e.target.value)}
              placeholder="সাংবাদিকের নাম..."
            />
            <InputField
              label="সূত্র / Source"
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="নিউজ সোর্স..."
            />
          </SectionCard>
        </div>
      </div>

      {/* Bottom Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between z-50 shadow-lg">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            প্রিন্ট এডিটর
          </span>
          {isBreakingNews && (
            <span className="bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full text-[10px] animate-pulse">
              🔴 BREAKING
            </span>
          )}
          {readyForPrint && (
            <span className="bg-emerald-100 text-emerald-600 font-bold px-2 py-0.5 rounded-full text-[10px]">
              ✅ প্রিন্ট রেডি
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-1.5 border border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-400 text-sm font-bold px-4 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
          >
            <Eye size={16} /> Preview
          </button>
          {user?.role === 'proof_reader' ? (
            <>
              <button
                onClick={() => {
                  const note = window.prompt('কী সংশোধন করতে হবে তা লিখুন:');
                  if (note) handleProofReturn(note);
                }}
                disabled={saving}
                className="border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm font-bold px-6 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
              >
                ফেরত পাঠান
              </button>
              <button
                onClick={handleProofApprove}
                disabled={saving}
                className="bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold px-6 py-2 rounded-xl transition-colors shadow-md"
              >
                {saving ? 'প্রসেস হচ্ছে...' : 'পেজে পাঠান'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-bold px-6 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                Draft
              </button>
              {['reporter', 'chief_reporter'].includes(user?.role) ? (
                <div className="flex gap-2">
                  <button onClick={() => handleSubmitComponent('all')} disabled={saving || (submissionTracking && submissionTracking.text?.isSubmitted && submissionTracking.media?.isSubmitted)}
                    className={`flex items-center gap-2 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-md ${(submissionTracking && submissionTracking.text?.isSubmitted && submissionTracking.media?.isSubmitted) ? 'bg-gray-400' : 'bg-rose-600 hover:bg-rose-700 hover:shadow-rose-500/20'}`}>
                    <CheckCircle size={16} /> {(submissionTracking && submissionTracking.text?.isSubmitted && submissionTracking.media?.isSubmitted) ? 'সম্পূর্ণ সাবমিটেড' : 'সব জমা দিন'}
                  </button>
                  <button onClick={() => handleSubmitComponent('text')} disabled={saving || (submissionTracking && submissionTracking.text && submissionTracking.text.isSubmitted)}
                    className={`flex items-center gap-2 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-md ${(submissionTracking && submissionTracking.text && submissionTracking.text.isSubmitted) ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/20'}`}>
                    <Newspaper size={16} /> {(submissionTracking && submissionTracking.text && submissionTracking.text.isSubmitted) ? 'টেক্সট সাবমিটেড' : 'টেক্সট জমা দিন'}
                  </button>
                  <button onClick={() => handleSubmitComponent('media')} disabled={saving || (submissionTracking && submissionTracking.media && submissionTracking.media.isSubmitted)}
                    className={`flex items-center gap-2 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-md ${(submissionTracking && submissionTracking.media && submissionTracking.media.isSubmitted) ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/20'}`}>
                    <ImageIcon size={16} /> {(submissionTracking && submissionTracking.media && submissionTracking.media.isSubmitted) ? 'ছবি সাবমিটেড' : 'ছবি জমা দিন'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleSave('published')}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-6 py-2 rounded-xl transition-colors shadow-md"
                >
                  {saving ? 'জমা হচ্ছে...' : 'Publish to Print'}
                </button>
              )}
              {id && user?.role !== 'reporter' && (
                <button
                  onClick={() => {
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                    window.open(`${apiUrl}/indesign/raw-article/${id}/icml`, '_blank');
                  }}
                  className="flex items-center gap-1.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md transition-colors"
                >
                  📥 Send to InDesign
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showReassign && assignmentId && (
        <ReassignFromEditorModal
          assignmentId={assignmentId}
          edition={edition}
          onClose={(success) => {
            if (success) unlockAndNavigate(`/workflow/${assignmentId}`)
          }}
        />
      )}

      <ArticlePreviewModal 
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        articleData={{
          title,
          byline,
          content: bodyContent,
          coverImagePreview,
          printEdition: {
            colSpan: columnCount,
            heightInches,
            headlineFont,
            headlineSize,
            headlineWeight,
            headlineLineH,
            headlineAlign,
            bodyFont,
            bodySize,
            bodyWeight,
            bodyLineH,
            template
          }
        }}
      />
    </div>
  )
}
