/**
 * ============================================================================
 * GOOGLE SHEETS LIVE READER
 * ============================================================================
 * Utilitas membaca data langsung dari Google Spreadsheet ID:
 * 1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M
 * 
 * Khusus untuk 2 Sheet yang berstatus READ-ONLY (Baca Langsung dari Sheet):
 * 1. "data pegawai"   (9 Kolom)
 * 3. "absensi bulanan" (17 Kolom)
 * ============================================================================
 */

import { Employee, DailyAttendanceRecord } from '../types';
import { getStoredUniversalWebhookUrl } from './universalSheetWebhook';

export const TARGET_SPREADSHEET_ID = '1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M';
export const ABSENSI_SPREADSHEET_ID = '16q5aZkFJzZ5RNpGOxLTR28AntgGIsc9ecQ9XYRlCDJY';
export const ABSENSI_DEFAULT_GID = '1473990328';

export interface MonthlySheetMeta {
  key: string;
  name: string;
  label: string;
  bulan: string;
  tahun: number;
  gid?: string;
}

export const MONTHLY_ABSENSI_SHEETS: MonthlySheetMeta[] = [
  { key: 'JANUARI', name: 'JANUARI', label: 'Januari 2026', bulan: 'Januari', tahun: 2026 },
  { key: 'FEBRUARI', name: 'FEBRUARI', label: 'Februari 2026', bulan: 'Februari', tahun: 2026 },
  { key: 'MARET', name: 'MARET', label: 'Maret 2026', bulan: 'Maret', tahun: 2026 },
  { key: 'APRIL', name: 'APRIL', label: 'April 2026', bulan: 'April', tahun: 2026 },
  { key: 'MEI', name: 'MEI', label: 'Mei 2026', bulan: 'Mei', tahun: 2026 },
  { key: 'JUNI', name: 'JUNI', label: 'Juni 2026', bulan: 'Juni', tahun: 2026 },
  { key: 'JULI', name: 'JULI', label: 'Juli 2026', bulan: 'Juli', tahun: 2026 },
  { key: 'AGUSTUS', name: 'AGUSTUS', label: 'Agustus 2026 (Aktif)', bulan: 'Agustus', tahun: 2026, gid: '1473990328' },
  { key: 'SEPTEMBER', name: 'SEPTEMBER', label: 'September 2026', bulan: 'September', tahun: 2026 },
  { key: 'OKTOBER', name: 'OKTOBER', label: 'Oktober 2026', bulan: 'Oktober', tahun: 2026 },
  { key: 'NOVEMBER', name: 'NOVEMBER', label: 'November 2026', bulan: 'November', tahun: 2026 },
  { key: 'DESEMBER', name: 'DESEMBER', label: 'Desember 2026', bulan: 'Desember', tahun: 2026 },
  { key: 'REKAP', name: 'REKAP', label: 'Rekap Tahunan 2026', bulan: 'Tahunan', tahun: 2026 },
];

export interface MonthlyAttendanceRecapItem {
  no: number;
  section: string;
  nama: string;
  nip?: string;
  hariKerjaAktif: number;
  akumulasiTl01_90: string;
  tl91Plus: string;
  psw01_90: string;
  psw91Plus: string;
  tidakAbsen: string;
  tdkMasukAtauIzin: string;
  tidakUpacaraApel: string;
  cutiBesar: string;
  cutiAlasanPentingBersalin: string;
  cutiSakitInap: string;
  ijinSakit: string;
  cutiSakitKetDok: string;
  cutiTahunan: string;
  dinasLuar: string;
}

export interface MonthlyRecapResult {
  success: boolean;
  monthKey: string;
  monthTitle: string;
  sheetTitle: string;
  rows: MonthlyAttendanceRecapItem[];
  source: 'gviz' | 'cache';
  rowCount: number;
  timestamp: string;
  spreadsheetId: string;
  gid?: string;
}

export interface LiveFetchResult<T> {
  success: boolean;
  rows: T[];
  source: 'gviz' | 'webhook' | 'cache';
  rowCount: number;
  timestamp: string;
  sheetName: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// DATA AWAL SHEET 1: DATA PEGAWAI (9 KOLOM RESMI)
// Header: NIP | Nama Lengkap | Jabatan | Pangkat / Golongan | Unit Kerja | Status Pegawai | Gaji Pokok | Email Pribadi | Nomor HP
// ---------------------------------------------------------------------------
export const INITIAL_PEGAWAI_SHEET_DATA: Employee[] = [
  {
    id: 'emp-001',
    nip: '19850315 200812 1 002',
    nama: 'Drh. Ahmad Fauzi',
    gelarDepan: 'Drh.',
    gelarBelakang: 'M.Si.',
    jabatan: 'Medik Veteriner Ahli Madya',
    pangkatGolongan: 'Pembina (IV/a)',
    unitKerja: 'Balai Karantina Hewan Ikan Tumbuhan Papua Barat Daya',
    statusPegawai: 'PNS',
    gajiPokok: 4850000,
    email: 'fauzi.vet@gmail.com',
    telepon: '081248901234',
    pendidikanTerakhir: 'S2 Kedokteran Hewan',
    tempatLahir: 'Sorong',
    tanggalLahir: '1985-03-15',
    jenisKelamin: 'Laki-laki',
    agama: 'Islam',
    alamat: 'Jl. Ahmad Yani No. 45, Klademak, Sorong',
    sisaCutiN: 12,
    sisaCutiN1: 6,
    sisaCutiN2: 0,
  },
  {
    id: 'emp-002',
    nip: '19900822 201402 2 001',
    nama: 'Siti Rahmawati',
    gelarDepan: '',
    gelarBelakang: 'S.St.Pi., M.Tr.Pi.',
    jabatan: 'Pengendali Hama Penyakit Ikan Ahli Muda',
    pangkatGolongan: 'Penata (III/c)',
    unitKerja: 'Seksi Karantina Ikan & Keamanan Hayati Hayati',
    statusPegawai: 'PNS',
    gajiPokok: 3950000,
    email: 'siti.rahma@yahoo.com',
    telepon: '085233445566',
    pendidikanTerakhir: 'S2 Sains Akuakultur',
    tempatLahir: 'Makassar',
    tanggalLahir: '1990-08-22',
    jenisKelamin: 'Perempuan',
    agama: 'Islam',
    alamat: 'Jl. Sam Ratulangi No. 12, Sorong Barat',
    sisaCutiN: 10,
    sisaCutiN1: 4,
    sisaCutiN2: 0,
  },
  {
    id: 'emp-003',
    nip: '19920410 201503 1 004',
    nama: 'Budi Santoso',
    gelarDepan: '',
    gelarBelakang: 'S.P.',
    jabatan: 'Analis Perkarantinaan Tumbuhan Ahli Muda',
    pangkatGolongan: 'Penata Muda Tk.I (III/b)',
    unitKerja: 'Seksi Karantina Tumbuhan & Organisme Pengganggu',
    statusPegawai: 'PNS',
    gajiPokok: 3650000,
    email: 'budi.santoso.agr@gmail.com',
    telepon: '081399887766',
    pendidikanTerakhir: 'S1 Proteksi Tanaman',
    tempatLahir: 'Manokwari',
    tanggalLahir: '1992-04-10',
    jenisKelamin: 'Laki-laki',
    agama: 'Kristen Protestan',
    alamat: 'Komp. Perumahan Pemda Km. 9, Sorong Timur',
    sisaCutiN: 8,
    sisaCutiN1: 0,
    sisaCutiN2: 0,
  },
  {
    id: 'emp-004',
    nip: '19871105 201001 2 003',
    nama: 'Dewi Anggraini',
    gelarDepan: '',
    gelarBelakang: 'S.E., M.M.',
    jabatan: 'Pranata Keuangan APBN Penyelia',
    pangkatGolongan: 'Penata (III/c)',
    unitKerja: 'Subbagian Tata Usaha & Perbendaharaan',
    statusPegawai: 'PNS',
    gajiPokok: 3950000,
    email: 'dewi.anggra@gmail.com',
    telepon: '082155667788',
    pendidikanTerakhir: 'S2 Manajemen Keuangan Publik',
    tempatLahir: 'Surabaya',
    tanggalLahir: '1987-11-05',
    jenisKelamin: 'Perempuan',
    agama: 'Islam',
    alamat: 'Jl. Basuki Rahmat No. 78, Sorong',
    sisaCutiN: 12,
    sisaCutiN1: 5,
    sisaCutiN2: 0,
  },
  {
    id: 'emp-005',
    nip: '19950618 202012 1 005',
    nama: 'Hendrikus Wambrauw',
    gelarDepan: '',
    gelarBelakang: 'A.Md.',
    jabatan: 'Pranata Komputer Terampil',
    pangkatGolongan: 'Pengatur (II/c)',
    unitKerja: 'Subbagian Tata Usaha (Kepegawaian & TI)',
    statusPegawai: 'PNS',
    gajiPokok: 2900000,
    email: 'hendrik.wamb@gmail.com',
    telepon: '081244001122',
    pendidikanTerakhir: 'D3 Teknik Informatika',
    tempatLahir: 'Biak',
    tanggalLahir: '1995-06-18',
    jenisKelamin: 'Laki-laki',
    agama: 'Kristen Protestan',
    alamat: 'Jl. Frans Kaisiepo Km. 8, Sorong',
    sisaCutiN: 12,
    sisaCutiN1: 2,
    sisaCutiN2: 0,
  },
  {
    id: 'emp-006',
    nip: '19980102 202321 2 002',
    nama: 'Maria Kristina',
    gelarDepan: '',
    gelarBelakang: 'S.Pt.',
    jabatan: 'Paramedik Karantina Hewan Pertama',
    pangkatGolongan: 'Penata Muda (III/a)',
    unitKerja: 'Wilayah Kerja Bandara DEO Sorong',
    statusPegawai: 'PPPK',
    gajiPokok: 3400000,
    email: 'maria.kristina98@gmail.com',
    telepon: '082233994455',
    pendidikanTerakhir: 'S1 Peternakan',
    tempatLahir: 'Jayapura',
    tanggalLahir: '1998-01-02',
    jenisKelamin: 'Perempuan',
    agama: 'Katolik',
    alamat: 'Jl. Melati No. 23, Remu Selatan, Sorong',
    sisaCutiN: 12,
    sisaCutiN1: 0,
    sisaCutiN2: 0,
  },
  {
    id: 'emp-007',
    nip: '19940714 201903 1 003',
    nama: 'Rahmat Hidayat',
    gelarDepan: '',
    gelarBelakang: 'S.Si.',
    jabatan: 'Pengawas Mutu Hasil Pertanian',
    pangkatGolongan: 'Penata Muda Tk.I (III/b)',
    unitKerja: 'Wilayah Kerja Pelabuhan Laut Sorong',
    statusPegawai: 'PNS',
    gajiPokok: 3650000,
    email: 'rahmat.hidayat@outlook.com',
    telepon: '081344558899',
    pendidikanTerakhir: 'S1 Biologi',
    tempatLahir: 'Ambon',
    tanggalLahir: '1994-07-14',
    jenisKelamin: 'Laki-laki',
    agama: 'Islam',
    alamat: 'Jl. Yos Sudarso No. 15, Kampung Baru, Sorong',
    sisaCutiN: 11,
    sisaCutiN1: 3,
    sisaCutiN2: 0,
  }
];

// ---------------------------------------------------------------------------
// DATA AWAL SHEET 3: ABSENSI BULANAN (17 KOLOM RESMI)
// NO | Unit Kerja | Nama Pegawai | NIP Pegawai | Hari | Tgl Presensi | Tgl Aktual | Presensi Masuk | Batas Presensi Masuk | Presensi Pulang | Batas Presensi Pulang | Terlambat (Menit) | Pulang Sebelum Waktu (Menit) | Jumlah (Menit) | O/A | Lokasi | Status
// ---------------------------------------------------------------------------
export const INITIAL_ABSENSI_SHEET_DATA: DailyAttendanceRecord[] = [
  {
    id: 'att-001',
    no: 1,
    unitKerja: 'Balai Karantina Hewan Ikan Tumbuhan PBD',
    namaPegawai: 'Drh. Ahmad Fauzi',
    nipPegawai: '19850315 200812 1 002',
    hari: 'Senin',
    tglPresensi: '2026-03-02',
    tglAktual: '2026-03-02',
    presensiMasuk: '07:25:12',
    batasPresensiMasuk: '08:00:00',
    presensiPulang: '16:35:40',
    batasPresensiPulang: '16:00:00',
    terlambatMenit: 0,
    pulangSebelumWaktuMenit: 0,
    jumlahMenit: 550,
    oa: 'O',
    lokasi: 'Kantor Balai Karantina - Sorong (GPS On-Site)',
    status: 'Hadir'
  },
  {
    id: 'att-002',
    no: 2,
    unitKerja: 'Seksi Karantina Ikan & Keamanan Hayati',
    namaPegawai: 'Siti Rahmawati',
    nipPegawai: '19900822 201402 2 001',
    hari: 'Senin',
    tglPresensi: '2026-03-02',
    tglAktual: '2026-03-02',
    presensiMasuk: '07:42:19',
    batasPresensiMasuk: '08:00:00',
    presensiPulang: '16:32:05',
    batasPresensiPulang: '16:00:00',
    terlambatMenit: 0,
    pulangSebelumWaktuMenit: 0,
    jumlahMenit: 530,
    oa: 'O',
    lokasi: 'Lab Karantina Ikan - Sorong',
    status: 'Hadir'
  },
  {
    id: 'att-003',
    no: 3,
    unitKerja: 'Seksi Karantina Tumbuhan',
    namaPegawai: 'Budi Santoso',
    nipPegawai: '19920410 201503 1 004',
    hari: 'Senin',
    tglPresensi: '2026-03-02',
    tglAktual: '2026-03-02',
    presensiMasuk: '08:14:30',
    batasPresensiMasuk: '08:00:00',
    presensiPulang: '16:45:10',
    batasPresensiPulang: '16:00:00',
    terlambatMenit: 14,
    pulangSebelumWaktuMenit: 0,
    jumlahMenit: 511,
    oa: 'O',
    lokasi: 'Kantor Induk BKHIT Km. 9',
    status: 'Terlambat'
  },
  {
    id: 'att-004',
    no: 4,
    unitKerja: 'Subbagian Tata Usaha & Keuangan',
    namaPegawai: 'Dewi Anggraini',
    nipPegawai: '19871105 201001 2 003',
    hari: 'Senin',
    tglPresensi: '2026-03-02',
    tglAktual: '2026-03-02',
    presensiMasuk: '07:30:00',
    batasPresensiMasuk: '08:00:00',
    presensiPulang: '17:15:22',
    batasPresensiPulang: '16:00:00',
    terlambatMenit: 0,
    pulangSebelumWaktuMenit: 0,
    jumlahMenit: 585,
    oa: 'O',
    lokasi: 'Ruang Keuangan & TU',
    status: 'Hadir'
  },
  {
    id: 'att-005',
    no: 5,
    unitKerja: 'Subbagian Tata Usaha (Kepegawaian & TI)',
    namaPegawai: 'Hendrikus Wambrauw',
    nipPegawai: '19950618 202012 1 005',
    hari: 'Senin',
    tglPresensi: '2026-03-02',
    tglAktual: '2026-03-02',
    presensiMasuk: '07:18:45',
    batasPresensiMasuk: '08:00:00',
    presensiPulang: '16:30:15',
    batasPresensiPulang: '16:00:00',
    terlambatMenit: 0,
    pulangSebelumWaktuMenit: 0,
    jumlahMenit: 552,
    oa: 'O',
    lokasi: 'Pusat Server & SIMPEG',
    status: 'Hadir'
  },
  {
    id: 'att-006',
    no: 6,
    unitKerja: 'Wilayah Kerja Bandara DEO Sorong',
    namaPegawai: 'Maria Kristina',
    nipPegawai: '19980102 202321 2 002',
    hari: 'Senin',
    tglPresensi: '2026-03-02',
    tglAktual: '2026-03-02',
    presensiMasuk: '07:05:00',
    batasPresensiMasuk: '08:00:00',
    presensiPulang: '16:10:00',
    batasPresensiPulang: '16:00:00',
    terlambatMenit: 0,
    pulangSebelumWaktuMenit: 0,
    jumlahMenit: 545,
    oa: 'O',
    lokasi: 'Pos Pelayanan Bandara DEO Sorong',
    status: 'Hadir'
  },
  {
    id: 'att-007',
    no: 7,
    unitKerja: 'Wilayah Kerja Pelabuhan Laut Sorong',
    namaPegawai: 'Rahmat Hidayat',
    nipPegawai: '19940714 201903 1 003',
    hari: 'Senin',
    tglPresensi: '2026-03-02',
    tglAktual: '2026-03-02',
    presensiMasuk: '07:22:10',
    batasPresensiMasuk: '08:00:00',
    presensiPulang: '16:40:00',
    batasPresensiPulang: '16:00:00',
    terlambatMenit: 0,
    pulangSebelumWaktuMenit: 0,
    jumlahMenit: 558,
    oa: 'O',
    lokasi: 'Pos Pelayanan Pelabuhan Laut Sorong',
    status: 'Hadir'
  },
  {
    id: 'att-008',
    no: 8,
    unitKerja: 'Balai Karantina Hewan Ikan Tumbuhan PBD',
    namaPegawai: 'Drh. Ahmad Fauzi',
    nipPegawai: '19850315 200812 1 002',
    hari: 'Selasa',
    tglPresensi: '2026-03-03',
    tglAktual: '2026-03-03',
    presensiMasuk: '07:20:00',
    batasPresensiMasuk: '08:00:00',
    presensiPulang: '16:45:00',
    batasPresensiPulang: '16:00:00',
    terlambatMenit: 0,
    pulangSebelumWaktuMenit: 0,
    jumlahMenit: 565,
    oa: 'O',
    lokasi: 'Kantor Balai Karantina - Sorong',
    status: 'Hadir'
  },
  {
    id: 'att-009',
    no: 9,
    unitKerja: 'Seksi Karantina Tumbuhan',
    namaPegawai: 'Budi Santoso',
    nipPegawai: '19920410 201503 1 004',
    hari: 'Selasa',
    tglPresensi: '2026-03-03',
    tglAktual: '2026-03-03',
    presensiMasuk: '-',
    batasPresensiMasuk: '08:00:00',
    presensiPulang: '-',
    batasPresensiPulang: '16:00:00',
    terlambatMenit: 0,
    pulangSebelumWaktuMenit: 0,
    jumlahMenit: 0,
    oa: 'A',
    lokasi: 'Penugasan Luar Kota (SPPD Sorong Selatan)',
    status: 'Dinas Luar'
  }
];

// ---------------------------------------------------------------------------
// FUNGSI PARSER GVIZ JSON UNTUK GOOGLE SPREADSHEETS
// ---------------------------------------------------------------------------
function parseGVizResponse(text: string): any {
  try {
    let clean = text.trim();
    if (clean.startsWith('/*O_o*/')) {
      clean = clean.substring(7).trim();
    }
    const match = clean.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?/);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
    return JSON.parse(clean);
  } catch (err) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 1. MEMBACA SHEET 1: DATA PEGAWAI (READ-ONLY)
// ---------------------------------------------------------------------------
export async function fetchLiveDataPegawai(spreadsheetId: string = TARGET_SPREADSHEET_ID): Promise<LiveFetchResult<Employee>> {
  const timestamp = new Date().toLocaleTimeString('id-ID');
  const targetSheet = 'Data_pegawai';
  const sheetGid = '1688113153';
  
  // A. Coba Webhook GET jika URL telah dikonfigurasi
  const webhookUrl = getStoredUniversalWebhookUrl();
  if (webhookUrl && webhookUrl.startsWith('http')) {
    try {
      const url = new URL(webhookUrl);
      url.searchParams.set('sheet', targetSheet);
      url.searchParams.set('gid', sheetGid);
      const res = await fetch(url.toString(), { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.status === 'success' && Array.isArray(json.rows) && json.rows.length > 0) {
          const parsed: Employee[] = json.rows.map((r: any[], idx: number) => {
            const rawGaji = String(r[6] || '0').replace(/[^0-9]/g, '');
            return {
              id: `peg-sheet-${idx + 1}`,
              nip: String(r[0] || '').trim(),
              nama: String(r[1] || '').trim(),
              jabatan: String(r[2] || '').trim(),
              pangkatGolongan: String(r[3] || '').trim(),
              unitKerja: String(r[4] || '').trim(),
              statusPegawai: (String(r[5] || 'PNS').trim() as any) || 'PNS',
              gajiPokok: parseInt(rawGaji, 10) || 3500000,
              email: String(r[7] || '').trim(),
              telepon: String(r[8] || '').trim(),
              pendidikanTerakhir: 'Sarjana / Magister',
              tempatLahir: 'Papua Barat Daya',
              tanggalLahir: '1990-01-01',
              jenisKelamin: 'Laki-laki',
              agama: 'Islam',
              alamat: 'Kota Sorong, Papua Barat Daya',
              sisaCutiN: 12,
              sisaCutiN1: 0,
              sisaCutiN2: 0,
            };
          });

          return {
            success: true,
            rows: parsed,
            source: 'webhook',
            rowCount: parsed.length,
            timestamp,
            sheetName: targetSheet,
          };
        }
      }
    } catch (e) {
      // lanjut ke metode GViz
    }
  }

  // B. Coba GViz JSON Endpoint publik Google Spreadsheet (dengan gid dan sheet name)
  const gvizUrls = [
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&gid=${sheetGid}`,
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(targetSheet)}`,
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('data pegawai')}`
  ];

  for (const gvizUrl of gvizUrls) {
    try {
      const res = await fetch(gvizUrl);
      if (res.ok) {
        const rawText = await res.text();
        const gvizData = parseGVizResponse(rawText);
        if (gvizData && gvizData.table && Array.isArray(gvizData.table.rows) && gvizData.table.rows.length > 0) {
          const parsed: Employee[] = gvizData.table.rows.map((rowObj: any, idx: number) => {
            const c = rowObj.c || [];
            const getVal = (i: number) => (c[i] && c[i].v !== null && c[i].v !== undefined ? String(c[i].v).trim() : '');
            const rawGaji = getVal(6).replace(/[^0-9]/g, '');
            return {
              id: `peg-gviz-${idx + 1}`,
              nip: getVal(0),
              nama: getVal(1),
              jabatan: getVal(2),
              pangkatGolongan: getVal(3),
              unitKerja: getVal(4),
              statusPegawai: (getVal(5) as any) || 'PNS',
              gajiPokok: parseInt(rawGaji, 10) || 3500000,
              email: getVal(7),
              telepon: getVal(8),
              pendidikanTerakhir: 'S1 / S2',
              tempatLahir: 'Sorong',
              tanggalLahir: '1990-01-01',
              jenisKelamin: 'Laki-laki',
              agama: 'Islam',
              alamat: 'Papua Barat Daya',
              sisaCutiN: 12,
              sisaCutiN1: 0,
              sisaCutiN2: 0,
            };
          });

          // Simpan cache lokal
          localStorage.setItem('simpeg_live_data_pegawai', JSON.stringify(parsed));

          return {
            success: true,
            rows: parsed,
            source: 'gviz',
            rowCount: parsed.length,
            timestamp,
            sheetName: targetSheet,
          };
        }
      }
    } catch (err: any) {
      // lanjut ke url berikutnya
    }
  }

  // C. Fallback ke Cache Lokal atau Default Initial Data
  const saved = localStorage.getItem('simpeg_live_data_pegawai');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          success: true,
          rows: parsed,
          source: 'cache',
          rowCount: parsed.length,
          timestamp,
          sheetName: targetSheet,
        };
      }
    } catch (e) {
      // ignore
    }
  }

  return {
    success: true,
    rows: INITIAL_PEGAWAI_SHEET_DATA,
    source: 'cache',
    rowCount: INITIAL_PEGAWAI_SHEET_DATA.length,
    timestamp,
    sheetName: targetSheet,
  };
}

// ---------------------------------------------------------------------------
// 2. MEMBACA SHEET 3: REKAPITULASI BULANAN DARI SPREADSHEET ABSENSI (READ-ONLY)
// Spreadsheet ID: 16q5aZkFJzZ5RNpGOxLTR28AntgGIsc9ecQ9XYRlCDJY
// GID Default: 1473990328 (Bulan AGUSTUS 2026)
// Serta semua bulan tahun berjalan (JANUARI - DESEMBER 2026)
// ---------------------------------------------------------------------------
export async function fetchLiveMonthlyAbsensiRecap(
  monthKey: string = 'AGUSTUS',
  spreadsheetId: string = ABSENSI_SPREADSHEET_ID
): Promise<MonthlyRecapResult> {
  const timestamp = new Date().toLocaleTimeString('id-ID');
  const targetMeta = MONTHLY_ABSENSI_SHEETS.find(m => m.key.toUpperCase() === monthKey.toUpperCase()) || MONTHLY_ABSENSI_SHEETS[7];
  const cacheKey = `simpeg_rekap_absensi_${spreadsheetId}_${targetMeta.key}`;

  const candidateUrls: string[] = [];
  if (targetMeta.gid) {
    candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&gid=${targetMeta.gid}`);
  }
  candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(targetMeta.name)}`);

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const rawText = await res.text();
        const gvizData = parseGVizResponse(rawText);
        if (gvizData && gvizData.table && Array.isArray(gvizData.table.rows) && gvizData.table.rows.length > 0) {
          const sheetTitle = (gvizData.table.cols[0] && gvizData.table.cols[0].label) || `LAPORAN KEHADIRAN PEGAWAI NEGERI SIPIL BKHIT PAPUA BARAT DAYA BULAN : ${targetMeta.label}`;
          const rows = gvizData.table.rows;
          const parsed: MonthlyAttendanceRecapItem[] = [];
          let currentSection = 'KANTOR INDUK BKHIT PAPUA BARAT DAYA';

          for (let idx = 0; idx < rows.length; idx++) {
            const rowObj = rows[idx];
            const c = rowObj.c || [];
            const getVal = (i: number) => {
              if (!c[i]) return '';
              const val = c[i].f !== undefined ? c[i].f : (c[i].v !== null && c[i].v !== undefined ? c[i].v : '');
              return String(val).trim();
            };

            const col0 = getVal(0);
            const col1 = getVal(1);
            const col2 = getVal(2);

            // Lewati baris pembantu / header pembagian angka (x 2, 1 2 3...)
            if (getVal(7) === 'x 2' || (col0 === '1' && col1 === '2' && col2 === '3')) continue;
            if (col0.includes('x 2') || col0.includes('x 4')) continue;

            // Baris judul bagian (misal: KANTOR INDUK BKHIT PAPUA BARAT DAYA)
            if (col0 && isNaN(Number(col0)) && (!col1 || col1.length === 0)) {
              currentSection = col0;
              continue;
            }

            // Baris pegawai yang valid
            if (col1 && col1.length > 2 && col1 !== '2' && !col1.toLowerCase().includes('nama')) {
              const numNo = parseInt(col0, 10) || parsed.length + 1;
              parsed.push({
                no: numNo,
                section: currentSection,
                nama: col1,
                hariKerjaAktif: parseInt(col2, 10) || 0,
                akumulasiTl01_90: getVal(3),
                tl91Plus: getVal(4),
                psw01_90: getVal(5),
                psw91Plus: getVal(6),
                tidakAbsen: getVal(7),
                tdkMasukAtauIzin: getVal(8),
                tidakUpacaraApel: getVal(9),
                cutiBesar: getVal(10),
                cutiAlasanPentingBersalin: getVal(11),
                cutiSakitInap: getVal(12),
                ijinSakit: getVal(13),
                cutiSakitKetDok: getVal(14),
                cutiTahunan: getVal(15),
                dinasLuar: getVal(16),
              });
            }
          }

          if (parsed.length > 0) {
            const result: MonthlyRecapResult = {
              success: true,
              monthKey: targetMeta.key,
              monthTitle: targetMeta.label,
              sheetTitle,
              rows: parsed,
              source: 'gviz',
              rowCount: parsed.length,
              timestamp,
              spreadsheetId,
              gid: targetMeta.gid,
            };
            localStorage.setItem(cacheKey, JSON.stringify(result));
            return result;
          }
        }
      }
    } catch (e) {
      // lanjut coba url berikutnya
    }
  }

  // Cek cache lokal
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.rows) && parsed.rows.length > 0) {
        return {
          ...parsed,
          source: 'cache',
          timestamp,
        };
      }
    } catch (e) {}
  }

  return {
    success: false,
    monthKey: targetMeta.key,
    monthTitle: targetMeta.label,
    sheetTitle: `Laporan Kehadiran Pegawai BKHIT Papua Barat Daya Bulan : ${targetMeta.label}`,
    rows: [],
    source: 'cache',
    rowCount: 0,
    timestamp,
    spreadsheetId,
    gid: targetMeta.gid,
  };
}

// ---------------------------------------------------------------------------
// 3. MEMBACA SHEET 3: ABSENSI BULANAN (READ-ONLY) - FORMAT LOG HARIAN / UMUM
// ---------------------------------------------------------------------------
export async function fetchLiveAbsensiBulanan(spreadsheetId: string = ABSENSI_SPREADSHEET_ID): Promise<LiveFetchResult<DailyAttendanceRecord>> {
  const timestamp = new Date().toLocaleTimeString('id-ID');
  const targetSheet = 'Absensi_Bulanan';
  const sheetGid = spreadsheetId === ABSENSI_SPREADSHEET_ID ? ABSENSI_DEFAULT_GID : '275731863';

  // A. Jika membaca dari Absensi Spreadsheet 16q5aZkFJzZ5RNpGOxLTR28AntgGIsc9ecQ9XYRlCDJY,
  // tarik langsung rekap AGUSTUS / bulan aktif dan konversikan ke DailyAttendanceRecord
  if (spreadsheetId === ABSENSI_SPREADSHEET_ID) {
    try {
      const recap = await fetchLiveMonthlyAbsensiRecap('AGUSTUS', ABSENSI_SPREADSHEET_ID);
      if (recap.success && recap.rows.length > 0) {
        const converted: DailyAttendanceRecord[] = recap.rows.map((r, idx) => {
          let status = 'Hadir';
          if (r.dinasLuar) status = 'Dinas Luar';
          else if (r.cutiTahunan || r.cutiBesar || r.cutiAlasanPentingBersalin) status = 'Cuti';
          else if (r.ijinSakit || r.cutiSakitInap || r.cutiSakitKetDok) status = 'Sakit';
          else if (r.tdkMasukAtauIzin) status = 'Izin';
          else if (r.akumulasiTl01_90 || r.tl91Plus) status = 'Terlambat';

          const terlambat = parseInt(r.akumulasiTl01_90 || r.tl91Plus || '0', 10) || 0;
          const psw = parseInt(r.psw01_90 || r.psw91Plus || '0', 10) || 0;

          return {
            id: `att-real-${idx + 1}`,
            no: r.no,
            unitKerja: r.section || 'Kantor Induk BKHIT Papua Barat Daya',
            namaPegawai: r.nama,
            nipPegawai: '-',
            hari: 'Hari Kerja Aktif: ' + r.hariKerjaAktif + ' Hari',
            tglPresensi: 'Agustus 2026',
            tglAktual: 'Agustus 2026',
            presensiMasuk: terlambat > 0 ? `07:${30 + Math.min(29, terlambat)}` : '07:30',
            batasPresensiMasuk: '08:00',
            presensiPulang: psw > 0 ? '15:30' : '16:30',
            batasPresensiPulang: '16:00',
            terlambatMenit: terlambat,
            pulangSebelumWaktuMenit: psw,
            jumlahMenit: (r.hariKerjaAktif || 19) * 480 - terlambat - psw,
            oa: 'O',
            lokasi: 'BKHIT Papua Barat Daya - ' + (r.section || 'Kantor Induk'),
            status,
          };
        });

        localStorage.setItem('simpeg_live_absensi_bulanan', JSON.stringify(converted));
        return {
          success: true,
          rows: converted,
          source: recap.source,
          rowCount: converted.length,
          timestamp,
          sheetName: 'AGUSTUS 2026 (gid: 1473990328)',
        };
      }
    } catch (e) {
      // lanjut ke fallback
    }
  }

  // A. Coba Webhook GET
  const webhookUrl = getStoredUniversalWebhookUrl();
  if (webhookUrl && webhookUrl.startsWith('http')) {
    try {
      const url = new URL(webhookUrl);
      url.searchParams.set('sheet', targetSheet);
      url.searchParams.set('gid', sheetGid);
      const res = await fetch(url.toString(), { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.status === 'success' && Array.isArray(json.rows) && json.rows.length > 0) {
          const parsed: DailyAttendanceRecord[] = json.rows.map((r: any[], idx: number) => ({
            id: `att-wh-${idx + 1}`,
            no: r[0] !== undefined ? r[0] : idx + 1,
            unitKerja: String(r[1] || 'Balai Karantina PBD').trim(),
            namaPegawai: String(r[2] || 'Pegawai').trim(),
            nipPegawai: String(r[3] || '-').trim(),
            hari: String(r[4] || 'Senin').trim(),
            tglPresensi: String(r[5] || '').trim(),
            tglAktual: String(r[6] || '').trim(),
            presensiMasuk: String(r[7] || '07:30').trim(),
            batasPresensiMasuk: String(r[8] || '08:00').trim(),
            presensiPulang: String(r[9] || '16:30').trim(),
            batasPresensiPulang: String(r[10] || '16:00').trim(),
            terlambatMenit: parseInt(String(r[11] || '0'), 10) || 0,
            pulangSebelumWaktuMenit: parseInt(String(r[12] || '0'), 10) || 0,
            jumlahMenit: parseInt(String(r[13] || '510'), 10) || 510,
            oa: String(r[14] || 'O').trim(),
            lokasi: String(r[15] || 'Kantor Balai Karantina').trim(),
            status: String(r[16] || 'Hadir').trim(),
          }));

          return {
            success: true,
            rows: parsed,
            source: 'webhook',
            rowCount: parsed.length,
            timestamp,
            sheetName: targetSheet,
          };
        }
      }
    } catch (e) {
      // lanjut ke GViz
    }
  }

  // B. Coba GViz JSON Endpoint publik Google Spreadsheet (dengan gid dan sheet name)
  const gvizUrls = [
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&gid=${sheetGid}`,
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(targetSheet)}`,
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('absensi bulanan')}`
  ];

  for (const gvizUrl of gvizUrls) {
    try {
      const res = await fetch(gvizUrl);
      if (res.ok) {
        const rawText = await res.text();
        const gvizData = parseGVizResponse(rawText);
        if (gvizData && gvizData.table && Array.isArray(gvizData.table.rows) && gvizData.table.rows.length > 0) {
          const parsed: DailyAttendanceRecord[] = gvizData.table.rows.map((rowObj: any, idx: number) => {
            const c = rowObj.c || [];
            const getVal = (i: number) => (c[i] && c[i].v !== null && c[i].v !== undefined ? String(c[i].v).trim() : '');
            return {
              id: `att-gviz-${idx + 1}`,
              no: getVal(0) || idx + 1,
              unitKerja: getVal(1) || 'Balai Karantina PBD',
              namaPegawai: getVal(2) || 'Pegawai',
              nipPegawai: getVal(3) || '-',
              hari: getVal(4) || 'Senin',
              tglPresensi: getVal(5),
              tglAktual: getVal(6),
              presensiMasuk: getVal(7) || '07:30',
              batasPresensiMasuk: getVal(8) || '08:00',
              presensiPulang: getVal(9) || '16:00',
              batasPresensiPulang: getVal(10) || '16:00',
              terlambatMenit: parseInt(getVal(11), 10) || 0,
              pulangSebelumWaktuMenit: parseInt(getVal(12), 10) || 0,
              jumlahMenit: parseInt(getVal(13), 10) || 510,
              oa: getVal(14) || 'O',
              lokasi: getVal(15) || 'Kantor Balai Karantina',
              status: getVal(16) || 'Hadir',
            };
          });

          localStorage.setItem('simpeg_live_absensi_bulanan', JSON.stringify(parsed));

          return {
            success: true,
            rows: parsed,
            source: 'gviz',
            rowCount: parsed.length,
            timestamp,
            sheetName: targetSheet,
          };
        }
      }
    } catch (err: any) {
      // lanjut ke url berikutnya
    }
  }

  // C. Fallback ke Cache Lokal atau Data Awal
  const saved = localStorage.getItem('simpeg_live_absensi_bulanan');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          success: true,
          rows: parsed,
          source: 'cache',
          rowCount: parsed.length,
          timestamp,
          sheetName: targetSheet,
        };
      }
    } catch (e) {
      // ignore
    }
  }

  return {
    success: true,
    rows: INITIAL_ABSENSI_SHEET_DATA,
    source: 'cache',
    rowCount: INITIAL_ABSENSI_SHEET_DATA.length,
    timestamp,
    sheetName: targetSheet,
  };
}
