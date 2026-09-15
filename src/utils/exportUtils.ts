import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee, CutiBKNRecord, PerbendaharaanRecord, PerjalananDinasRecord, LemburRecord, KGBRecord, UangMakanRecord } from '../types';

// Format Currency IDR
export const formatRupiah = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// EXPORT TO EXCEL GENUINE .XLSX
export const exportToExcel = (data: Record<string, any>[], sheetName: string, fileName: string) => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Auto-width columns
    const maxCols = Object.keys(data[0] || {}).length;
    const colWidths = [];
    for (let i = 0; i < maxCols; i++) {
      colWidths.push({ wch: 22 });
    }
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (err) {
    console.error('Gagal mengekspor data ke Excel:', err);
  }
};

// EXPORT EMPLOYEE LIST PDF (Audit Ready)
export const exportEmployeeListPDF = (employees: Employee[], title = 'DAFTAR REKAPITULASI PEGAWAI') => {
  const doc = new jsPDF('landscape');
  
  // Header / Kop Instansi
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PEMERINTAH REPUBLIK INDONESIA', 148, 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text('BIRO SUMBER DAYA MANUSIA DAN PENGELOLAAN KEUANGAN', 148, 22, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistem Informasi Manajemen Kepegawaian & Keuangan Terintegrasi', 148, 28, { align: 'center' });
  
  // Line separator
  doc.setLineWidth(0.8);
  doc.line(14, 32, 282, 32);
  doc.setLineWidth(0.2);
  doc.line(14, 33.5, 282, 33.5);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 148, 42, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dicetak Pada: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | Status: AUDIT VERIFIED`, 14, 49);

  const tableBody = employees.map((emp, idx) => [
    idx + 1,
    emp.nip,
    `${emp.gelarDepan ? emp.gelarDepan + ' ' : ''}${emp.nama}${emp.gelarBelakang ? ', ' + emp.gelarBelakang : ''}`,
    emp.pangkatGolongan,
    emp.jabatan,
    emp.unitKerja,
    emp.statusPegawai,
    formatRupiah(emp.gajiPokok)
  ]);

  autoTable(doc, {
    startY: 53,
    head: [['No', 'NIP', 'Nama Lengkap', 'Pangkat/Gol', 'Jabatan', 'Unit Kerja', 'Status', 'Gaji Pokok']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, halign: 'center', fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 42 },
      2: { cellWidth: 50 },
      3: { cellWidth: 32 },
      4: { cellWidth: 50 },
      5: { cellWidth: 45 },
      6: { halign: 'center', cellWidth: 18 },
      7: { halign: 'right', cellWidth: 28 }
    }
  });

  // Footer & Tanda Tangan
  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  if (finalY < 165) {
    const signY = finalY + 15;
    doc.setFontSize(9);
    doc.text('Mengetahui / Menyetujui,', 220, signY);
    doc.text('Kepala Bagian Kepegawaian & TU', 220, signY + 5);
    doc.text('Drs. H. Bambang Suhartono, M.Si.', 220, signY + 25);
    doc.text('NIP. 19750814 200003 1 002', 220, signY + 30);
  }

  doc.save(`Rekap_Pegawai_Audit_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// EXPORT OFFICIAL BKN LEAVE FORM (PERATURAN BKN NOMOR 24 TAHUN 2017)
export const exportCutiBknPDF = (cuti: CutiBKNRecord) => {
  const doc = new jsPDF('portrait');

  // Header Formal BKN No. 24 Tahun 2017
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('ANAK LAMPIRAN 1.b', 196, 12, { align: 'right' });
  doc.text('PERATURAN BADAN KEPEGAWAIAN NEGARA REPUBLIK INDONESIA', 196, 16, { align: 'right' });
  doc.text('NOMOR 24 TAHUN 2017', 196, 20, { align: 'right' });
  doc.text('TENTANG TATA CARA PEMBERIAN CUTI PEGAWAI NEGERI SIPIL', 196, 24, { align: 'right' });

  doc.setFontSize(9);
  doc.text(`Jakarta, ${cuti.tanggalPengajuan}`, 196, 32, { align: 'right' });
  doc.text('Kepada Yth.', 140, 37);
  doc.text('Pejabat Pembina Kepegawaian / Pejabat yang Berwenang', 140, 42);
  doc.text('di Tempat', 140, 47);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FORMULIR PERMOHONAN DAN PEMBERIAN CUTI', 105, 55, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor Registrasi: ${cuti.noPermohonan}`, 105, 60, { align: 'center' });

  // I. DATA PEGAWAI
  autoTable(doc, {
    startY: 64,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 1.5, lineColor: [180, 180, 180], lineWidth: 0.2 },
    head: [[{ content: 'I. DATA PEGAWAI', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [240, 243, 248] } }]],
    body: [
      ['Nama', cuti.employeeName, 'NIP', cuti.nip],
      ['Jabatan', cuti.jabatan, 'Masa Kerja', cuti.masaKerja],
      ['Unit Kerja', { content: cuti.unitKerja, colSpan: 3 }]
    ]
  });

  // II. JENIS CUTI YANG DIAMBIL
  const jenisList = [
    ['1. Cuti Tahunan', cuti.jenisCuti === 'Cuti Tahunan' ? '[ V ]' : '[   ]', '2. Cuti Besar', cuti.jenisCuti === 'Cuti Besar' ? '[ V ]' : '[   ]'],
    ['3. Cuti Sakit', cuti.jenisCuti === 'Cuti Sakit' ? '[ V ]' : '[   ]', '4. Cuti Melahirkan', cuti.jenisCuti === 'Cuti Melahirkan' ? '[ V ]' : '[   ]'],
    ['5. Cuti Karena Alasan Penting', cuti.jenisCuti === 'Cuti Karena Alasan Penting' ? '[ V ]' : '[   ]', '6. Cuti Bersama', cuti.jenisCuti === 'Cuti Bersama' ? '[ V ]' : '[   ]'],
    ['7. Cuti di Luar Tanggungan Negara', cuti.jenisCuti === 'Cuti di Luar Tanggungan Negara' ? '[ V ]' : '[   ]', '', '']
  ];

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 3,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 1.5, lineColor: [180, 180, 180], lineWidth: 0.2 },
    head: [[{ content: 'II. JENIS CUTI YANG DIAMBIL', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [240, 243, 248] } }]],
    body: jenisList
  });

  // III. ALASAN CUTI
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 3,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2, lineColor: [180, 180, 180], lineWidth: 0.2 },
    head: [[{ content: 'III. ALASAN CUTI', colSpan: 1, styles: { fontStyle: 'bold', fillColor: [240, 243, 248] } }]],
    body: [[cuti.alasanCuti]]
  });

  // IV. LAMANYA CUTI
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 3,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 1.5, lineColor: [180, 180, 180], lineWidth: 0.2 },
    head: [[{ content: 'IV. LAMANYA CUTI', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [240, 243, 248] } }]],
    body: [
      ['Selama', `${cuti.lamaHari} (Hari Kerja)`, 'Mulai Tanggal', `${cuti.tanggalMulai} s.d. ${cuti.tanggalSelesai}`]
    ]
  });

  // V. CATATAN CUTI
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 3,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1.5, lineColor: [180, 180, 180], lineWidth: 0.2 },
    head: [
      [{ content: 'V. CATATAN CUTI', colSpan: 5, styles: { fontStyle: 'bold', fillColor: [240, 243, 248] } }],
      ['1. CUTI TAHUNAN', 'SISA', 'KETERANGAN', 'JENIS CUTI LAINNYA', 'PARAF / KET']
    ],
    body: [
      [`Tahun ${cuti.catatanCuti.n2Tahun} (N-2)`, `${cuti.catatanCuti.n2Sisa} Hari`, cuti.catatanCuti.n2Keterangan || '-', 'Cuti Besar', '-'],
      [`Tahun ${cuti.catatanCuti.n1Tahun} (N-1)`, `${cuti.catatanCuti.n1Sisa} Hari`, cuti.catatanCuti.n1Keterangan || '-', 'Cuti Sakit', '-'],
      [`Tahun ${cuti.catatanCuti.nTahun} (N)`, `${cuti.catatanCuti.nSisa} Hari`, cuti.catatanCuti.nKeterangan || 'Hak Cuti Berjalan', 'Cuti Alasan Penting', '-']
    ]
  });

  // VI. ALAMAT SELAMA MENJALANKAN CUTI
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 3,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 1.5, lineColor: [180, 180, 180], lineWidth: 0.2 },
    head: [[{ content: 'VI. ALAMAT SELAMA MENJALANKAN CUTI', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [240, 243, 248] } }]],
    body: [
      ['Alamat', cuti.alamatSelamaCuti, 'Telepon', cuti.nomorTelepon]
    ]
  });

  // VII. PERTIMBANGAN ATASAN LANGSUNG & VIII. KEPUTUSAN PEJABAT BERWENANG
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 3,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1.5, lineColor: [180, 180, 180], lineWidth: 0.2 },
    head: [
      [
        { content: 'VII. PERTIMBANGAN ATASAN LANGSUNG', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 243, 248] } },
        { content: 'VIII. KEPUTUSAN PEJABAT YANG BERWENANG', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 243, 248] } }
      ]
    ],
    body: [
      [
        `Status: ${cuti.pertimbanganAtasan.status}\nCatatan: ${cuti.pertimbanganAtasan.catatan || '-'}\n\nTanggal: ${cuti.pertimbanganAtasan.tanggalPertimbangan}\n\n\n\n${cuti.pertimbanganAtasan.namaAtasan}\nNIP. ${cuti.pertimbanganAtasan.nipAtasan}`,
        '',
        `Status: ${cuti.keputusanPejabat.status}\nCatatan: ${cuti.keputusanPejabat.catatan || '-'}\n\nTanggal: ${cuti.keputusanPejabat.tanggalKeputusan}\n\n\n\n${cuti.keputusanPejabat.namaPejabat}\nNIP. ${cuti.keputusanPejabat.nipPejabat}`,
        ''
      ]
    ]
  });

  doc.save(`Formulir_Cuti_BKN_${cuti.nip}_${cuti.tanggalPengajuan}.pdf`);
};

// EXPORT PERBENDAHARAAN (SPP / SPM / SP2D) PDF
export const exportPerbendaharaanPDF = (records: PerbendaharaanRecord[]) => {
  const doc = new jsPDF('landscape');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('KEMENTERIAN / LEMBAGA PEMERINTAH', 148, 14, { align: 'center' });
  doc.setFontSize(11);
  doc.text('REKAPITULASI REALISASI SPP, SPM, DAN SP2D PERBENDAHARAAN KEUANGAN', 148, 20, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')} | Status: VERIFIKASI SAKTI SP2D`, 148, 26, { align: 'center' });

  doc.setLineWidth(0.6);
  doc.line(14, 29, 282, 29);

  const tableBody = records.map((rec, idx) => [
    idx + 1,
    rec.nomorDokumen,
    `${rec.jenis} (${rec.tipePembayaran})`,
    rec.tanggalDokumen,
    rec.uraian.substring(0, 50) + (rec.uraian.length > 50 ? '...' : ''),
    rec.namaPenerima,
    rec.bankPenerima,
    formatRupiah(rec.nilaiRupiah),
    rec.nomorSP2DRef || '-',
    rec.status
  ]);

  const totalNilai = records.reduce((acc, curr) => acc + curr.nilaiRupiah, 0);

  autoTable(doc, {
    startY: 33,
    head: [['No', 'No. Dokumen', 'Jenis', 'Tanggal', 'Uraian Keperluan', 'Penerima', 'Bank', 'Nilai (Rp)', 'No. SP2D', 'Status']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [15, 118, 110], textColor: 255, halign: 'center', fontStyle: 'bold' },
    foot: [['', 'TOTAL REALISASI DOKUMEN', '', '', '', '', '', formatRupiah(totalNilai), '', '']],
    footStyles: { fillColor: [240, 253, 250], textColor: [15, 118, 110], fontStyle: 'bold', halign: 'right' }
  });

  doc.save(`Rekap_SPP_SPM_SP2D_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// EXPORT PERJALANAN DINAS (SPPD) PDF
export const exportSppdPDF = (record: PerjalananDinasRecord) => {
  const doc = new jsPDF('portrait');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SURAT PERINTAH PERJALANAN DINAS (SPPD)', 105, 18, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor: ${record.nomorSPD}`, 105, 24, { align: 'center' });

  autoTable(doc, {
    startY: 30,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2 },
    body: [
      ['1. Pejabat Pembuat Komitmen', 'Pejabat Pembuat Komitmen Satker SDM'],
      ['2. Nama Pegawai yang diperintah', record.namaPegawai],
      ['3. NIP Pegawai', record.nip],
      ['4. Pangkat dan Jabatan', record.jabatan],
      ['5. Tingkat Biaya Perjalanan Dinas', 'Tingkat B'],
      ['6. Maksud Perjalanan Dinas', record.maksudDinas],
      ['7. Alat Angkutan yang dipergunakan', 'Pesawat Udara / Transportasi Darat'],
      ['8. a. Tempat Berangkat\n    b. Tempat Tujuan', `a. ${record.kotaAsal}\nb. ${record.tujuanDinas}`],
      ['9. a. Lamanya Perjalanan Dinas\n    b. Tanggal Berangkat\n    c. Tanggal Harus Kembali', `a. ${record.lamaHari} Hari\nb. ${record.tanggalBerangkat}\nc. ${record.tanggalKembali}`],
      ['10. Pembebanan Anggaran\n    a. Instansi\n    b. Mata Anggaran (MAK)', `a. Biro SDM & Keuangan\nb. ${record.mataAnggaran}`],
      ['11. Total Rincian Biaya Riil', formatRupiah(record.rincianBiaya.totalBiaya)]
    ]
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  doc.setFontSize(8.5);
  doc.text('Dikeluarkan di : Jakarta', 130, finalY + 15);
  doc.text(`Pada tanggal : ${record.tanggalBerangkat}`, 130, finalY + 20);
  doc.text('Pejabat Pembuat Komitmen (PPK),', 130, finalY + 25);
  doc.text('Siti Nurhaliza, S.E., M.Ak.', 130, finalY + 45);
  doc.text('NIP. 19890918 201402 2 003', 130, finalY + 50);

  doc.save(`SPPD_${record.nomorSuratTugas.replace(/\//g, '_')}.pdf`);
};

export const exportCutiBKNPDF = exportCutiBknPDF;
export const exportSPPDPDF = exportSppdPDF;

// EXPORT REKAPITULASI CUTI PDF (BKN STANDARDS)
export const exportRekapCutiPDF = (items: Array<{ no: string; nip: string; nama: string; cutiN: number; cutiN1: number; cutiN2: number; hakCuti: number; terpakai: number; sisaCuti: number }>, title = 'REKAPITULASI HAK DAN PENGAMBILAN CUTI ASN') => {
  const doc = new jsPDF('landscape');

  // Header Formal
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('PEMERINTAH REPUBLIK INDONESIA', 148, 14, { align: 'center' });
  doc.setFontSize(11);
  doc.text('BIRO SUMBER DAYA MANUSIA DAN PENGELOLAAN KEPEGAWAIAN', 148, 20, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Rekapitulasi Pelaksanaan Cuti Tahunan Berdasarkan Peraturan BKN Nomor 24 Tahun 2017', 148, 25, { align: 'center' });
  doc.text('Sumber Database Terhubung: Google Spreadsheet (ID: 1eWHGGmXPQcWk_ORe1XsDJipGly5Zx0sYf1yODMDOeQE)', 148, 29, { align: 'center' });

  // Divider lines
  doc.setLineWidth(0.8);
  doc.line(14, 32, 282, 32);
  doc.setLineWidth(0.2);
  doc.line(14, 33.5, 282, 33.5);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 148, 41, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tahun Anggaran: 2026 | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | Total: ${items.length} Pegawai`, 14, 46);

  const tableBody = items.map((item) => [
    item.no,
    item.nip,
    item.nama,
    item.cutiN,
    item.cutiN1,
    item.cutiN2,
    item.hakCuti,
    item.terpakai,
    item.sisaCuti,
    item.sisaCuti > 10 ? 'Aman' : item.sisaCuti > 0 ? 'Tersedia' : 'Habis'
  ]);

  autoTable(doc, {
    startY: 50,
    head: [
      [
        { content: 'No', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'NIP Pegawai', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Nama Lengkap Pegawai', rowSpan: 2, styles: { valign: 'middle' } },
        { content: 'Catatan Hak Cuti', colSpan: 3, styles: { halign: 'center' } },
        { content: 'Total Hak', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Cuti Terpakai', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Sisa Cuti', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Status', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } }
      ],
      [
        { content: 'N (2026)', styles: { halign: 'center' } },
        { content: 'N-1 (2025)', styles: { halign: 'center' } },
        { content: 'N-2 (2024)', styles: { halign: 'center' } }
      ]
    ],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 42, font: 'courier' },
      2: { cellWidth: 70 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 16 },
      6: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
      7: { halign: 'center', cellWidth: 20 },
      8: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
      9: { halign: 'center', cellWidth: 20 }
    }
  });

  let finalY = (doc as any).lastAutoTable?.finalY || 160;
  const pageHeight = doc.internal.pageSize.getHeight();
  if (finalY + 35 > pageHeight - 15) {
    doc.addPage();
    finalY = 25;
  }
  const signY = finalY + 8;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 220, signY);
  doc.text('Kepala Subbagian Umum', 220, signY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('Mila Yasni Morintoh', 220, signY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 197501222006042023', 220, signY + 24);

  doc.save(`Rekapitulasi_Cuti_ASN_2026_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// EXPORT REKAPITULASI & PENGINGAT KGB 2 TAHUN KEDEPAN PDF
export const exportKGBRemindersPDF = (
  data: Array<{
    no: number | string;
    nama: string;
    nip: string;
    pangkat: string;
    jabatan: string;
    masaKerjaSaatIni: string;
    tmtKGBSaatIni: string;
    tmtKGBBerikutnya: string;
    masaKerjaBerikutnya: string;
    gajiLama: number;
    gajiBaru: number;
    selisih: number;
    statusPengingat: string;
  }>
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Header Instansi
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('BALAI KARANTINA HEWAN, IKAN, DAN TUMBUHAN', 148, 14, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('JADWAL PENGINGAT & PENGHITUNG OTOMATIS KENAIKAN GAJI BERKALA (KGB) DUA TAHUN KEDEPAN', 148, 20, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Sinkronisasi Database Google Spreadsheet (ID: 1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M) | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 148, 25, { align: 'center' });
  doc.line(14, 28, 283, 28);

  const tableBody = data.map((item, idx) => [
    item.no || idx + 1,
    item.nip,
    item.nama,
    item.pangkat,
    item.tmtKGBSaatIni || '-',
    item.tmtKGBBerikutnya || '-',
    item.masaKerjaBerikutnya || '-',
    formatRupiah(item.gajiLama),
    formatRupiah(item.gajiBaru),
    `+${formatRupiah(item.selisih)}`,
    item.statusPengingat
  ]);

  autoTable(doc, {
    startY: 32,
    head: [
      [
        { content: 'No', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'NIP', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Nama Pegawai', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Pangkat/Gol', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Periode KGB', colSpan: 2, styles: { halign: 'center' } },
        { content: 'Masa Kerja (+2 Th)', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Estimasi Gaji Pokok (PP 5/2024)', colSpan: 3, styles: { halign: 'center' } },
        { content: 'Status Pengingat', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } }
      ],
      [
        { content: 'TMT Saat Ini', styles: { halign: 'center' } },
        { content: 'TMT +2 Th Kedepan', styles: { halign: 'center' } },
        { content: 'Gaji Lama', styles: { halign: 'center' } },
        { content: 'Gaji Baru', styles: { halign: 'center' } },
        { content: 'Kenaikan/Bln', styles: { halign: 'center' } }
      ]
    ],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.6 },
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 38, font: 'courier' },
      2: { cellWidth: 50 },
      3: { cellWidth: 26 },
      4: { halign: 'center', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
      6: { halign: 'center', cellWidth: 26 },
      7: { halign: 'right', cellWidth: 23 },
      8: { halign: 'right', cellWidth: 23, fontStyle: 'bold' },
      9: { halign: 'right', cellWidth: 20 },
      10: { cellWidth: 30 }
    }
  });

  let finalY = (doc as any).lastAutoTable?.finalY || 160;
  const pageHeight = doc.internal.pageSize.getHeight();
  if (finalY + 35 > pageHeight - 15) {
    doc.addPage();
    finalY = 25;
  }
  const signY = finalY + 8;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 220, signY);
  doc.text('Kepala Subbagian Umum', 220, signY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('Mila Yasni Morintoh', 220, signY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 197501222006042023', 220, signY + 24);

  doc.save(`Jadwal_Pengingat_KGB_2Tahun_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// EXPORT REKAP DAFTAR PEGAWAI & DOKUMEN SPREADSHEET PDF
export const exportPegawaiSpreadsheetPDF = (
  items: Array<{
    no: number | string;
    nama: string;
    nip: string;
    jabatan: string;
    satuanPelayanan: string;
    pangkat: string;
    masaKerja: string;
    tmtPangkat: string;
    tmtKGB: string;
    angkaKredit?: string;
    linkDrive: string;
    kelengkapanBerkas: string;
  }>
) => {
  const doc = new jsPDF('landscape');

  // Kop Instansi
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('BALAI KARANTINA HEWAN, IKAN, DAN TUMBUHAN', 148, 14, { align: 'center' });
  doc.setFontSize(11);
  doc.text('BADAN KARANTINA INDONESIA', 148, 20, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Database Terintegrasi Google Spreadsheet ID: 1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M', 148, 26, { align: 'center' });

  doc.setLineWidth(0.7);
  doc.line(14, 29, 282, 29);
  doc.setLineWidth(0.2);
  doc.line(14, 30.5, 282, 30.5);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DAFTAR PEGAWAI ASN & REKAPITULASI BERKAS DOKUMEN DIGITAL (SK KJF, PAK, KGB)', 148, 38, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Waktu Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Total Pegawai Terdata: ${items.length} ASN`, 14, 44);

  const tableBody = items.map((item, idx) => [
    String(item.no || idx + 1),
    item.nip,
    item.nama,
    item.jabatan,
    item.satuanPelayanan || 'UPT INDUK',
    item.pangkat,
    item.masaKerja || '-',
    item.tmtPangkat || '-',
    item.tmtKGB || '-',
    item.angkaKredit || '-',
    item.kelengkapanBerkas || 'LENGKAP'
  ]);

  autoTable(doc, {
    startY: 48,
    head: [
      ['No', 'NIP', 'Nama Pegawai', 'Jabatan', 'Satker / Wilker', 'Pangkat/Gol', 'Masa Kerja', 'TMT Pangkat', 'TMT KGB', 'PAK', 'Status Berkas']
    ],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [14, 116, 144], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 38, font: 'courier' },
      2: { cellWidth: 42, fontStyle: 'bold' },
      3: { cellWidth: 42 },
      4: { cellWidth: 30 },
      5: { cellWidth: 26 },
      6: { cellWidth: 20 },
      7: { halign: 'center', cellWidth: 18 },
      8: { halign: 'center', cellWidth: 18 },
      9: { halign: 'center', cellWidth: 12 },
      10: { halign: 'center', cellWidth: 14 }
    }
  });

  let finalY = (doc as any).lastAutoTable?.finalY || 160;
  const pageHeight = doc.internal.pageSize.getHeight();
  if (finalY + 35 > pageHeight - 15) {
    doc.addPage();
    finalY = 25;
  }
  const signY = finalY + 8;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 220, signY);
  doc.text('Kepala Subbagian Umum', 220, signY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('Mila Yasni Morintoh', 220, signY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 197501222006042023', 220, signY + 24);

  doc.save(`Daftar_Pegawai_Dokumen_Spreadsheet_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// EXPORT REKAPITULASI ABSENSI SPREADSHEET PDF (Balai Karantina Hewan, Ikan, dan Tumbuhan)
export const exportAbsensiSpreadsheetPDF = (items: any[], periode = 'Maret 2026', spreadsheetId = '16q5aZkFJzZ5RNpGOxLTR28AntgGIsc9ecQ9XYRlCDJY') => {
  const doc = new jsPDF('landscape');

  // Kop Instansi
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('BADAN KARANTINA INDONESIA', 148, 14, { align: 'center' });
  doc.setFontSize(11);
  doc.text('BALAI KARANTINA HEWAN, IKAN, DAN TUMBUHAN PAPUA', 148, 20, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Koneksi Live Google Spreadsheet (ID: ${spreadsheetId})`, 148, 25, { align: 'center' });

  // Garis Pembatas Kop
  doc.setLineWidth(0.8);
  doc.line(14, 28, 282, 28);
  doc.setLineWidth(0.2);
  doc.line(14, 29.5, 282, 29.5);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`REKAPITULASI PRESENSI & TINGKAT KEHADIRAN PEGAWAI ASN - PERIODE ${periode.toUpperCase()}`, 148, 36, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Total Pegawai Terdata: ${items.length} ASN`, 14, 42);

  const tableBody = items.map((item, idx) => [
    String(item.no || idx + 1),
    item.nip,
    item.nama,
    item.satuanPelayanan || 'UPT INDUK',
    String(item.hariKerjaEfektif || 21),
    String(item.hadir),
    String(item.sakit),
    String(item.izin),
    String(item.cuti),
    String(item.dinasLuar),
    String(item.tanpaKeterangan),
    `${item.persentaseKehadiran}%`,
    item.statusKepatuhan || 'Baik'
  ]);

  autoTable(doc, {
    startY: 46,
    head: [
      ['No', 'NIP', 'Nama Pegawai', 'Satuan Pelayanan', 'HK', 'H', 'S', 'I', 'C', 'DL', 'TK', 'Kehadiran %', 'Status']
    ],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 36, font: 'courier' },
      2: { cellWidth: 46, fontStyle: 'bold' },
      3: { cellWidth: 38 },
      4: { halign: 'center', cellWidth: 10 },
      5: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
      6: { halign: 'center', cellWidth: 10 },
      7: { halign: 'center', cellWidth: 10 },
      8: { halign: 'center', cellWidth: 10 },
      9: { halign: 'center', cellWidth: 10 },
      10: { halign: 'center', cellWidth: 10, textColor: [225, 29, 72] },
      11: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
      12: { halign: 'center', cellWidth: 22 }
    }
  });

  let finalY = (doc as any).lastAutoTable?.finalY || 160;
  const pageHeight = doc.internal.pageSize.getHeight();
  if (finalY + 35 > pageHeight - 15) {
    doc.addPage();
    finalY = 25;
  }
  const signY = finalY + 8;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 220, signY);
  doc.text('Kepala Subbagian Umum', 220, signY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('Mila Yasni Morintoh', 220, signY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 197501222006042023', 220, signY + 24);

  doc.save(`Rekap_Absensi_Spreadsheet_${spreadsheetId}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// EXPORT REKAP BULANAN PRESENSI SIMPEG PDF
export const exportSimpegMonthlyAttendancesPDF = (items: any[]) => {
  const doc = new jsPDF('landscape');

  // Kop Instansi
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('BADAN KARANTINA INDONESIA', 148, 14, { align: 'center' });
  doc.setFontSize(11);
  doc.text('BALAI KARANTINA HEWAN, IKAN, DAN TUMBUHAN PAPUA', 148, 20, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Laporan Rekapitulasi Presensi Terarsip SIMPEG Balai Karantina', 148, 25, { align: 'center' });

  // Garis Pembatas Kop
  doc.setLineWidth(0.8);
  doc.line(14, 28, 282, 28);
  doc.setLineWidth(0.2);
  doc.line(14, 29.5, 282, 29.5);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('REKAPITULASI TINGKAT KEHADIRAN PEGAWAI PER BULAN', 148, 36, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Waktu Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Jumlah Arsip Bulan: ${items.length}`, 14, 42);

  const tableBody = items.map((item, idx) => [
    String(idx + 1),
    item.namaBulan,
    String(item.totalHariKerja),
    String(item.totalPegawai),
    String(item.rekapHadir),
    String(item.rekapSakit),
    String(item.rekapIzin),
    String(item.rekapCuti),
    String(item.rekapDinasLuar),
    String(item.rekapTanpaKeterangan),
    `${item.persentaseKehadiran}%`,
    item.catatan || '-'
  ]);

  autoTable(doc, {
    startY: 46,
    head: [
      ['No', 'Periode Bulan', 'Hari Kerja', 'Pegawai', 'Hadir', 'Sakit', 'Izin', 'Cuti', 'DL', 'Alpa/TK', 'Kehadiran %', 'Catatan Dokumen']
    ],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 36, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'center', cellWidth: 14 },
      8: { halign: 'center', cellWidth: 16 },
      9: { halign: 'center', cellWidth: 16, textColor: [225, 29, 72] },
      10: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
      11: { cellWidth: 60 }
    }
  });

  let finalY = (doc as any).lastAutoTable?.finalY || 160;
  const pageHeight = doc.internal.pageSize.getHeight();
  if (finalY + 35 > pageHeight - 15) {
    doc.addPage();
    finalY = 25;
  }
  const signY = finalY + 8;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 220, signY);
  doc.text('Kepala Subbagian Umum', 220, signY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('Mila Yasni Morintoh', 220, signY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 197501222006042023', 220, signY + 24);

  doc.save(`Rekap_Bulanan_Presensi_SIMPEG_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// EXPORT REKAPITULASI PEMBAYARAN UANG MAKAN PER BULAN (PDF)
export const exportUangMakanPDF = (items: UangMakanRecord[], judulTambahan = '') => {
  const doc = new jsPDF('landscape');

  // Kop Dinas Resmi
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('BADAN KARANTINA INDONESIA', 148, 14, { align: 'center' });
  doc.setFontSize(11);
  doc.text('BALAI KARANTINA HEWAN, IKAN, DAN TUMBUHAN PAPUA TENGAH', 148, 20, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('LAPORAN REKAPITULASI PEMBAYARAN UANG MAKAN PEGAWAI APARATUR SIPIL NEGARA (ASN) PER BULAN', 148, 25, { align: 'center' });

  // Garis Pembatas Kop
  doc.setLineWidth(0.8);
  doc.line(14, 28, 282, 28);
  doc.setLineWidth(0.2);
  doc.line(14, 29.5, 282, 29.5);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rekapitulasi Realisasi Bulanan ${judulTambahan ? `(${judulTambahan})` : ''}`, 14, 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Waktu Unduh: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Standar Biaya Masukan (SBM) PMK Kemenkeu RI`, 14, 41);

  const totalPegawai = items.reduce((acc, curr) => acc + (curr.jumlahPegawai || 25), 0);
  const totalHari = items.reduce((acc, curr) => acc + (curr.totalHariHadir || curr.jumlahHariHadir || 0), 0);
  const totalBruto = items.reduce((acc, curr) => acc + (curr.totalBruto || curr.jumlahKotor || 0), 0);
  const totalPph = items.reduce((acc, curr) => acc + (curr.totalPph21 || curr.potonganPph21 || 0), 0);
  const totalNetto = items.reduce((acc, curr) => acc + (curr.totalNetto || curr.jumlahBersih || 0), 0);

  const tableBody = items.map((item, idx) => [
    String(idx + 1),
    item.bulan,
    `${item.jumlahPegawai || 25} Pegawai`,
    `${item.totalHariHadir || item.jumlahHariHadir || 0} Hari`,
    formatRupiah(item.totalBruto || item.jumlahKotor || 0),
    formatRupiah(item.totalPph21 || item.potonganPph21 || 0),
    formatRupiah(item.totalNetto || item.jumlahBersih || 0),
    item.bankPenyalur || item.bank || 'Bank Mandiri',
    item.status,
    item.nomorSP2DRef || item.nomorSPMRef || '-'
  ]);

  // Baris Total Akumulatif
  tableBody.push([
    '',
    'TOTAL REKAPITULASI',
    `${totalPegawai} Pegawai`,
    `${totalHari} Hari`,
    formatRupiah(totalBruto),
    formatRupiah(totalPph),
    formatRupiah(totalNetto),
    '',
    '',
    ''
  ]);

  autoTable(doc, {
    startY: 44,
    head: [
      ['No', 'Periode Bulan', 'Jumlah Pegawai', 'Total Hari Hadir', 'Total Bruto', 'Potongan PPh 21', 'Jumlah Netto', 'Bank Penyalur', 'Status', 'Nomor SP2D / SPM']
    ],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { cellWidth: 26, halign: 'center' },
      3: { halign: 'center', cellWidth: 24 },
      4: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
      5: { halign: 'right', cellWidth: 26, textColor: [220, 38, 38] },
      6: { halign: 'right', cellWidth: 28, fontStyle: 'bold', textColor: [5, 150, 105] },
      7: { cellWidth: 36 },
      8: { halign: 'center', cellWidth: 28 },
      9: { cellWidth: 32, halign: 'center', font: 'courier' }
    },
    didParseCell: function(data) {
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [254, 243, 199];
      }
    }
  });

  let finalY = (doc as any).lastAutoTable?.finalY || 160;
  const pageHeight = doc.internal.pageSize.getHeight();
  if (finalY + 40 > pageHeight - 15) {
    doc.addPage();
    finalY = 25;
  }

  const signY = finalY + 8;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Setuju Dibayar,', 30, signY);
  doc.text('Pejabat Pembuat Komitmen (PPK)', 30, signY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('Siti Nurhaliza, S.E., M.Ak.', 30, signY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 19880512 201201 2 003', 30, signY + 26);

  doc.text('Lunas Dibayar Kas,', 148, signY);
  doc.text('Bendahara Pengeluaran', 148, signY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('Mila Yasni Morintoh, S.P.', 148, signY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 197501222006042023', 148, signY + 26);

  doc.text('Mengetahui,', 220, signY);
  doc.text('Kuasa Pengguna Anggaran (KPA)', 220, signY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('Dr. Ir. Suprayitno, M.Si.', 220, signY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 19710315 199803 1 002', 220, signY + 26);

  doc.save(`Rekapitulasi_Bulanan_Uang_Makan_${new Date().toISOString().slice(0, 10)}.pdf`);
};





