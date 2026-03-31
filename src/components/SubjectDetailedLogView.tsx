import React from 'react';
import { ArrowRight, MessageSquare, User } from 'lucide-react';
import { motion } from 'motion/react';
import { formatHijriDate } from '../utils/dateUtils';

interface LogEntry {
  id: number;
  date: string;
  category: 'مهمة أدائية' | 'سلوك' | 'واجب' | 'مشاركة' | 'اختبار';
  taskName: string;
  score: number;
  maxScore: number;
  teacherNote?: string;
  teacherName?: string;
}

interface Props {
  subject: string;
  studentName: string;
  studentId: number;
  serverLogs?: any[];
  onBack: () => void;
}

export const SubjectDetailedLogView: React.FC<Props> = ({ subject, studentName, studentId, serverLogs = [], onBack }) => {
  const [combinedLogs, setCombinedLogs] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchLocalLogs = () => {
      const storedLogs = JSON.parse(localStorage.getItem('takamol_student_logs') || '[]');
      const filteredLocal = storedLogs.filter((log: any) => 
        log.studentId === studentId && log.subject === subject
      ).map((log: any) => ({
        ...log,
        isLocal: true
      }));

      // Normalize server logs to match the expected format
      const normalizedServer = serverLogs
        .filter((log: any) => log.subject === subject)
        .map((log: any, index: number) => ({
          id: `server-${index}`,
          date: log.date,
          category: log.task_category || 'مهمة أدائية', // Default if not provided
          taskName: log.task_name,
          score: log.student_grade,
          maxScore: log.max_grade,
          teacherName: log.teacher_name || log.teacherName,
          isLocal: false
        }));

      // Combine and sort by date descending
      const combined = [...filteredLocal, ...normalizedServer].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setCombinedLogs(combined);
    };

    fetchLocalLogs();
    window.addEventListener('takamol_logs_updated', fetchLocalLogs);
    return () => window.removeEventListener('takamol_logs_updated', fetchLocalLogs);
  }, [studentId, subject, serverLogs]);

  const getBadgeStyle = (score: number, maxScore: number) => {
    if (score === maxScore) return 'bg-emerald-100 text-emerald-800';
    if (score === 0) return 'bg-rose-100 text-rose-800';
    return 'bg-amber-100 text-amber-800';
  };

  const LogItemComponent = ({ log }: { log: any }) => (
    <div className={`p-3 rounded-xl border mb-3 ${log.isLocal ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <p className="font-bold text-slate-800 text-sm">{log.taskName}</p>
          {log.isLocal && <span className="text-[8px] bg-amber-200 text-amber-800 px-1 rounded">غير مزامن</span>}
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${getBadgeStyle(log.score, log.maxScore)}`}>
          {log.score}/{log.maxScore}
        </span>
      </div>
      <p className="text-[10px] text-slate-500 font-bold">{log.date}</p>
      {log.teacherName && (
        <p className="text-[10px] text-primary font-bold mt-1 flex items-center gap-1">
          <User size={12} />
          <span>المعلم الراصد: {log.teacherName}</span>
        </p>
      )}
      {log.teacherNote && (
        <div className="flex gap-2 text-xs text-slate-600 mt-2 bg-white p-2 rounded-lg border border-slate-100">
          <MessageSquare size={14} className="text-teal-600 shrink-0 mt-0.5" />
          <p>{log.teacherNote}</p>
        </div>
      )}
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6 bg-slate-50 min-h-screen"
    >
      <button onClick={onBack} className="text-teal-600 font-bold flex items-center gap-2 mb-6 hover:text-teal-800">
        <ArrowRight size={20} /> العودة لملف الطالب
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">السجل الأكاديمي التفصيلي لمادة: {subject}</h1>
        <p className="text-slate-600 mt-2">الطالب: {studentName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* بطاقة المشاركة */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">مشاركة</h2>
          <div className="card-body">
            {combinedLogs.filter(log => log.category === 'مشاركة').length > 0 ? (
              combinedLogs.filter(log => log.category === 'مشاركة').map((log, idx) => (
                <LogItemComponent key={log.id || idx} log={log} />
              ))
            ) : (
              <div className="empty-state text-slate-400 text-sm">لا توجد سجلات</div>
            )}
          </div>
        </div>

        {/* بطاقة الواجب */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">واجب</h2>
          <div className="card-body">
            {combinedLogs.filter(log => log.category === 'واجب').length > 0 ? (
              combinedLogs.filter(log => log.category === 'واجب').map((log, idx) => (
                <LogItemComponent key={log.id || idx} log={log} />
              ))
            ) : (
              <div className="empty-state text-slate-400 text-sm">لا توجد سجلات</div>
            )}
          </div>
        </div>

        {/* بطاقة المهمة الأدائية */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">مهمة أدائية</h2>
          <div className="card-body">
            {combinedLogs.filter(log => log.category === 'مهمة أدائية').length > 0 ? (
              combinedLogs.filter(log => log.category === 'مهمة أدائية').map((log, idx) => (
                <LogItemComponent key={log.id || idx} log={log} />
              ))
            ) : (
              <div className="empty-state text-slate-400 text-sm">لا توجد سجلات</div>
            )}
          </div>
        </div>

        {/* بطاقة الاختبار */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">اختبار</h2>
          <div className="card-body">
            {combinedLogs.filter(log => log.category === 'اختبار').length > 0 ? (
              combinedLogs.filter(log => log.category === 'اختبار').map((log, idx) => (
                <LogItemComponent key={log.id || idx} log={log} />
              ))
            ) : (
              <div className="empty-state text-slate-400 text-sm">لا توجد سجلات</div>
            )}
          </div>
        </div>
      </div>


      {/* السجل السلوكي */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6">السجل السلوكي</h2>
        <div className="card-body">
          {combinedLogs.filter(log => log.category === 'سلوك').length > 0 ? (
            combinedLogs.filter(log => log.category === 'سلوك').map((log, idx) => (
              <div key={log.id || idx} className={`p-3 mb-3 rounded-lg border ${log.isLocal ? 'bg-amber-50 border-amber-100' : 'bg-blue-50/50 border-blue-100'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${log.isLocal ? 'text-amber-800' : 'text-blue-800'}`}>{log.taskName}</span>
                      {log.isLocal && <span className="text-[8px] bg-amber-200 text-amber-800 px-1 rounded">غير مزامن</span>}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">{log.date}</span>
                      {log.teacherName && (
                        <span className="text-[10px] text-primary font-bold block">بواسطة: {log.teacherName}</span>
                      )}
                    </div>
                  </div>
                 {log.teacherNote && (
                    <div className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200 shadow-sm">
                      <span className="font-semibold text-slate-500 mr-1">ملاحظة المعلم:</span> 
                      {log.teacherNote}
                    </div>
                 )}
              </div>
            ))
          ) : (
            <div className="empty-state text-slate-400 text-sm">لا توجد ملاحظات سلوكية لهذه المادة</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
