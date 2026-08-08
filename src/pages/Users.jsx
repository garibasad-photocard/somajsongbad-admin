import { useState, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, X, Shield, User as UserIcon } from 'lucide-react'
import api from '../services/api'
import { useSettings } from '../context/SettingsContext'

const roleConfig = {
  super_admin:        { label: 'সুপার অ্যাডমিন',          class: 'bg-pink-100 text-pink-700' },
  managing_editor:    { label: 'ম্যানেজিং এডিটর',          class: 'bg-rose-100 text-rose-700' },
  admin:              { label: 'অ্যাডমিন (HR/IT)',          class: 'bg-purple-100 text-purple-700' },
  executive_editor:   { label: 'এক্সিকিউটিভ এডিটর',       class: 'bg-indigo-100 text-indigo-700' },
  chief_editor:       { label: 'চিফ এডিটর',                class: 'bg-amber-100 text-amber-700' },
  editor:             { label: 'এডিটর / বিভাগীয় প্রধান',  class: 'bg-blue-100 text-blue-700' },
  chief_reporter:     { label: 'চিফ রিপোর্টার',            class: 'bg-teal-100 text-teal-700' },
  desk_editor:        { label: 'ডেস্ক এডিটর',              class: 'bg-cyan-100 text-cyan-700' },
  news_manager:       { label: 'নিউজ ম্যানেজার',           class: 'bg-sky-100 text-sky-700' },
  sub_editor:         { label: 'সাব এডিটর',                class: 'bg-lime-100 text-lime-700' },
  proof_reader:       { label: 'প্রুফ রিডার',              class: 'bg-yellow-100 text-yellow-700' },
  page_editor:        { label: 'পেজ এডিটর',                class: 'bg-orange-100 text-orange-700' },
  page_makeup_artist: { label: 'পেজ মেকআপ আর্টিস্ট',      class: 'bg-fuchsia-100 text-fuchsia-700' },
  reporter:           { label: 'রিপোর্টার',                 class: 'bg-green-100 text-green-700' },
  master_data:        { label: 'Master Data Entry',         class: 'bg-gray-100 text-gray-700' },
}

function UserModal({ user, onSave, onClose, categories, printPages }) {
  const [form, setForm] = useState(
    user || { name: '', email: '', password: '', role: 'reporter', departments: [], cross_departments: [], edition: 'both' }
  )
  const [loading, setLoading] = useState(false)

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (user && user._id) {
        const res = await api.put(`/users/${user._id}`, form)
        onSave(res.data, 'update')
      } else {
        const res = await api.post('/users', form)
        onSave(res.data, 'create')
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving user')
    } finally {
      setLoading(false)
    }
  }

  const toggleDept = (dept, type) => {
    setForm(prev => {
      const list = prev[type] || [];
      if (list.includes(dept)) {
        return { ...prev, [type]: list.filter(d => d !== dept) }
      } else {
        return { ...prev, [type]: [...list, dept] }
      }
    })
  }

  const needsDepartments = ['editor', 'reporter', 'chief_editor'].includes(form.role);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6 pointer-events-auto" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl w-full max-h-[90vh] flex flex-col resize overflow-auto shadow-2xl transition-shadow" 
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px)`, 
          maxWidth: '32rem', // default max-w-lg
          minWidth: '20rem',
          minHeight: '20rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0 cursor-move bg-gray-50/50 dark:bg-slate-800/50 rounded-t-xl"
          onMouseDown={handleMouseDown}
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white select-none">
            {user ? 'ইউজার এডিট করুন' : 'নতুন ইউজার যুক্ত করুন'}
          </h3>
          <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:text-slate-300">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <form id="userForm" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">নাম</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">ইমেইল</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">পাসওয়ার্ড {user && '(নতুন পাসওয়ার্ড দিতে চাইলে)'}</label>
                <input type={user ? "password" : "text"} required={!user} value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">রোল</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, departments: [], cross_departments: [] })}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="super_admin">👑 সুপার অ্যাডমিন</option>
                  <option value="managing_editor">🎯 ম্যানেজিং এডিটর (নিউজরুম প্রধান)</option>
                  <option value="admin">🔧 অ্যাডমিন (HR / IT)</option>
                  <option value="executive_editor">🏆 এক্সিকিউটিভ এডিটর</option>
                  <option value="chief_editor">✍️ চিফ এডিটর</option>
                  <option value="editor">📋 এডিটর / বিভাগীয় প্রধান</option>
                  <option value="chief_reporter">📰 চিফ রিপোর্টার</option>
                  <option value="desk_editor">🗂️ ডেস্ক এডিটর</option>
                  <option value="news_manager">📌 নিউজ ম্যানেজার (NM ডেস্ক)</option>
                  <option value="sub_editor">✂️ সাব এডিটর</option>
                  <option value="proof_reader">🔍 প্রুফ রিডার</option>
                  <option value="page_editor">🗞️ পেজ এডিটর</option>
                  <option value="page_makeup_artist">🎨 পেজ মেকআপ আর্টিস্ট</option>
                  <option value="reporter">📝 রিপোর্টার</option>
                  <option value="master_data">🗄️ Master Data Entry</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">এডিশন (কোন ভার্সনের এডিটর/রিপোর্টার)</label>
              <select value={form.edition || 'both'} onChange={(e) => setForm({ ...form, edition: e.target.value })}
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="both">🔀 উভয় (Online + Print)</option>
                <option value="online">🌐 অনলাইন ভার্সন</option>
                <option value="print">🗞️ প্রিন্ট ভার্সন</option>
              </select>
            </div>

            {needsDepartments && (
              <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 bg-gray-50 dark:bg-slate-800">
                <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-3">
                  {form.edition === 'print' ? 'প্রিন্ট পেজ পারমিশন' : 'ডিপার্টমেন্ট / ক্যাটাগরি পারমিশন'}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-2">
                      {form.edition === 'print' ? 'নিজস্ব পেজ (ড্যাশবোর্ডে দেখবে)' : 'নিজস্ব ডিপার্টমেন্ট (ড্যাশবোর্ডে দেখবে)'}
                    </p>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {(form.edition === 'print' ? printPages.map(p => ({id: p, name: p})) : categories).map(c => (
                        <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={form.departments?.includes(c.name)} onChange={() => toggleDept(c.name, 'departments')}
                            className="rounded text-blue-600 w-3.5 h-3.5" />
                          <span className="text-xs text-gray-700 dark:text-slate-300">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-2">
                      {form.edition === 'print' ? 'অন্যান্য পেজ (অ্যাসাইন করার পারমিশন)' : 'অন্যান্য ডিপার্টমেন্ট (অ্যাসাইন করার পারমিশন)'}
                    </p>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {(form.edition === 'print' ? printPages.map(p => ({id: p, name: p})) : categories).map(c => (
                        <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={form.cross_departments?.includes(c.name)} onChange={() => toggleDept(c.name, 'cross_departments')}
                            className="rounded text-blue-600 w-3.5 h-3.5" />
                          <span className="text-xs text-gray-700 dark:text-slate-300">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-800 shrink-0">
          <button form="userForm" type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            {loading ? 'অপেক্ষা করুন...' : (user ? 'পরিবর্তন সেভ করুন' : 'ইউজার যুক্ত করুন')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [modalUser, setModalUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const { categories, printPages } = useSettings()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users')
        setUsers(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = (userData, type) => {
    if (type === 'update') {
      setUsers(users.map((u) => (u._id === userData._id ? userData : u)))
    } else {
      setUsers([userData, ...users])
    }
    setShowModal(false)
    setModalUser(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('সত্যিই ইউজার ডিলিট করতে চান?')) return
    try {
      await api.delete(`/users/${id}`)
      setUsers(users.filter((u) => u._id !== id))
    } catch (err) {
      alert('Error deleting user')
    }
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="sticky top-0 z-40 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur-sm py-4 -mx-4 px-4 md:-mx-6 md:px-6 border-b border-gray-200 dark:border-slate-700/50 flex items-center justify-between shadow-sm">
        <div className="relative w-72">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ইউজার খুঁজুন..."
            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <button onClick={() => { setModalUser(null); setShowModal(true) }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded-lg transition-colors">
          <Plus size={14} /> নতুন ইউজার
        </button>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-10 text-sm text-gray-400 dark:text-slate-500">অপেক্ষা করুন...</div>
        ) : (
          ['both', 'online', 'print'].map(editionKey => {
            const editionUsers = filtered.filter(u => (u.edition || 'both') === editionKey);
            if (editionUsers.length === 0) return null;

            const editionLabels = {
              both: '🔀 উভয় ভার্সন (Online + Print) ও অ্যাডমিন',
              online: '🌐 অনলাইন ভার্সন',
              print: '🗞️ প্রিন্ট ভার্সন'
            };

            const roleOrder = [
              'super_admin', 'managing_editor', 'admin',
              'executive_editor', 'chief_editor', 'editor',
              'chief_reporter', 'desk_editor', 'news_manager',
              'sub_editor', 'proof_reader', 'page_editor', 'page_makeup_artist',
              'reporter', 'master_data'
            ];
            
            // Group by role
            const rolesObj = editionUsers.reduce((acc, u) => {
              const r = u.role || 'reporter';
              if (!acc[r]) acc[r] = [];
              acc[r].push(u);
              return acc;
            }, {});

            return (
              <div key={editionKey} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="px-5 py-3 bg-gray-100/80 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700">
                  <h2 className="text-sm font-bold text-gray-800 dark:text-white">{editionLabels[editionKey]}</h2>
                </div>
                
                {roleOrder.map(roleKey => {
                  const roleUsers = rolesObj[roleKey];
                  if (!roleUsers || roleUsers.length === 0) return null;

                  return (
                    <div key={roleKey} className="border-b border-gray-100 dark:border-slate-800/50 last:border-0">
                      <div className="px-5 py-2 bg-gray-50/50 dark:bg-slate-800/30">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${roleConfig[roleKey]?.class || 'bg-gray-200 text-gray-700'}`}>
                          {roleConfig[roleKey]?.label || roleKey} ({roleUsers.length})
                        </span>
                      </div>
                      <table className="w-full">
                        <tbody>
                        {roleUsers.map((u) => (
                          <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800 transition-colors last:border-0">
                            <td className="px-5 py-3 w-1/4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center justify-center">
                        {u.name.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-800 dark:text-slate-200 font-medium">{u.name}</span>
                    </div>
                  </td>
                            <td className="px-3 py-3 text-xs text-gray-500 dark:text-slate-400 w-1/4">{u.email}</td>
                            <td className="px-3 py-3 w-1/4">
                    {['editor', 'reporter'].includes(u.role) ? (
                      <div className="flex flex-wrap gap-1">
                        {u.departments?.slice(0, 2).map((d, i) => (
                          <span key={i} className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-1.5 py-0.5 rounded">{d}</span>
                        ))}
                        {u.departments?.length > 2 && <span className="text-[10px] text-gray-400 dark:text-slate-500">+{u.departments.length - 2}</span>}
                        {u.departments?.length === 0 && <span className="text-[10px] text-gray-400 dark:text-slate-500 italic">None</span>}
                      </div>
                    ) : (
                      <span className="text-[10px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded">All Access</span>
                    )}
                  </td>
                            <td className="px-5 py-3 w-[10%] text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => { setModalUser(u); setShowModal(true) }} className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                                  <Pencil size={14} />
                                </button>
                                <button onClick={() => handleDelete(u._id)} className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 rounded">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-400 dark:text-slate-500">কোনো ইউজার পাওয়া যায়নি</div>
        )}
      </div>

      {showModal && (
        <UserModal user={modalUser} onSave={handleSave} onClose={() => { setShowModal(false); setModalUser(null) }} categories={categories} printPages={printPages} />
      )}
    </div>
  )
}
