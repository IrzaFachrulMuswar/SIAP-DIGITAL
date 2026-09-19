import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarCheck, 
  RefreshCw, 
  Search, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Building, 
  Filter,
  Eye,
  Sparkles,
  Layers,
  FileSpreadsheet,
  Calendar,
  UserCheck,
  Plane,
  HeartPulse,
  Award,
  ChevronRight,
  TrendingUp,
  Info,
  Pencil,
  Trash2,
  Save,
  X,
  Plus
} from 'lucide-react';
import { DailyAttendanceRecord } from '../../types';
import { 
  fetchLiveMonthlyAbsensiRecap, 
  fetchLiveAbsensiBulanan,
  ABSENSI_SPREADSHEET_ID, 
  ABSENSI_DEFAULT_GID,
  MONTHLY_ABSENSI_SHEETS,
  MonthlyAttendanceRecapItem,
  MonthlySheetMeta
} from '../../utils/googleSheetsLiveReader';
import { exportToExcel } from '../../utils/exportUtils';

export const Sheet3AbsensiBulananView: React.FC = () => {
  // Tab Mode
  const [viewMode, setViewMode] = useState<'rekap' | 'log_harian' | 'tahunan'>('rekap');
  
  // Bulan aktif tahun berjalan (default AGUSTUS dengan gid 1473990328 sesuai permintaan)
  const [selectedMonth, setSelectedMonth] = useState<string>('AGUSTUS');
  const [sheetTitle, setSheetTitle] = useState<string>('LAPORAN KEHADIRAN PEGAWAI NEGERI SIPIL BKHIT PAPUA BARAT DAYA');

  // Edit / Input State
  const [editingRecap, setEditingRecap] = useState<MonthlyAttendanceRecapItem | null>(null);
  const [deletingRecap, setDeletingRecap] = useState<MonthlyAttendanceRecapItem | null>(null);
  const [isAddRecapOpen, setIsAddRecapOpen] = useState(false);
  const [recapForm, setRecapForm] = useState({
    nama: '',
    hariKerjaAktif: 21,
    akumulasiTl01_90: 0,
    tl91Plus: 0,
    psw01_90: 0,
    psw91Plus: 0,
    tidakAbsen: '',
    tdkMasukAtauIzin: '',
    tidakUpacaraApel: '',
    cutiTahunan: '',
    dinasLuar: '',
    ijinSakit: '',
  });

  const handleOpenEditRecap = (item: MonthlyAttendanceRecapItem) => {
    setEditingRecap(item);
    setIsAddRecapOpen(false);
    setRecapForm({
      nama: item.nama,
      hariKerjaAktif: item.hariKerjaAktif || 21,
      akumulasiTl01_90: item.akumulasiTl01_90 || 0,
      tl91Plus: item.tl91Plus || 0,
      psw01_90: item.psw01_90 || 0,
      psw91Plus: item.psw91Plus || 0,
      tidakAbsen: item.tidakAbsen || '',
      tdkMasukAtauIzin: item.tdkMasukAtauIzin || '',
      tidakUpacaraApel: item.tidakUpacaraApel || '',
      cutiTahunan: item.cutiTahunan || '',
      dinasLuar: item.dinasLuar || '',
      ijinSakit: item.ijinSakit || '',
    });
  };

  const handleOpenAddRecap = () => {
    setIsAddRecapOpen(true);
    setEditingRecap(null);
    setRecapForm({
      nama: '',
      hariKerjaAktif: 21,
      akumulasiTl01_90: 0,
      tl91Plus: 0,
      psw01_90: 0,
      psw91Plus: 0,
      tidakAbsen: '',
      tdkMasukAtauIzin: '',
      tidakUpacaraApel: '',
      cutiTahunan: '',
      dinasLuar: '',
      ijinSakit: '',
    });
  };

  const handleSaveRecap = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecap) {
      const updated: MonthlyAttendanceRecapItem = {
        ...editingRecap,
        nama: recapForm.nama,
        hariKerjaAktif: Number(recapForm.hariKerjaAktif),
        akumulasiTl01_90: String(recapForm.akumulasiTl01_90),
        tl91Plus: String(recapForm.tl91Plus),
        psw01_90: String(recapForm.psw01_90),
        psw91Plus: String(recapForm.psw91Plus),
        tidakAbsen: recapForm.tidakAbsen,
        tdkMasukAtauIzin: recapForm.tdkMasukAtauIzin,
        tidakUpacaraApel: recapForm.tidakUpacaraApel,
        cutiTahunan: recapForm.cutiTahunan,
        dinasLuar: recapForm.dinasLuar,
        ijinSakit: recapForm.ijinSakit,
      };
      setMonthlyRows((prev) => prev.map((r) => r.no === updated.no || r.nama === updated.nama ? updated : r));
    } else if (isAddRecapOpen) {
      const newRow: MonthlyAttendanceRecapItem = {
        no: monthlyRows.length + 1,
        section: 'PEGAWAI NEGERI SIPIL',
        nama: recapForm.nama,
        hariKerjaAktif: Number(recapForm.hariKerjaAktif),
        akumulasiTl01_90: String(recapForm.akumulasiTl01_90),
        tl91Plus: String(recapForm.tl91Plus),
        psw01_90: String(recapForm.psw01_90),
        psw91Plus: String(recapForm.psw91Plus),
        tidakAbsen: recapForm.tidakAbsen,
        tdkMasukAtauIzin: recapForm.tdkMasukAtauIzin,
        tidakUpacaraApel: recapForm.tidakUpacaraApel,
        cutiBesar: '',
        cutiAlasanPentingBersalin: '',
        cutiSakitInap: '',
        ijinSakit: recapForm.ijinSakit,
        cutiSakitKetDok: '',
        cutiTahunan: recapForm.cutiTahunan,
        dinasLuar: recapForm.dinasLuar,
      };
      setMonthlyRows((prev) => [...prev, newRow]);
    }
    setEditingRecap(null);
    setIsAddRecapOpen(false);
  };

  const handleConfirmDeleteRecap = () => {
    if (!deletingRecap) return;
    const target = deletingRecap;
    setMonthlyRows((prev) => prev.filter((r) => r.no !== target.no || r.nama !== target.nama));
    setDeletingRecap(null);
  };
  
  // Data State
  const [monthlyRows, setMonthlyRows] = useState<MonthlyAttendanceRecapItem[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncSource, setSyncSource] = useState<'gviz' | 'cache'>('gviz');
  const [lastSyncTime, setLastSyncTime] = useState('');
  
  // Filter & Search
  const [search, setSearch] = useState('');
  const [filterSection, setFilterSection] = useState('ALL');
  const [filterDisiplin, setFilterDisiplin] = useState('ALL');
  
  // Modal Detail
  const [selectedPegawai, setSelectedPegawai] = useState<MonthlyAttendanceRecapItem | null>(null);
  const [selectedDailyLog, setSelectedDailyLog] = useState<DailyAttendanceRecord | null>(null);

  // Load Data Bulan Terpilih
  const loadMonthData = async (monthKey: string = selectedMonth) => {
    setIsLoading(true);
    try {
      const res = await fetchLiveMonthlyAbsensiRecap(monthKey, ABSENSI_SPREADSHEET_ID);
      setMonthlyRows(res.rows);
      setSheetTitle(res.sheetTitle || `LAPORAN KEHADIRAN PEGAWAI BULAN : ${monthKey} 2026`);
      setSyncSource(res.source);
      setLastSyncTime(res.timestamp);

      // Juga sinkronkan daily logs untuk mode log
      const dailyRes = await fetchLiveAbsensiBulanan(ABSENSI_SPREADSHEET_ID);
      setDailyLogs(dailyRes.rows);
    } catch (err: any) {
      console.error('Gagal membaca data presensi bulanan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMonthData(selectedMonth);
  }, [selectedMonth]);

  // Daftar Unit / Section
  const sectionList = useMemo(() => {
    const list = Array.from(new Set(monthlyRows.map(r => r.section))).filter(Boolean);
    return ['ALL', ...list];
  }, [monthlyRows]);

  // Filtered Rows Rekap
  const filteredMonthlyRows = useMemo(() => {
    return monthlyRows.filter(r => {
      const q = search.toLowerCase();
      const matchSearch = !search || r.nama.toLowerCase().includes(q) || (r.section && r.section.toLowerCase().includes(q));
      const matchSection = filterSection === 'ALL' || r.section === filterSection;

      let matchDisiplin = true;
      if (filterDisiplin === 'TERLAMBAT_PSW') {
        matchDisiplin = !!(r.akumulasiTl01_90 || r.tl91Plus || r.psw01_90 || r.psw91Plus);
      } else if (filterDisiplin === 'CUTI_SAKIT') {
        matchDisiplin = !!(r.cutiTahunan || r.cutiBesar || r.cutiAlasanPentingBersalin || r.cutiSakitInap || r.ijinSakit || r.cutiSakitKetDok);
      } else if (filterDisiplin === 'DINAS_LUAR') {
        matchDisiplin = !!r.dinasLuar;
      } else if (filterDisiplin === 'TIDAK_ABSEN') {
        matchDisiplin = !!(r.tidakAbsen || r.tdkMasukAtauIzin || r.tidakUpacaraApel);
      } else if (filterDisiplin === 'DISIPLIN_PENUH') {
        matchDisiplin = !r.akumulasiTl01_90 && !r.tl91Plus && !r.psw01_90 && !r.psw91Plus && !r.tidakAbsen && !r.tdkMasukAtauIzin;
      }

      return matchSearch && matchSection && matchDisiplin;
    });
  }, [monthlyRows, search, filterSection, filterDisiplin]);

  // Statistik Ringkasan Bulan Terpilih
  const monthlyStats = useMemo(() => {
    const totalPegawai = monthlyRows.length;
    if (totalPegawai === 0) {
      return { totalPegawai: 0, avgHariKerja: 0, countTerlambat: 0, countPsw: 0, countCuti: 0, countDinasLuar: 0, countDisiplinPenuh: 0 };
    }

    const totalHariKerja = monthlyRows.reduce((acc, r) => acc + (r.hariKerjaAktif || 0), 0);
    const avgHariKerja = (totalHariKerja / totalPegawai).toFixed(1);

    const countTerlambat = monthlyRows.filter(r => r.akumulasiTl01_90 || r.tl91Plus).length;
    const countPsw = monthlyRows.filter(r => r.psw01_90 || r.psw91Plus).length;
    const countCuti = monthlyRows.filter(r => r.cutiTahunan || r.cutiBesar || r.cutiAlasanPentingBersalin || r.cutiSakitInap || r.ijinSakit || r.cutiSakitKetDok).length;
    const countDinasLuar = monthlyRows.filter(r => r.dinasLuar).length;
    const countDisiplinPenuh = monthlyRows.filter(r => 
      !r.akumulasiTl01_90 && !r.tl91Plus && !r.psw01_90 && !r.psw91Plus && !r.tidakAbsen && !r.tdkMasukAtauIzin
    ).length;

    return {
      totalPegawai,
      avgHariKerja,
      countTerlambat,
      countPsw,
      countCuti,
      countDinasLuar,
      countDisiplinPenuh
    };
  }, [monthlyRows]);

  // Export Excel Rekap Bulanan Sesuai 17 Kolom Resmi
  const handleExportExcel = () => {
    const exportData = filteredMonthlyRows.map(r => ({
      'No': r.no,
      'Unit Kerja / Bagian': r.section,
      'Nama Pegawai': r.nama,
      'Hari Kerja Aktif': r.hariKerjaAktif,
      'Akumulasi TL 01-90': r.akumulasiTl01_90 || '-',
      'TL >90': r.tl91Plus || '-',
      'PSW 01-90': r.psw01_90 || '-',
      'PSW >90': r.psw91Plus || '-',
      'Tidak Absen / Lupa': r.tidakAbsen || '-',
      'Tdk Msk Kerja atau Izin': r.tdkMasukAtauIzin || '-',
      'Tidak Upacara / Apel': r.tidakUpacaraApel || '-',
      'Cuti Besar': r.cutiBesar || '-',
      'Cuti Alasan Penting / Bersalin': r.cutiAlasanPentingBersalin || '-',
      'Cuti Sakit Inap': r.cutiSakitInap || '-',
      'Ijin Sakit': r.ijinSakit || '-',
      'Cuti Sakit Ket.Dok': r.cutiSakitKetDok || '-',
      'Cuti Tahunan': r.cutiTahunan || '-',
      'Dinas Luar': r.dinasLuar || '-',
    }));
    exportToExcel(exportData, `Rekap_Kehadiran_BKHIT_PBD_${selectedMonth}_2026`);
  };

  const activeMonthMeta = MONTHLY_ABSENSI_SHEETS.find(m => m.key === selectedMonth) || MONTHLY_ABSENSI_SHEETS[7];
  const activeGid = activeMonthMeta.gid || (selectedMonth === 'AGUSTUS' ? ABSENSI_DEFAULT_GID : '0');
  const spreadsheetUrl = activeGid 
    ? `https://docs.google.com/spreadsheets/d/${ABSENSI_SPREADSHEET_ID}/edit?gid=${activeGid}#gid=${activeGid}`
    : `https://docs.google.com/spreadsheets/d/${ABSENSI_SPREADSHEET_ID}/edit`;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Banner Identitas Sheet 3 & Koneksi Google Spreadsheet */}
      <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-indigo-50/60 to-slate-50 p-4 md:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-lg shadow-sm shrink-0">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-bold text-slate-900">
                  Sheet 3: Absensi Bulanan & Rekapitulasi Tahunan
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-200 text-indigo-800 border border-indigo-300">
                  Mode: Baca Langsung (Read-Only)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-slate-700 border border-slate-200">
                  Tahun Berjalan 2026
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-3xl">
                Terkoneksi langsung ke Google Spreadsheet Absensi ID: <code className="bg-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded font-mono font-bold text-[11px]">{ABSENSI_SPREADSHEET_ID}</code> (Sheet aktif: <strong className="text-indigo-900">{activeMonthMeta.label}</strong>, GID: <code className="bg-indigo-100 text-indigo-900 px-1 py-0.5 rounded font-mono">{activeGid}</code>).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenAddRecap}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
              title="Input Presensi Pegawai Baru atau Catat Tambahan"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Input Presensi</span>
            </button>

            <button
              type="button"
              onClick={() => loadMonthData(selectedMonth)}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Perbarui data langsung dari Google Sheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Tarik Ulang Sheet</span>
            </button>

            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
              <span>Buka Google Sheet</span>
            </a>
          </div>
        </div>

        {/* Sync Metadata Strip */}
        <div className="mt-4 pt-3 border-t border-indigo-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sumber data: <strong className="uppercase text-slate-800 font-mono">{syncSource}</strong> (Google Sheets Visualization API)
            </span>
            <span>•</span>
            <span>Total Pegawai Terdata: <strong className="text-slate-900">{monthlyRows.length} Pegawai</strong></span>
          </div>
          {lastSyncTime && (
            <span className="text-[11px] text-slate-500">
              Waktu sinkronisasi: <strong>{lastSyncTime}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Navigasi Pilihan Bulan Tahun Berjalan 2026 */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Rekapitulasi Tiap Bulan pada Tahun Berjalan (2026):
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Pilih bulan untuk melihat rekapitulasi kehadiran resmi
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {MONTHLY_ABSENSI_SHEETS.map((m) => {
            const isActive = selectedMonth === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMonth(m.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{m.label}</span>
                {m.gid && (
                  <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'}`}>
                    GID:{m.gid.slice(0, 4)}..
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Mode Tampilan: Rekap Bulanan 17 Kolom vs Log Harian vs Ringkasan Tahunan */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('rekap')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'rekap'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Rekapitulasi 17 Kolom Resmi ({selectedMonth})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('tahunan')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'tahunan'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Matriks Tahunan Berjalan 2026</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('log_harian')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'log_harian'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Log Presensi Detail Harian</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 italic">
          Format data disinkronkan secara 1-to-1 dengan Spreadsheet BKHIT Papua Barat Daya
        </div>
      </div>

      {/* KPI Cards Ringkasan Bulan Terpilih */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Total Pegawai</span>
            <UserCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1.5">{monthlyStats.totalPegawai}</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Pegawai aktif di sheet</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Rata2 Hari Kerja</span>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-600 mt-1.5">{monthlyStats.avgHariKerja} <span className="text-xs font-normal">Hari</span></p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Hari kerja aktif bulan ini</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Disiplin Penuh</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-700 mt-1.5">{monthlyStats.countDisiplinPenuh}</p>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Nol TL / PSW / Cuti</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Terlambat (TL)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-600 mt-1.5">{monthlyStats.countTerlambat}</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Akumulasi TL 01-90 & {'>'}90</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Pulang Cepat (PSW)</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-rose-600 mt-1.5">{monthlyStats.countPsw}</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">PSW 01-90 & {'>'}90</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Cuti & Dinas Luar</span>
            <Plane className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-xl font-bold text-sky-600 mt-1.5">
            {monthlyStats.countCuti} / {monthlyStats.countDinasLuar}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Cuti / Dinas Luar</span>
        </div>
      </div>

      {/* VIEW MODE 1: REKAPITULASI 17 KOLOM RESMI BKHIT */}
      {viewMode === 'rekap' && (
        <div className="space-y-4">
          {/* Header Judul Laporan dari Spreadsheet */}
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-indigo-300 uppercase tracking-wider font-semibold block">
                Header Dokumen Spreadsheet:
              </span>
              <h2 className="text-sm md:text-base font-bold text-white tracking-wide">
                {sheetTitle}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
                Bulan: <strong>{activeMonthMeta.label}</strong>
              </span>
              <span className="bg-indigo-900/60 text-indigo-200 px-2.5 py-1 rounded-lg border border-indigo-700">
                17 Kolom Parameter Kehadiran
              </span>
            </div>
          </div>

          {/* Toolbar Filter & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Nama Pegawai atau Bagian..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-slate-700"
              >
                <option value="ALL">Semua Bagian / Satuan Kerja</option>
                {sectionList.filter(s => s !== 'ALL').map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>

              <select
                value={filterDisiplin}
                onChange={(e) => setFilterDisiplin(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-slate-700"
              >
                <option value="ALL">Semua Status Disiplin</option>
                <option value="DISIPLIN_PENUH">Disiplin Penuh (100% Kehadiran)</option>
                <option value="TERLAMBAT_PSW">Ada Keterlambatan (TL) / Pulang Cepat (PSW)</option>
                <option value="CUTI_SAKIT">Sedang Cuti / Izin Sakit</option>
                <option value="DINAS_LUAR">Sedang Dinas Luar</option>
                <option value="TIDAK_ABSEN">Ada Tidak Absen / Lupa Tap</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor Rekap 17 Kolom (.xlsx)</span>
            </button>
          </div>

          {/* Tabel 17 Kolom Resmi Presensi BKHIT Papua Barat Daya */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  {/* Grup Header Tingkat 1 */}
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider text-center">
                    <th className="py-2.5 px-2 w-10 border-r border-slate-200" rowSpan={2}>NO</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-left min-w-[200px]" rowSpan={2}>Nama Pegawai</th>
                    <th className="py-2.5 px-2 border-r border-slate-200 min-w-[70px]" rowSpan={2}>Hari Kerja Aktif</th>
                    <th className="py-2 px-2 border-r border-slate-200 bg-amber-50/70 text-amber-900" colSpan={2}>Keterlambatan (TL)</th>
                    <th className="py-2 px-2 border-r border-slate-200 bg-rose-50/70 text-rose-900" colSpan={2}>Pulang Cepat (PSW)</th>
                    <th className="py-2.5 px-2 border-r border-slate-200" rowSpan={2}>Tidak Absen / Lupa</th>
                    <th className="py-2.5 px-2 border-r border-slate-200" rowSpan={2}>Tdk Masuk / Izin</th>
                    <th className="py-2.5 px-2 border-r border-slate-200" rowSpan={2}>Tidak Upacara / Apel</th>
                    <th className="py-2 px-2 border-r border-slate-200 bg-indigo-50/70 text-indigo-900" colSpan={6}>Cuti & Sakit</th>
                    <th className="py-2.5 px-2 border-r border-slate-200 bg-sky-50 text-sky-900" rowSpan={2}>Dinas Luar</th>
                    <th className="py-2.5 px-2 text-center" rowSpan={2}>Aksi</th>
                  </tr>
                  {/* Sub Header Kolom Spesifik */}
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[9px] font-bold uppercase text-center">
                    <th className="py-2 px-2 border-r border-slate-200 bg-amber-50/40">TL 01-90</th>
                    <th className="py-2 px-2 border-r border-slate-200 bg-amber-50/40">TL {'>'}90</th>
                    <th className="py-2 px-2 border-r border-slate-200 bg-rose-50/40">PSW 01-90</th>
                    <th className="py-2 px-2 border-r border-slate-200 bg-rose-50/40">PSW {'>'}90</th>
                    <th className="py-2 px-1.5 border-r border-slate-200">Cuti Besar</th>
                    <th className="py-2 px-1.5 border-r border-slate-200">C. Penting / Bersalin</th>
                    <th className="py-2 px-1.5 border-r border-slate-200">Sakit Inap</th>
                    <th className="py-2 px-1.5 border-r border-slate-200">Ijin Sakit</th>
                    <th className="py-2 px-1.5 border-r border-slate-200">Sakit Ket.Dok</th>
                    <th className="py-2 px-1.5 border-r border-slate-200">Cuti Tahunan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={18} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        <span>Membaca data rekap kehadiran bulan {activeMonthMeta.label} dari Google Spreadsheet...</span>
                      </td>
                    </tr>
                  ) : filteredMonthlyRows.length === 0 ? (
                    <tr>
                      <td colSpan={18} className="py-12 text-center text-slate-400">
                        <span>Tidak ada data pegawai yang sesuai dengan filter pencarian.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredMonthlyRows.map((r, idx) => {
                      const hasDisciplineIssue = !!(r.akumulasiTl01_90 || r.tl91Plus || r.psw01_90 || r.psw91Plus || r.tidakAbsen || r.tdkMasukAtauIzin);
                      const hasLeave = !!(r.cutiTahunan || r.cutiBesar || r.cutiAlasanPentingBersalin || r.cutiSakitInap || r.ijinSakit || r.cutiSakitKetDok);
                      const hasDinas = !!r.dinasLuar;

                      return (
                        <tr 
                          key={idx}
                          onClick={() => setSelectedPegawai(r)}
                          className="hover:bg-indigo-50/40 transition-colors cursor-pointer"
                        >
                          <td className="py-2.5 px-2 text-center font-mono text-slate-400 border-r border-slate-100">
                            {r.no}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-900 border-r border-slate-100">
                            <div className="flex items-center justify-between gap-2">
                              <span>{r.nama}</span>
                              {!hasDisciplineIssue && !hasLeave && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Kehadiran Bersih / Disiplin Penuh" />
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800 border-r border-slate-100">
                            {r.hariKerjaAktif || '-'}
                          </td>
                          {/* TL 01-90 */}
                          <td className="py-2.5 px-2 text-center font-mono border-r border-slate-100">
                            {r.akumulasiTl01_90 ? (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                                {r.akumulasiTl01_90}m
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          {/* TL >90 */}
                          <td className="py-2.5 px-2 text-center font-mono border-r border-slate-100">
                            {r.tl91Plus ? (
                              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                                {r.tl91Plus}m
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          {/* PSW 01-90 */}
                          <td className="py-2.5 px-2 text-center font-mono border-r border-slate-100">
                            {r.psw01_90 ? (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                                {r.psw01_90}m
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          {/* PSW >90 */}
                          <td className="py-2.5 px-2 text-center font-mono border-r border-slate-100">
                            {r.psw91Plus ? (
                              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                                {r.psw91Plus}m
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          {/* Tidak Absen */}
                          <td className="py-2.5 px-2 text-center font-mono border-r border-slate-100 max-w-[100px] truncate" title={r.tidakAbsen}>
                            {r.tidakAbsen ? (
                              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold text-[10px]">
                                {r.tidakAbsen}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          {/* Tdk Masuk / Izin */}
                          <td className="py-2.5 px-2 text-center font-mono border-r border-slate-100">
                            {r.tdkMasukAtauIzin ? (
                              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-semibold text-[10px]">
                                {r.tdkMasukAtauIzin}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          {/* Tidak Upacara */}
                          <td className="py-2.5 px-2 text-center font-mono border-r border-slate-100">
                            {r.tidakUpacaraApel ? (
                              <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded font-semibold text-[10px]">
                                {r.tidakUpacaraApel}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          {/* Cuti Besar */}
                          <td className="py-2.5 px-1.5 text-center font-mono border-r border-slate-100">
                            {r.cutiBesar || <span className="text-slate-300">-</span>}
                          </td>
                          {/* Cuti Penting / Bersalin */}
                          <td className="py-2.5 px-1.5 text-center font-mono border-r border-slate-100">
                            {r.cutiAlasanPentingBersalin || <span className="text-slate-300">-</span>}
                          </td>
                          {/* Sakit Inap */}
                          <td className="py-2.5 px-1.5 text-center font-mono border-r border-slate-100">
                            {r.cutiSakitInap || <span className="text-slate-300">-</span>}
                          </td>
                          {/* Ijin Sakit */}
                          <td className="py-2.5 px-1.5 text-center font-mono border-r border-slate-100">
                            {r.ijinSakit || <span className="text-slate-300">-</span>}
                          </td>
                          {/* Sakit Ket Dok */}
                          <td className="py-2.5 px-1.5 text-center font-mono border-r border-slate-100">
                            {r.cutiSakitKetDok || <span className="text-slate-300">-</span>}
                          </td>
                          {/* Cuti Tahunan */}
                          <td className="py-2.5 px-1.5 text-center font-mono border-r border-slate-100">
                            {r.cutiTahunan ? (
                              <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[10px]">
                                {r.cutiTahunan}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          {/* Dinas Luar */}
                          <td className="py-2.5 px-2 text-center font-mono border-r border-slate-100">
                            {r.dinasLuar ? (
                              <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded font-bold text-[10px]">
                                {r.dinasLuar}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          {/* Aksi */}
                          <td className="py-2.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedPegawai(r)}
                                className="p-1 hover:bg-indigo-100 text-indigo-600 rounded cursor-pointer transition-colors"
                                title="Detail Parameter Kehadiran"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditRecap(r)}
                                className="p-1 hover:bg-amber-100 text-amber-600 rounded cursor-pointer transition-colors"
                                title="Akses Edit Presensi Pegawai Ini"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingRecap(r)}
                                className="p-1 hover:bg-rose-100 text-rose-600 rounded cursor-pointer transition-colors"
                                title="Hapus Baris Presensi Pegawai Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: MATRIKS TAHUNAN BERJALAN 2026 */}
      {viewMode === 'tahunan' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                Ringkasan Rekapitulasi Tahunan Berjalan (2026)
              </h2>
            </div>
            <p className="text-xs text-slate-600 mb-6">
              Seluruh sheet bulanan (Januari s/d Desember 2026 dan REKAP) terdaftar pada Google Spreadsheet ID: <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono font-bold">{ABSENSI_SPREADSHEET_ID}</code>. Klik bulan apa pun untuk memuat datanya secara instan:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {MONTHLY_ABSENSI_SHEETS.map((m) => {
                const isSelected = selectedMonth === m.key;
                return (
                  <div
                    key={m.key}
                    onClick={() => {
                      setSelectedMonth(m.key);
                      setViewMode('rekap');
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm">{m.label}</h3>
                      <CalendarCheck className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="mt-2 text-xs text-slate-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Target Sheet:</span>
                        <code className="font-mono text-indigo-900 font-semibold">{m.name}</code>
                      </div>
                      {m.gid && (
                        <div className="flex justify-between">
                          <span>GID Google:</span>
                          <code className="font-mono text-slate-700">{m.gid}</code>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-medium text-indigo-600">
                      <span>Buka Rekapitulasi</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: LOG HARIAN / UMUM */}
      {viewMode === 'log_harian' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Format Log Presensi Detail</h3>
                <p className="text-xs text-slate-500">Mencakup jam presensi masuk, jam pulang, dan lokasi presensi.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const exportData = dailyLogs.map(a => ({
                    NO: a.no,
                    'Unit Kerja': a.unitKerja,
                    'Nama Pegawai': a.namaPegawai,
                    'Tgl Presensi': a.tglPresensi,
                    'Presensi Masuk': a.presensiMasuk,
                    'Presensi Pulang': a.presensiPulang,
                    'Terlambat (Menit)': a.terlambatMenit,
                    'Pulang Cepat (Menit)': a.pulangSebelumWaktuMenit,
                    Lokasi: a.lokasi,
                    Status: a.status,
                  }));
                  exportToExcel(exportData, `Log_Presensi_Detail_${selectedMonth}_2026`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Ekspor Log Excel</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 w-10 text-center">NO</th>
                    <th className="py-3 px-3">Unit Kerja</th>
                    <th className="py-3 px-3">Nama Pegawai</th>
                    <th className="py-3 px-3 text-center">Presensi Masuk</th>
                    <th className="py-3 px-3 text-center">Presensi Pulang</th>
                    <th className="py-3 px-2 text-center">Terlambat</th>
                    <th className="py-3 px-2 text-center">Pulang Cepat</th>
                    <th className="py-3 px-3">Lokasi</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                  {dailyLogs.map((a, idx) => (
                    <tr 
                      key={a.id || idx}
                      className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedDailyLog(a)}
                    >
                      <td className="py-3 px-3 text-center font-mono text-slate-400">{a.no || idx + 1}</td>
                      <td className="py-3 px-3 text-slate-700 max-w-[180px] truncate" title={a.unitKerja}>{a.unitKerja}</td>
                      <td className="py-3 px-3 font-medium text-slate-900 whitespace-nowrap">{a.namaPegawai}</td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-800">{a.presensiMasuk}</td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-800">{a.presensiPulang}</td>
                      <td className="py-3 px-2 text-center font-mono font-bold">
                        {a.terlambatMenit > 0 ? (
                          <span className="text-amber-600">+{a.terlambatMenit}m</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center font-mono">
                        {a.pulangSebelumWaktuMenit > 0 ? (
                          <span className="text-rose-600">-{a.pulangSebelumWaktuMenit}m</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-[180px] truncate" title={a.lokasi}>{a.lokasi}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          a.status === 'Hadir' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : a.status === 'Terlambat'
                            ? 'bg-amber-100 text-amber-800'
                            : a.status === 'Dinas Luar'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedDailyLog(a)}
                          className="p-1 hover:bg-indigo-100 text-indigo-600 rounded cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL REKAP PEGAWAI */}
      {selectedPegawai && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selectedPegawai.nama}</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    No. Urut: {selectedPegawai.no} • Bagian: {selectedPegawai.section}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPegawai(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block">Periode Kehadiran</span>
                  <strong className="text-indigo-950 text-sm">Bulan : {activeMonthMeta.label}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Hari Kerja Aktif</span>
                  <strong className="text-emerald-700 text-base font-mono">{selectedPegawai.hariKerjaAktif} Hari</strong>
                </div>
              </div>

              {/* Grid Disiplin TL & PSW */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Disiplin Jam Kerja (Keterlambatan & Pulang Cepat):
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">TL 01-90 (Menit)</span>
                    <strong className="text-sm font-mono text-slate-900 block mt-0.5">
                      {selectedPegawai.akumulasiTl01_90 || '0'}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">TL {'>'}90 (Menit)</span>
                    <strong className="text-sm font-mono text-slate-900 block mt-0.5">
                      {selectedPegawai.tl91Plus || '0'}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">PSW 01-90 (Menit)</span>
                    <strong className="text-sm font-mono text-slate-900 block mt-0.5">
                      {selectedPegawai.psw01_90 || '0'}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">PSW {'>'}90 (Menit)</span>
                    <strong className="text-sm font-mono text-slate-900 block mt-0.5">
                      {selectedPegawai.psw91Plus || '0'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Grid Cuti & Izin */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Cuti, Sakit, dan Dinas Luar:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Cuti Tahunan</span>
                    <strong className="text-xs font-mono text-indigo-900 block mt-0.5">
                      {selectedPegawai.cutiTahunan || 'Nihil'}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Dinas Luar</span>
                    <strong className="text-xs font-mono text-sky-900 block mt-0.5">
                      {selectedPegawai.dinasLuar || 'Nihil'}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Tidak Absen / Lupa</span>
                    <strong className="text-xs font-mono text-purple-900 block mt-0.5">
                      {selectedPegawai.tidakAbsen || 'Nihil'}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Ijin / Ket. Sakit</span>
                    <strong className="text-xs font-mono text-slate-800 block mt-0.5">
                      {selectedPegawai.ijinSakit || selectedPegawai.cutiSakitKetDok || 'Nihil'}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Cuti Alasan Penting</span>
                    <strong className="text-xs font-mono text-slate-800 block mt-0.5">
                      {selectedPegawai.cutiAlasanPentingBersalin || 'Nihil'}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Cuti Besar</span>
                    <strong className="text-xs font-mono text-slate-800 block mt-0.5">
                      {selectedPegawai.cutiBesar || 'Nihil'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  const p = selectedPegawai;
                  setSelectedPegawai(null);
                  handleOpenEditRecap(p);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Presensi Pegawai Ini</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPegawai(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL LOG HARIAN */}
      {selectedDailyLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selectedDailyLog.namaPegawai}</h2>
                  <p className="text-xs text-slate-500">Unit: {selectedDailyLog.unitKerja}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDailyLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 block">Periode</span>
                  <strong className="text-slate-800 mt-0.5 block">{selectedDailyLog.tglPresensi}</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 block">Status Kehadiran</span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                    {selectedDailyLog.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 block">Presensi Masuk</span>
                  <strong className="text-slate-900 font-mono text-sm mt-0.5 block">{selectedDailyLog.presensiMasuk}</strong>
                  <span className="text-[10px] text-slate-400">Batas: {selectedDailyLog.batasPresensiMasuk}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 block">Presensi Pulang</span>
                  <strong className="text-slate-900 font-mono text-sm mt-0.5 block">{selectedDailyLog.presensiPulang}</strong>
                  <span className="text-[10px] text-slate-400">Batas: {selectedDailyLog.batasPresensiPulang}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 block">Terlambat</span>
                  <strong className="text-amber-600 font-mono text-sm mt-0.5 block">{selectedDailyLog.terlambatMenit} Menit</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 block">Pulang Cepat</span>
                  <strong className="text-rose-600 font-mono text-sm mt-0.5 block">{selectedDailyLog.pulangSebelumWaktuMenit} Menit</strong>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-slate-500 block">Lokasi Presensi</span>
                <div className="flex items-center gap-1.5 text-slate-800 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedDailyLog.lokasi}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDailyLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL INPUT / EDIT PRESENSI (AKSES EDIT SHEET 3) */}
      {(editingRecap || isAddRecapOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {isAddRecapOpen ? 'Input Data Presensi Baru (Sheet 3)' : `Akses Edit Presensi: ${editingRecap?.nama}`}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Rekapitulasi 17 Kolom Absensi Bulan {selectedMonth} 2026
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingRecap(null);
                  setIsAddRecapOpen(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecap} className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nama Pegawai</label>
                  <input
                    type="text"
                    required
                    value={recapForm.nama}
                    onChange={(e) => setRecapForm({ ...recapForm, nama: e.target.value })}
                    placeholder="Nama Lengkap Pegawai..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hari Kerja Aktif</label>
                  <input
                    type="number"
                    min={0}
                    max={31}
                    required
                    value={recapForm.hariKerjaAktif}
                    onChange={(e) => setRecapForm({ ...recapForm, hariKerjaAktif: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cuti Tahunan (Hari)</label>
                  <input
                    type="text"
                    value={recapForm.cutiTahunan}
                    onChange={(e) => setRecapForm({ ...recapForm, cutiTahunan: e.target.value })}
                    placeholder="Contoh: 2 atau kosong"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-xs"
                  />
                </div>
              </div>

              {/* Keterlambatan (TL) */}
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-2">
                <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wide">
                  Terlambat Datang (TL)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Akumulasi TL 01-90 (Menit)</label>
                    <input
                      type="number"
                      min={0}
                      value={recapForm.akumulasiTl01_90}
                      onChange={(e) => setRecapForm({ ...recapForm, akumulasiTl01_90: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">TL {'>'} 90 Menit</label>
                    <input
                      type="number"
                      min={0}
                      value={recapForm.tl91Plus}
                      onChange={(e) => setRecapForm({ ...recapForm, tl91Plus: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Pulang Sebelum Waktu (PSW) */}
              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 space-y-2">
                <span className="font-bold text-rose-900 block text-[11px] uppercase tracking-wide">
                  Pulang Sebelum Waktu (PSW)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">PSW 01-90 (Menit)</label>
                    <input
                      type="number"
                      min={0}
                      value={recapForm.psw01_90}
                      onChange={(e) => setRecapForm({ ...recapForm, psw01_90: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">PSW {'>'} 90 Menit</label>
                    <input
                      type="number"
                      min={0}
                      value={recapForm.psw91Plus}
                      onChange={(e) => setRecapForm({ ...recapForm, psw91Plus: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Izin, Ketidakhadiran, & Dinas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tidak Absen (Masuk/Plg)</label>
                  <input
                    type="text"
                    value={recapForm.tidakAbsen}
                    onChange={(e) => setRecapForm({ ...recapForm, tidakAbsen: e.target.value })}
                    placeholder="Contoh: 1x Lupa Pagi"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tidak Masuk / Izin</label>
                  <input
                    type="text"
                    value={recapForm.tdkMasukAtauIzin}
                    onChange={(e) => setRecapForm({ ...recapForm, tdkMasukAtauIzin: e.target.value })}
                    placeholder="Contoh: 1 Hari Izin"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dinas Luar</label>
                  <input
                    type="text"
                    value={recapForm.dinasLuar}
                    onChange={(e) => setRecapForm({ ...recapForm, dinasLuar: e.target.value })}
                    placeholder="Contoh: 3 Hari"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ijin Sakit / Ket. Dokter</label>
                  <input
                    type="text"
                    value={recapForm.ijinSakit}
                    onChange={(e) => setRecapForm({ ...recapForm, ijinSakit: e.target.value })}
                    placeholder="Contoh: 2 Hari"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRecap(null);
                    setIsAddRecapOpen(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isAddRecapOpen ? 'Simpan Presensi' : 'Update Presensi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Konfirmasi Hapus Rekap Presensi */}
      {deletingRecap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Rekap Presensi</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data presensi untuk <strong className="text-slate-900">{deletingRecap.nama}</strong> pada bulan <strong className="text-slate-900">{selectedMonth} 2026</strong>?
                </p>
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeletingRecap(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteRecap}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Data</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
