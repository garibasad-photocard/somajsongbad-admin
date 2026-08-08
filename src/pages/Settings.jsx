import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, ChevronDown, ChevronRight, ArrowUp, ArrowDown, GripVertical } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import { useLanguage } from '../context/LanguageContext'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function TagList({ items, onDelete }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs px-2 py-1 rounded-full">
          {item}
          <button onClick={() => onDelete(item)} className="text-gray-400 dark:text-slate-500 hover:text-red-500 transition-colors">
            <X size={11} />
          </button>
        </span>
      ))}
    </div>
  )
}

function AddInput({ placeholder, onAdd, extraField }) {
  const [value, setValue] = useState('')
  const [extra, setExtra] = useState('')

  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim(), extra.trim())
      setValue('')
      setExtra('')
    }
  }

  return (
    <div className="flex gap-2 mt-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder={placeholder}
        className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {extraField && (
        <input
          type="text"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder={extraField}
          className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
      <button
        onClick={handleAdd}
        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
      >
        <Plus size={13} />
        {useLanguage().t.addBtn}
      </button>
    </div>
  )
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  )
}

function SortableCategoryItem({ cat, expandedCat, setExpandedCat, editingCatId, editingCatName, setEditingCatName, handleSaveCategory, setEditingCatId, handleEditCategory, deleteCategory, deleteSubCategory, addSubCategory, t }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: cat.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="border border-gray-100 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-800">
        <div {...attributes} {...listeners} className="cursor-grab text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-400 active:cursor-grabbing p-1">
          <GripVertical size={15} />
        </div>
        <button onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:text-slate-300">
          {expandedCat === cat.id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>

        {editingCatId === cat.id ? (
          <input
            type="text"
            value={editingCatName}
            onChange={(e) => setEditingCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory(cat.id)}
            className="flex-1 border border-blue-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-sm font-medium text-gray-800 dark:text-slate-200">{t[cat.name] || cat.name}</span>
        )}

        <span className="text-xs text-gray-400 dark:text-slate-500">{cat.subCategories.length} {t.subCatCount}</span>

        {editingCatId === cat.id ? (
          <>
            <button onClick={() => handleSaveCategory(cat.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
              <Check size={14} />
            </button>
            <button onClick={() => setEditingCatId(null)} className="p-1 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded">
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => handleEditCategory(cat)} className="p-1 text-gray-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded">
              <Pencil size={13} />
            </button>
            <button onClick={() => deleteCategory(cat.id)} className="p-1 text-gray-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 rounded">
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>

      {expandedCat === cat.id && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">সাব-ক্যাটাগরি:</p>
          <TagList items={cat.subCategories} onDelete={(name) => deleteSubCategory(cat.id, name)} />
          <AddInput placeholder="নতুন সাব-ক্যাটাগরি..." onAdd={(name) => addSubCategory(cat.id, name)} />
        </div>
      )}
    </div>
  )
}

export default function Settings() {
  const { t } = useLanguage()
  const { 
    categories, addCategory, updateCategory, deleteCategory, reorderCategory, reorderCategoriesList,
    addSubCategory, deleteSubCategory,
    sources, addSource, deleteSource,
    positions, addPosition, deletePosition,
    journalists, addJournalist, updateJournalist, deleteJournalist,
    rssFeeds, addRssFeed, removeRssFeed, 
    rssKeywords, updateRssKeywords,
    googleAnalyticsId, updateGoogleAnalyticsId,
    footerSettings, updateFooterSettings,
    autoImportRss, updateAutoImportRss,
    includeIntroInBody, updateIncludeIntroInBody,
    enableAiRewrite, updateEnableAiRewrite,
    showRssMenu, updateShowRssMenu,
    imageLocation, updateImageLocation,
    backupLocation, updateBackupLocation,
    indesignWatchDir, setIndesignWatchDir,
    pdfWatchDir, setPdfWatchDir
  } = useSettings()

  const [expandedCat, setExpandedCat] = useState(null)
  const [editingCatId, setEditingCatId] = useState(null)
  const [editingCatName, setEditingCatName] = useState('')
  const [editingJournalist, setEditingJournalist] = useState(null)
  const [editJName, setEditJName] = useState('')
  const [editJDesig, setEditJDesig] = useState('')

  const handleEditCategory = (cat) => {
    setEditingCatId(cat.id)
    setEditingCatName(cat.name)
  }

  const handleSaveCategory = (id) => {
    if (editingCatName.trim()) updateCategory(id, editingCatName.trim())
    setEditingCatId(null)
    setEditingCatName('')
  }

  const handleEditJournalist = (j) => {
    setEditingJournalist(j.id)
    setEditJName(j.name)
    setEditJDesig(j.designation)
  }

  const handleSaveJournalist = (id) => {
    if (editJName.trim()) updateJournalist(id, editJName.trim(), editJDesig.trim())
    setEditingJournalist(null)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id)
      const newIndex = categories.findIndex((c) => c.id === over.id)
      const newArray = arrayMove(categories, oldIndex, newIndex)
      reorderCategoriesList(newArray)
    }
  }

  return (
    <div className="space-y-5 max-w-3xl">

      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t.settings}</h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{t.settingsDesc}</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800">
        ক্যাটাগরি, সাব-ক্যাটাগরি, সাংবাদিক, সোর্স ও পেজ ম্যানেজমেন্ট এখন <strong>মাস্টার ডেটা</strong> পেজে পাওয়া যাবে।
      </div>

      <SectionCard title="সোশ্যাল মিডিয়া ইন্টিগ্রেশন (API Keys)">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Facebook Page Access Token</label>
            <input 
              type="password" 
              placeholder="EAAI..." 
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-gray-500 mt-1">আপনার ফেসবুক পেজের ডেভেলপার ড্যাশবোর্ড থেকে টোকেনটি সংগ্রহ করুন।</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">X (Twitter) API Key & Secret</label>
            <input 
              type="password" 
              placeholder="Twitter Bearer Token..." 
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-gray-500 mt-1">X Developer Portal থেকে API Keys সংগ্রহ করুন।</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Instagram Graph API Token</label>
            <input 
              type="password" 
              placeholder="Instagram Access Token..." 
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-gray-500 mt-1">Facebook Developer Dashboard থেকে Instagram Business টোকেন সংগ্রহ করুন।</p>
          </div>
          <button className="bg-gray-900 text-white text-xs px-4 py-2 rounded-lg hover:bg-gray-800">
            সেভ করুন
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Google Analytics (GA4)">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Measurement ID (যেমন: G-XXXXXXXXXX)</label>
            <input 
              type="text" 
              value={googleAnalyticsId || ''}
              onChange={(e) => updateGoogleAnalyticsId(e.target.value)}
              placeholder="G-XXXXXXXXXX" 
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-gray-500 mt-1">এই আইডি যুক্ত করলে ওয়েবসাইটের ট্রাফিক এবং ভিজিটরদের রিপোর্ট সরাসরি আপনার গুগল অ্যানালিটিক্স ড্যাশবোর্ডে দেখতে পাবেন।</p>
          </div>
          <button 
            onClick={() => alert('সংরক্ষণ করা হয়েছে!')}
            className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            সেভ করুন
          </button>
        </div>
      </SectionCard>

      <SectionCard title="RSS ফিড সেটিংস (RSS Feed Settings)">
        <div className="space-y-6">
          {/* RSS Feeds List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">নিউজ সোর্স (RSS Links)</label>
              <button 
                onClick={() => {
                  const name = prompt('সোর্সের নাম (যেমন: প্রথম আলো):')
                  if (!name) return
                  const url = prompt('RSS লিংক (যেমন: https://.../feed):')
                  if (url) addRssFeed(name, url)
                }}
                className="text-xs flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40"
              >
                <Plus size={12} /> নতুন সোর্স
              </button>
            </div>
            {rssFeeds && rssFeeds.length > 0 ? (
              <div className="space-y-2">
                {rssFeeds.map(feed => (
                  <div key={feed.id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded border border-gray-200 dark:border-slate-700">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{feed.name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{feed.url}</p>
                    </div>
                    <button onClick={() => removeRssFeed(feed.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">কোনো নিউজ সোর্স যোগ করা হয়নি।</p>
            )}
          </div>

          {/* RSS Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">নিউজ ট্যাগ বা কিওয়ার্ড (RSS Keywords)</label>
            <p className="text-[11px] text-gray-500 mb-2">এই কিওয়ার্ডগুলো যেসব নিউজে থাকবে, শুধু সেগুলোই ইমপোর্ট করা হবে। কমা (,) দিয়ে আলাদা করে লিখুন।</p>
            <textarea 
              rows={4}
              value={Array.isArray(rssKeywords) ? rssKeywords.join(', ') : (rssKeywords || '')}
              onChange={(e) => {
                const arr = e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                updateRssKeywords(arr)
              }}
              placeholder="যেমন: বাংলাদেশ, খেলা, রাজনীতি, বাণিজ্য" 
              className="w-full resize-y border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>

        </div>
      </SectionCard>

      <SectionCard title="RSS ও AI অটোমেশন (RSS & AI Settings)">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white">Auto Import RSS (অটো নিউজ ইমপোর্ট)</label>
              <p className="text-xs text-gray-500 mt-0.5">চালু থাকলে সিস্টেম প্রতি ১০ মিনিট পর পর RSS থেকে নতুন নিউজ আনবে (মূল কার্যক্রম)।</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={autoImportRss}
                onChange={(e) => updateAutoImportRss(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white">Include Intro in Body (বডিতে ইন্ট্রো)</label>
              <p className="text-xs text-gray-500 mt-0.5">চালু থাকলে RSS-এর ইন্ট্রো বা ডেসক্রিপশন অংশটি নিউজের মূল বডির শুরুতে যোগ হবে।</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={includeIntroInBody}
                onChange={(e) => updateIncludeIntroInBody(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white">Enable AI Rewrite (এআই রিরাইট)</label>
              <p className="text-xs text-gray-500 mt-0.5">চালু থাকলে এডিটর পেজে 'AI Rewrite' বাটনটি শো করবে।</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={enableAiRewrite}
                onChange={(e) => updateEnableAiRewrite(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="RSS মেনু অন/অফ (RSS Menu Visibility)">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white">Enable RSS Menu (RSS মেনু দেখান)</label>
              <p className="text-xs text-gray-500 mt-0.5">চালু থাকলে বামপাশের সাইডবারে 'RSS ফিড নিউজ' মেনুটি দেখাবে।</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={showRssMenu !== false}
                onChange={(e) => updateShowRssMenu(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="ফুটার সেটিংস (Footer Settings)">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">সম্পাদক (Editor)</label>
            <input 
              type="text" 
              value={footerSettings?.editor || ''}
              onChange={(e) => updateFooterSettings({ ...footerSettings, editor: e.target.value })}
              placeholder="সম্পাদকের নাম" 
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">নির্বাহী সম্পাদক (Executive Editor)</label>
            <input 
              type="text" 
              value={footerSettings?.execEditor || ''}
              onChange={(e) => updateFooterSettings({ ...footerSettings, execEditor: e.target.value })}
              placeholder="নির্বাহী সম্পাদকের নাম" 
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">কপিরাইট (Copyright)</label>
            <input 
              type="text" 
              value={footerSettings?.copyright || ''}
              onChange={(e) => updateFooterSettings({ ...footerSettings, copyright: e.target.value })}
              placeholder="স্বত্ব © ২০২৪ আজ ও কাল" 
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="ইমেজ লোকেশন (Image Storage Location)">
        <div className="space-y-4">
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
              💡 <strong>পরামর্শ:</strong> ব্রাউজার সিকিউরিটির কারণে সরাসরি ফোল্ডার ব্রাউজ করে লোকাল ডিস্কের ফুল পাথ (Absolute Path) পাওয়া যায় না। তবে আপনি আপনার কম্পিউটারের যেকোনো ফোল্ডারের পাথ (যেমন: <code>D:/aajokal_news_media</code>) কপি করে এখানে পেস্ট করে সেভ করতে পারেন। সিস্টেম নিজে থেকেই সেই ফোল্ডারে ছবি সেভ করবে!
            </p>
          </div>
          <button 
            onClick={() => alert('ইমেজ লোকেশন সফলভাবে সংরক্ষণ করা হয়েছে!')}
            className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            সেভ করুন
          </button>
        </div>
      </SectionCard>

      <SectionCard title="ইনডিজাইন হাব (InDesign Watch Locations)">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">ইমেজ হাব লোকেশন (InDesign JPG Path)</label>
            <input 
              type="text" 
              value={indesignWatchDir || ''}
              onChange={(e) => setIndesignWatchDir(e.target.value)}
              placeholder="যেমন: D:\cms\Indesign Hub" 
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
            <p className="text-[11px] text-gray-500 mt-1">এই পাথ পরিবর্তন করলে ব্যাকএন্ড ওয়াচার অটোমেটিক্যালি আপডেট হয়ে যাবে।</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">পিডিএফ হাব লোকেশন (PDF Path)</label>
            <input 
              type="text" 
              value={pdfWatchDir || ''}
              onChange={(e) => setPdfWatchDir(e.target.value)}
              placeholder="যেমন: D:\cms\PDF Hub" 
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
          <button 
            onClick={() => alert('ইনডিজাইন লোকেশন সফলভাবে আপডেট এবং সার্ভার রিলোড করা হয়েছে!')}
            className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            সেভ করুন
          </button>
        </div>
      </SectionCard>

      <SectionCard title="ডেটাবেজ ডাম্প/ব্যাকআপ লোকেশন (Database Dump & Backup Location)">
        <div className="space-y-4">
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
              💡 <strong>পরামর্শ:</strong> আপনার ডেটাবেজ ডাম্প (db_backup.json) এবং সম্পূর্ণ প্রজেক্টের ব্যাকআপ (cms_backup.zip) কোথায় জমা হবে তার পাথ এখানে বসিয়ে সেভ করুন। ব্যাকআপ স্ক্রിপ্ট নিজে থেকেই এই ফোল্ডারে ফাইলগুলো সেভ করবে!
            </p>
          </div>
          <button 
            onClick={() => alert('ডেটাবেজ ডাম্প ও ব্যাকআপ লোকেশন সফলভাবে সংরক্ষণ করা হয়েছে!')}
            className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            সেভ করুন
          </button>
        </div>
      </SectionCard>

    </div>
  )
}
