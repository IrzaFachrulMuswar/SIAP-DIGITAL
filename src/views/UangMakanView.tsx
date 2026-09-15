import React, { useState, useMemo } from 'react';
import { 
  UtensilsCrossed, 
  FileSpreadsheet, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Printer, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Eye, 
  X, 
  Calendar,
  Paperclip,
  CheckCircle2,
  Clock,
  FileCheck
} from 'lucide-react';
import { UangMakanRecord, StatusUangMakan, Employee, LampiranDokumen } from '../types';
import { formatRupiah, exportUangMakanPDF, exportToExcel } from '../utils/exportUtils';
import { FileUploadZone } from '../components/FileUploadZone';
import { DocumentViewerModal } from '../components/DocumentViewerModal';

// Google Spreadsheet Uang Makan ID: 1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M (gid: 84631505)
export const UANG_MAKAN_SPREADSHEET_ID = '1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M';
export const UANG_MAKAN_SPREADSHEET_GID = '84631505';
export const UANG_MAKAN_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${UANG_MAKAN_SPREADSHEET_ID}/edit?gid=${UANG_MAKAN_SPREADSHEET_GID}#gid=${UANG_MAKAN_SPREADSHEET_GID}`;
export const UANG_MAKAN_SPREADSHEET_EMBED_URL = `https://docs.google.com/spreadsheets/d/${UANG_MAKAN_SPREADSHEET_ID}/htmlembed?gid=${UANG_MAKAN_SPREADSHEET_GID}&widget=true&headers=false`;

interface UangMakanViewProps {
  records: UangMakanRecord[];
  employees?: Employee[];
  onAddRecord: (record: UangMakanRecord) => void;
  onUpdateRecord: (record: UangMakanRecord) => void;
  onDeleteRecord: (id: string) => void;
  onRequest2FA: (title: string, callback: () => void) => void;
}

export const UangMakanView: React.FC<UangMakanViewProps> = ({
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onRequest2FA,
}) => {
  const [search, setSearch] = useState('');
  const [filterTahun, setFilterTahun] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [copiedSpreadsheet, setCopiedSpreadsheet] = useState(false);
  const [showSheetPreview, setShowSheetPreview] = useState(false);

  // Modal State for Monthly Recap
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UangMakanRecord>>({
    bulan: 'Oktober 2026',
    tahun: 2026,
    jumlahPegawai: 25,
    totalHariHadir: 520,
    totalBruto: 19410000,
    totalPph21: 1182500,
    totalNetto: 18227500,
    bankPenyalur: 'Bank Mandiri (Rekening Giro Satker 690558)',
    nomorRekeningPengeluaran: '102-00-202611-8',
    status: 'Diusulkan',
    dokumenLampiran: [],
    catatan: '',
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

  const handleCopySpreadsheet = () => {
    navigator.clipboard.writeText(UANG_MAKAN_SPREADSHEET_URL);
    setCopiedSpreadsheet(true);
    setTimeout(() => setCopiedSpreadsheet(false), 2500);
  };

  // Group / normalize records to ensure monthly summaries (no employee breakdown)
  const monthlyRecaps = useMemo(() => {
    // If records are already monthly recaps (indicated by absence of multiple identical bulan or presence of totalBruto/jumlahPegawai)
    const mapByMonth = new Map<string, UangMakanRecord>();

    records.forEach((r) => {
      const key = r.bulan;
      if (!mapByMonth.has(key)) {
        mapByMonth.set(key, {
          id: r.id,
          bulan: r.bulan,
          tahun: r.tahun || 2026,
          jumlahPegawai: r.jumlahPegawai || 25,
          totalHariHadir: r.totalHariHadir || r.jumlahHariHadir || 0,
          totalBruto: r.totalBruto || r.jumlahKotor || 0,
          totalPph21: r.totalPph21 || r.potonganPph21 || 0,
          totalNetto: r.totalNetto || r.jumlahBersih || 0,
          bankPenyalur: r.bankPenyalur || r.bank || 'Bank Mandiri (Rekening Giro Satker 690558)',
          nomorRekeningPengeluaran: r.nomorRekeningPengeluaran || r.nomorRekening || '102-00-202611-8',
          status: r.status,
          nomorSP2DRef: r.nomorSP2DRef,
          nomorSPMRef: r.nomorSPMRef,
          tanggalPencairan: r.tanggalPencairan,
          catatan: r.catatan,
          dokumenLampiran: r.dokumenLampiran || [],
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        });
      } else {
        // If multiple records exist for the same month (from legacy individual records), aggregate them!
        const existing = mapByMonth.get(key)!;
        existing.jumlahPegawai = (existing.jumlahPegawai || 0) + 1;
        existing.totalHariHadir = (existing.totalHariHadir || 0) + (r.jumlahHariHadir || 0);
        existing.totalBruto = (existing.totalBruto || 0) + (r.jumlahKotor || 0);
        existing.totalPph21 = (existing.totalPph21 || 0) + (r.potonganPph21 || 0);
        existing.totalNetto = (existing.totalNetto || 0) + (r.jumlahBersih || 0);
        if (r.nomorSP2DRef && !existing.nomorSP2DRef) {
          existing.nomorSP2DRef = r.nomorSP2DRef;
        }
        if (r.dokumenLampiran && r.dokumenLampiran.length > 0) {
          const currentDocs = existing.dokumenLampiran || [];
          const newDocs = r.dokumenLampiran.filter(
            (nd) => !currentDocs.some((cd) => cd.nama === nd.nama)
          );
          existing.dokumenLampiran = [...currentDocs, ...newDocs];
        }
      }
    });

    return Array.from(mapByMonth.values());
  }, [records]);

  // Unique years for filtering
  const availableYears = useMemo(() => {
    const list = Array.from(new Set(monthlyRecaps.map((r) => Number(r.tahun) || 2026))).sort((a: number, b: number) => b - a);
    return list.length > 0 ? list : [2026];
  }, [monthlyRecaps]);

  // Filtered monthly records
  const filteredRecaps = useMemo(() => {
    return monthlyRecaps.filter((r) => {
      const matchSearch =
        search === '' ||
        r.bulan.toLowerCase().includes(search.toLowerCase()) ||
        String(r.tahun).includes(search) ||
        (r.nomorSP2DRef && r.nomorSP2DRef.toLowerCase().includes(search.toLowerCase())) ||
        (r.nomorSPMRef && r.nomorSPMRef.toLowerCase().includes(search.toLowerCase())) ||
        r.bankPenyalur.toLowerCase().includes(search.toLowerCase());

      const matchTahun = filterTahun === 'ALL' || String(r.tahun) === filterTahun;
      const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;

      return matchSearch && matchTahun && matchStatus;
    });
  }, [monthlyRecaps, search, filterTahun, filterStatus]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const totalBulan = filteredRecaps.length;
    const totalPegawaiRata = totalBulan > 0 
      ? Math.round(filteredRecaps.reduce((acc, curr) => acc + (curr.jumlahPegawai || 25), 0) / totalBulan) 
      : 25;
    const totalHari = filteredRecaps.reduce((acc, curr) => acc + (curr.totalHariHadir || 0), 0);
    const totalBruto = filteredRecaps.reduce((acc, curr) => acc + (curr.totalBruto || 0), 0);
    const totalPph = filteredRecaps.reduce((acc, curr) => acc + (curr.totalPph21 || 0), 0);
    const totalNetto = filteredRecaps.reduce((acc, curr) => acc + (curr.totalNetto || 0), 0);
    const cairCount = filteredRecaps.filter((r) => r.status === 'SP2D Terbit / Cair').length;

    return { totalBulan, totalPegawaiRata, totalHari, totalBruto, totalPph, totalNetto, cairCount };
  }, [filteredRecaps]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      bulan: 'Oktober 2026',
      tahun: 2026,
      jumlahPegawai: 25,
      totalHariHadir: 518,
      totalBruto: 19250000,
      totalPph21: 1162500,
      totalNetto: 18087500,
      bankPenyalur: 'Bank Mandiri (Rekening Giro Satker 690558)',
      nomorRekeningPengeluaran: '102-00-202611-8',
      status: 'Diusulkan',
      nomorSP2DRef: '',
      nomorSPMRef: '',
      tanggalPencairan: '',
      dokumenLampiran: [],
      catatan: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: UangMakanRecord) => {
    setIsEditing(true);
    setFormData({
      ...item,
      dokumenLampiran: item.dokumenLampiran || [],
    });
    setIsModalOpen(true);
  };

  const handleBrutoChange = (bruto: number) => {
    // Estimasi rata-rata PPh 21 uang makan ASN (~6%)
    const pph = Math.round(bruto * 0.06);
    const netto = bruto - pph;
    setFormData((prev) => ({
      ...prev,
      totalBruto: bruto,
      totalPph21: pph,
      totalNetto: netto,
    }));
  };

  const handlePphChange = (pph: number) => {
    const bruto = formData.totalBruto || 0;
    const netto = Math.max(0, bruto - pph);
    setFormData((prev) => ({
      ...prev,
      totalPph21: pph,
      totalNetto: netto,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bulan) return;

    if (isEditing && formData.id) {
      onUpdateRecord(formData as UangMakanRecord);
    } else {
      const newRecord: UangMakanRecord = {
        ...(formData as UangMakanRecord),
        id: `UM-BLN-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onAddRecord(newRecord);
    }
    setIsModalOpen(false);
  };

  const handleExportExcel = () => {
    const data = filteredRecaps.map((r, idx) => ({
      No: idx + 1,
      Periode_Bulan: r.bulan,
      Tahun_Anggaran: r.tahun,
      Jumlah_Pegawai_ASN: r.jumlahPegawai || 25,
      Total_Hari_Hadir: r.totalHariHadir || 0,
      Total_Uang_Makan_Bruto: r.totalBruto || 0,
      Potongan_PPh_21: r.totalPph21 || 0,
      Jumlah_Netto_Bersih: r.totalNetto || 0,
      Bank_Penyalur: r.bankPenyalur || 'Bank Mandiri',
      Nomor_Rekening: r.nomorRekeningPengeluaran || '102-00-202611-8',
      Status_Pembayaran: r.status,
      Nomor_SP2D: r.nomorSP2DRef || '-',
      Nomor_SPM: r.nomorSPMRef || '-',
      Tanggal_Pencairan: r.tanggalPencairan || '-',
      Catatan_Keterangan: r.catatan || '',
    }));
    exportToExcel(data, 'Rekapitulasi Bulanan Uang Makan', `Rekap_Bulanan_Uang_Makan_${new Date().getFullYear()}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-600 text-white rounded-xl shadow-xs">
              <UtensilsCrossed className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Rekapitulasi Uang Makan Pegawai ASN
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Rekapan pembayaran uang makan per bulan, tarif SBM PMK Kemenkeu RI, potongan PPh 21, dan realisasi SP2D kas negara
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            id="btn-google-sheets-uang-makan-top"
            href={UANG_MAKAN_SPREADSHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/90 hover:bg-emerald-100 px-3.5 py-2 text-xs font-bold text-emerald-700 transition-colors shadow-xs cursor-pointer"
            title="Buka Google Spreadsheet Rekapitulasi Uang Makan"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Spreadsheet Uang Makan</span>
            <ExternalLink className="h-3 w-3 text-emerald-500" />
          </a>

          <button
            type="button"
            onClick={() => exportUangMakanPDF(filteredRecaps, 'Rekapitulasi Bulanan TA 2026')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors shadow-xs cursor-pointer"
            title="Cetak Laporan Rekapitulasi Bulanan Uang Makan Resmi (PDF)"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            <span>Cetak PDF Rekapan</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors shadow-xs cursor-pointer"
            title="Ekspor Rekap Bulanan ke Format Excel XLSX"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Input Rekap Bulanan</span>
          </button>
        </div>
      </div>

      {/* Card Google Spreadsheet Rekapitulasi Uang Makan */}
      <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/95 via-teal-50/60 to-amber-50/40 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Google Spreadsheet Rekapitulasi Uang Makan Pegawai
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Spreadsheet Terhubung (Tab GID: {UANG_MAKAN_SPREADSHEET_GID})
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Daftar rekapan per bulan pembayaran uang makan ASN Balai Karantina Papua Tengah berdasarkan presensi biometrik, PMK SBM Kemenkeu, potongan PPh 21, dan nomor SP2D kas negara.
            </p>
            <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-emerald-700 bg-white/90 border border-emerald-200/80 rounded-lg px-2.5 py-1 w-fit max-w-full overflow-hidden text-ellipsis">
              <span className="text-slate-400">Spreadsheet ID:</span>
              <span className="truncate font-bold">{UANG_MAKAN_SPREADSHEET_ID} (gid: {UANG_MAKAN_SPREADSHEET_GID})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            type="button"
            id="btn-toggle-preview-uang-makan-sheet"
            onClick={() => setShowSheetPreview(!showSheetPreview)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors shadow-2xs cursor-pointer ${
              showSheetPreview
                ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                : 'bg-white border-emerald-200 text-slate-700 hover:bg-emerald-50'
            }`}
            title="Tampilkan / Sembunyikan Pratinjau Google Sheets Uang Makan"
          >
            <Eye className="h-3.5 w-3.5 text-emerald-600" />
            <span>{showSheetPreview ? 'Tutup Pratinjau' : 'Pratinjau Sheets'}</span>
          </button>
          <button
            type="button"
            id="btn-copy-uang-makan-spreadsheet"
            onClick={handleCopySpreadsheet}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 transition-colors shadow-2xs cursor-pointer"
            title="Salin Link Google Spreadsheet"
          >
            {copiedSpreadsheet ? (
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
            id="btn-open-uang-makan-spreadsheet-banner"
            href={UANG_MAKAN_SPREADSHEET_URL}
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

      {/* Pratinjau Inline Google Sheets Uang Makan jika dibuka */}
      {showSheetPreview && (
        <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="bg-emerald-50/80 px-4 py-2.5 border-b border-emerald-200 text-xs text-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold text-slate-800">Pratinjau Langsung: Google Spreadsheet Uang Makan (gid: {UANG_MAKAN_SPREADSHEET_GID})</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={UANG_MAKAN_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
              >
                Buka Tab Baru <ExternalLink className="h-3 w-3" />
              </a>
              <button
                type="button"
                onClick={() => setShowSheetPreview(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <iframe
            src={UANG_MAKAN_SPREADSHEET_EMBED_URL}
            className="w-full h-[520px] border-0 bg-white"
            title="Google Spreadsheet Uang Makan"
            loading="lazy"
          />
        </div>
      )}

      {/* Overview Metric Stats Per Bulan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Periode Rekapitulasi
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{stats.totalBulan} Bulan</span>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
              TA 2026
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Rata-rata {stats.totalPegawaiRata} ASN / bulan</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Akumulasi Hari Hadir
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-700">{stats.totalHari.toLocaleString('id-ID')}</span>
            <span className="text-xs text-slate-500">Hari Kerja</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Rekapan biometrik kehadiran</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Realisasi Bruto
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-black text-slate-800">{formatRupiah(stats.totalBruto)}</span>
            <span className="text-xs text-slate-400">Sebelum Pajak</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Standar SBM Kemenkeu RI</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Potongan PPh 21
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-black text-rose-600">{formatRupiah(stats.totalPph)}</span>
            <span className="text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-semibold">
              Kas Negara
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Pajak penghasilan final</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            Total Bersih (Netto)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-black text-emerald-700">{formatRupiah(stats.totalNetto)}</span>
            <span className="text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">
              {stats.cairCount} Lunas Cair
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">Tersalurkan ke rekening pegawai</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari bulan, tahun, no. SP2D/SPM, bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Filter Tahun */}
          <select
            value={filterTahun}
            onChange={(e) => setFilterTahun(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Semua Tahun Anggaran</option>
            {availableYears.map((th) => (
              <option key={th} value={String(th)}>
                Tahun Anggaran {th}
              </option>
            ))}
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Semua Status Pembayaran</option>
            <option value="SP2D Terbit / Cair">SP2D Terbit / Cair</option>
            <option value="SPM Terbit">SPM Terbit</option>
            <option value="Diverifikasi Bendahara">Diverifikasi Bendahara</option>
            <option value="Diusulkan">Diusulkan</option>
          </select>
        </div>
      </div>

      {/* Main Monthly Recap Table (Only Monthly Records, No Individual Names) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-600">
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3">Periode Rekapitulasi</th>
                <th className="py-3 px-3 text-center">Jumlah ASN</th>
                <th className="py-3 px-3 text-center">Total Kehadiran</th>
                <th className="py-3 px-3 text-right">Realisasi Bruto</th>
                <th className="py-3 px-3 text-right">Potongan PPh 21</th>
                <th className="py-3 px-3 text-right font-bold text-emerald-800">Jumlah Netto</th>
                <th className="py-3 px-3">Bank Penyalur & Rekening</th>
                <th className="py-3 px-3 text-center">Status & SP2D</th>
                <th className="py-3 px-3 text-center">Berkas Lampiran</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecaps.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Tidak ada rekapan bulanan uang makan yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredRecaps.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-center font-medium text-slate-500">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                          <Calendar className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{item.bulan}</div>
                          <div className="text-[10px] text-slate-500">Tahun Anggaran {item.tahun}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">
                        {item.jumlahPegawai || 25} Pegawai
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-indigo-700">
                      {item.totalHariHadir || 0} Hari
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-800">
                      {formatRupiah(item.totalBruto || 0)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-600">
                      {formatRupiah(item.totalPph21 || 0)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/40">
                      {formatRupiah(item.totalNetto || 0)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-700">{item.bankPenyalur || 'Bank Mandiri'}</div>
                      <div className="text-[10px] font-mono text-slate-500">{item.nomorRekeningPengeluaran || '102-00-202611-8'}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'SP2D Terbit / Cair'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : item.status === 'SPM Terbit'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : item.status === 'Diverifikasi Bendahara'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {item.status === 'SP2D Terbit / Cair' ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        ) : item.status === 'SPM Terbit' ? (
                          <FileCheck className="h-3 w-3 text-blue-600" />
                        ) : (
                          <Clock className="h-3 w-3 text-amber-600" />
                        )}
                        <span>{item.status}</span>
                      </span>
                      {item.nomorSP2DRef && (
                        <div className="text-[9px] font-mono text-emerald-700 font-bold mt-0.5">
                          SP2D: {item.nomorSP2DRef}
                        </div>
                      )}
                      {item.nomorSPMRef && !item.nomorSP2DRef && (
                        <div className="text-[9px] font-mono text-blue-700 font-semibold mt-0.5">
                          SPM: {item.nomorSPMRef}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.dokumenLampiran && item.dokumenLampiran.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setViewingDocs({
                            isOpen: true,
                            title: `Berkas Lampiran Rekapitulasi: ${item.bulan}`,
                            subtitle: `Realisasi Uang Makan: ${formatRupiah(item.totalNetto || 0)} (${item.jumlahPegawai || 25} ASN, ${item.totalHariHadir || 0} Hari Hadir)`,
                            documents: item.dokumenLampiran || [],
                          })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200 transition-colors cursor-pointer shadow-2xs"
                          title="Lihat berkas lampiran rekapitulasi uang makan yang diupload"
                        >
                          <Paperclip className="h-3.5 w-3.5 text-amber-600" />
                          <span>{item.dokumenLampiran.length} Lampiran</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Paperclip className="h-3.5 w-3.5 text-slate-300" />
                          <span>0 Berkas</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <a
                          href={UANG_MAKAN_SPREADSHEET_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 p-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                          title="Buka Data di Google Spreadsheet Uang Makan"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Sheet</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => exportUangMakanPDF([item], item.bulan)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Cetak PDF Rekapitulasi Bulan Ini"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit Data Rekapitulasi Bulanan"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onRequest2FA(`Hapus Rekapitulasi Uang Makan: ${item.bulan}`, () => {
                              onDeleteRecord(item.id);
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Rekapan (Memerlukan 2FA)"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input / Edit Rekapitulasi Bulanan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-600 text-white rounded-xl">
                  <UtensilsCrossed className="h-5 w-5" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {isEditing ? 'Edit Rekapitulasi Bulanan Uang Makan' : 'Input Rekapitulasi Bulanan Uang Makan'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Periode Bulan & Tahun</label>
                  <input
                    type="text"
                    required
                    value={formData.bulan || ''}
                    onChange={(e) => setFormData({ ...formData, bulan: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold"
                    placeholder="Contoh: Oktober 2026"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Tahun Anggaran</label>
                  <input
                    type="number"
                    value={formData.tahun || 2026}
                    onChange={(e) => setFormData({ ...formData, tahun: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
                    placeholder="2026"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Jumlah Pegawai ASN Penerima</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.jumlahPegawai || 25}
                    onChange={(e) => setFormData({ ...formData, jumlahPegawai: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono font-bold"
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Total Akumulasi Hari Hadir (Biometrik)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.totalHariHadir || 0}
                    onChange={(e) => setFormData({ ...formData, totalHariHadir: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono font-bold text-indigo-700"
                    placeholder="520"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Total Realisasi Bruto (Rp)</label>
                  <input
                    type="number"
                    value={formData.totalBruto || 0}
                    onChange={(e) => handleBrutoChange(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono font-bold"
                    placeholder="19410000"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Potongan Pajak PPh 21 (Rp)</label>
                  <input
                    type="number"
                    value={formData.totalPph21 || 0}
                    onChange={(e) => handlePphChange(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono text-rose-600 font-bold"
                    placeholder="1182500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Jumlah Bersih Netto (Rp)</label>
                  <input
                    type="number"
                    value={formData.totalNetto || 0}
                    onChange={(e) => setFormData({ ...formData, totalNetto: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-emerald-200 bg-emerald-50/50 p-2 text-xs font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              {/* Rincian Finansial Card */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Total Uang Makan Bruto:</span>
                  <span className="font-mono font-bold text-slate-900">{formatRupiah(formData.totalBruto || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Potongan Pajak PPh 21:</span>
                  <span className="font-mono font-bold text-rose-600">-{formatRupiah(formData.totalPph21 || 0)}</span>
                </div>
                <div className="border-t border-amber-200 pt-1.5 flex justify-between items-center text-xs font-bold">
                  <span className="text-emerald-900">Total Uang Makan Bersih (Netto):</span>
                  <span className="font-mono text-sm text-emerald-700">{formatRupiah(formData.totalNetto || 0)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Bank Penyalur & Rekening Operasional</label>
                  <input
                    type="text"
                    value={formData.bankPenyalur || ''}
                    onChange={(e) => setFormData({ ...formData, bankPenyalur: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                    placeholder="Bank Mandiri (Rekening Giro Satker 690558)"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Nomor Rekening Pengeluaran</label>
                  <input
                    type="text"
                    value={formData.nomorRekeningPengeluaran || ''}
                    onChange={(e) => setFormData({ ...formData, nomorRekeningPengeluaran: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                    placeholder="102-00-202611-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Status Pembayaran</label>
                  <select
                    value={formData.status || 'Diusulkan'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusUangMakan })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs bg-white"
                  >
                    <option value="Diusulkan">Diusulkan</option>
                    <option value="Diverifikasi Bendahara">Diverifikasi Bendahara</option>
                    <option value="SPM Terbit">SPM Terbit</option>
                    <option value="SP2D Terbit / Cair">SP2D Terbit / Cair</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Nomor Referensi SP2D / SPM</label>
                  <input
                    type="text"
                    value={formData.nomorSP2DRef || ''}
                    onChange={(e) => setFormData({ ...formData, nomorSP2DRef: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                    placeholder="260120100049312"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Tanggal Pencairan Kas</label>
                  <input
                    type="date"
                    value={formData.tanggalPencairan || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalPencairan: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="text-xs font-bold text-slate-700">Catatan / Keterangan Rekapitulasi</label>
                <textarea
                  rows={2}
                  value={formData.catatan || ''}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                  placeholder="Keterangan pengajuan, dasar presensi, atau rincian pencairan..."
                />
              </div>

              {/* Form Input Upload Berkas Uang Makan */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                <FileUploadZone
                  label="Form Input Upload Berkas Lampiran Rekapitulasi Uang Makan"
                  sublabel="Rekap Presensi / Kehadiran Biometrik, Daftar Nominatif Pembayaran, SPTJB, Bukti Potong PPh 21, Salinan SP2D / Bukti Salur Bank"
                  categoryOptions={[
                    'Rekap Presensi / Kehadiran',
                    'Daftar Nominatif Pembayaran',
                    'Surat Pernyataan Tanggung Jawab Belanja (SPTJB)',
                    'Bukti Potong PPh 21',
                    'Salinan SP2D / Bukti Salur',
                    'Lainnya',
                  ]}
                  defaultCategory="Rekap Presensi / Kehadiran"
                  documents={formData.dokumenLampiran || []}
                  onChange={(newDocs) => setFormData({ ...formData, dokumenLampiran: newDocs })}
                />
              </div>

              {/* Tautan Google Spreadsheet Uang Makan */}
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-xs text-slate-700 font-medium">
                    Google Spreadsheet Rekap Uang Makan (gid: {UANG_MAKAN_SPREADSHEET_GID}):
                  </span>
                </div>
                <a
                  href={UANG_MAKAN_SPREADSHEET_URL}
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
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 px-5 py-2 text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  {isEditing ? 'Simpan Perubahan' : 'Tambahkan ke Rekapitulasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
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
