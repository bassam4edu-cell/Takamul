import React, { useState } from 'react';
import { Search, Download, Filter, Calendar, ChevronRight, ChevronLeft, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock Data
const mockLogs = [
  {
    id: 1,
    date: '22-03-2026',
    time: '08:15 ص',
    userName: 'فهد العتيبي',
    userRole: 'وكيل شؤون الطلاب',
    actionType: 'إضافة',
    details: 'تم إرسال رسائل غياب واتساب لعدد 45 طالب متغيب',
    ip: '192.168.1.45'
  },
  {
    id: 2,
    date: '22-03-2026',
    time: '09:30 ص',
    userName: 'أحمد محمد',
    userRole: 'معلم',
    actionType: 'تعديل',
    details: 'تم تعديل درجة الطالب خالد عبدالله في مادة الرياضيات من 15 إلى 20',
    ip: '192.168.1.112'
  },
  {
    id: 3,
    date: '21-03-2026',
    time: '11:45 ص',
    userName: 'سالم عبدالله',
    userRole: 'موجه طلابي',
    actionType: 'حذف',
    details: 'تم حذف مخالفة سلوكية (تأخر صباحي) للطالب عمر فهد',
    ip: '192.168.1.88'
  },
  {
    id: 4,
    date: '21-03-2026',
    time: '07:00 ص',
    userName: 'النظام الآلي',
    userRole: 'نظام',
    actionType: 'نظام',
    details: 'تم استيراد بيانات الحضور والانصراف من نظام نور بنجاح',
    ip: '127.0.0.1'
  },
  {
    id: 5,
    date: '20-03-2026',
    time: '01:20 م',
    userName: 'سعد الدوسري',
    userRole: 'مدير النظام',
    actionType: 'إضافة',
    details: 'تسجيل دخول ناجح للوحة تحكم الإدارة',
    ip: '192.168.1.10'
  }
];

const getBadgeStyles = (type: string) => {
  switch (type) {
    case 'إضافة':
      return 'bg-green-100 text-green-800';
    case 'تعديل':
      return 'bg-blue-100 text-blue-800';
    case 'حذف':
      return 'bg-red-100 text-red-800';
    case 'نظام':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const AuditLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('اليوم');
  const [actionFilter, setActionFilter] = useState('الكل');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" />
            سجل عمليات النظام (Audit Logs)
          </h1>
          <p className="text-slate-500 mt-1">
            مراقبة وتتبع جميع الإجراءات والتعديلات التي تتم على البوابة
          </p>
        </div>
        <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-all">
          <Download size={18} />
          تصدير السجل PDF/Excel
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث برقم الهوية، اسم المستخدم، أو الإجراء..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative min-w-[160px]">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium appearance-none"
            >
              <option value="اليوم">اليوم</option>
              <option value="آخر 7 أيام">آخر 7 أيام</option>
              <option value="هذا الشهر">هذا الشهر</option>
            </select>
          </div>

          <div className="relative min-w-[160px]">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium appearance-none"
            >
              <option value="الكل">الكل</option>
              <option value="إضافة">إضافة</option>
              <option value="تعديل">تعديل</option>
              <option value="حذف">حذف</option>
              <option value="نظام">نظام</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">التاريخ والوقت</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">المستخدم</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">نوع الإجراء</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">التفاصيل</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">عنوان IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{log.date}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{log.time}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{log.userName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{log.userRole}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getBadgeStyles(log.actionType)}`}>
                      {log.actionType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 max-w-md leading-relaxed">
                      {log.details}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {log.ip}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-sm text-slate-500 font-medium">
            عرض 1 إلى 5 من أصل 245 عملية
          </span>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:text-primary disabled:opacity-50 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:text-primary transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AuditLogs;
