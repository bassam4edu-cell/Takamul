import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Smartphone, Save, BellOff } from 'lucide-react';
import { logAction } from '../services/auditLogger';

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    whatsapp_notif_enabled: false,
    whatsapp_notif_counselor: false,
    whatsapp_notif_deputy: false,
    whatsapp_notif_teachers: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiFetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings({
          whatsapp_notif_enabled: data.whatsapp_notif_enabled === 'true',
          whatsapp_notif_counselor: data.whatsapp_notif_counselor === 'true',
          whatsapp_notif_deputy: data.whatsapp_notif_deputy === 'true',
          whatsapp_notif_teachers: data.whatsapp_notif_teachers === 'true',
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            whatsapp_notif_enabled: settings.whatsapp_notif_enabled.toString(),
            whatsapp_notif_counselor: settings.whatsapp_notif_counselor.toString(),
            whatsapp_notif_deputy: settings.whatsapp_notif_deputy.toString(),
            whatsapp_notif_teachers: settings.whatsapp_notif_teachers.toString(),
          }
        })
      });
      if (res.ok) {
        logAction(
          'أخرى',
          'UPDATE',
          'إعدادات النظام',
          'قام بتحديث إعدادات إشعارات الواتساب للنظام'
        );
        alert('تم حفظ الإعدادات بنجاح');
      } else {
        alert('فشل حفظ الإعدادات');
      }
    } catch (err) {
      console.error(err);
      alert('فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sts-card p-10 space-y-8 border-none shadow-2xl shadow-slate-200/50">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
          <Smartphone size={24} />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-800"> إعدادات إشعارات الواتساب</h2>
          <p className="text-sm text-slate-500 font-bold mt-1">تفعيل أو تعطيل إرسال إشعارات الواتساب للمستخدمين، أو الاكتفاء بإشعارات النظام.</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-center justify-between p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 cursor-pointer hover:border-emerald-300 transition-colors">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.whatsapp_notif_enabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {settings.whatsapp_notif_enabled ? <Smartphone size={20} /> : <BellOff size={20} />}
            </div>
            <div>
              <span className="font-black text-slate-800 block text-lg">تفعيل إشعارات الواتساب للنظام بالكامل</span>
              <span className="text-xs text-slate-500 font-bold">في حال التعطيل، سيتم الاكتفاء بإشعارات النظام الداخلية فقط لجميع المستخدمين.</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.whatsapp_notif_enabled}
            onChange={(e) => setSettings({ ...settings, whatsapp_notif_enabled: e.target.checked })}
            className="w-6 h-6 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
        </label>

        {settings.whatsapp_notif_enabled && (
          <div className="pl-4 border-r-2 border-emerald-100 space-y-3 mt-4 mr-4 pr-4">
            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:border-emerald-200 transition-colors">
              <input
                type="checkbox"
                checked={settings.whatsapp_notif_counselor}
                onChange={(e) => setSettings({ ...settings, whatsapp_notif_counselor: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-bold text-slate-700">تفعيل إشعارات الواتساب للموجه الطلابي</span>
            </label>

            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:border-emerald-200 transition-colors">
              <input
                type="checkbox"
                checked={settings.whatsapp_notif_deputy}
                onChange={(e) => setSettings({ ...settings, whatsapp_notif_deputy: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-bold text-slate-700">تفعيل إشعارات الواتساب للوكيل</span>
            </label>

            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:border-emerald-200 transition-colors">
              <input
                type="checkbox"
                checked={settings.whatsapp_notif_teachers}
                onChange={(e) => setSettings({ ...settings, whatsapp_notif_teachers: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-bold text-slate-700">تفعيل إشعارات الواتساب للمعلمين</span>
            </label>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
