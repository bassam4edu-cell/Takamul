import React, { useState } from 'react';
import { 
  Bell, 
  Lock, 
  User as UserIcon, 
  Shield, 
  Globe, 
  Smartphone,
  ChevronLeft,
  Save,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../App';

const Settings: React.FC = () => {
  const { user, login } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'admin') {
      alert('عذراً، لا تملك الصلاحية لتعديل البيانات. يرجى مراجعة المسؤول.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user?.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      if (res.ok) {
        const updatedUser = { ...user!, ...profileForm };
        login(updatedUser);
        setIsEditingProfile(false);
        alert('تم تحديث الملف الشخصي بنجاح');
      }
    } catch (err) {
      alert('فشل تحديث الملف الشخصي');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    {
      title: 'الحساب والأمان',
      items: [
        ...(user?.role === 'admin' ? [{ 
          icon: UserIcon, 
          label: 'تعديل الملف الشخصي', 
          desc: 'الاسم، البريد الإلكتروني، الصورة الشخصية',
          onClick: () => setIsEditingProfile(true)
        }] : [{
          icon: UserIcon, 
          label: 'عرض الملف الشخصي', 
          desc: 'الاسم، البريد الإلكتروني (للتعديل يرجى مراجعة المسؤول)',
          onClick: () => setIsEditingProfile(true)
        }]),
        { icon: Lock, label: 'كلمة المرور', desc: 'تحديث كلمة المرور وإعدادات الأمان' },
        { icon: Shield, label: 'الخصوصية', desc: 'إدارة ظهور البيانات والصلاحيات' },
      ]
    },
    {
      title: 'التنبيهات',
      items: [
        { icon: Bell, label: 'تنبيهات النظام', desc: 'إشعارات التحويلات الجديدة وتحديثات الحالات' },
        { icon: Smartphone, label: 'تنبيهات الجوال', desc: 'رسائل نصية وتنبيهات التطبيق' },
      ]
    },
    {
      title: 'عام',
      items: [
        { icon: Globe, label: 'اللغة والمنطقة', desc: 'العربية (المملكة العربية السعودية)' },
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">الإعدادات</h1>
        <p className="text-slate-500">إدارة تفضيلات حسابك وإعدادات النظام.</p>
      </div>

      {isEditingProfile ? (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-[2rem] card-shadow border border-slate-100 p-8 space-y-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">
              {user?.role === 'admin' ? 'تعديل الملف الشخصي' : 'عرض الملف الشخصي'}
            </h2>
            <button onClick={() => setIsEditingProfile(false)} className="text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 mr-1">الاسم الكامل</label>
              <input 
                type="text"
                required
                disabled={user?.role !== 'admin'}
                value={profileForm.name}
                onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none disabled:opacity-70"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 mr-1">البريد الإلكتروني</label>
              <input 
                type="email"
                required
                disabled={user?.role !== 'admin'}
                value={profileForm.email}
                onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none disabled:opacity-70"
              />
            </div>
            {user?.role === 'admin' && (
              <button 
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
              >
                <Save size={20} />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
              </button>
            )}
            {user?.role !== 'admin' && (
              <div className="p-4 bg-amber-50 text-amber-700 rounded-2xl text-xs font-bold border border-amber-100 flex items-center gap-3">
                <Shield size={18} />
                <span>لتعديل بياناتك، يرجى التواصل مع مدير النظام.</span>
              </div>
            )}
          </form>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {sections.map((section, i) => (
            <motion.div 
              key={section.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="space-y-4"
            >
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mr-2">{section.title}</h2>
              <div className="bg-white rounded-[2rem] card-shadow border border-slate-100 overflow-hidden">
                <div className="divide-y divide-slate-50">
                  {section.items.map((item) => (
                    <button 
                      key={item.label}
                      onClick={item.onClick}
                      className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <item.icon size={22} />
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-800">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                      <ChevronLeft size={20} className="text-slate-300 group-hover:text-slate-600 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="pt-8 border-t border-slate-200 flex items-center justify-between text-slate-400 text-[10px] font-bold">
        <div className="space-y-1">
          <p>© 2026 نظام تحويل الطلاب - الإصدار 1.0.0</p>
          <p className="text-primary/60">برمجة: بسام غربي العنزي</p>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-slate-600">سياسة الخصوصية</a>
          <a href="#" className="hover:text-slate-600">شروط الاستخدام</a>
        </div>
      </div>
    </div>
  );
};

export default Settings;
