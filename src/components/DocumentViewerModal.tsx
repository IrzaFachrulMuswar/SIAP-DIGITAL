import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  File, 
  Download, 
  Eye, 
  Paperclip,
  CheckCircle2
} from 'lucide-react';
import { LampiranDokumen } from '../types';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  documents: LampiranDokumen[];
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  documents = [],
}) => {
  const [activeDoc, setActiveDoc] = useState<LampiranDokumen | null>(
    documents.length > 0 ? documents[0] : null
  );

  if (!isOpen) return null;

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

  const handleDownload = (doc: LampiranDokumen) => {
    if (!doc.dataUrl) {
      alert(`Berkas "${doc.namaFile}" merupakan arsip dokumen.`);
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white p-5 shadow-2xl flex flex-col border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Paperclip className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <FileText className="h-10 w-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">Belum ada file dokumen lampiran yang diupload.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Edit data untuk menambahkan berkas baru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 flex-1 min-h-[360px] overflow-hidden">
            {/* Sidebar list of documents */}
            <div className="border border-slate-200 rounded-xl p-2.5 overflow-y-auto max-h-[60vh] space-y-1.5 bg-slate-50/50">
              <p className="text-[11px] font-bold text-slate-700 px-1 mb-1">
                Daftar Berkas ({documents.length}):
              </p>
              {documents.map((doc) => {
                const isSelected = activeDoc?.id === doc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setActiveDoc(doc)}
                    className={`w-full text-left p-2 rounded-lg border text-xs transition-all flex items-start gap-2 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="mt-0.5">{getFileIcon(doc.namaFile, doc.tipe)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs">{doc.namaFile}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                        {doc.jenis && (
                          <span className="rounded bg-slate-100 px-1 py-0.2 font-medium">
                            {doc.jenis}
                          </span>
                        )}
                        {doc.ukuran && <span>{doc.ukuran}</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Document preview panel */}
            <div className="md:col-span-2 border border-slate-200 rounded-xl p-3 flex flex-col bg-slate-50 overflow-hidden">
              {activeDoc ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-slate-900 truncate">{activeDoc.namaFile}</p>
                      <p className="text-[10px] text-slate-500">
                        {activeDoc.jenis && <span className="font-semibold text-slate-700">{activeDoc.jenis} • </span>}
                        {activeDoc.ukuran} • Diunggah: {activeDoc.uploadedAt}
                      </p>
                    </div>
                    {activeDoc.dataUrl && (
                      <button
                        type="button"
                        onClick={() => handleDownload(activeDoc)}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-emerald-700"
                      >
                        <Download className="h-3.5 w-3.5" /> Unduh
                      </button>
                    )}
                  </div>

                  <div className="flex-1 flex items-center justify-center overflow-auto rounded-lg bg-white border border-slate-200 p-2 min-h-[300px]">
                    {activeDoc.dataUrl?.startsWith('data:image/') ? (
                      <img
                        src={activeDoc.dataUrl}
                        alt={activeDoc.namaFile}
                        className="max-h-[50vh] max-w-full object-contain rounded"
                      />
                    ) : activeDoc.dataUrl?.startsWith('data:application/pdf') ? (
                      <iframe
                        src={activeDoc.dataUrl}
                        title={activeDoc.namaFile}
                        className="w-full h-[50vh] rounded border-0"
                      />
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <FileText className="h-10 w-10 text-slate-400 mx-auto" />
                        <p className="text-xs font-semibold text-slate-800">{activeDoc.namaFile}</p>
                        <p className="text-[11px] text-slate-500">
                          Pratinjau langsung tidak tersedia untuk format ini. Silakan unduh dokumen untuk membuka file.
                        </p>
                        {activeDoc.dataUrl && (
                          <button
                            type="button"
                            onClick={() => handleDownload(activeDoc)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                          >
                            <Download className="h-3.5 w-3.5" /> Unduh Dokumen
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="m-auto text-center text-slate-400">
                  <Eye className="h-8 w-8 mx-auto mb-1 text-slate-300" />
                  <p className="text-xs">Pilih dokumen di sebelah kiri untuk melihat rincian.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
