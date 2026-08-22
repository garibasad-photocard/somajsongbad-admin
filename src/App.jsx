import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthProvider, AuthContext } from './context/AuthContext'
import { SettingsProvider, SettingsContext } from './context/SettingsContext'
import { WorkflowProvider } from './context/WorkflowContext'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import Sidebar from './components/Layout/Sidebar'
import Topbar from './components/Layout/Topbar'
import Dashboard from './pages/Dashboard'
import ArticleList from './pages/Articles/ArticleList'
import ArticleEditor from './pages/Articles/ArticleEditor'
import PhotoStoryList from './pages/Articles/PhotoStoryList'
import PhotoStoryEditor from './pages/Articles/PhotoStoryEditor'
import NationalDesk from './pages/Articles/NationalDesk'
import VideoUpload from './pages/Articles/VideoUpload'
import Users from './pages/Users'
import Media from './pages/Media'
import Login from './pages/Login'
import Settings from './pages/Settings'
import NewsSort from './pages/NewsSort'
import StaticPages from './pages/StaticPages'
import MasterData from './pages/MasterData'
import RssFeed from './pages/RssFeed'
import AssignmentBoard from './pages/Workflow/AssignmentBoard'
import MultimediaBoard from './pages/Workflow/MultimediaBoard'
import AssignmentDetail from './pages/Workflow/AssignmentDetail'
import VersionHistory from './pages/VersionHistory'
import PerformanceReports from './pages/PerformanceReports'
import BreakingNews from './pages/BreakingNews'
import HomepageBuilder from './pages/HomepageBuilder'
import AssignmentApproval from './pages/Workflow/AssignmentApproval'
import EditorialDesk from './pages/Workflow/EditorialDesk'
import OnlineNewsManagementDesk from './pages/Workflow/OnlineNewsManagementDesk'
import ProofreadingDesk from './pages/Workflow/ProofreadingDesk'
import OnlineProofDesk from './pages/Workflow/OnlineProofDesk'
import StoryPitchBoard from './pages/Workflow/StoryPitchBoard'
import DeadlineTracker from './pages/Workflow/DeadlineTracker'
import NewsTipPipeline from './pages/Workflow/NewsTipPipeline'
import MediaQC from './pages/MediaQC'
import LiveNews from './pages/LiveNews'
import EditorialCalendar from './pages/Workflow/EditorialCalendar'
import DepartmentQueue from './pages/Workflow/DepartmentQueue'
import MultimediaVideoUpload from './pages/Workflow/VideoUpload'
import HRManagement from './pages/HRManagement'
import MediaFlowLogo from './components/common/MediaFlowLogo'
import TrendingDashboard from './pages/Workflow/TrendingDashboard'
import NotificationToast from './components/common/NotificationToast'
import SpellChecker from './pages/Tools/SpellChecker'
import EmployeeMasterData from './pages/HR/EmployeeMasterData'
import HRDropdownSettings from './pages/HR/HRDropdownSettings'

// Research Pages
import ResearchDashboard from './pages/Research/ResearchDashboard'
import HistoricalSearch from './pages/Research/HistoricalSearch'
import NewsFeed from './pages/Research/NewsFeed'
import TrendAnalysis from './pages/Research/TrendAnalysis'
import AIAssistant from './pages/Research/AIAssistant'
import AITools from './pages/Research/AITools'
import FactChecker from './pages/Research/FactChecker'
import CompetitorMonitor from './pages/Research/CompetitorMonitor'
import StoryPlanner from './pages/Research/StoryPlanner'
import SavedResearch from './pages/Research/SavedResearch'
import KeywordAlerts from './pages/Research/KeywordAlerts'
import ResearchNotes from './pages/Research/ResearchNotes'
import NewsIntelligence from './pages/Research/NewsIntelligence'

function PrivateRoute({ children }) {
  const { user } = useContext(AuthContext)
  return user ? children : <Navigate to="/login" />
}

function HomeRoute() {
  const { user } = useContext(AuthContext)
  const { menuAccess } = useContext(SettingsContext)

  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'super_admin') return <Layout><Dashboard dashboardType="central" /></Layout>

  if (menuAccess && menuAccess[user.role]) {
    const access = menuAccess[user.role]
    if (access.includes('dashboard')) {
      const isMgmt = ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'executive_editor', 'hr_manager'].includes(user.role);
      return <Layout><Dashboard dashboardType={isMgmt ? "central" : undefined} /></Layout>;
    }
    if (access.includes('onlineDashboard')) return <Navigate to="/dashboard/online" replace />
    if (access.includes('multimediaDashboard')) return <Navigate to="/dashboard/multimedia" replace />
    if (access.includes('hrMyDashboard')) return <Navigate to="/hr-leaves/my-dashboard" replace />
    if (access.includes('workflowAll')) return <Navigate to="/workflow/all" replace />
  }

  return <Layout><Dashboard dashboardType="central" /></Layout>
}

function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      <Sidebar />
      <div className="flex flex-col flex-1 relative overflow-hidden">
        <Topbar />
        <main className="p-6 text-gray-900 dark:text-slate-100 relative min-h-full">
          {/* Background Watermark */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] dark:opacity-[0.02] z-0 overflow-hidden">
             <div className="w-[600px] h-[600px]">
               <MediaFlowLogo variant="vertical" className="w-full h-full grayscale" />
             </div>
          </div>
          <div className="relative z-10">
            {children}
          </div>
        </main>
        <NotificationToast />
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <SettingsProvider>
            <WorkflowProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />

                  <Route path="/" element={<HomeRoute />} />
                  <Route path="/dashboard/online" element={
                    <PrivateRoute><Layout><Dashboard dashboardType="online" /></Layout></PrivateRoute>
                  }/>
                  <Route path="/dashboard/multimedia" element={
                    <PrivateRoute><Layout><Dashboard dashboardType="multimedia" /></Layout></PrivateRoute>
                  }/>

                  {/* Articles */}
                  <Route path="/articles" element={
                    <PrivateRoute><Layout><ArticleList /></Layout></PrivateRoute>
                  }/>
                  <Route path="/national-desk" element={
                    <PrivateRoute><Layout><NationalDesk /></Layout></PrivateRoute>
                  }/>
                  <Route path="/articles/new" element={
                    <PrivateRoute><Layout><ArticleEditor /></Layout></PrivateRoute>
                  }/>
                  <Route path="/articles/edit/:id" element={
                    <PrivateRoute><Layout><ArticleEditor /></Layout></PrivateRoute>
                  }/>
                  <Route path="/photo-stories" element={
                    <PrivateRoute><Layout><PhotoStoryList /></Layout></PrivateRoute>
                  }/>
                  <Route path="/photo-stories/new" element={
                    <PrivateRoute><Layout><PhotoStoryEditor /></Layout></PrivateRoute>
                  }/>
                  <Route path="/photo-stories/edit/:id" element={
                    <PrivateRoute><Layout><PhotoStoryEditor /></Layout></PrivateRoute>
                  }/>
                  <Route path="/video-upload" element={
                    <PrivateRoute><Layout><VideoUpload /></Layout></PrivateRoute>
                  }/>
                  <Route path="/video-upload/edit/:id" element={
                    <PrivateRoute><Layout><VideoUpload /></Layout></PrivateRoute>
                  }/>
                  <Route path="/videos" element={
                    <PrivateRoute><Layout><ArticleList filterCategory="ভিডিও" /></Layout></PrivateRoute>
                  }/>

                  {/* Media */}
                  <Route path="/media" element={
                    <PrivateRoute><Layout><Media /></Layout></PrivateRoute>
                  }/>
                  <Route path="/media/qc" element={
                    <PrivateRoute><Layout><MediaQC /></Layout></PrivateRoute>
                  }/>

                  {/* Online Tools */}
                  <Route path="/breaking-news" element={
                    <PrivateRoute><Layout><BreakingNews /></Layout></PrivateRoute>
                  }/>
                  <Route path="/live-news" element={
                    <PrivateRoute><Layout><LiveNews /></Layout></PrivateRoute>
                  }/>
                  <Route path="/news-sort" element={
                    <PrivateRoute><Layout><NewsSort /></Layout></PrivateRoute>
                  }/>
                  <Route path="/homepage-builder" element={
                    <PrivateRoute><Layout><HomepageBuilder /></Layout></PrivateRoute>
                  }/>
                  <Route path="/rss" element={
                    <PrivateRoute><Layout><RssFeed /></Layout></PrivateRoute>
                  }/>

                  {/* Workflow — Online */}
                  <Route path="/workflow" element={
                    <PrivateRoute><Layout><AssignmentBoard defaultFilter="all" /></Layout></PrivateRoute>
                  }/>
                  <Route path="/workflow/trending" element={
                    <PrivateRoute><Layout><TrendingDashboard /></Layout></PrivateRoute>
                  }/>
                  <Route path="/workflow/all" element={
                    <PrivateRoute><Layout><AssignmentBoard defaultFilter="all" /></Layout></PrivateRoute>
                  }/>
                  <Route path="/workflow/online" element={
                    <PrivateRoute><Layout><AssignmentBoard editionFilter="online" /></Layout></PrivateRoute>
                  }/>
                  <Route path="/workflow/online-desk" element={
                    <PrivateRoute><Layout><OnlineNewsManagementDesk /></Layout></PrivateRoute>
                  }/>
                  <Route path="/workflow/online-proofreading" element={
                    <PrivateRoute><Layout><OnlineProofDesk /></Layout></PrivateRoute>
                  }/>

                  {/* Workflow — Multimedia */}
                  <Route path="/workflow/multimedia" element={
                    <PrivateRoute><Layout><MultimediaBoard /></Layout></PrivateRoute>
                  }/>
                  <Route path="/workflow/multimedia/create" element={
                    <PrivateRoute><Layout><MultimediaBoard /></Layout></PrivateRoute>
                  }/>
                  <Route path="/workflow/multimedia/upload" element={
                    <PrivateRoute><Layout><MultimediaVideoUpload /></Layout></PrivateRoute>
                  }/>

                  {/* Workflow — Shared */}
                  <Route path="/workflow/approval" element={
                    <PrivateRoute><Layout><AssignmentApproval /></Layout></PrivateRoute>
                  }/>
                  <Route path="/workflow/approval/online" element={
                    <PrivateRoute><Layout><AssignmentApproval editionFilter="online" /></Layout></PrivateRoute>
                  }/>
                  <Route path="/workflow/approval/multimedia" element={
                    <PrivateRoute><Layout><AssignmentApproval editionFilter="multimedia" /></Layout></PrivateRoute>
                  }/>
                  <Route path="/workflow/editorial-desk" element={
                    <PrivateRoute><Layout><EditorialDesk editionFilter="online" /></Layout></PrivateRoute>
                  }/>
                  <Route path="/workflow/proofreading" element={
                    <PrivateRoute><Layout><ProofreadingDesk editionFilter="online" /></Layout></PrivateRoute>
                  }/>
                  <Route path="/workflow/story-pitches" element={
                    <PrivateRoute><Layout><StoryPitchBoard /></Layout></PrivateRoute>
                  }/>
                  <Route path="/workflow/story-pitches/online" element={
                    <PrivateRoute><Layout><StoryPitchBoard editionFilter="online" /></Layout></PrivateRoute>
                  }/>
                  <Route path="/workflow/story-pitches/multimedia" element={
                    <PrivateRoute><Layout><StoryPitchBoard editionFilter="multimedia" /></Layout></PrivateRoute>
                  }/>
                  <Route path="/workflow/deadlines" element={
                    <PrivateRoute><Layout><DeadlineTracker /></Layout></PrivateRoute>
                  }/>
                  <Route path="/workflow/news-tips" element={
                    <PrivateRoute><Layout><NewsTipPipeline /></Layout></PrivateRoute>
                  }/>
                  <Route path="/workflow/calendar" element={
                    <PrivateRoute><Layout><EditorialCalendar /></Layout></PrivateRoute>
                  }/>
                  <Route path="/workflow/department-queue" element={
                    <PrivateRoute><Layout><DepartmentQueue /></Layout></PrivateRoute>
                  }/>
                  <Route path="/workflow/:id" element={
                    <PrivateRoute><Layout><AssignmentDetail /></Layout></PrivateRoute>
                  }/>

                  {/* HR */}
                  <Route path="/hr-leaves" element={
                    <Navigate to="/hr-leaves/my-dashboard" replace />
                  }/>
                  <Route path="/hr-leaves/:tabId" element={
                    <PrivateRoute><Layout><HRManagement /></Layout></PrivateRoute>
                  }/>
                  <Route path="/hr/employees" element={
                    <PrivateRoute><Layout><EmployeeMasterData /></Layout></PrivateRoute>
                  }/>
                  <Route path="/hr/dropdown-settings" element={
                    <PrivateRoute><Layout><HRDropdownSettings /></Layout></PrivateRoute>
                  }/>

                  {/* System */}
                  <Route path="/users" element={
                    <PrivateRoute><Layout><Users /></Layout></PrivateRoute>
                  }/>
                  <Route path="/settings" element={
                    <PrivateRoute><Layout><Settings /></Layout></PrivateRoute>
                  }/>
                  <Route path="/static-pages" element={
                    <PrivateRoute><Layout><StaticPages /></Layout></PrivateRoute>
                  }/>
                  <Route path="/master-data" element={
                    <PrivateRoute><Layout><MasterData /></Layout></PrivateRoute>
                  }/>
                  <Route path="/versions" element={
                    <PrivateRoute><Layout><VersionHistory /></Layout></PrivateRoute>
                  }/>
                  <Route path="/reports" element={
                    <PrivateRoute><Layout><PerformanceReports /></Layout></PrivateRoute>
                  }/>
                  <Route path="/tools/spellchecker" element={
                    <PrivateRoute><Layout><SpellChecker /></Layout></PrivateRoute>
                  }/>

                  {/* Research Module */}
                  <Route path="/research" element={<PrivateRoute><Layout><ResearchDashboard /></Layout></PrivateRoute>} />
                  <Route path="/research/archive" element={<PrivateRoute><Layout><HistoricalSearch /></Layout></PrivateRoute>} />
                  <Route path="/research/news-feed" element={<PrivateRoute><Layout><NewsFeed /></Layout></PrivateRoute>} />
                  <Route path="/research/trends" element={<PrivateRoute><Layout><TrendAnalysis /></Layout></PrivateRoute>} />
                  <Route path="/research/ai" element={<PrivateRoute><Layout><AIAssistant /></Layout></PrivateRoute>} />
                  <Route path="/research/ai-tools" element={<PrivateRoute><Layout><AITools /></Layout></PrivateRoute>} />
                  <Route path="/research/fact-checker" element={<PrivateRoute><Layout><FactChecker /></Layout></PrivateRoute>} />
                  <Route path="/research/competitor-monitor" element={<PrivateRoute><Layout><CompetitorMonitor /></Layout></PrivateRoute>} />
                  <Route path="/research/planner" element={<PrivateRoute><Layout><StoryPlanner /></Layout></PrivateRoute>} />
                  <Route path="/research/saved" element={<PrivateRoute><Layout><SavedResearch /></Layout></PrivateRoute>} />
                  <Route path="/research/alerts" element={<PrivateRoute><Layout><KeywordAlerts /></Layout></PrivateRoute>} />
                  <Route path="/research/notes" element={<PrivateRoute><Layout><ResearchNotes /></Layout></PrivateRoute>} />
                  <Route path="/research/intelligence" element={<PrivateRoute><Layout><NewsIntelligence /></Layout></PrivateRoute>} />
                </Routes>
              </BrowserRouter>
            </WorkflowProvider>
          </SettingsProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
