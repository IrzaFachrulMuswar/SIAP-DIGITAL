import React, { useState } from 'react';
import { 
  WalletCards, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit3, 
  FileSpreadsheet, 
  Printer, 
  X, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Building2, 
  Send,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Paperclip
} from 'lucide-react';
import { PerbendaharaanRecord, JenisPerbendaharaan, TipePembayaran, StatusPerbendaharaan, LampiranDokumen } from '../types';
import { formatRupiah, exportPerbendaharaanPDF, exportToExcel } from '../utils/exportUtils';
import { FileUploadZone } from '../components/FileUploadZone';
import { DocumentViewerModal } from '../components/DocumentViewerModal';

// Google Spreadsheet Rekapitulasi SPP, SPM, dan SP2D ID: 1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M (gid: 434072222)
export const PERBENDAHARAAN_SPREADSHEET_ID = '1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M';
export const PERBENDAHARAAN_SPREADSHEET_GID = '434072222';
export const PERBENDAHARAAN_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${PERBENDAHARAAN_SPREADSHEET_ID}/edit?gid=${PERBENDAHARAAN_SPREADSHEET_GID}#gid=${PERBENDAHARAAN_SPREADSHEET_GID}`;
export const PERBENDAHARAAN_SPREADSHEET_EMBED_URL = `https://docs.google.com/spreadsheets/d/${PERBENDAHARAAN_SPREADSHEET_ID}/htmlembed?gid=${PERBENDAHARAAN_SPREADSHEET_GID}&widget=true&headers=false`;

interface PerbendaharaanViewProps {
  records: PerbendaharaanRecord[];
  onAddRecord: (record: PerbendaharaanRecord) => void;
  onUpdateRecord: (record: PerbendaharaanRecord) => void;
  onDeleteRecord: (id: string) => void;
  onRequest2FA: (title: string, action: () => void) => void;
}

export const PerbendaharaanView: React.FC<PerbendaharaanViewProps> = ({
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onRequest2FA,
}) => {
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [copiedSpreadsheet, setCopiedSpreadsheet] = useState(false);
  const [showSheetPreview, setShowSheetPreview] = useState(false);

  const handleCopySpreadsheet = () => {
    navigator.clipboard.writeText(PERBENDAHARAAN_SPREADSHEET_URL);
    setCopiedSpreadsheet(true);
    setTimeout(() => setCopiedSpreadsheet(false), 2500);
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<Partial<PerbendaharaanRecord>>({
    nomorDokumen: `SPM-00${Date.now().toString().slice(-3)}/KEMENKEU/2026`,
    jenis: 'SPM',
    tipePembayaran: 'LS (Langsung)',
    tanggalDokumen: new Date().toISOString().slice(0, 10),
    uraian: 'Pembayaran Belanja Pegawai dan Honorarium Tim Kerja',
    nilaiRupiah: 150000000,
    namaPenerima: 'Rekening Penampungan Satker / Bendahara Pengeluaran',
    nomorRekening: '122-00-9876543-2',
    bankPenerima: 'Bank Mandiri (Persero) Tbk',
    kodeAkun: '511111 (Belanja Gaji Pokok PNS)',
    pejabatPenandatangan: 'Drs. H. Mulyadi, M.Si. (PPK)',
    nomorSP2DRef: 'SP2D-260123984',
    status: 'Diterbitkan SPM',
    dokumenLampiran: [],
  });

  // Document Viewer Modal State
  const [viewingDocs, setViewingDocs] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    documents: LampiranDokumen[];
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    documents: [],
  });

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.nomorDokumen.toLowerCase().includes(search.toLowerCase()) ||
      r.uraian.toLowerCase().includes(search.toLowerCase()) ||
      r.namaPenerima.toLowerCase().includes(search.toLowerCase()) ||
      (r.nomorSP2DRef && r.nomorSP2DRef.toLowerCase().includes(search.toLowerCase()));

    const matchesJenis = filterJenis === 'ALL' || r.jenis === filterJenis;
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;

    return matchesSearch && matchesJenis && matchesStatus;
  });

  const totalNilaiCair = records
    .filter((r) => r.status === 'Cair ke Rekening')
    .reduce((acc, r) => acc + r.nilaiRupiah, 0);

  const totalNilaiProses = records
    .filter((r) => r.status !== 'Cair ke Rekening' && r.status !== 'Ditolak / Retur')
    .reduce((acc, r) => acc + r.nilaiRupiah, 0);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      nomorDokumen: `SPM-${Math.floor(Math.random() * 900 + 100)}/KEMENKEU/2026`,
      jenis: 'SPM',
      tipePembayaran: 'LS (Langsung)',
      tanggalDokumen: new Date().toISOString().slice(0, 10),
      uraian: 'Pembayaran Belanja Operasional dan Perjalanan Dinas Pegawai',
      nilaiRupiah: 45000000,
      namaPenerima: 'Bendahara Pengeluaran Satuan Kerja',
      nomorRekening: '001-098-76543-1',
      bankPenerima: 'Bank Mandiri',
      kodeAkun: '524111 (Belanja Perjalanan Dinas Biasa)',
      pejabatPenandatangan: 'Drs. H. Mulyadi, M.Si. (PPK)',
      nomorSP2DRef: '',
      status: 'Draf SPP',
      dokumenLampiran: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: PerbendaharaanRecord) => {
    setIsEditing(true);
    setFormData({ ...rec, dokumenLampiran: rec.dokumenLampiran || [] });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomorDokumen || !formData.nilaiRupiah || !formData.uraian) {
      alert('Lengkapi nomor dokumen, nilai rupiah, dan uraian.');
      return;
    }

    const payload: PerbendaharaanRecord = {
      ...(formData as PerbendaharaanRecord),
      id: isEditing && formData.id ? formData.id : `FIN-${Date.now().toString().slice(-4)}`,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    // Sensitive financial actions: Diterbitkan SPM or Cair ke Rekening -> require 2FA
    if (payload.status === 'Diterbitkan SPM' || payload.status === 'Cair ke Rekening') {
      onRequest2FA(`Otorisasi Keuangan Perbendaharaan senilai ${formatRupiah(payload.nilaiRupiah)}`, () => {
        if (isEditing) {
          onUpdateRecord(payload);
        } else {
          onAddRecord(payload);
        }
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
      Nomor_Dokumen: r.nomorDokumen,
      Jenis: r.jenis,
      Tipe_Pembayaran: r.tipePembayaran,
      Tanggal: r.tanggalDokumen,
      Uraian: r.uraian,
      Penerima: r.namaPenerima,
      Rekening: r.nomorRekening,
      Bank: r.bankPenerima,
      Nilai_Rupiah: r.nilaiRupiah,
      Kode_Akun: r.kodeAkun,
      Nomor_SP2D: r.nomorSP2DRef || '-',
      Status: r.status,
    }));
    exportToExcel(data, 'Perbendaharaan SPP SPM SP2D', 'Laporan_Perbendaharaan_SP2D_Keuangan');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <WalletCards className="h-6 w-6 text-emerald-600" /> Perbendaharaan: SPP, SPM, dan SP2D
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistem penerbitan dokumen pembayaran negara, monitoring SP2D KPPN, dan realisasi anggaran kas
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            id="btn-google-sheets-perbendaharaan-top"
            href={PERBENDAHARAAN_SPREADSHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/90 hover:bg-emerald-100 px-3.5 py-2 text-xs font-bold text-emerald-700 transition-colors shadow-xs cursor-pointer"
            title="Buka Google Spreadsheet Rekapitulasi SPP, SPM, dan SP2D"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Spreadsheet SPP/SPM/SP2D</span>
            <ExternalLink className="h-3 w-3 text-emerald-500" />
          </a>

          <button
            type="button"
            onClick={() => exportPerbendaharaanPDF(records)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Cetak PDF Audit</span>
          </button>
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
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Buat SPP / SPM Baru</span>
          </button>
        </div>
      </div>

      {/* Card Google Spreadsheet Rekapitulasi SPP, SPM, dan SP2D */}
      <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/95 via-teal-50/60 to-cyan-50/40 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Google Spreadsheet Rekapitulasi SPP, SPM, dan SP2D
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Spreadsheet Terhubung (Tab GID: {PERBENDAHARAAN_SPREADSHEET_GID})
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Monitoring real-time nomor dokumen SPP, penerbitan SPM, nomor SP2D KPPN, akun anggaran (MAK), nilai rupiah belanja negara, serta verifikasi rekening penerima.
            </p>
            <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-emerald-700 bg-white/90 border border-emerald-200/80 rounded-lg px-2.5 py-1 w-fit max-w-full overflow-hidden text-ellipsis">
              <span className="text-slate-400">Spreadsheet ID:</span>
              <span className="truncate font-bold">{PERBENDAHARAAN_SPREADSHEET_ID} (gid: {PERBENDAHARAAN_SPREADSHEET_GID})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            type="button"
            id="btn-toggle-preview-perbendaharaan-sheet"
            onClick={() => setShowSheetPreview(!showSheetPreview)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors shadow-2xs cursor-pointer ${
              showSheetPreview
                ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                : 'bg-white border-emerald-200 text-slate-700 hover:bg-emerald-50'
            }`}
            title="Tampilkan / Sembunyikan Pratinjau Google Sheets SPP/SPM/SP2D"
          >
            <Eye className="h-3.5 w-3.5 text-emerald-600" />
            <span>{showSheetPreview ? 'Tutup Pratinjau' : 'Pratinjau Sheets'}</span>
          </button>
          <button
            type="button"
            id="btn-copy-perbendaharaan-spreadsheet"
            onClick={handleCopySpreadsheet}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 transition-colors shadow-2xs cursor-pointer"
            title="Salin Link Google Spreadsheet"
          >
            {copiedSpreadsheet ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-500" />
                <span>Salin Link</span>
              </>
            )}
          </button>
          <a
            id="btn-open-perbendaharaan-spreadsheet-banner"
            href={PERBENDAHARAAN_SPREADSHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Buka di Google Sheets</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Pratinjau Inline Google Sheets SPP SPM SP2D jika dibuka */}
      {showSheetPreview && (
        <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="bg-emerald-50/80 px-4 py-2.5 border-b border-emerald-200 text-xs text-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold text-slate-800">Pratinjau Langsung: Google Spreadsheet SPP, SPM, dan SP2D (gid: {PERBENDAHARAAN_SPREADSHEET_GID})</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={PERBENDAHARAAN_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
              >
                Buka Tab Baru <ExternalLink className="h-3 w-3" />
              </a>
              <button
                type="button"
                onClick={() => setShowSheetPreview(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <iframe
            src={PERBENDAHARAAN_SPREADSHEET_EMBED_URL}
            className="w-full h-[520px] border-0 bg-white"
            title="Google Spreadsheet SPP, SPM, dan SP2D"
            loading="lazy"
          />
        </div>
      )}

      {/* Overview Metric Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total SP2D Cair ke Rekening
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-700 font-mono">
              {formatRupiah(totalNilaiCair)}
            </span>
          </div>
          <p className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Dana telah berhasil ditransfer
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Dalam Proses SPM / KPPN
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-blue-700 font-mono">
              {formatRupiah(totalNilaiProses)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Verifikasi berkas & antrean SAKTI</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Jumlah Berkas Dokumen
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">
              {records.length} Berkas
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Arsip SPP, SPM, dan SP2D terdaftar</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor dokumen, penerima, uraian..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
          />
        </div>

        <div>
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
          >
            <option value="ALL">Semua Jenis Dokumen</option>
            <option value="SPP">SPP (Surat Permintaan Pembayaran)</option>
            <option value="SPM">SPM (Surat Perintah Membayar)</option>
            <option value="SP2D">SP2D (Surat Perintah Pencairan Dana)</option>
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
          >
            <option value="ALL">Semua Status Pencairan</option>
            <option value="Draf SPP">Draf SPP</option>
            <option value="Diterbitkan SPM">Diterbitkan SPM</option>
            <option value="Diajukan ke KPPN / Bank">Diajukan ke KPPN / Bank</option>
            <option value="Cair ke Rekening">Cair ke Rekening</option>
            <option value="Ditolak / Retur">Ditolak / Retur</option>
          </select>
        </div>
      </div>

      {/* Table Perbendaharaan */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Daftar Pembayaran Perbendaharaan ({filteredRecords.length})
          </h3>
          <span className="text-xs text-slate-400">
            Terintegrasi dengan kode akun anggaran negara (MAK)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nomor & Jenis Dokumen</th>
                <th className="py-3 px-3">Uraian Keperluan Belanja</th>
                <th className="py-3 px-3">Penerima & Rekening</th>
                <th className="py-3 px-3">Jumlah Nilai (Rp)</th>
                <th className="py-3 px-3">Status Pencairan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div>
                      <span className="inline-block rounded bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800 border border-emerald-200">
                        {item.jenis} &bull; {item.tipePembayaran}
                      </span>
                      <p className="font-mono font-bold text-slate-900 mt-1">{item.nomorDokumen}</p>
                      <p className="text-[10px] text-slate-400">Tgl: {item.tanggalDokumen}</p>
                      {item.dokumenLampiran && item.dokumenLampiran.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setViewingDocs({
                            isOpen: true,
                            title: `Berkas Lampiran: ${item.nomorDokumen}`,
                            subtitle: `${item.jenis} (${item.tipePembayaran}) - Nilai: ${formatRupiah(item.nilaiRupiah)}`,
                            documents: item.dokumenLampiran || [],
                          })}
                          className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200 transition-colors cursor-pointer"
                          title="Lihat berkas lampiran yang diupload"
                        >
                          <Paperclip className="h-3 w-3 text-emerald-600" />
                          <span>{item.dokumenLampiran.length} File Lampiran</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                          <Paperclip className="h-3 w-3 text-slate-300" />
                          <span>0 Lampiran</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 max-w-[220px]">
                    <p className="font-semibold text-slate-800 truncate" title={item.uraian}>{item.uraian}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.kodeAkun}</p>
                    {item.nomorSP2DRef && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 font-mono mt-0.5">
                        SP2D: {item.nomorSP2DRef}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-800 truncate max-w-[160px]">{item.namaPenerima}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{item.nomorRekening}</p>
                    <p className="text-[10px] text-slate-400">{item.bankPenerima}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-black font-mono text-emerald-800 text-sm">
                      {formatRupiah(item.nilaiRupiah)}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        item.status === 'Cair ke Rekening'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Diterbitkan SPM' || item.status === 'Diajukan ke KPPN / Bank'
                          ? 'bg-blue-100 text-blue-800'
                          : item.status === 'Ditolak / Retur'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <a
                        href={PERBENDAHARAAN_SPREADSHEET_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 p-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                        title="Buka Data di Google Spreadsheet SPP/SPM/SP2D"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Sheet</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Edit Dokumen Perbendaharaan"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus dokumen perbendaharaan ${item.nomorDokumen}?`)) {
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

      {/* Modal SPP/SPM */}
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
              {isEditing ? 'Kelola Dokumen Perbendaharaan' : 'Buat Dokumen SPP / SPM Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Jenis Dokumen</label>
                  <select
                    value={formData.jenis || 'SPM'}
                    onChange={(e) => setFormData({ ...formData, jenis: e.target.value as JenisPerbendaharaan })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                  >
                    <option value="SPP">SPP (Permintaan Pembayaran)</option>
                    <option value="SPM">SPM (Perintah Membayar)</option>
                    <option value="SP2D">SP2D (Pencairan Dana)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Tipe Pembayaran</label>
                  <select
                    value={formData.tipePembayaran || 'LS (Langsung)'}
                    onChange={(e) => setFormData({ ...formData, tipePembayaran: e.target.value as TipePembayaran })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                  >
                    <option value="LS (Langsung)">LS (Langsung)</option>
                    <option value="UP (Uang Persediaan)">UP (Uang Persediaan)</option>
                    <option value="GUP (Ganti Uang Persediaan)">GUP (Ganti Uang)</option>
                    <option value="TUP (Tambah Uang Persediaan)">TUP (Tambah Uang)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Nomor Dokumen *</label>
                  <input
                    type="text"
                    required
                    value={formData.nomorDokumen || ''}
                    onChange={(e) => setFormData({ ...formData, nomorDokumen: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Tanggal Dokumen</label>
                  <input
                    type="date"
                    value={formData.tanggalDokumen || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalDokumen: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Uraian Belanja / Pembayaran *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.uraian || ''}
                  onChange={(e) => setFormData({ ...formData, uraian: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 text-emerald-800">
                  Nilai Anggaran / Tagihan (Rupiah) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.nilaiRupiah || 0}
                  onChange={(e) => setFormData({ ...formData, nilaiRupiah: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-emerald-400 bg-emerald-50/40 p-2 text-sm font-mono font-bold text-emerald-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Nama Penerima</label>
                  <input
                    type="text"
                    value={formData.namaPenerima || ''}
                    onChange={(e) => setFormData({ ...formData, namaPenerima: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Nomor Rekening</label>
                  <input
                    type="text"
                    value={formData.nomorRekening || ''}
                    onChange={(e) => setFormData({ ...formData, nomorRekening: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Bank</label>
                  <input
                    type="text"
                    value={formData.bankPenerima || ''}
                    onChange={(e) => setFormData({ ...formData, bankPenerima: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Kode Akun Anggaran (MAK)</label>
                  <input
                    type="text"
                    value={formData.kodeAkun || ''}
                    onChange={(e) => setFormData({ ...formData, kodeAkun: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Nomor Referensi SP2D (KPPN)</label>
                  <input
                    type="text"
                    placeholder="SP2D-260123984"
                    value={formData.nomorSP2DRef || ''}
                    onChange={(e) => setFormData({ ...formData, nomorSP2DRef: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-mono text-blue-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Status Pencairan Kas</label>
                <select
                  value={formData.status || 'Draf SPP'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusPerbendaharaan })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold"
                >
                  <option value="Draf SPP">1. Draf SPP</option>
                  <option value="Diterbitkan SPM">2. Diterbitkan SPM (Perlu 2FA)</option>
                  <option value="Diajukan ke KPPN / Bank">3. Diajukan ke KPPN / Bank</option>
                  <option value="Cair ke Rekening">4. Cair ke Rekening (Perlu 2FA)</option>
                  <option value="Ditolak / Retur">5. Ditolak / Retur</option>
                </select>
              </div>

              {/* Form Input Upload Berkas Lampiran SPP / SPM / SP2D */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                <FileUploadZone
                  label="Form Input Upload Berkas Lampiran SPP / SPM / SP2D"
                  sublabel="Berkas SPP, Lembar SPM Resmi (SAKTI Kemenkeu), Salinan SP2D KPPN, Kuitansi & Faktur Pajak, BAST / SPTJB"
                  categoryOptions={[
                    'Berkas SPP',
                    'Lembar SPM Resmi (SAKTI)',
                    'Salinan SP2D KPPN',
                    'Kuitansi & Faktur Pajak',
                    'BAST / SPTJB',
                    'Lainnya',
                  ]}
                  defaultCategory="Berkas SPP"
                  documents={formData.dokumenLampiran || []}
                  onChange={(newDocs) => setFormData({ ...formData, dokumenLampiran: newDocs })}
                />
              </div>

              {/* Tautan Google Spreadsheet Rekap SPP, SPM & SP2D */}
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-xs text-slate-700 font-medium">
                    Google Spreadsheet Rekap SPP, SPM & SP2D (gid: {PERBENDAHARAAN_SPREADSHEET_GID}):
                  </span>
                </div>
                <a
                  href={PERBENDAHARAAN_SPREADSHEET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-200 rounded-lg px-2.5 py-1.5 shrink-0 shadow-2xs w-fit cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Buka Spreadsheet</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
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
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                >
                  Simpan Dokumen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={viewingDocs.isOpen}
        onClose={() => setViewingDocs({ ...viewingDocs, isOpen: false })}
        title={viewingDocs.title}
        subtitle={viewingDocs.subtitle}
        documents={viewingDocs.documents}
      />
    </div>
  );
};
