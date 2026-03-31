import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  Users, 
  FileText, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  History,
  ExternalLink,
  RefreshCw,
  Filter,
  Printer,
  QrCode,
  Calendar
} from 'lucide-react';
import { usePasses, PassStatus, PassType } from '../context/PassContext';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';

// --- Pass Types ---
const PASS_TYPES = [
  { id: 'entry' as PassType, label: 'دخول للفصل', color: 'bg-emerald-500', icon: CheckCircle2, textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  { id: 'call' as PassType, label: 'استدعاء للوكيل', color: 'bg-orange-500', icon: AlertTriangle, textColor: 'text-orange-700', bgColor: 'bg-orange-50' },
  { id: 'exit' as PassType, label: 'خروج من المدرسة', color: 'bg-rose-500', icon: XCircle, textColor: 'text-rose-700', bgColor: 'bg-rose-50' },
];

const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
      <Clock className="text-indigo-600 w-5 h-5" />
      <div className="flex flex-col">
        <span className="text-lg font-bold text-slate-800 tabular-nums">
          {time.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <span className="text-[10px] text-slate-500 font-medium">
          {time.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: PassStatus }) => {
  const configs = {
    pending: { label: 'بانتظار تأكيد المعلم ⏳', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    confirmed: { label: 'تم التأكيد ✅', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    rejected: { label: 'مرفوض ❌', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  };

  const config = configs[status];

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${config.color}`}>
      {config.label}
    </span>
  );
};

const AgentPassDashboard: React.FC = () => {
  const { passes, addPass, updatePassStatus } = usePasses();
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [reason, setReason] = useState('');
  const [passType, setPassType] = useState<PassType>('entry');
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastIssuedPass, setLastIssuedPass] = useState<any>(null);
  
  // Get local date YYYY-MM-DD
  const getLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [isPrintingReport, setIsPrintingReport] = useState(false);

  // Derived data for filters
  const grades = Array.from(new Set(students.map(s => s.grade))).filter(Boolean).sort();
  const sections = Array.from(new Set(students.filter(s => !selectedGrade || s.grade === selectedGrade).map(s => s.section))).filter(Boolean).sort();
  const filteredStudents = students.filter(s => 
    (!selectedGrade || s.grade === selectedGrade) && 
    (!selectedSection || s.section === selectedSection)
  );

  // If pass has no date, it's considered "old" and won't match unless we handle it
  // We'll show passes that match the selected date, OR all passes if selectedDate is empty
  const filteredPasses = passes.filter(p => !selectedDate || p.date === selectedDate);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, teachersRes] = await Promise.all([
          fetch('/api/students'),
          fetch('/api/admin/users')
        ]);
        
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData);
        }
        
        if (teachersRes.ok) {
          const teachersData = await teachersRes.json();
          // Filter only teachers
          setTeachers(teachersData.filter((u: any) => u.role === 'teacher'));
        }
      } catch (error) {
        console.error('Failed to fetch students/teachers:', error);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchData();
  }, []);

  const handleIssuePass = async () => {
    if (!selectedStudent || !selectedTeacher) {
      alert('الرجاء اختيار الطالب والمعلم');
      return;
    }

    const passId = Math.random().toString(36).substring(2, 9).toUpperCase();
    const student = students.find(s => s.id.toString() === selectedStudent);
    const teacher = teachers.find(t => t.id.toString() === selectedTeacher);
    const type = PASS_TYPES.find(p => p.id === passType);
    const confirmUrl = `${window.location.origin}/quick-confirm/${passId}`;

    const newPass = {
      id: passId,
      studentId: selectedStudent,
      studentName: student?.name || '',
      teacherId: selectedTeacher,
      teacherName: teacher?.name || '',
      teacherPhone: teacher?.phone_number || '',
      period: 'غير محدد',
      type: passType,
      reason: reason,
      agentName: 'وكيل المدرسة',
    };

    addPass(newPass);
    setLastIssuedPass({ ...newPass, timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) });
    setShowPrintModal(true);

    const message = `
*إشعار إذن تحرك طالب* 🎫
--------------------------
*الطالب:* ${student?.name}
*الإجراء:* ${type?.label}
*السبب:* ${reason || 'غير محدد'}
--------------------------
*رابط التأكيد السريع:*
${confirmUrl}

الرجاء النقر على الرابط لتأكيد الحالة.
    `;

    // Send via WhatsApp
    if (teacher?.phone_number) {
      let phone = teacher.phone_number.replace(/\D/g, '');
      if (phone.startsWith('05')) {
        phone = '966' + phone.substring(1);
      }
      
      try {
        const response = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: phone,
            message: message.trim()
          })
        });
        
        if (!response.ok) {
          console.warn('WhatsApp API failed, falling back to wa.me link');
          const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message.trim())}`;
          window.open(whatsappUrl, '_blank');
        }
      } catch (err) {
        console.error('Failed to send WhatsApp message:', err);
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message.trim())}`;
        window.open(whatsappUrl, '_blank');
      }
    } else {
      console.warn('No phone number found for teacher:', teacher?.name);
      alert('تم إنشاء الإذن، لكن لا يوجد رقم هاتف مسجل للمعلم لإرسال الإشعار عبر الواتساب.');
    }
    
    // Reset form
    setSelectedStudent('');
    setReason('');
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintPass = (pass: any) => {
    setLastIssuedPass(pass);
    // Give state a moment to update before printing
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrintReport = () => {
    setIsPrintingReport(true);
    setTimeout(() => {
      window.print();
      setIsPrintingReport(false);
    }, 100);
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { visibility: hidden !important; background: white !important; }
          #printable-pass, #printable-report { 
            visibility: visible !important; 
            display: block !important;
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            margin: 0 !important;
            padding: 0 !important;
          }
          #printable-pass *, #printable-report * { visibility: visible !important; }
          .no-print { display: none !important; }
        }
      `}} />

      {/* Printable Report */}
      {isPrintingReport && (
        <div id="printable-report" className="hidden print:block p-8 bg-white">
          <div className="text-center space-y-4 border-b-2 border-slate-900 pb-6 mb-8">
            <h1 className="text-3xl font-black text-slate-900">تقرير أذونات الطلاب</h1>
            <div className="flex justify-center gap-8 text-lg font-bold text-slate-600">
              <p>التاريخ: {selectedDate || 'جميع التواريخ'}</p>
              <p>إجمالي الأذونات: {filteredPasses.length}</p>
            </div>
            <p className="text-sm text-slate-500">ثانوية أم القرى - نظام تكامل</p>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 border-2 border-slate-900">
                <th className="border border-slate-900 p-3 text-right">التاريخ</th>
                <th className="border border-slate-900 p-3 text-right">رقم الإذن</th>
                <th className="border border-slate-900 p-3 text-right">اسم الطالب</th>
                <th className="border border-slate-900 p-3 text-right">نوع الإذن</th>
                <th className="border border-slate-900 p-3 text-right">المعلم</th>
                <th className="border border-slate-900 p-3 text-right">الوقت</th>
                <th className="border border-slate-900 p-3 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filteredPasses.map((pass) => (
                <tr key={pass.id} className="border border-slate-900">
                  <td className="border border-slate-900 p-3 tabular-nums">{pass.date || 'قديم'}</td>
                  <td className="border border-slate-900 p-3 tabular-nums">#{pass.id}</td>
                  <td className="border border-slate-900 p-3 font-bold">{pass.studentName}</td>
                  <td className="border border-slate-900 p-3">
                    {PASS_TYPES.find(p => p.id === pass.type)?.label}
                  </td>
                  <td className="border border-slate-900 p-3">{pass.teacherName}</td>
                  <td className="border border-slate-900 p-3 tabular-nums">{pass.timestamp}</td>
                  <td className="border border-slate-900 p-3">
                    {pass.status === 'confirmed' ? 'تم التأكيد ✅' : pass.status === 'rejected' ? 'مرفوض ❌' : 'بانتظار التأكيد ⏳'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-12 flex justify-between items-start pt-8 border-t border-slate-200">
            <div className="text-center space-y-2">
              <p className="font-black">ختم الوكيل</p>
              <div className="w-40 h-20 border-2 border-dashed border-slate-300 rounded-2xl" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-black">توقيع مدير المدرسة</p>
              <div className="w-40 h-20 border-2 border-dashed border-slate-300 rounded-2xl" />
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      <AnimatePresence>
        {showPrintModal && lastIssuedPass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">تم إصدار الإذن بنجاح</h3>
                  <p className="text-slate-500 font-medium">هل ترغب في طباعة بطاقة الإذن للطالب؟</p>
                </div>

                {/* Pass Preview */}
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">اسم الطالب</span>
                      <p className="text-lg font-black text-slate-800">{lastIssuedPass.studentName}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black ${PASS_TYPES.find(p => p.id === lastIssuedPass?.type)?.bgColor} ${PASS_TYPES.find(p => p.id === lastIssuedPass?.type)?.textColor}`}>
                      {PASS_TYPES.find(p => p.id === lastIssuedPass?.type)?.label}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">المعلم</span>
                      <p className="text-sm font-bold text-slate-700">{lastIssuedPass?.teacherName}</p>
                    </div>
                    <div className="space-y-1 text-left">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">الوقت</span>
                      <p className="text-sm font-bold text-slate-700 tabular-nums">{lastIssuedPass?.timestamp}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                      <QrCode className="w-3 h-3" />
                      <span>يتضمن رمز QR للتحقق</span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600">#{lastIssuedPass?.id}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={handlePrint}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                  >
                    <History className="w-5 h-5" />
                    طباعة البطاقة
                  </button>
                  <button 
                    onClick={() => setShowPrintModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black transition-all"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Printable Pass */}
      <div id="printable-pass" className="hidden print:block">
        <div className="border-4 border-double border-slate-900 p-8 rounded-3xl space-y-8 bg-white max-w-2xl mx-auto">
          <div className="flex justify-between items-center border-b-2 border-slate-900 pb-6">
            <div className="text-right">
              <h1 className="text-3xl font-black text-slate-900">
                {lastIssuedPass?.type === 'entry' ? 'بطاقة دخول للفصل' : 
                 lastIssuedPass?.type === 'call' ? 'بطاقة استدعاء للوكيل' : 
                 'بطاقة خروج من المدرسة'}
              </h1>
              <p className="text-lg font-bold text-slate-600">ثانوية أم القرى - نظام تكامل</p>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-500">رقم الإذن: #{lastIssuedPass?.id}</p>
              <p className="text-sm font-bold text-slate-500">التاريخ: {new Date().toLocaleDateString('ar-SA')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 py-4">
            <div className="space-y-2">
              <span className="text-sm font-black text-slate-400">اسم الطالب:</span>
              <p className="text-2xl font-black text-slate-900 border-b border-slate-200 pb-2">{lastIssuedPass?.studentName}</p>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-black text-slate-400">نوع الإذن:</span>
              <p className="text-2xl font-black text-slate-900 border-b border-slate-200 pb-2">
                {PASS_TYPES.find(p => p.id === lastIssuedPass?.type)?.label}
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-black text-slate-400">المعلم المستلم:</span>
              <p className="text-xl font-black text-slate-800 border-b border-slate-200 pb-2">{lastIssuedPass?.teacherName}</p>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-black text-slate-400">وقت الإصدار:</span>
              <p className="text-xl font-black text-slate-800 border-b border-slate-200 pb-2 tabular-nums">{lastIssuedPass?.timestamp}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <span className="text-sm font-black text-slate-400 block mb-2">سبب الإذن:</span>
            <p className="text-lg font-bold text-slate-700 italic">
              {lastIssuedPass?.reason || 'لا يوجد سبب محدد'}
            </p>
          </div>

          <div className="flex justify-between items-end pt-8">
            <div className="text-center space-y-4">
              <div className="w-32 h-32 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center p-2">
                {lastIssuedPass && (
                  <QRCodeSVG 
                    value={`${window.location.origin}/verify-pass/${lastIssuedPass.id}`}
                    size={110}
                    level="H"
                    includeMargin={false}
                  />
                )}
              </div>
              <p className="text-xs font-black text-slate-400">تحقق من صحة الإذن</p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-black text-slate-900">ختم الوكيل</p>
              <div className="w-40 h-20 border-2 border-dashed border-slate-300 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-1">إصدار إذن تحرك طالب</h2>
          <p className="text-slate-500 text-sm font-medium">نظام التصاريح الذكية للمدرسة</p>
        </div>
        <LiveClock />
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Filter className="w-4 h-4 text-indigo-500" />
                الصف
              </label>
              <select 
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  setSelectedSection('');
                  setSelectedStudent('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                disabled={loadingData}
              >
                <option value="">كل الصفوف</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Filter className="w-4 h-4 text-indigo-500" />
                الفصل
              </label>
              <select 
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  setSelectedStudent('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                disabled={loadingData || !selectedGrade}
              >
                <option value="">كل الفصول</option>
                {sections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <User className="w-4 h-4 text-indigo-500" />
              اختيار الطالب
            </label>
            <select 
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              disabled={loadingData || filteredStudents.length === 0}
            >
              <option value="">{loadingData ? 'جاري التحميل...' : filteredStudents.length === 0 ? 'لا يوجد طلاب' : 'اختر الطالب...'}</option>
              {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Users className="w-4 h-4 text-indigo-500" />
              المعلم المستلم
            </label>
            <select 
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              disabled={loadingData}
            >
              <option value="">{loadingData ? 'جاري التحميل...' : 'اختر المعلم...'}</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <FileText className="w-4 h-4 text-indigo-500" />
              سبب الإذن (اختياري)
            </label>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="اكتب السبب هنا..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none"
            />
          </div>
        </div>

        {/* Pass Types */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-700 block px-2">نوع الإذن</label>
          <div className="grid grid-cols-1 gap-4">
            {PASS_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setPassType(type.id)}
                className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all text-right ${
                  passType === type.id 
                    ? `border-${type.color.split('-')[1]}-500 ${type.bgColor} shadow-md scale-[1.02]` 
                    : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <div className={`p-3 rounded-2xl ${type.color} text-white`}>
                  <type.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <span className={`text-lg font-black block ${passType === type.id ? type.textColor : 'text-slate-800'}`}>
                    {type.label}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">إصدار تصريح فوري</span>
                </div>
                {passType === type.id && (
                  <div className={`w-6 h-6 rounded-full ${type.color} flex items-center justify-center`}>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <button 
          onClick={handleIssuePass}
          className="group relative flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-5 rounded-3xl font-black text-xl shadow-xl shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
        >
          <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          إصدار الإذن وإشعار المعلم
        </button>
      </div>

      {/* Live Tracking Log */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden no-print">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-slate-800">سجل الأذونات</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm group">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-bold text-slate-700"
              />
              {selectedDate && (
                <button 
                  onClick={() => setSelectedDate('')}
                  className="text-[10px] font-black text-rose-500 hover:text-rose-600 transition-colors"
                >
                  إلغاء التصفية
                </button>
              )}
            </div>
            
            <button 
              onClick={handlePrintReport}
              disabled={filteredPasses.length === 0}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-2xl border border-slate-200 shadow-sm font-bold text-sm transition-all disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              {selectedDate ? 'طباعة تقرير اليوم' : 'طباعة السجل الكامل'}
            </button>
            
            <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">
              تحديث لحظي
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredPasses.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-slate-400 font-bold">لا توجد أذونات في هذا التاريخ</p>
            </div>
          ) : (
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs font-black uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">التاريخ</th>
                  <th className="px-6 py-4">الطالب</th>
                  <th className="px-6 py-4">المعلم والحصة</th>
                  <th className="px-6 py-4">نوع الإذن</th>
                  <th className="px-6 py-4">وقت الإصدار</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence initial={false}>
                  {filteredPasses.map((pass) => (
                    <motion.tr 
                      key={pass.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-500 tabular-nums">{pass.date || 'قديم'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-black">
                            {pass.studentName.charAt(0)}
                          </div>
                          <span className="text-sm font-black text-slate-700">{pass.studentName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="text-sm font-bold text-slate-600 block">{pass.teacherName}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{pass.period}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${PASS_TYPES.find(p => p.id === pass.type)?.color}`} />
                          <span className="text-xs font-bold text-slate-600">
                            {PASS_TYPES.find(p => p.id === pass.type)?.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-500 tabular-nums">{pass.timestamp}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={pass.status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {pass.status === 'pending' && (
                            <button 
                              onClick={() => updatePassStatus(pass.id, 'confirmed')}
                              className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-emerald-100 transition-all"
                              title="محاكاة رد المعلم"
                            >
                              <RefreshCw className="w-3 h-3" />
                              محاكاة رد المعلم
                            </button>
                          )}
                          <button 
                            onClick={() => handlePrintPass(pass)}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="طباعة البطاقة"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <a 
                            href={`${window.location.origin}/verify-pass/${pass.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                            title="رابط التحقق"
                          >
                            <QrCode className="w-4 h-4" />
                          </a>
                          <a 
                            href={`${window.location.origin}/quick-confirm/${pass.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="فتح رابط المعلم"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentPassDashboard;
