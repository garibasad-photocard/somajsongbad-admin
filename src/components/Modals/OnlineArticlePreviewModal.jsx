import { useState } from 'react';
import { X, Monitor, Tablet, Smartphone } from 'lucide-react';

const OnlineArticlePreviewModal = ({ isOpen, onClose, articleData }) => {
  const [device, setDevice] = useState('desktop'); // desktop, tablet, mobile

  if (!isOpen) return null;

  const {
    title = '',
    byline = '',
    content = '',
    synopsis = '',
    coverImagePreview = '',
  } = articleData || {};

  const getDeviceWidth = () => {
    switch (device) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': default: return '100%';
    }
  };

  const getDeviceClasses = () => {
    switch (device) {
      case 'mobile': return 'mx-auto border-[8px] border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl h-[80vh] transition-all duration-300 relative';
      case 'tablet': return 'mx-auto border-[8px] border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl h-[80vh] transition-all duration-300 relative';
      case 'desktop': default: return 'w-full h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-y-auto transition-all duration-300';
    }
  };

  const actualContent = synopsis || content || '<p>কোনো বিস্তারিত খবর নেই।</p>';

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col p-4 sm:p-6"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)' }}
      onClick={onClose}
    >
      {/* Top Bar / Controls */}
      <div className="flex items-center justify-between mb-6 px-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setDevice('desktop')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                device === 'desktop' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor size={16} /> ডেস্কটপ
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                device === 'tablet' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tablet size={16} /> ট্যাব
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                device === 'mobile' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone size={16} /> মোবাইল
            </button>
          </div>
        </div>
        
        <button onClick={onClose} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
          <X size={20}/>
        </button>
      </div>

      {/* Device Preview Canvas */}
      <div className="flex-1 flex justify-center items-start overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className={getDeviceClasses()} style={{ width: getDeviceWidth() }}>
          
          {/* Mock Browser Header for Desktop */}
          {device === 'desktop' && (
            <div className="bg-gray-100 border-b border-gray-200 h-10 flex items-center px-4 gap-2 sticky top-0 z-10">
              <div className="w-3 h-3 rounded-full bg-rose-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              <div className="ml-4 bg-white px-3 py-1 text-xs text-gray-500 rounded-md w-64 shadow-sm font-mono truncate">
                aajokal.com/news/preview
              </div>
            </div>
          )}

          {/* Device Speaker Notch for Mobile/Tablet */}
          {(device === 'mobile' || device === 'tablet') && (
            <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20 pointer-events-none">
              <div className="w-32 h-6 bg-slate-800 rounded-b-xl flex items-center justify-center">
                <div className="w-12 h-1.5 bg-slate-950 rounded-full"></div>
              </div>
            </div>
          )}

          {/* Web Page Content Simulation */}
          <div className="bg-white w-full h-full overflow-y-auto">
            {/* Mock Nav Bar */}
            <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10">
              <div className="font-black text-indigo-700 text-xl tracking-tighter">AAJOKAL</div>
              <div className="flex gap-4">
                <div className="w-6 h-1 bg-gray-300 rounded-full"></div>
                <div className="w-6 h-1 bg-gray-300 rounded-full"></div>
                <div className="w-6 h-1 bg-gray-300 rounded-full"></div>
              </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight font-serif">
                {title || 'শিরোনাম এখানে বসবে'}
              </h1>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                  <UserIcon />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{byline || 'নিজস্ব প্রতিবেদক'}</p>
                  <p className="text-xs text-gray-500">{new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              {coverImagePreview && (
                <div className="mb-8 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={coverImagePreview} alt="Cover" className="w-full h-auto object-cover max-h-[500px]" />
                </div>
              )}

              <article className="prose prose-slate max-w-none md:prose-lg text-gray-800 leading-relaxed font-serif whitespace-pre-wrap">
                {actualContent}
              </article>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

export default OnlineArticlePreviewModal;
