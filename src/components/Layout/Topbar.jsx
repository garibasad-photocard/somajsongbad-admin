import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, X, CheckCheck, Globe, Moon, Sun } from 'lucide-react'
import { useWorkflow } from '../../context/WorkflowContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'

function NotificationPanel({ onClose }) {
  const { notifications, unreadCount, markAllRead, markRead } = useWorkflow()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div ref={ref} className="absolute right-0 top-10 w-80 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t.notifications}</h3>
          {unreadCount > 0 && (
            <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button onClick={markAllRead} title={t.markAllRead}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <CheckCheck size={14} />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800">
        {notifications.length === 0 ? (
          <div className="text-center py-10">
            <Bell size={24} className="text-gray-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400 dark:text-slate-500">{t.noNotifications}</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button key={n.id}
              onClick={() => {
                markRead(n.id)
                if (n.assignmentId) navigate(`/workflow/${n.assignmentId}`)
                onClose()
              }}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-start gap-3 ${!n.read ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''}`}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-transparent'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs leading-relaxed ${!n.read ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-500 dark:text-slate-400'}`}>
                  {n.text}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{n.time}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

function ClockInOutButton() {
  const [isCheckedIn, setIsCheckedIn] = useState(() => localStorage.getItem('cms_clocked_in') === 'true')
  const [loading, setLoading] = useState(false)
  
  const handleToggle = () => {
    setLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = `${position.coords.latitude},${position.coords.longitude}`
          try {
            await api.post(isCheckedIn ? '/attendance/clock-out' : '/attendance/clock-in', { location: loc })
            const newState = !isCheckedIn
            setIsCheckedIn(newState)
            localStorage.setItem('cms_clocked_in', newState)
            alert(newState ? 'সফলভাবে Check-in সম্পন্ন হয়েছে' : 'সফলভাবে Check-out সম্পন্ন হয়েছে')
          } catch (err) {
            console.error(err)
            alert('সার্ভারে সমস্যা হয়েছে।')
          } finally {
            setLoading(false)
          }
        },
        (error) => {
          setLoading(false)
          alert('লোকেশন পারমিশন ছাড়া হাজিরা দেওয়া সম্ভব নয়।')
        }
      )
    } else {
      setLoading(false)
      alert('আপনার ব্রাউজার লোকেশন সাপোর্ট করে না।')
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`mr-3 flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
        isCheckedIn
          ? 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'
          : 'bg-green-100 text-green-600 hover:bg-green-200 border border-green-200'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className={`w-2 h-2 rounded-full ${isCheckedIn ? 'bg-red-500' : 'bg-green-500'} ${loading ? 'animate-pulse' : ''}`} />
      {loading ? 'অপেক্ষা করুন...' : (isCheckedIn ? 'Check Out (প্রস্থান)' : 'Check In (হাজিরা)')}
    </button>
  )
}

export default function Topbar() {
  const [showNotif, setShowNotif] = useState(false)
  const { unreadCount } = useWorkflow()
  const { lang, toggleLang } = useLanguage()
  const { isDarkMode, toggleTheme } = useTheme()

  return (
    <div className="h-12 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-5 transition-colors duration-200 print:hidden">
      <p className="text-xs text-gray-400 dark:text-slate-500">NewsFlow CMS</p>

      <div className="flex items-center gap-2">
        <ClockInOutButton />
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors mr-2"
        >
          <Globe size={14} />
          {lang === 'bn' ? 'English' : 'বাংলা'}
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 mr-1 text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotif((p) => !p)}
            className="relative p-2 text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotif && <NotificationPanel onClose={() => setShowNotif(false)} />}
        </div>
      </div>
    </div>
  )
}
