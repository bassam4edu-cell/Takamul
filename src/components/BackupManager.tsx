import React, { useState, useEffect } from 'react';
import { Download, Trash2, RefreshCw, Database, HardDrive, Calendar, AlertCircle } from 'lucide-react';
import { apiFetch } from '../utils/api';

interface Backup {
  filename: string;
  size: number;
  date: string;
  type: 'auto' | 'manual';
}

interface BackupStats {
  total: number;
  totalSize: number;
  oldest: string | null;
  newest: string | null;
  auto: number;
  manual: number;
}

export const BackupManager: React.FC = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadBackups();
    loadStats();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/backups');
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups);
      }
    } catch (err) {
      console.error('Failed to load backups:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await apiFetch('/api/admin/backups/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const createBackup = async () => {
    if (creating) return;
    
    const confirmed = window.confirm('هل تريد إنشاء نسخة احتياطية يدوية الآن؟\n\nقد يستغرق الأمر عدة دقائق حسب حجم قاعدة البيانات.');
    if (!confirmed) return;

    setCreating(true);
    try {
      const res = await apiFetch('/api/admin/backups/create', {
        method: 'POST'
      });
      
      if (res.ok) {
        alert('✅ تم إنشاء النسخة الاحتياطية بنجاح!');
        loadBackups();
        loadStats();
      } else {
        alert('❌ فشل إنشاء النسخة الاحتياطية');
      }
    } catch (err) {
      console.error('Failed to create backup:', err);
      alert('❌ حدث خطأ أثناء إنشاء النسخة الاحتياطية');
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = async (filename: string) => {
    window.location.href = `/api/admin/backups/download/${filename}`;
  };

  const deleteBackup = async (filename: string) => {
    const confirmed = window.confirm(`هل تريد حذف النسخة الاحتياطية:\n${filename}\n\nهذا الإجراء لا يمكن التراجع عنه.`);
    if (!confirmed) return;

    try {
      const res = await apiFetch(`/api/admin/backups/${filename}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        alert('✅ تم حذف النسخة الاحتياطية');
        loadBackups();
        loadStats();
      } else {
        alert('❌ فشل حذف النسخة الاحتياطية');
      }
    } catch (err) {
      console.error('Failed to delete backup:', err);
      alert('❌ حدث خطأ أثناء حذف النسخة الاحتياطية');
    }
  };

  const formatSize = (bytes: number): string => {
    const sizes = ['بايت', 'كيلوبايت', 'ميغابايت', 'جيجابايت'];
    if (bytes === 0) return '0 بايت';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">النسخ الاحتياطية</h2>
          <p className="text-sm text-slate-500 mt-1">إدارة النسخ الاحتياطية لقاعدة البيانات</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadBackups}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            تحديث
          </button>
          <button
            onClick={createBackup}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Database size={18} />
            {creating ? 'جاري الإنشاء...' : 'نسخة احتياطية يدوية'}
          </button>
        </div>
      </div>

      {/* Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">النسخ الاحتياطية التلقائية</p>
            <p className="text-blue-700">يتم إنشاء نسخة احتياطية تلقائياً كل يوم في الساعة 2:00 صباحاً. يتم الاحتفاظ بآخر 30 نسخة فقط.</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">إجمالي النسخ</p>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <HardDrive className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">المساحة المستخدمة</p>
                <p className="text-2xl font-bold text-slate-800">{formatSize(stats.totalSize)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">تلقائية</p>
                <p className="text-2xl font-bold text-slate-800">{stats.auto}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-amber-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">يدوية</p>
                <p className="text-2xl font-bold text-slate-800">{stats.manual}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backups Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">اسم الملف</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">النوع</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">الحجم</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                    جاري التحميل...
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    لا توجد نسخ احتياطية
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.filename} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Database size={18} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700 font-mono">
                          {backup.filename}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        backup.type === 'auto' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {backup.type === 'auto' ? '🤖 تلقائية' : '✋ يدوية'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(backup.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatSize(backup.size)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadBackup(backup.filename)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تحميل"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => deleteBackup(backup.filename)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restore Instructions */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">⚠️ استعادة النسخة الاحتياطية</h3>
        <p className="text-sm text-slate-600 mb-3">
          لأسباب أمنية، لا يمكن استعادة النسخة الاحتياطية من الواجهة. يجب القيام بذلك يدوياً عبر سطر الأوامر:
        </p>
        <pre className="bg-slate-800 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto font-mono" dir="ltr">
{`# 1. حمّل الملف أولاً
# 2. ثم نفذ الأمر:
pg_restore -h localhost -U postgres -d school_management backup_file.sql`}
        </pre>
      </div>
    </div>
  );
};
