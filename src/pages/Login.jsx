import { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Eye, EyeOff, User, Lock, BookOpen, Monitor, PlaySquare, Users, Map, Briefcase, Crown, ShieldCheck, UserCog, Pencil, Key, Settings } from 'lucide-react'
import api from '../services/api'
import MediaFlowLogo from '../components/common/MediaFlowLogo'

// ── Demo Accounts ──
const DEMO_ACCOUNTS = [
  { role: 'super_admin', label: 'Super Admin', email: 'super@news.com', password: 'super123', userData: { name: 'Super Admin', email: 'super@news.com', role: 'super_admin' }, token: 'dummy_token_super', icon: Key },
  { role: 'managing_editor', label: 'Managing Editor', email: 'managing@news.com', password: 'managing123', userData: { name: 'Managing Editor', email: 'managing@news.com', role: 'managing_editor' }, token: 'dummy_token_managing', icon: Crown },
  { role: 'chief_editor', label: 'Chief Editor', email: 'chief@news.com', password: 'chief123', userData: { name: 'Chief Editor', email: 'chief@news.com', role: 'chief_editor' }, token: 'dummy_token_chief', icon: Crown },
  { role: 'admin', label: 'Admin (HR/IT)', email: 'admin@news.com', password: 'admin123', userData: { name: 'Admin', email: 'admin@news.com', role: 'admin' }, token: 'dummy_token_123', icon: ShieldCheck },
  { role: 'editor', label: 'Editor', email: 'editor@news.com', password: 'editor123', userData: { name: 'Editor', email: 'editor@news.com', role: 'editor' }, token: 'dummy_token_editor', icon: UserCog },
  { role: 'reporter', label: 'Reporter', email: 'reporter@news.com', password: 'reporter123', userData: { name: 'Reporter', email: 'reporter@news.com', role: 'reporter' }, token: 'dummy_token_reporter', icon: Pencil },
]

export default function Login() {
  const { login, user } = useContext(AuthContext)
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', { email, password })
      login(response.data, response.data.token)
      navigate('/')
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Invalid email or password.';
      setError(`Login failed: ${errorMessage}`);
    } finally {
      setLoading(false)
    }
  }

  const handleDemoSelect = (acc) => {
    setEmail(acc.email)
    setPassword(acc.password)
    setTimeout(() => {
      document.getElementById('login-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    }, 100)
  }

  const IconBtn = ({ icon, label }) => (
    <div className="flex flex-col items-center text-center gap-2 group cursor-pointer">
      <div className="w-10 h-10 rounded-full border border-[#ae8a4b] text-[#ae8a4b] flex items-center justify-center group-hover:bg-[#ae8a4b] group-hover:text-white transition-colors duration-300">
        {icon}
      </div>
      <span className="text-[10px] text-gray-400 leading-tight group-hover:text-gray-200 transition-colors">{label}</span>
    </div>
  )

  return (
    <div 
      className="min-h-screen flex items-center justify-start relative px-6 md:px-16 lg:px-32"
      style={{ 
        backgroundImage: "url('/login-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'right center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="bg-[#1b222a]/95 backdrop-blur-md p-10 rounded-2xl w-full max-w-[500px] shadow-2xl border border-white/5 relative z-10 flex flex-col items-center">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <MediaFlowLogo variant="vertical" />
        </div>

        {error && (
          <div className="w-full mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Form Section */}
        <form id="login-form" onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              required
              placeholder="Username or Email" 
              className="w-full bg-transparent border border-gray-600 text-white placeholder-gray-400 px-10 py-3 rounded-lg focus:outline-none focus:border-[#ae8a4b] transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type={showPass ? "text" : "password"} 
              required
              placeholder="Password" 
              className="w-full bg-transparent border border-gray-600 text-white placeholder-gray-400 px-10 py-3 rounded-lg focus:outline-none focus:border-[#ae8a4b] transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              type="button" 
              onClick={() => setShowPass(!showPass)} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          <div className="flex items-center justify-between text-[13px] text-gray-400 mt-2 px-1">
            <label className="flex items-center gap-2 cursor-pointer hover:text-gray-300">
              <input type="checkbox" className="rounded border-gray-600 bg-transparent text-[#ae8a4b] focus:ring-[#ae8a4b]" />
              Remember me
            </label>
            <a href="#" className="hover:text-white transition-colors">Forgot Password?</a>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#ae8a4b] hover:bg-[#c6a059] text-white font-medium py-3 rounded-lg transition-colors mt-6 shadow-lg shadow-[#ae8a4b]/20 disabled:opacity-70"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Bottom Icons Section */}
        <div className="w-full border-t border-gray-700/50 mt-8 pt-8 grid grid-cols-6 gap-2">
          <IconBtn icon={<BookOpen size={16}/>} label="Print Version" />
          <IconBtn icon={<Monitor size={16}/>} label="Online Version" />
          <IconBtn icon={<PlaySquare size={16}/>} label="Multimedia Version" />
          <IconBtn icon={<Users size={16}/>} label="HR & Admin" />
          <IconBtn icon={<Map size={16}/>} label={<>Advertisement<br/>& Circulation</>} />
          <IconBtn icon={<Briefcase size={16}/>} label="Accounts" />
        </div>

        <p className="text-gray-500 text-[11px] mt-8 text-center">
          © 2024 News Media ERP. All rights reserved.
        </p>
      </div>

      {/* Settings / Demo Toggle */}
      <button 
        onClick={() => setShowDemo(!showDemo)}
        className="absolute bottom-4 right-4 p-2 bg-black/40 text-gray-400 hover:text-white rounded-full backdrop-blur-sm z-20"
        title="Demo Accounts"
      >
        <Settings size={20} />
      </button>

      {/* Demo Accounts Panel */}
      {showDemo && (
        <div className="absolute right-16 bottom-4 bg-[#1b222a]/95 backdrop-blur-md border border-gray-700 p-4 rounded-xl shadow-2xl z-20 w-72">
          <h3 className="text-white text-sm font-bold mb-3 border-b border-gray-700 pb-2">Demo Accounts</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {DEMO_ACCOUNTS.map(acc => {
              const Icon = acc.icon
              return (
                <button 
                  key={acc.role} 
                  onClick={() => handleDemoSelect(acc)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg text-left group transition-colors"
                >
                  <div className="w-8 h-8 rounded-md bg-[#ae8a4b]/20 text-[#ae8a4b] flex items-center justify-center group-hover:bg-[#ae8a4b] group-hover:text-white transition-colors">
                    <Icon size={14} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-200 font-medium">{acc.label}</p>
                    <p className="text-[10px] text-gray-500">{acc.email}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
