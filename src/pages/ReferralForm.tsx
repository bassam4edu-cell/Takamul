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
  CheckCircle2,
  Upload
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
          className="sts-card p-16 text-center max-w-lg"
        >
          <div className="w-32 h-32 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-100">
            <CheckCircle2 size={64} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">تم إرسال التحويل بنجاح</h2>
          <p className="text-slate-500 mb-10 font-bold leading-relaxed">تم إرسال الطلب إلى وكيل شؤون الطلاب للمراجعة واتخاذ الإجراء اللازم.</p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
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
    <div className="max-w-5xl mx-auto space-y-10 pb-12">
      <div className="flex items-center gap-6">
        <button 
          onClick={() => navigate(-1)}
          className="w-12 h-12 flex items-center justify-center text-slate-400 hover:bg-white hover:text-primary rounded-2xl transition-all border border-transparent hover:border-slate-100 shadow-sm"
        >
          <ChevronRight size={28} />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">إنشاء تحويل جديد</h1>
          <p className="text-slate-500 mt-1 font-bold">يرجى تعبئة كافة البيانات المطلوبة بدقة لضمان سرعة المعالجة.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
        <div className="lg:col-span-2 space-y-8 md:col-span-1">
          <div className="sts-card p-6 md:p-10 space-y-8 md:space-y-10">
            <div className="space-y-6 md:space-y-8">
              <div className="flex items-center gap-4 text-primary font-extrabold border-b border-slate-50 pb-4 md:pb-6">
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center shrink-0">
                  <User size={22} />
                </div>
                <span className="text-base md:text-lg uppercase tracking-widest">بيانات الطالب</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-extrabold text-slate-500 mr-2 uppercase tracking-widest">الصف الدراسي</label>
                  <select 
                    required
                    value={selectedGrade}
                    onChange={(e) => {
                      setSelectedGrade(e.target.value);
                      setSelectedSection('');
                      setFormData({...formData, student_id: ''});
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                  >
                    <option value="">اختر الصف...</option>
                    {grades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-extrabold text-slate-500 mr-2 uppercase tracking-widest">الفصل</label>
                  <select 
                    required
                    disabled={!selectedGrade}
                    value={selectedSection}
                    onChange={(e) => {
                      setSelectedSection(e.target.value);
                      setFormData({...formData, student_id: ''});
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50 font-bold"
                  >
                    <option value="">اختر الفصل...</option>
                    {sections.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-extrabold text-slate-500 mr-2 uppercase tracking-widest">اسم الطالب</label>
                  <select 
                    required
                    disabled={!selectedSection}
                    value={formData.student_id}
                    onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50 font-bold"
                  >
                    <option value="">اختر الطالب...</option>
                    {filteredStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.national_id})</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-3">
                  <label className="text-xs font-extrabold text-slate-500 mr-2 uppercase tracking-widest">نوع التحويل</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                  >
                    <option value="behavior">سلوكي</option>
                    <option value="academic">أكاديمي</option>
                    <option value="attendance">غياب وتأخر</option>
                    <option value="uniform">زي مدرسي</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6 md:space-y-8">
              <div className="flex items-center gap-4 text-primary font-extrabold border-b border-slate-50 pb-4 md:pb-6">
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={22} />
                </div>
                <span className="text-base md:text-lg uppercase tracking-widest">تفاصيل الحالة</span>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-500 mr-2 uppercase tracking-widest">سبب التحويل</label>
                <input 
                  required
                  type="text"
                  placeholder="مثال: تكرار الغياب بدون عذر"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-500 mr-2 uppercase tracking-widest">ملاحظات المعلم</label>
                <textarea 
                  rows={4}
                  placeholder="اكتب تفاصيل إضافية عن الحالة..."
                  value={formData.teacher_notes}
                  onChange={(e) => setFormData({...formData, teacher_notes: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none font-bold"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-500 mr-2 uppercase tracking-widest">الخطة العلاجية (اختياري)</label>
                <textarea 
                  rows={4}
                  placeholder="اكتب الإجراءات التربوية أو الخطة العلاجية التي تم اتخاذها..."
                  value={formData.remedial_plan}
                  onChange={(e) => setFormData({...formData, remedial_plan: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none font-bold"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-500 mr-2 uppercase tracking-widest">إرفاق الخطة العلاجية (PDF)</label>
                <div className={`relative border-2 border-dashed rounded-2xl p-8 transition-all text-center ${formData.remedial_plan_file ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50/30 hover:border-primary/50'}`}>
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="space-y-3">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-sm ${formData.remedial_plan_file ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400'}`}>
                      <Upload size={28} />
                    </div>
                    <div>
                      <p className={`text-sm font-extrabold ${formData.remedial_plan_file ? 'text-emerald-700' : 'text-slate-700'}`}>
                        {formData.remedial_plan_file ? 'تم اختيار الملف بنجاح' : 'اسحب الملف هنا أو انقر للاختيار'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">PDF فقط (بحد أقصى 500KB)</p>
                    </div>
                  </div>
                </div>
                {fileError && <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1"><AlertTriangle size={14} /> {fileError}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 md:space-y-10 lg:sticky lg:top-8">
          <div className="sts-card p-6 md:p-10 space-y-6 md:space-y-8">
            <div className="flex items-center gap-4 text-primary font-extrabold border-b border-slate-50 pb-4 md:pb-6">
              <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle size={22} />
              </div>
              <span className="text-base md:text-lg uppercase tracking-widest">تكرار المخالفة</span>
            </div>
            
            <div className="space-y-4">
              {[
                { id: 'low', label: 'المرة الأولى', color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/10' },
                { id: 'medium', label: 'المرة الثانية', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                { id: 'high', label: 'المرة الثالثة فأكثر', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' }
              ].map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setFormData({...formData, severity: level.id})}
                  className={`w-full p-6 rounded-2xl border-2 transition-all text-right flex items-center justify-between group ${
                    formData.severity === level.id 
                      ? `${level.border} ${level.bg} shadow-lg shadow-slate-100` 
                      : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                      formData.severity === level.id 
                        ? `border-${level.id === 'low' ? 'primary' : level.id === 'medium' ? 'amber-500' : 'red-500'} bg-${level.id === 'low' ? 'primary' : level.id === 'medium' ? 'amber-500' : 'red-500'}` 
                        : 'border-slate-300'
                    }`} />
                    <span className={`font-extrabold text-sm ${formData.severity === level.id ? level.color : 'text-slate-500'}`}>
                      {level.label}
                    </span>
                  </div>
                  {formData.severity === level.id && (
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${level.bg} ${level.color}`}>
                      <CheckCircle2 size={18} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-50">
              <button
                type="submit"
                disabled={loading || !formData.student_id}
                className="w-full sts-button-primary py-5 flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={22} />
                    <span className="text-lg">إرسال التحويل</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-6 font-bold leading-relaxed uppercase tracking-widest">
                بالضغط على إرسال، أنت تؤكد صحة البيانات المدخلة ومسؤوليتك المهنية عنها.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-[5rem] -mr-8 -mt-8" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Info className="text-primary" size={24} />
                <h3 className="font-extrabold text-lg">ملاحظة هامة</h3>
              </div>
              <p className="text-sm text-slate-400 font-bold leading-relaxed">
                يرجى التأكد من إرفاق الخطة العلاجية في حال كانت الحالة تتطلب ذلك حسب لائحة السلوك والمواظبة.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReferralForm;
