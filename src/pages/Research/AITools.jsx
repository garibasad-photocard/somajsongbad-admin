import { useState } from 'react';
import ResearchDashboard from './ResearchDashboard';
import { Bot, Lightbulb, Tags, FileText, Send, Loader2, Copy, Check } from 'lucide-react';
import api from '../../services/api';

export default function AITools() {
  const [activeTool, setActiveTool] = useState('seo');
  const [inputData, setInputData] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const tools = [
    {
      id: 'seo',
      name: 'এসইও ও ট্যাগ জেনারেটর',
      icon: Tags,
      desc: 'খবরের ড্রাফট দিন, সেরা টাইটেল ও ট্যাগ পান।',
      placeholder: 'আপনার খবরের ড্রাফট এখানে পেস্ট করুন...'
    },
    {
      id: 'summary',
      name: 'আর্টিকেল সামারাইজার',
      icon: FileText,
      desc: 'বড় খবর বা রিপোর্টকে কয়েকটি পয়েন্টে ছোট করুন।',
      placeholder: 'বড় খবরের টেক্সট বা লিংক (যদি সাপোর্টেড হয়) দিন...'
    },
    {
      id: 'ideas',
      name: 'স্টোরি আইডিয়া',
      icon: Lightbulb,
      desc: 'যেকোনো বিষয়ে নতুন নিউজের অ্যাঙ্গেল খুঁজুন।',
      placeholder: 'যেমন: "সামনে ঈদ, ঢাকা শহরের যানজট নিয়ে ৫টি খবরের আইডিয়া দাও"'
    }
  ];

  const currentTool = tools.find(t => t.id === activeTool);

  const handleGenerate = async () => {
    if (!inputData.trim()) return;
    setIsLoading(true);
    setResult('');
    setCopied(false);

    try {
      const res = await api.post('/ai/tool', { 
        tool: activeTool,
        input: inputData
      });
      setResult(res.data.result);
    } catch (error) {
      console.error('Error generating AI content:', error);
      setResult('দুঃখিত, এআই সার্ভারের সাথে যুক্ত হতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ResearchDashboard>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Tools List */}
        <div className="w-full md:w-80 flex flex-col gap-3">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
            <Bot size={20} className="text-purple-500" /> 
            স্মার্ট কন্টেন্ট টুলস
          </h3>
          
          {tools.map(tool => {
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id);
                  setResult('');
                  setInputData('');
                }}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isActive 
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 shadow-sm' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                    <tool.icon size={18} />
                  </div>
                  <h4 className={`font-semibold ${isActive ? 'text-purple-700 dark:text-purple-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    {tool.name}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 ml-11">
                  {tool.desc}
                </p>
              </button>
            )
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm flex flex-col h-[calc(100vh-250px)] min-h-[500px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              {currentTool && <currentTool.icon size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{currentTool?.name}</h2>
              <p className="text-sm text-slate-500">{currentTool?.desc}</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <textarea
              className="w-full h-40 resize-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
              placeholder={currentTool?.placeholder}
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
            />
            
            <div className="flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={isLoading || !inputData.trim()}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                জেনারেট করুন
              </button>
            </div>

            {/* Result Area */}
            <div className={`flex-1 relative bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 overflow-y-auto ${!result && !isLoading ? 'flex items-center justify-center' : ''}`}>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                  <Loader2 size={32} className="animate-spin text-purple-500" />
                  <p>এআই প্রসেস করছে...</p>
                </div>
              ) : result ? (
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">ফলাফল</h4>
                    <button 
                      onClick={handleCopy}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded-md transition-colors flex items-center gap-1 text-xs font-medium"
                    >
                      {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14} />}
                      {copied ? 'কপি হয়েছে!' : 'কপি করুন'}
                    </button>
                  </div>
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap flex-1"
                    dangerouslySetInnerHTML={{ 
                      __html: result
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    }}
                  />
                </div>
              ) : (
                <p className="text-slate-400 text-center text-sm">উপরে ইনপুট দিয়ে "জেনারেট করুন" বাটনে ক্লিক করুন।</p>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </ResearchDashboard>
  );
}
