import React, { useState, useEffect } from 'react';
import { 
  Pencil, 
  Plus, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  X, 
  Users, 
  FileText, 
  CalendarCheck, 
  TrendingUp, 
  FileSpreadsheet, 
  UtensilsCrossed, 
  Clock, 
  Coins, 
  LayoutDashboard,
  Save,
  Sparkles,
  Link2,
  Database
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { 
  Employee, 
  CutiBKNRecord, 
  MonthlyAttendance, 
  KGBRecord, 
  PerjalananDinasRecord, 
  LemburRecord, 
  PerbendaharaanRecord, 
  UangMakanRecord,
  JenisCutiBKN 
} from '../types';
import { TARGET_SPREADSHEET_ID, ABSENSI_SPREADSHEET_ID, ABSENSI_DEFAULT_GID } from '../utils/googleSheetsLiveReader';

interface QuickMenuEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTab: NavTab;
  onNavigateTab: (tab: NavTab) => void;
  // CRUD Handlers
  onAddEmployee?: (emp: Employee) => void;
  onAddCuti?: (cuti: CutiBKNRecord) => void;
  onAddAttendance?: (att: MonthlyAttendance) => void;
  onAddKgb?: (kgb: KGBRecord) => void;
  onAddSppd?: (sppd: PerjalananDinasRecord) => void;
  onAddUangMakan?: (um: UangMakanRecord) => void;
  onAddLembur?: (lembur: LemburRecord) => void;
  onAddPerbendaharaan?: (perb: PerbendaharaanRecord) => void;
}

const TAB_CONFIG: Record<NavTab, { 
  title: string; 
  sheetNumber?: number; 
  sheetName: string; 
  gid: string; 
  spreadsheetId: string; 
  color: string;
  icon: any;
}> = {
  dashboard: {
    title: 'Dasbor Ringkasan',
    sheetName: 'Semua Modul Terintegrasi',
    gid: '0',
    spreadsheetId: TARGET_SPREADSHEET_ID,
    color: 'text-slate-800 bg-slate-100',
    icon: LayoutDashboard,
  },
  pegawai: {
    title: 'Sheet 1: Data Pegawai',
    sheetNumber: 1,
    sheetName: 'Data_pegawai',
    gid: '1688113153',
    spreadsheetId: TARGET_SPREADSHEET_ID,
    color: 'text-sky-700 bg-sky-50 border-sky-200',
    icon: Users,
  },
  cuti: {
    title: 'Sheet 2: Pengajuan Cuti',
    sheetNumber: 2,
    sheetName: 'Pengajuan_Cuti',
    gid: '1792882133',
    spreadsheetId: TARGET_SPREADSHEET_ID,
    color: 'text-rose-700 bg-rose-50 border-rose-200',
    icon: FileText,
  },
  absensi: {
    title: 'Sheet 3: Absensi Bulanan',
    sheetNumber: 3,
    sheetName: 'Absensi_Bulanan',
    gid: ABSENSI_DEFAULT_GID,
    spreadsheetId: ABSENSI_SPREADSHEET_ID,
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    icon: CalendarCheck,
  },
  kgb: {
    title: 'Sheet 4: KGB Berkala',
    sheetNumber: 4,
    sheetName: 'KGB_Berkala',
    gid: '1832091216',
    spreadsheetId: TARGET_SPREADSHEET_ID,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    icon: TrendingUp,
  },
  sppd: {
    title: 'Sheet 5: SPPD Dinas',
    sheetNumber: 5,
    sheetName: 'SPPD_Dinas',
    gid: '1303409856',
    spreadsheetId: TARGET_SPREADSHEET_ID,
    color: 'text-cyan-700 bg-cyan-50 border-cyan-200',
    icon: FileSpreadsheet,
  },
  uang_makan: {
    title: 'Sheet 6: Uang Makan',
    sheetNumber: 6,
    sheetName: 'Uang_Makan',
    gid: '1590038364',
    spreadsheetId: TARGET_SPREADSHEET_ID,
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    icon: UtensilsCrossed,
  },
  lembur: {
    title: 'Sheet 7: Lembur ASN',
    sheetNumber: 7,
    sheetName: 'Lembur_ASN',
    gid: '943482291',
    spreadsheetId: TARGET_SPREADSHEET_ID,
    color: 'text-violet-700 bg-violet-50 border-violet-200',
    icon: Clock,
  },
  perbendaharaan: {
    title: 'Sheet 8: Perbendaharaan',
    sheetNumber: 8,
    sheetName: 'Perbendaharaan',
    gid: '820261205',
    spreadsheetId: TARGET_SPREADSHEET_ID,
    color: 'text-teal-700 bg-teal-50 border-teal-200',
    icon: Coins,
  },
  sheets_db: {
    title: 'Konfigurasi Database & API Webhook',
    sheetName: 'Konfigurasi Sistem',
    gid: '0',
    spreadsheetId: TARGET_SPREADSHEET_ID,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    icon: Database,
  },
  sync: {
    title: 'Sinkronisasi SDM',
    sheetName: 'Sinkronisasi Data',
    gid: '0',
    spreadsheetId: TARGET_SPREADSHEET_ID,
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    icon: Database,
  },
  keamanan: {
    title: 'Autentikasi & Keamanan',
    sheetName: 'Keamanan',
    gid: '0',
    spreadsheetId: TARGET_SPREADSHEET_ID,
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    icon: Database,
  },
};

export const QuickMenuEditModal: React.FC<QuickMenuEditModalProps> = ({
  isOpen,
  onClose,
  targetTab,
  onNavigateTab,
  onAddEmployee,
  onAddCuti,
  onAddAttendance,
  onAddKgb,
  onAddSppd,
  onAddUangMakan,
  onAddLembur,
  onAddPerbendaharaan,
}) => {
  const [activeTab, setActiveTab] = useState<NavTab>(targetTab);
  const [isSaved, setIsSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setActiveTab(targetTab);
    setIsSaved(false);
    setSaveMessage('');
  }, [targetTab, isOpen]);

  // Form State: 1. Pegawai
  const [empForm, setEmpForm] = useState({
    nip: '199208152020121004',
    nama: 'Faisal Akbar, S.STP',
    jabatan: 'Analis Kepegawaian Ahli Pertama',
    pangkatGolongan: 'Penata Muda Tk. I (III/b)',
    unitKerja: 'Sub Bagian Tata Usaha',
    statusPegawai: 'PNS' as 'PNS' | 'PPPK',
    gajiPokok: 3450000,
    email: 'faisal.akbar@karantina.go.id',
    telepon: '081248901234',
  });

  // Form State: 2. Cuti
  const [cutiForm, setCutiForm] = useState({
    noPermohonan: `CUTI/BKHIT/2026/${Math.floor(100 + Math.random() * 900)}`,
    nip: '198705122010121002',
    namaPemohon: 'Rina Wahyuni, S.Pt',
    jenisCuti: 'Cuti Tahunan' as JenisCutiBKN,
    alasanPermohonan: 'Keperluan keluarga di luar kota',
    lamaHari: 3,
    tglMulai: new Date().toISOString().slice(0, 10),
    tglSelesai: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    linkPermohonanCuti: 'https://drive.google.com/file/d/form-cuti-rina/view',
  });

  // Form State: 3. Absensi
  const [absensiForm, setAbsensiForm] = useState({
    namaPegawai: 'Ahmad Fauzi, S.Si',
    section: 'Seksi Karantina Hewan',
    hariKerjaAktif: 21,
    akumulasiTl01_90: '0',
    tl91Plus: '0',
    psw01_90: '0',
    psw91Plus: '0',
    tidakAbsen: '',
    cutiTahunan: '0',
    dinasLuar: '0',
    bulan: 'Agustus 2026',
  });

  // Form State: 4. KGB
  const [kgbForm, setKgbForm] = useState({
    employeeName: 'Bambang Irawan, M.Si',
    nip: '198304122008011003',
    pangkatGolongan: 'Penata Tk. I (III/d)',
    gajiLama: 3800000,
    gajiBaru: 4150000,
    tmtKgb: '2026-10-01',
    status: 'Menunggu Verifikasi',
  });

  // Form State: 5. SPPD
  const [sppdForm, setSppdForm] = useState({
    nomorSPD: `094/SPD/BKHIT-PBD/IX/2026`,
    namaPegawai: 'Dr. Hendra Gunawan',
    tujuan: 'Pelabuhan Sorong - Pengawasan Wilayah Kerja',
    keperluan: 'Pemeriksaan Kesehatan dan Dokumen Karantina Hewan',
    tglBerangkat: '2026-09-22',
    tglKembali: '2026-09-24',
    totalBiaya: 2850000,
  });

  // Form State: 6. Uang Makan
  const [uangMakanForm, setUangMakanForm] = useState({
    bulan: 'September',
    tahun: 2026,
    jumlahPegawai: 63,
    totalHariHadir: 1260,
    totalBruto: 51660000,
    totalPph21: 2583000,
    totalNetto: 49077000,
    linkSp2d: 'https://drive.google.com/sp2d-uang-makan-september',
  });

  // Form State: 7. Lembur
  const [lemburForm, setLemburForm] = useState({
    nomorSurat: `SPL/048/BKHIT/IX/2026`,
    namaPegawai: 'Siti Rahmawati, A.Md',
    tanggal: '2026-09-20',
    jamMulai: '17:00',
    jamSelesai: '21:00',
    uraianPekerjaan: 'Rekonsiliasi Laporan Kinerja Bulanan dan Audit SIASN',
  });

  // Form State: 8. Perbendaharaan
  const [perbForm, setPerbForm] = useState({
    jenis: 'SP2D' as 'SPP' | 'SPM' | 'SP2D',
    nomorDokumen: `SP2D-2026-09-084`,
    keperluan: 'Pembayaran Tunjangan Kinerja dan Operasional Triwulan III',
    jumlahDana: 185000000,
    status: 'Cair ke Rekening',
  });

  if (!isOpen) return null;

  const currentConfig = TAB_CONFIG[activeTab] || TAB_CONFIG.pegawai;
  const TabIcon = currentConfig.icon;
  const sheetUrl = currentConfig.gid !== '0'
    ? `https://docs.google.com/spreadsheets/d/${currentConfig.spreadsheetId}/edit?gid=${currentConfig.gid}#gid=${currentConfig.gid}`
    : `https://docs.google.com/spreadsheets/d/${currentConfig.spreadsheetId}/edit`;

  // Submit Handler Sesuai Tab Terpilih
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);

    if (activeTab === 'pegawai') {
      const newEmp: Employee = {
        id: `EMP-${Date.now()}`,
        nip: empForm.nip,
        nama: empForm.nama,
        jabatan: empForm.jabatan,
        pangkatGolongan: empForm.pangkatGolongan,
        unitKerja: empForm.unitKerja,
        statusPegawai: empForm.statusPegawai as any,
        gajiPokok: empForm.gajiPokok,
        email: empForm.email,
        telepon: empForm.telepon,
        alamat: '-',
        jenisKelamin: 'Laki-laki',
        tanggalLahir: '1990-01-01',
        pendidikanTerakhir: 'S1',
        sisaCutiN: 12,
        sisaCutiN1: 6,
        sisaCutiN2: 0,
      };
      onAddEmployee?.(newEmp);
      setSaveMessage(`Data Pegawai "${empForm.nama}" berhasil disimpan & disinkronkan ke Sheet 1!`);
    } else if (activeTab === 'cuti') {
      const newCuti: CutiBKNRecord = {
        id: `CUTI-${Date.now()}`,
        noPermohonan: cutiForm.noPermohonan,
        employeeId: `EMP-${Date.now()}`,
        nip: cutiForm.nip,
        employeeName: cutiForm.namaPemohon,
        jabatan: 'Medik Veteriner Pertama',
        masaKerja: '6 Tahun',
        unitKerja: 'Balai Karantina Hewan Ikan dan Tumbuhan',
        jenisCuti: cutiForm.jenisCuti,
        alasanCuti: cutiForm.alasanPermohonan,
        lamaHari: cutiForm.lamaHari,
        tanggalMulai: cutiForm.tglMulai,
        tanggalSelesai: cutiForm.tglSelesai,
        alamatSelamaCuti: 'Sorong, Papua Barat Daya',
        nomorTelepon: '081234567890',
        catatanCuti: {
          nTahun: 2026,
          nSisa: 12,
          n1Tahun: 2025,
          n1Sisa: 6,
          n2Tahun: 2024,
          n2Sisa: 0,
        },
        pertimbanganAtasan: {
          status: 'DISETUJUI',
          namaAtasan: 'Kepala Balai Karantina',
          nipAtasan: '197508121998031001',
          jabatanAtasan: 'Kepala Balai',
          tanggalPertimbangan: new Date().toISOString().slice(0, 10),
        },
        keputusanPejabat: {
          status: 'DISETUJUI',
          namaPejabat: 'Pejabat Pembina Kepegawaian',
          nipPejabat: '197001011995031002',
          jabatanPejabat: 'Kepala Badan',
          tanggalKeputusan: '-',
        },
        linkPermohonanCuti: cutiForm.linkPermohonanCuti,
        statusFinal: 'Menunggu Atasan',
        tanggalPengajuan: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString(),
      };
      onAddCuti?.(newCuti);
      setSaveMessage(`Pengajuan Cuti No "${cutiForm.noPermohonan}" berhasil dicatat di Sheet 2!`);
    } else if (activeTab === 'absensi') {
      const newAtt: MonthlyAttendance = {
        id: `ATT-${Date.now()}`,
        bulan: 8,
        tahun: 2026,
        namaBulan: absensiForm.bulan,
        totalHariKerja: absensiForm.hariKerjaAktif,
        totalPegawai: 26,
        rekapHadir: absensiForm.hariKerjaAktif,
        rekapSakit: 0,
        rekapIzin: 0,
        rekapCuti: Number(absensiForm.cutiTahunan) || 0,
        rekapDinasLuar: Number(absensiForm.dinasLuar) || 0,
        rekapTanpaKeterangan: Number(absensiForm.tidakAbsen) || 0,
        persentaseKehadiran: 96.5,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Admin SDM',
      };
      onAddAttendance?.(newAtt);
      setSaveMessage(`Parameter Kehadiran "${absensiForm.namaPegawai}" berhasil diperbarui pada Sheet 3!`);
    } else if (activeTab === 'kgb') {
      const newKgb: KGBRecord = {
        id: `KGB-${Date.now()}`,
        employeeId: `EMP-${Date.now()}`,
        employeeName: kgbForm.employeeName,
        nip: kgbForm.nip,
        jabatan: 'Medik Veteriner',
        pangkatGolongan: kgbForm.pangkatGolongan,
        unitKerja: 'Balai Karantina Hewan Ikan dan Tumbuhan',
        masaKerjaTahun: 12,
        masaKerjaBulan: 0,
        gajiLama: kgbForm.gajiLama,
        gajiBaru: kgbForm.gajiBaru,
        tmtGajiLama: '2024-01-01',
        tmtGajiBaru: kgbForm.tmtKgb,
        tmtKGBBerikutnya: kgbForm.tmtKgb,
        noSK: `822.3/KGB/BKHIT/${new Date().getFullYear()}/0${Math.floor(10 + Math.random() * 90)}`,
        tanggalSK: new Date().toISOString().slice(0, 10),
        status: kgbForm.status as any,
        updatedAt: new Date().toISOString(),
      };
      onAddKgb?.(newKgb);
      setSaveMessage(`Usulan KGB "${kgbForm.employeeName}" berhasil disimpan pada Sheet 4!`);
    } else if (activeTab === 'sppd') {
      const newSppd: PerjalananDinasRecord = {
        id: `SPPD-${Date.now()}`,
        nomorSuratTugas: `ST/BKHIT/2026/${Math.floor(100 + Math.random() * 900)}`,
        nomorSPD: sppdForm.nomorSPD,
        employeeId: `EMP-${Date.now()}`,
        employeeName: sppdForm.namaPegawai,
        namaPegawai: sppdForm.namaPegawai,
        nip: '198902142012011003',
        jabatan: 'Medik Veteriner',
        kotaAsal: 'Sorong',
        tujuanDinas: sppdForm.tujuan,
        maksudDinas: sppdForm.keperluan,
        maksudPerjalanan: sppdForm.keperluan,
        tanggalBerangkat: sppdForm.tglBerangkat,
        tanggalKembali: sppdForm.tglKembali,
        lamaHari: 3,
        rincianBiaya: {
          uangHarian: 430000,
          biayaTransport: 1500000,
          biayaPenginapan: 850000,
          totalBiaya: sppdForm.totalBiaya,
        },
        status: 'Diajukan',
      };
      onAddSppd?.(newSppd);
      setSaveMessage(`Berkas SPPD "${sppdForm.nomorSPD}" berhasil diterbitkan pada Sheet 5!`);
    } else if (activeTab === 'uang_makan') {
      const newUm: UangMakanRecord = {
        id: `UM-${Date.now()}`,
        bulan: uangMakanForm.bulan,
        tahun: uangMakanForm.tahun,
        jumlahPegawai: uangMakanForm.jumlahPegawai,
        totalHariHadir: uangMakanForm.totalHariHadir,
        totalBruto: uangMakanForm.totalBruto,
        totalPph21: uangMakanForm.totalPph21,
        totalNetto: uangMakanForm.totalNetto,
        bankPenyalur: 'Bank Mandiri',
        status: 'Diusulkan',
        nomorSP2DRef: uangMakanForm.linkSp2d,
      };
      onAddUangMakan?.(newUm);
      setSaveMessage(`Rekapan Uang Makan periode ${uangMakanForm.bulan} ${uangMakanForm.tahun} berhasil disimpan pada Sheet 6!`);
    } else if (activeTab === 'lembur') {
      const newLembur: LemburRecord = {
        id: `LBR-${Date.now()}`,
        nomorSPKL: lemburForm.nomorSurat,
        employeeId: `EMP-${Date.now()}`,
        namaPegawai: lemburForm.namaPegawai,
        employeeName: lemburForm.namaPegawai,
        nip: '199003152014022001',
        tanggalLembur: lemburForm.tanggal,
        jamMulai: lemburForm.jamMulai,
        jamSelesai: lemburForm.jamSelesai,
        jumlahJam: 4,
        tarifPerJam: 30000,
        uangMakan: 35000,
        totalUangLembur: 155000,
        uraianPekerjaan: lemburForm.uraianPekerjaan,
        status: 'Disetujui PPK',
      };
      onAddLembur?.(newLembur);
      setSaveMessage(`Surat Perintah Lembur "${lemburForm.nomorSurat}" berhasil disimpan pada Sheet 7!`);
    } else if (activeTab === 'perbendaharaan') {
      const newPerb: PerbendaharaanRecord = {
        id: `PERB-${Date.now()}`,
        nomorDokumen: perbForm.nomorDokumen,
        jenis: perbForm.jenis,
        tipePembayaran: 'LS',
        uraian: perbForm.keperluan,
        nilaiRupiah: perbForm.jumlahDana,
        tanggalDokumen: new Date().toISOString().slice(0, 10),
        namaPenerima: 'Rekening Pengeluaran BKHIT',
        nomorRekening: '160-00-1234567-8',
        bankPenerima: 'Bank Mandiri KC Sorong',
        status: perbForm.status as any,
      };
      onAddPerbendaharaan?.(newPerb);
      setSaveMessage(`Dokumen ${perbForm.jenis} "${perbForm.nomorDokumen}" berhasil disimpan pada Sheet 8!`);
    }

    setTimeout(() => {
      setIsSaved(false);
    }, 4000);
  };

  const handleGoToView = () => {
    onNavigateTab(activeTab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Pusat Akses Edit Menu Navigation Bar
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                  Akses Edit Aktif
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Pilih menu apa pun untuk langsung menambah, mengedit, atau memperbarui data secara cepat.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector 8 Sheet + Dasbor */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dasbor</span>
            </button>

            {([
              'pegawai',
              'cuti',
              'absensi',
              'kgb',
              'sppd',
              'uang_makan',
              'lembur',
              'perbendaharaan'
            ] as NavTab[]).map((tabKey) => {
              const cfg = TAB_CONFIG[tabKey];
              const Icon = cfg.icon;
              const isSelected = activeTab === tabKey;

              return (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setActiveTab(tabKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    isSelected ? 'bg-indigo-700 text-white font-bold' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {cfg.sheetNumber}
                  </span>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cfg.sheetName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body & Form */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Target Sheet Identity Strip */}
          <div className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white shadow-2xs border border-slate-200">
                <TabIcon className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-bold text-slate-900">
                  {currentConfig.title}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Sheet: {currentConfig.sheetName} {currentConfig.gid !== '0' && `(GID: ${currentConfig.gid})`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGoToView}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Buka Tampilan Penuh
              </button>

              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Google Sheet</span>
              </a>
            </div>
          </div>

          {/* Feedback Banner jika data berhasil disimpan */}
          {isSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveMessage}</span>
            </div>
          )}

          {/* FORM EDIT BERDASARKAN TAB */}
          <form onSubmit={handleSave} className="space-y-4">
            {/* 1. EDIT SHEET 1: DATA PEGAWAI */}
            {activeTab === 'pegawai' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">NIP (18 Digit)</label>
                    <input
                      type="text"
                      value={empForm.nip}
                      onChange={(e) => setEmpForm({ ...empForm, nip: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Nama Lengkap & Gelar</label>
                    <input
                      type="text"
                      value={empForm.nama}
                      onChange={(e) => setEmpForm({ ...empForm, nama: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Jabatan ASN</label>
                    <input
                      type="text"
                      value={empForm.jabatan}
                      onChange={(e) => setEmpForm({ ...empForm, jabatan: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Pangkat / Golongan</label>
                    <input
                      type="text"
                      value={empForm.pangkatGolongan}
                      onChange={(e) => setEmpForm({ ...empForm, pangkatGolongan: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Unit Kerja</label>
                    <input
                      type="text"
                      value={empForm.unitKerja}
                      onChange={(e) => setEmpForm({ ...empForm, unitKerja: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Status Pegawai</label>
                    <select
                      value={empForm.statusPegawai}
                      onChange={(e) => setEmpForm({ ...empForm, statusPegawai: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    >
                      <option value="PNS">PNS</option>
                      <option value="PPPK">PPPK</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Gaji Pokok (Rp)</label>
                    <input
                      type="number"
                      value={empForm.gajiPokok}
                      onChange={(e) => setEmpForm({ ...empForm, gajiPokok: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Email Resmi / Pribadi</label>
                    <input
                      type="email"
                      value={empForm.email}
                      onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. EDIT SHEET 2: PENGAJUAN CUTI */}
            {activeTab === 'cuti' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Nomor Permohonan</label>
                    <input
                      type="text"
                      value={cutiForm.noPermohonan}
                      onChange={(e) => setCutiForm({ ...cutiForm, noPermohonan: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Nama Pemohon</label>
                    <input
                      type="text"
                      value={cutiForm.namaPemohon}
                      onChange={(e) => setCutiForm({ ...cutiForm, namaPemohon: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Jenis Cuti (BKN)</label>
                    <select
                      value={cutiForm.jenisCuti}
                      onChange={(e) => setCutiForm({ ...cutiForm, jenisCuti: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    >
                      <option value="Cuti Tahunan">Cuti Tahunan</option>
                      <option value="Cuti Besar">Cuti Besar</option>
                      <option value="Cuti Sakit">Cuti Sakit</option>
                      <option value="Cuti Melahirkan">Cuti Melahirkan</option>
                      <option value="Cuti Karena Alasan Penting">Cuti Karena Alasan Penting</option>
                      <option value="Cuti Bersama">Cuti Bersama</option>
                      <option value="Cuti di Luar Tanggungan Negara">Cuti di Luar Tanggungan Negara</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Lama Hari</label>
                    <input
                      type="number"
                      value={cutiForm.lamaHari}
                      onChange={(e) => setCutiForm({ ...cutiForm, lamaHari: Number(e.target.value) })}
                      required
                      min={1}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={cutiForm.tglMulai}
                      onChange={(e) => setCutiForm({ ...cutiForm, tglMulai: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Tanggal Selesai</label>
                    <input
                      type="date"
                      value={cutiForm.tglSelesai}
                      onChange={(e) => setCutiForm({ ...cutiForm, tglSelesai: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-medium mb-1">Alasan Permohonan</label>
                    <textarea
                      rows={2}
                      value={cutiForm.alasanPermohonan}
                      onChange={(e) => setCutiForm({ ...cutiForm, alasanPermohonan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. EDIT SHEET 3: ABSENSI BULANAN */}
            {activeTab === 'absensi' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-medium mb-1">Nama Pegawai</label>
                    <input
                      type="text"
                      value={absensiForm.namaPegawai}
                      onChange={(e) => setAbsensiForm({ ...absensiForm, namaPegawai: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Hari Kerja Aktif</label>
                    <input
                      type="number"
                      value={absensiForm.hariKerjaAktif}
                      onChange={(e) => setAbsensiForm({ ...absensiForm, hariKerjaAktif: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Akumulasi TL 01-90 (Mnt)</label>
                    <input
                      type="text"
                      value={absensiForm.akumulasiTl01_90}
                      onChange={(e) => setAbsensiForm({ ...absensiForm, akumulasiTl01_90: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">TL {'>'}90 (Mnt)</label>
                    <input
                      type="text"
                      value={absensiForm.tl91Plus}
                      onChange={(e) => setAbsensiForm({ ...absensiForm, tl91Plus: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">PSW 01-90 (Mnt)</label>
                    <input
                      type="text"
                      value={absensiForm.psw01_90}
                      onChange={(e) => setAbsensiForm({ ...absensiForm, psw01_90: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">PSW {'>'}90 (Mnt)</label>
                    <input
                      type="text"
                      value={absensiForm.psw91Plus}
                      onChange={(e) => setAbsensiForm({ ...absensiForm, psw91Plus: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Cuti Tahunan (Hari)</label>
                    <input
                      type="text"
                      value={absensiForm.cutiTahunan}
                      onChange={(e) => setAbsensiForm({ ...absensiForm, cutiTahunan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Dinas Luar (Hari)</label>
                    <input
                      type="text"
                      value={absensiForm.dinasLuar}
                      onChange={(e) => setAbsensiForm({ ...absensiForm, dinasLuar: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. EDIT SHEET 4: KGB BERKALA */}
            {activeTab === 'kgb' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Nama Pegawai</label>
                    <input
                      type="text"
                      value={kgbForm.employeeName}
                      onChange={(e) => setKgbForm({ ...kgbForm, employeeName: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">NIP</label>
                    <input
                      type="text"
                      value={kgbForm.nip}
                      onChange={(e) => setKgbForm({ ...kgbForm, nip: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Gaji Pokok Lama (Rp)</label>
                    <input
                      type="number"
                      value={kgbForm.gajiLama}
                      onChange={(e) => setKgbForm({ ...kgbForm, gajiLama: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Gaji Pokok Baru (Rp)</label>
                    <input
                      type="number"
                      value={kgbForm.gajiBaru}
                      onChange={(e) => setKgbForm({ ...kgbForm, gajiBaru: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">TMT KGB Baru</label>
                    <input
                      type="date"
                      value={kgbForm.tmtKgb}
                      onChange={(e) => setKgbForm({ ...kgbForm, tmtKgb: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Status Verifikasi</label>
                    <select
                      value={kgbForm.status}
                      onChange={(e) => setKgbForm({ ...kgbForm, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    >
                      <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                      <option value="Diverifikasi">Diverifikasi</option>
                      <option value="SK Terbit">SK Terbit</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 5. EDIT SHEET 5: SPPD DINAS */}
            {activeTab === 'sppd' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Nomor SPD / SPPD</label>
                    <input
                      type="text"
                      value={sppdForm.nomorSPD}
                      onChange={(e) => setSppdForm({ ...sppdForm, nomorSPD: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Pegawai Yang Ditugaskan</label>
                    <input
                      type="text"
                      value={sppdForm.namaPegawai}
                      onChange={(e) => setSppdForm({ ...sppdForm, namaPegawai: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-medium mb-1">Tempat / Lokasi Tujuan</label>
                    <input
                      type="text"
                      value={sppdForm.tujuan}
                      onChange={(e) => setSppdForm({ ...sppdForm, tujuan: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-medium mb-1">Maksud / Keperluan Tugas</label>
                    <textarea
                      rows={2}
                      value={sppdForm.keperluan}
                      onChange={(e) => setSppdForm({ ...sppdForm, keperluan: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Tgl Berangkat</label>
                    <input
                      type="date"
                      value={sppdForm.tglBerangkat}
                      onChange={(e) => setSppdForm({ ...sppdForm, tglBerangkat: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Total Biaya Riil / SPPD (Rp)</label>
                    <input
                      type="number"
                      value={sppdForm.totalBiaya}
                      onChange={(e) => setSppdForm({ ...sppdForm, totalBiaya: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. EDIT SHEET 6: UANG MAKAN */}
            {activeTab === 'uang_makan' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Bulan Rekapitulasi</label>
                    <input
                      type="text"
                      value={uangMakanForm.bulan}
                      onChange={(e) => setUangMakanForm({ ...uangMakanForm, bulan: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Jumlah Pegawai Berhak</label>
                    <input
                      type="number"
                      value={uangMakanForm.jumlahPegawai}
                      onChange={(e) => setUangMakanForm({ ...uangMakanForm, jumlahPegawai: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Total Hari Hadir Riil</label>
                    <input
                      type="number"
                      value={uangMakanForm.totalHariHadir}
                      onChange={(e) => setUangMakanForm({ ...uangMakanForm, totalHariHadir: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Total Bersih / Netto (Rp)</label>
                    <input
                      type="number"
                      value={uangMakanForm.totalNetto}
                      onChange={(e) => setUangMakanForm({ ...uangMakanForm, totalNetto: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 7. EDIT SHEET 7: LEMBUR ASN */}
            {activeTab === 'lembur' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Nomor Surat Perintah Lembur</label>
                    <input
                      type="text"
                      value={lemburForm.nomorSurat}
                      onChange={(e) => setLemburForm({ ...lemburForm, nomorSurat: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Pegawai Yang Melaksanakan</label>
                    <input
                      type="text"
                      value={lemburForm.namaPegawai}
                      onChange={(e) => setLemburForm({ ...lemburForm, namaPegawai: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Tanggal Pelaksanaan</label>
                    <input
                      type="date"
                      value={lemburForm.tanggal}
                      onChange={(e) => setLemburForm({ ...lemburForm, tanggal: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Jam Mulai</label>
                      <input
                        type="time"
                        value={lemburForm.jamMulai}
                        onChange={(e) => setLemburForm({ ...lemburForm, jamMulai: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Jam Selesai</label>
                      <input
                        type="time"
                        value={lemburForm.jamSelesai}
                        onChange={(e) => setLemburForm({ ...lemburForm, jamSelesai: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-medium mb-1">Uraian / Output Pekerjaan Lembur</label>
                    <textarea
                      rows={2}
                      value={lemburForm.uraianPekerjaan}
                      onChange={(e) => setLemburForm({ ...lemburForm, uraianPekerjaan: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 8. EDIT SHEET 8: PERBENDAHARAAN */}
            {activeTab === 'perbendaharaan' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Jenis Dokumen Kas</label>
                    <select
                      value={perbForm.jenis}
                      onChange={(e) => setPerbForm({ ...perbForm, jenis: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    >
                      <option value="SPP">SPP (Surat Permintaan Pembayaran)</option>
                      <option value="SPM">SPM (Surat Perintah Membayar)</option>
                      <option value="SP2D">SP2D (Surat Perintah Pencairan Dana)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Nomor Dokumen</label>
                    <input
                      type="text"
                      value={perbForm.nomorDokumen}
                      onChange={(e) => setPerbForm({ ...perbForm, nomorDokumen: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-medium mb-1">Keperluan Pembayaran</label>
                    <textarea
                      rows={2}
                      value={perbForm.keperluan}
                      onChange={(e) => setPerbForm({ ...perbForm, keperluan: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Jumlah Nominal Dana (Rp)</label>
                    <input
                      type="number"
                      value={perbForm.jumlahDana}
                      onChange={(e) => setPerbForm({ ...perbForm, jumlahDana: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Status Pencairan Kas</label>
                    <select
                      value={perbForm.status}
                      onChange={(e) => setPerbForm({ ...perbForm, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    >
                      <option value="Draf">Draf</option>
                      <option value="Diajukan ke KPPN">Diajukan ke KPPN</option>
                      <option value="Cair ke Rekening">Cair ke Rekening</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* DASBOR RINGKASAN */}
            {activeTab === 'dashboard' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
                <h4 className="font-bold text-slate-900">Akses Edit Konfigurasi Dasbor Ringkasan</h4>
                <p className="text-slate-600 leading-relaxed">
                  Dasbor Eksekutif merangkum rekapan dari seluruh 8 sheet secara otomatis. Anda dapat langsung memilih sheet di tab atas untuk mengedit data dasbor secara spesifik, atau klik tombol di bawah untuk membuka modul terkait.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('pegawai')}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-indigo-500 text-left cursor-pointer"
                  >
                    <span className="font-bold text-slate-900 block">Edit Pegawai</span>
                    <span className="text-[10px] text-slate-500">Sheet 1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cuti')}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-indigo-500 text-left cursor-pointer"
                  >
                    <span className="font-bold text-slate-900 block">Edit Cuti</span>
                    <span className="text-[10px] text-slate-500">Sheet 2</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('absensi')}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-indigo-500 text-left cursor-pointer"
                  >
                    <span className="font-bold text-slate-900 block">Edit Presensi</span>
                    <span className="text-[10px] text-slate-500">Sheet 3</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('kgb')}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-indigo-500 text-left cursor-pointer"
                  >
                    <span className="font-bold text-slate-900 block">Edit KGB</span>
                    <span className="text-[10px] text-slate-500">Sheet 4</span>
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Perubahan akan langsung disimpan dan disinkronkan ke basis data.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>

                {activeTab !== 'dashboard' && (
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan & Perbarui {currentConfig.sheetName}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
