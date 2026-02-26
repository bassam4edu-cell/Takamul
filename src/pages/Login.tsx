import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { ShieldCheck, Lock, Mail, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'vice_principal' | 'counselor' | 'admin'>('teacher');
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

      const data = await response.json();

      if (data.success) {
        login(data.user);
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        setError('بيانات الدخول غير صحيحة');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl text-white mb-6 shadow-xl shadow-blue-200"
          >
            <ShieldCheck size={40} />
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">نظام تحويل الطلاب</h1>
          <p className="text-slate-500">سجل دخولك للمتابعة إلى لوحة التحكم</p>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-[2rem] card-shadow border border-slate-100"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 mr-1">نوع الحساب</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-slate-100 rounded-2xl">
                {(['teacher', 'vice_principal', 'counselor', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                      role === r 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {r === 'teacher' ? 'معلم' : r === 'vice_principal' ? 'وكيل' : r === 'counselor' ? 'موجه' : 'أدمن'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pr-12 pl-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="password"
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pr-12 pl-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-xl border border-red-100">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
            >
              {loading ? 'جاري التحقق...' : (
                <>
                  <span>تسجيل الدخول</span>
                  <ChevronRight size={20} className="group-hover:translate-x-[-4px] transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              نسيت كلمة المرور؟ <a href="#" className="text-blue-600 font-semibold hover:underline">تواصل مع الإدارة</a>
            </p>
          </div>
        </motion.div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">© 2024 نظام تحويل الطلاب الذكي. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
