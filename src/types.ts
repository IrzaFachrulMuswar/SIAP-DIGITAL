export type UserRole = 'ADMIN_SDM' | 'BENDAHARA_KEUANGAN' | 'PEGAWAI' | 'SUPERADMIN';

export interface UserSession {
  isLoggedIn: boolean;
  name: string;
  nama?: string; // alias
  nip: string;
  email: string;
  role: UserRole | string;
  jabatan: string;
  unitKerja: string;
  avatar: string;
  ssoProvider?: string;
  is2FAEnabled: boolean;
  is2FAVerified: boolean;
}

export type SSOProfile = UserSession;

export interface TwoFactorSettings {
  isEnabled: boolean;
  method: 'APP' | 'SMS' | 'EMAIL';
  phoneNumber?: string;
  email?: string;
  lastVerifiedAt?: string;
}

export type NavTab = 
  | 'dashboard'
  | 'pegawai'
  | 'absensi'
  | 'kgb'
  | 'cuti'
  | 'sppd'
  | 'lembur'
  | 'keuangan_sppd'
  | 'perbendaharaan'
  | 'sheets_db'
  | 'sync'
  | 'keamanan';

export type StatusPegawai = 'PNS' | 'PPPK' | 'Honorer/Kontrak';

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  jenisDokumen: 'KTP' | 'NPWP' | 'SK CPNS' | 'SK PNS' | 'Ijazah Terakhir' | 'Kartu Pegawai (KARPEG)' | 'BPJS' | 'Lainnya';
  namaFile: string;
  ukuran: string;
  tanggalUpload: string;
  keterangan?: string;
  fileData?: string;
}

export interface Employee {
  id: string;
  nip: string;
  nama: string;
  gelarDepan?: string;
  gelarBelakang?: string;
  jabatan: string;
  pangkatGolongan: string;
  unitKerja: string;
  statusPegawai: StatusPegawai;
  email: string;
  telepon: string;
  alamat: string;
  tmtPNS: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  tanggalLahir: string;
  pendidikanTerakhir: string;
  gajiPokok: number;
  fotoUrl?: string;
  dokumen: EmployeeDocument[];
  sisaCutiN: number;
  sisaCutiN1: number;
  sisaCutiN2: number;
  createdAt: string;
  updatedAt: string;
  // Google Spreadsheet integrations
  linkDrive?: string;
  satuanPelayanan?: string;
  masaKerja?: string;
  tmtKGB?: string;
  tmtPangkat?: string;
  angkaKredit?: string;
  kelengkapanBerkas?: string;
}

export interface MonthlyAttendance {
  id: string;
  bulan: number;
  tahun: number;
  namaBulan: string;
  totalHariKerja: number;
  totalPegawai: number;
  rekapHadir: number;
  rekapSakit: number;
  rekapIzin: number;
  rekapCuti: number;
  rekapDinasLuar: number;
  rekapTanpaKeterangan: number;
  persentaseKehadiran: number;
  fileName?: string;
  fileSize?: string;
  uploadedAt: string;
  uploadedBy: string;
  catatan?: string;
}

export type StatusKGB = 'Menunggu Verifikasi' | 'Diverifikasi' | 'SK Diterbitkan' | 'Ditolak';

export interface KGBRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  nip: string;
  jabatan: string;
  pangkatGolongan: string;
  unitKerja: string;
  masaKerjaTahun: number;
  masaKerjaBulan: number;
  gajiLama: number;
  gajiBaru: number;
  tmtGajiLama: string;
  tmtGajiBaru: string;
  tmtKGBBerikutnya: string;
  noSK?: string;
  tanggalSK?: string;
  pejabatPenetap?: string;
  status: StatusKGB;
  catatan?: string;
  dokumenSKUrl?: string;
  dokumenSKName?: string;
  updatedAt: string;
}

export type StatusKP = 'Berkas Diupload' | 'Verifikasi BKD/Biro SDM' | 'Persetujuan Teknis BKN' | 'SK Diterbitkan' | 'Ditolak';
export type JenisKP = 'Reguler' | 'Pilihan (Jabatan Struktural)' | 'Jabatan Fungsional' | 'Penyesuaian Ijazah';

export interface KenaikanPangkatRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  nip: string;
  jabatan: string;
  pangkatLama: string;
  pangkatBaru: string;
  periode: string;
  jenisKP: JenisKP;
  status: StatusKP;
  berkasLengkap: boolean;
  dokumenPersyaratan: {
    nama: string;
    status: 'Ada' | 'Belum Ada';
    fileName?: string;
  }[];
  catatan?: string;
  noSK?: string;
  tanggalSK?: string;
  updatedAt: string;
}

// BKN Regulation No. 24 / 2017 Leave Types
export type JenisCutiBKN = 
  | 'Cuti Tahunan'
  | 'Cuti Besar'
  | 'Cuti Sakit'
  | 'Cuti Melahirkan'
  | 'Cuti Karena Alasan Penting'
  | 'Cuti Bersama'
  | 'Cuti di Luar Tanggungan Negara';

export type StatusPersetujuanBKN = 'DISETUJUI' | 'PERUBAHAN' | 'DITANGGUHKAN' | 'TIDAK DISETUJUI';
export type KeputusanCuti = StatusPersetujuanBKN;

export interface CutiBKNRecord {
  id: string;
  noPermohonan: string;
  tanggalPengajuan: string;
  employeeId: string;
  employeeName: string;
  nip: string;
  jabatan: string;
  masaKerja: string;
  unitKerja: string;
  jenisCuti: JenisCutiBKN;
  alasanCuti: string;
  lamaHari: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  catatanCuti: {
    n2Tahun: number;
    n2Sisa: number;
    n2Keterangan?: string;
    n1Tahun: number;
    n1Sisa: number;
    n1Keterangan?: string;
    nTahun: number;
    nSisa: number;
    nKeterangan?: string;
  };
  alamatSelamaCuti: string;
  nomorTelepon: string;
  pertimbanganAtasan: {
    status: StatusPersetujuanBKN;
    catatan?: string;
    namaAtasan: string;
    nipAtasan: string;
    jabatanAtasan: string;
    tanggalPertimbangan: string;
  };
  keputusanPejabat: {
    status: StatusPersetujuanBKN;
    catatan?: string;
    namaPejabat: string;
    nipPejabat: string;
    jabatanPejabat: string;
    tanggalKeputusan: string;
  };
  dokumenPendukung?: {
    nama: string;
    fileName: string;
    fileData?: string;
  };
  statusFinal: 'Menunggu Atasan' | 'Menunggu Pejabat' | 'Disetujui' | 'Ditolak' | 'Ditangguhkan';
  updatedAt: string;
}

// PAK & SKP Kinerja
export type TipeDokumenKinerja = 'SKP Tahunan' | 'SKP Periodik / Triwulan' | 'PAK Konversi' | 'PAK Integrasi' | 'PAK Konvensional';
export type StatusPakSkp = 'Draft' | 'Menunggu Verifikasi' | 'Diverifikasi' | 'Diverifikasi Tim Penilai' | 'Disahkan' | 'Disahkan BKN / Atasan' | 'Perlu Perbaikan';
export type PredikatKinerja = 'Sangat Baik' | 'Baik' | 'Butuh Perbaikan' | 'Kurang' | 'Sangat Kurang';

export interface PakSkpRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  nip: string;
  jabatan?: string;
  tipe?: TipeDokumenKinerja | 'PAK' | 'SKP' | string;
  jenis?: 'PAK' | 'SKP' | string;
  tahun?: number;
  periode?: string;
  tahunKinerja?: number;
  predikatKinerja?: PredikatKinerja;
  predikatSKP?: PredikatKinerja;
  angkaKreditUtama?: number;
  angkaKreditPenunjang?: number;
  totalAngkaKredit?: number;
  nomorSK?: string;
  nomorDokumen?: string;
  pejabatPenilai?: string;
  jabatanPenilai?: string;
  status?: StatusPakSkp;
  statusValidasi?: string;
  catatan?: string;
  fileName?: string;
  fileSize?: string;
  fileData?: string;
  uploadedAt?: string;
  dokumenName?: string;
  dokumenSize?: string;
  fileDokumen?: {
    namaFile: string;
    ukuran: string;
    tanggalUpload: string;
    fileUrl?: string;
  };
  updatedAt?: string;
}

export type DokumenPAKSKP = PakSkpRecord;

// KEUANGAN MODELS
export interface PerjalananDinasRecord {
  id: string;
  nomorSuratTugas: string;
  nomorSPD: string;
  nomorSPPD?: string;
  employeeId: string;
  namaPegawai: string;
  employeeName?: string;
  nip: string;
  jabatan: string;
  tujuanDinas: string;
  kotaTujuan?: string;
  kotaAsal: string;
  maksudDinas: string;
  maksudPerjalanan?: string;
  tanggalBerangkat: string;
  tanggalKembali: string;
  lamaHari: number;
  alatAngkutan?: string;
  tingkatBiaya?: string;
  pejabatPembuatKomitmen?: string;
  nipPPK?: string;
  mataAnggaran?: string;
  rincianBiaya: {
    uangHarian: number;
    uangTransport?: number;
    biayaTransport?: number;
    akomodasiHotel?: number;
    biayaPenginapan?: number;
    uangRepresentasi?: number;
    totalBiaya: number;
  };
  status: 'Draf' | 'Diajukan' | 'Diverifikasi PPK' | 'Disetujui KPA' | 'Disetujui PPK' | 'Lunas Dicairkan' | 'Lunas Dibayar Kas' | 'Selesai Dilaporkan' | 'Diusulkan';
  dokumen?: {
    id: string;
    jenis: 'Surat Tugas' | 'Tiket / Boarding Pass' | 'Kwitansi Hotel' | 'Laporan Hasil Perjalanan' | 'Lainnya' | string;
    namaFile: string;
    ukuran?: string;
    uploadedAt: string;
  }[];
  catatan?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LemburRecord {
  id: string;
  nomorSPKL?: string;
  nomorSuratPerintah?: string;
  employeeId: string;
  namaPegawai?: string;
  employeeName?: string;
  nip: string;
  unitKerja?: string;
  tanggalLembur: string;
  jamMulai: string;
  jamSelesai: string;
  jumlahJam: number;
  tarifPerJam: number;
  uangMakan: number;
  totalUangLembur: number;
  uraianPekerjaan: string;
  status: 'Diajukan' | 'Diverifikasi Kasubag' | 'Disetujui Atasan' | 'Disetujui PPK' | 'Dibayarkan' | 'Telah Dibayarkan';
  dokumen?: {
    id: string;
    jenis: string;
    namaFile: string;
    uploadedAt: string;
  }[];
  catatan?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type JenisPerbendaharaan = 'SPP' | 'SPM' | 'SP2D';
export type TipePembayaran = 'UP' | 'GU' | 'TU' | 'LS' | 'UP (Uang Persediaan)' | 'GUP (Ganti Uang)' | 'TUP (Tambah Uang)' | 'LS (Langsung)';
export type StatusPerbendaharaan = 
  | 'Pengajuan' 
  | 'Draf SPP'
  | 'Diverifikasi Penguji' 
  | 'Terbit SPM' 
  | 'Diterbitkan SPM'
  | 'SP2D Terbit' 
  | 'Diajukan ke KPPN / Bank'
  | 'Cair ke Rekening' 
  | 'Batal/Revisi'
  | 'Ditolak / Retur';

export interface PerbendaharaanRecord {
  id: string;
  nomorDokumen: string;
  jenis: JenisPerbendaharaan;
  tipePembayaran: TipePembayaran;
  nilaiRupiah: number;
  tanggalDokumen: string;
  uraian: string;
  namaKegiatan?: string;
  kodeMAK?: string;
  kodeAkun?: string;
  namaPenerima: string;
  nomorRekening: string;
  bankPenerima: string;
  npwpPenerima?: string;
  pejabatPenandatangan?: string;
  
  // Linkages
  nomorSPPRef?: string;
  nomorSPMRef?: string;
  nomorSP2DRef?: string;
  
  status: StatusPerbendaharaan;
  dokumenLampiran?: {
    id: string;
    nama: string;
    namaFile: string;
    ukuran?: string;
    uploadedAt: string;
  }[];
  
  verifikator?: string;
  tanggalPencairan?: string;
  catatan?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  judul?: string;
  message: string;
  pesan?: string;
  category: 'KEPEGAWAIAN' | 'KEUANGAN' | 'SINKRONISASI' | 'KEAMANAN';
  kategori?: 'kepegawaian' | 'keuangan' | 'sistem' | 'keamanan';
  type: 'info' | 'success' | 'warning' | 'error';
  tipe?: 'info' | 'sukses' | 'peringatan' | 'error';
  timestamp: string;
  waktu?: string;
  read: boolean;
  dibaca?: boolean;
  targetTab?: string;
}

export type AppNotification = NotificationItem;

export interface SyncLog {
  id: string;
  timestamp: string;
  waktu?: string;
  source?: string;
  sumberData?: string;
  entitas?: string;
  jumlahData?: number;
  entitiesSynced?: {
    pegawai: number;
    kehadiran: number;
    cuti: number;
    keuangan: number;
  };
  status: 'Sukses' | 'Gagal' | 'Sebagian';
  durationMs?: number;
  pesan?: string;
  keterangan?: string;
}
