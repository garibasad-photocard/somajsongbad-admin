import React, { useState, useEffect } from 'react';
import ResearchDashboard from './ResearchDashboard';
import { FileEdit, Plus, Trash2, Loader2, Save, X } from 'lucide-react';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';

export default function ResearchNotes() {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/research-data/notes');
      setNotes(res.data);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;
    
    try {
      await api.post('/research-data/notes', { 
        title: title.trim() || 'শিরোনামহীন নোট', 
        content: content.trim() 
      });
      setTitle('');
      setContent('');
      setIsAdding(false);
      fetchNotes();
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('নোটটি মুছে ফেলতে চান?')) {
      try {
        await api.delete(`/research-data/notes/${id}`);
        fetchNotes();
      } catch (err) {
        console.error('Error deleting note:', err);
      }
    }
  };

  return (
    <ResearchDashboard>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <FileEdit size={28} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">রিসার্চ নোটস</h2>
              <p className="text-slate-500 dark:text-slate-400">আপনার নিজস্ব চিন্তা, তথ্য ও খসড়া সংরক্ষণের জায়গা</p>
            </div>
          </div>
          {!isAdding && (
            <button 
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus size={18} />
              নতুন নোট
            </button>
          )}
        </div>

        {isAdding && (
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm animate-in fade-in slide-in-from-top-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <input 
                type="text"
                placeholder="নোটের শিরোনাম..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xl font-bold bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
              />
              <button 
                type="button"
                onClick={() => { setIsAdding(false); setTitle(''); setContent(''); }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <textarea 
              placeholder="বিস্তারিত নোট লিখুন..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[150px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-y mb-4"
            ></textarea>
            <div className="flex justify-end">
              <button 
                type="submit"
                disabled={!title.trim() && !content.trim()}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors flex items-center gap-2 shadow-sm"
              >
                <Save size={18} />
                সেভ করুন
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={40} className="animate-spin text-emerald-500" />
          </div>
        ) : notes.length === 0 && !isAdding ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors" onClick={() => setIsAdding(true)}>
            <FileEdit size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">কোনো নোট তৈরি করা হয়নি। নতুন নোট তৈরি করতে ক্লিক করুন।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map(note => (
              <div key={note._id} className="bg-amber-50/50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100/50 dark:border-amber-900/20 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>
                <div className="flex items-start justify-between mb-3 pl-3">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2">
                    {note.title}
                  </h3>
                  <button 
                    onClick={() => handleDelete(note._id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 pl-3 whitespace-pre-wrap flex-1">
                  {note.content}
                </p>

                <div className="mt-auto pt-3 pl-3 border-t border-amber-200/50 dark:border-amber-800/30">
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: bn })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ResearchDashboard>
  );
}
