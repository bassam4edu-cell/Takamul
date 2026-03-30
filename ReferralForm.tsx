import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, Calendar, ChevronRight, ChevronLeft, ShieldAlert, ChevronDown, ChevronUp, User, LayoutGrid, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuditLog } from '../services/auditLogger';

const getBadgeStyles = (type: string) => {
  switch (type) {
    case 'CREATE':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'UPDATE':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'DELETE':
      return 'bg-red-100 text-red-800 border border-red-200';
    case 'LOGIN':
    case 'LOGOUT':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

const getActionLabel = (type: string) => {
  switch (type) {
    case 'CREATE': return 'إضافة';
    case 'UPDATE': return 'تعديل';
    case 'DELETE': return 'حذف';
    case 'LOGIN': return 'تسجيل دخول';
    case 'LOGOUT': return 'تسجيل خروج';
    default: return type;
  }
};

const AuditLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('الكل');
  const [actionFilter, setActionFilter] = useState('الكل');
  const [roleFilter, setRoleFilter] = useState('الكل');
  const [userFilter, setUserFilter] = useState('الكل');
  const [moduleFilter, setModuleFilter] = useState('الكل');
  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const uniqueRoles = Array.from(new Set(auditLog.map(log => log.actor?.role).filter(Boolean)));
  const uniqueUsers = Array.from(new Set(auditLog.map(log => log.actor?.name).filter(Boolean)));
  const uniqueModules = Array.from(new Set(auditLog.map(log => log.module).filter(Boolean)));

  useEffect(() => {
    const fetchLogs = () => {
      const logsStr = localStorage.getItem('takamol_audit_logs');
      if (logsStr) {
        setAuditLog(JSON.parse(logsStr));
      }
    };

    fetchLogs();
    window.addEventListener('takamol_audit_logs_updated', fetchLogs);
    return () => window.removeEventListener('takamol_audit_logs_updated', fetchLogs);
  }, []);

  const filteredLogs = auditLog.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
                          (log.detailedMessage?.toLowerCase().includes(searchLower)) || 
                          (log.actor?.name?.toLowerCase().includes(searchLower)) || 
                          (log.actionType && getActionLabel(log.actionType).toLowerCase().includes(searchLower)) ||
                          (log.module?.toLowerCase().includes(searchLower));
    
    const matchesAction = actionFilter === 'الكل' || log.actionType === actionFilter;
    const matchesRole = roleFilter === 'الكل' || log.actor?.role === roleFilter;
    const matchesUser = userFilter === 'الكل' || log.actor?.name === userFilter;
    const matchesModule = moduleFilter === 'الكل' || log.module === moduleFilter;
    
    return matchesSearch && matchesAction && matchesRole && matchesUser && matchesModule;
  });

  const toggleExpand = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

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
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
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
          
          <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
            <div className="relative min-w-[160px]">
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium appearance-none"
              >
                <option value="الكل">الكل (تاريخ)</option>
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
                <option value="الكل">كل الإجراءات</option>
                <option value="CREATE">إضافة</option>
                <option value="UPDATE">تعديل</option>
                <option value="DELETE">حذف</option>
                <option value="LOGIN">تسجيل دخول</option>
                <option value="LOGOUT">تسجيل خروج</option>
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
          <div className="relative min-w-[160px] flex-1 md:flex-none">
            <Shield className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium appearance-none"
            >
              <option value="الكل">كل الصلاحيات</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div className="relative min-w-[160px] flex-1 md:flex-none">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium appearance-none"
            >
              <option value="الكل">كل المستخدمين</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>

          <div className="relative min-w-[160px] flex-1 md:flex-none">
            <LayoutGrid className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium appearance-none"
            >
              <option value="الكل">كل الوحدات</option>
              {uniqueModules.map(mod => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
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
                <th className="px-6 py-4 text-sm font-bold text-slate-600">الوحدة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">نوع الإجراء</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">التفاصيل</th>
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
                  const isExpanded = expandedRowId === log.id;
                  const hasDiff = log.actionType === 'UPDATE' && log.stateDiff;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800" dir="ltr">{log.timestamp}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{log.actor?.name || 'غير معروف'}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{log.actor?.role || ''} - {log.actor?.id || ''}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{log.module}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{log.actionCategory}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getBadgeStyles(log.actionType)}`}>
                            {getActionLabel(log.actionType)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
                              {log.detailedMessage}
                            </p>
                            {hasDiff && (
                              <button
                                onClick={() => toggleExpand(log.id)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors flex-shrink-0"
                                title="عرض التغييرات"
                              >
                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      <AnimatePresence>
                        {isExpanded && hasDiff && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <td colSpan={5} className="px-6 pb-4 pt-2 bg-slate-50/50 border-b border-slate-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-red-50/50 border border-red-100 rounded-lg p-4">
                                  <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2">القيمة القديمة (Old Value)</h4>
                                  <pre className="text-sm text-red-600 whitespace-pre-wrap font-mono overflow-x-auto">
                                    {JSON.stringify(log.stateDiff?.old, null, 2)}
                                  </pre>
                                </div>
                                <div className="bg-green-50/50 border border-green-100 rounded-lg p-4">
                                  <h4 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2">القيمة الجديدة (New Value)</h4>
                                  <pre className="text-sm text-green-600 whitespace-pre-wrap font-mono overflow-x-auto">
                                    {JSON.stringify(log.stateDiff?.new, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
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
