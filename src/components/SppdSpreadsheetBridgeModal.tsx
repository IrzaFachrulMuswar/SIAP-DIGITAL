import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  X, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Link2, 
  Code2, 
  Terminal, 
  ArrowRightLeft, 
  Sparkles, 
  History, 
  ShieldCheck, 
  Table,
  Zap,
  Info
} from 'lucide-react';
import { PerjalananDinasRecord } from '../types';
import { 
  SPPD_SPREADSHEET_ID, 
  SPPD_SPREADSHEET_GID, 
  SPPD_SPREADSHEET_URL, 
  SPPD_SHEET_HEADERS,
  formatSPPDListForSheet,
  generateCopyableSheetText,
  getAppsScriptBridgeCodeSnippet
} from '../data/sppdSpreadsheetData';

export interface SyncAuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  count: number;
  status: 'SUCCESS' | 'ERROR' | 'INFO';
  detail: string;
}

interface SppdSpreadsheetBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sppdList: PerjalananDinasRecord[];
  isSyncing: boolean;
  lastSyncTime: string;
  syncedRowCount: number;
  onPullData: () => Promise<void>;
  onPushData: () => Promise<void>;
  webhookUrl: string;
  onSaveWebhookUrl: (url: string) => void;
  autoSyncEnabled: boolean;
  onToggleAutoSync: (val: boolean) => void;
  syncAuditLogs: SyncAuditLogItem[];
  onClearLogs: () => void;
}

export const SppdSpreadsheetBridgeModal: React.FC<SppdSpreadsheetBridgeModalProps> = ({
  isOpen,
  onClose,
  sppdList,
  isSyncing,
  lastSyncTime,
  syncedRowCount,
  onPullData,
  onPushData,
  webhookUrl,
  onSaveWebhookUrl,
  autoSyncEnabled,
  onToggleAutoSync,
  syncAuditLogs,
  onClearLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'webhook' | 'copy' | 'logs'>('sync');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedData, setCopiedData] = useState(false);
  const [localWebhookUrl, setLocalWebhookUrl] = useState(webhookUrl);
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [savedWebhookNotice, setSavedWebhookNotice] = useState(false);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    const code = getAppsScriptBridgeCodeSnippet();
    navigator.clipboard.writeText(code);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleCopyData = () => {
    const text = generateCopyableSheetText(sppdList);
    navigator.clipboard.writeText(text);
    setCopiedData(true);
    setTimeout(() => setCopiedData(false), 3000);
  };

  const handleSaveWebhook = () => {
    setIsSavingWebhook(true);
    onSaveWebhookUrl(localWebhookUrl.trim());
    setTimeout(() => {
      setIsSavingWebhook(false);
      setSavedWebhookNotice(true);
      setTimeout(() => setSavedWebhookNotice(false), 3000);
    }, 400);
  };

  const formattedRows = formatSPPDListForSheet(sppdList);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-emerald-200/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white flex items-center justify-between border-b border-emerald-600">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs border border-white/20">
              <ArrowRightLeft className="h-6 w-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Jembatan Integrasi Google Spreadsheet SPD
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/25 px-2 py-0.5 text-[10px] font-bold text-emerald-100 border border-emerald-300/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                  Online Bridge
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Sinkronisasi Dua Arah Data Perjalanan Dinas ASN BKHIT (ID: <span className="font-mono text-white font-semibold">{SPPD_SPREADSHEET_ID}</span> | gid: <span className="font-mono text-white font-semibold">{SPPD_SPREADSHEET_GID}</span>)
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2 gap-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-700 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Sinkronisasi Data (Tarik / Kirim)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('webhook')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'webhook'
                ? 'border-emerald-600 text-emerald-700 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Jembatan Webhook (Apps Script)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('copy')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'copy'
                ? 'border-emerald-600 text-emerald-700 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            <span>Format Kolom & Salin Data</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'logs'
                ? 'border-emerald-600 text-emerald-700 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Riwayat Log ({syncAuditLogs.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-170px)] space-y-5">
          
          {/* TAB 1: SINKRONISASI DUA ARAH */}
          {activeTab === 'sync' && (
            <div className="space-y-5">
              {/* Status Ringkasan Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status Jembatan</div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Terhubung Aktif</span>
                  </div>
                  <div className="mt-1 text-[11px] font-mono text-slate-600 truncate">
                    gid: {SPPD_SPREADSHEET_GID}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Terakhir Sinkron</div>
                  <div className="mt-1 text-xs font-bold text-slate-800 truncate">
                    {lastSyncTime}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {syncedRowCount > 0 ? `${syncedRowCount} data sheet disinkronkan` : 'Siap disinkronkan'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Data SPD di Aplikasi</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {sppdList.length} Berkas Perjalanan Dinas
                  </div>
                  <div className="mt-1 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Tersimpan di Penyimpanan Lokal</span>
                  </div>
                </div>
              </div>

              {/* Dua Aksi Utama: Tarik Data vs Kirim Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Tarik Data Inbound */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <DownloadCloud className="h-5 w-5 text-emerald-600" />
                      <h4>Tarik Data dari Google Spreadsheet</h4>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Membaca baris SPD yang diperbarui oleh admin/staf keuangan langsung di Google Spreadsheet (gid: {SPPD_SPREADSHEET_GID}) dan menyinkronkannya ke daftar SPD aplikasi.
                    </p>
                    <div className="mt-3 text-[11px] text-emerald-700 bg-emerald-100/70 rounded-lg p-2.5 border border-emerald-200/80">
                      <strong>Metode:</strong> GViz JSON Engine & CSV Direct Stream (Otomatis & Tanpa Akses Token).
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onPullData}
                    disabled={isSyncing}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Menghubungi Spreadsheet...' : 'Tarik & Sinkronkan Sekarang'}</span>
                  </button>
                </div>

                {/* 2. Kirim Data Outbound */}
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-cyan-800 font-bold text-sm">
                      <UploadCloud className="h-5 w-5 text-cyan-600" />
                      <h4>Kirim Data ke Google Spreadsheet</h4>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Mengirimkan {sppdList.length} data SPD yang terdaftar di aplikasi ke tab Google Spreadsheet agar sinkron dengan sheet rekapitulasi keuangan.
                    </p>
                    <div className="mt-3 text-[11px] text-cyan-800 bg-cyan-100/70 rounded-lg p-2.5 border border-cyan-200/80">
                      <strong>Metode:</strong> {webhookUrl ? 'Apps Script Webhook (Otomatis)' : 'Salin 6 Kolom TSV / Tempel Langsung di Sel A2'}.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onPushData}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs py-3 px-4 shadow-sm transition-all cursor-pointer"
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>{webhookUrl ? 'Kirim ke Spreadsheet via Webhook' : 'Salin Semua Baris SPD (Siap Paste)'}</span>
                  </button>
                </div>
              </div>

              {/* Opsi Auto-Sync Switch */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Otomatis Sinkronkan Saat Membuka Tab Laporan SPD
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Aplikasi akan memeriksa pembaruan data secara live di latar belakang setiap kali menu dibuka.
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSyncEnabled}
                    onChange={(e) => onToggleAutoSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Tautan Eksternal Spreadsheet */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">URL Google Spreadsheet:</span>
                  <span className="font-mono text-[11px] text-slate-500 truncate max-w-xs">
                    https://docs.google.com/spreadsheets/d/{SPPD_SPREADSHEET_ID}...
                  </span>
                </div>
                <a
                  href={SPPD_SPREADSHEET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-200 rounded-lg px-3 py-1.5 shrink-0 shadow-2xs"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Buka di Google Sheets Tab Baru</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: WEBHOOK APPS SCRIPT */}
          {activeTab === 'webhook' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs text-blue-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-blue-800">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span>Koneksi Realtime Bebas Login dengan Google Apps Script Webhook</span>
                </div>
                <p className="leading-relaxed">
                  Dengan memasang Apps Script Web App pada spreadsheet, aplikasi SIMPEG dapat membaca dan menulis data secara langsung tanpa perlu otentikasi login Google setiap kali sinkronisasi.
                </p>
              </div>

              {/* Form Input Webhook URL */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  URL Webhook Google Apps Script (Opsional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={localWebhookUrl}
                    onChange={(e) => setLocalWebhookUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveWebhook}
                    disabled={isSavingWebhook}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSavingWebhook ? 'Menyimpan...' : 'Simpan Webhook'}
                  </button>
                </div>
                {savedWebhookNotice && (
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Webhook URL berhasil disimpan!
                  </p>
                )}
                <p className="text-[11px] text-slate-500">
                  Jika belum memiliki Webhook URL, ikuti panduan kode skrip di bawah ini.
                </p>
              </div>

              {/* Petunjuk & Kode Apps Script */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 text-slate-100">
                <div className="bg-slate-800/90 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Kode Google Apps Script Siap Pakai</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Salin Kode Skrip
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-60 bg-slate-950 text-slate-300">
                  <pre>{getAppsScriptBridgeCodeSnippet()}</pre>
                </div>

                <div className="p-4 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-300 space-y-1.5">
                  <div className="font-bold text-emerald-400">Langkah Pemasangan di Google Spreadsheet:</div>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-400 text-[11px]">
                    <li>Buka spreadsheet target (<span className="text-white font-mono">{SPPD_SPREADSHEET_ID}</span>).</li>
                    <li>Klik menu <strong>Extensions (Ekstensi) &gt; Apps Script</strong>.</li>
                    <li>Hapus kode bawaan, lalu <strong>Paste (Tempel)</strong> kode di atas.</li>
                    <li>Klik <strong>Deploy (Terapkan) &gt; New deployment</strong>, pilih jenis <strong>Web app</strong>.</li>
                    <li>Pilih <em>Who has access</em>: <strong>Anyone (Siapa saja)</strong>, klik Deploy.</li>
                    <li>Salin <strong>Web app URL</strong> yang dihasilkan dan tempel pada input Webhook di atas.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FORMAT KOLOM & SALIN DATA */}
          {activeTab === 'copy' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Format Kolom Google Spreadsheet (gid: {SPPD_SPREADSHEET_GID})</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Data diformat ke dalam 6 kolom standar untuk ditempel di sel A2:
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyData}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  {copiedData ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Tersalin ke Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Salin Seluruh Baris ({sppdList.length} Baris)
                    </>
                  )}
                </button>
              </div>

              {/* Kolom Indikator */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
                {SPPD_SHEET_HEADERS.map((header, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 font-bold text-emerald-800 text-[11px]">
                    <div className="text-[9px] text-emerald-600 font-mono">Kolom {String.fromCharCode(65 + idx)}</div>
                    <div className="truncate">{header}</div>
                  </div>
                ))}
              </div>

              {/* Tabel Pratinjau Baris */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                <div className="max-h-72 overflow-x-auto overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700">
                        <th className="p-2.5 w-12 text-center">No</th>
                        {SPPD_SHEET_HEADERS.map((h, i) => (
                          <th key={i} className="p-2.5 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                      {formattedRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/80">
                          <td className="p-2.5 text-center font-mono text-slate-400">{rIdx + 1}</td>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2.5 max-w-xs truncate" title={cell}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RIWAYAT LOG AUDIT */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-800">Catatan Aktivitas Sinkronisasi Jembatan SPD</span>
                <button
                  type="button"
                  onClick={onClearLogs}
                  className="text-red-600 hover:text-red-700 font-medium hover:underline text-xs cursor-pointer"
                >
                  Bersihkan Log
                </button>
              </div>

              {syncAuditLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  Belum ada catatan aktivitas.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {syncAuditLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                        log.status === 'SUCCESS' 
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                          : log.status === 'ERROR'
                          ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block h-2 w-2 rounded-full ${
                            log.status === 'SUCCESS' ? 'bg-emerald-500' : log.status === 'ERROR' ? 'bg-rose-500' : 'bg-slate-400'
                          }`} />
                          <span className="font-bold text-xs">{log.action}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/70 border border-slate-200">
                            {log.count} Data
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 pl-4">{log.detail}</p>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 shrink-0">
                        {log.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Info className="h-4 w-4 text-slate-400 shrink-0" />
            <span>ID Spreadsheet: <span className="font-mono text-slate-700 font-semibold">{SPPD_SPREADSHEET_ID}</span></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
