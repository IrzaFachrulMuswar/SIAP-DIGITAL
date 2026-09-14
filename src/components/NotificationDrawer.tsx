import React, { useState } from 'react';
import { X, Bell, Check, CheckCheck, Trash2, ShieldCheck, DollarSign, Users, Database, Clock } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onNavigateTab,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'KEPEGAWAIAN' | 'KEUANGAN' | 'KEAMANAN'>('ALL');

  if (!isOpen) return null;

  const filtered = notifications.filter((item) => {
    if (filter === 'ALL') return true;
    return item.category === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'KEPEGAWAIAN':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'KEUANGAN':
        return <DollarSign className="h-4 w-4 text-emerald-600" />;
      case 'KEAMANAN':
        return <ShieldCheck className="h-4 w-4 text-amber-600" />;
      case 'SINKRONISASI':
        return <Database className="h-4 w-4 text-teal-600" />;
      default:
        return <Bell className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bell className="h-5 w-5 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-800">Pemberitahuan Real-Time</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50 border-b border-slate-100 text-xs text-slate-600">
            <span>{unreadCount} belum dibaca</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Tandai Semua Dibaca
              </button>
              <button
                type="button"
                onClick={onClearAll}
                className="flex items-center gap-1 text-slate-400 hover:text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" /> Bersihkan
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-slate-100 overflow-x-auto">
            {(['ALL', 'KEPEGAWAIAN', 'KEUANGAN', 'KEAMANAN'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  filter === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'Semua' : cat.charAt(0) + cat.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <Bell className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">Tidak ada notifikasi baru</p>
                <p className="text-xs text-slate-400 mt-1">
                  Semua aktivitas sistem kepegawaian dan keuangan telah terperbarui.
                </p>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!item.read) onMarkAsRead(item.id);
                    if (item.targetTab) {
                      onNavigateTab(item.targetTab);
                      onClose();
                    }
                  }}
                  className={`p-4 transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-3 ${
                    !item.read ? 'bg-blue-50/40' : 'bg-white'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-800 truncate">
                        {item.title}
                      </h4>
                      {!item.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                      {item.message}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" /> {item.timestamp}
                      </span>
                      {item.targetTab && (
                        <span className="text-blue-600 font-medium hover:underline">
                          Buka Menu &rarr;
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
