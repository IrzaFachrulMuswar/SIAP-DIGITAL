import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Search, 
  Download,
  Calendar,
  FileCheck,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Eye,
  Info,
  Layers,
  History,
  Pencil,
  Trash2,
  AlertTriangle,
  Save,
  X
} from 'lucide-react';
import { KGBRecord } from '../../types';
import { sendToUniversalWebhook, formatKgbToRow } from '../../utils/universalSheetWebhook';
import { exportToExcel } from '../../utils/exportUtils';
import { TARGET_SPREADSHEET_ID } from '../../utils/googleSheetsLiveReader';

interface Sheet4KgbBerkalaViewProps {
  kgbList: KGBRecord[];
  onAddKgb: (item: KGBRecord) => void;
  onUpdateKgb?: (item: KGBRecord) => void;
  onDeleteKgb?: (id: string) => void;
}

export interface KGBProjectionCycle {
  cycleIndex: number;
  label: string; // e.g., "+2 Tahun Berikutnya", "+4 Tahun Berikutnya"
  tmtDate: string;
  formattedTmt: string;
  estimatedGajiPokok: number;
  selisihKenaikan: number;
  countdownMonths: number;
  countdownText: string;
  status: 'active_now' | 'urgent' | 'upcoming' | 'future';
  statusLabel: string;
}

/**
 * Fungsi menghitung otomatis 2 tahun berikutnya dan seterusnya
 * Sesuai aturan Kenaikan Gaji Berkala (KGB) ASN setiap 2 (dua) tahun sekali
 */
export function calculateKgbProjections(
  tmtDateStr: string,
  gajiPokokLama: number,
  gajiPokokBaru: number,
  maxCycles: number = 5
): KGBProjectionCycle[] {
  if (!tmtDateStr) return [];
  
  const baseDate = new Date(tmtDateStr);
  if (isNaN(baseDate.getTime())) return [];

  const selisihBase = Math.max(150000, (gajiPokokBaru - gajiPokokLama) || Math.round(gajiPokokBaru * 0.075));
  const today = new Date();

  const cycles: KGBProjectionCycle[] = [];

  for (let i = 1; i <= maxCycles; i++) {
    const yearsToAdd = i * 2;
    const projDate = new Date(baseDate);
    projDate.setFullYear(baseDate.getFullYear() + yearsToAdd);

    const y = projDate.getFullYear();
    const m = String(projDate.getMonth() + 1).padStart(2, '0');
    const d = String(projDate.getDate()).padStart(2, '0');
    const isoDate = `${y}-${m}-${d}`;

    const formattedTmt = projDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const estimatedGajiPokok = gajiPokokBaru + (selisihBase * i);
    const selisihKenaikan = selisihBase * i;

    // Hitung sisa bulan dari hari ini
    const diffTime = projDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.round(diffDays / 30.44);

    let countdownText = '';
    let status: 'active_now' | 'urgent' | 'upcoming' | 'future' = 'future';
    let statusLabel = 'Terjadwal';

    if (diffDays <= 0) {
      countdownText = 'Jatuh tempo terlewati';
      status = 'active_now';
      statusLabel = 'Jatuh Tempo';
    } else if (diffMonths <= 2) {
      countdownText = `${diffDays} hari lagi`;
      status = 'urgent';
      statusLabel = 'Segera Diproses SK';
    } else if (diffMonths <= 12) {
      countdownText = `${diffMonths} bulan lagi`;
      status = 'upcoming';
      statusLabel = 'Dalam 1 Tahun';
    } else {
      const remainingYears = Math.floor(diffMonths / 12);
      const remainingExtraMonths = diffMonths % 12;
      countdownText = remainingExtraMonths > 0 
        ? `${remainingYears} thn ${remainingExtraMonths} bln` 
        : `${remainingYears} tahun lagi`;
      status = 'future';
      statusLabel = 'Mendatang';
    }

    cycles.push({
      cycleIndex: i,
      label: `+${yearsToAdd} Tahun (${y})`,
      tmtDate: isoDate,
      formattedTmt,
      estimatedGajiPokok,
      selisihKenaikan,
      countdownMonths: diffMonths,
      countdownText,
      status,
      statusLabel
    });
  }

  return cycles;
}

export const Sheet4KgbBerkalaView: React.FC<Sheet4KgbBerkalaViewProps> = ({
  kgbList,
  onAddKgb,
  onUpdateKgb,
  onDeleteKgb,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'input_table' | 'projection_matrix'>('input_table');
  const [formData, setFormData] = useState({
    jabatan: 'Medik Veteriner Ahli Muda',
    pangkatGolongan: 'Penata (III/c)',
    gajiPokokLama: 3500000,
    gajiPokokBaru: 3750000,
    tmtKgbBaru: new Date().toISOString().slice(0, 10),
    nomorSkKgb: `822.2/KGB/BKHIT/2026/${String(kgbList.length + 1).padStart(3, '0')}`,
  });

  const [selectedKgbForDetail, setSelectedKgbForDetail] = useState<KGBRecord | null>(null);
  const [editingKgb, setEditingKgb] = useState<KGBRecord | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<KGBRecord>>({});
  const [deletingKgb, setDeletingKgb] = useState<KGBRecord | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const handleOpenEdit = (item: KGBRecord) => {
    setEditingKgb(item);
    setEditFormData({
      id: item.id,
      jabatan: item.jabatan,
      pangkatGolongan: item.pangkatGolongan,
      gajiPokokLama: item.gajiPokokLama || (item as any).gajiLama || 0,
      gajiPokokBaru: item.gajiPokokBaru || (item as any).gajiBaru || 0,
      tmtGajiBaru: item.tmtGajiBaru || (item as any).tmtBaru || '',
      suratKeputusanTerakhir: item.suratKeputusanTerakhir || (item as any).noSK || '',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKgb) return;
    const updated: KGBRecord = {
      ...editingKgb,
      ...editFormData,
    } as KGBRecord;

    if (onUpdateKgb) {
      onUpdateKgb(updated);
    }
    sendToUniversalWebhook({
      moduleKey: 'kgb',
      action: 'update',
      item: updated,
      customRow: formatKgbToRow(updated),
    });
    setStatusMessage(`Data KGB untuk "${updated.jabatan}" berhasil diperbarui.`);
    setSyncStatus('success');
    setEditingKgb(null);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleConfirmDelete = () => {
    if (!deletingKgb) return;
    const target = deletingKgb;
    if (onDeleteKgb) {
      onDeleteKgb(target.id);
    }
    sendToUniversalWebhook({
      moduleKey: 'kgb',
      action: 'delete',
      item: target,
      customRow: formatKgbToRow(target),
    });
    setStatusMessage(`Data KGB "${target.jabatan}" berhasil dihapus.`);
    setSyncStatus('success');
    setDeletingKgb(null);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Hitung proyeksi real-time untuk input form saat ini
  const liveFormProjections = useMemo(() => {
    return calculateKgbProjections(
      formData.tmtKgbBaru,
      formData.gajiPokokLama,
      formData.gajiPokokBaru,
      4
    );
  }, [formData.tmtKgbBaru, formData.gajiPokokLama, formData.gajiPokokBaru]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSyncStatus('idle');
    setStatusMessage(null);

    // Hitung TMT KGB 2 tahun berikutnya
    const proj2Year = calculateKgbProjections(formData.tmtKgbBaru, formData.gajiPokokLama, formData.gajiPokokBaru, 1);
    const nextTmt = proj2Year.length > 0 ? proj2Year[0].tmtDate : '2028-01-01';

    const newKgb: KGBRecord = {
      id: `kgb-${Date.now()}`,
      employeeId: 'KGB-NEW',
      employeeName: 'Pegawai ASN',
      nip: '-',
      jabatan: formData.jabatan,
      pangkatGolongan: formData.pangkatGolongan,
      unitKerja: 'Balai Karantina Papua Barat Daya',
      masaKerjaTahun: 8,
      masaKerjaBulan: 0,
      gajiLama: formData.gajiPokokLama,
      gajiBaru: formData.gajiPokokBaru,
      tmtGajiLama: '2024-01-01',
      tmtGajiBaru: formData.tmtKgbBaru,
      tmtKGBBerikutnya: nextTmt,
      noSK: formData.nomorSkKgb,
      pejabatPenetap: 'Kepala Balai Karantina Hewan, Ikan, dan Tumbuhan',
      status: 'SK Diterbitkan',
      updatedAt: new Date().toISOString(),
      // Backward compatibility aliases
      tmtBaru: formData.tmtKgbBaru,
      gajiPokokLama: formData.gajiPokokLama,
      gajiPokokBaru: formData.gajiPokokBaru,
      suratKeputusanTerakhir: formData.nomorSkKgb,
    };

    onAddKgb(newKgb);

    try {
      const row = formatKgbToRow(newKgb);
      const res = await sendToUniversalWebhook({
        moduleKey: 'kgb',
        action: 'append',
        item: newKgb,
        customRow: row,
      });

      if (res.success) {
        setSyncStatus('success');
        setStatusMessage('Data KGB berhasil disimpan dan disinkronkan ke sheet "KGB_Berkala"!');
      } else {
        setSyncStatus('error');
        setStatusMessage(res.error || 'Data tersimpan lokal, gagal sinkron webhook.');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setStatusMessage(err.message || 'Gagal mengirim ke webhook.');
    } finally {
      setIsSubmitting(false);
      setFormData(prev => ({
        ...prev,
        nomorSkKgb: `822.2/KGB/BKHIT/2026/${String(kgbList.length + 2).padStart(3, '0')}`,
      }));
    }
  };

  const filteredKgb = useMemo(() => {
    return kgbList.filter(k => {
      const q = search.toLowerCase();
      const sk = k.suratKeputusanTerakhir || k.noSK || '';
      return !search ||
        (k.jabatan || '').toLowerCase().includes(q) ||
        (k.pangkatGolongan || '').toLowerCase().includes(q) ||
        sk.toLowerCase().includes(q);
    });
  }, [kgbList, search]);

  const handleExportExcel = () => {
    const exportData = filteredKgb.map((k, idx) => {
      const tmt = k.tmtBaru || k.tmtGajiBaru || '2026-01-01';
      const gLama = k.gajiPokokLama || k.gajiLama || 0;
      const gBaru = k.gajiPokokBaru || k.gajiBaru || 0;
      const sk = k.suratKeputusanTerakhir || k.noSK || '-';
      const projs = calculateKgbProjections(tmt, gLama, gBaru, 3);

      return {
        No: idx + 1,
        Jabatan: k.jabatan,
        'Pangkat / Golongan': k.pangkatGolongan,
        'Gaji Pokok Lama': gLama,
        'Gaji Pokok Baru': gBaru,
        'TMT KGB Baru': tmt,
        'Nomor SK KGB': sk,
        'KGB +2 Tahun (TMT)': projs[0]?.tmtDate || '-',
        'KGB +2 Tahun (Est. Gaji)': projs[0]?.estimatedGajiPokok || 0,
        'KGB +4 Tahun (TMT)': projs[1]?.tmtDate || '-',
        'KGB +4 Tahun (Est. Gaji)': projs[1]?.estimatedGajiPokok || 0,
      };
    });

    exportToExcel(exportData, `KGB_Berkala_Sheet4_${new Date().toISOString().slice(0, 10)}`);
  };

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit?gid=1832091216#gid=1832091216`;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Banner Identitas Sheet 4 & Indikator Otomatisasi */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 md:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-lg shadow-sm shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-bold text-slate-900">
                  Sheet 4: KGB_Berkala
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-200 text-emerald-800 border border-emerald-300">
                  Mode: Input Data
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Hitung Otomatis 2 Tahun &amp; Seterusnya
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Struktur 6 Kolom: <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded text-emerald-900">Jabatan | Pangkat / Golongan | Gaji Pokok Lama | Gaji Pokok Baru | TMT KGB Baru | Nomor SK KGB</code>. Sistem otomatis memproyeksikan TMT dan estimasi gaji setiap 2 tahun ke depan.
              </p>
            </div>
          </div>

          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-800 hover:text-emerald-900 text-xs font-medium rounded-lg shadow-2xs transition-colors cursor-pointer self-start md:self-auto shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
            <span>Buka Sheet 4 di Spreadsheet (gid: 1832091216)</span>
          </a>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${
          syncStatus === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}>
          {syncStatus === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Navigasi Sub-Tab Fitur: Form Input vs Matriks Proyeksi Berkala */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('input_table')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'input_table'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Form Input &amp; Tabel Catatan KGB</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('projection_matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'projection_matrix'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Matriks Proyeksi 2 Tahun &amp; Seterusnya (+2, +4, +6, +8 Tahun)</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-400 text-amber-950 font-bold">
            Otomatis
          </span>
        </button>
      </div>

      {activeSubTab === 'input_table' && (
        <div className="space-y-6">
          {/* Form Input 6 Kolom KGB + Live Proyeksi Kalkulator */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Input Data KGB Baru (6 Kolom Database Google Sheets)</span>
              </h2>
              <span className="text-[11px] text-slate-500">
                Target Sheet: <strong className="text-emerald-700 font-mono">KGB_Berkala</strong>
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kolom 1: Jabatan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    1. Jabatan Pegawai <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white"
                    placeholder="Contoh: Medik Veteriner Ahli Muda"
                  />
                </div>

                {/* Kolom 2: Pangkat / Golongan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    2. Pangkat / Golongan <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pangkatGolongan}
                    onChange={(e) => setFormData({ ...formData, pangkatGolongan: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white"
                    placeholder="Contoh: Penata (III/c)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Kolom 3: Gaji Pokok Lama */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    3. Gaji Pokok Lama (Rp) <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.gajiPokokLama}
                    onChange={(e) => setFormData({ ...formData, gajiPokokLama: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white font-mono"
                  />
                </div>

                {/* Kolom 4: Gaji Pokok Baru */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    4. Gaji Pokok Baru (Rp) <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.gajiPokokBaru}
                    onChange={(e) => setFormData({ ...formData, gajiPokokBaru: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white font-mono"
                  />
                </div>

                {/* Kolom 5: TMT KGB Baru */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    5. TMT KGB Baru <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tmtKgbBaru}
                    onChange={(e) => setFormData({ ...formData, tmtKgbBaru: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white font-mono"
                  />
                </div>

                {/* Kolom 6: Nomor SK KGB */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    6. Nomor SK KGB <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nomorSkKgb}
                    onChange={(e) => setFormData({ ...formData, nomorSkKgb: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white font-mono"
                    placeholder="822.2/KGB/BKHIT/..."
                  />
                </div>
              </div>

              {/* Panel Kalkulasi Otomatis Proyeksi 2 Tahun & Seterusnya Langsung di Form */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Hasil Hitung Otomatis KGB ke Dua Tahun Berikutnya &amp; Seterusnya:
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Kenaikan per 2 Tahun: <strong className="text-emerald-600 font-mono">+Rp {((formData.gajiPokokBaru - formData.gajiPokokLama) || 250000).toLocaleString('id-ID')}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                  {liveFormProjections.map((cycle) => (
                    <div 
                      key={cycle.cycleIndex}
                      className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                          {cycle.label}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                          cycle.status === 'urgent' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {cycle.countdownText}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-900">
                        {cycle.formattedTmt}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Est. Gaji Pokok:</span>
                        <span className="font-mono font-semibold text-emerald-600">
                          Rp {cycle.estimatedGajiPokok.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-pulse' : ''}`} />
                  <span>{isSubmitting ? 'Menyimpan ke Spreadsheet...' : 'Simpan & Kirim ke Sheet KGB_Berkala'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Tabel Catatan KGB di Database */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Catatan KGB Berkala di Database</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  {filteredKgb.length} Data
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative min-w-[220px]">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari SK atau Jabatan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Jabatan</th>
                    <th className="py-3 px-4">Pangkat / Golongan</th>
                    <th className="py-3 px-4 text-right">Gaji Lama</th>
                    <th className="py-3 px-4 text-right">Gaji Baru</th>
                    <th className="py-3 px-4">TMT KGB Baru</th>
                    <th className="py-3 px-4">Nomor SK KGB</th>
                    <th className="py-3 px-4 text-emerald-800">Hitung 2 Thn Berikutnya</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredKgb.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        Belum ada data KGB. Gunakan form di atas untuk menambahkan data.
                      </td>
                    </tr>
                  ) : (
                    filteredKgb.map((k, idx) => {
                      const tmt = k.tmtBaru || k.tmtGajiBaru || '2026-01-01';
                      const gLama = k.gajiPokokLama || k.gajiLama || 0;
                      const gBaru = k.gajiPokokBaru || k.gajiBaru || 0;
                      const sk = k.suratKeputusanTerakhir || k.noSK || '-';
                      const projs = calculateKgbProjections(tmt, gLama, gBaru, 1);
                      const nextProj = projs[0];

                      return (
                        <tr key={k.id || idx} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-900">{k.jabatan}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                              {k.pangkatGolongan}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            Rp {gLama.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                            Rp {gBaru.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">{tmt}</td>
                          <td className="py-3 px-4 font-mono font-medium text-slate-800">{sk}</td>
                          
                          {/* Kolom Hitung Otomatis 2 Tahun Berikutnya */}
                          <td className="py-3 px-4">
                            {nextProj ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-700">
                                  <span>{nextProj.tmtDate}</span>
                                  <span className="text-[10px] px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                                    +2 Thn
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Est: Rp {nextProj.estimatedGajiPokok.toLocaleString('id-ID')} ({nextProj.countdownText})
                                </div>
                              </div>
                            ) : '-'}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedKgbForDetail(k)}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200 text-[10px] font-medium transition-colors cursor-pointer"
                                title="Lihat proyeksi lengkap 10 tahun ke depan"
                              >
                                Detail
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(k)}
                                className="p-1 hover:bg-amber-100 text-amber-600 rounded transition-colors cursor-pointer"
                                title="Edit Data KGB"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingKgb(k)}
                                className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors cursor-pointer"
                                title="Hapus Data KGB"
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

      {/* Sub-Tab 2: Matriks Proyeksi Berkala Otomatis (+2, +4, +6, +8, +10 Tahun) */}
      {activeSubTab === 'projection_matrix' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Matriks Proyeksi Kenaikan Gaji Berkala (Multi-Year KGB Matrix)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar jadwal otomatis jatuh tempo KGB untuk setiap 2 tahun berikutnya, 4 tahun, 6 tahun, hingga 8 tahun berikutnya.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer self-start md:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Matriks Proyeksi Excel</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredKgb.map((item, idx) => {
                const tmt = item.tmtBaru || item.tmtGajiBaru || '2026-01-01';
                const gLama = item.gajiPokokLama || item.gajiLama || 0;
                const gBaru = item.gajiPokokBaru || item.gajiBaru || 0;
                const projs = calculateKgbProjections(tmt, gLama, gBaru, 4);

                return (
                  <div 
                    key={item.id || idx}
                    className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{item.jabatan}</h4>
                        <span className="text-[11px] text-slate-500 font-medium">{item.pangkatGolongan}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800">
                        Rp {gBaru.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 font-mono">
                      TMT Saat Ini: <strong className="text-slate-900">{tmt}</strong>
                    </div>

                    {/* Proyeksi 2 tahunan */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-200">
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                        Jadwal Otomatis 2 Tahun Berikutnya:
                      </span>
                      {projs.map((cycle) => (
                        <div 
                          key={cycle.cycleIndex}
                          className="flex items-center justify-between p-1.5 bg-white rounded border border-slate-100 text-[11px]"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-700 text-[10px]">{cycle.label}</span>
                            <span className="font-mono text-slate-600">{cycle.tmtDate}</span>
                          </div>
                          <div className="flex items-center gap-1 font-mono font-bold text-emerald-600">
                            <span>Rp {cycle.estimatedGajiPokok.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedKgbForDetail(item)}
                      className="w-full py-1.5 text-center text-xs font-medium text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 rounded border border-emerald-200 transition-colors cursor-pointer"
                    >
                      Buka Rincian Proyeksi Lengkap &rarr;
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Proyeksi KGB 10 Tahun */}
      {selectedKgbForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Detail Proyeksi KGB Otomatis (10 Tahun Kedepan)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedKgbForDetail.jabatan} - {selectedKgbForDetail.pangkatGolongan}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedKgbForDetail(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Gaji Lama</span>
                <strong className="font-mono text-slate-700">
                  Rp {(selectedKgbForDetail.gajiPokokLama || selectedKgbForDetail.gajiLama || 0).toLocaleString('id-ID')}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Gaji Baru</span>
                <strong className="font-mono text-emerald-600">
                  Rp {(selectedKgbForDetail.gajiPokokBaru || selectedKgbForDetail.gajiBaru || 0).toLocaleString('id-ID')}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">TMT KGB Baru</span>
                <strong className="font-mono text-slate-700">
                  {selectedKgbForDetail.tmtBaru || selectedKgbForDetail.tmtGajiBaru}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Nomor SK</span>
                <strong className="font-mono text-slate-700 truncate block">
                  {selectedKgbForDetail.suratKeputusanTerakhir || selectedKgbForDetail.noSK}
                </strong>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800">
                Jadwal Kenaikan Gaji Berkala Otomatis (+2, +4, +6, +8, +10 Tahun):
              </h4>

              <div className="space-y-2">
                {calculateKgbProjections(
                  selectedKgbForDetail.tmtBaru || selectedKgbForDetail.tmtGajiBaru || '2026-01-01',
                  selectedKgbForDetail.gajiPokokLama || selectedKgbForDetail.gajiLama || 0,
                  selectedKgbForDetail.gajiPokokBaru || selectedKgbForDetail.gajiBaru || 0,
                  5
                ).map((cycle) => (
                  <div 
                    key={cycle.cycleIndex}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {cycle.cycleIndex}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{cycle.label}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono">
                            {cycle.formattedTmt}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Status: <strong className="text-emerald-700">{cycle.statusLabel}</strong> ({cycle.countdownText})
                        </span>
                      </div>
                    </div>

                    <div className="text-right sm:self-center font-mono">
                      <span className="text-[10px] text-slate-400 block">Estimasi Gaji Pokok</span>
                      <strong className="text-xs text-emerald-600 font-bold">
                        Rp {cycle.estimatedGajiPokok.toLocaleString('id-ID')}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedKgbForDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit KGB */}
      {editingKgb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-600" />
                <span>Edit Usulan KGB Berkala</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingKgb(null)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jabatan Pegawai</label>
                <input
                  type="text"
                  value={editFormData.jabatan || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, jabatan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pangkat / Golongan</label>
                  <input
                    type="text"
                    value={editFormData.pangkatGolongan || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, pangkatGolongan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor SK KGB</label>
                  <input
                    type="text"
                    value={editFormData.suratKeputusanTerakhir || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, suratKeputusanTerakhir: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gaji Pokok Lama (Rp)</label>
                  <input
                    type="number"
                    value={editFormData.gajiPokokLama || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, gajiPokokLama: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gaji Pokok Baru (Rp)</label>
                  <input
                    type="number"
                    value={editFormData.gajiPokokBaru || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, gajiPokokBaru: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-emerald-600 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">TMT KGB Baru</label>
                <input
                  type="date"
                  value={editFormData.tmtGajiBaru || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, tmtGajiBaru: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingKgb(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus KGB */}
      {deletingKgb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Data KGB</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus catatan KGB untuk jabatan <strong className="text-slate-900">{deletingKgb.jabatan}</strong> ({deletingKgb.pangkatGolongan})?
                </p>
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeletingKgb(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
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
