import { 
  Employee, 
  CutiBKNRecord, 
  KGBRecord, 
  MonthlyAttendance, 
  PerjalananDinasRecord, 
  UangMakanRecord, 
  LemburRecord, 
  PerbendaharaanRecord 
} from '../types';

export type WebhookModuleKey = 
  | 'pegawai' 
  | 'cuti' 
  | 'kgb' 
  | 'absensi' 
  | 'sppd' 
  | 'uang_makan' 
  | 'lembur' 
  | 'perbendaharaan';

export interface WebhookAuditLog {
  id: string;
  timestamp: string;
  moduleKey: WebhookModuleKey;
  targetSheet: string;
  action: 'append' | 'update' | 'sync_all' | 'ping' | 'init_all';
  status: 'success' | 'sent_queued' | 'error';
  summary: string;
  error?: string;
  rowCount?: number;
}

export interface SheetModuleDefinition {
  moduleKey: WebhookModuleKey;
  targetSheet: string;
  alternateSheets?: string[];
  gid: string;
  displayName: string;
  headers: string[];
  columnWidths: number[];
  keyColumnIndex: number; // 1-based index in the sheet
  keyDescription: string;
}

export const UNIVERSAL_SHEET_MODULES: Record<WebhookModuleKey, SheetModuleDefinition> = {
  pegawai: {
    moduleKey: 'pegawai',
    targetSheet: 'Data_pegawai',
    alternateSheets: ['data pegawai', 'Data Pegawai'],
    gid: '1688113153',
    displayName: '1. Data_pegawai (Baca Langsung)',
    headers: [
      'NIP',
      'Nama Lengkap',
      'Jabatan',
      'Pangkat / Golongan',
      'Unit Kerja',
      'Status Pegawai',
      'Gaji Pokok',
      'Email Pribadi',
      'Nomor HP',
    ],
    columnWidths: [180, 240, 220, 160, 200, 130, 140, 200, 140],
    keyColumnIndex: 1,
    keyDescription: 'NIP Pegawai',
  },
  cuti: {
    moduleKey: 'cuti',
    targetSheet: 'Pengajuan_Cuti',
    alternateSheets: ['Pengajuan Cuti', 'pengajuan cuti'],
    gid: '1792882133',
    displayName: '2. Pengajuan_Cuti (Input Data)',
    headers: [
      'No Permohonan',
      'NIP',
      'Nama Pemohon',
      'Jenis Cuti (BKN 24/2017)',
      'Alasan Permohonan',
      'Lama (Hari)',
      'Tgl Mulai',
      'Tgl Selesai',
      'Link Permohonan Cuti',
    ],
    columnWidths: [170, 180, 220, 210, 240, 110, 120, 120, 220],
    keyColumnIndex: 1,
    keyDescription: 'Nomor Permohonan Cuti',
  },
  absensi: {
    moduleKey: 'absensi',
    targetSheet: 'Absensi_Bulanan',
    alternateSheets: ['absensi bulanan', 'Absensi Bulanan'],
    gid: '275731863',
    displayName: '3. Absensi_Bulanan (Baca Langsung)',
    headers: [
      'NO',
      'Unit Kerja',
      'Nama Pegawai',
      'NIP Pegawai',
      'Hari',
      'Tgl Presensi',
      'Tgl Aktual',
      'Presensi Masuk',
      'Batas Presensi Masuk',
      'Presensi Pulang',
      'Batas Presensi Pulang',
      'Terlambat (Menit)',
      'Pulang Sebelum Waktu (Menit)',
      'Jumlah (Menit)',
      'O/A',
      'Lokasi',
      'Status',
    ],
    columnWidths: [60, 180, 200, 170, 90, 110, 110, 110, 130, 110, 130, 120, 150, 110, 80, 150, 110],
    keyColumnIndex: 1,
    keyDescription: 'Nomor Urut / Tanggal Presensi',
  },
  kgb: {
    moduleKey: 'kgb',
    targetSheet: 'KGB_Berkala',
    alternateSheets: ['KGB Berkala', 'kgb berkala'],
    gid: '1832091216',
    displayName: '4. KGB_Berkala (Input Data & Hitung 2 Thn)',
    headers: [
      'Jabatan',
      'Pangkat / Golongan',
      'Gaji Pokok Lama',
      'Gaji Pokok Baru',
      'TMT KGB Baru',
      'Nomor SK KGB',
    ],
    columnWidths: [220, 170, 150, 150, 130, 200],
    keyColumnIndex: 6,
    keyDescription: 'Nomor SK KGB',
  },
  sppd: {
    moduleKey: 'sppd',
    targetSheet: 'SPPD_Dinas',
    alternateSheets: ['SPPD Dinas', 'sppd dinas'],
    gid: '1303409856',
    displayName: '5. SPPD_Dinas (Input Data)',
    headers: [
      'Nomor SPPD & Pegawai',
      'Kota Tujuan',
      'Durasi',
      'Maksud Perjalanan',
      'Rincian Biaya',
      'Link File SPPD',
    ],
    columnWidths: [260, 180, 120, 260, 240, 200],
    keyColumnIndex: 1,
    keyDescription: 'Nomor SPPD & Pegawai',
  },
  uang_makan: {
    moduleKey: 'uang_makan',
    targetSheet: 'Uang_Makan',
    alternateSheets: ['uang makan', 'Uang Makan'],
    gid: '1590038364',
    displayName: '6. Uang_Makan (Input Data)',
    headers: [
      'Bulan',
      'Tahun',
      'Jumlah Pegawai',
      'Total Hari Hadir',
      'Total Bruto',
      'Total PPh 21',
      'Total Netto',
      'Link SP2D',
    ],
    columnWidths: [140, 90, 130, 130, 150, 140, 150, 180],
    keyColumnIndex: 1,
    keyDescription: 'Bulan & Tahun',
  },
  lembur: {
    moduleKey: 'lembur',
    targetSheet: 'Lembur_ASN',
    alternateSheets: ['lembur ASN', 'Lembur ASN', 'Lembur'],
    gid: '943482291',
    displayName: '7. Lembur_ASN (Input Data)',
    headers: [
      'Tahun',
      'Bulan',
      'Nomor SPK Lembur',
      'Total Uang Lembur',
      'Link File SP2D',
    ],
    columnWidths: [100, 140, 200, 160, 200],
    keyColumnIndex: 3,
    keyDescription: 'Nomor SPK Lembur',
  },
  perbendaharaan: {
    moduleKey: 'perbendaharaan',
    targetSheet: 'Perbendaharaan',
    alternateSheets: ['perbendaharaan'],
    gid: '820261205',
    displayName: '8. Perbendaharaan (Input Data)',
    headers: [
      'Nomor Dokumen',
      'Jenis Pembayaran',
      'Tanggal Terbit',
      'Jumlah Nominal',
      'Uraian Pengeluaran',
      'Link File SP2D',
    ],
    columnWidths: [190, 150, 130, 160, 260, 200],
    keyColumnIndex: 1,
    keyDescription: 'Nomor Dokumen',
  },
};

// Key storage constants
const STORAGE_WEBHOOK_URL = 'simpeg_universal_webhook_url';
const STORAGE_AUTOSYNC = 'simpeg_webhook_autosync_enabled';
const STORAGE_LOGS = 'simpeg_webhook_audit_logs';
const SPPD_LEGACY_KEY = 'sppd_bridge_webhook_url';

/**
 * Mendapatkan URL Webhook Google Apps Script universal
 */
export function getUniversalWebhookUrl(): string {
  const url = localStorage.getItem(STORAGE_WEBHOOK_URL);
  if (url && url.trim()) return url.trim();
  const legacy = localStorage.getItem(SPPD_LEGACY_KEY);
  if (legacy && legacy.trim()) return legacy.trim();
  return '';
}

export const getStoredUniversalWebhookUrl = getUniversalWebhookUrl;

/**
 * Menyimpan URL Webhook Google Apps Script universal
 */
export function setUniversalWebhookUrl(url: string): void {
  const clean = (url || '').trim();
  localStorage.setItem(STORAGE_WEBHOOK_URL, clean);
  localStorage.setItem(SPPD_LEGACY_KEY, clean); // Sync with SPPD module
}

/**
 * Memeriksa apakah fitur auto-sync otomatis aktif saat input data
 */
export function isUniversalAutoSyncEnabled(): boolean {
  const val = localStorage.getItem(STORAGE_AUTOSYNC);
  if (val === null) return true; // Default ON
  return val === 'true';
}

/**
 * Mengubah status auto-sync
 */
export function setUniversalAutoSyncEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_AUTOSYNC, enabled ? 'true' : 'false');
}

/**
 * Validasi URL Webhook Google Apps Script
 */
export function validateWebhookUrl(url: string): { valid: boolean; message?: string } {
  const clean = (url || '').trim();
  if (!clean) {
    return { valid: false, message: 'URL Webhook belum diisi. Masukkan URL Web App Google Apps Script.' };
  }
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    return { valid: false, message: 'URL Webhook harus diawali dengan https://' };
  }
  if (clean.includes('docs.google.com/spreadsheets')) {
    return { 
      valid: false, 
      message: 'URL yang dimasukkan adalah link Google Spreadsheet, bukan URL Webhook. Buat Web App via Ekstensi > Apps Script > Deploy > New deployment > Web app, lalu salin URL Web App yang berakhiran "/exec".' 
    };
  }
  if (clean.includes('script.google.com/d/') || clean.endsWith('/edit')) {
    return { 
      valid: false, 
      message: 'URL yang dimasukkan adalah link editor skrip Apps Script. Buka menu Deploy > Manage deployments, lalu salin URL Web App yang berakhiran "/exec".' 
    };
  }
  return { valid: true };
}

/**
 * Mengambil riwayat log audit webhook
 */
export function getWebhookAuditLogs(): WebhookAuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_LOGS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Menambahkan catatan log audit baru (maksimal simpan 50 log terakhir)
 */
export function addWebhookAuditLog(log: Omit<WebhookAuditLog, 'id' | 'timestamp'>): WebhookAuditLog {
  const newLog: WebhookAuditLog = {
    ...log,
    id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: 'short',
    }),
  };

  try {
    const current = getWebhookAuditLogs();
    const updated = [newLog, ...current].slice(0, 50);
    localStorage.setItem(STORAGE_LOGS, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save webhook audit log:', err);
  }

  return newLog;
}

/**
 * Membersihkan riwayat log
 */
export function clearWebhookAuditLogs(): void {
  localStorage.removeItem(STORAGE_LOGS);
}

// ---------------------------------------------------------------------------
// FORMATTER ROW SETIAP MODUL KE GOOGLE SPREADSHEET
// ---------------------------------------------------------------------------

export function formatEmployeeToRow(emp: Employee): string[] {
  const fullName = `${emp.gelarDepan ? emp.gelarDepan + ' ' : ''}${emp.nama}${emp.gelarBelakang ? ', ' + emp.gelarBelakang : ''}`.trim();
  return [
    emp.nip || '-',
    fullName,
    emp.jabatan || '-',
    emp.pangkatGolongan || '-',
    emp.unitKerja || '-',
    emp.statusPegawai || 'PNS',
    `Rp ${(emp.gajiPokok || 0).toLocaleString('id-ID')}`,
    emp.email || '-',
    emp.telepon || '-',
  ];
}

export function formatCutiToRow(cuti: CutiBKNRecord): string[] {
  const link = (cuti as any).linkPermohonanCuti || cuti.dokumenPendukung?.fileData || cuti.dokumenPendukung?.fileName || '-';
  return [
    cuti.noPermohonan,
    cuti.nip,
    cuti.employeeName,
    cuti.jenisCuti,
    cuti.alasanCuti,
    String(cuti.lamaHari),
    cuti.tanggalMulai,
    cuti.tanggalSelesai,
    link,
  ];
}

export function formatAttendanceToRow(att: any): string[] {
  return [
    String(att.no || '1'),
    att.unitKerja || 'Balai Karantina PBD',
    att.namaPegawai || 'Pegawai',
    att.nipPegawai || att.nip || '-',
    att.hari || 'Senin',
    att.tglPresensi || new Date().toISOString().slice(0, 10),
    att.tglAktual || new Date().toISOString().slice(0, 10),
    att.presensiMasuk || '07:30',
    att.batasPresensiMasuk || '08:00',
    att.presensiPulang || '16:30',
    att.batasPresensiPulang || '16:00',
    String(att.terlambatMenit ?? 0),
    String(att.pulangSebelumWaktuMenit ?? 0),
    String(att.jumlahMenit ?? 510),
    att.oa || '-',
    att.lokasi || 'Kantor Balai Karantina',
    att.status || 'Hadir',
  ];
}

export function formatKGBToRow(kgb: KGBRecord): string[] {
  const lama = typeof kgb.gajiLama === 'number' ? `Rp ${kgb.gajiLama.toLocaleString('id-ID')}` : String(kgb.gajiLama || '0');
  const baru = typeof kgb.gajiBaru === 'number' ? `Rp ${kgb.gajiBaru.toLocaleString('id-ID')}` : String(kgb.gajiBaru || '0');
  return [
    kgb.jabatan || '-',
    kgb.pangkatGolongan || '-',
    lama,
    baru,
    kgb.tmtGajiBaru || '-',
    kgb.noSK || '-',
  ];
}

export function formatSPPDToRow(sppd: PerjalananDinasRecord): string[] {
  const nomor = sppd.nomorSPD || sppd.nomorSPPD || sppd.nomorSuratTugas || 'SPD';
  const nama = sppd.namaPegawai || sppd.employeeName || 'Pegawai';
  const tujuan = sppd.tujuanDinas || sppd.kotaTujuan || '-';
  const total = sppd.rincianBiaya?.totalBiaya || 0;
  const link = (sppd as any).linkFileSPPD || sppd.dokumen?.[0]?.url || '-';
  
  return [
    `${nomor} - ${nama}`,
    tujuan,
    `${sppd.lamaHari || 1} Hari`,
    sppd.maksudDinas || sppd.maksudPerjalanan || '-',
    `Rp ${total.toLocaleString('id-ID')}`,
    link,
  ];
}

export function formatUangMakanToRow(um: any): string[] {
  const link = um.linkSp2d || um.linkSP2D || um.nomorSP2DRef || '-';
  return [
    um.bulan,
    String(um.tahun || 2026),
    String(um.jumlahPegawai || 1),
    String(um.totalHariHadir || 20),
    `Rp ${(um.totalBruto || 0).toLocaleString('id-ID')}`,
    `Rp ${(um.totalPph21 || 0).toLocaleString('id-ID')}`,
    `Rp ${(um.totalNetto || 0).toLocaleString('id-ID')}`,
    link,
  ];
}

export function formatLemburToRow(lembur: any): string[] {
  const link = lembur.linkFileSP2D || lembur.dokumen?.[0]?.url || '-';
  const nomor = lembur.nomorSPKLembur || lembur.nomorSPKL || lembur.nomorSuratPerintah || `SPK-${lembur.id || '001'}`;
  const total = lembur.totalUangLembur || 0;
  return [
    String(lembur.tahun || 2026),
    lembur.bulan || 'Maret',
    nomor,
    `Rp ${total.toLocaleString('id-ID')}`,
    link,
  ];
}

export function formatPerbendaharaanToRow(p: any): string[] {
  const link = p.linkFileSP2D || p.nomorSP2DRef || '-';
  return [
    p.nomorDokumen || '-',
    p.jenisPembayaran || p.jenis || 'SP2D',
    p.tanggalTerbit || p.tanggalDokumen || new Date().toISOString().slice(0, 10),
    `Rp ${(p.jumlahNominal || p.nilaiRupiah || 0).toLocaleString('id-ID')}`,
    p.uraianPengeluaran || p.uraian || '-',
    link,
  ];
}

// ---------------------------------------------------------------------------
// UNIVERSAL WEBHOOK DISPATCHER
// ---------------------------------------------------------------------------

export interface SendWebhookOptions {
  moduleKey: WebhookModuleKey;
  action: 'append' | 'update' | 'sync_all' | 'init_all' | 'ping';
  item?: any;
  items?: any[];
  customRow?: string[];
  customRows?: string[][];
  customPayload?: Record<string, any>;
  overrideWebhookUrl?: string;
  silent?: boolean;
}

export const formatKgbToRow = formatKGBToRow;
export const formatSppdToRow = formatSPPDToRow;

export interface WebhookSendResult {
  success: boolean;
  message: string;
  statusCode?: number;
  data?: any;
  error?: string;
}

/**
 * Mengirimkan data perubahan atau penambahan dari modul web ke Google Apps Script Webhook Router.
 * Fungsi ini berjalan secara non-blocking dan toleran terhadap kendala jaringan atau CORS peramban.
 */
export async function sendToUniversalWebhook(options: SendWebhookOptions): Promise<WebhookSendResult> {
  const webhookUrl = (options.overrideWebhookUrl || getUniversalWebhookUrl()).trim();
  const moduleDef = UNIVERSAL_SHEET_MODULES[options.moduleKey];
  const targetSheetName = moduleDef?.targetSheet || options.moduleKey;

  const urlCheck = validateWebhookUrl(webhookUrl);
  if (!urlCheck.valid) {
    const errorMsg = urlCheck.message || 'URL Webhook belum diatur. Buka menu "Database Google Spreadsheet" untuk memasang URL Webhook.';
    addWebhookAuditLog({
      moduleKey: options.moduleKey,
      targetSheet: targetSheetName,
      action: options.action,
      status: 'error',
      summary: `Gagal kirim: ${errorMsg}`,
      error: errorMsg,
    });
    return { success: false, message: errorMsg };
  }

  // Siapkan payload baris data
  let rowToSend: string[] | undefined = options.customRow;
  let rowsToSend: string[][] | undefined = options.customRows;
  let keyValue: string | undefined;

  if (!rowToSend && options.item) {
    switch (options.moduleKey) {
      case 'pegawai':
        rowToSend = formatEmployeeToRow(options.item as Employee);
        keyValue = (options.item as Employee).nip;
        break;
      case 'cuti':
        rowToSend = formatCutiToRow(options.item as CutiBKNRecord);
        keyValue = (options.item as CutiBKNRecord).noPermohonan;
        break;
      case 'kgb':
        rowToSend = formatKGBToRow(options.item as KGBRecord);
        keyValue = (options.item as KGBRecord).nip;
        break;
      case 'absensi':
        rowToSend = formatAttendanceToRow(options.item as MonthlyAttendance);
        keyValue = `${(options.item as MonthlyAttendance).bulan} / ${(options.item as MonthlyAttendance).tahun}`;
        break;
      case 'sppd':
        rowToSend = formatSPPDToRow(options.item as PerjalananDinasRecord);
        keyValue = (options.item as PerjalananDinasRecord).nomorSPD || (options.item as PerjalananDinasRecord).nomorSPPD;
        break;
      case 'uang_makan':
        rowToSend = formatUangMakanToRow(options.item as UangMakanRecord);
        keyValue = (options.item as UangMakanRecord).bulan;
        break;
      case 'lembur':
        rowToSend = formatLemburToRow(options.item as LemburRecord);
        keyValue = (options.item as LemburRecord).nomorSPKL || (options.item as LemburRecord).nomorSuratPerintah;
        break;
      case 'perbendaharaan':
        rowToSend = formatPerbendaharaanToRow(options.item as PerbendaharaanRecord);
        keyValue = (options.item as PerbendaharaanRecord).nomorDokumen;
        break;
    }
  }

  if (!rowsToSend && options.items && options.items.length > 0) {
    rowsToSend = options.items.map((it) => {
      switch (options.moduleKey) {
        case 'pegawai':
          return formatEmployeeToRow(it);
        case 'cuti':
          return formatCutiToRow(it);
        case 'kgb':
          return formatKGBToRow(it);
        case 'absensi':
          return formatAttendanceToRow(it);
        case 'sppd':
          return formatSPPDToRow(it);
        case 'uang_makan':
          return formatUangMakanToRow(it);
        case 'lembur':
          return formatLemburToRow(it);
        case 'perbendaharaan':
          return formatPerbendaharaanToRow(it);
        default:
          return [];
      }
    });
  }

  const payload = {
    action: options.action,
    module: options.moduleKey,
    targetSheet: moduleDef.targetSheet,
    headers: moduleDef.headers,
    keyColumnIndex: moduleDef.keyColumnIndex,
    keyValue: keyValue || (rowToSend ? rowToSend[0] : undefined),
    row: rowToSend,
    rows: rowsToSend,
    timestamp: new Date().toISOString(),
    ...(options.customPayload || {}),
  };

  try {
    let jsonResult: any = null;
    let isSendSuccess = false;
    let fetchErrorDetail: string | null = null;

    // Percobaan 1: Request POST langsung dengan text/plain (bebas CORS preflight)
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });

      if (response.ok || response.type === 'opaque') {
        isSendSuccess = true;
        jsonResult = await response.json().catch(() => null);
      } else {
        fetchErrorDetail = `Server Google Apps Script merespons kode status ${response.status}`;
      }
    } catch (primaryErr: any) {
      // Percobaan 2: Fallback dengan mode 'no-cors' untuk lingkungan browser sandbox
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify(payload),
        });
        isSendSuccess = true;
      } catch (fallbackErr: any) {
        fetchErrorDetail = fallbackErr?.message || primaryErr?.message || 'Network request failed';
      }
    }

    if (isSendSuccess) {
      const successMessage = jsonResult?.message || `Data berhasil dikirim ke tab "${targetSheetName}" di Google Spreadsheet!`;

      addWebhookAuditLog({
        moduleKey: options.moduleKey,
        targetSheet: targetSheetName,
        action: options.action,
        status: 'success',
        summary: `Berhasil kirim ke ${targetSheetName} (${options.action}): ${keyValue || (rowsToSend ? rowsToSend.length + ' baris' : '1 baris')}`,
        rowCount: rowsToSend ? rowsToSend.length : 1,
      });

      return {
        success: true,
        message: successMessage,
        data: jsonResult,
      };
    }

    // Buat pesan diagnostik yang ramah pengguna
    const diagnosticMsg = fetchErrorDetail?.includes('Failed to fetch')
      ? 'Tidak dapat terhubung ke Google Apps Script (Failed to fetch). Pastikan Web App sudah disetel ke "Anyone" saat Deploy, dan URL berakhiran "/exec".'
      : `Gagal mengirim ke Google Spreadsheet: ${fetchErrorDetail || 'Koneksi terputus'}.`;

    console.warn('[UniversalWebhook] Pengiriman belum berhasil:', diagnosticMsg);

    addWebhookAuditLog({
      moduleKey: options.moduleKey,
      targetSheet: targetSheetName,
      action: options.action,
      status: 'error',
      summary: `Gagal kirim ke ${targetSheetName}: ${diagnosticMsg}`,
      error: diagnosticMsg,
    });

    return {
      success: false,
      message: diagnosticMsg,
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Koneksi ke Google Apps Script Webhook terputus.';
    console.warn('[UniversalWebhook] Exception caught:', errorMsg);

    addWebhookAuditLog({
      moduleKey: options.moduleKey,
      targetSheet: targetSheetName,
      action: options.action,
      status: 'error',
      summary: `Gagal kirim ke ${targetSheetName}: ${errorMsg}`,
      error: errorMsg,
    });

    return {
      success: false,
      message: errorMsg,
    };
  }
}

/**
 * Uji koneksi ping ke Webhook URL
 */
export async function testUniversalWebhookPing(url?: string): Promise<{ success: boolean; message: string }> {
  const targetUrl = (url || getUniversalWebhookUrl()).trim();
  const check = validateWebhookUrl(targetUrl);
  if (!check.valid) {
    return {
      success: false,
      message: check.message || 'Masukkan URL Webhook yang valid (dimulai dengan https://script.google.com/macros/s/...)',
    };
  }

  try {
    const payload = {
      action: 'ping',
      timestamp: new Date().toISOString(),
    };

    let reached = false;
    let errDetail: string | null = null;
    let jsonResult: any = null;

    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });
      if (res.ok || res.type === 'opaque') {
        reached = true;
        jsonResult = await res.json().catch(() => null);
      }
    } catch (primaryErr: any) {
      try {
        await fetch(targetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload),
        });
        reached = true;
      } catch (fallbackErr: any) {
        errDetail = fallbackErr?.message || primaryErr?.message || 'Failed to fetch';
      }
    }

    if (reached) {
      addWebhookAuditLog({
        moduleKey: 'pegawai',
        targetSheet: 'System_Ping',
        action: 'ping',
        status: 'success',
        summary: 'Uji koneksi ping webhook berhasil terhubung.',
      });
      return {
        success: true,
        message: jsonResult?.message || 'Koneksi Webhook Google Apps Script berhasil terhubung dan siap menerima input data!',
      };
    }

    const failureReason = errDetail?.includes('Failed to fetch')
      ? 'Webhook tidak merespons (Failed to fetch). Pastikan saat Deploy di Apps Script: "Execute as: Me" dan "Who has access: Anyone". Pastikan juga URL berakhiran "/exec".'
      : `Webhook tidak merespons: ${errDetail || 'Koneksi ditolak'}.`;

    addWebhookAuditLog({
      moduleKey: 'pegawai',
      targetSheet: 'System_Ping',
      action: 'ping',
      status: 'error',
      summary: failureReason,
      error: failureReason,
    });

    return {
      success: false,
      message: failureReason,
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Gagal menguji koneksi Webhook: ' + (err?.message || 'Unknown error'),
    };
  }
}

// ---------------------------------------------------------------------------
// MASTER KODE GOOGLE APPS SCRIPT (CODE.GS) SIAP PAKAI
// ---------------------------------------------------------------------------

export function generateUniversalAppsScriptCode(spreadsheetId?: string): string {
  const idStr = spreadsheetId || '1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M';
  
  return `/**
 * ============================================================================
 * UNIVERSAL WEBHOOK ROUTER & DATABASE GATEWAY - SIMPEG BKHIT
 * ============================================================================
 * Target Spreadsheet ID : ${idStr}
 * Instansi              : Balai Karantina Hewan, Ikan, dan Tumbuhan (BKHIT)
 * Fungsi                : Menerima input data otomatis dari Web SIMPEG ke masing-masing sheet:
 *                         - Data_Pegawai (Profil & Status Pegawai)
 *                         - Pengajuan_Cuti (Permohonan Cuti BKN)
 *                         - KGB_Berkala (Kenaikan Gaji Berkala)
 *                         - Absensi_Bulanan (Rekapitulasi Presensi)
 *                         - SPPD_Dinas (Laporan Perjalanan Dinas)
 *                         - Uang_Makan (Rekapitulasi Uang Makan ASN)
 *                         - Lembur_ASN (Surat Perintah Kerja Lembur)
 *                         - Perbendaharaan (Pencairan Kas SPP/SPM/SP2D)
 * ============================================================================
 */

// Skema Header & Konfigurasi Tabel Setiap Modul (8 Sheet Sesuai Database Pengguna)
var MODULE_CONFIG = {
  'data pegawai': {
    headers: ['NIP', 'Nama Lengkap', 'Jabatan', 'Pangkat / Golongan', 'Unit Kerja', 'Status Pegawai', 'Gaji Pokok', 'Email Pribadi', 'Nomor HP'],
    widths: [180, 240, 220, 160, 200, 130, 140, 200, 140],
    keyCol: 1
  },
  'Pengajuan Cuti': {
    headers: ['No Permohonan', 'NIP', 'Nama Pemohon', 'Jenis Cuti (BKN 24/2017)', 'Alasan Permohonan', 'Lama (Hari)', 'Tgl Mulai', 'Tgl Selesai', 'Link Permohonan Cuti'],
    widths: [170, 180, 220, 210, 240, 110, 120, 120, 220],
    keyCol: 1
  },
  'absensi bulanan': {
    headers: ['NO', 'Unit Kerja', 'Nama Pegawai', 'NIP Pegawai', 'Hari', 'Tgl Presensi', 'Tgl Aktual', 'Presensi Masuk', 'Batas Presensi Masuk', 'Presensi Pulang', 'Batas Presensi Pulang', 'Terlambat (Menit)', 'Pulang Sebelum Waktu (Menit)', 'Jumlah (Menit)', 'O/A', 'Lokasi', 'Status'],
    widths: [60, 180, 200, 170, 90, 110, 110, 110, 130, 110, 130, 120, 150, 110, 80, 150, 110],
    keyCol: 1
  },
  'KGB Berkala': {
    headers: ['Jabatan', 'Pangkat / Golongan', 'Gaji Pokok Lama', 'Gaji Pokok Baru', 'TMT KGB Baru', 'Nomor SK KGB'],
    widths: [220, 170, 150, 150, 130, 200],
    keyCol: 6
  },
  'SPPD Dinas': {
    headers: ['Nomor SPPD & Pegawai', 'Kota Tujuan', 'Durasi', 'Maksud Perjalanan', 'Rincian Biaya', 'Link File SPPD'],
    widths: [260, 180, 120, 260, 240, 200],
    keyCol: 1
  },
  'uang makan': {
    headers: ['Bulan', 'Tahun', 'Jumlah Pegawai', 'Total Hari Hadir', 'Total Bruto', 'Total PPh 21', 'Total Netto', 'Link SP2D'],
    widths: [140, 90, 130, 130, 150, 140, 150, 180],
    keyCol: 1
  },
  'lembur ASN': {
    headers: ['Tahun', 'Bulan', 'Nomor SPK Lembur', 'Total Uang Lembur', 'Link File SP2D'],
    widths: [100, 140, 200, 160, 200],
    keyCol: 3
  },
  'Perbendaharaan': {
    headers: ['Nomor Dokumen', 'Jenis Pembayaran', 'Tanggal Terbit', 'Jumlah Nominal', 'Uraian Pengeluaran', 'Link File SP2D'],
    widths: [190, 150, 130, 160, 260, 200],
    keyCol: 1
  }
};

var HEADER_STYLE = {
  bg: '#047857',      // Emerald Green BKHIT
  fontColor: '#FFFFFF',
  fontFamily: 'Arial',
  fontSize: 10,
  rowHeight: 36
};

/**
 * 1. MENU KUSTOM PADA TOOLBAR GOOGLE SPREADSHEET
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📌 SIMPEG BKHIT')
    .addItem('⚡ Inisialisasi Seluruh Sheet & Header Modul', 'menuInitAllSheets')
    .addItem('🔄 Rapikan Semua Format & Lebar Kolom', 'menuFormatAllSheets')
    .addSeparator()
    .addItem('📊 Rekapitulasi Data Semua Modul', 'menuRekapSemuaModul')
    .addItem('ℹ️ Status Integrasi Webhook Web', 'menuCheckWebhookStatus')
    .addToUi();
}

/**
 * 2. ENDPOINT GET (Untuk Membaca Data atau Mengecek Status Server)
 * Akses: https://script.google.com/macros/s/.../exec?sheet=Data_Pegawai
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetParam = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : null;

    if (sheetParam) {
      var sheet = ss.getSheetByName(sheetParam);
      if (!sheet) {
        return createJsonResponse({ status: 'error', message: 'Sheet tidak ditemukan: ' + sheetParam });
      }
      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();
      if (lastRow < 2 || lastCol < 1) {
        return createJsonResponse({ status: 'success', sheet: sheetParam, total: 0, rows: [] });
      }
      var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
      return createJsonResponse({
        status: 'success',
        sheet: sheetParam,
        total: data.length,
        rows: data,
        updatedAt: new Date().toISOString()
      });
    }

    // Default status overview semua sheet
    var sheets = ss.getSheets();
    var summary = [];
    for (var i = 0; i < sheets.length; i++) {
      summary.push({
        name: sheets[i].getName(),
        gid: sheets[i].getSheetId(),
        rowCount: Math.max(0, sheets[i].getLastRow() - 1)
      });
    }

    return createJsonResponse({
      status: 'online',
      message: 'Universal Webhook Router SIMPEG BKHIT aktif.',
      spreadsheetName: ss.getName(),
      spreadsheetId: ss.getId(),
      sheets: summary,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * 3. ENDPOINT POST (Menerima Input Data dari Aplikasi Web)
 * Menerima payload JSON: { action: 'append'|'update'|'sync_all'|'ping', targetSheet: '...', row: [...] }
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ status: 'error', message: 'Payload POST kosong.' });
    }

    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || 'append';

    // A. PING TEST
    if (action === 'ping') {
      return createJsonResponse({
        status: 'success',
        message: 'Koneksi Webhook Universal SIMPEG BKHIT berhasil terverifikasi!',
        timestamp: new Date().toISOString()
      });
    }

    // B. INISIALISASI SELURUH SHEET DARI WEB
    if (action === 'init_all') {
      menuInitAllSheets();
      return createJsonResponse({
        status: 'success',
        message: 'Seluruh sheet dan header modul SIMPEG berhasil diinisialisasi!'
      });
    }

    var targetSheetName = payload.targetSheet || 'Data_Pegawai';
    var sheet = getOrCreateSheet(targetSheetName);

    // C. ACTION: MENAMBAHKAN SATU BARIS BARU (append)
    if (action === 'append' && payload.row) {
      ensureHeaderForSheet(sheet, targetSheetName);
      sheet.appendRow(payload.row);
      var newLastRow = sheet.getLastRow();
      
      // Styling baris baru
      var numCols = payload.row.length;
      var range = sheet.getRange(newLastRow, 1, 1, numCols);
      applyRowStyle(range);

      return createJsonResponse({
        status: 'success',
        message: 'Data baru berhasil ditambahkan ke sheet ' + targetSheetName,
        rowNumber: newLastRow,
        targetSheet: targetSheetName,
        timestamp: new Date().toISOString()
      });
    }

    // D. ACTION: MEMPERBARUI / UPSERT BARIS BERDASARKAN KUNCI UTAMA (update)
    if (action === 'update' && payload.row && payload.keyValue) {
      ensureHeaderForSheet(sheet, targetSheetName);
      var keyCol = payload.keyColumnIndex || 1;
      var lastR = sheet.getLastRow();
      var foundRow = -1;

      if (lastR >= 2) {
        var colVals = sheet.getRange(2, keyCol, lastR - 1, 1).getValues();
        for (var k = 0; k < colVals.length; k++) {
          if (colVals[k][0] && colVals[k][0].toString().trim() === payload.keyValue.toString().trim()) {
            foundRow = k + 2;
            break;
          }
        }
      }

      if (foundRow !== -1) {
        var updateRange = sheet.getRange(foundRow, 1, 1, payload.row.length);
        updateRange.setValues([payload.row]);
        applyRowStyle(updateRange);
        return createJsonResponse({
          status: 'success',
          message: 'Data berhasil diperbarui pada baris ke-' + foundRow + ' sheet ' + targetSheetName,
          rowNumber: foundRow
        });
      } else {
        // Jika tidak ditemukan, fallback ke append
        sheet.appendRow(payload.row);
        var appendedRow = sheet.getLastRow();
        applyRowStyle(sheet.getRange(appendedRow, 1, 1, payload.row.length));
        return createJsonResponse({
          status: 'success',
          message: 'Kunci tidak ditemukan, data otomatis ditambahkan ke baris baru ' + appendedRow,
          rowNumber: appendedRow
        });
      }
    }

    // E. ACTION: SINKRONISASI BATCH / MENULIS ULANG SEMUA BARIS (sync_all)
    if (action === 'sync_all' && payload.rows) {
      ensureHeaderForSheet(sheet, targetSheetName);
      var currentLast = sheet.getLastRow();
      var maxCols = payload.rows.length > 0 ? payload.rows[0].length : 1;

      // Bersihkan baris data lama (baris 2 ke bawah)
      if (currentLast > 1) {
        sheet.getRange(2, 1, currentLast - 1, sheet.getLastColumn()).clearContent();
        sheet.getRange(2, 1, currentLast - 1, sheet.getLastColumn()).clearFormat();
      }

      if (payload.rows.length > 0) {
        var syncRange = sheet.getRange(2, 1, payload.rows.length, maxCols);
        syncRange.setValues(payload.rows);
        applyRowStyle(syncRange);
      }

      return createJsonResponse({
        status: 'success',
        message: 'Berhasil menyinkronkan ' + payload.rows.length + ' baris ke sheet ' + targetSheetName,
        rowCount: payload.rows.length,
        targetSheet: targetSheetName
      });
    }

    return createJsonResponse({
      status: 'error',
      message: 'Aksi (' + action + ') tidak dikenali atau payload tidak sesuai.'
    });

  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS & SHEET FORMATTING
// ---------------------------------------------------------------------------

function getOrCreateSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (sheet) return sheet;

  // Pencarian toleran huruf besar/kecil dan spasi/garis bawah
  var cleanTarget = sheetName.toString().toLowerCase().replace(/[_\s]+/g, ' ').trim();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var curName = sheets[i].getName().toLowerCase().replace(/[_\s]+/g, ' ').trim();
    if (curName === cleanTarget) {
      return sheets[i];
    }
  }

  return ss.insertSheet(sheetName);
}

function ensureHeaderForSheet(sheet, sheetName) {
  var cfg = MODULE_CONFIG[sheetName];
  if (!cfg) {
    var cleanTarget = sheetName.toString().toLowerCase().replace(/[_\s]+/g, ' ').trim();
    var keys = Object.keys(MODULE_CONFIG);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].toLowerCase().replace(/[_\s]+/g, ' ').trim() === cleanTarget) {
        cfg = MODULE_CONFIG[keys[i]];
        break;
      }
    }
  }
  if (!cfg) return;

  var lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    var range = sheet.getRange(1, 1, 1, cfg.headers.length);
    range.setValues([cfg.headers]);
    formatHeaderRange(range, sheet);
    applyColumnWidths(sheet, cfg.widths);
  }
}

function formatHeaderRange(range, sheet) {
  range.setBackground(HEADER_STYLE.bg);
  range.setFontColor(HEADER_STYLE.fontColor);
  range.setFontFamily(HEADER_STYLE.fontFamily);
  range.setFontSize(HEADER_STYLE.fontSize);
  range.setFontWeight('bold');
  range.setHorizontalAlignment('center');
  range.setVerticalAlignment('middle');
  range.setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  sheet.setRowHeight(1, HEADER_STYLE.rowHeight);
  sheet.setFrozenRows(1);
}

function applyColumnWidths(sheet, widths) {
  if (!widths) return;
  for (var i = 0; i < widths.length; i++) {
    sheet.setColumnWidth(i + 1, widths[i]);
  }
}

function applyRowStyle(range) {
  range.setFontFamily('Arial');
  range.setFontSize(10);
  range.setVerticalAlignment('middle');
  range.setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  range.setBorder(true, true, true, true, true, true, '#CBD5E1', SpreadsheetApp.BorderStyle.SOLID);
}

// ---------------------------------------------------------------------------
// FUNGSI MENU TOOLBAR GOOGLE SPREADSHEET
// ---------------------------------------------------------------------------

function menuInitAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var keys = Object.keys(MODULE_CONFIG);

  for (var i = 0; i < keys.length; i++) {
    var sheetName = keys[i];
    var sheet = getOrCreateSheet(sheetName);
    var cfg = MODULE_CONFIG[sheetName];

    var range = sheet.getRange(1, 1, 1, cfg.headers.length);
    range.setValues([cfg.headers]);
    formatHeaderRange(range, sheet);
    applyColumnWidths(sheet, cfg.widths);
  }

  SpreadsheetApp.getUi().alert(
    'Inisialisasi Berhasil',
    'Seluruh 8 sheet modul SIMPEG BKHIT telah siap menerima inputan data dari aplikasi web!\\n\\n' +
    'Sheet yang telah diinisialisasi:\\n- ' + keys.join('\\n- '),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function menuFormatAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var keys = Object.keys(MODULE_CONFIG);

  for (var i = 0; i < keys.length; i++) {
    var sheetName = keys[i];
    var sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      var cfg = MODULE_CONFIG[sheetName];
      applyColumnWidths(sheet, cfg.widths);
      sheet.setRowHeight(1, HEADER_STYLE.rowHeight);
      sheet.setFrozenRows(1);
    }
  }

  SpreadsheetApp.getUi().alert(
    'Format Selesai',
    'Lebar kolom dan estetika visual seluruh tabel telah dirapikan secara otomatis.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function menuRekapSemuaModul() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var keys = Object.keys(MODULE_CONFIG);
  var report = 'Status Rekap Data SIMPEG BKHIT:\\n';

  for (var i = 0; i < keys.length; i++) {
    var sheetName = keys[i];
    var sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      var count = Math.max(0, sheet.getLastRow() - 1);
      report += '• ' + sheetName + ': ' + count + ' data baris (GID: ' + sheet.getSheetId() + ')\\n';
    } else {
      report += '• ' + sheetName + ': Belum Dibuat\\n';
    }
  }

  SpreadsheetApp.getUi().alert('Rekapitulasi Modul', report, SpreadsheetApp.getUi().ButtonSet.OK);
}

function menuCheckWebhookStatus() {
  SpreadsheetApp.getUi().alert(
    'Status Jembatan Webhook',
    'Universal Webhook Router SIMPEG BKHIT aktif dan siap menerima panggilan API dari aplikasi web.\\n\\n' +
    'Pastikan saat deployment:\\n' +
    '1. Execute as: Me (akun Anda)\\n' +
    '2. Who has access: Anyone (Siapa saja)',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
}
