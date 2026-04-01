import { apiFetch } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { logAction } from '../services/auditLogger';
import { 
  ChevronRight, 
  ChevronDown,
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  FileText, 
  MessageSquare,
  History,
  Send,
  ShieldAlert,
  Search,
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
  Image as ImageIcon,
  Trash2,
  ArrowUpRight
} from 'lucide-react';
import { Referral, ReferralLog } from '../types';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { formatHijriDate, formatHijriDateTime } from '../utils/dateUtils';
import HijriDatePicker from '../components/HijriDatePicker';
import { useSchoolSettings } from '../context/SchoolContext';

interface Violation {
  id: number;
  violation_name: string;
  degree: number;
  deduction_points: number;
  procedures: {
    steps: string[];
    general: string[];
  };
}

const getDegreeColor = (degree: number) => {
  switch (degree) {
    case 1: return 'border-emerald-200 bg-emerald-50/30 text-emerald-800';
    case 2: return 'border-orange-200 bg-orange-50/30 text-orange-800';
    case 3: return 'border-rose-200 bg-rose-50/30 text-rose-800';
    case 4: return 'border-purple-200 bg-purple-50/30 text-purple-800';
    case 5: return 'border-slate-800 bg-slate-50 text-slate-800';
    case 6: return 'border-red-600 bg-red-50 text-red-800';
    default: return 'border-slate-200 bg-slate-50 text-slate-800';
  }
};

const getDegreeHeaderColor = (degree: number) => {
  switch (degree) {
    case 1: return 'bg-emerald-100/50 hover:bg-emerald-100';
    case 2: return 'bg-orange-100/50 hover:bg-orange-100';
    case 3: return 'bg-rose-100/50 hover:bg-rose-100';
    case 4: return 'bg-purple-100/50 hover:bg-purple-100';
    case 5: return 'bg-slate-200/50 hover:bg-slate-200';
    case 6: return 'bg-red-200/50 hover:bg-red-200';
    default: return 'bg-slate-100/50 hover:bg-slate-100';
  }
};

const ReferralDetails: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { settings } = useSchoolSettings();
  
  const [data, setData] = useState<{ referral: Referral, logs: ReferralLog[], studentReferralsCount: number, principalName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [violationSearch, setViolationSearch] = useState('');
  const [selectedViolationId, setSelectedViolationId] = useState('');
  const [appliedActions, setAppliedActions] = useState<string[]>([]);
  const [applyViolation, setApplyViolation] = useState(false);
  const [isViolationModalOpen, setIsViolationModalOpen] = useState(false);
  const [tempSelectedViolationId, setTempSelectedViolationId] = useState('');
  const [tempAppliedActions, setTempAppliedActions] = useState<string[]>([]);
  const [openAccordion, setOpenAccordion] = useState<'administrative' | 'general' | null>('administrative');
  const [actionNotes, setActionNotes] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [showMeetingInputs, setShowMeetingInputs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<string | null>(null);
  const [evidenceError, setEvidenceError] = useState('');
  const [violationOccurrence, setViolationOccurrence] = useState(0);
  const [fetchingOccurrence, setFetchingOccurrence] = useState(false);
  const [editForm, setEditForm] = useState({
    type: '',
    severity: '',
    reason: '',
    teacher_notes: '',
    remedial_plan: '',
    remedial_plan_file: '',
    status: ''
  });
  const [showPrintHub, setShowPrintHub] = useState(false);
  const [recommendedTemplates, setRecommendedTemplates] = useState<{id: number, name: string, icon: string}[]>([]);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [bonusReason, setBonusReason] = useState('');
  const [submittingBonus, setSubmittingBonus] = useState(false);
  const [fileError, setFileError] = useState('');

  const handleBonusPoints = async () => {
    if (bonusPoints <= 0 || !bonusReason.trim()) {
      alert('يرجى إدخال النقاط وسبب التعويض');
      return;
    }
    setSubmittingBonus(true);
    try {
      const res = await apiFetch(`/api/students/${data?.referral.student_id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: 'compensation',
          points_changed: bonusPoints,
          reason: bonusReason,
          user_id: user?.id
        })
      });
      if (res.ok) {
        alert('تم إضافة نقاط التعويض بنجاح');
        setShowBonusModal(false);
        setBonusPoints(0);
        setBonusReason('');
        // Refresh data
        const refreshRes = await apiFetch(`/api/referrals/${id}`);
        if (refreshRes.ok) {
          const d = await refreshRes.json().catch(() => null);
          if (d) setData(d);
        }
        // Open template 9
        navigate(`/print/9/${id}`);
      } else {
        alert('حدث خطأ أثناء إضافة النقاط');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ في الاتصال بالخادم');
    } finally {
      setSubmittingBonus(false);
    }
  };

  // Utility to compress image
  const compressImage = (file: File, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if too large (max 1600px width/height)
          const MAX_SIZE = 1600;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const getFileExtension = (dataUrl: string) => {
    if (dataUrl.startsWith('data:application/pdf')) return 'pdf';
    if (dataUrl.startsWith('data:image/png')) return 'png';
    if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'jpg';
    return 'file';
  };

  useEffect(() => {
    const fetchReferral = async () => {
      try {
        const [refRes, violRes] = await Promise.all([
          apiFetch(`/api/referrals/${id}`),
          apiFetch('/api/violations')
        ]);
        
        if (refRes.ok) {
          const d = await refRes.json().catch(() => null);
          if (d) {
            setData(d);
            setApplyViolation(d.referral.type === 'behavior' || d.referral.type === 'attendance');
            setEditForm({
              type: d.referral.type,
              severity: d.referral.severity,
              reason: d.referral.reason,
              teacher_notes: d.referral.teacher_notes,
              remedial_plan: d.referral.remedial_plan || '',
              remedial_plan_file: d.referral.remedial_plan_file || '',
              status: d.referral.status
            });
            if (d.referral.violation_id) {
              setSelectedViolationId(d.referral.violation_id.toString());
              setAppliedActions(d.referral.applied_remedial_actions || []);
              
              // Fetch specific violation occurrence
              setFetchingOccurrence(true);
              apiFetch(`/api/students/${d.referral.student_id}/violations/${d.referral.violation_id}/occurrence`)
                .then(res => res.json())
                .then(occData => setViolationOccurrence(occData.count))
                .catch(err => console.error(err))
                .finally(() => setFetchingOccurrence(false));
            }
          }
        }

        if (violRes.ok) {
          const vData = await violRes.json();
          setViolations(vData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReferral();
  }, [id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');
    if (!file) return;
    
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('يرجى اختيار ملف PDF أو صورة (PNG, JPG) فقط');
      alert('نوع الملف غير مدعوم. يرجى اختيار PDF أو صورة.');
      return;
    }

    if (file.type === 'application/pdf') {
      if (file.size > 2 * 1024 * 1024) {
        setFileError('حجم ملف PDF يجب أن لا يتجاوز 2 ميجابايت. يرجى ضغط الملف قبل الرفع.');
        alert('ملف PDF كبير جداً (أكبر من 2MB).');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setEditForm({ ...editForm, remedial_plan_file: reader.result as string });
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('image/')) {
      try {
        if (file.size > 1024 * 1024) {
          const compressed = await compressImage(file, 0.6);
          setEditForm({ ...editForm, remedial_plan_file: compressed });
        } else {
          const reader = new FileReader();
          reader.onload = () => {
            setEditForm({ ...editForm, remedial_plan_file: reader.result as string });
          };
          reader.readAsDataURL(file);
        }
      } catch (err) {
        setFileError('فشل معالجة الصورة');
      }
    }
  };

  const handleAdminUpdate = async () => {
    setSubmitting(true);
    try {
      const response = await apiFetch(`/api/admin/referrals/${id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        logAction(
          'التحويلات',
          'UPDATE',
          'تفاصيل التحويل',
          `قام بتعديل بيانات التحويل للطالب ${data?.referral.student_name}`
        );
        const refreshRes = await apiFetch(`/api/referrals/${id}`);
        if (refreshRes.ok) {
          const d = await refreshRes.json().catch(() => null);
          if (d) {
            setData(d);
            setIsEditing(false);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEvidenceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setEvidenceError('');
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setEvidenceError('يرجى اختيار ملف PDF أو صورة (PNG, JPG) فقط');
      alert('نوع الملف غير مدعوم. يرجى اختيار PDF أو صورة.');
      return;
    }

    if (file.type === 'application/pdf') {
      if (file.size > 2 * 1024 * 1024) {
        setEvidenceError('حجم ملف PDF يجب أن لا يتجاوز 2 ميجابايت. يرجى ضغط الملف قبل الرفع.');
        alert('ملف PDF كبير جداً (أكبر من 2MB).');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setEvidenceFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('image/')) {
      try {
        if (file.size > 1024 * 1024) {
          const compressed = await compressImage(file, 0.6);
          setEvidenceFile(compressed);
        } else {
          const reader = new FileReader();
          reader.onload = () => {
            setEvidenceFile(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      } catch (err) {
        setEvidenceError('فشل معالجة الصورة');
      }
    }
  };

  const getRecommendedTemplates = (actions: string[]) => {
    const templates: {id: number, name: string, icon: string}[] = [];
    const actionsStr = actions.join(' ');

    if (actionsStr.includes('تعهد خطي') || actionsStr.includes('تعهد')) {
      templates.push({ id: 1, name: 'تعهد سلوكي', icon: '' });
    }
    if (actionsStr.includes('ولي أمر') || actionsStr.includes('ولي الأمر')) {
      templates.push({ id: 2, name: 'إشعار ولي أمر بمشكلة', icon: '' });
    }
    if (actionsStr.includes('دعوة ولي أمر') || actionsStr.includes('موعد جلسة')) {
      templates.push({ id: 5, name: 'خطاب دعوة ولي أمر', icon: '' });
    }
    if (actionsStr.includes('الموجه الطلابي') || actionsStr.includes('لجنة التوجيه') || actionsStr.includes('الموجه')) {
      templates.push({ id: 10, name: 'إحالة طالب', icon: '' });
      templates.push({ id: 12, name: 'خطة تعديل سلوك', icon: '' });
    }
    if (actionsStr.includes('غياب')) {
      templates.push({ id: 4, name: 'تعهد الحضور', icon: '' });
      templates.push({ id: 16, name: 'إجراءات الغياب', icon: '' });
    }
    if (actionsStr.includes('مركز البلاغات') || actionsStr.includes('1919')) {
      templates.push({ id: 15, name: 'نموذج إبلاغ 1919', icon: '' });
    }
    if (actionsStr.includes('الجهات الأمنية')) {
      templates.push({ id: 14, name: 'نموذج إبلاغ جهات أمنية', icon: '' });
    }
    if (actionsStr.includes('انعقاد لجنة التوجيه')) {
      templates.push({ id: 11, name: 'محضر اجتماع لجنة التوجيه', icon: '' });
    }
    if (actionsStr.includes('إدارة التعليم') || actionsStr.includes('مدير التعليم') || actionsStr.includes('نقل')) {
      templates.push({ id: 13, name: 'محضر الرفع الرسمي', icon: '' });
    }

    // Deduplicate
    const uniqueTemplates = Array.from(new Set(templates.map(t => t.id))).map(id => templates.find(t => t?.id === id)).filter(Boolean) as {id: number, name: string, icon: string}[];
    return uniqueTemplates;
  };

  const handleAction = async (action: string, status: string, customNotes?: string) => {
    const finalNotes = customNotes || actionNotes;
    if (!finalNotes.trim()) {
      alert('يرجى كتابة ملاحظات الإجراء');
      return;
    }

    // Validation for Vice Principal: Evidence is mandatory for closing, or forwarding if applying violation
    if (user?.role === 'vice_principal') {
      if (status === 'resolved' && !evidenceFile) {
        alert('يجب رفع شاهد/دليل الإجراء (ملف توثيقي) قبل إتمام هذه العملية');
        return;
      }
      if (status === 'pending_counselor' && applyViolation && !evidenceFile) {
        alert('يجب رفع شاهد/دليل الإجراء (ملف توثيقي) قبل إتمام هذه العملية');
        return;
      }
    }
    
    setSubmitting(true);
    try {
      const response = await apiFetch(`/api/referrals/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          action,
          notes: finalNotes,
          status,
          evidence_file: evidenceFile || (user?.role === 'teacher' ? editForm.remedial_plan_file : null),
          evidence_text: user?.role === 'teacher' ? editForm.remedial_plan : null,
          violation_id: applyViolation ? (selectedViolationId || null) : null,
          applied_remedial_actions: applyViolation ? appliedActions : []
        }),
      });

      if (response.ok) {
        logAction(
          'التحويلات',
          'UPDATE',
          'تفاصيل التحويل',
          `قام بتحديث حالة التحويل للطالب ${data?.referral.student_name} بإجراء: ${action}`
        );
        // Refresh data
        const refreshRes = await apiFetch(`/api/referrals/${id}`);
        if (refreshRes.ok) {
          const d = await refreshRes.json().catch(() => null);
          if (d) {
            setData(d);
            setActionNotes('');
            setMeetingDate('');
            setMeetingTime('');
            setEvidenceFile(null);
            setShowMeetingInputs(false);
            
            // Show Smart Print Hub if Vice Principal and case is being forwarded or resolved
            if (user?.role === 'vice_principal' && (status === 'pending_counselor' || status === 'resolved')) {
              const selectedV = violations.find(v => v.id.toString() === selectedViolationId);
              const templates = getRecommendedTemplates(appliedActions);
              if (templates.length > 0) {
                setRecommendedTemplates(templates);
                setShowPrintHub(true);
              }
            }
          }
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

  const filteredViolations = violations.filter(v => 
    v.violation_name.toLowerCase().includes(violationSearch.toLowerCase()) ||
    v.degree.toString() === violationSearch
  );

  if (loading || !data) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-slate-400 font-extrabold uppercase tracking-widest text-xs">جاري تحميل تفاصيل التحويل...</p>
    </div>
  );

  const { referral, logs, studentReferralsCount, principalName } = data;
  const isFirstReferral = studentReferralsCount === 1;

  const vpName = logs.find(l => l.user_role === 'vice_principal')?.user_name || '........................';
  const counselorName = logs.find(l => l.user_role === 'counselor')?.user_name || '........................';
  const isCreatedByVP = logs.length > 0 && logs[logs.length - 1].user_role === 'vice_principal';

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12">
      {/* Official Print Report (Visible only on print) */}
      <div className="print-report font-sans">
        {/* Print Header - Text Only */}
        <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
          <div className="text-right space-y-1">
            <p className="text-sm font-black">المملكة العربية السعودية</p>
            <p className="text-sm font-black">وزارة التعليم</p>
            <p className="text-sm font-black">{settings.generalDirectorateName || 'الإدارة العامة للتعليم بمنطقة الرياض'}</p>
            <p className="text-sm font-black">{settings.schoolName ? `مدرسة ${settings.schoolName}` : 'ثانوية أم القرى'}</p>
          </div>
          <div className="text-left space-y-1">
            <h1 className="text-xl font-black mb-1">تقرير حالة طالب تفصيلي</h1>
            <p className="text-xs font-bold text-slate-700">رقم الحالة: #{referral.id}</p>
            <p className="text-xs font-bold text-slate-700">تاريخ الطباعة: {formatHijriDate(new Date())}</p>
          </div>
        </div>

        {/* Section 1: Student Data */}
        <div className="print-section">
          <div className="print-section-header">بيانات الطالب الأساسية</div>
          <div className="print-grid">
            <div className="print-cell"><span className="print-label">اسم الطالب:</span> {referral.student_name}</div>
            <div className="print-cell"><span className="print-label">رقم الهوية:</span> {referral.student_national_id || 'غير مسجل'}</div>
            <div className="print-cell"><span className="print-label">رقم الحالة:</span> #{referral.id}</div>
            <div className="print-cell"><span className="print-label">الصف الدراسي:</span> {referral.student_grade}</div>
            <div className="print-cell"><span className="print-label">الفصل:</span> {referral.student_section}</div>
            <div className="print-cell"><span className="print-label">تاريخ التحويل:</span> {formatHijriDate(referral.created_at)}</div>
          </div>
        </div>

        {/* Section 2: Teacher Statement */}
        {!isCreatedByVP && (
          <div className="print-section">
            <div className="print-section-header">اجراءات المعلم</div>
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
        )}

        {/* NEW Section: Resolution & Violations (if resolved or closed) */}
        {['resolved', 'closed', 'pending_counselor', 'scheduled_meeting'].includes(referral.status) && (
          <div className="print-section">
            <div className="print-section-header">القرار الإداري وإجراءات الوكيل</div>
            {referral.violation_name && (
              <div className="print-grid">
                <div className="print-cell"><span className="print-label">التصنيف النهائي للمخالفة:</span> {referral.violation_name}</div>
                <div className="print-cell"><span className="print-label">الدرجة:</span> {referral.violation_degree}</div>
                <div className="print-cell"><span className="print-label">النقاط المخصومة:</span> {referral.violation_points} نقطة</div>
              </div>
            )}
            {referral.applied_remedial_actions && referral.applied_remedial_actions.length > 0 && (
              <div className="print-full-cell border-t border-slate-200">
                <p className="font-bold mb-1">الإجراءات المُنفذة:</p>
                <ul className="list-disc list-inside text-xs pr-2">
                  {referral.applied_remedial_actions.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Section 4: Counselor Intervention */}
        <div className="print-section">
          <div className="print-section-header">اجراءات الموجه الطلابي</div>
          {logs.filter(l => l.user_role === 'counselor').length > 0 ? (
            logs.filter(l => l.user_role === 'counselor').map((log, idx) => (
              <div key={idx} className="border-b border-slate-200 last:border-0 p-3">
                <div className="flex justify-between mb-1 text-[10px] font-bold text-slate-500">
                  <span>الإجراء: {log.action}</span>
                  <span>التاريخ: {formatHijriDateTime(log.created_at)}</span>
                </div>
                <p className="text-xs leading-relaxed">{log.notes}</p>
              </div>
            ))
          ) : (
            <div className="p-3 text-xs text-slate-400 italic">لا توجد تدخلات مسجلة للموجه بعد.</div>
          )}
        </div>

        {/* Print Signatures - Dynamic */}
        <div className={`mt-16 print-grid ${isCreatedByVP ? 'grid-cols-3' : 'grid-cols-4'} gap-8 text-center page-break-inside-avoid`}>
          {!isCreatedByVP && (
            <div className="space-y-8">
              <p className="print-label">المعلم</p>
              <div className="h-px bg-black w-3/4 mx-auto"></div>
              <p className="text-sm font-bold">التوقيع: .................</p>
            </div>
          )}
          <div className="space-y-8">
            <p className="print-label">وكيل شؤون الطلاب</p>
            <div className="h-px bg-black w-3/4 mx-auto"></div>
            <p className="text-sm font-bold">التوقيع: .................</p>
          </div>
          <div className="space-y-8">
            <p className="print-label">الموجه الطلابي</p>
            <div className="h-px bg-black w-3/4 mx-auto"></div>
            <p className="text-sm font-bold">التوقيع: .................</p>
          </div>
          <div className="space-y-8">
            <p className="print-label">مدير المدرسة</p>
            <p className="text-sm font-bold">{settings.principalName || '....................'}</p>
            <div className="h-px bg-black w-3/4 mx-auto"></div>
            <p className="text-sm font-bold">التوقيع: .................</p>
          </div>
        </div>

        <div className="mt-8 text-center text-[8px] text-slate-400 border-t pt-2">
          بوابة تكامل - {settings.schoolName || 'ثانوية أم القرى'}
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
              <span className="flex items-center gap-1.5"><Clock size={14} /> {formatHijriDateTime(referral.created_at)}</span>
              {!isCreatedByVP && (
                <>
                  <span className="hidden md:block w-1 h-1 bg-slate-300 rounded-full" />
                  <span className="flex items-center gap-1.5"><User size={14} /> {referral.teacher_name}</span>
                </>
              )}
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

          {user?.role === 'admin' && (
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="px-4 md:px-5 py-3 rounded-2xl text-[10px] md:text-xs font-extrabold border flex items-center gap-2 transition-all shadow-sm bg-red-50 text-red-700 border-red-100 hover:bg-red-100"
            >
              <Trash2 size={18} />
              حذف التحويل
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
                  onClick={() => navigate(`/dashboard/student/${referral.student_id}`)}
                  className="flex items-center justify-center gap-2 text-primary font-black text-xs md:text-sm bg-primary/5 px-4 md:px-6 py-3 rounded-2xl border border-primary/10 hover:bg-primary/10 transition-all w-full md:w-auto"
                >
                  <User size={16} />
                  <span>عرض ملف الطالب</span>
                  <ExternalLink size={12} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {referral.violation_name && (
                <div className="md:col-span-2 bg-primary/5 border border-primary/10 p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-primary text-[10px] font-extrabold uppercase tracking-widest">
                      <ShieldAlert size={16} />
                      <span>المخالفة المسجلة (حسب اللائحة)</span>
                    </div>
                    <span className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full">الدرجة {referral.violation_degree}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{referral.violation_name}</h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span>نقاط الخصم:</span>
                    <span className="text-rose-600 font-black">-{referral.violation_points} نقطة</span>
                  </div>
                  


                  {/* System Recommendation for VP */}
                  {user?.role === 'vice_principal' && referral.status === 'pending_vp' && (
                    <div className="mt-6 bg-slate-900 text-white p-6 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-primary text-[10px] font-black uppercase tracking-widest">
                            <ShieldAlert size={16} />
                            <span>توصية النظام الآلية للوكيل</span>
                          </div>
                          <span className="bg-white/10 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                            {fetchingOccurrence ? 'جاري الفحص...' : `التكرار رقم: ${violationOccurrence + 1}`}
                          </span>
                        </div>
                        
                        {violations.find(v => v.id.toString() === selectedViolationId)?.procedures.steps && (
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-xs font-bold leading-relaxed text-slate-300">
                              بناءً على لائحة السلوك والمواظبة، وبما أن هذا هو التكرار رقم ({violationOccurrence + 1}) لهذه المخالفة، فإن الإجراء النظامي المطلوب هو:
                            </p>
                            <p className="mt-3 text-sm font-black text-primary leading-relaxed">
                              {violations.find(v => v.id.toString() === selectedViolationId)?.procedures.steps[Math.min(violationOccurrence, (violations.find(v => v.id.toString() === selectedViolationId)?.procedures.steps.length || 1) - 1)]}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 italic">
                          <Info size={12} />
                          <span>يرجى التأكد من تطبيق هذا الإجراء وتوثيقه في خانة الإجراءات أدناه.</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                  <span>{isCreatedByVP ? 'الملاحظات' : 'ملاحظات المعلم'}</span>
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
                        {referral.remedial_plan_file.startsWith('data:image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                        <span>عرض</span>
                        <ExternalLink size={12} />
                      </a>
                      <a 
                        href={referral.remedial_plan_file} 
                        download={`plan_${referral.id}.${getFileExtension(referral.remedial_plan_file)}`}
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

          {/* Resolution Card */}
          {['resolved', 'closed', 'pending_counselor', 'scheduled_meeting'].includes(referral.status) && (
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-slate-700" />
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                <ShieldAlert size={24} className="text-slate-700" />
                <span>️ القرار الإداري وإجراءات الوكيل</span>
              </h3>
              
              <div className="space-y-6">
                {referral.violation_name && (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">التصنيف النهائي للمخالفة</p>
                      <p className="text-base font-black text-slate-800">{referral.violation_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-slate-200 text-slate-700 text-xs font-black px-3 py-1.5 rounded-xl">الدرجة {referral.violation_degree}</span>
                      <span className="bg-rose-50 text-rose-600 text-xs font-black px-3 py-1.5 rounded-xl border border-rose-100">-{referral.violation_points} نقطة</span>
                    </div>
                  </div>
                )}

                {referral.applied_remedial_actions && referral.applied_remedial_actions.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-3">الإجراءات المُنفذة:</p>
                    <ul className="space-y-3">
                      {referral.applied_remedial_actions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm font-bold text-slate-700">
                          <div className="mt-0.5 text-emerald-500 bg-emerald-50 rounded-full p-0.5">
                            <CheckCircle2 size={14} strokeWidth={3} />
                          </div>
                          <span className="leading-relaxed">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                    {(referral.status === 'resolved' || referral.status === 'closed') ? 'تم اعتماد الإجراء وإغلاق المعاملة بواسطة:' : 'تم اتخاذ الإجراء بواسطة:'} <span className="text-slate-600">{logs.find(l => l.user_role === 'vice_principal')?.user_name || 'الوكيل'}</span> - في تاريخ: {logs.find(l => l.user_role === 'vice_principal')?.created_at ? formatHijriDateTime(logs.find(l => l.user_role === 'vice_principal')!.created_at) : 'غير متوفر'}
                  </p>
                </div>
              </div>
            </div>
          )}

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
                          {formatHijriDateTime(log.created_at)}
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
                                    download={`evidence-${log.id}.${getFileExtension(log.evidence_file)}`}
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
                      <div className="flex flex-col gap-1">
                        <HijriDatePicker
                          value={meetingDate}
                          onChange={setMeetingDate}
                          className="sts-input w-full"
                        />
                        <span className="text-[10px] font-bold text-primary px-2">{formatHijriDate(meetingDate)}</span>
                      </div>
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
                    {user?.role === 'vice_principal' && !referral.violation_id && (
                      <div className="mb-6">
                        {!applyViolation ? (
                          <button
                            type="button"
                            onClick={() => {
                              setTempSelectedViolationId(selectedViolationId);
                              setTempAppliedActions(appliedActions);
                              setIsViolationModalOpen(true);
                            }}
                            className="w-full py-4 px-6 border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm"
                          >
                            <ShieldAlert size={20} className="text-slate-500" />
                            <span>️ تطبيق إجراء من لائحة السلوك</span>
                          </button>
                        ) : (
                          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
                            <button
                              type="button"
                              onClick={() => {
                                setTempSelectedViolationId(selectedViolationId);
                                setTempAppliedActions(appliedActions);
                                setIsViolationModalOpen(true);
                              }}
                              className="absolute top-4 left-4 text-slate-500 hover:text-slate-700 flex items-center gap-1.5 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                            >
                              <Edit2 size={14} />
                              <span>تعديل الإجراء</span>
                            </button>
                            
                            <div className="flex items-center gap-3 mb-4">
                              <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${getDegreeColor(violations.find(v => v.id === parseInt(selectedViolationId))?.degree || 1)}`}>
                                الدرجة {violations.find(v => v.id === parseInt(selectedViolationId))?.degree}
                              </div>
                              <h4 className="font-bold text-slate-800 text-sm">
                                {violations.find(v => v.id === parseInt(selectedViolationId))?.violation_name}
                              </h4>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-slate-500 mb-3">الإجراءات المحددة:</p>
                              <ul className="space-y-2">
                                {appliedActions.map((action, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></div>
                                    <span className="leading-relaxed">{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}


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
                          {user?.role === 'vice_principal' ? (applyViolation ? 'شاهد/دليل الإجراء (إلزامي)' : 'شاهد/دليل الإجراء (إلزامي للإغلاق)') : 'إرفاق مستند/مرفق إضافي (اختياري)'}
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
                          <button
                            onClick={() => handleAction('تحويل للموجه الطلابي', 'pending_counselor')}
                            disabled={submitting}
                            className={`w-full py-4 text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg ${
                              !applyViolation 
                                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' 
                                : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'
                            }`}
                          >
                            <ArrowRightLeft size={20} />
                            <span> إحالة للموجه الطلابي</span>
                          </button>

                          <button
                            onClick={() => handleAction('معالجة وإغلاق', 'resolved')}
                            disabled={submitting}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20"
                          >
                            <CheckCircle2 size={20} />
                            <span> حفظ ومعالجة وإغلاق</span>
                          </button>

                          <button
                            onClick={() => handleAction('ارجاع التحويل للمعلم لاستكمال نواقص', 'returned_to_teacher')}
                            disabled={submitting}
                            className="w-full py-4 bg-orange-100 hover:bg-orange-200 text-orange-700 font-extrabold rounded-2xl transition-all flex items-center justify-center gap-3"
                          >
                            <RotateCcw size={20} />
                            <span>↩️ إرجاع للمعلم للقصور</span>
                          </button>
                        </div>
                      </div>
                    )}
                    {user?.role === 'counselor' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 mb-6">
                          <button
                            onClick={() => navigate(`/print/12/${id}`)}
                            className="w-full py-3 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2 border border-blue-200"
                          >
                            <FileText size={18} />
                            <span>إنشاء خطة تعديل سلوك</span>
                          </button>
                          <button
                            onClick={() => navigate(`/print/11/${id}`)}
                            className="w-full py-3 bg-amber-50 text-amber-700 font-bold rounded-xl hover:bg-amber-100 transition-all flex items-center justify-center gap-2 border border-amber-200"
                          >
                            <Users size={18} />
                            <span>طلب انعقاد لجنة التوجيه</span>
                          </button>
                          <button
                            onClick={() => setShowBonusModal(true)}
                            className="w-full py-3 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 border border-emerald-200"
                          >
                            <ArrowUpRight size={18} />
                            <span>منح فرص تعويض درجات</span>
                          </button>
                        </div>

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
                      </div>
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

          {/* Smart Print Hub Section (Real-time) */}
          {(user?.role === 'vice_principal' || user?.role === 'counselor') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <Printer size={24} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xl text-slate-800">مركز الطباعة الذكي</h3>
                    <p className="text-sm text-slate-500 font-bold mt-1">النماذج الرسمية المقترحة بناءً على الإجراءات المحددة</p>
                  </div>
                </div>
              </div>

              {(() => {
                const currentActions = appliedActions.length > 0 ? appliedActions : (referral.applied_remedial_actions || []);
                const templates = getRecommendedTemplates(currentActions);

                if (templates.length === 0) {
                  return (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                      <FileText size={32} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500 font-bold">لم يتم تحديد إجراءات تتطلب نماذج رسمية حتى الآن.</p>
                      <button
                        onClick={() => setShowPrintHub(true)}
                        className="mt-4 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                      >
                        عرض جميع النماذج
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          navigate(`/print/${template.id}/${id}`);
                        }}
                        className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all flex items-center gap-4 text-right"
                      >
                        <div className="w-12 h-12 bg-slate-50 group-hover:bg-primary/5 text-slate-400 group-hover:text-primary rounded-xl flex items-center justify-center transition-colors shrink-0">
                          <Printer size={24} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-extrabold text-slate-700 group-hover:text-primary transition-colors">{template.name}</h4>
                          <p className="text-xs text-slate-400 font-bold mt-1">نموذج رقم {template.id}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
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
      
      {/* Smart Print Hub Modal */}
      <AnimatePresence>
        {showPrintHub && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrintHub(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-br from-emerald-50 to-white">
                <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                      <CheckCircle2 size={28} className="sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-800">تم حفظ الحالة بنجاح</h2>
                      <p className="text-sm sm:text-base text-emerald-600 font-bold mt-1">النماذج الرسمية المقترحة للطباعة</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPrintHub(false)}
                    className="w-10 h-10 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full flex items-center justify-center transition-colors shadow-sm border border-slate-100 shrink-0"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-sm sm:text-base text-slate-500 font-bold leading-relaxed">
                  بناءً على الإجراءات التي قمت بتحديدها، يقترح النظام طباعة النماذج التالية لاستكمال التوثيق الرسمي للحالة.
                </p>
              </div>

              <div className="p-6 md:p-8 bg-slate-50/50 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {recommendedTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        navigate(`/print/${template.id}/${id}`);
                      }}
                      className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all flex items-center gap-3 sm:gap-4 text-right"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 group-hover:bg-primary/5 text-slate-400 group-hover:text-primary rounded-xl flex items-center justify-center transition-colors shrink-0">
                        <Printer size={20} className="sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-700 group-hover:text-primary transition-colors">{template.name}</h4>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-bold mt-1">نموذج رقم {template.id}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-slate-100 bg-white flex justify-center">
                <button
                  onClick={() => {
                    // Navigate to all templates or show a dropdown
                    setShowPrintHub(false);
                    // For now, just close. In a real app, might open a full list.
                  }}
                  className="w-full sm:w-auto py-3 px-6 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:text-primary transition-colors flex items-center justify-center gap-2"
                >
                  <FileText size={16} />
                  <span>عرض جميع النماذج الأخرى</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Bonus Points Modal */}
      <AnimatePresence>
        {showBonusModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBonusModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <ArrowUpRight size={20} />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-800">منح فرص تعويض درجات</h3>
                </div>
                <button
                  onClick={() => setShowBonusModal(false)}
                  className="w-8 h-8 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full flex items-center justify-center transition-colors shadow-sm"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">عدد الدرجات للتعويض</label>
                  <input
                    type="number"
                    min="1"
                    value={bonusPoints}
                    onChange={(e) => setBonusPoints(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="مثال: 3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">سبب التعويض (السلوك الإيجابي)</label>
                  <textarea
                    value={bonusReason}
                    onChange={(e) => setBonusReason(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-h-[100px] resize-none"
                    placeholder="اكتب السلوك الإيجابي الذي قام به الطالب..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleBonusPoints}
                  disabled={submittingBonus}
                  className="w-full sm:flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  {submittingBonus ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>حفظ وتوليد النموذج</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowBonusModal(false)}
                  className="w-full sm:w-auto px-6 py-3 bg-white text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all border border-slate-200"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Violation Selection Modal */}
        {isViolationModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsViolationModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <ShieldAlert size={20} />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-800">اختيار المخالفة والإجراءات النظامية</h3>
                </div>
                <button
                  onClick={() => setIsViolationModalOpen(false)}
                  className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full flex items-center justify-center transition-colors shadow-sm"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">تصنيف المخالفة</label>
                  <select
                    value={tempSelectedViolationId}
                    onChange={(e) => {
                      setTempSelectedViolationId(e.target.value);
                      setTempAppliedActions([]);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-slate-700"
                  >
                    <option value="">-- اختر التصنيف الرسمي للمخالفة --</option>
                    {filteredViolations.map(v => (
                      <option key={v.id} value={v.id}>الدرجة {v.degree}: {v.violation_name} (-{v.deduction_points} نقاط)</option>
                    ))}
                  </select>
                </div>

                {tempSelectedViolationId && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                    {/* Administrative Procedures */}
                    <div className="space-y-3">
                      <h4 className="font-black text-sm text-slate-800 flex items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        الإجراءات النظامية (حسب الدرجة {violations.find(v => v.id === parseInt(tempSelectedViolationId))?.degree})
                      </h4>
                      <div className="grid gap-3">
                        {violations.find(v => v.id === parseInt(tempSelectedViolationId))?.procedures.steps.map((proc, i) => {
                          const isRecommended = i === Math.min(violationOccurrence, (violations.find(v => v.id === parseInt(tempSelectedViolationId))?.procedures.steps.length || 1) - 1);
                          return (
                            <label key={i} className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${tempAppliedActions.includes(proc) ? 'bg-primary/5 border-primary' : 'bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-slate-100/50'}`}>
                              {isRecommended && (
                                <div className="absolute top-0 left-0 bg-primary text-white text-[8px] font-black px-3 py-1 rounded-br-xl uppercase tracking-widest shadow-sm">
                                  موصى به
                                </div>
                              )}
                              <div className="pt-1">
                                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${tempAppliedActions.includes(proc) ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-white group-hover:border-primary/50'}`}>
                                  {tempAppliedActions.includes(proc) && <CheckCircle2 size={14} strokeWidth={3} />}
                                </div>
                                <input
                                  type="checkbox"
                                  checked={tempAppliedActions.includes(proc)}
                                  onChange={() => {
                                    const current = [...tempAppliedActions];
                                    const idx = current.indexOf(proc);
                                    if (idx > -1) current.splice(idx, 1);
                                    else current.push(proc);
                                    setTempAppliedActions(current);
                                  }}
                                  className="sr-only"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-black ${tempAppliedActions.includes(proc) ? 'text-primary' : 'text-slate-400'}`}>
                                    إجراء {i + 1}
                                  </span>
                                  {isRecommended && (
                                    <span className="text-[10px] text-primary/80 font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                                      يتناسب مع التكرار رقم {violationOccurrence + 1}
                                    </span>
                                  )}
                                </div>
                                <span className={`text-sm leading-relaxed font-bold block ${tempAppliedActions.includes(proc) ? 'text-slate-800' : 'text-slate-600'}`}>
                                  {proc}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* General Procedures */}
                    <div className="space-y-3">
                      <h4 className="font-black text-sm text-slate-800 flex items-center gap-2">
                        <ShieldAlert size={16} className="text-slate-500" />
                        إجراءات عامة مساندة
                      </h4>
                      <div className="grid gap-3">
                        {violations.find(v => v.id === parseInt(tempSelectedViolationId))?.procedures.general
                          .filter(proc => !proc.includes('الهلال الأحمر') && !proc.includes('الجهات الأمنية') && !proc.includes('1919') && !proc.includes('مركز البلاغات'))
                          .map((proc, i) => (
                          <label key={`gen-${i}`} className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${tempAppliedActions.includes(proc) ? 'bg-primary/5 border-primary' : 'bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-slate-100/50'}`}>
                            <div className="pt-1">
                              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${tempAppliedActions.includes(proc) ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-white group-hover:border-primary/50'}`}>
                                {tempAppliedActions.includes(proc) && <CheckCircle2 size={14} strokeWidth={3} />}
                              </div>
                              <input
                                type="checkbox"
                                checked={tempAppliedActions.includes(proc)}
                                onChange={() => {
                                  const current = [...tempAppliedActions];
                                  const idx = current.indexOf(proc);
                                  if (idx > -1) current.splice(idx, 1);
                                  else current.push(proc);
                                  setTempAppliedActions(current);
                                }}
                                className="sr-only"
                              />
                            </div>
                            <div className="flex-1">
                              <span className={`text-sm leading-relaxed font-bold block ${tempAppliedActions.includes(proc) ? 'text-slate-800' : 'text-slate-600'}`}>
                                {proc}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setSelectedViolationId(tempSelectedViolationId);
                    setAppliedActions(tempAppliedActions);
                    if (tempSelectedViolationId) {
                      setApplyViolation(true);
                    } else {
                      setApplyViolation(false);
                    }
                    setIsViolationModalOpen(false);
                  }}
                  className="w-full sm:flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <CheckCircle2 size={18} />
                  <span>اعتماد الإجراءات</span>
                </button>
                <button
                  onClick={() => setIsViolationModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-3 bg-white text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all border border-slate-200"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl relative z-10 text-center space-y-8"
            >
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-red-100">
                <Trash2 size={36} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800">حذف التحويل؟</h3>
                <p className="text-sm text-slate-500 font-bold leading-relaxed">
                  هل أنت متأكد من رغبتك في حذف هذا التحويل نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
                </p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={async () => {
                    try {
                      const res = await apiFetch(`/api/admin/referrals/${id}/delete`, {
                        method: 'POST'
                      });
                      if (res.ok) {
                        navigate('/dashboard');
                      } else {
                        alert('فشل حذف التحويل');
                      }
                    } catch (err) {
                      console.error(err);
                      alert('حدث خطأ أثناء الحذف');
                    }
                  }}
                  className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
                >
                  تأكيد الحذف
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all"
                >
                  إلغاء الأمر
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </div>
);
};

export default ReferralDetails;
