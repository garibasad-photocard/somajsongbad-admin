import { useState } from 'react'
import { Sparkles, X, CheckCircle2, Loader2 } from 'lucide-react'

export default function AIAssistantModal({ suggestions, onApply, onCancel, isGenerating }) {
  const [selectedTitle, setSelectedTitle] = useState(null)
  const [includeSummary, setIncludeSummary] = useState(true)
  const [includeTags, setIncludeTags] = useState(true)

  const handleApply = () => {
    onApply({
      title: selectedTitle,
      summary: includeSummary ? suggestions?.summary : null,
      tags: includeTags ? suggestions?.tags : null
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
            <Sparkles size={20} className="animate-pulse" />
            <h3 className="text-lg font-bold">এআই ম্যাজিক (AI Suggestions)</h3>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-auto bg-gray-50 dark:bg-slate-900/50 space-y-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="animate-spin text-indigo-500" size={40} />
              <p className="text-gray-500 dark:text-slate-400 font-medium animate-pulse">এআই আপনার আর্টিকেলের ওপর কাজ করছে...</p>
            </div>
          ) : (
            <>
              {/* Titles */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">১</div>
                  আকর্ষণীয় শিরোনাম বেছে নিন
                </h4>
                <div className="space-y-2 pl-8">
                  {suggestions?.titles?.map((title, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedTitle(title)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedTitle === title ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-transparent bg-white dark:bg-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 shadow-sm'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selectedTitle === title ? 'border-indigo-500' : 'border-gray-300 dark:border-slate-600'}`}>
                          {selectedTitle === title && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                        </div>
                        <p className={`text-sm font-medium ${selectedTitle === title ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-700 dark:text-slate-300'}`}>{title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              {suggestions?.summary && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">২</div>
                    খবরের সারাংশ (Summary)
                  </h4>
                  <div className="pl-8">
                    <label className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm cursor-pointer hover:border-purple-200 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={includeSummary} 
                        onChange={(e) => setIncludeSummary(e.target.checked)}
                        className="mt-1 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{suggestions.summary}</p>
                    </label>
                  </div>
                </div>
              )}

              {/* Tags */}
              {suggestions?.tags && suggestions.tags.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center text-pink-600 dark:text-pink-400">৩</div>
                    এসইও ট্যাগ (SEO Tags)
                  </h4>
                  <div className="pl-8">
                    <label className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm cursor-pointer hover:border-pink-200 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={includeTags} 
                        onChange={(e) => setIncludeTags(e.target.checked)}
                        className="rounded text-pink-600 focus:ring-pink-500"
                      />
                      <div className="flex flex-wrap gap-2">
                        {suggestions.tags.map((tag, idx) => (
                          <span key={idx} className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2.5 py-1 rounded-md text-xs font-medium">#{tag}</span>
                        ))}
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3">
          <button 
            onClick={onCancel} 
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl dark:text-gray-300 dark:hover:bg-slate-800 transition-colors"
          >
            বাতিল
          </button>
          <button 
            onClick={handleApply} 
            disabled={isGenerating || (!selectedTitle && !includeSummary && !includeTags)}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-md transition-all hover:shadow-lg"
          >
            <CheckCircle2 size={18} /> প্রোফাইলে যুক্ত করুন
          </button>
        </div>
      </div>
    </div>
  )
}
