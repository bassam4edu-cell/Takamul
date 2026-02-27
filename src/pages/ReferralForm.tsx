import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  ChevronRight, 
  Send, 
  User, 
  AlertTriangle, 
  FileText, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { Student } from '../types';
import { motion } from 'motion/react';

const ReferralForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [formData, setFormData] = useState({
    student_id: '',
    type: 'behavior',
    severity: 'medium',
    reason: '',
    teacher_notes: '',
    remedial_plan: '',
    remedial_plan_file: ''
  });
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/students?userId=${user?.id}`)
      .then(res => res.json())
      .then(data => setStudents(data));
  }, [user?.id]);

  const grades = Array.from(new Set(students.map(s => s.grade)));
  const sections = Array.from(new Set(students.filter(s => s.grade === selectedGrade).map(s => s.section)));
  const filteredStudents = students.filter(s => s.grade === selectedGrade && s.section === selectedSection);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');
    
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setFileError('يرجى اختيار ملف PDF فقط');
      e.target.value = '';
      return;
    }

    if (file.size > 500 * 1024) {
      setFileError('حجم الملف يجب أن لا يتجاوز 500 كيلوبايت');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData({ ...formData, remedial_plan_file: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          teacher_id: user?.id
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[3rem] card-shadow border border-slate-100 text-center max-w-md"
        >
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">تم إرسال التحويل بنجاح</h2>
          <p className="text-slate-500 mb-8">تم إرسال الطلب إلى وكيل شؤون الطلاب للمراجعة واتخاذ الإجراء اللازم.</p>
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2 }}
              className="bg-emerald-500 h-full"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 text-slate-400 hover:bg-white hover:text-slate-600 rounded-xl transition-all border border-transparent hover:border-slate-200"
        >
          <ChevronRight size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إنشاء تحويل جديد</h1>
          <p className="text-slate-500">يرجى تعبئة كافة البيانات المطلوبة بدقة لضمان سرعة المعالجة.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] card-shadow border border-slate-100 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-blue-600 font-bold border-b border-slate-50 pb-4">
                <User size={20} />
                <span>بيانات الطالب</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 mr-1">الصف الدراسي</label>
                  <select 
                    required
                    value={selectedGrade}
                    onChange={(e) => {
                      setSelectedGrade(e.target.value);
                      setSelectedSection('');
                      setFormData({...formData, student_id: ''});
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  >
                    <option value="">اختر الصف...</option>
                    {grades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 mr-1">الفصل</label>
                  <select 
                    required
                    disabled={!selectedGrade}
                    value={selectedSection}
                    onChange={(e) => {
                      setSelectedSection(e.target.value);
                      setFormData({...formData, student_id: ''});
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">اختر الفصل...</option>
                    {sections.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 mr-1">اسم الطالب</label>
                  <select 
                    required
                    disabled={!selectedSection}
                    value={formData.student_id}
                    onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">اختر الطالب...</option>
                    {filteredStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.national_id})</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 mr-1">نوع التحويل</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  >
                    <option value="behavior">سلوكي</option>
                    <option value="academic">أكاديمي</option>
                    <option value="attendance">غياب وتأخر</option>
                    <option value="uniform">زي مدرسي</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 text-blue-600 font-bold border-b border-slate-50 pb-4">
                <FileText size={20} />
                <span>تفاصيل الحالة</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 mr-1">سبب التحويل</label>
                <input 
                  required
                  type="text"
                  placeholder="مثال: تكرار الغياب بدون عذر"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 mr-1">ملاحظات المعلم</label>
                <textarea 
                  rows={4}
                  placeholder="اكتب تفاصيل إضافية عن الحالة..."
                  value={formData.teacher_notes}
                  onChange={(e) => setFormData({...formData, teacher_notes: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 mr-1">الخطة العلاجية (اختياري)</label>
                <textarea 
                  rows={4}
                  placeholder="اكتب الإجراءات التربوية أو الخطة العلاجية التي تم اتخاذها..."
                  value={formData.remedial_plan}
                  onChange={(e) => setFormData({...formData, remedial_plan: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 mr-1">إرفاق ملف الخطة (PDF - بحد أقصى 500KB)</label>
                <div className="relative">
                  <input 
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                {fileError && <p className="text-red-500 text-xs mt-1 mr-1">{fileError}</p>}
                {formData.remedial_plan_file && !fileError && <p className="text-emerald-600 text-xs mt-1 mr-1">تم إرفاق الملف بنجاح</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] card-shadow border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 text-blue-600 font-bold">
              <AlertTriangle size={20} />
              <span>تكرار المخالفة</span>
            </div>
            
            <div className="space-y-3">
              {(['low', 'medium', 'high'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData({...formData, severity: s})}
                  className={`w-full p-4 rounded-2xl border-2 text-right transition-all flex items-center justify-between ${
                    formData.severity === s 
                      ? s === 'high' ? 'border-red-500 bg-red-50 text-red-700' :
                        s === 'medium' ? 'border-amber-500 bg-amber-50 text-amber-700' :
                        'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-100 hover:border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="font-bold">
                    {s === 'high' ? 'المرة الثالثة فأكثر' : s === 'medium' ? 'المرة الثانية' : 'المرة الأولى'}
                  </span>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    formData.severity === s ? 'bg-current border-white' : 'border-slate-300'
                  }`} />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-600 p-6 rounded-[2rem] shadow-xl shadow-blue-200 text-white space-y-6">
            <div className="flex items-center gap-3">
              <Info size={20} />
              <span className="font-bold">تأكيد الإرسال</span>
            </div>
            <p className="text-blue-100 text-sm leading-relaxed">
              بمجرد الإرسال، سيتم إخطار وكيل شؤون الطلاب فوراً. يمكنك متابعة حالة الطلب من لوحة التحكم.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-blue-600 font-bold py-4 rounded-2xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
            >
              <Send size={20} />
              <span>إرسال التحويل الآن</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReferralForm;
