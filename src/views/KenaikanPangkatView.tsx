import React, { useState } from 'react';
import { 
  Award, 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  Trash2, 
  Edit3, 
  Download, 
  CheckCircle2, 
  Clock, 
  FileText, 
  X, 
  FileSpreadsheet,
  Check,
  AlertCircle
} from 'lucide-react';
import { KenaikanPangkatRecord, JenisKP, StatusKP, Employee } from '../types';
import { exportToExcel } from '../utils/exportUtils';

interface KenaikanPangkatViewProps {
  kpList: KenaikanPangkatRecord[];
  employees: Employee[];
  onAddKP: (record: KenaikanPangkatRecord) => void;
  onUpdateKP: (record: KenaikanPangkatRecord) => void;
  onDeleteKP: (id: string) => void;
}

export const KenaikanPangkatView: React.FC<KenaikanPangkatViewProps> = ({
  kpList,
  employees,
  onAddKP,
  onUpdateKP,
  onDeleteKP,
}) => {
  const [search, setSearch] = useState('');
  const [filterPeriode, setFilterPeriode] = useState('ALL');
  const [filterJenis, setFilterJenis] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<Partial<KenaikanPangkatRecord>>({
    employeeId: '',
    employeeName: '',
    nip: '',
    jabatan: '',
    pangkatLama: 'Penata Muda / III/a',
    pangkatBaru: 'Penata Muda Tk.I / III/b',
    periode: 'April 2026',
    jenisKP: 'Jabatan Fungsional',
    status: 'Berkas Diupload',
    berkasLengkap: true,
    catatan: 'Pengajuan usulan kenaikan pangkat reguler periode April.',
    dokumenPersyaratan: [
      { nama: 'SK Pangkat Terakhir', status: 'Ada' },
      { nama: 'SK Jabatan Terakhir', status: 'Ada' },
      { nama: 'PAK Konversi Terakhir', status: 'Ada' },
      { nama: 'SKP 2 Tahun Terakhir', status: 'Ada' },
      { nama: 'Ijazah & Transkrip Nilai', status: 'Ada' }
    ]
  });

  const filteredKP = kpList.filter((k) => {
    const matchesSearch =
      k.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      k.nip.toLowerCase().includes(search.toLowerCase());

    const matchesPeriode = filterPeriode === 'ALL' || k.periode === filterPeriode;
    const matchesJenis = filterJenis === 'ALL' || k.jenisKP === filterJenis;

    return matchesSearch && matchesPeriode && matchesJenis;
  });

  const handleSelectEmployee = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;

    setFormData({
      ...formData,
      employeeId: emp.id,
      employeeName: `${emp.gelarDepan || ''} ${emp.nama} ${emp.gelarBelakang || ''}`.trim(),
      nip: emp.nip,
      jabatan: emp.jabatan,
      pangkatLama: emp.pangkatGolongan,
    });
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    const emp = employees[0];
    setFormData({
      employeeId: emp?.id || '',
      employeeName: emp?.nama || '',
      nip: emp?.nip || '',
      jabatan: emp?.jabatan || '',
      pangkatLama: emp?.pangkatGolongan || 'Penata Muda / III/a',
      pangkatBaru: 'Penata Muda Tk.I / III/b',
      periode: 'April 2026',
      jenisKP: 'Jabatan Fungsional',
      status: 'Berkas Diupload',
      berkasLengkap: true,
      catatan: 'Pengajuan usulan periode April 2026.',
      dokumenPersyaratan: [
        { nama: 'SK Pangkat Terakhir', status: 'Ada', fileName: 'SK_Pangkat_Terakhir.pdf' },
        { nama: 'SK Jabatan Terakhir', status: 'Ada', fileName: 'SK_Jabatan.pdf' },
        { nama: 'PAK Konversi Terakhir', status: 'Ada', fileName: 'PAK_Konversi.pdf' },
        { nama: 'SKP 2 Tahun Terakhir', status: 'Ada', fileName: 'SKP_2024_2025.pdf' },
        { nama: 'Ijazah & Transkrip', status: 'Ada', fileName: 'Ijazah_Terakhir.pdf' }
      ]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (kp: KenaikanPangkatRecord) => {
    setIsEditing(true);
    setFormData({ ...kp });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeName || !formData.nip) {
      alert('Pilih pegawai terlebih dahulu.');
      return;
    }

    const payload: KenaikanPangkatRecord = {
      ...(formData as KenaikanPangkatRecord),
      id: isEditing && formData.id ? formData.id : `KP-${Date.now().toString().slice(-4)}`,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    if (isEditing) {
      onUpdateKP(payload);
    } else {
      onAddKP(payload);
    }
    setIsModalOpen(false);
  };

  const handleExportExcel = () => {
    const data = kpList.map((k) => ({
      NIP: k.nip,
      Nama_Pegawai: k.employeeName,
      Jabatan: k.jabatan,
      Pangkat_Lama: k.pangkatLama,
      Pangkat_Baru: k.pangkatBaru,
      Periode: k.periode,
      Jenis_KP: k.jenisKP,
      Status_Tahapan: k.status,
      Berkas_Lengkap: k.berkasLengkap ? 'Lengkap' : 'Belum Lengkap',
    }));
    exportToExcel(data, 'Nominatif KP', 'Daftar_Nominatif_Kenaikan_Pangkat_BKN');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-600" /> Kenaikan Pangkat Pegawai (KP ASN)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen usulan periode April & Oktober, verifikasi kelengkapan berkas SIASN BKN, dan tracking SK
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Ekspor Nominatif</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Usulkan Kenaikan Pangkat</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau NIP pegawai yang diusulkan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
          />
        </div>
        <div>
          <select
            value={filterPeriode}
            onChange={(e) => setFilterPeriode(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-500 focus:bg-white"
          >
            <option value="ALL">Semua Periode KP</option>
            <option value="April 2026">Periode April 2026</option>
            <option value="Oktober 2026">Periode Oktober 2026</option>
          </select>
        </div>
        <div>
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-500 focus:bg-white"
          >
            <option value="ALL">Semua Jenis KP</option>
            <option value="Reguler">Reguler</option>
            <option value="Jabatan Fungsional">Jabatan Fungsional</option>
            <option value="Pilihan (Jabatan Struktural)">Pilihan Struktural</option>
            <option value="Penyesuaian Ijazah">Penyesuaian Ijazah</option>
          </select>
        </div>
      </div>

      {/* Table KP */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Daftar Usulan Kenaikan Pangkat ({filteredKP.length})
          </h3>
          <span className="text-xs text-slate-400">
            Terhubung dengan Layanan Integrasi Pertek BKN
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Pegawai ASN</th>
                <th className="py-3 px-3">Pangkat Lama &rarr; Usulan Baru</th>
                <th className="py-3 px-3">Periode & Jenis</th>
                <th className="py-3 px-3">Persyaratan Berkas</th>
                <th className="py-3 px-3">Tahapan Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredKP.map((kp) => (
                <tr key={kp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-bold text-slate-900">{kp.employeeName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">NIP: {kp.nip}</p>
                      <p className="text-[10px] text-slate-400">{kp.jabatan}</p>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-slate-500">{kp.pangkatLama}</span>
                    <p className="font-bold text-amber-700 mt-0.5">&rarr; {kp.pangkatBaru}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-block rounded-md bg-amber-50 px-2 py-0.5 font-semibold text-amber-800 border border-amber-200">
                      {kp.periode}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">{kp.jenisKP}</p>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <Check className="h-3 w-3" /> {kp.dokumenPersyaratan.length} Dokumen Lengkap
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        kp.status === 'SK Diterbitkan'
                          ? 'bg-emerald-100 text-emerald-800'
                          : kp.status === 'Persetujuan Teknis BKN'
                          ? 'bg-blue-100 text-blue-800'
                          : kp.status === 'Ditolak'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {kp.status}
                    </span>
                    {kp.catatan && (
                      <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[200px]" title={kp.catatan}>
                        {kp.catatan}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(kp)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Edit Data KP"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus usulan kenaikan pangkat ${kp.employeeName}?`)) {
                            onDeleteKP(kp.id);
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal KP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              {isEditing ? 'Kelola Usulan Kenaikan Pangkat' : 'Formulir Usulan Kenaikan Pangkat'}
            </h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Pilih Pegawai *</label>
                <select
                  value={formData.employeeId || ''}
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-amber-500"
                >
                  <option value="">-- Pilih Pegawai --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nama} - {emp.nip} ({emp.pangkatGolongan})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Pangkat / Golongan Lama</label>
                  <input
                    type="text"
                    value={formData.pangkatLama || ''}
                    onChange={(e) => setFormData({ ...formData, pangkatLama: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 text-amber-800">Usulan Pangkat Baru *</label>
                  <input
                    type="text"
                    required
                    value={formData.pangkatBaru || ''}
                    onChange={(e) => setFormData({ ...formData, pangkatBaru: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-amber-400 bg-amber-50/40 p-2 text-xs font-bold text-amber-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Periode Kenaikan Pangkat</label>
                  <select
                    value={formData.periode || 'April 2026'}
                    onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-amber-500"
                  >
                    <option value="April 2026">Periode April 2026</option>
                    <option value="Oktober 2026">Periode Oktober 2026</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Jenis Kenaikan Pangkat</label>
                  <select
                    value={formData.jenisKP || 'Jabatan Fungsional'}
                    onChange={(e) => setFormData({ ...formData, jenisKP: e.target.value as JenisKP })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-amber-500"
                  >
                    <option value="Reguler">Reguler</option>
                    <option value="Jabatan Fungsional">Jabatan Fungsional</option>
                    <option value="Pilihan (Jabatan Struktural)">Pilihan Struktural</option>
                    <option value="Penyesuaian Ijazah">Penyesuaian Ijazah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Tahapan Status Saat Ini</label>
                <select
                  value={formData.status || 'Berkas Diupload'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusKP })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-amber-500"
                >
                  <option value="Berkas Diupload">1. Berkas Diupload</option>
                  <option value="Verifikasi BKD/Biro SDM">2. Verifikasi BKD / Biro SDM</option>
                  <option value="Persetujuan Teknis BKN">3. Persetujuan Teknis (Pertek) BKN</option>
                  <option value="SK Diterbitkan">4. SK KP Diterbitkan & TTE</option>
                  <option value="Ditolak">5. Berkas Ditolak / TMS (Tidak Memenuhi Syarat)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Catatan / Catatan Pertek BKN</label>
                <textarea
                  rows={2}
                  value={formData.catatan || ''}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-amber-500"
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
                  className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-sm"
                >
                  Simpan Usulan KP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
