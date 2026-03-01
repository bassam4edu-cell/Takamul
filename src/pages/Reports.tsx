import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Printer, 
  BarChart3, 
  Users, 
  FileText, 
  TrendingUp,
  Calendar,
  Download,
  School,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';

interface TopStudent {
  name: string;
  grade: string;
  referral_count: number;
}

interface ReferralStatus {
  id: number;
  student_name: string;
  student_grade: string;
  teacher_name: string;
  status: string;
  reason: string;
  remedial_plan: string;
  has_text: boolean;
  has_file: boolean;
}

interface TeacherStat {
  name: string;
  referral_count: number;
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [referralStatus, setReferralStatus] = useState<ReferralStatus[]>([]);
  const [teacherStats, setTeacherStats] = useState<TeacherStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'principal' && user?.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const [topRes, statusRes, teacherRes] = await Promise.all([
          fetch('/api/reports/top-students'),
          fetch('/api/reports/referral-status'),
          fetch('/api/reports/teacher-stats')
        ]);

        setTopStudents(await topRes.json());
        setReferralStatus(await statusRes.json());
        setTeacherStats(await teacherRes.json());
      } catch (err) {
        console.error('Failed to fetch reports', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const handlePrint = () => {
    window.print();
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_vp': return 'بانتظار الوكيل';
      case 'pending_counselor': return 'بانتظار الموجه';
      case 'scheduled_meeting': return 'موعد لقاء';
      case 'returned_to_teacher': return 'معاد للمعلم';
      case 'resolved': return 'تمت المعالجة';
      case 'closed': return 'مغلق';
      default: return status;
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* 1. Official Print Header (Visible only on print) */}
      <div className="hidden print:block w-full">
        <div className="flex justify-between items-start mb-8">
          {/* Right: Ministry Logo Placeholder */}
          <div className="text-center space-y-1">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Ministry_of_Education_Saudi_Arabia_Logo.svg/512px-Ministry_of_Education_Saudi_Arabia_Logo.svg.png" 
              alt="شعار وزارة التعليم" 
              className="w-24 h-24 object-contain mb-2"
              referrerPolicy="no-referrer"
            />
            <p className="text-sm font-black">المملكة العربية السعودية</p>
            <p className="text-xs font-bold">وزارة التعليم</p>
            <p className="text-xs font-bold">إدارة التعليم بالخرج</p>
            <p className="text-xs font-bold">ثانوية أم القرى</p>
          </div>

          {/* Center: Report Title & Info */}
          <div className="text-center pt-4">
            <h1 className="text-2xl font-black text-slate-900 mb-4">سجل متابعة حالات الطلاب</h1>
            <div className="space-y-1 text-sm font-bold text-slate-600">
              <p>تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</p>
              <p>وقت الطباعة: {new Date().toLocaleTimeString('ar-SA')}</p>
            </div>
          </div>

          {/* Left: Vision 2030 Logo Placeholder */}
          <div className="text-center">
            <img 
              src="https://upload.wikimedia.org/wikipedia/ar/thumb/a/a2/Saudi_Vision_2030_logo.svg/512px-Saudi_Vision_2030_logo.svg.png" 
              alt="شعار رؤية 2030" 
              className="w-24 h-24 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* 2. Professional Print Table */}
        <table className="w-full text-right border-collapse border border-slate-300 print-table">
          <thead>
            <tr className="bg-slate-100 border-b-2 border-slate-300">
              <th className="p-3 border border-slate-300 font-black text-xs">رقم الحالة</th>
              <th className="p-3 border border-slate-300 font-black text-xs">اسم الطالب</th>
              <th className="p-3 border border-slate-300 font-black text-xs">الصف</th>
              <th className="p-3 border border-slate-300 font-black text-xs">المعلم المحيل</th>
              <th className="p-3 border border-slate-300 font-black text-xs">المشكلة/الوصف</th>
              <th className="p-3 border border-slate-300 font-black text-xs">الشواهد</th>
              <th className="p-3 border border-slate-300 font-black text-xs">الإجراء المتخذ</th>
              <th className="p-3 border border-slate-300 font-black text-xs">حالة الطلب</th>
            </tr>
          </thead>
          <tbody>
            {referralStatus.map((ref, i) => (
              <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-200`}>
                <td className="p-3 border border-slate-300 text-xs font-mono font-bold">#{ref.id}</td>
                <td className="p-3 border border-slate-300 text-xs font-black">{ref.student_name}</td>
                <td className="p-3 border border-slate-300 text-xs font-bold">{ref.student_grade}</td>
                <td className="p-3 border border-slate-300 text-xs font-bold">{ref.teacher_name}</td>
                <td className="p-3 border border-slate-300 text-[10px] font-bold leading-relaxed max-w-[150px]">{ref.reason}</td>
                <td className="p-3 border border-slate-300 text-[10px] font-bold text-center">
                  {ref.has_file ? 'نعم (ملف)' : ref.has_text ? 'نعم (نص)' : 'لا يوجد'}
                </td>
                <td className="p-3 border border-slate-300 text-[10px] font-bold leading-relaxed max-w-[150px]">
                  {ref.remedial_plan || 'قيد المراجعة'}
                </td>
                <td className="p-3 border border-slate-300 text-[10px] font-black">
                  {getStatusLabel(ref.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 3. Print Footer */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex justify-between items-center text-[10px] font-bold text-slate-400">
          <p>نظام تحويل - إدارة الحالات المدرسية</p>
          <p>صفحة 1 من 1</p>
        </div>
      </div>

      {/* Screen Header (Hidden on print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <BarChart3 className="text-primary" size={32} />
            <span>التقارير الإحصائية</span>
          </h1>
          <p className="text-slate-500 font-bold">نظرة شاملة على أداء النظام وحالات الطلاب</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="sts-button-primary flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Printer size={20} />
            <span>طباعة التقرير</span>
          </button>
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-primary transition-all shadow-sm">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sts-card p-6 flex items-center gap-5"
        >
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Users size={28} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold mb-1">إجمالي الطلاب</p>
            <p className="text-2xl font-black text-slate-800">{topStudents.length}</p>
          </div>
        </motion.div>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="sts-card p-6 flex items-center gap-5"
        >
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <FileText size={28} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold mb-1">إجمالي التحويلات</p>
            <p className="text-2xl font-black text-slate-800">{referralStatus.length}</p>
          </div>
        </motion.div>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="sts-card p-6 flex items-center gap-5"
        >
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold mb-1">معدل الإنجاز</p>
            <p className="text-2xl font-black text-slate-800">
              {referralStatus.length > 0 
                ? Math.round((referralStatus.filter(r => r.status === 'resolved' || r.status === 'closed').length / referralStatus.length) * 100)
                : 0}%
            </p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* 1. الطلاب الأكثر تحويلاً */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="space-y-6"
        >
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 border-r-4 border-primary pr-4">
            <TrendingUp className="text-primary" size={24} />
            <span>الطلاب الأكثر تحويلاً</span>
          </h3>
          <div className="sts-card overflow-hidden">
            <div className="hidden md:block">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-5 font-black text-slate-600">اسم الطالب</th>
                    <th className="p-5 font-black text-slate-600">الصف</th>
                    <th className="p-5 font-black text-slate-600 text-center">عدد التحويلات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topStudents.map((student, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 font-bold text-slate-800">{student.name}</td>
                      <td className="p-5 text-slate-500 font-bold">{student.grade}</td>
                      <td className="p-5 text-center">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-black text-sm">
                          {student.referral_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {topStudents.map((student, i) => (
                <div key={i} className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-800">{student.name}</span>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-black text-xs">
                      {student.referral_count} تحويل
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-bold">{student.grade}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 2. إحصائيات المعلمين */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="space-y-6"
        >
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 border-r-4 border-emerald-500 pr-4">
            <UserCheck className="text-emerald-500" size={24} />
            <span>إحصائيات المعلمين</span>
          </h3>
          <div className="sts-card overflow-hidden">
            <div className="hidden md:block">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-5 font-black text-slate-600">اسم المعلم</th>
                    <th className="p-5 font-black text-slate-600 text-center">إجمالي الطلاب المحولين</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {teacherStats.map((stat, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 font-bold text-slate-800">{stat.name}</td>
                      <td className="p-5 text-center">
                        <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-xl font-black text-sm border border-emerald-100">
                          {stat.referral_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {teacherStats.map((stat, i) => (
                <div key={i} className="p-4 flex justify-between items-center">
                  <span className="font-black text-slate-800">{stat.name}</span>
                  <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg font-black text-xs border border-emerald-100">
                    {stat.referral_count} طالب
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 3. موقف التحويلات العام */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="lg:col-span-2 space-y-6"
        >
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 border-r-4 border-blue-500 pr-4">
            <FileText className="text-blue-500" size={24} />
            <span>موقف التحويلات العام</span>
          </h3>
          <div className="sts-card overflow-hidden">
            <div className="hidden md:block">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-5 font-black text-slate-600">رقم الحالة</th>
                    <th className="p-5 font-black text-slate-600">اسم الطالب</th>
                    <th className="p-5 font-black text-slate-600">المعلم المحيل</th>
                    <th className="p-5 font-black text-slate-600">الحالة الحالية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {referralStatus.map((ref, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/referral/${ref.id}`)}>
                      <td className="p-5 font-mono font-bold text-slate-400">#{ref.id}</td>
                      <td className="p-5 font-bold text-slate-800">{ref.student_name}</td>
                      <td className="p-5 text-slate-600 font-bold">{ref.teacher_name}</td>
                      <td className="p-5">
                        <span className="text-xs font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                          {getStatusLabel(ref.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {referralStatus.map((ref, i) => (
                <div key={i} className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-slate-400 text-xs">#{ref.id}</span>
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                      {getStatusLabel(ref.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-800">{ref.student_name}</span>
                    <span className="text-xs text-slate-500 font-bold">المعلم: {ref.teacher_name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Print Footer (Hidden on screen) */}
      <div className="hidden print:block mt-20 pt-10 border-t border-slate-200">
        <div className="grid grid-cols-3 text-center gap-10">
          <div className="space-y-6">
            <p className="font-black text-lg">وكيل شؤون الطلاب</p>
            <div className="h-12 border-b border-slate-300 w-40 mx-auto"></div>
            <p className="font-bold">أ. فهد السالم</p>
          </div>
          <div className="space-y-6">
            <p className="font-black text-lg">الموجه الطلابي</p>
            <div className="h-12 border-b border-slate-300 w-40 mx-auto"></div>
            <p className="font-bold">أ. محمد الفهيد</p>
          </div>
          <div className="space-y-6">
            <p className="font-black text-lg">مدير المدرسة</p>
            <div className="h-12 border-b border-slate-300 w-40 mx-auto"></div>
            <p className="font-bold">د. خالد المنصور</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            direction: rtl;
          }
          .no-print {
            display: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 8px !important;
            text-align: right !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .max-w-6xl {
            max-width: 100% !important;
          }
          .sts-card {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
        }
      `}} />
    </div>
  );
};

export default Reports;
