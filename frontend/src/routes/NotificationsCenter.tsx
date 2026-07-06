import { useState } from 'react';
import { useAppState } from '../context/AppContext';
import {
  Bell, AlertTriangle, TrendingUp, Info, Check, Trash2, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  type: 'warning' | 'alert' | 'market' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export const NotificationsCenter = () => {
  const { setAlertCount } = useAppState();

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'n1',
      type: 'warning',
      title: 'Heavy Rainfall Warning',
      message: 'Expected downpour of 45mm tomorrow in your sector. Check fields to ensure proper drainage channels are open.',
      timestamp: '2 hours ago',
      read: false,
    },
    {
      id: 'n2',
      type: 'alert',
      title: 'Tomato Late Blight Alert',
      message: 'Persistent humidity levels above 85% registered today. Spray biological copper fungicide proactively.',
      timestamp: '5 hours ago',
      read: false,
    },
    {
      id: 'n3',
      type: 'market',
      title: 'Tomato Market Surge',
      message: 'Mandi price in Pune APMC increased by 12.5% to ₹2,400/Quintal. Good harvesting window.',
      timestamp: '1 day ago',
      read: true,
    },
    {
      id: 'n4',
      type: 'info',
      title: 'Drip Subsidy Window Open',
      message: 'Micro-irrigation subsidy applications for your district are open until next Friday. Review scheme details to submit.',
      timestamp: '2 days ago',
      read: true,
    },
  ]);

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setAlertCount(0);
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n));
      const unreadCount = updated.filter((n) => !n.read && (n.type === 'warning' || n.type === 'alert')).length;
      setAlertCount(unreadCount);
      return updated;
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      const unreadCount = updated.filter((n) => !n.read && (n.type === 'warning' || n.type === 'alert')).length;
      setAlertCount(unreadCount);
      return updated;
    });
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-605" />;
      case 'alert': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'market': return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getBgClass = (type: string, read: boolean) => {
    if (read) return 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800';
    switch (type) {
      case 'warning': return 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40';
      case 'alert': return 'bg-rose-50/40 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40';
      case 'market': return 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40';
      default: return 'bg-blue-50/40 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/40';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Bell className="w-6 h-6 text-zinc-650" /> Proactive Notifications
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time critical alerts, disease outbreak forecast, and pricing insights.
          </p>
        </div>
        
        {notifications.some((n) => !n.read) && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 transition self-start"
          >
            <Check className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tab buttons */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
        {(['all', 'unread', 'read'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
              filter === tab
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -16 }}
                className={`p-4 rounded-xl border flex gap-3.5 justify-between items-start transition-all ${getBgClass(item.type, item.read)}`}
              >
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900/80 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    {getIcon(item.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold ${item.read ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-900 dark:text-white'}`}>
                        {item.title}
                      </span>
                      {!item.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
                      {item.message}
                    </p>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-2 block font-medium">
                      {item.timestamp}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleRead(item.id)}
                    className="p-1.5 rounded-lg text-zinc-450 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    title={item.read ? 'Mark unread' : 'Mark read'}
                  >
                    <Check className={`w-3.5 h-3.5 ${item.read ? 'text-emerald-500' : ''}`} />
                  </button>
                  <button
                    onClick={() => deleteNotification(item.id)}
                    className="p-1.5 rounded-lg text-zinc-455 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-805 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
              <Bell className="w-8 h-8 text-zinc-305 dark:text-zinc-700 mx-auto mb-2 opacity-50" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-semibold">No notifications</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
