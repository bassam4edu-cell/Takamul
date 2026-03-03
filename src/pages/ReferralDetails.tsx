import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  FileText, 
  MessageSquare,
  History,
  Send,
  ShieldAlert,
  ArrowRightLeft,
  Printer,
  Calendar,
  Users,
  Edit2,
  Save,
  X,
  RotateCcw,
  File,
  Download,
  ExternalLink,
  Upload,
  Info,
  Image as ImageIcon
} from 'lucide-react';
import { Referral, ReferralLog } from '../types';
import { useAuth } from '../App';
import { motion } from 'motion/react';

const ReferralDetails: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [data, setData] = useState<{ referral: Referral, logs: ReferralLog[], studentReferralsCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [showMeetingInputs, setShowMeetingInputs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<string | null>(null);
  const [evidenceError, setEvidenceError] = useState('');
  const [editForm, setEditForm] = useState({
    type: '',
    severity: '',
    reason: '',
    teacher_notes: '',
    remedial_plan: '',
    remedial_plan_file: '',
    status: ''
  });
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    fetch(`/api/referrals/${id}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setEditForm({
          type: d.referral.type,
          severity: d.referral.severity,
          reason: d.referral.reason,
          teacher_notes: d.referral.teacher_notes,
          remedial_plan: d.referral.remedial_plan || '',
          remedial_plan_file: d.referral.remedial_plan_file || '',
          status: d.referral.status
        });
        setLoading(false);
      });
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setFileError('يرجى اختيار ملف PDF فقط');
      return;
    }
    if (file.size > 500 * 1024) {
      setFileError('حجم الملف يجب أن لا يتجاوز 500 كيلوبايت');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditForm({ ...editForm, remedial_plan_file: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleAdminUpdate = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/referrals/${id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const d = await (await fetch(`/api/referrals/${id}`)).json();
        setData(d);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEvidenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setEvidenceError('');
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      setEvidenceError('يرجى اختيار ملف PDF أو صورة فقط');
      return;
    }
    if (file.size > 1024 * 1024) {
      setEvidenceError('حجم الملف يجب أن لا يتجاوز 1 ميجابايت');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEvidenceFile(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAction = async (action: string, status: string, customNotes?: string) => {
    const finalNotes = customNotes || actionNotes;
    if (!finalNotes.trim()) {
      alert('يرجى كتابة ملاحظات الإجراء');
      return;
    }

    // Validation for Vice Principal: Evidence is mandatory for forwarding or closing
    if (user?.role === 'vice_principal' && (status === 'pending_counselor' || status === 'resolved')) {
      if (!evidenceFile) {
        alert('يجب رفع شاهد/دليل الإجراء (ملف توثيقي) قبل إتمام هذه العملية');
        return;
      }
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/referrals/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          action,
          notes: finalNotes,
          status,
          evidence_file: evidenceFile || (user?.role === 'teacher' ? editForm.remedial_plan_file : null),
          evidence_text: user?.role === 'teacher' ? editForm.remedial_plan : null
        }),
      });

      if (response.ok) {
        // Refresh data
        const refreshRes = await fetch(`/api/referrals/${id}`);
        if (refreshRes.ok) {
          const d = await refreshRes.json();
          setData(d);
          setActionNotes('');
          setMeetingDate('');
          setMeetingTime('');
          setEvidenceFile(null);
          setShowMeetingInputs(false);
        }
      } else {
        const errData = await response.json().catch(() => ({ error: 'فشل تنفيذ الإجراء' }));
        alert(errData.error || 'حدث خطأ أثناء تنفيذ الإجراء');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ في الاتصال بالخادم');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleMeeting = async () => {
    if (!meetingDate || !meetingTime || !actionNotes.trim()) {
      alert('يرجى تحديد الموعد وكتابة ملاحظات الإجراء');
      return;
    }
    const notes = `موعد الجلسة: ${meetingDate} الساعة ${meetingTime}\n\nملاحظات: ${actionNotes}`;
    await handleAction('تحديد موعد جلسة مع ولي الأمر', 'scheduled_meeting', notes);
  };

  if (loading || !data) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-slate-400 font-extrabold uppercase tracking-widest text-xs">جاري تحميل تفاصيل التحويل...</p>
    </div>
  );

  const { referral, logs, studentReferralsCount } = data;
  const isFirstReferral = studentReferralsCount === 1;

  const vpName = logs.find(l => l.user_role === 'vice_principal')?.user_name || '........................';
  const counselorName = logs.find(l => l.user_role === 'counselor')?.user_name || '........................';
  const principalName = logs.find(l => l.user_role === 'principal' || l.user_role === 'admin')?.user_name || '........................';

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print, aside, header, button, .sticky, .no-print-area {
            display: none !important;
          }
          body, main {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            direction: rtl;
            height: auto !important;
            overflow: visible !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          ::-webkit-scrollbar {
            display: none !important;
          }
          .max-w-6xl {
            max-width: 100% !important;
            width: 100% !important;
          }
          .sts-card {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
          .print-report {
            display: block !important;
            padding: 5mm;
            transform: scale(0.95);
            transform-origin: top center;
          }
          .print-section {
            margin-bottom: 15px;
            border: 1px solid #000;
            page-break-inside: avoid;
          }
          .print-section-header {
            background-color: #f1f5f9 !important;
            border-bottom: 1px solid #000;
            padding: 6px 10px;
            font-weight: bold;
            font-size: 13px;
          }
          .print-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
          }
          .print-cell {
            padding: 6px 10px;
            border-bottom: 1px solid #eee;
            border-left: 1px solid #eee;
            font-size: 11px;
          }
          .print-cell:last-child {
            border-left: none;
          }
          .print-label {
            font-weight: bold;
            color: #475569;
            margin-left: 6px;
          }
          .print-full-cell {
            padding: 10px;
            font-size: 11px;
            line-height: 1.5;
          }
          @page {
            size: A4 portrait;
            margin: 0.5cm;
          }
        }
        .print-report {
          display: none;
        }
      `}} />

      {/* Official Print Report (Visible only on print) */}
      <div className="print-report font-sans">
        {/* Print Header - Text Only */}
        <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
          <div className="text-right space-y-1">
            <p className="text-sm font-black">المملكة العربية السعودية</p>
            <p className="text-sm font-black">وزارة التعليم</p>
            <p className="text-sm font-black">الإدارة العامة للتعليم بمنطقة الرياض</p>
            <p className="text-sm font-black">ثانوية أم القرى</p>
          </div>
          <div className="text-left space-y-1">
            <h1 className="text-xl font-black mb-1">تقرير حالة طالب تفصيلي</h1>
            <p className="text-xs font-bold text-slate-700">رقم الحالة: #{referral.id}</p>
            <p className="text-xs font-bold text-slate-700">تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</p>
          </div>
        </div>

        {/* Section 1: Student Data */}
        <div className="print-section">
          <div className="print-section-header">القسم الأول: بيانات الطالب الأساسية</div>
          <div className="print-grid">
            <div className="print-cell"><span className="print-label">اسم الطالب:</span> {referral.student_name}</div>
            <div className="print-cell"><span className="print-label">رقم الهوية:</span> {referral.student_national_id || 'غير مسجل'}</div>
            <div className="print-cell"><span className="print-label">رقم الحالة:</span> #{referral.id}</div>
            <div className="print-cell"><span className="print-label">الصف الدراسي:</span> {referral.student_grade}</div>
            <div className="print-cell"><span className="print-label">الفصل:</span> {referral.student_section}</div>
            <div className="print-cell"><span className="print-label">تاريخ التحويل:</span> {new Date(referral.created_at).toLocaleDateString('ar-SA')}</div>
          </div>
        </div>

        {/* Section 2: Teacher Statement */}
        <div className="print-section">
          <div className="print-section-header">القسم الثاني: اجراءات المعلم</div>
          <div className="print-grid">
            <div className="print-cell"><span className="print-label">اسم المعلم:</span> {referral.teacher_name}</div>
            <div className="print-cell"><span className="print-label">نوع المشكلة:</span> {
              referral.type === 'behavior' ? 'سلوكية' : 
              referral.type === 'academic' ? 'ضعف دراسي' : 
              referral.type === 'attendance' ? 'غياب وتأخر' : 'زي مدرسي'
            }</div>
          </div>
          <div className="print-full-cell">
            <p className="font-bold mb-1">وصف المشكلة والإجراءات المتخذة:</p>
            <p>{referral.reason}</p>
            {referral.remedial_plan && (
              <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded">
                <p className="font-bold mb-1 text-xs">الخطة العلاجية المسجلة:</p>
                <p className="text-xs">{referral.remedial_plan}</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Vice Principal Actions */}
        <div className="print-section">
          <div className="print-section-header">القسم الثالث: اجراءات وكيل شؤوون الطلاب</div>
          {logs.filter(l => l.user_role === 'vice_principal').length > 0 ? (
            logs.filter(l => l.user_role === 'vice_principal').map((log, idx) => (
              <div key={idx} className="border-b border-slate-200 last:border-0 p-3">
                <div className="flex justify-between mb-1 text-[10px] font-bold text-slate-500">
                  <span>الإجراء: {log.action}</span>
                  <span>التاريخ: {new Date(log.created_at).toLocaleString('ar-SA')}</span>
                </div>
                <p className="text-xs leading-relaxed">{log.notes}</p>
              </div>
            ))
          ) : (
            <div className="p-3 text-xs text-slate-400 italic">لا توجد إجراءات مسجلة للوكيل بعد.</div>
          )}
        </div>

        {/* Section 4: Counselor Intervention */}
        <div className="print-section">
          <div className="print-section-header">القسم الرابع: اجراءات الموجه الطلابي</div>
          {logs.filter(l => l.user_role === 'counselor').length > 0 ? (
            logs.filter(l => l.user_role === 'counselor').map((log, idx) => (
              <div key={idx} className="border-b border-slate-200 last:border-0 p-3">
                <div className="flex justify-between mb-1 text-[10px] font-bold text-slate-500">
                  <span>الإجراء: {log.action}</span>
                  <span>التاريخ: {new Date(log.created_at).toLocaleString('ar-SA')}</span>
                </div>
                <p className="text-xs leading-relaxed">{log.notes}</p>
              </div>
            ))
          ) : (
            <div className="p-3 text-xs text-slate-400 italic">لا توجد تدخلات مسجلة للموجه بعد.</div>
          )}
        </div>

        {/* Print Signatures - Dynamic */}
        <div className="mt-12 grid grid-cols-4 gap-4 text-center">
          <div className="space-y-6">
            <p className="font-black text-xs underline underline-offset-4">المعلم</p>
            <p className="text-[10px] font-bold">{referral.teacher_name}</p>
            <div className="h-8"></div>
            <p className="text-[10px]">التوقيع: ....................</p>
          </div>
          <div className="space-y-6">
            <p className="font-black text-xs underline underline-offset-4">وكيل شؤون الطلاب</p>
            <p className="text-[10px] font-bold">{vpName}</p>
            <div className="h-8"></div>
            <p className="text-[10px]">التوقيع: ....................</p>
          </div>
          <div className="space-y-6">
            <p className="font-black text-xs underline underline-offset-4">الموجه الطلابي</p>
            <p className="text-[10px] font-bold">{counselorName}</p>
            <div className="h-8"></div>
            <p className="text-[10px]">التوقيع: ....................</p>
          </div>
          <div className="space-y-6">
            <p className="font-black text-xs underline underline-offset-4">مدير المدرسة</p>
            <p className="text-[10px] font-bold">{principalName}</p>
            <div className="h-8"></div>
            <p className="text-[10px]">التوقيع: ....................</p>
          </div>
        </div>

        <div className="mt-8 text-center text-[8px] text-slate-400 border-t pt-2">
          نظام تحويل الطلاب الذكي - ثانوية أم القرى
        </div>
      </div>


      <div className="no-print space-y-10">
        {/* First Referral Warning for VP */}
        {user?.role === 'vice_principal' && isFirstReferral && referral.status === 'pending_vp' && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-amber-50 border-r-4 border-amber-500 p-6 rounded-2xl flex items-center gap-4 shadow-sm"
          >
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4 className="font-black text-amber-800">تنبيه: هذه هي المرة الأولى للطالب</h4>
              <p className="text-amber-700 text-sm font-bold">بناءً على سجل النظام، هذا هو أول تحويل مسجل لهذا الطالب. يرجى اتخاذ الإجراءات التربوية الأولية.</p>
            </div>
          </motion.div>
        )}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-slate-400 hover:bg-white hover:text-primary rounded-2xl transition-all border border-transparent hover:border-slate-100 shadow-sm shrink-0"
          >
            <ChevronRight size={24} className="md:w-7 md:h-7" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">تفاصيل التحويل #{referral.id}</h1>
            <div className="flex flex-wrap items-center gap-3 text-[10px] md:text-sm text-slate-500 mt-1 font-bold">
              <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(referral.created_at).toLocaleString('ar-SA')}</span>
              <span className="hidden md:block w-1 h-1 bg-slate-300 rounded-full" />
              <span className="flex items-center gap-1.5"><User size={14} /> {referral.teacher_name}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 no-print">
          {(user?.role === 'admin' || (user?.role === 'teacher' && referral.status === 'returned_to_teacher')) && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 md:px-5 py-3 rounded-2xl text-[10px] md:text-xs font-extrabold border flex items-center gap-2 transition-all shadow-sm ${
                isEditing ? 'bg-red-50 text-red-700 border-red-100' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isEditing ? <X size={18} /> : <Edit2 size={18} />}
              {isEditing ? 'إلغاء التعديل' : 'تعديل التحويل'}
            </button>
          )}
          
          <button 
            type="button"
            onClick={() => {
              window.focus();
              window.print();
            }}
            className="px-5 py-3 bg-white text-slate-700 rounded-2xl text-xs font-extrabold border border-slate-200 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer size={18} />
            طباعة التقرير التفصيلي
          </button>

          {referral.status === 'pending_vp' && (
            <span className="px-5 py-3 bg-red-50 text-red-700 rounded-2xl text-xs font-extrabold border border-red-100 flex items-center gap-2 uppercase tracking-widest">
              <ShieldAlert size={18} />
              بانتظار مراجعة الوكيل
            </span>
          )}
          {referral.status === 'pending_counselor' && (
            <span className="px-5 py-3 bg-amber-50 text-amber-700 rounded-2xl text-xs font-extrabold border border-amber-100 flex items-center gap-2 uppercase tracking-widest">
              <Clock size={18} />
              قيد المتابعة مع الموجه
            </span>
          )}
          {referral.status === 'scheduled_meeting' && (
            <span className="px-5 py-3 bg-primary/5 text-primary rounded-2xl text-xs font-extrabold border border-primary/10 flex items-center gap-2 uppercase tracking-widest">
              <Calendar size={18} />
              موعد جلسة مع ولي الأمر
            </span>
          )}
          {referral.status === 'returned_to_teacher' && (
            <span className="px-5 py-3 bg-amber-50 text-amber-700 rounded-2xl text-xs font-extrabold border border-amber-100 flex items-center gap-2 uppercase tracking-widest">
              <RotateCcw size={18} />
              معاد للمعلم للنواقص
            </span>
          )}
          {referral.status === 'resolved' && (
            <div className="flex items-center gap-3">
              <span className="px-5 py-3 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-extrabold border border-emerald-100 flex items-center gap-2 uppercase tracking-widest">
                <CheckCircle2 size={18} />
                تمت المعالجة والحل
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
        <div className="lg:col-span-2 space-y-8 md:space-y-10">
          <div className="sts-card p-6 md:p-10 space-y-8 md:space-y-10">
            {/* Returned Case Instructions for Teacher */}
            {user?.role === 'teacher' && referral.status === 'returned_to_teacher' && (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-red-50 border-r-4 border-red-500 p-8 rounded-3xl space-y-4 shadow-sm"
              >
                <div className="flex items-center gap-3 text-red-800 font-black text-lg">
                  <RotateCcw size={24} />
                  <span>توجيهات الوكيل (نواقص التحويل)</span>
                </div>
                <div className="bg-white/80 p-6 rounded-2xl border border-red-100 text-red-900 font-bold leading-relaxed shadow-inner">
                  {logs.find(l => l.action.includes('ارجاع'))?.notes || 'يرجى مراجعة سجل الإجراءات أدناه لمعرفة النواقص المطلوبة.'}
                </div>
                {logs.find(l => l.action.includes('ارجاع'))?.evidence_file && (
                  <div className="flex items-center gap-4 pt-2">
                    <span className="text-xs font-black text-red-700 uppercase tracking-widest">المرفق التوضيحي من الوكيل:</span>
                    <button 
                      onClick={() => window.open(logs.find(l => l.action.includes('ارجاع'))?.evidence_file, '_blank')}
                      className="flex items-center gap-2 bg-white text-red-600 px-4 py-2 rounded-xl border border-red-200 text-[10px] font-black hover:bg-red-100 transition-all"
                    >
                      <ExternalLink size={14} />
                      فتح المرفق
                    </button>
                  </div>
                )}
                <p className="text-xs text-red-600 font-bold">يرجى تعديل البيانات المطلوبة أعلاه ثم النقر على "حفظ وإرسال للوكيل".</p>
              </motion.div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 md:pb-10 border-b border-slate-50 gap-6">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-primary text-white rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-2xl md:text-4xl font-extrabold shadow-2xl shadow-primary/20 border-4 border-white shrink-0">
                  {referral.student_name.charAt(0)}
                </div>
                <div className="space-y-1 md:space-y-2">
                  <h2 className="text-xl md:text-3xl font-extrabold text-slate-900">{referral.student_name}</h2>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-slate-500">
                    <span className="flex items-center gap-2 font-bold bg-slate-100 px-3 py-1 rounded-xl text-[10px] md:text-xs">
                      <User size={14} className="text-primary" />
                      {referral.student_grade} - الفصل {referral.student_section}
                    </span>
                    <span className="flex items-center gap-2 font-bold bg-slate-100 px-3 py-1 rounded-xl text-[10px] md:text-xs">
                      <ShieldAlert size={14} className="text-primary" />
                      هوية: {referral.student_national_id || 'غير مسجل'}
                    </span>
                    <span className="hidden md:block w-1.5 h-1.5 bg-slate-200 rounded-full" />
                    <span className={`font-extrabold text-[10px] md:text-xs px-3 py-1 rounded-xl border uppercase tracking-widest ${
                      referral.severity === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 
                      referral.severity === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-primary/5 text-primary border-primary/10'
                    }`}>
                      {referral.severity === 'high' ? 'المرة الثالثة فأكثر' : 
                       referral.severity === 'medium' ? 'المرة الثانية' : 'المرة الأولى'}
                    </span>
                  </div>
                </div>
              </div>
              {['vice_principal', 'counselor', 'principal', 'admin'].includes(user?.role || '') && (
                <button 
                  onClick={() => navigate(`/student/${referral.student_id}`)}
                  className="flex items-center justify-center gap-2 text-primary font-black text-xs md:text-sm bg-primary/5 px-4 md:px-6 py-3 rounded-2xl border border-primary/10 hover:bg-primary/10 transition-all w-full md:w-auto"
                >
                  <User size={16} md:size={18} />
                  <span>عرض ملف الطالب</span>
                  <ExternalLink size={12} md:size={14} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                    <FileText size={16} />
                  </div>
                  <span>سبب التحويل</span>
                </div>
                {isEditing ? (
                  <input 
                    type="text"
                    value={editForm.reason}
                    onChange={(e) => setEditForm({...editForm, reason: e.target.value})}
                    className="sts-input"
                  />
                ) : (
                  <p className="text-slate-800 font-extrabold leading-relaxed bg-slate-50/50 p-6 rounded-2xl border border-slate-100 text-lg">
                    {referral.reason}
                  </p>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                    <MessageSquare size={16} />
                  </div>
                  <span>ملاحظات المعلم</span>
                </div>
                {isEditing ? (
                  <textarea 
                    rows={3}
                    value={editForm.teacher_notes}
                    onChange={(e) => setEditForm({...editForm, teacher_notes: e.target.value})}
                    className="sts-input resize-none"
                  />
                ) : (
                  <p className="text-slate-600 font-bold leading-relaxed bg-slate-50/50 p-6 rounded-2xl border border-slate-100 italic">
                    "{referral.teacher_notes || 'لا توجد ملاحظات إضافية'}"
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6 pt-10 border-t border-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                    <ShieldAlert size={16} />
                  </div>
                  <span>الخطة العلاجية / الإجراءات التربوية</span>
                </div>
                {!isEditing && referral.remedial_plan_file && (
                  <div className="flex gap-3">
                    <a 
                      href={referral.remedial_plan_file} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[10px] font-extrabold text-primary hover:text-primary-light bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 transition-all uppercase tracking-widest"
                    >
                      <File size={14} />
                      <span>عرض</span>
                      <ExternalLink size={12} />
                    </a>
                    <a 
                      href={referral.remedial_plan_file} 
                      download={`plan_${referral.id}.pdf`}
                      className="flex items-center gap-2 text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 transition-all uppercase tracking-widest"
                    >
                      <Download size={14} />
                      <span>تحميل</span>
                    </a>
                  </div>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-6">
                  <textarea 
                    rows={4}
                    value={editForm.remedial_plan}
                    onChange={(e) => setEditForm({...editForm, remedial_plan: e.target.value})}
                    className="sts-input resize-none"
                    placeholder="اكتب الخطة العلاجية أو الإجراءات التي تم اتخاذها..."
                  />
                  <div className="space-y-3">
                    <label className="text-[10px] font-extrabold text-slate-500 mr-1 uppercase tracking-widest">تحديث ملف الخطة (PDF - بحد أقصى 500KB)</label>
                    <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/30 hover:border-primary/50 transition-all text-center">
                      <input 
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={24} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">انقر أو اسحب الملف هنا</span>
                      </div>
                    </div>
                    {fileError && <p className="text-red-500 text-[10px] mt-1 mr-1 font-extrabold">{fileError}</p>}
                    {editForm.remedial_plan_file && !fileError && <p className="text-emerald-600 text-[10px] mt-1 mr-1 font-extrabold">تم إرفاق الملف بنجاح</p>}
                  </div>
                </div>
              ) : (
                <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 text-primary font-bold text-lg leading-relaxed shadow-inner">
                  {referral.remedial_plan || 'لم يتم تسجيل خطة علاجية بعد'}
                </div>
              )}
            </div>

            {isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-slate-50">
                <div className="space-y-3">
                  <label className="text-[10px] font-extrabold text-slate-500 mr-1 uppercase tracking-widest">نوع التحويل</label>
                  <select 
                    value={editForm.type}
                    onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  >
                    <option value="behavior">سلوكي</option>
                    <option value="academic">أكاديمي</option>
                    <option value="attendance">غياب وتأخر</option>
                    <option value="uniform">زي مدرسي</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-extrabold text-slate-500 mr-1 uppercase tracking-widest">تكرار المخالفة</label>
                  <select 
                    value={editForm.severity}
                    onChange={(e) => setEditForm({...editForm, severity: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  >
                    <option value="low">المرة الأولى</option>
                    <option value="medium">المرة الثانية</option>
                    <option value="high">المرة الثالثة فأكثر</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-extrabold text-slate-500 mr-1 uppercase tracking-widest">الحالة</label>
                  <select 
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  >
                    <option value="pending_vp">بانتظار الوكيل</option>
                    <option value="pending_counselor">بانتظار الموجه</option>
                    <option value="scheduled_meeting">موعد جلسة</option>
                    <option value="resolved">تم الحل</option>
                    <option value="closed">مغلق</option>
                  </select>
                </div>
                <div className="md:col-span-3 flex gap-4">
                  <button 
                    onClick={handleAdminUpdate}
                    disabled={submitting}
                    className={`flex-1 font-extrabold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg ${
                      user?.role === 'teacher' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'sts-button-primary'
                    }`}
                  >
                    <Save size={20} />
                    <span>{user?.role === 'teacher' ? 'حفظ التعديلات فقط' : 'حفظ التعديلات'}</span>
                  </button>
                  {user?.role === 'teacher' && referral.status === 'returned_to_teacher' && (
                    <button 
                      onClick={async () => {
                        await handleAdminUpdate();
                        await handleAction('تم استكمال النواقص وإعادة الإرسال للوكيل', 'pending_vp', 'تم تحديث البيانات المطلوبة واستكمال النواقص.');
                      }}
                      disabled={submitting}
                      className="flex-[2] sts-button-accent flex items-center justify-center gap-3"
                    >
                      <Send size={20} />
                      <span>حفظ وإرسال للوكيل</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="sts-card p-10 space-y-10">
            <div className="flex items-center gap-4 text-slate-800 font-extrabold text-xl border-b border-slate-50 pb-6">
              <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                <History size={22} />
              </div>
              <span className="uppercase tracking-widest">سجل الإجراءات</span>
            </div>
            
            <div className="relative space-y-10 pr-6">
              <div className="absolute right-6 top-2 bottom-2 w-1 bg-slate-50 rounded-full" />
              
              {logs.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-10 text-slate-300">
                  <AlertCircle size={48} className="opacity-20" />
                  <p className="font-extrabold uppercase tracking-widest text-xs">لا توجد إجراءات مسجلة بعد</p>
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={log.id} className="relative pr-12">
                    <div className="absolute right-[-10px] top-2 w-5 h-5 rounded-full bg-primary border-4 border-white shadow-lg z-10" />
                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-4 hover:border-primary/20 transition-all group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary font-extrabold shadow-sm border border-slate-100">
                            {log.user_name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-extrabold text-slate-800">{log.user_name}</span>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                              {log.user_role === 'teacher' ? 'معلم' : log.user_role === 'vice_principal' ? 'وكيل' : log.user_role === 'counselor' ? 'موجه' : 'مدير'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-extrabold uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-slate-100">
                          <Clock size={12} />
                          {new Date(log.created_at).toLocaleString('ar-SA')}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-primary font-extrabold text-sm uppercase tracking-widest">{log.action}</p>
                        <p className="text-slate-600 text-sm font-bold leading-relaxed bg-white p-4 rounded-2xl border border-slate-50">{log.notes}</p>
                        
                        {/* Evidence in Log */}
                        {(log.evidence_text || log.evidence_file) && (
                          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                              <ShieldAlert size={12} />
                              <span>الشواهد المرفقة مع هذا الإجراء</span>
                            </div>
                            
                            {log.evidence_text && (
                              <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 text-sm font-bold text-slate-700 leading-relaxed shadow-inner">
                                {log.evidence_text}
                              </div>
                            )}
                            
                            {log.evidence_file && (
                              <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-slate-50 text-primary rounded-xl flex items-center justify-center border border-slate-100">
                                    {log.evidence_file.startsWith('data:image/') ? <ImageIcon size={22} /> : <FileText size={22} />}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">شاهد مرفق</span>
                                    <span className="text-[10px] font-bold text-slate-400">انقر للمعاينة أو التحميل</span>
                                  </div>
                                </div>
                                <div className="flex gap-3">
                                  <a 
                                    href={log.evidence_file} 
                                    download={`evidence-${log.id}.png`}
                                    className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                                    title="تحميل الملف"
                                  >
                                    <Download size={18} />
                                  </a>
                                  <button 
                                    onClick={() => window.open(log.evidence_file, '_blank')}
                                    className="w-10 h-10 flex items-center justify-center bg-white text-slate-400 border border-slate-100 rounded-xl hover:text-primary hover:border-primary/20 transition-all"
                                    title="فتح في نافذة جديدة"
                                  >
                                    <ExternalLink size={18} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-10 sticky top-10">
          {((user?.role === 'vice_principal' && referral.status === 'pending_vp') || 
            (user?.role === 'counselor' && (referral.status === 'pending_counselor' || referral.status === 'scheduled_meeting')) ||
            (user?.role === 'teacher' && referral.status === 'returned_to_teacher')) && (
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="sts-card p-10 space-y-8"
            >
              <div className="flex items-center gap-4 text-slate-800 font-extrabold text-xl border-b border-slate-50 pb-6">
                <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                  <Send size={22} />
                </div>
                <span className="uppercase tracking-widest">اتخاذ إجراء</span>
              </div>

              {showMeetingInputs ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-extrabold text-slate-500 mr-1 uppercase tracking-widest">تاريخ الجلسة</label>
                      <input 
                        type="date" 
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        className="sts-input"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-extrabold text-slate-500 mr-1 uppercase tracking-widest">الوقت</label>
                      <input 
                        type="time" 
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                        className="sts-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-extrabold text-slate-500 mr-1 uppercase tracking-widest">ملاحظات الموعد</label>
                    <textarea 
                      rows={3}
                      placeholder="اكتب تفاصيل الموعد أو سبب الجلسة..."
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      className="sts-input resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleScheduleMeeting}
                      disabled={submitting}
                      className="w-full sts-button-primary"
                    >
                      تأكيد الموعد
                    </button>
                    <button
                      onClick={() => setShowMeetingInputs(false)}
                      className="w-full py-4 bg-slate-100 text-slate-600 font-extrabold rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <label className="text-[10px] font-extrabold text-slate-500 mr-1 uppercase tracking-widest">
                      {referral.status === 'scheduled_meeting' ? 'نتائج اللقاء مع ولي الأمر' : 'ملاحظات الإجراء'}
                    </label>
                    <textarea 
                      rows={5}
                      placeholder={referral.status === 'scheduled_meeting' ? "اكتب ما تم خلال اللقاء والاتفاق مع ولي الأمر..." : "اكتب تفاصيل الإجراء المتخذ أو التوجيهات..."}
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      className="sts-input resize-none"
                    />
                  </div>

                  <div className="space-y-4 pt-4">
                    {/* Evidence/Attachment Upload for VP and Teacher */}
                    {(user?.role === 'vice_principal' || (user?.role === 'teacher' && referral.status === 'returned_to_teacher')) && (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 mb-6">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Upload size={14} />
                          {user?.role === 'vice_principal' ? 'شاهد/دليل الإجراء (إلزامي للتحويل أو الإغلاق)' : 'إرفاق مستند/مرفق إضافي (اختياري)'}
                        </label>
                        <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-4 bg-white hover:border-primary/50 transition-all text-center">
                          <input 
                            type="file"
                            accept=".pdf,image/*"
                            onChange={handleEvidenceFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          />
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-bold text-slate-600">
                              {evidenceFile ? 'تم اختيار الملف بنجاح' : user?.role === 'vice_principal' ? 'انقر لرفع شاهد الإجراء' : 'انقر لرفع المرفق'}
                            </span>
                          </div>
                        </div>
                        {evidenceError && <p className="text-red-500 text-[10px] font-bold">{evidenceError}</p>}
                      </div>
                    )}

                    {user?.role === 'vice_principal' && (
                      <div className="space-y-6">
                        <div className="flex flex-col gap-3">
                          {/* Hide Forward button if it's the first referral */}
                          {!isFirstReferral && (
                            <button
                              onClick={() => handleAction('تحويل للموجه الطلابي', 'pending_counselor')}
                              disabled={submitting}
                              className="w-full sts-button-primary flex items-center justify-center gap-3"
                            >
                              <ArrowRightLeft size={20} />
                              <span>تحويل للموجه</span>
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleAction('ارجاع التحويل للمعلم لاستكمال نواقص', 'returned_to_teacher')}
                            disabled={submitting}
                            className="w-full sts-button-accent flex items-center justify-center gap-3"
                          >
                            <RotateCcw size={20} />
                            <span>إرجاع للمعلم (نواقص)</span>
                          </button>
                          
                          <button
                            onClick={() => handleAction('إغلاق الحالة مباشرة', 'resolved')}
                            disabled={submitting}
                            className="w-full py-4 bg-emerald-600 text-white font-extrabold rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20"
                          >
                            <CheckCircle2 size={20} />
                            <span>معالجة وإغلاق</span>
                          </button>
                        </div>
                      </div>
                    )}
                    {user?.role === 'counselor' && (
                      <>
                        {referral.status === 'pending_counselor' && (
                          <button
                            onClick={() => setShowMeetingInputs(true)}
                            disabled={submitting}
                            className="w-full sts-button-primary flex items-center justify-center gap-3"
                          >
                            <Users size={20} />
                            <span>تحديد جلسة مع ولي الأمر</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(referral.status === 'scheduled_meeting' ? 'إتمام اللقاء والمعالجة' : 'تمت دراسة الحالة ووضع خطة علاجية', 'resolved')}
                          disabled={submitting}
                          className="w-full py-4 bg-emerald-600 text-white font-extrabold rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20"
                        >
                          <CheckCircle2 size={20} />
                          <span>{referral.status === 'scheduled_meeting' ? 'إتمام اللقاء وإغلاق الحالة' : 'إتمام المعالجة'}</span>
                        </button>
                      </>
                    )}
                    {user?.role === 'teacher' && referral.status === 'returned_to_teacher' && (
                      <button
                        onClick={() => handleAction('استكمال النواقص وإعادة الإرسال', 'pending_vp')}
                        disabled={submitting}
                        className="w-full sts-button-primary flex items-center justify-center gap-3"
                      >
                        <Send size={20} />
                        <span>استكمال النواقص وإعادة الإرسال</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}

          <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-[5rem] -mr-8 -mt-8" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Info className="text-primary" size={24} />
                <h3 className="font-extrabold text-lg">إرشادات النظام</h3>
              </div>
              <p className="text-sm text-slate-400 font-bold leading-relaxed">
                يتم توثيق كافة الإجراءات المتخذة في سجل النظام آلياً. يرجى التأكد من دقة الملاحظات المسجلة حيث تعتبر مرجعاً رسمياً للحالة.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default ReferralDetails;
