import React, { useState } from 'react';
import { 
  Users, 
  FileText, 
  CalendarCheck, 
  TrendingUp, 
  FileSpreadsheet, 
  UtensilsCrossed, 
  Clock, 
  Coins, 
  LayoutDashboard,
  Pencil,
  Sparkles,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface SheetTabsNavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  counts?: {
    pegawaiCount?: number;
    cutiCount?: number;
    absensiCount?: number;
    kgbCount?: number;
  };
}

export const SHEET_NAV_ITEMS = [
  {
    id: 'pegawai' as NavTab,
    sheetNumber: 1,
    title: 'Data_pegawai',
    sheetName: 'Data_pegawai',
    gid: '1688113153',
    icon: Users,
    color: 'text-sky-600',
    activeBg: 'bg-sky-50 border-sky-600 text-sky-900',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  {
    id: 'cuti' as NavTab,
    sheetNumber: 2,
    title: 'Pengajuan_Cuti',
    sheetName: 'Pengajuan_Cuti',
    gid: '1792882133',
    icon: FileText,
    color: 'text-rose-600',
    activeBg: 'bg-rose-50 border-rose-600 text-rose-900',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  {
    id: 'absensi' as NavTab,
    sheetNumber: 3,
    title: 'Absensi_Bulanan',
    sheetName: 'Absensi_Bulanan',
    gid: '1473990328',
    icon: CalendarCheck,
    color: 'text-indigo-600',
    activeBg: 'bg-indigo-50 border-indigo-600 text-indigo-900',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    id: 'kgb' as NavTab,
    sheetNumber: 4,
    title: 'KGB_Berkala',
    sheetName: 'KGB_Berkala',
    gid: '1832091216',
    icon: TrendingUp,
    color: 'text-emerald-600',
    activeBg: 'bg-emerald-50 border-emerald-600 text-emerald-900',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'sppd' as NavTab,
    sheetNumber: 5,
    title: 'SPPD_Dinas',
    sheetName: 'SPPD_Dinas',
    gid: '1303409856',
    icon: FileSpreadsheet,
    color: 'text-cyan-600',
    activeBg: 'bg-cyan-50 border-cyan-600 text-cyan-900',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  {
    id: 'uang_makan' as NavTab,
    sheetNumber: 6,
    title: 'Uang_Makan',
    sheetName: 'Uang_Makan',
    gid: '1590038364',
    icon: UtensilsCrossed,
    color: 'text-amber-600',
    activeBg: 'bg-amber-50 border-amber-600 text-amber-900',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'lembur' as NavTab,
    sheetNumber: 7,
    title: 'Lembur_ASN',
    sheetName: 'Lembur_ASN',
    gid: '943482291',
    icon: Clock,
    color: 'text-violet-600',
    activeBg: 'bg-violet-50 border-violet-600 text-violet-900',
    badgeColor: 'bg-violet-100 text-violet-800 border-violet-200',
  },
  {
    id: 'perbendaharaan' as NavTab,
    sheetNumber: 8,
    title: 'Perbendaharaan',
    sheetName: 'Perbendaharaan',
    gid: '820261205',
    icon: Coins,
    color: 'text-teal-600',
    activeBg: 'bg-teal-50 border-teal-600 text-teal-900',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
  },
];

export const SheetTabsNavbar: React.FC<SheetTabsNavbarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  return (
    <div className="w-full bg-white border-b border-slate-200 px-3 md:px-6 shadow-xs">
      <div className="flex items-center justify-between gap-3 py-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          {/* Tombol Dasbor Ringkasan Utama */}
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dasbor</span>
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1" />

          {/* 8 Tab Terpisah Untuk Masing-masing Sheet */}
          {SHEET_NAV_ITEMS.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                  isActive 
                    ? `${item.activeBg} font-semibold shadow-xs` 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                  isActive ? 'bg-white/90 shadow-2xs' : 'bg-slate-100 text-slate-600'
                }`}>
                  {item.sheetNumber}
                </span>

                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Status Database */}
        <div className="hidden lg:flex items-center gap-2 shrink-0 ml-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>8 Sheet Aktif Terkoneksi</span>
          </div>
        </div>
      </div>
    </div>
  );
};

