import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, User, Mail, Lock, Phone, CreditCard, ArrowRight, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { apiFetch } from '../utils/api';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);
  
  const [formData, setFormData] = useState({
    name: '',
    national_id: '',
    phone_number: '',
    email: '',
    password: '',
    role: 'teacher'
  });

  const [otp, setOtp] = useState(['', '', '', '']);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow 1 char
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
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

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);

    let formattedPhone = formData.phone_number.trim();
    if (formattedPhone.startsWith('05')) {
      formattedPhone = '966' + formattedPhone.substring(1);
    }
    if (formattedPhone.startsWith('+966')) {
      formattedPhone = formattedPhone.substring(1);
    }

    try {
      const response = await apiFetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, phone_number: formattedPhone }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Send OTP via backend API
        try {
          const otpMessage = `مرحباً بك في منصة المدرسة.\nكود التحقق الخاص بك هو: *${data.otp_code}*\nيرجى إدخاله لإكمال التسجيل.`;
          
          const waResponse = await apiFetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phoneNumber: formData.phone_number,
              message: otpMessage
            })
          });
          
          const responseData = await waResponse.json();
          
          if (!waResponse.ok || !responseData.success) {
            setError("⚠️ تعذر إرسال كود التحقق: " + (responseData.message || "خطأ غير معروف"));
            console.error("WhatsApp API Error:", responseData);
            return; // أوقف العملية
          }
          
          console.log("WhatsApp API Success:", responseData);
          // أظهر شاشة إدخال الـ OTP للمستخدم (Success State)
          setStep('otp');
          setCountdown(30);
          
        } catch (error: any) {
          setError("🔌 خطأ في الاتصال بالخادم أثناء إرسال الرسالة: " + error.message);
          return;
        }
      } else {
        setError(data.message || 'حدث خطأ أثناء التسجيل');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 4) {
      setError('يرجى إدخال كود التحقق كاملاً');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await apiFetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp_code: otpCode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStep('success');
      } else {
        setError(data.message || 'كود التحقق غير صحيح');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
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
            onClick={() => navigate('/login')}
            className="absolute top-6 left-6 text-slate-400 hover:text-primary transition-colors flex items-center gap-1 text-sm font-bold z-10"
          >
            <span>رجوع</span>
            <ArrowRight size={16} className="rotate-180" />
          </button>
          <div className="absolute top-0 right-0 w-2 h-full bg-primary" />
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">تسجيل موظف جديد</h2>
            <p className="text-slate-500">منصة ثانوية أم القرى بالخرج</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100"
            >
              <XCircle size={20} className="shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 'form' && (
              <motion.form 
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRegister} 
                className="space-y-4"
              >
                <div className="relative group">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    placeholder="الاسم الرباعي"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-12 pl-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    required
                  />
                </div>

                <div className="relative group">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <CreditCard size={20} />
                  </div>
                  <input
                    type="text"
                    name="national_id"
                    placeholder="رقم الهوية"
                    value={formData.national_id}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-12 pl-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    required
                  />
                </div>

                <div className="relative group">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Phone size={20} />
                  </div>
                  <input
                    type="tel"
                    name="phone_number"
                    placeholder="رقم الجوال (مثال: 05XXXXXXXX)"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-12 pl-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-left dir-ltr"
                    required
                  />
                </div>

                <div className="relative group">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="البريد الإلكتروني"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-12 pl-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-left dir-ltr"
                    required
                  />
                </div>

                <div className="relative group">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    placeholder="كلمة المرور"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-12 pl-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-left dir-ltr"
                    required
                  />
                </div>

                <div className="relative group">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                    required
                  >
                    <option value="teacher">معلم</option>
                    <option value="vice_principal">وكيل</option>
                    <option value="counselor">موجه طلابي</option>
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold text-lg transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={24} /> : 'تسجيل'}
                </button>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/login', { state: { openForgotModal: true } })}
                    className="text-sm font-bold text-slate-500 hover:text-primary transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
              </motion.form>
            )}

            {step === 'otp' && (
              <motion.form 
                key="otp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerifyOtp} 
                className="space-y-6 text-center"
              >
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-sm mb-6">
                  تم إرسال كود التحقق عبر الواتساب إلى الرقم {formData.phone_number}
                </div>
                
                <div className="flex justify-center gap-3 dir-ltr">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-14 h-14 text-center text-2xl font-bold bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.join('').length !== 4}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold text-lg transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={24} /> : 'تأكيد الكود'}
                </button>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => handleRegister()}
                    disabled={countdown > 0 || isLoading}
                    className="text-primary font-medium hover:underline disabled:text-slate-400 disabled:no-underline transition-colors"
                  >
                    {countdown > 0 ? `إعادة إرسال الكود بعد ${countdown} ثانية` : 'إعادة إرسال الكود'}
                  </button>
                </div>
              </motion.form>
            )}

            {step === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">تم توثيق الجوال بنجاح!</h3>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  حسابك الآن بانتظار اعتماد إدارة المدرسة للبدء بالعمل. سيتم إشعارك فور تفعيل الحساب.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  العودة لتسجيل الدخول
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
