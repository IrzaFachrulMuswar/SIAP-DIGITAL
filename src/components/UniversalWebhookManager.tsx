import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  Table, 
  UploadCloud, 
  FileCode, 
  History, 
  Layers, 
  ShieldCheck, 
  Trash2, 
  Settings, 
  Play,
  ArrowRight,
  Database
} from 'lucide-react';
import { 
  UNIVERSAL_SHEET_MODULES, 
  WebhookModuleKey, 
  getUniversalWebhookUrl, 
  setUniversalWebhookUrl, 
  isUniversalAutoSyncEnabled, 
  setUniversalAutoSyncEnabled, 
  getWebhookAuditLogs, 
  clearWebhookAuditLogs, 
  testUniversalWebhookPing, 
  sendToUniversalWebhook, 
  generateUniversalAppsScriptCode,
  validateWebhookUrl,
  WebhookAuditLog
} from '../utils/universalSheetWebhook';
import { 
  Employee, 
  CutiBKNRecord, 
  KGBRecord, 
  MonthlyAttendance, 
  PerjalananDinasRecord 
} from '../types';

interface UniversalWebhookManagerProps {
  spreadsheetId: string;
  employees: Employee[];
  cutiList: CutiBKNRecord[];
  kgbList: KGBRecord[];
  attendances: MonthlyAttendance[];
  sppdList: PerjalananDinasRecord[];
  onNotify?: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
}

export const UniversalWebhookManager: React.FC<UniversalWebhookManagerProps> = ({
  spreadsheetId,
  employees,
  cutiList,
  kgbList,
  attendances,
  sppdList,
  onNotify,
}) => {
  const [webhookUrl, setWebhookUrlState] = useState<string>(getUniversalWebhookUrl);
  const [inputUrl, setInputUrl] = useState<string>(getUniversalWebhookUrl);
  const [autoSync, setAutoSync] = useState<boolean>(isUniversalAutoSyncEnabled);
  const [activeSubTab, setActiveSubTab] = useState<'modules' | 'script' | 'schemas' | 'logs'>('modules');

  // Async states
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingModule, setSyncingModule] = useState<string | null>(null);
  const [isInitializingSheets, setIsInitializingSheets] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [pingSuccess, setPingSuccess] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [logs, setLogs] = useState<WebhookAuditLog[]>(getWebhookAuditLogs);

  useEffect(() => {
    const currentLogs = getWebhookAuditLogs();
    setLogs(currentLogs);
  }, []);

  const refreshLogs = () => {
    setLogs(getWebhookAuditLogs());
  };

  const handleSaveUrl = () => {
    const clean = inputUrl.trim();
    setUniversalWebhookUrl(clean);
    setWebhookUrlState(clean);
    setStatusMessage('URL Webhook berhasil disimpan!');
    setPingSuccess(null);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleToggleAutoSync = () => {
    const next = !autoSync;
    setAutoSync(next);
    setUniversalAutoSyncEnabled(next);
    setStatusMessage(next ? 'Auto-sync aktif: Setiap input web akan langsung dikirim ke Google Sheets.' : 'Auto-sync nonaktif.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleTestPing = async () => {
    const target = inputUrl.trim() || webhookUrl;
    if (!target) {
      setStatusMessage('Silakan masukkan URL Webhook terlebih dahulu.');
      return;
    }

    setIsTesting(true);
    setStatusMessage(null);
    const result = await testUniversalWebhookPing(target);
    setIsTesting(false);
    setPingSuccess(result.success);
    setStatusMessage(result.message);
    refreshLogs();
    if (onNotify) {
      onNotify(result.success ? 'Koneksi Berhasil' : 'Koneksi Gagal', result.message, result.success ? 'success' : 'error');
    }
  };

  const handleCopyScript = () => {
    const code = generateUniversalAppsScriptCode(spreadsheetId);
    navigator.clipboard.writeText(code);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  // Inisialisasi Seluruh Tab di Google Sheets via Webhook
  const handleInitSheets = async () => {
    if (!webhookUrl) {
      setStatusMessage('Simpan URL Webhook terlebih dahulu sebelum inisialisasi.');
      return;
    }
    setIsInitializingSheets(true);
    setStatusMessage(null);

    const result = await sendToUniversalWebhook({
      moduleKey: 'pegawai',
      action: 'sync_all',
      overrideWebhookUrl: webhookUrl,
      customPayload: { action: 'init_all' } as any,
    });

    setIsInitializingSheets(false);
    refreshLogs();
    setStatusMessage(result.message);
    if (onNotify) {
      onNotify('Inisialisasi Sheet', result.message, result.success ? 'success' : 'error');
    }
  };

  // Sinkronkan Satu Modul Tertentu
  const handleSyncSingleModule = async (moduleKey: WebhookModuleKey) => {
    if (!webhookUrl) {
      setStatusMessage('Silakan pasang URL Webhook terlebih dahulu.');
      return;
    }

    setSyncingModule(moduleKey);
    let items: any[] = [];
    switch (moduleKey) {
      case 'pegawai':
        items = employees;
        break;
      case 'cuti':
        items = cutiList;
        break;
      case 'kgb':
        items = kgbList;
        break;
      case 'absensi':
        items = attendances;
        break;
      case 'sppd':
        items = sppdList;
        break;
      default:
        items = [];
    }

    const result = await sendToUniversalWebhook({
      moduleKey,
      action: 'sync_all',
      items,
    });

    setSyncingModule(null);
    refreshLogs();
    setStatusMessage(result.message);
    if (onNotify) {
      onNotify(`Sinkronisasi ${UNIVERSAL_SHEET_MODULES[moduleKey].displayName}`, result.message, result.success ? 'success' : 'error');
    }
  };

  // Sinkronkan Seluruh Modul Sekaligus
  const handleSyncAllModules = async () => {
    if (!webhookUrl) {
      setStatusMessage('Silakan masukkan dan simpan URL Webhook terlebih dahulu.');
      return;
    }

    setIsSyncingAll(true);
    setStatusMessage('Memulai sinkronisasi batch seluruh modul...');

    try {
      // 1. Pegawai
      await sendToUniversalWebhook({ moduleKey: 'pegawai', action: 'sync_all', items: employees });
      // 2. Cuti
      await sendToUniversalWebhook({ moduleKey: 'cuti', action: 'sync_all', items: cutiList });
      // 3. KGB
      await sendToUniversalWebhook({ moduleKey: 'kgb', action: 'sync_all', items: kgbList });
      // 4. Absensi
      await sendToUniversalWebhook({ moduleKey: 'absensi', action: 'sync_all', items: attendances });
      // 5. SPPD
      await sendToUniversalWebhook({ moduleKey: 'sppd', action: 'sync_all', items: sppdList });

      refreshLogs();
      const msg = 'Seluruh data modul (Pegawai, Cuti, KGB, Absensi, SPPD) berhasil dikirim ke masing-masing sheet!';
      setStatusMessage(msg);
      if (onNotify) {
        onNotify('Sinkronisasi Berhasil', msg, 'success');
      }
    } catch (err: any) {
      setStatusMessage('Terjadi kendala saat sinkronisasi batch.');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleClearLogs = () => {
    clearWebhookAuditLogs();
    setLogs([]);
  };

  const getModuleItemCount = (key: WebhookModuleKey): number => {
    switch (key) {
      case 'pegawai':
        return employees.length;
      case 'cuti':
        return cutiList.length;
      case 'kgb':
        return kgbList.length;
      case 'absensi':
        return attendances.length;
      case 'sppd':
        return sppdList.length;
      case 'uang_makan':
        return 5;
      case 'lembur':
        return 3;
      case 'perbendaharaan':
        return 4;
      default:
        return 0;
    }
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 p-5 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-500/20 backdrop-blur-xs rounded-xl border border-emerald-400/30 text-emerald-300 shrink-0">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold tracking-tight">
                  Universal Webhook Router &amp; Gateway Multi-Sheet
                </h3>
                {webhookUrl ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 border border-emerald-400/40 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Webhook Terhubung
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200">
                    Belum Dikonfigurasi
                  </span>
                )}
                {autoSync && webhookUrl && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/20 border border-cyan-400/40 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-200">
                    ⚡ Auto-Sync Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed max-w-3xl">
                Menghubungkan setiap input penambahan dan pembaruan data dari formulir web (Pegawai, Cuti, KGB, Absensi, SPPD, Uang Makan) agar langsung terkirim dan tersimpan secara otomatis ke tab sheet masing-masing pada Google Spreadsheet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              type="button"
              onClick={handleSyncAllModules}
              disabled={isSyncingAll || !webhookUrl}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
              title="Kirim dan sinkronkan data seluruh modul sekaligus ke Google Sheets"
            >
              <UploadCloud className={`h-4 w-4 ${isSyncingAll ? 'animate-bounce' : ''}`} />
              <span>{isSyncingAll ? 'Menyinkronkan...' : 'Sinkronkan Semua Modul'}</span>
            </button>
          </div>
        </div>

        {/* Quick URL Input Bar */}
        <div className="mt-4 pt-4 border-t border-emerald-700/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Tempel URL Web App Google Apps Script (berakhiran /exec)..."
              className="w-full bg-slate-900/60 border border-emerald-500/40 focus:border-emerald-400 rounded-xl px-3.5 py-2 text-xs font-mono text-emerald-100 placeholder-emerald-300/40 focus:outline-hidden"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveUrl}
              className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Simpan URL
            </button>
            <button
              type="button"
              onClick={handleTestPing}
              disabled={isTesting || (!inputUrl && !webhookUrl)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
            </button>
            <button
              type="button"
              onClick={handleToggleAutoSync}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer border ${
                autoSync
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-white/10 text-slate-300 border-white/20 hover:bg-white/20'
              }`}
              title="Aktifkan/Nonaktifkan kirim otomatis saat input data di web"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Auto-Sync: {autoSync ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Real-time URL Input Validation Warning */}
        {inputUrl && !validateWebhookUrl(inputUrl).valid && (
          <div className="mt-2 text-[11px] text-amber-200 bg-amber-950/60 border border-amber-500/40 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-amber-300 shrink-0" />
            <span>{validateWebhookUrl(inputUrl).message}</span>
          </div>
        )}

        {/* Status Alert Banner */}
        {statusMessage && (
          <div className={`mt-3 p-2.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in duration-200 ${
            pingSuccess === false
              ? 'bg-rose-500/90 text-white'
              : pingSuccess === true
              ? 'bg-emerald-500/90 text-white'
              : 'bg-slate-900/80 text-emerald-200 border border-emerald-500/30'
          }`}>
            <div className="flex items-start sm:items-center gap-2">
              {pingSuccess === false ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-200 mt-0.5 sm:mt-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-200 mt-0.5 sm:mt-0" />
              )}
              <span className="leading-relaxed">{statusMessage}</span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {pingSuccess === false && (
                <button
                  type="button"
                  onClick={() => setActiveSubTab('script')}
                  className="rounded-lg bg-white/20 hover:bg-white/30 px-2.5 py-1 text-[11px] font-bold text-white transition-colors cursor-pointer"
                >
                  Panduan Deploy
                </button>
              )}
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-white/80 hover:text-white p-1 rounded-sm text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('modules')}
            className={`flex items-center gap-2 px-3.5 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeSubTab === 'modules'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-4 w-4 text-emerald-600" />
            <span>Daftar 8 Modul &amp; Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('script')}
            className={`flex items-center gap-2 px-3.5 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeSubTab === 'script'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="h-4 w-4 text-emerald-600" />
            <span>Master Kode Apps Script (Code.gs)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('schemas')}
            className={`flex items-center gap-2 px-3.5 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeSubTab === 'schemas'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="h-4 w-4 text-emerald-600" />
            <span>Struktur Kolom per Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('logs');
              refreshLogs();
            }}
            className={`flex items-center gap-2 px-3.5 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeSubTab === 'logs'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="h-4 w-4 text-emerald-600" />
            <span>Log Audit Transaksi ({logs.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleInitSheets}
            disabled={isInitializingSheets || !webhookUrl}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            title="Kirim perintah untuk membuat seluruh 8 sheet dan header di spreadsheet secara otomatis"
          >
            <Database className={`h-3.5 w-3.5 text-emerald-600 ${isInitializingSheets ? 'animate-spin' : ''}`} />
            <span>{isInitializingSheets ? 'Menginisialisasi...' : 'Inisialisasi Otomatis 8 Sheet'}</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-5">
        {/* SUBTAB 1: DAFTAR 8 MODUL */}
        {activeSubTab === 'modules' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Routing Data Modul ke Tab Spreadsheet
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap kali ada input data baru atau pembaruan di modul web, router akan mengarahkannya ke tab yang bersangkutan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {(Object.keys(UNIVERSAL_SHEET_MODULES) as WebhookModuleKey[]).map((key) => {
                const def = UNIVERSAL_SHEET_MODULES[key];
                const count = getModuleItemCount(key);
                const isSyncingThis = syncingModule === key;

                return (
                  <div 
                    key={key} 
                    className="rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 p-4 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            {def.targetSheet}
                          </span>
                          <h5 className="text-xs font-bold text-slate-800 mt-2">
                            {def.displayName}
                          </h5>
                        </div>
                        <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-2xs">
                          {count} Data
                        </span>
                      </div>

                      <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                        <p>Kunci: <span className="font-semibold text-slate-700">{def.keyDescription}</span></p>
                        <p>Jumlah Kolom: <span className="font-semibold text-slate-700">{def.headers.length} Kolom</span></p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400">
                        {autoSync ? 'Auto-sync siap' : 'Sync manual'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSyncSingleModule(key)}
                        disabled={isSyncingThis || !webhookUrl}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                        title={`Kirim data ${def.displayName} ke tab ${def.targetSheet}`}
                      >
                        <RefreshCw className={`h-3 w-3 ${isSyncingThis ? 'animate-spin' : ''}`} />
                        <span>{isSyncingThis ? 'Mengirim...' : 'Sinkronkan'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBTAB 2: KODE MASTER GOOGLE APPS SCRIPT (CODE.GS) */}
        {activeSubTab === 'script' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div>
                <h4 className="text-xs font-bold text-emerald-900">
                  Kode Sumber Universal Google Apps Script (Code.gs)
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Salin kode ini dan pasang pada menu <strong>Extensions &gt; Apps Script</strong> di Google Spreadsheet Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyScript}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-center shrink-0"
              >
                {copiedScript ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copiedScript ? 'Kode Berhasil Disalin!' : 'Salin Seluruh Code.gs'}</span>
              </button>
            </div>

            {/* Panduan 6 Langkah */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Panduan 6 Langkah Penerapan di Google Spreadsheet</span>
              </h5>
              <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
                <li className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-emerald-700 block mb-1">1. Buka Apps Script</span>
                  Buka Google Spreadsheet target, klik menu atas: <strong>Extensions (Ekstensi) &gt; Apps Script</strong>.
                </li>
                <li className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-emerald-700 block mb-1">2. Tempelkan Code.gs</span>
                  Hapus kode bawaan di file <code>Code.gs</code>, lalu tempelkan seluruh kode dari tombol di atas.
                </li>
                <li className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-emerald-700 block mb-1">3. Simpan Proyek</span>
                  Klik ikon disket <strong>Save (Simpan)</strong> atau tekan <code>Ctrl + S</code>.
                </li>
                <li className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-emerald-700 block mb-1">4. Klik Deploy Web App</span>
                  Klik tombol biru <strong>Deploy &gt; New deployment</strong>. Pilih type <strong>Web app</strong>.
                </li>
                <li className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-emerald-700 block mb-1">5. Atur Hak Akses</span>
                  Pilih <strong>Execute as: Me</strong> dan <strong>Who has access: Anyone</strong>. Klik <em>Deploy</em>.
                </li>
                <li className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-emerald-700 block mb-1">6. Salin &amp; Tempel Web URL</span>
                  Salin URL berakhiran <code>/exec</code>, tempelkan ke kolom Webhook di atas, lalu klik <strong>Simpan URL</strong>.
                </li>
              </ol>
            </div>

            {/* Code Viewer */}
            <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-emerald-300 max-h-96 overflow-y-auto leading-relaxed shadow-inner">
              <pre>{generateUniversalAppsScriptCode(spreadsheetId)}</pre>
            </div>
          </div>
        )}

        {/* SUBTAB 3: STRUKTUR KOLOM SELURUH SHEET */}
        {activeSubTab === 'schemas' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-500">
              Format baku susunan kolom yang otomatis dibentuk oleh Google Apps Script untuk setiap modul:
            </div>

            <div className="space-y-3">
              {(Object.keys(UNIVERSAL_SHEET_MODULES) as WebhookModuleKey[]).map((key) => {
                const def = UNIVERSAL_SHEET_MODULES[key];
                return (
                  <div key={key} className="rounded-xl border border-slate-200 p-3 bg-white">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">{def.displayName}</span>
                        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                          Tab: {def.targetSheet}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {def.headers.length} Kolom
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {def.headers.map((h, i) => (
                        <span 
                          key={i} 
                          className={`text-[10px] px-2 py-1 rounded border font-medium ${
                            i === def.keyColumnIndex - 1
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span className="text-slate-400 mr-1">{i + 1}.</span>
                          {h}
                          {i === def.keyColumnIndex - 1 && ' (Key)'}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBTAB 4: LOG AUDIT TRANSAKSI */}
        {activeSubTab === 'logs' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Catatan riwayat transaksi pengiriman data ke Google Sheets melalui Universal Webhook Router.
              </p>
              {logs.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Bersihkan Riwayat</span>
                </button>
              )}
            </div>

            {logs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-400">
                Belum ada transaksi pengiriman data. Transaksi akan otomatis tercatat setiap kali ada aksi input atau sinkronisasi.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">Waktu</th>
                      <th className="px-3 py-2.5">Target Tab</th>
                      <th className="px-3 py-2.5">Aksi</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Keterangan Transaksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-emerald-700">
                          {log.targetSheet}
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                          {log.action}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                            log.status === 'success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {log.status === 'success' ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            <span>{log.status === 'success' ? 'Terkirim' : 'Gagal'}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-700 max-w-xs truncate">
                          {log.summary}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
