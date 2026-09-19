import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Search, 
  Download,
  Link2,
  MapPin,
  Clock,
  Pencil,
  Trash2,
  AlertTriangle,
  Save,
  X
} from 'lucide-react';
import { PerjalananDinasRecord } from '../../types';
import { sendToUniversalWebhook, formatSppdToRow } from '../../utils/universalSheetWebhook';
import { exportToExcel } from '../../utils/exportUtils';
import { TARGET_SPREADSHEET_ID } from '../../utils/googleSheetsLiveReader';

interface Sheet5SppdDinasViewProps {
  sppdList: PerjalananDinasRecord[];
  onAddSppd: (item: PerjalananDinasRecord) => void;
  onUpdateSppd?: (item: PerjalananDinasRecord) => void;
  onDeleteSppd?: (id: string) => void;
}

export const Sheet5SppdDinasView: React.FC<Sheet5SppdDinasViewProps> = ({
  sppdList,
  onAddSppd,
}) => {
  const [formData, setFormData] = useState({
    nomorSppdDanPegawai: `SPPD/042/BKHIT/2026 - Drh. Budi Prasetyo, M.Si`,
    kotaTujuan: 'Jakarta Pusat (Kantor Pusat BKHIT)',
    durasi: '3 Hari (15 - 17 Agustus 2026)',
    maksudPerjalanan: 'Koordinasi Tindak Karantina Hewan dan Sinkronisasi SIMPEG Nasional',
    rincianBiaya: 'Rp 6.850.000 (Tiket PP Rp 4.200.000, Uang Harian Rp 1.500.000, Penginapan Rp 1.150.000)',
    linkFileSppd: 'https://drive.google.com/file/d/sample-sppd-file/view',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [editingSppd, setEditingSppd] = useState<PerjalananDinasRecord | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [deletingSppd, setDeletingSppd] = useState<PerjalananDinasRecord | null>(null);

  const handleOpenEdit = (item: PerjalananDinasRecord) => {
    setEditingSppd(item);
    setEditFormData({
      id: item.id,
      nomorSppdDanPegawai: item.nomorSPPD || item.nomorSPD || item.nomorSuratTugas || '',
      kotaTujuan: item.kotaTujuan || item.tujuanDinas || '',
      lamaHari: item.lamaHari || 3,
      maksudPerjalanan: item.maksudPerjalanan || item.maksudDinas || '',
      totalAnggaran: item.totalAnggaran || 0,
      linkFileSppd: item.dokumenLampiran?.[0]?.fileUrl || '',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSppd) return;

    const updated: PerjalananDinasRecord = {
      ...editingSppd,
      nomorSPPD: editFormData.nomorSppdDanPegawai,
      nomorSPD: editFormData.nomorSppdDanPegawai,
      kotaTujuan: editFormData.kotaTujuan,
      lamaHari: Number(editFormData.lamaHari) || 1,
      maksudPerjalanan: editFormData.maksudPerjalanan,
      totalAnggaran: Number(editFormData.totalAnggaran) || 0,
      dokumenLampiran: editFormData.linkFileSppd ? [
        {
          id: 'doc-edit',
          judul: 'Berkala SPPD',
          fileUrl: editFormData.linkFileSppd,
          tipeFile: 'link',
          uploadedAt: new Date().toISOString(),
        }
      ] : editingSppd.dokumenLampiran,
    };

    if (onUpdateSppd) {
      onUpdateSppd(updated);
    }
    sendToUniversalWebhook({
      moduleKey: 'sppd',
      action: 'update',
      item: updated,
      customRow: formatSppdToRow(updated),
    });
    setStatusMessage(`Data SPPD berhasil diperbarui.`);
    setSyncStatus('success');
    setEditingSppd(null);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleConfirmDelete = () => {
    if (!deletingSppd) return;
    const target = deletingSppd;
    if (onDeleteSppd) {
      onDeleteSppd(target.id);
    }
    sendToUniversalWebhook({
      moduleKey: 'sppd',
      action: 'delete',
      item: target,
      customRow: formatSppdToRow(target),
    });
    setStatusMessage(`Data SPPD "${target.nomorSPPD || target.nomorSPD || target.id}" berhasil dihapus.`);
    setSyncStatus('success');
    setDeletingSppd(null);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomorSppdDanPegawai || !formData.kotaTujuan || !formData.maksudPerjalanan) {
      alert('Harap lengkapi nomor SPPD & pegawai, kota tujuan, dan maksud perjalanan.');
      return;
    }

    setIsSubmitting(true);
    setSyncStatus('idle');
    setStatusMessage(null);

    const parts = formData.nomorSppdDanPegawai.split(' - ');
    const noSpd = parts[0] || 'SPD/042/BKHIT/2026';
    const namaPeg = parts[1] || 'Pegawai Terkait';

    const newSppd: PerjalananDinasRecord = {
      id: `sppd-${Date.now()}`,
      nomorSuratTugas: `ST/042/BKHIT/2026`,
      nomorSPD: noSpd,
      nomorSPPD: formData.nomorSppdDanPegawai,
      employeeId: 'EMP-SPPD',
      namaPegawai: namaPeg,
      nip: '198503152008121002',
      jabatan: 'Medik Veteriner Ahli Muda',
      tujuanDinas: formData.kotaTujuan,
      kotaTujuan: formData.kotaTujuan,
      kotaAsal: 'Sorong',
      maksudDinas: formData.maksudPerjalanan,
      maksudPerjalanan: formData.maksudPerjalanan,
      tanggalBerangkat: new Date().toISOString().slice(0, 10),
      tanggalKembali: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      lamaHari: 3,
      mataAnggaran: '524111',
      pejabatPembuatKomitmen: 'PPK Balai Karantina Papua Barat Daya',
      rincianBiaya: {
        uangHarian: 1500000,
        uangTransport: 4200000,
        akomodasiHotel: 1150000,
        totalBiaya: 6850000,
      },
      status: 'Lunas Dicairkan',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dokumen: [
        {
          id: `doc-${Date.now()}`,
          namaFile: 'File_SPPD_Resmi.pdf',
          url: formData.linkFileSppd,
          uploadedAt: new Date().toISOString(),
        },
      ],
    };

    onAddSppd(newSppd);

    try {
      const row = formatSppdToRow(newSppd);
      const res = await sendToUniversalWebhook({
        moduleKey: 'sppd',
        action: 'append',
        item: newSppd,
        customRow: row,
      });

      if (res.success) {
        setSyncStatus('success');
        setStatusMessage('Data SPPD berhasil tersimpan dan disinkronkan ke Sheet "SPPD Dinas"!');
      } else {
        setSyncStatus('error');
        setStatusMessage(res.error || 'Tersimpan di aplikasi, gagal sinkron webhook.');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setStatusMessage(err.message || 'Gagal mengirim ke webhook.');
    } finally {
      setIsSubmitting(false);
      setFormData(prev => ({
        ...prev,
        nomorSppdDanPegawai: `SPPD/${String(sppdList.length + 2).padStart(3, '0')}/BKHIT/2026 - Nama Pegawai`,
        linkFileSppd: '',
      }));
    }
  };

  const filteredSppd = sppdList.filter(s => {
    const q = search.toLowerCase();
    return !search ||
      (s.nomorSPPD || s.nomorSPD || '').toLowerCase().includes(q) ||
      (s.kotaTujuan || s.tujuanDinas || '').toLowerCase().includes(q) ||
      (s.maksudPerjalanan || s.maksudDinas || '').toLowerCase().includes(q) ||
      (s.namaPegawai || '').toLowerCase().includes(q);
  });

  const handleExportExcel = () => {
    const exportData = filteredSppd.map(s => ({
      'Nomor SPPD & Pegawai': s.nomorSPPD || `${s.nomorSPD} - ${s.namaPegawai}`,
      'Kota Tujuan': s.kotaTujuan || s.tujuanDinas,
      Durasi: `${s.lamaHari} Hari (${s.tanggalBerangkat} s/d ${s.tanggalKembali})`,
      'Maksud Perjalanan': s.maksudPerjalanan || s.maksudDinas,
      'Rincian Biaya': `Rp ${(s.rincianBiaya?.totalBiaya || 0).toLocaleString('id-ID')}`,
      'Link File SPPD': s.dokumen?.[0]?.url || '-',
    }));
    exportToExcel(exportData, `SPPD_Dinas_Sheet5_${new Date().toISOString().slice(0, 10)}`);
  };

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit?gid=1303409856#gid=1303409856`;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4 md:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-cyan-600 text-white rounded-lg shadow-sm shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-bold text-slate-900">
                  Sheet 5: SPPD_Dinas
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-200 text-cyan-800 border border-cyan-300">
                  Mode: Input Data
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-slate-700 border border-slate-200 font-mono">
                  Sheet: SPPD_Dinas (gid: 1303409856)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Formulir input data Surat Perintah Perjalanan Dinas (SPPD) dengan 6 kolom: Nomor SPPD & Pegawai, Kota Tujuan, Durasi, Maksud Perjalanan, Rincian Biaya, Link File SPPD.
              </p>
            </div>
          </div>

          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer self-start md:self-auto"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-600" />
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

      {/* Form Input 6 Kolom SPPD */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-cyan-600" />
          <span>Input Data SPPD Baru (6 Kolom Spreadsheet)</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Kolom 1: Nomor SPPD & Pegawai */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                1. Nomor SPPD & Nama Pegawai <span className="text-cyan-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nomorSppdDanPegawai}
                onChange={(e) => setFormData({ ...formData, nomorSppdDanPegawai: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-cyan-500 focus:bg-white"
                placeholder="SPPD/042/BKHIT/2026 - Drh. Budi Prasetyo, M.Si"
              />
            </div>

            {/* Kolom 2: Kota Tujuan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                2. Kota Tujuan <span className="text-cyan-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.kotaTujuan}
                onChange={(e) => setFormData({ ...formData, kotaTujuan: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-cyan-500 focus:bg-white"
                placeholder="Contoh: Jakarta Pusat / Manokwari"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Kolom 3: Durasi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. Durasi Perjalanan <span className="text-cyan-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.durasi}
                onChange={(e) => setFormData({ ...formData, durasi: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-cyan-500 focus:bg-white"
                placeholder="Contoh: 3 Hari (15 - 17 Agustus 2026)"
              />
            </div>

            {/* Kolom 4: Maksud Perjalanan */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                4. Maksud Perjalanan <span className="text-cyan-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.maksudPerjalanan}
                onChange={(e) => setFormData({ ...formData, maksudPerjalanan: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-cyan-500 focus:bg-white"
                placeholder="Maksud dan tujuan tugas perjalanan dinas"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kolom 5: Rincian Biaya */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                5. Rincian Biaya (Transport, Harian, dsb) <span className="text-cyan-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.rincianBiaya}
                onChange={(e) => setFormData({ ...formData, rincianBiaya: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-cyan-500 focus:bg-white"
                placeholder="Rp 6.850.000 (Tiket, Uang Harian, Hotel)"
              />
            </div>

            {/* Kolom 6: Link File SPPD */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                6. Link File SPPD (Google Drive / Berkas)
              </label>
              <input
                type="url"
                value={formData.linkFileSppd}
                onChange={(e) => setFormData({ ...formData, linkFileSppd: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-cyan-500 focus:bg-white font-mono"
                placeholder="https://drive.google.com/file/..."
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-pulse' : ''}`} />
              <span>{isSubmitting ? 'Menyimpan ke Sheet...' : 'Simpan & Sinkronkan ke Sheet SPPD Dinas'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tabel 6 Kolom SPPD */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Daftar SPPD Dinas di Database</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {filteredSppd.length} Data
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari SPPD, Kota, atau Maksud..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-cyan-500 focus:bg-white"
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
                <th className="py-3 px-4">Nomor SPPD & Pegawai</th>
                <th className="py-3 px-4">Kota Tujuan</th>
                <th className="py-3 px-4">Durasi</th>
                <th className="py-3 px-4">Maksud Perjalanan</th>
                <th className="py-3 px-4">Rincian Biaya</th>
                <th className="py-3 px-4 text-center">Link File SPPD</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSppd.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Belum ada data SPPD. Silakan gunakan formulir di atas untuk menginput data.
                  </td>
                </tr>
              ) : (
                filteredSppd.map((s, idx) => {
                  const fileUrl = s.dokumenLampiran?.[0]?.fileUrl;
                  const displaySppdAndPegawai = s.nomorSppd || `${s.nomorSuratTugas} - ${s.pelaksana[0]?.nama || 'Pegawai'}`;
                  return (
                    <tr key={s.id || idx} className="hover:bg-cyan-50/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">{displaySppdAndPegawai}</td>
                      <td className="py-3 px-4 text-slate-700">{s.kotaTujuan}</td>
                      <td className="py-3 px-4 text-slate-600">{s.lamaHari ? `${s.lamaHari} Hari` : '3 Hari'}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{s.maksudPerjalanan}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        Rp {(s.totalAnggaran || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-700 font-medium hover:underline"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>Buka Berkas</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(s)}
                            className="p-1 hover:bg-amber-100 text-amber-600 rounded transition-colors cursor-pointer"
                            title="Edit Data SPPD"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingSppd(s)}
                            className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors cursor-pointer"
                            title="Hapus Data SPPD"
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

      {/* Modal Edit SPPD */}
      {editingSppd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-600" />
                <span>Edit Data SPPD Dinas</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingSppd(null)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor SPPD & Pegawai</label>
                <input
                  type="text"
                  value={editFormData.nomorSppdDanPegawai || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, nomorSppdDanPegawai: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kota Tujuan</label>
                  <input
                    type="text"
                    value={editFormData.kotaTujuan || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, kotaTujuan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Durasi (Hari)</label>
                  <input
                    type="number"
                    value={editFormData.lamaHari || 1}
                    onChange={(e) => setEditFormData({ ...editFormData, lamaHari: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Maksud Perjalanan Dinas</label>
                <textarea
                  rows={2}
                  value={editFormData.maksudPerjalanan || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, maksudPerjalanan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Biaya (Rp)</label>
                  <input
                    type="number"
                    value={editFormData.totalAnggaran || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, totalAnggaran: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Link Berkas SPPD (Google Drive/URL)</label>
                  <input
                    type="url"
                    value={editFormData.linkFileSppd || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, linkFileSppd: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSppd(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus SPPD */}
      {deletingSppd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Data SPPD</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data SPPD <strong className="text-slate-900">{deletingSppd.nomorSPPD || deletingSppd.nomorSPD || deletingSppd.id}</strong> tujuan <strong className="text-slate-900">{deletingSppd.kotaTujuan || deletingSppd.tujuanDinas}</strong>?
                </p>
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeletingSppd(null)}
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
