import React, { useEffect, useState } from 'react';
import { Printer, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const DailyAbsenceReport: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [location.search]);

  const handlePrint = () => {
    window.print();
  };

  const searchParams = new URLSearchParams(location.search);
  const selectedDateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const reportDate = new Date(selectedDateStr);
  const dayName = reportDate.toLocaleDateString('ar-SA', { weekday: 'long' });
  const dateStr = reportDate.toLocaleDateString('ar-SA');

  if (loading) {
    return <div className="p-10 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans" dir="rtl">
      {/* Controls - Hidden in print */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center no-print">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200"
        >
          <ArrowRight size={20} />
          عودة
        </button>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-xl shadow-sm hover:bg-primary/90 font-bold"
        >
          <Printer size={20} />
          طباعة التقرير
        </button>
      </div>

      {/* Printable Area */}
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-sm border border-slate-200 rounded-2xl print:shadow-none print:border-none print:p-0">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
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

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900 mb-2 border-2 border-slate-800 inline-block px-8 py-2 rounded-xl bg-slate-50">
            تقرير الغياب والتأخر اليومي
            {new URLSearchParams(location.search).get('grade') && ` - ${new URLSearchParams(location.search).get('grade')} / ${new URLSearchParams(location.search).get('section')}`}
          </h1>
          <div className="flex justify-center gap-8 mt-4 text-slate-700 font-bold">
            <p>اليوم: {dayName}</p>
            <p>التاريخ: {dateStr}</p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse border border-slate-300 text-sm">
          <thead>
            <tr className="bg-[#f8fafc]">
              <th className="border border-slate-300 p-3 text-center w-12 font-bold text-slate-800">م</th>
              <th className="border border-slate-300 p-3 text-right font-bold text-slate-800">اسم الطالب</th>
              <th className="border border-slate-300 p-3 text-center font-bold text-slate-800">الصف</th>
              <th className="border border-slate-300 p-3 text-center font-bold text-slate-800">الفصل</th>
              <th className="border border-slate-300 p-3 text-center font-bold text-slate-800">حالة الحضور</th>
              <th className="border border-slate-300 p-3 text-right font-bold text-slate-800 w-48">ملاحظات الوكيل</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="border border-slate-300 p-3 text-center text-slate-600">{idx + 1}</td>
                  <td className="border border-slate-300 p-3 font-bold text-slate-800">{row.student_name}</td>
                  <td className="border border-slate-300 p-3 text-center text-slate-600">{row.grade}</td>
                  <td className="border border-slate-300 p-3 text-center text-slate-600">{row.section}</td>
                  <td className="border border-slate-300 p-3 text-center">
                    <span className={`font-bold ${row.status === 'غائب' ? 'text-red-600' : 'text-amber-600'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="border border-slate-300 p-3"></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="border border-slate-300 p-8 text-center text-slate-500 font-bold">
                  لا يوجد غياب أو تأخر مسجل لهذا اليوم
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Signatures */}
        <div className="mt-16 grid grid-cols-1 gap-8 text-center">
          <div>
            <p className="font-bold text-slate-800 mb-8">وكيل شؤون الطلاب</p>
            <p className="text-slate-400">.........................................</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DailyAbsenceReport;
