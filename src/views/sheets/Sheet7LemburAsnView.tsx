import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Search, 
  Download,
  Link2
} from 'lucide-react';
import { sendToUniversalWebhook, formatLemburToRow } from '../../utils/universalSheetWebhook';
import { exportToExcel } from '../../utils/exportUtils';
import { TARGET_SPREADSHEET_ID } from '../../utils/googleSheetsLiveReader';

interface LemburRecord {
  id: string;
  tahun: number;
  bulan: string;
  nomorSpkLembur: string;
  totalUangLembur: number;
  linkFileSp2d: string;
}

const INITIAL_LEMBUR: LemburRecord[] = [
  {
    id: 'lembur-1',
    tahun: 2026,
    bulan: 'Agustus',
    nomorSpkLembur: 'SPK-LBR/08/BKHIT/2026',
    totalUangLembur: 14850000,
    linkFileSp2d: 'https://drive.google.com/file/d/sp2d-lembur-agustus/view',
  },
  {
    id: 'lembur-2',
    tahun: 2026,
    bulan: 'Juli',
    nomorSpkLembur: 'SPK-LBR/07/BKHIT/2026',
    totalUangLembur: 12600000,
    linkFileSp2d: 'https://drive.google.com/file/d/sp2d-lembur-juli/view',
  }
];

export const Sheet7LemburAsnView: React.FC = () => {
  const [records, setRecords] = useState<LemburRecord[]>(INITIAL_LEMBUR);
  const [formData, setFormData] = useState({
    tahun: 2026,
    bulan: 'September',
    nomorSpkLembur: `SPK-LBR/09/BKHIT/2026`,
    totalUangLembur: 15200000,
    linkFileSp2d: 'https://drive.google.com/file/d/sp2d-lembur/view',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSyncStatus('idle');
    setStatusMessage(null);

    const newRecord: LemburRecord = {
      id: `lembur-${Date.now()}`,
      tahun: formData.tahun,
      bulan: formData.bulan,
      nomorSpkLembur: formData.nomorSpkLembur,
      totalUangLembur: formData.totalUangLembur,
      linkFileSp2d: formData.linkFileSp2d,
    };

    setRecords(prev => [newRecord, ...prev]);

    try {
      const row = formatLemburToRow(newRecord);
      const res = await sendToUniversalWebhook({
        moduleKey: 'lembur',
        action: 'append',
        item: newRecord,
        customRow: row,
      });

      if (res.success) {
        setSyncStatus('success');
        setStatusMessage('Data lembur ASN berhasil disimpan dan disinkronkan ke Sheet "lembur ASN"!');
      } else {
        setSyncStatus('error');
        setStatusMessage(res.error || 'Data tersimpan di aplikasi, gagal sinkron webhook.');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setStatusMessage(err.message || 'Gagal mengirim ke webhook.');
    } finally {
      setIsSubmitting(false);
      setFormData(prev => ({
        ...prev,
        nomorSpkLembur: `SPK-LBR/10/BKHIT/2026`,
      }));
    }
  };

  const filteredRecords = records.filter(r => {
    const q = search.toLowerCase();
    return !search ||
      r.bulan.toLowerCase().includes(q) ||
      r.nomorSpkLembur.toLowerCase().includes(q) ||
      String(r.tahun).includes(q);
  });

  const handleExportExcel = () => {
    const exportData = filteredRecords.map(r => ({
      Tahun: r.tahun,
      Bulan: r.bulan,
      'Nomor SPK Lembur': r.nomorSpkLembur,
      'Total Uang Lembur': r.totalUangLembur,
      'Link File SP2D': r.linkFileSp2d,
    }));
    exportToExcel(exportData, `Lembur_ASN_Sheet7_${new Date().toISOString().slice(0, 10)}`);
  };

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit?gid=943482291#gid=943482291`;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-4 md:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-violet-600 text-white rounded-lg shadow-sm shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-bold text-slate-900">
                  Sheet 7: Lembur_ASN
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-200 text-violet-800 border border-violet-300">
                  Mode: Input Data
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-slate-700 border border-slate-200 font-mono">
                  Sheet: Lembur_ASN (gid: 943482291)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Formulir input data lembur ASN dengan 5 kolom resmi: Tahun, Bulan, Nomor SPK Lembur, Total Uang Lembur, Link File SP2D.
              </p>
            </div>
          </div>

          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer self-start md:self-auto"
          >
            <ExternalLink className="w-3.5 h-3.5 text-violet-600" />
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

      {/* Form Input 5 Kolom Lembur ASN */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-violet-600" />
          <span>Input Data Lembur ASN Baru (5 Kolom Spreadsheet)</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Kolom 1: Tahun */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                1. Tahun <span className="text-violet-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.tahun}
                onChange={(e) => setFormData({ ...formData, tahun: Number(e.target.value) || 2026 })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:bg-white font-mono"
              />
            </div>

            {/* Kolom 2: Bulan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                2. Bulan <span className="text-violet-500">*</span>
              </label>
              <select
                value={formData.bulan}
                onChange={(e) => setFormData({ ...formData, bulan: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:bg-white"
              >
                {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Kolom 3: Nomor SPK Lembur */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. Nomor SPK Lembur <span className="text-violet-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nomorSpkLembur}
                onChange={(e) => setFormData({ ...formData, nomorSpkLembur: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:bg-white font-mono"
                placeholder="SPK-LBR/09/BKHIT/2026"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kolom 4: Total Uang Lembur */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                4. Total Uang Lembur (Rp) <span className="text-violet-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.totalUangLembur}
                onChange={(e) => setFormData({ ...formData, totalUangLembur: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:bg-white font-mono"
              />
            </div>

            {/* Kolom 5: Link File SP2D */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                5. Link File SP2D (URL Drive)
              </label>
              <input
                type="url"
                value={formData.linkFileSp2d}
                onChange={(e) => setFormData({ ...formData, linkFileSp2d: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:bg-white font-mono"
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-pulse' : ''}`} />
              <span>{isSubmitting ? 'Menyimpan ke Sheet...' : 'Simpan & Sinkronkan ke Sheet Lembur ASN'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tabel 5 Kolom Lembur ASN */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Daftar Rekap Lembur di Database</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {filteredRecords.length} Periode
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari SPK atau bulan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:bg-white"
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
                <th className="py-3 px-4">Tahun</th>
                <th className="py-3 px-4">Bulan</th>
                <th className="py-3 px-4">Nomor SPK Lembur</th>
                <th className="py-3 px-4 text-right">Total Uang Lembur</th>
                <th className="py-3 px-4 text-center">Link File SP2D</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-violet-50/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-600">{r.tahun}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{r.bulan}</td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-800">{r.nomorSpkLembur}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-violet-700">
                    Rp {r.totalUangLembur.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {r.linkFileSp2d ? (
                      <a
                        href={r.linkFileSp2d}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700 font-medium hover:underline"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>SP2D</span>
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
