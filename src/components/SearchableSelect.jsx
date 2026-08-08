import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export default function SearchableSelect({ options, value, onChange, placeholder, isMulti = false, className = '', menuPlacement = 'bottom', maxHeightClass = 'max-h-48' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  
  const renderValue = () => {
    if (isMulti) {
      if (!value || value.length === 0) return <span className="text-gray-400 dark:text-slate-500 truncate">{placeholder}</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {value.map(val => {
            const opt = options.find(o => o.value === val);
            return opt ? (
              <span key={val} className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                {opt.label}
                <button onClick={(e) => {
                  e.stopPropagation();
                  onChange(value.filter(v => v !== val));
                }} className="hover:text-red-500"><X size={10} /></button>
              </span>
            ) : null;
          })}
        </div>
      );
    }
    const selected = options.find(o => o.value === value);
    return (
      <span className={selected ? 'text-gray-800 dark:text-slate-200 truncate' : 'text-gray-400 dark:text-slate-500 truncate'}>
        {selected ? selected.label : placeholder}
      </span>
    );
  };

  const hasSelection = isMulti ? value?.length > 0 : !!options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div 
        onClick={() => { setOpen(!open); setSearch(''); }}
        className="flex items-center justify-between border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-2 py-1.5 text-xs cursor-pointer hover:border-blue-300 transition-colors min-h-[32px]"
      >
        <div className="flex-1 overflow-hidden pr-2 flex items-center">
          {renderValue()}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {hasSelection && !isMulti && (
            <button 
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="text-gray-400 dark:text-slate-500 hover:text-red-500"
            >
              <X size={12} />
            </button>
          )}
          {hasSelection && isMulti && (
            <button 
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              className="text-gray-400 dark:text-slate-500 hover:text-red-500"
            >
              <X size={12} />
            </button>
          )}
          <ChevronDown size={12} className="text-gray-400 dark:text-slate-500" />
        </div>
      </div>

      {open && (
        <div className={`absolute z-50 ${menuPlacement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 w-full min-w-[160px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-2xl rounded-lg ${maxHeightClass} flex flex-col overflow-hidden`}>
          <div className="p-2 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2 bg-gray-50 dark:bg-slate-800">
            <Search size={12} className="text-gray-400 dark:text-slate-500" />
            <input 
              type="text" 
              autoFocus 
              className="w-full bg-transparent border-none text-xs focus:outline-none text-gray-800 dark:text-white"
              placeholder="খুঁজুন..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length > 0 ? (
              filtered.map(o => (
                <div 
                  key={o.value} 
                  onClick={(e) => { 
                    e.stopPropagation();
                    if (isMulti) {
                      const arr = value || [];
                      if (arr.includes(o.value)) onChange(arr.filter(v => v !== o.value));
                      else onChange([...arr, o.value]);
                    } else {
                      onChange(o.value); setOpen(false); setSearch(''); 
                    }
                  }}
                  className={`px-3 py-2 text-xs cursor-pointer transition-colors ${(isMulti ? (value || []).includes(o.value) : o.value === value) ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800 text-gray-700 dark:text-slate-300'}`}
                >
                  {o.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-xs text-gray-400 dark:text-slate-500 text-center">পাওয়া যায়নি</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

