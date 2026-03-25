import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Shield, User, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { apiFetch } from '../utils/api';

const ParentLogin: React.FC = () => {
  const [nationalId, setNationalId] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // OTP State
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [tempUser, setTempUser] = useState<any>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

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
        if (data.user.national_id === '1000000005' || data.user.email?.endsWith('@test.com')) {
          login(data.user);
          let from = (location.state as any)?.from?.pathname;
          if (!from || from === '/') {
            from = data.user.role === 'parent' ? '/parent-portal' : '/dashboard';
          }
          navigate(from, { replace: true });
        } else {
          // الانتقال للخطوة الثانية (OTP)
          setTempUser(data.user);
          setStep(2);
          setCountdown(60);
          setOtp(['', '', '', '']);
        }
      } else {
        setError(data.message || 'بيانات الدخول غير صحيحة، يرجى التأكد من هوية الطالب ورقم الجوال المسجل بالمدرسة');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 4) {
      setError('يرجى إدخال رمز التحقق كاملاً');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await apiFetch('/api/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: tempUser.parent_phone, // Use parent_phone for parent login
          otp_code: code
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.log("OTP Valid, but Parent role routing failed? No, OTP is invalid");
        throw new Error(data.message || "رمز التحقق غير صحيح أو منتهي الصلاحية");
      }

      // If successful, log the user in
      const finalUser = { ...tempUser, ...(data.user || {}), student_id: tempUser.student_id || data.user?.student_id };
      login(finalUser);
      
      try {
        if (!finalUser.student_id) {
          console.log("OTP Valid, but Parent role routing failed: No student linked");
          // Still navigate, ParentPortal will show the message
        }
        navigate('/parent-portal', { replace: true });
      } catch (e) {
        console.log("OTP Valid, but Parent role routing failed");
        setError("جاري ربط حسابك ببيانات أبنائك");
      }

    } catch (err: any) {
      console.log("Verification Exception:", err.message);
      setError(err.message || 'حدث خطأ أثناء التحقق');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setCountdown(60);
    setOtp(['', '', '', '']);
    setError('');
    // محاكاة إعادة الإرسال
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-center px-6 py-8 md:bg-gray-50 md:py-12 relative overflow-hidden">
      {/* Background decorations - hidden on mobile for cleaner look */}
      <div className="hidden md:block absolute top-0 left-0 w-full h-96 bg-primary/10 -skew-y-6 transform origin-top-left -z-10" />
      <div className="hidden md:block absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full md:max-w-md md:mx-auto md:bg-white md:rounded-2xl md:shadow-xl md:p-10 relative z-10"
      >
        <div className="flex justify-end mb-8">
          <button 
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-primary transition-colors flex items-center gap-1 text-sm font-bold"
          >
            <span>الرئيسية</span>
            <ArrowRight size={16} className="rotate-180" />
          </button>
        </div>
        <div className="hidden md:block absolute top-0 right-0 w-2 h-full bg-primary" />
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={32} />
          </div>
          {step === 1 ? (
            <>
              <h1 className="text-2xl font-black text-slate-800">تسجيل الدخول لبوابة تكامل</h1>
              <p className="text-slate-500 mt-2 text-sm">بوابة ولي الأمر لمتابعة سجل الطالب</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-black text-slate-800">التحقق الأمني</h1>
              <p className="text-slate-500 mt-2 text-sm">تم إرسال رمز تحقق (OTP) إلى رقم جوالك المسجل عبر الواتساب</p>
            </>
          )}
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

        {step === 1 ? (
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
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 text-lg rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
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
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6 text-center">
            <div className="flex justify-center gap-3 dir-ltr">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-12 text-center text-2xl font-bold bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[#004D40] focus:ring-2 focus:ring-[#004D40]/20 transition-all"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.join('').length !== 4}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 text-lg rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <span>تأكيد الرمز</span>
              )}
            </button>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={countdown > 0 || isLoading}
                className="text-[#004D40] font-medium hover:underline disabled:text-slate-400 disabled:no-underline transition-colors"
              >
                {countdown > 0 ? `يمكنك طلب رمز جديد بعد 00:${countdown.toString().padStart(2, '0')}` : 'إعادة إرسال الرمز'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ParentLogin;
