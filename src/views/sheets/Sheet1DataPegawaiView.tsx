import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  RefreshCw, 
  Search, 
  Eye, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  Filter,
  Layers,
  ArrowUpDown,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Save,
  X
} from 'lucide-react';
import { Employee } from '../../types';
import { fetchLiveDataPegawai, TARGET_SPREADSHEET_ID } from '../../utils/googleSheetsLiveReader';
import { exportToExcel } from '../../utils/exportUtils';
import { sendToUniversalWebhook, formatEmployeeToRow } from '../../utils/universalSheetWebhook';

interface Sheet1DataPegawaiViewProps {
  onRefreshParent?: () => void;
}

export const Sheet1DataPegawaiView: React.FC<Sheet1DataPegawaiViewProps> = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncSource, setSyncSource] = useState<'gviz' | 'webhook' | 'cache'>('cache');
  const [lastSyncTime, setLastSyncTime] = useState('');
  const [search, setSearch] = useState('');
  const [filterUnitKerja, setFilterUnitKerja] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleConfirmDelete = () => {
    if (!deletingEmployee) return;
    const emp = deletingEmployee;
    setEmployees((prev) => prev.filter((e) => (e.id ? e.id !== emp.id : e.nip !== emp.nip)));
    sendToUniversalWebhook({
      moduleKey: 'pegawai',
      action: 'delete',
      item: emp,
      customRow: formatEmployeeToRow(emp),
    });
    showToast(`Data Pegawai "${emp.nama}" berhasil dihapus dari sistem.`);
    setDeletingEmployee(null);
    if (selectedEmployee && (selectedEmployee.id === emp.id || selectedEmployee.nip === emp.nip)) {
      setSelectedEmployee(null);
    }
  };

  // Form state for Add/Edit
  const [formData, setFormData] = useState({
    nip: '',
    nama: '',
    jabatan: '',
    pangkatGolongan: '',
    unitKerja: '',
    statusPegawai: 'PNS' as 'PNS' | 'PPPK',
    gajiPokok: 3500000,
    email: '',
    telepon: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    setIsAddMode(true);
    setFormData({
      nip: '',
      nama: '',
      jabatan: '',
      pangkatGolongan: 'Penata Muda (III/a)',
      unitKerja: 'Sub Bagian Tata Usaha',
      statusPegawai: 'PNS',
      gajiPokok: 3500000,
      email: '',
      telepon: '',
    });
    setEditingEmployee(null);
  };

  const handleOpenEdit = (emp: Employee) => {
    setIsAddMode(false);
    setEditingEmployee(emp);
    setFormData({
      nip: emp.nip,
      nama: emp.nama,
      jabatan: emp.jabatan,
      pangkatGolongan: emp.pangkatGolongan,
      unitKerja: emp.unitKerja,
      statusPegawai: emp.statusPegawai,
      gajiPokok: emp.gajiPokok,
      email: emp.email || '',
      telepon: emp.telepon || '',
    });
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddMode) {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        nip: formData.nip,
        nama: formData.nama,
        jabatan: formData.jabatan,
        pangkatGolongan: formData.pangkatGolongan,
        unitKerja: formData.unitKerja,
        statusPegawai: formData.statusPegawai as any,
        gajiPokok: Number(formData.gajiPokok),
        email: formData.email,
        telepon: formData.telepon,
        alamat: '-',
        jenisKelamin: 'Laki-laki',
        tanggalLahir: '1990-01-01',
        pendidikanTerakhir: 'S1',
        sisaCutiN: 12,
        sisaCutiN1: 6,
        sisaCutiN2: 0,
      };
      setEmployees((prev) => [newEmp, ...prev]);
      sendToUniversalWebhook({
        moduleKey: 'pegawai',
        action: 'append',
        item: newEmp,
        customRow: formatEmployeeToRow(newEmp),
      });
      showToast(`Pegawai "${newEmp.nama}" berhasil ditambahkan & disinkronkan ke Sheet 1!`);
    } else if (editingEmployee) {
      const updated: Employee = {
        ...editingEmployee,
        nip: formData.nip,
        nama: formData.nama,
        jabatan: formData.jabatan,
        pangkatGolongan: formData.pangkatGolongan,
        unitKerja: formData.unitKerja,
        statusPegawai: formData.statusPegawai as any,
        gajiPokok: Number(formData.gajiPokok),
        email: formData.email,
        telepon: formData.telepon,
      };
      setEmployees((prev) => prev.map((e) => (e.id === updated.id || e.nip === updated.nip ? updated : e)));
      sendToUniversalWebhook({
        moduleKey: 'pegawai',
        action: 'update',
        item: updated,
        customRow: formatEmployeeToRow(updated),
      });
      showToast(`Data Pegawai "${updated.nama}" berhasil diperbarui!`);
    }

    setEditingEmployee(null);
    setIsAddMode(false);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchLiveDataPegawai(TARGET_SPREADSHEET_ID);
      setEmployees(res.rows);
      setSyncSource(res.source);
      setLastSyncTime(res.timestamp);
    } catch (err: any) {
      console.error('Gagal mengambil data pegawai:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const unitKerjaOptions = useMemo(() => {
    const list = Array.from(new Set(employees.map(e => e.unitKerja))).filter(Boolean);
    return ['ALL', ...list.sort()];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const q = search.toLowerCase();
      const matchSearch = 
        !search ||
        emp.nama.toLowerCase().includes(q) ||
        emp.nip.toLowerCase().includes(q) ||
        emp.jabatan.toLowerCase().includes(q);

      const matchUnit = filterUnitKerja === 'ALL' || emp.unitKerja === filterUnitKerja;
      const matchStatus = filterStatus === 'ALL' || emp.statusPegawai === filterStatus;

      return matchSearch && matchUnit && matchStatus;
    });
  }, [employees, search, filterUnitKerja, filterStatus]);

  const handleExportExcel = () => {
    const exportData = filteredEmployees.map((e, idx) => ({
      No: idx + 1,
      NIP: e.nip,
      'Nama Lengkap': e.nama,
      Jabatan: e.jabatan,
      'Pangkat / Golongan': e.pangkatGolongan,
      'Unit Kerja': e.unitKerja,
      'Status Pegawai': e.statusPegawai,
      'Gaji Pokok': e.gajiPokok,
      'Email Pribadi': e.email,
      'Nomor HP': e.telepon,
    }));
    exportToExcel(exportData, `Data_Pegawai_Sheet1_${new Date().toISOString().slice(0, 10)}`);
  };

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit?gid=1688113153#gid=1688113153`;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Banner Status Baca Langsung dari Spreadsheet */}
      <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 md:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-sky-600 text-white rounded-lg shadow-sm shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-bold text-slate-900">
                  Sheet 1: Data_pegawai
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-200 text-sky-800 border border-sky-300">
                  Mode: Baca Langsung dari Sheet (Read-Only)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-slate-700 border border-slate-200">
                  9 Kolom Resmi BKHIT
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Data disinkronkan secara real-time dari Google Spreadsheet sheet: <code className="bg-sky-100 text-sky-900 px-1 py-0.5 rounded font-mono">Data_pegawai</code> (gid: 1688113153).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Pegawai</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Tarik Ulang Sheet</span>
            </button>

            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
              <span>Buka Google Sheet</span>
            </a>
          </div>
        </div>

        {/* Sync Metadata strip */}
        <div className="mt-4 pt-3 border-t border-sky-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sumber data: <strong className="uppercase text-slate-800 font-mono">{syncSource}</strong>
            </span>
            <span>•</span>
            <span>Total baris termuat: <strong className="text-slate-900">{employees.length} Pegawai</strong></span>
          </div>
          {lastSyncTime && (
            <span className="text-[11px] text-slate-500">
              Waktu pembacaan terakhir: <strong>{lastSyncTime}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari NIP, Nama, atau Jabatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-sky-500 focus:bg-white transition-all"
            />
          </div>

          {/* Unit Kerja Filter */}
          <select
            value={filterUnitKerja}
            onChange={(e) => setFilterUnitKerja(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-sky-500 text-slate-700"
          >
            <option value="ALL">Semua Unit Kerja</option>
            {unitKerjaOptions.filter(u => u !== 'ALL').map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>

          {/* Status Pegawai Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-sky-500 text-slate-700"
          >
            <option value="ALL">Semua Status (PNS / PPPK)</option>
            <option value="PNS">PNS</option>
            <option value="PPPK">PPPK</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          <span>Ekspor Excel</span>
        </button>
      </div>

      {/* Tabel 9 Kolom Sesuai Google Spreadsheet */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">NO</th>
                <th className="py-3 px-4">NIP</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Jabatan</th>
                <th className="py-3 px-4">Pangkat / Golongan</th>
                <th className="py-3 px-4">Unit Kerja</th>
                <th className="py-3 px-4 text-center">Status Pegawai</th>
                <th className="py-3 px-4 text-right">Gaji Pokok</th>
                <th className="py-3 px-4">Email Pribadi</th>
                <th className="py-3 px-4">Nomor HP</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-500" />
                    <span>Membaca data langsung dari Google Spreadsheet...</span>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <span>Tidak ada data pegawai yang sesuai kriteria pencarian.</span>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => (
                  <tr 
                    key={emp.id || index}
                    className="hover:bg-sky-50/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <td className="py-3 px-4 text-center font-mono text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{emp.nip}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{emp.nama}</td>
                    <td className="py-3 px-4 text-slate-600">{emp.jabatan}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {emp.pangkatGolongan}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{emp.unitKerja}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        emp.statusPegawai === 'PNS' 
                          ? 'bg-sky-100 text-sky-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {emp.statusPegawai}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      Rp {(emp.gajiPokok || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{emp.email || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{emp.telepon || '-'}</td>
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedEmployee(emp)}
                          className="p-1.5 hover:bg-sky-100 text-sky-600 rounded transition-colors cursor-pointer"
                          title="Lihat Detail Pegawai"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 hover:bg-amber-100 text-amber-600 rounded transition-colors cursor-pointer"
                          title="Akses Edit Data Pegawai"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingEmployee(emp)}
                          className="p-1.5 hover:bg-rose-100 text-rose-600 rounded transition-colors cursor-pointer"
                          title="Hapus Data Pegawai"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal Detail Pegawai */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                  {selectedEmployee.nama.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selectedEmployee.nama}</h2>
                  <p className="text-xs font-mono text-slate-500">{selectedEmployee.nip}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 block">Jabatan</span>
                  <strong className="text-slate-800 mt-0.5 block">{selectedEmployee.jabatan}</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 block">Pangkat / Golongan</span>
                  <strong className="text-slate-800 mt-0.5 block">{selectedEmployee.pangkatGolongan}</strong>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-slate-500 block">Unit Kerja</span>
                <strong className="text-slate-800 mt-0.5 block">{selectedEmployee.unitKerja}</strong>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 block">Status Pegawai</span>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded font-bold text-[11px] bg-sky-100 text-sky-800">
                    {selectedEmployee.statusPegawai}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 block">Gaji Pokok</span>
                  <strong className="text-slate-900 font-mono text-sm mt-0.5 block">
                    Rp {(selectedEmployee.gajiPokok || 0).toLocaleString('id-ID')}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 block">Email Pribadi</span>
                  <span className="font-mono text-slate-800 mt-0.5 block">{selectedEmployee.email || '-'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 block">Nomor HP</span>
                  <span className="font-mono text-slate-800 mt-0.5 block">{selectedEmployee.telepon || '-'}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  const emp = selectedEmployee;
                  setSelectedEmployee(null);
                  handleOpenEdit(emp);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Pegawai Ini</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Tambah / Edit Pegawai (Akses Edit Sheet 1) */}
      {(isAddMode || editingEmployee) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {isAddMode ? 'Tambah Pegawai Baru (Sheet 1)' : `Akses Edit Data: ${editingEmployee?.nama}`}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Input & update otomatis disinkronkan ke Google Sheet <span className="font-mono">Data_pegawai</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddMode(false);
                  setEditingEmployee(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP (18 Digit)</label>
                  <input
                    type="text"
                    required
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    placeholder="198501012010011001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Nama Pegawai, S.Si."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jabatan</label>
                  <input
                    type="text"
                    required
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    placeholder="Dokter Hewan Karantina Ahli Muda"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pangkat / Golongan</label>
                  <input
                    type="text"
                    required
                    value={formData.pangkatGolongan}
                    onChange={(e) => setFormData({ ...formData, pangkatGolongan: e.target.value })}
                    placeholder="Penata (III/c)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Kerja / Divisi</label>
                  <input
                    type="text"
                    required
                    value={formData.unitKerja}
                    onChange={(e) => setFormData({ ...formData, unitKerja: e.target.value })}
                    placeholder="Karantina Hewan"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Pegawai</label>
                  <select
                    value={formData.statusPegawai}
                    onChange={(e) => setFormData({ ...formData, statusPegawai: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs bg-white"
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gaji Pokok (Rp)</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={1000}
                  value={formData.gajiPokok}
                  onChange={(e) => setFormData({ ...formData, gajiPokok: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="pegawai@karantinaindonesia.go.id"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.telepon}
                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                    placeholder="08123456789"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddMode(false);
                    setEditingEmployee(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isAddMode ? 'Simpan Pegawai' : 'Update Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Konfirmasi Hapus Pegawai */}
      {deletingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Pegawai</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data pegawai <strong className="text-slate-900">{deletingEmployee.nama}</strong> (NIP: {deletingEmployee.nip})? Tindakan ini akan menghapus data dari tabel dan mengirim sinkronisasi ke spreadsheet.
                </p>
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeletingEmployee(null)}
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
                    <span>Ya, Hapus Pegawai</span>
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
