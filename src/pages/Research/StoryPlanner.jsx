import { useState, useEffect } from 'react';
import ResearchDashboard from './ResearchDashboard';
import { Calendar as CalendarIcon, Plus, Edit2, Trash2, Tag, User, List, LayoutGrid, AlignLeft, AlertCircle } from 'lucide-react';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../../services/api';

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function StoryPlanner() {
  const [events, setEvents] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({ 
    title: '', 
    date: '', 
    category: 'জাতীয়', 
    assignedTo: '',
    status: 'Draft',
    priority: 'Medium',
    notes: ''
  });

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) return;
    
    try {
      if (editingId) {
        await api.put(`/events/${editingId}`, formData);
      } else {
        await api.post('/events', formData);
      }
      fetchEvents();
      resetForm();
    } catch (err) {
      console.error('Error saving event:', err);
    }
  };

  const handleEdit = (event) => {
    setEditingId(event._id);
    setFormData({
      title: event.title,
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
      category: event.category || 'জাতীয়',
      assignedTo: event.assignedTo || '',
      status: event.status || 'Draft',
      priority: event.priority || 'Medium',
      notes: event.notes || ''
    });
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('ইভেন্টটি মুছে ফেলতে চান?')) {
      try {
        await api.delete(`/events/${id}`);
        fetchEvents();
      } catch (err) {
        console.error('Error deleting event:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({ title: '', date: '', category: 'জাতীয়', assignedTo: '', status: 'Draft', priority: 'Medium', notes: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Prepare events for calendar
  const calendarEvents = events.map(e => ({
    id: e._id,
    title: e.title,
    start: new Date(e.date),
    end: new Date(e.date),
    resource: e
  }));

  const getStatusColor = (status) => {
    switch(status) {
      case 'Done': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
      case 'Assigned': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'text-red-500';
      case 'Medium': return 'text-amber-500';
      default: return 'text-slate-400';
    }
  };

  return (
    <ResearchDashboard>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">স্টোরি প্ল্যানার</h2>
              <p className="text-sm text-slate-500">আসন্ন ইভেন্ট ও সংবাদের রূপরেখা</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
              >
                <List size={18} />
              </button>
              <button 
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
            <button
              onClick={() => { resetForm(); setIsAdding(true); }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              নতুন ইভেন্ট
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {isAdding && (
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-top-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">{editingId ? 'ইভেন্ট সম্পাদনা' : 'নতুন ইভেন্ট যোগ করুন'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ইভেন্টের নাম *</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">তারিখ *</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ক্যাটাগরি</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option>জাতীয়</option>
                  <option>রাজনীতি</option>
                  <option>অর্থনীতি</option>
                  <option>খেলা</option>
                  <option>আন্তর্জাতিক</option>
                  <option>বিনোদন</option>
                  <option>প্রযুক্তি</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">স্ট্যাটাস</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option>Draft</option>
                  <option>Assigned</option>
                  <option>Done</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">অগ্রাধিকার (Priority)</label>
                <select 
                  value={formData.priority}
                  onChange={e => setFormData({...formData, priority: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">অ্যাসাইন করা হবে</label>
                <input 
                  type="text"
                  placeholder="রিপোর্টারের নাম"
                  value={formData.assignedTo}
                  onChange={e => setFormData({...formData, assignedTo: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">নোটস / বিস্তারিত</label>
                <input 
                  type="text"
                  placeholder="ইভেন্টের বিস্তারিত তথ্য..."
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button 
                type="button" 
                onClick={resetForm}
                className="px-5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
              >
                বাতিল
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        )}

        {/* View Mode */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-1">
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-sm">
                    <th className="p-4 font-semibold text-slate-500 dark:text-slate-400">তারিখ</th>
                    <th className="p-4 font-semibold text-slate-500 dark:text-slate-400">ইভেন্ট</th>
                    <th className="p-4 font-semibold text-slate-500 dark:text-slate-400">স্ট্যাটাস</th>
                    <th className="p-4 font-semibold text-slate-500 dark:text-slate-400">অ্যাসাইনি</th>
                    <th className="p-4 font-semibold text-slate-500 dark:text-slate-400 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEvents.map(event => (
                    <tr key={event._id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                          <CalendarIcon size={14} className="text-slate-400" />
                          {event.date ? format(new Date(event.date), 'dd MMM yyyy') : 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <AlertCircle size={14} className={getPriorityColor(event.priority)} />
                            <span className="font-bold text-slate-800 dark:text-slate-100 text-base">{event.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Tag size={12}/> {event.category}</span>
                            {event.notes && <span className="flex items-center gap-1 text-slate-400 truncate max-w-[200px]" title={event.notes}><AlignLeft size={12}/> {event.notes}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {event.assignedTo ? (
                          <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                            <User size={14} className="text-slate-400" />
                            {event.assignedTo}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400 italic">নির্ধারিত নয়</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(event)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
                            title="সম্পাদনা"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(event._id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sortedEvents.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-10 text-center text-slate-500">
                        কোনো ইভেন্ট নেই। নতুন ইভেন্ট যোগ করুন।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 h-[600px] custom-calendar-wrapper">
              <BigCalendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                views={['month', 'agenda']}
                defaultView="month"
                onSelectEvent={(e) => handleEdit(e.resource)}
                popup
                className="dark:text-slate-200"
                eventPropGetter={(event) => ({
                  className: `rounded-md px-2 py-1 text-xs font-semibold border-none ${
                    event.resource.status === 'Done' ? 'bg-green-500 text-white' :
                    event.resource.status === 'Assigned' ? 'bg-blue-500 text-white' :
                    'bg-slate-500 text-white'
                  }`
                })}
              />
              <style>{`
                .custom-calendar-wrapper .rbc-calendar { font-family: inherit; }
                .custom-calendar-wrapper .rbc-header { padding: 10px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0; }
                .dark .custom-calendar-wrapper .rbc-header { border-color: #334155; color: #94a3b8; }
                .custom-calendar-wrapper .rbc-month-view, .custom-calendar-wrapper .rbc-time-view, .custom-calendar-wrapper .rbc-agenda-view { border-color: #e2e8f0; border-radius: 8px; overflow: hidden; }
                .dark .custom-calendar-wrapper .rbc-month-view, .dark .custom-calendar-wrapper .rbc-time-view, .dark .custom-calendar-wrapper .rbc-agenda-view { border-color: #334155; }
                .custom-calendar-wrapper .rbc-day-bg { border-color: #e2e8f0; }
                .dark .custom-calendar-wrapper .rbc-day-bg { border-color: #334155; }
                .custom-calendar-wrapper .rbc-off-range-bg { background-color: #f8fafc; }
                .dark .custom-calendar-wrapper .rbc-off-range-bg { background-color: #0f172a; opacity: 0.3; }
                .custom-calendar-wrapper .rbc-today { background-color: #eff6ff; }
                .dark .custom-calendar-wrapper .rbc-today { background-color: rgba(59, 130, 246, 0.1); }
              `}</style>
            </div>
          )}
        </div>
      </div>
    </ResearchDashboard>
  );
}
