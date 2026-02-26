import React from 'react';
import { 
  Bell, 
  Lock, 
  User, 
  Shield, 
  Globe, 
  Smartphone,
  ChevronLeft
} from 'lucide-react';
import { motion } from 'motion/react';

const Settings: React.FC = () => {
  const sections = [
    {
      title: 'الحساب والأمان',
      items: [
        { icon: User, label: 'تعديل الملف الشخصي', desc: 'الاسم، البريد الإلكتروني، الصورة الشخصية' },
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

      <div className="pt-8 border-t border-slate-200 flex items-center justify-between text-slate-400 text-xs">
        <p>© 2024 نظام تحويل الطلاب - الإصدار 1.0.0</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-slate-600">سياسة الخصوصية</a>
          <a href="#" className="hover:text-slate-600">شروط الاستخدام</a>
        </div>
      </div>
    </div>
  );
};

export default Settings;
