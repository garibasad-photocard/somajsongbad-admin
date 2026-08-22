import { useState, useEffect } from 'react';
import { useWorkflow } from '../../context/WorkflowContext';
import { Printer, Calendar, LayoutList, CheckCircle, Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function PrintRundown() {
  const { assignments } = useWorkflow();
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [groupedData, setGroupedData] = useState({});

  useEffect(() => {
    // Filter print/both assignments that match the selected date (deadline or created)
    const printTasks = assignments.filter(a => 
      ['print', 'both', 'all'].includes(a.edition) && 
      (a.deadline?.startsWith(selectedDate) || a.createdAt?.startsWith(selectedDate))
    );

    // Group by category/page
    const groups = {};
    printTasks.forEach(task => {
      const page = task.category || 'সাধারণ খবর';
      if (!groups[page]) groups[page] = [];
      groups[page].push(task);
    });

    setGroupedData(groups);
  }, [assignments, selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 font-sans min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header - Hidden on Print */}
        <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <LayoutList className="text-purple-600" size={28} />
              প্রিন্ট ডেস্ক: অটো-রানশিট
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
              প্রিন্ট মিটিংয়ের জন্য প্রতিদিনের নিউজ কভারেজ প্ল্যান এবং রানশিট
            </p>
          </div>
          <div className="flex items-center gap-4">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
            >
              <Printer size={18} />
              রানশিট প্রিন্ট করুন
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="bg-white dark:bg-slate-800 print:bg-white p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 print:shadow-none print:border-none">
          
          <div className="text-center mb-8 pb-6 border-b-2 border-slate-900 dark:border-slate-700 print:border-black">
            <h2 className="text-3xl font-black uppercase tracking-tight print:text-black">দৈনিক রানশিট (প্রিন্ট ভার্সন)</h2>
            <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 print:text-black mt-2 font-bold">
              <Calendar size={16} />
              {new Date(selectedDate).toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {Object.keys(groupedData).length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold">
              এই তারিখে প্রিন্টের জন্য কোনো অ্যাসাইনমেন্ট নেই।
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedData).map(([category, tasks]) => (
                <div key={category} className="break-inside-avoid">
                  <h3 className="text-lg font-black bg-slate-100 dark:bg-slate-700 print:bg-slate-200 print:text-black px-4 py-2 rounded-t-lg border-b-4 border-purple-600 dark:border-purple-400 print:border-black">
                    {category} (মোট: {tasks.length})
                  </h3>
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 print:bg-slate-100 print:text-black border-b border-slate-200 dark:border-slate-700">
                        <th className="py-3 px-4 font-bold w-1/2">স্টোরির শিরোনাম</th>
                        <th className="py-3 px-4 font-bold w-1/4">রিপোর্টার</th>
                        <th className="py-3 px-4 font-bold w-1/4">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((t, idx) => (
                        <tr key={t._id} className="border-b border-slate-100 dark:border-slate-700/50 print:border-slate-300 print:text-black">
                          <td className="py-3 px-4 font-bold flex items-start gap-2">
                            <span className="text-slate-400 print:text-slate-500 font-normal">{idx + 1}.</span>
                            {t.title}
                            {t.priority === 'high' && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 rounded-sm print:border print:border-red-600 font-black">জরুরি</span>}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 print:text-black">
                            {t.assigneeName || 'স্টাফ রিপোর্টার'}
                          </td>
                          <td className="py-3 px-4">
                            {t.status === 'published' ? (
                              <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-bold print:text-black">
                                <CheckCircle size={14} /> প্রকাশিত
                              </span>
                            ) : t.status === 'approved' ? (
                              <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold print:text-black">
                                <CheckCircle size={14} /> রেডি / অনুমোদিত
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold print:text-black">
                                <Clock size={14} /> কাজ চলছে
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700 print:border-black flex justify-between text-xs text-slate-500 font-bold print:text-black">
            <span>জেনারেটেড বাই: Nordic Newsroom CMS</span>
            <span>প্রিন্টের সময়: {new Date().toLocaleTimeString('bn-BD')}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
