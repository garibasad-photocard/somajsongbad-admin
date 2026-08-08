import { useState, useEffect } from 'react'
import { Radio, Plus, Trash2, Power, CheckCircle, Edit, ExternalLink, Calendar, User, Clock, AlertCircle, Sparkles, Pin, Upload, Video, Image, Search } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'

export default function LiveNews() {
  const { user } = useAuth()
  const { categories, liveNewsEnabled, toggleLiveNews } = useSettings()
  const [liveNewsList, setLiveNewsList] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Form States for creating/editing Live News Event
  const [editingId, setEditingId] = useState(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('খেলা')
  const [subCategory, setSubCategory] = useState('ফুটবল')
  const [badgeText, setBadgeText] = useState('সরাসরি')
  const [leadImage, setLeadImage] = useState('')
  const [summary, setSummary] = useState('')
  const [author, setAuthor] = useState('খেলা ডেস্ক')
  const [pinnedScoreText, setPinnedScoreText] = useState('')
  const [tabTitle, setTabTitle] = useState('লাইভ ১')
  const [isActive, setIsActive] = useState(true)
  const [matchType, setMatchType] = useState('general')
  const [breakingNewsData, setBreakingNewsData] = useState({
    headline: '',
    location: 'ঢাকা, বাংলাদেশ',
    isEmergency: true,
    liveUpdates: [
      { time: 'বিকেল ৪:৩০', text: 'আইনশৃঙ্খলা বাহিনীর প্রেস ব্রিফিং, পরিস্থিতি স্বাভাবিক রাখার আশ্বাস।' },
      { time: 'বিকেল ৪:১৫', text: 'পল্টনে মিছিল শুরু, যান চলাচল সাময়িক বন্ধ ঘোষণা।' },
      { time: 'বিকেল ৩:৫০', text: 'সমাবেশস্থলে নেতাকর্মীদের জড়ো হওয়া শুরু।' }
    ]
  })
  const [cricketScore, setCricketScore] = useState({
    scoreUpdateMode: 'manual',
    apiMatchId: '',
    isApiSyncActive: false,
    cricinfoLiveUrl: '',
    team1Name: 'বাংলাদেশ',
    team1Score: '১৭৮/৪ (১৮.২ ওভার)',
    team1Flag: 'বাংলাদেশ',
    team2Name: 'ভারত',
    team2Score: '১৯২/৬',
    team2Flag: 'ভারত',
    targetSummary: 'Target: 193 (CRR 9.70, RRR 9.00)',
    batter1Name: 'তাওহীদ হৃদয়',
    batter1Runs: '৪২* (২২)',
    batter2Name: 'মাহমুদউল্লাহ',
    batter2Runs: '১৫ (১২)',
    bowlerName: 'বুমরাহ',
    bowlerFigures: '৩.২-০-২৮-২',
    lastWicket: 'Last Wicket: Tanzid Hasan 34 (26) b Jadeja 17.1 ov',
    currentOverLabel: 'Over 18',
    currentOverBalls: ['6', '4', 'W', '1', '0', '4'],
    currentOverDetails: ['18.1', '18.2', 'Wicket (Batsman Had)', '18.1', '18.2', '18.2']
  })
  const [instantCricket, setInstantCricket] = useState(null)

  // API Integration States
  const [apiMatchesList, setApiMatchesList] = useState([])
  const [showApiMatchesModal, setShowApiMatchesModal] = useState(false)
  const [loadingApiMatch, setLoadingApiMatch] = useState(false)

  const fetchApiMatchesList = async () => {
    try {
      const res = await api.get('/live-news/api-matches/list');
      setApiMatchesList(res.data);
      setShowApiMatchesModal(true);
    } catch (error) {
      console.error('Error fetching API matches:', error);
      alert('এপিআই থেকে লাইভ ম্যাচের তালিকা আনতে সমস্যা হয়েছে।');
    }
  };

  const selectApiMatchAndFetchDetails = async (matchId) => {
    try {
      setLoadingApiMatch(true);
      const res = await api.get(`/live-news/api-matches/${matchId}`);
      setCricketScore(prev => ({
        ...prev,
        scoreUpdateMode: 'api',
        apiMatchId: matchId,
        isApiSyncActive: true,
        ...res.data
      }));
      setLoadingApiMatch(false);
      setShowApiMatchesModal(false);
      alert('⚡ এপিআই থেকে লাইভ স্কোর ডেটা সফলভাবে পপুলেট হয়েছে!');
    } catch (error) {
      console.error('Error fetching match details:', error);
      alert('ম্যাচের বিস্তারিত ডেটা আনতে সমস্যা হয়েছে।');
      setLoadingApiMatch(false);
    }
  };

  // Form States for adding an update to a live event
  const [activeEventForUpdate, setActiveEventForUpdate] = useState(null)
  const [updateTimestamp, setUpdateTimestamp] = useState('')
  const [updateHeadline, setUpdateHeadline] = useState('')
  const [updateDescription, setUpdateDescription] = useState('')
  const [updateImage, setUpdateImage] = useState('')
  const [updateVideo, setUpdateVideo] = useState('')
  const [updateIsImportant, setUpdateIsImportant] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [instantScoreText, setInstantScoreText] = useState('')
  const [editingUpdateIndex, setEditingUpdateIndex] = useState(null)

  useEffect(() => {
    if (activeEventForUpdate) {
      setInstantScoreText(activeEventForUpdate.pinnedScoreText || '')
      setInstantCricket(activeEventForUpdate.cricketScore || {
        team1Name: 'বাংলাদেশ',
        team1Score: '১৭৮/৪ (১৮.২ ওভার)',
        team1Flag: 'বাংলাদেশ',
        team2Name: 'ভারত',
        team2Score: '১৯২/৬',
        team2Flag: 'ভারত',
        targetSummary: 'Target: 193 (CRR 9.70, RRR 9.00)',
        batter1Name: 'তাওহীদ হৃদয়',
        batter1Runs: '৪২* (২২)',
        batter2Name: 'মাহমুদউল্লাহ',
        batter2Runs: '১৫ (১২)',
        bowlerName: 'বুমরাহ',
        bowlerFigures: '৩.২-০-২৮-২',
        lastWicket: 'Last Wicket: Tanzid Hasan 34 (26) b Jadeja 17.1 ov',
        currentOverLabel: 'Over 18',
        currentOverBalls: ['6', '4', 'W', '1', '0', '4'],
        currentOverDetails: ['18.1', '18.2', 'Wicket (Batsman Had)', '18.1', '18.2', '18.2']
      })
    }
  }, [activeEventForUpdate])

  // Preview Modal State
  const [previewEvent, setPreviewEvent] = useState(null)
  const [sidebarTab, setSidebarTab] = useState('latest')
  const [multiMatchTab, setMultiMatchTab] = useState(0)
  const [eventTab, setEventTab] = useState('active') // 'active' | 'archived'
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterSubCategory, setFilterSubCategory] = useState('all')

  const filteredEvents = liveNewsList.filter(ev => {
    const matchesTab = eventTab === 'active' ? (ev.status !== 'archived') : (ev.status === 'archived')
    if (!matchesTab) return false
    if (filterCategory !== 'all' && ev.category !== filterCategory) return false
    if (filterSubCategory !== 'all' && ev.subCategory !== filterSubCategory) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (ev.title?.toLowerCase().includes(q)) || (ev.category?.toLowerCase().includes(q)) || (ev.subCategory?.toLowerCase().includes(q))
  })

  const fetchLiveNews = async () => {
    try {
      const res = await api.get('/live-news')
      setLiveNewsList(res.data)
      if (res.data.length > 0) {
        if (!activeEventForUpdate) {
          setActiveEventForUpdate(res.data[0])
        } else {
          const updatedActive = res.data.find(e => e._id === activeEventForUpdate._id)
          if (updatedActive) setActiveEventForUpdate(updatedActive)
        }
        if (previewEvent) {
          const updatedPreview = res.data.find(e => e._id === previewEvent._id)
          if (updatedPreview) setPreviewEvent(updatedPreview)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveNews()
  }, [])

  const handleCreateOrUpdateEvent = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('অনুগ্রহ করে শিরোনাম লিখুন।')
      return
    }

    const finalTabTitle = tabTitle.trim() ? tabTitle : 'লাইভ ১'
    const payload = {
      title,
      category,
      subCategory,
      badgeText,
      leadImage,
      summary,
      author,
      pinnedScoreText,
      tabTitle: finalTabTitle,
      isActive,
      matchType,
      cricketScore,
      breakingNewsData
    }

    try {
      if (editingId) {
        const res = await api.put(`/live-news/${editingId}`, payload)
        if (activeEventForUpdate?._id === editingId) {
          setActiveEventForUpdate(res.data)
        }
        if (previewEvent?._id === editingId) {
          setPreviewEvent(res.data)
        }
        if (res.data.tabTitle === 'লাইভ ২' || res.data.tabTitle === 'ম্যাচ ২') {
          setMultiMatchTab(1)
        } else if (res.data.tabTitle === 'লাইভ ৩' || res.data.tabTitle === 'ম্যাচ ৩') {
          setMultiMatchTab(2)
        } else {
          setMultiMatchTab(0)
        }
        setEditingId(null)
      } else {
        const res = await api.post('/live-news', payload)
        setActiveEventForUpdate(res.data)
        setPreviewEvent(res.data)
        if (res.data.tabTitle === 'লাইভ ২' || res.data.tabTitle === 'ম্যাচ ২') {
          setMultiMatchTab(1)
        } else if (res.data.tabTitle === 'লাইভ ৩' || res.data.tabTitle === 'ম্যাচ ৩') {
          setMultiMatchTab(2)
        } else {
          setMultiMatchTab(0)
        }
      }
      resetEventForm()
      await fetchLiveNews()
    } catch (err) {
      console.error(err)
      alert('সংরক্ষণ করতে সমস্যা হয়েছে।')
    }
  }

  const resetEventForm = () => {
    setEditingId(null)
    setTitle('')
    setCategory('খেলা')
    setSubCategory('ফুটবল')
    setBadgeText('সরাসরি')
    setLeadImage('')
    setSummary('')
    setAuthor('খেলা ডেস্ক')
    setPinnedScoreText('')
    setTabTitle('লাইভ ১')
    setIsActive(true)
    setMatchType('general')
    setBreakingNewsData({
      headline: '',
      location: 'ঢাকা, বাংলাদেশ',
      isEmergency: true,
      liveUpdates: [
        { time: 'বিকেল ৪:৩০', text: 'আইনশৃঙ্খলা বাহিনীর প্রেস ব্রিফিং, পরিস্থিতি স্বাভাবিক রাখার আশ্বাস।' },
        { time: 'বিকেল ৪:১৫', text: 'পল্টনে মিছিল শুরু, যান চলাচল সাময়িক বন্ধ ঘোষণা।' },
        { time: 'বিকেল ৩:৫০', text: 'সমাবেশস্থলে নেতাকর্মীদের জড়ো হওয়া শুরু।' }
      ]
    })
    setCricketScore({
      team1Name: 'বাংলাদেশ',
      team1Score: '১৭৮/৪ (১৮.২ ওভার)',
      team1Flag: 'বাংলাদেশ',
      team2Name: 'ভারত',
      team2Score: '১৯২/৬',
      team2Flag: 'ভারত',
      targetSummary: 'Target: 193 (CRR 9.70, RRR 9.00)',
      batter1Name: 'তাওহীদ হৃদয়',
      batter1Runs: '৪২* (২২)',
      batter2Name: 'মাহমুদউল্লাহ',
      batter2Runs: '১৫ (১২)',
      bowlerName: 'বুমরাহ',
      bowlerFigures: '৩.২-০-২৮-২',
      lastWicket: 'Last Wicket: Tanzid Hasan 34 (26) b Jadeja 17.1 ov',
      currentOverLabel: 'Over 18',
      currentOverBalls: ['6', '4', 'W', '1', '0', '4'],
      currentOverDetails: ['18.1', '18.2', 'Wicket (Batsman Had)', '18.1', '18.2', '18.2']
    })
  }

  const handleEditClick = (event) => {
    setEditingId(event._id)
    setTitle(event.title)
    setCategory(event.category || 'খেলা')
    setSubCategory(event.subCategory || 'ফুটবল')
    setBadgeText(event.badgeText || 'সরাসরি')
    setLeadImage(event.leadImage || '')
    setSummary(event.summary || '')
    setAuthor(event.author || 'খেলা ডেস্ক')
    setPinnedScoreText(event.pinnedScoreText || '')
    setTabTitle(event.tabTitle || '')
    setIsActive(event.isActive)
    setMatchType(event.matchType || 'general')
    setBreakingNewsData(event.breakingNewsData || {
      headline: event.title || '',
      location: 'ঢাকা, বাংলাদেশ',
      isEmergency: true,
      liveUpdates: [
        { time: 'বিকেল ৪:৩০', text: 'আইনশৃঙ্খলা বাহিনীর প্রেস ব্রিফিং, পরিস্থিতি স্বাভাবিক রাখার আশ্বাস।' },
        { time: 'বিকেল ৪:১৫', text: 'পল্টনে মিছিল শুরু, যান চলাচল সাময়িক বন্ধ ঘোষণা।' },
        { time: 'বিকেল ৩:৫০', text: 'সমাবেশস্থলে নেতাকর্মীদের জড়ো হওয়া শুরু।' }
      ]
    })
    setCricketScore(event.cricketScore || {
      team1Name: 'বাংলাদেশ',
      team1Score: '১৭৮/৪ (১৮.২ ওভার)',
      team1Flag: 'বাংলাদেশ',
      team2Name: 'ভারত',
      team2Score: '১৯২/৬',
      team2Flag: 'ভারত',
      targetSummary: 'Target: 193 (CRR 9.70, RRR 9.00)',
      batter1Name: 'তাওহীদ হৃদয়',
      batter1Runs: '৪২* (২২)',
      batter2Name: 'মাহমুদউল্লাহ',
      batter2Runs: '১৫ (১২)',
      bowlerName: 'বুমরাহ',
      bowlerFigures: '৩.২-০-২৮-২',
      lastWicket: 'Last Wicket: Tanzid Hasan 34 (26) b Jadeja 17.1 ov',
      currentOverLabel: 'Over 18',
      currentOverBalls: ['6', '4', 'W', '1', '0', '4'],
      currentOverDetails: ['18.1', '18.2', 'Wicket (Batsman Had)', '18.1', '18.2', '18.2']
    })
  }

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/live-news/${id}`)
      await fetchLiveNews()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই লাইভ ইভেন্টটি মুছে ফেলতে চান?')) return
    try {
      await api.delete(`/live-news/${id}`)
      if (activeEventForUpdate?._id === id) {
        setActiveEventForUpdate(null)
      }
      await fetchLiveNews()
    } catch (err) {
      console.error(err)
    }
  }

  const handlePreviewClick = (event) => {
    setPreviewEvent(event)
    if (event.tabTitle === 'লাইভ ২' || event.tabTitle === 'ম্যাচ ২') {
      setMultiMatchTab(1)
    } else if (event.tabTitle === 'লাইভ ৩' || event.tabTitle === 'ম্যাচ ৩') {
      setMultiMatchTab(2)
    } else {
      setMultiMatchTab(0)
    }
  }

  // Get event for current tab
  const getCurrentTabEvent = () => {
    const targetTitles = multiMatchTab === 0 ? ['লাইভ ১', 'ম্যাচ ১'] : multiMatchTab === 1 ? ['লাইভ ২', 'ম্যাচ ২'] : ['লাইভ ৩', 'ম্যাচ ৩'];
    const found = liveNewsList.find(e => targetTitles.includes(e.tabTitle));
    if (found) return found;
    if (multiMatchTab === 0 && previewEvent && !previewEvent.tabTitle) return previewEvent;
    return null;
  };

  // Helper to parse pinnedScoreText into team names and scores
  const parseScoreText = (text, defaultTeam1, defaultScore1, defaultScore2, defaultTeam2) => {
    if (!text) return { team1: defaultTeam1, score1: defaultScore1, score2: defaultScore2, team2: defaultTeam2 };
    const cleanText = text.replace(/[:\-–,]|vs|বনাম/gi, ':');
    const parts = cleanText.split(':');
    if (parts.length >= 2) {
      const leftWords = parts[0].trim().split(' ');
      let score1 = defaultScore1;
      let team1 = defaultTeam1;
      if (leftWords.length > 0) {
        if (/[0-9০-৯]/.test(leftWords[leftWords.length - 1])) {
          score1 = leftWords.pop();
          team1 = leftWords.join(' ') || defaultTeam1;
        } else {
          team1 = leftWords.join(' ');
        }
      }

      const rightWords = parts[1].trim().split(' ');
      let score2 = defaultScore2;
      let team2 = defaultTeam2;
      if (rightWords.length > 0) {
        if (/[0-9০-৯]/.test(rightWords[0])) {
          score2 = rightWords.shift();
          team2 = rightWords.join(' ') || defaultTeam2;
        } else if (/[0-9০-৯]/.test(rightWords[rightWords.length - 1])) {
          score2 = rightWords.pop();
          team2 = rightWords.join(' ') || defaultTeam2;
        } else {
          team2 = rightWords.join(' ');
        }
      }

      return { team1, score1, score2, team2 };
    }
    // Fallback if no delimiter but has text e.g. "যুক্তরাষ্ট্র ২ কানাডা ১"
    const words = text.trim().split(' ');
    if (words.length >= 4) {
      return {
        team1: words[0],
        score1: words[1],
        team2: words[2],
        score2: words[3]
      };
    }
    return { team1: text, score1: defaultScore1, score2: defaultScore2, team2: defaultTeam2 };
  };

  const renderFlag = (teamName) => {
    const name = (teamName || '').trim();
    if (name.includes('বাংলাদেশ') || name.includes('bangladesh') || name === 'ban') {
      return (
        <svg className="w-full h-full object-cover" viewBox="0 0 1000 600">
          <path fill="#006a4e" d="M0 0h1000v600H0z"/>
          <circle cx="450" cy="300" r="200" fill="#f42a41"/>
        </svg>
      );
    } else if (name.includes('জিম্বাবুয়ে') || name.includes('zimbabwe') || name === 'zim' || name === 'zi') {
      return (
        <svg className="w-full h-full object-cover" viewBox="0 0 1400 700">
          <rect width="1400" height="100" y="0" fill="#006400"/>
          <rect width="1400" height="100" y="100" fill="#ffd200"/>
          <rect width="1400" height="100" y="200" fill="#d80000"/>
          <rect width="1400" height="100" y="300" fill="#000000"/>
          <rect width="1400" height="100" y="400" fill="#d80000"/>
          <rect width="1400" height="100" y="500" fill="#ffd200"/>
          <rect width="1400" height="100" y="600" fill="#006400"/>
          <polygon points="0,0 450,350 0,700" fill="#ffffff" stroke="#000000" strokeWidth="5"/>
          <polygon points="150,300 170,360 110,320 190,320 130,360" fill="#d80000"/>
        </svg>
      );
    } else if (name.includes('আর্জেন্টিনা') || name.includes('argentina')) {
      return (
        <div className="w-full h-full bg-blue-400 flex flex-col justify-between">
          <div className="flex-1 bg-blue-400"></div>
          <div className="flex-1 bg-white flex items-center justify-center">
            <div className="w-3.5 h-3.5 bg-yellow-500 rounded-full"></div>
          </div>
          <div className="flex-1 bg-blue-400"></div>
        </div>
      );
    } else if (name.includes('ব্রাজিল') || name.includes('Brazil')) {
      return (
        <div className="w-full h-full bg-green-600 flex items-center justify-center relative">
          <div className="w-10 h-6 bg-yellow-400 rotate-45 absolute"></div>
          <div className="w-4 h-4 bg-blue-800 rounded-full absolute border border-white"></div>
        </div>
      );
    } else if (name.includes('ভারত') || name.includes('India')) {
      return (
        <div className="w-full h-full bg-white flex flex-col justify-between">
          <div className="flex-1 bg-orange-500"></div>
          <div className="flex-1 bg-white flex items-center justify-center">
            <div className="w-3.5 h-3.5 bg-blue-800 rounded-full border border-white"></div>
          </div>
          <div className="flex-1 bg-green-600"></div>
        </div>
      );
    } else if (name.includes('পাকিস্তান') || name.includes('Pakistan')) {
      return (
        <div className="w-full h-full bg-green-700 flex items-center justify-center border-l-4 border-white">
          <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center"></div>
        </div>
      );
    } else if (name.includes('যুক্তরাষ্ট্র') || name.includes('আমেরিকা') || name.includes('USA') || name.includes('America') || name.includes('United States')) {
      return (
        <div className="w-full h-full bg-white flex flex-col justify-between relative overflow-hidden">
          <div className="h-1 bg-red-600"></div>
          <div className="h-1 bg-white"></div>
          <div className="h-1 bg-red-600"></div>
          <div className="h-1 bg-white"></div>
          <div className="h-1 bg-red-600"></div>
          <div className="absolute top-0 left-0 w-6 h-6 bg-blue-800 flex items-center justify-center p-0.5 flex-wrap gap-0.5">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
        </div>
      );
    } else if (name.includes('কানাডা') || name.includes('Canada')) {
      return (
        <div className="w-full h-full flex items-center justify-between bg-white relative">
          <div className="w-3 h-full bg-red-600"></div>
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="w-3.5 h-3.5 bg-red-600 rotate-45 flex items-center justify-center"></div>
          </div>
          <div className="w-3 h-full bg-red-600"></div>
        </div>
      );
    } else if (name.includes('স্পেন') || name.includes('Spain')) {
      return (
        <div className="w-full h-full flex flex-col justify-between bg-yellow-400 relative">
          <div className="h-2 bg-red-600"></div>
          <div className="absolute left-2 top-2.5 w-3 h-3 bg-red-600 rounded-sm flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-yellow-400"></div>
          </div>
          <div className="h-2 bg-red-600"></div>
        </div>
      );
    } else if (name.includes('পর্তুগাল') || name.includes('Portugal')) {
      return (
        <div className="w-full h-full flex relative">
          <div className="w-5 h-full bg-green-600"></div>
          <div className="flex-1 h-full bg-red-600"></div>
          <div className="absolute left-3 top-2.5 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center border border-white">
            <div className="w-2 h-2 bg-blue-700 rounded-sm"></div>
          </div>
        </div>
      );
    } else if (name.includes('ইংল্যান্ড') || name.includes('England')) {
      return (
        <div className="w-full h-full bg-white flex items-center justify-center relative">
          <div className="absolute w-full h-2.5 bg-red-600"></div>
          <div className="absolute w-2.5 h-full bg-red-600"></div>
        </div>
      );
    } else if (name.includes('ইতালি') || name.includes('Italy')) {
      return (
        <div className="w-full h-full flex">
          <div className="flex-1 bg-green-600"></div>
          <div className="flex-1 bg-white"></div>
          <div className="flex-1 bg-red-600"></div>
        </div>
      );
    } else if (name.includes('নেদারল্যান্ডস') || name.includes('Netherlands') || name.includes('হল্যান্ড') || name.includes('Holland')) {
      return (
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 bg-red-600"></div>
          <div className="flex-1 bg-white"></div>
          <div className="flex-1 bg-blue-700"></div>
        </div>
      );
    } else if (name.includes('ক্রোয়েশিয়া') || name.includes('Croatia')) {
      return (
        <div className="w-full h-full flex flex-col relative">
          <div className="flex-1 bg-red-600"></div>
          <div className="flex-1 bg-white"></div>
          <div className="flex-1 bg-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-white grid grid-cols-2 border border-red-600">
              <div className="bg-red-600"></div>
              <div className="bg-white"></div>
              <div className="bg-white"></div>
              <div className="bg-red-600"></div>
            </div>
          </div>
        </div>
      );
    } else if (name.includes('সৌদি') || name.includes('Saudi')) {
      return (
        <div className="w-full h-full bg-green-700 flex flex-col items-center justify-center p-1">
          <div className="w-8 h-1 bg-white mb-1 rounded"></div>
          <div className="w-6 h-0.5 bg-white rounded"></div>
        </div>
      );
    } else if (name.includes('অস্ট্রেলিয়া') || name.includes('Australia')) {
      return (
        <div className="w-full h-full bg-blue-800 flex items-center justify-between relative p-1">
          <div className="absolute top-0 left-0 w-6 h-5 bg-blue-900 border-r border-b border-white flex items-center justify-center">
            <div className="w-full h-1 bg-red-600 absolute"></div>
            <div className="w-1 h-full bg-red-600 absolute"></div>
          </div>
          <div className="absolute bottom-1 left-2 w-2 h-2 bg-white rounded-full"></div>
          <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
          <div className="absolute bottom-2 right-3 w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
      );
    } else if (name.includes('দক্ষিণ আফ্রিকা') || name.includes('South Africa')) {
      return (
        <div className="w-full h-full bg-green-600 flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 w-full h-3 bg-red-600"></div>
          <div className="absolute bottom-0 w-full h-3 bg-blue-700"></div>
          <div className="absolute left-0 w-6 h-full bg-black border-r-4 border-yellow-400 rotate-12"></div>
        </div>
      );
    } else if (name.includes('নিউজিল্যান্ড') || name.includes('New Zealand')) {
      return (
        <div className="w-full h-full bg-blue-900 flex items-center justify-between relative p-1">
          <div className="absolute top-0 left-0 w-6 h-5 bg-blue-950 border-r border-b border-white flex items-center justify-center">
            <div className="w-full h-1 bg-red-600 absolute"></div>
            <div className="w-1 h-full bg-red-600 absolute"></div>
          </div>
          <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 border border-white rounded-full"></div>
          <div className="absolute bottom-2 right-3 w-1.5 h-1.5 bg-red-500 border border-white rounded-full"></div>
        </div>
      );
    } else if (name.includes('শ্রীলঙ্কা') || name.includes('Sri Lanka')) {
      return (
        <div className="w-full h-full bg-amber-600 flex items-center p-1 border-2 border-yellow-500 gap-1">
          <div className="w-2 h-full bg-green-700"></div>
          <div className="w-2 h-full bg-orange-500"></div>
          <div className="flex-1 h-full bg-red-800 flex items-center justify-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
          </div>
        </div>
      );
    } else if (name.includes('আফগানিস্তান') || name.includes('Afghanistan')) {
      return (
        <div className="w-full h-full flex">
          <div className="flex-1 bg-black"></div>
          <div className="flex-1 bg-red-600 flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full opacity-80"></div>
          </div>
          <div className="flex-1 bg-green-700"></div>
        </div>
      );
    } else if (name.includes('জিম্বাবুয়ে') || name.includes('Zimbabwe')) {
      return (
        <div className="w-full h-full flex flex-col relative">
          <div className="flex-1 bg-green-600"></div>
          <div className="flex-1 bg-yellow-400"></div>
          <div className="flex-1 bg-red-600"></div>
          <div className="flex-1 bg-black"></div>
          <div className="flex-1 bg-green-600"></div>
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-white border-r border-black flex items-center justify-center">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
          </div>
        </div>
      );
    } else if (name.includes('জাপান') || name.includes('Japan')) {
      return (
        <div className="w-full h-full bg-white flex items-center justify-center">
          <div className="w-5 h-5 bg-red-600 rounded-full"></div>
        </div>
      );
    } else if (name.includes('কোরিয়া') || name.includes('Korea')) {
      return (
        <div className="w-full h-full bg-white flex items-center justify-center relative">
          <div className="w-5 h-5 rounded-full border border-gray-200 flex flex-col overflow-hidden">
            <div className="flex-1 bg-red-600"></div>
            <div className="flex-1 bg-blue-600"></div>
          </div>
        </div>
      );
    } else if (name.includes('কাতার') || name.includes('Qatar')) {
      return (
        <div className="w-full h-full flex bg-[#711A38]">
          <div className="w-4 h-full bg-white flex flex-col justify-between border-r-2 border-dotted border-[#711A38]"></div>
          <div className="flex-1 bg-[#711A38]"></div>
        </div>
      );
    } else if (name.includes('মরক্কো') || name.includes('Morocco')) {
      return (
        <div className="w-full h-full bg-red-600 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-green-600 rotate-45 flex items-center justify-center"></div>
        </div>
      );
    } else if (name.includes('মিশর') || name.includes('Egypt') || name.includes('মিসর')) {
      return (
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 bg-red-600"></div>
          <div className="flex-1 bg-white flex items-center justify-center">
            <div className="w-3 h-2 bg-yellow-600 rounded-sm"></div>
          </div>
          <div className="flex-1 bg-black"></div>
        </div>
      );
    } else if (name.includes('সেনেগাল') || name.includes('Senegal')) {
      return (
        <div className="w-full h-full flex">
          <div className="flex-1 bg-green-600"></div>
          <div className="flex-1 bg-yellow-400 flex items-center justify-center">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          </div>
          <div className="flex-1 bg-red-600"></div>
        </div>
      );
    } else if (name.includes('ফ্রান্স') || name.includes('France')) {
      return (
        <div className="w-full h-full flex">
          <div className="flex-1 bg-blue-700"></div>
          <div className="flex-1 bg-white"></div>
          <div className="flex-1 bg-red-600"></div>
        </div>
      );
    } else if (name.includes('জার্মানি') || name.includes('Germany')) {
      return (
        <div className="w-full h-full flex">
          <div className="flex-1 bg-black"></div>
          <div className="flex-1 bg-red-600"></div>
          <div className="flex-1 bg-yellow-500"></div>
        </div>
      );
    } else if (name.includes('উরুগুয়ে') || name.includes('Uruguay')) {
      return (
        <div className="w-full h-full bg-white flex flex-col justify-between relative">
          <div className="h-1 bg-blue-600"></div>
          <div className="h-1 bg-white"></div>
          <div className="h-1 bg-blue-600"></div>
          <div className="h-1 bg-white"></div>
          <div className="h-1 bg-blue-600"></div>
          <div className="absolute top-0 left-0 w-4 h-4 bg-white flex items-center justify-center border-r border-b border-blue-600">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="w-full h-full bg-gradient-to-tr from-red-600 via-purple-600 to-blue-600 flex items-center justify-center">
          <span className="text-white text-[10px] font-black">{name ? name.substring(0,2) : '⚽'}</span>
        </div>
      );
    }
  };

  // Add or Edit Update in Active Event
  const handleAddUpdate = async (e) => {
    e.preventDefault()
    if (!activeEventForUpdate) {
      alert('অনুগ্রহ করে একটি লাইভ ইভেন্ট সিলেক্ট করুন।')
      return
    }
    if (!updateHeadline) {
      alert('শিরোনাম আবশ্যক।')
      return
    }

    let calculatedTime = updateTimestamp.trim()
    if (!calculatedTime) {
      const now = new Date()
      let hours = now.getHours()
      let minutes = now.getMinutes()
      const ampm = hours >= 12 ? 'বিকেল/রাত' : 'সকাল/দুপুর'
      hours = hours % 12
      hours = hours ? hours : 12 // the hour '0' should be '12'
      const strHours = hours.toString().replace(/[0-9]/g, w => '০১২৩৪৫৬৭৮৯'[w])
      const strMins = minutes.toString().padStart(2, '0').replace(/[0-9]/g, w => '০১২৩৪৫৬৭৮৯'[w])
      calculatedTime = `${ampm} ${strHours}:${strMins} মিনিট`
    }

    const newUpdateData = {
      timestamp: calculatedTime,
      headline: updateHeadline,
      description: updateDescription,
      image: updateImage,
      video: updateVideo,
      isImportant: updateIsImportant
    }

    let updatedUpdates
    if (editingUpdateIndex !== null) {
      updatedUpdates = [...activeEventForUpdate.updates]
      updatedUpdates[editingUpdateIndex] = { ...updatedUpdates[editingUpdateIndex], ...newUpdateData }
    } else {
      updatedUpdates = [newUpdateData, ...(activeEventForUpdate.updates || [])]
    }

    try {
      const payload = { updates: updatedUpdates }
      if (instantScoreText !== undefined) {
        payload.pinnedScoreText = instantScoreText
      }
      const res = await api.put(`/live-news/${activeEventForUpdate._id}`, payload)
      setActiveEventForUpdate(res.data)
      if (previewEvent?._id === activeEventForUpdate._id) {
        setPreviewEvent(res.data)
      }
      const wasEditing = editingUpdateIndex !== null
      setEditingUpdateIndex(null)
      setUpdateTimestamp('')
      setUpdateHeadline('')
      setUpdateDescription('')
      setUpdateImage('')
      setUpdateVideo('')
      setUpdateIsImportant(false)
      await fetchLiveNews()
      alert(wasEditing ? 'আপডেটটি সফলভাবে সংশোধন করা হয়েছে!' : 'নতুন আপডেট প্রকাশিত হয়েছে!')
    } catch (err) {
      console.error(err)
      alert('আপডেট সংরক্ষণ করতে সমস্যা হয়েছে।')
    }
  }

  const handleEditUpdateClick = (idx) => {
    const item = activeEventForUpdate.updates[idx]
    setEditingUpdateIndex(idx)
    setUpdateTimestamp(item.timestamp || '')
    setUpdateHeadline(item.headline || '')
    setUpdateDescription(item.description || '')
    setUpdateImage(item.image || '')
    setUpdateVideo(item.video || '')
    setUpdateIsImportant(item.isImportant || false)
    window.scrollTo({ top: 600, behavior: 'smooth' })
  }

  const handleCancelEditUpdate = () => {
    setEditingUpdateIndex(null)
    setUpdateTimestamp('')
    setUpdateHeadline('')
    setUpdateDescription('')
    setUpdateImage('')
    setUpdateVideo('')
    setUpdateIsImportant(false)
  }

  const handleUpdateInstantScore = async (e) => {
    e.preventDefault()
    if (!activeEventForUpdate) return
    try {
      const res = await api.put(`/live-news/${activeEventForUpdate._id}`, { pinnedScoreText: instantScoreText })
      setActiveEventForUpdate(res.data)
      if (previewEvent?._id === activeEventForUpdate._id) {
        setPreviewEvent(res.data)
      }
      await fetchLiveNews()
      alert('লাইভ স্কোরবোর্ড তাৎক্ষণিকভাবে আপডেট হয়েছে!')
    } catch (err) {
      console.error(err)
      alert('স্কোরবোর্ড আপডেট করতে সমস্যা হয়েছে।')
    }
  }

  const handleUpdateInstantCricket = async (e) => {
    e.preventDefault()
    if (!activeEventForUpdate) return
    try {
      const res = await api.put(`/live-news/${activeEventForUpdate._id}`, { cricketScore: instantCricket })
      setActiveEventForUpdate(res.data)
      if (previewEvent?._id === activeEventForUpdate._id) {
        setPreviewEvent(res.data)
      }
      await fetchLiveNews()
      alert('ক্রিকেট লাইভ স্কোরবোর্ড তাৎক্ষণিকভাবে আপডেট হয়েছে!')
    } catch (err) {
      console.error(err)
      alert('স্কোরবোর্ড আপডেট করতে সমস্যা হয়েছে।')
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingImage(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', 'LiveNews')
    formData.append('status', 'approved')
    try {
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res.data && res.data.media) {
        const finalUrl = res.data.media.url.startsWith('http') ? res.data.media.url : `http://localhost:5001${res.data.media.url}`
        setUpdateImage(finalUrl)
      }
    } catch (err) {
      console.error('Image upload failed:', err)
      alert('ছবি আপলোড ব্যর্থ হয়েছে।')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDeleteUpdate = async (updateIndex) => {
    if (!activeEventForUpdate) return
    if (!window.confirm('এই আপডেটটি মুছে ফেলতে চান?')) return

    const updatedUpdates = activeEventForUpdate.updates.filter((_, i) => i !== updateIndex)
    try {
      const res = await api.put(`/live-news/${activeEventForUpdate._id}`, { updates: updatedUpdates })
      setActiveEventForUpdate(res.data)
      await fetchLiveNews()
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleArchive = async (event) => {
    const isArchiving = event.status !== 'archived';
    let summary = event.archiveSummary || '';
    if (isArchiving) {
      const userSummary = window.prompt('ইভেন্টটি আর্কাইভ করার আগে একটি সমাপনী সারসংক্ষেপ বা চূড়ান্ত ফলাফল লিখুন (Optional):', summary);
      if (userSummary === null) return; // cancelled
      summary = userSummary;
    } else {
      if (!window.confirm('এই ইভেন্টটি আবার চলমান (Active) লাইভ হিসেবে ফিরিয়ে আনতে চান?')) return;
    }

    try {
      const payload = {
        status: isArchiving ? 'archived' : 'active',
        archivedAt: isArchiving ? new Date() : null,
        archiveSummary: summary
      };
      const res = await api.put(`/live-news/${event._id}`, payload);
      setActiveEventForUpdate(res.data);
      if (previewEvent?._id === event._id) {
        setPreviewEvent(res.data);
      }
      await fetchLiveNews();
      alert(isArchiving ? 'ইভেন্টটি সফলভাবে আর্কাইভ করা হয়েছে!' : 'ইভেন্টটি আবার চলমান লাইভ হিসেবে সক্রিয় হয়েছে!');
    } catch (err) {
      console.error(err);
      alert('স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Live News Global Status Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className={`p-4 rounded-2xl border ${liveNewsEnabled ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-600' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600'}`}>
            <Power size={36} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              লাইভ নিউজ সেকশন স্ট্যাটাস ({liveNewsEnabled ? 'সক্রিয় / Active' : 'বন্ধ / Disabled'})
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-2xl">
              এই বাটনটি বন্ধ করলে ওয়েবসাইট থেকে লাইভ নিউজ পপআপ এবং মূল পেজ স্বয়ংক্রিয়ভাবে বন্ধ হয়ে যাবে। যখন কোনো লাইভ থাকবে না তখন এটি অফ করে রাখুন।
            </p>
          </div>
        </div>
        <button
          onClick={() => toggleLiveNews(!liveNewsEnabled)}
          className={`px-8 py-4 rounded-2xl font-extrabold text-white shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 text-base whitespace-nowrap ${
            liveNewsEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          <Power size={22} />
          {liveNewsEnabled ? 'লাইভ সেকশন অফ (OFF) করুন' : 'লাইভ সেকশন অন (ON) করুন'}
        </button>
      </div>

      {/* Header section */}
      <div className="bg-gradient-to-r from-red-600 to-amber-600 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 relative">
            <span className="w-3 h-3 bg-white rounded-full animate-ping absolute top-2 right-2"></span>
            <Radio size={36} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight">লাইভ নিউজ স্টুডিও (Live News Studio)</h1>
            </div>
            <p className="text-sm text-red-100 mt-2 max-w-2xl">
              প্রথম আলো স্টাইলের সরাসরি লাইভ ব্লগ ও ধারাভাষ্য পরিচালনা করুন। সাইটের যেকোনো ক্যাটাগরিতে (প্রচ্ছদ, রাজনীতি, খেলা ইত্যাদি) এটি ব্লিংকিং লাল ডটসহ (🔴 সরাসরি / লাইভ) সর্বশেষ নিউজের কলামের ওপরে প্রদর্শিত হবে।
            </p>
          </div>
        </div>
        <button
          onClick={() => { resetEventForm(); window.scrollTo({ top: 400, behavior: 'smooth' }) }}
          className="flex items-center gap-2 bg-white text-red-600 hover:bg-red-50 font-extrabold px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
        >
          <Plus size={18} />
          <span>নতুন লাইভ ইভেন্ট তৈরি করুন</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Live Event List & Event Creator Form */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Active / All Live News Events List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
                <Radio size={18} className="text-red-600" />
                <span>লাইভ ইভেন্টসমূহ</span>
              </h3>
              <span className="text-xs font-extrabold bg-red-100 text-red-700 px-3 py-1 rounded-full">
                {liveNewsList.length} টি ইভেন্ট
              </span>
            </div>

            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border-b border-gray-100 dark:border-slate-800 space-y-3">
              <div className="flex bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-inner">
                <button
                  type="button"
                  onClick={() => setEventTab('active')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${eventTab === 'active' ? 'bg-white dark:bg-slate-900 text-red-600 shadow-md' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'}`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                  <span>🔴 চলমান লাইভ ({liveNewsList.filter(e => e.status !== 'archived').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEventTab('archived')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 ${eventTab === 'archived' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'}`}
                >
                  <span>🗄️ আর্কাইভড ({liveNewsList.filter(e => e.status === 'archived').length})</span>
                </button>
              </div>

              {eventTab === 'archived' && (
                <div className="space-y-3 pt-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500">
                      <Search size={16} />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="আর্কাইভ করা লাইভ খুঁজুন (শিরোনাম, ক্যাটাগরি)..."
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={filterCategory}
                      onChange={(e) => {
                        setFilterCategory(e.target.value)
                        setFilterSubCategory('all')
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm"
                    >
                      <option value="all">সব ক্যাটাগরি</option>
                      {categories.map((cat) => (
                        <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>

                    <select
                      value={filterSubCategory}
                      onChange={(e) => setFilterSubCategory(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm"
                      disabled={filterCategory === 'all'}
                    >
                      <option value="all">সব সাব-ক্যাটাগরি</option>
                      {filterCategory !== 'all' && (categories.find(c => c.name === filterCategory)?.subCategories || []).map((sc, i) => (
                        <option key={i} value={sc}>{sc}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-500 font-medium">লোড হচ্ছে...</div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-12 text-center text-gray-500 font-medium">
                {searchQuery || filterCategory !== 'all' ? 'ফিল্টারের সাথে মিল রেখে কোনো ইভেন্ট পাওয়া যায়নি' : 'কোনো লাইভ ইভেন্ট পাওয়া যায়নি'}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredEvents.map((event) => (
                  <div
                    key={event._id}
                    onClick={() => setActiveEventForUpdate(event)}
                    className={`p-5 cursor-pointer transition-all ${
                      activeEventForUpdate?._id === event._id
                        ? 'bg-red-50/60 dark:bg-red-950/20 border-l-4 border-red-600'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 px-2.5 py-1 rounded-lg">
                        {event.category} {event.subCategory ? `> ${event.subCategory}` : ''}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handlePreviewClick(event) }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="প্রিভিউ দেখুন"
                        >
                          <ExternalLink size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleEditClick(event) }}
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="এডিট করুন"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggleStatus(event._id) }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            event.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                          }`}
                          title={event.isActive ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}
                        >
                          <Power size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event._id) }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-extrabold text-gray-900 dark:text-white line-clamp-2 mb-2">
                      {event.title}
                    </h4>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-medium">
                        {event.isActive && (
                          <span className="relative flex h-2.5 w-2.5 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                          </span>
                        )}
                        <strong className="text-gray-700 dark:text-slate-300">{event.badgeText}</strong>
                      </span>
                      <span className="font-bold text-gray-600 dark:text-slate-400">
                        {event.updates?.length || 0} টি আপডেট
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create / Edit Event Form */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                <span>{editingId ? 'লাইভ ইভেন্ট সংশোধন করুন' : 'নতুন লাইভ ইভেন্ট তৈরি'}</span>
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={resetEventForm}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  বাতিল
                </button>
              )}
            </div>

            <form onSubmit={handleCreateOrUpdateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  মূল শিরোনাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: নকআউট নিশ্চিত মিসর, ইংল্যান্ড, ঘানা, পর্তুগাল ও প্যারাগুয়ের"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 dark:text-white font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    ক্যাটাগরি
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setCategory(newCat);
                      const selCat = categories.find(c => c.name === newCat);
                      setSubCategory(selCat?.subCategories?.[0] || '');
                    }}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 dark:text-white font-medium"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    সাব-ক্যাটাগরি
                  </label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 dark:text-white font-medium"
                  >
                    <option value="">নির্বাচন করুন (ঐচ্ছিক)</option>
                    {(categories.find(c => c.name === category)?.subCategories || []).map((sc, i) => (
                      <option key={i} value={sc}>{sc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    লাইভ ব্যাজ টেক্স্ট
                  </label>
                  <select
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 dark:text-white font-medium"
                  >
                    <option value="সরাসরি">সরাসরি</option>
                    <option value="লাইভ">লাইভ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    লেখক / ডেস্ক
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="যেমন: খেলা ডেস্ক"
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  লাইভ পজিশন নির্বাচন (ট্যাব শিরোনাম)
                </label>
                <div className="flex gap-2">
                  <select
                    value={['লাইভ ১', 'লাইভ ২', 'লাইভ ৩'].includes(tabTitle || 'লাইভ ১') ? (tabTitle || 'লাইভ ১') : 'custom'}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setTabTitle('');
                      } else {
                        setTabTitle(e.target.value);
                      }
                    }}
                    className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 dark:text-white font-medium"
                  >
                    <option value="লাইভ ১">লাইভ ১ (Live 1)</option>
                    <option value="লাইভ ২">লাইভ ২ (Live 2)</option>
                    <option value="লাইভ ৩">লাইভ ৩ (Live 3)</option>
                    <option value="custom">কাস্টম নাম লিখুন...</option>
                  </select>
                  {!['লাইভ ১', 'লাইভ ২', 'লাইভ ৩'].includes(tabTitle || 'লাইভ ১') && (
                    <input
                      type="text"
                      value={tabTitle}
                      onChange={(e) => setTabTitle(e.target.value)}
                      placeholder="কাস্টম ট্যাব নাম..."
                      className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 dark:text-white font-medium"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  ম্যাচের ধরন (Match Type)
                </label>
                <select
                  value={matchType}
                  onChange={(e) => setMatchType(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 dark:text-white font-bold"
                >
                  <option value="general">সাধারণ / রাজনীতি</option>
                  <option value="breaking">🔥 রাজনীতি / ব্রেকিং নিউজ টিকার (Breaking/Politics)</option>
                  <option value="football">ফুটবল (Football)</option>
                  <option value="cricket">ক্রিকেট (Cricket)</option>
                </select>
              </div>

              {matchType === 'cricket' && (
                <div className="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 rounded-3xl space-y-6 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-200 dark:border-emerald-800">
                    <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-2">
                      <span>🏏</span> <span>ক্রিকেট স্কোরবোর্ড সেটিংস</span>
                    </h4>
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-full shadow-sm">
                      {cricketScore.scoreUpdateMode === 'api' ? '⚡ API Mode' : '✍️ Manual Mode'}
                    </span>
                  </div>

                  {/* Mode Selector Toggle */}
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setCricketScore({ ...cricketScore, scoreUpdateMode: 'api' })}
                      className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${cricketScore.scoreUpdateMode === 'api' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-black' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                    >
                      <span>⚡ স্বয়ংক্রিয় এপিআই মোড (Live API)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCricketScore({ ...cricketScore, scoreUpdateMode: 'manual' })}
                      className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${cricketScore.scoreUpdateMode === 'manual' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 font-black' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                    >
                      <span>✍️ ম্যানুয়াল আপডেট মোড (Manual Override)</span>
                    </button>
                  </div>

                  {/* API Mode Panel */}
                  {cricketScore.scoreUpdateMode === 'api' && (
                    <div className="space-y-5 bg-blue-50 dark:bg-slate-900/90 p-5 rounded-2xl border border-blue-200 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <h5 className="text-xs font-black text-blue-900 dark:text-blue-300">অফিসিয়াল এপিআই লাইভ রিয়েল-টাইম ডেটা</h5>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">কোনো আইপি ব্লক বা কপিরাইট ঝুঁকি ছাড়া বিশ্বজুড়ে চলমান খেলার লাইভ স্কোর পপুলেট করুন।</p>
                        </div>
                        <button
                          type="button"
                          onClick={fetchApiMatchesList}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 flex-shrink-0"
                        >
                          <span>🔍</span> <span>আজকের চলমান ম্যাচসমূহ</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-extrabold text-gray-600 dark:text-slate-300 mb-1">Match API ID (অথবা ক্রিকইনফো URL)</label>
                          <input
                            type="text"
                            value={cricketScore.apiMatchId}
                            onChange={e => setCricketScore({ ...cricketScore, apiMatchId: e.target.value })}
                            placeholder="যেমন: match_bd_in_2026"
                            className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold dark:text-white focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => selectApiMatchAndFetchDetails(cricketScore.apiMatchId || 'match_bd_in_2026')}
                            disabled={loadingApiMatch}
                            className="w-full h-[42px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <span>{loadingApiMatch ? '⏳ Fetching...' : '⚡ Fetch Live Score'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-blue-100 dark:border-slate-800 flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="isApiSyncActive"
                          checked={cricketScore.isApiSyncActive}
                          onChange={e => setCricketScore({ ...cricketScore, isApiSyncActive: e.target.checked })}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                        />
                        <label htmlFor="isApiSyncActive" className="text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer">
                          ✅ Set as Active Live (স্বয়ংক্রিয় লাইভ সিঙ্ক চালু রাখুন)
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Manual Mode Panel (or preview fields when in API mode) */}
                  <div className={`space-y-4 ${cricketScore.scoreUpdateMode === 'api' ? 'opacity-80 border-t border-gray-200 dark:border-slate-700 pt-4' : ''}`}>
                    <h5 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      {cricketScore.scoreUpdateMode === 'api' ? '📊 পপুলেটেড ডেটা ভিউ / ম্যানুয়াল সংশোধন' : '✍️ ম্যানুয়াল ইনপুট ফিল্ডসমূহ'}
                    </h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-600 dark:text-slate-300">দল ১ নাম</label>
                        <input type="text" value={cricketScore.team1Name} onChange={e => setCricketScore({...cricketScore, team1Name: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-gray-200 rounded-lg p-2 text-xs font-bold dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-600 dark:text-slate-300">দল ১ স্কোর</label>
                        <input type="text" value={cricketScore.team1Score} onChange={e => setCricketScore({...cricketScore, team1Score: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-gray-200 rounded-lg p-2 text-xs font-bold dark:text-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-600 dark:text-slate-300">দল ২ নাম</label>
                        <input type="text" value={cricketScore.team2Name} onChange={e => setCricketScore({...cricketScore, team2Name: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-gray-200 rounded-lg p-2 text-xs font-bold dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-600 dark:text-slate-300">দল ২ স্কোর</label>
                        <input type="text" value={cricketScore.team2Score} onChange={e => setCricketScore({...cricketScore, team2Score: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-gray-200 rounded-lg p-2 text-xs font-bold dark:text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-600 dark:text-slate-300">টার্গেট / রান রেট (Target Summary)</label>
                      <input type="text" value={cricketScore.targetSummary} onChange={e => setCricketScore({...cricketScore, targetSummary: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-gray-200 rounded-lg p-2 text-xs font-bold dark:text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-600 dark:text-slate-300">ব্যাটার ১ (স্ট্রাইক)</label>
                        <input type="text" value={cricketScore.batter1Name} onChange={e => setCricketScore({...cricketScore, batter1Name: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-gray-200 rounded-lg p-2 text-xs font-bold dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-600 dark:text-slate-300">ব্যাটার ১ রান ও বল</label>
                        <input type="text" value={cricketScore.batter1Runs} onChange={e => setCricketScore({...cricketScore, batter1Runs: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-gray-200 rounded-lg p-2 text-xs font-bold dark:text-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-600 dark:text-slate-300">ব্যাটার ২</label>
                        <input type="text" value={cricketScore.batter2Name} onChange={e => setCricketScore({...cricketScore, batter2Name: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-gray-200 rounded-lg p-2 text-xs font-bold dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-600 dark:text-slate-300">ব্যাটার ২ রান ও বল</label>
                        <input type="text" value={cricketScore.batter2Runs} onChange={e => setCricketScore({...cricketScore, batter2Runs: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-gray-200 rounded-lg p-2 text-xs font-bold dark:text-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-600 dark:text-slate-300">বোলার নাম</label>
                        <input type="text" value={cricketScore.bowlerName} onChange={e => setCricketScore({...cricketScore, bowlerName: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-gray-200 rounded-lg p-2 text-xs font-bold dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-600 dark:text-slate-300">বোলিং ফিগার</label>
                        <input type="text" value={cricketScore.bowlerFigures} onChange={e => setCricketScore({...cricketScore, bowlerFigures: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-gray-200 rounded-lg p-2 text-xs font-bold dark:text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-600 dark:text-slate-300">লাস্ট উইকেট (Last Wicket Info)</label>
                      <input type="text" value={cricketScore.lastWicket} onChange={e => setCricketScore({...cricketScore, lastWicket: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-gray-200 rounded-lg p-2 text-xs font-bold dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-600 dark:text-slate-300">চলমান ওভারের বলসমূহ (কমা দিয়ে লিখুন, যেমন: 6,4,W,1,0,4)</label>
                      <input type="text" value={(cricketScore.currentOverBalls || []).join(',')} onChange={e => setCricketScore({...cricketScore, currentOverBalls: e.target.value.split(',')})} className="w-full bg-white dark:bg-slate-900 border border-gray-200 rounded-lg p-2 text-xs font-bold dark:text-white" />
                    </div>
                  </div>

                  {/* API Matches Modal */}
                  {showApiMatchesModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                          <div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                              <span>🏏</span> <span>আজকের চলমান আন্তর্জাতিক ম্যাচসমূহ</span>
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">CricAPI / RapidAPI থেকে প্রাপ্ত রিয়েল-টাইম ফিড</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowApiMatchesModal(false)}
                            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-gray-800 font-bold text-sm flex items-center justify-center transition-all"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="space-y-4">
                          {apiMatchesList.map((m) => (
                            <div key={m.id} className="p-4 bg-gray-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl transition-all flex items-center justify-between gap-4 flex-wrap">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${m.status === 'LIVE' ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-gray-300'}`}>
                                    {m.status}
                                  </span>
                                  <h5 className="text-sm font-black text-gray-900 dark:text-white">{m.title}</h5>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 font-bold">
                                  {m.team1.name} <span className="text-blue-600 dark:text-blue-400">({m.team1.score})</span> বনাম {m.team2.name} <span className="text-blue-600 dark:text-blue-400">({m.team2.score})</span>
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">{m.matchSummary}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => selectApiMatchAndFetchDetails(m.id)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 flex-shrink-0"
                              >
                                <span>✅</span> <span>Select Match</span>
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setShowApiMatchesModal(false)}
                            className="px-5 py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white font-extrabold text-xs rounded-xl shadow hover:bg-gray-300 transition-all"
                          >
                            বন্ধ করুন
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  টপ পিনড বার্তা / লাইভ স্কোর (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={pinnedScoreText}
                  onChange={(e) => setPinnedScoreText(e.target.value)}
                  placeholder="যেমন: কেপ ভার্দে ০ : ০ সৌদি আরব (বিরতি)"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  কভার ছবির ইউআরএল (Lead Image)
                </label>
                <input
                  type="url"
                  value={leadImage}
                  onChange={(e) => setLeadImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  সংক্ষিপ্ত ভূমিকা (Overview / Summary)
                </label>
                <textarea
                  rows="3"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="মাঠের লড়াই, ম্যাচের ফলাফল ও পয়েন্ট তালিকার সর্বশেষ অবস্থা জানতে চোখ রাখুন এখানে..."
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 dark:text-white font-medium resize-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-5 h-5 rounded text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="text-sm font-bold text-gray-800 dark:text-slate-200">
                    সক্রিয় রাখুন (Active Live)
                  </span>
                </label>

                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all"
                >
                  {editingId ? 'পরিবর্তন সংরক্ষণ করুন' : 'তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Live Blog Timeline Manager (2 Columns Wide) */}
        <div className="lg:col-span-2 space-y-8">
          
          {activeEventForUpdate ? (
            <div className="space-y-8">
              
              {/* Event Header Panel */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="p-8 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {activeEventForUpdate.status === 'archived' ? (
                        <span className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-extrabold text-xs rounded-xl flex items-center gap-1.5 border border-gray-200 dark:border-slate-700">
                          🗄️ আর্কাইভড লাইভ (সম্পন্ন)
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-extrabold text-xs rounded-xl flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                          </span>
                          {activeEventForUpdate.badgeText || 'সরাসরি'}
                        </span>
                      )}
                      <span className="text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center gap-1">
                        <Calendar size={14} />
                        <span>ক্যাটাগরি: {activeEventForUpdate.category}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleArchive(activeEventForUpdate)}
                        className={`flex items-center gap-2 text-xs font-extrabold px-4 py-2 rounded-xl transition-all ${
                          activeEventForUpdate.status === 'archived'
                            ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800'
                            : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        <span>{activeEventForUpdate.status === 'archived' ? '🔄 চলমান লাইভ করুন' : '🗄️ ইভেন্টটি আর্কাইভ করুন'}</span>
                      </button>
                      <button
                        onClick={() => setPreviewEvent(activeEventForUpdate)}
                        className="flex items-center gap-2 text-xs font-extrabold bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-white px-4 py-2 rounded-xl transition-all"
                      >
                        <ExternalLink size={14} className="text-blue-600" />
                        <span>ওয়েবসাইট ভিউ ও পজিশন প্রিভিউ</span>
                      </button>
                    </div>
                  </div>

                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    {activeEventForUpdate.title}
                  </h2>

                  {activeEventForUpdate.status === 'archived' && activeEventForUpdate.archiveSummary && (
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500 rounded-2xl space-y-2 shadow-inner">
                      <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-black text-base">
                        <span>🏆 ইভেন্টের চূড়ান্ত ফলাফল / সমাপনী সারসংক্ষেপ:</span>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-emerald-100 font-extrabold leading-relaxed whitespace-pre-wrap">
                        {activeEventForUpdate.archiveSummary}
                      </p>
                    </div>
                  )}

                  {activeEventForUpdate.matchType === 'cricket' ? (
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/50 rounded-2xl space-y-4 shadow-inner">
                      <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-extrabold text-base">
                        <Pin size={20} className="text-emerald-600 animate-bounce flex-shrink-0" />
                        <span>তাত্ক্ষণিক ক্রিকেট লাইভ স্কোরবোর্ড পরিবর্তন</span>
                      </div>
                      {instantCricket && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">দল ১ স্কোর (BAN)</label>
                              <input type="text" value={instantCricket.team1Score} onChange={e => setInstantCricket({...instantCricket, team1Score: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-emerald-300 rounded-xl p-2 text-xs font-bold dark:text-white" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">দল ২ স্কোর (IND)</label>
                              <input type="text" value={instantCricket.team2Score} onChange={e => setInstantCricket({...instantCricket, team2Score: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-emerald-300 rounded-xl p-2 text-xs font-bold dark:text-white" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">ব্যাটার ১ (স্ট্রাইক)</label>
                              <input type="text" value={instantCricket.batter1Runs} onChange={e => setInstantCricket({...instantCricket, batter1Runs: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-emerald-300 rounded-xl p-2 text-xs font-bold dark:text-white" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">ব্যাটার ২</label>
                              <input type="text" value={instantCricket.batter2Runs} onChange={e => setInstantCricket({...instantCricket, batter2Runs: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-emerald-300 rounded-xl p-2 text-xs font-bold dark:text-white" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">বোলিং ফিগার</label>
                              <input type="text" value={instantCricket.bowlerFigures} onChange={e => setInstantCricket({...instantCricket, bowlerFigures: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-emerald-300 rounded-xl p-2 text-xs font-bold dark:text-white" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">চলমান ওভার (কমা দিয়ে, যেমন: 6,4,W,1,0,4)</label>
                              <input type="text" value={(instantCricket.currentOverBalls || []).join(',')} onChange={e => setInstantCricket({...instantCricket, currentOverBalls: e.target.value.split(',')})} className="w-full bg-white dark:bg-slate-900 border border-emerald-300 rounded-xl p-2 text-xs font-bold dark:text-white" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">টার্গেট / সমীকরণ</label>
                            <input type="text" value={instantCricket.targetSummary} onChange={e => setInstantCricket({...instantCricket, targetSummary: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-emerald-300 rounded-xl p-2 text-xs font-bold dark:text-white" />
                          </div>
                          <button
                            type="button"
                            onClick={handleUpdateInstantCricket}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all w-full"
                          >
                            ক্রিকেট স্কোর আপডেট করুন
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (activeEventForUpdate.matchType === 'football' || (activeEventForUpdate.category === 'খেলা' && activeEventForUpdate.matchType !== 'breaking')) ? (
                    <div className="p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl space-y-4 shadow-inner">
                      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-extrabold text-base">
                        <Pin size={20} className="text-amber-600 animate-bounce flex-shrink-0" />
                        <span>তাত্ক্ষণিক লাইভ স্কোরবোর্ড পরিবর্তন (পিনড স্কোর)</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value={instantScoreText}
                          onChange={(e) => setInstantScoreText(e.target.value)}
                          placeholder="যেমন: বাংলাদেশ ৩ বনাম ১ ভারত অথবা ফ্রান্স ২, জার্মানি ১"
                          className="flex-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 dark:text-white font-bold text-amber-950 dark:text-amber-100"
                        />
                        <button
                          type="button"
                          onClick={handleUpdateInstantScore}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
                        >
                          স্কোর আপডেট করুন
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {activeEventForUpdate.summary && (
                    <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed border-l-4 border-red-600 pl-4 py-1">
                      {activeEventForUpdate.summary}
                    </p>
                  )}
                </div>

                {/* Add Update Form */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-8 border-t border-gray-100 dark:border-slate-800 space-y-6">
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-base flex items-center gap-2">
                    {editingUpdateIndex !== null ? <Edit size={18} className="text-blue-600" /> : <Plus size={18} className="text-red-600" />}
                    <span>{editingUpdateIndex !== null ? 'লাইভ আপডেট সংশোধন করুন (Edit Update)' : 'নতুন লাইভ আপডেট যোগ করুন (তাত্ক্ষণিক টাইমলাইন)'}</span>
                  </h3>

                  <form onSubmit={handleAddUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                          সময় / টাইমস্ট্যাম্প <span className="text-gray-400 font-normal">(ফাঁকা রাখলে বর্তমান সময় বসবে)</span>
                        </label>
                        <input
                          type="text"
                          value={updateTimestamp}
                          onChange={(e) => setUpdateTimestamp(e.target.value)}
                          placeholder="যেমন: ১০:৪৫ মিনিট (ফাঁকা = বর্তমান সময়)"
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 dark:text-white font-bold"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                          আপডেটের শিরোনাম <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={updateHeadline}
                          onChange={(e) => setUpdateHeadline(e.target.value)}
                          placeholder="যেমন: নকআউটে আরও পাঁচ দল"
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 dark:text-white font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                        বিস্তারিত বিবরণ (Optional)
                      </label>
                      <textarea
                        rows="3"
                        value={updateDescription}
                        onChange={(e) => setUpdateDescription(e.target.value)}
                        placeholder="ঘটনার তাৎক্ষণিক বিবরণ ও বিশ্লেষণ..."
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-sm focus:ring-2 focus:ring-red-500 dark:text-white font-medium resize-none"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1"><Image size={14} className="text-blue-600" /> ছবি / মিডিয়া লিংক</span>
                          <span className="text-xs text-blue-600 hover:underline cursor-pointer relative font-bold">
                            💻 লোকাল ড্রাইভ থেকে আপলোড করুন
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              title="লোকাল ড্রাইভ থেকে ছবি আপলোড করুন"
                            />
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            type="url"
                            value={updateImage}
                            onChange={(e) => setUpdateImage(e.target.value)}
                            placeholder="https://... অথবা ড্রাইভ থেকে আপলোড করুন"
                            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white font-medium"
                            disabled={uploadingImage}
                          />
                          {uploadingImage && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs text-blue-600 font-bold animate-pulse">
                              আপলোড হচ্ছে...
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                          <Video size={14} className="text-red-600" /> ভিডিও লিংক (YouTube / Facebook / MP4)
                        </label>
                        <input
                          type="url"
                          value={updateVideo}
                          onChange={(e) => setUpdateVideo(e.target.value)}
                          placeholder="https://youtube.com/watch?v=... অথবা ভিডিও লিংক"
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 dark:text-white font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={updateIsImportant}
                          onChange={(e) => setUpdateIsImportant(e.target.checked)}
                          className="w-5 h-5 rounded text-red-600 focus:ring-red-500 border-gray-300"
                        />
                        <span className="text-sm font-bold text-gray-800 dark:text-slate-200">
                          গুরুত্বপূর্ণ আপডেট হিসেবে চিহ্নিত করুন (Highlight)
                        </span>
                      </label>

                      <div className="flex items-center gap-3">
                        {editingUpdateIndex !== null && (
                          <button
                            type="button"
                            onClick={handleCancelEditUpdate}
                            className="bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow transition-all"
                          >
                            বাতিল করুন
                          </button>
                        )}
                        <button
                          type="submit"
                          className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                        >
                          {editingUpdateIndex !== null ? <Edit size={18} /> : <Plus size={18} />}
                          <span>{editingUpdateIndex !== null ? 'সংশোধন সংরক্ষণ করুন' : 'আপডেট প্রকাশ করুন'}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Timeline Items Feed */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock size={20} className="text-red-600" />
                    <span>লাইভ টাইমলাইন আপডেটসমূহ ({activeEventForUpdate.updates?.length || 0})</span>
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-slate-400">সর্বশেষ আপডেট সবার ওপরে প্রদর্শিত হচ্ছে</span>
                </div>

                {(!activeEventForUpdate.updates || activeEventForUpdate.updates.length === 0) ? (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center text-gray-500 border border-gray-100 dark:border-slate-800 font-medium">
                    এখনও কোনো আপডেট যোগ করা হয়নি। ওপরের ফর্ম ব্যবহার করে প্রথম আপডেট প্রকাশ করুন।
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-8 border-l-2 border-red-200 dark:border-red-900/50 ml-4">
                    {activeEventForUpdate.updates.map((update, idx) => (
                      <div key={idx} className="relative group">
                        {/* Timeline Dot */}
                        <span className="absolute -left-[31px] top-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white ring-4 ring-white dark:ring-slate-900 shadow"></span>

                        {/* Update Card */}
                        <div className={`bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-lg border transition-all ${
                          update.isImportant
                            ? 'border-amber-400 dark:border-amber-600 bg-amber-50/20 dark:bg-amber-950/10'
                            : 'border-gray-100 dark:border-slate-800 hover:border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-red-600 text-white font-extrabold text-xs rounded-xl shadow-sm">
                                {update.timestamp}
                              </span>
                              {update.isImportant && (
                                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 text-xs font-extrabold rounded-lg flex items-center gap-1">
                                  <Sparkles size={12} />
                                  <span>গুরুত্বপূর্ণ</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditUpdateClick(idx)}
                                className="text-gray-500 hover:text-blue-600 p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-1.5 text-xs font-extrabold"
                                title="আপডেট এডিট করুন"
                              >
                                <Edit size={16} />
                                <span>এডিট</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUpdate(idx)}
                                className="text-gray-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1.5 text-xs font-extrabold"
                                title="আপডেট মুছুন"
                              >
                                <Trash2 size={16} />
                                <span>মুছুন</span>
                              </button>
                            </div>
                          </div>

                          <h4 className="text-xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
                            {update.headline}
                          </h4>

                          {update.description && (
                            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">
                              {update.description}
                            </p>
                          )}

                          {update.image && (
                            <div className="rounded-2xl overflow-hidden max-h-80 bg-gray-100 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 mt-4">
                              <img src={update.image} alt={update.headline} className="w-full h-full object-cover" />
                            </div>
                          )}

                          {update.video && (
                            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-3 bg-red-600 text-white rounded-xl shadow">
                                  <Video size={20} />
                                </div>
                                <div className="truncate">
                                  <h5 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">সংযুক্ত ভিডিও / লাইভ ফুটেজ</h5>
                                  <a href={update.video} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block">
                                    {update.video}
                                  </a>
                                </div>
                              </div>
                              <a
                                href={update.video}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow transition-all whitespace-nowrap"
                              >
                                ভিডিও দেখুন
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 p-16 text-center space-y-4">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <Radio size={40} />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">কোনো লাইভ ইভেন্ট নির্বাচিত নেই</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                বাম পাশের তালিকা থেকে একটি লাইভ ইভেন্ট সিলেক্ট করুন অথবা নতুন একটি ইভেন্ট তৈরি করে সরাসরি টাইমলাইন আপডেট যোগ করা শুরু করুন।
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Live Preview Modal (Simulating exact layout on Category Home Page right above Latest News) */}
      {previewEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden border border-gray-100 dark:border-slate-800 my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal Top Bar */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>ওয়েবসাইট লাইভ ভিউ প্রিভিউ (ক্যাটাগরি পেজ: {previewEvent.category})</span>
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1">
                  ক্যাটাগরি হোমপেজে সর্বশেষ নিউজের কলামের ঠিক ওপরে এভাবেই ব্লিংকিং লাল ডটসহ প্রদর্শিত হবে
                </p>
              </div>
              <button
                onClick={() => setPreviewEvent(null)}
                className="px-6 py-2.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-white font-extrabold text-sm rounded-2xl transition-all"
              >
                বন্ধ করুন
              </button>
            </div>

            {/* Simulated Website Layout */}
            <div className="p-8 overflow-y-auto space-y-8 bg-gray-100 dark:bg-slate-950 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Content Area (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* LIVE NEWS BANNER (Right above latest news or top section) */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-red-200 dark:border-red-900/50 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse"></div>
                    
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {previewEvent.status === 'archived' ? (
                          <span className="px-4 py-1.5 bg-gray-200 dark:bg-slate-800 text-gray-800 dark:text-gray-200 font-black text-xs tracking-wider rounded-full shadow-md border border-gray-300 dark:border-slate-700 flex items-center gap-2">
                            🗄️ আর্কাইভড লাইভ (সম্পন্ন)
                          </span>
                        ) : (
                          <span className="px-4 py-1.5 bg-red-600 text-white font-black text-xs tracking-wider rounded-full shadow-lg flex items-center gap-2.5">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                            </span>
                            {previewEvent.badgeText || 'সরাসরি'}
                          </span>
                        )}
                        {previewEvent.subCategory && (
                          <span className="text-xs font-bold text-gray-500 dark:text-slate-400">
                            {previewEvent.subCategory}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                        <User size={14} />
                        <span>{previewEvent.author || 'খেলা ডেস্ক'}</span>
                      </span>
                    </div>

                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight hover:text-red-600 transition-colors cursor-pointer">
                      {previewEvent.title}
                    </h1>

                    {previewEvent.status === 'archived' && previewEvent.archiveSummary && (
                      <div className="p-6 bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500 rounded-2xl flex flex-col gap-2 shadow-inner">
                        <span className="text-emerald-900 dark:text-emerald-200 font-black text-base">🏆 ইভেন্টের চূড়ান্ত ফলাফল / সমাপনী সারসংক্ষেপ:</span>
                        <p className="text-base text-gray-800 dark:text-emerald-100 font-extrabold leading-relaxed whitespace-pre-wrap">
                          {previewEvent.archiveSummary}
                        </p>
                      </div>
                    )}

                    {previewEvent.pinnedScoreText && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-center gap-3 text-amber-900 dark:text-amber-200 font-extrabold text-lg shadow-inner">
                        <Pin size={22} className="text-amber-600 animate-bounce flex-shrink-0" />
                        <span>{previewEvent.pinnedScoreText}</span>
                      </div>
                    )}

                    {previewEvent.leadImage && (
                      <div className="rounded-3xl overflow-hidden max-h-96 bg-gray-100 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 shadow-md">
                        <img src={previewEvent.leadImage} alt={previewEvent.title} className="w-full h-full object-cover" />
                      </div>
                    )}

                    {previewEvent.summary && (
                      <p className="text-base text-gray-700 dark:text-slate-300 leading-relaxed font-medium border-l-4 border-red-600 pl-4 py-1 bg-gray-50 dark:bg-slate-800/50 rounded-r-2xl">
                        {previewEvent.summary}
                      </p>
                    )}

                    {/* Timeline Updates Preview */}
                    {previewEvent.updates && previewEvent.updates.length > 0 && (
                      <div className="pt-6 border-t border-gray-100 dark:border-slate-800 space-y-6">
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                          <Radio size={20} className="text-red-600" />
                          <span>সরাসরি ধারাভাষ্য ও লাইভ আপডেট</span>
                        </h3>

                        <div className="space-y-6 pl-4 border-l-2 border-red-200 dark:border-red-900/50">
                          {previewEvent.updates.map((up, i) => (
                            <div key={i} className="relative bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm">
                              <span className="absolute -left-[25px] top-5 w-3.5 h-3.5 rounded-full bg-red-600 ring-4 ring-white dark:ring-slate-900"></span>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 bg-red-600 text-white font-extrabold text-xs rounded-xl">
                                  {up.timestamp}
                                </span>
                                {up.isImportant && (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-extrabold rounded-lg">
                                    গুরুত্বপূর্ণ
                                  </span>
                                )}
                              </div>
                              <h4 className="text-lg font-extrabold text-gray-900 dark:text-white mb-2">
                                {up.headline}
                              </h4>
                              {up.description && (
                                <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
                                  {up.description}
                                </p>
                              )}
                              {up.image && (
                                <img src={up.image} alt={up.headline} className="w-full max-h-60 object-cover rounded-xl mt-3 border border-gray-200 dark:border-slate-700" />
                              )}
                              {up.video && (
                                <div className="mt-4 p-4 bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-3 bg-red-600 text-white rounded-xl shadow-md">
                                      <Video size={20} />
                                    </div>
                                    <div className="truncate">
                                      <h5 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">সংযুক্ত ভিডিও / লাইভ ফুটেজ</h5>
                                      <a href={up.video} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block">
                                        {up.video}
                                      </a>
                                    </div>
                                  </div>
                                  <a
                                    href={up.video}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all whitespace-nowrap"
                                  >
                                    ভিডিও দেখুন
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>


                {/* Right Column: Simulated Latest News Column (সর্বশেষ ও সর্বাধিক পঠিত) */}
                <div className="lg:col-span-1 space-y-6">
                  
                  {/* LIVE BANNER WIDGET */}
                  {(() => {
                    const tabEv = getCurrentTabEvent() || previewEvent || liveNewsList[0];
                    const isCricket = tabEv?.matchType === 'cricket';

                    return isCricket ? (
                      <div className="bg-slate-100/90 dark:bg-slate-900/80 rounded-3xl p-3 shadow-2xl border border-gray-200 dark:border-slate-800 space-y-3 overflow-hidden">
                        {/* Top Tabs (লাইভ ১, লাইভ ২, লাইভ ৩) */}
                        <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-1.5 rounded-2xl gap-1 shadow-inner">
                          <button 
                            onClick={() => {
                              setMultiMatchTab(0);
                              const ev = liveNewsList.find(e => ['লাইভ ১', 'ম্যাচ ১'].includes(e.tabTitle)) || liveNewsList[0];
                              if (ev) setPreviewEvent(ev);
                            }}
                            className={`flex-1 py-2 px-2 text-xs font-black transition-all flex flex-col items-center justify-center gap-1 rounded-xl relative ${
                              multiMatchTab === 0 ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              {multiMatchTab === 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse flex-shrink-0"></span>}
                              <span className="tracking-wider uppercase">লাইভ ১</span>
                            </div>
                            {multiMatchTab === 0 && (
                              <div className="absolute bottom-1 w-8 h-0.5 bg-blue-600 rounded-full"></div>
                            )}
                          </button>
                          <button 
                            onClick={() => {
                              setMultiMatchTab(1);
                              const ev = liveNewsList.find(e => ['লাইভ ২', 'ম্যাচ ২'].includes(e.tabTitle));
                              if (ev) setPreviewEvent(ev);
                            }}
                            className={`flex-1 py-2 px-2 text-xs font-black transition-all flex flex-col items-center justify-center gap-1 rounded-xl relative ${
                              multiMatchTab === 1 ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              {multiMatchTab === 1 && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse flex-shrink-0"></span>}
                              <span className="tracking-wider uppercase">লাইভ ২</span>
                            </div>
                            {multiMatchTab === 1 && (
                              <div className="absolute bottom-1 w-8 h-0.5 bg-blue-600 rounded-full"></div>
                            )}
                          </button>
                          <button 
                            onClick={() => {
                              setMultiMatchTab(2);
                              const ev = liveNewsList.find(e => ['লাইভ ৩', 'ম্যাচ ৩'].includes(e.tabTitle));
                              if (ev) setPreviewEvent(ev);
                            }}
                            className={`flex-1 py-2 px-2 text-xs font-black transition-all flex flex-col items-center justify-center gap-1 rounded-xl relative ${
                              multiMatchTab === 2 ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              {multiMatchTab === 2 && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse flex-shrink-0"></span>}
                              <span className="tracking-wider uppercase">লাইভ ৩</span>
                            </div>
                            {multiMatchTab === 2 && (
                              <div className="absolute bottom-1 w-8 h-0.5 bg-blue-600 rounded-full"></div>
                            )}
                          </button>
                        </div>

                        {/* Main White Scorecard */}
                        {(() => {
                          if (!tabEv && multiMatchTab > 0) {
                            return (
                              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center gap-2 text-center">
                                <span className="text-sm font-extrabold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                                  কোনো ইভেন্ট বা লাইভ স্কোর নেই
                                </span>
                                <span className="text-xs font-bold text-gray-500">
                                  সিএমএস থেকে এই পজিশনের জন্য ইভেন্ট তৈরি করুন
                                </span>
                              </div>
                            );
                          }

                          const cs = tabEv?.cricketScore || {};
                          return (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 shadow-md border border-gray-100 dark:border-slate-800 space-y-4 overflow-hidden">
                              {/* Total Score header */}
                              <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 dark:text-gray-300">
                                <span>Total Score</span>
                                <div className="flex items-center gap-1 text-red-600 font-black tracking-wider text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                                  <span>{tabEv?.badgeText || 'সরাসরি'}</span>
                                </div>
                              </div>

                              {/* Scores Row */}
                              {(() => {
                                const isRealData = cs && (cs.team1Name || cs.team2Name || cs.team1Score || cs.team2Score);
                                const t1ScoreStr = isRealData ? (cs.team1Score || 'ব্যাট করেনি') : '১৭৮/৪ (১৮.২ ওভার)';
                                const t1MainScore = t1ScoreStr.includes('(') ? t1ScoreStr.substring(0, t1ScoreStr.indexOf('(')).trim() : t1ScoreStr;
                                const t1Overs = t1ScoreStr.includes('(') ? t1ScoreStr.substring(t1ScoreStr.indexOf('(')).trim() : '';

                                const t2ScoreStr = isRealData ? (cs.team2Score || 'ব্যাট করেনি') : '১৯২/৬';
                                const t2MainScore = t2ScoreStr.includes('(') ? t2ScoreStr.substring(0, t2ScoreStr.indexOf('(')).trim() : t2ScoreStr;
                                const t2Overs = t2ScoreStr.includes('(') ? t2ScoreStr.substring(t2ScoreStr.indexOf('(')).trim() : '';

                                return (
                                  <div className="grid grid-cols-2 gap-4 pt-1 border-b border-gray-100 dark:border-slate-800 pb-3">
                                    {/* Left Team (Team 1) */}
                                    <div className="flex flex-col items-center text-center gap-1.5 overflow-hidden">
                                      {/* Line 1: Flag */}
                                      <div className="w-14 h-9 sm:w-16 sm:h-10 rounded-lg overflow-hidden shadow-md border border-gray-200/80 flex-shrink-0 bg-gray-100 flex items-center justify-center">
                                        {renderFlag(cs.team1Flag || cs.team1Name || 'বাংলাদেশ')}
                                      </div>
                                      {/* Line 2: Team Name */}
                                      <div className="text-xs font-bold text-gray-700 dark:text-gray-300 tracking-tight truncate w-full">
                                        {cs.team1Name || 'বাংলাদেশ'}
                                      </div>
                                      {/* Line 3: Total Score */}
                                      <div className="flex flex-col items-center gap-0.5 w-full">
                                        <span className={`tracking-tight ${t1MainScore === 'ব্যাট করেনি' ? 'text-gray-500 dark:text-gray-400 text-xs font-bold py-0.5' : 'text-base sm:text-lg font-black text-gray-900 dark:text-white'}`}>
                                          {t1MainScore}
                                        </span>
                                        {t1Overs && (
                                          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {t1Overs}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Right Team (Team 2) */}
                                    <div className="flex flex-col items-center text-center gap-1.5 overflow-hidden">
                                      {/* Line 1: Flag */}
                                      <div className="w-14 h-9 sm:w-16 sm:h-10 rounded-lg overflow-hidden shadow-md border border-gray-200/80 flex-shrink-0 bg-gray-100 flex items-center justify-center">
                                        {renderFlag(cs.team2Flag || cs.team2Name || 'ভারত')}
                                      </div>
                                      {/* Line 2: Team Name */}
                                      <div className="text-xs font-bold text-gray-700 dark:text-gray-300 tracking-tight truncate w-full">
                                        {cs.team2Name || 'ভারত'}
                                      </div>
                                      {/* Line 3: Total Score */}
                                      <div className="flex flex-col items-center gap-0.5 w-full">
                                        <span className={`tracking-tight ${t2MainScore === 'ব্যাট করেনি' ? 'text-gray-500 dark:text-gray-400 text-xs font-bold py-0.5' : 'text-base sm:text-lg font-black text-gray-900 dark:text-white'}`}>
                                          {t2MainScore}
                                        </span>
                                        {t2Overs && (
                                          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {t2Overs}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Innings Summary */}
                              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-bold text-gray-700 dark:text-gray-300 pb-2 border-b border-gray-100 dark:border-slate-800">
                                <span className="font-extrabold text-gray-900 dark:text-white">{cs.team1Name || 'বাংলাদেশ'} Batting</span>
                                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{cs.targetSummary || 'Target: 193 (CRR 9.70, RRR 9.00)'}</span>
                              </div>

                              {/* Batting & Bowling columns */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] border-b border-gray-100 dark:border-slate-800 pb-3">
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Batting</div>
                                  <div className="font-extrabold text-gray-900 dark:text-white flex items-center justify-between gap-1 pr-1">
                                    <span className="truncate">{cs.batter1Name || 'তাওহীদ হৃদয়'}</span> 
                                    <span className="font-black text-gray-900 dark:text-white flex-shrink-0">{cs.batter1Runs || '৪২* (২২)'}</span>
                                  </div>
                                  <div className="font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between gap-1 pr-1">
                                    <span className="truncate">{cs.batter2Name || 'মাহমুদউল্লাহ'}</span> 
                                    <span className="font-bold text-gray-700 dark:text-gray-300 flex-shrink-0">{cs.batter2Runs || '১৫ (১২)'}</span>
                                  </div>
                                </div>
                                <div className="space-y-1 sm:border-l sm:border-gray-100 sm:dark:border-slate-800 sm:pl-2.5">
                                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bowling</div>
                                  <div className="font-extrabold text-gray-900 dark:text-white leading-tight">
                                    {cs.bowlerName || 'বুমরাহ'} {cs.bowlerFigures || '৩.২-০-২৮-২'}
                                  </div>
                                  <div className="text-[10px] font-medium text-gray-500 pt-0.5">
                                    0 maidens 2 wickets
                                  </div>
                                </div>
                              </div>

                              {/* Last Wicket */}
                              <div className="text-[11px] font-bold text-gray-800 dark:text-gray-200 pb-3 border-b border-gray-100 dark:border-slate-800 whitespace-normal break-words leading-snug overflow-hidden max-h-12">
                                {cs.lastWicket || 'Last Wicket: Tanzid Hasan 34 (26) b Jadeja 17.1 ov'}
                              </div>

                              {/* Over status */}
                              <div className="space-y-1.5 pt-0.5 w-full overflow-hidden">
                                <div className="text-[11px] font-extrabold text-gray-900 dark:text-white">{cs.currentOverLabel || 'Over 18'}</div>
                                <div className="flex items-start gap-1.5 overflow-x-auto overflow-y-hidden pb-1.5 pt-0.5 w-full">
                                  {(cs.currentOverBalls && cs.currentOverBalls.length > 0 ? cs.currentOverBalls : ['6', '4', 'W', '1', '0', '4']).map((b, bi) => {
                                    let bg = 'bg-[#cbd5e1] text-gray-800'; // grey circle for 1, 0
                                    if (b === '6') bg = 'bg-[#dc2626] text-white shadow-sm'; // red circle
                                    else if (b === '4') bg = 'bg-[#1e3a8a] text-white shadow-sm'; // blue circle
                                    else if (b === 'W' || b === 'w') bg = 'bg-[#dc2626] text-white shadow-sm'; // red circle for Wicket
                                    
                                    const details = cs.currentOverDetails && cs.currentOverDetails[bi] ? cs.currentOverDetails[bi] : (b === 'W' || b === 'w' ? 'Wicket\n(Batsman)' : (bi % 2 === 0 ? '18.1' : '18.2'));

                                    return (
                                      <div key={bi} className="flex flex-col items-center gap-1 flex-shrink-0 w-7 sm:w-8">
                                        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-black ${bg}`}>
                                          {b}
                                        </div>
                                        <div className="text-[8px] sm:text-[9px] font-bold text-gray-500 dark:text-gray-400 text-center leading-tight block w-full overflow-hidden text-ellipsis">
                                          {details}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Compact full-width white rounded button */}
                        <div className="pt-1">
                          <button className="w-full bg-white dark:bg-slate-800 text-[#d91616] dark:text-red-400 font-extrabold text-xs rounded-full py-2.5 px-4 shadow-md hover:shadow-lg hover:bg-red-50 dark:hover:bg-slate-700 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 group text-center uppercase tracking-wider">
                            <span>সরাসরি আপডেট দেখুন</span>
                            <ExternalLink size={15} className="text-[#d91616] dark:text-red-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-b from-[#e60b0b] to-[#eb7605] rounded-[32px] p-6 text-white shadow-2xl space-y-5 relative overflow-hidden border border-red-500/30">
                        
                        {/* Top Bar: Soccer Ball & Time */}
                        <div className="flex items-center justify-between px-1">
                          <div className="w-8 h-8 rounded-full bg-white text-red-600 flex items-center justify-center font-black text-base shadow-md">
                            ⚽
                          </div>
                          <span className="text-sm font-black tracking-wider text-white drop-shadow">
                            21:45
                          </span>
                        </div>

                        {/* Multi-Match Tab Selector (লাইভ ১, লাইভ ২, লাইভ ৩) */}
                        <div className="bg-[#2a201c]/80 backdrop-blur-md p-1.5 rounded-2xl flex items-center gap-1 border border-white/10 shadow-inner">
                          <button 
                            onClick={() => {
                              setMultiMatchTab(0);
                              const ev = liveNewsList.find(e => ['লাইভ ১', 'ম্যাচ ১'].includes(e.tabTitle)) || liveNewsList[0];
                              if (ev) setPreviewEvent(ev);
                            }}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 relative ${
                              multiMatchTab === 0 ? 'text-white' : 'text-white/60 hover:text-white/80'
                            }`}
                          >
                            <span className="tracking-wider uppercase">লাইভ ১</span>
                            {multiMatchTab === 0 && (
                              <div className="absolute bottom-1 w-10 h-1 bg-white rounded-full shadow-md animate-pulse"></div>
                            )}
                          </button>
                          <button 
                            onClick={() => {
                              setMultiMatchTab(1);
                              const ev = liveNewsList.find(e => ['লাইভ ২', 'ম্যাচ ২'].includes(e.tabTitle));
                              if (ev) setPreviewEvent(ev);
                            }}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 relative ${
                              multiMatchTab === 1 ? 'text-white' : 'text-white/60 hover:text-white/80'
                            }`}
                          >
                            <span className="tracking-wider uppercase">লাইভ ২</span>
                            {multiMatchTab === 1 && (
                              <div className="absolute bottom-1 w-10 h-1 bg-white rounded-full shadow-md animate-pulse"></div>
                            )}
                          </button>
                          <button 
                            onClick={() => {
                              setMultiMatchTab(2);
                              const ev = liveNewsList.find(e => ['লাইভ ৩', 'ম্যাচ ৩'].includes(e.tabTitle));
                              if (ev) setPreviewEvent(ev);
                            }}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 relative ${
                              multiMatchTab === 2 ? 'text-white' : 'text-white/60 hover:text-white/80'
                            }`}
                          >
                            <span className="tracking-wider uppercase">লাইভ ৩</span>
                            {multiMatchTab === 2 && (
                              <div className="absolute bottom-1 w-10 h-1 bg-white rounded-full shadow-md animate-pulse"></div>
                            )}
                          </button>
                        </div>

                        {/* Live Badge & Category */}
                        <div className="flex items-center justify-center gap-3 pt-1">
                          <span className="px-4 py-1.5 bg-white text-red-600 font-black text-xs rounded-full shadow-lg flex items-center gap-2 tracking-wide">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                            </span>
                            {tabEv?.badgeText || 'সরাসরি'}
                          </span>
                          <span className="text-sm font-extrabold text-white tracking-widest uppercase drop-shadow">
                            {tabEv?.category || 'খেলা'}
                          </span>
                        </div>

                        {/* Prominent Flag Scoreboard */}
                        {(() => {
                          if (!tabEv && multiMatchTab > 0) {
                            return (
                              <div className="bg-[#2d211e]/90 rounded-[24px] p-6 shadow-2xl backdrop-blur-md border border-white/10 flex flex-col items-center justify-center gap-2 text-center">
                                <span className="text-sm font-extrabold text-white/80 uppercase tracking-wider">
                                  কোনো ইভেন্ট বা লাইভ স্কোর নেই
                                </span>
                                <span className="text-xs font-bold text-white/50">
                                  সিএমএস থেকে এই পজিশনের জন্য ইভেন্ট তৈরি করুন
                                </span>
                              </div>
                            );
                          }

                          const defaultT1 = multiMatchTab === 0 ? 'ব্রাজিল' : 'দল ১';
                          const defaultS1 = multiMatchTab === 0 ? '৩' : '০';
                          const defaultS2 = multiMatchTab === 0 ? '৪' : '০';
                          const defaultT2 = multiMatchTab === 0 ? 'আর্জেন্টিনা' : 'দল ২';
                          const scoreInfo = parseScoreText(tabEv?.pinnedScoreText, defaultT1, defaultS1, defaultS2, defaultT2);

                          return (
                            <div className="bg-[#2d211e]/90 rounded-[24px] p-4 shadow-2xl backdrop-blur-md border border-white/10 flex items-center justify-between gap-2">
                              
                              {/* Left Team */}
                              <div className="flex-1 flex flex-col items-center gap-2 overflow-hidden">
                                <div className="w-14 h-10 rounded-lg overflow-hidden shadow-xl border border-white/20 flex items-center justify-center bg-gray-800 relative flex-shrink-0">
                                  {renderFlag(scoreInfo.team1)}
                                </div>
                                <span className="text-xs font-black tracking-tight text-white uppercase drop-shadow truncate w-full text-center">
                                  {scoreInfo.team1}
                                </span>
                              </div>

                              {/* Score Display */}
                              <div className="flex items-center gap-1.5 flex-shrink-0 px-1">
                                <span className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">
                                  {scoreInfo.score1}
                                </span>
                                <span className="text-xs font-extrabold text-white/60 uppercase self-center pt-1">
                                  vs
                                </span>
                                <span className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">
                                  {scoreInfo.score2}
                                </span>
                              </div>

                              {/* Right Team */}
                              <div className="flex-1 flex flex-col items-center gap-2 overflow-hidden">
                                <div className="w-14 h-10 rounded-lg overflow-hidden shadow-xl border border-white/20 flex items-center justify-center bg-gray-800 relative flex-shrink-0">
                                  {renderFlag(scoreInfo.team2)}
                                </div>
                                <span className="text-xs font-black tracking-tight text-white uppercase drop-shadow truncate w-full text-center">
                                  {scoreInfo.team2}
                                </span>
                              </div>

                            </div>
                          );
                        })()}

                        {/* Compact full-width white rounded button */}
                        <div className="pt-1">
                          <button className="w-full bg-white text-[#d91616] font-extrabold text-xs rounded-full py-2.5 px-4 shadow-xl hover:shadow-2xl hover:bg-red-50 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 group text-center uppercase tracking-wider">
                            <span>সরাসরি আপডেট দেখুন</span>
                            <ExternalLink size={15} className="text-[#d91616] group-hover:scale-110 transition-transform flex-shrink-0" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* LATEST NEWS & MOST READ COMPACT TABBED SECTION (Image 2 Exact Design & Behavior) */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col">
                    
                    {/* Top Tabs */}
                    <div className="grid grid-cols-2 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-center text-sm font-black">
                      <button
                        onClick={() => setSidebarTab('latest')}
                        className={`py-3.5 px-2 flex items-center justify-center gap-2 transition-all border-b-2 ${
                          sidebarTab === 'latest'
                            ? 'border-red-600 text-red-600 bg-white dark:bg-slate-900 shadow-sm'
                            : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400'
                        }`}
                      >
                        <span className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[11px] font-black shadow-sm">৩</span>
                        <span>সর্বশেষ সংবাদ</span>
                      </button>
                      
                      <button
                        onClick={() => setSidebarTab('mostRead')}
                        className={`py-3.5 px-2 flex items-center justify-center gap-2 transition-all border-b-2 ${
                          sidebarTab === 'mostRead'
                            ? 'border-red-600 text-red-600 bg-white dark:bg-slate-900 shadow-sm'
                            : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400'
                        }`}
                      >
                        <span className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[11px] font-black shadow-sm">৩</span>
                        <span>সর্বাধিক পঠিত</span>
                      </button>
                    </div>

                    {/* Compact Scrollable Feed (Auto shrunk height when live news is running) */}
                    <div className="max-h-[360px] overflow-y-auto custom-scrollbar p-4 space-y-4 divide-y divide-gray-100 dark:divide-slate-800">
                      {sidebarTab === 'latest' ? (
                        <>
                          <div className="pt-2 flex gap-4 items-start cursor-pointer group">
                            <span className="text-2xl font-black text-red-500 w-6 flex-shrink-0 text-center select-none">১</span>
                            <div className="space-y-1 flex-1">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                দুবাইয়ে আটক বেনজীরকে ফেরাতে ইউএইর প্রতিক্রিয়ার অপেক্ষায় সরকার
                              </h4>
                              <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                                <Clock size={11} />
                                <span>২৬ জুন ২০২৬ ৫:৬২ PM</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-4 flex gap-4 items-start cursor-pointer group">
                            <span className="text-2xl font-black text-amber-500 w-6 flex-shrink-0 text-center select-none">২</span>
                            <div className="space-y-1 flex-1">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                গরিবের হাতের টাকাই বাজার সচল রাখে: রেজা কিবরিয়া
                              </h4>
                              <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                                <Clock size={11} />
                                <span>২৬ জুন ২০২৬ ৫:৬৫ PM</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 flex gap-4 items-start cursor-pointer group">
                            <span className="text-2xl font-black text-blue-500 w-6 flex-shrink-0 text-center select-none">৩</span>
                            <div className="space-y-1 flex-1">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                চট্টগ্রামে সড়কে ঝরল জামায়াত নেতার প্রাণ
                              </h4>
                              <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                                <Clock size={11} />
                                <span>২৬ জুন ২০২৬ ৪:০৭ PM</span>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="pt-2 flex gap-4 items-start cursor-pointer group">
                            <span className="text-2xl font-black text-red-500 w-6 flex-shrink-0 text-center select-none">১</span>
                            <div className="space-y-1 flex-1">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                কোরআনের আয়াতের ব্যাখ্যা ঘিরে সংসদে তুমুল বিতর্ক
                              </h4>
                              <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                                <Clock size={11} />
                                <span>২৫ জুন ২০২৬ ৯:১৫ PM</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-4 flex gap-4 items-start cursor-pointer group">
                            <span className="text-2xl font-black text-amber-500 w-6 flex-shrink-0 text-center select-none">২</span>
                            <div className="space-y-1 flex-1">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                বিশ্বকাপ ফুটবলে ব্রাজিল ও আর্জেন্টিনার রোমাঞ্চকর লড়াইয়ের অপেক্ষা
                              </h4>
                              <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                                <Clock size={11} />
                                <span>২৬ জুন ২০২৬ ১২:৩০ PM</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-slate-800 text-center border-t border-gray-100 dark:border-slate-800 text-xs text-blue-600 dark:text-blue-400 font-bold cursor-pointer hover:underline">
                      আরও সংবাদ দেখুন
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
