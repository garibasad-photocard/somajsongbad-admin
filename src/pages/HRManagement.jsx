import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, Check, Clock, XCircle, List, UserPlus, MapPin, TrendingUp, Edit2, Trash2, Search, Filter, Settings, Plus, Save, Star } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useSettings } from '../context/SettingsContext'
import { useParams, Navigate } from 'react-router-dom'

// UI Components
function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-5 border-b border-gray-100 dark:border-slate-800 pb-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{subtitle}</p>}
    </div>
  )
}

function Chip({ label, colorClass }) {
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>{label}</span>
}

// ─────────────────────────────────────────────
// TAB 1: আমার ড্যাশবোর্ড (My Dashboard)
// ─────────────────────────────────────────────
function MyDashboardTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const res = await api.get('/hr/my-dashboard-stats')
      setStats(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) return <div className="flex h-64 items-center justify-center text-gray-500">ডাটা লোড হচ্ছে...</div>
  if (!stats) return <div className="flex h-64 items-center justify-center text-gray-500">ডেটা পাওয়া যায়নি।</div>

  const { kpi, leaveDistribution, trends, recentActivity } = stats

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-slate-800 dark:to-slate-800/80 p-5 rounded-2xl border border-blue-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 dark:bg-blue-500/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-2 relative">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">উপস্থিতি (এই মাস)</h3>
            <div className="p-2 bg-blue-500 text-white rounded-lg shadow-inner"><CheckCircle size={18}/></div>
          </div>
          <div className="relative">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{kpi.presentThisMonth} <span className="text-sm font-medium text-gray-500">দিন</span></h2>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-slate-800 dark:to-slate-800/80 p-5 rounded-2xl border border-red-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-500/10 dark:bg-red-500/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-2 relative">
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">লেট (এই মাস)</h3>
            <div className="p-2 bg-red-500 text-white rounded-lg shadow-inner"><Clock size={18}/></div>
          </div>
          <div className="relative">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{kpi.lateThisMonth} <span className="text-sm font-medium text-gray-500">দিন</span></h2>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-slate-800 dark:to-slate-800/80 p-5 rounded-2xl border border-orange-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-orange-500/10 dark:bg-orange-500/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-2 relative">
            <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-100">ছুটি ব্যবহার</h3>
            <div className="p-2 bg-orange-500 text-white rounded-lg shadow-inner"><Calendar size={18}/></div>
          </div>
          <div className="relative">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{kpi.usedLeaves} <span className="text-sm font-medium text-gray-500">দিন</span></h2>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-slate-800 dark:to-slate-800/80 p-5 rounded-2xl border border-green-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-green-500/10 dark:bg-green-500/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-2 relative">
            <h3 className="text-sm font-semibold text-green-900 dark:text-green-100">অবশিষ্ট ছুটি</h3>
            <div className="p-2 bg-green-500 text-white rounded-lg shadow-inner"><TrendingUp size={18}/></div>
          </div>
          <div className="relative">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{kpi.remainingLeaves} <span className="text-sm font-medium text-gray-500">দিন</span></h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <SectionHeader title="গত ৭ দিনের উপস্থিতি" subtitle="কাজের ঘণ্টা ও এটেনডেন্স ট্রেন্ড" />
          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-slate-700" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dx={-10} />
                <RechartsTooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4'}}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                <Line type="monotone" name="কাজের ঘণ্টা" dataKey="WorkHours" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} fill="url(#colorHours)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leave Quota Donut Chart */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <SectionHeader title="লিভ কোটা" subtitle="ছুটি ব্যবহারের ধরন" />
          <div className="flex-1 min-h-[250px] relative">
            {leaveDistribution.reduce((sum, item) => sum + item.value, 0) === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <Calendar size={40} className="mb-2 opacity-20" />
                <p className="text-sm font-medium">কোনো ছুটি ব্যবহার হয়নি</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leaveDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {leaveDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <SectionHeader title="সাম্প্রতিক হাজিরা" subtitle="গত ৫ দিনের লগ" />
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 text-xs uppercase text-gray-500 dark:text-slate-400">
                <th className="py-3 px-4 font-semibold">তারিখ</th>
                <th className="py-3 px-4 font-semibold">স্ট্যাটাস</th>
                <th className="py-3 px-4 font-semibold">চেক ইন</th>
                <th className="py-3 px-4 font-semibold">চেক আউট</th>
                <th className="py-3 px-4 font-semibold text-right">কাজের ঘণ্টা</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 dark:text-slate-300 divide-y divide-gray-50 dark:divide-slate-800/50">
              {recentActivity.length === 0 ? (
                <tr><td colSpan="5" className="py-6 text-center text-gray-500">কোনো লগ পাওয়া যায়নি</td></tr>
              ) : (
                recentActivity.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">{new Date(log.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                    <td className="py-3 px-4">
                      <Chip 
                        label={log.status === 'Present' ? 'উপস্থিত' : log.status === 'Late' ? 'লেট' : log.status === 'Half-Day' ? 'অর্ধ-দিবস' : 'অনুপস্থিত'} 
                        colorClass={log.status === 'Present' ? 'bg-green-100 text-green-700' : log.status === 'Late' ? 'bg-orange-100 text-orange-700' : log.status === 'Half-Day' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'} 
                      />
                    </td>
                    <td className="py-3 px-4">{log.checkIn}</td>
                    <td className="py-3 px-4">{log.checkOut}</td>
                    <td className="py-3 px-4 text-right font-medium">{log.workHours !== '-' ? `${parseFloat(log.workHours).toFixed(1)} ঘন্টা` : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB 2: লিভ আবেদন (Leave Request)
// ─────────────────────────────────────────────
function MyLeavesTab() {
  const [balances, setBalances] = useState([])
  const [requests, setRequests] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ leaveType: 'ক্যাজুয়াল লিভ', startDate: '', endDate: '', totalDays: 1, reason: '', substitute: '' })
  
  const leaveTypes = ['ক্যাজুয়াল লিভ', 'সিক লিভ', 'ম্যাটার্নিটি লিভ', 'বাৎসরিক ছুটি']

  const fetchData = async () => {
    try {
      const [balRes, reqRes, usersRes] = await Promise.all([
        api.get('/leaves/my-balances'),
        api.get('/leaves/my-requests'),
        api.get('/users')
      ])
      setBalances(balRes.data)
      setRequests(reqRes.data)
      setUsers(usersRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleApply = async (e) => {
    e.preventDefault()
    try {
      await api.post('/leaves/apply', form)
      alert('ছুটির আবেদন সফলভাবে জমা হয়েছে।')
      setForm({ ...form, startDate: '', endDate: '', reason: '', substitute: '' })
      fetchData()
    } catch (err) {
      console.error(err)
      alert('আবেদন জমা দিতে সমস্যা হয়েছে।')
    }
  }

  if (loading) return <div className="p-5 text-gray-500">লোড হচ্ছে...</div>

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader title="আমার ছুটির ব্যালেন্স" subtitle="চলতি বছরে আপনার মোট এবং ব্যবহৃত ছুটির পরিমাণ" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {leaveTypes.map(type => {
            const b = balances.find(x => x.leaveType === type)
            const total = b ? b.totalDays : 0
            const used = b ? b.usedDays : 0
            const remaining = total - used
            return (
              <div key={type} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">{type}</p>
                <div className="flex justify-around items-center">
                  <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p><p className="text-[10px] text-gray-500 uppercase">মোট</p></div>
                  <div><p className="text-2xl font-bold text-red-500">{used}</p><p className="text-[10px] text-gray-500 uppercase">ব্যবহার</p></div>
                  <div><p className="text-2xl font-bold text-green-500">{remaining}</p><p className="text-[10px] text-gray-500 uppercase">বাকি</p></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div id="leave-form-section">
          <SectionHeader title="নতুন ছুটির আবেদন" subtitle="ছুটির জন্য ফর্ম পূরণ করুন" />
          <form onSubmit={handleApply} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-5 rounded-xl space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">ছুটির ধরন</label>
              <select value={form.leaveType} onChange={e => setForm({...form, leaveType: e.target.value})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800">
                {leaveTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">শুরুর তারিখ</label>
                <input type="date" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">শেষের তারিখ</label>
                <input type="date" required value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">মোট দিন</label>
              <input type="number" min="1" required value={form.totalDays} onChange={e => setForm({...form, totalDays: Number(e.target.value)})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">দায়িত্বপ্রাপ্ত ব্যক্তি (Substitute)</label>
              <select value={form.substitute} onChange={e => setForm({...form, substitute: e.target.value})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800">
                <option value="">নির্বাচন করুন (ঐচ্ছিক)</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name} {u.departments?.length ? `(${u.departments.join(', ')})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">ছুটির কারণ</label>
              <textarea required rows="2" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800"></textarea>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">আবেদন জমা দিন</button>
          </form>
        </div>

        <div>
          <SectionHeader title="আমার ছুটির হিস্ট্রি" subtitle="পূর্বের আবেদনগুলোর অবস্থা" />
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {requests.map(req => (
              <div key={req._id} className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-sm text-gray-800 dark:text-slate-200">{req.leaveType}</span>
                  <Chip 
                    label={req.status === 'Pending' ? 'পেন্ডিং' : req.status === 'Approved' ? 'অনুমোদিত' : 'বাতিল'} 
                    colorClass={req.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : req.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} 
                  />
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">তারিখ: {req.startDate} থেকে {req.endDate} ({req.totalDays} দিন)</p>
                {req.substitute && <p className="text-xs text-gray-500 mb-1">দায়িত্বে: {req.substitute?.name}</p>}
                <p className="text-xs text-gray-500 italic">কারণ: {req.reason}</p>
              </div>
            ))}
            {requests.length === 0 && <p className="text-sm text-gray-500">কোনো আবেদন পাওয়া যায়নি।</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB 2: ছুটি অনুমোদন (Leave Approvals)
// ─────────────────────────────────────────────
function LeaveApprovalsTab() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const fetchRequests = async () => {
    try {
      const res = await api.get('/leaves/requests')
      setRequests(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/leaves/requests/${id}/status`, { status })
      alert(`আবেদনটি ${status === 'Approved' ? 'অনুমোদন' : 'বাতিল'} করা হয়েছে।`)
      fetchRequests()
    } catch (err) {
      console.error(err)
      alert('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।')
    }
  }

  // Calculate KPIs
  const totalRequests = requests.length
  let totalPending = 0
  let totalApproved = 0
  let totalRejected = 0
  const leaveTypesMap = {}

  requests.forEach(r => {
    if (r.status === 'Pending') totalPending++
    else if (r.status === 'Approved') totalApproved++
    else if (r.status === 'Rejected') totalRejected++

    if (leaveTypesMap[r.leaveType]) leaveTypesMap[r.leaveType]++
    else leaveTypesMap[r.leaveType] = 1
  })

  const leaveDistribution = Object.keys(leaveTypesMap).map(key => ({
    name: key,
    value: leaveTypesMap[key]
  }))

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b']

  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">ছুটি অনুমোদন ড্যাশবোর্ড</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">রিপোর্টার ও স্টাফদের ছুটির আবেদন পর্যবেক্ষণ এবং অনুমোদন করুন</p>
      </div>

      {loading ? (
        <div className="h-64 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:border-gray-300 transition-colors">
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">মোট আবেদন</p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{totalRequests}</h2>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:border-yellow-300 transition-colors">
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">পেন্ডিং</p>
              <h2 className="text-3xl font-bold text-yellow-500 dark:text-yellow-400">{totalPending}</h2>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:border-green-300 transition-colors">
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">অনুমোদিত</p>
              <h2 className="text-3xl font-bold text-green-600 dark:text-green-400">{totalApproved}</h2>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:border-red-300 transition-colors">
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">বাতিল</p>
              <h2 className="text-3xl font-bold text-red-500 dark:text-red-400">{totalRejected}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Donut Chart */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
              <SectionHeader title="ছুটির ধরন" subtitle="আবেদনের ডিস্ট্রিবিউশন" />
              <div className="flex-1 min-h-[250px] relative mt-2">
                {leaveDistribution.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <Calendar size={40} className="mb-2 opacity-20" />
                    <p className="text-sm font-medium">কোনো আবেদন নেই</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leaveDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {leaveDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Request List */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <SectionHeader title="আবেদন তালিকা" subtitle="বিস্তারিত দেখুন এবং সিদ্ধান্ত নিন" />
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="নাম দিয়ে খুঁজুন..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div className="relative w-full sm:w-40 flex items-center gap-2">
                    <Filter className="text-gray-400 shrink-0" size={16} />
                    <select 
                      value={statusFilter} 
                      onChange={e => setStatusFilter(e.target.value)}
                      className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option value="All">সব স্ট্যাটাস</option>
                      <option value="Pending">পেন্ডিং</option>
                      <option value="Approved">অনুমোদিত</option>
                      <option value="Rejected">বাতিল</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[500px]">
                {filteredRequests.map(req => (
                  <div key={req._id} className={`border p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-start md:items-center transition-all ${
                    req.status === 'Pending' 
                      ? 'bg-yellow-50/30 border-yellow-100 dark:bg-yellow-900/10 dark:border-yellow-900/30 shadow-sm' 
                      : 'bg-white border-gray-100 dark:bg-slate-800/50 dark:border-slate-700'
                  }`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h4 className="font-bold text-gray-900 dark:text-white text-base">{req.user?.name || 'অজ্ঞাত ইউজার'}</h4>
                        <Chip 
                          label={req.status === 'Pending' ? 'পেন্ডিং' : req.status === 'Approved' ? 'অনুমোদিত' : 'বাতিল'} 
                          colorClass={req.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : req.status === 'Approved' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'} 
                        />
                      </div>
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{req.leaveType} <span className="text-gray-500 dark:text-gray-400 font-normal">({req.totalDays} দিন)</span></p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-600 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(req.startDate).toLocaleDateString('bn-BD')} - {new Date(req.endDate).toLocaleDateString('bn-BD')}</span>
                        {req.substitute && <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400"><UserPlus size={12}/> {req.substitute?.name}</span>}
                      </div>
                      <div className="mt-3 bg-gray-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800">
                        <p className="text-sm text-gray-700 dark:text-slate-300 italic">"{req.reason}"</p>
                      </div>
                    </div>
                    
                    {req.status === 'Pending' ? (
                      <div className="flex flex-row md:flex-col gap-2 shrink-0">
                        <button onClick={() => updateStatus(req._id, 'Approved')} className="flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md">
                          <CheckCircle size={16} /> অনুমোদন
                        </button>
                        <button onClick={() => updateStatus(req._id, 'Rejected')} className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-red-100">
                          <XCircle size={16} /> বাতিল
                        </button>
                      </div>
                    ) : (
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">অ্যাপ্রুভড বাই</p>
                        <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">{req.approvedBy?.name}</p>
                      </div>
                    )}
                  </div>
                ))}
                {filteredRequests.length === 0 && (
                  <div className="text-center py-12 flex flex-col items-center">
                    <Search size={32} className="text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">কোনো আবেদন পাওয়া যায়নি।</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB 3: উপস্থিতি রিপোর্ট (Attendance Report)
// ─────────────────────────────────────────────
function AttendanceReportTab() {
  const [attendances, setAttendances] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState(new Date().toLocaleDateString('en-CA')) // Today
  const [searchQuery, setSearchQuery] = useState('')

  const fetchAttendances = async (date) => {
    setLoading(true)
    try {
      const res = await api.get(`/attendance/all?date=${date}`)
      setAttendances(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendances(dateFilter)
  }, [dateFilter])

  // Calculate KPIs
  const totalCheckIns = attendances.length
  let totalOnTime = 0
  let totalLate = 0
  let totalHalfDay = 0
  let totalWorkHours = 0

  attendances.forEach(a => {
    if (a.status === 'Present') totalOnTime++
    if (a.status === 'Late') totalLate++
    if (a.status === 'Half-Day') totalHalfDay++
    if (a.workHours) totalWorkHours += parseFloat(a.workHours)
  })

  const avgWorkHours = totalCheckIns > 0 ? (totalWorkHours / totalCheckIns).toFixed(1) : 0

  const statusData = [
    { name: 'অন-টাইম', count: totalOnTime },
    { name: 'লেট', count: totalLate },
    { name: 'হাফ-ডে', count: totalHalfDay },
  ]

  const filteredAttendances = attendances.filter(a => 
    a.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.user?.role?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">উপস্থিতি রিপোর্ট ড্যাশবোর্ড</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">কর্মীদের দৈনিক হাজিরা এবং লোকেশন রিপোর্ট</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-600 dark:text-slate-400">তারিখ নির্বাচন:</label>
          <input 
            type="date" 
            value={dateFilter} 
            onChange={e => setDateFilter(e.target.value)} 
            className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:border-blue-300 transition-colors">
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">মোট চেক-ইন</p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{totalCheckIns}</h2>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:border-green-300 transition-colors">
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">অন-টাইম</p>
              <h2 className="text-3xl font-bold text-green-600 dark:text-green-400">{totalOnTime}</h2>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:border-orange-300 transition-colors">
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">লেট (Late)</p>
              <h2 className="text-3xl font-bold text-orange-500 dark:text-orange-400">{totalLate}</h2>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:border-purple-300 transition-colors">
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">গড় কাজের ঘণ্টা</p>
              <h2 className="text-3xl font-bold text-purple-600 dark:text-purple-400">{avgWorkHours} <span className="text-lg text-gray-400 font-medium">ঘণ্টা</span></h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <SectionHeader title="উপস্থিতির হার" subtitle="অন-টাইম বনাম লেট" />
              <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-slate-700" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dx={-10} />
                    <RechartsTooltip cursor={{fill: '#f3f4f6', opacity: 0.4}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'অন-টাইম' ? '#10b981' : entry.name === 'লেট' ? '#f59e0b' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Data Table */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <SectionHeader title="কর্মীদের লিস্ট" subtitle="বিস্তারিত লগ" />
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="নাম বা রোল দিয়ে খুঁজুন..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 transition-all"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-x-auto rounded-lg border border-gray-100 dark:border-slate-800">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 dark:bg-slate-800/80 text-gray-600 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">নাম (রোল)</th>
                      <th className="px-4 py-3 font-semibold">স্ট্যাটাস</th>
                      <th className="px-4 py-3 font-semibold">চেক ইন</th>
                      <th className="px-4 py-3 font-semibold">চেক আউট</th>
                      <th className="px-4 py-3 font-semibold">লোকেশন</th>
                      <th className="px-4 py-3 font-semibold text-right">কাজের ঘণ্টা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50 text-gray-700 dark:text-slate-300">
                    {filteredAttendances.map(a => (
                      <tr key={a._id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{a.user?.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase">{a.user?.role}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Chip 
                            label={a.status === 'Present' ? 'অন-টাইম' : a.status === 'Late' ? 'লেট' : a.status === 'Half-Day' ? 'অর্ধ-দিবস' : 'অনুপস্থিত'} 
                            colorClass={a.status === 'Present' ? 'bg-green-100 text-green-700' : a.status === 'Late' ? 'bg-orange-100 text-orange-700' : a.status === 'Half-Day' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'} 
                          />
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {a.checkIn?.time ? new Date(a.checkIn.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {a.checkOut?.time ? new Date(a.checkOut.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {a.checkIn?.location ? (
                            <a href={`https://maps.google.com/?q=${a.checkIn.location}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-colors" title={a.checkIn.location}>
                              <MapPin size={16} />
                            </a>
                          ) : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-gray-900 dark:text-slate-200">{a.workHours ? `${parseFloat(a.workHours).toFixed(1)} h` : '-'}</span>
                        </td>
                      </tr>
                    ))}
                    {filteredAttendances.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <Search size={32} className="text-gray-300 mb-2" />
                            <p>কোনো হাজিরা ডাটা পাওয়া যায়নি।</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB 4: টপ ম্যানেজমেন্ট বোর্ড (Top Management Board)
// ─────────────────────────────────────────────
function TopManagementTab() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const res = await api.get('/hr/dashboard-stats')
      setStats(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) return <div className="p-5 text-gray-500">লোড হচ্ছে...</div>
  if (!stats) return <div className="p-5 text-red-500">ডেটা পাওয়া যায়নি।</div>

  const isHOD = user?.role === 'editor'
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b']

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-gray-600 dark:text-slate-400">Total Employees</p>
            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded">KPI</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white">{stats.today.totalEmployees}</h3>
            {/* Mock increment indicator */}
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+1.2%</span>
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-gray-600 dark:text-slate-400">Present Today</p>
            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded">KPI</span>
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white">{stats.today.present}</h3>
            {/* Simple Circular Progress (Mocked based on present/total) */}
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100 dark:text-slate-800" />
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" 
                  strokeDasharray="125.6" 
                  strokeDashoffset={125.6 - (125.6 * (stats.today.present / (stats.today.totalEmployees || 1)))} 
                  className="text-emerald-500" 
                  strokeLinecap="round" 
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-slate-300">
                {Math.round((stats.today.present / (stats.today.totalEmployees || 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-gray-600 dark:text-slate-400">Pending Leaves</p>
            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded">KPI</span>
          </div>
          <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white">{stats.today.pendingRequests || 0}</h3>
        </div>

        {/* On Leave Today */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-gray-600 dark:text-slate-400">On Leave Today</p>
            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded">KPI</span>
          </div>
          <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white">{stats.today.onLeave}</h3>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Spline Line Chart (7 Days Trend) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-base font-bold text-gray-900 dark:text-white">Workforce Attendance & Overtime Trends</h4>
            <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2 py-1 rounded font-medium border border-gray-200 dark:border-slate-700">Spline Line Chart</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.attendanceTrends}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOvertime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-slate-700" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dx={-10} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Present" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Attendance" />
                <Line type="monotone" dataKey="Overtime" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Overtime" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart (Department Headcount) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-base font-bold text-gray-900 dark:text-white">{isHOD ? "Role Distribution" : "Department Headcount"}</h4>
            <span className="text-gray-400">...</span>
          </div>
          <p className="text-xs text-gray-500 mb-4">Interactive Donut Chart</p>
          <div className="h-48 relative flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.departmentHeadcount}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.departmentHeadcount.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.departmentHeadcount.length}</span>
              <span className="text-[10px] text-gray-500">{isHOD ? "Roles" : "Departments"}</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
            {stats.departmentHeadcount.map((entry, index) => (
              <div key={index} className="flex items-center text-xs">
                <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                <span className="truncate flex-1 text-gray-700 dark:text-slate-300">{entry.name}</span>
                <span className="font-semibold text-gray-900 dark:text-white ml-1">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ACTIVE EMPLOYEE STATUS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800">
          <h4 className="text-base font-bold text-gray-900 dark:text-white">Active Employee Status</h4>
          <button className="text-sm font-medium text-gray-600 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors border border-gray-200 dark:border-slate-700">
            Quick Action ▾
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
            <thead className="text-xs font-semibold text-gray-500 uppercase bg-gray-50/50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4">Name ▴</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Check-in ↕</th>
                <th className="px-6 py-4 text-right">Last Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
              {stats.activeEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No active employees found</td>
                </tr>
              ) : (
                stats.activeEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        {emp.name.charAt(0)}
                      </div>
                      {emp.name}
                    </td>
                    <td className="px-6 py-3">{emp.department}</td>
                    <td className="px-6 py-3">{emp.role.replace('_', ' ')}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        emp.status === 'On Duty' ? 'bg-emerald-100 text-emerald-700' :
                        emp.status === 'On Leave' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center font-medium">{emp.checkIn}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors rounded hover:bg-indigo-50"><Edit2 size={16}/></button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────
// TAB 5: মাস্টার ডেটা (Master Data)
// ─────────────────────────────────────────────
function MasterDataTab() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Local form state
  const [leaveTypes, setLeaveTypes] = useState([])
  const [officeTimings, setOfficeTimings] = useState({ checkInTime: '', lateThreshold: '' })
  const [weekends, setWeekends] = useState([])

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const BN_DAYS = { 'Sunday': 'রবিবার', 'Monday': 'সোমবার', 'Tuesday': 'মঙ্গলবার', 'Wednesday': 'বুধবার', 'Thursday': 'বৃহস্পতিবার', 'Friday': 'শুক্রবার', 'Saturday': 'শনিবার' }

  const fetchSettings = async () => {
    try {
      const res = await api.get('/hr/settings')
      const data = res.data
      setSettings(data)
      setLeaveTypes(data.leaveTypes || [])
      setOfficeTimings(data.officeTimings || { checkInTime: '10:00', lateThreshold: '10:15' })
      setWeekends(data.weekends || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/hr/settings', {
        leaveTypes, officeTimings, weekends
      })
      alert('সেটিংস সফলভাবে সংরক্ষিত হয়েছে!')
      fetchSettings()
    } catch (err) {
      console.error(err)
      alert('সেটিংস সেভ করতে সমস্যা হয়েছে।')
    } finally {
      setSaving(false)
    }
  }

  const toggleWeekend = (day) => {
    if (weekends.includes(day)) {
      setWeekends(weekends.filter(d => d !== day))
    } else {
      setWeekends([...weekends, day])
    }
  }

  const handleLeaveChange = (index, field, value) => {
    const newLeaves = [...leaveTypes]
    newLeaves[index][field] = value
    setLeaveTypes(newLeaves)
  }

  const addLeaveType = () => {
    setLeaveTypes([...leaveTypes, { name: 'নতুন ছুটি', defaultDays: 1 }])
  }

  const removeLeaveType = (index) => {
    setLeaveTypes(leaveTypes.filter((_, i) => i !== index))
  }

  if (loading) return <div className="p-5 text-gray-500">লোড হচ্ছে...</div>

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Settings className="text-blue-500"/> মাস্টার ডেটা ও সেটিংস</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">এইচআর পলিসি, ছুটির কোটা এবং অফিস সময়সূচি কনফিগার করুন</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="mt-4 md:mt-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-500/30 hover:shadow-md"
        >
          <Save size={18} /> {saving ? 'সেভ হচ্ছে...' : 'সেটিংস সেভ করুন'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Office Timings & Weekends */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <SectionHeader title="অফিস সময়সূচি (Office Timings)" subtitle="কর্মীদের এটেনডেন্স ট্র্যাকিংয়ের জন্য ডিফল্ট সময়" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5"><Clock size={16} className="text-gray-400"/> Check-in Time</label>
                <input 
                  type="time" 
                  value={officeTimings.checkInTime} 
                  onChange={e => setOfficeTimings({...officeTimings, checkInTime: e.target.value})}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1.5">এই সময়ের মধ্যে অফিসে উপস্থিত হতে হবে।</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5"><Clock size={16} className="text-orange-400"/> Late Threshold</label>
                <input 
                  type="time" 
                  value={officeTimings.lateThreshold} 
                  onChange={e => setOfficeTimings({...officeTimings, lateThreshold: e.target.value})}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-orange-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1.5">এই সময়ের পর উপস্থিত হলে 'Late' হিসেবে কাউন্ট হবে।</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <SectionHeader title="সাপ্তাহিক ছুটি (Weekends)" subtitle="কোম্পানির সাপ্তাহিক ছুটির দিনগুলো নির্বাচন করুন" />
            <div className="flex flex-wrap gap-3 mt-4">
              {DAYS.map(day => {
                const isSelected = weekends.includes(day)
                return (
                  <button 
                    key={day}
                    onClick={() => toggleWeekend(day)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                      isSelected 
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300' 
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isSelected && <CheckCircle size={14} className="inline mr-1.5 mb-0.5" />}
                    {BN_DAYS[day]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Leave Policies */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col h-[550px]">
          <div className="flex justify-between items-center mb-4">
            <SectionHeader title="লিভ পলিসি ও কোটা" subtitle="কর্মীদের জন্য বাৎসরিক ছুটির ধরণ ও বরাদ্দ" />
            <button onClick={addLeaveType} className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
              <Plus size={16} /> নতুন ছুটি
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {leaveTypes.map((type, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-3 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">ছুটির নাম (ধরন)</label>
                  <input 
                    type="text" 
                    value={type.name} 
                    onChange={e => handleLeaveChange(index, 'name', e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">বরাদ্দ দিন (বাৎসরিক)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={type.defaultDays} 
                    onChange={e => handleLeaveChange(index, 'defaultDays', parseInt(e.target.value))}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex items-end pb-0.5">
                  <button onClick={() => removeLeaveType(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="মুছে ফেলুন">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {leaveTypes.length === 0 && (
              <div className="text-center py-10 text-gray-400">কোনো ছুটির ধরন কনফিগার করা নেই।</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const DEFAULT_SHIFTS = [
  { id: 1, name: 'মর্নিং শিফট', start: '০৬:০০', end: '১৪:০০', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 2, name: 'ডে শিফট', start: '১৪:০০', end: '২২:০০', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 3, name: 'নাইট শিফট', start: '২২:০০', end: '০৬:০০', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
]

function ShiftsTab() {
  const { t } = useLanguage()
  const [shifts, setShifts] = useState(() => {
    const stored = localStorage.getItem('cms_shifts')
    return stored ? JSON.parse(stored) : DEFAULT_SHIFTS
  })
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', start: '', end: '' })

  const handleAdd = () => {
    if (!form.name.trim()) return
    const updated = [...shifts, { id: Date.now(), ...form, color: 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700' }]
    setShifts(updated)
    localStorage.setItem('cms_shifts', JSON.stringify(updated))
    setForm({ name: '', start: '', end: '' })
    setAdding(false)
  }

  const handleDelete = (id) => {
    const updated = shifts.filter(x => x.id !== id)
    setShifts(updated)
    localStorage.setItem('cms_shifts', JSON.stringify(updated))
  }

  return (
    <div>
      <SectionHeader title={t.shifts} subtitle={t.mdShiftDesc} />
      <div className="space-y-2 mb-3">
        {shifts.map((s) => (
          <div key={s.id} className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3">
            <Clock size={16} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
            <Chip label={s.name} colorClass={s.color} />
            <div className="flex-1 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
              <span className="font-mono bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2 py-0.5 rounded">{s.start}</span>
              <span>→</span>
              <span className="font-mono bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2 py-0.5 rounded">{s.end}</span>
            </div>
            <button onClick={() => handleDelete(s.id)}
              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <input placeholder={t.shiftName} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="time" placeholder={t.startTime} value={form.start} onChange={e => setForm({ ...form, start: e.target.value })}
              className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="time" placeholder={t.endTime} value={form.end} onChange={e => setForm({ ...form, end: e.target.value })}
              className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg">
              <Check size={13} /> {t.saveBtn}
            </button>
            <button onClick={() => setAdding(false)}
              className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800">{t.cancelBtn}</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded-xl px-4 py-2.5 w-full hover:bg-blue-50 transition-colors">
          <Plus size={14} /> {t.newShift}
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB 8.5 — কাস্টম ছুটি (Custom Leaves)
// ─────────────────────────────────────────────
const DEFAULT_CUSTOM_LEAVES = [
  { id: 1, name: 'ক্যাজুয়াল লিভ', startDate: '', endDate: '', color: 'bg-orange-100 text-orange-700' },
  { id: 2, name: 'সিক লিভ', startDate: '', endDate: '', color: 'bg-red-100 text-red-700' },
  { id: 3, name: 'ম্যাটার্নিটি লিভ', startDate: '', endDate: '', color: 'bg-pink-100 text-pink-700' },
]

function CustomLeavesTab() {
  const { t } = useLanguage()
  const [leaves, setLeaves] = useState(() => {
    const stored = localStorage.getItem('cms_custom_leaves')
    return stored ? JSON.parse(stored) : DEFAULT_CUSTOM_LEAVES
  })
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '' })

  const handleAdd = () => {
    if (!form.name.trim()) return
    const updated = [...leaves, { id: Date.now(), ...form, color: 'bg-red-50 text-red-500 border border-red-200' }]
    setLeaves(updated)
    localStorage.setItem('cms_custom_leaves', JSON.stringify(updated))
    setForm({ name: '', startDate: '', endDate: '' })
    setAdding(false)
  }

  const handleDelete = (id) => {
    const updated = leaves.filter(x => x.id !== id)
    setLeaves(updated)
    localStorage.setItem('cms_custom_leaves', JSON.stringify(updated))
  }

  return (
    <div>
      <SectionHeader title="কাস্টম ছুটি" subtitle="রিপোর্টারদের জন্য কাস্টম ছুটির ধরন তৈরি করুন (যেমন: সিক লিভ, ক্যাজুয়াল লিভ)।" />
      <div className="space-y-2 mb-3">
        {leaves.map((l) => (
          <div key={l.id} className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3">
            <Calendar size={16} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-1">
              <span className={`text-sm font-semibold text-gray-800 dark:text-slate-200 w-fit px-2 py-0.5 rounded-md ${l.color}`}>{l.name}</span>
              {(l.startDate || l.date) && (
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                  তারিখ: {new Date(l.startDate || l.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {l.endDate && l.endDate !== (l.startDate || l.date) ? ` - ${new Date(l.endDate).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
                </span>
              )}
            </div>
            <button onClick={() => handleDelete(l.id)}
              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-500 mb-1 block uppercase">ছুটির নাম</label>
              <input placeholder="যেমন: ঈদের ছুটি" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 mb-1 block uppercase">শুরুর তারিখ</label>
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-600" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 mb-1 block uppercase">শেষের তারিখ (ঐচ্ছিক)</label>
              <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-600" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1.5 rounded-lg">
              <Check size={13} /> সেভ করুন
            </button>
            <button onClick={() => setAdding(false)}
              className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800">বাতিল</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-sm text-red-600 border border-dashed border-red-300 rounded-xl px-4 py-2.5 w-full hover:bg-red-50 transition-colors">
          <Plus size={14} /> নতুন ছুটি যোগ করুন
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB 9 — শিফট ক্যালেন্ডার (Matrix View)
// ─────────────────────────────────────────────
const REPORTERS = ['রাকিব খান', 'তাসনিয়া সুলতানা', 'মাহিন হাসান', 'ফারজানা রহমান']

const VIEWS = {
  weekly: { label: 'সাপ্তাহিক', columns: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'] },
  monthly: { label: 'মাসিক', columns: Array.from({length: 31}, (_, i) => `${i+1}`) },
  yearly: { label: 'বাৎসরিক', columns: ['জানু', 'ফেব্রি', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'] }
}

function ShiftCalendarTab() {
  const { t } = useLanguage()
  const { shiftEvents, updateShiftEvents, journalists } = useSettings()

  // Load shifts and custom leaves from localStorage to make the calendar dynamic
  const [dynamicShifts, setDynamicShifts] = useState(() => {
    try {
      const stored = localStorage.getItem('cms_shifts')
      const parsed = stored ? JSON.parse(stored) : null
      return Array.isArray(parsed) ? parsed : DEFAULT_SHIFTS
    } catch { return DEFAULT_SHIFTS }
  })
  
  const [dynamicLeaves, setDynamicLeaves] = useState(() => {
    try {
      const stored = localStorage.getItem('cms_custom_leaves')
      const parsed = stored ? JSON.parse(stored) : null
      return Array.isArray(parsed) ? parsed : DEFAULT_CUSTOM_LEAVES
    } catch { return DEFAULT_CUSTOM_LEAVES }
  })

  const ALL_TYPES = [...dynamicShifts.map(s => s.name), 'ছুটি', ...dynamicLeaves.map(l => l.name)]
  const TYPE_COLORS = { 'ছুটি': 'bg-red-50 text-red-400' }
  dynamicShifts.forEach(s => TYPE_COLORS[s.name] = s.color)
  dynamicLeaves.forEach(l => TYPE_COLORS[l.name] = l.color)
  
  // Active View
  const [activeView, setActiveView] = useState('weekly')
  
  // Use journalists from settings if available, else fallback
  const reporterList = Array.isArray(journalists) && journalists.length > 0 
    ? journalists.map(j => j?.name || 'Unknown') 
    : REPORTERS

  const [schedule, setSchedule] = useState(() => {
    // If shiftEvents is an array from the DB, we need to convert it or handle it. 
    // Since we just migrated it, it might be an array of objects. Let's start fresh with a matrix if it's not matching.
    if (shiftEvents && typeof shiftEvents === 'object' && !Array.isArray(shiftEvents) && Object.keys(shiftEvents).length > 0) {
      return shiftEvents;
    }
    
    // Default empty state
    const s = { weekly: {}, monthly: {}, yearly: {} }
    reporterList.forEach(r => {
      s.weekly[r] = {}; VIEWS.weekly.columns.forEach(c => s.weekly[r][c] = 'ডে শিফট');
      s.monthly[r] = {}; VIEWS.monthly.columns.forEach(c => s.monthly[r][c] = 'ডে শিফট');
      s.yearly[r] = {}; VIEWS.yearly.columns.forEach(c => s.yearly[r][c] = 'ডে শিফট');
    })
    return s
  })
  
  const [saved, setSaved] = useState(false)

  const update = (reporter, col, val) => {
    setSchedule(prev => ({
      ...prev,
      [activeView]: {
        ...prev[activeView],
        [reporter]: {
          ...(prev[activeView]?.[reporter] || {}),
          [col]: val
        }
      }
    }))
  }

  const handleSave = async () => {
    updateShiftEvents(schedule) // Save to DB as an object
    try {
      localStorage.setItem('cms_shift_schedule', JSON.stringify(schedule.weekly || {}))
      await api.post('/duty-roster/matrix', { schedule })
    } catch (err) {
      console.error('Failed to sync roster with backend API', err)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const currentColumns = VIEWS[activeView].columns

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <SectionHeader title={t.calendar} subtitle="টেবিল ভিউ ব্যবহার করে সাপ্তাহিক, মাসিক বা বাৎসরিক শিফট নির্ধারণ করুন।" />
        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
          {Object.entries(VIEWS).map(([key, view]) => (
            <button
              key={key}
              onClick={() => setActiveView(key)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeView === key ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:text-slate-200'
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800">
              <th className="text-left text-xs font-semibold text-gray-600 dark:text-slate-400 px-4 py-3 sticky left-0 bg-gray-50 dark:bg-slate-800 shadow-[1px_0_0_#f3f4f6] z-10">
                {t.reporterCol}
              </th>
              {currentColumns.map(col => (
                <th key={col} className="text-center text-xs font-semibold text-gray-600 dark:text-slate-400 px-2 py-3 min-w-[90px]">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reporterList.map((r) => (
              <tr key={r} className="border-b border-gray-50 hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800 transition-colors">
                <td className="px-4 py-2.5 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800 shadow-[1px_0_0_#f3f4f6] z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-semibold">{r?.[0] || '?'}</div>
                    <span className="text-sm font-medium text-gray-800 dark:text-slate-200 whitespace-nowrap">{r || 'Unknown'}</span>
                  </div>
                </td>
                {currentColumns.map(col => (
                  <td key={col} className="px-1.5 py-2">
                    <select 
                      value={schedule[activeView]?.[r]?.[col] || 'ডে শিফট'} 
                      onChange={e => update(r, col, e.target.value)}
                      className={`w-full text-xs rounded-lg px-2 py-1.5 border-0 font-medium focus:outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer ${TYPE_COLORS[schedule[activeView]?.[r]?.[col] || 'ডে শিফট'] || 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'}`}
                    >
                      {ALL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex flex-wrap items-center gap-3">
          {Object.entries(TYPE_COLORS).map(([k, v]) => (
            <span key={k} className={`text-xs px-2 py-1 rounded-md font-medium ${v}`}>{k}</span>
          ))}
        </div>
        <button onClick={handleSave} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm">
          <Check size={14} /> {saved ? 'সেভ হয়েছে!' : 'সেভ করুন'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB 10 — বিশেষ দিবস
// ─────────────────────────────────────────────
const DEFAULT_SPECIAL_DAYS = [
  { id: 1, date: '2025-02-21', name: 'আন্তর্জাতিক মাতৃভাষা দিবস', type: 'জাতীয়', recurring: true },
  { id: 2, date: '2025-03-26', name: 'স্বাধীনতা দিবস', type: 'জাতীয়', recurring: true },
  { id: 3, date: '2025-12-16', name: 'বিজয় দিবস', type: 'জাতীয়', recurring: true },
  { id: 4, date: '2025-04-14', name: 'পহেলা বৈশাখ', type: 'সাংস্কৃতিক', recurring: true },
]

const TYPE_COLORS = {
  জাতীয: 'bg-green-100 text-green-700 border-green-200',
  সাংস্কৃতিক: 'bg-orange-100 text-orange-700 border-orange-200',
  ধর্মীয়: 'bg-purple-100 text-purple-700 border-purple-200',
  আন্তর্জাতিক: 'bg-blue-100 text-blue-700 border-blue-200',
}

function SpecialDaysTab() {
  const { t } = useLanguage()
  const [days, setDays] = useState(() => {
    const stored = localStorage.getItem('cms_special_days')
    return stored ? JSON.parse(stored) : DEFAULT_SPECIAL_DAYS
  })
  const [form, setForm] = useState({ date: '', name: '', type: 'জাতীয়', recurring: true })
  const [adding, setAdding] = useState(false)

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))

  const handleAdd = () => {
    if (!form.date || !form.name.trim()) return
    const updated = [...days, { id: Date.now(), ...form }]
    setDays(updated)
    localStorage.setItem('cms_special_days', JSON.stringify(updated))
    setForm({ date: '', name: '', type: 'জাতীয়', recurring: true })
    setAdding(false)
  }

  const handleDelete = (id) => {
    const updated = days.filter(x => x.id !== id)
    setDays(updated)
    localStorage.setItem('cms_special_days', JSON.stringify(updated))
  }

  const formatDate = (iso) => {
    const d = new Date(iso)
    if (t.roles === 'Roles') {
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    }
    return d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const getTypeName = (typeBn) => {
    if (typeBn === 'জাতীয়') return t.typeNational
    if (typeBn === 'সাংস্কৃতিক') return t.typeCultural
    if (typeBn === 'ধর্মীয়') return t.typeReligious
    if (typeBn === 'আন্তর্জাতিক') return t.typeInternational
    return typeBn
  }

  return (
    <div>
      <SectionHeader title={t.specialdays} subtitle={t.mdSpecialDesc} />
      <div className="space-y-2 mb-3">
        {sorted.map((d) => (
          <div key={d.id} className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3">
            <div className="text-center min-w-[48px]">
              <p className="text-lg font-bold text-gray-800 dark:text-slate-200 leading-none">{new Date(d.date).getDate()}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">{new Date(d.date).toLocaleDateString(t.roles === 'Roles' ? 'en-US' : 'bn-BD', { month: 'short' })}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{d.name}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">{formatDate(d.date)} {d.recurring ? `• ${t.everyYear}` : ''}</p>
            </div>
            <Chip label={getTypeName(d.type)} colorClass={TYPE_COLORS[d.type] || 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'} />
            <button onClick={() => handleDelete(d.id)}
              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="জাতীয়">{t.typeNational}</option>
              <option value="সাংস্কৃতিক">{t.typeCultural}</option>
              <option value="ধর্মীয়">{t.typeReligious}</option>
              <option value="আন্তর্জাতিক">{t.typeInternational}</option>
            </select>
          </div>
          <input placeholder={t.dayName} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" checked={form.recurring} onChange={e => setForm({ ...form, recurring: e.target.checked })}
              className="rounded text-blue-600" />
            {t.repeatYearly} (প্রতি বছর)
          </label>
          <div className="flex gap-2 mt-2">
            <button onClick={handleAdd}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg">
              <Check size={13} /> {t.saveBtn}
            </button>
            <button onClick={() => setAdding(false)}
              className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800">{t.cancelBtn}</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded-xl px-4 py-2.5 w-full hover:bg-blue-50 transition-colors">
          <Plus size={14} /> {t.addSpecialDay}
        </button>
      )}
    </div>
  )
}



// ─────────────────────────────────────────────
// MAIN HR Management Component
// ─────────────────────────────────────────────
export default function HRManagement() {
  const { user } = useAuth()
  const { tabId } = useParams()
  
  const isTopManagement = ['super_admin', 'managing_editor', 'admin', 'chief_editor'].includes(user?.role)
  const isHOD = user?.role === 'editor' || isTopManagement
  
  const TABS = [
    { id: 'my-dashboard', label: 'আমার ড্যাশবোর্ড', icon: TrendingUp, component: MyDashboardTab },
    { id: 'my-leaves', label: 'লিভ আবেদন', icon: Calendar, component: MyLeavesTab },
    ...(isHOD ? [
      { id: 'leave-approvals', label: 'ছুটি অনুমোদন', icon: CheckCircle, component: LeaveApprovalsTab },
      { id: 'attendance-report', label: 'উপস্থিতি রিপোর্ট', icon: List, component: AttendanceReportTab },
      { id: 'top-management', label: isTopManagement ? 'টপ ম্যানেজমেন্ট বোর্ড' : 'ডিপার্টমেন্ট বোর্ড', icon: UserPlus, component: TopManagementTab },
    ] : []),
    ...(isTopManagement ? [
      { id: 'shifts', label: 'ডিউটি শিফট', icon: Clock, component: ShiftsTab },
      { id: 'shift-calendar', label: 'শিফট ক্যালেন্ডার', icon: Calendar, component: ShiftCalendarTab },
      { id: 'custom-leaves', label: 'কাস্টম ছুটি', icon: Calendar, component: CustomLeavesTab },
      { id: 'special-days', label: 'বিশেষ দিবস', icon: Star, component: SpecialDaysTab },
      { id: 'master-data', label: 'মাস্টার ডেটা', icon: Settings, component: MasterDataTab }
    ] : [])
  ]

  const currentTab = TABS.find(t => t.id === tabId)
  
  if (!currentTab && tabId) {
    return <Navigate to="/hr-leaves/my-dashboard" replace />
  }

  const ActiveComponent = currentTab?.component || MyDashboardTab

  return (
    <div className="p-6 h-full flex flex-col max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HR ও লিভ ম্যানেজমেন্ট</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{currentTab?.label || 'হাজিরা, ছুটির আবেদন এবং রিপোর্ট'}</p>
        </div>
        <div 
          className={`flex items-center gap-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800 ${tabId === 'my-leaves' ? 'cursor-pointer hover:bg-blue-100 transition-colors' : ''}`}
          onClick={() => {
            if (tabId === 'my-leaves') {
              document.getElementById('leave-form-section')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          title={tabId === 'my-leaves' ? 'নতুন ছুটির আবেদনে যান' : currentTab?.label}
        >
          {currentTab && <currentTab.icon size={18} />}
          <span className="text-sm font-medium">{currentTab?.label}</span>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 overflow-y-auto shadow-sm">
        <ActiveComponent />
      </div>
    </div>
  )
}
