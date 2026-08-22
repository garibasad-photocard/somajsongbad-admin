import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useWorkflow } from '../../context/WorkflowContext'
import { Clock, ChevronRight, Video, Plus } from 'lucide-react'
import { NewAssignmentModal } from './AssignmentBoard'
import api from '../../services/api'

const MULTIMEDIA_COLUMNS = [
  { id: 'pending', label: 'অপেক্ষমাণ (Pending)', statuses: ['pending'], color: 'bg-yellow-400' },
  { id: 'in_production', label: 'প্রোডাকশনে (In Production)', statuses: ['in_production'], color: 'bg-orange-400' },
  { id: 'review', label: 'রিভিউ (Review)', statuses: ['review'], color: 'bg-indigo-400' },
  { id: 'approved', label: 'অনুমোদিত (Approved)', statuses: ['approved'], color: 'bg-green-400' },
  { id: 'published', label: 'প্রকাশিত (Published)', statuses: ['published'], color: 'bg-gray-400' }
]

function MultimediaCard({ assignment, updateMultimediaStatus }) {
  const navigate = useNavigate()
  const track = assignment.multimediaTrack || {}
  const status = track.status || 'pending'
  const deadline = assignment.deadline ? new Date(assignment.deadline) : null
  
  return (
    <div 
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('assignmentId', assignment._id || assignment.id)
      }}
      onClick={() => navigate(`/workflow/${assignment._id || assignment.id}`)}
      className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow hover:border-purple-300 dark:hover:border-purple-600 transition-all cursor-move group flex flex-col gap-2 relative overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider flex-wrap">
          <span className="px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50">
            🎥 {track.contentType || 'Video'}
          </span>
          {track.platform?.length > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-slate-700">
              {track.platform.join(', ')}
            </span>
          )}
        </div>
        {deadline && (
          <div className="flex items-center gap-1 text-[10px] font-medium text-gray-500 dark:text-slate-400">
            <Clock size={10} />
            {deadline.toLocaleDateString('bn-BD')}
          </div>
        )}
      </div>

      <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug line-clamp-3 mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
        {assignment.title}
      </h4>

      {track.scriptNote && (
        <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-2 italic bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded border border-slate-100 dark:border-slate-800">
          📝 {track.scriptNote}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50 dark:border-slate-800/50">
        <div className="text-[11px] text-gray-600 dark:text-slate-400 font-medium">
          Assigned: {assignment.assigneeName || 'Unassigned'}
        </div>
        <div className="p-1.5 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 group-hover:bg-purple-100 group-hover:text-purple-600 dark:group-hover:bg-slate-700 dark:group-hover:text-purple-400 rounded-lg transition-colors flex-shrink-0">
          <ChevronRight size={14} />
        </div>
      </div>
    </div>
  )
}

export default function MultimediaBoard() {
  const { assignments, fetchAssignments } = useWorkflow()
  const [showModal, setShowModal] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (location.pathname === '/workflow/multimedia/create') {
      setShowModal(true)
    }
  }, [location.pathname])

  const handleCloseModal = () => {
    setShowModal(false)
    if (location.pathname === '/workflow/multimedia/create') {
      navigate('/workflow/multimedia', { replace: true })
    }
  }

  // Filter for multimedia assignments
  const multimediaAssignments = assignments.filter(a => 
    a.edition === 'multimedia' || a.edition === 'both' || a.edition === 'all' || a.multimediaTrack
  )

  const updateMultimediaStatus = async (id, status) => {
    try {
      await api.put(`/workflow/${id}/multimedia-track`, { status })
      fetchAssignments()
    } catch (err) {
      console.error('Failed to update multimedia status:', err)
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Video className="text-purple-600 dark:text-purple-400" size={32} />
            মাল্টিমিডিয়া ডেস্ক
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">ভিডিও ও গ্রাফিক্স প্রোডাকশন ট্র্যাকিং বোর্ড</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-purple-600/20"
        >
          <Plus size={18} />
          <span>নতুন অ্যাসাইনমেন্ট</span>
        </button>
      </div>
      
      {showModal && <NewAssignmentModal onClose={handleCloseModal} assignments={assignments} editionFilter="multimedia" />}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start pb-10 overflow-x-auto min-h-[70vh]">
        {MULTIMEDIA_COLUMNS.map((col) => {
          const colAssignments = multimediaAssignments.filter(a => {
            const currentStatus = a.multimediaTrack?.status || 'pending'
            return col.statuses.includes(currentStatus)
          })
          
          const handleDrop = (e) => {
            e.preventDefault()
            const assignmentId = e.dataTransfer.getData('assignmentId')
            if (assignmentId) {
              const newStatus = col.statuses[0]
              updateMultimediaStatus(assignmentId, newStatus)
            }
          }
          
          return (
            <div 
              key={col.id} 
              className="flex flex-col gap-3 min-w-[280px] bg-slate-100/80 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{col.label}</h3>
                </div>
                <span className="text-xs font-black text-slate-500 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full shadow-sm">
                  {colAssignments.length}
                </span>
              </div>
              
              <div className="flex flex-col gap-3 min-h-[300px]">
                {colAssignments.map((a) => (
                  <MultimediaCard key={a.id || a._id} assignment={a} updateMultimediaStatus={updateMultimediaStatus} />
                ))}
                {colAssignments.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-24 text-slate-400 dark:text-slate-500 text-xs font-medium border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <span className="opacity-50">ড্র্যাগ করে এখানে আনুন</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
