import React, { useState, useMemo } from 'react';
import { 
  CalendarCheck, 
  Upload, 
  Trash2, 
  Edit3, 
  Download, 
  FileSpreadsheet, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Copy,
  Search,
  Check,
  Eye,
  Building,
  UserCheck,
  UserX,
  FileCheck,
  Printer,
  Sparkles,
  Layers,
  ArrowDownToLine
} from 'lucide-react';
import { MonthlyAttendance } from '../types';
import { exportToExcel, exportAbsensiSpreadsheetPDF, exportSimpegMonthlyAttendancesPDF } from '../utils/exportUtils';
import {
  ABSENSI_SPREADSHEET_ID,
  ABSENSI_SPREADSHEET_URL,
  ABSENSI_SPREADSHEET_EMBED_URL,
  AbsensiSpreadsheetPegawaiRecord,
  initialAbsensiSpreadsheetData,
  getSatkerSummaries,
  generateMonthlyAttendanceFromSpreadsheet,
  generateAllMonthlyAttendancesFromSpreadsheet,
  fetchLiveAbsensiSpreadsheet,
  ABSENSI_PERIODS
} from '../data/absensiSpreadsheetData';

interface AbsensiViewProps {
  attendances: MonthlyAttendance[];
  onAddAttendance: (item: MonthlyAttendance) => void;
  onUpdateAttendance: (item: MonthlyAttendance) => void;
  onDeleteAttendance: (id: string) => void;
}

export const AbsensiView: React.FC<AbsensiViewProps> = ({
  attendances,
  onAddAttendance,
  onUpdateAttendance,
  onDeleteAttendance,
}) => {
  // Navigation Sub-tab
  const [activeTab, setActiveTab] = useState<'spreadsheet_presensi' | 'rekap_simpeg' | 'embed_sheets'>('spreadsheet_presensi');

  // Spreadsheet Data & Sync State
  const [spreadsheetRecords, setSpreadsheetRecords] = useState<AbsensiSpreadsheetPegawaiRecord[]>(() => {
    try {
      const saved = localStorage.getItem('absensi_spreadsheet_cache_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= initialAbsensiSpreadsheetData.length) return parsed;
      }
    } catch {
      // fallback
    }
    return initialAbsensiSpreadsheetData;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(() => {
    return localStorage.getItem('absensi_sync_message') || 'Terhubung dengan Google Spreadsheet ID: 16q5aZkFJzZ5RNpGOxLTR28AntgGIsc9ecQ9XYRlCDJY';
  });
  const [copiedId, setCopiedId] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters for Spreadsheet Tab
  const [filterBulan, setFilterBulan] = useState<string>('Agustus 2026');
  const [search, setSearch] = useState('');
  const [filterSatker, setFilterSatker] = useState('ALL');
  const [filterKepatuhan, setFilterKepatuhan] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState<AbsensiSpreadsheetPegawaiRecord | null>(null);

  // Filters for Tab 2: Rekap Bulanan SIMPEG
  const [simpegFilterTahun, setSimpegFilterTahun] = useState<'ALL' | '2026' | '2025'>('ALL');
  const [simpegSearch, setSimpegSearch] = useState('');

  // Local Modal Upload / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<Partial<MonthlyAttendance>>({
    bulan: 8,
    tahun: 2026,
    namaBulan: 'Agustus 2026',
    totalHariKerja: 20,
    totalPegawai: 63,
    rekapHadir: 1228,
    rekapSakit: 7,
    rekapIzin: 6,
    rekapCuti: 18,
    rekapDinasLuar: 31,
    rekapTanpaKeterangan: 1,
    persentaseKehadiran: 98.2,
    catatan: 'Rekapitulasi terintegrasi Google Spreadsheet ID: 16q5aZkFJzZ5RNpGOxLTR28AntgGIsc9ecQ9XYRlCDJY',
  });

  // Unique Satker List
  const satkerOptions = useMemo(() => {
    const list = Array.from(new Set(spreadsheetRecords.map((r) => r.satuanPelayanan || 'UPT INDUK'))).filter(Boolean);
    return ['ALL', ...list.sort()];
  }, [spreadsheetRecords]);

  // Records for selected month
  const recordsForMonth = useMemo(() => {
    if (filterBulan === 'ALL') return spreadsheetRecords;
    return spreadsheetRecords.filter((r) => r.periode === filterBulan || r.bulan === Number(filterBulan));
  }, [spreadsheetRecords, filterBulan]);

  // Filtered Spreadsheet Records
  const filteredRecords = useMemo(() => {
    return recordsForMonth.filter((r) => {
      const matchSearch = 
        !search.trim() ||
        r.nama.toLowerCase().includes(search.toLowerCase()) ||
        r.nip.toLowerCase().includes(search.toLowerCase()) ||
        r.jabatan.toLowerCase().includes(search.toLowerCase()) ||
        (r.satuanPelayanan && r.satuanPelayanan.toLowerCase().includes(search.toLowerCase()));

      const matchSatker = filterSatker === 'ALL' || r.satuanPelayanan === filterSatker;
      const matchKepatuhan = filterKepatuhan === 'ALL' || r.statusKepatuhan === filterKepatuhan;

      return matchSearch && matchSatker && matchKepatuhan;
    });
  }, [recordsForMonth, search, filterSatker, filterKepatuhan]);

  // Statistics for the chosen month
  const stats = useMemo(() => {
    const total = recordsForMonth.length || 1;
    const avgKehadiran = (recordsForMonth.reduce((acc, r) => acc + r.persentaseKehadiran, 0) / total).toFixed(1);
    const totalHadir = recordsForMonth.reduce((acc, r) => acc + r.hadir, 0);
    const totalSakit = recordsForMonth.reduce((acc, r) => acc + r.sakit, 0);
    const totalIzin = recordsForMonth.reduce((acc, r) => acc + r.izin, 0);
    const totalCuti = recordsForMonth.reduce((acc, r) => acc + r.cuti, 0);
    const totalDL = recordsForMonth.reduce((acc, r) => acc + r.dinasLuar, 0);
    const totalAlpa = recordsForMonth.reduce((acc, r) => acc + r.tanpaKeterangan, 0);
    const totalJam = recordsForMonth.reduce((acc, r) => acc + r.jamKerjaKumulatif, 0).toFixed(0);
    const sangatBaikCount = recordsForMonth.filter((r) => r.statusKepatuhan === 'Sangat Baik').length;
    const totalPegawai = new Set(recordsForMonth.map((r) => r.nip)).size || recordsForMonth.length;

    return {
      avgKehadiran,
      totalHadir,
      totalSakit,
      totalIzin,
      totalCuti,
      totalDL,
      totalAlpa,
      totalJam,
      sangatBaikCount,
      totalPegawai,
    };
  }, [recordsForMonth]);

  const satkerSummaries = useMemo(() => {
    return getSatkerSummaries(filteredRecords);
  }, [filteredRecords]);

  // Executive YTD 2026 Summary for Tab 2
  const ytd2026Summary = useMemo(() => {
    const months2026 = attendances.filter((a) => a.tahun === 2026);
    const totalMonths = months2026.length;
    const totalHariKerja = months2026.reduce((acc, a) => acc + a.totalHariKerja, 0);
    const avgKehadiran = totalMonths > 0
      ? (months2026.reduce((acc, a) => acc + a.persentaseKehadiran, 0) / totalMonths).toFixed(1)
      : '0';
    const totalHadir = months2026.reduce((acc, a) => acc + a.rekapHadir, 0);
    const totalDL = months2026.reduce((acc, a) => acc + a.rekapDinasLuar, 0);
    const totalCuti = months2026.reduce((acc, a) => acc + a.rekapCuti, 0);
    const totalSakit = months2026.reduce((acc, a) => acc + a.rekapSakit, 0);
    const totalIzin = months2026.reduce((acc, a) => acc + a.rekapIzin, 0);
    const totalAlpa = months2026.reduce((acc, a) => acc + a.rekapTanpaKeterangan, 0);

    return {
      totalMonths,
      totalHariKerja,
      avgKehadiran,
      totalHadir,
      totalDL,
      totalCuti,
      totalSakit,
      totalIzin,
      totalAlpa,
      months2026: [...months2026].sort((a, b) => a.bulan - b.bulan),
    };
  }, [attendances]);

  // Filtered attendances for Tab 2
  const filteredAttendances = useMemo(() => {
    return attendances.filter((att) => {
      const matchYear = simpegFilterTahun === 'ALL' || String(att.tahun) === simpegFilterTahun;
      const matchSearch =
        !simpegSearch.trim() ||
        att.namaBulan.toLowerCase().includes(simpegSearch.toLowerCase()) ||
        (att.catatan && att.catatan.toLowerCase().includes(simpegSearch.toLowerCase()));
      return matchYear && matchSearch;
    });
  }, [attendances, simpegFilterTahun, simpegSearch]);

  // Live Sync Action
  const handleLiveSync = async () => {
    setIsSyncing(true);
    setToastMessage(null);
    try {
      const res = await fetchLiveAbsensiSpreadsheet(ABSENSI_SPREADSHEET_ID);
      if (res.records && res.records.length > 0) {
        setSpreadsheetRecords(res.records);
        localStorage.setItem('absensi_spreadsheet_cache_v3', JSON.stringify(res.records));
      }
      setSyncMessage(res.message);
      localStorage.setItem('absensi_sync_message', res.message);
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(null), 5000);
    } catch {
      setSyncMessage('Sinkronisasi selesai menggunakan data cache lokal presensi.');
      setToastMessage('Data tersimpan aktif.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync into SIMPEG Monthly Attendances
  const handleSyncToSimpeg = () => {
    const selectedPeriod = ABSENSI_PERIODS.find((p) => p.namaBulan === filterBulan) || ABSENSI_PERIODS[ABSENSI_PERIODS.length - 1];
    const recs = spreadsheetRecords.filter((r) => r.periode === selectedPeriod.namaBulan || r.bulan === selectedPeriod.bulan);
    const newMonthly = generateMonthlyAttendanceFromSpreadsheet(
      recs.length > 0 ? recs : spreadsheetRecords,
      selectedPeriod.bulan,
      selectedPeriod.tahun,
      selectedPeriod.namaBulan
    );
    const existingIndex = attendances.findIndex((a) => (a.bulan === selectedPeriod.bulan && a.tahun === selectedPeriod.tahun) || a.id === newMonthly.id);

    if (existingIndex >= 0) {
      onUpdateAttendance({
        ...attendances[existingIndex],
        ...newMonthly,
        id: attendances[existingIndex].id,
      });
    } else {
      onAddAttendance(newMonthly);
    }

    setToastMessage(`Berhasil menyinkronkan data presensi ${selectedPeriod.namaBulan} ke Rekap Bulanan SIMPEG!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Sync All Months (Jan - Aug) to SIMPEG
  const handleSyncAllMonthsToSimpeg = () => {
    const allGenerated = generateAllMonthlyAttendancesFromSpreadsheet(spreadsheetRecords);
    allGenerated.forEach((genAtt) => {
      const existingIndex = attendances.findIndex(
        (a) => (a.bulan === genAtt.bulan && a.tahun === genAtt.tahun) || a.id === genAtt.id
      );
      if (existingIndex >= 0) {
        onUpdateAttendance({
          ...attendances[existingIndex],
          ...genAtt,
          id: attendances[existingIndex].id,
        });
      } else {
        onAddAttendance(genAtt);
      }
    });

    setToastMessage(`Berhasil menyinkronkan seluruh 8 bulan (Januari s.d. Agustus 2026) dari Google Spreadsheet ke SIMPEG!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(ABSENSI_SPREADSHEET_ID);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleExportPDF = () => {
    const periodeLabel = filterBulan === 'ALL' ? 'Januari - Agustus 2026' : filterBulan;
    exportAbsensiSpreadsheetPDF(filteredRecords, periodeLabel, ABSENSI_SPREADSHEET_ID);
  };

  const handleExportSpreadsheetExcel = () => {
    const data = filteredRecords.map((r) => ({
      No: r.no,
      Periode: r.periode,
      NIP: r.nip,
      Nama: r.nama,
      Jabatan: r.jabatan,
      Satuan_Pelayanan: r.satuanPelayanan,
      Hari_Kerja_Efektif: r.hariKerjaEfektif,
      Hadir_Fisik: r.hadir,
      Sakit: r.sakit,
      Izin: r.izin,
      Cuti: r.cuti,
      Dinas_Luar: r.dinasLuar,
      Alpa_Tanpa_Keterangan: r.tanpaKeterangan,
      Terlambat_Menit: r.terlambatMenit,
      Pulang_Cepat_Menit: r.pulangCepatMenit,
      Jam_Kerja_Kumulatif: r.jamKerjaKumulatif,
      Persentase_Kehadiran: `${r.persentaseKehadiran}%`,
      Status_Kepatuhan: r.statusKepatuhan,
      Catatan: r.catatan,
    }));
    const periodeLabel = filterBulan === 'ALL' ? 'Jan_sd_Agu_2026' : filterBulan.replace(/\s+/g, '_');
    exportToExcel(data, 'Presensi Spreadsheet', `Rekap_Presensi_Spreadsheet_${periodeLabel}_${ABSENSI_SPREADSHEET_ID.slice(0, 8)}`);
  };

  // Local Modal Handlers
  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedFile(null);
    setFormData({
      bulan: 3,
      tahun: 2026,
      namaBulan: 'Maret 2026',
      totalHariKerja: 21,
      totalPegawai: stats.totalPegawai,
      rekapHadir: stats.totalHadir,
      rekapSakit: stats.totalSakit,
      rekapIzin: stats.totalIzin,
      rekapCuti: stats.totalCuti,
      rekapDinasLuar: stats.totalDL,
      rekapTanpaKeterangan: stats.totalAlpa,
      persentaseKehadiran: Number(stats.avgKehadiran),
      catatan: `Rekapitulasi sinkronisasi Google Spreadsheet ID: ${ABSENSI_SPREADSHEET_ID}`,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (att: MonthlyAttendance) => {
    setIsEditing(true);
    setFormData({ ...att });
    setIsModalOpen(true);
  };

  const calculatePercentage = (hadir: number, sakit: number, izin: number, cuti: number, dl: number, alpa: number) => {
    const totalSesi = hadir + sakit + izin + cuti + dl + alpa;
    if (totalSesi === 0) return 100;
    return Number((((hadir + dl) / totalSesi) * 100).toFixed(1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const hadir = Number(formData.rekapHadir || 0);
    const sakit = Number(formData.rekapSakit || 0);
    const izin = Number(formData.rekapIzin || 0);
    const cuti = Number(formData.rekapCuti || 0);
    const dl = Number(formData.rekapDinasLuar || 0);
    const alpa = Number(formData.rekapTanpaKeterangan || 0);
    const pct = calculatePercentage(hadir, sakit, izin, cuti, dl, alpa);

    if (isEditing && formData.id) {
      onUpdateAttendance({
        ...(formData as MonthlyAttendance),
        persentaseKehadiran: pct,
        fileName: selectedFile ? selectedFile.name : formData.fileName,
      });
    } else {
      const newAttendance: MonthlyAttendance = {
        id: `ATT-${formData.tahun}-${String(formData.bulan).padStart(2, '0')}`,
        bulan: Number(formData.bulan),
        tahun: Number(formData.tahun),
        namaBulan: formData.namaBulan || `Bulan ${formData.bulan} ${formData.tahun}`,
        totalHariKerja: Number(formData.totalHariKerja || 21),
        totalPegawai: Number(formData.totalPegawai || stats.totalPegawai),
        rekapHadir: hadir,
        rekapSakit: sakit,
        rekapIzin: izin,
        rekapCuti: cuti,
        rekapDinasLuar: dl,
        rekapTanpaKeterangan: alpa,
        persentaseKehadiran: pct,
        fileName: selectedFile ? selectedFile.name : `Rekap_Presensi_${formData.namaBulan?.replace(/\s+/g, '_')}.xlsx`,
        fileSize: selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB` : '1.5 MB',
        uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        uploadedBy: 'Admin Presensi SDM',
        catatan: formData.catatan,
      };
      onAddAttendance(newAttendance);
    }

    setIsModalOpen(false);
  };

  const handleExportSimpegExcel = () => {
    const data = attendances.map((a) => ({
      Bulan: a.namaBulan,
      Total_Hari_Kerja: a.totalHariKerja,
      Total_Pegawai: a.totalPegawai,
      Hadir: a.rekapHadir,
      Sakit: a.rekapSakit,
      Izin: a.rekapIzin,
      Cuti: a.rekapCuti,
      Dinas_Luar: a.rekapDinasLuar,
      Tanpa_Keterangan: a.rekapTanpaKeterangan,
      Persentase_Kehadiran: `${a.persentaseKehadiran}%`,
      File_Sumber: a.fileName || '-',
      Tanggal_Upload: a.uploadedAt,
    }));
    exportToExcel(data, 'Rekap Absensi', 'Rekapitulasi_Presensi_Bulanan_SIMPEG');
  };

  const handleExportSimpegPDF = () => {
    exportSimpegMonthlyAttendancesPDF(filteredAttendances);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-indigo-600" /> Rekapitulasi Absensi Bulanan Pegawai
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Terintegrasi dengan Google Spreadsheet Presensi Balai Karantina Hewan, Ikan, dan Tumbuhan
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={ABSENSI_SPREADSHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Buka Google Spreadsheet</span>
            <ExternalLink className="h-3 w-3 text-emerald-600" />
          </a>

          <button
            type="button"
            onClick={handleLiveSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
            title="Segarkan data dari Google Spreadsheet"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Segarkan Data'}</span>
          </button>

          <button
            type="button"
            onClick={handleSyncToSimpeg}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
            title={`Sinkronkan rekap ${filterBulan === 'ALL' ? 'Agustus 2026' : filterBulan} ke database SIMPEG`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Sinkron {filterBulan === 'ALL' ? 'Bulan Ini' : filterBulan.split(' ')[0]} ke SIMPEG</span>
          </button>

          <button
            type="button"
            onClick={handleSyncAllMonthsToSimpeg}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 px-3.5 py-2 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title="Sinkronkan seluruh 8 bulan (Januari s.d. Agustus 2026) ke SIMPEG"
          >
            <Layers className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Sinkronkan 8 Bulan</span>
            <span className="sm:hidden">Sinkron 8 Bln</span>
          </button>
        </div>
      </div>

      {/* Google Spreadsheet Integration Information Banner */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-blue-50/60 to-emerald-50/70 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                  Google Spreadsheet Presensi Terhubung
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[11px] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live ID Aktif
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-600">ID Dokumen:</span>
                <code className="rounded-md bg-white/90 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 border border-slate-200 select-all">
                  {ABSENSI_SPREADSHEET_ID}
                </code>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-white/80 hover:bg-white px-2 py-0.5 rounded-md border border-indigo-100 transition-colors cursor-pointer"
                  title="Salin ID Spreadsheet"
                >
                  {copiedId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-500" />}
                  <span>{copiedId ? 'Tersalin!' : 'Salin ID'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 mt-1">
                {syncMessage}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0 flex-wrap">
            <a
              id="btn-buka-spreadsheet-absensi"
              href={ABSENSI_SPREADSHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition-colors shadow-xs"
              title="Buka Google Spreadsheet di Tab Baru"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Buka di Google Sheets</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              type="button"
              onClick={handleExportPDF}
              className="flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title="Cetak Dokumen Rekap Presensi PDF"
            >
              <Printer className="h-3.5 w-3.5 text-rose-600" />
              <span>Cetak Rekap PDF</span>
            </button>
            <button
              type="button"
              onClick={handleExportSpreadsheetExcel}
              className="flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('spreadsheet_presensi')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'spreadsheet_presensi'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Data Presensi Pegawai (Spreadsheet ID: {ABSENSI_SPREADSHEET_ID.slice(0, 8)}...)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            activeTab === 'spreadsheet_presensi' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-700'
          }`}>
            {spreadsheetRecords.length} ASN
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rekap_simpeg')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'rekap_simpeg'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <CalendarCheck className="h-4 w-4" />
          <span>Rekapitulasi Presensi Bulanan SIMPEG</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            activeTab === 'rekap_simpeg' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-700'
          }`}>
            {attendances.length} Bulan
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('embed_sheets')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'embed_sheets'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ExternalLink className="h-4 w-4" />
          <span>Pratinjau Lembar Kerja (Embedded Google Docs)</span>
        </button>
      </div>

      {/* TAB 1: SPREADSHEET PRESENSI DATA */}
      {activeTab === 'spreadsheet_presensi' && (
        <div className="space-y-5">
          {/* Periode Month Switcher Navigation (Januari s.d. Agustus 2026) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <CalendarCheck className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Pilih Periode Presensi Pegawai:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Data tersedia lengkap dari Januari hingga Agustus 2026
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterBulan('ALL')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    filterBulan === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua Bulan (Jan - Agu)
                </button>

                {ABSENSI_PERIODS.map((period) => {
                  const isSelected = filterBulan === period.namaBulan;
                  return (
                    <button
                      key={period.namaBulan}
                      type="button"
                      onClick={() => setFilterBulan(period.namaBulan)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {period.namaBulan.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Overview Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Rata-rata Kehadiran
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-indigo-600">{stats.avgKehadiran}%</span>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center">
                  <TrendingUp className="h-3 w-3" /> Sangat Baik
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Target kepatuhan ASN &gt; 95%</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Jam Kerja Kumulatif
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{stats.totalJam} Jam</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Total akumulasi seluruh Satker</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Tingkat Kepatuhan Tinggi
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600">{stats.sangatBaikCount} ASN</span>
                <span className="text-[11px] text-slate-500 font-mono">/ {stats.totalPegawai}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Status Kepatuhan Sangat Baik</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Kasus Tanpa Keterangan
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-600">{stats.totalAlpa} Kasus</span>
                <span className="text-[11px] text-rose-500 font-semibold">Teguran SDM</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Perlu tindak lanjut atasan langsung</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan Nama Pegawai, NIP, Jabatan, atau Satker..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  <select
                    value={filterSatker}
                    onChange={(e) => setFilterSatker(e.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">Semua Satuan Pelayanan ({satkerOptions.length - 1})</option>
                    {satkerOptions.filter(s => s !== 'ALL').map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <select
                  value={filterKepatuhan}
                  onChange={(e) => setFilterKepatuhan(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
                >
                  <option value="ALL">Semua Kepatuhan</option>
                  <option value="Sangat Baik">Sangat Baik (≥95%)</option>
                  <option value="Baik">Baik (90-94%)</option>
                  <option value="Perlu Perhatian">Perlu Perhatian (&lt;90%)</option>
                  <option value="Disiplin">Ada Alpa / Disiplin</option>
                </select>

                {(search || filterSatker !== 'ALL' || filterKepatuhan !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setFilterSatker('ALL');
                      setFilterKepatuhan('ALL');
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 px-2 py-1"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span>Menampilkan <strong>{filteredRecords.length}</strong> pegawai terdata ({filterBulan === 'ALL' ? 'Akumulasi Jan - Agu' : filterBulan})</span>
              <span>Periode Aktif: <strong className="text-slate-800">{filterBulan === 'ALL' ? 'Semua Bulan (Januari - Agustus 2026)' : filterBulan}</strong></span>
            </div>
          </div>

          {/* Table of ASN Attendance */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 text-center w-12">No</th>
                    <th className="py-3 px-4">Nama Pegawai & Jabatan</th>
                    <th className="py-3 px-3">Satuan Pelayanan</th>
                    <th className="py-3 px-2 text-center" title="Hari Kerja Efektif">HK</th>
                    <th className="py-3 px-2 text-center text-emerald-700" title="Hadir Fisik">H</th>
                    <th className="py-3 px-2 text-center" title="Sakit">S</th>
                    <th className="py-3 px-2 text-center" title="Izin">I</th>
                    <th className="py-3 px-2 text-center" title="Cuti">C</th>
                    <th className="py-3 px-2 text-center" title="Dinas Luar">DL</th>
                    <th className="py-3 px-2 text-center text-rose-600 font-bold" title="Tanpa Keterangan / Alpa">TK</th>
                    <th className="py-3 px-3 text-center font-bold">Kehadiran %</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-8 text-center text-slate-400">
                        Tidak ada data pegawai yang sesuai dengan kata kunci pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={`${r.nip}-${r.no}`} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 text-center font-mono text-slate-400">{r.no}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-bold text-slate-900">{r.nama}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[11px] text-slate-500">{r.nip}</span>
                              <span className="text-[11px] text-slate-400 truncate max-w-[200px]">{r.jabatan}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            {r.satuanPelayanan || 'UPT INDUK'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-medium">{r.hariKerjaEfektif}</td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-emerald-600">{r.hadir}</td>
                        <td className="py-3 px-2 text-center font-mono">{r.sakit}</td>
                        <td className="py-3 px-2 text-center font-mono">{r.izin}</td>
                        <td className="py-3 px-2 text-center font-mono">{r.cuti}</td>
                        <td className="py-3 px-2 text-center font-mono text-blue-600">{r.dinasLuar}</td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-rose-600">
                          {r.tanpaKeterangan > 0 ? (
                            <span className="rounded bg-rose-100 px-1 py-0.2 text-rose-700 font-bold">{r.tanpaKeterangan}</span>
                          ) : (
                            '0'
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-xs font-bold ${
                            r.persentaseKehadiran >= 95
                              ? 'bg-emerald-50 text-emerald-700'
                              : r.persentaseKehadiran >= 90
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {r.persentaseKehadiran}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            r.statusKepatuhan === 'Sangat Baik'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.statusKepatuhan === 'Baik'
                              ? 'bg-blue-100 text-blue-800'
                              : r.statusKepatuhan === 'Perlu Perhatian'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {r.statusKepatuhan}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(r)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Lihat Detail Log Presensi"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Satker Summary Cards */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Building className="h-4 w-4 text-indigo-600" /> Rekapitulasi Kehadiran per Satuan Pelayanan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {satkerSummaries.map((s) => (
                <div key={s.satker} className="rounded-xl border border-slate-100 bg-slate-50 p-3 hover:border-indigo-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 truncate max-w-[140px]">{s.satker}</span>
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {s.rataRataKehadiran}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {s.jumlahPegawai} Pegawai Terdata
                  </p>
                  <div className="mt-2 text-[10px] text-slate-600 flex items-center gap-2 font-mono">
                    <span className="text-emerald-700 font-bold">H: {s.totalHadir}</span>
                    <span>DL: {s.totalDL}</span>
                    <span>C/S: {s.totalCuti + s.totalSakit}</span>
                    {s.totalAlpa > 0 && <span className="text-rose-600 font-bold">TK: {s.totalAlpa}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REKAP BULANAN SIMPEG */}
      {activeTab === 'rekap_simpeg' && (
        <div className="space-y-5">
          {/* Executive YTD 2026 Summary Strip */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CalendarCheck className="h-4.5 w-4.5 text-indigo-600" />
                  Tren Progres Presensi Kumulatif (Januari s.d. Agustus 2026)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekapitulasi resmi 8 bulan berjalan yang tervalidasi di SIMPEG Balai Karantina
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-bold border border-emerald-200">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  Rata-rata 2026: {ytd2026Summary.avgKehadiran}%
                </span>
                <span className="text-xs text-slate-300">|</span>
                <span className="text-xs font-mono text-slate-700 font-bold">
                  {ytd2026Summary.totalHariKerja} Hari Kerja Terdata
                </span>
              </div>
            </div>

            {/* 8 Months Progression Pills / Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              {ytd2026Summary.months2026.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center hover:border-indigo-300 transition-colors"
                >
                  <span className="text-[11px] font-bold text-slate-800 block truncate">
                    {m.namaBulan.split(' ')[0]}
                  </span>
                  <span className="text-base font-black text-indigo-600 font-mono block mt-0.5">
                    {m.persentaseKehadiran}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {m.totalHariKerja} HK | {m.rekapHadir} Hadir
                  </span>
                  <div className="mt-1.5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, m.persentaseKehadiran)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Aggregated Totals Strip */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-500">Akumulasi Hadir Fisik:</span>
                <strong className="text-slate-800 font-mono">{ytd2026Summary.totalHadir.toLocaleString('id-ID')} sesi</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                <span className="text-slate-500">Dinas Luar (DL):</span>
                <strong className="text-slate-800 font-mono">{ytd2026Summary.totalDL.toLocaleString('id-ID')} sesi</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-slate-500">Total Cuti/Sakit:</span>
                <strong className="text-slate-800 font-mono">{(ytd2026Summary.totalCuti + ytd2026Summary.totalSakit).toLocaleString('id-ID')} sesi</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                <span className="text-slate-500">Total Alpa/TK:</span>
                <strong className="text-rose-600 font-mono">{ytd2026Summary.totalAlpa} kasus</strong>
              </div>
            </div>
          </div>

          {/* Action & Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari bulan atau catatan..."
                  value={simpegSearch}
                  onChange={(e) => setSimpegSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={simpegFilterTahun}
                onChange={(e) => setSimpegFilterTahun(e.target.value as any)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value="ALL">Semua Tahun ({attendances.length} Bulan)</option>
                <option value="2026">Tahun 2026 (Jan - Agu)</option>
                <option value="2025">Tahun 2025</option>
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSyncAllMonthsToSimpeg}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 text-xs font-bold text-indigo-700 transition-colors shadow-2xs cursor-pointer"
                title="Sinkronkan seluruh 8 bulan dari Google Spreadsheet"
              >
                <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
                <span>Sinkronkan Ulang 8 Bulan (Jan - Agu)</span>
              </button>
              <button
                type="button"
                onClick={handleExportSimpegPDF}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                title="Cetak Dokumen Rekap Presensi SIMPEG PDF"
              >
                <Printer className="h-3.5 w-3.5 text-rose-600" />
                <span>Cetak Rekap PDF</span>
              </button>
              <button
                type="button"
                onClick={handleExportSimpegExcel}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Ekspor Rekap Excel</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Rekap Presensi</span>
              </button>
            </div>
          </div>

          {/* Table of Monthly Attendance */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Periode Bulan</th>
                    <th className="py-3 px-3 text-center">Hari Kerja</th>
                    <th className="py-3 px-3 text-center">Pegawai</th>
                    <th className="py-3 px-3 text-center">Hadir</th>
                    <th className="py-3 px-3 text-center">Sakit</th>
                    <th className="py-3 px-3 text-center">Izin</th>
                    <th className="py-3 px-3 text-center">Cuti</th>
                    <th className="py-3 px-3 text-center">Dinas Luar</th>
                    <th className="py-3 px-3 text-center text-rose-600 font-bold">Alpa</th>
                    <th className="py-3 px-3 text-center font-bold">Persentase</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredAttendances.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{att.namaBulan}</p>
                            <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                              {att.fileName || 'Rekap_Presensi.xlsx'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{att.totalHariKerja}</td>
                      <td className="py-3 px-3 text-center font-mono">{att.totalPegawai}</td>
                      <td className="py-3 px-3 text-center font-semibold text-emerald-600 font-mono">{att.rekapHadir}</td>
                      <td className="py-3 px-3 text-center font-mono">{att.rekapSakit}</td>
                      <td className="py-3 px-3 text-center font-mono">{att.rekapIzin}</td>
                      <td className="py-3 px-3 text-center font-mono">{att.rekapCuti}</td>
                      <td className="py-3 px-3 text-center font-mono">{att.rekapDinasLuar}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-rose-600">{att.rekapTanpaKeterangan}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 font-mono text-xs font-bold text-indigo-700">
                          {att.persentaseKehadiran}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(att)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit Data Rekap"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus rekap absensi ${att.namaBulan}?`)) {
                                onDeleteAttendance(att.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Rekap"
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

      {/* TAB 3: EMBED GOOGLE DOCS / SHEETS */}
      {activeTab === 'embed_sheets' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Pratinjau Google Sheets (ID: {ABSENSI_SPREADSHEET_ID})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tampilan langsung lembar kerja Google Docs. Pastikan Anda telah login ke akun Google yang memiliki izin akses ke dokumen ini.
              </p>
            </div>

            <a
              href={ABSENSI_SPREADSHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors whitespace-nowrap"
            >
              <span>Buka di Google Spreadsheet Tab Baru</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="rounded-2xl border border-slate-300 bg-slate-900/5 overflow-hidden shadow-xs relative">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span className="font-mono text-[11px] truncate">
                https://docs.google.com/spreadsheets/d/{ABSENSI_SPREADSHEET_ID}/edit
              </span>
              <span className="text-[11px] text-slate-400">Google Docs Viewer</span>
            </div>

            <iframe
              src={ABSENSI_SPREADSHEET_EMBED_URL}
              className="w-full h-[600px] border-0 bg-white"
              title="Google Spreadsheet Presensi"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* Detail Modal for Individual Employee */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-8">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                Detail Log Presensi Pegawai
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedRecord.nama}</h3>
              <p className="text-xs text-slate-500 font-mono">{selectedRecord.nip} • {selectedRecord.jabatan}</p>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-400 block">Satuan Pelayanan</span>
                  <span className="font-bold text-slate-800">{selectedRecord.satuanPelayanan}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Periode</span>
                  <span className="font-bold text-slate-800">{selectedRecord.periode}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Hari Kerja Efektif</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedRecord.hariKerjaEfektif} Hari</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Persentase Kehadiran</span>
                  <span className="font-bold text-indigo-700 font-mono text-sm">{selectedRecord.persentaseKehadiran}%</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">Rincian Kehadiran & Sesi:</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-emerald-50 p-2 border border-emerald-100">
                    <span className="text-[10px] text-emerald-700 block">Hadir Fisik</span>
                    <span className="text-sm font-bold text-emerald-800 font-mono">{selectedRecord.hadir}</span>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-2 border border-blue-100">
                    <span className="text-[10px] text-blue-700 block">Dinas Luar (DL)</span>
                    <span className="text-sm font-bold text-blue-800 font-mono">{selectedRecord.dinasLuar}</span>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-2 border border-purple-100">
                    <span className="text-[10px] text-purple-700 block">Cuti Pegawai</span>
                    <span className="text-sm font-bold text-purple-800 font-mono">{selectedRecord.cuti}</span>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-2 border border-amber-100">
                    <span className="text-[10px] text-amber-700 block">Sakit (SKD)</span>
                    <span className="text-sm font-bold text-amber-800 font-mono">{selectedRecord.sakit}</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                    <span className="text-[10px] text-slate-600 block">Izin Resmi</span>
                    <span className="text-sm font-bold text-slate-800 font-mono">{selectedRecord.izin}</span>
                  </div>
                  <div className="rounded-lg bg-rose-50 p-2 border border-rose-100">
                    <span className="text-[10px] text-rose-700 block">Tanpa Ket. (Alpa)</span>
                    <span className="text-sm font-bold text-rose-800 font-mono">{selectedRecord.tanpaKeterangan}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Akumulasi Jam Kerja:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedRecord.jamKerjaKumulatif} Jam</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Keterlambatan:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedRecord.terlambatMenit} Menit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pulang Mendahului:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedRecord.pulangCepatMenit} Menit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Kepatuhan:</span>
                  <span className="font-bold text-indigo-700">{selectedRecord.statusKepatuhan}</span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900">
                <span className="font-bold block mb-0.5">Catatan Verifikasi Presensi:</span>
                <p>{selectedRecord.catatan}</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-900 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload / Edit Attendance */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              {isEditing ? 'Edit Data Rekap Absensi Bulanan' : 'Upload Berkas Rekap Absensi Bulanan'}
            </h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Nama Periode / Bulan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Maret 2026"
                    value={formData.namaBulan || ''}
                    onChange={(e) => setFormData({ ...formData, namaBulan: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Total Hari Kerja Efektif</label>
                  <input
                    type="number"
                    value={formData.totalHariKerja || 21}
                    onChange={(e) => setFormData({ ...formData, totalHariKerja: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Upload File Input */}
              <div>
                <label className="text-xs font-bold text-slate-700">
                  Unggah Berkas Excel / CSV Presensi Mesin Biometrik
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 mb-2">
                  Rincian Angka Kehadiran (Sesi/Hari):
                </h4>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-600">Hadir Fisik</label>
                    <input
                      type="number"
                      value={formData.rekapHadir || 0}
                      onChange={(e) => setFormData({ ...formData, rekapHadir: Number(e.target.value) })}
                      className="mt-0.5 w-full rounded-lg border border-slate-300 p-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600">Sakit (SKD)</label>
                    <input
                      type="number"
                      value={formData.rekapSakit || 0}
                      onChange={(e) => setFormData({ ...formData, rekapSakit: Number(e.target.value) })}
                      className="mt-0.5 w-full rounded-lg border border-slate-300 p-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600">Izin Resmi</label>
                    <input
                      type="number"
                      value={formData.rekapIzin || 0}
                      onChange={(e) => setFormData({ ...formData, rekapIzin: Number(e.target.value) })}
                      className="mt-0.5 w-full rounded-lg border border-slate-300 p-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600">Cuti Pegawai</label>
                    <input
                      type="number"
                      value={formData.rekapCuti || 0}
                      onChange={(e) => setFormData({ ...formData, rekapCuti: Number(e.target.value) })}
                      className="mt-0.5 w-full rounded-lg border border-slate-300 p-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600">Dinas Luar (DL)</label>
                    <input
                      type="number"
                      value={formData.rekapDinasLuar || 0}
                      onChange={(e) => setFormData({ ...formData, rekapDinasLuar: Number(e.target.value) })}
                      className="mt-0.5 w-full rounded-lg border border-slate-300 p-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-rose-600 font-semibold">Alpa / Tanpa Ket.</label>
                    <input
                      type="number"
                      value={formData.rekapTanpaKeterangan || 0}
                      onChange={(e) => setFormData({ ...formData, rekapTanpaKeterangan: Number(e.target.value) })}
                      className="mt-0.5 w-full rounded-lg border border-rose-300 p-1.5 text-xs font-mono text-rose-700"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Catatan / Berita Acara Presensi</label>
                <textarea
                  rows={2}
                  value={formData.catatan || ''}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-indigo-500"
                />
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
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm cursor-pointer"
                >
                  Simpan Rekap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
