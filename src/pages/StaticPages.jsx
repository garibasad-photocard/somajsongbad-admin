import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, FileText, Upload } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import api from '../services/api';

export default function StaticPages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ title: '', slug: '', content: '' });
  const [file, setFile] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Link,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      if (!editor.isDestroyed) {
        setFormData(prev => ({ ...prev, content: editor.getHTML() }));
      }
    },
  });

  const fetchPages = async () => {
    try {
      const res = await api.get('/pages');
      if (Array.isArray(res.data)) {
        setPages(res.data);
      } else {
        console.error('API did not return an array. Backend might need a restart.');
        setPages([]);
      }
    } catch (err) {
      console.error('Failed to fetch pages', err);
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  useEffect(() => {
    if (editor && !editor.isDestroyed && formData.content !== editor.getHTML()) {
      editor.commands.setContent(formData.content || '');
    }
  }, [formData.content, editor]);



  const handleEdit = (page) => {
    setFormData({ title: page.title, slug: page.slug, content: page.content || '' });
    setCurrentId(page._id);
    setFile(null);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;
    try {
      await api.delete(`/pages/${id}`);
      fetchPages();
    } catch (err) {
      alert('Failed to delete page');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('slug', formData.slug);
      data.append('content', formData.content);
      if (file) {
        data.append('attachment', file);
      }

      if (currentId) {
        await api.put(`/pages/${currentId}`, data);
      } else {
        await api.post('/pages', data);
      }

      setIsEditing(false);
      fetchPages();
      setFormData({ title: '', slug: '', content: '' });
      setFile(null);
      setCurrentId(null);
    } catch (err) {
      alert('Failed to save page. Slug must be unique.');
    }
  };

  const handleAddNew = () => {
    setFormData({ title: '', slug: '', content: '' });
    setCurrentId(null);
    setFile(null);
    setIsEditing(true);
    if (editor) editor.commands.setContent('');
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="text-blue-600" />
            স্ট্যাটিক পেজ
          </h1>
          <p className="text-gray-500 mt-1">ফুটারে থাকা কাস্টম পেজগুলো (যেমন: আমাদের সম্পর্কে) এখান থেকে এডিট করুন।</p>
        </div>
        {!isEditing && (
          <button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2">
            <Plus size={18} /> নতুন পেজ
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">পেজের টাইটেল</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="যেমন: আমাদের সম্পর্কে"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">স্লাগ (Slug / URL)</label>
                <input
                  required
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="যেমন: about-us"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">বিস্তারিত টেক্সট (Content)</label>
              <div className="border border-gray-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 min-h-[300px]">
                {editor && (
                  <div className="border-b border-gray-200 dark:border-slate-600 p-2 flex gap-2 bg-gray-50 dark:bg-slate-700 rounded-t-md">
                    <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded ${editor.isActive('bold') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-600'}`}><b>B</b></button>
                    <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded ${editor.isActive('italic') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-600'}`}><i>I</i></button>
                  </div>
                )}
                <EditorContent editor={editor} className="p-4 prose dark:prose-invert max-w-none focus:outline-none min-h-[250px]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">অ্যাটাচমেন্ট (ইমেজ বা পিডিএফ)</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-gray-100 dark:bg-slate-700 px-4 py-2 rounded border border-gray-300 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-600 flex items-center gap-2">
                  <Upload size={18} /> 
                  <span>ফাইল নির্বাচন করুন</span>
                  <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files[0])} />
                </label>
                <span className="text-sm text-gray-500">
                  {file ? file.name : 'কোনো ফাইল নির্বাচিত নেই'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
              <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 flex items-center gap-2">
                <X size={18} /> বাতিল
              </button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded flex items-center gap-2">
                <Save size={18} /> সেভ করুন
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-slate-400">টাইটেল</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-slate-400">স্লাগ</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-slate-400">অ্যাটাচমেন্ট</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-slate-400 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {pages.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-slate-400">কোনো পেজ পাওয়া যায়নি</td>
                </tr>
              ) : pages.map(page => (
                <tr key={page._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{page.title}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-slate-400">{page.slug}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                    {page.attachment ? (
                      <a href={`http://localhost:5001${page.attachment}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        ফাইল দেখুন
                      </a>
                    ) : 'নেই'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(page)} className="text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(page._id)} className="text-red-600 hover:text-red-800 bg-red-50 dark:bg-red-900/30 p-2 rounded">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
