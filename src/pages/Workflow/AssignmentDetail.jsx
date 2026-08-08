import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useWorkflow } from '../../context/WorkflowContext'
import { useSettings } from '../../context/SettingsContext'
import { useAuth } from '../../context/AuthContext'
import {
  ArrowLeft, Clock, CheckCircle, XCircle, Send,
  RotateCcw, Eye, User, Calendar, Pencil, Sparkles, AlertTriangle, History, X
} from 'lucide-react'
import SearchableSelect from '../../components/SearchableSelect'

const STATUS_CONFIG = {
  pending:       { label: 'অপেক্ষায়',       color: 'bg-yellow-100 text-yellow-700' },
  self_pending:  { label: 'Approval দরকার',  color: 'bg-orange-100 text-orange-700' },
  self_approved: { label: 'Approved',        color: 'bg-blue-100 text-blue-700' },
  self_rejected: { label: 'Rejected',        color: 'bg-red-100 text-red-600' },
  accepted:      { label: 'গৃহীত',           color: 'bg-blue-100 text-blue-700' },
  reporter_writing: { label: 'রিপোর্টার লিখছে',      color: 'bg-purple-100 text-purple-700' },
  writing:       { label: 'লেখা চলছে',      color: 'bg-purple-100 text-purple-700' },
  reporter_submitted: { label: 'ডিপার্টমেন্টে জমা', color: 'bg-orange-100 text-orange-700' },
  submitted:     { label: 'জমা দেওয়া',      color: 'bg-orange-100 text-orange-700' },
  department_review: { label: 'ডিপার্টমেন্ট রিভিউ', color: 'bg-indigo-100 text-indigo-700' },
  review:        { label: 'রিভিউ চলছে',     color: 'bg-indigo-100 text-indigo-700' },
  revision_required: { label: 'সংশোধন দরকার', color: 'bg-red-100 text-red-700' },
  department_approved: { label: 'ডিপার্টমেন্ট অনুমোদিত', color: 'bg-teal-100 text-teal-700' },
  nm_editing:    { label: 'NM এডিটিং', color: 'bg-cyan-100 text-cyan-700' },
  sent_to_proof: { label: 'প্রুফে', color: 'bg-pink-100 text-pink-700' },
  proof_correction: { label: 'প্রুফ সংশোধন', color: 'bg-amber-100 text-amber-700' },
  proof_approved: { label: 'প্রুফ অনুমোদিত', color: 'bg-emerald-100 text-emerald-700' },
  final_submit:  { label: 'সাবমিট', color: 'bg-blue-100 text-blue-700' },
  approved:      { label: 'অনুমোদিত',       color: 'bg-green-100 text-green-700' },
  revision:      { label: 'সংশোধন চাই',     color: 'bg-red-100 text-red-700' },
  published:     { label: 'প্রকাশিত',       color: 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400' },
  correction_needed: { label: 'কারেকশন দরকার', color: 'bg-amber-100 text-amber-700' },
  rejected:      { label: 'প্রত্যাখ্যাত',   color: 'bg-red-100 text-red-600' },
  reassigned:    { label: 'পুনরায় দেওয়া',  color: 'bg-teal-100 text-teal-700' },
}

const PRIORITY_CONFIG = {
  high:   { label: '🔴 জরুরি' },
  normal: { label: '🔵 সাধারণ' },
  low:    { label: '⚪ কম' },
}

const ACTION_CONFIG = {
  assigned:      { label: 'Assignment দেওয়া হয়েছে',           color: 'bg-blue-500',   icon: '📋' },
  self_assigned: { label: 'Self Assignment তৈরি করা হয়েছে',   color: 'bg-purple-500', icon: '✍️' },
  self_approved: { label: 'Self Assignment Approved হয়েছে',   color: 'bg-green-500',  icon: '✅' },
  self_rejected: { label: 'Self Assignment Rejected হয়েছে',   color: 'bg-red-500',    icon: '❌' },
  accepted:      { label: 'Accept করা হয়েছে',                 color: 'bg-green-500',  icon: '✅' },
  rejected:      { label: 'Reject করা হয়েছে',                 color: 'bg-red-500',    icon: '❌' },
  reporter_writing: { label: 'লেখা শুরু হয়েছে',               color: 'bg-purple-500', icon: '✍️' },
  writing:       { label: 'লেখা শুরু হয়েছে',                  color: 'bg-purple-500', icon: '✍️' },
  reporter_submitted: { label: 'ডিপার্টমেন্টে জমা দেওয়া হয়েছে', color: 'bg-orange-500', icon: '📤' },
  submitted:     { label: 'প্রতিবেদন জমা দেওয়া হয়েছে',       color: 'bg-orange-500', icon: '📤' },
  department_review: { label: 'ডিপার্টমেন্ট রিভিউ শুরু হয়েছে',  color: 'bg-indigo-500', icon: '🔍' },
  review:        { label: 'রিভিউ শুরু হয়েছে',                 color: 'bg-indigo-500', icon: '🔍' },
  revision_required: { label: 'সংশোধন চাওয়া হয়েছে',          color: 'bg-red-500',    icon: '🔄' },
  department_approved: { label: 'ডিপার্টমেন্ট অনুমোদন দিয়েছে',   color: 'bg-teal-600',   icon: '✅' },
  nm_editing:    { label: 'NM এডিটিং শুরু হয়েছে',              color: 'bg-cyan-500',   icon: '✍️' },
  sent_to_proof: { label: 'প্রুফে পাঠানো হয়েছে',                color: 'bg-pink-500',   icon: '👀' },
  proof_correction: { label: 'প্রুফ সংশোধন চাওয়া হয়েছে',       color: 'bg-amber-500',  icon: '🔄' },
  proof_approved: { label: 'প্রুফ অনুমোদন দিয়েছে',              color: 'bg-emerald-500',icon: '✅' },
  final_submit:  { label: 'ফাইনাল সাবমিট করা হয়েছে',            color: 'bg-blue-600',   icon: '📤' },
  approved:      { label: 'অনুমোদন দেওয়া হয়েছে',             color: 'bg-green-600',  icon: '🎉' },
  revision:      { label: 'সংশোধন চাওয়া হয়েছে',              color: 'bg-red-500',    icon: '🔄' },
  published:     { label: 'প্রকাশিত হয়েছে',                   color: 'bg-gray-600',   icon: '📰' },
  correction_needed: { label: 'কারেকশন চাওয়া হয়েছে',              color: 'bg-amber-500',  icon: '⚠️' },
  reassigned:    { label: 'পুনরায় assign করা হয়েছে',          color: 'bg-teal-500',   icon: '↩️' },
}

function formatDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('bn-BD', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatDeadline(dt) {
  if (!dt) return null
  const d = new Date(dt)
  const now = new Date()
  const diff = d - now
  const hrs = Math.floor(diff / 3600000)
  if (diff < 0) return { text: 'মেয়াদ শেষ হয়ে গেছে', urgent: true }
  if (hrs < 2) return { text: `${Math.floor(diff / 60000)} মিনিট বাকি`, urgent: true }
  if (hrs < 24) return { text: `${hrs} ঘণ্টা বাকি`, urgent: hrs < 6 }
  return { text: `${Math.floor(hrs / 24)} দিন বাকি`, urgent: false }
}

// ── Reassign Modal ──
function ReassignModal({ assignment, onClose }) {
  const { reassign } = useWorkflow()
  const { journalists } = useSettings()
  const [selectedId, setSelectedId] = useState('')
  const [note, setNote] = useState('')

  const handleReassign = () => {
    if (!selectedId) return
    const journalist = journalists.find((j) => j.id === Number(selectedId))
    reassign(assignment.id, journalist, note)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Re-assign করুন</h3>
          <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:text-slate-300">✕</button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">এসাইন টু</label>
            <SearchableSelect
              options={journalists.filter(j => j.id !== assignment.assignedTo?.id).map(j => ({ value: j.id.toString(), label: `${j.name} — ${j.designation}` }))}
              value={selectedId}
              onChange={setSelectedId}
              placeholder="বেছে নিন"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">কারণ / নোট</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Re-assign করার কারণ লিখুন..."
              rows={3}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="text-sm text-gray-500 dark:text-slate-400 px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg">বাতিল</button>
          <button onClick={handleReassign} disabled={!selectedId}
            className="text-sm bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors">
            Re-assign করুন
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Note Modal ──
function NoteModal({ title, buttonLabel, buttonColor, onConfirm, onClose }) {
  const [note, setNote] = useState('')
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:text-slate-300">✕</button>
        </div>
        <div className="px-5 py-4">
          <textarea value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="মন্তব্য লিখুন (ঐচ্ছিক)..."
            rows={4}
            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="text-sm text-gray-500 dark:text-slate-400 px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg">বাতিল</button>
          <button onClick={() => { onConfirm(note); onClose() }}
            className={`text-sm text-white px-4 py-2 rounded-lg transition-colors ${buttonColor}`}>
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Photo Upload Modal ──
function PhotoUploadModal({ assignment, onClose, onUploadComplete }) {
  const [file, setFile] = useState(null)
  const [note, setNote] = useState('')
  const [uploading, setUploading] = useState(false)
  const { addNotification } = useWorkflow()

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', assignment.title)
      formData.append('caption', note)

      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      const mediaId = res.data._id || res.data.id || (res.data.media && res.data.media._id)
      
      onUploadComplete(mediaId, note);
      addNotification('মিডিয়া আপলোড সম্পন্ন হয়েছে।', assignment.id || assignment._id)
    } catch (err) {
      console.error(err)
      alert('আপলোড ব্যর্থ হয়েছে।')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">ছবি/ভিডিও আপলোড করুন</h3>
          <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:text-slate-300">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
             <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">ফাইল বেছে নিন</label>
             <input type="file" onChange={(e) => setFile(e.target.files[0])} className="w-full text-sm text-slate-700 dark:text-slate-300" accept="image/*,video/*" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">নোট / ক্যাপশন</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="ছবির ক্যাপশন বা নোট লিখুন..."
              rows={3}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} disabled={uploading} className="text-sm text-gray-500 dark:text-slate-400 px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg">বাতিল</button>
          <button onClick={handleUpload} disabled={!file || uploading}
            className="text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors">
            {uploading ? 'আপলোড হচ্ছে...' : 'জমা দিন'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Timeline ──
function Timeline({ history = [], versions = [], onViewVersion }) {
  // Map track logs to the same format as history if they exist
  const normalizedLogs = history.map(log => ({
    action: log.action || log.status || log.workflowStage,
    by: log.by || log.user || 'System',
    at: log.at || log.date || new Date().toISOString(),
    note: log.note
  })).sort((a, b) => new Date(a.at) - new Date(b.at));

  return (
    <div className="space-y-0">
      {normalizedLogs.map((log, i) => {
        const isLast = i === normalizedLogs.length - 1
        const config = ACTION_CONFIG[log.action] || { label: log.action || 'Unknown Action', color: 'bg-gray-400', icon: '📝' }
        
        // Find version that happened near this log (within 10 seconds)
        const logTime = new Date(log.at).getTime();
        const relatedVersion = versions.find(v => {
           const vTime = new Date(v.createdAt).getTime();
           return Math.abs(vTime - logTime) < 10000; 
        });

        return (
          <div key={`log-${i}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full ${config.color} flex items-center justify-center text-sm flex-shrink-0 shadow-sm`}>
                {config.icon}
              </div>
              {!isLast && <div className="w-0.5 h-full bg-gray-200 dark:bg-slate-700 mt-1 mb-1 min-h-[20px]" />}
            </div>
            <div className={`flex-1 ${!isLast ? 'pb-4' : ''}`}>
              <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{config.label}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500 dark:text-slate-400">{log.by}</span>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs text-gray-400 dark:text-slate-500">{formatDateTime(log.at)}</span>
              </div>
              {log.note && (
                <div className="mt-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-600 dark:text-slate-400">{log.note}</p>
                </div>
              )}
              {relatedVersion && (
                <button onClick={() => onViewVersion(relatedVersion)}
                  className="mt-2 inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs px-3 py-1.5 rounded border border-blue-200 dark:border-blue-800 shadow-sm transition-colors">
                  <Eye size={12} /> এই ভার্সনটি দেখুন
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Action Buttons ──
function ActionButtons({ assignment, onAction, navigate, linkedArticle, user, fetchError }) {
  const { status, type, edition, assignees } = assignment

  const getEditorUrl = (articleId = null) => {
    const isPrint = edition === 'print' || user?.edition === 'print'
    const base = isPrint ? '/print/articles' : '/articles'
    if (articleId) return `${base}/edit/${articleId}?assignmentId=${assignment.id || assignment._id}`
    return `${base}/new?assignmentId=${assignment.id || assignment._id}`
  }

  const myUserId = user?._id?.toString() || user?.id?.toString()
  const currentUserAssignee = assignees?.find(a => 
    a.id === myUserId || 
    a.id?.toString() === myUserId ||
    a.name === user?.name 
  )
  const isPhotographer = currentUserAssignee?.designation === 'Photographer' || 
                         currentUserAssignee?.designation === 'ফটোগ্রাফার' || 
                         currentUserAssignee?.designation?.toLowerCase().includes('photo') ||
                         currentUserAssignee?.designation?.toLowerCase().includes('video') ||
                         currentUserAssignee?.designation === 'Videographar' ||
                         currentUserAssignee?.designation === 'Videographer' ||
                         currentUserAssignee?.designation === 'ভিডিওগ্রাফার';
  const role = user?.role;

  // 1. Reporter / Assignee Flow
  if (currentUserAssignee && ['pending', 'assigned', 'accepted', 'writing', 'revision_required', 'proof_correction'].includes(status)) {
    const myStatus = currentUserAssignee.taskStatus;

    if (myStatus === 'pending' || status === 'pending' || status === 'assigned') return (
      <div className="flex gap-2">
        <button onClick={() => onAction('assignee_accept', currentUserAssignee)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <CheckCircle size={14} /> Accept করুন
        </button>
        <button onClick={() => onAction('assignee_reject', currentUserAssignee)}
          className="flex items-center gap-2 border border-red-300 text-red-600 hover:bg-red-50 text-sm px-4 py-2 rounded-lg transition-colors">
          <XCircle size={14} /> Reject করুন
        </button>
      </div>
    )

    if (myStatus === 'accepted' || status === 'accepted') return (
      isPhotographer ? (
        <button onClick={() => onAction('upload_media', currentUserAssignee)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <Sparkles size={14} /> ছবি/ভিডিও আপলোড করুন
        </button>
      ) : (
        <button onClick={() => onAction('assignee_start_writing', currentUserAssignee)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <Pencil size={14} /> লেখা শুরু করুন
        </button>
      )
    )

    if (['writing', 'revision_required', 'proof_correction'].includes(status) || myStatus === 'writing') return (
      isPhotographer ? (
        <button onClick={() => onAction('upload_media', currentUserAssignee)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <Sparkles size={14} /> ছবি/ভিডিও আপলোড করুন
        </button>
      ) : (
        <button onClick={() => navigate(getEditorUrl(linkedArticle?._id))}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <Pencil size={14} /> {status === 'revision_required' || status === 'proof_correction' ? 'সংশোধন করুন' : 'আর্টিকেল লিখুন'}
        </button>
      )
    )
  }

  // 2. Self Assignment Approval (Editor View)
  if (status === 'self_pending' && ['chief_reporter', 'editor', 'chief_editor', 'news_manager', 'executive_editor', 'super_admin', 'admin'].includes(role)) return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
        <Sparkles size={14} className="text-orange-500 flex-shrink-0" />
        <p className="text-xs text-orange-700">
          <span className="font-semibold">{assignment.assignedTo?.name || assignment.assignees?.[0]?.name}</span> নিজে এই স্টোরিটি করতে চেয়েছেন।
          Approve করলে তিনি লিখতে পারবেন।
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onAction('self_approve')} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <CheckCircle size={14} /> Approve করুন
        </button>
        <button onClick={() => onAction('self_reject')} className="flex items-center gap-2 border border-red-300 text-red-600 hover:bg-red-50 text-sm px-4 py-2 rounded-lg transition-colors">
          <XCircle size={14} /> Reject করুন
        </button>
      </div>
    </div>
  )

  if (status === 'self_rejected' && currentUserAssignee) return (
    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-xs text-red-600">এই Self Assignment Reject হয়েছে।</p>
    </div>
  )

  // 3. Editors & Workflow Actions
  const isChiefEditor = ['chief_editor', 'executive_editor', 'super_admin', 'admin'].includes(role);
  const isDeptEditor = isChiefEditor || ['sub_editor', 'desk_editor', 'chief_reporter', 'editor'].includes(role);
  const isNMEditor = isChiefEditor || ['news_manager', 'news_management', 'editor'].includes(role);
  const isProofreader = isChiefEditor || ['proofreader', 'editor'].includes(role);

  if (['pending', 'assigned', 'accepted', 'writing'].includes(status)) {
    if (isDeptEditor || isNMEditor || isChiefEditor) {
      return (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => navigate(getEditorUrl(linkedArticle?._id || linkedArticle?.id))} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            <Pencil size={14} /> {linkedArticle ? 'আর্টিকেল এডিট' : 'লেখা শুরু করুন'}
          </button>
          <button onClick={() => onAction('reassign')} className="flex items-center gap-2 border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm px-4 py-2 rounded-lg transition-colors">
            <User size={14} /> {assignees?.length ? 'Re-assign' : 'Assign Reporter'}
          </button>
        </div>
      )
    }
  }

  if (status === 'submitted' || status === 'review') {
    if (isDeptEditor || isNMEditor || isChiefEditor) {
      return (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => onAction('dept_approve')} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            <CheckCircle size={14} /> ডিপার্টমেন্ট অনুমোদন
          </button>
          <button onClick={() => onAction('publish')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            <Send size={14} /> সরাসরি নিউজ আপলোড
          </button>
          {linkedArticle ? (
            <button onClick={() => navigate(getEditorUrl(linkedArticle._id || linkedArticle.id))} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              <Pencil size={14} /> আর্টিকেল এডিট
            </button>
          ) : <span className="text-[10px] text-red-500 bg-red-100 px-2 py-1 rounded">{fetchError || "No Article Link Found"}</span>}
          <button onClick={() => onAction('dept_revision')} className="flex items-center gap-2 border border-red-300 text-red-600 hover:bg-red-50 text-sm px-4 py-2 rounded-lg transition-colors">
            <RotateCcw size={14} /> সংশোধন চান
          </button>
          <button onClick={() => onAction('reassign')} className="flex items-center gap-2 border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm px-4 py-2 rounded-lg transition-colors">
            <User size={14} /> Re-assign
          </button>
        </div>
      )
    }
  }

  if (status === 'department_approved' || status === 'nm_editing') {
    if (isNMEditor || isChiefEditor) {
      return (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => onAction('send_to_proof')} className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            <Eye size={14} /> প্রুফে পাঠান
          </button>
          <button onClick={() => onAction('publish')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            <Send size={14} /> সরাসরি নিউজ আপলোড
          </button>
          {linkedArticle && (
            <button onClick={() => navigate(getEditorUrl(linkedArticle._id || linkedArticle.id))} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              <Pencil size={14} /> আর্টিকেল এডিট
            </button>
          )}
        </div>
      )
    }
  }

  if (status === 'sent_to_proof') {
    if (isProofreader || isChiefEditor) {
      return (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => onAction('proof_approve')} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            <CheckCircle size={14} /> প্রুফ অনুমোদন
          </button>
          <button onClick={() => onAction('publish')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            <Send size={14} /> সরাসরি নিউজ আপলোড
          </button>
          <button onClick={() => onAction('proof_correct')} className="flex items-center gap-2 border border-amber-300 text-amber-600 hover:bg-amber-50 text-sm px-4 py-2 rounded-lg transition-colors">
            <RotateCcw size={14} /> সংশোধন চান
          </button>
          {linkedArticle && (
            <button onClick={() => navigate(getEditorUrl(linkedArticle._id || linkedArticle.id))} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              <Pencil size={14} /> আর্টিকেল এডিট
            </button>
          )}
        </div>
      )
    }
  }

  if (status === 'proof_approved' || status === 'approved' || status === 'final_submit') {
    if (isChiefEditor || isNMEditor) {
      return (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => onAction('publish')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            <Send size={14} /> নিউজ আপলোড (Publish)
          </button>
          {linkedArticle && (
            <button onClick={() => navigate(getEditorUrl(linkedArticle._id || linkedArticle.id))} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              <Pencil size={14} /> আর্টিকেল এডিট
            </button>
          )}
          {isChiefEditor && (
             <button onClick={() => onAction('correction')} className="flex items-center gap-2 border border-amber-300 text-amber-600 hover:bg-amber-50 text-sm px-4 py-2 rounded-lg transition-colors">
               <AlertTriangle size={14} /> কারেকশন পাঠান
             </button>
          )}
        </div>
      )
    }
  }

  if (status === 'rejected') return (
    <button onClick={() => onAction('reassign')} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
      <User size={14} /> Re-assign করুন
    </button>
  )

  if (status === 'correction_needed') return (
    <button onClick={() => navigate(getEditorUrl(linkedArticle?._id))} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
      <Pencil size={14} /> কারেকশন করুন
    </button>
  )

  return null
}

// ── Workflow Steps ──
function WorkflowSteps({ assignment }) {
  const isPrint = assignment.edition === 'print';
  const isSelf = assignment.type === 'self';

  const onlineSteps = [
    { key: ['pending'], label: 'অ্যাসাইনড' },
    { key: ['accepted'], label: 'গৃহীত' },
    { key: ['writing', 'reporter_writing'], label: 'লেখা হচ্ছে' },
    { key: ['submitted', 'reporter_submitted'], label: 'ডিপার্টমেন্টে জমা' },
    { key: ['review', 'department_review', 'revision_required'], label: 'ডিপার্টমেন্ট রিভিউ' },
    { key: ['department_approved', 'nm_editing'], label: 'NM এডিটিং' },
    { key: ['sent_to_proof', 'proof_correction'], label: 'প্রুফে' },
    { key: ['proof_approved', 'final_submit', 'approved'], label: 'ফাইনাল সাবমিট' },
    { key: ['published'], label: 'প্রকাশিত' },
  ];

  const printSteps = [
    { key: ['pending', 'assignment_created', 'assigned_to_reporter'], label: 'অ্যাসাইনড' },
    { key: ['writing', 'reporter_working'], label: 'লেখা হচ্ছে' },
    { key: ['submitted', 'reporter_submitted'], label: 'ডিপার্টমেন্টে জমা' },
    { key: ['review', 'department_review', 'returned_to_creator'], label: 'ডিপার্টমেন্ট রিভিউ' },
    { key: ['department_approved', 'sent_to_news_management', 'news_management_editing'], label: 'NM ডেস্কে' },
    { key: ['sent_to_own_page', 'page_planning'], label: 'পেজ প্ল্যানিং' },
    { key: ['sent_to_proof', 'proof_approved', 'proof_correction'], label: 'প্রুফ' },
    { key: ['sent_to_page', 'page_makeup', 'executive_review', 'makeup_correction'], label: 'পেজ মেকআপ' },
    { key: ['ready_for_print', 'approved'], label: 'প্রিন্ট রেডি' },
    { key: ['printed', 'published'], label: 'ছাপা হয়েছে' },
  ];

  const selfOnlineSteps = [
    { key: ['self_pending'], label: 'Approval দরকার' },
    { key: ['self_approved'], label: 'Approved' },
    ...onlineSteps.slice(2)
  ];

  const steps = isPrint ? printSteps : (isSelf ? selfOnlineSteps : onlineSteps);

  const onlineOrder = [
    'pending', 'self_pending', 'self_approved', 'accepted', 'writing', 'reporter_writing', 
    'submitted', 'reporter_submitted', 'review', 'department_review', 'revision_required', 
    'correction_needed', 'revision', 'department_approved', 'nm_editing', 'sent_to_proof', 
    'proof_correction', 'proof_approved', 'final_submit', 'approved', 'published'
  ];

  const printOrder = [
    'pending', 'assignment_created', 'assigned_to_reporter', 'self_pending', 'self_approved', 'writing', 'reporter_working',
    'submitted', 'reporter_submitted', 'review', 'department_review', 'returned_to_creator', 'revision_required', 'revision', 'correction_needed',
    'department_approved', 'sent_to_news_management', 'news_management_editing', 'sent_to_own_page', 'page_planning',
    'sent_to_proof', 'proof_correction', 'proof_approved', 'sent_to_page', 'page_makeup', 'makeup_correction', 'executive_review',
    'ready_for_print', 'approved', 'printed', 'published'
  ];

  const order = isPrint ? printOrder : onlineOrder;
  
  let currentStatus = assignment.status;
  if (isPrint && assignment.printTrack?.workflowStage) {
    currentStatus = assignment.printTrack.workflowStage;
  } else if (!isPrint && assignment.onlineTrack?.workflowStage) {
    currentStatus = assignment.onlineTrack.workflowStage;
  }

  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const isActive = step.key.includes(currentStatus) || (step.key.includes('pending') && currentStatus === 'assignment_created')
        const currentIdx = order.indexOf(currentStatus)
        const stepIdx = Math.max(...step.key.map((k) => order.indexOf(k)))
        const isDone = currentIdx > stepIdx
        return (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              isDone ? 'bg-green-500' : isActive ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'
            }`}>
              {isDone
                ? <span className="text-white text-xs">✓</span>
                : isActive
                  ? <span className="w-2 h-2 rounded-full bg-white dark:bg-slate-900" />
                  : <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              }
            </div>
            <span className={`text-xs ${isActive ? 'font-semibold text-blue-700' : isDone ? 'text-gray-500 dark:text-slate-400' : 'text-gray-400 dark:text-slate-500'}`}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main ──
export default function AssignmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { assignments, updateStatus, sendCorrection, updateAssigneeTaskStatus } = useWorkflow()
  const { user } = useAuth()
  const isChiefEditor = user?.role === 'chief_editor'

  const assignment = assignments.find((a) => a.id === id)
  const [modal, setModal] = useState(null)
  const [showReassign, setShowReassign] = useState(false)
  const [linkedArticle, setLinkedArticle] = useState(null)
  const [loadingArticle, setLoadingArticle] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  
  // Versions
  const [versions, setVersions] = useState([])
  const [versionToView, setVersionToView] = useState(null)
  const [versionContent, setVersionContent] = useState(null)
  const [loadingVersionContent, setLoadingVersionContent] = useState(false)

  useEffect(() => {
    if (!id) return;
    const fetchArticleAndVersions = async () => {
      try {
        const res = await api.get(`/articles?assignmentId=${id}&_t=${Date.now()}`)
        if (res.data && res.data.length > 0) {
          const article = res.data[0]
          setLinkedArticle(article)
          
          // Fetch versions for this article
          try {
            const verRes = await api.get(`/articles/${article._id}/versions`)
            setVersions(verRes.data)
          } catch (verErr) {
            console.error('Failed to fetch versions:', verErr)
          }
        } else {
          setFetchError(`Empty response. Data: ${JSON.stringify(res.data)}`)
        }
      } catch (err) {
        setFetchError(`Error: ${err.message}`)
        console.error('Failed to fetch linked article:', err)
      } finally {
        setLoadingArticle(false)
      }
    }
    fetchArticleAndVersions()
  }, [id])

  useEffect(() => {
    if (!versionToView) {
      setVersionContent(null)
      return
    }
    const fetchFullVersion = async () => {
      setLoadingVersionContent(true)
      try {
        const res = await api.get(`/articles/versions/${versionToView._id}`)
        setVersionContent(res.data)
      } catch (err) {
        console.error('Failed to fetch full version content', err)
      } finally {
        setLoadingVersionContent(false)
      }
    }
    fetchFullVersion()
  }, [versionToView])

  if (!assignment) return (
    <div className="text-center py-20">
      <p className="text-gray-400 dark:text-slate-500">Assignment পাওয়া যায়নি</p>
      <button onClick={() => navigate('/workflow')} className="mt-3 text-sm text-blue-600 hover:underline">ফিরে যান</button>
    </div>
  )

  const deadline = formatDeadline(assignment.deadline)
  const status = STATUS_CONFIG[assignment.status] || STATUS_CONFIG.pending
  const isSelf = assignment.type === 'self'

  const handleAction = (action, assignee = null) => {
    if (action === 'assignee_accept') updateAssigneeTaskStatus(id, assignee.id, 'accepted', '')
    else if (action === 'assignee_reject') setModal({ type: 'assignee_reject', assignee })
    else if (action === 'assignee_start_writing') updateAssigneeTaskStatus(id, assignee.id, 'writing', '')
    else if (action === 'upload_media') setModal({ type: 'upload_media', assignee })
    else if (action === 'accept') updateStatus(id, 'accepted', '', assignment.assignedTo?.name || assignment.assignees?.[0]?.name)
    else if (action === 'start_writing') updateStatus(id, 'writing', '', assignment.assignedTo?.name || assignment.assignees?.[0]?.name)
    else if (action === 'self_approve') setModal('self_approve')
    else if (action === 'self_reject') setModal('self_reject')
    else if (action === 'reject') setModal('reject')
    else if (action === 'approve') {
      if (window.confirm('আপনি কি এই রিপোর্টটি অনুমোদন করতে চান?')) {
        updateStatus(id, 'approved', 'অনুমোদিত হয়েছে', user?.name || 'এডিটর')
      }
    }
    else if (action === 'dept_approve') {
      if (window.confirm('আপনি কি এই রিপোর্টটি ডিপার্টমেন্ট থেকে অনুমোদন করতে চান?')) {
        updateStatus(id, 'department_approved', 'ডিপার্টমেন্ট অনুমোদন দিয়েছে', user?.name || 'এডিটর')
      }
    }
    else if (action === 'send_to_proof') {
      if (window.confirm('আপনি কি এই রিপোর্টটি প্রুফে পাঠাতে চান?')) {
        updateStatus(id, 'sent_to_proof', 'প্রুফে পাঠানো হয়েছে', user?.name || 'এডিটর')
      }
    }
    else if (action === 'proof_approve') {
      if (window.confirm('আপনি কি এই রিপোর্টটি প্রুফ অনুমোদন করতে চান?')) {
        updateStatus(id, 'proof_approved', 'প্রুফ অনুমোদন দিয়েছে', user?.name || 'এডিটর')
      }
    }
    else if (action === 'proof_correct') setModal('proof_correct')
    else if (action === 'dept_revision') setModal('dept_revision')
    else if (action === 'revision') setModal('revision')
    else if (action === 'reassign') setShowReassign(true)
    else if (action === 'publish') updateStatus(id, 'published', '', 'এডিটর')
    else if (action === 'correction') setModal('correction')
  }

  return (
    <div className="max-w-3xl space-y-5">

      <button onClick={() => navigate('/workflow')}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:text-slate-200">
        <ArrowLeft size={16} /> Assignment Board-এ ফিরুন
      </button>

      <div className="grid grid-cols-3 gap-5">

        {/* Left */}
        <div className="col-span-2 space-y-4">

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {isSelf && (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                      <Sparkles size={10} /> Self Assignment
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    {PRIORITY_CONFIG[assignment.priority]?.label}
                  </span>
                  {assignment.categories?.length > 0 && (
                    <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                      {assignment.categories.join(', ')}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-snug">
                  {assignment.title}
                </h2>
              </div>
            </div>

            {assignment.instructions && (
              <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-blue-700 mb-1">
                  {isSelf ? 'স্টোরির বিবরণ' : 'নির্দেশনা'}
                </p>
                <p className="text-sm text-gray-700 dark:text-slate-300">{assignment.instructions}</p>
              </div>
            )}

            {!loadingArticle && linkedArticle && (
              <div className="mt-4 p-4 border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/10 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-green-800 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle size={16} />
                    {user?.role === 'reporter' ? 'আপনার আর্টিকেল জমা দেওয়া হয়েছে' : 'রিপোর্টার নিউজ জমা দিয়েছেন'}
                  </h4>
                  <p className="text-xs text-green-700 dark:text-green-500 mt-1">
                    {user?.role === 'reporter' ? 'আপনি চাইলে নিচে ক্লিক করে আর্টিকেলটি দেখতে বা এডিট করতে পারেন।' : 'স্ট্যাটাস পরিবর্তন বা অ্যাপ্রুভ করার আগে নিউজটি রিভিউ করুন।'}
                  </p>
                </div>
                <button onClick={() => navigate(`${assignment.edition === 'print' ? '/print' : ''}/articles/edit/${linkedArticle._id}`)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                  <Eye size={16} />
                  আর্টিকেল ভিউ / এডিট করুন
                </button>
              </div>
            )}

            {/* RSS Data Preview */}
            {assignment.articleData && (assignment.articleData.synopsis || (assignment.articleData.blocks && assignment.articleData.blocks.length > 0)) && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-3 border-b border-gray-200 dark:border-slate-700 pb-2">খবরের বিস্তারিত (Article Data Preview)</p>
                {assignment.articleData.coverImagePreview && (
                  <img src={assignment.articleData.coverImagePreview} alt="Cover" className="w-full h-48 object-cover rounded-lg mb-3" />
                )}
                {assignment.articleData.synopsis && (
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3">{assignment.articleData.synopsis}</p>
                )}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {assignment.articleData.blocks?.map((b, i) => (
                    <div key={i}>
                      {b.type === 'text' && (
                        <div className="text-sm text-gray-700 dark:text-slate-300 prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: b.content }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="col-span-2">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mb-2">
                  <User size={13} className="text-gray-400 dark:text-slate-500" />
                  <span>Assigned to:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {assignment.assignees?.length > 0 ? assignment.assignees.map(a => (
                    <div key={a.id} className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs">
                      <span className="font-medium text-gray-700 dark:text-slate-300">{a.name}</span>
                      {a.designation && <span className="text-gray-400 text-[10px]">({a.designation})</span>}
                      {a.taskStatus && <span className={`ml-1 text-[10px] px-1.5 rounded-full ${STATUS_CONFIG[a.taskStatus]?.color || 'bg-gray-100 text-gray-600'}`}>{STATUS_CONFIG[a.taskStatus]?.label || a.taskStatus}</span>}
                    </div>
                  )) : (
                    <span className="font-medium text-gray-700 dark:text-slate-300 text-xs pl-5">{assignment.assignedTo?.name}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                <User size={13} className="text-gray-400 dark:text-slate-500" />
                <span>Assigned by: <span className="font-medium text-gray-700 dark:text-slate-300">{assignment.assignedBy?.name}</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                <Calendar size={13} className="text-gray-400 dark:text-slate-500" />
                <span>তৈরি: {formatDateTime(assignment.createdAt)}</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${deadline?.urgent ? 'text-red-500' : 'text-gray-500 dark:text-slate-400'}`}>
                <Clock size={13} />
                <span>Deadline: {deadline?.text || '—'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {assignment.status !== 'published' && assignment.status !== 'correction_needed' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-3">পরবর্তী পদক্ষেপ</p>
              <ActionButtons assignment={assignment} onAction={handleAction} navigate={navigate} linkedArticle={linkedArticle} user={user} fetchError={fetchError} />
            </div>
          )}
          {assignment.status === 'correction_needed' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-3">পরবর্তী পদক্ষেপ</p>
              <ActionButtons assignment={assignment} onAction={handleAction} navigate={navigate} linkedArticle={linkedArticle} user={user} fetchError={fetchError} />
            </div>
          )}

          {/* Published banner */}
          {assignment.status === 'published' && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700">প্রকাশিত হয়েছে</p>
                <p className="text-xs text-green-600 mt-0.5">
                  এই নিউজটি <span className="font-semibold">{assignment.categories?.join(', ')}</span> ক্যাটাগরিতে "নিউজ সাজান"-এ যোগ হয়েছে।
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isChiefEditor && (
                  <button
                    onClick={() => handleAction('correction')}
                    className="flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <AlertTriangle size={12} /> কারেকশন পাঠান
                  </button>
                )}
                <button onClick={() => navigate('/news-sort')}
                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                  নিউজ সাজান →
                </button>
              </div>
            </div>
          )}

          {/* Correction needed banner */}
          {assignment.status === 'correction_needed' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-700">কারেকশন দরকার</p>
                <p className="text-xs text-amber-600 mt-0.5">চিফ এডিটর এই নিউজে সংশোধন চেয়েছেন। বিস্তারিত প্রবিতিতে দেখুন।</p>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">কার্যক্রমের ইতিহাস</h3>
            <Timeline history={assignment.history} versions={versions} onViewVersion={setVersionToView} />
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-3">এসাইন টু (Assigned To)</p>
            <div className="flex flex-col gap-3">
              {assignment.assignees?.length > 0 ? assignment.assignees.map((user, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full font-semibold flex items-center justify-center flex-shrink-0 ${user.isOvertime ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                    {user.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200 flex items-center gap-2">
                      {user.name}
                      {user.isOvertime && <span className="text-[9px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full border border-orange-200">OVERTIME</span>}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{user.designation}</p>
                    {user.taskStatus === 'submitted' && user.submittedContentId && (
                      <a 
                        href={`http://localhost:5001${user.submittedContentId}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-indigo-500 hover:text-indigo-600 font-medium underline flex items-center gap-1 mt-1"
                      >
                        🖼️ আপলোড করা মিডিয়া দেখুন
                      </a>
                    )}
                    {user.taskStatus === 'submitted' && !user.submittedContentId && linkedArticle && (
                      <p className="text-xs text-emerald-500 font-medium flex items-center gap-1 mt-1">✓ টেক্সট জমা দিয়েছেন</p>
                    )}
                  </div>
                </div>
              )) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 font-semibold flex items-center justify-center flex-shrink-0">
                    ?
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200">Unassigned</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {assignment.categories?.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-3">ক্যাটাগরি</p>
              <div className="flex flex-wrap gap-2">
                {assignment.categories.map((cat, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-3">ওয়ার্কফ্লো</p>
            <WorkflowSteps assignment={assignment} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal === 'self_approve' && (
        <NoteModal title="Self Assignment Approve করুন"
          buttonLabel="Approve করুন" buttonColor="bg-green-600 hover:bg-green-700"
          onConfirm={(note) => updateStatus(id, 'self_approved', note || 'Self Assignment approved।', 'Assignment Editor')}
          onClose={() => setModal(null)} />
      )}
      {modal === 'self_reject' && (
        <NoteModal title="Self Assignment Reject করুন"
          buttonLabel="Reject করুন" buttonColor="bg-red-600 hover:bg-red-700"
          onConfirm={(note) => updateStatus(id, 'self_rejected', note || 'Self Assignment rejected।', 'Assignment Editor')}
          onClose={() => setModal(null)} />
      )}
      {modal === 'reject' && (
        <NoteModal title="Reject করুন" buttonLabel="Reject করুন" buttonColor="bg-red-600 hover:bg-red-700"
          onConfirm={(note) => updateStatus(id, 'rejected', note, assignment.assignedTo?.name || assignment.assignees?.[0]?.name)}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === 'assignee_reject' && (
        <NoteModal title="Reject করুন" buttonLabel="Reject করুন" buttonColor="bg-red-600 hover:bg-red-700"
          onConfirm={(note) => updateAssigneeTaskStatus(id, modal.assignee.id, 'rejected', note)}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === 'upload_media' && (
        <PhotoUploadModal
          assignment={assignment}
          onUploadComplete={(mediaId, note) => {
            updateAssigneeTaskStatus(id, modal.assignee.id, 'submitted', note, mediaId)
            setModal(null)
          }}
          onClose={() => setModal(null)} />
      )}
      {modal === 'approve' && (
        <NoteModal title="অনুমোদন করুন" buttonLabel="অনুমোদন করুন" buttonColor="bg-green-600 hover:bg-green-700"
          onConfirm={(note) => updateStatus(id, 'approved', note, 'এডিটর')}
          onClose={() => setModal(null)} />
      )}
      {modal === 'revision' && (
        <NoteModal title="সংশোধন চান" buttonLabel="পাঠিয়ে দিন" buttonColor="bg-red-600 hover:bg-red-700"
          onConfirm={(note) => updateStatus(id, 'revision', note, 'এডিটর')}
          onClose={() => setModal(null)} />
      )}
      {modal === 'dept_revision' && (
        <NoteModal title="ডিপার্টমেন্ট থেকে সংশোধন চান" buttonLabel="পাঠিয়ে দিন" buttonColor="bg-red-600 hover:bg-red-700"
          onConfirm={(note) => updateStatus(id, 'revision_required', note, 'এডিটর')}
          onClose={() => setModal(null)} />
      )}
      {modal === 'proof_correct' && (
        <NoteModal title="প্রুফ থেকে সংশোধন চান" buttonLabel="পাঠিয়ে দিন" buttonColor="bg-amber-600 hover:bg-amber-700"
          onConfirm={(note) => updateStatus(id, 'proof_correction', note, 'প্রুফরিডার')}
          onClose={() => setModal(null)} />
      )}
      {modal === 'correction' && (
        <NoteModal title="কারেকশন পাঠান" buttonLabel="কারেকশন পাঠান" buttonColor="bg-amber-600 hover:bg-amber-700"
          onConfirm={(note) => sendCorrection(id, note, user?.name || 'চিফ এডিটর')}
          onClose={() => setModal(null)} />
      )}
      {showReassign && (
        <ReassignModal assignment={assignment} onClose={() => setShowReassign(false)} />
      )}

      {/* Version Viewer Modal */}
      {versionToView && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setVersionToView(null)}>
          <div className="w-[600px] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-in-right" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <History className="text-blue-600" size={18} />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">ভার্সন v{versionToView.versionNumber}</h3>
                  <div className="flex gap-2 items-center text-xs mt-0.5">
                    <span className="text-gray-500 dark:text-slate-400">{formatDateTime(versionToView.createdAt)}</span>
                    <span className="text-gray-300">•</span>
                    <span className="font-semibold text-blue-700 dark:text-blue-400">By: {versionToView.savedBy || 'System'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setVersionToView(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
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
                    <img src={versionContent.contentSnapshot.coverImage} alt="Cover" className="w-full h-48 object-cover rounded-xl" />
                  )}

                  <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                    {versionContent.contentSnapshot.blocks?.length > 0 ? (
                      versionContent.contentSnapshot.blocks.map((block, i) => (
                        <div key={i}>
                          {block.type === 'text' && (
                            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: block.content }} />
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
                      ))
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
