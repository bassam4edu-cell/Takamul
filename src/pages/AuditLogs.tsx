import React, { useState } from 'react';
import { Search, Download, Filter, Calendar, ChevronRight, ChevronLeft, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuditLog } from '../context/AuditLogContext';
import { formatHijriDateTime } from '../utils/dateUtils';

const getBadgeStyles = (type: string) => {
  switch (type) {
    case 'ADD_TASK':
    case 'إضافة':
      return 'bg-green-100 text-green-800';
    case 'UPDATE_GRADE':
    case 'تعديل':
      return 'bg-blue-100 text-blue-800';
    case 'حذف':
      return 'bg-red-100 text-red-800';
    case 'ATTENDANCE':
    case 'نظام':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getActionLabel = (type: string) => {
  switch (type) {
    case 'ADD_TASK': return 'إضافة مهمة';
    case 'UPDATE_GRADE': return 'تعديل درجة';
    case 'ATTENDANCE': return 'تسجيل حضور';
    default: return type;
  }
};

const AuditLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('اليوم');
  const [actionFilter, setActionFilter] = useState('الكل');
  const { auditLog } = useAuditLog();

  const filteredLogs = auditLog.filter(log => {
    const matchesSearch = log.details.includes(searchTerm) || 
                          (log.userName && log.userName.includes(searchTerm)) || 
                          getActionLabel(log.actionType).includes(searchTerm);
    
    const matchesAction = actionFilter === 'الكل' || getActionLabel(log.actionType) === actionFilter;
    
    return matchesSearch && matchesAction;
  });

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
              <option value="إضافة مهمة">إضافة مهمة</option>
              <option value="تعديل درجة">تعديل درجة</option>
              <option value="تسجيل حضور">تسجيل حضور</option>
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
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                    لا توجد عمليات مسجلة حتى الآن
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{formatHijriDateTime(log.timestamp)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{log.userName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{log.userRole}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getBadgeStyles(log.actionType)}`}>
                          {getActionLabel(log.actionType)}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredLogs.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-sm text-slate-500 font-medium">
              عرض 1 إلى {filteredLogs.length} من أصل {filteredLogs.length} عملية
            </span>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:text-primary disabled:opacity-50 transition-colors" disabled>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:text-primary disabled:opacity-50 transition-colors" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AuditLogs;
