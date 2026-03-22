import { apiFetch } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, ChevronRight, User as UserIcon, ArrowRight, X, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from '../components/Logo';

const ForgotPasswordModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'identifier' | 'otp' | 'new_password' | 'success'>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('identifier');
      setIdentifier('');
      setOtp(['', '', '', '']);
      setNewPassword('');
      setError('');
      setUserId(null);
    }
  }, [isOpen]);

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUserId(data.user_id);
        setPhoneNumber(data.phone_number);
        
        // Send WhatsApp message
        try {
          const otpMessage = `مرحباً بك في منصة المدرسة.\nكود استعادة كلمة المرور الخاص بك هو: *${data.otp_code}*\nيرجى إدخاله لإكمال العملية.`;
          const waResponse = await apiFetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: data.phone_number, message: otpMessage })
          });
          const waData = await waResponse.json();
          if (!waResponse.ok || !waData.success) {
            setError("️ تعذر إرسال كود التحقق. يرجى التأكد من ربط الواتساب.");
            setLoading(false);
            return;
          }
          setStep('otp');
        } catch (err) {
          setError(" خطأ في الاتصال بالخادم أثناء إرسال الرسالة.");
        }
      } else {
        setError(data.message || 'لم يتم العثور على حساب');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 4) {
      setError('يرجى إدخال كود التحقق كاملاً');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/api/verify-forgot-password-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, otp_code: otpCode })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStep('new_password');
      } else {
        setError(data.message || 'كود التحقق غير صحيح');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, otp_code: otp.join(''), new_password: newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStep('success');
      } else {
        setError(data.message || 'حدث خطأ أثناء تغيير كلمة المرور');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold text-slate-800">استعادة كلمة المرور</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          {step === 'identifier' && (
            <form onSubmit={handleIdentifierSubmit} className="space-y-4">
              <p className="text-slate-600 text-sm mb-4">أدخل رقم الجوال أو البريد الإلكتروني المسجل في النظام لإرسال كود التحقق عبر الواتساب.</p>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <UserIcon size={20} />
                </div>
                <input
                  type="text"
                  placeholder="رقم الجوال أو البريد الإلكتروني"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-12 pl-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !identifier}
                className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold transition-all disabled:opacity-70 flex justify-center items-center"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'إرسال كود التحقق'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-6 text-center">
              <p className="text-slate-600 text-sm mb-4">تم إرسال كود التحقق إلى الرقم {phoneNumber}</p>
              <div className="flex justify-center gap-3 dir-ltr">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`f-otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={4}
                    value={digit}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.length > 1) {
                        const pastedData = val.replace(/\D/g, '').slice(0, 4);
                        if (pastedData) {
                          const newOtp = [...otp];
                          for (let i = 0; i < pastedData.length; i++) {
                            if (index + i < 4) {
                              newOtp[index + i] = pastedData[i];
                            }
                          }
                          setOtp(newOtp);
                          const nextIndex = Math.min(index + pastedData.length, 3);
                          document.getElementById(`f-otp-${nextIndex}`)?.focus();
                        }
                        return;
                      }
                      if (!/^\d*$/.test(val)) return;
                      const newOtp = [...otp];
                      newOtp[index] = val;
                      setOtp(newOtp);
                      if (val && index < 3) document.getElementById(`f-otp-${index + 1}`)?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otp[index] && index > 0) {
                        document.getElementById(`f-otp-${index - 1}`)?.focus();
                      }
                    }}
                    className="w-12 h-12 text-center text-xl font-bold bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={loading || otp.join('').length !== 4}
                className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold transition-all disabled:opacity-70 flex justify-center items-center"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'تأكيد الكود'}
              </button>
            </form>
          )}

          {step === 'new_password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <p className="text-slate-600 text-sm mb-4">أدخل كلمة المرور الجديدة.</p>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  placeholder="كلمة المرور الجديدة"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-12 pl-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-left dir-ltr"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || newPassword.length < 6}
                className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold transition-all disabled:opacity-70 flex justify-center items-center"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'حفظ كلمة المرور'}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">تم تغيير كلمة المرور بنجاح</h3>
              <p className="text-slate-600 mb-6">يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.</p>
              <button
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold transition-all"
              >
                العودة لتسجيل الدخول
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  
  // OTP State
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [tempUser, setTempUser] = useState<any>(null);
  
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    if ((location.state as any)?.openForgotModal) {
      setIsForgotModalOpen(true);
      // Clean up state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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
    setLoading(true);

    try {
      const response = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'فشل تسجيل الدخول' }));
        throw new Error(errorData.message || 'فشل تسجيل الدخول');
      }

      const data = await response.json().catch(() => ({ success: false, message: 'استجابة غير صالحة من السيرفر' }));

      if (data.success) {
        // Simulate a slight delay for smooth UX
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (data.user.role === 'admin' || data.user.email.endsWith('@test.com')) {
          // تخطي التحقق الثنائي (OTP) للمدير وحسابات التجربة
          login(data.user);
          let from = (location.state as any)?.from?.pathname;
          if (!from || from === '/') {
            from = '/dashboard';
          }
          navigate(from, { replace: true });
        } else {
          // الانتقال للخطوة الثانية (OTP) لباقي المستخدمين
          setTempUser(data.user);
          setStep(2);
          setCountdown(60);
          setOtp(['', '', '', '']);
        }
      } else {
        setError(data.message || 'بيانات الدخول غير صحيحة');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
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
    
    setLoading(true);
    setError('');
    
    // محاكاة التحقق (Mock Logic)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (code === '1234') {
      login(tempUser);
      let from = (location.state as any)?.from?.pathname;
      if (!from || from === '/') {
        from = '/dashboard';
      }
      navigate(from, { replace: true });
    } else {
      setError('رمز التحقق غير صحيح');
    }
    setLoading(false);
  };

  const handleResendOTP = async () => {
    setCountdown(60);
    setOtp(['', '', '', '']);
    setError('');
    // محاكاة إعادة الإرسال
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Left Side: Brand & Logo */}
      <div 
        className="hidden lg:flex flex-col items-center justify-center w-1/2 relative text-white"
        style={{
          backgroundImage: "url('https://i.ibb.co/Q3DjYLxk/Gemini-Generated-Image-xq25icxq25icxq25.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: 'transparent' // إجبار إزالة أي لون خلفية
        }}
      >
        {/* طبقة تظليل خفيفة (Overlay) لضمان وضوح الشعار والنص فوق الصورة */}
        <div className="absolute inset-0 bg-black/40 z-0"></div>

        {/* محتوى الشعار والنص (يجب أن يكون z-10 ليكون فوق التظليل) */}
        <div className="relative z-10 flex flex-col items-center">
          {/* ضع كود صورة الشعار (logo) هنا */}
          <img 
            src="https://i.ibb.co/ZzPTFG3y/222.png" 
            alt="شعار بوابة تكامل" 
            className="w-40 h-40 object-contain"
            referrerPolicy="no-referrer"
          />
          
          <h1 className="text-4xl font-bold mt-6 mb-2">بوابة تكامل</h1>
          <p className="text-lg opacity-90">Takamul Gate</p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="min-h-screen w-full bg-white flex flex-col justify-center px-6 py-8 md:w-1/2 md:min-h-0 md:bg-gray-50 md:py-12 relative">
        <div className="w-full md:max-w-md md:mx-auto md:bg-white md:rounded-2xl md:shadow-xl md:p-10">
          <div className="flex justify-end mb-8">
            <button 
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-primary transition-colors flex items-center gap-1 text-sm font-bold"
            >
              <span>الرئيسية</span>
              <ArrowRight size={16} className="rotate-180" />
            </button>
          </div>
          <div className="mb-10 flex flex-col items-center text-center">
            {step === 1 ? (
              <>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">تسجيل دخول آمن</h2>
                <p className="text-slate-500">يرجى إدخال بياناتك للوصول إلى لوحة التحكم</p>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">التحقق الأمني</h2>
                <p className="text-slate-500">تم إرسال رمز تحقق (OTP) إلى رقم جوالك المسجل عبر الواتساب</p>
              </>
            )}
          </div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {step === 1 ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-5">
                  <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                      <Mail size={20} />
                    </div>
                    <input
                      type="email"
                      placeholder="البريد الإلكتروني"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="sts-input pr-12 w-full"
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
                      className="sts-input pr-12 w-full"
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
                  className="w-full py-3 text-lg sts-button-accent flex items-center justify-center gap-2 group disabled:opacity-70"
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
                  disabled={loading || otp.join('').length !== 4}
                  className="w-full py-3 text-lg sts-button-accent flex items-center justify-center gap-2 group disabled:opacity-70"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>تأكيد الرمز</span>
                  )}
                </button>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || loading}
                    className="text-[#004D40] font-medium hover:underline disabled:text-slate-400 disabled:no-underline transition-colors"
                  >
                    {countdown > 0 ? `يمكنك طلب رمز جديد بعد 00:${countdown.toString().padStart(2, '0')}` : 'إعادة إرسال الرمز'}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-12 pt-8 border-t border-slate-100 text-center space-y-4">
              <div className="flex flex-col gap-4 items-center">
                <button 
                  type="button"
                  onClick={() => navigate('/parent-login')}
                  className="text-sm font-bold text-primary hover:text-indigo-600 transition-colors flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl"
                >
                  <UserIcon size={16} />
                  <span>دخول ولي الأمر</span>
                </button>
              </div>
              <div className="flex items-center justify-center gap-4 mt-4">
                <button type="button" onClick={() => navigate('/register')} className="text-xs font-bold text-slate-400 hover:text-primary transition-colors">إنشاء حساب</button>
                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                <button type="button" onClick={() => setIsForgotModalOpen(true)} className="text-xs font-bold text-slate-400 hover:text-primary transition-colors">نسيت كلمة المرور</button>
              </div>
              <div className="text-[10px] text-slate-400 space-y-1">
                <p> 2026 بوابة تكامل. جميع الحقوق محفوظة.</p>
                <p className="font-bold text-primary/60">برمجة: بسام غربي العنزي</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      <AnimatePresence>
        {isForgotModalOpen && (
          <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
