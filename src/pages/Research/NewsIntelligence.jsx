import React, { useState } from 'react';
import ResearchDashboard from './ResearchDashboard';
import { Brain, Flame, Clock, AlertTriangle, Zap, BarChart3, Share2, FlaskConical, Loader2, Copy, Check, ChevronRight, Sparkles, TrendingUp, Target, MessageSquare } from 'lucide-react';
import api from '../../services/api';

const tools = [
  {
    id: 'viral',
    name: 'Viral Potential Scorer',
    nameBn: 'ভাইরাল স্কোরার',
    icon: Flame,
    color: 'from-orange-500 to-red-500',
    lightColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    textColor: 'text-orange-600 dark:text-orange-400',
    desc: 'শিরোনাম বা ড্রাফট দিন, AI ভাইরাল হওয়ার সম্ভাবনা ০-১০০ স্কোরে জানাবে।',
    placeholder: 'খবরের শিরোনাম বা সম্পূর্ণ ড্রাফট এখানে লিখুন...',
    label: 'শিরোনাম বা ড্রাফট'
  },
  {
    id: 'heat',
    name: 'Topic Heat Predictor',
    nameBn: 'টপিক হিট প্রেডিক্টর',
    icon: TrendingUp,
    color: 'from-red-500 to-pink-500',
    lightColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-600 dark:text-red-400',
    desc: 'কোনো বিষয় বা টপিক দিন, AI আগামী ২৪-৭২ ঘণ্টায় এটি কতটা ট্রেন্ড করবে বলবে।',
    placeholder: 'যেমন: "বাংলাদেশ-ভারত সীমান্ত উত্তেজনা" অথবা "ডলারের দাম বৃদ্ধি"',
    label: 'বিষয় বা টপিক'
  },
  {
    id: 'timing',
    name: 'Best Time to Publish',
    nameBn: 'সেরা প্রকাশ সময়',
    icon: Clock,
    color: 'from-blue-500 to-cyan-500',
    lightColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-600 dark:text-blue-400',
    desc: 'খবরের ধরন ও বিষয় লিখুন, AI সর্বোত্তম প্রকাশের সময় ও প্ল্যাটফর্ম পরামর্শ দেবে।',
    placeholder: 'যেমন: "রাজনৈতিক বিশ্লেষণ - বিএনপির নতুন কর্মসূচি নিয়ে খবর"',
    label: 'খবরের ধরন ও বিষয়'
  },
  {
    id: 'crisis',
    name: 'Crisis Alert Analyzer',
    nameBn: 'সংকট বিশ্লেষক',
    icon: AlertTriangle,
    color: 'from-amber-500 to-orange-500',
    lightColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    textColor: 'text-amber-600 dark:text-amber-400',
    desc: 'ঘটনার বিবরণ দিন, AI সংকটের মাত্রা ও Breaking News হওয়ার সম্ভাবনা বিশ্লেষণ করবে।',
    placeholder: 'ঘটনার বিস্তারিত বিবরণ লিখুন...',
    label: 'ঘটনার বিবরণ'
  },
  {
    id: 'exclusive',
    name: 'Exclusive Angle Finder',
    nameBn: 'এক্সক্লুসিভ অ্যাঙ্গেল ফাইন্ডার',
    icon: Zap,
    color: 'from-violet-500 to-purple-500',
    lightColor: 'bg-violet-50 dark:bg-violet-900/20',
    borderColor: 'border-violet-200 dark:border-violet-800',
    textColor: 'text-violet-600 dark:text-violet-400',
    desc: 'একটি সাধারণ ঘটনা দিন, AI এমন ৩টি এক্সক্লুসিভ অ্যাঙ্গেল দেবে যা কেউ কভার করেনি।',
    placeholder: 'সাধারণ ঘটনার বিবরণ দিন...',
    label: 'ঘটনার বিবরণ'
  },
  {
    id: 'sentiment',
    name: 'Sentiment & Impact Analyzer',
    nameBn: 'সেন্টিমেন্ট বিশ্লেষক',
    icon: MessageSquare,
    color: 'from-teal-500 to-emerald-500',
    lightColor: 'bg-teal-50 dark:bg-teal-900/20',
    borderColor: 'border-teal-200 dark:border-teal-800',
    textColor: 'text-teal-600 dark:text-teal-400',
    desc: 'খবরের টেক্সট দিন, AI পাঠকের মনে কী প্রভাব পড়বে এবং সামাজিক প্রভাব বিশ্লেষণ করবে।',
    placeholder: 'বিশ্লেষণ করার জন্য খবরের সম্পূর্ণ টেক্সট দিন...',
    label: 'খবরের টেক্সট'
  },
  {
    id: 'platform',
    name: 'Cross-Platform Strategy',
    nameBn: 'প্ল্যাটফর্ম স্ট্র্যাটেজি',
    icon: Share2,
    color: 'from-indigo-500 to-blue-500',
    lightColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    desc: 'খবরটি দিন, AI ফেসবুক, ইউটিউব, ইনস্টাগ্রাম ও টুইটারে কীভাবে শেয়ার করবেন তা বলবে।',
    placeholder: 'শেয়ার করার খবরের বিবরণ বা টেক্সট দিন...',
    label: 'খবরের বিবরণ'
  },
  {
    id: 'abtest',
    name: 'Headline A/B Tester',
    nameBn: 'শিরোনাম A/B টেস্টার',
    icon: FlaskConical,
    color: 'from-pink-500 to-rose-500',
    lightColor: 'bg-pink-50 dark:bg-pink-900/20',
    borderColor: 'border-pink-200 dark:border-pink-800',
    textColor: 'text-pink-600 dark:text-pink-400',
    desc: '২-৩টি বিকল্প শিরোনাম দিন, AI বলবে কোনটি সবচেয়ে বেশি ক্লিক পাবে এবং কেন।',
    placeholder: 'একটি করে লাইনে শিরোনামগুলো লিখুন:\nশিরোনাম ১\nশিরোনাম ২\nশিরোনাম ৩',
    label: 'বিকল্প শিরোনামগুলো'
  }
];

// Score badge component
const ScoreBadge = ({ score, size = 'md' }) => {
  const color = score >= 70 ? 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' 
    : score >= 40 ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' 
    : 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
  const sz = size === 'lg' ? 'text-4xl font-black px-4 py-2' : 'text-lg font-bold px-3 py-1';
  return <span className={`rounded-xl ${color} ${sz}`}>{score}/100</span>;
};

// Result renderer for each tool type
const ResultRenderer = ({ type, result }) => {
  if (!result) return null;

  const Card = ({ title, children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 ${className}`}>
      {title && <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-3 text-sm uppercase tracking-wide">{title}</h4>}
      {children}
    </div>
  );

  const Tag = ({ children, color = 'blue' }) => {
    const colors = {
      green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${colors[color] || colors.blue}`}>{children}</span>;
  };

  if (type === 'viral') {
    const scoreColor = result.score >= 70 ? 'green' : result.score >= 40 ? 'amber' : 'red';
    const verdictColor = result.verdict === 'High' ? 'green' : result.verdict === 'Medium' ? 'amber' : 'red';
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className={`text-5xl font-black ${result.score >= 70 ? 'text-green-500' : result.score >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{result.score}</div>
            <div className="text-xs text-slate-500 mt-1">ভাইরাল স্কোর</div>
          </div>
          <div>
            <Tag color={verdictColor}>{result.verdict === 'High' ? '🔥 উচ্চ সম্ভাবনা' : result.verdict === 'Medium' ? '⚡ মাঝারি সম্ভাবনা' : '❄️ কম সম্ভাবনা'}</Tag>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-xs">{result.shareability}</p>
            <p className="text-xs text-slate-500 mt-1">আবেগ: <strong>{result.emotion}</strong></p>
          </div>
        </div>
        <Card title="কারণসমূহ">
          <ul className="space-y-2">{result.reasons?.map((r, i) => <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300"><span className="text-orange-500 mt-0.5">•</span>{r}</li>)}</ul>
        </Card>
        <Card title="উন্নত শিরোনাম সাজেশন">
          <div className="space-y-2">{result.improvements?.map((h, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <span className="text-xs font-bold text-slate-400 w-5">{i + 1}</span>
              <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{h}</span>
            </div>
          ))}</div>
        </Card>
      </div>
    );
  }

  if (type === 'heat') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className={`text-5xl font-black ${result.heatScore >= 70 ? 'text-red-500' : result.heatScore >= 40 ? 'text-amber-500' : 'text-blue-500'}`}>{result.heatScore}</div>
            <div className="text-xs text-slate-500 mt-1">হিট স্কোর</div>
          </div>
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-200">⏰ {result.peakTime}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{result.recommendation}</p>
          </div>
        </div>
        <Card title="কেন গরম হবে">{result.drivers?.map((d, i) => <p key={i} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2"><span className="text-red-500">🔥</span>{d}</p>)}</Card>
        <Card title="সংশ্লিষ্ট বিষয়">
          <div className="flex flex-wrap gap-2">{result.relatedTopics?.map((t, i) => <Tag key={i} color="blue">{t}</Tag>)}</div>
        </Card>
        <Card title="কভারেজ অ্যাঙ্গেল"><p className="text-sm text-slate-700 dark:text-slate-300">{result.angle}</p></Card>
      </div>
    );
  }

  if (type === 'timing') {
    return (
      <div className="space-y-4">
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">⏰ {result.bestTime}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{result.reason}</p>
        </Card>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(result.platforms || {}).map(([platform, time]) => (
            <Card key={platform}>
              <p className="text-xs text-slate-500 uppercase tracking-wide">{platform}</p>
              <p className="font-bold text-slate-700 dark:text-slate-200 mt-1">{time}</p>
            </Card>
          ))}
        </div>
        <Card title="এড়িয়ে চলুন"><p className="text-sm text-red-500">❌ {result.avoidTime}</p></Card>
        <Card title="টিপস"><ul className="space-y-1">{result.tips?.map((t, i) => <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2"><span className="text-blue-500">✓</span>{t}</li>)}</ul></Card>
      </div>
    );
  }

  if (type === 'crisis') {
    const lvlColor = result.crisisLevel === 'Critical' ? 'red' : result.crisisLevel === 'High' ? 'amber' : 'blue';
    return (
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <Tag color={lvlColor}>{result.crisisLevel === 'Critical' ? '🚨 Critical' : result.crisisLevel === 'High' ? '⚠️ High' : result.crisisLevel}</Tag>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Breaking News সম্ভাবনা</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${result.breakingProbability}%` }} />
              </div>
              <span className="text-sm font-bold text-red-500">{result.breakingProbability}%</span>
            </div>
          </div>
        </div>
        <Card title="এখনই করণীয়"><p className="text-sm font-medium text-amber-700 dark:text-amber-400">⚡ {result.immediateAction}</p></Card>
        <Card title="ফলো-আপ অ্যাঙ্গেল"><ul className="space-y-2">{result.followUpAngles?.map((a, i) => <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2"><ChevronRight size={14} className="text-amber-500 mt-0.5 shrink-0" />{a}</li>)}</ul></Card>
        <Card title="মূল প্রশ্ন"><ul className="space-y-1">{result.keyQuestions?.map((q, i) => <li key={i} className="text-sm text-slate-700 dark:text-slate-300">❓ {q}</li>)}</ul></Card>
        <Card title="ঝুঁকি বিশ্লেষণ"><p className="text-sm text-red-600 dark:text-red-400">{result.escalationRisk}</p></Card>
      </div>
    );
  }

  if (type === 'exclusive') {
    return (
      <div className="space-y-4">
        <Card title="এক্সক্লুসিভ অ্যাঙ্গেল">
          <div className="space-y-4">{result.exclusiveAngles?.map((a, i) => (
            <div key={i} className="border-l-4 border-violet-500 pl-4">
              <p className="font-bold text-slate-700 dark:text-slate-200">💡 {a.angle}</p>
              <p className="text-sm text-slate-500 mt-1">কেন: {a.why}</p>
              <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">সূত্র: {a.sources}</p>
            </div>
          ))}</div>
        </Card>
        <Card title="ইনভেস্টিগেটিভ লিড"><ul className="space-y-1">{result.investigativeLeads?.map((l, i) => <li key={i} className="text-sm text-slate-700 dark:text-slate-300">🔎 {l}</li>)}</ul></Card>
        <Card title="প্রয়োজনীয় তথ্য"><ul className="space-y-1">{result.dataNeeded?.map((d, i) => <li key={i} className="text-sm text-slate-700 dark:text-slate-300">📊 {d}</li>)}</ul></Card>
        <Card className="bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800"><p className="text-sm text-violet-700 dark:text-violet-300">🏆 {result.uniqueValue}</p></Card>
      </div>
    );
  }

  if (type === 'sentiment') {
    const sentColor = result.sentiment === 'Positive' ? 'green' : result.sentiment === 'Negative' ? 'red' : 'blue';
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Tag color={sentColor}>{result.sentiment === 'Positive' ? '😊 ইতিবাচক' : result.sentiment === 'Negative' ? '😞 নেতিবাচক' : result.sentiment === 'Mixed' ? '😐 মিশ্র' : '😐 নিরপেক্ষ'}</Tag>
          <Tag color="purple">আবেগ: {result.primaryEmotion}</Tag>
          <Tag color="blue">সুর: {result.tone}</Tag>
        </div>
        <Card title="পাঠকের প্রতিক্রিয়া"><p className="text-sm text-slate-700 dark:text-slate-300">{result.audienceReaction}</p></Card>
        <Card title="লক্ষ্য পাঠক"><div className="flex flex-wrap gap-2">{result.targetAudience?.map((a, i) => <Tag key={i} color="blue">{a}</Tag>)}</div></Card>
        <Card title="সামাজিক প্রভাব"><p className="text-sm text-slate-700 dark:text-slate-300">{result.socialImpact}</p></Card>
        <Card title="এনগেজমেন্ট পূর্বানুমান"><p className="text-sm font-medium text-teal-600 dark:text-teal-400">📈 {result.engagementPrediction}</p></Card>
        <Card title="পরামর্শ"><ul className="space-y-1">{result.recommendations?.map((r, i) => <li key={i} className="text-sm text-slate-700 dark:text-slate-300">✅ {r}</li>)}</ul></Card>
      </div>
    );
  }

  if (type === 'platform') {
    const platformIcons = { facebook: '📘', youtube: '📺', instagram: '📸', twitter: '🐦' };
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Tag color="blue">সেরা: {result.bestPlatform}</Tag>
          <Tag color="blue">সময়: {result.postingTime}</Tag>
        </div>
        <div className="grid gap-4">
          {Object.entries(result.platforms || {}).map(([platform, data]) => (
            <Card key={platform}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{platformIcons[platform]}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">{platform}</span>
                </div>
                <ScoreBadge score={data.score} />
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">{data.caption || data.title || data.tweet}</p>
              <p className="text-xs text-slate-500">{data.tips}</p>
            </Card>
          ))}
        </div>
        <Card title="হ্যাশট্যাগ"><div className="flex flex-wrap gap-2">{result.hashtags?.map((h, i) => <Tag key={i} color="blue">{h}</Tag>)}</div></Card>
      </div>
    );
  }

  if (type === 'abtest') {
    return (
      <div className="space-y-4">
        <Card className="bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800">
          <p className="text-xs text-pink-500 font-bold uppercase mb-1">🏆 বিজয়ী শিরোনাম</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{result.winner}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{result.winnerReason}</p>
        </Card>
        <Card title="বিশ্লেষণ">
          <div className="space-y-3">{result.analysis?.map((a, i) => (
            <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{a.headline}</p>
                <ScoreBadge score={a.score} />
              </div>
              <p className="text-xs text-green-600">✓ {a.strengths}</p>
              <p className="text-xs text-red-500 mt-0.5">✗ {a.weaknesses}</p>
            </div>
          ))}</div>
        </Card>
        <div className="grid grid-cols-2 gap-4">
          <Card><p className="text-xs text-slate-500">CTR পূর্বানুমান</p><p className="font-bold text-slate-700 dark:text-slate-200">{result.ctrPrediction}</p></Card>
          <Card><p className="text-xs text-slate-500">SEO স্কোর</p><ScoreBadge score={result.seoScore} /></Card>
        </div>
        <Card title="চূড়ান্ত পরামর্শ"><p className="text-sm text-slate-700 dark:text-slate-300">💡 {result.finalSuggestion}</p></Card>
      </div>
    );
  }

  return null;
};

export default function NewsIntelligence() {
  const [activeTool, setActiveTool] = useState('viral');
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const currentTool = tools.find(t => t.id === activeTool);

  const handleToolChange = (id) => {
    setActiveTool(id);
    setResult(null);
    setInput('');
    setError('');
  };

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResult(null);
    setError('');
    try {
      const res = await api.post('/ai/intelligence', { type: activeTool, input });
      setResult(res.data.result);
    } catch (err) {
      setError(err.response?.data?.message || 'AI বিশ্লেষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ResearchDashboard>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl p-8 mb-6 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-40 h-40 bg-purple-500 rounded-full blur-3xl" />
            <div className="absolute bottom-4 left-4 w-40 h-40 bg-blue-500 rounded-full blur-3xl" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
              <Brain size={36} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-black text-white">AI Newsroom Intelligence</h2>
                <span className="px-2 py-0.5 bg-purple-500/30 text-purple-200 text-xs font-bold rounded-full border border-purple-500/30">BETA</span>
              </div>
              <p className="text-slate-300 text-sm">বাংলাদেশের প্রথম AI-চালিত নিউজরুম প্রেডিকশন ড্যাশবোর্ড — ৮টি শক্তিশালী ফিচার একসাথে</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full lg:w-72 shrink-0">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 px-1">AI টুলস</h3>
            <div className="space-y-1.5">
              {tools.map(tool => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolChange(tool.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      isActive
                        ? `bg-gradient-to-r ${tool.color} text-white shadow-lg`
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : tool.textColor} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : ''}`}>{tool.nameBn}</p>
                    </div>
                    {isActive && <Sparkles size={14} className="text-white/70 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Panel */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Tool Header */}
            <div className={`p-6 rounded-2xl ${currentTool.lightColor} border ${currentTool.borderColor}`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 bg-gradient-to-br ${currentTool.color} rounded-xl shadow-lg`}>
                  {React.createElement(currentTool.icon, { size: 24, className: 'text-white' })}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{currentTool.nameBn}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{currentTool.desc}</p>
                </div>
              </div>

              {/* Input */}
              <div className="mt-4 space-y-3">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{currentTool.label}</label>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={currentTool.placeholder}
                  rows={5}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-y min-h-[120px]"
                />
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || !input.trim()}
                  className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 ${
                    isLoading || !input.trim()
                      ? 'bg-slate-400 cursor-not-allowed'
                      : `bg-gradient-to-r ${currentTool.color} hover:opacity-90 shadow-lg`
                  }`}
                >
                  {isLoading ? (
                    <><Loader2 size={18} className="animate-spin" /> AI বিশ্লেষণ করছে...</>
                  ) : (
                    <><Brain size={18} /> AI দিয়ে বিশ্লেষণ করুন</>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-500" /> AI বিশ্লেষণ ফলাফল
                  </h4>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    {copied ? <><Check size={12} /> কপি হয়েছে!</> : <><Copy size={12} /> কপি করুন</>}
                  </button>
                </div>
                <ResultRenderer type={activeTool} result={result} />
              </div>
            )}
          </div>
        </div>
      </div>
    </ResearchDashboard>
  );
}
