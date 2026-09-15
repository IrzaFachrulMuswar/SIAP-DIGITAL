import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Clock, 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  Edit3, 
  FileSpreadsheet, 
  Printer, 
  X, 
  CheckCircle2, 
  MapPin, 
  DollarSign,
  Calendar,
  UserCheck,
  FolderOpen,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Paperclip
} from 'lucide-react';
import { PerjalananDinasRecord, LemburRecord, Employee, LampiranDokumen } from '../types';
import { formatRupiah, exportSPPDPDF, exportToExcel } from '../utils/exportUtils';
import { FileUploadZone } from '../components/FileUploadZone';
import { DocumentViewerModal } from '../components/DocumentViewerModal';

export const SPPD_GOOGLE_DRIVE_URL = 'https://drive.google.com/drive/folders/1cjqUhafgThFWGnM3QbWllh1TQmozJwLr';

// Google Spreadsheet Laporan Perjalanan Dinas (SPD) ID: 1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M (gid: 271751341)
export const SPPD_SPREADSHEET_ID = '1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M';
export const SPPD_SPREADSHEET_GID = '271751341';
export const SPPD_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SPPD_SPREADSHEET_ID}/edit?gid=${SPPD_SPREADSHEET_GID}#gid=${SPPD_SPREADSHEET_GID}`;
export const SPPD_SPREADSHEET_EMBED_URL = `https://docs.google.com/spreadsheets/d/${SPPD_SPREADSHEET_ID}/htmlembed?gid=${SPPD_SPREADSHEET_GID}&widget=true&headers=false`;

// Google Spreadsheet Rekap Absen & Laporan Lembur ID: 1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M
export const LEMBUR_SPREADSHEET_ID = '1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M';
export const LEMBUR_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${LEMBUR_SPREADSHEET_ID}/edit?usp=sharing`;
export const LEMBUR_SPREADSHEET_EMBED_URL = `https://docs.google.com/spreadsheets/d/${LEMBUR_SPREADSHEET_ID}/htmlembed?widget=true&headers=false`;

interface KeuanganSppdViewProps {
  initialTab?: 'sppd' | 'lembur';
  sppdList: PerjalananDinasRecord[];
  lemburList: LemburRecord[];
  employees: Employee[];
  onAddSPPD: (record: PerjalananDinasRecord) => void;
  onUpdateSPPD: (record: PerjalananDinasRecord) => void;
  onDeleteSPPD: (id: string) => void;
  onAddLembur: (record: LemburRecord) => void;
  onUpdateLembur: (record: LemburRecord) => void;
  onDeleteLembur: (id: string) => void;
  onRequest2FA: (title: string, action: () => void) => void;
}

export const KeuanganSppdView: React.FC<KeuanganSppdViewProps> = ({
  initialTab,
  sppdList,
  lemburList,
  employees,
  onAddSPPD,
  onUpdateSPPD,
  onDeleteSPPD,
  onAddLembur,
  onUpdateLembur,
  onDeleteLembur,
  onRequest2FA,
}) => {
  const [activeTab, setActiveTab] = useState<'sppd' | 'lembur'>(initialTab || 'sppd');
  const [search, setSearch] = useState('');
  const [copiedDriveLink, setCopiedDriveLink] = useState(false);
  const [copiedSppdSpreadsheet, setCopiedSppdSpreadsheet] = useState(false);
  const [showSppdSheetPreview, setShowSppdSheetPreview] = useState(false);
  const [copiedLemburSpreadsheet, setCopiedLemburSpreadsheet] = useState(false);
  const [showLemburSheetPreview, setShowLemburSheetPreview] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleCopyDriveLink = () => {
    navigator.clipboard.writeText(SPPD_GOOGLE_DRIVE_URL);
    setCopiedDriveLink(true);
    setTimeout(() => setCopiedDriveLink(false), 2500);
  };

  const handleCopySppdSpreadsheet = () => {
    navigator.clipboard.writeText(SPPD_SPREADSHEET_URL);
    setCopiedSppdSpreadsheet(true);
    setTimeout(() => setCopiedSppdSpreadsheet(false), 2500);
  };

  const handleCopyLemburSpreadsheet = () => {
    navigator.clipboard.writeText(LEMBUR_SPREADSHEET_URL);
    setCopiedLemburSpreadsheet(true);
    setTimeout(() => setCopiedLemburSpreadsheet(false), 2500);
  };

  // SPPD Modal State
  const [isSppdModalOpen, setIsSppdModalOpen] = useState(false);
  const [isEditingSppd, setIsEditingSppd] = useState(false);
  const [sppdForm, setSppdForm] = useState<Partial<PerjalananDinasRecord>>({
    nomorSuratTugas: `ST-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
    nomorSPPD: `SPPD-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
    employeeId: '',
    employeeName: '',
    nip: '',
    jabatan: '',
    tingkatBiaya: 'Tingkat B',
    maksudPerjalanan: 'Koordinasi Penyelenggaraan Sistem Informasi ASN',
    alatAngkutan: 'Pesawat Udara',
    kotaAsal: 'Jakarta',
    kotaTujuan: 'Yogyakarta',
    lamaHari: 3,
    tanggalBerangkat: new Date().toISOString().slice(0, 10),
    tanggalKembali: new Date().toISOString().slice(0, 10),
    rincianBiaya: {
      uangHarian: 1290000,
      biayaTransport: 2500000,
      biayaPenginapan: 1500000,
      uangRepresentasi: 0,
      totalBiaya: 5290000,
    },
    pejabatPembuatKomitmen: 'Drs. H. Mulyadi, M.Si.',
    nipPPK: '19710815 199603 1 003',
    status: 'Disetujui PPK',
    dokumen: [],
  });

  // Lembur Modal State
  const [isLemburModalOpen, setIsLemburModalOpen] = useState(false);
  const [isEditingLembur, setIsEditingLembur] = useState(false);
  const [lemburForm, setLemburForm] = useState<Partial<LemburRecord>>({
    nomorSuratPerintah: `SPL-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
    tanggalLembur: new Date().toISOString().slice(0, 10),
    employeeId: '',
    employeeName: '',
    nip: '',
    jamMulai: '17:30',
    jamSelesai: '21:30',
    jumlahJam: 4,
    uraianPekerjaan: 'Penyelesaian Rekonsiliasi Laporan Keuangan Akhir Bulan',
    tarifPerJam: 30000,
    uangMakan: 37000,
    totalUangLembur: 157000,
    status: 'Disetujui Atasan',
    dokumen: [],
  });

  // Document Viewer Modal State
  const [viewingDocs, setViewingDocs] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    documents: LampiranDokumen[];
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    documents: [],
  });

  // Calculations for SPPD Form
  const handleUpdateSppdBiaya = (field: string, val: number) => {
    const current = { ...(sppdForm.rincianBiaya || { uangHarian: 0, biayaTransport: 0, biayaPenginapan: 0, uangRepresentasi: 0, totalBiaya: 0 }) };
    (current as any)[field] = val;
    current.totalBiaya = (current.uangHarian || 0) + (current.biayaTransport || 0) + (current.biayaPenginapan || 0) + (current.uangRepresentasi || 0);
    setSppdForm({ ...sppdForm, rincianBiaya: current });
  };

  const handleSelectEmpForSppd = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    setSppdForm({
      ...sppdForm,
      employeeId: emp.id,
      employeeName: `${emp.gelarDepan || ''} ${emp.nama} ${emp.gelarBelakang || ''}`.trim(),
      nip: emp.nip,
      jabatan: emp.jabatan,
    });
  };

  const handleSelectEmpForLembur = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    setLemburForm({
      ...lemburForm,
      employeeId: emp.id,
      employeeName: `${emp.gelarDepan || ''} ${emp.nama} ${emp.gelarBelakang || ''}`.trim(),
      nip: emp.nip,
    });
  };

  const handleSaveSPPD = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sppdForm.employeeName || !sppdForm.maksudPerjalanan) {
      alert('Lengkapi pegawai dan maksud perjalanan dinas.');
      return;
    }

    const payload: PerjalananDinasRecord = {
      ...(sppdForm as PerjalananDinasRecord),
      id: isEditingSppd && sppdForm.id ? sppdForm.id : `SPPD-${Date.now().toString().slice(-4)}`,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    if (payload.status === 'Lunas Dibayar Kas' || payload.status === 'Disetujui PPK') {
      onRequest2FA('Persetujuan / Pembayaran Biaya Perjalanan Dinas (SPPD)', () => {
        if (isEditingSppd) {
          onUpdateSPPD(payload);
        } else {
          onAddSPPD(payload);
        }
        setIsSppdModalOpen(false);
      });
    } else {
      if (isEditingSppd) {
        onUpdateSPPD(payload);
      } else {
        onAddSPPD(payload);
      }
      setIsSppdModalOpen(false);
    }
  };

  const handleSaveLembur = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lemburForm.employeeName || !lemburForm.uraianPekerjaan) {
      alert('Lengkapi pegawai dan uraian pekerjaan lembur.');
      return;
    }

    const total = (Number(lemburForm.jumlahJam || 0) * Number(lemburForm.tarifPerJam || 0)) + Number(lemburForm.uangMakan || 0);
    const payload: LemburRecord = {
      ...(lemburForm as LemburRecord),
      id: isEditingLembur && lemburForm.id ? lemburForm.id : `LBR-${Date.now().toString().slice(-4)}`,
      totalUangLembur: total,
    };

    if (isEditingLembur) {
      onUpdateLembur(payload);
    } else {
      onAddLembur(payload);
    }
    setIsLemburModalOpen(false);
  };

  const handleExportSppdExcel = () => {
    const data = sppdList.map((s) => ({
      No_SPPD: s.nomorSPPD,
      No_Surat_Tugas: s.nomorSuratTugas,
      NIP: s.nip,
      Nama_Pegawai: s.employeeName,
      Tujuan: `${s.kotaAsal} -> ${s.kotaTujuan}`,
      Lama_Hari: s.lamaHari,
      Tanggal_Berangkat: s.tanggalBerangkat,
      Maksud: s.maksudPerjalanan,
      Uang_Harian: s.rincianBiaya.uangHarian,
      Transport: s.rincianBiaya.biayaTransport,
      Penginapan: s.rincianBiaya.biayaPenginapan,
      Total_Biaya: s.rincianBiaya.totalBiaya,
      Status: s.status,
    }));
    exportToExcel(data, 'Laporan SPPD', 'Rekapitulasi_Perjalanan_Dinas_SPPD');
  };

  const handleExportLemburExcel = () => {
    const data = lemburList.map((l) => ({
      No_Surat_Perintah: l.nomorSuratPerintah,
      Tanggal: l.tanggalLembur,
      NIP: l.nip,
      Nama_Pegawai: l.employeeName,
      Jam: `${l.jamMulai} - ${l.jamSelesai} (${l.jumlahJam} Jam)`,
      Uraian_Pekerjaan: l.uraianPekerjaan,
      Tarif_Jam: l.tarifPerJam,
      Uang_Makan: l.uangMakan,
      Total_Uang_Lembur: l.totalUangLembur,
      Status: l.status,
    }));
    exportToExcel(data, 'Laporan Lembur', 'Rekapitulasi_Pengajuan_Lembur_Pegawai');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-cyan-600" /> Biaya Operasional: SPPD & Lembur Pegawai
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan Surat Perintah Perjalanan Dinas (SPPD), tiket & hotel, serta Surat Perintah Kerja Lembur (SPKL)
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('sppd')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sppd' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Perjalanan Dinas ({sppdList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('lembur')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'lembur' ? 'bg-white text-violet-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Kerja Lembur ({lemburList.length})</span>
            </button>
          </div>

          {activeTab === 'sppd' ? (
            <div className="flex items-center gap-2 flex-wrap">
              <a
                id="btn-google-sheets-sppd-top"
                href={SPPD_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/90 hover:bg-emerald-100 px-3.5 py-2 text-xs font-bold text-emerald-700 transition-colors shadow-xs"
                title="Buka Google Spreadsheet Laporan Perjalanan Dinas (SPD)"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>Spreadsheet SPD</span>
                <ExternalLink className="h-3 w-3 text-emerald-500" />
              </a>

              <a
                id="btn-google-drive-sppd-top"
                href={SPPD_GOOGLE_DRIVE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/90 hover:bg-blue-100 px-3.5 py-2 text-xs font-bold text-blue-700 transition-colors shadow-xs"
                title="Buka Folder Google Drive Laporan Perjalanan Dinas"
              >
                <FolderOpen className="h-4 w-4 text-blue-600" />
                <span>Google Drive SPD</span>
                <ExternalLink className="h-3 w-3 text-blue-500" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setIsEditingSppd(false);
                  setSppdForm({
                    nomorSuratTugas: `ST-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
                    nomorSPPD: `SPPD-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
                    employeeId: '',
                    employeeName: '',
                    nip: '',
                    jabatan: '',
                    tingkatBiaya: 'Tingkat B',
                    maksudPerjalanan: 'Koordinasi Penyelenggaraan Sistem Informasi ASN',
                    alatAngkutan: 'Pesawat Udara',
                    kotaAsal: 'Jakarta',
                    kotaTujuan: 'Yogyakarta',
                    lamaHari: 3,
                    tanggalBerangkat: new Date().toISOString().slice(0, 10),
                    tanggalKembali: new Date().toISOString().slice(0, 10),
                    rincianBiaya: {
                      uangHarian: 1290000,
                      biayaTransport: 2500000,
                      biayaPenginapan: 1500000,
                      uangRepresentasi: 0,
                      totalBiaya: 5290000,
                    },
                    pejabatPembuatKomitmen: 'Drs. H. Mulyadi, M.Si.',
                    nipPPK: '19710815 199603 1 003',
                    status: 'Diusulkan',
                    dokumen: [],
                  });
                  setIsSppdModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Buat SPPD Baru</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a
                id="btn-google-sheets-lembur-top"
                href={LEMBUR_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/90 hover:bg-emerald-100 px-3.5 py-2 text-xs font-bold text-emerald-700 transition-colors shadow-xs"
                title="Buka Google Spreadsheet Rekap Absen & Laporan Lembur"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>Spreadsheet Lembur</span>
                <ExternalLink className="h-3 w-3 text-emerald-500" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setIsEditingLembur(false);
                  setLemburForm({
                    nomorSuratPerintah: `SPL-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
                    tanggalLembur: new Date().toISOString().slice(0, 10),
                    employeeId: '',
                    employeeName: '',
                    nip: '',
                    jamMulai: '17:30',
                    jamSelesai: '21:30',
                    jumlahJam: 4,
                    uraianPekerjaan: '',
                    tarifPerJam: 30000,
                    uangMakan: 37000,
                    totalUangLembur: 157000,
                    status: 'Diajukan',
                    dokumen: [],
                  });
                  setIsLemburModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Buat Perintah Lembur</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Google Spreadsheet Laporan Perjalanan Dinas (SPD) */}
      {activeTab === 'sppd' && (
        <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/95 via-teal-50/60 to-cyan-50/40 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Google Spreadsheet Laporan Perjalanan Dinas (SPD)
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Spreadsheet Terhubung (Tab GID: {SPPD_SPREADSHEET_GID})
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Pencatatan data Surat Tugas, pelaksana SPD, kota tujuan, rincian biaya tiket, penginapan & uang harian riil, serta rekapitulasi SP2D BKHIT.
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-emerald-700 bg-white/90 border border-emerald-200/80 rounded-lg px-2.5 py-1 w-fit max-w-full overflow-hidden text-ellipsis">
                <span className="text-slate-400">Spreadsheet ID:</span>
                <span className="truncate font-bold">{SPPD_SPREADSHEET_ID} (gid: {SPPD_SPREADSHEET_GID})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              type="button"
              id="btn-toggle-preview-sppd-sheet"
              onClick={() => setShowSppdSheetPreview(!showSppdSheetPreview)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors shadow-2xs cursor-pointer ${
                showSppdSheetPreview
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                  : 'bg-white border-emerald-200 text-slate-700 hover:bg-emerald-50'
              }`}
              title="Tampilkan / Sembunyikan Pratinjau Google Sheets SPD"
            >
              <Eye className="h-3.5 w-3.5 text-emerald-600" />
              <span>{showSppdSheetPreview ? 'Tutup Pratinjau' : 'Pratinjau Sheets'}</span>
            </button>
            <button
              type="button"
              id="btn-copy-sppd-spreadsheet"
              onClick={handleCopySppdSpreadsheet}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 transition-colors shadow-2xs cursor-pointer"
              title="Salin Link Google Spreadsheet SPD"
            >
              {copiedSppdSpreadsheet ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Salin Link</span>
                </>
              )}
            </button>
            <a
              id="btn-open-sppd-spreadsheet-banner"
              href={SPPD_SPREADSHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Buka di Google Sheets</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Pratinjau Inline Google Sheets SPD jika dibuka */}
      {activeTab === 'sppd' && showSppdSheetPreview && (
        <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="bg-emerald-50/80 px-4 py-2.5 border-b border-emerald-200 text-xs text-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold text-slate-800">Pratinjau Langsung: Google Spreadsheet Laporan SPD (gid: {SPPD_SPREADSHEET_GID})</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={SPPD_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
              >
                Buka Tab Baru <ExternalLink className="h-3 w-3" />
              </a>
              <button
                type="button"
                onClick={() => setShowSppdSheetPreview(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <iframe
            src={SPPD_SPREADSHEET_EMBED_URL}
            className="w-full h-[520px] border-0 bg-white"
            title="Google Spreadsheet Laporan Perjalanan Dinas (SPD)"
            loading="lazy"
          />
        </div>
      )}

      {/* Card Folder Google Drive Laporan Perjalanan Dinas */}
      {activeTab === 'sppd' && (
        <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-r from-blue-50/95 via-sky-50/60 to-indigo-50/40 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Folder Google Drive Laporan Perjalanan Dinas (SPD)
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200">
                  Cloud Storage Terhubung
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Penyimpanan berkas digital Surat Tugas, Tiket Pesawat/Kapal, Boarding Pass, Kwitansi Hotel & Riil, serta Laporan Hasil Kegiatan Perjalanan Dinas BKHIT.
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-blue-700 bg-white/90 border border-blue-200/80 rounded-lg px-2.5 py-1 w-fit max-w-full overflow-hidden text-ellipsis">
                <span className="text-slate-400">Link Drive:</span>
                <span className="truncate">{SPPD_GOOGLE_DRIVE_URL}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              type="button"
              id="btn-copy-drive-sppd"
              onClick={handleCopyDriveLink}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 transition-colors shadow-2xs cursor-pointer"
              title="Salin Link Google Drive"
            >
              {copiedDriveLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Salin Link</span>
                </>
              )}
            </button>
            <a
              id="btn-open-drive-sppd-banner"
              href={SPPD_GOOGLE_DRIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <FolderOpen className="h-4 w-4" />
              <span>Buka di Google Drive</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Card Google Spreadsheet Rekap Absen & Laporan Lembur */}
      {activeTab === 'lembur' && (
        <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/95 via-teal-50/60 to-violet-50/40 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Google Spreadsheet Rekap Absen & Laporan Lembur
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Spreadsheet Terhubung (ID: {LEMBUR_SPREADSHEET_ID})
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Pencatatan data surat tugas perintah lembur (SPKL), rekapitulasi jam kerja tambahan, kalkulasi tarif PMK, serta uang makan lembur ASN BKHIT.
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-emerald-700 bg-white/90 border border-emerald-200/80 rounded-lg px-2.5 py-1 w-fit max-w-full overflow-hidden text-ellipsis">
                <span className="text-slate-400">Spreadsheet ID:</span>
                <span className="truncate font-bold">{LEMBUR_SPREADSHEET_ID}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              type="button"
              id="btn-toggle-preview-lembur-sheet"
              onClick={() => setShowLemburSheetPreview(!showLemburSheetPreview)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors shadow-2xs cursor-pointer ${
                showLemburSheetPreview
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                  : 'bg-white border-emerald-200 text-slate-700 hover:bg-emerald-50'
              }`}
              title="Tampilkan / Sembunyikan Pratinjau Google Sheets"
            >
              <Eye className="h-3.5 w-3.5 text-emerald-600" />
              <span>{showLemburSheetPreview ? 'Tutup Pratinjau' : 'Pratinjau Sheets'}</span>
            </button>
            <button
              type="button"
              id="btn-copy-lembur-spreadsheet"
              onClick={handleCopyLemburSpreadsheet}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 transition-colors shadow-2xs cursor-pointer"
              title="Salin Link Google Spreadsheet"
            >
              {copiedLemburSpreadsheet ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Salin Link</span>
                </>
              )}
            </button>
            <a
              id="btn-open-lembur-spreadsheet-banner"
              href={LEMBUR_SPREADSHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Buka di Google Sheets</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Pratinjau Inline Google Sheets Lembur jika dibuka */}
      {activeTab === 'lembur' && showLemburSheetPreview && (
        <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="bg-emerald-50/80 px-4 py-2.5 border-b border-emerald-200 text-xs text-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold text-slate-800">Pratinjau Langsung: Google Spreadsheet (ID: {LEMBUR_SPREADSHEET_ID})</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={LEMBUR_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
              >
                Buka Tab Baru <ExternalLink className="h-3 w-3" />
              </a>
              <button
                type="button"
                onClick={() => setShowLemburSheetPreview(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <iframe
            src={LEMBUR_SPREADSHEET_EMBED_URL}
            className="w-full h-[520px] border-0 bg-white"
            title="Google Spreadsheet Lembur & Absen"
            loading="lazy"
          />
        </div>
      )}

      {/* SEARCH & EXPORT */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'sppd' ? "Cari nomor SPPD, kota tujuan, atau pegawai..." : "Cari surat lembur atau pegawai..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:bg-white"
          />
        </div>

        <button
          type="button"
          onClick={activeTab === 'sppd' ? handleExportSppdExcel : handleExportLemburExcel}
          className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
          <span>Ekspor Excel</span>
        </button>
      </div>

      {/* VIEW: SPPD */}
      {activeTab === 'sppd' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Daftar Surat Perjalanan Dinas (SPPD)
            </h3>
            <span className="text-xs text-slate-400">
              Dapat dicetak dalam format resmi form SPPD Kementerian Keuangan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nomor SPPD & Pegawai</th>
                  <th className="py-3 px-3">Kota Tujuan & Durasi</th>
                  <th className="py-3 px-3">Maksud Perjalanan</th>
                  <th className="py-3 px-3">Rincian Biaya</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-center">Aksi / Cetak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sppdList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-slate-900">{item.employeeName}</p>
                        <p className="text-[11px] text-cyan-700 font-mono font-semibold">{item.nomorSPPD}</p>
                        <p className="text-[10px] text-slate-400 font-mono">NIP: {item.nip}</p>
                        {item.dokumen && item.dokumen.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setViewingDocs({
                              isOpen: true,
                              title: `Berkas Lampiran SPPD: ${item.nomorSPPD || item.nomorSPD}`,
                              subtitle: `${item.employeeName} (${item.kotaAsal} -> ${item.kotaTujuan})`,
                              documents: item.dokumen || [],
                            })}
                            className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold text-[10px] border border-cyan-200 transition-colors cursor-pointer"
                            title="Lihat berkas lampiran yang diupload"
                          >
                            <Paperclip className="h-3 w-3 text-cyan-600" />
                            <span>{item.dokumen.length} File Lampiran</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                            <Paperclip className="h-3 w-3 text-slate-300" />
                            <span>0 Lampiran</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-rose-500" /> {item.kotaTujuan}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {item.lamaHari} hari ({item.tanggalBerangkat} s.d {item.tanggalKembali})
                      </p>
                    </td>
                    <td className="py-3 px-3 max-w-[200px] truncate" title={item.maksudPerjalanan}>
                      <span className="text-slate-700 font-medium">{item.maksudPerjalanan}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.alatAngkutan}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold font-mono text-cyan-800">
                        {formatRupiah(item.rincianBiaya.totalBiaya)}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Harian: {formatRupiah(item.rincianBiaya.uangHarian)}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.status === 'Lunas Dibayar Kas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'Disetujui PPK'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => exportSPPDPDF(item)}
                          className="flex items-center gap-1 p-1.5 rounded-lg text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition-colors"
                          title="Cetak Formulir Resmi SPPD (PDF)"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>PDF</span>
                        </button>
                        <a
                          href={SPPD_SPREADSHEET_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 p-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                          title="Buka Data di Google Spreadsheet SPD"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Sheet</span>
                        </a>
                        <a
                          href={SPPD_GOOGLE_DRIVE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 p-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                          title="Buka Folder Google Drive Laporan SPD"
                        >
                          <FolderOpen className="h-3.5 w-3.5 text-blue-600" />
                          <span>Drive</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingSppd(true);
                            setSppdForm({ ...item });
                            setIsSppdModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"
                          title="Edit SPPD"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Hapus berkas SPPD nomor ${item.nomorSPPD}?`)) {
                              onDeleteSPPD(item.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus"
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
      )}

      {/* VIEW: LEMBUR */}
      {activeTab === 'lembur' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Daftar Perintah & Pembayaran Lembur Pegawai
            </h3>
            <span className="text-xs text-slate-400">
              Perhitungan tarif per jam + uang makan lembur resmi PMK
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Pegawai ASN</th>
                  <th className="py-3 px-3">Tanggal & Waktu Lembur</th>
                  <th className="py-3 px-3">Uraian Pekerjaan</th>
                  <th className="py-3 px-3">Kalkulasi Uang Lembur</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {lemburList.map((lembur) => (
                  <tr key={lembur.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-slate-900">{lembur.employeeName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">NIP: {lembur.nip}</p>
                        <p className="text-[10px] text-violet-700 font-mono font-semibold">{lembur.nomorSuratPerintah}</p>
                        {lembur.dokumen && lembur.dokumen.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setViewingDocs({
                              isOpen: true,
                              title: `Berkas Lampiran Lembur: ${lembur.nomorSuratPerintah || lembur.nomorSPKL || lembur.id}`,
                              subtitle: `${lembur.employeeName} (${lembur.tanggalLembur} - ${lembur.jumlahJam} Jam)`,
                              documents: lembur.dokumen || [],
                            })}
                            className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-violet-50 hover:bg-violet-100 text-violet-800 font-bold text-[10px] border border-violet-200 transition-colors cursor-pointer"
                            title="Lihat berkas lampiran lembur yang diupload"
                          >
                            <Paperclip className="h-3 w-3 text-violet-600" />
                            <span>{lembur.dokumen.length} File Lampiran</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                            <Paperclip className="h-3 w-3 text-slate-300" />
                            <span>0 Lampiran</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800">{lembur.tanggalLembur}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {lembur.jamMulai} - {lembur.jamSelesai} ({lembur.jumlahJam} Jam)
                      </p>
                    </td>
                    <td className="py-3 px-3 max-w-[200px] truncate" title={lembur.uraianPekerjaan}>
                      <span className="text-slate-700">{lembur.uraianPekerjaan}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold font-mono text-violet-800">
                        {formatRupiah(lembur.totalUangLembur)}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Tarif: {formatRupiah(lembur.tarifPerJam)}/jam + Makan: {formatRupiah(lembur.uangMakan)}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          lembur.status === 'Telah Dibayarkan'
                            ? 'bg-emerald-100 text-emerald-800'
                            : lembur.status === 'Disetujui Atasan'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {lembur.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <a
                          href={LEMBUR_SPREADSHEET_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 p-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                          title="Buka Data di Google Spreadsheet"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Sheet</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingLembur(true);
                            setLemburForm({ ...lembur });
                            setIsLemburModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                          title="Edit Lembur"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Hapus surat perintah lembur ${lembur.nomorSuratPerintah}?`)) {
                              onDeleteLembur(lembur.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus"
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
      )}

      {/* Modal SPPD */}
      {isSppdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-8">
            <button
              onClick={() => setIsSppdModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              {isEditingSppd ? 'Edit Surat Perintah Perjalanan Dinas' : 'Buat Surat Perintah Perjalanan Dinas (SPPD)'}
            </h3>

            <form onSubmit={handleSaveSPPD} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Nomor Surat Tugas</label>
                  <input
                    type="text"
                    required
                    value={sppdForm.nomorSuratTugas || ''}
                    onChange={(e) => setSppdForm({ ...sppdForm, nomorSuratTugas: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Nomor SPPD Resmi</label>
                  <input
                    type="text"
                    required
                    value={sppdForm.nomorSPPD || ''}
                    onChange={(e) => setSppdForm({ ...sppdForm, nomorSPPD: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono text-cyan-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Pegawai Yang Diperintahkan *</label>
                <select
                  value={sppdForm.employeeId || ''}
                  onChange={(e) => handleSelectEmpForSppd(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                >
                  <option value="">-- Pilih Pegawai Pelaksana SPPD --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nama} - {emp.nip} ({emp.jabatan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Maksud Perjalanan Dinas *</label>
                <input
                  type="text"
                  required
                  placeholder="Koordinasi Penyelenggaraan Sistem Informasi Kepegawaian..."
                  value={sppdForm.maksudPerjalanan || ''}
                  onChange={(e) => setSppdForm({ ...sppdForm, maksudPerjalanan: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Kota Keberangkatan</label>
                  <input
                    type="text"
                    value={sppdForm.kotaAsal || 'Jakarta'}
                    onChange={(e) => setSppdForm({ ...sppdForm, kotaAsal: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Kota Tujuan</label>
                  <input
                    type="text"
                    value={sppdForm.kotaTujuan || ''}
                    onChange={(e) => setSppdForm({ ...sppdForm, kotaTujuan: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Moda Transportasi</label>
                  <input
                    type="text"
                    value={sppdForm.alatAngkutan || 'Pesawat Udara'}
                    onChange={(e) => setSppdForm({ ...sppdForm, alatAngkutan: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Lama (Hari)</label>
                  <input
                    type="number"
                    value={sppdForm.lamaHari || 1}
                    onChange={(e) => setSppdForm({ ...sppdForm, lamaHari: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Tanggal Berangkat</label>
                  <input
                    type="date"
                    value={sppdForm.tanggalBerangkat || ''}
                    onChange={(e) => setSppdForm({ ...sppdForm, tanggalBerangkat: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Tanggal Kembali</label>
                  <input
                    type="date"
                    value={sppdForm.tanggalKembali || ''}
                    onChange={(e) => setSppdForm({ ...sppdForm, tanggalKembali: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
              </div>

              {/* Rincian Biaya */}
              <div className="rounded-xl bg-cyan-50/50 border border-cyan-200 p-3 space-y-2">
                <h4 className="text-xs font-bold text-cyan-900">
                  Rincian Anggaran Perjalanan Dinas (SBU / PMK Standar Biaya Masukan):
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-600">Uang Harian (Rp)</label>
                    <input
                      type="number"
                      value={sppdForm.rincianBiaya?.uangHarian || 0}
                      onChange={(e) => handleUpdateSppdBiaya('uangHarian', Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-1.5 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600">Biaya Transport (Rp)</label>
                    <input
                      type="number"
                      value={sppdForm.rincianBiaya?.biayaTransport || 0}
                      onChange={(e) => handleUpdateSppdBiaya('biayaTransport', Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-1.5 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600">Penginapan/Hotel (Rp)</label>
                    <input
                      type="number"
                      value={sppdForm.rincianBiaya?.biayaPenginapan || 0}
                      onChange={(e) => handleUpdateSppdBiaya('biayaPenginapan', Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-1.5 bg-white font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 text-xs border-t border-cyan-200 font-bold">
                  <span className="text-cyan-900">Total Biaya SPPD:</span>
                  <span className="text-sm font-mono text-cyan-800">
                    {formatRupiah(sppdForm.rincianBiaya?.totalBiaya || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Status Pembayaran / Approval</label>
                <select
                  value={sppdForm.status || 'Diusulkan'}
                  onChange={(e) => setSppdForm({ ...sppdForm, status: e.target.value as any })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                >
                  <option value="Diusulkan">Diusulkan</option>
                  <option value="Disetujui PPK">Disetujui PPK</option>
                  <option value="Lunas Dibayar Kas">Lunas Dibayar Kas (Perlu 2FA)</option>
                  <option value="Selesai Dilaporkan">Selesai Dilaporkan (LPJ)</option>
                </select>
              </div>

              {/* Form Input Upload Berkas SPPD */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                <FileUploadZone
                  label="Form Input Upload Berkas Lampiran SPPD"
                  sublabel="Surat Tugas, Tiket/Boarding Pass, Kwitansi Hotel, Laporan Hasil Perjalanan (LPJ), Foto Kegiatan (Maks. 10 MB per file)"
                  categoryOptions={[
                    'Surat Tugas',
                    'Tiket / Boarding Pass',
                    'Kwitansi Hotel',
                    'Laporan Hasil Perjalanan (LPJ)',
                    'Foto Dokumentasi',
                    'Lainnya',
                  ]}
                  defaultCategory="Surat Tugas"
                  documents={sppdForm.dokumen || []}
                  onChange={(newDocs) => setSppdForm({ ...sppdForm, dokumen: newDocs })}
                />
              </div>

              {/* Tautan Google Spreadsheet Data SPD */}
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-xs text-slate-700 font-medium">
                    Google Spreadsheet Data SPD (gid: {SPPD_SPREADSHEET_GID}):
                  </span>
                </div>
                <a
                  href={SPPD_SPREADSHEET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-200 rounded-lg px-2.5 py-1.5 shrink-0 shadow-2xs w-fit cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Buka Spreadsheet</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Tautan Google Drive Dokumen Bukti & LPJ */}
              <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="text-xs text-slate-700 font-medium">
                    Folder Google Drive untuk arsip tiket, boarding pass, kwitansi & LPJ:
                  </span>
                </div>
                <a
                  href={SPPD_GOOGLE_DRIVE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 shrink-0 shadow-2xs w-fit cursor-pointer"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span>Buka Folder Drive</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSppdModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white hover:bg-cyan-700 shadow-sm"
                >
                  Simpan SPPD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lembur */}
      {isLemburModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-8">
            <button
              onClick={() => setIsLemburModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              {isEditingLembur ? 'Edit Surat Perintah Lembur' : 'Buat Perintah Kerja Lembur Pegawai'}
            </h3>

            <form onSubmit={handleSaveLembur} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Nomor Surat Perintah Lembur *</label>
                <input
                  type="text"
                  required
                  value={lemburForm.nomorSuratPerintah || ''}
                  onChange={(e) => setLemburForm({ ...lemburForm, nomorSuratPerintah: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Pilih Pegawai *</label>
                <select
                  value={lemburForm.employeeId || ''}
                  onChange={(e) => handleSelectEmpForLembur(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                >
                  <option value="">-- Pilih Pegawai --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nama} - {emp.nip}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Tanggal</label>
                  <input
                    type="date"
                    value={lemburForm.tanggalLembur || ''}
                    onChange={(e) => setLemburForm({ ...lemburForm, tanggalLembur: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Jam Mulai</label>
                  <input
                    type="time"
                    value={lemburForm.jamMulai || '17:30'}
                    onChange={(e) => setLemburForm({ ...lemburForm, jamMulai: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Jam Selesai</label>
                  <input
                    type="time"
                    value={lemburForm.jamSelesai || '21:30'}
                    onChange={(e) => setLemburForm({ ...lemburForm, jamSelesai: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Uraian Pekerjaan Lembur *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Penyelesaian rekonsiliasi data dan audit..."
                  value={lemburForm.uraianPekerjaan || ''}
                  onChange={(e) => setLemburForm({ ...lemburForm, uraianPekerjaan: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Jumlah Jam</label>
                  <input
                    type="number"
                    value={lemburForm.jumlahJam || 3}
                    onChange={(e) => setLemburForm({ ...lemburForm, jumlahJam: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Tarif / Jam (Rp)</label>
                  <input
                    type="number"
                    value={lemburForm.tarifPerJam || 30000}
                    onChange={(e) => setLemburForm({ ...lemburForm, tarifPerJam: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Uang Makan (Rp)</label>
                  <input
                    type="number"
                    value={lemburForm.uangMakan || 37000}
                    onChange={(e) => setLemburForm({ ...lemburForm, uangMakan: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Status Persetujuan</label>
                <select
                  value={lemburForm.status || 'Diajukan'}
                  onChange={(e) => setLemburForm({ ...lemburForm, status: e.target.value as any })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                >
                  <option value="Diajukan">Diajukan Pegawai</option>
                  <option value="Disetujui Atasan">Disetujui Atasan</option>
                  <option value="Telah Dibayarkan">Telah Dibayarkan</option>
                </select>
              </div>

              {/* Form Input Upload Berkas Lembur */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                <FileUploadZone
                  label="Form Input Upload Berkas Lampiran Lembur"
                  sublabel="Surat Perintah Kerja Lembur (SPKL), Presensi / Kehadiran, Foto Dokumentasi Lembur, Laporan Output Kerja"
                  categoryOptions={[
                    'Surat Perintah Kerja Lembur (SPKL)',
                    'Daftar Hadir / Presensi',
                    'Foto Dokumentasi Lembur',
                    'Laporan Hasil Pekerjaan',
                    'Lainnya',
                  ]}
                  defaultCategory="Surat Perintah Kerja Lembur (SPKL)"
                  documents={lemburForm.dokumen || []}
                  onChange={(newDocs) => setLemburForm({ ...lemburForm, dokumen: newDocs })}
                />
              </div>

              {/* Tautan Google Spreadsheet Rekap Absen & Lembur */}
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-xs text-slate-700 font-medium">
                    Google Spreadsheet Rekap Absen & Lembur (ID: {LEMBUR_SPREADSHEET_ID}):
                  </span>
                </div>
                <a
                  href={LEMBUR_SPREADSHEET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-200 rounded-lg px-2.5 py-1.5 shrink-0 shadow-2xs w-fit cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Buka Spreadsheet</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLemburModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white hover:bg-violet-700 shadow-sm"
                >
                  Simpan Lembur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal for inspecting & downloading attachments */}
      <DocumentViewerModal
        isOpen={viewingDocs.isOpen}
        onClose={() => setViewingDocs({ ...viewingDocs, isOpen: false })}
        title={viewingDocs.title}
        subtitle={viewingDocs.subtitle}
        documents={viewingDocs.documents}
      />
    </div>
  );
};
