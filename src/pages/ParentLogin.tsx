import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Shield, User, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { apiFetch } from '../utils/api';

const ParentLogin: React.FC = () => {
  const [nationalId, setNationalId] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login } = useAuth();

  useEffect(() => {
    if (user?.role === 'parent') {
      navigate('/parent-portal');
    } else if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    let formattedPhone = parentPhone.trim();
    if (formattedPhone.startsWith('05')) {
      formattedPhone = '966' + formattedPhone.substring(1);
    }
    if (formattedPhone.startsWith('+966')) {
      formattedPhone = formattedPhone.substring(1);
    }

    try {
      const response = await apiFetch('/api/parent-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ national_id: nationalId, parent_phone: formattedPhone }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        login(data.user);
        navigate('/parent-portal');
      } else {
        setError(data.message || 'بيانات الدخول غير صحيحة، يرجى التأكد من هوية الطالب ورقم الجوال المسجل بالمدرسة');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-96 bg-primary/10 -skew-y-6 transform origin-top-left -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-100 relative overflow-hidden">
          <button 
            onClick={() => navigate('/')}
            className="absolute top-6 left-6 text-slate-400 hover:text-primary transition-colors flex items-center gap-1 text-sm font-bold z-10"
          >
            <span>الرئيسية</span>
            <ArrowRight size={16} className="rotate-180" />
          </button>
          <div className="absolute top-0 right-0 w-2 h-full bg-primary" />
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-800">تسجيل الدخول لبوابة تكامل</h1>
            <p className="text-slate-500 mt-2 text-sm">بوابة ولي الأمر لمتابعة سجل الطالب</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 border border-red-100"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">رقم هوية الطالب</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-left"
                  placeholder="أدخل رقم الهوية"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">رقم الجوال المسجل</label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-left"
                  placeholder="05XXXXXXXX"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ParentLogin;
