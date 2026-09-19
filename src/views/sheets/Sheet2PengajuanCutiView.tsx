import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Calendar, 
  Search, 
  Download,
  Link2,
  Clock,
  Sparkles,
  Pencil,
  Trash2,
  AlertTriangle,
  X,
  Save
} from 'lucide-react';
import { CutiBKNRecord, JenisCutiBKN } from '../../types';
import { sendToUniversalWebhook, formatCutiToRow, getStoredUniversalWebhookUrl } from '../../utils/universalSheetWebhook';
import { exportToExcel } from '../../utils/exportUtils';
import { TARGET_SPREADSHEET_ID } from '../../utils/googleSheetsLiveReader';

interface Sheet2PengajuanCutiViewProps {
  cutiList: CutiBKNRecord[];
  onAddCuti: (item: CutiBKNRecord) => void;
  onUpdateCuti?: (item: CutiBKNRecord) => void;
  onDeleteCuti?: (id: string) => void;
}

const JENIS_CUTI_OPTIONS: JenisCutiBKN[] = [
  'Cuti Tahunan',
  'Cuti Besar',
  'Cuti Sakit',
  'Cuti Melahirkan',
  'Cuti Karena Alasan Penting',
  'Cuti Bersama',
  'Cuti di Luar Tanggungan Negara',
];

export const Sheet2PengajuanCutiView: React.FC<Sheet2PengajuanCutiViewProps> = ({
  cutiList,
  onAddCuti,
  onUpdateCuti,
  onDeleteCuti,
}) => {
  const [formData, setFormData] = useState({
    noPermohonan: `CUTI/BKHIT/2026/${String(cutiList.length + 1).padStart(3, '0')}`,
    nip: '',
    namaPemohon: '',
    jenisCuti: 'Cuti Tahunan' as JenisCutiBKN,
    alasanPermohonan: '',
    lamaHari: 3,
    tglMulai: new Date().toISOString().slice(0, 10),
    tglSelesai: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    linkPermohonanCuti: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // States for Edit and Delete
  const [editingCuti, setEditingCuti] = useState<CutiBKNRecord | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<CutiBKNRecord>>({});
  const [deletingCuti, setDeletingCuti] = useState<CutiBKNRecord | null>(null);

  const handleOpenEdit = (item: CutiBKNRecord) => {
    setEditingCuti(item);
    setEditFormData({
      id: item.id,
      noPermohonan: item.noPermohonan,
      nip: item.nip,
      employeeName: item.employeeName,
      jenisCuti: item.jenisCuti,
      alasanCuti: item.alasanCuti,
      lamaHari: item.lamaHari,
      tanggalMulai: item.tanggalMulai,
      tanggalSelesai: item.tanggalSelesai,
      linkPermohonanCuti: (item as any).linkPermohonanCuti || '',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCuti) return;
    const updated: CutiBKNRecord = {
      ...editingCuti,
      ...editFormData,
    } as CutiBKNRecord;

    if (onUpdateCuti) {
      onUpdateCuti(updated);
    }
    sendToUniversalWebhook({
      moduleKey: 'cuti',
      action: 'update',
      item: updated,
      customRow: formatCutiToRow(updated),
    });
    setStatusMessage(`Data Cuti ${updated.noPermohonan} berhasil diperbarui.`);
    setSyncStatus('success');
    setEditingCuti(null);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleConfirmDelete = () => {
    if (!deletingCuti) return;
    const target = deletingCuti;
    if (onDeleteCuti) {
      onDeleteCuti(target.id);
    }
    sendToUniversalWebhook({
      moduleKey: 'cuti',
      action: 'delete',
      item: target,
      customRow: formatCutiToRow(target),
    });
    setStatusMessage(`Data Cuti ${target.noPermohonan} berhasil dihapus.`);
    setSyncStatus('success');
    setDeletingCuti(null);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Auto calculate lama hari bila tgl mulai & selesai berubah
  const handleDateChange = (type: 'mulai' | 'selesai', val: string) => {
    setFormData(prev => {
      const next = { ...prev, [type === 'mulai' ? 'tglMulai' : 'tglSelesai']: val };
      if (next.tglMulai && next.tglSelesai) {
        const d1 = new Date(next.tglMulai).getTime();
        const d2 = new Date(next.tglSelesai).getTime();
        if (d2 >= d1) {
          const days = Math.round((d2 - d1) / (1000 * 3600 * 24)) + 1;
          next.lamaHari = days;
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nip || !formData.namaPemohon || !formData.alasanPermohonan) {
      alert('Harap lengkapi NIP, Nama Pemohon, dan Alasan Permohonan Cuti.');
      return;
    }

    setIsSubmitting(true);
    setSyncStatus('idle');
    setStatusMessage(null);

    const newCuti: CutiBKNRecord = {
      id: `cuti-${Date.now()}`,
      noPermohonan: formData.noPermohonan,
      tanggalPengajuan: new Date().toISOString().slice(0, 10),
      employeeId: formData.nip,
      nip: formData.nip,
      employeeName: formData.namaPemohon,
      jabatan: 'Pegawai ASN BKHIT',
      unitKerja: 'Balai Karantina Papua Barat Daya',
      masaKerja: '5 Tahun',
      jenisCuti: formData.jenisCuti,
      alasanCuti: formData.alasanPermohonan,
      lamaHari: formData.lamaHari,
      tanggalMulai: formData.tglMulai,
      tanggalSelesai: formData.tglSelesai,
      catatanCuti: {
        n2Tahun: 2024,
        n2Sisa: 0,
        n1Tahun: 2025,
        n1Sisa: 0,
        nTahun: 2026,
        nSisa: 12 - formData.lamaHari,
      },
      alamatSelamaCuti: 'Kota Sorong',
      nomorTelepon: '-',
      pertimbanganAtasan: {
        status: 'DISETUJUI',
        catatan: 'Disetujui untuk diproses',
        namaAtasan: 'Kepala Bagian Tata Usaha',
        nipAtasan: '19800101 200501 1 001',
        jabatanAtasan: 'Kasubag TU',
        tanggalPertimbangan: new Date().toISOString().slice(0, 10),
      },
      keputusanPejabat: {
        status: 'DISETUJUI',
        catatan: 'SK Cuti disetujui',
        namaPejabat: 'Kepala Balai Karantina',
        nipPejabat: '19750212 199903 1 002',
        jabatanPejabat: 'Kepala Balai',
        tanggalKeputusan: new Date().toISOString().slice(0, 10),
      },
      statusFinal: 'Disetujui',
      updatedAt: new Date().toISOString(),
      dokumenPendukung: formData.linkPermohonanCuti ? {
        nama: 'Link Permohonan Cuti',
        fileName: 'Link_Permohonan_Cuti',
        fileData: formData.linkPermohonanCuti,
      } : undefined,
    };

    // Tambah ke state lokal
    onAddCuti(newCuti);

    // Kirim langsung ke Google Spreadsheet via Universal Webhook
    try {
      const row = formatCutiToRow(newCuti);
      const res = await sendToUniversalWebhook({
        moduleKey: 'cuti',
        action: 'append',
        item: newCuti,
        customRow: row,
      });

      if (res.success) {
        setSyncStatus('success');
        setStatusMessage(`Data berhasil disimpan & terkirim ke Google Spreadsheet Sheet "Pengajuan Cuti"!`);
      } else {
        setSyncStatus('error');
        setStatusMessage(res.error || 'Data tersimpan di aplikasi lokal, gagal terkirim ke Webhook.');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setStatusMessage(err.message || 'Terjadi kesalahan pengiriman webhook.');
    } finally {
      setIsSubmitting(false);
      // Reset form
      setFormData(prev => ({
        ...prev,
        noPermohonan: `CUTI/BKHIT/2026/${String(cutiList.length + 2).padStart(3, '0')}`,
        nip: '',
        namaPemohon: '',
        alasanPermohonan: '',
        linkPermohonanCuti: '',
      }));
    }
  };

  const filteredCuti = cutiList.filter(c => {
    const q = search.toLowerCase();
    return !search || 
      c.noPermohonan.toLowerCase().includes(q) ||
      c.employeeName.toLowerCase().includes(q) ||
      c.nip.toLowerCase().includes(q) ||
      c.jenisCuti.toLowerCase().includes(q);
  });

  const handleExportExcel = () => {
    const exportData = filteredCuti.map(c => ({
      'No Permohonan': c.noPermohonan,
      NIP: c.nip,
      'Nama Pemohon': c.employeeName,
      'Jenis Cuti (BKN 24/2017)': c.jenisCuti,
      'Alasan Permohonan': c.alasanCuti,
      'Lama (Hari)': c.lamaHari,
      'Tgl Mulai': c.tanggalMulai,
      'Tgl Selesai': c.tanggalSelesai,
      'Link Permohonan Cuti': (c as any).linkPermohonanCuti || c.dokumenPendukung?.fileData || '-',
    }));
    exportToExcel(exportData, `Pengajuan_Cuti_Sheet2_${new Date().toISOString().slice(0, 10)}`);
  };

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit?gid=1792882133#gid=1792882133`;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 md:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-lg shadow-sm shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-bold text-slate-900">
                  Sheet 2: Pengajuan_Cuti (BKN 24/2017)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-200 text-rose-800 border border-rose-300">
                  Mode: Input Data
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-slate-700 border border-slate-200 font-mono">
                  Sheet: Pengajuan_Cuti (gid: 1792882133)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Formulir input data cuti pegawai sesuai 9 kolom resmi. Data yang disimpan akan langsung di-append ke Google Spreadsheet.
              </p>
            </div>
          </div>

          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer self-start md:self-auto"
          >
            <ExternalLink className="w-3.5 h-3.5 text-rose-600" />
            <span>Lihat di Spreadsheet</span>
          </a>
        </div>
      </div>

      {/* Status Notifikasi */}
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

      {/* FORM INPUT 9 KOLOM RESMI */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-rose-600" />
          <span>Input Data Pengajuan Cuti Baru (9 Kolom Spreadsheet)</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Kolom 1: No Permohonan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                1. No Permohonan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.noPermohonan}
                onChange={(e) => setFormData({ ...formData, noPermohonan: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-rose-500 focus:bg-white font-mono"
                placeholder="CUTI/BKHIT/2026/001"
              />
            </div>

            {/* Kolom 2: NIP */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                2. NIP Pegawai <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-rose-500 focus:bg-white font-mono"
                placeholder="19850315 200812 1 002"
              />
            </div>

            {/* Kolom 3: Nama Pemohon */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. Nama Pemohon <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.namaPemohon}
                onChange={(e) => setFormData({ ...formData, namaPemohon: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-rose-500 focus:bg-white"
                placeholder="Nama Lengkap Pemohon Cuti"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Kolom 4: Jenis Cuti */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                4. Jenis Cuti (BKN 24/2017) <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.jenisCuti}
                onChange={(e) => setFormData({ ...formData, jenisCuti: e.target.value as JenisCutiBKN })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-rose-500 focus:bg-white text-slate-800"
              >
                {JENIS_CUTI_OPTIONS.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>

            {/* Kolom 5: Alasan Permohonan */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                5. Alasan Permohonan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.alasanPermohonan}
                onChange={(e) => setFormData({ ...formData, alasanPermohonan: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-rose-500 focus:bg-white"
                placeholder="Contoh: Keperluan keluarga mendesak / Istirahat tahunan"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Kolom 6: Lama Hari */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                6. Lama (Hari)
              </label>
              <input
                type="number"
                min={1}
                value={formData.lamaHari}
                onChange={(e) => setFormData({ ...formData, lamaHari: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-rose-500 focus:bg-white font-mono"
              />
            </div>

            {/* Kolom 7: Tgl Mulai */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                7. Tgl Mulai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.tglMulai}
                onChange={(e) => handleDateChange('mulai', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-rose-500 focus:bg-white"
              />
            </div>

            {/* Kolom 8: Tgl Selesai */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                8. Tgl Selesai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.tglSelesai}
                onChange={(e) => handleDateChange('selesai', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-rose-500 focus:bg-white"
              />
            </div>

            {/* Kolom 9: Link Permohonan Cuti */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                9. Link Permohonan Cuti (URL Drive)
              </label>
              <input
                type="url"
                value={formData.linkPermohonanCuti}
                onChange={(e) => setFormData({ ...formData, linkPermohonanCuti: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-rose-500 focus:bg-white font-mono"
                placeholder="https://drive.google.com/file/..."
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-pulse' : ''}`} />
              <span>{isSubmitting ? 'Menyimpan & Mengirim ke Sheet...' : 'Simpan & Sinkronkan ke Spreadsheet'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Data Cuti Yang Telah Diajukan */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Daftar Pengajuan Cuti di Database</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {filteredCuti.length} Data
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari permohonan cuti..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-rose-500 focus:bg-white"
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
                <th className="py-3 px-4">No Permohonan</th>
                <th className="py-3 px-4">NIP</th>
                <th className="py-3 px-4">Nama Pemohon</th>
                <th className="py-3 px-4">Jenis Cuti (BKN 24/2017)</th>
                <th className="py-3 px-4">Alasan Permohonan</th>
                <th className="py-3 px-4 text-center">Lama (Hari)</th>
                <th className="py-3 px-4">Tgl Mulai</th>
                <th className="py-3 px-4">Tgl Selesai</th>
                <th className="py-3 px-4 text-center">Link Permohonan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCuti.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    Belum ada data pengajuan cuti. Silakan gunakan form di atas untuk menambahkan data baru.
                  </td>
                </tr>
              ) : (
                filteredCuti.map((c, idx) => (
                  <tr key={c.id || idx} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{c.noPermohonan}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{c.nip}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{c.employeeName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                        {c.jenisCuti}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{c.alasanCuti}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{c.lamaHari} Hari</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{c.tanggalMulai}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{c.tanggalSelesai}</td>
                    <td className="py-3 px-4 text-center">
                      {(c as any).linkPermohonanCuti || c.dokumenPendukung?.fileData ? (
                        <a
                          href={(c as any).linkPermohonanCuti || c.dokumenPendukung?.fileData}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-medium hover:underline"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span>Buka File</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 hover:bg-amber-100 text-amber-600 rounded transition-colors cursor-pointer"
                          title="Edit Pengajuan Cuti"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCuti(c)}
                          className="p-1.5 hover:bg-rose-100 text-rose-600 rounded transition-colors cursor-pointer"
                          title="Hapus Pengajuan Cuti"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal Edit Data Cuti */}
      {editingCuti && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-600" />
                <span>Edit Pengajuan Cuti ASN</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCuti(null)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. Permohonan</label>
                  <input
                    type="text"
                    value={editFormData.noPermohonan || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, noPermohonan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP Pegawai</label>
                  <input
                    type="text"
                    value={editFormData.nip || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, nip: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pegawai</label>
                <input
                  type="text"
                  value={editFormData.employeeName || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, employeeName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Cuti</label>
                  <select
                    value={editFormData.jenisCuti || 'Cuti Tahunan'}
                    onChange={(e) => setEditFormData({ ...editFormData, jenisCuti: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {JENIS_CUTI_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lama Hari</label>
                  <input
                    type="number"
                    min={1}
                    value={editFormData.lamaHari || 1}
                    onChange={(e) => setEditFormData({ ...editFormData, lamaHari: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={editFormData.tanggalMulai || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, tanggalMulai: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={editFormData.tanggalSelesai || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, tanggalSelesai: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alasan Permohonan Cuti</label>
                <textarea
                  rows={2}
                  value={editFormData.alasanCuti || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, alasanCuti: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Link Dokumen Permohonan (Google Drive / URL)</label>
                <input
                  type="url"
                  value={(editFormData as any).linkPermohonanCuti || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, linkPermohonanCuti: e.target.value } as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                  placeholder="https://drive.google.com/..."
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCuti(null)}
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

      {/* Modal Konfirmasi Hapus Cuti */}
      {deletingCuti && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Pengajuan Cuti</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data pengajuan cuti <strong className="text-slate-900">{deletingCuti.noPermohonan}</strong> atas nama <strong className="text-slate-900">{deletingCuti.employeeName}</strong>?
                </p>
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeletingCuti(null)}
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
