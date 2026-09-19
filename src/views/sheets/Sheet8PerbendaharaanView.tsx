import React, { useState } from 'react';
import { 
  Coins, 
  Plus, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Search, 
  Download,
  Link2,
  FileCheck
} from 'lucide-react';
import { sendToUniversalWebhook, formatPerbendaharaanToRow } from '../../utils/universalSheetWebhook';
import { exportToExcel } from '../../utils/exportUtils';
import { TARGET_SPREADSHEET_ID } from '../../utils/googleSheetsLiveReader';

interface PerbendaharaanRecord {
  id: string;
  nomorDokumen: string;
  jenisPembayaran: 'SPP' | 'SPM' | 'SP2D';
  tanggalTerbit: string;
  jumlahNominal: number;
  uraianPengeluaran: string;
  linkFileSp2d: string;
}

const INITIAL_PERBENDAHARAAN: PerbendaharaanRecord[] = [
  {
    id: 'perb-1',
    nomorDokumen: 'SP2D-26081001-BKHIT',
    jenisPembayaran: 'SP2D',
    tanggalTerbit: '2026-08-10',
    jumlahNominal: 78500000,
    uraianPengeluaran: 'Pembayaran Gaji dan Tunjangan Kinerja Pegawai Periode Agustus 2026',
    linkFileSp2d: 'https://drive.google.com/file/d/sp2d-gaji-agustus/view',
  },
  {
    id: 'perb-2',
    nomorDokumen: 'SPM-26080502-BKHIT',
    jenisPembayaran: 'SPM',
    tanggalTerbit: '2026-08-05',
    jumlahNominal: 51660000,
    uraianPengeluaran: 'Pengajuan Pembayaran Uang Makan Pegawai ASN Bulan Juli 2026',
    linkFileSp2d: 'https://drive.google.com/file/d/spm-uangmakan/view',
  },
  {
    id: 'perb-3',
    nomorDokumen: 'SPP-26080104-BKHIT',
    jenisPembayaran: 'SPP',
    tanggalTerbit: '2026-08-01',
    jumlahNominal: 28400000,
    uraianPengeluaran: 'Belanja Perjalanan Dinas Paket Koordinasi Karantina Manokwari',
    linkFileSp2d: 'https://drive.google.com/file/d/spp-sppd/view',
  }
];

export const Sheet8PerbendaharaanView: React.FC = () => {
  const [records, setRecords] = useState<PerbendaharaanRecord[]>(INITIAL_PERBENDAHARAAN);
  const [formData, setFormData] = useState({
    nomorDokumen: `SP2D-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-01`,
    jenisPembayaran: 'SP2D' as 'SPP' | 'SPM' | 'SP2D',
    tanggalTerbit: new Date().toISOString().slice(0, 10),
    jumlahNominal: 35000000,
    uraianPengeluaran: 'Belanja Keperluan Operasional Balai Karantina Papua Barat Daya',
    linkFileSp2d: 'https://drive.google.com/file/d/sample-sp2d/view',
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

    const newRecord: PerbendaharaanRecord = {
      id: `perb-${Date.now()}`,
      nomorDokumen: formData.nomorDokumen,
      jenisPembayaran: formData.jenisPembayaran,
      tanggalTerbit: formData.tanggalTerbit,
      jumlahNominal: formData.jumlahNominal,
      uraianPengeluaran: formData.uraianPengeluaran,
      linkFileSp2d: formData.linkFileSp2d,
    };

    setRecords(prev => [newRecord, ...prev]);

    try {
      const row = formatPerbendaharaanToRow(newRecord);
      const res = await sendToUniversalWebhook({
        moduleKey: 'perbendaharaan',
        action: 'append',
        item: newRecord,
        customRow: row,
      });

      if (res.success) {
        setSyncStatus('success');
        setStatusMessage('Dokumen perbendaharaan berhasil disimpan dan disinkronkan ke Sheet "Perbendaharaan"!');
      } else {
        setSyncStatus('error');
        setStatusMessage(res.error || 'Tersimpan lokal, gagal sinkron ke webhook.');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setStatusMessage(err.message || 'Gagal mengirim ke webhook.');
    } finally {
      setIsSubmitting(false);
      setFormData(prev => ({
        ...prev,
        nomorDokumen: `SP2D-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${String(records.length + 2).padStart(2, '0')}`,
      }));
    }
  };

  const filteredRecords = records.filter(r => {
    const q = search.toLowerCase();
    return !search ||
      r.nomorDokumen.toLowerCase().includes(q) ||
      r.jenisPembayaran.toLowerCase().includes(q) ||
      r.uraianPengeluaran.toLowerCase().includes(q);
  });

  const handleExportExcel = () => {
    const exportData = filteredRecords.map(r => ({
      'Nomor Dokumen': r.nomorDokumen,
      'Jenis Pembayaran': r.jenisPembayaran,
      'Tanggal Terbit': r.tanggalTerbit,
      'Jumlah Nominal': r.jumlahNominal,
      'Uraian Pengeluaran': r.uraianPengeluaran,
      'Link File SP2D': r.linkFileSp2d,
    }));
    exportToExcel(exportData, `Perbendaharaan_Sheet8_${new Date().toISOString().slice(0, 10)}`);
  };

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit?gid=820261205#gid=820261205`;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 md:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-lg shadow-sm shrink-0">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-bold text-slate-900">
                  Sheet 8: Perbendaharaan
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-200 text-teal-800 border border-teal-300">
                  Mode: Input Data
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-slate-700 border border-slate-200 font-mono">
                  Sheet: Perbendaharaan (gid: 820261205)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Formulir input data perbendaharaan dengan 6 kolom: Nomor Dokumen, Jenis Pembayaran, Tanggal Terbit, Jumlah Nominal, Uraian Pengeluaran, Link File SP2D.
              </p>
            </div>
          </div>

          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer self-start md:self-auto"
          >
            <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
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

      {/* Form Input 6 Kolom Perbendaharaan */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-teal-600" />
          <span>Input Dokumen Perbendaharaan Baru (6 Kolom Spreadsheet)</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Kolom 1: Nomor Dokumen */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                1. Nomor Dokumen <span className="text-teal-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nomorDokumen}
                onChange={(e) => setFormData({ ...formData, nomorDokumen: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:bg-white font-mono"
                placeholder="SP2D-26081001-BKHIT"
              />
            </div>

            {/* Kolom 2: Jenis Pembayaran */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                2. Jenis Pembayaran <span className="text-teal-500">*</span>
              </label>
              <select
                value={formData.jenisPembayaran}
                onChange={(e) => setFormData({ ...formData, jenisPembayaran: e.target.value as 'SPP' | 'SPM' | 'SP2D' })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:bg-white text-slate-800"
              >
                <option value="SPP">SPP (Surat Permintaan Pembayaran)</option>
                <option value="SPM">SPM (Surat Perintah Membayar)</option>
                <option value="SP2D">SP2D (Surat Perintah Pencairan Dana)</option>
              </select>
            </div>

            {/* Kolom 3: Tanggal Terbit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. Tanggal Terbit <span className="text-teal-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.tanggalTerbit}
                onChange={(e) => setFormData({ ...formData, tanggalTerbit: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:bg-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Kolom 4: Jumlah Nominal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                4. Jumlah Nominal (Rp) <span className="text-teal-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.jumlahNominal}
                onChange={(e) => setFormData({ ...formData, jumlahNominal: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:bg-white font-mono"
              />
            </div>

            {/* Kolom 5: Uraian Pengeluaran */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                5. Uraian Pengeluaran <span className="text-teal-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.uraianPengeluaran}
                onChange={(e) => setFormData({ ...formData, uraianPengeluaran: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:bg-white"
                placeholder="Rincian peruntukan belanja anggaran..."
              />
            </div>

            {/* Kolom 6: Link File SP2D */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                6. Link File SP2D (URL Berkas)
              </label>
              <input
                type="url"
                value={formData.linkFileSp2d}
                onChange={(e) => setFormData({ ...formData, linkFileSp2d: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:bg-white font-mono"
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-pulse' : ''}`} />
              <span>{isSubmitting ? 'Menyimpan ke Sheet...' : 'Simpan & Sinkronkan ke Sheet Perbendaharaan'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tabel 6 Kolom Perbendaharaan */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Daftar Dokumen Perbendaharaan di Database</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {filteredRecords.length} Dokumen
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari no dokumen atau uraian..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:bg-white"
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
                <th className="py-3 px-4">Nomor Dokumen</th>
                <th className="py-3 px-4 text-center">Jenis</th>
                <th className="py-3 px-4">Tanggal Terbit</th>
                <th className="py-3 px-4 text-right">Jumlah Nominal</th>
                <th className="py-3 px-4">Uraian Pengeluaran</th>
                <th className="py-3 px-4 text-center">Link File SP2D</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-teal-50/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">{r.nomorDokumen}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.jenisPembayaran === 'SP2D'
                        ? 'bg-emerald-100 text-emerald-800'
                        : r.jenisPembayaran === 'SPM'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {r.jenisPembayaran}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{r.tanggalTerbit}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-teal-700">
                    Rp {r.jumlahNominal.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-sm truncate">{r.uraianPengeluaran}</td>
                  <td className="py-3 px-4 text-center">
                    {r.linkFileSp2d ? (
                      <a
                        href={r.linkFileSp2d}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium hover:underline"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Lihat Berkas</span>
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
