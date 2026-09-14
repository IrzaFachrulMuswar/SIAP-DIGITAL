import React from 'react';
import { 
  Users, 
  CalendarCheck, 
  FileText, 
  WalletCards, 
  Download, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  FileSpreadsheet, 
  Database,
  Building,
  Award,
  AlertCircle
} from 'lucide-react';
import { 
  Employee, 
  MonthlyAttendance, 
  CutiBKNRecord, 
  PerbendaharaanRecord, 
  KGBRecord,
  PerjalananDinasRecord 
} from '../types';
import { formatRupiah, exportToExcel, exportEmployeeListPDF, exportPerbendaharaanPDF } from '../utils/exportUtils';

interface DashboardViewProps {
  employees: Employee[];
  attendances: MonthlyAttendance[];
  cutiList: CutiBKNRecord[];
  perbendaharaanList: PerbendaharaanRecord[];
  kgbList: KGBRecord[];
  sppdList: PerjalananDinasRecord[];
  onNavigateTab: (tabId: any) => void;
  onOpenSync: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  attendances,
  cutiList,
  perbendaharaanList,
  kgbList,
  sppdList,
  onNavigateTab,
  onOpenSync,
}) => {
  // Aggregate Metrics
  const totalEmployees = employees.length;
  const pnsCount = employees.filter(e => e.statusPegawai === 'PNS').length;
  const pppkCount = employees.filter(e => e.statusPegawai === 'PPPK').length;

  const latestAttendance = attendances[0] || { persentaseKehadiran: 96.8, totalPegawai: 185 };
  const pendingCuti = cutiList.filter(c => c.statusFinal.includes('Menunggu') || c.statusFinal === 'Disetujui');
  const pendingKgb = kgbList.filter(k => k.status === 'Menunggu Verifikasi' || k.status === 'Diverifikasi');

  const totalRealisasiSP2D = perbendaharaanList
    .filter(p => p.status === 'Cair ke Rekening')
    .reduce((sum, p) => sum + p.nilaiRupiah, 0);

  const totalSPPD = sppdList.reduce((sum, s) => sum + s.rincianBiaya.totalBiaya, 0);

  // Quick Excel Export for Audit
  const handleExportAllAuditExcel = () => {
    const exportData = employees.map(e => ({
      NIP: e.nip,
      Nama: `${e.gelarDepan || ''} ${e.nama} ${e.gelarBelakang || ''}`.trim(),
      Pangkat_Golongan: e.pangkatGolongan,
      Jabatan: e.jabatan,
      Unit_Kerja: e.unitKerja,
      Status_Pegawai: e.statusPegawai,
      Pendidikan: e.pendidikanTerakhir,
      Gaji_Pokok: e.gajiPokok,
      Sisa_Cuti_N: e.sisaCutiN,
      Jumlah_Dokumen: e.dokumen.length
    }));
    exportToExcel(exportData, 'Data Pegawai Audit', 'Laporan_Audit_Kepegawaian_2026');
  };

  const handleExportKeuanganExcel = () => {
    const exportData = perbendaharaanList.map(p => ({
      Nomor_Dokumen: p.nomorDokumen,
      Jenis: p.jenis,
      Tipe: p.tipePembayaran,
      Tanggal: p.tanggalDokumen,
      Uraian: p.uraian,
      Penerima: p.namaPenerima,
      Nilai_Rupiah: p.nilaiRupiah,
      Nomor_SP2D: p.nomorSP2DRef || '-',
      Status_Pencairan: p.status
    }));
    exportToExcel(exportData, 'Realisasi SP2D', 'Laporan_Audit_Keuangan_SP2D');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Summary */}
      <div className="rounded-xl bg-[#1E293B] border border-slate-700/60 p-6 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 mb-2">
              <Building className="h-3.5 w-3.5 text-indigo-400" /> Portal Administrasi SDM & Perbendaharaan Negara
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Dasbor Rekapitulasi Data Terpadu
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pemantauan real-time status kepegawaian, pengajuan cuti Perka BKN No. 24/2017, kenaikan pangkat & gaji, serta realisasi SPP/SPM/SP2D keuangan satuan kerja.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportAllAuditExcel}
              className="flex items-center gap-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Ekspor Excel Audit</span>
            </button>
            <button
              type="button"
              onClick={() => exportEmployeeListPDF(employees)}
              className="flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-sm cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Cetak PDF Audit</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pegawai */}
        <div 
          onClick={() => onNavigateTab('pegawai')}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase mb-1">Total Pegawai</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{totalEmployees}</span>
              <span className="text-xs font-medium text-slate-400">Pegawai Aktif</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">{pnsCount} PNS</span>
              <span className="rounded bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">{pppkCount} PPPK</span>
            </div>
          </div>
        </div>

        {/* Card 2: Kehadiran Bulanan */}
        <div 
          onClick={() => onNavigateTab('absensi')}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase mb-1">Kehadiran Presensi</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CalendarCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{latestAttendance.persentaseKehadiran}%</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center">
                <ArrowUpRight className="h-3.5 w-3.5" /> +0.9%
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 truncate">
              Bulan {latestAttendance.namaBulan} (Biometrik)
            </p>
          </div>
        </div>

        {/* Card 3: Cuti BKN & KGB */}
        <div 
          onClick={() => onNavigateTab('cuti')}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase mb-1">Pengajuan Cuti</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <FileText className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{cutiList.length}</span>
              <span className="text-xs font-medium text-slate-400">Berkas BKN</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Perka BKN No. 24/2017 Terverifikasi
            </p>
          </div>
        </div>

        {/* Card 4: SP2D Keuangan Cair */}
        <div 
          onClick={() => onNavigateTab('perbendaharaan')}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase mb-1">SP2D Kas Cair</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <WalletCards className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-900 truncate">
                {formatRupiah(totalRealisasiSP2D)}
              </span>
            </div>
            <p className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Terbit KPPN & SAKTI
            </p>
          </div>
        </div>
      </div>

      {/* Google Spreadsheet Database Live Preview Banner */}
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-slate-50 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Database Google Spreadsheet (Live Terintegrasi)
                </h3>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Terbaca di Preview
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Basis data tersimpan pada Google Sheets dengan izin OAuth resmi (Drive & Spreadsheets). Data terbaca dua arah secara real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('sheets_db')}
              className="flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Database className="h-3.5 w-3.5" />
              <span>Buka Database Google Sheets</span>
            </button>
          </div>
        </div>

        {/* Quick Sheet Tables pill bar */}
        <div className="mt-4 pt-3 border-t border-emerald-100/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Tabel Aktif:</span>
          <div 
            onClick={() => onNavigateTab('sheets_db')}
            className="flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-2.5 py-1 text-slate-700 hover:border-emerald-300 transition-colors cursor-pointer"
          >
            <span className="font-semibold text-[11px]">Data_Pegawai</span>
            <span className="rounded bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 text-[10px]">{totalEmployees}</span>
          </div>
          <div 
            onClick={() => onNavigateTab('sheets_db')}
            className="flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-2.5 py-1 text-slate-700 hover:border-emerald-300 transition-colors cursor-pointer"
          >
            <span className="font-semibold text-[11px]">Pengajuan_Cuti</span>
            <span className="rounded bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 text-[10px]">{cutiList.length}</span>
          </div>
          <div 
            onClick={() => onNavigateTab('sheets_db')}
            className="flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-2.5 py-1 text-slate-700 hover:border-emerald-300 transition-colors cursor-pointer"
          >
            <span className="font-semibold text-[11px]">KGB_Berkala</span>
            <span className="rounded bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 text-[10px]">{kgbList.length}</span>
          </div>
          <div 
            onClick={() => onNavigateTab('sheets_db')}
            className="flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-2.5 py-1 text-slate-700 hover:border-emerald-300 transition-colors cursor-pointer"
          >
            <span className="font-semibold text-[11px]">Absensi_Bulanan</span>
            <span className="rounded bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 text-[10px]">{attendances.length}</span>
          </div>
          <div 
            onClick={() => onNavigateTab('sheets_db')}
            className="flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-2.5 py-1 text-slate-700 hover:border-emerald-300 transition-colors cursor-pointer"
          >
            <span className="font-semibold text-[11px]">SPPD_Dinas</span>
            <span className="rounded bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 text-[10px]">{sppdList.length}</span>
          </div>
        </div>
      </div>

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Performance Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">Grafik Tren Performa & Kehadiran Bulanan</h3>
              <p className="text-xs text-slate-500">
                Data presensi biometrik & kepatuhan jam kerja ASN tahun berjalan
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                <span className="h-2 w-2 rounded-full bg-indigo-600" /> Presensi Hadir
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                <span className="h-2 w-2 rounded-full bg-slate-500" /> Cuti / Dinas Luar
              </span>
            </div>
          </div>

          {/* Visual Bar Graph */}
          <div className="mt-6 space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {attendances.map((att) => {
              const hadirPercent = att.persentaseKehadiran;
              const sakitIzinPercent = Number(((att.rekapSakit + att.rekapIzin) / att.rekapHadir * 100).toFixed(1));
              const cutiDlPercent = Number(((att.rekapCuti + att.rekapDinasLuar) / att.rekapHadir * 100).toFixed(1));

              return (
                <div key={att.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{att.namaBulan}</span>
                    <span className="font-mono font-bold text-indigo-600">{hadirPercent}% Kehadiran</span>
                  </div>
                  <div className="flex h-4 w-full rounded bg-slate-100 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-500"
                      style={{ width: `${hadirPercent}%` }}
                      title={`Hadir: ${att.rekapHadir} sesi`}
                    />
                    <div
                      className="bg-amber-400 h-full transition-all duration-500"
                      style={{ width: `${sakitIzinPercent}%` }}
                      title={`Sakit/Izin: ${att.rekapSakit + att.rekapIzin}`}
                    />
                    <div
                      className="bg-slate-400 h-full transition-all duration-500"
                      style={{ width: `${cutiDlPercent}%` }}
                      title={`Cuti/DL: ${att.rekapCuti + att.rekapDinasLuar}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Hadir: <b>{att.rekapHadir}</b> | Sakit: <b>{att.rekapSakit}</b> | Izin: <b>{att.rekapIzin}</b></span>
                    <span>Cuti: <b>{att.rekapCuti}</b> | Dinas Luar: <b>{att.rekapDinasLuar}</b></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional Quick Stats Grid */}
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
              <span className="text-[11px] text-slate-500">Total Hari Kerja (2026)</span>
              <p className="text-base font-bold text-slate-800">
                {attendances.filter(a => a.tahun === 2026).reduce((acc, a) => acc + a.totalHariKerja, 0)} Hari
              </p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-100">
              <span className="text-[11px] text-emerald-700">Rata-rata Disiplin</span>
              <p className="text-base font-bold text-emerald-800">
                {attendances.length > 0
                  ? (attendances.reduce((acc, a) => acc + a.persentaseKehadiran, 0) / attendances.length).toFixed(1)
                  : '97.3'}%
              </p>
            </div>
            <div className="rounded-lg bg-indigo-50 p-3 border border-indigo-100">
              <span className="text-[11px] text-indigo-700">Bulan Terdata</span>
              <p className="text-base font-bold text-indigo-800">{attendances.length} Periode</p>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Keuangan Realisasi & Quick Actions */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Realisasi Anggaran Kas</h3>
              <button 
                onClick={handleExportKeuanganExcel}
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="h-3 w-3" /> Excel
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Pagu Belanja Total</span>
                  <span className="font-bold text-slate-800">{formatRupiah(500000000)}</span>
                </div>
                <div className="mt-2 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${(totalRealisasiSP2D / 500000000) * 100}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px]">
                  <span className="text-emerald-700 font-semibold">
                    Tercairkan: {((totalRealisasiSP2D / 500000000) * 100).toFixed(1)}%
                  </span>
                  <span className="text-slate-500 font-mono">
                    Sisa: {formatRupiah(500000000 - totalRealisasiSP2D)}
                  </span>
                </div>
              </div>

              {/* SPPD & Lembur Quick summary */}
              <div className="p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-600" /> Perjalanan Dinas (SPD)
                  </span>
                  <span className="font-bold text-slate-800">{formatRupiah(totalSPPD)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-600" /> Pengajuan Lembur
                  </span>
                  <span className="font-bold text-slate-800">{formatRupiah(285500)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Export Cards */}
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Ekspor Laporan Audit Cepat:
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => exportEmployeeListPDF(employees)}
                className="flex items-center justify-center gap-1.5 p-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-xs font-semibold text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" /> PDF Pegawai
              </button>
              <button
                type="button"
                onClick={() => exportPerbendaharaanPDF(perbendaharaanList)}
                className="flex items-center justify-center gap-1.5 p-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" /> PDF SP2D
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Submissions & Approvals */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">Status Terkini Pengajuan Kepegawaian & SP2D</h3>
            <p className="text-xs text-slate-500">
              Daftar pengajuan cuti, KGB, dan pencairan kas yang dipantau real-time
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('cuti')}
            className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Lihat Semua Pengajuan &rarr;
          </button>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {cutiList.map((cuti) => (
            <div key={cuti.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {cuti.employeeName} ({cuti.jenisCuti})
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {cuti.lamaHari} hari kerja ({cuti.tanggalMulai} s.d {cuti.tanggalSelesai}) &bull; No: {cuti.noPermohonan}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> {cuti.statusFinal}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('cuti')}
                  className="text-xs font-semibold text-slate-600 hover:text-indigo-600 underline cursor-pointer"
                >
                  Detail
                </button>
              </div>
            </div>
          ))}

          {perbendaharaanList.slice(0, 2).map((pb) => (
            <div key={pb.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                  <WalletCards className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {pb.jenis} - {pb.uraian}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">
                    {pb.nomorDokumen} &bull; {pb.namaPenerima} &bull; {formatRupiah(pb.nilaiRupiah)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                  <Clock className="h-3 w-3" /> {pb.status}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('perbendaharaan')}
                  className="text-xs font-semibold text-slate-600 hover:text-indigo-600 underline cursor-pointer"
                >
                  Buka
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
