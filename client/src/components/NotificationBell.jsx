import React, { useContext, useState } from 'react';
import { NotificationContext } from '../context/NotificationContext';
import { Bell, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useContext(NotificationContext);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-md shadow-red-500/50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div 
          className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-red-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Notifications</h4>
              {unreadCount > 0 && (
                <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 font-medium transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => markAsRead(notif._id)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    notif.isRead
                      ? 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                      : 'bg-slate-800/80 border-red-500/30 text-white font-medium shadow-md shadow-red-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-semibold text-slate-100 flex items-center gap-1.5">
                      {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                      {notif.title}
                    </h5>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                    {notif.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
