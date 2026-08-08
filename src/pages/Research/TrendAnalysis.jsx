import React, { useState } from 'react';
import ResearchDashboard from './ResearchDashboard';
import { TrendingUp, Search, ExternalLink, Globe, BarChart2 } from 'lucide-react';

export default function TrendAnalysis() {
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('বাংলাদেশ');

  const trendingTopics = [
    'বাংলাদেশ', 'রাজনীতি', 'খেলাধুলা', 'আবহাওয়া', 'শেয়ার বাজার', 'প্রযুক্তি'
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      setSearchKeyword(keyword.trim());
    }
  };

  return (
    <ResearchDashboard>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Clean, well-spaced Header & Search */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <TrendingUp size={28} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              ট্রেন্ড বিশ্লেষণ
            </h2>
          </div>
          
          <p className="text-slate-500 dark:text-slate-400 text-base mb-6 max-w-2xl">
            বর্তমান সময়ে মানুষ কোন বিষয়ে বেশি খুঁজছে এবং কোন খবরটি ভাইরাল হওয়ার সম্ভাবনা বেশি, তা রিয়েলটাইমে বিশ্লেষণ করুন।
          </p>
          
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="যেকোনো বিষয় বা কি-ওয়ার্ড লিখুন..."
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow text-base"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-base shadow-sm"
            >
              বিশ্লেষণ করুন <Search size={18} />
            </button>
          </form>
        </div>

        {/* Embedded Trends Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm w-full">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg">
              "{searchKeyword}" এর জন্য ট্রেন্ড (গত ১২ মাস)
            </h3>
            <button 
              onClick={() => window.open(`https://trends.google.com/trends/explore?geo=BD&q=${encodeURIComponent(searchKeyword)}`, '_blank')}
              className="text-sm flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium"
            >
              গুগল ট্রেন্ডসে খুলুন <ExternalLink size={14} />
            </button>
          </div>
          <div className="w-full h-[450px] rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
             <iframe
                id="trends-widget-iframe"
                src={`https://trends.google.com:443/trends/embed/explore/TIMESERIES?req=%7B%22comparisonItem%22%3A%5B%7B%22keyword%22%3A%22${encodeURIComponent(searchKeyword)}%22%2C%22geo%22%3A%22BD%22%2C%22time%22%3A%22today%2012-m%22%7D%5D%2C%22category%22%3A0%2C%22property%22%3A%22%22%7D&tz=-360&eq=q%3D${encodeURIComponent(searchKeyword)}%26geo%3DBD%26date%3Dtoday%2012-m`}
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                title="Google Trends Widget"
             ></iframe>
          </div>
        </div>

        {/* Categories & Links in a comfortable grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trending Topics */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-5 text-lg flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                <BarChart2 size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              জনপ্রিয় টপিক (বাংলাদেশ)
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {trendingTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => {
                    setSearchKeyword(topic);
                    setKeyword(topic);
                  }}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* External Tools */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-5 text-lg flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                <Globe size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              অন্যান্য ট্রেন্ডস টুলস
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a 
                href="https://trends.google.com/trends/trendingsearches/daily?geo=IN" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-base font-bold shrink-0">G</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Google Daily Trends</h4>
                  <p className="text-xs text-slate-500 mt-0.5">রিয়েলটাইম সার্চ ডেটা</p>
                </div>
              </a>
              
              <a 
                href="https://twitter.com/explore/tabs/trending" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-300 text-base font-bold shrink-0">X</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">X Trends</h4>
                  <p className="text-xs text-slate-500 mt-0.5">সোশ্যাল মিডিয়া টপিক</p>
                </div>
              </a>
            </div>
          </div>
        </div>

      </div>
    </ResearchDashboard>
  );
}
