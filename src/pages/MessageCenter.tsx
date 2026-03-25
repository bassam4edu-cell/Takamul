import { apiFetch } from '../utils/api';
import React, { useState, useEffect, useMemo } from 'react';
import { useMessageLog } from '../context/MessageLogContext';
import { useAuth } from '../context/AuthContext';
import { Search, RotateCcw, Send, Users, CheckCircle2, XCircle, Clock, MessageSquare, AlertCircle, Settings, Save, User, Pencil, Trash2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageSettings from './MessageSettings';
import SystemTemplates from './SystemTemplates';
import { formatHijriDate, formatHijriDateTime } from '../utils/dateUtils';

const MessageCenter: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'compose' | 'archive' | 'settings' | 'templates'>('compose');
  const { globalMessageLog, addLogEntry, deleteLogEntry, deleteBatch } = useMessageLog();
  
  // Compose State
  const [targetType, setTargetType] = useState<'all' | 'grade' | 'section' | 'custom'>('all');
  const [targetAudience, setTargetAudience] = useState<'parents' | 'teachers'>('parents');
  const [grade, setGrade] = useState('all');
  const [section, setSection] = useState('all');
  const [messageText, setMessageText] = useState('');
  const [grades, setGrades] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  
  // Teachers Multi-Select State
  const [teachersList] = useState([
    { id: 1, name: 'أحمد محمد' },
    { id: 2, name: 'سالم عبدالله' },
    { id: 3, name: 'خالد سعيد' },
    { id: 4, name: 'عمر فهد' },
    { id: 5, name: 'ياسر علي' },
    { id: 6, name: 'عبدالرحمن صالح' },
  ]);
  const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]);
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  
  // Templates State
  const [savedTemplates, setSavedTemplates] = useState([
    { label: 'خروج مبكر', text: 'المكرم ولي أمر الطالب {اسم_الطالب}، نود إشعاركم بأنه تم السماح للطالب بالخروج المبكر هذا اليوم.' },
    { label: 'دعوة مجلس آباء', text: 'المكرم ولي أمر الطالب {اسم_الطالب}، يسرنا دعوتكم لحضور مجلس الآباء والمعلمين يوم الخميس القادم.' },
    { label: 'تنبيه تأخر', text: 'المكرم ولي أمر الطالب {اسم_الطالب}، نود إشعاركم بتأخر الطالب عن الطابور الصباحي هذا اليوم.' }
  ]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [selectedTemplateLabel, setSelectedTemplateLabel] = useState('');
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [showConfirmUpdateModal, setShowConfirmUpdateModal] = useState(false);
  
  // Sending State
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0 });
  const [sendResult, setSendResult] = useState<{success: number, failed: number} | null>(null);

  // Archive State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/attendance/grades')
      .then(res => res.json())
      .then(data => setGrades(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (grade !== 'all') {
      apiFetch(`/api/attendance/sections/${grade}`)
        .then(res => res.json())
        .then(data => setSections(data))
        .catch(console.error);
    } else {
      setSections([]);
      setSection('all');
    }
  }, [grade]);

  useEffect(() => {
    if (targetType === 'custom') {
      apiFetch(`/api/attendance/command-center?date=${new Date().toISOString().split('T')[0]}&grade=${grade}&section=${section}`)
        .then(res => res.json())
        .then(data => setStudents(data))
        .catch(console.error);
    }
  }, [targetType, grade, section]);

  const insertTemplate = (text: string) => {
    setMessageText(text);
  };

  const insertChip = (chip: string) => {
    setMessageText(prev => prev + (prev.endsWith(' ') ? '' : ' ') + chip + ' ');
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) return;
    setSavedTemplates(prev => [...prev, { label: newTemplateName, text: messageText }]);
    setNewTemplateName('');
    setIsSaveModalOpen(false);
  };

  const confirmUpdateTemplate = () => {
    if (!selectedTemplateLabel || !messageText.trim()) return;
    
    setSavedTemplates(prev => prev.map(t => 
      t.label === selectedTemplateLabel ? { ...t, text: messageText } : t
    ));
    
    setShowConfirmUpdateModal(false);
    setIsEditingTemplate(false);
  };

  const commonChips = ['{اسم_المدرسة}', '{اليوم}', '{التاريخ}'];
  const parentChips = ['{اسم_الطالب}', '{الصف}', '{الغياب}'];
  const teacherChips = ['{اسم_المعلم}', '{المادة}', '{الحصة}'];
  const activeChips = targetAudience === 'parents' ? [...commonChips, ...parentChips] : [...commonChips, ...teacherChips];

  const getPreviewText = () => {
    let text = messageText;
    text = text.replace(/{اسم_المدرسة}/g, 'مدرسة تكامل الأهلية');
    text = text.replace(/{اليوم}/g, 'الأحد');
    text = text.replace(/{التاريخ}/g, '1445/08/15');
    
    if (targetAudience === 'parents') {
      text = text.replace(/{اسم_الطالب}/g, 'خالد عبدالله');
      text = text.replace(/{الصف}/g, 'الأول المتوسط');
      text = text.replace(/{الغياب}/g, 'يومين');
    } else {
      text = text.replace(/{اسم_المعلم}/g, 'أحمد محمد');
      text = text.replace(/{المادة}/g, 'الرياضيات');
      text = text.replace(/{الحصة}/g, 'الثالثة');
    }
    return text;
  };

  const sendWhatsAppMessage = async (phoneNumber: string, text: string) => {
    try {
      const response = await apiFetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber, 
          message: text
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        if (data.code === 'MISSING_WHATSAPP_CREDENTIALS' || data.code === 'FORBIDDEN') {
          return { success: false, error: data.code, message: data.message };
        }
        throw new Error('Failed to send');
      }
      return { success: true, idMessage: data.data?.idMessage };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  };

  const handleSendCampaign = async () => {
    if (!messageText.trim()) {
      alert('الرجاء كتابة نص الرسالة');
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      // 1. Fetch target students
      let targetStudents: any[] = [];
      if (targetType === 'custom') {
        targetStudents = students.filter(s => selectedStudents.includes(s.id));
      } else {
        const res = await apiFetch(`/api/attendance/command-center?date=${new Date().toISOString().split('T')[0]}&grade=${targetType === 'all' ? 'all' : grade}&section=${targetType === 'all' || targetType === 'grade' ? 'all' : section}`);
        if (res.ok) {
          targetStudents = await res.json();
        }
      }

      // Filter out students without phone numbers
      const validStudents = targetStudents.filter(s => s.parent_phone && s.parent_phone.trim() !== '');
      
      if (validStudents.length === 0) {
        alert('لم يتم العثور على طلاب بأرقام جوال صحيحة في الفئة المحددة');
        setIsSending(false);
        return;
      }

      const batchId = Math.random().toString(36).substring(2, 9);
      const dateStr = formatHijriDate(new Date());
      const campaignName = selectedTemplateLabel ? `${selectedTemplateLabel} - ${dateStr}` : `حملة رسائل - ${dateStr}`;
      
      let targetAudienceStr = '';
      if (targetAudience === 'parents') {
        targetAudienceStr = 'أولياء أمور';
        if (targetType === 'all') targetAudienceStr += ' - جميع الطلاب';
        else if (targetType === 'grade') targetAudienceStr += ` - ${grade}`;
        else if (targetType === 'section') targetAudienceStr += ` - ${grade} - ${section}`;
        else if (targetType === 'custom') targetAudienceStr += ' - تخصيص';
      } else {
        targetAudienceStr = 'المعلمون';
      }

      setProgress({ sent: 0, total: validStudents.length });
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < validStudents.length; i++) {
        const student = validStudents[i];
        const personalizedMessage = messageText.replace(/{اسم_الطالب}/g, student.name);
        
        const result = await sendWhatsAppMessage(student.parent_phone, personalizedMessage);
        
        addLogEntry({
          recipient: student.name,
          recipientPhone: student.parent_phone,
          messageType: 'إشعار عام',
          messageText: personalizedMessage,
          status: result.success ? 'success' : 'failed',
          batchId,
          campaignName,
          targetAudience: targetAudienceStr,
          messageId: result.idMessage
        });

        if (result.success) {
          successCount++;
        } else {
          failCount++;
          if (result.error === 'MISSING_CREDENTIALS' || result.error === 'MISSING_WHATSAPP_CREDENTIALS' || result.error === 'FORBIDDEN') {
            alert(result.message || 'بيانات الربط مفقودة أو غير صحيحة. يرجى إعداد خدمة الواتساب من شاشة إعدادات الرسائل.');
            break;
          }
        }

        setProgress({ sent: i + 1, total: validStudents.length });
        
        // Delay 2000ms between messages to prevent ban
        if (i < validStudents.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      setSendResult({ success: successCount, failed: failCount });
      setMessageText('');
      setSelectedStudents([]);
    } catch (error) {
      console.error('Campaign error:', error);
      alert('حدث خطأ أثناء إرسال الحملة');
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = async (log: any) => {
    const result = await sendWhatsAppMessage(log.recipientPhone, log.messageText);
    addLogEntry({
      recipient: log.recipient,
      recipientPhone: log.recipientPhone,
      messageType: log.messageType,
      messageText: log.messageText,
      status: result.success ? 'success' : 'failed',
      batchId: log.batchId,
      campaignName: log.campaignName,
      targetAudience: log.targetAudience,
      messageId: result.idMessage
    });
    if (result.success) {
      alert('تم إعادة الإرسال بنجاح');
    } else {
      if (result.error === 'MISSING_CREDENTIALS' || result.error === 'MISSING_WHATSAPP_CREDENTIALS' || result.error === 'FORBIDDEN') {
        alert(result.message || 'بيانات الربط مفقودة أو غير صحيحة. يرجى إعداد خدمة الواتساب من شاشة إعدادات الرسائل.');
      } else {
        alert('فشل إعادة الإرسال');
      }
    }
  };

  const filteredLogs = globalMessageLog.filter(log => 
    log.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.messageType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.messageText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedLogs = useMemo(() => {
    const groups: Record<string, any> = {};
    filteredLogs.forEach(log => {
      const bId = log.batchId || log.id;
      if (!groups[bId]) {
        groups[bId] = {
          batchId: bId,
          campaignName: log.campaignName || 'رسالة فردية / قديمة',
          targetAudience: log.targetAudience || 'غير محدد',
          timestamp: log.timestamp,
          total: 0,
          success: 0,
          failed: 0,
          logs: []
        };
      }
      groups[bId].total++;
      if (log.status === 'success') groups[bId].success++;
      else groups[bId].failed++;
      groups[bId].logs.push(log);
    });
    return Object.values(groups).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [filteredLogs]);

  const handleDeleteMessage = async (log: any) => {
    if (confirm('هل أنت متأكد من حذف هذه الرسالة من جهاز المستلم؟')) {
      if (log.messageId) {
        try {
          await apiFetch('/api/whatsapp/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: log.recipientPhone, idMessage: log.messageId })
          });
        } catch (e) {
          console.error('Failed to delete message from WhatsApp', e);
        }
      }
      deleteLogEntry(log.id);
    }
  };

  const handleDeleteBatch = async (batch: any) => {
    if (confirm('هل أنت متأكد من حذف جميع رسائل هذه الحملة من أجهزة المستلمين؟')) {
      for (const log of batch.logs) {
        if (log.messageId) {
          try {
            await apiFetch('/api/whatsapp/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phoneNumber: log.recipientPhone, idMessage: log.messageId })
            });
          } catch (e) {
            console.error('Failed to delete message from WhatsApp', e);
          }
        }
      }
      deleteBatch(batch.batchId);
      if (selectedBatchId === batch.batchId) {
        setSelectedBatchId(null);
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            مركز الرسائل
          </h1>
          <p className="text-slate-500 mt-2 font-medium">إدارة وإرسال الرسائل المخصصة وأرشيف المراسلات</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('compose')}
          className={`pb-4 px-4 font-bold text-lg transition-colors relative ${
            activeTab === 'compose' ? 'text-primary' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          رسالة جديدة
          {activeTab === 'compose' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          className={`pb-4 px-4 font-bold text-lg transition-colors relative ${
            activeTab === 'archive' ? 'text-primary' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          أرشيف الرسائل
          {activeTab === 'archive' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
          )}
        </button>
        {user?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-4 px-4 font-bold text-lg transition-colors relative ${
              activeTab === 'settings' ? 'text-primary' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            إعدادات الرسائل
            {activeTab === 'settings' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
            )}
          </button>
        )}
        {(user?.role === 'admin' || user?.role === 'principal') && (
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-4 px-4 font-bold text-lg transition-colors relative ${
              activeTab === 'templates' ? 'text-primary' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            قوالب النظام
            {activeTab === 'templates' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
            )}
          </button>
        )}
      </div>

      {activeTab === 'compose' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-4">صياغة الرسالة</h2>
              
              <div className="mb-4 flex gap-2">
                <select 
                  value={selectedTemplateLabel}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedTemplateLabel(val);
                    setIsEditingTemplate(false);
                    const template = savedTemplates.find(t => t.label === val);
                    if (template) insertTemplate(template.text);
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="">اختر قالباً محفوظاً...</option>
                  {savedTemplates.map(t => (
                    <option key={t.label} value={t.label}>{t.label}</option>
                  ))}
                </select>
                {selectedTemplateLabel && !isEditingTemplate && (
                  <button
                    onClick={() => setIsEditingTemplate(true)}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors flex items-center gap-2"
                    title="تعديل القالب"
                  >
                    <Pencil size={18} />
                  </button>
                )}
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {activeChips.map(chip => (
                  <button
                    key={chip}
                    onClick={() => insertChip(chip)}
                    className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-bold transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <AlertCircle size={16} />
                  سيتم استبدال المتغيرات بالبيانات الفعلية عند الإرسال
                </p>
                <div className="flex items-center gap-4">
                  {isEditingTemplate ? (
                    <>
                      <button
                        onClick={() => setIsEditingTemplate(false)}
                        className="text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
                      >
                        <XCircle size={16} />
                        إلغاء التعديل
                      </button>
                      <button
                        onClick={() => setShowConfirmUpdateModal(true)}
                        className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
                      >
                        <Save size={16} />
                        حفظ
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsSaveModalOpen(true)}
                      className="text-sm font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
                    >
                      <Save size={16} />
                      حفظ كقالب جديد
                    </button>
                  )}
                </div>
              </div>
            </div>

            {isSending && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary/20">
                <h3 className="font-bold text-slate-800 mb-2">جاري الإرسال...</h3>
                <div className="w-full bg-slate-100 rounded-full h-4 mb-2 overflow-hidden">
                  <div 
                    className="bg-primary h-4 rounded-full transition-all duration-500"
                    style={{ width: `${(progress.sent / progress.total) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-slate-600 font-medium text-center">
                  تم إرسال {progress.sent} من {progress.total} رسالة
                </p>
              </div>
            )}

            {sendResult && (
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-emerald-800 mb-1">اكتملت حملة الإرسال</h3>
                  <p className="text-sm text-emerald-600">نجاح: {sendResult.success} | فشل: {sendResult.failed}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                تحديد المستهدفين
              </h2>

              <div className="space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setTargetAudience('parents')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                      targetAudience === 'parents' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Users size={16} />
                    أولياء الأمور
                  </button>
                  <button
                    onClick={() => setTargetAudience('teachers')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                      targetAudience === 'teachers' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <User size={16} />
                    المعلمون
                  </button>
                </div>

                {targetAudience === 'parents' ? (
                  <>
                    <select
                      value={targetType}
                      onChange={(e) => setTargetType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold"
                    >
                      <option value="all">جميع الطلاب</option>
                      <option value="grade">حسب الصف</option>
                      <option value="section">حسب الفصل</option>
                      <option value="custom">تحديد مخصص</option>
                    </select>

                    {(targetType === 'grade' || targetType === 'section' || targetType === 'custom') && (
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold"
                      >
                        <option value="all">اختر الصف</option>
                        {grades.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    )}

                    {(targetType === 'section' || targetType === 'custom') && grade !== 'all' && (
                      <select
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold"
                      >
                        <option value="all">اختر الفصل</option>
                        {sections.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}

                    {targetType === 'custom' && grade !== 'all' && section !== 'all' && (
                      <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
                        {students.map(s => (
                          <label key={s.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(s.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudents(prev => [...prev, s.id]);
                                } else {
                                  setSelectedStudents(prev => prev.filter(id => id !== s.id));
                                }
                              }}
                              className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <span className="font-bold text-slate-700">{s.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="relative">
                    <div 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold cursor-pointer flex justify-between items-center"
                      onClick={() => setIsTeacherDropdownOpen(!isTeacherDropdownOpen)}
                    >
                      <span className="text-slate-700">
                        {selectedTeachers.length === 0 
                          ? 'اختر المعلمين...' 
                          : `تم اختيار (${selectedTeachers.length}) معلمين`}
                      </span>
                      <span className="text-slate-400 text-xs">▼</span>
                    </div>

                    {isTeacherDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                        <div className="p-3 border-b border-slate-100">
                          <input 
                            type="text" 
                            placeholder="ابحث عن معلم..." 
                            value={teacherSearchTerm}
                            onChange={(e) => setTeacherSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        
                        <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                          <label className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer border-b border-slate-100 mb-1">
                            <input
                              type="checkbox"
                              checked={
                                teachersList.filter(t => t.name.includes(teacherSearchTerm)).length > 0 &&
                                teachersList.filter(t => t.name.includes(teacherSearchTerm)).every(t => selectedTeachers.includes(t.id))
                              }
                              onChange={(e) => {
                                const filteredIds = teachersList.filter(t => t.name.includes(teacherSearchTerm)).map(t => t.id);
                                if (e.target.checked) {
                                  const newSelected = [...new Set([...selectedTeachers, ...filteredIds])];
                                  setSelectedTeachers(newSelected);
                                } else {
                                  setSelectedTeachers(selectedTeachers.filter(id => !filteredIds.includes(id)));
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <span className="font-bold text-slate-800">تحديد الكل</span>
                          </label>
                          
                          {teachersList.filter(t => t.name.includes(teacherSearchTerm)).map(t => (
                            <label key={t.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedTeachers.includes(t.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTeachers(prev => [...prev, t.id]);
                                  } else {
                                    setSelectedTeachers(prev => prev.filter(id => id !== t.id));
                                  }
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                              />
                              <span className="font-medium text-slate-700">{t.name}</span>
                            </label>
                          ))}
                          
                          {teachersList.filter(t => t.name.includes(teacherSearchTerm)).length === 0 && (
                            <div className="p-4 text-center text-slate-500 text-sm">
                              لا يوجد معلمين مطابقين للبحث
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleSendCampaign}
                  disabled={isSending || (targetAudience === 'parents' && targetType === 'custom' && selectedStudents.length === 0) || (targetAudience === 'teachers' && selectedTeachers.length === 0)}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Send size={20} />
                  إرسال الرسائل
                </button>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
                المعاينة الحية
              </h2>
              <div className="bg-[#EFEAE2] rounded-2xl p-4 min-h-[200px] relative overflow-hidden">
                {/* WhatsApp Chat Bubble */}
                <div className="bg-white rounded-2xl rounded-tr-none p-3 shadow-sm max-w-[90%] relative">
                  <p className="text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">
                    {getPreviewText() || 'اكتب رسالتك لمعاينتها هنا...'}
                  </p>
                  <div className="flex justify-end items-center gap-1 mt-1">
                    <span className="text-[10px] text-slate-400">10:00 ص</span>
                    <CheckCircle2 size={12} className="text-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'archive' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-800">سجل الرسائل</h2>
            <div className="relative w-full sm:w-96">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="بحث باسم الطالب أو نوع الرسالة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 font-bold text-slate-600">اسم الحملة / الموضوع</th>
                  <th className="p-4 font-bold text-slate-600">الفئة المستهدفة</th>
                  <th className="p-4 font-bold text-slate-600 text-center">إحصائيات الإرسال</th>
                  <th className="p-4 font-bold text-slate-600">وقت الانطلاق</th>
                  <th className="p-4 font-bold text-slate-600 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupedLogs.map(batch => (
                  <tr key={batch.batchId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">
                      {batch.campaignName}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {batch.targetAudience}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-3 text-sm font-bold">
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg" title="تم الإرسال">
                          {batch.success}
                        </span>
                        <span className="text-red-600 bg-red-50 px-2 py-1 rounded-lg" title="فشل">
                          {batch.failed}
                        </span>
                        <span className="text-slate-600 bg-slate-100 px-2 py-1 rounded-lg" title="الإجمالي">
                          {batch.total}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600 whitespace-nowrap">
                      {formatHijriDateTime(batch.timestamp)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedBatchId(batch.batchId)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteBatch(batch)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف الحملة من أجهزة المستلمين"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {groupedLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                      لا توجد حملات مسجلة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col divide-y divide-slate-100">
            {groupedLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-medium">
                لا توجد حملات مسجلة
              </div>
            ) : (
              groupedLogs.map(batch => (
                <div key={batch.batchId} className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-800 text-base">{batch.campaignName}</div>
                      <div className="text-xs text-slate-500 mt-1">{batch.targetAudience}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">نجاح: {batch.success}</span>
                      <span className="text-red-600 bg-red-50 px-2 py-1 rounded-lg">فشل: {batch.failed}</span>
                    </div>
                    <span className="text-slate-500 font-medium">
                      {formatHijriDateTime(batch.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedBatchId(batch.batchId)}
                      className="flex-1 py-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      التفاصيل
                    </button>
                    <button
                      onClick={() => handleDeleteBatch(batch)}
                      className="flex-1 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      حذف الحملة
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'settings' && user?.role === 'admin' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <MessageSettings />
        </motion.div>
      )}

      {activeTab === 'templates' && (user?.role === 'admin' || user?.role === 'principal') && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <SystemTemplates />
        </motion.div>
      )}

      {/* Save Template Modal */}
      <AnimatePresence>
        {selectedBatchId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    تفاصيل الحملة: {groupedLogs.find(g => g.batchId === selectedBatchId)?.campaignName}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {groupedLogs.find(g => g.batchId === selectedBatchId)?.targetAudience}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleDeleteBatch(groupedLogs.find(g => g.batchId === selectedBatchId))}
                    className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={18} />
                    حذف الكل
                  </button>
                  <button
                    onClick={() => setSelectedBatchId(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <XCircle size={24} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-4 font-bold text-slate-600">اسم المستلم</th>
                        <th className="p-4 font-bold text-slate-600">رقم الجوال</th>
                        <th className="p-4 font-bold text-slate-600 text-center">الحالة</th>
                        <th className="p-4 font-bold text-slate-600 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {groupedLogs.find(g => g.batchId === selectedBatchId)?.logs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-bold text-slate-800">
                            {log.recipient}
                          </td>
                          <td className="p-4 text-sm font-mono text-slate-600">
                            {log.recipientPhone}
                          </td>
                          <td className="p-4 text-center">
                            {log.status === 'success' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold">
                                <CheckCircle2 size={14} /> تم التسليم
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-lg text-xs font-bold">
                                <XCircle size={14} /> فشل
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleDeleteMessage(log)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف الرسالة من جهاز المستلم"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View for Modal */}
                <div className="md:hidden flex flex-col gap-4">
                  {groupedLogs.find(g => g.batchId === selectedBatchId)?.logs.map((log: any) => (
                    <div key={log.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-slate-800">{log.recipient}</div>
                          <div className="text-sm font-mono text-slate-500">{log.recipientPhone}</div>
                        </div>
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold">
                            <CheckCircle2 size={14} /> تم التسليم
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-lg text-xs font-bold">
                            <XCircle size={14} /> فشل
                          </span>
                        )}
                      </div>
                      <div className="flex justify-end mt-3 pt-3 border-t border-slate-200">
                        <button
                          onClick={() => handleDeleteMessage(log)}
                          className="text-sm font-bold text-red-600 flex items-center gap-1"
                        >
                          <Trash2 size={16} />
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Save Template Modal */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">حفظ كقالب جديد</h3>
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">اسم القالب</label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="مثال: دعوة مجلس آباء"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsSaveModalOpen(false)}
                    className="flex-1 px-4 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    disabled={!newTemplateName.trim()}
                    className="flex-1 px-4 py-3 text-white bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl font-bold transition-colors"
                  >
                    حفظ القالب
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Confirm Update Modal */}
        {showConfirmUpdateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">تأكيد التعديل</h3>
                <button
                  onClick={() => setShowConfirmUpdateModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-600 font-medium">
                  هل أنت متأكد من حفظ التعديلات على قالب "{selectedTemplateLabel}"؟
                </p>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowConfirmUpdateModal(false)}
                    className="flex-1 px-4 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={confirmUpdateTemplate}
                    className="flex-1 px-4 py-3 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold transition-colors"
                  >
                    تأكيد الحفظ
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageCenter;
