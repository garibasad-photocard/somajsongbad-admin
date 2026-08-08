import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Save, Plus, X, List } from 'lucide-react';

const CATEGORIES = [
  { key: 'gender', label: 'Gender' },
  { key: 'bloodGroup', label: 'Blood Group' },
  { key: 'maritalStatus', label: 'Marital Status' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'employmentType', label: 'Employment Type' },
  { key: 'employmentStatus', label: 'Employment Status' },
  { key: 'branchOffice', label: 'Branch/Office' },
  { key: 'department', label: 'Department' },
  { key: 'section', label: 'Section' },
  { key: 'designation', label: 'Designation' },
  { key: 'grade', label: 'Grade' },
  { key: 'shift', label: 'Shift' },
  { key: 'officeLocation', label: 'Office Location' },
  { key: 'deskAssignment', label: 'Desk Assignment' },
  { key: 'bureauOffice', label: 'Bureau Office' },
  { key: 'coverageArea', label: 'Coverage Area' },
  { key: 'journalistCategory', label: 'Journalist Category' },
  { key: 'reporterType', label: 'Reporter Type' },
  { key: 'priorityLevel', label: 'Priority Level' }
];

export default function HRDropdownSettings() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newItems, setNewItems] = useState({});

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hr-employees/dropdowns');
      setData(res.data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/hr-employees/dropdowns', data);
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = (categoryKey) => {
    const item = newItems[categoryKey]?.trim();
    if (!item) return;
    
    setData(prev => ({
      ...prev,
      [categoryKey]: [...(prev[categoryKey] || []), item]
    }));
    
    setNewItems(prev => ({ ...prev, [categoryKey]: '' }));
  };

  const handleRemoveItem = (categoryKey, index) => {
    setData(prev => {
      const arr = [...(prev[categoryKey] || [])];
      arr.splice(index, 1);
      return { ...prev, [categoryKey]: arr };
    });
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HR Dropdown Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage all dropdown options for the Employee Master Data form</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <Save size={18} /> {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map(cat => (
          <div key={cat.key} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-2">
              <List size={16} className="text-blue-500" />
              {cat.label}
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-4 max-h-40 overflow-y-auto">
              {(data[cat.key] || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md text-sm">
                  <span>{item}</span>
                  <button onClick={() => handleRemoveItem(cat.key, idx)} className="text-gray-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {(!data[cat.key] || data[cat.key].length === 0) && (
                <span className="text-gray-400 text-sm italic">No options</span>
              )}
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={newItems[cat.key] || ''}
                onChange={e => setNewItems({ ...newItems, [cat.key]: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleAddItem(cat.key)}
                placeholder="Add new option..."
                className="flex-1 p-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-sm"
              />
              <button 
                onClick={() => handleAddItem(cat.key)}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 p-2 rounded-md"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
