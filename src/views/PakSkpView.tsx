import React, { useState } from 'react';
import { 
  CheckSquare, 
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
  Award,
  AlertCircle,
  Eye
} from 'lucide-react';
import { PakSkpRecord, TipeDokumenKinerja, StatusPakSkp, PredikatKinerja, Employee } from '../types';
import { exportToExcel } from '../utils/exportUtils';

interface PakSkpViewProps {
  records: PakSkpRecord[];
  employees: Employee[];
  onAddRecord: (record: PakSkpRecord) => void;
  onUpdateRecord: (record: PakSkpRecord) => void;
  onDeleteRecord: (id: string) => void;
  onRequest2FA: (title: string, action: () => void) => void;
}

export const PakSkpView: React.FC<PakSkpViewProps> = ({
  records,
  employees,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onRequest2FA,
}) => {
  const [search, setSearch] = useState('');
  const [filterTipe, setFilterTipe] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<Partial<PakSkpRecord>>({
    employeeId: '',
    employeeName: '',
    nip: '',
    jabatan: '',
    tipe: 'SKP Tahunan',
    tahunKinerja: 2025,
    predikatKinerja: 'Baik',
    angkaKreditUtama: 25.0,
    angkaKreditPenunjang: 5.0,
    totalAngkaKredit: 30.0,
    nomorSK: '800/120/SKP/2025',
    pejabatPenilai: 'Kepala Biro Kepegawaian',
    status: 'Menunggu Verifikasi',
    catatan: 'Dokumen evaluasi kinerja tahunan dan bukti dukung lengkap.',
  });

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.nip.toLowerCase().includes(search.toLowerCase()) ||
      (r.nomorSK && r.nomorSK.toLowerCase().includes(search.toLowerCase()));

    const matchesTipe = filterTipe === 'ALL' || r.tipe === filterTipe;
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;

    return matchesSearch && matchesTipe && matchesStatus;
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
    });
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedFile(null);
    const emp = employees[0];
    setFormData({
      employeeId: emp?.id || '',
      employeeName: emp?.nama || '',
      nip: emp?.nip || '',
      jabatan: emp?.jabatan || '',
      tipe: 'SKP Tahunan',
      tahunKinerja: 2025,
      predikatKinerja: 'Sangat Baik',
      angkaKreditUtama: 37.5,
      angkaKreditPenunjang: 2.5,
      totalAngkaKredit: 40.0,
      nomorSK: `800/${Math.floor(Math.random() * 900 + 100)}/EVAL/2025`,
      pejabatPenilai: 'Direktur Jenderal',
      status: 'Menunggu Verifikasi',
      catatan: 'Pengajuan berkas evaluasi kinerja ASN.',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: PakSkpRecord) => {
    setIsEditing(true);
    setFormData({ ...rec });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeName || !formData.nip) {
      alert('Pilih pegawai terlebih dahulu.');
      return;
    }

    const payload: PakSkpRecord = {
      ...(formData as PakSkpRecord),
      id: isEditing && formData.id ? formData.id : `EVAL-${Date.now().toString().slice(-4)}`,
      dokumenName: selectedFile ? selectedFile.name : formData.dokumenName,
      dokumenSize: selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : formData.dokumenSize || '1.8 MB',
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    if (payload.status === 'Disahkan' && isEditing) {
      onRequest2FA('Pengesahan Dokumen PAK / SKP Pegawai', () => {
        onUpdateRecord(payload);
        setIsModalOpen(false);
      });
    } else {
      if (isEditing) {
        onUpdateRecord(payload);
      } else {
        onAddRecord(payload);
      }
      setIsModalOpen(false);
    }
  };

  const handleExportExcel = () => {
    const data = records.map((r) => ({
      NIP: r.nip,
      Nama_Pegawai: r.employeeName,
      Jabatan: r.jabatan,
      Tipe_Dokumen: r.tipe,
      Tahun_Kinerja: r.tahunKinerja,
      Predikat: r.predikatKinerja || '-',
      Angka_Kredit_Utama: r.angkaKreditUtama || 0,
      Total_Angka_Kredit: r.totalAngkaKredit || 0,
      Nomor_SK: r.nomorSK || '-',
      Pejabat_Penilai: r.pejabatPenilai,
      Status_Verifikasi: r.status,
    }));
    exportToExcel(data, 'Data PAK dan SKP', 'Rekapitulasi_PAK_SKP_Kinerja_Pegawai');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-purple-600" /> Dokumen PAK & Penilaian SKP
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unggah dan verifikasi berkas Sasaran Kinerja Pegawai (SKP) dan Penetapan Angka Kredit (PAK Konversi PermenPANRB No. 1/2023)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Berkas PAK / SKP</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pegawai, NIP, nomor SK..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-purple-500 focus:bg-white"
          />
        </div>

        <div>
          <select
            value={filterTipe}
            onChange={(e) => setFilterTipe(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-700 outline-none focus:border-purple-500 focus:bg-white"
          >
            <option value="ALL">Semua Jenis Dokumen Kinerja</option>
            <option value="SKP Tahunan">SKP Tahunan</option>
            <option value="SKP Periodik">SKP Periodik</option>
            <option value="PAK Konversi">PAK Konversi</option>
            <option value="PAK Integrasi">PAK Integrasi</option>
            <option value="PAK Konvensional">PAK Konvensional</option>
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-700 outline-none focus:border-purple-500 focus:bg-white"
          >
            <option value="ALL">Semua Status Verifikasi</option>
            <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
            <option value="Diverifikasi Tim Penilai">Diverifikasi Tim Penilai</option>
            <option value="Disahkan">Disahkan & Ditetapkan</option>
            <option value="Ditolak">Ditolak / Revisi</option>
          </select>
        </div>
      </div>

      {/* Table Records */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Daftar Berkas PAK & SKP Terdaftar ({filteredRecords.length})
          </h3>
          <span className="text-xs text-slate-400">
            Terverifikasi untuk syarat Kenaikan Pangkat & Tunjangan Kinerja
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Pegawai ASN</th>
                <th className="py-3 px-3">Jenis & Tahun</th>
                <th className="py-3 px-3">Predikat Kinerja</th>
                <th className="py-3 px-3">Angka Kredit</th>
                <th className="py-3 px-3">Berkas Digital</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-bold text-slate-900">{item.employeeName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">NIP: {item.nip}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{item.jabatan}</p>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-block rounded bg-purple-50 px-2 py-0.5 font-bold text-purple-800 border border-purple-200">
                      {item.tipe}
                    </span>
                    <p className="text-[11px] font-semibold text-slate-700 mt-0.5">Tahun {item.tahunKinerja}</p>
                  </td>
                  <td className="py-3 px-3">
                    {item.predikatKinerja ? (
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.predikatKinerja === 'Sangat Baik'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.predikatKinerja === 'Baik'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.predikatKinerja}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {item.totalAngkaKredit !== undefined ? (
                      <div>
                        <span className="font-bold font-mono text-purple-700">
                          {item.totalAngkaKredit.toFixed(2)} AK
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Utama: {item.angkaKreditUtama?.toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {item.dokumenName ? (
                      <div className="flex items-center gap-1.5 text-blue-600">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[140px] text-[11px] font-semibold" title={item.dokumenName}>
                          {item.dokumenName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Belum Upload File</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        item.status === 'Disahkan'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Diverifikasi Tim Penilai'
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
                        className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                        title="Edit Berkas / Verifikasi"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus berkas kinerja ${item.employeeName} (${item.tipe})?`)) {
                            onDeleteRecord(item.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Hapus"
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

      {/* Modal PAK / SKP */}
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
              {isEditing ? 'Kelola Berkas PAK / SKP' : 'Upload Berkas Penilaian Kinerja (PAK & SKP)'}
            </h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Pilih Pegawai *</label>
                <select
                  value={formData.employeeId || ''}
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-purple-500"
                >
                  <option value="">-- Pilih Pegawai ASN --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nama} - {emp.nip} ({emp.pangkatGolongan})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Jenis Dokumen Kinerja</label>
                  <select
                    value={formData.tipe || 'SKP Tahunan'}
                    onChange={(e) => setFormData({ ...formData, tipe: e.target.value as TipeDokumenKinerja })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-purple-500"
                  >
                    <option value="SKP Tahunan">SKP Tahunan</option>
                    <option value="SKP Periodik">SKP Periodik</option>
                    <option value="PAK Konversi">PAK Konversi (PermenPANRB 1/2023)</option>
                    <option value="PAK Integrasi">PAK Integrasi</option>
                    <option value="PAK Konvensional">PAK Konvensional</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Tahun Penilaian</label>
                  <input
                    type="number"
                    value={formData.tahunKinerja || 2025}
                    onChange={(e) => setFormData({ ...formData, tahunKinerja: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Predikat Kinerja</label>
                  <select
                    value={formData.predikatKinerja || 'Baik'}
                    onChange={(e) => setFormData({ ...formData, predikatKinerja: e.target.value as PredikatKinerja })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-purple-500"
                  >
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Butuh Perbaikan">Butuh Perbaikan</option>
                    <option value="Kurang">Kurang</option>
                    <option value="Sangat Kurang">Sangat Kurang</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Total Angka Kredit (AK)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.totalAngkaKredit || 0}
                    onChange={(e) => setFormData({ ...formData, totalAngkaKredit: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Nomor SK / Dokumen</label>
                  <input
                    type="text"
                    placeholder="800/120/SKP/2025"
                    value={formData.nomorSK || ''}
                    onChange={(e) => setFormData({ ...formData, nomorSK: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Status Verifikasi</label>
                  <select
                    value={formData.status || 'Menunggu Verifikasi'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusPakSkp })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-purple-500"
                  >
                    <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                    <option value="Diverifikasi Tim Penilai">Diverifikasi Tim Penilai</option>
                    <option value="Disahkan">Disahkan (Perlu 2FA)</option>
                    <option value="Ditolak">Ditolak / Revisi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Unggah Berkas PDF Hasil Evaluasi SKP / PAK (Maks 10 MB)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Catatan Evaluator</label>
                <textarea
                  rows={2}
                  value={formData.catatan || ''}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-purple-500"
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
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-sm"
                >
                  Simpan Berkas Kinerja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
