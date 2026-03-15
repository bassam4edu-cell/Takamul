import React, { useEffect, useState } from 'react';
import { Printer, ArrowRight, ChevronRight, ChevronLeft, MessageCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { useMessageLog } from '../context/MessageLogContext';

const DailyAbsenceReport: React.FC = () => {
  const { user } = useAuth();
  const { addLogEntry } = useMessageLog();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [principalName, setPrincipalName] = useState('مدير المدرسة');
  const [periodFilter, setPeriodFilter] = useState<string>('');
  const itemsPerPage = 15;
  const [reportNumber] = useState(Math.floor(Math.random() * 1000000));
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
        const grade = searchParams.get('grade');
        const section = searchParams.get('section');
        
        let url = `/api/attendance/daily-report?date=${date}`;
        if (grade && section) {
          url += `&grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}`;
        }
        if (periodFilter) {
          url += `&period=${periodFilter}`;
        }

        const [res, settingsRes] = await Promise.all([
          fetch(url),
          fetch('/api/settings')
        ]);

        if (res.ok) {
          const json = await res.json();
          setData(json);
        }

        if (settingsRes.ok) {
          const settingsJson = await settingsRes.json();
          if (settingsJson.principal_name) {
            setPrincipalName(settingsJson.principal_name);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [location.search, periodFilter]);

  const handlePrint = () => {
    window.print();
  };

  const sendWhatsAppMessage = async (phoneNumber: string, studentName: string, period: number) => {
    try {
      const instanceId = localStorage.getItem('ultramsg_instance_id');
      const token = localStorage.getItem('ultramsg_token');

      if (!instanceId || !token) {
        return { 
          success: false, 
          code: 'MISSING_WHATSAPP_CREDENTIALS', 
          message: 'بيانات الربط مفقودة. يرجى إعداد خدمة الواتساب من شاشة إعدادات الرسائل.' 
        };
      }

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber, studentName, instanceId, token, period })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.code === 'MISSING_WHATSAPP_CREDENTIALS') {
          return { success: false, code: data.code, message: data.message };
        }
        
        addLogEntry({
          recipient: studentName,
          recipientPhone: phoneNumber,
          messageType: '🛑 إشعار غياب',
          messageText: `إشعار غياب للطالب ${studentName} الحصة ${period}`,
          status: 'failed'
        });
        
        throw new Error('Failed to send WhatsApp message');
      }

      addLogEntry({
        recipient: studentName,
        recipientPhone: phoneNumber,
        messageType: '🛑 إشعار غياب',
        messageText: `إشعار غياب للطالب ${studentName} الحصة ${period}`,
        status: 'success'
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to send WhatsApp message", error);
      return { success: false, message: 'حدث خطأ أثناء الإرسال' };
    }
  };

  const handleSendWhatsApp = async (student: any) => {
    if (!student.parent_phone || student.parent_phone.trim() === '') {
      alert('رقم الجوال غير مسجل لهذا الطالب');
      return;
    }
    
    const result = await sendWhatsAppMessage(student.parent_phone, student.student_name, student.period);
    
    if (!result.success) {
      if (result.code === 'MISSING_WHATSAPP_CREDENTIALS') {
        alert(`⚠️ تعذر الإرسال: ${result.message}`);
      } else {
        alert('حدث خطأ أثناء الإرسال.');
      }
      return;
    }
    
    alert(`تم إرسال رسالة واتساب لولي أمر الطالب بنجاح.`);
  };

  const searchParams = new URLSearchParams(location.search);
  const selectedDateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const reportDate = new Date(selectedDateStr);
  const dayName = reportDate.toLocaleDateString('ar-SA', { weekday: 'long' });
  const dateStr = reportDate.toLocaleDateString('ar-SA');

  const totalPages = Math.ceil(data.length / itemsPerPage) || 1;
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  if (loading) {
    return <div className="p-10 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans" dir="rtl">
      {/* Controls - Hidden in print */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200"
        >
          <ArrowRight size={20} />
          عودة
        </button>

        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
          <label className="text-sm font-bold text-slate-700 whitespace-nowrap">تصفية بالحصة:</label>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2"
          >
            <option value="">الكل</option>
            {[1, 2, 3, 4, 5, 6, 7].map((p) => (
              <option key={p} value={p}>الحصة {p}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={async () => {
              const studentsWithPhone = data.filter(s => s.parent_phone && s.parent_phone.trim() !== '');
              if (studentsWithPhone.length === 0) {
                alert('لا يوجد طلاب لديهم أرقام جوال مسجلة.');
                return;
              }
              
              if (!window.confirm(`سيتم إرسال رسائل واتساب إلى ${studentsWithPhone.length} طالب. هل أنت متأكد؟`)) {
                return;
              }

              let successCount = 0;
              let failCount = 0;

              for (const student of studentsWithPhone) {
                const result = await sendWhatsAppMessage(student.parent_phone, student.student_name, student.period);
                if (result.success) {
                  successCount++;
                } else {
                  failCount++;
                }
                // Wait 2000ms between messages to avoid ban
                await new Promise(resolve => setTimeout(resolve, 2000));
              }

              alert(`تم الانتهاء من الإرسال.\nنجاح: ${successCount}\nفشل: ${failCount}`);
            }}
            className="flex items-center gap-2 bg-[#25D366] text-white px-6 py-2 rounded-xl shadow-sm hover:bg-[#25D366]/90 font-bold"
          >
            <MessageCircle size={20} />
            إرسال واتساب للجميع
          </button>

          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-xl shadow-sm hover:bg-primary/90 font-bold"
          >
            <Printer size={20} />
            طباعة التقرير
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-sm border border-slate-200 rounded-2xl print:shadow-none print:border-none print:p-0">
        
        {/* Print Header (الكليشة) */}
        <div className="hidden print:flex justify-between items-start border-b-2 border-black pb-4 mb-4">
          <div className="text-right text-sm font-bold text-black">
            <p>المملكة العربية السعودية</p>
            <p>وزارة التعليم</p>
            <p>الإدارة العامة للتعليم بمنطقة الرياض</p>
            <p>ثانوية أم القرى</p>
          </div>
          <div className="text-center font-bold text-lg flex-1 text-black">
            التقرير اليومي للغياب
          </div>
          <div className="text-left text-sm font-bold text-black">
            <p>تاريخ التقرير: {dateStr}</p>
            <p>رقم التقرير: {reportNumber}</p>
          </div>
        </div>

        {/* UI Header - Hidden in print */}
        <div className="print:hidden flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
          <div className="text-right space-y-1">
            <p className="font-bold text-sm">المملكة العربية السعودية</p>
            <p className="font-bold text-sm">وزارة التعليم</p>
            <p className="font-bold text-sm">الإدارة العامة للتعليم بمنطقة الرياض</p>
            <p className="font-bold text-sm">محافظة الخرج</p>
            <p className="font-bold text-sm">المدرسة: ثانوية أم القرى</p>
          </div>
          <div className="text-center">
            <img src="https://upload.wikimedia.org/wikipedia/ar/thumb/3/32/Ministry_of_Education_Saudi_Arabia.svg/1200px-Ministry_of_Education_Saudi_Arabia.svg.png" alt="شعار الوزارة" className="w-24 h-24 object-contain mx-auto mb-2 opacity-80" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
          <div className="text-left space-y-1">
            <p className="font-bold text-sm">المرفقات: ....................</p>
            <p className="font-bold text-sm">التاريخ: {dateStr}</p>
          </div>
        </div>

        {/* Title - Hidden in print (replaced by Print Header) */}
        <div className="print:hidden text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900 mb-2 border-2 border-slate-800 inline-block px-8 py-2 rounded-xl bg-slate-50">
            تقرير الغياب والتأخر اليومي
            {new URLSearchParams(location.search).get('grade') && ` - ${new URLSearchParams(location.search).get('grade')} / ${new URLSearchParams(location.search).get('section')}`}
          </h1>
          <div className="flex justify-center gap-8 mt-4 text-slate-700 font-bold">
            <p>اليوم: {dayName}</p>
            <p>التاريخ: {dateStr}</p>
          </div>
        </div>

        {/* UI Table (Paginated) */}
        <div className="print:hidden overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-3 text-center w-12 font-bold text-slate-800">م</th>
                <th className="border border-slate-300 p-3 text-right font-bold text-slate-800">اسم الطالب</th>
                <th className="border border-slate-300 p-3 text-center font-bold text-slate-800">الصف</th>
                <th className="border border-slate-300 p-3 text-center font-bold text-slate-800">الفصل</th>
                <th className="border border-slate-300 p-3 text-center font-bold text-slate-800">الحصة</th>
                <th className="border border-slate-300 p-3 text-center font-bold text-slate-800">حالة الحضور</th>
                <th className="border border-slate-300 p-3 text-center font-bold text-slate-800 w-32">إجراءات</th>
                <th className="border border-slate-300 p-3 text-right font-bold text-slate-800 w-48">ملاحظات الوكيل</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-3 text-center text-slate-600">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td className="border border-slate-300 p-3 font-bold text-slate-800">{row.student_name}</td>
                    <td className="border border-slate-300 p-3 text-center text-slate-600">{row.grade}</td>
                    <td className="border border-slate-300 p-3 text-center text-slate-600">{row.section}</td>
                    <td className="border border-slate-300 p-3 text-center font-bold text-slate-800">{row.period || '-'}</td>
                    <td className="border border-slate-300 p-3 text-center">
                      <span className={`font-bold ${row.status === 'غائب' ? 'text-red-600 bg-red-50 px-2 py-1 rounded-lg' : 'text-amber-600 bg-amber-50 px-2 py-1 rounded-lg'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="border border-slate-300 p-3 text-center">
                      <button
                        onClick={() => handleSendWhatsApp(row)}
                        disabled={!row.parent_phone || row.parent_phone.trim() === ''}
                        title={(!row.parent_phone || row.parent_phone.trim() === '') ? '⚠️ رقم الجوال غير مسجل' : 'إرسال واتساب لولي الأمر'}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                          (!row.parent_phone || row.parent_phone.trim() === '')
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20'
                        }`}
                      >
                        <MessageCircle size={14} />
                        واتساب
                      </button>
                    </td>
                    <td className="border border-slate-300 p-3"></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="border border-slate-300 p-8 text-center text-slate-500 font-bold">
                    لا يوجد غياب أو تأخر مسجل لهذا اليوم
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {data.length > 0 && (
          <div className="print:hidden flex justify-between items-center mt-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
              السابق
            </button>
            <span className="font-bold text-slate-600">
              صفحة {currentPage} من {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              التالي
              <ChevronLeft size={18} />
            </button>
          </div>
        )}

        {/* Print Table (All Data) */}
        <table className="hidden print:table w-full border-collapse border border-black text-sm text-black">
          <thead>
            <tr>
              <th className="border border-black p-2 text-center w-12 font-bold">م</th>
              <th className="border border-black p-2 text-right font-bold">اسم الطالب</th>
              <th className="border border-black p-2 text-center font-bold">الصف</th>
              <th className="border border-black p-2 text-center font-bold">الفصل</th>
              <th className="border border-black p-2 text-center font-bold">الحصة</th>
              <th className="border border-black p-2 text-center font-bold">حالة الحضور</th>
              <th className="border border-black p-2 text-right font-bold w-48">ملاحظات الوكيل</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, idx) => (
                <tr key={idx} className="break-inside-avoid">
                  <td className="border border-black p-2 text-center">{idx + 1}</td>
                  <td className="border border-black p-2 font-bold">{row.student_name}</td>
                  <td className="border border-black p-2 text-center">{row.grade}</td>
                  <td className="border border-black p-2 text-center">{row.section}</td>
                  <td className="border border-black p-2 text-center font-bold">{row.period || '-'}</td>
                  <td className="border border-black p-2 text-center font-bold">
                    {row.status}
                  </td>
                  <td className="border border-black p-2"></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="border border-black p-4 text-center font-bold">
                  لا يوجد غياب أو تأخر مسجل لهذا اليوم
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Print Footer (التوقيعات الديناميكية) */}
        <div className="hidden print:flex justify-between mt-12 pt-8 text-black">
          <div className="text-right">
            <p className="font-bold">وكيل شؤون الطلاب</p>
            <p className="font-bold mt-2">الاسم: {user?.name || 'غير محدد'}</p>
          </div>
          <div className="text-left">
            <p className="font-bold">مدير المدرسة</p>
            <p className="font-bold mt-2">الاسم: {principalName}</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DailyAbsenceReport;
