import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Trash2, Save, X, Search, User as UserIcon, Briefcase, Award, GraduationCap, FileText, Monitor, Camera, DollarSign, Calendar, Clock, LogOut } from 'lucide-react';

const TAB_SECTIONS = [
  { id: 'basic', icon: UserIcon, label: '১. বেসিক ইনফো' },
  { id: 'employment', icon: Briefcase, label: '২. এমপ্লয়মেন্ট ইনফো' },
  { id: 'editorial', icon: Edit2, label: '৩. এডিটোরিয়াল ইনফো' },
  { id: 'media_role', icon: Camera, label: '৪. মিডিয়া রোল' },
  { id: 'technical', icon: Monitor, label: '৫. টেকনিক্যাল অ্যাক্সেস' },
  { id: 'equipment', icon: Camera, label: '৬. ইক্যুইপমেন্ট' },
  { id: 'assignment', icon: Calendar, label: '৭. অ্যাসাইনমেন্ট' },
  { id: 'payroll', icon: DollarSign, label: '৮. পে-রোল' },
  { id: 'education', icon: GraduationCap, label: '৯. এডুকেশন ও প্রফেশনাল' },
  { id: 'experience', icon: Briefcase, label: '১০. অভিজ্ঞতা' },
  { id: 'documents', icon: FileText, label: '১১. ডকুমেন্টস' },
  { id: 'performance', icon: Award, label: '১২. পারফরম্যান্স' },
  { id: 'attendance', icon: Clock, label: '১৩. এটেনডেন্স ও লিভ' },
  { id: 'exit', icon: LogOut, label: '১৪. এক্সিট ইনফো' },
];

export default function EmployeeMasterData() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [dropdowns, setDropdowns] = useState({});

  

  const fetchDropdowns = async () => {
    try {
      const { data } = await api.get('/hr-employees/dropdowns');
      setDropdowns(data || {});
    } catch (err) {
      console.error(err);
    }
  };

  

  useEffect(() => {
    fetchEmployees();
    fetchDropdowns();
  }, []);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (formData._id) {
        await api.put(`/hr-employees/${formData._id}`, formData);
      } else {
        await api.post('/hr-employees', formData);
      }
      setShowForm(false);
      setFormData({});
      fetchEmployees();
    } catch (err) {
      console.error(err);
      alert('Error saving employee data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.delete(`/hr-employees/${id}`);
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (emp) => {
    setFormData(emp);
    setShowForm(true);
    setActiveTab('basic');
  };

  const resetForm = () => {
    setFormData({
      emergencyContact: {},
      allowances: {},
      bankInformation: {},
      educations: [],
      experiences: [],
      equipments: [],
      documents: []
    });
    setShowForm(true);
    setActiveTab('basic');
  };

  // Helper for text inputs
  const renderInput = (label, fieldPath, type = 'text', options = null, fullWidth = false) => {
    const value = fieldPath.includes('.') 
      ? fieldPath.split('.').reduce((o, i) => o?.[i] || '', formData)
      : formData[fieldPath] || '';

    const handleChange = (e) => {
      const val = type === 'checkbox' ? e.target.checked : e.target.value;
      if (fieldPath.includes('.')) {
        const [parent, child] = fieldPath.split('.');
        setFormData(prev => ({
          ...prev,
          [parent]: { ...prev[parent], [child]: val }
        }));
      } else {
        setFormData(prev => ({ ...prev, [fieldPath]: val }));
      }
    };

    return (
      <div className={fullWidth ? 'col-span-full' : ''}>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        {type === 'checkbox' ? (
          <input type="checkbox" checked={!!value} onChange={handleChange} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
        ) : type === 'select' ? (
          <select 
            value={value || ''} 
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-sm"
          >
            <option value="">Select...</option>
            {options && Array.isArray(options) ? options.map((opt, i) => (
              <option key={i} value={typeof opt === 'object' ? opt.value : opt}>
                {typeof opt === 'object' ? opt.label : opt}
              </option>
            )) : null}
          </select>
        ) : (
          <input 
            type={type} 
            value={type === 'date' && value ? value.split('T')[0] : value} 
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-sm"
          />
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic': return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {renderInput('Employee Code', 'employeeCode')}
          {renderInput('Full Name (English)', 'fullNameEn')}
          {renderInput('Full Name (Bangla)', 'fullNameBn')}
          {renderInput('Gender', 'gender', 'select', dropdowns.gender)}
          {renderInput('Date of Birth', 'dateOfBirth', 'date')}
          {renderInput('Blood Group', 'bloodGroup', 'select', dropdowns.bloodGroup)}
          {renderInput('Marital Status', 'maritalStatus', 'select', dropdowns.maritalStatus)}
          {renderInput('Nationality', 'nationality', 'select', dropdowns.nationality)}
          {renderInput('NID / Passport', 'nidOrPassport')}
          {renderInput('Mobile Number', 'mobileNumber')}
          {renderInput('Email Address', 'emailAddress', 'email')}
          {renderInput('Emergency Contact Name', 'emergencyContact.name')}
          {renderInput('Emergency Contact Rel', 'emergencyContact.relationship')}
          {renderInput('Emergency Contact Phone', 'emergencyContact.phone')}
        </div>
      );
      case 'employment': return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {renderInput('Joining Date', 'joiningDate', 'date')}
          {renderInput('Employment Type', 'employmentType', 'select', dropdowns.employmentType)}
          {renderInput('Employment Status', 'employmentStatus', 'select', dropdowns.employmentStatus)}
          {renderInput('Branch/Office', 'branchOffice', 'select', dropdowns.branchOffice)}
          {renderInput('Department', 'department', 'select', dropdowns.department)}
          {renderInput('Section', 'section', 'select', dropdowns.section)}
          {renderInput('Designation', 'designation', 'select', dropdowns.designation)}
          {renderInput('Grade', 'grade', 'select', dropdowns.grade)}
          {renderInput('Reporting Manager', 'reportingManager', 'select', employees.map(e => ({ value: e._id, label: e.fullNameEn })))}
          {renderInput('Shift', 'shift', 'select', dropdowns.shift)}
          {renderInput('Office Location', 'officeLocation', 'select', dropdowns.officeLocation)}
        </div>
      );
      case 'editorial': return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {renderInput('Editorial Dept', 'editorialDepartment', 'select', dropdowns.department)}
          {renderInput('Beat Assignment', 'beatAssignment')}
          {renderInput('Desk Assignment', 'deskAssignment', 'select', dropdowns.deskAssignment)}
          {renderInput('Bureau Office', 'bureauOffice', 'select', dropdowns.bureauOffice)}
          {renderInput('Coverage Area', 'coverageArea', 'select', dropdowns.coverageArea)}
          {renderInput('Press Card No', 'pressCardNumber')}
          {renderInput('Press Card Expiry', 'pressCardExpiryDate', 'date')}
          {renderInput('Accreditation No', 'accreditationNumber')}
          {renderInput('Accreditation Expiry', 'accreditationExpiry', 'date')}
          {renderInput('Journalist Category', 'journalistCategory', 'select', dropdowns.journalistCategory)}
          {renderInput('Reporter Type', 'reporterType', 'select', dropdowns.reporterType)}
          {renderInput('Preferred Language', 'preferredLanguage')}
          {renderInput('Priority Level', 'newsPriorityLevel', 'select', dropdowns.priorityLevel)}
        </div>
      );
      case 'media_role': return (
        <div className="grid grid-cols-2 gap-4">
          {renderInput('Media Role (e.g. Sub Editor, Anchor)', 'mediaRole', 'text', true)}
        </div>
      );
      case 'technical': return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {renderInput('CMS Login ID', 'cmsLoginId')}
          {renderInput('CMS Role', 'cmsRole')}
          {renderInput('Story Approval Level', 'storyApprovalLevel')}
          {renderInput('Office Domain Account', 'officeDomainAccount')}
          <div className="col-span-full flex gap-4 mt-2">
            {renderInput('Publish Perm', 'publishPermission', 'checkbox')}
            {renderInput('Live Update', 'liveUpdatePermission', 'checkbox')}
            {renderInput('Photo Upload', 'photoUploadPermission', 'checkbox')}
            {renderInput('Video Upload', 'videoUploadPermission', 'checkbox')}
            {renderInput('Social Media', 'socialMediaAccess', 'checkbox')}
          </div>
        </div>
      );
      case 'payroll': return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {renderInput('Basic Salary', 'basicSalary', 'number')}
          {renderInput('Festival Bonus', 'festivalBonus')}
          {renderInput('Mobile Allowance', 'allowances.mobile', 'number')}
          {renderInput('Internet Allowance', 'allowances.internet', 'number')}
          {renderInput('Travel Allowance', 'allowances.travel', 'number')}
          {renderInput('Fuel Allowance', 'allowances.fuel', 'number')}
          {renderInput('Risk Allowance', 'allowances.risk', 'number')}
          {renderInput('Overtime Eligibility', 'overtimeEligibility', 'checkbox')}
          <div className="col-span-full font-bold mt-2">Bank Info</div>
          {renderInput('Bank Name', 'bankInformation.bankName')}
          {renderInput('Account Number', 'bankInformation.accountNumber')}
          {renderInput('Routing Number', 'bankInformation.routingNumber')}
        </div>
      );
      case 'attendance': return (
        <div className="grid grid-cols-2 gap-4">
          {renderInput('Biometric ID', 'biometricId')}
          {renderInput('Roster', 'roster')}
          {renderInput('Leave Policy', 'leavePolicy')}
          {renderInput('Attendance Policy', 'attendancePolicy')}
        </div>
      );
      case 'exit': return (
        <div className="grid grid-cols-2 gap-4">
          {renderInput('Resignation Date', 'resignationDate', 'date')}
          {renderInput('Last Working Day', 'lastWorkingDay', 'date')}
          {renderInput('Clearance Status', 'clearanceStatus')}
          {renderInput('Asset Return Status', 'assetReturnStatus')}
          {renderInput('Final Settlement', 'finalSettlement', 'text', true)}
        </div>
      );
      case 'education': return (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Education Records</h3>
            <button type="button" onClick={() => setFormData(prev => ({ ...prev, educations: [...(prev.educations || []), {}] }))} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded">Add Education</button>
          </div>
          {(formData.educations || []).map((edu, idx) => (
            <div key={idx} className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg relative bg-white dark:bg-slate-800">
              <button type="button" onClick={() => setFormData(prev => { const e = [...prev.educations]; e.splice(idx, 1); return { ...prev, educations: e } })} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><X size={16} /></button>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {renderInput('Degree', `educations.${idx}.degree`)}
                {renderInput('Institution', `educations.${idx}.institution`)}
                {renderInput('Board/University', `educations.${idx}.board`)}
                {renderInput('Passing Year', `educations.${idx}.passingYear`, 'number')}
                {renderInput('Result', `educations.${idx}.result`)}
              </div>
            </div>
          ))}
          {(!formData.educations || formData.educations.length === 0) && <p className="text-gray-500 italic text-sm">No education records added.</p>}
        </div>
      );
      case 'experience': return (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Work Experience</h3>
            <button type="button" onClick={() => setFormData(prev => ({ ...prev, experiences: [...(prev.experiences || []), {}] }))} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded">Add Experience</button>
          </div>
          {(formData.experiences || []).map((exp, idx) => (
            <div key={idx} className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg relative bg-white dark:bg-slate-800">
              <button type="button" onClick={() => setFormData(prev => { const e = [...prev.experiences]; e.splice(idx, 1); return { ...prev, experiences: e } })} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><X size={16} /></button>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {renderInput('Organization', `experiences.${idx}.organization`)}
                {renderInput('Designation', `experiences.${idx}.designation`)}
                {renderInput('From Date', `experiences.${idx}.fromDate`, 'date')}
                {renderInput('To Date', `experiences.${idx}.toDate`, 'date')}
                <div className="col-span-full">
                  {renderInput('Responsibilities', `experiences.${idx}.responsibilities`)}
                </div>
              </div>
            </div>
          ))}
          {(!formData.experiences || formData.experiences.length === 0) && <p className="text-gray-500 italic text-sm">No experience records added.</p>}
        </div>
      );
      case 'documents': return (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Uploaded Documents</h3>
            <div className="relative">
              <input type="file" id="docUpload" className="hidden" onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const uploadData = new FormData();
                uploadData.append('document', file);
                try {
                  const res = await api.post('/hr-employees/upload', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
                  const docTitle = prompt("Enter document title (e.g. NID, CV):") || file.name;
                  setFormData(prev => ({
                    ...prev,
                    documents: [...(prev.documents || []), { title: docTitle, fileUrl: res.data.fileUrl, documentType: 'Other' }]
                  }));
                } catch (err) {
                  alert('Upload failed');
                }
              }} />
              <label htmlFor="docUpload" className="cursor-pointer text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded flex items-center gap-2">
                <Plus size={14} /> Upload Document
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(formData.documents || []).map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="text-blue-500 shrink-0" size={24} />
                  <div className="truncate">
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{doc.title}</p>
                    <a href={`http://localhost:5001${doc.fileUrl}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">View File</a>
                  </div>
                </div>
                <button type="button" onClick={() => setFormData(prev => { const d = [...prev.documents]; d.splice(idx, 1); return { ...prev, documents: d } })} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          {(!formData.documents || formData.documents.length === 0) && <p className="text-gray-500 italic text-sm">No documents attached.</p>}
        </div>
      );
      // For arrays like education/experience, we just provide text areas for simplicity in this rapid prototype, 
      // or we can skip array complex UI for now and let HR fill basic info first.
      default: return (
        <div className="text-gray-500 italic p-4 text-center">
          {TAB_SECTIONS.find(t => t.id === activeTab)?.label} section form UI is under construction. Other fields can be saved.
        </div>
      );
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">এইচআর মাস্টার ডেটা</h1>
          <p className="text-gray-500 dark:text-gray-400">Employee Master Data</p>
        </div>
        {!showForm && (
          <button 
            onClick={resetForm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={18} /> নতুন এমপ্লয়ী যোগ করুন
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row min-h-[600px]">
          {/* Vertical Tabs */}
          <div className="w-full md:w-64 border-r border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 p-4 space-y-1">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">সেকশনসমূহ</h3>
            {TAB_SECTIONS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 font-semibold' 
                    : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-slate-800'
                }`}
              >
                <tab.icon size={16} />
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>
          
          {/* Form Area */}
          <div className="flex-1 flex flex-col">
            <div className="p-6 flex-1 overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-slate-800 pb-2">
                {TAB_SECTIONS.find(t => t.id === activeTab)?.label}
              </h2>
              {renderTabContent()}
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateOrUpdate}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                <Save size={18} /> {saving ? 'Saving...' : 'Save Data'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="নাম বা আইডি দিয়ে খুঁজুন..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:border-blue-500 outline-none text-sm dark:text-white"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-slate-800 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-3">ID / Code</th>
                  <th className="px-6 py-3">Employee Name</th>
                  <th className="px-6 py-3">Department / Desig.</th>
                  <th className="px-6 py-3">Mobile / Email</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.filter(e => e.fullNameEn?.toLowerCase().includes(searchTerm.toLowerCase()) || e.employeeId?.includes(searchTerm)).map(emp => (
                  <tr key={emp._id} className="border-b dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-mono font-medium text-blue-600 dark:text-blue-400">{emp.employeeId}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white">{emp.fullNameEn || 'N/A'}</div>
                      <div className="text-xs">{emp.fullNameBn}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{emp.department || '-'}</div>
                      <div className="text-xs font-semibold">{emp.designation || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{emp.mobileNumber || '-'}</div>
                      <div className="text-xs">{emp.emailAddress || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(emp)} className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(emp._id)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No employees found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
