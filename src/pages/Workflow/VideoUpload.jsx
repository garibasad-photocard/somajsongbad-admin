import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader, Video, Globe, Camera, Music, X, LayoutDashboard, Clock } from 'lucide-react';
import api from '../../services/api';

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', icon: Video, color: 'text-red-500' },
  { id: 'facebook', name: 'Facebook', icon: Globe, color: 'text-blue-600' },
  { id: 'instagram', name: 'Instagram', icon: Camera, color: 'text-pink-600' },
  { id: 'tiktok', name: 'TikTok', icon: Music, color: 'text-gray-900 dark:text-white' },
];

export default function VideoUpload() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'dashboard'
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['youtube', 'facebook']);
  
  const [uploading, setUploading] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [uploadId, setUploadId] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle', 'uploading_local', 'processing_social', 'completed'
  const [socialProgress, setSocialProgress] = useState(null);
  
  const [dashboardData, setDashboardData] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const stats = {
    total: dashboardData.length,
    youtube: dashboardData.filter(d => d.platforms.some(p => p.platformName === 'youtube' && p.status === 'published')).length,
    facebook: dashboardData.filter(d => d.platforms.some(p => p.platformName === 'facebook' && p.status === 'published')).length,
    instagram: dashboardData.filter(d => d.platforms.some(p => p.platformName === 'instagram' && p.status === 'published')).length,
    tiktok: dashboardData.filter(d => d.platforms.some(p => p.platformName === 'tiktok' && p.status === 'published')).length,
    failed: dashboardData.filter(d => d.platforms.some(p => p.status === 'failed')).length
  };

  const fileInputRef = useRef(null);

  // Fetch Dashboard Data
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard();
    }
  }, [activeTab]);

  const fetchDashboard = async () => {
    try {
      setLoadingDashboard(true);
      const res = await api.get('/social/uploads');
      setDashboardData(res.data || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Polling for social media upload status
  useEffect(() => {
    let interval;
    if (uploadId && status === 'processing_social') {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/social/status/${uploadId}`);
          setSocialProgress(res.data);
          
          if (res.data.status === 'completed' || res.data.status === 'failed') {
            setStatus(res.data.status);
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Failed to poll status", err);
        }
      }, 3000); // Check every 3 seconds
    }
    return () => clearInterval(interval);
  }, [uploadId, status]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const togglePlatform = (id) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('দয়া করে একটি ভিডিও ফাইল নির্বাচন করুন');
    if (!title) return alert('ভিডিওর টাইটেল আবশ্যক');
    if (selectedPlatforms.length === 0) return alert('অন্তত একটি সোশ্যাল মিডিয়া প্ল্যাটফর্ম নির্বাচন করুন');

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tags', tags);
    formData.append('platforms', JSON.stringify(selectedPlatforms));

    try {
      setUploading(true);
      setStatus('uploading_local');
      setLocalProgress(0);

      const res = await api.post('/social/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setLocalProgress(percentCompleted);
        }
      });

      setUploadId(res.data.uploadId);
      setStatus('processing_social');
      
    } catch (error) {
      console.error('Upload Error', error);
      alert('ভিডিও আপলোডে সমস্যা হয়েছে।');
      setStatus('idle');
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setTags('');
    setUploading(false);
    setStatus('idle');
    setUploadId(null);
    setSocialProgress(null);
    setLocalProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Video className="text-orange-500" />
            মাল্টিমিডিয়া ভিডিও আপলোড
          </h1>
          <p className="text-sm text-gray-500 mt-1">আপনার ভিডিও লোকাল সার্ভার থেকে সব সোশ্যাল প্ল্যাটফর্মে পাবলিশ করুন</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'upload' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <UploadCloud size={16} />
            নতুন আপলোড
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'dashboard' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutDashboard size={16} />
            স্মার্ট ড্যাশবোর্ড
          </button>
        </div>
      </div>

      {activeTab === 'upload' && status === 'idle' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Uploader */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl p-12 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current.click()}
          >
            <input 
              type="file" 
              accept="video/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            
            {file ? (
              <div className="text-center">
                <Video size={48} className="mx-auto text-blue-500 mb-4" />
                <p className="font-bold text-gray-900 dark:text-white text-lg">{file.name}</p>
                <p className="text-gray-500 text-sm mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-4 px-4 py-2 bg-rose-100 text-rose-600 rounded-lg text-sm font-bold hover:bg-rose-200"
                >
                  ফাইল বাতিল করুন
                </button>
              </div>
            ) : (
              <div className="text-center">
                <UploadCloud size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="font-bold text-gray-700 dark:text-slate-300">ভিডিও ড্র্যাগ এন্ড ড্রপ করুন অথবা সিলেক্ট করুন</p>
                <p className="text-gray-500 text-sm mt-1">MP4, MOV, AVI (Max 3GB)</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">টাইটেল (Title) *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  placeholder="ভিডিওর শিরোনাম..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">ডেসক্রিপশন (Description)</label>
                <textarea 
                  rows={4}
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  placeholder="ভিডিও সম্পর্কে বিস্তারিত..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">ট্যাগ (Tags)</label>
                <input 
                  type="text" 
                  value={tags} 
                  onChange={e => setTags(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  placeholder="কমা দিয়ে আলাদা করুন (যেমন: news, live, sports)"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">কোথায় পাবলিশ হবে? *</label>
              <div className="grid grid-cols-1 gap-3">
                {PLATFORMS.map(p => {
                  const Icon = p.icon;
                  const isSelected = selectedPlatforms.includes(p.id);
                  return (
                    <div 
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                        {isSelected && <CheckCircle size={16} className="text-white" />}
                      </div>
                      <Icon size={24} className={p.color} />
                      <span className="font-bold text-gray-900 dark:text-white">{p.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit"
              disabled={uploading || !file || !title || selectedPlatforms.length === 0}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
            >
              <UploadCloud size={20} />
              আপলোড শুরু করুন
            </button>
          </div>
        </form>
      )}

      {activeTab === 'upload' && status !== 'idle' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8">
          <div className="text-center mb-8">
            {status === 'uploading_local' && <Loader size={48} className="mx-auto text-blue-500 animate-spin mb-4" />}
            {status === 'processing_social' && <UploadCloud size={48} className="mx-auto text-orange-500 animate-bounce mb-4" />}
            {status === 'completed' && <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />}
            {status === 'failed' && <AlertCircle size={48} className="mx-auto text-rose-500 mb-4" />}
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {status === 'uploading_local' && 'লোকাল সার্ভারে আপলোড হচ্ছে...'}
              {status === 'processing_social' && 'সোশ্যাল মিডিয়ায় পাবলিশ হচ্ছে...'}
              {status === 'completed' && 'আপলোড সফলভাবে সম্পন্ন হয়েছে!'}
              {status === 'failed' && 'কিছু প্ল্যাটফর্মে আপলোড ফেইল করেছে'}
            </h2>
            <p className="text-gray-500 mt-2">
              {status === 'uploading_local' && 'আপনার পিসি থেকে CMS সার্ভারে ভিডিও পাঠানো হচ্ছে। ট্যাবটি কাটবেন না।'}
              {status === 'processing_social' && 'CMS সার্ভার এখন সোশ্যাল মিডিয়ায় ভিডিও পাঠাচ্ছে। আপনি চাইলে অন্য কাজ করতে পারেন।'}
            </p>
          </div>

          {status === 'uploading_local' && (
            <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-4 mb-4 overflow-hidden">
              <div className="bg-blue-500 h-4 rounded-full transition-all duration-300" style={{ width: `${localProgress}%` }}></div>
            </div>
          )}

          {socialProgress && socialProgress.platforms && (
            <div className="space-y-4 mt-8">
              <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-800 pb-2">প্ল্যাটফর্ম স্ট্যাটাস:</h3>
              {socialProgress.platforms.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-700 dark:text-slate-300 w-24">{p.platformName}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase
                      ${p.status === 'pending' ? 'bg-gray-200 text-gray-600' : ''}
                      ${p.status === 'uploading' ? 'bg-blue-100 text-blue-600 animate-pulse' : ''}
                      ${p.status === 'published' ? 'bg-emerald-100 text-emerald-600' : ''}
                      ${p.status === 'failed' ? 'bg-rose-100 text-rose-600' : ''}
                    `}>
                      {p.status}
                    </span>
                  </div>
                  <div>
                    {p.status === 'uploading' && <Loader size={18} className="animate-spin text-blue-500" />}
                    {p.status === 'published' && <a href={p.publishedUrl || '#'} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Link</a>}
                    {p.status === 'failed' && <span className="text-sm text-rose-500">{p.errorLog}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(status === 'completed' || status === 'failed') && (
            <div className="mt-8 text-center flex items-center justify-center gap-4">
              <button 
                onClick={resetForm}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
              >
                নতুন ভিডিও আপলোড করুন
              </button>
              <button 
                onClick={() => { resetForm(); setActiveTab('dashboard'); }}
                className="px-6 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700"
              >
                ড্যাশবোর্ডে ফিরে যান
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Smart Dashboard Stats Blocks */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                <Video className="text-blue-500" size={24} />
              </div>
              <p className="text-gray-500 text-sm font-bold">ভিডিও</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                <Video className="text-red-500" size={24} />
              </div>
              <p className="text-gray-500 text-sm font-bold">YouTube</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stats.youtube}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                <Globe className="text-blue-600" size={24} />
              </div>
              <p className="text-gray-500 text-sm font-bold">Facebook</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stats.facebook}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-pink-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                <Camera className="text-pink-600" size={24} />
              </div>
              <p className="text-gray-500 text-sm font-bold">Instagram</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stats.instagram}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                <Music className="text-gray-900 dark:text-white" size={24} />
              </div>
              <p className="text-gray-500 text-sm font-bold">TikTok</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stats.tiktok}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-rose-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                <AlertCircle className="text-rose-500" size={24} />
              </div>
              <p className="text-gray-500 text-sm font-bold">Failed</p>
              <p className="text-3xl font-black text-rose-600 mt-1">{stats.failed}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <LayoutDashboard className="text-blue-500" size={20} /> 
              সাম্প্রতিক আপলোডসমূহ
            </h2>
            <button onClick={fetchDashboard} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
              <Loader size={14} className={loadingDashboard ? 'animate-spin' : 'hidden'} /> রিফ্রেশ করুন
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">ভিডিও টাইটেল</th>
                  <th className="px-6 py-4 font-bold">আপলোডের সময়</th>
                  <th className="px-6 py-4 font-bold">স্ট্যাটাস</th>
                  <th className="px-6 py-4 font-bold">প্ল্যাটফর্ম রিপোর্ট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                {dashboardData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      কোনো ভিডিও আপলোড করা হয়নি। 
                    </td>
                  </tr>
                ) : dashboardData.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 dark:text-white text-sm max-w-[250px] truncate">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Video size={12}/> {item.originalFileName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-600 dark:text-slate-400 flex items-center gap-1">
                        <Clock size={12} /> {new Date(item.createdAt).toLocaleString('bn-BD')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase
                        ${item.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : ''}
                        ${item.status === 'failed' ? 'bg-rose-100 text-rose-700' : ''}
                        ${item.status === 'uploading_to_social' ? 'bg-blue-100 text-blue-700 animate-pulse' : ''}
                        ${item.status === 'saved_locally' ? 'bg-yellow-100 text-yellow-700' : ''}
                      `}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {item.platforms.map((p, i) => {
                          let Icon = Globe;
                          if (p.platformName === 'youtube') Icon = Video;
                          if (p.platformName === 'facebook') Icon = Globe;
                          if (p.platformName === 'instagram') Icon = Camera;
                          
                          let bg = 'bg-gray-100 text-gray-400';
                          if (p.status === 'published') bg = 'bg-emerald-100 text-emerald-600';
                          if (p.status === 'uploading') bg = 'bg-blue-100 text-blue-600';
                          if (p.status === 'failed') bg = 'bg-rose-100 text-rose-600';

                          return (
                            <div key={i} title={`${p.platformName}: ${p.status}`} className={`w-7 h-7 rounded-full flex items-center justify-center ${bg}`}>
                              <Icon size={14} />
                            </div>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
