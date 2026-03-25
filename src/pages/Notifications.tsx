import { apiFetch } from '../utils/api';
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronLeft,
  Trash2,
  MailOpen,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatHijriDate, formatHijriDateTime } from '../utils/dateUtils';

interface Notification {
  id: string;
  sender_id: number;
  user_id: number;
  title: string;
  message: string;
  reference_id: number;
  is_read: boolean;
  created_at: string;
  sender_name: string;
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await apiFetch(`/api/notifications?userId=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json().catch(() => []);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    if (!user) return;

    const eventSource = new EventSource(`/api/notifications/stream?userId=${user.id}`);
    
    eventSource.onmessage = (event) => {
      try {
        const newNotification = JSON.parse(event.data);
        setNotifications(prev => [newNotification, ...prev]);
      } catch (err) {
        console.error('Error parsing real-time notification', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [user]);

  const markAsRead = async (id: string, referenceId?: number) => {
    try {
      const res = await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        if (referenceId) {
          navigate(`/referral/${referenceId}`);
        }
      } else {
        const data = await res.json().catch(() => ({ error: 'فشل تحديث حالة الإشعار' }));
        console.error(data.error || 'فشل تحديث حالة الإشعار');
      }
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const res = await apiFetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      } else {
        const data = await res.json().catch(() => ({ error: 'فشل تحديث الإشعارات' }));
        console.error(data.error || 'فشل تحديث الإشعارات');
      }
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      } else {
        console.error('Failed to delete notification');
      }
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Bell className="text-primary" size={32} />
            <span>الإشعارات</span>
          </h1>
          <p className="text-slate-500 font-bold">تابع آخر التحديثات والإجراءات المتخذة على الحالات.</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold hover:text-primary hover:border-primary transition-all shadow-sm"
          >
            <MailOpen size={20} />
            <span>تحديد الكل كمقروء</span>
          </button>
        )}
      </div>

      <div className="sts-card overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-slate-400 font-bold">جاري تحميل الإشعارات...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Bell size={40} />
            </div>
            <p className="text-slate-400 font-bold text-lg">لا توجد إشعارات حالياً</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {notifications.map((notification, i) => (
              <motion.div 
                key={notification.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => markAsRead(notification.id, notification.reference_id)}
                className={`p-6 md:p-8 flex items-start gap-4 md:gap-6 cursor-pointer transition-all hover:bg-slate-50/50 relative group ${!notification.is_read ? 'bg-primary/[0.02]' : ''}`}
              >
                {!notification.is_read && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary" />
                )}
                
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                  !notification.is_read ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 text-slate-400'
                }`}>
                  {notification.is_read ? <MailOpen size={24} /> : <Mail size={24} />}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <p className={`text-sm md:text-base leading-relaxed ${!notification.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>
                      {notification.title}
                    </p>
                    <span className="text-[10px] md:text-xs text-slate-400 font-bold whitespace-nowrap">
                      {formatHijriDate(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center gap-4 text-[10px] md:text-xs font-bold uppercase tracking-wider pt-2">
                    <span className="text-primary">من: {notification.sender_name || 'النظام'}</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock size={12} />
                      {formatHijriDateTime(notification.created_at).split(' - ')[1]}
                    </span>
                  </div>
                </div>

                <div className="self-center flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {user?.role === 'admin' && (
                    <button 
                      onClick={(e) => deleteNotification(e, notification.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="حذف الإشعار"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                  <ChevronLeft className="text-slate-300" size={24} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
