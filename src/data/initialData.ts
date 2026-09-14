import { 
  Employee, 
  MonthlyAttendance, 
  KGBRecord, 
  KenaikanPangkatRecord, 
  CutiBKNRecord, 
  DokumenPAKSKP, 
  PerjalananDinasRecord, 
  LemburRecord, 
  PerbendaharaanRecord, 
  NotificationItem, 
  SyncLog,
  UserSession 
} from '../types';
import { initialPegawaiSpreadsheetData, convertSpreadsheetToEmployees } from './pegawaiSpreadsheetData';

export const initialUserSession: UserSession = {
  isLoggedIn: true,
  name: 'Mila Yasni Morintoh, S.P.',
  nip: '197501222006042023',
  email: 'mila.morintoh@karantinaindonesia.go.id',
  role: 'ADMIN_SDM',
  jabatan: 'Kepala Subbagian Umum',
  unitKerja: 'Balai Karantina Hewan, Ikan, dan Tumbuhan Papua',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  ssoProvider: 'SSO Korporat BKN & SIMPEG Enterprise',
  is2FAEnabled: true,
  is2FAVerified: true,
};

// Master database pegawai diinisialisasi dari Google Spreadsheet ID: 1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M (63 Pegawai ASN BKHIT)
export const initialEmployees: Employee[] = convertSpreadsheetToEmployees(initialPegawaiSpreadsheetData);

export const initialMonthlyAttendances: MonthlyAttendance[] = [
  {
    id: 'ATT-2026-08',
    bulan: 8,
    tahun: 2026,
    namaBulan: 'Agustus 2026',
    totalHariKerja: 20,
    totalPegawai: 63,
    rekapHadir: 1218,
    rekapSakit: 10,
    rekapIzin: 6,
    rekapCuti: 22,
    rekapDinasLuar: 38,
    rekapTanpaKeterangan: 1,
    persentaseKehadiran: 98.2,
    fileName: 'Rekap_Presensi_Biometrik_Agustus_2026.xlsx',
    fileSize: '1.8 MB',
    uploadedAt: '2026-09-01 08:30',
    uploadedBy: 'Admin Presensi SDM',
    catatan: 'Rekap kehadiran bulan Agustus 2026 lengkap dengan absensi apel peringatan HUT RI ke-81.'
  },
  {
    id: 'ATT-2026-07',
    bulan: 7,
    tahun: 2026,
    namaBulan: 'Juli 2026',
    totalHariKerja: 22,
    totalPegawai: 63,
    rekapHadir: 1322,
    rekapSakit: 14,
    rekapIzin: 9,
    rekapCuti: 34,
    rekapDinasLuar: 42,
    rekapTanpaKeterangan: 2,
    persentaseKehadiran: 97.4,
    fileName: 'Rekap_Presensi_Biometrik_Juli_2026.xlsx',
    fileSize: '1.9 MB',
    uploadedAt: '2026-08-01 09:15',
    uploadedBy: 'Admin Presensi SDM',
    catatan: 'Telah divalidasi mesin biometrik fingerprint dan mobile geolokasi seluruh Satuan Pelayanan.'
  },
  {
    id: 'ATT-2026-06',
    bulan: 6,
    tahun: 2026,
    namaBulan: 'Juni 2026',
    totalHariKerja: 21,
    totalPegawai: 63,
    rekapHadir: 1252,
    rekapSakit: 12,
    rekapIzin: 8,
    rekapCuti: 30,
    rekapDinasLuar: 36,
    rekapTanpaKeterangan: 2,
    persentaseKehadiran: 97.6,
    fileName: 'Rekap_Presensi_Biometrik_Juni_2026.xlsx',
    fileSize: '1.8 MB',
    uploadedAt: '2026-07-01 08:45',
    uploadedBy: 'Admin Presensi SDM',
    catatan: 'Rekap presensi penutupan Semester I tahun 2026, diverifikasi Kasubbag SDM.'
  },
  {
    id: 'ATT-2026-05',
    bulan: 5,
    tahun: 2026,
    namaBulan: 'Mei 2026',
    totalHariKerja: 19,
    totalPegawai: 63,
    rekapHadir: 1128,
    rekapSakit: 15,
    rekapIzin: 10,
    rekapCuti: 32,
    rekapDinasLuar: 35,
    rekapTanpaKeterangan: 2,
    persentaseKehadiran: 97.0,
    fileName: 'Rekap_Presensi_Biometrik_Mei_2026.xlsx',
    fileSize: '1.7 MB',
    uploadedAt: '2026-06-02 09:00',
    uploadedBy: 'Admin Presensi SDM',
    catatan: 'Penyesuaian hari kerja efektif memperhitungkan libur nasional Kenaikan Isa Almasih & Hari Raya Waisak.'
  },
  {
    id: 'ATT-2026-04',
    bulan: 4,
    tahun: 2026,
    namaBulan: 'April 2026',
    totalHariKerja: 18,
    totalPegawai: 63,
    rekapHadir: 1058,
    rekapSakit: 16,
    rekapIzin: 12,
    rekapCuti: 45,
    rekapDinasLuar: 28,
    rekapTanpaKeterangan: 2,
    persentaseKehadiran: 96.3,
    fileName: 'Rekap_Presensi_Biometrik_April_2026.xlsx',
    fileSize: '1.7 MB',
    uploadedAt: '2026-05-02 08:30',
    uploadedBy: 'Admin Presensi SDM',
    catatan: 'Rekapitulasi cuti bersama Idul Fitri 1447 H telah diselaraskan dengan BKN.'
  },
  {
    id: 'ATT-2026-03',
    bulan: 3,
    tahun: 2026,
    namaBulan: 'Maret 2026',
    totalHariKerja: 21,
    totalPegawai: 63,
    rekapHadir: 1220,
    rekapSakit: 12,
    rekapIzin: 8,
    rekapCuti: 24,
    rekapDinasLuar: 36,
    rekapTanpaKeterangan: 2,
    persentaseKehadiran: 97.8,
    fileName: 'Rekap_Presensi_Biometrik_Maret_2026.xlsx',
    fileSize: '1.8 MB',
    uploadedAt: '2026-04-01 09:10',
    uploadedBy: 'Admin Presensi SDM',
    catatan: 'Rekapitulasi terintegrasi Google Spreadsheet ID: 16q5aZkFJzZ5RNpGOxLTR28AntgGIsc9ecQ9XYRlCDJY.'
  },
  {
    id: 'ATT-2026-02',
    bulan: 2,
    tahun: 2026,
    namaBulan: 'Februari 2026',
    totalHariKerja: 20,
    totalPegawai: 63,
    rekapHadir: 1182,
    rekapSakit: 13,
    rekapIzin: 10,
    rekapCuti: 22,
    rekapDinasLuar: 32,
    rekapTanpaKeterangan: 3,
    persentaseKehadiran: 97.1,
    fileName: 'Rekap_Presensi_Biometrik_Februari_2026.xlsx',
    fileSize: '1.8 MB',
    uploadedAt: '2026-03-01 08:30',
    uploadedBy: 'Admin Presensi SDM',
    catatan: 'Telah divalidasi mesin biometrik fingerprint dan geolokasi mobile presensi.'
  },
  {
    id: 'ATT-2026-01',
    bulan: 1,
    tahun: 2026,
    namaBulan: 'Januari 2026',
    totalHariKerja: 21,
    totalPegawai: 63,
    rekapHadir: 1242,
    rekapSakit: 15,
    rekapIzin: 11,
    rekapCuti: 20,
    rekapDinasLuar: 34,
    rekapTanpaKeterangan: 2,
    persentaseKehadiran: 97.4,
    fileName: 'Rekap_Presensi_Biometrik_Januari_2026.xlsx',
    fileSize: '1.9 MB',
    uploadedAt: '2026-02-01 09:15',
    uploadedBy: 'Admin Presensi SDM',
    catatan: 'Rekap kehadiran bulan Januari ditutup per tanggal 31 Januari 2026.'
  },
  {
    id: 'ATT-2025-12',
    bulan: 12,
    tahun: 2025,
    namaBulan: 'Desember 2025',
    totalHariKerja: 19,
    totalPegawai: 63,
    rekapHadir: 1115,
    rekapSakit: 14,
    rekapIzin: 10,
    rekapCuti: 38,
    rekapDinasLuar: 26,
    rekapTanpaKeterangan: 2,
    persentaseKehadiran: 96.1,
    fileName: 'Rekap_Presensi_Desember_2025_Final.xlsx',
    fileSize: '1.7 MB',
    uploadedAt: '2026-01-03 10:00',
    uploadedBy: 'Admin Presensi SDM',
    catatan: 'Termasuk penyesuaian cuti bersama akhir tahun.'
  }
];

export const initialKGBRecords: KGBRecord[] = [
  {
    id: 'KGB-2026-001',
    employeeId: 'EMP-001',
    employeeName: 'Dr. Rahmat Hidayat, S.Kom., M.T.',
    nip: '19820412 200801 1 005',
    jabatan: 'Pranata Komputer Ahli Madya',
    pangkatGolongan: 'Pembina / IV/a',
    unitKerja: 'Pusat Data dan Informasi Kepegawaian',
    masaKerjaTahun: 18,
    masaKerjaBulan: 0,
    gajiLama: 4850000,
    gajiBaru: 5120000,
    tmtGajiLama: '2024-04-01',
    tmtGajiBaru: '2026-04-01',
    tmtKGBBerikutnya: '2028-04-01',
    noSK: '800/012/KGB/BKD/2026',
    tanggalSK: '2026-02-20',
    pejabatPenetap: 'Sekretaris Utama Badan Kepegawaian',
    status: 'SK Diterbitkan',
    catatan: 'Memenuhi syarat PP No. 5 Tahun 2024 tentang Gaji Pokok PNS.',
    dokumenSKUrl: 'SK_KGB_Rahmat_Hidayat_2026.pdf',
    dokumenSKName: 'SK_KGB_IVa_Rahmat_Hidayat.pdf',
    updatedAt: '2026-02-25'
  },
  {
    id: 'KGB-2026-002',
    employeeId: 'EMP-002',
    employeeName: 'Siti Nurhaliza, S.E., M.Ak.',
    nip: '19890918 201402 2 003',
    jabatan: 'Analis Pengelolaan Keuangan APBN Ahli Muda',
    pangkatGolongan: 'Penata / III/c',
    unitKerja: 'Bagian Perbendaharaan dan Gaji',
    masaKerjaTahun: 12,
    masaKerjaBulan: 0,
    gajiLama: 3950000,
    gajiBaru: 4180000,
    tmtGajiLama: '2024-06-01',
    tmtGajiBaru: '2026-06-01',
    tmtKGBBerikutnya: '2028-06-01',
    noSK: '800/045/KGB/BKD/2026',
    tanggalSK: '2026-03-01',
    pejabatPenetap: 'Kepala Biro SDM',
    status: 'Diverifikasi',
    catatan: 'Dokumen SKP 2 tahun terakhir berpredikat Baik.',
    updatedAt: '2026-03-02'
  },
  {
    id: 'KGB-2026-003',
    employeeId: 'EMP-003',
    employeeName: 'Budi Santoso, S.AP., M.Si.',
    nip: '19930722 201903 1 004',
    jabatan: 'Analis Kepegawaian Ahli Pertama',
    pangkatGolongan: 'Penata Muda Tk.I / III/b',
    unitKerja: 'Subbag Mutasi dan Promosi SDM',
    masaKerjaTahun: 6,
    masaKerjaBulan: 0,
    gajiLama: 3420000,
    gajiBaru: 3650000,
    tmtGajiLama: '2024-08-01',
    tmtGajiBaru: '2026-08-01',
    tmtKGBBerikutnya: '2028-08-01',
    status: 'Menunggu Verifikasi',
    catatan: 'Usulan berkala periode Agustus 2026.',
    updatedAt: '2026-03-03'
  }
];

export const initialKPRecords: KenaikanPangkatRecord[] = [
  {
    id: 'KP-2026-01',
    employeeId: 'EMP-003',
    employeeName: 'Budi Santoso, S.AP., M.Si.',
    nip: '19930722 201903 1 004',
    jabatan: 'Analis Kepegawaian Ahli Pertama',
    pangkatLama: 'Penata Muda Tk.I / III/b',
    pangkatBaru: 'Penata / III/c',
    periode: 'April 2026',
    jenisKP: 'Jabatan Fungsional',
    status: 'Persetujuan Teknis BKN',
    berkasLengkap: true,
    catatan: 'Rekomendasi Pertek BKN No. 1290/B-KP/2026 sedang menunggu TTE.',
    dokumenPersyaratan: [
      { nama: 'SK Pangkat Terakhir (III/b)', status: 'Ada', fileName: 'SK_KP_IIIb_Budi.pdf' },
      { nama: 'SK Jabatan Fungsional Terakhir', status: 'Ada', fileName: 'SK_Jabfung_Budi.pdf' },
      { nama: 'PAK Konversi Terakhir', status: 'Ada', fileName: 'PAK_Konversi_2025.pdf' },
      { nama: 'SKP Tahun 2024 & 2025', status: 'Ada', fileName: 'SKP_2024_2025_Budi.pdf' },
      { nama: 'Ijazah & Transkrip S2', status: 'Ada', fileName: 'Ijazah_S2_LANRI.pdf' }
    ],
    updatedAt: '2026-03-02'
  },
  {
    id: 'KP-2026-02',
    employeeId: 'EMP-002',
    employeeName: 'Siti Nurhaliza, S.E., M.Ak.',
    nip: '19890918 201402 2 003',
    jabatan: 'Analis Pengelolaan Keuangan APBN Ahli Muda',
    pangkatLama: 'Penata / III/c',
    pangkatBaru: 'Penata Tk.I / III/d',
    periode: 'Oktober 2026',
    jenisKP: 'Jabatan Fungsional',
    status: 'Verifikasi BKD/Biro SDM',
    berkasLengkap: true,
    catatan: 'Menunggu input angka kredit penunjang seminar nasional.',
    dokumenPersyaratan: [
      { nama: 'SK Pangkat Terakhir (III/c)', status: 'Ada', fileName: 'SK_IIIc_Siti.pdf' },
      { nama: 'SKP 2 Tahun Terakhir', status: 'Ada', fileName: 'SKP_2024_2025_Siti.pdf' },
      { nama: 'PAK Konversi Predikat Kinerja', status: 'Ada', fileName: 'PAK_2025_Siti.pdf' }
    ],
    updatedAt: '2026-03-01'
  }
];

export const initialCutiRecords: CutiBKNRecord[] = [
  {
    id: 'CUTI-BKN-2026-001',
    noPermohonan: '024/CUTI-TAHUNAN/SDM/2026',
    tanggalPengajuan: '2026-03-01',
    employeeId: 'EMP-002',
    employeeName: 'Siti Nurhaliza, S.E., M.Ak.',
    nip: '19890918 201402 2 003',
    jabatan: 'Analis Pengelolaan Keuangan APBN Ahli Muda',
    masaKerja: '12 Tahun 1 Bulan',
    unitKerja: 'Bagian Perbendaharaan dan Gaji',
    jenisCuti: 'Cuti Tahunan',
    alasanCuti: 'Keperluan keluarga dan mendampingi orang tua di kampung halaman',
    lamaHari: 3,
    tanggalMulai: '2026-03-10',
    tanggalSelesai: '2026-03-12',
    catatanCuti: {
      n2Tahun: 2024,
      n2Sisa: 0,
      n1Tahun: 2025,
      n1Sisa: 2,
      nTahun: 2026,
      nSisa: 9,
      nKeterangan: 'Sisa hak cuti tahun 2026 adalah 9 hari kerja'
    },
    alamatSelamaCuti: 'Jl. KH Ahmad Dahlan No. 15, Kotagede, D.I. Yogyakarta',
    nomorTelepon: '0813-7744-9912',
    pertimbanganAtasan: {
      status: 'DISETUJUI',
      catatan: 'Pekerjaan verifikasi SPM telah didelegasikan kepada staf rekanan seksi.',
      namaAtasan: 'Drs. H. Bambang Suhartono, M.Si.',
      nipAtasan: '19750814 200003 1 002',
      jabatanAtasan: 'Kepala Bagian Kepegawaian & Tata Usaha',
      tanggalPertimbangan: '2026-03-02'
    },
    keputusanPejabat: {
      status: 'DISETUJUI',
      catatan: 'Diberikan Cuti Tahunan selama 3 (tiga) hari kerja sesuai Peraturan BKN No. 24 Tahun 2017.',
      namaPejabat: 'Prof. Dr. Irwan Maulana, S.H., LL.M.',
      nipPejabat: '19681120 199403 1 001',
      jabatanPejabat: 'Sekretaris Utama',
      tanggalKeputusan: '2026-03-03'
    },
    statusFinal: 'Disetujui',
    updatedAt: '2026-03-03'
  },
  {
    id: 'CUTI-BKN-2026-002',
    noPermohonan: '025/CUTI-SAKIT/SDM/2026',
    tanggalPengajuan: '2026-03-03',
    employeeId: 'EMP-001',
    employeeName: 'Dr. Rahmat Hidayat, S.Kom., M.T.',
    nip: '19820412 200801 1 005',
    jabatan: 'Pranata Komputer Ahli Madya',
    masaKerja: '18 Tahun 2 Bulan',
    unitKerja: 'Pusat Data dan Informasi Kepegawaian',
    jenisCuti: 'Cuti Sakit',
    alasanCuti: 'Perawatan rawat inap demam berdarah (DBD) di RS Pusat Pertamina',
    lamaHari: 5,
    tanggalMulai: '2026-03-04',
    tanggalSelesai: '2026-03-10',
    catatanCuti: {
      n2Tahun: 2024,
      n2Sisa: 0,
      n1Tahun: 2025,
      n1Sisa: 3,
      nTahun: 2026,
      nSisa: 12
    },
    alamatSelamaCuti: 'RS Pusat Pertamina Gedung Teratai Lt. 4, Jakarta Selatan',
    nomorTelepon: '0812-8899-2311',
    pertimbanganAtasan: {
      status: 'DISETUJUI',
      catatan: 'Surat Keterangan Dokter dari RS Pusat Pertamina terlampir valid.',
      namaAtasan: 'Drs. H. Bambang Suhartono, M.Si.',
      nipAtasan: '19750814 200003 1 002',
      jabatanAtasan: 'Kepala Bagian Kepegawaian & Tata Usaha',
      tanggalPertimbangan: '2026-03-03'
    },
    keputusanPejabat: {
      status: 'DISETUJUI',
      catatan: 'Disetujui cuti sakit dengan hak penuh sesuai peraturan kepegawaian.',
      namaPejabat: 'Prof. Dr. Irwan Maulana, S.H., LL.M.',
      nipPejabat: '19681120 199403 1 001',
      jabatanPejabat: 'Sekretaris Utama',
      tanggalKeputusan: '2026-03-03'
    },
    dokumenPendukung: {
      nama: 'Surat Keterangan Dokter RS Pusat Pertamina',
      fileName: 'Surat_Dokter_RSPP_Rahmat.pdf'
    },
    statusFinal: 'Disetujui',
    updatedAt: '2026-03-03'
  },
  {
    id: 'CUTI-BKN-2026-003',
    noPermohonan: '026/CUTI-PENTING/SDM/2026',
    tanggalPengajuan: '2026-03-04',
    employeeId: 'EMP-004',
    employeeName: 'Dewi Anggraini, S.Stat.',
    nip: '19961105 202203 2 008',
    jabatan: 'Statistisi Ahli Pertama',
    masaKerja: '4 Tahun 0 Bulan',
    unitKerja: 'Subbag Perencanaan dan Program',
    jenisCuti: 'Cuti Karena Alasan Penting',
    alasanCuti: 'Melangsungkan pernikahan pertama',
    lamaHari: 5,
    tanggalMulai: '2026-03-23',
    tanggalSelesai: '2026-03-27',
    catatanCuti: {
      n2Tahun: 2024,
      n2Sisa: 0,
      n1Tahun: 2025,
      n1Sisa: 0,
      nTahun: 2026,
      nSisa: 12
    },
    alamatSelamaCuti: 'Jl. Gayungsari Timur No. 8, Surabaya, Jawa Timur',
    nomorTelepon: '0878-9900-1123',
    pertimbanganAtasan: {
      status: 'DISETUJUI',
      catatan: 'Berkas undangan dan surat keterangan RT/RW terlampir.',
      namaAtasan: 'Drs. H. Bambang Suhartono, M.Si.',
      nipAtasan: '19750814 200003 1 002',
      jabatanAtasan: 'Kepala Bagian Kepegawaian & Tata Usaha',
      tanggalPertimbangan: '2026-03-04'
    },
    keputusanPejabat: {
      status: 'DISETUJUI',
      catatan: 'Disetujui hak Cuti Karena Alasan Penting (Pernikahan).',
      namaPejabat: 'Prof. Dr. Irwan Maulana, S.H., LL.M.',
      nipPejabat: '19681120 199403 1 001',
      jabatanPejabat: 'Sekretaris Utama',
      tanggalKeputusan: '2026-03-04'
    },
    statusFinal: 'Disetujui',
    updatedAt: '2026-03-04'
  }
];

export const initialDokumenPAKSKP: DokumenPAKSKP[] = [
  {
    id: 'PAK-2025-01',
    employeeId: 'EMP-001',
    employeeName: 'Dr. Rahmat Hidayat, S.Kom., M.T.',
    nip: '19820412 200801 1 005',
    jenis: 'PAK',
    tahun: 2025,
    periode: 'Januari - Desember 2025',
    angkaKreditUtama: 150.5,
    angkaKreditPenunjang: 25.0,
    totalAngkaKredit: 175.5,
    nomorDokumen: '821/PAK-KOM/2025/110',
    pejabatPenilai: 'Drs. H. Bambang Suhartono, M.Si.',
    jabatanPenilai: 'Ketua Tim Penilai Angka Kredit',
    statusValidasi: 'Disahkan',
    fileName: 'PAK_Konversi_PermenPANRB1_Rahmat_2025.pdf',
    fileSize: '1.4 MB',
    uploadedAt: '2026-01-20'
  },
  {
    id: 'SKP-2025-01',
    employeeId: 'EMP-001',
    employeeName: 'Dr. Rahmat Hidayat, S.Kom., M.T.',
    nip: '19820412 200801 1 005',
    jenis: 'SKP',
    tahun: 2025,
    periode: 'Periode Final 2025',
    predikatSKP: 'Sangat Baik',
    nomorDokumen: 'SKP-E/2025/XII/092',
    pejabatPenilai: 'Prof. Dr. Irwan Maulana, S.H., LL.M.',
    jabatanPenilai: 'Sekretaris Utama',
    statusValidasi: 'Disahkan',
    fileName: 'SKP_E-Kinerja_BKN_2025_Rahmat.pdf',
    fileSize: '2.1 MB',
    uploadedAt: '2026-01-15'
  },
  {
    id: 'SKP-2025-02',
    employeeId: 'EMP-002',
    employeeName: 'Siti Nurhaliza, S.E., M.Ak.',
    nip: '19890918 201402 2 003',
    jenis: 'SKP',
    tahun: 2025,
    periode: 'Periode Final 2025',
    predikatSKP: 'Baik',
    nomorDokumen: 'SKP-E/2025/XII/098',
    pejabatPenilai: 'Drs. H. Bambang Suhartono, M.Si.',
    jabatanPenilai: 'Kepala Bagian Kepegawaian & Tata Usaha',
    statusValidasi: 'Disahkan',
    fileName: 'SKP_2025_Siti_Nurhaliza.pdf',
    fileSize: '1.8 MB',
    uploadedAt: '2026-01-18'
  },
  {
    id: 'PAK-2025-02',
    employeeId: 'EMP-003',
    employeeName: 'Budi Santoso, S.AP., M.Si.',
    nip: '19930722 201903 1 004',
    jenis: 'PAK',
    tahun: 2025,
    periode: 'Januari - Desember 2025',
    angkaKreditUtama: 85.0,
    angkaKreditPenunjang: 15.0,
    totalAngkaKredit: 100.0,
    nomorDokumen: '821/PAK-SDM/2025/044',
    pejabatPenilai: 'Drs. H. Bambang Suhartono, M.Si.',
    jabatanPenilai: 'Ketua Tim Penilai Angka Kredit',
    statusValidasi: 'Diverifikasi',
    fileName: 'PAK_Budi_Santoso_2025.pdf',
    fileSize: '950 KB',
    uploadedAt: '2026-02-05'
  }
];

// INITIAL KEUANGAN DATA
export const initialPerjalananDinas: PerjalananDinasRecord[] = [
  {
    id: 'SPD-2026-001',
    nomorSuratTugas: 'ST/084/SDM/II/2026',
    nomorSPD: 'SPD/041/KEU/II/2026',
    employeeId: 'EMP-001',
    namaPegawai: 'Dr. Rahmat Hidayat, S.Kom., M.T.',
    nip: '19820412 200801 1 005',
    jabatan: 'Pranata Komputer Ahli Madya',
    tujuanDinas: 'Yogyakarta (Kanreg I BKN)',
    kotaAsal: 'Jakarta',
    maksudDinas: 'Koordinasi dan Integrasi API SIMPEG dengan Sistem Layanan Kepegawaian SIASN BKN',
    tanggalBerangkat: '2026-02-18',
    tanggalKembali: '2026-02-20',
    lamaHari: 3,
    mataAnggaran: '524111 (Belanja Perjalanan Dinas Biasa)',
    rincianBiaya: {
      uangHarian: 1290000, // 3 x 430.000 SBM
      uangTransport: 2450000, // Tiket Pesawat PP + Taxi
      akomodasiHotel: 1600000, // 2 malam x 800.000
      uangRepresentasi: 300000,
      totalBiaya: 5640000
    },
    status: 'Lunas Dicairkan',
    dokumen: [
      { id: 'SPD-DOC-1', jenis: 'Surat Tugas', namaFile: 'ST_084_Yogya_Rahmat.pdf', uploadedAt: '2026-02-15' },
      { id: 'SPD-DOC-2', jenis: 'Tiket / Boarding Pass', namaFile: 'BoardingPass_Garuda_CGK_YIA.pdf', uploadedAt: '2026-02-21' },
      { id: 'SPD-DOC-3', jenis: 'Kwitansi Hotel', namaFile: 'Invoice_Hotel_Santika_Premiere.pdf', uploadedAt: '2026-02-21' },
      { id: 'SPD-DOC-4', jenis: 'Laporan Hasil Perjalanan', namaFile: 'Laporan_Hasil_Konsolidasi_SIASN.pdf', uploadedAt: '2026-02-22' }
    ],
    catatan: 'Laporan hasil kegiatan telah diterima dan diperiksa oleh PPK.',
    createdAt: '2026-02-15',
    updatedAt: '2026-02-23'
  },
  {
    id: 'SPD-2026-002',
    nomorSuratTugas: 'ST/098/KEU/III/2026',
    nomorSPD: 'SPD/055/KEU/III/2026',
    employeeId: 'EMP-002',
    namaPegawai: 'Siti Nurhaliza, S.E., M.Ak.',
    nip: '19890918 201402 2 003',
    jabatan: 'Analis Pengelolaan Keuangan APBN Ahli Muda',
    tujuanDinas: 'Surabaya (KPPN Surabaya II)',
    kotaAsal: 'Jakarta',
    maksudDinas: 'Rekonsiliasi Laporan Keuangan Semesteran dan Validasi Modul Pembayaran SP2D',
    tanggalBerangkat: '2026-03-16',
    tanggalKembali: '2026-03-18',
    lamaHari: 3,
    mataAnggaran: '524111 (Belanja Perjalanan Dinas Biasa)',
    rincianBiaya: {
      uangHarian: 1230000,
      uangTransport: 2300000,
      akomodasiHotel: 1500000,
      uangRepresentasi: 0,
      totalBiaya: 5030000
    },
    status: 'Disetujui KPA',
    dokumen: [
      { id: 'SPD-DOC-5', jenis: 'Surat Tugas', namaFile: 'Surat_Tugas_Rekon_Surabaya.pdf', uploadedAt: '2026-03-02' }
    ],
    catatan: 'Menunggu penerbitan uang muka perjalanan dinas oleh bendahara pengeluaran.',
    createdAt: '2026-03-02',
    updatedAt: '2026-03-03'
  }
];

export const initialLemburRecords: LemburRecord[] = [
  {
    id: 'LMB-2026-01',
    nomorSPKL: 'SPKL/018/SDM/II/2026',
    employeeId: 'EMP-001',
    namaPegawai: 'Dr. Rahmat Hidayat, S.Kom., M.T.',
    nip: '19820412 200801 1 005',
    unitKerja: 'Pusat Data dan Informasi Kepegawaian',
    tanggalLembur: '2026-02-27',
    jamMulai: '17:00',
    jamSelesai: '21:00',
    jumlahJam: 4,
    tarifPerJam: 30000, // SBM Golongan IV
    uangMakan: 41000,
    totalUangLembur: 161000, // (4 x 30.000) + 41.000
    uraianPekerjaan: 'Maintenance server database SIMPEG dan migrasi skema keamanan 2FA serta backup data bulanan',
    status: 'Dibayarkan',
    dokumen: [
      { id: 'LMB-DOC-1', jenis: 'Daftar Hadir Lembur', namaFile: 'Presensi_Lembur_27Feb2026.pdf', uploadedAt: '2026-02-28' },
      { id: 'LMB-DOC-2', jenis: 'Foto Dokumentasi Kegiatan', namaFile: 'Dokumentasi_Server_Night.jpg', uploadedAt: '2026-02-28' }
    ],
    catatan: 'Telah diverifikasi Kasubag dan dibayarkan melalui transfer payroll.',
    createdAt: '2026-02-28',
    updatedAt: '2026-03-01'
  },
  {
    id: 'LMB-2026-02',
    nomorSPKL: 'SPKL/022/KEU/III/2026',
    employeeId: 'EMP-002',
    namaPegawai: 'Siti Nurhaliza, S.E., M.Ak.',
    nip: '19890918 201402 2 003',
    unitKerja: 'Bagian Perbendaharaan dan Gaji',
    tanggalLembur: '2026-03-02',
    jamMulai: '17:00',
    jamSelesai: '20:30',
    jumlahJam: 3.5,
    tarifPerJam: 25000, // SBM Golongan III
    uangMakan: 37000,
    totalUangLembur: 124500, // (3.5 x 25.000) + 37.000
    uraianPekerjaan: 'Penyusunan berkas SPP-LS tagihan belanja modal server dan rekonsiliasi kas bendahara pengeluaran',
    status: 'Disetujui PPK',
    dokumen: [
      { id: 'LMB-DOC-3', jenis: 'Daftar Hadir Lembur', namaFile: 'Absensi_Lembur_02Mar2026.pdf', uploadedAt: '2026-03-03' }
    ],
    catatan: 'Diusulkan dalam SPM Lembur Bulan Maret.',
    createdAt: '2026-03-03',
    updatedAt: '2026-03-03'
  }
];

export const initialPerbendaharaan: PerbendaharaanRecord[] = [
  {
    id: 'PBD-2026-001',
    nomorDokumen: '00128/SPP-LS/2026',
    jenis: 'SPP',
    tipePembayaran: 'LS',
    nilaiRupiah: 145000000,
    tanggalDokumen: '2026-02-10',
    uraian: 'Pembayaran Pengadaan Perangkat Server dan Lisensi Keamanan Cyber SIMPEG Tahap I',
    namaKegiatan: 'Modernisasi Infrastruktur Digital Kepegawaian',
    kodeMAK: '532111 (Belanja Modal Peralatan dan Mesin)',
    namaPenerima: 'PT. Integrasi Solusi Nusantara',
    nomorRekening: '123-00-9988776-5',
    bankPenerima: 'Bank Mandiri KC Jakarta Thamrin',
    npwpPenerima: '01.234.567.8-012.000',
    nomorSPPRef: '00128/SPP-LS/2026',
    nomorSPMRef: '00085/SPM-LS/2026',
    nomorSP2DRef: '260120100049281',
    status: 'Cair ke Rekening',
    dokumenLampiran: [
      { id: 'PBD-ATT-1', nama: 'Berkas SPP Lengkap', namaFile: 'SPP_00128_LS_Server.pdf', uploadedAt: '2026-02-10' },
      { id: 'PBD-ATT-2', nama: 'Faktur Pajak & BAST', namaFile: 'BAST_Faktur_PT_ISN.pdf', uploadedAt: '2026-02-10' },
      { id: 'PBD-ATT-3', nama: 'Scan SP2D Resmi Bank', namaFile: 'SP2D_260120100049281_Cair.pdf', uploadedAt: '2026-02-14' }
    ],
    verifikator: 'Siti Nurhaliza, S.E., M.Ak. (PPK)',
    tanggalPencairan: '2026-02-14',
    catatan: 'Dana berhasil ditransfer melalui KPPN ke rekening penyedia.',
    createdAt: '2026-02-10',
    updatedAt: '2026-02-14'
  },
  {
    id: 'PBD-2026-002',
    nomorDokumen: '00145/SPP-UP/2026',
    jenis: 'SPP',
    tipePembayaran: 'UP',
    nilaiRupiah: 50000000,
    tanggalDokumen: '2026-02-25',
    uraian: 'Penyediaan Uang Persediaan (UP) Operasional Kantor dan Pelayanan SDM Bulan Maret',
    namaKegiatan: 'Dukungan Manajemen dan Pelaksanaan Tugas Teknis Lainnya',
    kodeMAK: '521111 (Belanja Keperluan Perkantoran)',
    namaPenerima: 'Bendahara Pengeluaran Kantor',
    nomorRekening: '0011-01-000456-30-2',
    bankPenerima: 'Bank BRI Kanca Veteran',
    npwpPenerima: '00.111.222.3-045.000',
    nomorSPPRef: '00145/SPP-UP/2026',
    nomorSPMRef: '00094/SPM-UP/2026',
    nomorSP2DRef: '260120100051140',
    status: 'Cair ke Rekening',
    dokumenLampiran: [
      { id: 'PBD-ATT-4', nama: 'Surat Penetapan Besaran UP', namaFile: 'SK_Besaran_UP_2026.pdf', uploadedAt: '2026-02-25' }
    ],
    verifikator: 'Drs. H. Bambang Suhartono, M.Si. (KPA)',
    tanggalPencairan: '2026-02-28',
    catatan: 'UP telah masuk ke Rekening Giro Bendahara Pengeluaran.',
    createdAt: '2026-02-25',
    updatedAt: '2026-02-28'
  },
  {
    id: 'PBD-2026-003',
    nomorDokumen: '00160/SPP-LS/2026',
    jenis: 'SPM',
    tipePembayaran: 'LS',
    nilaiRupiah: 38750000,
    tanggalDokumen: '2026-03-02',
    uraian: 'Pembayaran Honorarium Tim Penilai Angka Kredit (PAK) dan Narasumber Bimtek Regulasi BKN',
    namaKegiatan: 'Pembinaan dan Peningkatan Kapasitas Aparatur Sipil Negara',
    kodeMAK: '521213 (Honorarium Output Kegiatan)',
    namaPenerima: 'Tim Penilai PAK & Narasumber (Daftar Nominatif)',
    nomorRekening: '137-00-112233-4',
    bankPenerima: 'Bank BNI Cabang Gambir',
    npwpPenerima: '02.998.776.5-015.000',
    nomorSPPRef: '00160/SPP-LS/2026',
    nomorSPMRef: '00102/SPM-LS/2026',
    status: 'Terbit SPM',
    dokumenLampiran: [
      { id: 'PBD-ATT-5', nama: 'Daftar Nominatif dan Bukti Potong Pajak PPh 21', namaFile: 'Daftar_Nominatif_Honor_PAK.pdf', uploadedAt: '2026-03-02' },
      { id: 'PBD-ATT-6', nama: 'Surat Perintah Membayar (SPM)', namaFile: 'SPM_00102_LS_2026.pdf', uploadedAt: '2026-03-03' }
    ],
    verifikator: 'Siti Nurhaliza, S.E., M.Ak. (Penguji SPM)',
    catatan: 'SPM telah diterbitkan dan diupload ke Portal SAKTI Kemenkeu untuk penerbitan SP2D.',
    createdAt: '2026-03-02',
    updatedAt: '2026-03-03'
  },
  {
    id: 'PBD-2026-004',
    nomorDokumen: '00172/SPP-GU/2026',
    jenis: 'SPP',
    tipePembayaran: 'GU',
    nilaiRupiah: 18450000,
    tanggalDokumen: '2026-03-04',
    uraian: 'Penggantian Uang Persediaan (Ganti Uang - GU) atas Belanja Konsumsi Rapat Koordinasi dan ATK Kepegawaian',
    namaKegiatan: 'Operasional Perkantoran Subbag Tata Usaha',
    kodeMAK: '521111 (Belanja Keperluan Sehari-hari Perkantoran)',
    namaPenerima: 'Bendahara Pengeluaran',
    nomorRekening: '0011-01-000456-30-2',
    bankPenerima: 'Bank BRI Kanca Veteran',
    npwpPenerima: '00.111.222.3-045.000',
    status: 'Pengajuan',
    dokumenLampiran: [
      { id: 'PBD-ATT-7', nama: 'Kuitansi Pengeluaran Riil & SPTJB', namaFile: 'Kuitansi_SPTJB_GU_Maret.pdf', uploadedAt: '2026-03-04' }
    ],
    catatan: 'Dokumen sedang diteliti kelengkapan bukti pengeluarannya oleh staf perbendaharaan.',
    createdAt: '2026-03-04',
    updatedAt: '2026-03-04'
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'NOTIF-01',
    title: 'Pengajuan Cuti BKN Disetujui',
    message: 'Permohonan Cuti Tahunan No. 024/CUTI-TAHUNAN/SDM/2026 a.n Siti Nurhaliza telah disetujui Pejabat Berwenang.',
    category: 'KEPEGAWAIAN',
    type: 'success',
    timestamp: '2026-03-04 09:12',
    read: false,
    targetTab: 'cuti'
  },
  {
    id: 'NOTIF-02',
    title: 'SP2D Belanja Modal Server Telah Cair',
    message: 'SP2D No. 260120100049281 senilai Rp 145.000.000 telah berhasil ditransfer ke PT Integrasi Solusi Nusantara.',
    category: 'KEUANGAN',
    type: 'success',
    timestamp: '2026-03-04 08:45',
    read: false,
    targetTab: 'perbendaharaan'
  },
  {
    id: 'NOTIF-03',
    title: 'Usulan KGB Periode April 2026',
    message: 'SK Kenaikan Gaji Berkala untuk Dr. Rahmat Hidayat, S.Kom., M.T. telah diterbitkan.',
    category: 'KEPEGAWAIAN',
    type: 'info',
    timestamp: '2026-03-03 14:20',
    read: true,
    targetTab: 'kgb'
  },
  {
    id: 'NOTIF-04',
    title: 'Sinkronisasi Otomatis SIMPEG SDM',
    message: 'Database kepegawaian berhasil disinkronkan dengan SIASN BKN (185 pegawai, 3 usulan mutasi).',
    category: 'SINKRONISASI',
    type: 'info',
    timestamp: '2026-03-03 06:00',
    read: true,
    targetTab: 'sync'
  },
  {
    id: 'NOTIF-05',
    title: 'Autentikasi 2FA Aktif',
    message: 'Verifikasi dua faktor (2FA) telah aktif untuk melindungi perubahan data gaji dan pencairan anggaran.',
    category: 'KEAMANAN',
    type: 'warning',
    timestamp: '2026-03-02 11:30',
    read: true,
    targetTab: 'profile'
  }
];

export const initialSyncLogs: SyncLog[] = [
  {
    id: 'SYNC-001',
    timestamp: '2026-03-04 06:00:15',
    waktu: '2026-03-04 06:00:15',
    source: 'SIMPEG Pusat (SIASN BKN v4.2)',
    sumberData: 'SIMPEG Pusat (SIASN BKN v4.2)',
    entitiesSynced: { pegawai: 185, kehadiran: 20, cuti: 3, keuangan: 4 },
    status: 'Sukses',
    durationMs: 1420,
    pesan: 'Semua record kepegawaian, SKP, dan data perbendaharaan 100% konsisten dengan server pusat.',
    keterangan: 'Semua record kepegawaian, SKP, dan data perbendaharaan 100% konsisten dengan server pusat.'
  },
  {
    id: 'SYNC-002',
    timestamp: '2026-03-03 06:00:11',
    waktu: '2026-03-03 06:00:11',
    source: 'SIMPEG Pusat (SIASN BKN v4.2)',
    sumberData: 'SIMPEG Pusat (SIASN BKN v4.2)',
    entitiesSynced: { pegawai: 185, kehadiran: 20, cuti: 2, keuangan: 4 },
    status: 'Sukses',
    durationMs: 1380,
    pesan: 'Sinkronisasi terjadwal berhasil dieksekusi tanpa anomali data.',
    keterangan: 'Sinkronisasi terjadwal berhasil dieksekusi tanpa anomali data.'
  },
  {
    id: 'SYNC-003',
    timestamp: '2026-03-02 18:22:04',
    waktu: '2026-03-02 18:22:04',
    source: 'Server Kemenkeu SAKTI (Modul SP2D)',
    sumberData: 'Server Kemenkeu SAKTI (Modul SP2D)',
    entitiesSynced: { pegawai: 0, kehadiran: 0, cuti: 0, keuangan: 4 },
    status: 'Sukses',
    durationMs: 950,
    pesan: 'Sinkronisasi status nomor SP2D dan tanggal pencairan bank.',
    keterangan: 'Sinkronisasi status nomor SP2D dan tanggal pencairan bank.'
  }
];

// Aliases and auxiliary configurations
export const initialAttendances = initialMonthlyAttendances;
export const initialKGB = initialKGBRecords;
export const initialKP = initialKPRecords;
export const initialCutiBKN = initialCutiRecords;
export const initialPakSkp = initialDokumenPAKSKP;
export const initialSPPD = initialPerjalananDinas;
export const initialLembur = initialLemburRecords;

export const availableSSOProfiles = [
  {
    isLoggedIn: true,
    name: 'Drs. H. Bambang Suhartono, M.Si.',
    nama: 'Drs. H. Bambang Suhartono, M.Si.',
    nip: '19750814 200003 1 002',
    email: 'bambang.suhartono@instansi.go.id',
    role: 'ADMIN_SDM',
    jabatan: 'Kepala Bagian Kepegawaian & Tata Usaha',
    unitKerja: 'Biro Sumber Daya Manusia dan Umum',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    ssoProvider: 'SSO Pusat Kepegawaian ASN BKN',
    is2FAEnabled: true,
    is2FAVerified: true,
  },
  {
    isLoggedIn: true,
    name: 'Siti Nurhaliza, S.E., M.Ak.',
    nama: 'Siti Nurhaliza, S.E., M.Ak.',
    nip: '19890918 201402 2 003',
    email: 'siti.nurhaliza@instansi.go.id',
    role: 'BENDAHARA_KEUANGAN',
    jabatan: 'Analis Pengelolaan Keuangan APBN / PPK',
    unitKerja: 'Bagian Perbendaharaan dan Gaji',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    ssoProvider: 'SSO Portal SAKTI Kemenkeu & Corporate',
    is2FAEnabled: true,
    is2FAVerified: true,
  },
  {
    isLoggedIn: true,
    name: 'Dr. Rahmat Hidayat, S.Kom., M.T.',
    nama: 'Dr. Rahmat Hidayat, S.Kom., M.T.',
    nip: '19820412 200801 1 005',
    email: 'rahmat.hidayat@instansi.go.id',
    role: 'PEGAWAI',
    jabatan: 'Pranata Komputer Ahli Madya',
    unitKerja: 'Pusat Data dan Informasi Kepegawaian',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    ssoProvider: 'SSO Portal Mandiri ASN',
    is2FAEnabled: false,
    is2FAVerified: false,
  }
];

export const defaultTwoFactor = {
  isEnabled: true,
  method: 'APP' as const,
  phoneNumber: '0812-****-2002',
  email: 'bambang.***@instansi.go.id',
  lastVerifiedAt: '2026-03-04 08:30:00'
};

