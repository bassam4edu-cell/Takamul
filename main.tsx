import { apiFetch } from '../utils/api';
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, AlertCircle, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { formatHijriDateTime } from '../utils/dateUtils';

interface Notification {
  id: string;
  title: string;
  message: string;
  reference_id: number;
  is_read: boolean;
  created_at: string;
  sender_name: string;
}

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await apiFetch(`/api/notifications?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json().catch(() => []);
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    if (!user) return;

    // Real-time updates using Server-Sent Events (SSE)
    // This achieves the exact same real-time behavior as Supabase channels
    // but works natively with our existing Neon Postgres + Express backend
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        const res = await apiFetch(`/api/notifications/${notification.id}/read`, { method: 'POST' });
        if (res.ok) {
          setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
        } else {
          const data = await res.json().catch(() => ({ error: 'فشل تحديث حالة الإشعار' }));
          console.error(data.error || 'فشل تحديث حالة الإشعار');
        }
      } catch (err) {
        console.error('Failed to mark as read', err);
      }
    }
    setIsOpen(false);
    if (notification.reference_id) {
      navigate(`/referral/${notification.reference_id}`);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await apiFetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-white border border-slate-100 rounded-xl text-slate-500 hover:text-primary hover:border-primary/20 transition-all shadow-sm group"
      >
        <Bell size={20} className="group-hover:rotate-12 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">التنبيهات</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                >
                  تحديد الكل كمقروء
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                    <Bell size={24} />
                  </div>
                  <p className="text-xs font-bold text-slate-400">لا توجد تنبيهات حالياً</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.slice(0, 5).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full p-5 text-right flex gap-4 hover:bg-slate-100 transition-colors group relative ${!n.is_read ? 'bg-slate-50' : 'bg-white'}`}
                    >
                      {!n.is_read && (
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary" />
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!n.is_read ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {n.title.includes('جديد') ? <AlertCircle size={18} /> : <Clock size={18} />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={`text-xs leading-relaxed ${!n.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-500'}`}>
                          {n.title}
                        </p>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          {n.message}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            {formatHijriDateTime(n.created_at).split(' - ')[1]}
                          </span>
                          <ChevronLeft size={12} className="text-slate-300 group-hover:text-primary group-hover:translate-x-[-2px] transition-all" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-50 bg-slate-50/30 text-center">
              <button 
                onClick={() => { setIsOpen(false); navigate('/notifications'); }}
                className="text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-widest"
              >
                عرض كافة الإشعارات
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
