import React, { useState, useEffect } from 'react';
import { X, Save, Edit2 } from 'lucide-react';
import api from '../../services/api';

const OnlineQuickEditModal = ({ isOpen, onClose, assignmentId, articleId, onSaved, spellcheckEnabled = false }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen && articleId) {
      loadArticle();
    }
  }, [isOpen, articleId]);

  const loadArticle = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get('/articles/' + articleId);
      setTitle(res.data.title || '');
      setContent(res.data.content || '');
    } catch (err) {
      console.error(err);
      setErrorMsg('???????? ??? ???? ?????? ???????');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      await api.put('/articles/' + articleId, { title, content });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('??? ???? ?????? ???????');
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 sm:p-6" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-slate-800" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Edit2 size={18} className="text-indigo-500" /> ???? ????
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
              {errorMsg}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">??????? (Headline)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  spellCheck={spellcheckEnabled}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-base font-medium bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="??????? ?????..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                  <span>??? ?????? (Body)</span>
                  {spellcheckEnabled && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md">? Spell Check Active</span>}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={15}
                  spellCheck={spellcheckEnabled}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-serif leading-relaxed"
                  placeholder="????? ?????????..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  * Note: ??? ???? ????? ?????? ??? ??? ?? ????????? ?? ???? ??? ????? ??????? ?????
                </p>
              </div>
            </>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
            ?????
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading || saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-colors shadow-md shadow-indigo-500/20"
          >
            <Save size={16} /> {saving ? '??? ?????...' : '??? ????'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnlineQuickEditModal;
