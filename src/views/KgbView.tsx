import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  FileText, 
  X, 
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Calendar,
  DollarSign,
  Bell,
  Clock,
  Sparkles,
  Printer,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { KGBRecord, StatusKGB, Employee } from '../types';
import { formatRupiah, exportToExcel, exportKGBRemindersPDF } from '../utils/exportUtils';
import { 
  KGBSpreadsheetItem, 
  KGB_SPREADSHEET_ID, 
  KGB_SPREADSHEET_URL, 
  initialKGBSpreadsheetData, 
  calculateKGBProgression, 
  fetchLiveKGBSpreadsheet 
} from '../data/kgbSpreadsheetData';

interface KgbViewProps {
  kgbList: KGBRecord[];
  employees: Employee[];
  onAddKGB: (record: KGBRecord) => void;
  onUpdateKGB: (record: KGBRecord) => void;
  onDeleteKGB: (id: string) => void;
  onRequest2FA: (title: string, action: () => void) => void;
}

export const KgbView: React.FC<KgbViewProps> = ({
  kgbList,
  employees,
  onAddKGB,
  onUpdateKGB,
  onDeleteKGB,
  onRequest2FA,
}) => {
  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'pengingat_spreadsheet' | 'berkas_lokal'>('pengingat_spreadsheet');

  // Spreadsheet Data State
  const [spreadsheetData, setSpreadsheetData] = useState<KGBSpreadsheetItem[]>(() => {
    try {
      const saved = localStorage.getItem('kgb_spreadsheet_data_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return initialKGBSpreadsheetData;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('kgb_last_sync_time') || 'Data Tersimpan (Spreadsheet ID: 1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M)';
  });

  // Filters for Spreadsheet Tab
  const [search, setSearch] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'CRITICAL' | '2026' | '2027' | 'FUTURE'>('ALL');
  const [filterSatker, setFilterSatker] = useState<string>('ALL');

  // Filters for Local KGB Tab
  const [localSearch, setLocalSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<KGBRecord>>({
    employeeId: '',
    employeeName: '',
    nip: '',
    jabatan: '',
    pangkatGolongan: 'Penata Muda / III/a',
    unitKerja: 'Balai Karantina Hewan, Ikan, dan Tumbuhan',
    masaKerjaTahun: 2,
    masaKerjaBulan: 0,
    gajiLama: 3000000,
    gajiBaru: 3250000,
    tmtGajiLama: '2024-04-01',
    tmtGajiBaru: '2026-04-01',
    tmtKGBBerikutnya: '2028-04-01',
    noSK: '',
    tanggalSK: '',
    pejabatPenetap: 'Kepala Balai Karantina Hewan, Ikan, dan Tumbuhan',
    status: 'Menunggu Verifikasi',
    catatan: 'Usulan kenaikan gaji berkala 2 tahun sesuai PP No. 5 Tahun 2024.',
  });

  // Hitung otomatis data kenaikan gaji untuk seluruh pegawai
  const calculatedItems = useMemo(() => {
    return spreadsheetData.map((item) => calculateKGBProgression(item));
  }, [spreadsheetData]);

  // Statistik & Metrik Pengingat
  const metrics = useMemo(() => {
    const total = calculatedItems.length;
    const critical = calculatedItems.filter((c) => c.urgencyLevel === 'CRITICAL' || c.daysRemaining <= 90).length;
    const year2026 = calculatedItems.filter((c) => c.effectiveCurrentKGBDate.includes('2026')).length;
    const year2027 = calculatedItems.filter((c) => c.effectiveCurrentKGBDate.includes('2027')).length;
    const future2Year = calculatedItems.filter((c) => {
      const yr = parseInt(c.effectiveNextKGBDate.slice(-4), 10);
      return yr >= 2028;
    }).length;

    return { total, critical, year2026, year2027, future2Year };
  }, [calculatedItems]);

  // Daftar pegawai jatuh tempo paling mendesak untuk Alert Banner
  const urgentReminders = useMemo(() => {
    return [...calculatedItems]
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 3);
  }, [calculatedItems]);

  // Satuan Pelayanan unik
  const satkerOptions = useMemo(() => {
    const set = new Set<string>();
    spreadsheetData.forEach((s) => {
      if (s.satuanPelayanan) set.add(s.satuanPelayanan);
    });
    return Array.from(set);
  }, [spreadsheetData]);

  // Filter items
  const filteredCalculatedItems = useMemo(() => {
    return calculatedItems.filter((item) => {
      const q = search.toLowerCase();
      const matchText =
        item.item.nama.toLowerCase().includes(q) ||
        item.item.nip.toLowerCase().includes(q) ||
        item.item.jabatan.toLowerCase().includes(q) ||
        item.item.pangkat.toLowerCase().includes(q) ||
        item.item.satuanPelayanan.toLowerCase().includes(q);

      if (!matchText) return false;

      if (filterSatker !== 'ALL' && item.item.satuanPelayanan !== filterSatker) {
        return false;
      }

      if (urgencyFilter === 'CRITICAL') {
        return item.urgencyLevel === 'CRITICAL' || item.daysRemaining <= 90;
      }
      if (urgencyFilter === '2026') {
        return item.effectiveCurrentKGBDate.includes('2026');
      }
      if (urgencyFilter === '2027') {
        return item.effectiveCurrentKGBDate.includes('2027');
      }
      if (urgencyFilter === 'FUTURE') {
        return item.effectiveNextKGBDate.includes('2028') || item.effectiveNextKGBDate.includes('2029');
      }

      return true;
    });
  }, [calculatedItems, search, urgencyFilter, filterSatker]);

  // Filter Local KGB
  const filteredLocalKGB = useMemo(() => {
    return kgbList.filter((k) => {
      const matchesSearch =
        k.employeeName.toLowerCase().includes(localSearch.toLowerCase()) ||
        k.nip.toLowerCase().includes(localSearch.toLowerCase()) ||
        (k.noSK && k.noSK.toLowerCase().includes(localSearch.toLowerCase()));

      const matchesStatus = filterStatus === 'ALL' || k.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [kgbList, localSearch, filterStatus]);

  // Sinkronisasi Live dengan Google Sheets
  const handleSyncSpreadsheet = async () => {
    setIsSyncing(true);
    try {
      const freshData = await fetchLiveKGBSpreadsheet(KGB_SPREADSHEET_ID);
      if (freshData && freshData.length > 0) {
        setSpreadsheetData(freshData);
        localStorage.setItem('kgb_spreadsheet_data_cache', JSON.stringify(freshData));
        const timeStr = `Sinkronisasi Live: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB`;
        setLastSyncTime(timeStr);
        localStorage.setItem('kgb_last_sync_time', timeStr);
      }
    } catch (err) {
      console.error('Failed to sync KGB spreadsheet:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Buat usulan / SK KGB langsung dari baris spreadsheet
  const handleProsesSKFromSpreadsheet = (calculated: ReturnType<typeof calculateKGBProgression>) => {
    const emp = calculated.item;
    const matchEmp = employees.find((e) => e.nip.replace(/\s+/g, '') === emp.nip.replace(/\s+/g, ''));

    // Format tanggal ISO dari teks
    const tmtGajiBaruISO = new Date().toISOString().slice(0, 10);
    const nextYear = new Date().getFullYear() + 2;
    const tmtBerikutnyaISO = `${nextYear}-04-01`;

    setIsEditing(false);
    setSelectedFile(null);

    setFormData({
      employeeId: matchEmp?.id || `EMP-${emp.nip.slice(-4)}`,
      employeeName: emp.nama,
      nip: emp.nip,
      jabatan: emp.jabatan,
      pangkatGolongan: emp.pangkat,
      unitKerja: emp.satuanPelayanan || 'Balai Karantina Hewan, Ikan, dan Tumbuhan',
      masaKerjaTahun: parseInt(calculated.nextMasaKerja, 10) || 4,
      masaKerjaBulan: 0,
      gajiLama: calculated.gajiPokokLama,
      gajiBaru: calculated.gajiPokokBaru,
      tmtGajiLama: calculated.effectiveCurrentKGBDate,
      tmtGajiBaru: tmtGajiBaruISO,
      tmtKGBBerikutnya: tmtBerikutnyaISO,
      noSK: `822/KGB/BKHT/${new Date().getFullYear()}/${emp.no || '01'}`,
      tanggalSK: new Date().toISOString().slice(0, 10),
      pejabatPenetap: 'Kepala Balai Karantina Hewan, Ikan, dan Tumbuhan',
      status: 'Menunggu Verifikasi',
      catatan: `Penghitung otomatis KGB 2 tahun berikutnya: Masa kerja ${calculated.nextMasaKerja}, TMT berikutnya: ${calculated.effectiveNextKGBDate}. Berkas Drive: ${emp.linkDrive || '-'}`,
    });

    setIsModalOpen(true);
  };

  const handleOpenAddManual = () => {
    setIsEditing(false);
    setSelectedFile(null);
    const firstEmp = employees[0];
    setFormData({
      employeeId: firstEmp?.id || '',
      employeeName: firstEmp?.nama || '',
      nip: firstEmp?.nip || '',
      jabatan: firstEmp?.jabatan || '',
      pangkatGolongan: firstEmp?.pangkatGolongan || 'Penata Muda / III/a',
      unitKerja: firstEmp?.unitKerja || 'Balai Karantina Hewan, Ikan, dan Tumbuhan',
      masaKerjaTahun: 4,
      masaKerjaBulan: 0,
      gajiLama: firstEmp?.gajiPokok || 3200000,
      gajiBaru: Math.round((firstEmp?.gajiPokok || 3200000) * 1.06),
      tmtGajiLama: '2024-04-01',
      tmtGajiBaru: '2026-04-01',
      tmtKGBBerikutnya: '2028-04-01',
      noSK: '',
      tanggalSK: '',
      pejabatPenetap: 'Kepala Balai Karantina Hewan, Ikan, dan Tumbuhan',
      status: 'Menunggu Verifikasi',
      catatan: 'Memenuhi syarat masa kerja 2 tahun dan SKP bernilai Baik.',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (kgb: KGBRecord) => {
    setIsEditing(true);
    setFormData({ ...kgb });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeName || !formData.nip) {
      alert('Pilih pegawai terlebih dahulu.');
      return;
    }

    const payload: KGBRecord = {
      ...(formData as KGBRecord),
      id: isEditing && formData.id ? formData.id : `KGB-${Date.now().toString().slice(-4)}`,
      dokumenSKName: selectedFile ? selectedFile.name : formData.dokumenSKName,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    if (payload.status === 'SK Diterbitkan') {
      onRequest2FA('Penerbitan SK Kenaikan Gaji Berkala (KGB)', () => {
        if (isEditing) {
          onUpdateKGB(payload);
        } else {
          onAddKGB(payload);
        }
        setIsModalOpen(false);
      });
    } else {
      if (isEditing) {
        onUpdateKGB(payload);
      } else {
        onAddKGB(payload);
      }
      setIsModalOpen(false);
    }
  };

  // Ekspor Excel Rekap Pengingat KGB
  const handleExportExcelKGB = () => {
    const data = calculatedItems.map((c) => ({
      No: c.item.no,
      NIP: c.item.nip,
      Nama_Pegawai: c.item.nama,
      Pangkat_Golongan: c.item.pangkat,
      Satuan_Pelayanan: c.item.satuanPelayanan,
      Masa_Kerja_Saat_Ini: c.item.masaKerja,
      TMT_KGB_Saat_Ini: c.effectiveCurrentKGBDate,
      TMT_KGB_2Tahun_Kedepan: c.effectiveNextKGBDate,
      Masa_Kerja_2Tahun_Kedepan: c.nextMasaKerja,
      Gaji_Pokok_Lama: c.gajiPokokLama,
      Gaji_Pokok_Baru_PP5: c.gajiPokokBaru,
      Selisih_Kenaikan_Bulan: c.selisihKenaikan,
      Sisa_Hari: c.daysRemaining,
      Status_Pengingat: c.statusBadge,
      Link_Berkas_Drive: c.item.linkDrive || '',
    }));
    exportToExcel(data, 'Pengingat KGB 2 Tahun', `Pengingat_KGB_2Tahun_${new Date().toISOString().slice(0, 10)}`);
  };

  // Ekspor PDF Rekap Pengingat KGB
  const handleExportPDFKGB = () => {
    const pdfData = calculatedItems.map((c) => ({
      no: c.item.no,
      nama: c.item.nama,
      nip: c.item.nip,
      pangkat: c.item.pangkat,
      jabatan: c.item.jabatan,
      masaKerjaSaatIni: c.item.masaKerja,
      tmtKGBSaatIni: c.effectiveCurrentKGBDate,
      tmtKGBBerikutnya: c.effectiveNextKGBDate,
      masaKerjaBerikutnya: c.nextMasaKerja,
      gajiLama: c.gajiPokokLama,
      gajiBaru: c.gajiPokokBaru,
      selisih: c.selisihKenaikan,
      statusPengingat: c.statusBadge,
    }));
    exportKGBRemindersPDF(pdfData);
  };

  return (
    <div className="space-y-6">
      {/* Header Utama */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-600" /> Kenaikan Gaji Berkala (KGB)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistem pengingat dini dan penghitung otomatis kenaikan gaji berkala selanjutnya pada dua tahun ke depan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcelKGB}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>
          <button
            type="button"
            onClick={handleExportPDFKGB}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-blue-600" />
            <span>Cetak Jadwal PDF</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAddManual}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Usulkan KGB Baru</span>
          </button>
        </div>
      </div>

      {/* Navigasi Tab */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('pengingat_spreadsheet')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'pengingat_spreadsheet'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="h-4 w-4 text-emerald-600" />
          <span>Pengingat & Penghitung Otomatis KGB (Google Sheets)</span>
          <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
            {calculatedItems.length} Pegawai
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('berkas_lokal')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'berkas_lokal'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="h-4 w-4 text-slate-500" />
          <span>Daftar Berkas & SK KGB Diterbitkan</span>
          <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-bold">
            {kgbList.length} SK
          </span>
        </button>
      </div>

      {activeTab === 'pengingat_spreadsheet' ? (
        <div className="space-y-6">
          {/* Status Bar Google Spreadsheet */}
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start md:items-center gap-3">
              <div className="rounded-xl bg-emerald-600 p-2.5 text-white shadow-sm shrink-0">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    Database Google Spreadsheet KGB Terhubung
                  </h4>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Connected
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-600">
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                    ID: {KGB_SPREADSHEET_ID}
                  </span>
                  <span>&bull;</span>
                  <span>{lastSyncTime}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={KGB_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                <span>Buka Spreadsheet</span>
              </a>
              <button
                type="button"
                onClick={handleSyncSpreadsheet}
                disabled={isSyncing}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Segarkan Data'}</span>
              </button>
            </div>
          </div>

          {/* 4 Kartu Metrik Analitik */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total ASN Terdaftar</span>
                <span className="rounded-lg bg-slate-100 p-2 text-slate-600">
                  <UserCheck className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.total} <span className="text-xs font-normal text-slate-500">Pegawai</span></p>
              <p className="mt-1 text-[11px] text-slate-500">Balai Karantina Hewan, Ikan, & Tumbuhan</p>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/30 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-700">Jatuh Tempo Segera</span>
                <span className="rounded-lg bg-rose-100 p-2 text-rose-700">
                  <AlertCircle className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-rose-700">{metrics.critical} <span className="text-xs font-normal text-rose-600">Pegawai</span></p>
              <p className="mt-1 text-[11px] text-rose-600 font-medium">Perlu penyiapan SK KGB (≤ 90 hari)</p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700">Jatuh Tempo 2026 / 2027</span>
                <span className="rounded-lg bg-amber-100 p-2 text-amber-700">
                  <Calendar className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-amber-800">
                {metrics.year2026} <span className="text-xs font-normal text-amber-700">(2026)</span> / {metrics.year2027} <span className="text-xs font-normal text-amber-700">(2027)</span>
              </p>
              <p className="mt-1 text-[11px] text-amber-600 font-medium">Masuk perencanaan belanja gaji ASN</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700">Periode 2 Th Kedepan</span>
                <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                  <Sparkles className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{metrics.future2Year} <span className="text-xs font-normal text-emerald-600">Pegawai</span></p>
              <p className="mt-1 text-[11px] text-emerald-600 font-medium">KGB 2 Tahun Kedepan (2028-2029)</p>
            </div>
          </div>

          {/* Banner Pengingat Prioritas (Early Warning Notification) */}
          <div className="rounded-2xl border border-amber-300/80 bg-amber-50/60 p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4 text-amber-700 animate-bounce" />
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Pengingat Prioritas: Pegawai Paling Dekat Jatuh Tempo KGB
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {urgentReminders.map((rem, idx) => (
                <div key={idx} className="rounded-xl border border-amber-200 bg-white p-3 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                        {rem.daysRemaining <= 0 ? 'LEWAT WAKTU' : `${rem.daysRemaining} Hari Lagi`}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 font-mono">
                        {rem.effectiveCurrentKGBDate}
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-slate-900 mt-1.5 leading-snug">
                      {rem.item.nama}
                    </h5>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">NIP: {rem.item.nip}</p>
                    <p className="text-[10px] text-slate-600 mt-1">
                      {rem.item.pangkat} &bull; MKG Saat Ini: {rem.item.masaKerja}
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Estimasi Gaji Baru:</span>
                      <span className="font-bold text-emerald-700 font-mono">{formatRupiah(rem.gajiPokokBaru)}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleProsesSKFromSpreadsheet(rem)}
                      className="w-full flex items-center justify-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1.5 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <span>Proses SK KGB</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                    {rem.item.linkDrive && (
                      <a
                        href={rem.item.linkDrive}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Buka Berkas Google Drive"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama ASN, NIP, pangkat, atau satuan pelayanan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
              >
                <option value="ALL">Semua Jadwal KGB (63 ASN)</option>
                <option value="CRITICAL">🚨 Jatuh Tempo Segera (≤ 90 Hari)</option>
                <option value="2026">📅 Jatuh Tempo Tahun Ini (2026)</option>
                <option value="2027">🗓️ Jatuh Tempo Tahun Depan (2027)</option>
                <option value="FUTURE">🔮 Periode 2 Tahun Kedepan (2028-2029)</option>
              </select>
            </div>
            <div>
              <select
                value={filterSatker}
                onChange={(e) => setFilterSatker(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
              >
                <option value="ALL">Semua Satuan Pelayanan</option>
                {satkerOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabel Penghitung Otomatis & Pengingat KGB */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>Jadwal & Penghitung Kenaikan Gaji Berkala ASN</span>
                  <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs font-semibold">
                    {filteredCalculatedItems.length} Pegawai
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  TMT KGB +2 tahun dihitung otomatis berikut proyeksi kenaikan gaji berkala (PP No. 5 Tahun 2024)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 text-center w-12">No</th>
                    <th className="py-3 px-4">Pegawai ASN</th>
                    <th className="py-3 px-3">Pangkat / MKG Saat Ini</th>
                    <th className="py-3 px-3">TMT KGB Saat Ini</th>
                    <th className="py-3 px-3 bg-emerald-50/50 text-emerald-900">
                      TMT KGB 2 Th Kedepan
                    </th>
                    <th className="py-3 px-3 bg-emerald-50/50 text-emerald-900">
                      Masa Kerja (+2 Th)
                    </th>
                    <th className="py-3 px-3">Estimasi Gaji Pokok (PP 5/2024)</th>
                    <th className="py-3 px-3">Status Pengingat</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCalculatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Tidak ada data pegawai yang sesuai dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    filteredCalculatedItems.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400 font-mono">
                          {c.item.no}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-bold text-slate-900">{c.item.nama}</p>
                            <p className="text-[11px] text-slate-500 font-mono">NIP: {c.item.nip}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-500 truncate max-w-[200px]">
                                {c.item.jabatan}
                              </span>
                              {c.item.satuanPelayanan && (
                                <span className="rounded bg-slate-100 text-slate-600 px-1.5 py-0.2 text-[9px] font-medium">
                                  {c.item.satuanPelayanan}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-800 text-[11px]">
                            {c.item.pangkat}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {c.item.masaKerja || '-'}
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-800 font-mono">{c.effectiveCurrentKGBDate}</p>
                          <p className="text-[10px] text-slate-400">TMT Terdaftar</p>
                        </td>
                        <td className="py-3 px-3 bg-emerald-50/30">
                          <p className="font-bold text-emerald-900 font-mono text-[12px]">
                            {c.effectiveNextKGBDate}
                          </p>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700">
                            <Sparkles className="h-2.5 w-2.5" /> +2 Tahun
                          </span>
                        </td>
                        <td className="py-3 px-3 bg-emerald-50/30">
                          <span className="font-semibold text-slate-800 text-[11px]">
                            {c.nextMasaKerja}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-[11px]">
                            <span className="text-slate-400 line-through mr-1">
                              {formatRupiah(c.gajiPokokLama)}
                            </span>
                            <span className="font-bold font-mono text-emerald-700">
                              &rarr; {formatRupiah(c.gajiPokokBaru)}
                            </span>
                            <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">
                              (+{formatRupiah(c.selisihKenaikan)}/bln)
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              c.urgencyLevel === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : c.urgencyLevel === 'UPCOMING'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {c.statusBadge}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleProsesSKFromSpreadsheet(c)}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                              title="Proses Usulan SK KGB"
                            >
                              Buat SK
                            </button>
                            {c.item.linkDrive && (
                              <a
                                href={c.item.linkDrive}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg border border-slate-200 p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Buka Dokumen Google Drive"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Berkas & SK KGB Diterbitkan Lokal */
        <div className="space-y-6">
          {/* Filter Bar Local */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama pegawai, NIP, atau nomor SK KGB..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
              >
                <option value="ALL">Semua Status Verifikasi</option>
                <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                <option value="Diverifikasi">Diverifikasi</option>
                <option value="SK Diterbitkan">SK Diterbitkan</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>
          </div>

          {/* Tabel KGB Lokal */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                Daftar Usulan & Penetapan SK KGB ({filteredLocalKGB.length})
              </h3>
              <span className="text-xs text-slate-400">
                Data SK KGB yang telah diproses dalam sistem
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Pegawai ASN</th>
                    <th className="py-3 px-3">Golongan & MKG</th>
                    <th className="py-3 px-3">Gaji Lama &rarr; Baru</th>
                    <th className="py-3 px-3">TMT KGB</th>
                    <th className="py-3 px-3">Nomor SK / Berkas</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLocalKGB.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada berkas SK KGB lokal. Buat usulan baru dari tab Pengingat Spreadsheet.
                      </td>
                    </tr>
                  ) : (
                    filteredLocalKGB.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-bold text-slate-900">{item.employeeName}</p>
                            <p className="text-[11px] text-slate-500 font-mono">NIP: {item.nip}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[170px]">{item.jabatan}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-800">
                            {item.pangkatGolongan}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            MKG: {item.masaKerjaTahun} Th {item.masaKerjaBulan} Bln
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-[11px]">
                            <span className="line-through text-slate-400">{formatRupiah(item.gajiLama)}</span>
                            <p className="font-bold font-mono text-emerald-700">{formatRupiah(item.gajiBaru)}</p>
                            <span className="text-[10px] font-semibold text-emerald-600">
                              (+{formatRupiah(item.gajiBaru - item.gajiLama)})
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-800">{item.tmtGajiBaru}</p>
                          <p className="text-[10px] text-slate-400">Next: {item.tmtKGBBerikutnya}</p>
                        </td>
                        <td className="py-3 px-3">
                          {item.noSK ? (
                            <div>
                              <p className="font-semibold text-slate-800">{item.noSK}</p>
                              {item.dokumenSKName && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline cursor-pointer">
                                  <FileText className="h-3 w-3" /> {item.dokumenSKName}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Menunggu Terbit SK</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              item.status === 'SK Diterbitkan'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'Diverifikasi'
                                ? 'bg-blue-100 text-blue-800'
                                : item.status === 'Ditolak'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Edit Data KGB & Upload SK"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus usulan KGB untuk ${item.employeeName}?`)) {
                                  onDeleteKGB(item.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus Usulan"
                            >
                              <Trash2 className="h-4 w-4" />
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
        </div>
      )}

      {/* Modal Formulir & Penerbitan SK KGB */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <span>{isEditing ? 'Kelola SK & Usulan Kenaikan Gaji Berkala' : 'Formulir Penetapan SK KGB'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Nama Pegawai ASN *</label>
                <input
                  type="text"
                  required
                  value={formData.employeeName || ''}
                  onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">NIP Pegawai</label>
                  <input
                    type="text"
                    required
                    value={formData.nip || ''}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Pangkat / Golongan</label>
                  <input
                    type="text"
                    value={formData.pangkatGolongan || ''}
                    onChange={(e) => setFormData({ ...formData, pangkatGolongan: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Gaji Pokok Lama (Rp)</label>
                  <input
                    type="number"
                    value={formData.gajiLama || 0}
                    onChange={(e) => setFormData({ ...formData, gajiLama: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-emerald-800">Gaji Pokok Baru (PP 5/2024) *</label>
                  <input
                    type="number"
                    required
                    value={formData.gajiBaru || 0}
                    onChange={(e) => setFormData({ ...formData, gajiBaru: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-emerald-400 bg-emerald-50/50 p-2 text-xs font-mono font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">TMT Gaji Baru *</label>
                  <input
                    type="date"
                    required
                    value={formData.tmtGajiBaru || ''}
                    onChange={(e) => setFormData({ ...formData, tmtGajiBaru: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-emerald-800">TMT KGB Selanjutnya (2 Th Kedepan)</label>
                  <input
                    type="date"
                    value={formData.tmtKGBBerikutnya || ''}
                    onChange={(e) => setFormData({ ...formData, tmtKGBBerikutnya: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-emerald-300 bg-emerald-50/30 p-2 text-xs outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Nomor Surat Keputusan (SK)</label>
                  <input
                    type="text"
                    placeholder="822/KGB/BKHT/2026/01"
                    value={formData.noSK || ''}
                    onChange={(e) => setFormData({ ...formData, noSK: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Status Penetapan</label>
                  <select
                    value={formData.status || 'Menunggu Verifikasi'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusKGB })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                    <option value="Diverifikasi">Diverifikasi</option>
                    <option value="SK Diterbitkan">SK Diterbitkan (Verifikasi 2FA)</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>
              </div>

              {/* Upload Berkas SK */}
              <div>
                <label className="text-xs font-bold text-slate-700">
                  Upload Pindai Berkas SK KGB (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Catatan & Keterangan</label>
                <textarea
                  rows={2}
                  value={formData.catatan || ''}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                >
                  Simpan Penetapan KGB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
