import React, { useState, useEffect } from 'react';
import { useMessageLog } from '../context/MessageLogContext';
import { useAuth } from '../App';
import { Search, RotateCcw, Send, Users, CheckCircle2, XCircle, Clock, MessageSquare, AlertCircle, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageSettings from './MessageSettings';

const MessageCenter: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'compose' | 'archive' | 'settings'>('compose');
  const { globalMessageLog, addLogEntry } = useMessageLog();
  
  // Compose State
  const [targetType, setTargetType] = useState<'all' | 'grade' | 'section' | 'custom'>('all');
  const [grade, setGrade] = useState('all');
  const [section, setSection] = useState('all');
  const [messageText, setMessageText] = useState('');
  const [grades, setGrades] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  
  // Sending State
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0 });
  const [sendResult, setSendResult] = useState<{success: number, failed: number} | null>(null);

  // Archive State
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/attendance/grades')
      .then(res => res.json())
      .then(data => setGrades(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (grade !== 'all') {
      fetch(`/api/attendance/sections/${grade}`)
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
      fetch(`/api/attendance/command-center?date=${new Date().toISOString().split('T')[0]}&grade=${grade}&section=${section}`)
        .then(res => res.json())
        .then(data => setStudents(data))
        .catch(console.error);
    }
  }, [targetType, grade, section]);

  const templates = [
    { label: 'خروج مبكر', text: 'المكرم ولي أمر الطالب {اسم_الطالب}، نود إشعاركم بأنه تم السماح للطالب بالخروج المبكر هذا اليوم.' },
    { label: 'دعوة مجلس آباء', text: 'المكرم ولي أمر الطالب {اسم_الطالب}، يسرنا دعوتكم لحضور مجلس الآباء والمعلمين يوم الخميس القادم.' },
    { label: 'تنبيه تأخر', text: 'المكرم ولي أمر الطالب {اسم_الطالب}، نود إشعاركم بتأخر الطالب عن الطابور الصباحي هذا اليوم.' }
  ];

  const insertTemplate = (text: string) => {
    setMessageText(text);
  };

  const sendWhatsAppMessage = async (phoneNumber: string, text: string) => {
    try {
      const instanceId = localStorage.getItem('ultramsg_instance_id');
      const token = localStorage.getItem('ultramsg_token');

      if (!instanceId || !token) {
        return { success: false, error: 'MISSING_CREDENTIALS' };
      }

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber, 
          message: text,
          instanceId, 
          token 
        })
      });
      
      if (!response.ok) throw new Error('Failed to send');
      return { success: true };
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
        const res = await fetch(`/api/attendance/command-center?date=${new Date().toISOString().split('T')[0]}&grade=${targetType === 'all' ? 'all' : grade}&section=${targetType === 'all' || targetType === 'grade' ? 'all' : section}`);
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
          messageType: '📢 إشعار عام',
          messageText: personalizedMessage,
          status: result.success ? 'success' : 'failed'
        });

        if (result.success) {
          successCount++;
        } else {
          failCount++;
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
      status: result.success ? 'success' : 'failed'
    });
    if (result.success) {
      alert('تم إعادة الإرسال بنجاح');
    } else {
      alert('فشل إعادة الإرسال');
    }
  };

  const filteredLogs = globalMessageLog.filter(log => 
    log.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.messageType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.messageText.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      </div>

      {activeTab === 'compose' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-4">صياغة الرسالة</h2>
              
              <div className="mb-4 flex flex-wrap gap-2">
                {templates.map(t => (
                  <button
                    key={t.label}
                    onClick={() => insertTemplate(t.text)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors"
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="اكتب رسالتك هنا... يمكنك استخدام {اسم_الطالب} لإدراج اسم الطالب تلقائياً"
                className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
              <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                <AlertCircle size={16} />
                سيتم استبدال {'{اسم_الطالب}'} بالاسم الفعلي لكل طالب عند الإرسال
              </p>
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

                <button
                  onClick={handleSendCampaign}
                  disabled={isSending || (targetType === 'custom' && selectedStudents.length === 0)}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Send size={20} />
                  إرسال الرسائل
                </button>
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

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 font-bold text-slate-600">الوقت والتاريخ</th>
                  <th className="p-4 font-bold text-slate-600">النوع</th>
                  <th className="p-4 font-bold text-slate-600">المستلم</th>
                  <th className="p-4 font-bold text-slate-600">نص الرسالة</th>
                  <th className="p-4 font-bold text-slate-600 text-center">الحالة</th>
                  <th className="p-4 font-bold text-slate-600 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-600 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('ar-SA')}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        {log.messageType}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{log.recipient}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">{log.recipientPhone}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 max-w-xs truncate" title={log.messageText}>
                      {log.messageText}
                    </td>
                    <td className="p-4 text-center">
                      {log.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold">
                          <CheckCircle2 size={14} /> ناجح
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-lg text-xs font-bold">
                          <XCircle size={14} /> فشل
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleResend(log)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="إعادة إرسال"
                      >
                        <RotateCcw size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                      لا توجد رسائل مسجلة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'settings' && user?.role === 'admin' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <MessageSettings />
        </motion.div>
      )}
    </div>
  );
};

export default MessageCenter;
