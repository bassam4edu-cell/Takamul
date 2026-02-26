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
  X
} from 'lucide-react';
import { Referral, ReferralLog } from '../types';
import { useAuth } from '../App';
import { motion } from 'motion/react';

const ReferralDetails: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [data, setData] = useState<{ referral: Referral, logs: ReferralLog[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [showMeetingInputs, setShowMeetingInputs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    type: '',
    severity: '',
    reason: '',
    teacher_notes: '',
    status: ''
  });

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
          status: d.referral.status
        });
        setLoading(false);
      });
  }, [id]);

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

  const handleAction = async (action: string, status: string, customNotes?: string) => {
    const finalNotes = customNotes || actionNotes;
    if (!finalNotes.trim()) {
      alert('يرجى كتابة ملاحظات الإجراء');
      return;
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
          status
        }),
      });

      if (response.ok) {
        // Refresh data
        const d = await (await fetch(`/api/referrals/${id}`)).json();
        setData(d);
        setActionNotes('');
        setMeetingDate('');
        setMeetingTime('');
        setShowMeetingInputs(false);
      }
    } catch (err) {
      console.error(err);
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

  if (loading || !data) return <div className="p-12 text-center">جاري التحميل...</div>;

  const { referral, logs } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 text-slate-400 hover:bg-white hover:text-slate-600 rounded-xl transition-all border border-transparent hover:border-slate-200"
          >
            <ChevronRight size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">تفاصيل التحويل #{referral.id}</h1>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>تم الإنشاء في {new Date(referral.created_at).toLocaleString('ar-SA')}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>بواسطة {referral.teacher_name}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {user?.role === 'admin' && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`no-print px-4 py-2 rounded-2xl text-sm font-bold border flex items-center gap-2 transition-all shadow-sm ${
                isEditing ? 'bg-red-50 text-red-700 border-red-100' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isEditing ? <X size={18} /> : <Edit2 size={18} />}
              {isEditing ? 'إلغاء التعديل' : 'تعديل التحويل'}
            </button>
          )}
          {referral.status === 'pending_vp' && (
            <span className="px-4 py-2 bg-red-50 text-red-700 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-2">
              <ShieldAlert size={18} />
              بانتظار مراجعة الوكيل
            </span>
          )}
          {referral.status === 'pending_counselor' && (
            <span className="px-4 py-2 bg-amber-50 text-amber-700 rounded-2xl text-sm font-bold border border-amber-100 flex items-center gap-2">
              <Clock size={18} />
              قيد المتابعة مع الموجه
            </span>
          )}
          {referral.status === 'scheduled_meeting' && (
            <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-2xl text-sm font-bold border border-blue-100 flex items-center gap-2">
              <Calendar size={18} />
              موعد جلسة مع ولي الأمر
            </span>
          )}
          {referral.status === 'resolved' && (
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => {
                  window.focus();
                  window.print();
                }}
                className="no-print px-4 py-2 bg-white text-slate-700 rounded-2xl text-sm font-bold border border-slate-200 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
              >
                <Printer size={18} />
                طباعة التقرير
              </button>
              <span className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl text-sm font-bold border border-emerald-100 flex items-center gap-2">
                <CheckCircle2 size={18} />
                تمت المعالجة والحل
              </span>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print, aside, header, button, .sticky {
            display: none !important;
          }
          body, main {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .max-w-6xl {
            max-width: 100% !important;
            width: 100% !important;
          }
          .card-shadow {
            box-shadow: none !important;
            border: 1px solid #eee !important;
          }
          .lg\\:grid-cols-3 {
            display: block !important;
          }
          .lg\\:col-span-2 {
            width: 100% !important;
          }
        }
      `}} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] card-shadow border border-slate-100 space-y-8">
            <div className="flex items-center gap-6 pb-8 border-b border-slate-50">
              <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-blue-100">
                {referral.student_name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">{referral.student_name}</h2>
                <div className="flex items-center gap-4 text-slate-500">
                  <span className="flex items-center gap-1">
                    <User size={16} />
                    {referral.student_grade} - الفصل {referral.student_section}
                  </span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className={`font-bold ${
                    referral.severity === 'high' ? 'text-red-600' : 
                    referral.severity === 'medium' ? 'text-amber-600' : 'text-blue-600'
                  }`}>
                    {referral.severity === 'high' ? 'خطورة مرتفعة' : 
                     referral.severity === 'medium' ? 'خطورة متوسطة' : 'خطورة منخفضة'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-wider">
                  <FileText size={16} />
                  <span>سبب التحويل</span>
                </div>
                {isEditing ? (
                  <input 
                    type="text"
                    value={editForm.reason}
                    onChange={(e) => setEditForm({...editForm, reason: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                ) : (
                  <p className="text-slate-800 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {referral.reason}
                  </p>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-wider">
                  <MessageSquare size={16} />
                  <span>ملاحظات المعلم</span>
                </div>
                {isEditing ? (
                  <textarea 
                    rows={3}
                    value={editForm.teacher_notes}
                    onChange={(e) => setEditForm({...editForm, teacher_notes: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                  />
                ) : (
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                    "{referral.teacher_notes || 'لا توجد ملاحظات إضافية'}"
                  </p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 mr-1">نوع التحويل</label>
                  <select 
                    value={editForm.type}
                    onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    <option value="behavior">سلوكي</option>
                    <option value="academic">أكاديمي</option>
                    <option value="attendance">غياب وتأخر</option>
                    <option value="uniform">زي مدرسي</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 mr-1">مستوى الخطورة</label>
                  <select 
                    value={editForm.severity}
                    onChange={(e) => setEditForm({...editForm, severity: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">مرتفعة</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 mr-1">الحالة</label>
                  <select 
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    <option value="pending_vp">بانتظار الوكيل</option>
                    <option value="pending_counselor">بانتظار الموجه</option>
                    <option value="scheduled_meeting">موعد جلسة</option>
                    <option value="resolved">تم الحل</option>
                    <option value="closed">مغلق</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <button 
                    onClick={handleAdminUpdate}
                    disabled={submitting}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    <span>حفظ التعديلات</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] card-shadow border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 text-slate-800 font-bold text-lg">
              <History size={20} className="text-blue-600" />
              <span>سجل الإجراءات</span>
            </div>
            
            <div className="relative space-y-8 pr-4">
              <div className="absolute right-4 top-2 bottom-2 w-0.5 bg-slate-100" />
              
              {logs.length === 0 ? (
                <p className="text-slate-400 text-center py-4">لا توجد إجراءات مسجلة بعد</p>
              ) : (
                logs.map((log, i) => (
                  <div key={log.id} className="relative pr-10">
                    <div className="absolute right-[-5px] top-1.5 w-3 h-3 rounded-full bg-blue-600 border-4 border-white shadow-sm z-10" />
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{log.user_name}</span>
                          <span className="text-xs px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-500">
                            {log.user_role === 'teacher' ? 'معلم' : log.user_role === 'vice_principal' ? 'وكيل' : 'موجه'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString('ar-SA')}</span>
                      </div>
                      <p className="text-blue-700 font-bold text-sm">{log.action}</p>
                      <p className="text-slate-600 text-sm leading-relaxed">{log.notes}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {((user?.role === 'vice_principal' && referral.status === 'pending_vp') || 
            (user?.role === 'counselor' && (referral.status === 'pending_counselor' || referral.status === 'scheduled_meeting'))) && (
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-white p-8 rounded-[2.5rem] card-shadow border border-slate-100 space-y-6 sticky top-8"
            >
              <div className="flex items-center gap-3 text-slate-800 font-bold text-lg">
                <Send size={20} className="text-blue-600" />
                <span>اتخاذ إجراء</span>
              </div>

              {showMeetingInputs ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 mr-1">التاريخ</label>
                      <input 
                        type="date" 
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 mr-1">الوقت</label>
                      <input 
                        type="time" 
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 mr-1">ملاحظات الموعد</label>
                    <textarea 
                      rows={3}
                      placeholder="اكتب تفاصيل الموعد أو سبب الجلسة..."
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleScheduleMeeting}
                      disabled={submitting}
                      className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all text-sm"
                    >
                      تأكيد الموعد
                    </button>
                    <button
                      onClick={() => setShowMeetingInputs(false)}
                      className="px-4 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all text-sm"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-slate-700 mr-1">
                      {referral.status === 'scheduled_meeting' ? 'نتائج اللقاء مع ولي الأمر' : 'ملاحظات الإجراء'}
                    </label>
                    <textarea 
                      rows={4}
                      placeholder={referral.status === 'scheduled_meeting' ? "اكتب ما تم خلال اللقاء والاتفاق مع ولي الأمر..." : "اكتب تفاصيل الإجراء المتخذ أو التوجيهات..."}
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    {user?.role === 'vice_principal' && (
                      <>
                        <button
                          onClick={() => handleAction('تحويل للموجه الطلابي', 'pending_counselor')}
                          disabled={submitting}
                          className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                        >
                          <ArrowRightLeft size={18} />
                          <span>تحويل للموجه</span>
                        </button>
                        <button
                          onClick={() => handleAction('إغلاق الحالة مباشرة', 'resolved')}
                          disabled={submitting}
                          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                        >
                          <CheckCircle2 size={18} />
                          <span>معالجة وإغلاق</span>
                        </button>
                      </>
                    )}
                    {user?.role === 'counselor' && (
                      <>
                        {referral.status === 'pending_counselor' && (
                          <button
                            onClick={() => setShowMeetingInputs(true)}
                            disabled={submitting}
                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                          >
                            <Users size={18} />
                            <span>تحديد جلسة مع ولي الأمر</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(referral.status === 'scheduled_meeting' ? 'إتمام اللقاء والمعالجة' : 'تمت دراسة الحالة ووضع خطة علاجية', 'resolved')}
                          disabled={submitting}
                          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                        >
                          <CheckCircle2 size={18} />
                          <span>{referral.status === 'scheduled_meeting' ? 'إتمام اللقاء وإغلاق الحالة' : 'إتمام المعالجة'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6">
            <h3 className="font-bold text-lg">معلومات تواصل</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <User size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">ولي الأمر</p>
                  <p className="text-sm font-bold">محمد أحمد العلي</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <MessageSquare size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">رقم التواصل</p>
                  <p className="text-sm font-bold">050XXXXXXX</p>
                </div>
              </div>
            </div>
            <button className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl text-sm font-bold transition-all">
              عرض ملف الطالب الكامل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralDetails;
