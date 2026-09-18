/**
 * Jembatan Integrasi Google Spreadsheet - Laporan Perjalanan Dinas (SPD)
 * Terhubung ke Google Spreadsheet ID: 1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M (gid: 271751341)
 */

import { PerjalananDinasRecord } from '../types';

export const SPPD_SPREADSHEET_ID = '1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M';
export const SPPD_SPREADSHEET_GID = '271751341';
export const SPPD_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SPPD_SPREADSHEET_ID}/edit?gid=${SPPD_SPREADSHEET_GID}#gid=${SPPD_SPREADSHEET_GID}`;
export const SPPD_SPREADSHEET_EMBED_URL = `https://docs.google.com/spreadsheets/d/${SPPD_SPREADSHEET_ID}/htmlembed?gid=${SPPD_SPREADSHEET_GID}&widget=true&headers=false`;
export const SPPD_SPREADSHEET_GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SPPD_SPREADSHEET_ID}/gviz/tq?tqx=out:json&gid=${SPPD_SPREADSHEET_GID}`;
export const SPPD_SPREADSHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SPPD_SPREADSHEET_ID}/export?format=csv&gid=${SPPD_SPREADSHEET_GID}`;

export const SPPD_SHEET_HEADERS = [
  'Nomor SPPD & Pegawai',
  'Kota Tujuan & Durasi',
  'Maksud Perjalanan',
  'Rincian Biaya',
  'Status',
  'Aksi / Cetak',
];

export interface SPPDSyncStats {
  lastSyncTime: string;
  rowCount: number;
  status: 'connected' | 'syncing' | 'error' | 'idle';
  source: 'gviz' | 'csv' | 'webhook' | 'cache' | 'local';
  message?: string;
}

/**
 * Format satu record SPPD menjadi 6 kolom sesuai tabel Google Spreadsheet gid: 271751341
 */
export function formatSingleSPPDToSheetCols(r: PerjalananDinasRecord): string[] {
  const nomor = r.nomorSPD || r.nomorSPPD || r.id;
  const nama = r.namaPegawai || r.employeeName || 'Pegawai';
  const nip = r.nip ? ` (NIP: ${r.nip})` : '';
  const col1 = `${nomor} - ${nama}${nip}`;

  const tujuan = r.kotaTujuan || r.tujuanDinas || 'Tujuan Dinas';
  const durasi = r.lamaHari ? `${r.lamaHari} Hari` : '';
  const tanggal = r.tanggalBerangkat ? ` (${r.tanggalBerangkat}${r.tanggalKembali ? ' s.d ' + r.tanggalKembali : ''})` : '';
  const col2 = `${tujuan}${durasi ? ` [${durasi}]` : ''}${tanggal}`;

  const col3 = r.maksudDinas || r.maksudPerjalanan || '-';

  const total = r.rincianBiaya?.totalBiaya || 0;
  const harian = r.rincianBiaya?.uangHarian || 0;
  const transport = r.rincianBiaya?.biayaTransport || r.rincianBiaya?.uangTransport || 0;
  const penginapan = r.rincianBiaya?.biayaPenginapan || r.rincianBiaya?.akomodasiHotel || 0;
  
  const col4 = `Rp ${total.toLocaleString('id-ID')} (Harian: Rp ${harian.toLocaleString('id-ID')}, Transport: Rp ${transport.toLocaleString('id-ID')}, Hotel: Rp ${penginapan.toLocaleString('id-ID')})`;

  const col5 = r.status || 'Diusulkan';
  const col6 = 'Terverifikasi / Siap Cetak';

  return [col1, col2, col3, col4, col5, col6];
}

/**
 * Mengubah array record SPPD menjadi baris 2 dimensi untuk dikirim ke Google Sheets
 */
export function formatSPPDListForSheet(records: PerjalananDinasRecord[]): string[][] {
  return records.map(formatSingleSPPDToSheetCols);
}

/**
 * Mengubah baris raw dari Google Sheets menjadi PerjalananDinasRecord
 */
export function parseSheetRowToSPPD(cols: string[], index: number): PerjalananDinasRecord | null {
  if (!cols || cols.length === 0) return null;
  const col0 = (cols[0] || '').trim();
  const col1 = (cols[1] || '').trim();
  const col2 = (cols[2] || '').trim();
  const col3 = (cols[3] || '').trim();
  const col4 = (cols[4] || '').trim();

  // Skip jika baris header
  if (
    col0.toLowerCase().includes('nomor') &&
    (col0.toLowerCase().includes('sppd') || col0.toLowerCase().includes('pegawai'))
  ) {
    return null;
  }

  // Jika kolom 0 kosong
  if (!col0 && !col1) return null;

  // Parsing Kolom 1: "Nomor SPPD - Nama Pegawai (NIP: 12345)"
  let nomorSPD = `SPD/BKHIT/${new Date().getFullYear()}/${String(index + 1).padStart(3, '0')}`;
  let namaPegawai = 'Pegawai';
  let nip = '-';

  if (col0.includes(' - ')) {
    const parts = col0.split(' - ');
    nomorSPD = parts[0].trim();
    const rest = parts.slice(1).join(' - ');
    if (rest.includes('(NIP:')) {
      const nipMatch = rest.match(/(.*?)\s*\(NIP:\s*(.*?)\)/i);
      if (nipMatch) {
        namaPegawai = nipMatch[1].trim();
        nip = nipMatch[2].replace(/\)/g, '').trim();
      } else {
        namaPegawai = rest.trim();
      }
    } else {
      namaPegawai = rest.trim();
    }
  } else if (col0) {
    nomorSPD = col0;
  }

  // Parsing Kolom 2: "Yogyakarta [3 Hari] (2026-02-18 s.d 2026-02-20)"
  let kotaTujuan = 'Kota Tujuan';
  let lamaHari = 3;
  let tanggalBerangkat = new Date().toISOString().slice(0, 10);
  let tanggalKembali = new Date().toISOString().slice(0, 10);

  if (col1) {
    const tujuanMatch = col1.match(/^(.*?)(?:\[|\(|\d|$)/);
    if (tujuanMatch && tujuanMatch[1].trim()) {
      kotaTujuan = tujuanMatch[1].trim();
    } else {
      kotaTujuan = col1;
    }

    const hariMatch = col1.match(/(\d+)\s*Hari/i);
    if (hariMatch) {
      lamaHari = parseInt(hariMatch[1], 10) || 3;
    }

    const dateMatch = col1.match(/(\d{4}-\d{2}-\d{2})\s*(?:s\.d|-)\s*(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      tanggalBerangkat = dateMatch[1];
      tanggalKembali = dateMatch[2];
    }
  }

  // Parsing Kolom 3: Maksud Perjalanan
  const maksudDinas = col2 || 'Perjalanan Dinas Terjadwal';

  // Parsing Kolom 4: Rincian Biaya
  let totalBiaya = 4500000;
  let uangHarian = 1290000;
  let biayaTransport = 2000000;
  let biayaPenginapan = 1210000;

  if (col3) {
    const rawTotalMatch = col3.match(/Rp\s*([\d.,]+)/);
    if (rawTotalMatch) {
      const cleanNum = rawTotalMatch[1].replace(/\./g, '').replace(/,/g, '.');
      const parsed = parseFloat(cleanNum);
      if (!isNaN(parsed) && parsed > 0) {
        totalBiaya = parsed;
      }
    }

    const harianMatch = col3.match(/Harian:\s*Rp\s*([\d.,]+)/i);
    if (harianMatch) {
      const parsed = parseFloat(harianMatch[1].replace(/\./g, '').replace(/,/g, '.'));
      if (!isNaN(parsed)) uangHarian = parsed;
    }

    const transportMatch = col3.match(/Transport:\s*Rp\s*([\d.,]+)/i);
    if (transportMatch) {
      const parsed = parseFloat(transportMatch[1].replace(/\./g, '').replace(/,/g, '.'));
      if (!isNaN(parsed)) biayaTransport = parsed;
    }

    const penginapanMatch = col3.match(/Hotel|Penginapan:\s*Rp\s*([\d.,]+)/i);
    if (penginapanMatch) {
      const parsed = parseFloat(penginapanMatch[1].replace(/\./g, '').replace(/,/g, '.'));
      if (!isNaN(parsed)) biayaPenginapan = parsed;
    }
  }

  // Parsing Kolom 5: Status
  let status: PerjalananDinasRecord['status'] = 'Diusulkan';
  const statusLower = col4.toLowerCase();
  if (statusLower.includes('lunas') || statusLower.includes('sp2d')) {
    status = 'Lunas Dicairkan';
  } else if (statusLower.includes('setuju') || statusLower.includes('ppk')) {
    status = 'Disetujui PPK';
  } else if (statusLower.includes('selesai') || statusLower.includes('lapor')) {
    status = 'Selesai Dilaporkan';
  } else if (statusLower.includes('verif')) {
    status = 'Diverifikasi PPK';
  }

  const id = `SPD-SHEET-${String(index + 1).padStart(3, '0')}`;

  return {
    id,
    nomorSuratTugas: `ST/BKHIT/2026/${String(index + 1).padStart(3, '0')}`,
    nomorSPD,
    nomorSPPD: nomorSPD,
    employeeId: `EMP-${index + 1}`,
    namaPegawai,
    employeeName: namaPegawai,
    nip,
    jabatan: 'Pegawai Balai Karantina Hewan, Ikan, dan Tumbuhan',
    tujuanDinas: kotaTujuan,
    kotaTujuan,
    kotaAsal: 'Sorong / Balai Karantina',
    maksudDinas,
    maksudPerjalanan: maksudDinas,
    tanggalBerangkat,
    tanggalKembali,
    lamaHari,
    alatAngkutan: 'Pesawat Udara / Transportasi Dinas',
    tingkatBiaya: 'Tingkat B',
    pejabatPembuatKomitmen: 'PPK Balai Karantina Papua Barat Daya',
    nipPPK: '19750814 200003 1 002',
    mataAnggaran: '524111 (Belanja Perjalanan Dinas Biasa)',
    rincianBiaya: {
      uangHarian,
      uangTransport: biayaTransport,
      biayaTransport,
      akomodasiHotel: biayaPenginapan,
      biayaPenginapan,
      uangRepresentasi: 0,
      totalBiaya,
    },
    status,
    dokumen: [],
    catatan: 'Disinkronkan dari Google Spreadsheet ID: 1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M (gid: 271751341)',
    createdAt: new Date().toISOString().slice(0, 10),
  };
}

/**
 * Menarik data live dari Google Spreadsheet gid: 271751341 melalui endpoint GViz API
 */
export async function fetchLiveSPPDSpreadsheet(
  spreadsheetId: string = SPPD_SPREADSHEET_ID,
  gid: string = SPPD_SPREADSHEET_GID
): Promise<{
  records: PerjalananDinasRecord[];
  rawRows: string[][];
  headers: string[];
  totalRowsFound: number;
  source: 'gviz' | 'csv';
}> {
  // 1. Coba GViz JSON endpoint
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&gid=${gid}`;
    const res = await fetch(gvizUrl);
    if (res.ok) {
      const txt = await res.text();
      const start = txt.indexOf('{');
      const end = txt.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        const json = JSON.parse(txt.substring(start, end + 1));
        const table = json.table;
        const headers = (table?.cols || []).map((c: any) => c?.label || '');
        const rows = table?.rows || [];

        const rawRows: string[][] = [];
        const records: PerjalananDinasRecord[] = [];

        for (let i = 0; i < rows.length; i++) {
          const c = rows[i]?.c || [];
          const rowVals = c.map((cell: any) =>
            cell ? String(cell.f !== undefined ? cell.f : cell.v !== undefined ? cell.v : '') : ''
          );
          rawRows.push(rowVals);

          const parsed = parseSheetRowToSPPD(rowVals, i);
          if (parsed) {
            records.push(parsed);
          }
        }

        return {
          records,
          rawRows,
          headers: headers.length > 0 && headers.some(Boolean) ? headers : SPPD_SHEET_HEADERS,
          totalRowsFound: rows.length,
          source: 'gviz',
        };
      }
    }
  } catch (err) {
    console.warn('Gviz fetch error on SPPD sheet, trying CSV fallback:', err);
  }

  // 2. Coba CSV fallback
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
    const res = await fetch(csvUrl);
    if (res.ok) {
      const csvText = await res.text();
      const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
      const rawRows: string[][] = [];
      const records: PerjalananDinasRecord[] = [];

      for (let i = 1; i < lines.length; i++) {
        // Parse CSV line sederhana
        const cols = parseCSVLine(lines[i]);
        rawRows.push(cols);
        const parsed = parseSheetRowToSPPD(cols, i - 1);
        if (parsed) {
          records.push(parsed);
        }
      }

      return {
        records,
        rawRows,
        headers: lines[0] ? parseCSVLine(lines[0]) : SPPD_SHEET_HEADERS,
        totalRowsFound: lines.length - 1,
        source: 'csv',
      };
    }
  } catch (err) {
    console.error('CSV fallback failed on SPPD sheet:', err);
  }

  return {
    records: [],
    rawRows: [],
    headers: SPPD_SHEET_HEADERS,
    totalRowsFound: 0,
    source: 'gviz',
  };
}

/**
 * Parser baris CSV yang mendukung tanda kutip ganda
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Menghasilkan teks tab-delimited (TSV) atau CSV untuk di-copy paste ke Google Sheets
 */
export function generateCopyableSheetText(records: PerjalananDinasRecord[]): string {
  const rows = formatSPPDListForSheet(records);
  return rows.map((r) => r.join('\t')).join('\n');
}

/**
 * Menghasilkan kode Google Apps Script siap pakai bagi pengguna yang ingin membuat webhook otomatis
 */
export function getAppsScriptBridgeCodeSnippet(): string {
  return `/**
 * JEMBATAN OTOMATIS SIMPEG BKHIT KE GOOGLE SPREADSHEET
 * Pasang di menu: Extensions > Apps Script pada Spreadsheet:
 * "1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M"
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getSheetByGid(271751341) || ss.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    sheetName: sheet.getName(),
    gid: 271751341,
    rowCount: data.length,
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getSheetByGid(271751341) || ss.getActiveSheet();
    var payload = JSON.parse(e.postData.contents);
    
    if (payload.action === 'sync_all' && payload.rows) {
      // Pertahankan header di baris 1
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, 6).clearContent();
      }
      if (payload.rows.length > 0) {
        sheet.getRange(2, 1, payload.rows.length, 6).setValues(payload.rows);
      }
    } else if (payload.action === 'append' && payload.row) {
      sheet.appendRow(payload.row);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Berhasil menyinkronkan data SPD ke Google Spreadsheet!',
      updatedAt: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetByGid(targetGid) {
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === targetGid) {
      return sheets[i];
    }
  }
  return null;
}
`;
}
