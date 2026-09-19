import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  FileText, 
  TrendingUp, 
  FileSpreadsheet, 
  UtensilsCrossed, 
  Clock, 
  Coins, 
  Shield, 
  Database,
  ChevronRight,
  Eye,
  PenTool,
  Pencil,
  Settings2,
  ExternalLink
} from 'lucide-react';
import { TARGET_SPREADSHEET_ID } from '../utils/googleSheetsLiveReader';

export type NavTab = 
  | 'dashboard'
  | 'pegawai'
  | 'cuti'
  | 'absensi'
  | 'kgb'
  | 'sppd'
  | 'uang_makan'
  | 'lembur'
  | 'perbendaharaan'
  | 'sheets_db'
  | 'sync'
  | 'keamanan';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenEditModal?: (tab: NavTab) => void;
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
  onOpenEditModal,
  counts,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navSections = [
    {
      group: 'IKHTISAR UTAMA',
      items: [
        {
          id: 'dashboard' as NavTab,
          label: 'Dasbor Eksekutif',
          subtitle: 'Rekapitulasi Semua Modul',
          icon: LayoutDashboard,
          badge: null,
          color: 'text-blue-400',
        },
      ],
    },
    {
      group: '8 SHEET DATABASE GOOGLE',
      items: [
        {
          id: 'pegawai' as NavTab,
          label: '1. Data Pegawai',
          subtitle: '9 Kolom Pegawai ASN',
          icon: Users,
          mode: 'edit',
          modeLabel: 'Akses Edit',
          badge: `${counts.totalPegawai}`,
          color: 'text-sky-400',
        },
        {
          id: 'cuti' as NavTab,
          label: '2. Pengajuan Cuti',
          subtitle: '9 Kolom BKN 24/2017',
          icon: FileText,
          mode: 'edit',
          modeLabel: 'Akses Edit',
          badge: counts.cutiPending > 0 ? `${counts.cutiPending} Baru` : null,
          color: 'text-rose-400',
        },
        {
          id: 'absensi' as NavTab,
          label: '3. Absensi Bulanan',
          subtitle: '17 Kolom Presensi',
          icon: CalendarCheck,
          mode: 'edit',
          modeLabel: 'Akses Edit',
          badge: 'Live Sheet',
          color: 'text-indigo-400',
        },
        {
          id: 'kgb' as NavTab,
          label: '4. KGB Berkala',
          subtitle: '6 Kolom Kenaikan Gaji',
          icon: TrendingUp,
          mode: 'edit',
          modeLabel: 'Akses Edit',
          badge: counts.kgbPending > 0 ? `${counts.kgbPending}` : null,
          color: 'text-emerald-400',
        },
        {
          id: 'sppd' as NavTab,
          label: '5. SPPD Dinas',
          subtitle: '6 Kolom Perjalanan Dinas',
          icon: FileSpreadsheet,
          mode: 'edit',
          modeLabel: 'Akses Edit',
          badge: null,
          color: 'text-cyan-400',
        },
        {
          id: 'uang_makan' as NavTab,
          label: '6. Uang Makan',
          subtitle: '8 Kolom Rekapitulasi',
          icon: UtensilsCrossed,
          mode: 'edit',
          modeLabel: 'Akses Edit',
          badge: null,
          color: 'text-amber-400',
        },
        {
          id: 'lembur' as NavTab,
          label: '7. Lembur ASN',
          subtitle: '5 Kolom Surat Perintah Lembur',
          icon: Clock,
          mode: 'edit',
          modeLabel: 'Akses Edit',
          badge: null,
          color: 'text-violet-400',
        },
        {
          id: 'perbendaharaan' as NavTab,
          label: '8. Perbendaharaan',
          subtitle: '6 Kolom SPP, SPM, SP2D',
          icon: Coins,
          mode: 'edit',
          modeLabel: 'Akses Edit',
          badge: `${counts.sp2dCount}`,
          color: 'text-teal-400',
        },
      ],
    },
    {
      group: 'NAVBAR INTEGRASI DATABASE',
      items: [
        {
          id: 'sheets_db' as NavTab,
          label: 'Konfigurasi Database & Webhook',
          subtitle: 'Apps Script Code.gs API',
          icon: Database,
          badge: 'API Active',
          badgeColor: 'bg-emerald-500/20 text-emerald-300',
          color: 'text-emerald-400',
        },
        {
          id: 'keamanan' as NavTab,
          label: 'Autentikasi & Keamanan',
          subtitle: '2FA & Proteksi Data',
          icon: Shield,
          badge: 'Aktif',
          color: 'text-blue-400',
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
        className={`fixed inset-y-0 left-0 z-40 w-64 md:w-64 bg-[#0F172A] text-slate-300 flex flex-col transition-transform duration-300 md:translate-x-0 md:static md:z-20 border-r border-slate-800 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header Brand */}
        <div className="p-4 md:p-5 flex items-center gap-3 border-b border-slate-800 bg-slate-950/60">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-md shadow-emerald-600/30 shrink-0">
            SIM
          </div>
          <div className="min-w-0">
            <span className="text-white font-semibold tracking-tight text-sm truncate block">
              SIM BKHIT Sorong
            </span>
            <p className="text-[10px] text-emerald-400 font-mono truncate">
              Google Sheets 8-Sheet DB
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-3 overflow-y-auto space-y-4 no-scrollbar">
          {navSections.map((group) => (
            <div key={group.group}>
              <div className="px-4 mb-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
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
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition-all group cursor-pointer text-left border-l-2 ${
                        isActive
                          ? 'bg-emerald-500/10 border-emerald-400 text-white font-semibold'
                          : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <div className="min-w-0">
                          <span className="truncate block leading-tight">{item.label}</span>
                          {item.subtitle && (
                            <span className="text-[10px] text-slate-400 truncate block font-normal leading-tight">
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {(item as any).badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                            {(item as any).badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-emerald-900/60 border border-emerald-700/60 flex items-center justify-center font-bold text-emerald-300 text-xs shrink-0">
                DB
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-white truncate">Google Sheets Active</p>
                <p className="text-[9px] text-emerald-400 flex items-center gap-1 font-mono truncate">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  Connected: 8 Sheets
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
