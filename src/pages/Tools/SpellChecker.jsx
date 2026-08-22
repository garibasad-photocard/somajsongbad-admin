import { useState, useEffect } from 'react';
import api from '../../services/api';
import { SpellCheck, PlusCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export default function SpellChecker() {
  const [text, setText] = useState('');
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [debugInfo, setDebugInfo] = useState('');

  const checkSpelling = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setErrors([]);
    setDebugInfo('Sending request...');

    try {
      const res = await api.post('/tools/spellcheck', { text });
      setDebugInfo(`Response: ${res.status}, success: ${res.data.success}, errors: ${res.data.errors?.length}, DictLoaded: ${res.data.dictLoaded}, DictSize: ${res.data.dictSize}`);
      if (res.data.success) {
        setErrors(res.data.errors || []);
        if (res.data.errors && res.data.errors.length === 0) {
          setSuccessMsg('কোনো বানান ভুল পাওয়া যায়নি!');
        }
      }
    } catch (err) {
      console.error(err);
      setDebugInfo(`Error: ${err.message}. Status: ${err.response?.status}`);
      setErrorMsg(`API Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-check spelling when text changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (text.trim()) {
        checkSpelling();
      } else {
        setErrors([]);
        setSuccessMsg('');
        setErrorMsg('');
        setDebugInfo('');
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [text]);

  const addWordToDict = async (word) => {
    try {
      const res = await api.post('/tools/spellcheck/add-word', { word });
      if (res.data.success) {
        // Remove the word from errors list
        setErrors(errors.filter(e => e.word !== word));
        setSuccessMsg(`"${word}" ডিকশনারিতে যুক্ত হয়েছে!`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('ডিকশনারিতে যুক্ত করা যায়নি। শব্দটি হয়তো আগে থেকেই আছে।');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const replaceWord = (err, suggestion) => {
    // Replace the specific error word with the suggestion
    const newText = text.slice(0, err.start) + suggestion + text.slice(err.end);
    setText(newText);
    
    // We let the useEffect debounce trigger checkSpelling() automatically
  };

  // Helper to render text with highlights
  const renderHighlightedText = () => {
    if (errors.length === 0) return <p className="text-gray-700 whitespace-pre-wrap">{text}</p>;

    let lastIndex = 0;
    const elements = [];

    // Sort errors by start index
    const sortedErrors = [...errors].sort((a, b) => a.start - b.start);

    sortedErrors.forEach((err, i) => {
      // Add text before the error
      if (err.start > lastIndex) {
        elements.push(
          <span key={`text-${i}`}>{text.slice(lastIndex, err.start)}</span>
        );
      }

      // Add the error word highlighted
      elements.push(
        <span key={`err-${i}`} className="border-b-2 border-red-500 bg-red-50 text-red-700 px-1 rounded-sm relative group cursor-pointer">
          {text.slice(err.start, err.end)}
          {/* Add a transparent bridge to prevent hover loss */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 hidden group-hover:block w-full h-2 bg-transparent z-10"></div>
          <div className="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-slate-800 text-white text-xs rounded p-2 z-20 w-max shadow-lg cursor-default">
            <span className="font-semibold mb-1 text-slate-300">ভুল বানান</span>
            {err.suggestions && err.suggestions.length > 0 && (
              <div className="mb-2">
                <span className="text-gray-400 text-[10px]">সাজেশন:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {err.suggestions.map((sug, sIdx) => (
                    <button 
                      key={sIdx}
                      onClick={() => replaceWord(err, sug)}
                      className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button 
              onClick={() => addWordToDict(err.word)}
              className="flex items-center gap-1 hover:bg-slate-700 p-1 rounded text-green-400 transition-colors mt-1"
            >
              <PlusCircle size={12} /> ডিকশনারিতে যুক্ত করুন
            </button>
          </div>
        </span>
      );

      lastIndex = err.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(<span key="text-end">{text.slice(lastIndex)}</span>);
    }

    return <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">{elements}</div>;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <SpellCheck className="text-blue-600" />
            কাস্টম বাংলা বানান পরীক্ষক
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            আপনার লেখা পেস্ট করে চেক করুন অথবা নতুন শব্দ ডিকশনারিতে যুক্ত করুন।
          </p>
        </div>
      </div>

      {(errorMsg || successMsg) && (
        <div className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${errorMsg ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {errorMsg ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          <span className="font-medium text-sm">{errorMsg || successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Side */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 dark:text-slate-200">লেখা ইনপুট</h2>
          </div>
          <div className="p-4 flex-1">
            <textarea
              className="w-full h-[400px] p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none text-gray-800 dark:text-slate-200 leading-relaxed"
              placeholder="এখানে আপনার বাংলা লেখা পেস্ট করুন..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 rounded-b-xl flex justify-end">
            <button
              onClick={checkSpelling}
              disabled={loading || !text.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <SpellCheck size={18} />
              )}
              বানান চেক করুন
            </button>
          </div>
        </div>

        {/* Results Side */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2">
              ফলাফল 
              {errors.length > 0 && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
                  {errors.length} টি ভুল
                </span>
              )}
            </h2>
            {debugInfo && <div className="text-xs text-slate-500 font-mono mt-1">{debugInfo}</div>}
          </div>
          <div className="p-6 h-[470px] overflow-y-auto bg-white dark:bg-slate-900 text-base">
            {!text && errors.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <SpellCheck size={48} className="mb-4 opacity-20" />
                <p>ফলাফল দেখতে বাম পাশে লেখা দিয়ে চেক করুন</p>
              </div>
            )}
            {text && (
              <div className="prose max-w-none dark:prose-invert">
                {renderHighlightedText()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
