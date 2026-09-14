import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  FileText, 
  Upload, 
  Trash2, 
  Edit3, 
  Download, 
  Eye, 
  Check, 
  X, 
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  FolderCheck,
  CheckCircle2,
  Copy,
  Layers,
  Sparkles,
  Printer,
  ChevronRight,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';
import { Employee, EmployeeDocument } from '../types';
import { formatRupiah, exportToExcel, exportEmployeeListPDF, exportPegawaiSpreadsheetPDF } from '../utils/exportUtils';
import { 
  PEGAWAI_SPREADSHEET_ID, 
  PEGAWAI_SPREADSHEET_URL, 
  PegawaiSpreadsheetRecord, 
  initialPegawaiSpreadsheetData, 
  fetchLivePegawaiSpreadsheet,
  convertSpreadsheetToEmployees
} from '../data/pegawaiSpreadsheetData';

interface PegawaiViewProps {
  employees: Employee[];
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (empId: string) => void;
  onRequest2FA: (actionTitle: string, callback: () => void) => void;
  onImportEmployeesFromSheet?: (newEmployees: Employee[]) => void;
}

export const PegawaiView: React.FC<PegawaiViewProps> = ({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onRequest2FA,
  onImportEmployeesFromSheet,
}) => {
  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'spreadsheet_pegawai' | 'katalog_dokumen' | 'master_lokal'>('spreadsheet_pegawai');

  // Spreadsheet Data State
  const [spreadsheetRecords, setSpreadsheetRecords] = useState<PegawaiSpreadsheetRecord[]>(() => {
    try {
      const saved = localStorage.getItem('pegawai_spreadsheet_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return initialPegawaiSpreadsheetData;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('pegawai_last_sync_time') || 'Data Tersimpan (Spreadsheet ID: 1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M)';
  });

  // Selected Record for Detail Modal (Spreadsheet)
  const [selectedRecord, setSelectedRecord] = useState<PegawaiSpreadsheetRecord | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copySuccessMessage, setCopySuccessMessage] = useState<string | null>(null);

  // Filters for Spreadsheet Tab
  const [search, setSearch] = useState('');
  const [filterSatker, setFilterSatker] = useState<string>('ALL');
  const [filterKelengkapan, setFilterKelengkapan] = useState<string>('ALL');

  // Filters for Document Catalog Tab
  const [docSearch, setDocSearch] = useState('');
  const [docSatkerFilter, setDocSatkerFilter] = useState('ALL');

  // Local Employee Management State
  const [localSearch, setLocalSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form Modal State (Add or Edit Local Employee)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({
    nip: '',
    nama: '',
    gelarDepan: '',
    gelarBelakang: '',
    jabatan: '',
    pangkatGolongan: 'Penata Muda / III/a',
    unitKerja: 'Balai Karantina Hewan, Ikan, dan Tumbuhan',
    statusPegawai: 'PNS',
    email: '',
    telepon: '',
    alamat: '',
    tmtPNS: '2020-01-01',
    jenisKelamin: 'Laki-laki',
    tanggalLahir: '1990-01-01',
    pendidikanTerakhir: 'S1',
    gajiPokok: 3500000,
    sisaCutiN: 12,
    sisaCutiN1: 0,
    sisaCutiN2: 0,
    dokumen: [],
  });

  // Document Upload State
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [newDocType, setNewDocType] = useState<EmployeeDocument['jenisDokumen']>('KTP');
  const [newDocKet, setNewDocKet] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Satuan Pelayanan List
  const satkerOptions = useMemo(() => {
    const set = new Set<string>();
    spreadsheetRecords.forEach((s) => {
      if (s.satuanPelayanan) set.add(s.satuanPelayanan);
    });
    return Array.from(set).sort();
  }, [spreadsheetRecords]);

  // Filtered Spreadsheet Records
  const filteredSpreadsheetRecords = useMemo(() => {
    return spreadsheetRecords.filter((rec) => {
      const q = search.toLowerCase();
      const matchText =
        rec.nama.toLowerCase().includes(q) ||
        rec.nip.toLowerCase().includes(q) ||
        rec.jabatan.toLowerCase().includes(q) ||
        rec.pangkat.toLowerCase().includes(q) ||
        rec.satuanPelayanan.toLowerCase().includes(q);

      if (!matchText) return false;

      if (filterSatker !== 'ALL' && rec.satuanPelayanan !== filterSatker) {
        return false;
      }

      if (filterKelengkapan === 'LENGKAP') {
        return rec.kelengkapanBerkas === 'LENGKAP';
      }
      if (filterKelengkapan === 'BELUM') {
        return rec.kelengkapanBerkas !== 'LENGKAP';
      }

      return true;
    });
  }, [spreadsheetRecords, search, filterSatker, filterKelengkapan]);

  // Analytics Metrics
  const metrics = useMemo(() => {
    const total = spreadsheetRecords.length;
    const withDrive = spreadsheetRecords.filter((r) => r.linkDrive && r.linkDrive.length > 5).length;
    const complete = spreadsheetRecords.filter((r) => r.kelengkapanBerkas === 'LENGKAP').length;
    const satkerCount = satkerOptions.length;
    return { total, withDrive, complete, satkerCount };
  }, [spreadsheetRecords, satkerOptions]);

  // Filtered Catalog of Documents
  const filteredDocCatalog = useMemo(() => {
    return spreadsheetRecords.filter((rec) => {
      const q = docSearch.toLowerCase();
      const matchText =
        rec.nama.toLowerCase().includes(q) ||
        rec.nip.toLowerCase().includes(q) ||
        rec.satuanPelayanan.toLowerCase().includes(q);

      if (!matchText) return false;
      if (docSatkerFilter !== 'ALL' && rec.satuanPelayanan !== docSatkerFilter) return false;
      return true;
    });
  }, [spreadsheetRecords, docSearch, docSatkerFilter]);

  // Filtered Local Employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.nama.toLowerCase().includes(localSearch.toLowerCase()) ||
        emp.nip.toLowerCase().includes(localSearch.toLowerCase()) ||
        emp.jabatan.toLowerCase().includes(localSearch.toLowerCase());

      const matchesUnit = filterUnit === 'ALL' || emp.unitKerja === filterUnit;
      const matchesStatus = filterStatus === 'ALL' || emp.statusPegawai === filterStatus;

      return matchesSearch && matchesUnit && matchesStatus;
    });
  }, [employees, localSearch, filterUnit, filterStatus]);

  const uniqueUnits = useMemo(() => {
    return Array.from(new Set(employees.map((e) => e.unitKerja)));
  }, [employees]);

  // Sync with Live Google Spreadsheet
  const handleSyncSpreadsheet = async () => {
    setIsSyncing(true);
    try {
      const freshData = await fetchLivePegawaiSpreadsheet(PEGAWAI_SPREADSHEET_ID);
      if (freshData && freshData.length > 0) {
        setSpreadsheetRecords(freshData);
        localStorage.setItem('pegawai_spreadsheet_cache', JSON.stringify(freshData));
        const timeStr = `Sinkronisasi Live: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB`;
        setLastSyncTime(timeStr);
        localStorage.setItem('pegawai_last_sync_time', timeStr);
        if (onImportEmployeesFromSheet) {
          const converted = convertSpreadsheetToEmployees(freshData);
          onImportEmployeesFromSheet(converted);
        }
      }
    } catch (err) {
      console.error('Failed to sync employee spreadsheet:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Import / Merge Spreadsheet Records into Master Employees List
  const handleImportToSIMPEG = () => {
    if (!onImportEmployeesFromSheet) {
      alert('Fungsi impor tidak tersedia.');
      return;
    }

    if (
      confirm(
        `Apakah Anda ingin menyinkronkan seluruh ${spreadsheetRecords.length} data pegawai beserta tautan berkas dokumen Google Drive ke dalam Master Data Kepegawaian SIMPEG?`
      )
    ) {
      const converted = convertSpreadsheetToEmployees(spreadsheetRecords);
      onImportEmployeesFromSheet(converted);
      setCopySuccessMessage(`Berhasil menyinkronkan ${converted.length} pegawai ke database master SIMPEG.`);
      setTimeout(() => setCopySuccessMessage(null), 4000);
    }
  };

  // Copy Google Drive Link
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setCopySuccessMessage('Tautan Google Drive disalin ke papan klip!');
    setTimeout(() => {
      setCopiedLink(false);
      setCopySuccessMessage(null);
    }, 3000);
  };

  // Export Excel
  const handleExportExcelSpreadsheet = () => {
    const exportData = spreadsheetRecords.map((r) => ({
      No: r.no,
      NIP: r.nip,
      Nama_Pegawai: r.nama,
      Jabatan: r.jabatan,
      Satuan_Pelayanan: r.satuanPelayanan,
      Pangkat_Gol: r.pangkat,
      Pangkat_Detail: r.pangkatDetail,
      Masa_Kerja: r.masaKerja,
      Tanggal_Lahir: r.tanggalLahir,
      TMT_Pangkat_Terakhir: r.tmtPangkat,
      TMT_KGB: r.tmtKGB,
      Angka_Kredit_PAK: r.angkaKredit || '-',
      Status_Kelengkapan: r.kelengkapanBerkas,
      Link_Berkas_Google_Drive: r.linkDrive || '',
    }));
    exportToExcel(
      exportData,
      'Data Pegawai & Dokumen',
      `Daftar_Pegawai_Dokumen_Spreadsheet_${new Date().toISOString().slice(0, 10)}`
    );
  };

  // Export PDF
  const handleExportPDFSpreadsheet = () => {
    exportPegawaiSpreadsheetPDF(spreadsheetRecords);
  };

  // Open Add Local Form
  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      id: `EMP-${Date.now().toString().slice(-4)}`,
      nip: '',
      nama: '',
      gelarDepan: '',
      gelarBelakang: '',
      jabatan: '',
      pangkatGolongan: 'Penata Muda / III/a',
      unitKerja: 'Balai Karantina Hewan, Ikan, dan Tumbuhan',
      statusPegawai: 'PNS',
      email: '',
      telepon: '',
      alamat: '',
      tmtPNS: '2024-01-01',
      jenisKelamin: 'Laki-laki',
      tanggalLahir: '1995-01-01',
      pendidikanTerakhir: 'S1',
      gajiPokok: 3500000,
      sisaCutiN: 12,
      sisaCutiN1: 0,
      sisaCutiN2: 0,
      dokumen: [],
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setIsEditing(true);
    setFormData({ ...emp });
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nip || !formData.nama || !formData.jabatan) {
      alert('Mohon lengkapi NIP, Nama, dan Jabatan pegawai.');
      return;
    }

    if (isEditing && formData.id) {
      onRequest2FA('Pembaruan data kepegawaian & histori kepangkatan', () => {
        onUpdateEmployee(formData as Employee);
        if (selectedEmployee?.id === formData.id) {
          setSelectedEmployee(formData as Employee);
        }
        setIsFormOpen(false);
      });
    } else {
      const newEmp: Employee = {
        ...(formData as Employee),
        id: `EMP-${Date.now().toString().slice(-4)}`,
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
        dokumen: formData.dokumen || [],
      };
      onAddEmployee(newEmp);
      setIsFormOpen(false);
    }
  };

  const handleDeleteWith2FA = (emp: Employee) => {
    onRequest2FA(`Penghapusan data arsip pegawai NIP: ${emp.nip} (${emp.nama})`, () => {
      onDeleteEmployee(emp.id);
      if (selectedEmployee?.id === emp.id) {
        setSelectedEmployee(null);
      }
    });
  };

  // Upload Document
  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const newDoc: EmployeeDocument = {
      id: `DOC-${Date.now()}`,
      employeeId: selectedEmployee.id,
      jenisDokumen: newDocType,
      namaFile: selectedFile ? selectedFile.name : `${newDocType.replace(/\s+/g, '_')}_${selectedEmployee.nip}.pdf`,
      ukuran: selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : '450 KB',
      tanggalUpload: new Date().toISOString().slice(0, 10),
      keterangan: newDocKet || 'Dokumen resmi terverifikasi',
    };

    const updatedEmp: Employee = {
      ...selectedEmployee,
      dokumen: [newDoc, ...selectedEmployee.dokumen],
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    onUpdateEmployee(updatedEmp);
    setSelectedEmployee(updatedEmp);
    setIsUploadDocOpen(false);
    setSelectedFile(null);
    setNewDocKet('');
  };

  const handleDeleteDoc = (docId: string) => {
    if (!selectedEmployee) return;
    if (!confirm('Apakah Anda yakin ingin menghapus dokumen arsip ini?')) return;

    const updatedDocs = selectedEmployee.dokumen.filter((d) => d.id !== docId);
    const updatedEmp: Employee = {
      ...selectedEmployee,
      dokumen: updatedDocs,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    onUpdateEmployee(updatedEmp);
    setSelectedEmployee(updatedEmp);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {copySuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{copySuccessMessage}</span>
        </div>
      )}

      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-600" /> Daftar Pegawai & Dokumen
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistem terintegrasi Google Spreadsheet & Berkas Drive untuk 63 ASN Balai Karantina Hewan, Ikan, dan Tumbuhan
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportPDFSpreadsheet}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-blue-600" />
            <span>Cetak PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcelSpreadsheet}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>
          {onImportEmployeesFromSheet && (
            <button
              type="button"
              onClick={handleImportToSIMPEG}
              className="flex items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-3.5 py-2 text-xs font-bold text-sky-800 hover:bg-sky-100 transition-colors shadow-2xs cursor-pointer"
              title="Sinkronkan seluruh data pegawai ke database lokal"
            >
              <RefreshCw className="h-3.5 w-3.5 text-sky-600" />
              <span>Sinkron ke SIMPEG</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Pegawai Baru</span>
          </button>
        </div>
      </div>

      {/* Status Bar Google Spreadsheet */}
      <div className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50/80 via-indigo-50/40 to-slate-50 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start md:items-center gap-3">
          <div className="rounded-xl bg-sky-600 p-2.5 text-white shadow-sm shrink-0">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900">
                Google Spreadsheet Pegawai & Dokumen Terhubung
              </h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Connected
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-600">
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold">
                ID: {PEGAWAI_SPREADSHEET_ID}
              </span>
              <span>&bull;</span>
              <span>{lastSyncTime}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={PEGAWAI_SPREADSHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            <span>Buka Spreadsheet</span>
          </a>
          <button
            type="button"
            onClick={handleSyncSpreadsheet}
            disabled={isSyncing}
            className="flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Segarkan Data'}</span>
          </button>
        </div>
      </div>

      {/* Navigasi Sub-Tab */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('spreadsheet_pegawai')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'spreadsheet_pegawai'
              ? 'border-sky-600 text-sky-700 bg-sky-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4 text-sky-600" />
          <span>Database Pegawai & Berkas Drive (Google Spreadsheet)</span>
          <span className="rounded-full bg-sky-100 text-sky-800 px-2 py-0.5 text-[10px] font-bold">
            {spreadsheetRecords.length} ASN
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('katalog_dokumen')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'katalog_dokumen'
              ? 'border-sky-600 text-sky-700 bg-sky-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderOpen className="h-4 w-4 text-indigo-600" />
          <span>Katalog Dokumen Digital (Google Drive)</span>
          <span className="rounded-full bg-indigo-100 text-indigo-800 px-2 py-0.5 text-[10px] font-bold">
            {metrics.withDrive} Folder Berkas
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('master_lokal')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'master_lokal'
              ? 'border-sky-600 text-sky-700 bg-sky-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4 text-slate-500" />
          <span>Master SIMPEG & Upload Lokal</span>
          <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-bold">
            {employees.length} Pegawai
          </span>
        </button>
      </div>

      {activeTab === 'spreadsheet_pegawai' ? (
        <div className="space-y-6">
          {/* 4 Kartu Metrik Analitik */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total ASN Terdaftar</span>
                <span className="rounded-lg bg-sky-100 p-2 text-sky-700">
                  <Users className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {metrics.total} <span className="text-xs font-normal text-slate-500">Pegawai</span>
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Balai Karantina Hewan, Ikan, & Tumbuhan</p>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-700">Satuan Pelayanan</span>
                <span className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
                  <Layers className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-indigo-900">
                {metrics.satkerCount} <span className="text-xs font-normal text-indigo-700">Wilayah Kerja</span>
              </p>
              <p className="mt-1 text-[11px] text-indigo-600 font-medium">UPT Induk, Bandara & Pelabuhan</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700">Arsip Google Drive</span>
                <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                  <FolderCheck className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-800">
                {metrics.withDrive} <span className="text-xs font-normal text-emerald-700">Folder Cloud</span>
              </p>
              <p className="mt-1 text-[11px] text-emerald-600 font-medium">SK KJF, PAK Terakhir, dan KGB</p>
            </div>

            <div className="rounded-2xl border border-teal-200 bg-teal-50/30 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-700">Status Berkas Lengkap</span>
                <span className="rounded-lg bg-teal-100 p-2 text-teal-700">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-teal-900">
                {metrics.complete} <span className="text-xs font-normal text-teal-700">ASN ({Math.round((metrics.complete / (metrics.total || 1)) * 100)}%)</span>
              </p>
              <p className="mt-1 text-[11px] text-teal-600 font-medium">Terverifikasi di Google Drive</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama pegawai, NIP, pangkat, atau jabatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-sky-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <select
                value={filterSatker}
                onChange={(e) => setFilterSatker(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-500 focus:bg-white"
              >
                <option value="ALL">Semua Satuan Pelayanan ({satkerOptions.length})</option>
                {satkerOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterKelengkapan}
                onChange={(e) => setFilterKelengkapan(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-500 focus:bg-white"
              >
                <option value="ALL">Semua Status Berkas</option>
                <option value="LENGKAP">✅ Berkas Lengkap</option>
                <option value="BELUM">⏳ Belum Lengkap / Dalam Proses</option>
              </select>
            </div>
          </div>

          {/* Tabel Pegawai & Dokumen Spreadsheet */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>Daftar Pegawai ASN & Tautan Berkas Google Drive</span>
                  <span className="rounded-full bg-sky-100 text-sky-800 px-2.5 py-0.5 text-xs font-bold">
                    {filteredSpreadsheetRecords.length} Pegawai
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Setiap baris dilengkapi tautan berkas resmi (SK KJF, PAK Terakhir, dan KGB) langsung ke Google Drive
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 text-center w-12">No</th>
                    <th className="py-3 px-4">Pegawai ASN</th>
                    <th className="py-3 px-3">Pangkat & Masa Kerja</th>
                    <th className="py-3 px-3">Satuan Pelayanan</th>
                    <th className="py-3 px-3">TMT Pangkat & KGB</th>
                    <th className="py-3 px-3 text-center">PAK Terakhir</th>
                    <th className="py-3 px-4 bg-sky-50/50 text-sky-900 text-center">
                      Berkas Dokumen Google Drive
                    </th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredSpreadsheetRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada data pegawai yang sesuai dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredSpreadsheetRecords.map((item, idx) => (
                      <tr
                        key={idx}
                        onClick={() => setSelectedRecord(item)}
                        className={`hover:bg-sky-50/40 transition-colors cursor-pointer ${
                          selectedRecord?.nip === item.nip ? 'bg-sky-50/70 font-medium' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center text-slate-400 font-mono">
                          {item.no}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-bold text-slate-900">{item.nama}</p>
                            <p className="text-[11px] text-slate-500 font-mono">NIP: {item.nip}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                              {item.jabatan}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-800 text-[11px]">
                            {item.pangkat}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {item.masaKerja || '-'}
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block rounded bg-slate-50 border border-slate-200 px-2 py-0.5 text-slate-700 text-[11px] font-medium">
                            {item.satuanPelayanan || 'UPT INDUK'}
                          </span>
                          {item.tanggalLahir && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Lahir: {item.tanggalLahir}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-[11px]">
                            <p className="text-slate-800 font-semibold font-mono">
                              Pkt: {item.tmtPangkat || '-'}
                            </p>
                            <p className="text-emerald-700 font-semibold font-mono text-[10px] mt-0.5">
                              KGB: {item.tmtKGB || '-'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono font-bold text-slate-700 text-[11px]">
                            {item.angkaKredit || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 bg-sky-50/20 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col items-center gap-1.5">
                            {item.linkDrive ? (
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={item.linkDrive}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1 text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
                                  title="Buka Folder Dokumen Google Drive (SK KJF, PAK, KGB)"
                                >
                                  <FolderOpen className="h-3.5 w-3.5" />
                                  <span>Buka Drive</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(item.linkDrive)}
                                  className="p-1 rounded-md text-slate-400 hover:text-sky-600 hover:bg-sky-100 transition-colors"
                                  title="Salin Link Google Drive"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Tidak ada link</span>
                            )}
                            <span
                              className={`rounded-full px-2 py-0.2 text-[9px] font-bold ${
                                item.kelengkapanBerkas === 'LENGKAP'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.kelengkapanBerkas}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(item)}
                            className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'katalog_dokumen' ? (
        /* Tab 2: Katalog Dokumen Digital Google Drive */
        <div className="space-y-6">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-indigo-600" />
                <span>Katalog Berkas Dokumen Digital ASN (63 Folder Drive)</span>
              </h3>
              <p className="text-xs text-indigo-700 mt-1 max-w-2xl">
                Arsip digital resmi mencakup 3 berkas wajib ASN: <strong>Surat Keputusan Jabatan Fungsional (SK KJF)</strong>,{' '}
                <strong>Penetapan Angka Kredit (PAK) Terakhir</strong>, dan <strong>Dokumen Kenaikan Gaji Berkala (KGB)</strong> yang tersimpan pada Google Drive masing-masing pegawai.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={PEGAWAI_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-white px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition-colors shadow-2xs cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Buka Master Sheet</span>
              </a>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama pegawai atau NIP untuk mengakses berkas..."
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
            <div>
              <select
                value={docSatkerFilter}
                onChange={(e) => setDocSatkerFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="ALL">Semua Satuan Pelayanan</option>
                {satkerOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid Kartu Dokumen Drive Pegawai */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocCatalog.map((rec, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold">
                      No. {rec.no} &bull; {rec.satuanPelayanan}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        rec.kelengkapanBerkas === 'LENGKAP'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rec.kelengkapanBerkas}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mt-2 leading-snug">
                    {rec.nama}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">NIP: {rec.nip}</p>
                  <p className="text-[10px] text-slate-600 mt-1 truncate">{rec.jabatan}</p>

                  {/* Dokumen Tags */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-emerald-600" /> SK KJF:
                      </span>
                      <span className="font-semibold text-slate-800">Tersedia di Drive</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-emerald-600" /> PAK Terakhir:
                      </span>
                      <span className="font-mono font-bold text-indigo-700">
                        {rec.angkaKredit ? `${rec.angkaKredit} Poin` : 'Ada'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-emerald-600" /> Dokumen KGB:
                      </span>
                      <span className="font-mono text-emerald-700 font-semibold">{rec.tmtKGB || 'Tersedia'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <a
                    href={rec.linkDrive}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2 text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span>Buka Folder Drive</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(rec.linkDrive)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Salin Tautan Drive"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Tab 3: Master SIMPEG & Upload Lokal */
        <div className="space-y-6">
          {/* Filter & Search Bar Local */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, NIP, atau jabatan pegawai..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-sky-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-500 focus:bg-white"
              >
                <option value="ALL">Semua Unit Kerja</option>
                {uniqueUnits.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-500 focus:bg-white"
              >
                <option value="ALL">Semua Status Pegawai</option>
                <option value="PNS">PNS</option>
                <option value="PPPK">PPPK</option>
                <option value="Honorer/Kontrak">Honorer / Kontrak</option>
              </select>
            </div>
          </div>

          {/* Main Content Layout: Table & Profile Detail Drawer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Employee Table */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800">
                  Daftar Pegawai Terdaftar ({filteredEmployees.length})
                </h3>
                <span className="text-xs text-slate-400">
                  Klik baris untuk melihat detail & berkas
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Pegawai</th>
                      <th className="py-3 px-3">Pangkat & Gol</th>
                      <th className="py-3 px-3">Unit Kerja</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Dokumen</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Tidak ditemukan data pegawai yang sesuai pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const isSelected = selectedEmployee?.id === emp.id;
                        const fullName = `${emp.gelarDepan ? emp.gelarDepan + ' ' : ''}${emp.nama}${emp.gelarBelakang ? ', ' + emp.gelarBelakang : ''}`;

                        return (
                          <tr
                            key={emp.id}
                            className={`hover:bg-sky-50/30 transition-colors cursor-pointer ${
                              isSelected ? 'bg-sky-50/60 font-medium' : ''
                            }`}
                            onClick={() => setSelectedEmployee(emp)}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs shrink-0 border border-sky-200">
                                  {emp.nama.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900 truncate">{fullName}</p>
                                  <p className="text-[11px] text-slate-500 font-mono">NIP: {emp.nip}</p>
                                  <p className="text-[10px] text-slate-400 truncate">{emp.jabatan}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                {emp.pangkatGolongan}
                              </span>
                            </td>
                            <td className="py-3 px-3 max-w-[140px] truncate text-slate-600" title={emp.unitKerja}>
                              {emp.unitKerja}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  emp.statusPegawai === 'PNS'
                                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                    : emp.statusPegawai === 'PPPK'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {emp.statusPegawai}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                <FileText className="h-3.5 w-3.5 text-sky-500" />
                                {emp.dokumen?.length || 0} berkas
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(emp)}
                                  className="p-1.5 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                                  title="Edit Data Pribadi"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteWith2FA(emp)}
                                  className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Hapus Pegawai (Memerlukan 2FA)"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
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

            {/* Right 1 Col: Selected Employee Dossier & Upload Dokumen */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col">
              {selectedEmployee ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">Berkas Pribadi & Arsip</h3>
                    <button
                      type="button"
                      onClick={() => setIsUploadDocOpen(true)}
                      className="flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sky-700 transition-colors cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Dokumen</span>
                    </button>
                  </div>

                  {/* Profile Card Header */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="h-12 w-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                      {selectedEmployee.nama.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {selectedEmployee.gelarDepan ? selectedEmployee.gelarDepan + ' ' : ''}
                        {selectedEmployee.nama}
                        {selectedEmployee.gelarBelakang ? ', ' + selectedEmployee.gelarBelakang : ''}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">NIP. {selectedEmployee.nip}</p>
                      <p className="text-xs text-sky-700 font-semibold">{selectedEmployee.jabatan}</p>
                    </div>
                  </div>

                  {/* Sensitive & Details Info */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Pangkat / Golongan:</span>
                      <span className="font-semibold text-slate-800">{selectedEmployee.pangkatGolongan}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Unit Kerja:</span>
                      <span className="font-semibold text-slate-800 text-right">{selectedEmployee.unitKerja}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Gaji Pokok:</span>
                      <span className="font-mono font-bold text-emerald-700">{formatRupiah(selectedEmployee.gajiPokok)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Hak Sisa Cuti (N / N-1):</span>
                      <span className="font-bold text-sky-700">{selectedEmployee.sisaCutiN} hari / {selectedEmployee.sisaCutiN1} hari</span>
                    </div>
                    {selectedEmployee.linkDrive && (
                      <div className="flex justify-between py-1 border-b border-slate-100 items-center">
                        <span className="text-slate-500">Folder Google Drive:</span>
                        <a
                          href={selectedEmployee.linkDrive}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sky-600 font-bold hover:underline"
                        >
                          <FolderOpen className="h-3 w-3" />
                          <span>Buka Drive</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Uploaded Documents List */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Dokumen Arsip ({selectedEmployee.dokumen?.length || 0}):
                      </h4>
                    </div>

                    {!selectedEmployee.dokumen || selectedEmployee.dokumen.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                        Belum ada dokumen yang diupload. Klik tombol di atas untuk upload KTP, NPWP, atau SK PNS.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {selectedEmployee.dokumen.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700 shrink-0">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{doc.jenisDokumen}</p>
                                <p className="text-[11px] text-slate-500 truncate">{doc.namaFile} &bull; {doc.ukuran}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => alert(`Membuka berkas arsip: ${doc.namaFile}`)}
                                className="p-1 text-slate-400 hover:text-sky-600"
                                title="Unduh / Buka Dokumen"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDoc(doc.id)}
                                className="p-1 text-slate-400 hover:text-rose-600"
                                title="Hapus Dokumen"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-center text-slate-400">
                  <Users className="h-12 w-12 text-slate-300 mb-3" />
                  <h4 className="text-sm font-bold text-slate-600">Pilih Pegawai</h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Pilih salah satu pegawai dari tabel untuk melihat dokumen, data pribadi, atau mengunggah berkas arsip baru.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail & Dokumen Pegawai Spreadsheet */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-8">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
              <div className="h-12 w-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                {selectedRecord.nama.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 pr-8">
                <span className="rounded-full bg-sky-100 text-sky-800 px-2 py-0.5 text-[10px] font-bold">
                  No. Urut {selectedRecord.no} &bull; {selectedRecord.satuanPelayanan || 'UPT INDUK'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedRecord.nama}</h3>
                <p className="text-xs text-slate-500 font-mono">NIP: {selectedRecord.nip}</p>
                <p className="text-xs text-sky-700 font-semibold mt-0.5">{selectedRecord.jabatan}</p>
              </div>
            </div>

            {/* Grid Informasi Kepegawaian */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <p className="text-[10px] font-semibold text-slate-500">Pangkat & Golongan</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedRecord.pangkat}</p>
                <p className="text-[10px] text-slate-500">{selectedRecord.pangkatDetail}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <p className="text-[10px] font-semibold text-slate-500">Masa Kerja Golongan</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedRecord.masaKerja || '-'}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <p className="text-[10px] font-semibold text-slate-500">Tanggal Lahir</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedRecord.tanggalLahir || '-'}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <p className="text-[10px] font-semibold text-slate-500">TMT Pangkat Terakhir</p>
                <p className="text-xs font-bold font-mono text-slate-800 mt-0.5">{selectedRecord.tmtPangkat || '-'}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <p className="text-[10px] font-semibold text-slate-500">TMT Kenaikan Gaji (KGB)</p>
                <p className="text-xs font-bold font-mono text-emerald-700 mt-0.5">{selectedRecord.tmtKGB || '-'}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <p className="text-[10px] font-semibold text-slate-500">Angka Kredit Terakhir (PAK)</p>
                <p className="text-xs font-bold font-mono text-indigo-700 mt-0.5">{selectedRecord.angkaKredit || '-'}</p>
              </div>
            </div>

            {/* Kotak Berkas Dokumen Google Drive */}
            <div className="rounded-2xl border border-sky-300 bg-gradient-to-br from-sky-50 via-indigo-50/40 to-slate-50 p-4.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-sky-600 p-2 text-white shadow-xs">
                    <FolderOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Arsip Berkas Digital Google Drive Pegawai
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Folder penyimpanan resmi: SK KJF, PAK Terakhir, dan Dokumen KGB
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    selectedRecord.kelengkapanBerkas === 'LENGKAP'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {selectedRecord.kelengkapanBerkas}
                </span>
              </div>

              <div className="mt-3.5 space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <FileText className="h-4 w-4 text-sky-600 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">1. SK Jabatan Fungsional (KJF)</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Tersedia</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">2. Penetapan Angka Kredit (PAK) Terakhir</span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {selectedRecord.angkaKredit ? `${selectedRecord.angkaKredit} Poin` : 'Tersedia'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">3. Dokumen Kenaikan Gaji Berkala (KGB)</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {selectedRecord.tmtKGB || 'Tersedia'}
                  </span>
                </div>
              </div>

              {selectedRecord.linkDrive ? (
                <div className="mt-4 pt-3 border-t border-sky-200 flex flex-col sm:flex-row items-center gap-2">
                  <a
                    href={selectedRecord.linkDrive}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white py-2.5 text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span>Buka Folder Google Drive Pegawai</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(selectedRecord.linkDrive)}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span>{copiedLink ? 'Tersalin' : 'Salin Tautan'}</span>
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-500 italic">
                  Tautan Google Drive belum tercatat pada spreadsheet.
                </p>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah / Edit Pegawai Lokal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-8">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-600" />
              <span>{isEditing ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}</span>
            </h3>

            <form onSubmit={handleSaveForm} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">NIP (Nomor Induk Pegawai) *</label>
                  <input
                    type="text"
                    required
                    value={formData.nip || ''}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={formData.nama || ''}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-sky-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Jabatan Kedinasan *</label>
                  <input
                    type="text"
                    required
                    value={formData.jabatan || ''}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Pangkat & Golongan</label>
                  <input
                    type="text"
                    value={formData.pangkatGolongan || ''}
                    onChange={(e) => setFormData({ ...formData, pangkatGolongan: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Unit / Satuan Pelayanan</label>
                  <input
                    type="text"
                    value={formData.unitKerja || ''}
                    onChange={(e) => setFormData({ ...formData, unitKerja: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Status Pegawai</label>
                  <select
                    value={formData.statusPegawai || 'PNS'}
                    onChange={(e) => setFormData({ ...formData, statusPegawai: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-sky-500 bg-white"
                  >
                    <option value="PNS">PNS (Pegawai Negeri Sipil)</option>
                    <option value="PPPK">PPPK (Pegawai Pemerintah dengan PK)</option>
                    <option value="Honorer/Kontrak">Honorer / Kontrak</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Gaji Pokok (Rp)</label>
                  <input
                    type="number"
                    value={formData.gajiPokok || 0}
                    onChange={(e) => setFormData({ ...formData, gajiPokok: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">TMT Pengangkatan</label>
                  <input
                    type="date"
                    value={formData.tmtPNS || ''}
                    onChange={(e) => setFormData({ ...formData, tmtPNS: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-700 cursor-pointer shadow-sm"
                >
                  {isEditing ? 'Simpan Perubahan' : 'Tambah Pegawai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Upload Dokumen Baru */}
      {isUploadDocOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <button
              onClick={() => setIsUploadDocOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Upload className="h-4 w-4 text-sky-600" />
              <span>Unggah Dokumen Arsip</span>
            </h3>

            <p className="text-xs text-slate-500 mt-2">
              Pegawai: <strong>{selectedEmployee.nama}</strong> ({selectedEmployee.nip})
            </p>

            <form onSubmit={handleUploadDoc} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Jenis Dokumen *</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-sky-500 bg-white"
                >
                  <option value="KTP">KTP Elektronik</option>
                  <option value="NPWP">NPWP (Nomor Pokok Wajib Pajak)</option>
                  <option value="SK CPNS">SK CPNS</option>
                  <option value="SK PNS">SK PNS</option>
                  <option value="Ijazah Terakhir">Ijazah Terakhir & Transkrip</option>
                  <option value="Kartu Pegawai (KARPEG)">Kartu Pegawai (KARPEG)</option>
                  <option value="BPJS">Kartu BPJS Kesehatan / Ketenagakerjaan</option>
                  <option value="Lainnya">Lainnya (SK KJF / PAK / KGB)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Pilih Berkas Dokumen (PDF / Foto) *</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Keterangan Tambahan</label>
                <input
                  type="text"
                  placeholder="Misal: SK KJF TMT 2026 atau Legalisir Asli"
                  value={newDocKet}
                  onChange={(e) => setNewDocKet(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadDocOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-700 cursor-pointer shadow-sm"
                >
                  Unggah Berkas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
