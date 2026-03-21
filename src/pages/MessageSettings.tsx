import { apiFetch } from '../utils/api';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, Eye, EyeOff, MessageSquare, ShieldAlert, CheckCircle2, QrCode, RefreshCw, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const MessageSettings: React.FC = () => {
  const { user } = useAuth();
  const [instanceId, setInstanceId] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // WhatsApp Connection State
  const [waStatus, setWaStatus] = useState<string | null>(null);
  const [waQR, setWaQR] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load from localStorage on mount
    const savedInstanceId = localStorage.getItem('greenapi_instance_id');
    const savedToken = localStorage.getItem('greenapi_token');
    
    if (savedInstanceId) setInstanceId(savedInstanceId);
    if (savedToken) setToken(savedToken);
  }, []);

  const checkWhatsAppStatus = async (currentInstanceId: string, currentToken: string) => {
    if (!currentInstanceId || !currentToken) return;
    
    try {
      const res = await apiFetch(`/api/whatsapp/status?instanceId=${currentInstanceId}&token=${currentToken}`);
      if (res.ok) {
        const data = await res.json();
        const status = data.stateInstance || data.status?.state || data.state || 'disconnected';
        setWaStatus(status);
        
        if (status === 'authorized' || status === 'connected' || status === 'authenticated') {
          setWaQR(null); // Clear QR if connected
        } else if (status === 'notAuthorized' || status === 'disconnected' || status === 'unauthenticated') {
          fetchWhatsAppQR(currentInstanceId, currentToken);
        }
      } else {
        const errorData = await res.json();
        if (res.status === 429) {
          setWaStatus('rate_limited');
          // Don't log 429 errors to console to avoid spam
        } else {
          setWaStatus('error');
          console.error("WhatsApp API Error:", errorData.error);
        }
      }
    } catch (err) {
      console.error("Error checking WhatsApp status:", err);
      setWaStatus('error');
    }
  };

  const fetchWhatsAppQR = async (currentInstanceId: string, currentToken: string) => {
    try {
      const res = await apiFetch(`/api/whatsapp/qr?instanceId=${currentInstanceId}&token=${currentToken}`);
      if (res.ok) {
        const data = await res.json();
        if (data.qrCode) {
          setWaQR(data.qrCode);
        } else if (data.qr) {
          setWaQR(data.qr);
        }
      } else {
        setWaQR(null);
      }
    } catch (err) {
      console.error("Error fetching WhatsApp QR:", err);
      setWaQR(null);
    }
  };

  // Load settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await apiFetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.whatsapp_instance_id && data.whatsapp_token) {
            setInstanceId(data.whatsapp_instance_id);
            setToken(data.whatsapp_token);
            // Save to localStorage for backward compatibility
            localStorage.setItem('greenapi_instance_id', data.whatsapp_instance_id);
            localStorage.setItem('greenapi_token', data.whatsapp_token);
          } else {
            // Fallback to localStorage if not in DB
            const savedInstanceId = localStorage.getItem('greenapi_instance_id');
            const savedToken = localStorage.getItem('greenapi_token');
            if (savedInstanceId) setInstanceId(savedInstanceId);
            if (savedToken) setToken(savedToken);
          }
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      }
    };
    loadSettings();
  }, []);

  // Start polling when instanceId and token are available
  useEffect(() => {
    if (instanceId && token) {
      // Initial check
      checkWhatsAppStatus(instanceId, token);
      
      // Setup polling every 30 seconds to avoid rate limits
      pollingIntervalRef.current = setInterval(() => {
        checkWhatsAppStatus(instanceId, token);
      }, 30000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [instanceId, token, success]); // Re-run effect when success changes (after saving)

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    
    try {
      // Save to database
      await apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            whatsapp_instance_id: instanceId,
            whatsapp_token: token
          }
        })
      });

      // Save to localStorage as backup
      localStorage.setItem('greenapi_instance_id', instanceId);
      localStorage.setItem('greenapi_token', token);
      
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      checkWhatsAppStatus(instanceId, token);
    } catch (err) {
      console.error("Error saving settings:", err);
      setSaving(false);
      alert("حدث خطأ أثناء حفظ الإعدادات");
    }
  };

  const handleClearData = () => {
    setShowConfirmClear(true);
  };

  const confirmClearData = async () => {
    try {
      // Clear from database
      await apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            whatsapp_instance_id: '',
            whatsapp_token: ''
          }
        })
      });

      localStorage.removeItem('greenapi_instance_id');
      localStorage.removeItem('greenapi_token');
      setInstanceId('');
      setToken('');
      setWaStatus(null);
      setWaQR(null);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      setShowConfirmClear(false);
    } catch (err) {
      console.error("Error clearing settings:", err);
      alert("حدث خطأ أثناء مسح الإعدادات");
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <ShieldAlert size={48} className="mb-4 text-red-400" />
        <h2 className="text-2xl font-bold">غير مصرح لك بالدخول</h2>
        <p>هذه الصفحة مخصصة لمدير النظام فقط.</p>
      </div>
    );
  }

  const isConnected = waStatus === 'authorized' || waStatus === 'connected' || waStatus === 'authenticated';
  const hasSavedData = !!localStorage.getItem('greenapi_instance_id');

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg">
          <MessageSquare className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800">إعدادات الرسائل</h1>
          <p className="text-slate-500 font-medium mt-1">إدارة الربط التقني والخدمات الخارجية</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-6 bg-emerald-500 rounded-full inline-block"></span>
            بوابة إرسال الواتساب (Green API)
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            قم بإدخال بيانات الربط الخاصة بخدمة Green API لتفعيل إرسال الرسائل التلقائية لأولياء الأمور.
          </p>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">رقم الجلسة (Instance ID)</label>
            <input
              type="text"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              placeholder="مثال: instance12345"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50 focus:bg-white text-left"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">رمز الأمان (Token)</label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="أدخل رمز الأمان الخاص بالبوابة"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50 focus:bg-white text-left pr-12"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showToken ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-4 flex-wrap">
            <button
              onClick={handleSave}
              disabled={saving || !instanceId || !token}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-70"
            >
              <Save size={20} />
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
            
            {hasSavedData && !showConfirmClear && (
              <button
                onClick={handleClearData}
                className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold flex items-center gap-2 transition-all"
              >
                <Trash2 size={20} />
                فك الارتباط ومسح البيانات
              </button>
            )}

            {showConfirmClear && (
              <div className="flex items-center gap-2 bg-red-50 p-2 rounded-xl border border-red-100">
                <span className="text-red-800 font-bold text-sm px-2">هل أنت متأكد؟</span>
                <button
                  onClick={confirmClearData}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-all shadow-sm"
                >
                  نعم، امسح
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 rounded-lg font-bold text-sm transition-all border border-slate-200"
                >
                  إلغاء
                </button>
              </div>
            )}
            
            {success && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-emerald-600 font-bold text-sm flex items-center gap-1"
              >
                تم الحفظ بنجاح ✓
              </motion.span>
            )}
          </div>
        </div>
      </motion.div>

      {/* WhatsApp Connection Widget */}
      {hasSavedData && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-500 rounded-full inline-block"></span>
                حالة الربط مع الواتساب
              </h2>
              <p className="text-slate-500 mt-2 text-sm">
                مراقبة حالة الاتصال ومسح رمز الاستجابة السريعة (QR Code) لتفعيل الخدمة.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <RefreshCw size={16} className="animate-spin" />
              تحديث تلقائي
            </div>
          </div>

          <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[300px]">
            {isConnected ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center text-center space-y-4"
              >
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">الجوال متصل بنجاح ومستعد للإرسال</h3>
                  <p className="text-slate-500 mt-2">نظام إرسال الواتساب جاهز للعمل</p>
                </div>
              </motion.div>
            ) : waStatus === 'rate_limited' ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center text-center space-y-4"
              >
                <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center">
                  <ShieldAlert className="w-12 h-12 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">تجاوز الحد المسموح</h3>
                  <p className="text-slate-500 mt-2">تم تجاوز الحد المسموح من الطلبات لخدمة Green API.</p>
                  <p className="text-slate-500 mt-1 text-sm">يرجى الانتظار قليلاً وسيعاود النظام المحاولة تلقائياً.</p>
                </div>
              </motion.div>
            ) : waStatus === 'error' ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center text-center space-y-4"
              >
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                  <ShieldAlert className="w-12 h-12 text-red-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">خطأ في الربط</h3>
                  <p className="text-slate-500 mt-2">بيانات الربط غير صحيحة أو الحساب غير مفعل (Forbidden).</p>
                  <p className="text-slate-500 mt-1 text-sm">تأكد من صحة رقم الجلسة ورمز الأمان، وأن اشتراكك فعال في Green API.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center text-center space-y-6 w-full max-w-md"
              >
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 w-full flex flex-col items-center">
                  {waQR ? (
                    <img 
                      src={waQR.startsWith('data:image') ? waQR : `data:image/png;base64,${waQR}`} 
                      alt="WhatsApp QR Code" 
                      className="w-64 h-64 object-contain rounded-xl"
                    />
                  ) : (
                    <div className="w-64 h-64 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                      <QrCode size={48} />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-800">بانتظار مسح الرمز...</h3>
                  <p className="text-slate-500 font-medium">
                    افتح واتساب في جوالك &gt; الأجهزة المرتبطة &gt; امسح هذا الرمز
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MessageSettings;
