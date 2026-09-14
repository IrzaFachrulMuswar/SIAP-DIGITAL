import React from 'react';
import { 
  Bell, 
  Database, 
  ShieldCheck, 
  Building2, 
  Menu,
  Sparkles,
  Download,
  Search,
  CheckCircle2,
  Lock,
  FileSpreadsheet
} from 'lucide-react';
import { UserSession } from '../types';

interface NavbarProps {
  currentSession: UserSession;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onOpenSSO: () => void;
  onOpenSync: () => void;
  onOpenSheetsDB?: () => void;
  onOpen2FA: () => void;
  onToggleSidebarMobile: () => void;
  lastSyncTime: string;
  onQuickExport: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSession,
  unreadNotifsCount,
  onOpenNotifications,
  onOpenSSO,
  onOpenSync,
  onOpenSheetsDB,
  onOpen2FA,
  onToggleSidebarMobile,
  lastSyncTime,
  onQuickExport,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
      {/* Left: Mobile Menu Button & Title */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          type="button"
          onClick={onToggleSidebarMobile}
          className="rounded-md p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 md:hidden cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-lg shadow-indigo-500/20 shrink-0">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base md:text-lg font-semibold text-slate-900 tracking-tight leading-none">
                Ringkasan Eksekutif
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded uppercase tracking-wide border border-slate-200">
                {currentSession.is2FAEnabled ? '2FA Aktif' : '2FA Nonaktif'}
              </span>
            </div>
            <p className="hidden lg:block text-[11px] text-slate-400 leading-tight mt-0.5">
              Sistem Manajemen Kepegawaian & Tata Kelola Keuangan Terintegrasi
            </p>
          </div>
        </div>
      </div>

      {/* Center: Universal Search */}
      <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari data ASN, dokumen, no. SP2D..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Right: Actions, Sync, 2FA, SSO, Notifs */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Google Sheets Live Database Badge */}
        {onOpenSheetsDB && (
          <button
            type="button"
            onClick={onOpenSheetsDB}
            className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 px-2.5 py-1.5 text-xs font-medium text-emerald-800 transition-colors cursor-pointer"
            title="Buka Integrasi Database Google Sheets"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline text-[11px] font-semibold">Sheets DB</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>
        )}

        {/* SDM Auto-Sync Status Badge */}
        <button
          type="button"
          onClick={onOpenSync}
          className="hidden sm:flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors cursor-pointer"
          title="Sinkronisasi Basis Data SIMPEG SDM"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <Database className="h-3.5 w-3.5 text-slate-500" />
          <span className="hidden xl:inline text-[11px]">DB SDM:</span>
          <span className="font-mono text-[11px] text-slate-700">Tersinkron</span>
        </button>

        {/* 2FA Security Badge */}
        <button
          type="button"
          onClick={onOpen2FA}
          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
            currentSession.is2FAEnabled
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
          title="Keamanan Autentikasi Dua Faktor (2FA)"
        >
          {currentSession.is2FAEnabled ? (
            <>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider">2FA OK</span>
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider">2FA Off</span>
            </>
          )}
        </button>

        {/* Real-time Notification Bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="p-2 text-slate-400 hover:text-slate-600 relative rounded-md border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label="Pemberitahuan Sistem"
        >
          <Bell className="h-4 w-4" />
          {unreadNotifsCount > 0 && (
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></div>
          )}
        </button>

        {/* Primary Action / Quick Export Button in Indigo */}
        <button
          type="button"
          onClick={onQuickExport}
          className="flex items-center gap-2 bg-indigo-600 text-white px-3.5 py-1.5 rounded-md text-xs md:text-sm font-medium shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ekspor Dokumen</span>
          <span className="sm:hidden">Ekspor</span>
        </button>

        <div className="h-6 w-px bg-slate-200 hidden sm:block mx-0.5" />

        {/* User / SSO Profile Button */}
        <button
          type="button"
          onClick={onOpenSSO}
          className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-1 hover:bg-slate-50 transition-colors cursor-pointer"
          title="Klik untuk ganti akun SSO"
        >
          <img
            src={currentSession.avatar}
            alt={currentSession.name}
            className="h-7 w-7 rounded-md object-cover border border-slate-200"
          />
          <div className="hidden lg:block text-left leading-none pr-1">
            <p className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
              {currentSession.name}
            </p>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
              SSO Aktif
            </p>
          </div>
        </button>
      </div>
    </header>
  );
};
