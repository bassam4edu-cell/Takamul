import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { ShieldCheck, Lock, Mail, ChevronRight, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';
import Logo from '../components/Logo';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'vice_principal' | 'counselor' | 'admin' | 'principal'>('teacher');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'فشل تسجيل الدخول' }));
        throw new Error(errorData.message || 'فشل تسجيل الدخول');
      }

      const data = await response.json().catch(() => ({ success: false, message: 'استجابة غير صالحة من السيرفر' }));

      if (data.success) {
        login(data.user);
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setError(data.message || 'بيانات الدخول غير صحيحة');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Left Side: Brand & Logo */}
      <div className="md:w-1/2 bg-gradient-to-br from-primary-dark via-primary to-primary-light flex items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative background patterns */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center text-center"
        >
          <h2 className="text-white font-extrabold text-2xl mb-8">ثانوية أم القرى بالخرج</h2>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">نظام تحويل طالب</h1>
          <p className="text-white/80 text-lg md:text-xl font-medium tracking-wide">Student Transfer System</p>
        </motion.div>
        
        {/* Abstract shapes */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Right Side: Login Form */}
      <div className="md:w-1/2 flex items-center justify-center p-8 md:p-16 bg-bg-light">
        <div className="max-w-md w-full">
          <div className="mb-10 flex flex-col items-center text-center">
            <img 
              src="https://i.ibb.co/ZzPTFG3y/222.png" 
              alt="شعار وزارة التعليم" 
              className="w-40 h-40 mb-2 object-contain"
              referrerPolicy="no-referrer"
            />
            <h3 className="text-primary font-extrabold text-xl mb-6">ثانوية أم القرى بالخرج</h3>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">تسجيل دخول آمن</h2>
            <p className="text-slate-500">يرجى إدخال بياناتك للوصول إلى لوحة التحكم</p>
          </div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3 mr-1">نوع الحساب</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-slate-100 rounded-2xl">
                  {(['teacher', 'vice_principal', 'counselor', 'admin', 'principal'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-1 rounded-xl text-[10px] font-bold transition-all ${
                        role === r 
                          ? 'bg-white text-primary shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {r === 'teacher' ? 'معلم' : r === 'vice_principal' ? 'وكيل' : r === 'counselor' ? 'موجه' : r === 'admin' ? 'أدمن' : 'مدير'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="sts-input pr-12"
                    required
                  />
                </div>

                <div className="relative group">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    placeholder="كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="sts-input pr-12"
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-500 text-sm text-center bg-red-50 py-3 rounded-xl border border-red-100 font-medium"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full sts-button-accent flex items-center justify-center gap-2 group disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>دخول النظام</span>
                    <ChevronRight size={20} className="group-hover:translate-x-[-4px] transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-slate-100 text-center space-y-4">
              <div className="flex items-center justify-center gap-4">
                <button className="text-xs font-bold text-slate-400 hover:text-primary transition-colors">إنشاء حساب</button>
                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                <button className="text-xs font-bold text-slate-400 hover:text-primary transition-colors">نسيت كلمة المرور</button>
              </div>
              <div className="text-[10px] text-slate-400 space-y-1">
                <p>© 2026 نظام تحويل الطلاب الذكي. جميع الحقوق محفوظة.</p>
                <p className="font-bold text-primary/60">برمجة: بسام غربي العنزي</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
