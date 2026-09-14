/**
 * Database Kenaikan Gaji Berkala (KGB) Pegawai ASN
 * Terhubung ke Google Spreadsheet ID: 1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M
 */

export interface KGBSpreadsheetItem {
  no: number | string;
  nama: string;
  nip: string;
  jabatan: string;
  satuanPelayanan: string;
  tanggalLahir: string;
  masaKerja: string;
  pangkat: string;
  pangkatDetail?: string;
  tmtPangkat: string;
  kelasJabatan?: string | number;
  nominal?: string;
  tmtKGB: string;
  angkaKredit?: string | number;
  linkDrive: string;
}

export interface CalculatedKGBInfo {
  item: KGBSpreadsheetItem;
  effectiveCurrentKGBDate: string; // Tanggal TMT KGB saat ini / terdaftar
  effectiveNextKGBDate: string;    // Tanggal TMT KGB selanjutnya (+2 Tahun kedepan)
  nextMasaKerja: string;           // Masa kerja pada KGB 2 tahun kedepan
  gajiPokokLama: number;           // Estimasi gaji pokok sebelum kenaikan
  gajiPokokBaru: number;           // Estimasi gaji pokok baru setelah kenaikan berkala
  selisihKenaikan: number;         // Nominal pertambahan gaji per bulan
  daysRemaining: number;           // Sisa hari menuju KGB
  monthsRemaining: number;         // Sisa bulan menuju KGB
  urgencyLevel: 'CRITICAL' | 'UPCOMING' | 'SCHEDULED' | 'FUTURE';
  statusBadge: string;
}

export const KGB_SPREADSHEET_ID = '1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M';
export const KGB_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${KGB_SPREADSHEET_ID}/edit`;

// Tabel Skala Gaji Pokok PNS (PP No. 5 Tahun 2024)
export const TABEL_GAJI_PP5_2024: Record<string, { min: number; max: number; base: number; stepPer2Years: number }> = {
  'I/a': { min: 1685700, max: 2522600, base: 1685700, stepPer2Years: 55000 },
  'I/b': { min: 1840800, max: 2670700, base: 1840800, stepPer2Years: 58000 },
  'I/c': { min: 1918700, max: 2783700, base: 1918700, stepPer2Years: 61000 },
  'I/d': { min: 1999900, max: 2901400, base: 1999900, stepPer2Years: 64000 },
  'II/a': { min: 2184000, max: 3643400, base: 2184000, stepPer2Years: 92000 },
  'II/b': { min: 2385000, max: 3797500, base: 2385000, stepPer2Years: 95000 },
  'II/c': { min: 2485900, max: 3958200, base: 2485900, stepPer2Years: 98000 },
  'II/d': { min: 2591100, max: 4125600, base: 2591100, stepPer2Years: 102000 },
  'III/a': { min: 2785700, max: 4575200, base: 2785700, stepPer2Years: 115000 },
  'III/b': { min: 2903600, max: 4768800, base: 2903600, stepPer2Years: 120000 },
  'III/c': { min: 3026400, max: 4970500, base: 3026400, stepPer2Years: 125000 },
  'III/d': { min: 3154400, max: 5180700, base: 3154400, stepPer2Years: 130000 },
  'IV/a': { min: 3287800, max: 5399900, base: 3287800, stepPer2Years: 138000 },
  'IV/b': { min: 3426900, max: 5628300, base: 3426900, stepPer2Years: 145000 },
  'IV/c': { min: 3571900, max: 5866400, base: 3571900, stepPer2Years: 152000 },
  'IV/d': { min: 3723000, max: 6114500, base: 3723000, stepPer2Years: 160000 },
  'IV/e': { min: 3880400, max: 6373200, base: 3880400, stepPer2Years: 168000 },
};

/**
 * Parsing teks tanggal bahasa Indonesia ke Date object
 */
export function parseIndonesianDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const clean = dateStr.trim();

  // Check format Date(YYYY,M,D)
  const gvizMatch = clean.match(/Date\((\d+),(\d+),(\d+)\)/);
  if (gvizMatch) {
    return new Date(parseInt(gvizMatch[1], 10), parseInt(gvizMatch[2], 10), parseInt(gvizMatch[3], 10));
  }

  // Check standard ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return new Date(clean);
  }

  // Check DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashMatch) {
    return new Date(parseInt(slashMatch[3], 10), parseInt(slashMatch[2], 10) - 1, parseInt(slashMatch[1], 10));
  }

  // Check format teks Indonesia: '01 Maret 2027'
  const months: Record<string, number> = {
    januari: 0, jan: 0,
    februari: 1, feb: 1,
    maret: 2, mar: 2,
    april: 3, apr: 3,
    mei: 4, may: 4,
    juni: 5, jun: 5,
    juli: 6, jul: 6,
    agustus: 7, agu: 7, ags: 7,
    september: 8, sep: 8,
    oktober: 9, okt: 9,
    november: 10, nov: 10,
    desember: 11, des: 11,
  };

  const parts = clean.toLowerCase().split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const month = months[parts[1]];
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  const d = new Date(clean);
  return isNaN(d.getTime()) ? null : d;
}

export function formatIndoDate(date: Date): string {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const day = String(date.getDate()).padStart(2, '0');
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Ekstraksi kode golongan (misal: 'IV/b', 'III/d', 'II/c') dari teks pangkat
 */
export function extractGolongan(pangkatStr: string): string {
  if (!pangkatStr) return 'III/a';
  const match = pangkatStr.match(/(IV\/[a-e]|III\/[a-d]|II\/[a-d]|I\/[a-d])/i);
  if (match) return match[1].toUpperCase();
  const dotMatch = pangkatStr.match(/(IV\.[a-e]|III\.[a-d]|II\.[a-d]|I\.[a-d])/i);
  if (dotMatch) return dotMatch[1].replace('.', '/').toUpperCase();
  return 'III/a';
}

/**
 * Ekstraksi jumlah tahun dan bulan dari string masa kerja (misal: '23 Tahun 9 Bulan')
 */
export function parseMasaKerja(masaKerjaStr: string): { years: number; months: number } {
  if (!masaKerjaStr) return { years: 0, months: 0 };
  const yearMatch = masaKerjaStr.match(/(\d+)\s*(?:tahun|th)/i);
  const monthMatch = masaKerjaStr.match(/(\d+)\s*(?:bulan|bln)/i);
  return {
    years: yearMatch ? parseInt(yearMatch[1], 10) : 0,
    months: monthMatch ? parseInt(monthMatch[1], 10) : 0,
  };
}

/**
 * Menghitung gaji pokok berdasarkan golongan dan masa kerja (PP 5/2024)
 */
export function calculateGajiPP5(golongan: string, masaKerjaTahun: number): number {
  const cfg = TABEL_GAJI_PP5_2024[golongan] || TABEL_GAJI_PP5_2024['III/a'];
  const steps = Math.floor(masaKerjaTahun / 2);
  const calculated = cfg.base + steps * cfg.stepPer2Years;
  return Math.min(cfg.max, Math.max(cfg.min, calculated));
}

/**
 * Penghitung Otomatis Kenaikan Gaji Berkala Selanjutnya pada 2 Tahun Kedepan & Sistem Pengingat
 */
export function calculateKGBProgression(
  item: KGBSpreadsheetItem,
  referenceDate: Date = new Date(2026, 8, 13) // September 2026
): CalculatedKGBInfo {
  // 1. Tentukan Tanggal TMT KGB saat ini / aktif
  let currentKGBDate = parseIndonesianDate(item.tmtKGB);
  if (!currentKGBDate) {
    const pangkatDate = parseIndonesianDate(item.tmtPangkat);
    if (pangkatDate) {
      // KGB dihitung 2 tahun sejak TMT pangkat terakhir
      currentKGBDate = new Date(pangkatDate.getFullYear() + 2, pangkatDate.getMonth(), pangkatDate.getDate());
    } else {
      // Fallback default: 01 April 2026
      currentKGBDate = new Date(2026, 3, 1);
    }
  }

  // 2. Hitung Tanggal TMT KGB Selanjutnya pada Dua Tahun Kedepan (+2 Tahun)
  const nextKGBDate = new Date(currentKGBDate.getFullYear() + 2, currentKGBDate.getMonth(), currentKGBDate.getDate());

  // 3. Hitung Masa Kerja 2 Tahun Kedepan
  const mk = parseMasaKerja(item.masaKerja);
  const nextYears = mk.years + 2;
  const nextMasaKerja = `${nextYears} Tahun ${mk.months} Bulan`;

  // 4. Hitung Estimasi Gaji Pokok Lama vs Baru (PP 5/2024)
  const gol = extractGolongan(item.pangkat);
  const gajiPokokLama = calculateGajiPP5(gol, mk.years);
  const gajiPokokBaru = calculateGajiPP5(gol, nextYears);
  const selisihKenaikan = gajiPokokBaru - gajiPokokLama;

  // 5. Hitung Sisa Waktu Menuju KGB & Tingkat Urgensi Pengingat
  const targetDate = currentKGBDate > referenceDate ? currentKGBDate : nextKGBDate;
  const diffTime = targetDate.getTime() - referenceDate.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const monthsRemaining = Math.ceil(daysRemaining / 30.44);

  let urgencyLevel: 'CRITICAL' | 'UPCOMING' | 'SCHEDULED' | 'FUTURE';
  let statusBadge: string;

  if (daysRemaining <= 0) {
    urgencyLevel = 'CRITICAL';
    statusBadge = '⚠️ Lewat Waktu (Segera Terbitkan SK)';
  } else if (daysRemaining <= 90) {
    urgencyLevel = 'CRITICAL';
    statusBadge = `🚨 Segera Proses SK (${daysRemaining} hari lagi)`;
  } else if (daysRemaining <= 365) {
    urgencyLevel = 'UPCOMING';
    statusBadge = `📅 Jatuh Tempo (${monthsRemaining} bln lagi)`;
  } else if (daysRemaining <= 730) {
    urgencyLevel = 'SCHEDULED';
    statusBadge = '⏳ Periode 2 Tahun Kedepan';
  } else {
    urgencyLevel = 'FUTURE';
    statusBadge = '🗓️ Jadwal Terencana';
  }

  return {
    item,
    effectiveCurrentKGBDate: formatIndoDate(currentKGBDate),
    effectiveNextKGBDate: formatIndoDate(nextKGBDate),
    nextMasaKerja,
    gajiPokokLama,
    gajiPokokBaru,
    selisihKenaikan,
    daysRemaining,
    monthsRemaining,
    urgencyLevel,
    statusBadge,
  };
}

/**
 * Fetch live data from Google Sheets ID: 1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M
 */
export async function fetchLiveKGBSpreadsheet(
  spreadsheetId: string = KGB_SPREADSHEET_ID,
  accessToken?: string | null
): Promise<KGBSpreadsheetItem[]> {
  try {
    if (accessToken) {
      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:Z100`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const json = await res.json();
          const rows: string[][] = json.values || [];
          if (rows.length > 2) {
            const records: KGBSpreadsheetItem[] = [];
            for (let i = 0; i < rows.length; i++) {
              const r = rows[i];
              const nama = r[6]?.trim();
              const nip = r[7]?.trim();
              if (nama && nip && !nama.toLowerCase().includes('nama') && !nip.toLowerCase().includes('nip')) {
                records.push({
                  no: r[5]?.trim() || String(records.length + 1),
                  nama,
                  nip,
                  jabatan: r[8]?.trim() || '',
                  satuanPelayanan: r[10]?.trim() || '',
                  tanggalLahir: r[11]?.trim() || '',
                  masaKerja: r[12]?.trim() || '',
                  pangkat: r[13]?.trim() || '',
                  pangkatDetail: r[14]?.trim() || '',
                  tmtPangkat: r[15]?.trim() || '',
                  kelasJabatan: r[17]?.trim() || '',
                  nominal: r[18]?.trim() || '',
                  tmtKGB: r[19]?.trim() || '',
                  angkaKredit: r[20]?.trim() || '',
                  linkDrive: r[21]?.trim() || '',
                });
              }
            }
            if (records.length > 0) return records;
          }
        }
      } catch (err) {
        console.warn('Sheets API KGB fetch failed, trying GViz fallback:', err);
      }
    }

    // GViz fallback
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;
    const gvizRes = await fetch(gvizUrl);
    if (gvizRes.ok) {
      const text = await gvizRes.text();
      const s = text.indexOf('{');
      const e = text.lastIndexOf('}');
      if (s >= 0 && e >= 0) {
        const data = JSON.parse(text.slice(s, e + 1));
        const rows = data?.table?.rows;
        if (Array.isArray(rows) && rows.length > 0) {
          const records: KGBSpreadsheetItem[] = [];
          for (let i = 0; i < rows.length; i++) {
            const c = rows[i].c;
            const nama = c?.[6]?.v;
            const nip = c?.[7]?.v;
            if (nama && nip && String(nama).trim() !== '' && !String(nama).toLowerCase().includes('nama')) {
              records.push({
                no: c?.[5]?.v || records.length + 1,
                nama: String(nama).trim(),
                nip: String(nip).trim(),
                jabatan: String(c?.[8]?.v || '').trim(),
                satuanPelayanan: String(c?.[10]?.v || '').trim(),
                tanggalLahir: c?.[11]?.f || c?.[11]?.v || '',
                masaKerja: String(c?.[12]?.v || '').trim(),
                pangkat: String(c?.[13]?.v || '').trim(),
                pangkatDetail: String(c?.[14]?.v || '').trim(),
                tmtPangkat: c?.[15]?.f || c?.[15]?.v || '',
                kelasJabatan: c?.[17]?.v || '',
                nominal: c?.[18]?.f || c?.[18]?.v || '',
                tmtKGB: c?.[19]?.f || c?.[19]?.v || '',
                angkaKredit: c?.[20]?.v !== undefined ? c?.[20]?.v : '',
                linkDrive: String(c?.[21]?.v || '').trim(),
              });
            }
          }
          if (records.length > 0) return records;
        }
      }
    }
  } catch (err) {
    console.error('Error fetching live KGB spreadsheet:', err);
  }

  return initialKGBSpreadsheetData;
}

export const initialKGBSpreadsheetData: KGBSpreadsheetItem[] = [
  {
    "no": 1,
    "nama": "drh. I Wayan Kertanegara, M.Pt.",
    "nip": "197310212002121001",
    "jabatan": "Kepala Balai Karantina Hewan, Ikan, dan Tumbuhan",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "10/21/1973",
    "masaKerja": "23 Tahun 9 Bulan",
    "pangkat": "Pembina Tk.I, IV/b",
    "pangkatDetail": "Pembina Tingkat I/ IV.b",
    "tmtPangkat": "01 April 2024",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1zPvGXJIfAMqjX5O3ru9RafzaU3rAYlBl?usp=sharing"
  },
  {
    "no": 1,
    "nama": "Mila Yasni Morintoh, S.P.",
    "nip": "197501222006042023",
    "jabatan": "Kepala Subbagian Umum",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "1/22/1975",
    "masaKerja": "20 Tahun 5 Bulan",
    "pangkat": "Penata Tk. I, III/d",
    "pangkatDetail": "Penata Tingkat I/ III.d",
    "tmtPangkat": "01 April 2018",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Maret 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/18GfnPyOdNFphvu4nUrj_kKaWVmTqlpSw?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Supriyanto Priyo Jatmiko, S.P.",
    "nip": "197802252003121001",
    "jabatan": "Analis Perkarantinaan Tumbuhan Ahli Madya",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "2/25/1978",
    "masaKerja": "22 Tahun 9 Bulan",
    "pangkat": "Pembina, IV/a",
    "pangkatDetail": "Pembina/ IV.a",
    "tmtPangkat": "01/10/2024",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Desember 2027",
    "angkaKredit": 59.375,
    "linkDrive": "https://drive.google.com/drive/folders/1ZjTd4c-YJuYoCxL5KTAb3-jGpN0ByDF7?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Indriayani, S.P.",
    "nip": "198408012009122011",
    "jabatan": "Analis Perkarantinaan Tumbuhan Ahli Muda",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "8/1/1984",
    "masaKerja": "16 Tahun 9 Bulan",
    "pangkat": "Penata Tk. I, III/d",
    "pangkatDetail": "Penata Tingkat I/ III.d",
    "tmtPangkat": "01 Juni 2024",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Desember 2027",
    "angkaKredit": 110.189,
    "linkDrive": "https://drive.google.com/drive/folders/1sJP9UVuuDxnxigqCWfD_JE41xW9zkEjR?usp=drive_link"
  },
  {
    "no": 2,
    "nama": "Muji Haryati, S.P.",
    "nip": "197906212011012006",
    "jabatan": "Analis Perkarantinaan Tumbuhan Ahli Muda",
    "satuanPelayanan": "Wilker Bandara Dominie Edward Osok",
    "tanggalLahir": "6/21/1979",
    "masaKerja": "15 Tahun 8 Bulan",
    "pangkat": "Penata, III/c",
    "pangkatDetail": "Penata/ III.c",
    "tmtPangkat": "01 April 2023",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Januari 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/108KLszJ4OnP-uf6OaxCE62uBmAJiLg4F?usp=drive_link"
  },
  {
    "no": 3,
    "nama": "Linda, S.P., M.Sc.",
    "nip": "198109042011012004",
    "jabatan": "Analis Perkarantinaan Tumbuhan Ahli Muda",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "9/4/1981",
    "masaKerja": "15 Tahun 8 Bulan",
    "pangkat": "Penata Tingkat I, III/d",
    "pangkatDetail": "Penata Tingkat I/ III.d",
    "tmtPangkat": "01 April 2023",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Januari 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1_G5qM42E2nSOWTK1b0T39JcRkR-KS5Zf?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Ega Megananda, S.P.",
    "nip": "197604082011011005",
    "jabatan": "Analis Perkarantinaan Tumbuhan Ahli Muda",
    "satuanPelayanan": "PELABUHAN RAKYAT SORONG",
    "tanggalLahir": "4/8/1976",
    "masaKerja": "15 Tahun 8 Bulan",
    "pangkat": "Penata, III/c",
    "pangkatDetail": "Penata/ III.c",
    "tmtPangkat": "01 Oktober 2021",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Januari 2027",
    "angkaKredit": 107.951,
    "linkDrive": "https://drive.google.com/drive/folders/1npKPawNVGNtwZmikON2peRDKI_gh5N9J?usp=drive_link"
  },
  {
    "no": 2,
    "nama": "Siti Mega Hutasoit, S.Si.",
    "nip": "198806282018012001",
    "jabatan": "Analis Perkarantinaan Tumbuhan Ahli Pertama",
    "satuanPelayanan": "Wilker Pelabuhan Laut Sorong",
    "tanggalLahir": "6/28/1988",
    "masaKerja": "8 Tahun 8 Bulan",
    "pangkat": "Penata Muda Tingkat I, III/b",
    "pangkatDetail": "Penata Muda Tingkat I/ III.b",
    "tmtPangkat": "01 April 2023",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Januari 2028",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1_vKGeky_KMHe3Pd-DdPZPbEfZUDrmfd3?usp=drive_link"
  },
  {
    "no": 3,
    "nama": "Zulfadly, S.Si, M.Si.",
    "nip": "199005152014031002",
    "jabatan": "Analis Perkarantinaan Tumbuhan Ahli Muda",
    "satuanPelayanan": "Wilker Bandara Dominie Edward Osok",
    "tanggalLahir": "5/15/1990",
    "masaKerja": "12 Tahun 6 Bulan",
    "pangkat": "Penata Muda Tingkat I, III/b",
    "pangkatDetail": "Penata/ III.c",
    "tmtPangkat": "01 April 2020",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Maret 2028",
    "angkaKredit": 117823,
    "linkDrive": "https://drive.google.com/drive/folders/1tQh_OLjZcd6ACIoGUH4VTZLD04n71ukY?usp=drive_link"
  },
  {
    "no": 4,
    "nama": "Suyadi, S.P.",
    "nip": "199601142025061002",
    "jabatan": "Analis Perkarantinaan Tumbuhan Ahli Pertama",
    "satuanPelayanan": "Wilker Pelabuhan Laut Sorong",
    "tanggalLahir": "1/14/1996",
    "masaKerja": "1 Tahun 3 Bulan",
    "pangkat": "Penata Muda, III/a",
    "pangkatDetail": "Penata Muda/ III.a",
    "tmtPangkat": "02/06/2025",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Juni 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1stzpRYUz38-wnsOdvGrRRqWPnFZGteNO?usp=drive_link"
  },
  {
    "no": 5,
    "nama": "Ma'Ruf Isnaini, S.P.",
    "nip": "199911042025061007",
    "jabatan": "Analis Perkarantinaan Tumbuhan Ahli Pertama",
    "satuanPelayanan": "Wilker Pelabuhan Laut Sorong",
    "tanggalLahir": "11/4/1999",
    "masaKerja": "1 Tahun 3 Bulan",
    "pangkat": "Penata Muda, III/a",
    "pangkatDetail": "Penata Muda/ III.a",
    "tmtPangkat": "02/06/2025",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Juni 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1B_1ycm3JCe5LzLY4kU4H4JxZ11WvzEnV?usp=drive_link"
  },
  {
    "no": 6,
    "nama": "SANTI MERLINA IMBIRI, S.P.",
    "nip": "199006032019022002",
    "jabatan": "Analis Perkarantinaan Tumbuhan Ahli Pertama",
    "satuanPelayanan": "Wilker Pelabuhan Laut Sorong",
    "tanggalLahir": "6/3/1990",
    "masaKerja": "7 Tahun 7 Bulan",
    "pangkat": "Penata Muda Tingkat I, III/b",
    "pangkatDetail": "Penata Muda Tingkat I/ III.b",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Februari 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1lK7cYdkSLhSZ9AjTIcxq_X_Kxh4jDM1n?usp=drive_link"
  },
  {
    "no": 7,
    "nama": "MAGDALENA YOPI INSORAKI SUKAN, S. Si",
    "nip": "199105192018012002",
    "jabatan": "Analis Perkarantinaan Tumbuhan Ahli Pertama",
    "satuanPelayanan": "KANTOR POS SORONG",
    "tanggalLahir": "5/19/1991",
    "masaKerja": "8 Tahun 8 Bulan",
    "pangkat": "Penata Muda Tingkat I, III/b",
    "pangkatDetail": "Penata Muda Tingkat I/ III.b",
    "tmtPangkat": "01 April 2023",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Januari 2028",
    "angkaKredit": 63520,
    "linkDrive": "https://drive.google.com/drive/folders/1-Y09A37pkDAnb0UasMjzYI77U8T7UbVG?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Awangku Habiburrahman, A.Md.",
    "nip": "199505232019021001",
    "jabatan": "Pemeriksa Karantina Tumbuhan Terampil",
    "satuanPelayanan": "Wilker Bandara Dominie Edward Osok",
    "tanggalLahir": "5/23/1995",
    "masaKerja": "7 Tahun 7 Bulan",
    "pangkat": "Pengatur Tk.I, II/d",
    "pangkatDetail": "Pengatur Tingkat I/II.d",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Februari 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1HFi26BNPc--VX82Nd5NzAMRrzOzI8xDx?usp=drive_link"
  },
  {
    "no": 2,
    "nama": "M.B.R. Jefriadi Sitorus, A.Md.",
    "nip": "199703012019021001",
    "jabatan": "Pemeriksa Karantina Tumbuhan Terampil",
    "satuanPelayanan": "TEMPEL RAJA AMPAT",
    "tanggalLahir": "3/1/1997",
    "masaKerja": "7 Tahun 7 Bulan",
    "pangkat": "Pengatur Tk.I, II/d",
    "pangkatDetail": "Pengatur Tingkat I/II.d",
    "tmtPangkat": "01 Juni 2024",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Februari 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1xQnJH3fRF3F8wTNmG57oWIlFPp18bP1R?usp=drive_link"
  },
  {
    "no": 3,
    "nama": "Aswin, A.Md.P.",
    "nip": "199005102019021003",
    "jabatan": "Pemeriksa Karantina Tumbuhan Terampil",
    "satuanPelayanan": "Wilker Pelabuhan Laut Sorong",
    "tanggalLahir": "5/10/1990",
    "masaKerja": "7 Tahun 7 Bulan",
    "pangkat": "Pengatur Tingkat I, II/d",
    "pangkatDetail": "Pengatur Tingkat I/II.d",
    "tmtPangkat": "01 April 2023",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Februari 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1buzR0ixT1my_DjKnP1J_aNSaNqW2PR8b?usp=drive_link"
  },
  {
    "no": 4,
    "nama": "Gregorius Yulius Karakaray",
    "nip": "197601032003121001",
    "jabatan": "Pemeriksa Karantina Tumbuhan Terampil",
    "satuanPelayanan": "PELABUHAN RAKYAT SORONG",
    "tanggalLahir": "1/3/1976",
    "masaKerja": "22 Tahun 9 Bulan",
    "pangkat": "Pengatur Tingkat I, II/d",
    "pangkatDetail": "Pengatur Tingkat I/II.d",
    "tmtPangkat": "01 April 2020",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Desember 2026",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1T7eIRFWPT4WPLEqBQ-n--L1GL4BlsW2a?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Maria Andani Warih",
    "nip": "199001202022032001",
    "jabatan": "Pemeriksa Karantina Tumbuhan Pemula",
    "satuanPelayanan": "Wilker Bandara Dominie Edward Osok",
    "tanggalLahir": "1/20/1990",
    "masaKerja": "4 Tahun 6 Bulan",
    "pangkat": "Pengatur Muda, II/a",
    "pangkatDetail": "Pengatur Muda/ II.a",
    "tmtPangkat": "01 Maret 2022",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Maret 2027",
    "angkaKredit": 14375,
    "linkDrive": "https://drive.google.com/drive/folders/12Q3_pcdn26YEgVlhYszNJ8Yh0Oqx01sM?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "drh. Nilam Madina Siregar",
    "nip": "198604162014032002",
    "jabatan": "Dokter Hewan Karantina Ahli Muda",
    "satuanPelayanan": "Wilker Pelabuhan Laut Sorong",
    "tanggalLahir": "4/16/1986",
    "masaKerja": "12 Tahun 6 Bulan",
    "pangkat": "Penata Tingkat I, III/d",
    "pangkatDetail": "Penata Tingkat I/ III.d",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Maret 2028",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1kkZRZ-wMGDry7IS7ahSA8aEZTid_dytC?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "drh. Kadek Evi Dian Puspita Dewi",
    "nip": "199512222022032001",
    "jabatan": "Dokter Hewan Karantina Ahli Pertama",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "12/22/1995",
    "masaKerja": "4 Tahun 6 Bulan",
    "pangkat": "Penata Muda Tingkat I, III/b",
    "pangkatDetail": "Penata Muda Tingkat I/ III.b",
    "tmtPangkat": "01 Maret 2022",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Maret 2028",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1cg3qH7n7r_L_q9H4K1hXP1vjhPT1fa60?usp=drive_link"
  },
  {
    "no": 2,
    "nama": "drh. Zulfikar Hizbul Islami",
    "nip": "199305102025061002",
    "jabatan": "Dokter Hewan Karantina Ahli Pertama",
    "satuanPelayanan": "TEMPEL RAJA AMPAT",
    "tanggalLahir": "5/10/1993",
    "masaKerja": "1 Tahun 3 Bulan",
    "pangkat": "Penata Muda Tingkat I, III/b",
    "pangkatDetail": "Penata Muda Tingkat I/ III.b",
    "tmtPangkat": "02 Juni 2025",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Juni 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/16wdofUjALhPkwbY_M9q4LAuXBRGpb0yH?usp=drive_link"
  },
  {
    "no": 3,
    "nama": "drh. Janne Lorens",
    "nip": "199401142025062003",
    "jabatan": "Dokter Hewan Karantina Ahli Pertama",
    "satuanPelayanan": "Wilker Pelabuhan Laut Sorong",
    "tanggalLahir": "1/14/1994",
    "masaKerja": "1 Tahun 3 Bulan",
    "pangkat": "Penata Muda Tingkat I, III/b",
    "pangkatDetail": "Penata Muda Tingkat I/ III.b",
    "tmtPangkat": "02 Juni 2025",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Juni 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1TYwP_EOWLOOV04kTeWBMfaFKXzot_d7C?usp=drive_link"
  },
  {
    "no": 4,
    "nama": "drh. Filadelvia Nauw",
    "nip": "199702192025062013",
    "jabatan": "Dokter Hewan Karantina Ahli Pertama",
    "satuanPelayanan": "Wilker Bandara Dominie Edward Osok",
    "tanggalLahir": "2/19/1997",
    "masaKerja": "1 Tahun 3 Bulan",
    "pangkat": "Penata Muda Tingkat I, III/b",
    "pangkatDetail": "Penata Muda Tingkat I/ III.b",
    "tmtPangkat": "02 Juni 2025",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Juni 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1J9a73NvjlvjIW4-xX9rksWvRINmtYBei?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Luther Oktovianus Ulim, A.Md.",
    "nip": "198410312008011004",
    "jabatan": "Paramedik Karantina Hewan Penyelia",
    "satuanPelayanan": "Wilker Pelabuhan Laut Sorong",
    "tanggalLahir": "10/31/1984",
    "masaKerja": "18 Tahun 8 Bulan",
    "pangkat": "Penata, III/c",
    "pangkatDetail": "Penata/ III.c",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Januari 2028",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1AUZo-IVVCFjLesbNY7aSpb51ZmmG2jIU?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Rahmawati, A.Md.",
    "nip": "198605022009122006",
    "jabatan": "Paramedik Karantina Hewan Mahir",
    "satuanPelayanan": "Wilker Pelabuhan Laut Sorong",
    "tanggalLahir": "5/2/1986",
    "masaKerja": "16 Tahun 9 Bulan",
    "pangkat": "Penata Muda Tk. I, III/b",
    "pangkatDetail": "Penata Muda Tingkat I/ III.b",
    "tmtPangkat": "01 Juni 2024",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Desember 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1pS6-F92PXpeXKLf6UebwxHAbxzwPIdDk?usp=drive_link"
  },
  {
    "no": 2,
    "nama": "Aris Sutanto, A.Md.",
    "nip": "198807172011011007",
    "jabatan": "Paramedik Karantina Hewan Mahir",
    "satuanPelayanan": "Wilker Pelabuhan Laut Sorong",
    "tanggalLahir": "7/17/1988",
    "masaKerja": "15 Tahun 8 Bulan",
    "pangkat": "Penata Muda Tingkat I, III/b",
    "pangkatDetail": "Penata Muda Tingkat I/ III.b",
    "tmtPangkat": "01 April 2023",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Januari 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1d7a3qPMJxpug7rOFxEQKax_ne35E68zE?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Pulis Sang Sutrisno, A.Md.",
    "nip": "199207082023211022",
    "jabatan": "Paramedik Karantina Hewan Terampil",
    "satuanPelayanan": "Wilker Pelabuhan Laut Sorong",
    "tanggalLahir": "7/8/1992",
    "masaKerja": "2 Tahun 0 Bulan",
    "pangkat": "VII",
    "pangkatDetail": "",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Agustus 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1W3CfuIXHrb2OJw5HILNHNibPkCw4G3yO?usp=drive_link"
  },
  {
    "no": 2,
    "nama": "Muh. Arief",
    "nip": "198501072011011006",
    "jabatan": "Paramedik Karantina Hewan Terampil",
    "satuanPelayanan": "PELABUHAN RAKYAT SORONG",
    "tanggalLahir": "1/7/1985",
    "masaKerja": "15 Tahun 8 Bulan",
    "pangkat": "Pengatur Tingkat I, II/d",
    "pangkatDetail": "Pengatur Tingkat I/II.d",
    "tmtPangkat": "01 April 2023",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Januari 2028",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1uObSI02IMOs2GzyVU2c8_gvMcacplYX0?usp=drive_link"
  },
  {
    "no": 3,
    "nama": "Muhammad Dahlan Sengadji",
    "nip": "197812032006041014",
    "jabatan": "Paramedik Karantina Hewan Terampil",
    "satuanPelayanan": "Wilker Bandara Dominie Edward Osok",
    "tanggalLahir": "12/3/1978",
    "masaKerja": "20 Tahun 5 Bulan",
    "pangkat": "Pengatur Tingkat I, II/d",
    "pangkatDetail": "Pengatur Tingkat I/II.d",
    "tmtPangkat": "01 April 2020",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Januari 2028",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/file/d/1ImlIwrqAzj1l0EL6WkkETMPDdlJxiDR1/view?usp=drive_link"
  },
  {
    "no": 4,
    "nama": "Winarto",
    "nip": "198012082009121003",
    "jabatan": "Paramedik Karantina Hewan Terampil",
    "satuanPelayanan": "Wilker Bandara Dominie Edward Osok",
    "tanggalLahir": "12/8/1980",
    "masaKerja": "16 Tahun 9 Bulan",
    "pangkat": "Pengatur Tingkat I, II/d",
    "pangkatDetail": "Pengatur Tingkat I/II.d",
    "tmtPangkat": "01 April 2020",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Desember 2026",
    "angkaKredit": 62303,
    "linkDrive": "https://drive.google.com/drive/folders/1-U4tRc72m8zoXKr6KQ-k-qo-NsKb7Wlu?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Harmanto",
    "nip": "198312152023211008",
    "jabatan": "Paramedik Karantina Hewan Pemula",
    "satuanPelayanan": "PELABUHAN RAKYAT SORONG",
    "tanggalLahir": "12/15/1983",
    "masaKerja": "2 Tahun 0 Bulan",
    "pangkat": "V",
    "pangkatDetail": "",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Agustus 2026",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1lS1-HWJYGRIEdvPCtE27QFuwjm62FE3H?usp=drive_link"
  },
  {
    "no": 2,
    "nama": "Dian Mahfuuzhoh",
    "nip": "199704182022032001",
    "jabatan": "Paramedik Karantina Hewan Pemula",
    "satuanPelayanan": "Wilker Bandara Dominie Edward Osok",
    "tanggalLahir": "4/18/1997",
    "masaKerja": "4 Tahun 6 Bulan",
    "pangkat": "Pengatur Muda, II/a",
    "pangkatDetail": "Pengatur Muda/ II.a",
    "tmtPangkat": "01 Maret 2022",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Maret 2027",
    "angkaKredit": 14375,
    "linkDrive": "https://drive.google.com/drive/folders/1ewKwy9W_SiBWkBZ0YKklvao63sjiOvHU?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Juliana M. Raunsay, S.St.Pi.",
    "nip": "197908252005022001",
    "jabatan": "Pengendali Hama Dan Penyakit Ikan Ahli Muda",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "8/25/1979",
    "masaKerja": "21 Tahun 7 Bulan",
    "pangkat": "Penata Tingkat I, III/d",
    "pangkatDetail": "Penata Tingkat I/ III.d",
    "tmtPangkat": "01 April 2017",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Februari 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1IA8ej99hOLh4pnk_l0OeLdY7YIdmfkwF?usp=drive_link"
  },
  {
    "no": 2,
    "nama": "Waliyatun, S.St.Pi.",
    "nip": "197606122005022001",
    "jabatan": "Pengendali Hama Dan Penyakit Ikan Ahli Muda",
    "satuanPelayanan": "Wilker Bandara Dominie Edward Osok",
    "tanggalLahir": "6/12/1976",
    "masaKerja": "21 Tahun 7 Bulan",
    "pangkat": "Penata Tk. I, III/d",
    "pangkatDetail": "Penata Tingkat I/ III.d",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 September 2026",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/18tL-JwN4uI_O3Sa_cJQy3YEgMOW4w_sd?usp=drive_link"
  },
  {
    "no": 3,
    "nama": "Tommy Herdianto, S.St.Pi.",
    "nip": "197607102005021001",
    "jabatan": "Pengendali Hama Dan Penyakit Ikan Ahli Muda",
    "satuanPelayanan": "TUGAS KHUSUS DEPUTI KI",
    "tanggalLahir": "7/10/1976",
    "masaKerja": "21 Tahun 7 Bulan",
    "pangkat": "tekni",
    "pangkatDetail": "",
    "tmtPangkat": "01 Oktober 2016",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1JSPwgcQa3Y7GrOUyIVvQJ1q5T7TTYCKZ?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Tasya Milenia Rahayu Sihabudin, S.Pi.",
    "nip": "200001242025062009",
    "jabatan": "Pengendali Hama Dan Penyakit Ikan Ahli Pertama",
    "satuanPelayanan": "Wilker Pelabuhan Laut Sorong",
    "tanggalLahir": "1/24/2000",
    "masaKerja": "1 Tahun 3 Bulan",
    "pangkat": "Penata Muda, III/a",
    "pangkatDetail": "Penata Muda/ III.a",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Juni 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1Orlm7Jj_JE8FxiPnBzhuQ3q6BhRdOP3F?usp=drive_link"
  },
  {
    "no": 2,
    "nama": "Firdha Annisa Darmawan, S.Pi.",
    "nip": "200110252025062008",
    "jabatan": "Pengendali Hama Dan Penyakit Ikan Ahli Pertama",
    "satuanPelayanan": "BANDARA DEO",
    "tanggalLahir": "10/25/2001",
    "masaKerja": "1 Tahun 3 Bulan",
    "pangkat": "Penata Muda, III/a",
    "pangkatDetail": "Penata Muda/ III.a",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Juni 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1r5NVZALBwcwX31TUdOiE5yY6-YU46p6Z?usp=drive_link"
  },
  {
    "no": 3,
    "nama": "Falensen Mangguari Kafiar, S.Tr.Pi.",
    "nip": "199406062025061005",
    "jabatan": "Pengendali Hama Dan Penyakit Ikan Ahli Pertama",
    "satuanPelayanan": "PELABUHAN RAKYAT SORONG",
    "tanggalLahir": "6/6/1994",
    "masaKerja": "1 Tahun 3 Bulan",
    "pangkat": "Penata Muda, III/a",
    "pangkatDetail": "Penata Muda/ III.a",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Juni 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1U8JyjxOAoJxyutyKGB5t1s16Cknr7qkv?usp=drive_link"
  },
  {
    "no": 4,
    "nama": "Sarce Amelia Mokiri, A.Md., S.Pi.",
    "nip": "198206302008012007",
    "jabatan": "Pengendali Hama Dan Penyakit Ikan Ahli Pertama",
    "satuanPelayanan": "PELABUHAN RAKYAT SORONG",
    "tanggalLahir": "6/30/1982",
    "masaKerja": "18 Tahun 8 Bulan",
    "pangkat": "Penata Muda Tingkat I, III/b",
    "pangkatDetail": "Penata Muda Tingkat I/ III.b",
    "tmtPangkat": "01 April 2019",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 April 2028",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1ifmggeK6-L7yeTnwTLsOStjWxwNpxvGL?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Septiana Indrawati, A.Md.",
    "nip": "198809032010122004",
    "jabatan": "Teknisi Pengendali Hama dan Penyakit Ikan Penyelia",
    "satuanPelayanan": "Wilker Bandara Dominie Edward Osok",
    "tanggalLahir": "9/3/1988",
    "masaKerja": "15 Tahun 9 Bulan",
    "pangkat": "Penata, III/c",
    "pangkatDetail": "Penata/ III.c",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 April 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1P6dg3D1gKbZc5TvZbb5jJzcp2LRYUj8-?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Yustus Wanggai",
    "nip": "197508182003121002",
    "jabatan": "Teknisi Pengendali Hama dan Penyakit Ikan Mahir",
    "satuanPelayanan": "Wilker Pelabuhan Laut Sorong",
    "tanggalLahir": "8/18/1975",
    "masaKerja": "22 Tahun 9 Bulan",
    "pangkat": "Penata Muda, III/a",
    "pangkatDetail": "Penata Muda/ III.a",
    "tmtPangkat": "01 Oktober 2022",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 April 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1Nv4seKy1i9LGzb6kxaUnLu03wwCJS_7g?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Marsukin, S.Si.",
    "nip": "198905052009011001",
    "jabatan": "Teknisi Pengendali Hama dan Penyakit Ikan Terampil",
    "satuanPelayanan": "Wilker Pelabuhan Laut Sorong",
    "tanggalLahir": "5/5/1989",
    "masaKerja": "17 Tahun 8 Bulan",
    "pangkat": "Penata Muda, III/a",
    "pangkatDetail": "Penata Muda/ III.a",
    "tmtPangkat": "01 Desember 2025",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Januari 2026",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1gQeDMFvndw4VkiO3ebvKzcFnKu8keipb?usp=drive_link"
  },
  {
    "no": 2,
    "nama": "Agus Hartana Adiwijaya",
    "nip": "199804102019021001",
    "jabatan": "Teknisi Pengendali Hama dan Penyakit Ikan Terampil",
    "satuanPelayanan": "Wilker Bandara Dominie Edward Osok",
    "tanggalLahir": "4/10/1998",
    "masaKerja": "7 Tahun 7 Bulan",
    "pangkat": "Pengatur Muda Tingkat I, II/b",
    "pangkatDetail": "Pengatur Muda Tingkat I/ II.b",
    "tmtPangkat": "01 Juni 2024",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Maret 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1XZYc7A3tgo2BK5W8bfoT1RaTXSnFqvYV?usp=drive_link"
  },
  {
    "no": 3,
    "nama": "Noorina Octabiantri Lestari",
    "nip": "199310222015032002",
    "jabatan": "Teknisi Pengendali Hama dan Penyakit Ikan Terampil",
    "satuanPelayanan": "Wilker Bandara Dominie Edward Osok",
    "tanggalLahir": "10/22/1993",
    "masaKerja": "11 Tahun 6 Bulan",
    "pangkat": "Pengatur Muda Tingkat I, II/b",
    "pangkatDetail": "Pengatur Muda Tingkat I/ II.b",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Maret 2028",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1EtUUagOKLvcc6LjTIg-xlInQoXnT6Lk5?usp=drive_link"
  },
  {
    "no": 4,
    "nama": "Rain Rifels Alfalah Prihatin, A.Md.Pi.",
    "nip": "200009272025061007",
    "jabatan": "Teknisi Pengendali Hama dan Penyakit Ikan Terampil",
    "satuanPelayanan": "TEMPEL RAJA AMPAT",
    "tanggalLahir": "9/27/2000",
    "masaKerja": "1 Tahun 3 Bulan",
    "pangkat": "Pengatur, II/c",
    "pangkatDetail": "Pengatur/ II.c",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Juni 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1Uu-m-K0vl_24ycApUNDKroQiAFxbz1K3?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Kadri Akbar Selayar",
    "nip": "198903292023211016",
    "jabatan": "Teknisi Pengendali Hama dan Penyakit Ikan Pemula",
    "satuanPelayanan": "KANTOR POS SORONG",
    "tanggalLahir": "3/29/1989",
    "masaKerja": "2 Tahun 0 Bulan",
    "pangkat": "V",
    "pangkatDetail": "V",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Juli 2028",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1L1u49Jrt0deGge-prUpDwtveWj6Qn8C_?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Irza Fachrul Muswar, S.A.P.",
    "nip": "200005212025061005",
    "jabatan": "Analis Sumber Daya Manusia Aparatur Ahli Pertama",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "5/21/2000",
    "masaKerja": "1 Tahun 3 Bulan",
    "pangkat": "Penata Muda, III/a",
    "pangkatDetail": "Penata Muda/ III.a",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Juni 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1FRC1A-BWCG-_P_DBw5DetlabqzBCNrKL?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Saliati, A.Md.",
    "nip": "198910122020122006",
    "jabatan": "Arsiparis Terampil",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "10/12/1989",
    "masaKerja": "5 Tahun 9 Bulan",
    "pangkat": "Pengatur Tingkat I, II/d",
    "pangkatDetail": "Pengatur Tingkat I/II.d",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Desember 2026",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1QV18YLsgm6x9Tjm3Uu2IzUsuziwJ-cOj?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Juniar Rizkyta Putri, A.Md.",
    "nip": "199706122022032001",
    "jabatan": "Pranata Humas Terampil",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "6/12/1997",
    "masaKerja": "4 Tahun 6 Bulan",
    "pangkat": "Pengatur, II/c",
    "pangkatDetail": "Pengatur/ II.c",
    "tmtPangkat": "01 Maret 2022",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Maret 2028",
    "angkaKredit": 20001,
    "linkDrive": "https://drive.google.com/drive/folders/1BnNQNtlSoL78MFq7dl43afQDz63nhPR8?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "TALIB SADEK",
    "nip": "197202022000031001",
    "jabatan": "Pranata Keuangan APBN Terampil",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "2/2/1972",
    "masaKerja": "26 Tahun 6 Bulan",
    "pangkat": "Penata Muda, III/a",
    "pangkatDetail": "Penata Muda/ III.a",
    "tmtPangkat": "01 Oktober 2017",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Maret 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1eN9YjVIQeQEVHQzgLW24XJSiNSt2Q8Ue?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "NOVITA MARIA SUMELANG, SE",
    "nip": "198811022019022002",
    "jabatan": "Penelaah Teknis Kebijakan",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "11/2/1988",
    "masaKerja": "7 Tahun 7 Bulan",
    "pangkat": "Penata Muda Tingkat I, III/b",
    "pangkatDetail": "Penata Muda Tingkat I/ III.b",
    "tmtPangkat": "01 April 2023",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Februari 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/140vhlLhGkpm6kB6AM0Usf4uWmT0RmH_K?usp=drive_link"
  },
  {
    "no": 2,
    "nama": "RAHMAT ISWADI, S.Si",
    "nip": "198504172009121003",
    "jabatan": "Penelaah Teknis Kebijakan",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "4/17/1985",
    "masaKerja": "16 Tahun 9 Bulan",
    "pangkat": "Penata Tingkat I, III/d",
    "pangkatDetail": "Penata Tingkat I/ III.d",
    "tmtPangkat": "01 April 2022",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Desember 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1xT_hYVZMq6MpnCZzfi6YXXU-XFurSsKQ?usp=drive_link"
  },
  {
    "no": 3,
    "nama": "SADARIA",
    "nip": "197802112003122002",
    "jabatan": "Penelaah Teknis Kebijakan",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "2/11/1978",
    "masaKerja": "22 Tahun 9 Bulan",
    "pangkat": "Penata Muda Tingkat I, III/b",
    "pangkatDetail": "Penata Muda Tingkat I/ III.b",
    "tmtPangkat": "01 April 2024",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Desember 2026",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1DsDtZ4sXlhD8mE0QoSjyCFRt6A6CiK6p?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "YASIEN WIRYADINATA SALLYANA",
    "nip": "197805212006041021",
    "jabatan": "Pengolah Data dan Informasi",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "5/21/1978",
    "masaKerja": "20 Tahun 5 Bulan",
    "pangkat": "Penata Muda, III/a",
    "pangkatDetail": "Penata Muda/ III.a",
    "tmtPangkat": "01 Oktober 2022",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Januari 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/179C8J7oBqddCZT2-S4P_SiB0P-TOQWkZ?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Ayu Hermawati",
    "nip": "199408012025212060",
    "jabatan": "Pengadministrasi Perkantoran",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "8/1/1994",
    "masaKerja": "0 Tahun 0 Bulan",
    "pangkat": "V",
    "pangkatDetail": "V",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Oktober 2026",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/10ETPw8VOFerxgaijUdLJGXzpV2L9xckP?usp=drive_link"
  },
  {
    "no": 2,
    "nama": "Sanusi",
    "nip": "198105102025211051",
    "jabatan": "Pengadministrasi Perkantoran",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "5/10/1981",
    "masaKerja": "0 Tahun 0 Bulan",
    "pangkat": "V",
    "pangkatDetail": "V",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Oktober 2026",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/107t6tJdkeJA2aB4Jc4EYjQxltVCLIXIf?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Achmad Yaqin Hendrata",
    "nip": "197712092025211018",
    "jabatan": "Penata Layanan Operasional",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "12/9/1977",
    "masaKerja": "0 Tahun 0 Bulan",
    "pangkat": "IX",
    "pangkatDetail": "IX",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Oktober 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1k1bqV5t4EXugo9VJJ8a9iCK5FTNLwTFB?usp=drive_link"
  },
  {
    "no": 2,
    "nama": "Martha Meilan Aiboy",
    "nip": "198903132025212045",
    "jabatan": "Penata Layanan Operasional",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "3/13/1989",
    "masaKerja": "0 Tahun 0 Bulan",
    "pangkat": "IX",
    "pangkatDetail": "IX",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Oktober 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1lxJG03Ip0HSWQRNLqPE_iCXrz-IoCvwL?usp=drive_link"
  },
  {
    "no": 3,
    "nama": "Unung Ba'Diah",
    "nip": "199305102025212063",
    "jabatan": "Penata Layanan Operasional",
    "satuanPelayanan": "UPT INDUK",
    "tanggalLahir": "5/10/1993",
    "masaKerja": "0 Tahun 0 Bulan",
    "pangkat": "IX",
    "pangkatDetail": "IX",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Oktober 2027",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1vHiWIjKSPAlc_YwlgMsay9s2mu3sR0lw?usp=drive_link"
  },
  {
    "no": 1,
    "nama": "Reky Souwalla",
    "nip": "198712022025211029",
    "jabatan": "Operator Layanan Operasional",
    "satuanPelayanan": "PELABUHAN RAKYAT SORONG",
    "tanggalLahir": "12/2/1987",
    "masaKerja": "0 Tahun 0 Bulan",
    "pangkat": "V",
    "pangkatDetail": "V",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Oktober 2026",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1qMVRvJYSPObHKVgy3L8KZoRHe_e6k401?usp=drive_link"
  },
  {
    "no": 2,
    "nama": "Yance Damaryanan",
    "nip": "197012152025211013",
    "jabatan": "Operator Layanan Operasional",
    "satuanPelayanan": "Wilker Bandara Dominie Edward Osok",
    "tanggalLahir": "12/15/1970",
    "masaKerja": "0 Tahun 0 Bulan",
    "pangkat": "V",
    "pangkatDetail": "V",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Oktober 2026",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1xILP2Wq1hwH0iq3YgrB_bTb0ItDVkd_O?usp=drive_link"
  },
  {
    "no": 3,
    "nama": "Rijal Kolly",
    "nip": "199005042025211055",
    "jabatan": "Operator Layanan Operasional",
    "satuanPelayanan": "Wilker Pelabuhan Laut Sorong",
    "tanggalLahir": "5/4/1990",
    "masaKerja": "0 Tahun 0 Bulan",
    "pangkat": "V",
    "pangkatDetail": "V",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Oktober 2026",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1QJvphwQx64Y_aVARQQ3pFl9lrYeLxPqE?usp=drive_link"
  },
  {
    "no": 4,
    "nama": "Abu Sofyan",
    "nip": "198703302025211036",
    "jabatan": "Operator Layanan Operasional",
    "satuanPelayanan": "Wilker Bandara Dominie Edward Osok",
    "tanggalLahir": "3/30/1987",
    "masaKerja": "0 Tahun 0 Bulan",
    "pangkat": "V",
    "pangkatDetail": "V",
    "tmtPangkat": "",
    "kelasJabatan": "",
    "nominal": "",
    "tmtKGB": "01 Oktober 2026",
    "angkaKredit": "",
    "linkDrive": "https://drive.google.com/drive/folders/1ZDYvP8XDU3IVmvd1hIi1UaghI6JPuK2S?usp=drive_link"
  }
];
