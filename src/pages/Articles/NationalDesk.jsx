import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, Edit, CheckCircle, XCircle, Send, X } from 'lucide-react';
import { bangladeshLocations } from '../../utils/locationData';

function MediaThumbnail({ coverImage, thumbnail, videoUrl, className = "w-16 h-12" }) {
  const imgUrl = coverImage || thumbnail
  if (imgUrl && !imgUrl.includes('unsplash.com')) {
    const src = imgUrl.startsWith('/uploads') ? `http://localhost:5001${imgUrl}` : imgUrl
    return <img src={src} alt="thumbnail" className={`${className} object-cover rounded flex-shrink-0 border border-gray-200 shadow-sm`} />
  }
  if (videoUrl) {
    const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
    if (ytMatch) {
      return (
        <div className={`relative ${className} flex-shrink-0 rounded overflow-hidden border border-gray-200 shadow-sm bg-black flex items-center justify-center`}>
          <img src={`https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`} alt="video thumbnail" className="w-full h-full object-cover opacity-90" />
          <span className="absolute inset-0 flex items-center justify-center text-white bg-black/30 text-xs">🎥</span>
        </div>
      )
    }
    if (videoUrl.includes('facebook.com') || videoUrl.includes('fb.watch')) {
      let embedUrl = videoUrl;
      const reelMatch = videoUrl.match(/\/reel\/(\d+)/);
      if (reelMatch && reelMatch[1]) {
        embedUrl = `https://www.facebook.com/watch/?v=${reelMatch[1]}`;
      }
      return (
        <div className={`relative ${className} flex-shrink-0 rounded overflow-hidden border border-gray-200 shadow-sm bg-black flex items-center justify-center`}>
          <iframe src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(embedUrl)}&show_text=false&width=200`} style={{ width: '100%', height: '100%', border: 'none', overflow: 'hidden' }} className="pointer-events-none opacity-90" scrolling="no" frameBorder="0" allowFullScreen={true} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
          <span className="absolute inset-0 flex items-center justify-center text-white bg-black/30 text-xs pointer-events-none">🎥</span>
        </div>
      )
    }
    if (videoUrl.startsWith('/uploads') || videoUrl.match(/\.(mp4|webm|ogg|mov)$/i)) {
      const vSrc = videoUrl.startsWith('/uploads') ? `http://localhost:5001${videoUrl}` : videoUrl
      return (
        <div className={`relative ${className} flex-shrink-0 rounded overflow-hidden border border-gray-200 shadow-sm bg-black flex items-center justify-center`}>
          <video src={vSrc} className="w-full h-full object-cover opacity-90" muted playsInline preload="metadata" />
          <span className="absolute inset-0 flex items-center justify-center text-white bg-black/30 text-xs">🎥</span>
        </div>
      )
    }
    return (
      <div className={`${className} rounded bg-slate-900 border border-slate-700 flex flex-col items-center justify-center text-white text-[10px] font-bold shadow-sm flex-shrink-0`}>
        <span className="text-[10px]">🎥</span>
      </div>
    )
  }
  return (
    <div className={`${className} rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] text-gray-400 flex-shrink-0`}>
      ছবি নেই
    </div>
  )
}

export default function NationalDesk() {
  const assignmentTypes = (() => {
    const stored = localStorage.getItem('cms_assignment_types')
    return stored ? JSON.parse(stored) : ['রিপোর্টিং', 'ফিচার', 'স্পেশাল স্টোরি', 'ফলোআপ', 'ইন্টারভিউ', 'ভিডিও স্টোরি', 'ইনভেস্টিগেশন']
  })()

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bureauFilter, setBureauFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [upazilaFilter, setUpazilaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [correspondents, setCorrespondents] = useState([]);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentAssignee, setAssignmentAssignee] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  
  const [assignDivision, setAssignDivision] = useState('');
  const [assignDistrict, setAssignDistrict] = useState('');
  const [assignUpazila, setAssignUpazila] = useState('');
  const [assignDateTime, setAssignDateTime] = useState('');
  const [assignType, setAssignType] = useState('সাধারণ সংবাদ');
  const [assignPriority, setAssignPriority] = useState('সাধারণ');
  const [reqImage, setReqImage] = useState(false);
  const [reqVideo, setReqVideo] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticles();
  }, [bureauFilter, divisionFilter, districtFilter, upazilaFilter, statusFilter]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = { isBureau: 'true' };
      if (bureauFilter) params.source = bureauFilter;
      if (divisionFilter) params.division = divisionFilter;
      if (districtFilter) params.district = districtFilter;
      if (upazilaFilter) params.upazila = upazilaFilter;
      if (statusFilter) params.editorialStatus = statusFilter;

      const response = await axios.get('http://localhost:5001/api/articles', { params });
      setArticles(response.data);
      
      const res = await axios.get('http://localhost:5001/api/correspondents', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setCorrespondents(res.data);
    } catch (error) {
      console.error('Error fetching national desk articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.patch(`http://localhost:5001/api/articles/${id}/editorial`, { status: newStatus });
      fetchArticles();
    } catch (error) {
      alert('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  const handleCreateAssignment = async () => {
    try {
      await axios.post('http://localhost:5001/api/assignments', {
        title: assignmentTitle,
        description: assignmentDesc,
        assigneeName: assignmentAssignee,
        department: 'National',
        deadline: assignDateTime ? new Date(assignDateTime).toISOString() : new Date(Date.now() + 86400000).toISOString(),
        status: 'pending',
        division: assignDivision,
        district: assignDistrict,
        upazila: assignUpazila,
        type: assignType,
        priority: assignPriority,
        requiresImage: reqImage,
        requiresVideo: reqVideo
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('অ্যাসাইনমেন্ট পাঠানো হয়েছে!');
      setIsAssignmentModalOpen(false);
      setAssignmentTitle('');
      setAssignmentDesc('');
    } catch (err) {
      alert('অ্যাসাইনমেন্ট তৈরিতে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">জাতীয় ডেস্ক (National Desk)</h1>
          <p className="text-gray-600 text-sm mt-1">মফস্বল ও ব্যুরো অফিসের খবরের সেন্ট্রাল হাব</p>
        </div>
        <button 
          onClick={() => setIsAssignmentModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
        >
          <Send size={18} />
          <span>নতুন অ্যাসাইনমেন্ট দিন</span>
        </button>
      </div>

      <div className="mb-6 bg-white rounded-lg shadow-sm border">
        <div className="p-4 bg-gray-50 border-b flex gap-4 items-center rounded-t-lg">
          <Filter size={18} className="text-gray-500" />
          <span className="font-semibold text-gray-700">ফিল্টার করুন:</span>
          
          <select 
            value={divisionFilter} 
            onChange={(e) => {
              setDivisionFilter(e.target.value);
              setDistrictFilter('');
              setUpazilaFilter('');
            }}
            className="border rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">সব বিভাগ</option>
            {Object.keys(bangladeshLocations).map(div => (
              <option key={div} value={div}>{div}</option>
            ))}
          </select>

          <select 
            value={districtFilter} 
            onChange={(e) => {
              setDistrictFilter(e.target.value);
              setUpazilaFilter('');
            }}
            disabled={!divisionFilter}
            className="border rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">সব জেলা</option>
            {divisionFilter && Object.keys(bangladeshLocations[divisionFilter] || {}).map(dist => (
              <option key={dist} value={dist}>{dist}</option>
            ))}
          </select>

          <select 
            value={upazilaFilter} 
            onChange={(e) => setUpazilaFilter(e.target.value)}
            disabled={!districtFilter}
            className="border rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">সব উপজেলা</option>
            {divisionFilter && districtFilter && (bangladeshLocations[divisionFilter][districtFilter] || []).map(upz => (
              <option key={upz} value={upz}>{upz}</option>
            ))}
          </select>

          <select 
            value={bureauFilter} 
            onChange={(e) => setBureauFilter(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">সব ব্যুরো/সোর্স</option>
            <option value="চট্টগ্রাম ব্যুরো">চট্টগ্রাম ব্যুরো</option>
            <option value="রাজশাহী ব্যুরো">রাজশাহী ব্যুরো</option>
            <option value="সিলেট ব্যুরো">সিলেট ব্যুরো</option>
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">সব স্ট্যাটাস</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-center text-gray-500 bg-white rounded-lg shadow-sm border">লোড হচ্ছে...</div>
      ) : articles.length === 0 ? (
        <div className="p-6 text-center text-gray-500 bg-white rounded-lg shadow-sm border">কোনো নিউজ পাওয়া যায়নি।</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(divisionFilter ? [divisionFilter] : Object.keys(bangladeshLocations)).map(divName => {
            const divArticles = articles.filter(article => article.division === divName);
            
            return (
              <div key={divName} className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[500px]">
                {/* User Requested Style Header */}
                <div className="p-5 border-b border-gray-100 shrink-0 flex justify-between items-center">
                  <div className="text-gray-500 font-semibold text-lg">{divName} বিভাগ</div>
                  <div className={`text-4xl font-bold ${divArticles.length > 0 ? 'text-[#e67e22]' : 'text-slate-800'}`}>
                    {divArticles.length.toString().replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d])}
                  </div>
                </div>
                
                <div className="overflow-y-auto p-0 flex-1 bg-gray-50/30">
                  {divArticles.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
                      <Search size={32} className="mb-2 text-gray-300" />
                      এই বিভাগে নতুন কোনো নিউজ নেই
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-sm bg-white">
                      <thead className="sticky top-0 bg-gray-100 shadow-sm">
                        <tr className="text-gray-700">
                          <th className="p-2 border-b font-medium w-1/2">শিরোনাম</th>
                          <th className="p-2 border-b font-medium">স্ট্যাটাস/রিপোর্টার</th>
                          <th className="p-2 border-b font-medium text-right">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody>
                        {divArticles.map(article => (
                          <tr key={article._id} className="border-b hover:bg-gray-50 last:border-b-0">
                            <td className="p-2 align-top">
                              <div className="flex gap-2">
                                <MediaThumbnail coverImage={article.coverImage} thumbnail={article.thumbnail} videoUrl={article.videoUrl} className="w-14 h-10" />
                                <div>
                                  <div className="font-medium text-gray-900 line-clamp-2" title={article.title}>{article.title}</div>
                                  <div className="text-xs text-gray-500 mt-1">{article.district || '-'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-2 align-top">
                              <span className={`inline-block mb-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                                article.editorialStatus === 'published' ? 'bg-green-100 text-green-800' : 
                                article.editorialStatus === 'rejected' ? 'bg-red-100 text-red-800' : 
                                article.editorialStatus === 'approved' ? 'bg-blue-100 text-blue-800' : 
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {article.editorialStatus || 'draft'}
                              </span>
                              <div className="text-[11px] text-gray-600 truncate max-w-[80px]" title={article.assigneeName || 'অজানা'}>
                                {article.assigneeName || 'অজানা'}
                              </div>
                            </td>
                            <td className="p-2 align-top text-right">
                              <div className="flex gap-1 justify-end">
                                <button 
                                  onClick={() => navigate(`/articles/edit/${article._id}`)}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="সম্পাদনা করুন"
                                >
                                  <Edit size={14} />
                                </button>
                                {article.editorialStatus !== 'published' && (
                                  <button 
                                    onClick={() => handleUpdateStatus(article._id, 'approved')}
                                    className="p-1 text-green-600 hover:bg-green-100 rounded" title="Approve"
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleUpdateStatus(article._id, 'rejected')}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded" title="Reject"
                                >
                                  <XCircle size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b shrink-0">
              <h2 className="text-lg font-semibold">নতুন অ্যাসাইনমেন্ট দিন</h2>
              <button onClick={() => setIsAssignmentModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">এসাইনমেন্টের বিষয় (Title)</label>
                  <textarea value={assignmentTitle} onChange={(e) => setAssignmentTitle(e.target.value)} className="w-full border p-2 rounded resize-y" rows="2" placeholder="যেমন: বন্যার খোঁজখবর" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">তারিখ ও সময়</label>
                  <input type="datetime-local" value={assignDateTime} onChange={(e) => setAssignDateTime(e.target.value)} className="w-full border p-2 rounded" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">প্রায়োরিটি (Priority)</label>
                  <select value={assignPriority} onChange={(e) => setAssignPriority(e.target.value)} className="w-full border p-2 rounded">
                    <option value="সাধারণ">সাধারণ (Normal)</option>
                    <option value="জরুরি">জরুরি (High)</option>
                    <option value="খুব জরুরি">খুব জরুরি (Urgent)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">বিভাগ</label>
                  <select value={assignDivision} onChange={(e) => {setAssignDivision(e.target.value); setAssignDistrict(''); setAssignUpazila('');}} className="w-full border p-2 rounded">
                    <option value="">নির্বাচন করুন</option>
                    {Object.keys(bangladeshLocations).map(div => <option key={div} value={div}>{div}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">জেলা</label>
                  <select value={assignDistrict} onChange={(e) => {setAssignDistrict(e.target.value); setAssignUpazila('');}} disabled={!assignDivision} className="w-full border p-2 rounded disabled:bg-gray-100">
                    <option value="">নির্বাচন করুন</option>
                    {assignDivision && Object.keys(bangladeshLocations[assignDivision] || {}).map(dist => <option key={dist} value={dist}>{dist}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">উপজেলা</label>
                  <select value={assignUpazila} onChange={(e) => setAssignUpazila(e.target.value)} disabled={!assignDistrict} className="w-full border p-2 rounded disabled:bg-gray-100">
                    <option value="">নির্বাচন করুন</option>
                    {assignDivision && assignDistrict && (bangladeshLocations[assignDivision][assignDistrict] || []).map(upz => <option key={upz} value={upz}>{upz}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">এসাইন টু (প্রতিনিধি)</label>
                  {assignDivision || assignDistrict ? (
                    <select value={assignmentAssignee} onChange={(e) => setAssignmentAssignee(e.target.value)} className="w-full border p-2 rounded">
                      <option value="">নির্বাচন করুন</option>
                      {correspondents.filter(c => {
                        if (assignUpazila && c.upazila !== assignUpazila) return false;
                        if (assignDistrict && c.district !== assignDistrict) return false;
                        if (assignDivision && c.division !== assignDivision) return false;
                        return true;
                      }).map(c => (
                        <option key={c._id} value={c.name}>{c.name} {c.designation ? `- ${c.designation}` : ''} ({c.phone})</option>
                      ))}
                      <option value="অন্যান্য">অন্যান্য (ম্যানুয়ালি লিখুন)</option>
                    </select>
                  ) : (
                    <input type="text" value={assignmentAssignee} onChange={(e) => setAssignmentAssignee(e.target.value)} className="w-full border p-2 rounded" placeholder="প্রথমে বিভাগ/জেলা নির্বাচন করুন..." disabled />
                  )}
                  {assignmentAssignee === 'অন্যান্য' && (
                    <input type="text" onChange={(e) => setAssignmentAssignee(e.target.value)} className="w-full border p-2 rounded mt-2" placeholder="প্রতিনিধির নাম লিখুন..." />
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">এসাইনমেন্ট টাইপ</label>
                  <select value={assignType} onChange={(e) => setAssignType(e.target.value)} className="w-full border p-2 rounded">
                    <option value="সাধারণ (General)">সাধারণ (General)</option>
                    {assignmentTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium mb-2">মিডিয়া রিকোয়ারমেন্ট</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={reqImage} onChange={(e) => setReqImage(e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">ছবি লাগবে</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={reqVideo} onChange={(e) => setReqVideo(e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">ভিডিও লাগবে</span>
                  </label>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium mb-1">বিস্তারিত নির্দেশনা</label>
                <textarea value={assignmentDesc} onChange={(e) => setAssignmentDesc(e.target.value)} className="w-full border p-2 rounded resize-y" rows="4" placeholder="রিপোর্টারকে কী করতে হবে..."></textarea>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 p-4 border-t shrink-0 bg-gray-50 rounded-b-lg">
              <button onClick={() => setIsAssignmentModalOpen(false)} className="px-4 py-2 border bg-white rounded shadow-sm hover:bg-gray-50">বাতিল</button>
              <button onClick={handleCreateAssignment} className="px-6 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700">অ্যাসাইন করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
