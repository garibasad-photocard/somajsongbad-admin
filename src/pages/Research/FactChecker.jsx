import { useState } from 'react';
import ResearchDashboard from './ResearchDashboard';
import { ShieldCheck, Send, Loader2, AlertTriangle, Info, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import api from '../../services/api';

export default function FactChecker() {
  const [inputData, setInputData] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getVerdict = (text) => {
    if (!text) return null;
    const lowerText = text.toLowerCase();
    if (lowerText.includes('মিথ্যা') || lowerText.includes('গুজব') || lowerText.includes('ভুয়া') || lowerText.includes('ভুল')) {
      return { label: 'মিথ্যা / গুজব', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800', icon: <XCircle size={18} /> };
    }
    if (lowerText.includes('আংশিক') || lowerText.includes('বিভ্রান্তিকর')) {
      return { label: 'আংশিক সত্য / বিভ্রান্তিকর', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800', icon: <AlertTriangle size={18} /> };
    }
    if (lowerText.includes('সত্য') || lowerText.includes('সঠিক')) {
      return { label: 'সত্য', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800', icon: <CheckCircle2 size={18} /> };
    }
    return { label: 'অনিশ্চিত', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700', icon: <HelpCircle size={18} /> };
  };

  const handleCheck = async () => {
    if (!inputData.trim()) return;
    setIsLoading(true);
    setResult('');

    try {
      const res = await api.post('/ai/tool', { 
        tool: 'factcheck',
        input: inputData
      });
      setResult(res.data.result);
    } catch (error) {
      console.error('Error generating AI content:', error);
      setResult('দুঃখিত, ফ্যাক্ট-চেকিং সার্ভারের সাথে যুক্ত হতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const verdict = getVerdict(result);

  return (
    <ResearchDashboard>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-bl-full -z-10 pointer-events-none"></div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-xl shadow-inner">
                <ShieldCheck size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                AI ফ্যাক্ট-চেকার
              </h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              ইন্টারনেটে ছড়িয়ে থাকা গুজব, ছবি বা দাবির সত্যতা যাচাই করুন এআইয়ের মাধ্যমে। 
              সন্দেহজনক নিউজ লিংক বা টেক্সট নিচে পেস্ট করুন।
            </p>
          </div>

          <div className="hidden md:flex gap-4 opacity-50 grayscale select-none pointer-events-none">
            <CheckCircle2 size={40} className="text-teal-500" />
            <AlertTriangle size={40} className="text-amber-500" />
          </div>
        </div>

        {/* Main Interface */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              দাবি বা সন্দেহজনক খবরটি লিখুন
            </label>
            <div className="relative">
              <textarea
                className="w-full h-32 resize-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                placeholder='যেমন: "আকাশ থেকে লাল রঙের বৃষ্টি হচ্ছে..." অথবা কোনো খবরের লিংক পেস্ট করুন।'
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mb-8">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Info size={14} /> এআইয়ের রেজাল্ট ১০০ ভাগ সঠিক নাও হতে পারে।
            </p>
            <button
              onClick={handleCheck}
              disabled={isLoading || !inputData.trim()}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-all shadow-md shadow-teal-500/20 flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              যাচাই করুন
            </button>
          </div>

          {/* Result Area */}
          {(result || isLoading) && (
            <div className={`p-6 rounded-2xl border ${
              isLoading 
                ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700' 
                : 'bg-teal-50/50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-900/50 shadow-inner'
            }`}>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-4">
                  <div className="relative">
                    <Loader2 size={40} className="animate-spin text-teal-500" />
                    <ShieldCheck size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-600" />
                  </div>
                  <p className="animate-pulse">ইন্টারনেটের তথ্যের সাথে মিলিয়ে দেখা হচ্ছে...</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-teal-200 dark:border-teal-800/50">
                    <h4 className="text-sm font-bold text-teal-800 dark:text-teal-400 flex items-center gap-2">
                      <ShieldCheck size={16} /> যাচাইয়ের ফলাফল:
                    </h4>
                    {verdict && (
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-sm shadow-sm ${verdict.color}`}>
                        {verdict.icon}
                        {verdict.label}
                      </div>
                    )}
                  </div>
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: result
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    }}
                  />
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </ResearchDashboard>
  );
}
