import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useContext, useState, useEffect, useRef } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { 
  BarChart2, LayoutTemplate, Link as LinkIcon, Settings, UserPlus, 
  Users, Search, FileText, Shield, Calendar,
  Clock, PlaySquare, Printer,
  Newspaper, Plus, Tag, Layout,
  Image, Video, MonitorPlay, Radio, BookOpen, Monitor, List, Briefcase, Truck, Calculator, Box,
  LayoutDashboard, LogOut, ArrowUpDown, ClipboardList, Database,
  Rss, History, TrendingUp, ChevronDown, ChevronUp, ChevronRight, Globe, RotateCcw,
  GripVertical, Palette, CheckCircle, Lightbulb, UploadCloud, LayoutList, Star, UserCircle, Archive, Coffee, AlignLeft, Film, Cpu, SpellCheck, PlayCircle, Landmark, Wrench, MessageSquare
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useSettings } from '../../context/SettingsContext'
import MediaFlowLogo from '../common/MediaFlowLogo'

// ─── নতুন ERP মডিউল ──────────────────────────────────────────────────
const ERP_MODULES = {
  sales: {
    label: 'সেলস ও মার্কেটিং',
    icon: Briefcase,
    color: 'text-emerald-500',
    items: [
      { to: '/sales/dashboard', key: 'salesDashboard', label: 'সেলস ড্যাশবোর্ড', icon: Monitor, roles: ['sales_manager', 'sales_rep', 'super_admin', 'admin', 'managing_editor'] },
      { key: 'crmGroup', label: 'CRM (লিড ও প্রপোজাল)', icon: Users, roles: ['sales_manager', 'sales_rep', 'super_admin', 'admin', 'managing_editor'], subItems: [
        { to: '/sales/crm/leads', key: 'crmLeads', label: 'লিড ম্যানেজমেন্ট' },
        { to: '/sales/crm/proposals', key: 'crmProposals', label: 'প্রপোজাল ও কোটেশন' }
      ]},
      { key: 'adSalesGroup', label: 'অ্যাড সেলস ও বুকিং', icon: LayoutTemplate, roles: ['sales_manager', 'sales_rep', 'super_admin', 'admin', 'managing_editor'], subItems: [
        { to: '/sales/ad-booking/new', key: 'salesAdNew', label: 'নতুন বিজ্ঞাপন বুকিং' },
        { to: '/sales/ad-booking', key: 'salesAdList', label: 'বিজ্ঞাপন বুকিং লিস্ট' }
      ]},
      { key: 'billingGroup', label: 'বিলিং ও কালেকশন', icon: Calculator, roles: ['sales_manager', 'sales_rep', 'super_admin', 'admin', 'managing_editor', 'accountant'], subItems: [
        { to: '/sales/invoices', key: 'salesInvoices', label: 'ইনভয়েস ও বিলিং' },
        { to: '/sales/collection/new', key: 'salesColNew', label: 'কালেকশন এন্ট্রি (MR)' },
        { to: '/sales/collection', key: 'salesColList', label: 'কালেকশন তালিকা' }
      ]},
      { key: 'agencyGroup', label: 'এজেন্সি ও কন্ট্রাক্ট', icon: FileText, roles: ['sales_manager', 'sales_rep', 'super_admin', 'admin', 'managing_editor'], subItems: [
        { to: '/sales/agencies', key: 'salesAgencies', label: 'এজেন্সি ম্যানেজমেন্ট' },
        { to: '/sales/contracts', key: 'salesContracts', label: 'কন্ট্রাক্ট ম্যানেজমেন্ট' }
      ]},
      { key: 'marketingGroup', label: 'মার্কেটিং ও ক্যাম্পেইন', icon: Tag, roles: ['sales_manager', 'super_admin', 'admin', 'managing_editor'], subItems: [
        { to: '/sales/marketing/campaigns', key: 'marketingCampaigns', label: 'অ্যাড ক্যাম্পেইন' },
        { to: '/sales/marketing/hub', key: 'marketingHub', label: 'ইমেইল মার্কেটিং' },
        { to: '/sales/marketing/partnerships', key: 'marketingPartnerships', label: 'ব্র্যান্ড পার্টনারশিপ' }
      ]},
      { key: 'supportGroup', label: 'কাস্টমার সাপোর্ট', icon: MessageSquare, roles: ['sales_manager', 'sales_rep', 'super_admin', 'admin', 'managing_editor'], subItems: [
        { to: '/sales/support', key: 'supportTickets', label: 'সাপোর্ট টিকিটস' }
      ]},
      { key: 'salesReportsSub', label: 'রিপোর্ট ও অ্যানালিটিক্স', icon: BarChart2, roles: ['sales_manager', 'super_admin', 'admin', 'managing_editor'], subItems: [
        { to: '/sales/reports/daily', key: 'salesReportDaily', label: 'ডেইলী সেলস রিপোর্ট' },
        { to: '/sales/reports/custom', key: 'salesReportCustom', label: 'কাস্টম রিপোর্ট' },
        { to: '/sales/reports/aging', key: 'salesReportAging', label: 'এজিং রিপোর্ট (বকেয়া)' },
        { to: '/sales/reports/performance', key: 'salesReportPerformance', label: 'এক্সিকিউটিভ পারফরম্যান্স' },
      ]}
    ]
  },
  circulation: {
    label: 'সার্কুলেশন (শিগগিরই)',
    icon: Truck,
    color: 'text-indigo-500',
    items: []
  },
  accounts: {
    label: 'Accounts & Finance',
    icon: Calculator,
    color: 'text-amber-500',
    items: [
      {
        key: 'finance_core_group',
        label: 'Core Finance',
        icon: Landmark,
        roles: ['super_admin', 'admin', 'managing_editor', 'accountant'],
        subItems: [
          { to: '/finance/finance-dashboard', key: 'cfoDashboard', label: 'CFO Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'managing_editor', 'accountant'] },
          { to: '/finance/journal-voucher', key: 'jv', label: 'Journal Voucher', icon: FileText, roles: ['super_admin', 'admin', 'accountant'] },
          { to: '/finance/voucher-approvals', key: 'jvApprovals', label: 'Voucher Approvals', icon: CheckCircle, roles: ['super_admin', 'admin', 'accountant'] },
        ]
      },
      {
        key: 'finance_payables_group',
        label: 'Payables & Receivables',
        icon: Calculator,
        roles: ['super_admin', 'admin', 'accountant'],
        subItems: [
          { to: '/finance/invoices', key: 'invoices', label: 'Invoices', icon: FileText, roles: ['super_admin', 'admin', 'accountant'] },
          { to: '/finance/expenses', key: 'expenses', label: 'Expenses', icon: Calculator, roles: ['super_admin', 'admin', 'accountant'] },
          { to: '/finance/petty-cash', key: 'pettyCash', label: 'Petty Cash', icon: Calculator, roles: ['super_admin', 'admin', 'accountant'] },
        ]
      },
      {
        key: 'finance_reports_group',
        label: 'Finance Reports',
        icon: BarChart2,
        roles: ['super_admin', 'admin', 'accountant'],
        subItems: [
          { to: '/finance/general-ledger', key: 'gl', label: 'General Ledger', icon: BarChart2, roles: ['super_admin', 'admin', 'accountant'] },
          { to: '/finance/trial-balance', key: 'tb', label: 'Trial Balance', icon: BarChart2, roles: ['super_admin', 'admin', 'accountant'] },
          { to: '/finance/income-statement', key: 'is', label: 'Income Statement', icon: BarChart2, roles: ['super_admin', 'admin', 'accountant'] },
          { to: '/finance/balance-sheet', key: 'bs', label: 'Balance Sheet', icon: BarChart2, roles: ['super_admin', 'admin', 'accountant'] },
          { to: '/finance/tax-report', key: 'taxReport', label: 'Tax Report', icon: Shield, roles: ['super_admin', 'admin', 'accountant'] },
        ]
      },
      {
        key: 'finance_master_data_group',
        label: 'Finance Master Data',
        icon: Database,
        roles: ['super_admin', 'admin', 'accountant'],
        subItems: [
          { to: '/finance/chart-of-accounts', key: 'coa', label: 'Chart of Accounts', icon: BookOpen, roles: ['super_admin', 'admin', 'accountant'] },
          { to: '/finance/vendors', key: 'vendors', label: 'Vendor List', icon: Users, roles: ['super_admin', 'admin', 'accountant'] },
          { to: '/finance/cost-centers', key: 'costCenters', label: 'Cost Centers', icon: Database, roles: ['super_admin', 'admin', 'accountant'] },
        ]
      }
    ]
  },
  finance_payables: {
    label: 'Payables & Receivables',
    icon: Calculator,
    color: 'text-orange-500',
    items: [
      { to: '/finance/invoices', key: 'invoices', label: 'Invoices', icon: FileText, roles: ['super_admin', 'admin', 'accountant'] },
      { to: '/finance/expenses', key: 'expenses', label: 'Expenses', icon: Calculator, roles: ['super_admin', 'admin', 'accountant'] },
      { to: '/finance/petty-cash', key: 'pettyCash', label: 'Petty Cash', icon: Calculator, roles: ['super_admin', 'admin', 'accountant'] },
    ]
  },
  finance_reports: {
    label: 'Finance Reports',
    icon: BarChart2,
    color: 'text-indigo-500',
    items: [
      { to: '/finance/general-ledger', key: 'gl', label: 'General Ledger', icon: BarChart2, roles: ['super_admin', 'admin', 'accountant'] },
      { to: '/finance/trial-balance', key: 'tb', label: 'Trial Balance', icon: BarChart2, roles: ['super_admin', 'admin', 'accountant'] },
      { to: '/finance/income-statement', key: 'is', label: 'Income Statement', icon: BarChart2, roles: ['super_admin', 'admin', 'accountant'] },
      { to: '/finance/balance-sheet', key: 'bs', label: 'Balance Sheet', icon: BarChart2, roles: ['super_admin', 'admin', 'accountant'] },
      { to: '/finance/tax-report', key: 'taxReport', label: 'Tax Report', icon: Shield, roles: ['super_admin', 'admin', 'accountant'] },
    ]
  },
  inventory: {
    label: 'Asset & Inventory',
    icon: Box,
    color: 'text-rose-500',
    items: [
      {
        key: 'inventory_assets_group',
        label: 'Asset Management',
        icon: Box,
        roles: ['super_admin', 'admin', 'accountant', 'inventory_manager'],
        subItems: [
          { to: '/finance/assets/dashboard', key: 'assetsDash', label: 'Dashboard', icon: BarChart2, roles: ['super_admin', 'admin', 'accountant', 'inventory_manager'] },
          { to: '/finance/assets/directory', key: 'assetsDir', label: 'Asset Directory', icon: Box, roles: ['super_admin', 'admin', 'accountant', 'inventory_manager'] },
          { to: '/finance/assets/allocations', key: 'assetsAlloc', label: 'Allocations', icon: CheckCircle, roles: ['super_admin', 'admin', 'accountant', 'inventory_manager'] },
          { to: '/finance/assets/maintenance', key: 'assetsMaint', label: 'Maintenance', icon: Wrench, roles: ['super_admin', 'admin', 'accountant', 'inventory_manager'] },
        ]
      },
      { to: '/finance/fixed-assets', key: 'fixedAssets', label: 'Fixed Assets Register', icon: Box, roles: ['super_admin', 'admin', 'accountant', 'inventory_manager'] }
    ]
  }
}

// ─── রোল অনুযায়ী মেনু এক্সেস ───────────────────────────────────────
const ROLE_ACCESS = {
  super_admin: ['analytics', 'news', 'edition', 'live', 'multimedia', 'ePaper', 'epaper2', 'production', 'broadcast', 'sales', 'circulation', 'accounts', 'inventory', 'hr', 'settings'],
  admin: ['analytics', 'news', 'edition', 'live', 'multimedia', 'ePaper', 'epaper2', 'production', 'broadcast', 'sales', 'circulation', 'accounts', 'inventory', 'hr', 'settings'],
  managing_editor: ['analytics', 'news', 'edition', 'live', 'production', 'broadcast', 'sales', 'circulation', 'accounts', 'inventory', 'settings'],
  chief_editor: ['analytics', 'news', 'edition', 'live', 'broadcast'],
  editor: ['news', 'edition', 'live', 'broadcast'],
  reporter: ['news'],
  sales_manager: ['sales'],
  sales_rep: ['sales'],
  circulation_manager: ['circulation'],
  accountant: ['accounts'],
  inventory_manager: ['inventory']
}

// ─── মেনু ডেটা ────────────────────────────────────────────────────

const hrItems = [
  { to: '/hr/employees', key: 'hrEmployees', icon: Users, label: 'Employee Master Data', desc: 'এইচআর মাস্টার ডেটা', roles: ['super_admin', 'admin', 'managing_editor', 'hr_manager'] },
  { to: '/hr/dropdown-settings', key: 'hrDropdownSettings', icon: Settings, label: 'HR Dropdown Settings', desc: 'এইচআর ড্রপডাউন অপশন', roles: ['super_admin', 'admin', 'managing_editor', 'hr_manager'] },
  { to: '/hr-leaves/my-dashboard', key: 'hrMyDashboard', icon: TrendingUp, label: 'আমার ড্যাশবোর্ড', desc: 'আমার ব্যক্তিগত ড্যাশবোর্ড', roles: [] },
  { to: '/hr-leaves/my-leaves', key: 'hrMyLeaves', icon: Calendar, label: 'লিভ আবেদন', desc: 'ছুটির আবেদন ও স্ট্যাটাস', roles: [] },
  { to: '/hr-leaves/leave-approvals', key: 'hrLeaveApprovals', icon: CheckCircle, label: 'ছুটি অনুমোদন', desc: 'ছুটি অনুমোদন করুন (এডিটরদের জন্য)', roles: ['reporter', 'sub_editor', 'editor', 'chief_editor', 'managing_editor', 'admin', 'super_admin', 'chief_reporter', 'desk_editor', 'news_manager', 'executive_editor'] },
  { to: '/hr-leaves/attendance-report', key: 'hrAttendanceReport', icon: List, label: 'উপস্থিতি রিপোর্ট', desc: 'উপস্থিতি রিপোর্ট', roles: ['reporter', 'sub_editor', 'editor', 'chief_editor', 'managing_editor', 'admin', 'super_admin', 'chief_reporter', 'desk_editor', 'news_manager', 'executive_editor'] },
  { to: '/hr-leaves/top-management', key: 'hrTopManagement', icon: UserPlus, label: 'ডিপার্টমেন্ট বোর্ড', desc: 'ডিপার্টমেন্ট ও ম্যানেজমেন্ট', roles: ['reporter', 'sub_editor', 'editor', 'chief_editor', 'managing_editor', 'admin', 'super_admin', 'chief_reporter', 'desk_editor', 'news_manager', 'executive_editor'] },
  { to: '/hr-leaves/shifts', key: 'hrShifts', icon: Clock, label: 'ডিউটি শিফট', desc: 'ডিউটি শিফট ম্যানেজমেন্ট', roles: ['super_admin', 'admin', 'managing_editor', 'hr_manager'] },
  { to: '/hr-leaves/shift-calendar', key: 'hrShiftCalendar', icon: Calendar, label: 'শিফট ক্যালেন্ডার', desc: 'শিফট ক্যালেন্ডার', roles: ['super_admin', 'admin', 'managing_editor', 'hr_manager'] },
  { to: '/hr-leaves/custom-leaves', key: 'hrCustomLeaves', icon: Calendar, label: 'কাস্টম ছুটি', desc: 'কাস্টম ছুটি সেটিংস', roles: ['super_admin', 'admin', 'managing_editor', 'hr_manager'] },
  { to: '/hr-leaves/special-days', key: 'hrSpecialDays', icon: Star, label: 'বিশেষ দিবস', desc: 'বিশেষ দিবস সেটিংস', roles: ['super_admin', 'admin', 'managing_editor', 'hr_manager'] },
  { to: '/hr-leaves/master-data', key: 'hrMasterData', icon: Settings, label: 'মাস্টার ডেটা', desc: 'মাস্টার ডেটা', roles: ['super_admin', 'admin', 'managing_editor', 'hr_manager'] },
]

const newsItems = [
  { to: '/',         key: 'dashboard', icon: LayoutDashboard, label: 'ড্যাশবোর্ড', desc: 'ড্যাশবোর্ডের মূল পাতা', roles: [] },
  { to: '/workflow/all',      key: 'workflowAll',      icon: ClipboardList, label: 'অ্যাসাইনমেন্ট বোর্ড', desc: 'সব অ্যাসাইনমেন্ট এক জায়গায়', roles: ['reporter', 'sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/workflow/story-pitches', key: 'storyPitches', icon: FileText, label: 'স্টোরি পিচ বোর্ড', desc: 'স্টোরি আইডিয়া বা পিচ জমা দিন', roles: ['reporter', 'sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/workflow/news-tips', key: 'newsTipPipeline', icon: Radio, label: 'উড়তি খবর (News Tip)', desc: 'উড়তি খবরের পাইপলাইন', roles: ['reporter', 'sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/workflow/deadlines', key: 'deadlineTracker', icon: Clock, label: 'ডেডলাইন ট্র্যাকার', desc: 'অ্যাসাইনমেন্টের ডেডলাইন ট্র্যাক করুন', roles: ['reporter', 'sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/workflow/calendar',  key: 'editorialCalendar', icon: Calendar, label: 'এডিটরিয়াল ক্যালেন্ডার', desc: 'এডিটরিয়াল ক্যালেন্ডার', roles: ['reporter', 'sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/reports',           key: 'reports',          icon: TrendingUp,    label: 'পারফরম্যান্স রিপোর্ট', desc: 'পারফরম্যান্স ও কাজের রিপোর্ট', roles: ['reporter', 'sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/versions',          key: 'versions',         icon: History,       label: 'ভার্সন হিস্ট্রি', desc: 'নিউজ ভার্সন হিস্ট্রি', roles: ['reporter', 'sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/media',            key: 'media',            icon: Image,           label: 'মিডিয়া লাইব্রেরি', desc: 'ছবি ও ভিডিও লাইব্রেরি', roles: ['reporter', 'sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/media/qc',         key: 'mediaQc',          icon: Image,           label: 'মিডিয়া QC', desc: 'মিডিয়া কোয়ালিটি কন্ট্রোল', roles: ['sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'], badge: '3' },
]

const systemItems = [
  { to: '/master-data',       key: 'masterData',       icon: Database,      label: 'মাস্টার ডেটা', desc: 'সিস্টেমের মাস্টার ডেটা', roles: ['super_admin', 'admin', 'managing_editor'] },
  { to: '/sales/setup',       key: 'salesSetup',       icon: Database,      label: 'সেলস মাস্টার ডাটা', desc: 'সেলস ও মার্কেটিং সেটআপ', roles: ['super_admin', 'sales_manager'] },
  { to: '/users',             key: 'users',            icon: Users,         label: 'ব্যবহারকারী', desc: 'ব্যবহারকারী ম্যানেজমেন্ট', roles: ['super_admin', 'admin', 'managing_editor'] },
  { to: '/sales/users',       key: 'salesUsers',       icon: UserCircle,    label: 'সেলস ইউজার', desc: 'সেলস ইউজার ম্যানেজমেন্ট', roles: ['super_admin', 'sales_manager'] },
  { to: '/settings',          key: 'settings',         icon: Settings,      label: 'সেটিংস', desc: 'সিস্টেম সেটিংস', roles: ['super_admin', 'admin', 'managing_editor'] },
  { to: '/tools/spellchecker', key: 'spellchecker', icon: SpellCheck, label: 'বানান পরীক্ষক', desc: 'বাংলা বানান চেক করুন', roles: [] },
]

const onlineItems = [
  { to: '/dashboard/online',                 key: 'onlineDashboard', icon: LayoutDashboard, label: 'ড্যাশবোর্ড (অনলাইন)', desc: 'অনলাইন ডেস্ক ড্যাশবোর্ড', roles: ['reporter', 'sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/workflow/trending',         key: 'onlineTrending', icon: TrendingUp, label: 'ট্রেন্ডিং টপিক রাডার', desc: 'গুগল ট্রেন্ডস ও ভাইরাল টপিক', roles: ['editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/workflow/story-pitches/online', key: 'onlinePitches', icon: Lightbulb, label: 'স্টোরি পিচ এপ্রুভাল (অনলাইন)', desc: 'অনলাইন ডেস্কের জন্য স্টোরি পিচ এপ্রুভাল', roles: ['editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/workflow/approval/online', key: 'onlineApproval',  icon: CheckCircle,   label: 'অ্যাসাইনমেন্ট অনুমোদন (অনলাইন)', desc: 'অনলাইনের জন্য অ্যাসাইনমেন্ট অনুমোদন', roles: ['editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/workflow/online',          key: 'onlineWorkflow',  icon: ClipboardList, label: 'অনলাইন অ্যাসাইনমেন্ট বোর্ড', desc: 'অনলাইনের সব অ্যাসাইনমেন্ট বোর্ড', roles: ['reporter', 'sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/workflow/department-queue',   key: 'departmentQueue',  icon: Users,            label: 'ডিপার্টমেন্ট কিউ',               desc: 'রিপোর্টারদের কাজ যাচাই করার ডেস্ক',       roles: ['sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/articles',         key: 'articles',        icon: FileText,        label: 'অনলাইন আর্টিকেল লিস্ট', desc: 'অনলাইন আর্টিকেলের তালিকা', roles: ['reporter', 'sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/photo-stories',    key: 'photoStories',    icon: Image,           label: 'সকল ফটোস্টোরি', desc: 'ফটোস্টোরির তালিকা', roles: ['reporter', 'sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/photo-stories/new',key: 'newPhotoStory',   icon: Plus,            label: 'নতুন ফটোস্টোরি', desc: 'নতুন ফটোস্টোরি তৈরি করুন', roles: ['reporter', 'sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/rss',              key: 'rss',              icon: Rss,             label: 'এআই নিউজ ফিড', desc: 'এআই ও আরএসএস নিউজ ফিড', roles: ['reporter', 'sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/breaking-news',    key: 'breakingNews',     icon: Radio,           label: 'ব্রেকিং নিউজ', desc: 'ব্রেকিং নিউজ আপডেট', roles: ['reporter', 'sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/live-news',        key: 'liveNews',         icon: Radio,           label: 'লাইভ নিউজ', desc: 'লাইভ নিউজ আপডেট', roles: ['reporter', 'sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/national-desk',    key: 'nationalDesk',     icon: Globe,           label: 'জাতীয়/ব্যুরো ডেস্ক', desc: 'মফস্বল ও ব্যুরো নিউজ পরিচালনা', roles: ['reporter', 'sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin'] },
  { to: '/workflow/online-desk',     key: 'onlineEditorialDesk', icon: Newspaper, label: 'অনলাইন নিউজ ম্যানেজমেন্ট ডেস্ক', desc: 'অনলাইনের নিউজ সম্পাদনার ডেস্ক', roles: ['sub_editor', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin'] },
  { to: '/workflow/online-proofreading', key: 'onlineProofreading', icon: CheckCircle, label: 'অনলাইন প্রুফ ডেস্ক', desc: 'অনলাইনের জন্য প্রুফ রিডিং', roles: ['proof_reader', 'sub_editor', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/homepage-builder', key: 'homepageBuilder',  icon: LayoutDashboard, label: 'হোমপেজ বিল্ডার', desc: 'হোমপেজ লেআউট সাজান', roles: ['desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/news-sort',        key: 'newsSort',         icon: ArrowUpDown,     label: 'নিউজ সাজান', desc: 'নিউজ সাজানোর তালিকা', roles: ['reporter', 'sub_editor', 'proof_reader', 'desk_editor', 'editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin', 'chief_reporter'] },
  { to: '/ad-settings',      key: 'adSettings',       icon: LinkIcon,        label: 'বিজ্ঞাপন সেটিংস', desc: 'বিজ্ঞাপন সেটিংস', roles: ['editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin'] },
  { to: '/static-pages',     key: 'staticPages',      icon: FileText,        label: 'স্ট্যাটিক পেজ', desc: 'স্ট্যাটিক পেজ ম্যানেজমেন্ট', roles: ['editor', 'chief_editor', 'managing_editor', 'executive_editor', 'news_manager', 'admin', 'super_admin'] },
]

const printItems = [
  // ── ওভারভিউ ──────────────────────────────────────────────────────────────
  { to: '/dashboard/print',             key: 'printDashboard',   icon: LayoutDashboard, label: 'ড্যাশবোর্ড (প্রিন্ট)',          desc: 'প্রিন্ট ডেস্ক ড্যাশবোর্ড',                    roles: ['super_admin', 'admin', 'managing_editor', 'executive_editor', 'chief_editor', 'news_manager'] },
  { to: '/workflow/print-dashboard',    key: 'printWfDashboard', icon: BarChart2,        label: '🆕 ওয়ার্কফ্লো ড্যাশবোর্ড',        desc: 'সব স্টেজের রিয়েল-টাইম ওভারভিউ',               roles: ['super_admin'] },
  { to: '/workflow/print-rundown',      key: 'printRundown',     icon: LayoutList,       label: 'অটো-রানশিট (প্রিন্ট)',           desc: 'প্রিন্ট মিটিংয়ের জন্য অটোমেটেড রানশিট',        roles: ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'editor', 'chief_reporter', 'desk_editor', 'news_manager'] },
  { to: '/workflow/print',              key: 'printWorkflow',    icon: ClipboardList,    label: 'প্রিন্ট অ্যাসাইনমেন্ট বোর্ড',    desc: 'প্রিন্টের কাজগুলোর স্ট্যাটাস',                 roles: ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'chief_reporter', 'desk_editor', 'news_manager', 'executive_editor', 'page_editor', 'reporter'] },
  // ── স্টোরি পিচ ───────────────────────────────────────────────────────────
  { to: '/workflow/story-pitches/print',key: 'printPitches',     icon: Lightbulb,        label: 'স্টোরি পিচ এপ্রুভাল (প্রিন্ট)',  desc: 'প্রিন্ট ডেস্কের জন্য স্টোরি পিচ এপ্রুভাল',     roles: ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'chief_reporter', 'desk_editor', 'news_manager'] },
  // ── ডিপার্টমেন্ট স্তর ────────────────────────────────────────────────────
  { to: '/workflow/department-queue',   key: 'departmentQueue',  icon: Users,            label: 'ডিপার্টমেন্ট কিউ',               desc: 'রিপোর্টারের জমা দেওয়া নিউজ রিভিউ করুন',         roles: ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'chief_reporter', 'desk_editor', 'editor'] },
  { to: '/workflow/approval/print',     key: 'printApproval',    icon: CheckCircle,      label: 'প্রিন্ট অ্যাসাইনমেন্ট এপ্রুভাল', desc: 'রিপোর্টারদের জমা দেওয়া প্রিন্টের নিউজ এপ্রুভ', roles: ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'chief_reporter', 'desk_editor', 'editor'] },
  // ── নিউজ ম্যানেজমেন্ট স্তর ──────────────────────────────────────────────
  { to: '/workflow/nm-desk',     key: 'editorialDesk',    icon: Newspaper,        label: 'এডিটরিয়াল ডেস্ক (NM)',          desc: 'Copy Editing, Headline, Page Planning',          roles: ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'news_manager', 'sub_editor', 'editor'] },
  // ── প্রুফ ডেস্ক স্তর ─────────────────────────────────────────────────────
  { to: '/workflow/print-proof',       key: 'proofreadingDesk', icon: CheckCircle,      label: 'প্রুফ রিডিং ডেস্ক',              desc: 'প্রুফ রিডারদের জন্য ডেডিকেটেড ডেস্ক',          roles: ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'news_manager', 'proof_reader', 'sub_editor'] },
  // ── পেজ ডেস্ক স্তর ───────────────────────────────────────────────────────
  { to: '/workflow/page-desk',          key: 'pageDeskQueue',    icon: Layout,           label: 'পেজ ডেস্ক কিউ',                  desc: 'পেজ মেকআপ ও এক্সিকিউটিভ রিভিউ',                roles: ['super_admin', 'admin', 'managing_editor', 'executive_editor', 'chief_editor', 'page_editor', 'page_makeup_artist'] },
  { to: '/print-layout-builder',        key: 'printLayout',      icon: BookOpen,         label: 'প্রিন্ট পেজ মেকআপ',              desc: 'পেজ সাজানোর জায়গা',                             roles: ['super_admin', 'admin', 'managing_editor', 'executive_editor', 'chief_editor', 'page_editor', 'page_makeup_artist', 'news_manager'] },
  { to: '/indesign',                    key: 'indesignHub',      icon: Palette,          label: '🎨 InDesign Hub',                 desc: 'মেকআপ ট্র্যাক করার জায়গা',                     roles: ['super_admin', 'admin', 'managing_editor', 'executive_editor', 'chief_editor', 'page_editor', 'page_makeup_artist'] },
  // ── অ্যাডমিন / পাবলিশ স্তর ───────────────────────────────────────────────
  { to: '/print/articles',              key: 'printArticles',    icon: FileText,         label: 'প্রিন্ট আর্টিকেল লিস্ট',         desc: 'প্রিন্টের আর্টিকেলের তালিকা',                  roles: ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'executive_editor', 'news_manager'] },
  { to: '/print/hold-tray',             key: 'printHoldTray',    icon: Database,         label: '📥 প্রিন্ট হোল্ড ট্রে',            desc: 'প্রিন্ট এডিটরদের অনুমোদিত নিউজগুলো',           roles: ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'news_manager', 'executive_editor'] },
  { to: '/print/export',                key: 'printExport',      icon: Printer,          label: 'PDF হাব',                         desc: 'পিডিএফ হাব প্যানেল',                            roles: ['super_admin', 'admin', 'managing_editor', 'executive_editor', 'chief_editor'] },
  { to: '/print/epaper',                key: 'epaperManage',     icon: Globe,            label: 'ই-পেপার ম্যানেজমেন্ট',            desc: 'ই-পেপার আপলোড ও তৈরি করুন',                    roles: ['super_admin', 'admin', 'managing_editor', 'executive_editor'] },
  { to: '/print/ads',                   key: 'printAds',         icon: LinkIcon,         label: 'বিজ্ঞাপন (Ads)',                  desc: 'প্রিন্ট পত্রিকার বিজ্ঞাপন বুকিং ও ব্যবস্থাপনা', roles: ['super_admin', 'admin', 'managing_editor', 'executive_editor', 'chief_editor'] },
]

const multimediaItems = [
  { to: '/dashboard/multimedia',                 key: 'multimediaDashboard', icon: LayoutDashboard, label: 'ড্যাশবোর্ড (মাল্টিমিডিয়া)', desc: 'মাল্টিমিডিয়া ডেস্ক ড্যাশবোর্ড', roles: [] },
  { to: '/workflow/story-pitches/multimedia', key: 'multimediaPitches', icon: Lightbulb, label: 'স্টোরি পিচ এপ্রুভাল (মাল্টিমিডিয়া)', desc: 'মাল্টিমিডিয়া ডেস্কের জন্য স্টোরি পিচ এপ্রুভাল', roles: ['chief_editor', 'editor'] },
  { to: '/workflow/approval/multimedia', key: 'multimediaApproval',  icon: CheckCircle,   label: 'অ্যাসাইনমেন্ট অনুমোদন (মাল্টিমিডিয়া)', desc: 'মাল্টিমিডিয়ার জন্য অ্যাসাইনমেন্ট অনুমোদন', roles: ['chief_editor', 'editor'] },
  { to: '/workflow/multimedia',          key: 'multimediaWorkflow',  icon: ClipboardList, label: 'মাল্টিমিডিয়া অ্যাসাইনমেন্ট বোর্ড', desc: 'মাল্টিমিডিয়ার সব অ্যাসাইনমেন্ট বোর্ড', roles: [] },
  { to: '/workflow/multimedia/upload',   key: 'videoUpload',      icon: UploadCloud,     label: 'ভিডিও আপলোড', desc: 'লোকাল সার্ভার থেকে ভিডিও আপলোড', roles: [] },
  { to: '/videos',           key: 'videoList',        icon: Video,           label: 'ভিডিও লিস্ট', desc: 'ভিডিও কন্টেন্টের তালিকা', roles: [] },
]

const broadcastItems = [
  { to: '/broadcast',              key: 'broadcastDashboard', icon: LayoutDashboard, label: 'ড্যাশবোর্ড (ব্রডকাস্ট)', desc: 'স্মার্ট ব্রডকাস্ট ড্যাশবোর্ড', roles: ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'editor', 'reporter'] },
  { to: '/broadcast/assignment',   key: 'broadcastAssignment',icon: ClipboardList,label: '📝 প্ল্যানিং ও অ্যাসাইনমেন্ট', desc: 'নিউজ স্টোরি অ্যাসাইনমেন্ট তৈরি', roles: ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'editor', 'reporter'] },
  { to: '/broadcast/live',         key: 'broadcastLive',     icon: MonitorPlay, label: '🔴 লাইভ কন্ট্রোল',     desc: 'চ্যানেলের লাইভ সম্প্রচার নিয়ন্ত্রণ', roles: ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'editor'] },
  { to: '/broadcast/rundown',      key: 'broadcastRundown',  icon: LayoutList,  label: 'Rundown এডিটর',      desc: 'সম্প্রচারের Cue Sheet তৈরি ও সম্পাদনা', roles: ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'editor', 'reporter'] },
  { to: '/broadcast/ai',           key: 'broadcastAI',       icon: Coffee,      label: '🤖 AI News Desk',    desc: 'অটো স্ক্রিপ্ট ও নিউজ জেনারেশন',      roles: ['super_admin', 'admin', 'managing_editor', 'editor', 'reporter'] },
  { to: '/broadcast/teleprompter', key: 'broadcastPrompter', icon: AlignLeft,   label: '🎙️ টেলিকিউ / প্রম্পটার', desc: 'স্টুডিও অ্যাঙ্কর স্ক্রিপ্ট রিডার',      roles: ['super_admin', 'admin', 'managing_editor', 'editor'] },
  { to: '/broadcast/cg',           key: 'broadcastCG',       icon: Film,        label: '🎬 Studio CG (GFX)', desc: 'লাইভ লোয়ার থার্ড ও গ্রাফিক্স আউটপুট',   roles: ['super_admin', 'admin', 'managing_editor', 'editor'] },
  { to: '/broadcast/tickers',      key: 'broadcastTickers',  icon: AlignLeft,   label: '📰 Ticker Manager',  desc: 'লাইভ সংবাদ স্ক্রল ও টিকার কন্ট্রোল', roles: ['super_admin', 'admin', 'managing_editor', 'editor'] },
  { to: '/broadcast/queue',        key: 'broadcastQueue',    icon: Video,       label: '📥 মিডিয়া ইনজেস্ট',  desc: 'ফিল্ড রিপোর্টিং ভিডিও/অডিও রিসিভ', roles: ['super_admin', 'admin', 'managing_editor', 'editor', 'reporter'] },
  { to: '/broadcast/schedule',     key: 'broadcastSchedule', icon: Calendar,    label: 'প্রোগ্রাম সময়সূচি',   desc: 'সাপ্তাহিক সম্প্রচার সময়সূচি',                  roles: [] },
  { to: '/broadcast/assets',       key: 'broadcastAssets',   icon: Film,        label: '🎥 Video Assets',    desc: 'ভিডিও অ্যাসেট ম্যানেজার', roles: ['super_admin', 'admin', 'producer', 'managing_editor', 'chief_editor', 'editor'] },
  { to: '/broadcast/playout',      key: 'broadcastPlayout',  icon: PlayCircle,  label: '📺 24/7 প্লেআউট',     desc: 'Full Day Playlist Manager', roles: ['super_admin', 'admin', 'producer', 'managing_editor', 'chief_editor', 'editor'] },
  { to: '/broadcast/mcr',         key: 'broadcastMCR',      icon: Cpu,         label: '🎛️ MCR',              desc: 'Master Control Room — সিগন্যাল রাউটিং ও রেকর্ডিং', roles: ['super_admin', 'admin', 'managing_editor'] },
  { to: '/broadcast/archive',      key: 'broadcastArchive',  icon: Archive,     label: 'এপিসোড আর্কাইভ',    desc: 'সম্প্রচারিত এপিসোডের আর্কাইভ',                  roles: [] },
  { to: '/broadcast/master-data',  key: 'broadcastMaster',   icon: Database,    label: '⚙️ মাস্টার ডাটা',    desc: 'ব্রডকাস্ট ডাটা এবং সেটিংস', roles: ['super_admin', 'admin', 'chief_editor'] },
  { to: '/web-studio',             key: 'webStudio',         icon: PlaySquare,  label: '🎬 Web Studio',    desc: 'vMix/OBS Style Studio Switcher',                roles: ['super_admin', 'admin', 'managing_editor'] },
]

const researchItems = [
  { to: '/research', key: 'researchDashboard', icon: Search, label: 'রিসার্চ সেন্টার', desc: 'রিসার্চ ড্যাশবোর্ড', roles: ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'editor', 'reporter'] },
  { to: '/research/archive', key: 'researchArchive', icon: Database, label: 'আর্কাইভ সার্চ', desc: 'পুরনো নিউজ খুঁজুন', roles: ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'editor', 'reporter'] },
  { to: '/research/news-feed', key: 'researchFeed', icon: Rss, label: 'লাইভ নিউজ ফিড', desc: 'অন্যান্য মিডিয়ার খবর', roles: ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'editor', 'reporter'] },
  { to: '/research/trends', key: 'researchTrends', icon: TrendingUp, label: 'ট্রেন্ড বিশ্লেষণ', desc: 'গুগল ট্রেন্ডস ও ডেটা', roles: ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'editor', 'reporter'] },
  { to: '/research/ai', key: 'researchAI', icon: Lightbulb, label: 'AI অ্যাসিস্ট্যান্ট', desc: 'AI রিসার্চ টুল', roles: ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'editor', 'reporter'] },
  { to: '/research/planner', key: 'researchPlanner', icon: Calendar, label: 'স্টোরি প্ল্যানার', desc: 'ভবিষ্যৎ নিউজ প্ল্যানিং', roles: ['super_admin', 'admin', 'managing_editor', 'chief_editor', 'editor', 'reporter'] },
]

const GROUP_DEFS = {
  client:     { icon: Briefcase, label: 'Client Portal', color: 'blue', items: [
    { to: '/client/dashboard', key: 'clientDashboard', icon: LayoutDashboard, label: 'Dashboard', desc: 'Client Dashboard', roles: ['client', 'agency'] },
    { to: '/client/visual-booking', key: 'clientVisualBooking', icon: LayoutTemplate, label: 'Visual Ad Booking', desc: 'Book Ads', roles: ['client', 'agency'] },
    { to: '/client/support', key: 'clientSupport', icon: MessageSquare, label: 'Support Tickets', desc: 'Help & Support', roles: ['client', 'agency'] },
  ] },
  common:     { icon: LayoutDashboard, label: 'জেনারেল ডেস্ক', color: 'amber',   items: newsItems },
  hr:         { icon: Calendar, label: 'HR ও লিভ',    color: 'green',   items: hrItems },
  online:     { icon: Globe,    label: 'অনলাইন ডেস্ক', color: 'blue',   items: onlineItems },
  print:      { icon: Printer,  label: 'প্রিন্ট ডেস্ক', color: 'purple', items: printItems },
  multimedia: { icon: Video,    label: 'মাল্টিমিডিয়া ডেস্ক', color: 'orange', items: multimediaItems },
  broadcast:  { icon: MonitorPlay, label: '📺 টিভি ব্রডকাস্ট', color: 'red',    items: broadcastItems },
  research:   { icon: Search,   label: '🔬 রিসার্চ ডেস্ক', color: 'blue', items: researchItems },
  sales:      ERP_MODULES.sales,
  circulation: ERP_MODULES.circulation,
  accounts:   ERP_MODULES.accounts,
  inventory:  ERP_MODULES.inventory,
  system:     { icon: Settings, label: 'সিস্টেম ও সেটিংস', color: 'gray', items: systemItems },
}

const DEFAULT_SECTION_ORDER = ['client', 'common', 'hr', 'online', 'print', 'multimedia', 'broadcast', 'research', 'sales', 'circulation', 'accounts', 'inventory', 'system']

const colorMap = {
  blue:   { btn: 'text-blue-600 dark:text-blue-400',   border: 'border-blue-200 dark:border-blue-500/30',   activeBg: 'bg-blue-50 dark:bg-blue-500/10' },
  green:  { btn: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-500/30', activeBg: 'bg-green-50 dark:bg-green-500/10' },
  purple: { btn: 'text-purple-600 dark:text-purple-400',border: 'border-purple-200 dark:border-purple-500/30',activeBg: 'bg-purple-50 dark:bg-purple-500/10' },
  amber:  { btn: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/30', activeBg: 'bg-amber-50 dark:bg-amber-500/10' },
  orange: { btn: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-500/30', activeBg: 'bg-orange-50 dark:bg-orange-500/10' },
  gray:   { btn: 'text-gray-600 dark:text-gray-400',   border: 'border-gray-200 dark:border-gray-500/30',   activeBg: 'bg-gray-50 dark:bg-gray-500/10' },
}

// ─── একক NavItem ──────────────────────────────────────────────────
function NavItem({ to, icon: Icon, label, desc, badge, soon, isCustomizing, index, total, onMove, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, isOver, subItems }) {
  const [isOpen, setIsOpen] = useState(false);

  if (soon) {
    return (
      <div title={desc} className="flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-sm text-gray-300 dark:text-slate-600 cursor-not-allowed select-none">
        <Icon size={14} className="shrink-0" />
        <span className="flex-1 truncate text-xs">{label}</span>
        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-500 dark:bg-amber-900/20 dark:text-amber-500 rounded">শীঘ্রই</span>
      </div>
    )
  }

  if (isCustomizing) {
    return (
      <div
        title={desc}
        draggable
        onDragStart={onDragStart}
        onDragOver={(e) => { e.preventDefault(); onDragOver() }}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium select-none cursor-grab active:cursor-grabbing border transition-all ${
          isDragging ? 'opacity-40 scale-95 border-dashed border-slate-400' :
          isOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/10 shadow-sm scale-[1.01]' :
          'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
        }`}
      >
        <GripVertical size={13} className="text-slate-400 shrink-0" />
        <Icon size={13} className="shrink-0" />
        <span className="flex-1 truncate">{label}</span>
        <div className="flex gap-0.5 shrink-0">
          <button onClick={() => onMove(-1)} disabled={index === 0}
            className="p-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-600">
            <ChevronUp size={11} />
          </button>
          <button onClick={() => onMove(1)} disabled={index === total - 1}
            className="p-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-600">
            <ChevronDown size={11} />
          </button>
        </div>
      </div>
    )
  }

  if (subItems) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-2.5 px-3 py-[7px] rounded-lg text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400`}
        >
          <div className="flex items-center gap-2.5">
            {Icon && <Icon size={18} className="shrink-0" />}
            <span className="font-medium truncate">{label}</span>
          </div>
          <div className="text-slate-400">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </button>
        
        {isOpen && (
          <div className="ml-7 mt-1 space-y-0.5 border-l border-slate-200 dark:border-slate-700 pl-2">
            {subItems.map((sub, idx) => (
              <NavLink
                key={sub.key || idx}
                to={sub.to}
                className={({ isActive }) =>
                  `block px-3 py-1.5 rounded-md text-xs transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-medium'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                {sub.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      title={desc}
      to={to} end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-medium'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={14} className="shrink-0" />
          <span className="flex-1 truncate text-sm">{label}</span>
          {badge && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-md">{badge}</span>}
          {isActive && !badge && <ChevronRight size={13} />}
        </>
      )}
    </NavLink>
  )
}

// ─── Collapsible Group Section ────────────────────────────────────
function GroupSection({ groupKey, user, showRssMenu, menuAccess, isCustomizing, sectionIndex, totalSections, onSectionMove, onSectionDragStart, onSectionDragOver, onSectionDrop, onSectionDragEnd, isSectionDragging, isSectionOver }) {
  const def = GROUP_DEFS[groupKey]
  const { icon: GroupIcon, label, color, items } = def || {}
  const c = colorMap[color] || colorMap.blue
  const location = useLocation()
  
  let shouldReturnNull = false;
  
  if (!def) shouldReturnNull = true;

  // Filter entire sections based on user's edition
  if (user && user.edition) {
    if (user.edition === 'print' && (groupKey === 'online' || groupKey === 'multimedia')) shouldReturnNull = true
    if (user.edition === 'online' && (groupKey === 'print' || groupKey === 'multimedia')) shouldReturnNull = true
    if (user.edition === 'multimedia' && (groupKey === 'print' || groupKey === 'online')) shouldReturnNull = true
  }

  // Filter sections for external users (clients/agencies) vs internal CMS users
  if (user && (user.role === 'client' || user.role === 'agency')) {
    if (groupKey !== 'client') shouldReturnNull = true;
  } else {
    if (groupKey === 'client') shouldReturnNull = true;
  }



  // Get this role's allowed menu keys from context (DB-sourced)
  // menuAccess = { reporter: ['printDashboard', 'printWorkflow', ...], editor: [...], ... }
  const roleAccessList = (user && menuAccess && menuAccess[user.role] !== undefined)
    ? menuAccess[user.role]
    : null

  const filtered = (items || []).filter(item => {
    if (!user) return false
    
    // Hardcoded exclusions that override localStorage
    if (user.role === 'reporter') {
        const restrictedForReporter = [
          'hrEmployees', 
          'hrDropdownSettings',
          'salesDashboard', 'salesAdNew', 'salesAdList', 'salesColNew', 'salesColList', 
          'salesReportsSub', 'salesReportDaily', 'salesReportCustom', 'salesReportAging', 'salesReportPerformance', 
          'salesSetup', 'salesUsers'
        ];
      if (restrictedForReporter.includes(item.key)) return false;
    }

    if (user.role === 'chief_reporter') {
      const restrictedForChiefReporter = ['nationalDesk', 'onlineEditorialDesk', 'reports'];
      if (restrictedForChiefReporter.includes(item.key)) return false;
    }

    if (user.role === 'news_manager') {
      const restrictedForNewsManager = ['reports', 'departmentQueue', 'homepageBuilder', 'onlineProofreading'];
      if (restrictedForNewsManager.includes(item.key)) return false;
    }

    // If it's a sales module item, check salesPermissions array if it exists for the user
    if (groupKey === 'sales') {
      if (user.role === 'super_admin') return true;
      if (user.salesPermissions && user.salesPermissions.length > 0) {
        return user.salesPermissions.includes(item.key);
      }
      if (user.role === 'reporter') return false; // Extra safety
    }
    
    // Super Admin always gets access to everything
    if (user.role === 'super_admin') {
      if (item.key === 'rss' && showRssMenu === false) return false;
      return true;
    }

    // If strict RBAC list is available from localStorage for this role
    if (roleAccessList !== null) {
      if (!roleAccessList.includes(item.key)) return false
    } else {
      if (item.roles && item.roles.length > 0 && !item.roles.includes(user.role)) return false
    }
    
    if (item.key === 'rss' && showRssMenu === false) return false
    return true
  }) || []
  if (filtered.length === 0) shouldReturnNull = true

  const hasActive = filtered.some(item => item.to !== '/' && location.pathname.startsWith(item.to))

  const storageKey = `cms_group_open_${groupKey}`
  const [isOpen, setIsOpen] = useState(() => {
    try { const s = localStorage.getItem(storageKey); if (s !== null) return JSON.parse(s) } catch (e) {}
    return hasActive
  })

  useEffect(() => { if (hasActive && !isOpen) setIsOpen(true) }, [location.pathname])

  const toggle = () => {
    if (isCustomizing) return
    const next = !isOpen
    setIsOpen(next)
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch (e) {}
  }

  // item-level drag state
  const [itemOrder, setItemOrder] = useState(() => {
    try {
      const s = localStorage.getItem(`cms_items_${groupKey}`)
      if (s) return JSON.parse(s)
    } catch (e) {}
    return (items || []).map(i => i.key)
  })
  const [itemDragIdx, setItemDragIdx] = useState(null)
  const [itemOverIdx, setItemOverIdx] = useState(null)

  if (shouldReturnNull) return null;

  const orderedItems = [...filtered].sort((a, b) => {
    const ia = itemOrder.indexOf(a.key), ib = itemOrder.indexOf(b.key)
    if (ia === -1 && ib === -1) return 0
    if (ia === -1) return 1; if (ib === -1) return -1
    return ia - ib
  })

  const saveItemOrder = (keys) => {
    setItemOrder(keys)
    try { localStorage.setItem(`cms_items_${groupKey}`, JSON.stringify(keys)) } catch (e) {}
  }

  const moveItem = (idx, dir) => {
    const keys = orderedItems.map(i => i.key)
    const ti = idx + dir
    if (ti < 0 || ti >= keys.length) return
    const copy = [...keys]; [copy[idx], copy[ti]] = [copy[ti], copy[idx]]
    saveItemOrder(copy)
  }

  const dropItem = (targetIdx) => {
    if (itemDragIdx === null || itemDragIdx === targetIdx) { setItemDragIdx(null); setItemOverIdx(null); return }
    const keys = orderedItems.map(i => i.key)
    const copy = [...keys]
    const [removed] = copy.splice(itemDragIdx, 1)
    copy.splice(targetIdx, 0, removed)
    saveItemOrder(copy)
    setItemDragIdx(null); setItemOverIdx(null)
  }

  return (
    <div
      className={`rounded-xl border transition-all ${isCustomizing ? 'border-dashed' : 'border-transparent'} ${isSectionOver ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-500/5 scale-[1.01] shadow-sm' : isSectionDragging ? 'opacity-50 scale-95' : ''}`}
    >
      {/* Group Header */}
      <div className="flex items-center gap-1">
        {isCustomizing && (
          <div
            draggable
            onDragStart={onSectionDragStart}
            onDragOver={(e) => { e.preventDefault(); onSectionDragOver() }}
            onDrop={onSectionDrop}
            onDragEnd={onSectionDragEnd}
            className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="ড্রাগ করে সরান"
          >
            <GripVertical size={14} />
          </div>
        )}
        <button
          onClick={toggle}
          className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
            isOpen && !isCustomizing ? `${c.activeBg} ${c.btn}` : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200'
          }`}
        >
          <GroupIcon size={15} className="shrink-0" />
          <span className="flex-1 text-left truncate">{label}</span>
          {isCustomizing ? null : (isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
        </button>
        {isCustomizing && (
          <div className="flex gap-0.5 shrink-0 pr-1">
            <button onClick={() => onSectionMove(-1)} disabled={sectionIndex === 0}
              className="p-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-600">
              <ChevronUp size={11} />
            </button>
            <button onClick={() => onSectionMove(1)} disabled={sectionIndex === totalSections - 1}
              className="p-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-600">
              <ChevronDown size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Group Items */}
      {(isOpen || isCustomizing) && (
        <div className={`ml-3 mt-0.5 pl-2 border-l-2 ${c.border} space-y-0.5 pb-1`}>
          {orderedItems.map((item, idx) => (
            <NavItem
              key={item.key}
              {...item}
              isCustomizing={isCustomizing}
              index={idx}
              total={orderedItems.length}
              onMove={(dir) => moveItem(idx, dir)}
              onDragStart={() => setItemDragIdx(idx)}
              onDragOver={() => setItemOverIdx(idx)}
              onDrop={() => dropItem(idx)}
              onDragEnd={() => { setItemDragIdx(null); setItemOverIdx(null) }}
              isDragging={itemDragIdx === idx}
              isOver={itemOverIdx === idx && itemDragIdx !== idx}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── প্রধান Sidebar ────────────────────────────────────────────────
export default function Sidebar() {
  const { user, logout } = useContext(AuthContext)
  const { showRssMenu, menuAccess } = useSettings()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()

  const [isCustomizing, setIsCustomizing] = useState(false)

  // ─── Custom Resizer ──────────────────────────────────────────────
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try { const w = localStorage.getItem('cms_sidebar_width'); return w ? parseInt(w) : 256; } catch (e) { return 256; }
  })
  const isResizing = useRef(false)

  useEffect(() => {
    const resize = (e) => {
      if (isResizing.current) {
        const newWidth = Math.max(200, Math.min(600, e.clientX))
        setSidebarWidth(newWidth)
        try { localStorage.setItem('cms_sidebar_width', newWidth) } catch (e) {}
      }
    }
    const stopResizing = () => { isResizing.current = false }
    window.addEventListener("mousemove", resize)
    window.addEventListener("mouseup", stopResizing)
    return () => {
      window.removeEventListener("mousemove", resize)
      window.removeEventListener("mouseup", stopResizing)
    }
  }, [])
  // ─────────────────────────────────────────────────────────────────

  // Section order
  const [sectionOrder, setSectionOrder] = useState(() => {
    try {
      const s = localStorage.getItem('cms_section_order')
      if (s) {
        let order = JSON.parse(s)
        const missing = Object.keys(GROUP_DEFS).filter(k => !order.includes(k))
        if (missing.length > 0) {
          order = [...order, ...missing]
        }
        return order
      }
    } catch (e) {}
    return DEFAULT_SECTION_ORDER
  })

  // Section drag state
  const [secDragIdx, setSecDragIdx] = useState(null)
  const [secOverIdx, setSecOverIdx] = useState(null)

  const saveSectionOrder = (order) => {
    setSectionOrder(order)
    try { localStorage.setItem('cms_section_order', JSON.stringify(order)) } catch (e) {}
  }

  const moveSection = (idx, dir) => {
    const ti = idx + dir
    if (ti < 0 || ti >= sectionOrder.length) return
    const copy = [...sectionOrder]; [copy[idx], copy[ti]] = [copy[ti], copy[idx]]
    saveSectionOrder(copy)
  }

  const dropSection = (targetIdx) => {
    if (secDragIdx === null || secDragIdx === targetIdx) { setSecDragIdx(null); setSecOverIdx(null); return }
    const copy = [...sectionOrder]
    const [removed] = copy.splice(secDragIdx, 1)
    copy.splice(targetIdx, 0, removed)
    saveSectionOrder(copy)
    setSecDragIdx(null); setSecOverIdx(null)
  }

  const resetAll = () => {
    saveSectionOrder(DEFAULT_SECTION_ORDER)
    Object.keys(GROUP_DEFS).forEach(k => {
      try { localStorage.removeItem(`cms_items_${k}`) } catch (e) {}
    })
    try { localStorage.removeItem('cms_section_order') } catch (e) {}
    setIsCustomizing(false)
    setSecDragIdx(null); setSecOverIdx(null)
    window.location.reload()
  }

  const handleLogout = () => { logout(); navigate('/login') }

  // Only group keys for section ordering
  const groupSections = sectionOrder

  return (
    <div 
      style={{ width: `${sidebarWidth}px` }}
      className="relative bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col h-full transition-colors duration-200 shrink-0 print:hidden"
    >
      {/* Resizer Handle */}
      <div 
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500 z-50 transition-colors"
        onMouseDown={(e) => { e.preventDefault(); isResizing.current = true; }}
      />

      {/* লোগো */}
      <div className="px-5 py-3.5 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <MediaFlowLogo variant="horizontal" />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-xs text-gray-400 dark:text-slate-500">Admin Panel</p>
          <button
            onClick={() => { setIsCustomizing(!isCustomizing); setSecDragIdx(null); setSecOverIdx(null) }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              isCustomizing
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
            title="মেনুর ক্রম পরিবর্তন করুন"
          >
            <ArrowUpDown size={11} />
            <span>{isCustomizing ? 'সম্পন্ন' : 'মেনু সাজান'}</span>
          </button>
        </div>
        {isCustomizing && (
          <div className="mt-1.5 pt-1.5 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">ড্রাগ বা তীর দিয়ে সাজান</span>
            <button onClick={resetAll} className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600 font-medium">
              <RotateCcw size={10} />
              <span>রিসেট</span>
            </button>
          </div>
        )}
      </div>

      {/* নেভিগেশন */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5">

        {/* Groups */}
        {groupSections.map((gKey, idx) => (
          <GroupSection
            key={gKey}
            groupKey={gKey}
            user={user}
            showRssMenu={showRssMenu}
            menuAccess={menuAccess}
            isCustomizing={isCustomizing}
            sectionIndex={idx}
            totalSections={groupSections.length}
            onSectionMove={(dir) => moveSection(sectionOrder.indexOf(gKey), dir)}
            onSectionDragStart={() => setSecDragIdx(idx)}
            onSectionDragOver={() => setSecOverIdx(idx)}
            onSectionDrop={() => dropSection(idx)}
            onSectionDragEnd={() => { setSecDragIdx(null); setSecOverIdx(null) }}
            isSectionDragging={secDragIdx === idx}
            isSectionOver={secOverIdx === idx && secDragIdx !== idx}
          />
        ))}
      </nav>

      {/* লগআউট */}
      <div className="px-3 py-3.5 border-t border-gray-200 dark:border-slate-800 flex flex-col gap-1.5">
        <div className="flex flex-col px-3 py-1.5">
          <p className="text-xs font-medium text-gray-900 dark:text-white">{user?.name || 'Admin'}</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">{user?.role || ''}</p>
          <p className="text-[11px] text-gray-300 dark:text-slate-600 truncate">{user?.email || ''}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 w-full transition-colors"
        >
          <LogOut size={15} />
          <span>{t.logout || 'লগআউট'}</span>
        </button>
      </div>
    </div>
  )
}
