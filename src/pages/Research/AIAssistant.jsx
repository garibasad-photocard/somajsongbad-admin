import { useState, useRef, useEffect } from 'react';
import ResearchDashboard from './ResearchDashboard';
import { Send, User, Bot, Loader2, Sparkles, Trash2 } from 'lucide-react';
import api from '../../services/api';

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initial welcome message
    setMessages([
      { 
        role: 'ai', 
        content: 'হ্যালো! আমি আপনার **AI রিসার্চ অ্যাসিস্ট্যান্ট**। আজকের সংবাদের জন্য কোনো ব্যাকগ্রাউন্ড ইনফরমেশন, ফ্যাক্ট-চেক, অথবা নতুন খবরের আইডিয়া লাগলে আমাকে জিজ্ঞেস করতে পারেন।' 
      }
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await api.post('/ai/ask', { prompt: userMessage });

      setMessages(prev => [...prev, { role: 'ai', content: res.data.answer }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: 'দুঃখিত, এআই সার্ভারের সাথে যুক্ত হতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।',
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('আপনি কি চ্যাট হিস্ট্রি মুছে ফেলতে চান?')) {
      setMessages([
        { 
          role: 'ai', 
          content: 'হ্যালো! আমি আপনার **AI রিসার্চ অ্যাসিস্ট্যান্ট**। আজকের সংবাদের জন্য কোনো ব্যাকগ্রাউন্ড ইনফরমেশন, ফ্যাক্ট-চেক, অথবা নতুন খবরের আইডিয়া লাগলে আমাকে জিজ্ঞেস করতে পারেন।' 
        }
      ]);
    }
  };

  return (
    <ResearchDashboard>
      <div className="max-w-4xl mx-auto h-[calc(100vh-180px)] md:h-[calc(100vh-220px)] flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-slate-100">AI রিসার্চ অ্যাসিস্ট্যান্ট</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Gemini</p>
            </div>
          </div>
          <button 
            onClick={handleClear}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="চ্যাট ক্লিয়ার করুন"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' 
                  : 'bg-blue-600 text-white'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={18} />}
              </div>
              <div className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-slate-800 dark:text-slate-200' 
                  : msg.isError 
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30'
                    : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}>
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  }}
                />
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Bot size={18} />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">তথ্য খুঁজছে...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="আপনার প্রশ্ন এখানে লিখুন..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full pl-6 pr-14 py-3.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="-ml-0.5" />}
            </button>
          </form>
          <div className="text-center mt-3">
            <p className="text-[11px] text-slate-400">
              এআই মাঝেমধ্যে ভুল তথ্য দিতে পারে। সংবাদের ক্ষেত্রে এআইয়ের দেওয়া তথ্য যাচাই করে নেওয়া ভালো।
            </p>
          </div>
        </div>

      </div>
    </ResearchDashboard>
  );
}
