import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Calculator, BookOpen, FlaskConical, Languages, Palette } from 'lucide-react';
import { formatHijriDate } from '../utils/dateUtils';

// بيانات تجريبية للمواد (يجب أن تكون في ملف مشترك لاحقاً)
const mockSubjects = [
  { 
    id: 1, name: 'الرياضيات', icon: Calculator, progress: 85,
    logs: [
      { date: '2026-10-12', category: 'مشاركة', taskName: 'مشاركة على السبورة', score: 1, maxScore: 1, status: 'مكتمل' },
      { date: '2026-10-10', category: 'واجب', taskName: 'حل صفحة 45', score: 4, maxScore: 5, status: 'ناقص' },
      { date: '2026-10-05', category: 'اختبار', taskName: 'اختبار الفترة الأولى', score: 18, maxScore: 20, status: 'مكتمل' },
    ]
  },
  { 
    id: 2, name: 'العلوم', icon: FlaskConical, progress: 92,
    logs: [
      { date: '2026-10-11', category: 'مهام أدائية', taskName: 'مشروع الوحدة الأولى', score: 10, maxScore: 10, status: 'مكتمل' },
      { date: '2026-10-08', category: 'مشاركة', taskName: 'تجربة معملية', score: 1, maxScore: 1, status: 'مكتمل' },
    ]
  },
  { 
    id: 3, name: 'اللغة العربية', icon: Languages, progress: 78,
    logs: [
      { date: '2026-10-12', category: 'واجب', taskName: 'كتابة موضوع تعبير', score: 3, maxScore: 5, status: 'ناقص' },
      { date: '2026-10-09', category: 'مشاركة', taskName: 'قراءة نص أدبي', score: 0, maxScore: 1, status: 'لم ينجز' },
    ]
  },
  { 
    id: 4, name: 'الفنية', icon: Palette, progress: 95,
    logs: [
      { date: '2026-10-13', category: 'مهام أدائية', taskName: 'رسم لوحة فنية', score: 5, maxScore: 5, status: 'مكتمل' },
    ]
  },
];

const SubjectDetails: React.FC = () => {
  const { studentId, subjectId } = useParams();
  const navigate = useNavigate();
  
  const subject = mockSubjects.find(s => s.id === Number(subjectId));

  if (!subject) return <div className="text-center p-10 font-bold text-slate-500">المادة غير موجودة</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 p-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(`/dashboard/student/${studentId}`)}
          className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold"
        >
          <ArrowRight size={20} />
          <span>العودة لملف الطالب</span>
        </button>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 bg-teal-50 text-teal-700 rounded-2xl">
            <subject.icon size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">{subject.name}</h1>
            <p className="text-slate-500 font-bold">تقرير الأداء الأكاديمي</p>
          </div>
        </div>
        <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 text-center">
          <p className="text-sm text-teal-800 font-bold mb-1">الدرجة الإجمالية في المادة</p>
          <p className="text-4xl font-black text-teal-700">{subject.progress}%</p>
        </div>
      </motion.div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {['مشاركة', 'واجب', 'مهام أدائية', 'اختبار'].map(category => {
          const categoryLogs = subject.logs.filter(l => l.category === category);
          if (categoryLogs.length === 0) return null;
          return (
            <div key={category} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h4 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-100 pb-2">{category}</h4>
              <div className="space-y-3">
                {categoryLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 p-4 rounded-xl text-sm">
                    <div>
                      <p className="font-bold text-slate-800">{log.taskName}</p>
                      <p className="text-xs text-slate-500">{formatHijriDate(log.date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-teal-600">{log.score}/{log.maxScore}</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        log.status === 'مكتمل' ? 'bg-emerald-100 text-emerald-700' :
                        log.status === 'ناقص' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectDetails;
