import React, { useState } from 'react';
import { 
  Database, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  Code2, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Layers,
  Settings2,
  Pencil
} from 'lucide-react';
import { getStoredUniversalWebhookUrl, generateUniversalAppsScriptCode } from '../utils/universalSheetWebhook';
import { TARGET_SPREADSHEET_ID, ABSENSI_SPREADSHEET_ID, ABSENSI_DEFAULT_GID } from '../utils/googleSheetsLiveReader';
import { NavTab } from './Sidebar';

const SHEET_GIDS: Record<string, { name: string; gid: string; mode: 'read' | 'input'; spreadsheetId?: string }> = {
  pegawai: { name: 'Data_pegawai', gid: '1688113153', mode: 'input' },
  cuti: { name: 'Pengajuan_Cuti', gid: '1792882133', mode: 'input' },
  absensi: { name: 'Absensi_Bulanan', gid: ABSENSI_DEFAULT_GID, mode: 'input', spreadsheetId: ABSENSI_SPREADSHEET_ID },
  kgb: { name: 'KGB_Berkala', gid: '1832091216', mode: 'input' },
  sppd: { name: 'SPPD_Dinas', gid: '1303409856', mode: 'input' },
  uang_makan: { name: 'Uang_Makan', gid: '1590038364', mode: 'input' },
  lembur: { name: 'Lembur_ASN', gid: '943482291', mode: 'input' },
  perbendaharaan: { name: 'Perbendaharaan', gid: '820261205', mode: 'input' },
};

interface DatabaseIntegrationNavbarProps {
  onOpenDatabaseManager: () => void;
  onRefreshLiveSheets?: () => void;
  onOpenEditModal?: (tab: NavTab) => void;
  isRefreshing?: boolean;
  lastSyncTime?: string;
  currentTab?: NavTab;
}

export const DatabaseIntegrationNavbar: React.FC<DatabaseIntegrationNavbarProps> = ({
  onOpenDatabaseManager,
  onRefreshLiveSheets,
  onOpenEditModal,
  isRefreshing = false,
  lastSyncTime,
  currentTab,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const webhookUrl = getStoredUniversalWebhookUrl();
  const isConfigured = !!webhookUrl && webhookUrl.startsWith('http');

  const activeSheetMeta = currentTab ? SHEET_GIDS[currentTab] : undefined;
  const targetId = activeSheetMeta?.spreadsheetId || TARGET_SPREADSHEET_ID;
  const spreadsheetUrl = activeSheetMeta
    ? `https://docs.google.com/spreadsheets/d/${targetId}/edit?gid=${activeSheetMeta.gid}#gid=${activeSheetMeta.gid}`
    : `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit`;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    const code = generateUniversalAppsScriptCode(TARGET_SPREADSHEET_ID);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div 
      id="database-integration-navbar"
      className="w-full bg-slate-900 border-b border-emerald-900/60 px-3 md:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-200 shadow-md relative z-40"
    >
      {/* Kiri: Identitas Database Spreadsheet & Status API */}
      <div className="flex items-center flex-wrap gap-2 md:gap-3">
        <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-md font-medium">
          <Database className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-semibold tracking-wide uppercase text-[10px] sm:text-xs">
            Database Spreadsheet 8 Sheet
          </span>
        </div>

        {activeSheetMeta && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
            <span className="text-slate-400">Sheet:</span>
            <span className="text-emerald-300 font-mono font-bold">{activeSheetMeta.name}</span>
            <span className="text-slate-500 font-mono">(gid: {activeSheetMeta.gid})</span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
              activeSheetMeta.mode === 'read'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {activeSheetMeta.mode === 'read' ? 'Read-Only' : 'Input Data'}
            </span>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1.5 text-slate-300 font-mono text-[11px] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
          <span className="text-slate-400">ID:</span>
          <span className="text-emerald-400 font-medium">1EvZNlse...secWO5M</span>
        </div>

        {/* Status Webhook Connection */}
        <div className="flex items-center gap-1.5">
          {isConfigured ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              API Webhook Terpasang
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-medium">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              Webhook Standby
            </span>
          )}

          {lastSyncTime && (
            <span className="hidden lg:inline text-[11px] text-slate-400">
              Sinkron terakhir: <strong className="text-slate-200">{lastSyncTime}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Kanan: Tombol Operasional Khusus Integrasi Database */}
      <div className="flex items-center flex-wrap gap-1.5 md:gap-2">
        {/* Tombol Tarik Ulang Live Data Sheet 1 & 3 */}
        {onRefreshLiveSheets && (
          <button
            type="button"
            onClick={onRefreshLiveSheets}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
            title="Tarik ulang data live dari Sheet 1 (Pegawai) dan Sheet 3 (Absensi)"
          >
            <RefreshCw className={`w-3 h-3 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Tarik Live Sheet (1 & 3)</span>
          </button>
        )}

        {/* Tombol Salin Apps Script Code.gs */}
        <button
          type="button"
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
          title="Salin kode Google Apps Script (Code.gs) yang mendukung seluruh 8 sheet"
        >
          {copiedCode ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-300 font-semibold">Tersalin!</span>
            </>
          ) : (
            <>
              <Code2 className="w-3 h-3 text-amber-400" />
              <span className="hidden md:inline">Salin Code.gs API</span>
            </>
          )}
        </button>

        {/* Tombol Buka Spreadsheet Langsung */}
        <a
          href={spreadsheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
          title="Buka Google Spreadsheet di tab baru"
        >
          <ExternalLink className="w-3 h-3 text-emerald-400" />
          <span className="hidden sm:inline">Buka Spreadsheet</span>
        </a>

        {/* Tombol Master Integrasi Database & API Webhook */}
        <button
          type="button"
          onClick={onOpenDatabaseManager}
          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-[11px] shadow-sm shadow-emerald-900/50 transition-all cursor-pointer"
          title="Buka Panel Lengkap Integrasi Database & Webhook"
        >
          <Settings2 className="w-3 h-3" />
          <span>Pengaturan Database & API</span>
        </button>
      </div>
    </div>
  );
};
