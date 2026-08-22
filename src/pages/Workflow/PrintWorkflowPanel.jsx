import { useState, useEffect } from 'react'
import { CheckCircle, Clock, User, Play } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const STAGE_LABELS = {
  assignment_created:      'অ্যাসাইনমেন্ট তৈরি',
  assigned_to_reporter:    'রিপোর্টারকে দেওয়া হয়েছে',
  reporter_working:        'রিপোর্টার লিখছে',
  reporter_submitted:      'রিপোর্টার জমা দিয়েছে',
  returned_to_creator:     'ক্রিয়েটরের কাছে ফিরেছে',
  department_review:       'ডিপার্টমেন্ট রিভিউ',
  revision_required:       'সংশোধন দরকার',
  department_approved:     'ডিপার্টমেন্ট অনুমোদিত',
  sent_to_news_management: 'নিউজ ম্যানেজমেন্টে পাঠানো',
  sent_to_own_page:        'নিজ পাতায় পাঠানো',
  news_management_editing: 'নিউজ ম্যানেজমেন্ট এডিটিং',
  page_planning:           'পেজ প্ল্যানিং',
  sent_to_proof:           'প্রুফে পাঠানো',
  proof_correction:        'প্রুফ সংশোধন',
  proof_approved:          'প্রুফ অনুমোদিত',
  sent_to_page:            'পেজে পাঠানো',
  page_makeup:             'পেজ মেকআপ চলছে',
  executive_review:        'এক্সিকিউটিভ এডিটর রিভিউ',
  makeup_correction:       'মেকআপ সংশোধন দরকার',
  ready_for_print:         'প্রিন্টের জন্য প্রস্তুত',
  printed:                 'ছাপা হয়েছে'
};

export default function PrintWorkflowPanel({ assignmentId, initialStage }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [currentStage, setCurrentStage] = useState(initialStage || 'assignment_created')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [note, setNote] = useState('')

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/print-workflow/${assignmentId}/history`)
      setCurrentStage(res.data.currentStage || 'assignment_created')
      setHistory(res.data.history || [])
    } catch (err) {
      console.error('Failed to load print workflow history', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (assignmentId) fetchHistory()
  }, [assignmentId])

  const handleAdvance = async (targetStage, extraPayload = {}) => {
    setSubmitting(true)
    try {
      await api.post(`/print-workflow/${assignmentId}/advance`, {
        targetStage,
        note,
        ...extraPayload
      })
      setNote('')
      await fetchHistory()
    } catch (err) {
      alert('ত্রুটি: ' + (err.response?.data?.message || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  const renderReporterActions = () => {
    if (currentStage === 'assigned_to_reporter') {
      return (
        <button
          onClick={() => handleAdvance('reporter_working', { note: 'কাজ শুরু করেছি' })}
          disabled={submitting}
          className="w-full flex justify-center items-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
        >
          <Play size={16} /> কাজ শুরু করুন
        </button>
      )
    }
    if (['reporter_working', 'revision_required'].includes(currentStage)) {
      return (
        <button
          onClick={() => handleAdvance('reporter_submitted', { note: 'রিপোর্ট জমা দেওয়া হলো' })}
          disabled={submitting}
          className="w-full flex justify-center items-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
        >
          <CheckCircle size={16} /> ডিপার্টমেন্টে জমা দিন
        </button>
      )
    }
    return null
  }

  if (loading) {
    return <div className="p-4 text-center text-xs text-gray-500">লোড হচ্ছে...</div>
  }

  const isReporter = user?.role === 'reporter'

  return (
    <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-900/10 space-y-4">
      <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800/50 pb-2">
        <span className="text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
          🗞️ প্রিন্ট ডেস্ক ট্র্যাকিং
        </span>
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200">
          {STAGE_LABELS[currentStage] || currentStage}
        </span>
      </div>

      {isReporter && (
        <div className="space-y-3">
          {['assigned_to_reporter', 'reporter_working', 'revision_required'].includes(currentStage) && (
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="জমা দেওয়ার সময় কোনো নোট থাকলে লিখুন (ঐচ্ছিক)..."
              className="w-full bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg p-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              rows={2}
            />
          )}
          {renderReporterActions()}
          {!['assigned_to_reporter', 'reporter_working', 'revision_required'].includes(currentStage) && (
            <p className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 p-2 rounded-lg text-center font-medium">
              আপনার রিপোর্ট ডিপার্টমেন্টে/ডেস্কে প্রসেসিংয়ে আছে।
            </p>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-4 border-t border-purple-200 dark:border-purple-800/50 pt-3">
          <p className="text-[11px] font-bold text-gray-600 dark:text-slate-400 mb-2 flex items-center gap-1">
            <Clock size={12} /> হিস্ট্রি
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {history.slice().reverse().map((h, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full ${h.action === 'backward' ? 'bg-red-400' : 'bg-purple-400'} mt-1`} />
                  {i < history.length - 1 && <div className="w-px h-full bg-purple-200 dark:bg-purple-800/60 my-0.5" />}
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-gray-800 dark:text-gray-200 font-medium">
                    {STAGE_LABELS[h.stage] || h.stage}
                  </p>
                  <div className="text-[10px] text-gray-500 mt-0.5 flex flex-wrap gap-x-2">
                    <span className="flex items-center gap-0.5"><User size={10} /> {h.userName}</span>
                    <span>{new Date(h.timestamp).toLocaleString('bn-BD', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                  </div>
                  {h.note && (
                    <p className="text-[10px] text-gray-600 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 p-1.5 rounded mt-1 border border-purple-100 dark:border-purple-800/30">
                      {h.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
