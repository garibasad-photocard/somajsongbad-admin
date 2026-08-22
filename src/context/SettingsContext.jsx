import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const defaultCategories = [
  { id: 1, name: 'প্রচ্ছদ', subCategories: [] },
  { id: 2, name: 'বাংলাদেশ', subCategories: [] },
  { id: 3, name: 'রাজনীতি', subCategories: ['জাতীয়', 'আন্তর্জাতিক', 'নির্বাচন'] },
  { id: 4, name: 'খেলা', subCategories: ['ক্রিকেট', 'ফুটবল', 'হকি', 'টেনিস'] },
  { id: 5, name: 'বিনোদন', subCategories: ['চলচ্চিত্র', 'সংগীত', 'নাটক', 'OTT'] },
  { id: 6, name: 'বিশ্ব', subCategories: [] },
  { id: 7, name: 'বাণিজ্য', subCategories: ['বাজেট', 'ব্যাংকিং', 'শেয়ারবাজার', 'রপ্তানি'] },
  { id: 8, name: 'মতামত', subCategories: ['সম্পাদকীয়', 'কলাম', 'পাঠকের মত'] },
  { id: 9, name: 'চাকরি', subCategories: [] },
  { id: 10, name: 'জীবনযাপন', subCategories: [] },
  { id: 11, name: 'ভিডিও', subCategories: [] },
]

const defaultSources = [
  { id: 1, name: 'Staff Reporter' },
  { id: 2, name: 'Desk Report' },
  { id: 3, name: 'International Desk' },
  { id: 4, name: 'Tech Desk' },
  { id: 5, name: 'Sports Desk' },
  { id: 6, name: 'Entertainment Desk' },
  { id: 7, name: 'Business Desk' },
]

const defaultPositions = [
  { id: 1, name: 'প্রচ্ছদ', isActive: true },
  { id: 2, name: 'বাংলাদেশ', isActive: true },
  { id: 3, name: 'রাজনীতি', isActive: true },
  { id: 4, name: 'খেলা', isActive: true },
  { id: 5, name: 'বিনোদন', isActive: true },
  { id: 6, name: 'বিশ্ব', isActive: true },
  { id: 7, name: 'বাণিজ্য', isActive: true },
  { id: 8, name: 'মতামত', isActive: true },
  { id: 9, name: 'চাকরি', isActive: true },
  { id: 10, name: 'জীবনযাপন', isActive: true },
  { id: 11, name: 'ভিডিও', isActive: true },
]

const defaultJournalists = [
  { id: 1, name: 'রাকিব খান', designation: 'সিনিয়র রিপোর্টার' },
  { id: 2, name: 'তাসনিয়া সুলতানা', designation: 'স্টাফ রিপোর্টার' },
  { id: 3, name: 'মাহিন হাসান', designation: 'ক্রীড়া সাংবাদিক' },
  { id: 4, name: 'ফারজানা রহমান', designation: 'বিশেষ প্রতিনিধি' },
  { id: 5, name: 'তানভীর আহমেদ', designation: 'মাল্টিমিডিয়া রিপোর্টার' },
  { id: 6, name: 'সাদিয়া ইসলাম', designation: 'ভিডিও এডিটর' },
  { id: 7, name: 'ফাহিম মোর্শেদ', designation: 'পডকাস্ট উপস্থাপক' },
]

const defaultHomepageLayout = [
  { id: 2, category: 'বাংলাদেশ', template: 'list-sidebar' },
  { id: 7, category: 'বাণিজ্য', template: 'grid-4' },
  { id: 6, category: 'বিশ্ব', template: 'grid-3' },
  { id: 4, category: 'খেলা', template: 'list-sidebar' },
]

const defaultBreakingNews = ['এখানে আপনার প্রথম ব্রেকিং নিউজ লিখুন', 'আপনার দ্বিতীয় ব্রেকিং নিউজটি এখানে যুক্ত করুন']

const defaultRssFeeds = [
  { id: 1, name: 'প্রথম আলো', url: 'https://www.prothomalo.com/feed/' },
  { id: 2, name: 'যুগান্তর', url: 'https://www.jugantor.com/feed' },
  { id: 3, name: 'সমকাল', url: 'https://samakal.com/feed' },
  { id: 4, name: 'ডেইলি স্টার (বাংলা)', url: 'https://bangla.thedailystar.net/feed' }
]

const defaultPrintPages = [
  'প্রথম পাতা', 'দ্বিতীয় পাতা', 'তৃতীয় পাতা', 'শেষ পাতা',
  'খবর (২)', 'খবর (৩)', 'খেলাধুলা', 'বিনোদন', 'আন্তর্জাতিক',
  'অর্থনীতি', 'সম্পাদকীয়'
]

const defaultPrintPositions = [
  'লিড স্টোরি', 'সেকেন্ড লিড', 'শোল্ডার নিউজ', 'বটম নিউজ',
  'সিঙ্গেল কলাম', 'ডবল কলাম', 'বক্স নিউজ', 'ফিচার স্টোরি'
]

const defaultPrintEditions = [
  'প্রথম এডিশন', 'দ্বিতীয় এডিশন', 'মফস্বল এডিশন',
  'ঢাকা এডিশন', 'আন্তর্জাতিক এডিশন', 'বিশেষ এডিশন'
]

const defaultAdClients = ['Grameenphone', 'Walton', 'Robi', 'Banglalink']
const defaultAdAgencies = ['Asiatic', 'Bitopi', 'Mediacom']
const defaultAdTypes = ['Display Ad', 'Classified Ad', 'Ear Panel', 'Spot']
const defaultAdColors = ['Colour', 'Black & White']
const defaultAdPositions = ['Any', 'Front Page', 'Back Page', 'Bottom', 'Ear Panel']

export const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [categories, setCategories] = useState(defaultCategories)
  const [sources, setSources] = useState(defaultSources)
  const [positions, setPositions] = useState(defaultPositions)
  const [journalists, setJournalists] = useState(defaultJournalists)
  const [homepageLayout, setHomepageLayout] = useState(defaultHomepageLayout)
  const [breakingNews, setBreakingNews] = useState(defaultBreakingNews)
  const [breakingNewsEnabled, setBreakingNewsEnabled] = useState(true)
  const [liveNewsEnabled, setLiveNewsEnabled] = useState(true)
  const [adSettings, setAdSettings] = useState([])
  const [shiftEvents, setShiftEvents] = useState([])
  const [rssFeeds, setRssFeeds] = useState(defaultRssFeeds)
  const [rssKeywords, setRssKeywords] = useState([])
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('')
  const [newsOrders, setNewsOrders] = useState({})
  const [footerSettings, setFooterSettings] = useState({
    description: '',
    address: '',
    phone: '',
    email: '',
    socialLinks: { facebook: '', twitter: '', youtube: '', instagram: '' },
    copyright: ''
  })
  const [autoImportRss, setAutoImportRss] = useState(false)
  const [includeIntroInBody, setIncludeIntroInBody] = useState(true)
  const [enableAiRewrite, setEnableAiRewrite] = useState(true)
  const [showRssMenu, setShowRssMenu] = useState(true)
  const [imageLocation, setImageLocation] = useState('')
  const [backupLocation, setBackupLocation] = useState('')
  const [indesignWatchDir, setIndesignWatchDir] = useState('')
  const [pdfWatchDir, setPdfWatchDir] = useState('')

  const [printPages, setPrintPages] = useState(defaultPrintPages)
  const [printPositions, setPrintPositions] = useState(defaultPrintPositions)
  const [printEditions, setPrintEditions] = useState(defaultPrintEditions)

  const [adClients, setAdClients] = useState(defaultAdClients)
  const [adAgencies, setAdAgencies] = useState(defaultAdAgencies)
  const [adTypes, setAdTypes] = useState(defaultAdTypes)
  const [adColors, setAdColors] = useState(defaultAdColors)
  const [adPositions, setAdPositions] = useState(defaultAdPositions)

  // ─── Menu Access (RBAC) ──────────────────────────────────────────────
  const [menuAccess, setMenuAccess] = useState(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings')
        const data = res.data
        if (data.cms_categories) setCategories(data.cms_categories)
        if (data.cms_sources) setSources(data.cms_sources)
        if (data.cms_positions) setPositions(data.cms_positions)
        if (data.cms_journalists) setJournalists(data.cms_journalists)
        if (data.homepage_layout) setHomepageLayout(data.homepage_layout)
        if (data.breaking_news) setBreakingNews(data.breaking_news)
        if (data.breaking_news_enabled !== undefined) setBreakingNewsEnabled(data.breaking_news_enabled)
        if (data.live_news_enabled !== undefined) setLiveNewsEnabled(data.live_news_enabled)
        if (data.ad_settings) setAdSettings(data.ad_settings)
        if (data.cms_shift_events) setShiftEvents(data.cms_shift_events)
        if (data.cms_rss_feeds) setRssFeeds(data.cms_rss_feeds)
        if (data.cms_rss_keywords) setRssKeywords(data.cms_rss_keywords)
        if (data.google_analytics_id) setGoogleAnalyticsId(data.google_analytics_id)
        if (data.news_orders) setNewsOrders(data.news_orders)
        if (data.footer_settings) setFooterSettings(data.footer_settings)
        if (typeof data.autoImportRss === 'boolean') setAutoImportRss(data.autoImportRss)
        if (typeof data.includeIntroInBody === 'boolean') setIncludeIntroInBody(data.includeIntroInBody)
        if (typeof data.enableAiRewrite === 'boolean') setEnableAiRewrite(data.enableAiRewrite)
        if (typeof data.showRssMenu === 'boolean') setShowRssMenu(data.showRssMenu)
        if (data.image_location) setImageLocation(data.image_location)
        if (data.backup_location) setBackupLocation(data.backup_location)
        if (data.indesign_watch_dir) setIndesignWatchDir(data.indesign_watch_dir)
        if (data.pdf_watch_dir) setPdfWatchDir(data.pdf_watch_dir)
        
        if (data.print_pages) setPrintPages(data.print_pages)
        if (data.print_positions) setPrintPositions(data.print_positions)
        if (data.print_editions) setPrintEditions(data.print_editions)

        if (data.ad_clients) setAdClients(data.ad_clients)
        if (data.ad_agencies) setAdAgencies(data.ad_agencies)
        if (data.ad_types) setAdTypes(data.ad_types)
        if (data.ad_colors) setAdColors(data.ad_colors)
        if (data.ad_positions) setAdPositions(data.ad_positions)
        // Load menu access
        if (data.cms_menu_access_v2) {
          try {
            const parsed = typeof data.cms_menu_access_v2 === 'string' ? JSON.parse(data.cms_menu_access_v2) : data.cms_menu_access_v2
            setMenuAccess(parsed)
            // Also sync localStorage so same-browser session works immediately
            localStorage.setItem('cms_menu_access_v2', JSON.stringify(parsed))
          } catch(e) {}
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchSettings()
  }, [])

  const refetchMenuAccess = async () => {
    try {
      const res = await api.get('/settings')
      const data = res.data
      if (data.cms_menu_access_v2) {
        try {
          const parsed = typeof data.cms_menu_access_v2 === 'string' ? JSON.parse(data.cms_menu_access_v2) : data.cms_menu_access_v2
          setMenuAccess(parsed)
          localStorage.setItem('cms_menu_access_v2', JSON.stringify(parsed))
        } catch(e) {}
      }
    } catch (err) {
      console.error('Failed to refetch menu access', err)
    }
  }

  const save = async (key, value) => {
    try {
      await api.post('/settings', { key, value })
      return true
    } catch (err) {
      console.error(err)
      if (err.response?.status === 403) {
        alert('আপনার অ্যাকাউন্টে এই পরিবর্তন সেভ করার অনুমতি নেই। দয়া করে অ্যাডমিনের সাথে যোগাযোগ করুন।')
      }
      return false
    }
  }

  // Category CRUD
  const addCategory = (name) => {
    const updated = [...categories, { id: Date.now(), name, subCategories: [], color: '#1e3a8a' }]
    setCategories(updated); save('cms_categories', updated)
  }
  const updateCategory = (id, name, color) => {
    const updated = categories.map((c) => c.id === id ? { ...c, name, color: color || c.color || '#1e3a8a' } : c)
    setCategories(updated); save('cms_categories', updated)
  }
  const deleteCategory = (id) => {
    const updated = categories.filter((c) => c.id !== id)
    setCategories(updated); save('cms_categories', updated)
  }
  const toggleCategoryStatus = (id) => {
    const updated = categories.map((c) => c.id === id ? { ...c, isActive: c.isActive === false ? true : false } : c)
    setCategories(updated); save('cms_categories', updated)
  }
  const reorderCategory = (id, direction) => {
    const idx = categories.findIndex(c => c.id === id);
    if (idx < 0) return;
    if (direction === 'up' && idx > 0) {
      const updated = [...categories];
      [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
      setCategories(updated); save('cms_categories', updated);
    } else if (direction === 'down' && idx < categories.length - 1) {
      const updated = [...categories];
      [updated[idx + 1], updated[idx]] = [updated[idx], updated[idx + 1]];
      setCategories(updated); save('cms_categories', updated);
    }
  }
  const reorderCategoriesList = (newCategories) => {
    setCategories(newCategories);
    save('cms_categories', newCategories);
  }

  // Sub-Category CRUD
  const addSubCategory = (categoryId, name) => {
    const updated = categories.map((c) =>
      c.id === categoryId ? { ...c, subCategories: [...c.subCategories, name] } : c
    )
    setCategories(updated); save('cms_categories', updated)
  }
  const deleteSubCategory = (categoryId, name) => {
    const updated = categories.map((c) =>
      c.id === categoryId ? { ...c, subCategories: c.subCategories.filter((s) => s !== name) } : c
    )
    setCategories(updated); save('cms_categories', updated)
  }

  // Source CRUD
  const addSource = (name) => {
    const updated = [...sources, { id: Date.now(), name }]
    setSources(updated); save('cms_sources', updated)
  }
  const deleteSource = (id) => {
    const updated = sources.filter((s) => s.id !== id)
    setSources(updated); save('cms_sources', updated)
  }

  // Position CRUD
  const addPosition = (name) => {
    const updated = [...positions, { id: Date.now(), name }]
    setPositions(updated); save('cms_positions', updated)
  }
  const deletePosition = (id) => {
    const updated = positions.filter((p) => p.id !== id)
    setPositions(updated); save('cms_positions', updated)
  }
  const removeAd = (id) => {
    const updated = adSettings.filter(a => a.id !== id)
    setAdSettings(updated)
    save('ad_settings', updated)
  }

  // Print Settings CRUD
  const addPrintPage = (name) => {
    const updated = [...printPages, name]
    setPrintPages(updated); save('print_pages', updated)
  }
  const deletePrintPage = (name) => {
    const updated = printPages.filter(p => p !== name)
    setPrintPages(updated); save('print_pages', updated)
  }

  const addPrintPosition = (name) => {
    const updated = [...printPositions, name]
    setPrintPositions(updated); save('print_positions', updated)
  }
  const deletePrintPosition = (name) => {
    const updated = printPositions.filter(p => p !== name)
    setPrintPositions(updated); save('print_positions', updated)
  }

  const addPrintEdition = (name) => {
    const updated = [...printEditions, name]
    setPrintEditions(updated); save('print_editions', updated)
  }
  const deletePrintEdition = (name) => {
    const updated = printEditions.filter(e => e !== name)
    setPrintEditions(updated); save('print_editions', updated)
  }

  // Ad Settings CRUD
  const addAdClient = (name) => {
    const updated = [...adClients, name]
    setAdClients(updated); save('ad_clients', updated)
  }
  const deleteAdClient = (name) => {
    const updated = adClients.filter(c => c !== name)
    setAdClients(updated); save('ad_clients', updated)
  }

  const addAdAgency = (name) => {
    const updated = [...adAgencies, name]
    setAdAgencies(updated); save('ad_agencies', updated)
  }
  const deleteAdAgency = (name) => {
    const updated = adAgencies.filter(a => a !== name)
    setAdAgencies(updated); save('ad_agencies', updated)
  }

  const addAdType = (name) => {
    const updated = [...adTypes, name]
    setAdTypes(updated); save('ad_types', updated)
  }
  const deleteAdType = (name) => {
    const updated = adTypes.filter(t => t !== name)
    setAdTypes(updated); save('ad_types', updated)
  }

  const addAdColor = (name) => {
    const updated = [...adColors, name]
    setAdColors(updated); save('ad_colors', updated)
  }
  const deleteAdColor = (name) => {
    const updated = adColors.filter(c => c !== name)
    setAdColors(updated); save('ad_colors', updated)
  }

  const addAdPosition = (name) => {
    const updated = [...adPositions, name]
    setAdPositions(updated); save('ad_positions', updated)
  }
  const deleteAdPosition = (name) => {
    const updated = adPositions.filter(p => p !== name)
    setAdPositions(updated); save('ad_positions', updated)
  }

  const updatePosition = (id, newName, isActive) => {
    const updated = positions.map((p) => p.id === id ? { ...p, name: newName, isActive: isActive ?? (p.isActive !== false) } : p)
    setPositions(updated); save('cms_positions', updated)
  }
  const reorderPositionsList = (newPositions) => {
    setPositions(newPositions)
    save('cms_positions', newPositions)
  }

  // Journalist CRUD
  const addJournalist = (name, designation) => {
    const updated = [...journalists, { id: Date.now(), name, designation }]
    setJournalists(updated); save('cms_journalists', updated)
  }
  const updateJournalist = (id, name, designation) => {
    const updated = journalists.map((j) => j.id === id ? { ...j, name, designation } : j)
    setJournalists(updated); save('cms_journalists', updated)
  }
  const deleteJournalist = (id) => {
    const updated = journalists.filter((j) => j.id !== id)
    setJournalists(updated); save('cms_journalists', updated)
  }

  // Homepage Layout Config
  const updateHomepageLayout = (newLayout) => {
    setHomepageLayout(newLayout)
    save('homepage_layout', newLayout)
  }

  // Breaking News Config
  const updateBreakingNews = (newsArray) => {
    setBreakingNews(newsArray)
    save('breaking_news', newsArray)
  }

  const toggleBreakingNews = (enabled) => {
    setBreakingNewsEnabled(enabled)
    save('breaking_news_enabled', enabled)
  }

  const toggleLiveNews = (enabled) => {
    setLiveNewsEnabled(enabled)
    save('live_news_enabled', enabled)
  }

  // Ad Settings
  const updateAdSettings = (newAds) => {
    setAdSettings(newAds)
    save('ad_settings', newAds)
  }

  // Shift Events
  const updateShiftEvents = (newEvents) => {
    setShiftEvents(newEvents)
    save('cms_shift_events', newEvents)
  }

  // RSS Feeds
  const addRssFeed = (name, url) => {
    const updated = [...rssFeeds, { id: Date.now(), name, url }]
    setRssFeeds(updated); save('cms_rss_feeds', updated)
  }
  const deleteRssFeed = (id) => {
    const updated = rssFeeds.filter((r) => r.id !== id)
    setRssFeeds(updated); save('cms_rss_feeds', updated)
  }

  // RSS Keywords
  const updateRssKeywords = (keywords) => {
    setRssKeywords(keywords)
    save('cms_rss_keywords', keywords)
  }

  // RSS & AI Settings
  const updateAutoImportRss = (val) => {
    setAutoImportRss(val)
    save('auto_import_rss', val)
  }
  const updateIncludeIntroInBody = (val) => {
    setIncludeIntroInBody(val)
    save('include_intro_in_body', val)
  }
  const updateEnableAiRewrite = (val) => {
    setEnableAiRewrite(val)
    save('enable_ai_rewrite', val)
  }
  const updateShowRssMenu = (val) => {
    setShowRssMenu(val)
    save('show_rss_menu', val)
  }

  // Google Analytics
  const updateGoogleAnalyticsId = (id) => {
    setGoogleAnalyticsId(id)
    save('google_analytics_id', id)
  }

  // News Orders
  const updateNewsOrders = async (orders) => {
    setNewsOrders(orders)
    const result = await save('news_orders', orders)
    // Trigger website cache revalidation (fire and forget to not slow down saving)
    try {
      fetch('http://localhost:3000/api/revalidate', { method: 'POST' }).catch(() => {})
      fetch('http://localhost:3050/api/revalidate', { method: 'POST' }).catch(() => {})
      fetch('https://www.somajsongbad.com/api/revalidate', { method: 'POST' }).catch(() => {})
      fetch('https://somajsongbad.com/api/revalidate', { method: 'POST' }).catch(() => {})
    } catch(e) {}
    return result
  }

  const updateFooterSettings = async (newFooterSettings) => {
    try {
      await api.post('/settings', { key: 'footer_settings', value: newFooterSettings })
      setFooterSettings(newFooterSettings)
    } catch (err) {
      console.error(err)
    }
  }

  const updateImageLocation = (loc) => {
    setImageLocation(loc)
    save('image_location', loc)
  }

  const updateBackupLocation = (loc) => {
    setBackupLocation(loc)
    save('backup_location', loc)
  }

  const updateIndesignWatchDir = (dir) => {
    setIndesignWatchDir(dir)
    save('indesign_watch_dir', dir)
  }

  const updatePdfWatchDir = (dir) => {
    setPdfWatchDir(dir)
    save('pdf_watch_dir', dir)
  }

  return (
    <SettingsContext.Provider value={{
      categories, addCategory, updateCategory, deleteCategory, toggleCategoryStatus, reorderCategory, reorderCategoriesList,
      addSubCategory, deleteSubCategory,
      sources, addSource, deleteSource,
      positions, addPosition, updatePosition, deletePosition, reorderPositionsList,
      journalists, addJournalist, updateJournalist, deleteJournalist,
      homepageLayout, updateHomepageLayout,
      breakingNews, updateBreakingNews,
      breakingNewsEnabled, toggleBreakingNews,
      liveNewsEnabled, toggleLiveNews,
      adSettings, updateAdSettings, removeAd,
      shiftEvents, updateShiftEvents,
      rssFeeds, addRssFeed, deleteRssFeed,
      rssKeywords, updateRssKeywords,
      googleAnalyticsId, updateGoogleAnalyticsId,
      newsOrders, setNewsOrders: updateNewsOrders, updateNewsOrders,
      footerSettings, setFooterSettings: updateFooterSettings,
      autoImportRss, setAutoImportRss: updateAutoImportRss,
      includeIntroInBody, setIncludeIntroInBody: updateIncludeIntroInBody,
      enableAiRewrite, setEnableAiRewrite: updateEnableAiRewrite,
      showRssMenu, setShowRssMenu: updateShowRssMenu,
      imageLocation, setImageLocation: updateImageLocation,
      backupLocation, setBackupLocation: updateBackupLocation,
      indesignWatchDir, setIndesignWatchDir: updateIndesignWatchDir,
      pdfWatchDir, setPdfWatchDir: updatePdfWatchDir,
      printPages, addPrintPage, deletePrintPage,
      printPositions, addPrintPosition, deletePrintPosition,
      printEditions, addPrintEdition, deletePrintEdition,

      adClients, addAdClient, deleteAdClient,
      adAgencies, addAdAgency, deleteAdAgency,
      adTypes, addAdType, deleteAdType,
      adColors, addAdColor, deleteAdColor,
      adPositions, addAdPosition, deleteAdPosition,

      // Menu Access (RBAC)
      menuAccess, setMenuAccess, refetchMenuAccess
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
