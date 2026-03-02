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
  most_frequent_problem: string;
}

interface ReferralStatus {
  id: number;
  student_name: string;
  student_grade: string;
  teacher_name: string;
  status: string;
  reason: string;
  type: string;
  remedial_plan: string;
  created_at: string;
  closed_at: string;
}

interface TeacherStat {
  name: string;
  total_referrals: number;
  resolved_count: number;
  escalated_count: number;
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [referralStatus, setReferralStatus] = useState<ReferralStatus[]>([]);
  const [teacherStats, setTeacherStats] = useState<TeacherStat[]>([]);
  const [kpiStats, setKpiStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<'comprehensive' | 'repeat' | 'teachers'>('comprehensive');

  useEffect(() => {
    if (user?.role !== 'principal' && user?.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const [topRes, statusRes, teacherRes, kpiRes] = await Promise.all([
          fetch('/api/reports/top-students'),
          fetch('/api/reports/referral-status'),
          fetch('/api/reports/teacher-stats'),
          fetch('/api/reports/kpi-stats')
        ]);

        setTopStudents(await topRes.json());
        setReferralStatus(await statusRes.json());
        setTeacherStats(await teacherRes.json());
        setKpiStats(await kpiRes.json());
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'behavior': return 'سلوكية';
      case 'academic': return 'أكاديمية';
      case 'attendance': return 'غياب وتأخر';
      case 'uniform': return 'زي مدرسي';
      case 'other': return 'أخرى';
      default: return type || 'متنوعة';
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* 1. Official Print Header (Visible only on print) */}
      <div className="hidden print:block w-full">
        <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900 pb-6">
          <div className="text-right space-y-1">
            <p className="text-sm font-black">المملكة العربية السعودية</p>
            <p className="text-sm font-black">وزارة التعليم</p>
            <p className="text-xs font-bold">الإدارة العامة للتعليم بمنطقة الخرج</p>
            <p className="text-xs font-bold">ثانوية أم القرى</p>
          </div>

          <div className="text-center">
            <img 
              src="https://i.ibb.co/QFwrvnqF/photo-2026-02-20-15-16-20.jpg" 
              alt="شعار الوزارة" 
              className="w-20 h-20 object-contain mx-auto mb-2"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-xl font-black text-slate-900">
              {activeReport === 'comprehensive' ? 'تقرير السجل الشامل للحالات' : 
               activeReport === 'repeat' ? 'تقرير الطلاب الأكثر تحويلاً' : 
               'تقرير أداء المعلمين والتحويلات'}
            </h1>
            <p className="text-xs font-bold text-slate-600 mt-1">تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</p>
          </div>

          <div className="text-left">
            <img 
              src="https://upload.wikimedia.org/wikipedia/ar/thumb/a/a2/Saudi_Vision_2030_logo.svg/512px-Saudi_Vision_2030_logo.svg.png" 
              alt="رؤية 2030" 
              className="w-20 h-20 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Dynamic Report Tables for Print */}
        {activeReport === 'comprehensive' && (
          <table className="w-full text-right border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 border border-slate-300 text-[10px] font-black">رقم الحالة</th>
                <th className="p-2 border border-slate-300 text-[10px] font-black">اسم الطالب</th>
                <th className="p-2 border border-slate-300 text-[10px] font-black">رقم الهوية</th>
                <th className="p-2 border border-slate-300 text-[10px] font-black">الصف</th>
                <th className="p-2 border border-slate-300 text-[10px] font-black">المعلم المحيل</th>
                <th className="p-2 border border-slate-300 text-[10px] font-black">نوع المشكلة</th>
                <th className="p-2 border border-slate-300 text-[10px] font-black">الإجراء المتخذ</th>
                <th className="p-2 border border-slate-300 text-[10px] font-black">الحالة</th>
                <th className="p-2 border border-slate-300 text-[10px] font-black">تاريخ الإغلاق</th>
              </tr>
            </thead>
            <tbody>
              {referralStatus.map((ref, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="p-2 border border-slate-300 text-[9px] font-bold">#{ref.id}</td>
                  <td className="p-2 border border-slate-300 text-[9px] font-black">{ref.student_name}</td>
                  <td className="p-2 border border-slate-300 text-[9px] font-bold">{ref.student_national_id || '-'}</td>
                  <td className="p-2 border border-slate-300 text-[9px] font-bold">{ref.student_grade}</td>
                  <td className="p-2 border border-slate-300 text-[9px] font-bold">{ref.teacher_name}</td>
                  <td className="p-2 border border-slate-300 text-[9px] font-bold">{getTypeLabel(ref.type)}</td>
                  <td className="p-2 border border-slate-300 text-[9px] font-bold">{ref.remedial_plan || 'قيد المعالجة'}</td>
                  <td className="p-2 border border-slate-300 text-[9px] font-black">{getStatusLabel(ref.status)}</td>
                  <td className="p-2 border border-slate-300 text-[9px] font-bold">{ref.closed_at ? new Date(ref.closed_at).toLocaleDateString('ar-SA') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeReport === 'repeat' && (
          <table className="w-full text-right border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-3 border border-slate-300 text-xs font-black">اسم الطالب</th>
                <th className="p-3 border border-slate-300 text-xs font-black">الصف</th>
                <th className="p-3 border border-slate-300 text-xs font-black">إجمالي التحويلات</th>
                <th className="p-3 border border-slate-300 text-xs font-black">أبرز مشكلة متكررة</th>
              </tr>
            </thead>
            <tbody>
              {topStudents.map((student, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="p-3 border border-slate-300 text-xs font-black">{student.name}</td>
                  <td className="p-3 border border-slate-300 text-xs font-bold">{student.grade}</td>
                  <td className="p-3 border border-slate-300 text-xs font-black text-center">{student.referral_count}</td>
                  <td className="p-3 border border-slate-300 text-xs font-bold">{getTypeLabel(student.most_frequent_problem)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeReport === 'teachers' && (
          <table className="w-full text-right border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-3 border border-slate-300 text-xs font-black">اسم المعلم</th>
                <th className="p-3 border border-slate-300 text-xs font-black">إجمالي الطلاب المحولين</th>
                <th className="p-3 border border-slate-300 text-xs font-black">عدد الحالات المغلقة</th>
                <th className="p-3 border border-slate-300 text-xs font-black">عدد الحالات المصعدة</th>
              </tr>
            </thead>
            <tbody>
              {teacherStats.map((stat, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="p-3 border border-slate-300 text-xs font-black">{stat.name}</td>
                  <td className="p-3 border border-slate-300 text-xs font-black text-center">{stat.total_referrals}</td>
                  <td className="p-3 border border-slate-300 text-xs font-bold text-center text-emerald-600">{stat.resolved_count}</td>
                  <td className="p-3 border border-slate-300 text-xs font-bold text-center text-indigo-600">{stat.escalated_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Dynamic Signatures Section */}
        <div className="mt-16 grid grid-cols-4 gap-8 text-center page-break-inside-avoid">
          <div className="space-y-8">
            <p className="font-black text-sm">المعلم</p>
            <div className="h-px bg-slate-300 w-3/4 mx-auto"></div>
            <p className="text-xs font-bold">التوقيع: .................</p>
          </div>
          <div className="space-y-8">
            <p className="font-black text-sm">وكيل شؤون الطلاب</p>
            <div className="h-px bg-slate-300 w-3/4 mx-auto"></div>
            <p className="text-xs font-bold">أ. فهد السالم</p>
          </div>
          <div className="space-y-8">
            <p className="font-black text-sm">الموجه الطلابي</p>
            <div className="h-px bg-slate-300 w-3/4 mx-auto"></div>
            <p className="text-xs font-bold">أ. محمد الفهيد</p>
          </div>
          <div className="space-y-8">
            <p className="font-black text-sm">مدير المدرسة</p>
            <div className="h-px bg-slate-300 w-3/4 mx-auto"></div>
            <p className="text-xs font-bold">د. خالد المنصور</p>
          </div>
        </div>

        <div className="mt-10 text-center text-[10px] font-bold text-slate-400">
          <p>تم استخراج هذا التقرير آلياً من نظام تحويل - جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Screen Header (Hidden on print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <BarChart3 className="text-primary" size={32} />
            <span>نظام التقارير المتقدم</span>
          </h1>
          <p className="text-slate-500 font-bold">إحصائيات دقيقة وتقارير جاهزة للطباعة الرسمية</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="sts-button-primary flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Printer size={20} />
            <span>طباعة التقرير الحالي</span>
          </button>
        </div>
      </div>

      {/* KPI Cards for Dashboard View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sts-card p-6 border-r-4 border-primary">
          <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">إجمالي الحالات هذا الشهر</p>
          <p className="text-3xl font-black text-slate-800">{kpiStats?.total_this_month || 0}</p>
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="sts-card p-6 border-r-4 border-emerald-500">
          <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">الحالات المغلقة</p>
          <p className="text-3xl font-black text-emerald-600">{kpiStats?.resolved_cases || 0}</p>
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="sts-card p-6 border-r-4 border-amber-500">
          <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">الحالات قيد الانتظار</p>
          <p className="text-3xl font-black text-amber-600">{kpiStats?.pending_cases || 0}</p>
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="sts-card p-6 border-r-4 border-indigo-500">
          <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">حالات المشكلة الأولى</p>
          <p className="text-3xl font-black text-indigo-600">{kpiStats?.first_offense_cases || 0}</p>
        </motion.div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex flex-wrap gap-4 no-print">
        <button 
          onClick={() => setActiveReport('comprehensive')}
          className={`px-6 py-3 rounded-2xl font-black text-sm transition-all ${activeReport === 'comprehensive' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
        >
          السجل الشامل للحالات
        </button>
        <button 
          onClick={() => setActiveReport('repeat')}
          className={`px-6 py-3 rounded-2xl font-black text-sm transition-all ${activeReport === 'repeat' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
        >
          الطلاب الأكثر تحويلاً
        </button>
        <button 
          onClick={() => setActiveReport('teachers')}
          className={`px-6 py-3 rounded-2xl font-black text-sm transition-all ${activeReport === 'teachers' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
        >
          أداء المعلمين
        </button>
      </div>

      <div className="sts-card overflow-hidden no-print">
        {activeReport === 'comprehensive' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-5 font-black text-slate-600">رقم الحالة</th>
                  <th className="p-5 font-black text-slate-600">اسم الطالب</th>
                  <th className="p-5 font-black text-slate-600">المعلم</th>
                  <th className="p-5 font-black text-slate-600">الحالة</th>
                  <th className="p-5 font-black text-slate-600">تاريخ الإغلاق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {referralStatus.map((ref, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/referral/${ref.id}`)}>
                    <td className="p-5 font-mono font-bold text-slate-400">#{ref.id}</td>
                    <td className="p-5 font-black text-slate-800">{ref.student_name}</td>
                    <td className="p-5 text-slate-600 font-bold">{ref.teacher_name}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${
                        ref.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {getStatusLabel(ref.status)}
                      </span>
                    </td>
                    <td className="p-5 text-slate-400 font-bold text-xs">
                      {ref.closed_at ? new Date(ref.closed_at).toLocaleDateString('ar-SA') : 'قيد المعالجة'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'repeat' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-5 font-black text-slate-600">اسم الطالب</th>
                  <th className="p-5 font-black text-slate-600">الصف</th>
                  <th className="p-5 font-black text-slate-600 text-center">عدد التحويلات</th>
                  <th className="p-5 font-black text-slate-600">أبرز مشكلة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topStudents.map((student, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 font-black text-slate-800">{student.name}</td>
                    <td className="p-5 text-slate-500 font-bold">{student.grade}</td>
                    <td className="p-5 text-center">
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-black text-sm">
                        {student.referral_count}
                      </span>
                    </td>
                    <td className="p-5 text-slate-600 font-bold">{getTypeLabel(student.most_frequent_problem)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'teachers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-5 font-black text-slate-600">اسم المعلم</th>
                  <th className="p-5 font-black text-slate-600 text-center">إجمالي التحويلات</th>
                  <th className="p-5 font-black text-slate-600 text-center">المغلقة</th>
                  <th className="p-5 font-black text-slate-600 text-center">المصعدة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {teacherStats.map((stat, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 font-black text-slate-800">{stat.name}</td>
                    <td className="p-5 text-center font-black">{stat.total_referrals}</td>
                    <td className="p-5 text-center font-black text-emerald-600">{stat.resolved_count}</td>
                    <td className="p-5 text-center font-black text-indigo-600">{stat.escalated_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
            @bottom-center {
              content: "صفحة " counter(page) " من " counter(pages);
            }
          }
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            direction: rtl;
            font-family: 'Inter', sans-serif;
            height: auto !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
          .sts-card {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            height: auto !important;
            overflow: visible !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
          th, td {
            border: 1px solid #000 !important;
            padding: 6px !important;
            text-align: right !important;
            word-wrap: break-word !important;
          }
          .table-responsive {
            overflow: visible !important;
            height: auto !important;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid !important;
          }
        }
      `}} />
    </div>
  );
};

export default Reports;
