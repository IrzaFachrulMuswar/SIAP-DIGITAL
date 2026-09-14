import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  X, 
  FileSpreadsheet, 
  Printer, 
  Building, 
  AlertCircle,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  ExternalLink,
  Users,
  CalendarCheck,
  Check,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { CutiBKNRecord, JenisCutiBKN, KeputusanCuti, Employee } from '../types';
import { exportCutiBKNPDF, exportToExcel, exportRekapCutiPDF } from '../utils/exportUtils';
import { 
  initialRekapCuti, 
  RekapCutiItem, 
  REKAP_CUTI_SPREADSHEET_ID, 
  REKAP_CUTI_SPREADSHEET_URL, 
  fetchLiveRekapCuti 
} from '../utils/googleSheetsService';

interface CutiViewProps {
  cutiList: CutiBKNRecord[];
  employees: Employee[];
  onAddCuti: (record: CutiBKNRecord) => void;
  onUpdateCuti: (record: CutiBKNRecord) => void;
  onDeleteCuti: (id: string) => void;
  onRequest2FA: (title: string, action: () => void) => void;
}

export const CutiView: React.FC<CutiViewProps> = ({
  cutiList,
  employees,
  onAddCuti,
  onUpdateCuti,
  onDeleteCuti,
  onRequest2FA,
}) => {
  // Main Tab: 'rekapitulasi_spreadsheet' | 'permohonan_bkn'
  const [activeTab, setActiveTab] = useState<'rekapitulasi_spreadsheet' | 'permohonan_bkn'>('rekapitulasi_spreadsheet');

  // Rekapitulasi Cuti (Live Google Spreadsheet) State
  const [rekapList, setRekapList] = useState<RekapCutiItem[]>(() => {
    const saved = localStorage.getItem('simpeg_rekap_cuti_sheet');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialRekapCuti;
  });

  const [isSyncingRekap, setIsSyncingRekap] = useState(false);
  const [lastSyncedRekap, setLastSyncedRekap] = useState<string>('Tersambung Google Sheets');
  const [rekapSearch, setRekapSearch] = useState('');
  const [rekapFilterSisa, setRekapFilterSisa] = useState<'ALL' | 'AMAN' | 'MENIPIS' | 'HABIS'>('ALL');
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const handleSyncRekap = async () => {
    setIsSyncingRekap(true);
    try {
      const live = await fetchLiveRekapCuti(REKAP_CUTI_SPREADSHEET_ID);
      if (live && live.length > 0) {
        setRekapList(live);
        localStorage.setItem('simpeg_rekap_cuti_sheet', JSON.stringify(live));
        const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
        setLastSyncedRekap(`Disinkronkan pukul ${timeStr}`);
        setSyncToast(`Berhasil membaca ${live.length} data pegawai dari Google Spreadsheet!`);
        setTimeout(() => setSyncToast(null), 3500);
      }
    } catch (err) {
      console.error('Sync rekap failed:', err);
    } finally {
      setIsSyncingRekap(false);
    }
  };

  useEffect(() => {
    handleSyncRekap();
  }, []);

  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTabForm, setActiveTabForm] = useState<'permohonan' | 'persetujuan'>('permohonan');

  const [formData, setFormData] = useState<Partial<CutiBKNRecord>>({
    noPermohonan: `CUTI-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
    tanggalPermohonan: new Date().toISOString().slice(0, 10),
    employeeId: '',
    employeeName: '',
    nip: '',
    jabatan: '',
    unitKerja: '',
    masaKerja: '14 Tahun 2 Bulan',
    jenisCuti: 'Cuti Tahunan',
    alasanCuti: '',
    lamaHari: 3,
    tanggalMulai: new Date().toISOString().slice(0, 10),
    tanggalSelesai: new Date().toISOString().slice(0, 10),
    catatanCuti: {
      sisaCutiN2: 0,
      sisaCutiN1: 0,
      sisaCutiN: 12,
      cutiBesar: 0,
      cutiSakit: 0,
      cutiMelahirkan: 0,
      cutiAlasanPenting: 0,
      cutiLuarTanggunganNegara: 0,
    },
    alamatSelamaCuti: '',
    teleponSelamaCuti: '',
    atasanLangsung: {
      nama: 'Dr. Ir. Hendra Setiawan, M.M.',
      nip: '19750312 199903 1 002',
      jabatan: 'Kepala Bagian Umum & Kepegawaian',
      status: 'Disetujui',
      catatan: 'Pekerjaan telah didelegasikan dengan baik.',
      tanggal: new Date().toISOString().slice(0, 10),
    },
    pejabatBerwenang: {
      nama: 'Prof. Dr. Agus Prabowo, M.Sc.',
      nip: '19680515 199203 1 001',
      jabatan: 'Sekretaris Utama',
      status: 'Disetujui',
      catatan: 'Disetujui sesuai hak cuti tahunan.',
      tanggal: new Date().toISOString().slice(0, 10),
    },
    statusFinal: 'Disetujui',
  });

  const filteredCuti = cutiList.filter((c) => {
    const matchesSearch =
      c.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      c.nip.toLowerCase().includes(search.toLowerCase()) ||
      c.noPermohonan.toLowerCase().includes(search.toLowerCase());

    const matchesJenis = filterJenis === 'ALL' || c.jenisCuti === filterJenis;
    const matchesStatus = filterStatus === 'ALL' || c.statusFinal === filterStatus;

    return matchesSearch && matchesJenis && matchesStatus;
  });

  const handleSelectEmployee = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;

    setFormData({
      ...formData,
      employeeId: emp.id,
      employeeName: `${emp.gelarDepan || ''} ${emp.nama} ${emp.gelarBelakang || ''}`.trim(),
      nip: emp.nip,
      jabatan: emp.jabatan,
      unitKerja: emp.unitKerja,
      alamatSelamaCuti: emp.alamat || '',
      teleponSelamaCuti: emp.telepon || '',
      catatanCuti: {
        sisaCutiN2: emp.sisaCutiN2 || 0,
        sisaCutiN1: emp.sisaCutiN1 || 0,
        sisaCutiN: emp.sisaCutiN || 12,
        cutiBesar: 0,
        cutiSakit: 0,
        cutiMelahirkan: 0,
        cutiAlasanPenting: 0,
        cutiLuarTanggunganNegara: 0,
      }
    });
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setActiveTabForm('permohonan');
    const emp = employees[0];
    setFormData({
      noPermohonan: `CUTI-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      tanggalPermohonan: new Date().toISOString().slice(0, 10),
      employeeId: emp?.id || '',
      employeeName: emp?.nama || '',
      nip: emp?.nip || '',
      jabatan: emp?.jabatan || '',
      unitKerja: emp?.unitKerja || '',
      masaKerja: '10 Tahun 0 Bulan',
      jenisCuti: 'Cuti Tahunan',
      alasanCuti: 'Keperluan urusan keluarga di kampung halaman.',
      lamaHari: 3,
      tanggalMulai: new Date().toISOString().slice(0, 10),
      tanggalSelesai: new Date().toISOString().slice(0, 10),
      catatanCuti: {
        sisaCutiN2: emp?.sisaCutiN2 || 0,
        sisaCutiN1: emp?.sisaCutiN1 || 0,
        sisaCutiN: emp?.sisaCutiN || 12,
        cutiBesar: 0,
        cutiSakit: 0,
        cutiMelahirkan: 0,
        cutiAlasanPenting: 0,
        cutiLuarTanggunganNegara: 0,
      },
      alamatSelamaCuti: emp?.alamat || 'Jl. Melati No. 12, Bandung, Jawa Barat',
      teleponSelamaCuti: emp?.telepon || '0812-3456-7890',
      atasanLangsung: {
        nama: 'Dr. Ir. Hendra Setiawan, M.M.',
        nip: '19750312 199903 1 002',
        jabatan: 'Kepala Bagian Umum & Kepegawaian',
        status: 'Disetujui',
        catatan: 'Tugas telah didelegasikan.',
        tanggal: new Date().toISOString().slice(0, 10),
      },
      pejabatBerwenang: {
        nama: 'Prof. Dr. Agus Prabowo, M.Sc.',
        nip: '19680515 199203 1 001',
        jabatan: 'Sekretaris Utama',
        status: 'Disetujui',
        catatan: 'Disetujui sesuai aturan.',
        tanggal: new Date().toISOString().slice(0, 10),
      },
      statusFinal: 'Disetujui',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cuti: CutiBKNRecord) => {
    setIsEditing(true);
    setActiveTabForm('permohonan');
    setFormData({ ...cuti });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeName || !formData.nip || !formData.alasanCuti) {
      alert('Mohon lengkapi data pegawai dan alasan cuti.');
      return;
    }

    const payload: CutiBKNRecord = {
      ...(formData as CutiBKNRecord),
      id: isEditing && formData.id ? formData.id : `CUTI-REC-${Date.now().toString().slice(-4)}`,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    if (payload.statusFinal === 'Disetujui' && isEditing) {
      onRequest2FA('Pemberian persetujuan pejabat atas permohonan cuti BKN', () => {
        onUpdateCuti(payload);
        setIsModalOpen(false);
      });
    } else {
      if (isEditing) {
        onUpdateCuti(payload);
      } else {
        onAddCuti(payload);
      }
      setIsModalOpen(false);
    }
  };

  const handleAjukanCutiFromRekap = (item: RekapCutiItem) => {
    const emp = employees.find((e) => e.nip.replace(/\s+/g, '') === item.nip.replace(/\s+/g, ''));
    setIsEditing(false);
    setActiveTabForm('permohonan');
    setFormData({
      noPermohonan: `CUTI-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      tanggalPermohonan: new Date().toISOString().slice(0, 10),
      employeeId: emp?.id || `EMP-${item.nip}`,
      employeeName: item.nama,
      nip: item.nip,
      jabatan: emp?.jabatan || 'Pegawai ASN',
      unitKerja: emp?.unitKerja || 'Instansi Terkait',
      masaKerja: emp ? `${emp.masaKerjaTahun || 5} Tahun` : '5 Tahun',
      jenisCuti: 'Cuti Tahunan',
      alasanCuti: 'Keperluan keluarga dan istirahat tahunan.',
      lamaHari: Math.min(3, item.sisaCuti > 0 ? item.sisaCuti : 1),
      tanggalMulai: new Date().toISOString().slice(0, 10),
      tanggalSelesai: new Date().toISOString().slice(0, 10),
      catatanCuti: {
        sisaCutiN2: item.cutiN2,
        sisaCutiN1: item.cutiN1,
        sisaCutiN: item.cutiN,
        cutiBesar: 0,
        cutiSakit: 0,
        cutiMelahirkan: 0,
        cutiAlasanPenting: 0,
        cutiLuarTanggunganNegara: 0,
      },
      alamatSelamaCuti: emp?.alamat || 'Alamat Domisili Pegawai',
      teleponSelamaCuti: emp?.telepon || '0812-xxxx-xxxx',
      atasanLangsung: {
        nama: 'Dr. Ir. Hendra Setiawan, M.M.',
        nip: '19750312 199903 1 002',
        jabatan: 'Kepala Bagian Umum & Kepegawaian',
        status: 'Disetujui',
        catatan: 'Tugas telah didelegasikan.',
        tanggal: new Date().toISOString().slice(0, 10),
      },
      pejabatBerwenang: {
        nama: 'Prof. Dr. Agus Prabowo, M.Sc.',
        nip: '19680515 199203 1 001',
        jabatan: 'Sekretaris Utama',
        status: 'Disetujui',
        catatan: 'Disetujui sesuai aturan.',
        tanggal: new Date().toISOString().slice(0, 10),
      },
      statusFinal: 'Disetujui',
    });
    setIsModalOpen(true);
  };

  const handleExportExcel = () => {
    const data = cutiList.map((c) => ({
      No_Permohonan: c.noPermohonan,
      Tanggal_Pengajuan: c.tanggalPermohonan,
      NIP: c.nip,
      Nama_Pegawai: c.employeeName,
      Jabatan: c.jabatan,
      Jenis_Cuti: c.jenisCuti,
      Lama_Hari: c.lamaHari,
      Tanggal_Mulai: c.tanggalMulai,
      Tanggal_Selesai: c.tanggalSelesai,
      Alasan: c.alasanCuti,
      Status_Atasan: c.atasanLangsung.status,
      Keputusan_Pejabat: c.pejabatBerwenang.status,
      Status_Final: c.statusFinal,
    }));
    exportToExcel(data, 'Pengajuan Cuti BKN', 'Rekapitulasi_Cuti_Perka_BKN_24_2017');
  };

  // Filtered Rekap Cuti
  const filteredRekap = rekapList.filter((item) => {
    const matchesQuery =
      item.nama.toLowerCase().includes(rekapSearch.toLowerCase()) ||
      item.nip.includes(rekapSearch) ||
      item.no.includes(rekapSearch);

    if (!matchesQuery) return false;

    if (rekapFilterSisa === 'AMAN') return item.sisaCuti >= 10;
    if (rekapFilterSisa === 'MENIPIS') return item.sisaCuti > 0 && item.sisaCuti < 10;
    if (rekapFilterSisa === 'HABIS') return item.sisaCuti === 0;
    return true;
  });

  const totalPegawai = rekapList.length;
  const totalHakCuti = rekapList.reduce((acc, curr) => acc + curr.hakCuti, 0);
  const totalTerpakai = rekapList.reduce((acc, curr) => acc + curr.terpakai, 0);
  const totalSisaCuti = rekapList.reduce((acc, curr) => acc + curr.sisaCuti, 0);

  const handleExportRekapExcel = () => {
    const data = filteredRekap.map((item) => ({
      No: item.no,
      NIP: item.nip,
      Nama_Pegawai: item.nama,
      Cuti_N_2026: item.cutiN,
      Cuti_N_1_2025: item.cutiN1,
      Cuti_N_2_2024: item.cutiN2,
      Jumlah_Hak_Cuti: item.hakCuti,
      Cuti_Terpakai: item.terpakai,
      Sisa_Cuti: item.sisaCuti,
      Status: item.sisaCuti > 10 ? 'Aman' : item.sisaCuti > 0 ? 'Tersedia' : 'Habis',
    }));
    exportToExcel(data, 'Rekap Cuti 2026', `Rekapitulasi_Cuti_ASN_${REKAP_CUTI_SPREADSHEET_ID.slice(0, 8)}`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {syncToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{syncToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncToast(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Module Sub-Navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('rekapitulasi_spreadsheet')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'rekapitulasi_spreadsheet'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Rekapitulasi Cuti (Google Spreadsheet)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'rekapitulasi_spreadsheet'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {rekapList.length} ASN
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('permohonan_bkn')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'permohonan_bkn'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Berkas Permohonan BKN (Formulir 8 Bagian)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'permohonan_bkn'
                  ? 'bg-indigo-700 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {cutiList.length} Berkas
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={REKAP_CUTI_SPREADSHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <span>Spreadsheet Cuti</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {activeTab === 'rekapitulasi_spreadsheet' ? (
        /* ================= TAB 1: REKAPITULASI CUTI GOOGLE SPREADSHEET ================= */
        <div className="space-y-5">
          {/* Header Banner & Google Sheets Connection Info */}
          <div className="rounded-xl border border-emerald-200 bg-linear-to-r from-emerald-50/70 via-white to-teal-50/50 p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-2xs">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Database Spreadsheet Terhubung
                  </span>
                  <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    ID: {REKAP_CUTI_SPREADSHEET_ID}
                  </span>
                  <span className="text-xs text-slate-500">• {lastSyncedRekap}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-2">
                  Rekapitulasi Hak & Pengambilan Cuti ASN Tahun 2026
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  Data tersinkronisasi langsung dari Google Spreadsheet resmi unit kepegawaian. Memuat kuota hak cuti N (2026), sisa cuti N-1, cuti N-2, jumlah hari terpakai, dan sisa saldo cuti untuk seluruh 62 pegawai.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSyncRekap}
                  disabled={isSyncingRekap}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  title="Segarkan data terbaru dari Google Spreadsheet"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-emerald-600 ${isSyncingRekap ? 'animate-spin' : ''}`} />
                  <span>{isSyncingRekap ? 'Memuat...' : 'Segarkan Data'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportRekapExcel}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Ekspor Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportRekapCutiPDF(filteredRekap)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak Rekap PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total ASN Terdaftar</span>
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{totalPegawai}</p>
              <p className="mt-1 text-[11px] text-slate-500">62 Pegawai Aktif</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Hak Cuti Kolektif</span>
                <CalendarCheck className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{totalHakCuti} <span className="text-sm font-normal text-slate-500">Hari</span></p>
              <p className="mt-1 text-[11px] text-indigo-600">Gabungan N, N-1, N-2</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Hari Cuti Terpakai</span>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-amber-700">{totalTerpakai} <span className="text-sm font-normal text-slate-500">Hari</span></p>
              <p className="mt-1 text-[11px] text-slate-500">Telah digunakan tahun berjalan</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Sisa Hak Cuti Tersedia</span>
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-teal-700">{totalSisaCuti} <span className="text-sm font-normal text-slate-500">Hari</span></p>
              <p className="mt-1 text-[11px] text-emerald-600 font-medium">Siap diajukan permohonan</p>
            </div>
          </div>

          {/* Search & Filter Bar for Rekap */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama pegawai, NIP, atau nomor urut..."
                value={rekapSearch}
                onChange={(e) => setRekapSearch(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <select
                value={rekapFilterSisa}
                onChange={(e) => setRekapFilterSisa(e.target.value as any)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-emerald-600 focus:bg-white"
              >
                <option value="ALL">Semua Sisa Cuti</option>
                <option value="AMAN">Sisa Cuti Aman (≥ 10 Hari)</option>
                <option value="MENIPIS">Sisa Cuti Menipis (1 - 9 Hari)</option>
                <option value="HABIS">Sisa Cuti Habis (0 Hari)</option>
              </select>
            </div>
          </div>

          {/* Interactive Rekap Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Data Rekapitulasi Cuti Terbaca ({filteredRekap.length} dari {rekapList.length} ASN)
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Klik tombol "Ajukan Cuti" untuk otomatis memuat sisa kuota ke Formulir BKN
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">No</th>
                    <th className="py-2.5 px-3">NIP Pegawai</th>
                    <th className="py-2.5 px-3">Nama Pegawai ASN</th>
                    <th className="py-2.5 px-2 text-center">Tahun N (2026)</th>
                    <th className="py-2.5 px-2 text-center">N-1 (2025)</th>
                    <th className="py-2.5 px-2 text-center">N-2 (2024)</th>
                    <th className="py-2.5 px-2 text-center font-bold text-slate-700">Total Hak</th>
                    <th className="py-2.5 px-2 text-center text-amber-700">Terpakai</th>
                    <th className="py-2.5 px-3 text-center font-bold text-emerald-800">Sisa Cuti</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRekap.map((item) => {
                    const isZero = item.sisaCuti === 0;
                    const isLow = item.sisaCuti > 0 && item.sisaCuti < 10;
                    return (
                      <tr key={item.no + item.nip} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-medium">
                          {item.no}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                          {item.nip}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {item.nama}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                          {item.cutiN}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                          {item.cutiN1}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                          {item.cutiN2}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold font-mono text-slate-800 bg-slate-50/50">
                          {item.hakCuti}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold font-mono text-amber-700">
                          {item.terpakai}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                              isZero
                                ? 'bg-rose-100 text-rose-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.sisaCuti} Hari
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              isZero
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isLow
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isZero ? 'Habis' : isLow ? 'Menipis' : 'Aman'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleAjukanCutiFromRekap(item)}
                            className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 transition-colors cursor-pointer"
                            title="Ajukan permohonan cuti untuk pegawai ini"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Ajukan</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ================= TAB 2: BERKAS PERMOHONAN CUTI BKN (PERKA 24/2017) ================= */
        <div className="space-y-6">
          {/* Top Banner Notice BKN No 24 / 2017 */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> Standar Regulasi Peraturan BKN No. 24 Tahun 2017
                </span>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-2">
                  Tata Cara & Formulir Permohonan Pengajuan Cuti ASN
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Memuat formulir 8 bagian (Data Pegawai, Jenis Cuti, Alasan, Lama Cuti, Catatan Sisa Cuti N/N-1/N-2, Alamat Selama Cuti, Pertimbangan Atasan Langsung, dan Keputusan Pejabat yang Berwenang).
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Ekspor Rekap Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="flex items-center gap-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Buat Permohonan Cuti BKN</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, NIP, no permohonan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <select
                value={filterJenis}
                onChange={(e) => setFilterJenis(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="ALL">Semua Jenis Cuti BKN</option>
                <option value="Cuti Tahunan">Cuti Tahunan</option>
                <option value="Cuti Besar">Cuti Besar</option>
                <option value="Cuti Sakit">Cuti Sakit</option>
                <option value="Cuti Melahirkan">Cuti Melahirkan</option>
                <option value="Cuti Karena Alasan Penting">Cuti Alasan Penting</option>
                <option value="Cuti di Luar Tanggungan Negara">Cuti di Luar Tanggungan Negara</option>
              </select>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="ALL">Semua Status Persetujuan</option>
                <option value="Disetujui">Disetujui Penuh</option>
                <option value="Menunggu Persetujuan Atasan">Menunggu Persetujuan Atasan</option>
                <option value="Menunggu Pejabat Berwenang">Menunggu Pejabat Berwenang</option>
                <option value="Perubahan">Perubahan Jadwal</option>
                <option value="Ditangguhkan">Ditangguhkan</option>
                <option value="Tidak Disetujui">Tidak Disetujui</option>
              </select>
            </div>
          </div>

          {/* Cuti Records Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">
                Daftar Berkas Pengajuan Cuti ASN ({filteredCuti.length})
              </h3>
              <span className="text-xs text-slate-400">
                Dapat dicetak langsung ke Formulir Resmi PDF BKN No. 24/2017
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Pegawai Pemohon</th>
                    <th className="py-3 px-3">Jenis & Alasan</th>
                    <th className="py-3 px-3">Lama Cuti</th>
                    <th className="py-3 px-3">Sisa Cuti (N/N-1)</th>
                    <th className="py-3 px-3">Status Keputusan</th>
                    <th className="py-3 px-4 text-center">Aksi / Cetak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCuti.map((cuti) => (
                    <tr key={cuti.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-slate-900">{cuti.employeeName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">NIP: {cuti.nip}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[170px]">{cuti.jabatan}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                          {cuti.jenisCuti}
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1 italic truncate max-w-[180px]" title={cuti.alasanCuti}>
                          "{cuti.alasanCuti}"
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-800">{cuti.lamaHari} Hari Kerja</p>
                        <p className="text-[10px] text-slate-500">
                          {cuti.tanggalMulai} s.d {cuti.tanggalSelesai}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-700">
                          Tahun N: {cuti.catatanCuti.sisaCutiN} hari
                        </span>
                        <p className="text-[10px] text-slate-400">
                          N-1: {cuti.catatanCuti.sisaCutiN1} &bull; N-2: {cuti.catatanCuti.sisaCutiN2}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            cuti.statusFinal === 'Disetujui'
                              ? 'bg-emerald-100 text-emerald-800'
                              : cuti.statusFinal.includes('Menunggu')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {cuti.statusFinal}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Pejabat: {cuti.pejabatBerwenang.status}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol Cetak PDF Format BKN */}
                          <button
                            type="button"
                            onClick={() => exportCutiBKNPDF(cuti)}
                            className="flex items-center gap-1 p-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                            title="Cetak Formulir Resmi Perka BKN No. 24 Tahun 2017 (PDF)"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Form BKN</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cuti)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit / Beri Persetujuan"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus berkas permohonan cuti nomor ${cuti.noPermohonan}?`)) {
                                onDeleteCuti(cuti.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Berkas"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cuti BKN 8 Bagian */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                Formulir Standar Peraturan BKN No. 24 Tahun 2017
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Pemeriksaan & Penetapan Permohonan Cuti' : 'Pengajuan Permohonan Cuti Pegawai'}
              </h3>
            </div>

            {/* Modal Tabs: Form Pemohon vs Lembar Persetujuan */}
            <div className="mt-4 flex gap-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTabForm('permohonan')}
                className={`pb-2 text-xs font-bold transition-colors cursor-pointer ${
                  activeTabForm === 'permohonan'
                    ? 'border-b-2 border-rose-600 text-rose-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Bagian I - VI: Formulir Pemohon
              </button>
              <button
                type="button"
                onClick={() => setActiveTabForm('persetujuan')}
                className={`pb-2 text-xs font-bold transition-colors cursor-pointer ${
                  activeTabForm === 'persetujuan'
                    ? 'border-b-2 border-rose-600 text-rose-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Bagian VII - VIII: Persetujuan Atasan & Pejabat
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {activeTabForm === 'permohonan' ? (
                <>
                  {/* Bagian I: Data Pegawai */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800">I. DATA PEGAWAI</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Nama Pegawai Pemohon *</label>
                        <select
                          value={formData.employeeId || ''}
                          onChange={(e) => handleSelectEmployee(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                        >
                          <option value="">-- Pilih Pegawai ASN --</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.nama} - {emp.nip}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Masa Kerja (Thn/Bln)</label>
                        <input
                          type="text"
                          value={formData.masaKerja || '12 Tahun 4 Bulan'}
                          onChange={(e) => setFormData({ ...formData, masaKerja: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian II: Jenis Cuti */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800">II. JENIS CUTI YANG DIAMBIL</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {[
                        'Cuti Tahunan',
                        'Cuti Besar',
                        'Cuti Sakit',
                        'Cuti Melahirkan',
                        'Cuti Karena Alasan Penting',
                        'Cuti di Luar Tanggungan Negara'
                      ].map((item) => (
                        <label key={item} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-rose-300">
                          <input
                            type="radio"
                            name="jenisCuti"
                            value={item}
                            checked={formData.jenisCuti === item}
                            onChange={(e) => setFormData({ ...formData, jenisCuti: e.target.value as JenisCutiBKN })}
                            className="text-rose-600 focus:ring-rose-500"
                          />
                          <span className="text-[11px] font-semibold text-slate-700">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Bagian III & IV: Alasan & Lama Cuti */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800">III & IV. ALASAN & LAMANYA CUTI</h4>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Alasan Mengajukan Cuti *</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Contoh: Merawat orang tua yang sedang sakit keras di kampung halaman..."
                        value={formData.alasanCuti || ''}
                        onChange={(e) => setFormData({ ...formData, alasanCuti: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Lama (Hari Kerja)</label>
                        <input
                          type="number"
                          value={formData.lamaHari || 1}
                          onChange={(e) => setFormData({ ...formData, lamaHari: Number(e.target.value) })}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Mulai Tanggal</label>
                        <input
                          type="date"
                          value={formData.tanggalMulai || ''}
                          onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Sampai Dengan</label>
                        <input
                          type="date"
                          value={formData.tanggalSelesai || ''}
                          onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian V & VI: Catatan Cuti & Alamat Selama Cuti */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800">V & VI. CATATAN CUTI & ALAMAT</h4>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] text-slate-600">Sisa Cuti N (Thn Berjalan)</label>
                        <input
                          type="number"
                          value={formData.catatanCuti?.sisaCutiN || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            catatanCuti: { ...formData.catatanCuti!, sisaCutiN: Number(e.target.value) }
                          })}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-1.5 text-xs bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-600">Sisa Cuti N-1</label>
                        <input
                          type="number"
                          value={formData.catatanCuti?.sisaCutiN1 || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            catatanCuti: { ...formData.catatanCuti!, sisaCutiN1: Number(e.target.value) }
                          })}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-1.5 text-xs bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-600">Sisa Cuti N-2</label>
                        <input
                          type="number"
                          value={formData.catatanCuti?.sisaCutiN2 || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            catatanCuti: { ...formData.catatanCuti!, sisaCutiN2: Number(e.target.value) }
                          })}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-1.5 text-xs bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Alamat Selama Menjalankan Cuti</label>
                        <input
                          type="text"
                          value={formData.alamatSelamaCuti || ''}
                          onChange={(e) => setFormData({ ...formData, alamatSelamaCuti: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">No. Telepon / WA Yang Bisa Dihubungi</label>
                        <input
                          type="text"
                          value={formData.teleponSelamaCuti || ''}
                          onChange={(e) => setFormData({ ...formData, teleponSelamaCuti: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Lembar Persetujuan: VII & VIII */
                <div className="space-y-4">
                  {/* Bagian VII: Pertimbangan Atasan Langsung */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      VII. PERTIMBANGAN ATASAN LANGSUNG
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-600">Nama & NIP Atasan Langsung</label>
                        <input
                          type="text"
                          value={formData.atasanLangsung?.nama || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            atasanLangsung: { ...formData.atasanLangsung!, nama: e.target.value }
                          })}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-600">Keputusan Pertimbangan</label>
                        <select
                          value={formData.atasanLangsung?.status || 'Disetujui'}
                          onChange={(e) => setFormData({
                            ...formData,
                            atasanLangsung: { ...formData.atasanLangsung!, status: e.target.value as KeputusanCuti }
                          })}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs bg-white font-semibold"
                        >
                          <option value="Disetujui">Disetujui</option>
                          <option value="Perubahan">Perubahan</option>
                          <option value="Ditangguhkan">Ditangguhkan</option>
                          <option value="Tidak Disetujui">Tidak Disetujui</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-600">Catatan Pertimbangan Atasan</label>
                      <input
                        type="text"
                        value={formData.atasanLangsung?.catatan || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          atasanLangsung: { ...formData.atasanLangsung!, catatan: e.target.value }
                        })}
                        className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      />
                    </div>
                  </div>

                  {/* Bagian VIII: Keputusan Pejabat yang Berwenang */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      VIII. KEPUTUSAN PEJABAT YANG BERWENANG MEMBERIKAN CUTI
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-600">Nama & NIP Pejabat Berwenang</label>
                        <input
                          type="text"
                          value={formData.pejabatBerwenang?.nama || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            pejabatBerwenang: { ...formData.pejabatBerwenang!, nama: e.target.value }
                          })}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-600">Keputusan Akhir Pejabat</label>
                        <select
                          value={formData.pejabatBerwenang?.status || 'Disetujui'}
                          onChange={(e) => {
                            const newStatus = e.target.value as KeputusanCuti;
                            setFormData({
                              ...formData,
                              pejabatBerwenang: { ...formData.pejabatBerwenang!, status: newStatus },
                              statusFinal: newStatus
                            });
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs bg-white font-bold text-emerald-800"
                        >
                          <option value="Disetujui">Disetujui</option>
                          <option value="Perubahan">Perubahan</option>
                          <option value="Ditangguhkan">Ditangguhkan</option>
                          <option value="Tidak Disetujui">Tidak Disetujui</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-600">Catatan / Alasan Pejabat</label>
                      <input
                        type="text"
                        value={formData.pejabatBerwenang?.catatan || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          pejabatBerwenang: { ...formData.pejabatBerwenang!, catatan: e.target.value }
                        })}
                        className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Tutup
                </button>
                <div className="flex gap-2">
                  {activeTabForm === 'permohonan' ? (
                    <button
                      type="button"
                      onClick={() => setActiveTabForm('persetujuan')}
                      className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
                    >
                      Lanjut ke Lembar Persetujuan &rarr;
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-sm"
                    >
                      Simpan Keputusan Cuti
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
