import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, Save, LayoutDashboard } from 'lucide-react';
import api from '../services/api';

const TEMPLATES = [
  { value: 'grid-3', label: '৩ কলাম গ্রিড' },
  { value: 'grid-4', label: '৪ কলাম গ্রিড' },
  { value: 'grid-4-with-ad', label: '৪ কলাম + সাইড অ্যাড' },
  { value: 'list-sidebar', label: 'লিস্ট ও সাইডবার' },
  { value: 'hero', label: 'বড় কভার ইমেজ' },
  { value: 'carousel', label: 'স্লাইডার' },
  { value: 'glamour-slider', label: 'গ্ল্যামার স্লাইডার (Portrait)' },
  { value: 'video', label: 'ভিডিও গ্যালারি' },
  { value: 'mega-event', label: 'স্পেশাল মেগা ইভেন্ট' },
  { value: 'ad', label: 'বিজ্ঞাপন ব্লক' }
];

function SortableItem({ block, updateBlock, removeBlock }) {
  const { categories } = useSettings();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0,0,0,0.1)' : 'none',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border ${isDragging ? 'border-blue-500' : 'border-gray-200 dark:border-slate-700'} mb-3 shadow-sm`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <GripVertical size={20} />
      </div>
      
      <div className="flex-1 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">ক্যাটাগরি</label>
          <select 
            value={block.category} 
            onChange={(e) => updateBlock(block.id, 'category', e.target.value)}
            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">নির্বাচন করুন</option>
            {block.template === 'ad' ? (
              <option value="Middle Strip">Middle Strip Ad</option>
            ) : null}
            {categories.map((c, i) => (
              <option key={i} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">টেমপ্লেট (ডিজাইন)</label>
          <select 
            value={block.template} 
            onChange={(e) => updateBlock(block.id, 'template', e.target.value)}
            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TEMPLATES.map((t, i) => (
              <option key={i} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      <button 
        onClick={() => removeBlock(block.id)}
        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors ml-2"
        title="মুছে ফেলুন"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

export default function HomepageBuilder() {
  const { homepageLayout, updateHomepageLayout, categories } = useSettings();
  const [blocks, setBlocks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize blocks from settings on mount
  useEffect(() => {
    if (homepageLayout && homepageLayout.length > 0) {
      // Add unique IDs if they don't have one for DnD kit
      const initialBlocks = homepageLayout.map((block, index) => ({
        ...block,
        id: block.id || `block-${Date.now()}-${index}`
      }));
      setBlocks(initialBlocks);
    }
  }, [homepageLayout]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateBlock = (id, field, value) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeBlock = (id) => {
    if (window.confirm('এই সেকশনটি মুছে ফেলতে চান?')) {
      setBlocks(blocks.filter(b => b.id !== id));
    }
  };

  const addBlock = () => {
    const newBlock = {
      id: `block-${Date.now()}`,
      category: categories.length > 0 ? categories[0].name : '',
      template: 'grid-4'
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Clean up internal IDs before saving to DB
      const layoutToSave = blocks.map((b, index) => ({
        id: index + 1, // sequential ID for DB
        category: b.category,
        template: b.template
      }));
      
      await updateHomepageLayout(layoutToSave);
      alert('সফলভাবে সেভ হয়েছে!');
    } catch (error) {
      console.error(error);
      alert('সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="text-blue-600" />
            হোমপেজ বিল্ডার (Drag & Drop)
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            ওয়েবসাইটের হোমপেজে কোন ক্যাটাগরি কোন ডিজাইনে দেখাবে তা এখান থেকে সাজান। যেকোনো ব্লক টেনে উপরে বা নিচে নামাতে পারবেন।
          </p>
        </div>
        
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          <Save size={18} />
          {isSaving ? 'সেভ হচ্ছে...' : 'পাবলিশ করুন'}
        </button>
      </div>

      <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-800">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={blocks.map(b => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {blocks.map(block => (
                <SortableItem 
                  key={block.id} 
                  block={block} 
                  updateBlock={updateBlock} 
                  removeBlock={removeBlock} 
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button 
          onClick={addBlock}
          className="mt-6 flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 p-4 rounded-xl transition-colors font-medium"
        >
          <Plus size={20} />
          নতুন সেকশন যোগ করুন
        </button>
      </div>
    </div>
  );
}
