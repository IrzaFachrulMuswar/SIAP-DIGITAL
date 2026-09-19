import { Employee, CutiBKNRecord, KGBRecord, MonthlyAttendance, PerjalananDinasRecord } from '../types';
import { getAccessToken } from './googleAuth';
import { initialRekapCuti, RekapCutiItem, REKAP_CUTI_SPREADSHEET_ID, REKAP_CUTI_SPREADSHEET_URL } from '../data/rekapCutiData';
import { initialPegawaiSpreadsheetData, PEGAWAI_SPREADSHEET_ID, PEGAWAI_SPREADSHEET_URL } from '../data/pegawaiSpreadsheetData';

export { initialRekapCuti, REKAP_CUTI_SPREADSHEET_ID, REKAP_CUTI_SPREADSHEET_URL, PEGAWAI_SPREADSHEET_ID, PEGAWAI_SPREADSHEET_URL };
export type { RekapCutiItem };

export interface SheetTableData {
  sheetName: string;
  headers: string[];
  rows: string[][];
  updatedAt: string;
}

export interface GoogleSheetsDatabaseState {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  sheets: {
    [key: string]: SheetTableData;
  };
  lastSynced: string;
  isConnected: boolean;
}

export const DEFAULT_SPREADSHEET_ID = PEGAWAI_SPREADSHEET_ID;

// Default initial dataset structured for Google Sheets display in preview
export const INITIAL_SHEETS_DATABASE: GoogleSheetsDatabaseState = {
  spreadsheetId: PEGAWAI_SPREADSHEET_ID,
  spreadsheetTitle: 'Database Pegawai & Berkas Dokumen ASN (Google Spreadsheet)',
  spreadsheetUrl: PEGAWAI_SPREADSHEET_URL,
  lastSynced: '13 September 2026 14:00 WIT',
  isConnected: true,
  sheets: {
    Data_Pegawai: {
      sheetName: 'Data_Pegawai',
      headers: ['No', 'NIP', 'Nama Pegawai', 'Jabatan', 'Satker / Pelayanan', 'Pangkat / Gol', 'Masa Kerja', 'TMT Pangkat', 'TMT KGB', 'Angka Kredit (PAK)', 'Link Google Drive', 'Status Berkas'],
      rows: initialPegawaiSpreadsheetData.map((r) => [
        String(r.no),
        r.nip,
        r.nama,
        r.jabatan,
        r.satuanPelayanan,
        r.pangkatDetail || r.pangkat,
        r.masaKerja,
        r.tmtPangkat,
        r.tmtKGB,
        String(r.angkaKredit || '-'),
        r.linkDrive || '',
        r.kelengkapanBerkas,
      ]),
      updatedAt: '13 September 2026 14:00 WIT',
    },
    Rekap_Cuti: {
      sheetName: 'Rekap_Cuti',
      headers: ['No', 'NIP', 'Nama Pegawai', 'Cuti N (2026)', 'Cuti N-1 (2025)', 'Cuti N-2 (2024)', 'Jumlah Hak Cuti', 'Terpakai (Hari)', 'Sisa Cuti', 'Status'],
      rows: initialRekapCuti.map((item) => [
        item.no,
        item.nip,
        item.nama,
        String(item.cutiN),
        String(item.cutiN1),
        String(item.cutiN2),
        String(item.hakCuti),
        String(item.terpakai),
        String(item.sisaCuti),
        item.sisaCuti > 10 ? 'Aman' : item.sisaCuti > 0 ? 'Tersedia' : 'Habis'
      ]),
      updatedAt: '13 September 2026 14:00 WIT',
    },
    Pengajuan_Cuti: {
      sheetName: 'Pengajuan_Cuti',
      headers: ['No Permohonan', 'NIP', 'Nama Pemohon', 'Jenis Cuti (BKN 24/2017)', 'Alasan Permohonan', 'Lama (Hari)', 'Tgl Mulai', 'Tgl Selesai', 'Persetujuan Atasan', 'Keputusan Pejabat', 'Status Final'],
      rows: [
        ['CUTI-2026-001', '19920315 201802 2 004', 'Siti Nurhaliza, S.E.', 'Cuti Tahunan', 'Keperluan keluarga di luar kota', '3', '2026-09-10', '2026-09-12', 'Disetujui', 'Disetujui', 'Disetujui'],
        ['CUTI-2026-002', '19950618 202203 2 005', 'Dewi Lestari, S.A.P.', 'Cuti Karena Alasan Penting', 'Mendampingi orang tua berobat', '2', '2026-09-15', '2026-09-16', 'Disetujui', 'Menunggu', 'Menunggu Pejabat Berwenang'],
        ['CUTI-2026-003', '19850714 201001 1 003', 'Rahmat Hidayat, S.Kom., M.T.', 'Cuti Sakit', 'Rawat inap di rumah sakit', '4', '2026-08-20', '2026-08-23', 'Disetujui', 'Disetujui', 'Disetujui'],
      ],
      updatedAt: '07 September 2026 16:45 WIB',
    },
    KGB_Berkala: {
      sheetName: 'KGB_Berkala',
      headers: ['NIP', 'Nama Pegawai', 'Jabatan', 'Pangkat / Golongan', 'Gaji Pokok Lama', 'Gaji Pokok Baru', 'TMT KGB', 'Nomor SK KGB', 'Status Verifikasi'],
      rows: [
        ['19850714 201001 1 003', 'Rahmat Hidayat, S.Kom., M.T.', 'Pranata Komputer Ahli Muda', 'III/d', 'Rp 4.050.000', 'Rp 4.250.000', '01 Oktober 2026', 'SK-KGB/SDM/2026/089', 'Memenuhi Syarat (Siap Terbit)'],
        ['19920315 201802 2 004', 'Siti Nurhaliza, S.E.', 'Analis SDM Aparatur', 'III/a', 'Rp 3.320.000', 'Rp 3.500.000', '01 November 2026', 'SK-KGB/SDM/2026/092', 'Dalam Verifikasi Berkas'],
        ['19781120 200501 1 002', 'Budi Santoso, S.Sos., M.AP.', 'Kasubbag Mutasi & Karir', 'IV/a', 'Rp 4.880.000', 'Rp 5.100.000', '01 Desember 2026', 'SK-KGB/SDM/2026/098', 'Menunggu Approval Pejabat'],
      ],
      updatedAt: '07 September 2026 16:30 WIB',
    },
    Absensi_Bulanan: {
      sheetName: 'Absensi_Bulanan',
      headers: ['Bulan / Tahun', 'NIP', 'Nama Pegawai', 'Unit Kerja', 'Hari Kerja', 'Hadir Efektif', 'Izin / Cuti', 'Sakit', 'Terlambat (Menit)', 'Persentase (%)'],
      rows: [
        ['Agustus 2026', '19850714 201001 1 003', 'Rahmat Hidayat, S.Kom.', 'Biro SDM & Umum', '22', '21', '1', '0', '15 Menit', '98.5%'],
        ['Agustus 2026', '19920315 201802 2 004', 'Siti Nurhaliza, S.E.', 'Biro SDM & Umum', '22', '22', '0', '0', '0 Menit', '100.0%'],
        ['Agustus 2026', '19781120 200501 1 002', 'Budi Santoso, M.AP.', 'Biro SDM & Umum', '22', '20', '2', '0', '25 Menit', '95.8%'],
        ['Agustus 2026', '19950618 202203 2 005', 'Dewi Lestari, S.A.P.', 'Biro Keuangan', '22', '21', '0', '1', '10 Menit', '97.2%'],
      ],
      updatedAt: '07 September 2026 16:15 WIB',
    },
    SPPD_Dinas: {
      sheetName: 'SPPD_Dinas',
      headers: ['Nomor SPPD', 'Nama Pelaksana', 'NIP', 'Maksud Perjalanan Dinas', 'Kota Asal', 'Kota Tujuan', 'Tgl Berangkat', 'Tgl Kembali', 'Anggaran Riil', 'Status SP2D'],
      rows: [
        ['SPPD/08/2026/001', 'Budi Santoso, M.AP.', '19781120 200501 1 002', 'Koordinasi Layanan Kepegawaian Regional BKN', 'Jakarta', 'Surabaya', '2026-08-10', '2026-08-12', 'Rp 4.850.000', 'Lunas (SP2D Terbit)'],
        ['SPPD/08/2026/002', 'Rahmat Hidayat, M.T.', '19850714 201001 1 003', 'Instalasi & Pendampingan Server SIMPEG Cloud', 'Jakarta', 'Bandung', '2026-08-18', '2026-08-20', 'Rp 3.650.000', 'Lunas (SP2D Terbit)'],
        ['SPPD/09/2026/001', 'Ir. Hendra Gunawan', '19820410 200801 1 001', 'Workshop Keamanan Data Sensitif ASN Nasional', 'Jakarta', 'Yogyakarta', '2026-09-15', '2026-09-17', 'Rp 5.200.000', 'Verifikasi Dokumen'],
      ],
      updatedAt: '07 September 2026 15:50 WIB',
    },
    Uang_Makan: {
      sheetName: 'Uang_Makan',
      headers: ['No', 'Periode', 'NIP', 'Nama Pegawai', 'Golongan', 'Hari Hadir', 'Tarif / Hari', 'Bruto', 'PPh 21', 'Netto', 'Bank & Rekening', 'Status SP2D'],
      rows: [
        ['1', 'Agustus 2026', '19750122 200604 2 023', 'Mila Yasni Morintoh, S.P.', 'IV/a', '21', 'Rp 41.000', 'Rp 861.000', 'Rp 129.150', 'Rp 731.850', 'Bank Mandiri - 102-00-202611-8', 'SP2D Terbit / Cair'],
        ['2', 'Agustus 2026', '19800415 200501 1 004', 'Drh. Bambang Triyono', 'IV/b', '20', 'Rp 41.000', 'Rp 820.000', 'Rp 123.000', 'Rp 697.000', 'Bank BRI - 0011-01-000456-30-2', 'SP2D Terbit / Cair'],
        ['3', 'Agustus 2026', '19850714 201001 1 003', 'Rahmat Hidayat, S.Kom., M.T.', 'III/d', '22', 'Rp 37.000', 'Rp 814.000', 'Rp 40.700', 'Rp 773.300', 'Bank BNI - 137-00-112233-4', 'SP2D Terbit / Cair'],
        ['4', 'Agustus 2026', '19920315 201802 2 004', 'Siti Nurhaliza, S.E.', 'III/a', '20', 'Rp 37.000', 'Rp 740.000', 'Rp 37.000', 'Rp 703.000', 'Bank BSI - 712-33-445566-0', 'SPM Terbit'],
        ['5', 'Agustus 2026', '19950618 202203 2 005', 'Dewi Lestari, S.A.P.', 'II/c', '21', 'Rp 35.000', 'Rp 735.000', 'Rp 0', 'Rp 735.000', 'Bank Mandiri - 102-00-334455-9', 'Diverifikasi Bendahara'],
      ],
      updatedAt: '15 September 2026 09:00 WIT',
    },
    Lembur_ASN: {
      sheetName: 'Lembur_ASN',
      headers: ['Nomor Surat Lembur', 'NIP', 'Nama Pegawai', 'Tanggal Lembur', 'Jam Mulai - Selesai', 'Total Jam', 'Total Uang Lembur', 'Uraian Tugas', 'Status'],
      rows: [
        ['SPKL-2026-08-01', '19850714 201001 1 003', 'Rahmat Hidayat, M.T.', '2026-08-15', '17:00 - 21:00', '4 Jam', 'Rp 140.000', 'Penyusunan Backup Database SIMPEG', 'Telah Dibayarkan'],
        ['SPKL-2026-08-02', '19920315 201802 2 004', 'Siti Nurhaliza, S.E.', '2026-08-20', '17:00 - 20:00', '3 Jam', 'Rp 105.000', 'Verifikasi Berkas Kenaikan Pangkat BKN', 'Disetujui PPK'],
      ],
      updatedAt: '15 September 2026 09:00 WIT',
    },
    Perbendaharaan: {
      sheetName: 'Perbendaharaan',
      headers: ['Nomor Dokumen', 'Jenis Pembayaran', 'Tipe Pembayaran', 'Tanggal Terbit', 'Nama Penerima / Rekening', 'Jumlah Nominal', 'Uraian Pengeluaran', 'Status SP2D'],
      rows: [
        ['SP2D-2026-09-001', 'SP2D', 'LS (Langsung)', '2026-09-05', 'Rekening Bendahara Pengeluaran (Bank Mandiri)', 'Rp 45.850.000', 'Pembayaran Uang Makan ASN Periode Agustus 2026', 'SP2D Terbit / Cair'],
        ['SPM-2026-09-012', 'SPM', 'UP (Uang Persediaan)', '2026-09-10', 'Pelaksana SPD (Bank BNI)', 'Rp 12.450.000', 'Biaya Riil Perjalanan Dinas Pengawasan Karantina', 'Diajukan ke KPPN'],
      ],
      updatedAt: '15 September 2026 09:00 WIT',
    },
  },
};

/**
 * Fetches user spreadsheets from Google Drive
 */
export async function fetchDriveSpreadsheets(accessToken: string): Promise<Array<{ id: string; name: string; webViewLink: string; modifiedTime?: string }>> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name,webViewLink,modifiedTime)&orderBy=modifiedTime desc&pageSize=15`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!response.ok) {
      console.warn('Drive API files search returned:', response.status);
      return [];
    }
    const data = await response.json();
    return data.files || [];
  } catch (err) {
    console.warn('Failed to list spreadsheets from Drive:', err);
    return [];
  }
}

/**
 * Fallback to read public Google Spreadsheets via Google Visualization API
 */
export async function fetchPublicSheetData(spreadsheetId: string, sheetName?: string): Promise<{ headers: string[]; rows: string[][] } | null> {
  try {
    const sheetParam = sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : '';
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json${sheetParam}`);
    if (!res.ok) return null;
    const text = await res.text();
    const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
    if (!jsonMatch || !jsonMatch[1]) return null;
    const json = JSON.parse(jsonMatch[1]);
    const cols = json.table?.cols || [];
    const rows = json.table?.rows || [];
    const headers = cols.map((c: any) => c.label || c.id || '');
    const dataRows = rows.map((r: any) => (r.c || []).map((cell: any) => (cell && cell.v !== null && cell.v !== undefined ? String(cell.f || cell.v) : '')));
    return { headers, rows: dataRows };
  } catch (e) {
    console.warn('gviz query failed:', e);
    return null;
  }
}

/**
 * Reads spreadsheet metadata (sheet titles, grid properties)
 */
export async function fetchSpreadsheetMetadata(spreadsheetId: string, accessToken: string) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets API error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Reads cell values from a sheet range
 */
export async function readSheetRange(
  spreadsheetId: string,
  range: string,
  accessToken: string
): Promise<string[][]> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal membaca sheet range "${range}": ${errorText}`);
  }

  const data = await response.json();
  return data.values || [];
}

/**
 * Writes or overwrites cell values into a sheet range
 */
export async function updateSheetRange(
  spreadsheetId: string,
  range: string,
  values: (string | number)[][],
  accessToken: string
) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal menulis sheet range "${range}": ${errorText}`);
  }

  return await response.json();
}

/**
 * Appends rows to an existing sheet
 */
export async function appendSheetRows(
  spreadsheetId: string,
  range: string,
  values: (string | number)[][],
  accessToken: string
) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal menambahkan baris ke sheet: ${errorText}`);
  }

  return await response.json();
}

/**
 * Creates a brand-new Google Spreadsheet with all required SIMPEG database sheets
 */
export async function createSIMPEGSpreadsheet(
  title: string,
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || 'Database Terpadu SIMPEG & Keuangan ASN',
      },
      sheets: [
        { properties: { title: 'Data_Pegawai' } },
        { properties: { title: 'Pengajuan_Cuti' } },
        { properties: { title: 'KGB_Berkala' } },
        { properties: { title: 'Absensi_Bulanan' } },
        { properties: { title: 'SPPD_Dinas' } },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal membuat spreadsheet baru di Google Drive: ${errorText}`);
  }

  const created = await response.json();
  return {
    spreadsheetId: created.spreadsheetId,
    spreadsheetUrl: created.spreadsheetUrl,
  };
}

/**
 * Converts app employee objects into 2D table array for Google Sheets
 */
export function formatEmployeesForSheet(employees: Employee[]): (string | number)[][] {
  const headers = ['NIP', 'Nama Lengkap', 'Jabatan', 'Pangkat / Golongan', 'Unit Kerja', 'Status', 'Gaji Pokok', 'Sisa Cuti N', 'Email Dinas', 'No. Telepon'];
  const rows = employees.map((emp) => [
    emp.nip,
    `${emp.gelarDepan ? emp.gelarDepan + ' ' : ''}${emp.nama}${emp.gelarBelakang ? ', ' + emp.gelarBelakang : ''}`.trim(),
    emp.jabatan,
    emp.pangkatGolongan,
    emp.unitKerja,
    emp.statusPegawai,
    `Rp ${emp.gajiPokok.toLocaleString('id-ID')}`,
    `${emp.sisaCutiN} Hari`,
    emp.email,
    emp.telepon,
  ]);
  return [headers, ...rows];
}

/**
 * Converts app cuti objects into 2D table array for Google Sheets
 */
export function formatCutiForSheet(cutiList: CutiBKNRecord[]): (string | number)[][] {
  const headers = ['No Permohonan', 'NIP', 'Nama Pemohon', 'Jenis Cuti (BKN 24/2017)', 'Alasan Permohonan', 'Lama (Hari)', 'Tgl Mulai', 'Tgl Selesai', 'Persetujuan Atasan', 'Keputusan Pejabat', 'Status Final'];
  const rows = cutiList.map((c) => [
    c.noPermohonan,
    c.nip,
    c.employeeName,
    c.jenisCuti,
    c.alasanCuti,
    c.lamaHari,
    c.tanggalMulai,
    c.tanggalSelesai,
    c.pertimbanganAtasan?.status || 'MENUNGGU',
    c.keputusanPejabat?.status || 'MENUNGGU',
    c.statusFinal,
  ]);
  return [headers, ...rows];
}

/**
 * Converts app KGB objects into 2D table array for Google Sheets
 */
export function formatKGBForSheet(kgbList: KGBRecord[]): (string | number)[][] {
  const headers = ['NIP', 'Nama Pegawai', 'Jabatan', 'Pangkat / Golongan', 'Gaji Pokok Lama', 'Gaji Pokok Baru', 'TMT KGB Baru', 'Nomor SK KGB', 'Status Verifikasi'];
  const rows = kgbList.map((k) => [
    k.nip,
    k.employeeName,
    k.jabatan,
    k.pangkatGolongan,
    `Rp ${(k.gajiLama || 0).toLocaleString('id-ID')}`,
    `Rp ${(k.gajiBaru || 0).toLocaleString('id-ID')}`,
    k.tmtGajiBaru || '-',
    k.noSK || '-',
    k.status,
  ]);
  return [headers, ...rows];
}

/**
 * Converts app SPPD objects into 2D table array for Google Sheets
 */
export function formatSPPDForSheet(sppdList: PerjalananDinasRecord[]): (string | number)[][] {
  const headers = ['Nomor SPPD', 'Nama Pelaksana', 'NIP', 'Maksud Perjalanan Dinas', 'Kota Asal', 'Kota Tujuan', 'Tgl Berangkat', 'Tgl Kembali', 'Anggaran Riil', 'Status SP2D'];
  const rows = sppdList.map((s) => [
    s.nomorSPD || s.nomorSPPD || s.nomorSuratTugas,
    s.namaPegawai || s.employeeName || 'Pelaksana',
    s.nip,
    s.maksudDinas || s.maksudPerjalanan || '-',
    s.kotaAsal,
    s.tujuanDinas || s.kotaTujuan || '-',
    s.tanggalBerangkat,
    s.tanggalKembali,
    `Rp ${(s.rincianBiaya?.totalBiaya || 0).toLocaleString('id-ID')}`,
    s.status,
  ]);
  return [headers, ...rows];
}

/**
 * Converts app Attendance objects into 2D table array for Google Sheets
 */
export function formatAttendanceForSheet(attendances: MonthlyAttendance[]): (string | number)[][] {
  const headers = ['Bulan / Tahun', 'Nama Bulan', 'Total Pegawai', 'Total Hari Kerja', 'Hadir Efektif', 'Izin / Cuti', 'Sakit', 'Dinas Luar', 'Persentase (%)'];
  const rows = attendances.map((a) => [
    `${a.bulan} / ${a.tahun}`,
    a.namaBulan,
    a.totalPegawai,
    a.totalHariKerja,
    a.rekapHadir,
    (a.rekapIzin || 0) + (a.rekapCuti || 0),
    a.rekapSakit || 0,
    a.rekapDinasLuar || 0,
    `${a.persentaseKehadiran}%`,
  ]);
  return [headers, ...rows];
}

/**
 * Directly fetches and parses live Rekap Cuti from connected Google Spreadsheet (ID: 1eWHGGmXPQcWk_ORe1XsDJipGly5Zx0sYf1yODMDOeQE)
 */
export async function fetchLiveRekapCuti(
  spreadsheetId: string = REKAP_CUTI_SPREADSHEET_ID,
  accessToken?: string | null
): Promise<RekapCutiItem[]> {
  try {
    // 1. Try Google Sheets REST API if token available
    const token = accessToken || getAccessToken();
    if (token) {
      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:Z150`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          const rows: string[][] = json.values || [];
          if (rows.length > 1) {
            const parsed: RekapCutiItem[] = [];
            for (let i = 0; i < rows.length; i++) {
              const r = rows[i];
              // Skip header rows
              if (!r || !r[1] || r[1].toLowerCase().includes('nip') || !r[2] || r[2].toLowerCase().includes('nama')) {
                continue;
              }
              const no = r[0]?.trim() || String(parsed.length + 1);
              const nip = r[1]?.trim() || '';
              const nama = r[2]?.trim() || '';
              const cutiN = parseInt(r[3], 10) || 12;
              const cutiN1 = parseInt(r[4], 10) || 0;
              const cutiN2 = parseInt(r[5], 10) || 0;
              const hakCuti = parseInt(r[6], 10) || (cutiN + cutiN1 + cutiN2);
              const terpakai = parseInt(r[7], 10) || 0;
              const sisaCuti = parseInt(r[8], 10) || (hakCuti - terpakai);

              parsed.push({ no, nip, nama, cutiN, cutiN1, cutiN2, hakCuti, terpakai, sisaCuti });
            }
            if (parsed.length > 0) {
              return parsed;
            }
          }
        }
      } catch (err) {
        console.warn('Google Sheets API values fetch failed, trying GViz fallback:', err);
      }
    }

    // 2. Try Google Visualization GViz endpoint (works for any public/shared spreadsheet)
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;
    const gvizRes = await fetch(gvizUrl);
    if (gvizRes.ok) {
      const text = await gvizRes.text();
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      if (startIdx >= 0 && endIdx >= 0) {
        const jsonStr = text.slice(startIdx, endIdx + 1);
        const data = JSON.parse(jsonStr);
        const rows = data?.table?.rows;
        if (Array.isArray(rows) && rows.length > 0) {
          const parsed: RekapCutiItem[] = [];
          for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const vals = (r?.c || []).map((cell: any) =>
              cell ? String(cell.f !== undefined ? cell.f : cell.v !== undefined ? cell.v : '') : ''
            );
            // Skip subheaders
            if (i === 0 && !vals[1]) continue;
            if (!vals[1]?.trim() && !vals[2]?.trim()) continue;

            const no = vals[0]?.trim() || String(parsed.length + 1);
            const nip = vals[1]?.trim() || '';
            const nama = vals[2]?.trim() || '';
            const cutiN = parseInt(vals[3], 10) || 12;
            const cutiN1 = parseInt(vals[4], 10) || 0;
            const cutiN2 = parseInt(vals[5], 10) || 0;
            const hakCuti = parseInt(vals[6], 10) || (cutiN + cutiN1 + cutiN2);
            const terpakai = parseInt(vals[7], 10) || 0;
            const sisaCuti = parseInt(vals[8], 10) || (hakCuti - terpakai);

            parsed.push({ no, nip, nama, cutiN, cutiN1, cutiN2, hakCuti, terpakai, sisaCuti });
          }
          if (parsed.length > 0) {
            return parsed;
          }
        }
      }
    }
  } catch (err) {
    console.error('Error fetching live rekap cuti:', err);
  }

  // 3. Fallback to cached initialRekapCuti
  return initialRekapCuti;
}

