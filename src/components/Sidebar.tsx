import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  BadgePercent, 
  FileText, 
  FileSpreadsheet, 
  Clock, 
  WalletCards, 
  Shield, 
  Database,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'pegawai'
  | 'absensi'
  | 'kgb'
  | 'cuti'
  | 'sppd'
  | 'lembur'
  | 'perbendaharaan'
  | 'sheets_db'
  | 'sync'
  | 'keamanan';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  counts: {
    totalPegawai: number;
    cutiPending: number;
    kgbPending: number;
    sp2dCount: number;
  };
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  counts,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    {
      group: 'UTAMA',
      items: [
        {
          id: 'dashboard' as NavTab,
          label: 'Dasbor Rekapitulasi',
          icon: LayoutDashboard,
          badge: null,
          color: 'text-blue-600',
        },
      ],
    },
    {
      group: '1. MODUL KEPEGAWAIAN',
      items: [
        {
          id: 'pegawai' as NavTab,
          label: 'Daftar Pegawai & Dokumen',
          icon: Users,
          badge: `${counts.totalPegawai}`,
          color: 'text-sky-600',
        },
        {
          id: 'absensi' as NavTab,
          label: 'Rekap Absensi Bulanan',
          icon: CalendarCheck,
          badge: 'Bulanan',
          color: 'text-indigo-600',
        },
        {
          id: 'kgb' as NavTab,
          label: 'Kenaikan Gaji Berkala (KGB)',
          icon: TrendingUp,
          badge: counts.kgbPending > 0 ? `${counts.kgbPending}` : null,
          badgeColor: 'bg-amber-100 text-amber-800',
          color: 'text-emerald-600',
        },
        {
          id: 'cuti' as NavTab,
          label: 'Pengajuan Cuti (BKN 24/2017)',
          icon: FileText,
          badge: counts.cutiPending > 0 ? `${counts.cutiPending} Baru` : null,
          badgeColor: 'bg-rose-100 text-rose-800',
          color: 'text-rose-600',
        },
      ],
    },
    {
      group: '2. MODUL KEUANGAN',
      items: [
        {
          id: 'sppd' as NavTab,
          label: 'Laporan Perjalanan Dinas (SPD)',
          icon: FileSpreadsheet,
          badge: null,
          color: 'text-cyan-600',
        },
        {
          id: 'lembur' as NavTab,
          label: 'Rekap Absen & Laporan Lembur',
          icon: Clock,
          badge: null,
          color: 'text-violet-600',
        },
        {
          id: 'perbendaharaan' as NavTab,
          label: 'SPP, SPM & SP2D Kas',
          icon: WalletCards,
          badge: `${counts.sp2dCount} Berkas`,
          badgeColor: 'bg-emerald-100 text-emerald-800',
          color: 'text-emerald-600',
        },
      ],
    },
    {
      group: 'SISTEM & INTEGRASI',
      items: [
        {
          id: 'sheets_db' as NavTab,
          label: 'Database Google Sheets',
          icon: FileSpreadsheet,
          badge: 'Live DB',
          badgeColor: 'bg-emerald-100 text-emerald-800',
          color: 'text-emerald-600',
        },
        {
          id: 'sync' as NavTab,
          label: 'Sinkronisasi SIMPEG SDM',
          icon: Database,
          badge: 'Otomatis',
          badgeColor: 'bg-teal-100 text-teal-800',
          color: 'text-teal-600',
        },
        {
          id: 'keamanan' as NavTab,
          label: 'Autentikasi 2FA & SSO',
          icon: Shield,
          badge: 'Aktif',
          badgeColor: 'bg-blue-100 text-blue-800',
          color: 'text-blue-600',
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 md:w-64 bg-[#1E293B] text-slate-300 flex flex-col transition-transform duration-300 md:translate-x-0 md:static md:z-20 border-r border-slate-700/50 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header Brand */}
        <div className="p-5 md:p-6 flex items-center gap-3 border-b border-slate-700/50">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-lg shadow-indigo-500/20 shrink-0">
            SIM
          </div>
          <div className="min-w-0">
            <span className="text-white font-semibold tracking-tight text-base truncate block">
              E-Aparatur v2.1
            </span>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider truncate">
              BKN & KEMENKEU
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4 overflow-y-auto space-y-5">
          {navItems.map((group) => (
            <div key={group.group}>
              <div className="px-4 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {group.group}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = currentTab === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition-all group cursor-pointer text-left ${
                        isActive
                          ? 'bg-indigo-600/10 border-r-4 border-indigo-500 text-indigo-400 font-medium'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isActive
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-80" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom System & Profile Bar */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
              AD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">Admin SDM Pusat</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                SSO Connected
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
