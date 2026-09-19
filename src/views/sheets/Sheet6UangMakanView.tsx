import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  Plus, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Search, 
  Download,
  Link2,
  Calculator,
  Pencil,
  Trash2,
  AlertTriangle,
  Save,
  X
} from 'lucide-react';
import { sendToUniversalWebhook, formatUangMakanToRow } from '../../utils/universalSheetWebhook';
import { exportToExcel } from '../../utils/exportUtils';
import { TARGET_SPREADSHEET_ID } from '../../utils/googleSheetsLiveReader';

interface UangMakanRecord {
  id: string;
  bulan: string;
  tahun: number;
  jumlahPegawai: number;
  totalHariHadir: number;
  totalBruto: number;
  totalPph21: number;
  totalNetto: number;
  linkSp2d: string;
}

const INITIAL_UANG_MAKAN: UangMakanRecord[] = [
  {
    id: 'um-1',
    bulan: 'Agustus',
    tahun: 2026,
    jumlahPegawai: 63,
    totalHariHadir: 1260,
    totalBruto: 51660000,
    totalPph21: 2583000,
    totalNetto: 49077000,
    linkSp2d: 'https://drive.google.com/file/d/sp2d-uang-makan-agustus/view',
  },
  {
    id: 'um-2',
    bulan: 'Juli',
    tahun: 2026,
    jumlahPegawai: 62,
    totalHariHadir: 1240,
    totalBruto: 50840000,
    totalPph21: 2542000,
    totalNetto: 48298000,
    linkSp2d: 'https://drive.google.com/file/d/sp2d-uang-makan-juli/view',
  }
];

export const Sheet6UangMakanView: React.FC = () => {
  const [records, setRecords] = useState<UangMakanRecord[]>(INITIAL_UANG_MAKAN);
  const [formData, setFormData] = useState({
    bulan: 'September',
    tahun: 2026,
    jumlahPegawai: 63,
    totalHariHadir: 1260,
    totalBruto: 51660000,
    totalPph21: 2583000,
    linkSp2d: 'https://drive.google.com/file/d/sp2d-uang-makan/view',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [editingRecord, setEditingRecord] = useState<UangMakanRecord | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<UangMakanRecord>>({});
  const [deletingRecord, setDeletingRecord] = useState<UangMakanRecord | null>(null);

  const handleOpenEdit = (item: UangMakanRecord) => {
    setEditingRecord(item);
    setEditFormData({
      ...item,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const bruto = Number(editFormData.totalBruto) || 0;
    const pph = Number(editFormData.totalPph21) || 0;
    const netto = Math.max(0, bruto - pph);

    const updated: UangMakanRecord = {
      ...editingRecord,
      bulan: editFormData.bulan || editingRecord.bulan,
      tahun: Number(editFormData.tahun) || editingRecord.tahun,
      jumlahPegawai: Number(editFormData.jumlahPegawai) || editingRecord.jumlahPegawai,
      totalHariHadir: Number(editFormData.totalHariHadir) || editingRecord.totalHariHadir,
      totalBruto: bruto,
      totalPph21: pph,
      totalNetto: netto,
      linkSp2d: editFormData.linkSp2d || '',
    };

    setRecords((prev) => prev.map((r) => r.id === updated.id ? updated : r));
    sendToUniversalWebhook({
      moduleKey: 'uang_makan',
      action: 'update',
      item: updated,
      customRow: formatUangMakanToRow(updated),
    });
    setStatusMessage(`Data Uang Makan periode ${updated.bulan} ${updated.tahun} berhasil diperbarui.`);
    setSyncStatus('success');
    setEditingRecord(null);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleConfirmDelete = () => {
    if (!deletingRecord) return;
    const target = deletingRecord;
    setRecords((prev) => prev.filter((r) => r.id !== target.id));
    sendToUniversalWebhook({
      moduleKey: 'uang_makan',
      action: 'delete',
      item: target,
      customRow: formatUangMakanToRow(target),
    });
    setStatusMessage(`Data Uang Makan periode ${target.bulan} ${target.tahun} berhasil dihapus.`);
    setSyncStatus('success');
    setDeletingRecord(null);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Auto calculate Netto: Bruto - PPh 21
  const calculatedNetto = Math.max(0, formData.totalBruto - formData.totalPph21);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSyncStatus('idle');
    setStatusMessage(null);

    const newRecord: UangMakanRecord = {
      id: `um-${Date.now()}`,
      bulan: formData.bulan,
      tahun: formData.tahun,
      jumlahPegawai: formData.jumlahPegawai,
      totalHariHadir: formData.totalHariHadir,
      totalBruto: formData.totalBruto,
      totalPph21: formData.totalPph21,
      totalNetto: calculatedNetto,
      linkSp2d: formData.linkSp2d,
    };

    setRecords(prev => [newRecord, ...prev]);

    try {
      const row = formatUangMakanToRow(newRecord);
      const res = await sendToUniversalWebhook({
        moduleKey: 'uang_makan',
        action: 'append',
        item: newRecord,
        customRow: row,
      });

      if (res.success) {
        setSyncStatus('success');
        setStatusMessage('Data Uang Makan berhasil disimpan dan dikirim ke sheet "uang makan"!');
      } else {
        setSyncStatus('error');
        setStatusMessage(res.error || 'Data tersimpan lokal, gagal sinkron webhook.');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setStatusMessage(err.message || 'Gagal mengirim ke webhook.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRecords = records.filter(r => {
    const q = search.toLowerCase();
    return !search ||
      r.bulan.toLowerCase().includes(q) ||
      String(r.tahun).includes(q);
  });

  const handleExportExcel = () => {
    const exportData = filteredRecords.map(r => ({
      Bulan: r.bulan,
      Tahun: r.tahun,
      'Jumlah Pegawai': r.jumlahPegawai,
      'Total Hari Hadir': r.totalHariHadir,
      'Total Bruto': r.totalBruto,
      'Total PPh 21': r.totalPph21,
      'Total Netto': r.totalNetto,
      'Link SP2D': r.linkSp2d,
    }));
    exportToExcel(exportData, `Uang_Makan_Sheet6_${new Date().toISOString().slice(0, 10)}`);
  };

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit?gid=1590038364#gid=1590038364`;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 md:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-600 text-white rounded-lg shadow-sm shrink-0">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-bold text-slate-900">
                  Sheet 6: Uang_Makan
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-200 text-amber-800 border border-amber-300">
                  Mode: Input Data
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-slate-700 border border-slate-200 font-mono">
                  Sheet: Uang_Makan (gid: 1590038364)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Formulir input rekap uang makan bulanan dengan 8 kolom: Bulan, Tahun, Jumlah Pegawai, Total Hari Hadir, Total Bruto, Total PPh 21, Total Netto (auto), Link SP2D.
              </p>
            </div>
          </div>

          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer self-start md:self-auto"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
            <span>Lihat di Spreadsheet</span>
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

      {/* Form Input 8 Kolom Uang Makan */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-amber-600" />
          <span>Input Data Uang Makan Baru (8 Kolom Spreadsheet)</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Kolom 1: Bulan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                1. Bulan <span className="text-amber-500">*</span>
              </label>
              <select
                value={formData.bulan}
                onChange={(e) => setFormData({ ...formData, bulan: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-500 focus:bg-white"
              >
                {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Kolom 2: Tahun */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                2. Tahun <span className="text-amber-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.tahun}
                onChange={(e) => setFormData({ ...formData, tahun: Number(e.target.value) || 2026 })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-500 focus:bg-white font-mono"
              />
            </div>

            {/* Kolom 3: Jumlah Pegawai */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. Jumlah Pegawai <span className="text-amber-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.jumlahPegawai}
                onChange={(e) => setFormData({ ...formData, jumlahPegawai: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-500 focus:bg-white font-mono"
              />
            </div>

            {/* Kolom 4: Total Hari Hadir */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                4. Total Hari Hadir <span className="text-amber-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.totalHariHadir}
                onChange={(e) => setFormData({ ...formData, totalHariHadir: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-500 focus:bg-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Kolom 5: Total Bruto */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                5. Total Bruto (Rp) <span className="text-amber-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.totalBruto}
                onChange={(e) => setFormData({ ...formData, totalBruto: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-500 focus:bg-white font-mono"
              />
            </div>

            {/* Kolom 6: Total PPh 21 */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                6. Total PPh 21 (Rp) <span className="text-amber-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.totalPph21}
                onChange={(e) => setFormData({ ...formData, totalPph21: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-500 focus:bg-white font-mono"
              />
            </div>

            {/* Kolom 7: Total Netto (Auto Calculate) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                7. Total Netto (Otomatis)
              </label>
              <div className="px-3 py-2 text-xs bg-amber-50/80 border border-amber-200 rounded-lg font-mono font-bold text-amber-900">
                Rp {calculatedNetto.toLocaleString('id-ID')}
              </div>
            </div>

            {/* Kolom 8: Link SP2D */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                8. Link SP2D (URL Drive)
              </label>
              <input
                type="url"
                value={formData.linkSp2d}
                onChange={(e) => setFormData({ ...formData, linkSp2d: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-500 focus:bg-white font-mono"
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-pulse' : ''}`} />
              <span>{isSubmitting ? 'Menyimpan ke Sheet...' : 'Simpan & Sinkronkan ke Sheet Uang Makan'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tabel 8 Kolom Uang Makan */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Data Rekap Uang Makan di Database</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {filteredRecords.length} Periode
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari bulan atau tahun..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-500 focus:bg-white"
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
                <th className="py-3 px-4">Bulan</th>
                <th className="py-3 px-4">Tahun</th>
                <th className="py-3 px-4 text-center">Jumlah Pegawai</th>
                <th className="py-3 px-4 text-center">Total Hari Hadir</th>
                <th className="py-3 px-4 text-right">Total Bruto</th>
                <th className="py-3 px-4 text-right">Total PPh 21</th>
                <th className="py-3 px-4 text-right">Total Netto</th>
                <th className="py-3 px-4 text-center">Link SP2D</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{r.bulan}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{r.tahun}</td>
                  <td className="py-3 px-4 text-center font-medium text-slate-800">{r.jumlahPegawai} ASN</td>
                  <td className="py-3 px-4 text-center font-medium text-slate-800">{r.totalHariHadir} Hari</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    Rp {r.totalBruto.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-600">
                    Rp {r.totalPph21.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    Rp {r.totalNetto.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {r.linkSp2d ? (
                      <a
                        href={r.linkSp2d}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium hover:underline"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>SP2D</span>
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(r)}
                        className="p-1 hover:bg-amber-100 text-amber-600 rounded transition-colors cursor-pointer"
                        title="Edit Data Uang Makan"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingRecord(r)}
                        className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors cursor-pointer"
                        title="Hapus Data Uang Makan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Uang Makan */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-600" />
                <span>Edit Rekap Uang Makan</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bulan</label>
                  <input
                    type="text"
                    value={editFormData.bulan || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, bulan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahun</label>
                  <input
                    type="number"
                    value={editFormData.tahun || 2026}
                    onChange={(e) => setEditFormData({ ...editFormData, tahun: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Pegawai</label>
                  <input
                    type="number"
                    value={editFormData.jumlahPegawai || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, jumlahPegawai: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Hari Hadir</label>
                  <input
                    type="number"
                    value={editFormData.totalHariHadir || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, totalHariHadir: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Bruto (Rp)</label>
                  <input
                    type="number"
                    value={editFormData.totalBruto || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, totalBruto: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total PPh 21 (Rp)</label>
                  <input
                    type="number"
                    value={editFormData.totalPph21 || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, totalPph21: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Link Berkas SP2D (Google Drive/URL)</label>
                <input
                  type="url"
                  value={editFormData.linkSp2d || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, linkSp2d: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Uang Makan */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Data Uang Makan</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data rekap uang makan periode <strong className="text-slate-900">{deletingRecord.bulan} {deletingRecord.tahun}</strong>?
                </p>
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeletingRecord(null)}
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
