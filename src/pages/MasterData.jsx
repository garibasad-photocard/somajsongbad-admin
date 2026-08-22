import { useState, useEffect } from 'react'
import { useSettings } from '../context/SettingsContext'
import { useLanguage } from '../context/LanguageContext'
import {
  Shield, Menu, Tag, BookOpen, Hash, Radio,
  Layout, UserCheck,
  Plus, Trash2, Pencil, Check, X, ChevronDown, ChevronRight, Search, GripVertical, AlertCircle, Eye, EyeOff, FileText, Printer
} from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import api from '../services/api'
import { bangladeshLocations } from '../utils/locationData';

import { dateFnsLocalizer } from 'react-big-calendar'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = {
  'en-US': enUS,
}
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

// ─────────────────────────────────────────────
// Shared Components
// ─────────────────────────────────────────────
function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function AddRow({ fields = [], onAdd, buttonLabel }) {
  const { t } = useLanguage()
  const [values, setValues] = useState(fields.map(() => ''))
  const handleAdd = () => {
    if (!values[0].trim()) return
    onAdd(...values.map(v => v.trim()))
    setValues(fields.map(() => ''))
  }
  return (
    <div className="flex gap-2 mt-3">
      {fields.map((f, i) => (
        <input key={i} type="text" value={values[i]}
          onChange={(e) => { const v = [...values]; v[i] = e.target.value; setValues(v) }}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={f}
          className="flex-1 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900"
        />
      ))}
      <button onClick={handleAdd}
        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
        <Plus size={14} /> {buttonLabel || t.add}
      </button>
    </div>
  )
}

function Chip({ label, colorClass = 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700', onDelete }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${colorClass}`}>
      {label}
      {onDelete && (
        <button onClick={onDelete} className="opacity-60 hover:opacity-100 ml-0.5">
          <X size={10} />
        </button>
      )}
    </span>
  )
}

// ─────────────────────────────────────────────
// TAB 1 — রোল তৈরি
// ─────────────────────────────────────────────
const DEFAULT_ROLES = [
  { id: 1, name: 'সুপার অ্যাডমিন',      key: 'super_admin',     desc: 'সিস্টেমের সর্বোচ্চ কর্তৃপক্ষ',                 color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { id: 2, name: 'ম্যানেজিং এডিটর',  key: 'managing_editor', desc: 'নিউজরুম প্রধান — সমস্ত প্ল্যাটফর্ম নিয়ন্ত্রণ',   color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { id: 3, name: 'অ্যাডমিন (HR/IT)',    key: 'admin',           desc: 'ব্যবহারকারী, HR ও সেটিংস ম্যানেজ',             color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 4, name: 'চিফ এডিটর',         key: 'chief_editor',    desc: 'সম্পাদকীয় সিদ্ধান্ত ও কারেকশন',                color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 5, name: 'এডিটর',               key: 'editor',          desc: 'অ্যাসাইনমেন্ট ও অনুমোদন',                         color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { id: 6, name: 'রিপোর্টার',             key: 'reporter',        desc: 'নিউজ লেখা ও সাবমিট',                         color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
]

function RolesTab() {
  const { t } = useLanguage()
  const [roles, setRoles] = useState(() => {
    const stored = localStorage.getItem('cms_roles')
    return stored ? JSON.parse(stored) : DEFAULT_ROLES
  })
  const [adding, setAdding] = useState(false)
  const [newRole, setNewRole] = useState({ name: '', key: '', desc: '' })

  const handleAdd = () => {
    if (!newRole.name.trim() || !newRole.key.trim()) return
    const updated = [...roles, { id: Date.now(), ...newRole, color: 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700' }]
    setRoles(updated)
    localStorage.setItem('cms_roles', JSON.stringify(updated))
    setNewRole({ name: '', key: '', desc: '' })
    setAdding(false)
  }

  const handleDelete = (id) => {
    const updated = roles.filter(x => x.id !== id)
    setRoles(updated)
    localStorage.setItem('cms_roles', JSON.stringify(updated))
  }

  // Helper to map default role keys to their localized names if they match
  const getLocalizedRoleName = (r) => {
    if (r.key === 'super_admin') return t.superAdmin || r.name
    if (r.key === 'admin') return t.admin || r.name
    if (r.key === 'chief_editor') return t.chiefEditor || r.name
    if (r.key === 'editor') return t.editor || r.name
    if (r.key === 'reporter') return t.reporter || r.name
    return r.name
  }

  return (
    <div>
      <SectionHeader title={t.roles} subtitle={t.mdRolesDesc} />
      <div className="space-y-2">
        {roles.map((r) => (
          <div key={r.id} className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3">
            <Chip label={getLocalizedRoleName(r)} colorClass={r.color} />
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">{r.key}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{r.desc}</p>
            </div>
            <button onClick={() => handleDelete(r.id)}
              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input placeholder={t.namePlaceholder} value={newRole.name}
              onChange={e => setNewRole({ ...newRole, name: e.target.value })}
              className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Role key (english, e.g. sub_editor)" value={newRole.key}
              onChange={e => setNewRole({ ...newRole, key: e.target.value })}
              className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          </div>
          <input placeholder={t.namePlaceholder} value={newRole.desc}
            onChange={e => setNewRole({ ...newRole, desc: e.target.value })}
            className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">
              <Check size={13} /> {t.saveBtn}
            </button>
            <button onClick={() => setAdding(false)}
              className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors">
              {t.cancelBtn}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 border border-dashed border-blue-300 rounded-xl px-4 py-2.5 w-full hover:bg-blue-50 transition-colors">
          <Plus size={14} /> {t.addNewRole}
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB 2 — মেনু এক্সেস
// ─────────────────────────────────────────────
const MENU_GROUPS = [
  {
    id: 'common', label: 'সেন্ট্রাল ডেস্ক (Central Desk)', menus: [
      { key: 'dashboard', label: 'ড্যাশবোর্ড' },
      { key: 'workflowAll', label: 'অ্যাসাইনমেন্ট ক্রিয়েশন' },
      { key: 'storyPitches', label: 'স্টোরি পিচ বোর্ড' },
      { key: 'newsTipPipeline', label: 'উড়তি খবর' },
      { key: 'deadlineTracker', label: 'ডেডলাইন ট্র্যাকার' },
      { key: 'editorialCalendar', label: 'এডিটরিয়াল ক্যালেন্ডার' },
      { key: 'reports', label: 'রিপোর্ট' },
      { key: 'versions', label: 'ভার্সন হিস্ট্রি' },
      { key: 'media', label: 'মিডিয়া' },
      { key: 'mediaQc', label: 'মিডিয়া QC' }
    ]
  },
  {
    id: 'print', label: 'প্রিন্ট ডেস্ক (Print Desk)', menus: [
      { key: 'printDashboard', label: 'ড্যাশবোর্ড' },
      { key: 'printWfDashboard', label: 'ওয়ার্কফ্লো ড্যাশবোর্ড' },
      { key: 'printRundown', label: 'অটো-রানশিট' },
      { key: 'printPitches', label: 'পিচ এপ্রুভাল' },
      { key: 'departmentQueue', label: 'ডিপার্টমেন্ট কিউ' },
      { key: 'printApproval', label: 'অ্যাসাইনমেন্ট এপ্রুভাল' },
      { key: 'printWorkflow', label: 'অ্যাসাইনমেন্ট বোর্ড' },
      { key: 'printAds', label: 'বিজ্ঞাপন (Ads)' },
      { key: 'editorialDesk', label: 'এডিটরিয়াল ডেস্ক' },
      { key: 'proofreadingDesk', label: 'প্রুফ রিডিং ডেস্ক' },
      { key: 'pageDeskQueue', label: 'পেজ ডেস্ক কিউ' },
      { key: 'printArticles', label: 'আর্টিকেল লিস্ট' },
      { key: 'printHoldTray', label: 'হোল্ড ট্রে' },
      { key: 'printLayout', label: 'পেজ মেকআপ' },
      { key: 'printExport', label: 'PDF হাব' },
      { key: 'epaperManage', label: 'ই-পেপার' },
      { key: 'indesignHub', label: 'InDesign Hub' }
    ]
  },
  {
    id: 'online', label: 'অনলাইন ডেস্ক (Online Desk)', menus: [
      { key: 'onlineDashboard', label: 'ড্যাশবোর্ড' },
      { key: 'onlineTrending', label: 'ট্রেন্ডিং টপিক' },
      { key: 'onlinePitches', label: 'পিচ এপ্রুভাল' },
      { key: 'onlineApproval', label: 'অ্যাসাইনমেন্ট এপ্রুভাল' },
      { key: 'onlineWorkflow', label: 'অ্যাসাইনমেন্ট বোর্ড' },
      { key: 'articles', label: 'আর্টিকেল লিস্ট' },
      { key: 'rss', label: 'এআই নিউজ ফিড' },
      { key: 'breakingNews', label: 'ব্রেকিং নিউজ' },
      { key: 'liveNews', label: 'লাইভ নিউজ' },
      { key: 'homepageBuilder', label: 'হোমপেজ বিল্ডার' },
      { key: 'newsSort', label: 'নিউজ সাজান' },
      { key: 'adSettings', label: 'বিজ্ঞাপন সেটিংস' },
      { key: 'staticPages', label: 'স্ট্যাটিক পেজ' }
    ]
  },
  {
    id: 'multimedia', label: 'মাল্টিমিডিয়া (Multimedia)', menus: [
      { key: 'multimediaDashboard', label: 'ড্যাশবোর্ড' },
      { key: 'multimediaPitches', label: 'পিচ এপ্রুভাল' },
      { key: 'multimediaApproval', label: 'অ্যাসাইনমেন্ট এপ্রুভাল' },
      { key: 'multimediaWorkflow', label: 'অ্যাসাইনমেন্ট বোর্ড' },
      { key: 'videoUpload', label: 'ভিডিও আপলোড' },
      { key: 'videoList', label: 'ভিডিও লিস্ট' }
    ]
  },
  {
    id: 'hr', label: 'HR ও লিভ (HR & Leaves)', menus: [
      { key: 'hrMyDashboard', label: 'আমার ড্যাশবোর্ড' },
      { key: 'hrMyLeaves', label: 'লিভ আবেদন' },
      { key: 'hrLeaveApprovals', label: 'ছুটি অনুমোদন' },
      { key: 'hrAttendanceReport', label: 'উপস্থিতি রিপোর্ট' },
      { key: 'hrTopManagement', label: 'ডিপার্টমেন্ট বোর্ড' },
      { key: 'hrShifts', label: 'ডিউটি শিফট' },
      { key: 'hrShiftCalendar', label: 'শিফট ক্যালেন্ডার' },
      { key: 'hrCustomLeaves', label: 'কাস্টম ছুটি' },
      { key: 'hrSpecialDays', label: 'বিশেষ দিবস' },
      { key: 'hrMasterData', label: 'HR মাস্টার ডেটা' }
    ]
  },
  {
    id: 'system', label: 'সিস্টেম ও সেটিংস (System)', menus: [
      { key: 'masterData', label: 'মাস্টার ডেটা' },
      { key: 'users', label: 'ব্যবহারকারী' },
      { key: 'settings', label: 'সেটিংস' }
    ]
  }
]

const ALL_ROLES = [
  'super_admin', 'managing_editor', 'admin', 'executive_editor', 'chief_editor',
  'editor', 'chief_reporter', 'desk_editor', 'news_manager', 'sub_editor',
  'proof_reader', 'page_editor', 'page_makeup_artist', 'reporter', 'master_data'
]

function MenuAccessTab() {
  const { t } = useLanguage()
  const { menuAccess: ctxMenuAccess, setMenuAccess, refetchMenuAccess } = useSettings()
  
  const [access, setAccess] = useState(() => {
    let stored = null;
    try {
      stored = localStorage.getItem('cms_menu_access_v2')
    } catch(e) {}
    
    if (stored) {
       try {
         return JSON.parse(stored)
       } catch(e) {}
    }
      
    // Default fallback if no v2 exists
    const defaults = {}
    ALL_ROLES.forEach(r => defaults[r] = [])
    
    // Give super_admin everything initially if fresh
    MENU_GROUPS.forEach(g => {
      g.menus.forEach(m => defaults['super_admin'].push(m.key))
    })
    return defaults
  })
  
  // Re-sync when context menuAccess loads from DB
  useEffect(() => {
    if (ctxMenuAccess) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccess(ctxMenuAccess);
    }
  }, [ctxMenuAccess]);

  const [saved, setSaved] = useState(false)

  const toggle = (role, menuKey) => {
    const currentRoleAccess = access[role] || []
    const updated = currentRoleAccess.includes(menuKey) 
      ? currentRoleAccess.filter(k => k !== menuKey) 
      : [...currentRoleAccess, menuKey]
    setAccess({ ...access, [role]: updated })
  }

  const handleSave = async () => {
    const accessStr = JSON.stringify(access)
    // Save locally for immediate effect
    localStorage.setItem('cms_menu_access_v2', accessStr)
    
    // Save to database using correct {key, value} format
    try {
      await api.post('/settings', { key: 'cms_menu_access_v2', value: accessStr })
      // Update the global context so Sidebar refreshes immediately
      if (setMenuAccess) setMenuAccess(access)
      if (refetchMenuAccess) refetchMenuAccess()
    } catch (error) {
      console.error("Failed to save menu access to DB:", error)
    }
    
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const roleLabel = { 
    super_admin: 'সুপার অ্যাডমিন', 
    managing_editor: 'ম্যানেজিং এডিটর', 
    admin: 'অ্যাডমিন', 
    executive_editor: 'এক্সিকিউটিভ এডিটর',
    chief_editor: 'চিফ এডিটর', 
    editor: 'এডিটর', 
    chief_reporter: 'চিফ রিপোর্টার',
    desk_editor: 'ডেস্ক এডিটর',
    news_manager: 'নিউজ ম্যানেজার',
    sub_editor: 'সাব এডিটর',
    proof_reader: 'প্রুফ রিডার',
    page_editor: 'পেজ এডিটর',
    page_makeup_artist: 'পেজ মেকআপ আর্টিস্ট',
    reporter: 'রিপোর্টার',
    master_data: 'Master Data Entry'
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="ভার্সন-ভিত্তিক মেনু পারমিশন (RBAC)" subtitle="কোন ভার্সনের কোন গ্রুপ কী কী মেনু দেখতে পাবে তা নির্ধারণ করুন" />
      
      {MENU_GROUPS.map((group) => (
        <div key={group.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-blue-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">{group.label}</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-slate-400 sticky left-0 bg-gray-50/95 dark:bg-slate-800/95 z-10 w-40 border-r border-gray-200 dark:border-slate-700">রোল (গ্রুপ)</th>
                  {group.menus.map(m => (
                    <th key={m.key} className="px-3 py-3 text-[11px] font-semibold text-gray-600 dark:text-slate-400 text-center min-w-[100px]">
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {ALL_ROLES.map(role => (
                  <tr key={role} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-medium text-gray-800 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-gray-100 dark:border-slate-800">
                      {roleLabel[role] || role}
                    </td>
                    {group.menus.map(m => (
                      <td key={m.key} className="px-3 py-2.5 text-center">
                        <input 
                          type="checkbox" 
                          checked={access[role]?.includes(m.key) || false}
                          onChange={() => toggle(role, m.key)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer border-gray-300 dark:border-slate-600 dark:bg-slate-800" 
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      
      <div className="sticky bottom-0 py-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
        <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-2.5 rounded-lg transition-colors shadow-md">
          <Check size={16} /> {saved ? 'পারমিশন সেভ হয়েছে!' : 'পারমিশন সেভ করুন'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB 3+4 — ক্যাটাগরি ও সাব-ক্যাটাগরি
// ─────────────────────────────────────────────
function SortableCatRow({ cat, expanded, setExpanded, editing, setEditing, editName, setEditName, editColor, setEditColor, updateCategory, deleteCategory, toggleCategoryStatus, deleteSubCategory, addSubCategory, t }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: cat.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-slate-800">
        <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 dark:text-slate-400 active:cursor-grabbing p-0.5">
          <GripVertical size={15} />
        </div>
        <button onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
          className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:text-slate-300 transition-colors">
          {expanded === cat.id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        {editing === cat.id ? (
          <>
            <input value={editName} onChange={e => setEditName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { updateCategory(cat.id, editName, editColor); setEditing(null) } }}
              className="flex-1 border border-blue-300 rounded px-2 py-0.5 text-sm focus:outline-none" autoFocus />
            <input type="color" value={editColor || '#1e3a8a'} onChange={e => setEditColor(e.target.value)} className="w-8 h-8 rounded border-none cursor-pointer" />
          </>
        ) : (
          <span className="flex-1 text-sm font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: cat.color || '#1e3a8a' }}></span>
            {t[cat.name] || cat.name}
          </span>
        )}
        <span className="text-xs text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
          {cat.subCategories.length}{t.subCount}
        </span>
        {editing === cat.id ? (
          <>
            <button onClick={() => { updateCategory(cat.id, editName, editColor); setEditing(null) }}
              className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={13} /></button>
            <button onClick={() => setEditing(null)} className="p-1 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded"><X size={13} /></button>
          </>
        ) : (
          <>
            <button onClick={() => toggleCategoryStatus(cat.id)}
              className="p-1 text-gray-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title={cat.isActive === false ? 'Menu: Hidden' : 'Menu: Visible'}>
              {cat.isActive === false ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button onClick={() => { setEditing(cat.id); setEditName(cat.name); setEditColor(cat.color || '#1e3a8a'); }}
              className="p-1 text-gray-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={13} /></button>
            <button onClick={() => deleteCategory(cat.id)}
              className="p-1 text-gray-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={13} /></button>
          </>
        )}
      </div>
      {expanded === cat.id && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800">
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-2">{t.subCatCount}:</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {cat.subCategories.map((s, i) => (
              <Chip key={i} label={s} colorClass="bg-blue-50 text-blue-700 border-blue-200"
                onDelete={() => deleteSubCategory(cat.id, s)} />
            ))}
            {cat.subCategories.length === 0 && <p className="text-xs text-gray-400 dark:text-slate-500">{t.noSubCat}</p>}
          </div>
          <AddRow fields={[t.newSubCat]} onAdd={(name) => addSubCategory(cat.id, name)} buttonLabel={t.addBtn} />
        </div>
      )}
    </div>
  )
}

function CategoriesTab() {
  const { categories, addCategory, updateCategory, deleteCategory, toggleCategoryStatus, addSubCategory, deleteSubCategory, reorderCategoriesList } = useSettings()
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('#1e3a8a')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex(c => c.id === active.id)
      const newIndex = categories.findIndex(c => c.id === over.id)
      reorderCategoriesList(arrayMove(categories, oldIndex, newIndex))
    }
  }

  return (
    <div>
      <SectionHeader title={t.categories} subtitle={t.mdCatDesc} />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 mb-3">
            {categories.map((cat) => (
              <SortableCatRow
                key={cat.id}
                cat={cat}
                expanded={expanded}
                setExpanded={setExpanded}
                editing={editing}
                setEditing={setEditing}
                editName={editName}
                setEditName={setEditName}
                editColor={editColor}
                setEditColor={setEditColor}
                updateCategory={updateCategory}
                deleteCategory={deleteCategory}
                toggleCategoryStatus={toggleCategoryStatus}
                deleteSubCategory={deleteSubCategory}
                addSubCategory={addSubCategory}
                t={t}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <AddRow fields={[t.newCatName]} onAdd={addCategory} buttonLabel={t.addCat} />
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB 5 — ট্যাগ তৈরি
// ─────────────────────────────────────────────
const DEFAULT_TAGS = ['নির্বাচন', 'অর্থনীতি', 'বাজেট', 'ক্রিকেট', 'আবহাওয়া', 'শেয়ারবাজার', 'সংসদ', 'কূটনীতি', 'দুর্নীতি', 'শিক্ষা', 'স্বাস্থ্য', 'পরিবেশ']

function TagsTab() {
  const { t } = useLanguage()
  const [tags, setTags] = useState(() => {
    const stored = localStorage.getItem('cms_tags')
    return stored ? JSON.parse(stored) : DEFAULT_TAGS
  })
  const [search, setSearch] = useState('')

  const filtered = tags.filter(tag => tag.toLowerCase().includes(search.toLowerCase()))

  const handleAddTag = (name) => {
    if (!tags.includes(name)) {
      const updated = [...tags, name]
      setTags(updated)
      localStorage.setItem('cms_tags', JSON.stringify(updated))
    }
  }

  const handleDeleteTag = (tag) => {
    const updated = tags.filter(x => x !== tag)
    setTags(updated)
    localStorage.setItem('cms_tags', JSON.stringify(updated))
  }

  return (
    <div>
      <SectionHeader title={t.tags} subtitle={t.mdTagDesc} />
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t.searchTags} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {filtered.map((tag, i) => (
          <Chip key={i} label={`# ${tag}`} colorClass="bg-teal-50 text-teal-700 border-teal-200"
            onDelete={() => handleDeleteTag(tag)} />
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-400 dark:text-slate-500">{t.noTags}</p>}
      </div>
      <AddRow fields={[t.newTag]} onAdd={handleAddTag} buttonLabel={t.addTag} />
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB 5B — অ্যাসাইনমেন্টের ধরন তৈরি (Assignment Types)
// ─────────────────────────────────────────────
const DEFAULT_ASSIGNMENT_TYPES = ['রিপোর্টিং', 'ফিচার', 'স্পেশাল স্টোরি', 'ফলোআপ', 'ইন্টারভিউ', 'ভিডিও স্টোরি', 'ইনভেস্টিগেশন']

function AssignmentTypesTab() {
  const [types, setTypes] = useState(() => {
    const stored = localStorage.getItem('cms_assignment_types')
    return stored ? JSON.parse(stored) : DEFAULT_ASSIGNMENT_TYPES
  })
  const [search, setSearch] = useState('')

  const filtered = types.filter(type => type.toLowerCase().includes(search.toLowerCase()))

  const handleAddType = (name) => {
    if (!types.includes(name)) {
      const updated = [...types, name]
      setTypes(updated)
      localStorage.setItem('cms_assignment_types', JSON.stringify(updated))
    }
  }

  const handleDeleteType = (type) => {
    const updated = types.filter(x => x !== type)
    setTypes(updated)
    localStorage.setItem('cms_assignment_types', JSON.stringify(updated))
  }

  return (
    <div>
      <SectionHeader title="অ্যাসাইনমেন্টের ধরন (Assignment Types)" subtitle="অ্যাসাইনমেন্ট তৈরি করার সময় ক্যাটাগরি অনুযায়ী ধরন নির্বাচন করতে নিজের ইচ্ছামতো ধরন যোগ বা ডিলিট করুন।" />
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="ধরন খুঁজুন..." className="w-full border border-gray-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900" />
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {filtered.map((type, i) => (
          <Chip key={i} label={type} colorClass="bg-blue-50 text-blue-700 border-blue-200 font-medium"
            onDelete={() => handleDeleteType(type)} />
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-400 dark:text-slate-500">কোনো ধরন পাওয়া যায়নি।</p>}
      </div>
      <AddRow fields={['নতুন অ্যাসাইনমেন্টের ধরন']} onAdd={handleAddType} buttonLabel="যোগ করুন" />
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB 6 — সোর্স তৈরি
// ─────────────────────────────────────────────
function SourcesTab() {
  const { sources, addSource, deleteSource } = useSettings()
  const { t } = useLanguage()
  return (
    <div>
      <SectionHeader title={t.sources} subtitle={t.mdSourceDesc} />
      <div className="flex flex-wrap gap-2 mb-3">
        {sources.map((s) => (
          <Chip key={s.id} label={s.name} colorClass="bg-indigo-50 text-indigo-700 border-indigo-200"
            onDelete={() => deleteSource(s.id)} />
        ))}
      </div>
      <AddRow fields={[t.newSource]} onAdd={addSource} buttonLabel={t.addSource} />
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB 7 — পেজ তৈরি
// ─────────────────────────────────────────────
function SortablePageItem({ page, updatePosition, deletePosition }) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(page.name)
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: page.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  
  const isActive = page.isActive !== false;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 justify-between bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 group">
      <div className="flex items-center gap-2 flex-1">
        <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 dark:text-slate-400 active:cursor-grabbing p-0.5">
          <GripVertical size={14} />
        </div>
        <Layout size={14} className={isActive ? "text-violet-500" : "text-gray-400 dark:text-slate-500"} />
        {editing ? (
          <input 
            autoFocus
            type="text" 
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => { updatePosition(page.id, editName, isActive); setEditing(false) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { updatePosition(page.id, editName, isActive); setEditing(false) } }}
            className="text-sm border-b border-violet-500 focus:outline-none w-full bg-transparent px-1"
          />
        ) : (
          <span className={`text-sm ${isActive ? 'text-gray-800 dark:text-slate-200' : 'text-gray-400 dark:text-slate-500 line-through'} cursor-pointer`} onDoubleClick={() => setEditing(true)}>
            {page.name}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button 
          onClick={() => updatePosition(page.id, page.name, !isActive)}
          className="p-1 text-gray-400 dark:text-slate-500 hover:text-blue-500 rounded"
          title={isActive ? "Hide Position" : "Show Position"}
        >
          {isActive ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
        <button 
          onClick={() => setEditing(true)}
          className="p-1 text-gray-400 dark:text-slate-500 hover:text-indigo-500 rounded"
        >
          <Pencil size={13} />
        </button>
        <button onClick={() => deletePosition(page.id)}
          className="p-1 text-gray-400 dark:text-slate-500 hover:text-red-500 rounded">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

function PagesTab() {
  const { positions, addPosition, updatePosition, deletePosition, reorderPositionsList } = useSettings()
  const { t } = useLanguage()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = positions.findIndex(p => p.id === active.id)
      const newIndex = positions.findIndex(p => p.id === over.id)
      reorderPositionsList(arrayMove(positions, oldIndex, newIndex))
    }
  }

  return (
    <div>
      <SectionHeader title="হোম পেজ পজিশন" subtitle="নিউজ কোথায় কোথায় দেখানো হবে তার লিস্ট (ড্র্যাগ করে সাজানো যায়)" />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={positions.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 mb-3">
            {positions.map((p) => (
              <SortablePageItem key={p.id} page={p} updatePosition={updatePosition} deletePosition={deletePosition} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <AddRow fields={['নতুন পজিশন']} onAdd={addPosition} buttonLabel="যোগ করুন" />
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB 8 — ডিউটি শিফট
// ─────────────────────────────────────────────
// TAB 16 — প্রিন্ট অ্যাড ডেটা (Print Ad Data)
// ─────────────────────────────────────────────
function PrintAdDataTab() {
  const {
    adClients, addAdClient, deleteAdClient,
    adAgencies, addAdAgency, deleteAdAgency,
    adTypes, addAdType, deleteAdType,
    adColors, addAdColor, deleteAdColor,
    adPositions, addAdPosition, deleteAdPosition
  } = useSettings()

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800">
        <SectionHeader title="ক্লায়েন্ট / কোম্পানি (Clients)" subtitle="বিজ্ঞাপনদাতাদের তালিকা" />
        <div className="flex flex-wrap gap-2 mb-3">
          {adClients?.map((client, idx) => (
            <Chip key={idx} label={client} colorClass="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" onDelete={() => deleteAdClient(client)} />
          ))}
          {(!adClients || adClients.length === 0) && <p className="text-xs text-gray-400">কোনো ক্লায়েন্ট নেই</p>}
        </div>
        <AddRow fields={['নতুন ক্লায়েন্টের নাম']} onAdd={addAdClient} buttonLabel="যুক্ত করুন" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800">
        <SectionHeader title="এজেন্সি (Agencies)" subtitle="বিজ্ঞাপন এজেন্সির তালিকা" />
        <div className="flex flex-wrap gap-2 mb-3">
          {adAgencies?.map((agency, idx) => (
            <Chip key={idx} label={agency} colorClass="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" onDelete={() => deleteAdAgency(agency)} />
          ))}
          {(!adAgencies || adAgencies.length === 0) && <p className="text-xs text-gray-400">কোনো এজেন্সি নেই</p>}
        </div>
        <AddRow fields={['নতুন এজেন্সির নাম']} onAdd={addAdAgency} buttonLabel="যুক্ত করুন" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800">
        <SectionHeader title="অ্যাড টাইপ (Ad Types)" subtitle="বিজ্ঞাপনের ধরন (যেমন: Display Ad, Classified Ad)" />
        <div className="flex flex-wrap gap-2 mb-3">
          {adTypes?.map((type, idx) => (
            <Chip key={idx} label={type} colorClass="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800" onDelete={() => deleteAdType(type)} />
          ))}
          {(!adTypes || adTypes.length === 0) && <p className="text-xs text-gray-400">কোনো টাইপ নেই</p>}
        </div>
        <AddRow fields={['নতুন টাইপ']} onAdd={addAdType} buttonLabel="যুক্ত করুন" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800">
        <SectionHeader title="কালার (Colors)" subtitle="বিজ্ঞাপনের কালার (যেমন: Colour, Black & White)" />
        <div className="flex flex-wrap gap-2 mb-3">
          {adColors?.map((color, idx) => (
            <Chip key={idx} label={color} colorClass="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" onDelete={() => deleteAdColor(color)} />
          ))}
          {(!adColors || adColors.length === 0) && <p className="text-xs text-gray-400">কোনো কালার নেই</p>}
        </div>
        <AddRow fields={['নতুন কালার']} onAdd={addAdColor} buttonLabel="যুক্ত করুন" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800">
        <SectionHeader title="পজিশন (Positions)" subtitle="বিজ্ঞাপন কোথায় বসবে (যেমন: Front Page, Bottom)" />
        <div className="flex flex-wrap gap-2 mb-3">
          {adPositions?.map((pos, idx) => (
            <Chip key={idx} label={pos} colorClass="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800" onDelete={() => deleteAdPosition(pos)} />
          ))}
          {(!adPositions || adPositions.length === 0) && <p className="text-xs text-gray-400">কোনো পজিশন নেই</p>}
        </div>
        <AddRow fields={['নতুন পজিশন']} onAdd={addAdPosition} buttonLabel="যুক্ত করুন" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB বায়লাইন (সাংবাদিক)
// ─────────────────────────────────────────────
const DESIGNATION_COLORS = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
]

function BylineTab() {
  const { journalists, addJournalist, updateJournalist, deleteJournalist } = useSettings()
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', designation: '', email: '' })
  const [adding, setAdding] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', designation: '', email: '' })

  const filtered = journalists.filter(j =>
    j.name.toLowerCase().includes(search.toLowerCase()) ||
    (j.designation || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleEdit = (j) => {
    setEditing(j.id)
    setEditForm({ name: j.name, designation: j.designation || '', email: j.email || '' })
  }

  const handleSaveEdit = (id) => {
    if (editForm.name.trim()) {
      updateJournalist(id, editForm.name.trim(), editForm.designation.trim())
    }
    setEditing(null)
  }

  const handleAdd = () => {
    if (!addForm.name.trim()) return
    addJournalist(addForm.name.trim(), addForm.designation.trim())
    setAddForm({ name: '', designation: '', email: '' })
    setAdding(false)
  }

  return (
    <div>
      <SectionHeader title={t.byline} subtitle={t.mdBylineDesc} />

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t.searchJournalist}
          className="w-full border border-gray-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* List */}
      <div className="space-y-2 mb-3">
        {filtered.map((j, idx) => (
          <div key={j.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3">
            {editing === j.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder={t.namePlaceholder} autoFocus
                    className="border border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input value={editForm.designation} onChange={e => setEditForm({ ...editForm, designation: e.target.value })}
                    placeholder={t.designationPlaceholder}
                    className="border border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder={t.emailOptional}
                  className="w-full border border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-2">
                  <button onClick={() => handleSaveEdit(j.id)}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg">
                    <Check size={12} /> {t.saveBtn}
                  </button>
                  <button onClick={() => setEditing(null)}
                    className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800">{t.cancelBtn}</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: `hsl(${(idx * 47) % 360}, 60%, 90%)`, color: `hsl(${(idx * 47) % 360}, 50%, 35%)` }}>
                  {j.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{j.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {j.designation && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${DESIGNATION_COLORS[idx % DESIGNATION_COLORS.length]}`}>
                        {j.designation}
                      </span>
                    )}
                    {j.email && <span className="text-xs text-gray-400 dark:text-slate-500">{j.email}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(j)}
                    className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => deleteJournalist(j.id)}
                    className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-6">{t.noJournalist}</p>
        )}
      </div>

      {/* Add Form */}
      {adding ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input placeholder={t.journalistNameReq} value={addForm.name}
              onChange={e => setAddForm({ ...addForm, name: e.target.value })} autoFocus
              className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder={t.desigExample} value={addForm.designation}
              onChange={e => setAddForm({ ...addForm, designation: e.target.value })}
              className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <input placeholder={t.emailOptional} value={addForm.email}
            onChange={e => setAddForm({ ...addForm, email: e.target.value })}
            className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
          <Plus size={14} /> {t.addJournalistBtn}
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB 11 — হোমপেজ লেআউট
// ─────────────────────────────────────────────
const LAYOUT_TEMPLATES = [
  { id: 'grid-3', name: 'Grid-3 (৩ কলাম গ্রিড)' },
  { id: 'grid-4', name: 'Grid-4 (৪ কলাম গ্রিড)' },
  { id: 'list-sidebar', name: 'List with Sidebar (লিস্ট এবং সাইডবার)' },
  { id: 'hero', name: 'Hero Large (বড় ছবিসহ)' },
  { id: 'carousel', name: 'Carousel (স্লাইডার)' },
  { id: 'video', name: 'Video Player (ভিডিও প্লেয়ার)' },
  { id: 'ad', name: 'Advertisement (বিজ্ঞাপন)' },
]

function HomepageLayoutTab() {
  const { homepageLayout, updateHomepageLayout, categories, adSettings } = useSettings()
  const { t } = useLanguage()
  const [layout, setLayout] = useState(homepageLayout || [])
  const [adding, setAdding] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [newTemplate, setNewTemplate] = useState('grid-3')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLayout(homepageLayout || [])
  }, [homepageLayout])

  const handleAdd = () => {
    if (!newCat) return
    const updated = [...layout, { id: Date.now(), category: newCat, template: newTemplate }]
    setLayout(updated)
    updateHomepageLayout(updated)
    setNewCat('')
    setAdding(false)
  }

  const handleDelete = (id) => {
    const updated = layout.filter(l => l.id !== id)
    setLayout(updated)
    updateHomepageLayout(updated)
  }

  const handleTemplateChange = (id, newTemp) => {
    const updated = layout.map(l => l.id === id ? { ...l, template: newTemp, category: newTemp === 'ad' ? (adSettings?.[0]?.title || '') : l.category } : l)
    setLayout(updated)
    updateHomepageLayout(updated)
  }

  const handleCategoryChange = (id, newCatValue) => {
    const updated = layout.map(l => l.id === id ? { ...l, category: newCatValue } : l)
    setLayout(updated)
    updateHomepageLayout(updated)
  }

  const handleToggleActive = (id) => {
    const updated = layout.map(l => l.id === id ? { ...l, isActive: l.isActive === false ? true : false } : l)
    setLayout(updated)
    updateHomepageLayout(updated)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = layout.findIndex(l => l.id === active.id)
      const newIndex = layout.findIndex(l => l.id === over.id)
      const updated = arrayMove(layout, oldIndex, newIndex)
      setLayout(updated)
      updateHomepageLayout(updated)
    }
  }

  return (
    <div>
      <SectionHeader title="হোমপেজ লেআউট" subtitle="ওয়েবসাইটের হোমপেজে কোন ক্যাটাগরি বা বিজ্ঞাপন কোন ডিজাইনে দেখাবে তা নির্ধারণ করুন।" />
      
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={layout.map(l => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 mb-4">
            {layout.map((item) => (
              <SortableLayoutItem 
                key={item.id} 
                item={item} 
                categories={categories}
                adSettings={adSettings}
                handleDelete={handleDelete}
                handleTemplateChange={handleTemplateChange}
                handleCategoryChange={handleCategoryChange}
                handleToggleActive={handleToggleActive}
              />
            ))}
            {layout.length === 0 && <p className="text-sm text-gray-400 dark:text-slate-500">কোনো লেআউট যোগ করা হয়নি।</p>}
          </div>
        </SortableContext>
      </DndContext>

      {adding ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <select value={newTemplate} onChange={e => setNewTemplate(e.target.value)}
              className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {LAYOUT_TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {newTemplate === 'ad' ? (
              <select value={newCat} onChange={e => setNewCat(e.target.value)}
                className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- বিজ্ঞাপন নির্বাচন করুন --</option>
                {adSettings?.map(a => (
                  <option key={a.id} value={a.title}>{a.title}</option>
                ))}
              </select>
            ) : (
              <select value={newCat} onChange={e => setNewCat(e.target.value)}
                className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- ক্যাটাগরি নির্বাচন করুন --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{t[c.name] || c.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg">
              <Check size={13} /> যোগ করুন
            </button>
            <button onClick={() => setAdding(false)}
              className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800">বাতিল</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded-xl px-4 py-2.5 w-full hover:bg-blue-50 transition-colors">
          <Plus size={14} /> নতুন লেআউট যোগ করুন
        </button>
      )}
    </div>
  )
}

function SortableLayoutItem({ item, categories, adSettings, handleDelete, handleTemplateChange, handleCategoryChange, handleToggleActive }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  
  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 group ${item.isActive === false ? 'opacity-50' : ''}`}>
      <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 dark:text-slate-400 p-1">
        <GripVertical size={15} />
      </div>
      <div className="flex-1">
        <select 
          value={item.template} 
          onChange={e => handleTemplateChange(item.id, e.target.value)}
          className="w-full text-sm rounded-lg px-2 py-1.5 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300 bg-gray-50 dark:bg-slate-800 cursor-pointer"
        >
          {LAYOUT_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div className="flex-1">
        {item.template === 'ad' ? (
          <select 
            value={item.category} 
            onChange={e => handleCategoryChange(item.id, e.target.value)}
            className="w-full text-sm rounded-lg px-2 py-1.5 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300 bg-gray-50 dark:bg-slate-800 cursor-pointer"
          >
            {adSettings?.map(a => <option key={a.id} value={a.title}>{a.title}</option>)}
          </select>
        ) : (
          <select 
            value={item.category} 
            onChange={e => handleCategoryChange(item.id, e.target.value)}
            className="w-full text-sm rounded-lg px-2 py-1.5 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300 bg-gray-50 dark:bg-slate-800 cursor-pointer"
          >
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        )}
      </div>
      <button onClick={() => handleToggleActive(item.id)}
        className={`p-1.5 ${item.isActive === false ? 'text-gray-400 dark:text-slate-500' : 'text-blue-500'} hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded transition-all`} title={item.isActive === false ? 'Show' : 'Hide'}>
        {item.isActive === false ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
      <button onClick={() => handleDelete(item.id)}
        className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB 12 — ব্রেকিং নিউজ
// ─────────────────────────────────────────────
function BreakingNewsTab() {
  const { breakingNews, updateBreakingNews, breakingNewsEnabled, toggleBreakingNews } = useSettings()
  const { t } = useLanguage()
  const [news, setNews] = useState(breakingNews || [])
  const [editing, setEditing] = useState(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNews(breakingNews || [])
  }, [breakingNews])

  const handleAdd = (text) => {
    if (!text) return
    const updated = [...news, text]
    setNews(updated)
    updateBreakingNews(updated)
  }

  const handleDelete = (index) => {
    const updated = news.filter((_, i) => i !== index)
    setNews(updated)
    updateBreakingNews(updated)
  }

  const handleUpdate = (index) => {
    if (!editText) return
    const updated = [...news]
    updated[index] = editText
    setNews(updated)
    updateBreakingNews(updated)
    setEditing(null)
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <SectionHeader title="ব্রেকিং নিউজ" subtitle="হোমপেজের উপরে স্ক্রল করা ব্রেকিং নিউজগুলো ম্যানেজ করুন।" />
        <button
          onClick={() => toggleBreakingNews(!breakingNewsEnabled)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            breakingNewsEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:bg-slate-700'
          }`}
        >
          {breakingNewsEnabled ? '● চালু আছে (ON)' : '○ বন্ধ আছে (OFF)'}
        </button>
      </div>
      
      <div className="space-y-2 mb-4">
        {news.map((item, i) => (
          <div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 group">
            <div className="text-gray-300 p-1"><AlertCircle size={15} className="text-red-500" /></div>
            
            {editing === i ? (
              <input value={editText} onChange={e => setEditText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleUpdate(i) }}
                className="flex-1 border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none" autoFocus />
            ) : (
              <span className="flex-1 text-sm text-gray-800 dark:text-slate-200">{item}</span>
            )}
            
            {editing === i ? (
              <>
                <button onClick={() => handleUpdate(i)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={13} /></button>
                <button onClick={() => setEditing(null)} className="p-1 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded"><X size={13} /></button>
              </>
            ) : (
              <>
                <button onClick={() => { setEditing(i); setEditText(item) }}
                  className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all rounded">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(i)}
                  className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded">
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ))}
        {news.length === 0 && <p className="text-sm text-gray-400 dark:text-slate-500">কোনো ব্রেকিং নিউজ নেই।</p>}
      </div>

      <AddRow fields={['নতুন ব্রেকিং নিউজ লিখুন...']} onAdd={handleAdd} buttonLabel="যোগ করুন" />
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB 13 — বিজ্ঞাপন সেটিংস
// ─────────────────────────────────────────────
const AD_SPOTS = [
  { id: 'Homepage Top Ad', name: 'Homepage Top Ad (লিড নিউজের ডানপাশে)' },
  { id: 'Sidebar Bottom Ad', name: 'Sidebar Bottom Ad (মূল সাইডবার)' },
  { id: 'World Sidebar Ad', name: 'World Sidebar Ad (বিশ্ব সেকশন সাইডবার)' },
  { id: 'Middle Strip Ad', name: 'Middle Strip Ad (লিড নিউজের নিচে)' },
  { id: 'বাংলাদেশ Ad', name: 'বাংলাদেশ সেকশন অ্যাড' },
  { id: 'রাজনীতি Ad', name: 'রাজনীতি সেকশন অ্যাড' },
  { id: 'খেলা Ad', name: 'খেলা সেকশন অ্যাড' },
  { id: 'বিনোদন Ad', name: 'বিনোদন সেকশন অ্যাড' },
  { id: 'ভিডিও Ad', name: 'ভিডিও সেকশন অ্যাড' },
  { id: 'জীবনযাপন Ad', name: 'জীবনযাপন সেকশন অ্যাড' },
  { id: 'বাণিজ্য Ad', name: 'বাণিজ্য সেকশন অ্যাড' }
]

function AdSettingsTab() {
  const { adSettings, updateAdSettings } = useSettings()
  const [ads, setAds] = useState(adSettings || [])
  const [editing, setEditing] = useState(null)

  // Edit states
  const [editTitle, setEditTitle] = useState('')
  const [editType, setEditType] = useState('image')
  const [editCode, setEditCode] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [editLink, setEditLink] = useState('')
  const [editWidth, setEditWidth] = useState('100%')
  const [editHeight, setEditHeight] = useState('auto')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAds(adSettings || [])
  }, [adSettings])

  const handleAdd = () => {
    const updated = [...ads, { id: Date.now(), title: AD_SPOTS[0].id, type: 'image', code: '', imageUrl: '', link: '', width: '100%', height: 'auto', startDate: '', endDate: '', isActive: true }]
    setAds(updated)
    updateAdSettings(updated)
    setEditing(updated.length - 1)
    setEditTitle(AD_SPOTS[0].id)
    setEditType('image')
    setEditCode('')
    setEditImageUrl('')
    setEditLink('')
    setEditWidth('100%')
    setEditHeight('auto')
    setEditStartDate('')
    setEditEndDate('')
    setEditIsActive(true)
  }

  const handleDelete = (id) => {
    const updated = ads.filter((a) => a.id !== id)
    setAds(updated)
    updateAdSettings(updated)
  }

  const handleUpdate = (id) => {
    const updated = ads.map(a => a.id === id ? { 
      ...a, title: editTitle, type: editType, code: editCode, imageUrl: editImageUrl, link: editLink, width: editWidth, height: editHeight, startDate: editStartDate, endDate: editEndDate, isActive: editIsActive 
    } : a)
    setAds(updated)
    updateAdSettings(updated)
    setEditing(null)
  }

  const handleEditClick = (i, ad) => {
    setEditing(i)
    setEditTitle(ad.title || AD_SPOTS[0].id)
    setEditType(ad.type || 'image')
    setEditCode(ad.code || '')
    setEditImageUrl(ad.imageUrl || '')
    setEditLink(ad.link || '')
    setEditWidth(ad.width || '100%')
    setEditHeight(ad.height || 'auto')
    setEditStartDate(ad.startDate || '')
    setEditEndDate(ad.endDate || '')
    setEditIsActive(ad.isActive !== undefined ? ad.isActive : true)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setEditImageUrl(res.data.media.url)
    } catch (err) {
      console.error(err)
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const getImageUrl = (path) => path?.startsWith('http') ? path : `http://localhost:5001${path}`

  return (
    <div>
      <SectionHeader title="বিজ্ঞাপন সেটিংস (Ad Settings)" subtitle="হোমপেজ লেআউটে দেখানোর জন্য বিজ্ঞাপনের ছবি বা কোড সেভ করুন।" />
      
      <div className="space-y-4 mb-4">
        {ads.map((ad, i) => (
          <div key={ad.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 group">
            {editing === i ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">অ্যাড স্পট (লোকেশন)</label>
                    <select 
                      value={editTitle} 
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full border border-blue-300 rounded px-3 py-2 text-sm focus:outline-none bg-white dark:bg-slate-900">
                      {AD_SPOTS.map(spot => (
                        <option key={spot.id} value={spot.id}>{spot.name}</option>
                      ))}
                      {!AD_SPOTS.find(s => s.id === editTitle) && (
                        <option value={editTitle}>{editTitle} (Custom)</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">অ্যাড টাইপ</label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-1 text-sm cursor-pointer">
                        <input type="radio" name="type" checked={editType === 'image'} onChange={() => setEditType('image')} /> ইমেজ (Image)
                      </label>
                      <label className="flex items-center gap-1 text-sm cursor-pointer">
                        <input type="radio" name="type" checked={editType === 'code'} onChange={() => setEditType('code')} /> কোড (Google Ad)
                      </label>
                    </div>
                  </div>
                </div>

                {editType === 'image' && (
                  <div className="space-y-3 p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">ইমেজ আপলোড (.png, .jpg, .gif, .svg)</label>
                      <div className="flex items-center gap-3">
                        <label className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-sm px-3 py-1.5 rounded cursor-pointer transition-colors">
                          {uploading ? 'আপলোড হচ্ছে...' : 'ছবি নির্বাচন করুন'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                        </label>
                        {editImageUrl && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-green-600 font-medium">✓ আপলোড সম্পন্ন</span>
                            <img src={getImageUrl(editImageUrl)} alt="Preview" className="h-8 w-auto object-cover rounded border" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">লিংক (ক্লিক করলে কোথায় যাবে)</label>
                      <input value={editLink} onChange={e => setEditLink(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">প্রস্থ (Width)</label>
                        <input value={editWidth} onChange={e => setEditWidth(e.target.value)}
                          placeholder="e.g. 100% or 300px"
                          className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">উচ্চতা (Height)</label>
                        <input value={editHeight} onChange={e => setEditHeight(e.target.value)}
                          placeholder="e.g. auto or 250px"
                          className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:outline-none" />
                      </div>
                    </div>
                  </div>
                )}

                {editType === 'code' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">গুগল অ্যাড কোড (HTML/JS)</label>
                    <textarea value={editCode} onChange={e => setEditCode(e.target.value)}
                      placeholder="এখানে Google Ad Manager এর কোড বসান" rows={5}
                      className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:outline-none font-mono text-gray-600 dark:text-slate-400" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">অ্যাড শুরু হওয়ার সময় (Start Date/Time)</label>
                    <input type="datetime-local" value={editStartDate} onChange={e => setEditStartDate(e.target.value)}
                      className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">অ্যাড শেষ হওয়ার সময় (End Date/Time)</label>
                    <input type="datetime-local" value={editEndDate} onChange={e => setEditEndDate(e.target.value)}
                      className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:outline-none" />
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <input type="checkbox" id={`isActive-${ad.id}`} checked={editIsActive} onChange={e => setEditIsActive(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                  <label htmlFor={`isActive-${ad.id}`} className="text-sm font-medium text-gray-700 dark:text-slate-300 cursor-pointer">অ্যাডটি চালু রাখুন (Active)</label>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                  <button onClick={() => handleUpdate(ad.id)} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-medium transition-colors">সেভ করুন</button>
                  <button onClick={() => setEditing(null)} className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 px-5 py-2 rounded text-sm transition-colors">বাতিল</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-800 dark:text-slate-200">{AD_SPOTS.find(s => s.id === ad.title)?.name || ad.title}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ad.type === 'code' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {ad.type === 'code' ? 'Google Ad' : 'Image Ad'}
                    </span>
                    {ad.isActive === false ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-600 font-bold border border-red-200">OFF</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-green-100 text-green-600 font-bold border border-green-200">ON</span>
                    )}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleEditClick(i, ad)}
                      className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-blue-600 rounded"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(ad.id)}
                      className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-500 rounded"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded p-3 text-sm text-gray-600 dark:text-slate-400">
                  {ad.type === 'image' ? (
                    <div className="flex items-center gap-3">
                      {ad.imageUrl ? (
                        <img src={getImageUrl(ad.imageUrl)} alt="Ad" className="h-10 w-auto object-contain bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded" />
                      ) : (
                        <div className="h-10 w-20 bg-gray-200 dark:bg-slate-700 rounded flex items-center justify-center text-[10px] text-gray-400 dark:text-slate-500">No Image</div>
                      )}
                      <div>
                        <p><span className="font-medium text-gray-500 dark:text-slate-400">লিংক:</span> {ad.link || 'দেওয়া হয়নি'}</p>
                        <p className="text-xs mt-0.5 text-gray-400 dark:text-slate-500">সাইজ: {ad.width} x {ad.height}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap text-gray-500 dark:text-slate-400">
                      {ad.code || 'কোনো কোড বসানো হয়নি'}
                    </div>
                  )}
                  {(ad.startDate || ad.endDate) && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400 flex gap-4">
                      {ad.startDate && <span>শুরু: {new Date(ad.startDate).toLocaleString('bn-BD')}</span>}
                      {ad.endDate && <span>শেষ: {new Date(ad.endDate).toLocaleString('bn-BD')}</span>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {ads.length === 0 && <p className="text-sm text-gray-400 dark:text-slate-500">কোনো বিজ্ঞাপন নেই।</p>}
      </div>

      <button onClick={handleAdd}
        className="flex items-center justify-center gap-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded-xl px-4 py-3 w-full hover:bg-blue-50 transition-colors font-medium">
        <Plus size={16} /> নতুন বিজ্ঞাপন যোগ করুন
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN — Master Data Page
// ─────────────────────────────────────────────
// TAB 13 — RSS Feeds
// ─────────────────────────────────────────────
function RssFeedsTab() {
  const { rssFeeds, addRssFeed, deleteRssFeed, rssKeywords, updateRssKeywords } = useSettings()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [keyword, setKeyword] = useState('')

  const handleAdd = () => {
    if (!name.trim() || !url.trim()) return
    addRssFeed(name.trim(), url.trim())
    setName(''); setUrl('')
  }

  return (
    <div>
      <SectionHeader title="RSS ফিড সোর্স" subtitle="যেসব সাইট থেকে অটোমেটিক নিউজ আসবে তাদের তালিকা" />
      <div className="space-y-2 mb-4">
        {rssFeeds?.map((feed) => (
          <div key={feed.id} className="flex justify-between items-center bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-3 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{feed.name}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{feed.url}</p>
            </div>
            <button onClick={() => deleteRssFeed(feed.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {(!rssFeeds || rssFeeds.length === 0) && <p className="text-sm text-gray-500 dark:text-slate-400">কোনো ফিড সোর্স নেই।</p>}
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 border border-gray-200 dark:border-slate-700 rounded-xl mt-6 mb-8">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-3 uppercase">নতুন ফিড যুক্ত করুন</h4>
        <div className="flex gap-3">
          <input type="text" placeholder="ফিডের নাম (যেমন: যুগান্তর)" value={name} onChange={e => setName(e.target.value)} className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          <input type="text" placeholder="RSS লিংক (URL)" value={url} onChange={e => setUrl(e.target.value)} className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          <button onClick={handleAdd} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap flex items-center gap-2"><Plus size={14} /> যুক্ত করুন</button>
        </div>
      </div>

      <SectionHeader title="RSS কিওয়ার্ড ফিল্টার" subtitle="যে ধরনের নিউজ এই ফিডে আসবে (যেমন: সড়ক দুর্ঘটনা, ছিনতাই)। ফাঁকা থাকলে সব নিউজ আসবে।" />
      <div className="bg-white dark:bg-slate-900 p-4 border border-gray-200 dark:border-slate-700 rounded-xl mb-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {rssKeywords?.map((kw, i) => (
            <Chip key={i} label={kw} onDelete={() => updateRssKeywords(rssKeywords.filter((_, idx) => idx !== i))} />
          ))}
          {(!rssKeywords || rssKeywords.length === 0) && <p className="text-sm text-gray-400 dark:text-slate-500">কোনো কিওয়ার্ড যোগ করা হয়নি।</p>}
        </div>
        <div className="flex gap-3 max-w-md">
          <input type="text" placeholder="কিওয়ার্ড (যেমন: ধর্ষণ)" value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => { if(e.key==='Enter' && keyword.trim()) { updateRssKeywords([...(rssKeywords||[]), keyword.trim()]); setKeyword(''); } }} className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          <button onClick={() => { if(keyword.trim()) { updateRssKeywords([...(rssKeywords||[]), keyword.trim()]); setKeyword(''); } }} className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors">যুক্ত করুন</button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
function ImageLocationTab() {
  const { imageLocation, updateImageLocation } = useSettings()
  return (
    <div className="space-y-6 max-w-3xl">
      <SectionHeader title="ইমেজ লোকেশন (Image Storage Location)" subtitle="ছবি ও মিডিয়া ফাইলগুলো কোথায় জমা হবে তার পাথ সেট করুন।" />
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">ফোল্ডারের পাথ (Upload Directory Path)</label>
          <input 
            type="text" 
            value={imageLocation || ''}
            onChange={(e) => updateImageLocation(e.target.value)}
            placeholder="যেমন: D:/aajokal_news_media অথবা E:/uploads" 
            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          <p className="text-[11px] text-gray-500 mt-2">
            💡 <strong>পরামর্শ:</strong> ব্রাউজার সিকিউরিটির কারণে সরাসরি ফোল্ডার ব্রাউজ করে লোকাল ডিস্কের ফুল পাথ (Absolute Path) পাওয়া যায়বিধা নেই। তবে আপনি আপনার কম্পিউটারের যেকোনো ফোল্ডারের পাথ (যেমন: <code>D:/aajokal_news_media</code>) কপি করে এখানে পেস্ট করে সেভ করতে পারেন। সিস্টেম নিজে থেকেই সেই ফোল্ডারে ছবি সেভ করবে!
          </p>
        </div>
        <button 
          onClick={() => alert('ইমেজ লোকেশন সফলভাবে সংরক্ষণ করা হয়েছে!')}
          className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          সেভ করুন
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
function BackupLocationTab() {
  const { backupLocation, updateBackupLocation } = useSettings()
  return (
    <div className="space-y-6 max-w-3xl">
      <SectionHeader title="ডেটাবেজ ডাম্প/ব্যাকআপ লোকেশন (Database Dump & Backup Location)" subtitle="ডেটাবেজ ডাম্প (db_backup.json) এবং সম্পূর্ণ প্রজেক্টের ব্যাকআপ (cms_backup.zip) কোথায় জমা হবে তার পাথ সেট করুন।" />
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">ব্যাকআপ ফোল্ডারের পাথ (Backup Directory Path)</label>
          <input 
            type="text" 
            value={backupLocation || ''}
            onChange={(e) => updateBackupLocation(e.target.value)}
            placeholder="যেমন: D:/aajokal/Application/CMS Backup অথবা E:/db_dump" 
            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          <p className="text-[11px] text-gray-500 mt-2">
            💡 <strong>পরামর্শ:</strong> আপনার ডেটাবেজ ডাম্প (db_backup.json) এবং সম্পূর্ণ প্রজেক্টের ব্যাকআপ (cms_backup.zip) কোথায় জমা হবে তার পাথ এখানে বসিয়ে সেভ করুন। ব্যাকআপ স্ক্রিপ্ট নিজে থেকেই এই ফোল্ডারে ফাইলগুলো সেভ করবে!
          </p>
        </div>
        <button 
          onClick={() => alert('ডেটাবেজ ডাম্প ও ব্যাকআপ লোকেশন সফলভাবে সংরক্ষণ করা হয়েছে!')}
          className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          সেভ করুন
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB 15 — প্রিন্ট সেটিংস (Print Settings)
// ─────────────────────────────────────────────
function PrintSettingsTab() {
  const {
    printPages, addPrintPage, deletePrintPage,
    printPositions, addPrintPosition, deletePrintPosition,
    printEditions, addPrintEdition, deletePrintEdition,
  } = useSettings()

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800">
        <SectionHeader title="পৃষ্ঠা তালিকা (Pages)" subtitle="প্রিন্ট লেআউটের জন্য পৃষ্ঠাগুলোর নাম" />
        <div className="flex flex-wrap gap-2 mb-3">
          {printPages.map((page, idx) => (
            <Chip key={idx} label={page} colorClass="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800" onDelete={() => deletePrintPage(page)} />
          ))}
          {printPages.length === 0 && <p className="text-xs text-gray-400">কোনো পৃষ্ঠা নেই</p>}
        </div>
        <AddRow fields={['নতুন পৃষ্ঠার নাম']} onAdd={addPrintPage} buttonLabel="যুক্ত করুন" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800">
        <SectionHeader title="পজিশন তালিকা (Positions)" subtitle="সংবাদের পজিশন বা লেআউট টাইপ" />
        <div className="flex flex-wrap gap-2 mb-3">
          {printPositions.map((pos, idx) => (
            <Chip key={idx} label={pos} colorClass="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800" onDelete={() => deletePrintPosition(pos)} />
          ))}
          {printPositions.length === 0 && <p className="text-xs text-gray-400">কোনো পজিশন নেই</p>}
        </div>
        <AddRow fields={['নতুন পজিশন']} onAdd={addPrintPosition} buttonLabel="যুক্ত করুন" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800">
        <SectionHeader title="এডিশন তালিকা (Editions)" subtitle="যেসব এডিশনে প্রিন্ট হবে" />
        <div className="flex flex-wrap gap-2 mb-3">
          {printEditions.map((ed, idx) => (
            <Chip key={idx} label={ed} colorClass="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" onDelete={() => deletePrintEdition(ed)} />
          ))}
          {printEditions.length === 0 && <p className="text-xs text-gray-400">কোনো এডিশন নেই</p>}
        </div>
        <AddRow fields={['নতুন এডিশন']} onAdd={addPrintEdition} buttonLabel="যুক্ত করুন" />
      </div>
    </div>
  )
}
function CorrespondentsTab() {
  const [correspondents, setCorrespondents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // form state
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');

  

  

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !phone || !division || !district) return alert('নাম, ফোন, বিভাগ এবং জেলা অত্যাবশ্যক');
    try {
      await api.post('/correspondents', { name, designation, phone, email, dob, division, district, upazila });
      setName(''); setDesignation(''); setPhone(''); setEmail(''); setDob(''); setDivision(''); setDistrict(''); setUpazila('');
      fetchCorrespondents();
    } catch (err) {
      console.error(err);
      alert('প্রতিনিধি যোগ করতে সমস্যা হয়েছে');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('মুছে ফেলতে চান?')) return;
    try {
      await api.delete(`/correspondents/${id}`);
      fetchCorrespondents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <SectionHeader title="প্রতিনিধি ডাটাবেজ" subtitle="বিভাগ, জেলা এবং উপজেলা ভিত্তিক রিপোর্টারদের তালিকা" />
      
      <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
        <h4 className="font-semibold text-sm">নতুন প্রতিনিধি যোগ করুন</h4>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="নাম" value={name} onChange={e => setName(e.target.value)} className="border p-2 rounded text-sm" required />
          <input type="text" placeholder="পদবি (যেমন: স্টাফ রিপোর্টার)" value={designation} onChange={e => setDesignation(e.target.value)} className="border p-2 rounded text-sm" />
          <input type="text" placeholder="ফোন নম্বর" value={phone} onChange={e => setPhone(e.target.value)} className="border p-2 rounded text-sm" required />
          <input type="email" placeholder="ইমেইল" value={email} onChange={e => setEmail(e.target.value)} className="border p-2 rounded text-sm" />
          <input type="date" placeholder="জন্মদিন" value={dob} onChange={e => setDob(e.target.value)} className="border p-2 rounded text-sm text-gray-500" />
          
          <select value={division} onChange={e => {setDivision(e.target.value); setDistrict(''); setUpazila('');}} className="border p-2 rounded text-sm" required>
            <option value="">বিভাগ নির্বাচন করুন</option>
            {Object.keys(bangladeshLocations).map(div => <option key={div} value={div}>{div}</option>)}
          </select>
          <select value={district} onChange={e => {setDistrict(e.target.value); setUpazila('');}} className="border p-2 rounded text-sm" disabled={!division} required>
            <option value="">জেলা নির্বাচন করুন</option>
            {division && Object.keys(bangladeshLocations[division] || {}).map(dist => <option key={dist} value={dist}>{dist}</option>)}
          </select>
          <select value={upazila} onChange={e => setUpazila(e.target.value)} className="border p-2 rounded text-sm" disabled={!district}>
            <option value="">উপজেলা নির্বাচন করুন (ঐচ্ছিক)</option>
            {division && district && (bangladeshLocations[division][district] || []).map(upz => <option key={upz} value={upz}>{upz}</option>)}
          </select>
          
          <button type="submit" className="bg-blue-600 text-white p-2 rounded text-sm font-medium mt-auto flex items-center justify-center gap-1">
            <Plus size={16} /> যোগ করুন
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 font-medium">নাম</th>
              <th className="p-3 font-medium">যোগাযোগ</th>
              <th className="p-3 font-medium">এলাকা</th>
              <th className="p-3 font-medium w-16 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? <tr><td colSpan="4" className="p-4 text-center">Loading...</td></tr> : 
             correspondents.map(c => (
              <tr key={c._id} className="hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-semibold">{c.name}</div>
                  {c.designation && <div className="text-xs text-gray-500 mt-0.5">{c.designation}</div>}
                  {c.dob && <div className="text-xs text-gray-400 mt-0.5">জন্মদিন: {new Date(c.dob).toLocaleDateString()}</div>}
                </td>
                <td className="p-3">
                  <div className="font-medium text-gray-800">{c.phone}</div>
                  <div className="text-xs text-gray-500">{c.email || '-'}</div>
                </td>
                <td className="p-3">
                  <div className="text-gray-900">{c.division}, {c.district}</div>
                  <div className="text-xs text-gray-500">{c.upazila || '-'}</div>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => handleDelete(c._id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && correspondents.length === 0 && (
              <tr><td colSpan="4" className="p-6 text-center text-gray-500">কোনো প্রতিনিধি পাওয়া যায়নি</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
const TABS = [
  { id: 'roles',       label: 'ভূমিকা',            icon: Shield,     component: RolesTab },
  { id: 'correspondents', label: 'প্রতিনিধি ডাটাবেজ', icon: UserCheck, component: CorrespondentsTab },
  { id: 'menu',        label: 'মেন্যু এক্সেস',    icon: Menu,       component: MenuAccessTab },
  { id: 'categories',  label: 'ক্যাটাগরি',      icon: BookOpen,   component: CategoriesTab },
  { id: 'tags',        label: 'ট্যাগ',           icon: Hash,       component: TagsTab },
  { id: 'assignment_types', label: 'অ্যাসাইনমেন্ট ধরন', icon: FileText, component: AssignmentTypesTab },
  { id: 'sources',     label: 'সোর্স',           icon: Radio,      component: SourcesTab },
  { id: 'byline',      label: 'বায়লাইন',         icon: UserCheck,  component: BylineTab },
  { id: 'pages',       label: 'নিউজ পজিশন',      icon: Layout,     component: PagesTab },
  { id: 'homepage_layout', label: 'হোমপেজ লেআউট', icon: Layout,   component: HomepageLayoutTab },
  { id: 'rss_feeds', label: 'RSS ফিড সোর্স', icon: Radio, component: RssFeedsTab },
  { id: 'print_settings', label: 'প্রিন্ট সেটিংস', icon: Printer, component: PrintSettingsTab },
  { id: 'print_ad_data', label: 'প্রিন্ট এড ডাটা', icon: Tag, component: PrintAdDataTab },
]

export default function MasterData() {
  const [activeTab, setActiveTab] = useState('roles')
  const { t } = useLanguage()

  const TRANSLATED_TABS = TABS.map(tab => ({
    ...tab,
    label: t[tab.id] || tab.label
  }))

  const ActiveComponent = TRANSLATED_TABS.find(tab => tab.id === activeTab)?.component || RolesTab

  return (
    <div className="flex gap-5 h-full">

      {/* Left Tab List */}
      <div className="w-48 flex-shrink-0 space-y-1">
        <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-3">{t.masterDataTitle}</p>
        {TRANSLATED_TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
              activeTab === id
                ? 'bg-blue-600 text-white font-medium shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 hover:text-gray-900 dark:text-white'
            }`}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Right Content */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 overflow-y-auto">
        <ActiveComponent />
      </div>

    </div>
  )
}
