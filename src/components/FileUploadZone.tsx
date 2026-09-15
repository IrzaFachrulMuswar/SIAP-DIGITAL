import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  File, 
  Trash2, 
  Download, 
  Eye, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Paperclip
} from 'lucide-react';
import { LampiranDokumen } from '../types';

interface FileUploadZoneProps {
  label?: string;
  sublabel?: string;
  categoryOptions?: string[];
  defaultCategory?: string;
  documents: LampiranDokumen[];
  onChange: (documents: LampiranDokumen[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  compact?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  label = 'Upload Berkas / Lampiran Bukti',
  sublabel = 'Format: PDF, Word, Excel, JPG, PNG (Maks. 10 MB per file)',
  categoryOptions = ['Dokumen Resmi', 'Kwitansi / Bukti Bayar', 'Laporan Hasil', 'Foto / Dokumentasi', 'Lainnya'],
  defaultCategory,
  documents = [],
  onChange,
  maxFiles = 10,
  maxSizeMB = 10,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png',
  compact = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    defaultCategory || (categoryOptions.length > 0 ? categoryOptions[0] : 'Dokumen')
  );
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<LampiranDokumen | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string, type?: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') {
      return <FileText className="h-4 w-4 text-rose-600 shrink-0" />;
    }
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext) || type?.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4 text-emerald-600 shrink-0" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="h-4 w-4 text-emerald-700 shrink-0" />;
    }
    return <File className="h-4 w-4 text-blue-600 shrink-0" />;
  };

  const handleFiles = (files: FileList | File[]) => {
    setUploadError(null);
    const fileArray = Array.from(files);

    if (documents.length + fileArray.length > maxFiles) {
      setUploadError(`Maksimal ${maxFiles} file dokumen lampiran.`);
      return;
    }

    const newDocs: LampiranDokumen[] = [];
    const maxBytes = maxSizeMB * 1024 * 1024;

    fileArray.forEach((file) => {
      if (file.size > maxBytes) {
        setUploadError(`File "${file.name}" melebihi batas ${maxSizeMB} MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        const doc: LampiranDokumen = {
          id: `DOC-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          nama: file.name.replace(/\.[^/.]+$/, ''),
          jenis: selectedCategory,
          namaFile: file.name,
          ukuran: formatFileSize(file.size),
          tipe: file.type || 'application/octet-stream',
          uploadedAt: dateStr,
          dataUrl: dataUrl,
        };

        newDocs.push(doc);

        if (newDocs.length === fileArray.length) {
          onChange([...documents, ...newDocs]);
        }
      };

      reader.onerror = () => {
        setUploadError(`Gagal membaca file "${file.name}".`);
      };

      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = (id: string) => {
    onChange(documents.filter((d) => d.id !== id));
  };

  const handleDownload = (doc: LampiranDokumen) => {
    if (!doc.dataUrl) {
      alert(`Berkas "${doc.namaFile}" merupakan arsip data.`);
      return;
    }
    const link = document.createElement('a');
    link.href = doc.dataUrl;
    link.download = doc.namaFile;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5 text-blue-600" />
            <span>{label}</span>
          </label>
          {sublabel && <p className="text-[11px] text-slate-500 mt-0.5">{sublabel}</p>}
        </div>

        {categoryOptions.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-600 whitespace-nowrap">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {categoryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Drag & Drop Upload Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-200'
            : 'border-slate-300 bg-slate-50/70 hover:border-blue-400 hover:bg-blue-50/30'
        } ${compact ? 'py-3' : 'py-5'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-1.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-xs border border-slate-200 group-hover:scale-105 group-hover:border-blue-300 transition-transform">
            <UploadCloud className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-xs font-semibold text-slate-700">
            <span className="text-blue-600 font-bold underline underline-offset-2">Klik untuk memilih file</span> atau tarik file ke sini
          </p>
          <p className="text-[10px] text-slate-500">
            Kategori lampiran saat ini: <span className="font-bold text-slate-700">{selectedCategory}</span>
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {uploadError && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="ml-auto text-rose-500 hover:text-rose-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
            <span>Berkas Terlampir ({documents.length}):</span>
            <span className="text-[10px] text-slate-400 font-normal">Tersimpan dalam record</span>
          </p>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs shadow-2xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getFileIcon(doc.namaFile, doc.tipe)}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 truncate" title={doc.namaFile}>
                      {doc.namaFile}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      {doc.jenis && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 font-medium text-slate-600">
                          {doc.jenis}
                        </span>
                      )}
                      {doc.ukuran && <span>{doc.ukuran}</span>}
                      {doc.uploadedAt && <span>• {doc.uploadedAt}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {doc.dataUrl && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewDoc(doc);
                        }}
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                        title="Pratinjau File"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(doc);
                        }}
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
                        title="Unduh File"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id);
                    }}
                    className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title="Hapus Lampiran"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal for Uploaded Document */}
      {previewDoc && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div 
            className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl bg-white p-4 shadow-2xl flex flex-col border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(previewDoc.namaFile, previewDoc.tipe)}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 truncate" title={previewDoc.namaFile}>
                    {previewDoc.namaFile}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Kategori: <span className="font-semibold text-slate-700">{previewDoc.jenis || 'Dokumen'}</span> • {previewDoc.ukuran}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {previewDoc.dataUrl && (
                  <button
                    type="button"
                    onClick={() => handleDownload(previewDoc)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Unduh</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-[300px] overflow-auto flex items-center justify-center bg-slate-50 rounded-xl p-3 border border-slate-200">
              {previewDoc.dataUrl?.startsWith('data:image/') ? (
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.namaFile}
                  className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-xs"
                />
              ) : previewDoc.dataUrl?.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewDoc.dataUrl}
                  title={previewDoc.namaFile}
                  className="w-full h-[65vh] rounded-lg border-0"
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">{previewDoc.namaFile}</p>
                  <p className="text-[11px] text-slate-500">
                    Pratinjau langsung tidak didukung untuk tipe berkas ini. Silakan unduh untuk melihat isi lengkapnya.
                  </p>
                  {previewDoc.dataUrl && (
                    <button
                      type="button"
                      onClick={() => handleDownload(previewDoc)}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      <Download className="h-3.5 w-3.5" /> Unduh Dokumen
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
