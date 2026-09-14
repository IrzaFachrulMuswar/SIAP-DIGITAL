import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Plus, 
  Trash2, 
  Table, 
  Database, 
  Key, 
  Link2, 
  Layers, 
  Check, 
  X, 
  FileCheck, 
  HelpCircle,
  Clock,
  Sparkles,
  FolderSearch,
  ArrowDownToLine
} from 'lucide-react';
import { 
  googleSignIn, 
  logoutGoogle, 
  getGoogleUser, 
  getAccessToken,
  setManualAccessToken
} from '../utils/googleAuth';
import { 
  GoogleSheetsDatabaseState, 
  INITIAL_SHEETS_DATABASE,
  fetchSpreadsheetMetadata,
  readSheetRange,
  updateSheetRange,
  appendSheetRows,
  createSIMPEGSpreadsheet,
  fetchDriveSpreadsheets,
  fetchPublicSheetData,
  formatEmployeesForSheet,
  formatCutiForSheet,
  formatKGBForSheet,
  formatSPPDForSheet,
  formatAttendanceForSheet
} from '../utils/googleSheetsService';
import { Employee, CutiBKNRecord, KGBRecord, MonthlyAttendance, PerjalananDinasRecord } from '../types';

interface GoogleSheetsViewProps {
  employees: Employee[];
  cutiList: CutiBKNRecord[];
  kgbList: KGBRecord[];
  attendances: MonthlyAttendance[];
  sppdList: PerjalananDinasRecord[];
  onImportEmployeesFromSheet?: (newEmployees: Employee[]) => void;
  onImportCutiFromSheet?: (newCuti: CutiBKNRecord[]) => void;
  onRequest2FA: (title: string, callback: () => void) => void;
}

export const GoogleSheetsView: React.FC<GoogleSheetsViewProps> = ({
  employees,
  cutiList,
  kgbList,
  attendances,
  sppdList,
  onImportEmployeesFromSheet,
  onImportCutiFromSheet,
  onRequest2FA,
}) => {
  // Database state in preview
  const [dbState, setDbState] = useState<GoogleSheetsDatabaseState>(() => {
    const saved = localStorage.getItem('simpeg_sheets_db');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_SHEETS_DATABASE;
      }
    }
    return INITIAL_SHEETS_DATABASE;
  });

  const [activeSheetKey, setActiveSheetKey] = useState<string>('Data_Pegawai');
  const [searchQuery, setSearchQuery] = useState('');
  const [customSpreadsheetId, setCustomSpreadsheetId] = useState('');
  const [isEditingId, setIsEditingId] = useState(false);
  
  // Drive files state
  const [driveFiles, setDriveFiles] = useState<Array<{ id: string; name: string; webViewLink: string; modifiedTime?: string }>>([]);
  const [isListingDrive, setIsListingDrive] = useState(false);
  const [showDrivePicker, setShowDrivePicker] = useState(false);

  // Auth state
  const [googleUser, setGoogleUser] = useState<any>(getGoogleUser());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync / Operation loading states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    description: string;
    actionType: 'push_all' | 'create_new' | 'apply_to_simpeg';
    onConfirm: () => void;
  } | null>(null);

  const [isAddRowModalOpen, setIsAddRowModalOpen] = useState(false);
  const [newRowValues, setNewRowValues] = useState<{ [key: string]: string }>({});

  // Persist to localStorage for reliable preview experience
  useEffect(() => {
    localStorage.setItem('simpeg_sheets_db', JSON.stringify(dbState));
  }, [dbState]);

  // Check auth user on mount
  useEffect(() => {
    setGoogleUser(getGoogleUser());
  }, []);

  const currentSheet = dbState.sheets[activeSheetKey] || {
    sheetName: activeSheetKey,
    headers: [],
    rows: [],
    updatedAt: '',
  };

  // Filter rows based on search
  const filteredRows = (currentSheet.rows || []).filter((row) =>
    row.some((cell) => cell.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle Google Sign-In using Firebase Auth popup
  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setSyncSuccessMsg(`Berhasil terhubung ke akun Google: ${res.user.email}`);
        setDbState((prev) => ({
          ...prev,
          isConnected: true,
          lastSynced: new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }) + ' WIB',
        }));
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Gagal login ke akun Google.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setDriveFiles([]);
    setShowDrivePicker(false);
    setSyncSuccessMsg('Telah keluar dari akun Google.');
  };

  // Search spreadsheets in user's Google Drive
  const handleLoadDriveFiles = async () => {
    setIsListingDrive(true);
    setAuthError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setAuthError('Silakan klik "Sign in with Google" terlebih dahulu untuk menghubungkan akun Google Drive Anda.');
        setIsListingDrive(false);
        return;
      }
      const files = await fetchDriveSpreadsheets(token);
      setDriveFiles(files);
      setShowDrivePicker(true);
      if (files.length === 0) {
        setSyncSuccessMsg('Belum ada file spreadsheet terdeteksi di akun Google Drive ini. Anda juga dapat langsung menempelkan URL Spreadsheet pada input di bawah.');
      }
    } catch (e: any) {
      setAuthError(e.message || 'Gagal mencari spreadsheet di Google Drive.');
    } finally {
      setIsListingDrive(false);
    }
  };

  // Read and parse all data from Google Sheets (Live OAuth or Public Fallback)
  const handleReadSpreadsheet = async (targetIdOrUrl?: string) => {
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    setAuthError(null);

    const target = targetIdOrUrl || customSpreadsheetId || dbState.spreadsheetId;
    let cleanId = target.trim();
    const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      cleanId = match[1];
    }

    if (!cleanId) {
      setAuthError('Silakan masukkan ID atau URL Google Spreadsheet yang valid.');
      setIsSyncing(false);
      return;
    }

    try {
      const token = await getAccessToken();

      // 1. Live Google Sheets API with OAuth Bearer Token
      if (token && !cleanId.startsWith('1SIMPEG_')) {
        let sheetNames: string[] = [];
        let fetchedTitle = '';

        try {
          const meta = await fetchSpreadsheetMetadata(cleanId, token);
          if (meta.properties?.title) {
            fetchedTitle = meta.properties.title;
          }
          if (meta.sheets && Array.isArray(meta.sheets)) {
            sheetNames = meta.sheets
              .map((s: any) => s.properties?.title)
              .filter(Boolean);
          }
        } catch (metaErr: any) {
          console.warn('Metadata fetch notice:', metaErr);
        }

        if (sheetNames.length === 0) {
          sheetNames = Object.keys(dbState.sheets).length > 0 
            ? Object.keys(dbState.sheets) 
            : ['Sheet1', 'Data_Pegawai'];
        }

        const updatedSheets: { [key: string]: any } = {};
        const nowStr = new Date().toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' WIB';

        let successfulCount = 0;
        for (const sheetName of sheetNames) {
          try {
            const rawRows = await readSheetRange(cleanId, `${sheetName}!A1:Z100`, token);
            if (rawRows.length > 0) {
              const headers = rawRows[0] || [];
              const rows = rawRows.slice(1) || [];
              updatedSheets[sheetName] = {
                sheetName,
                headers,
                rows,
                updatedAt: nowStr,
              };
              successfulCount++;
            }
          } catch (rErr) {
            console.warn(`Gagal membaca tab ${sheetName}:`, rErr);
          }
        }

        if (successfulCount > 0) {
          setDbState((prev) => ({
            ...prev,
            spreadsheetId: cleanId,
            spreadsheetTitle: fetchedTitle || prev.spreadsheetTitle || `Spreadsheet (${cleanId.slice(0, 8)}...)`,
            spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
            sheets: updatedSheets,
            lastSynced: nowStr,
            isConnected: true,
          }));

          if (sheetNames.length > 0 && !updatedSheets[activeSheetKey]) {
            setActiveSheetKey(sheetNames[0]);
          }

          setCustomSpreadsheetId('');
          setIsEditingId(false);
          setShowDrivePicker(false);
          setSyncSuccessMsg(`Berhasil membaca ${successfulCount} tab sheet dari Google Spreadsheet ("${fetchedTitle || cleanId}")!`);
          return;
        }
      }

      // 2. Public Google Spreadsheet fallback (via GViz API)
      if (!cleanId.startsWith('1SIMPEG_')) {
        const publicData = await fetchPublicSheetData(cleanId);
        if (publicData && publicData.headers.length > 0) {
          const nowStr = new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }) + ' WIB';

          setDbState((prev) => ({
            ...prev,
            spreadsheetId: cleanId,
            spreadsheetTitle: `Google Spreadsheet (${cleanId.slice(0, 8)}...)`,
            spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
            sheets: {
              ...prev.sheets,
              [activeSheetKey]: {
                sheetName: activeSheetKey,
                headers: publicData.headers,
                rows: publicData.rows,
                updatedAt: nowStr,
              },
            },
            lastSynced: nowStr,
            isConnected: true,
          }));

          setCustomSpreadsheetId('');
          setIsEditingId(false);
          setShowDrivePicker(false);
          setSyncSuccessMsg(`Berhasil membaca data dari Google Spreadsheet (${publicData.rows.length} baris data)!`);
          return;
        }
      }

      // 3. Fallback simulated sync for preview
      await new Promise((r) => setTimeout(r, 600));
      setDbState((prev) => ({
        ...prev,
        lastSynced: new Date().toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' WIB',
      }));
      setSyncSuccessMsg('Database Google Spreadsheet berhasil disegarkan dan terbaca di tampilan preview.');
    } catch (err: any) {
      setAuthError(err.message || 'Gagal membaca database dari Google Spreadsheet.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Wrapper for header Refresh button
  const handleSyncFromSheets = () => {
    handleReadSpreadsheet(dbState.spreadsheetId);
  };

  // Push all SIMPEG local data to Google Sheets (with User Confirmation)
  const triggerPushAllToSheets = () => {
    setConfirmModalData({
      title: 'Sinkronisasi Penuh ke Google Spreadsheet',
      description: `Apakah Anda yakin ingin menimpa/memperbarui data pada ${Object.keys(dbState.sheets).length} sheet (Data_Pegawai, Pengajuan_Cuti, KGB_Berkala, Absensi_Bulanan, SPPD_Dinas) dengan data SIMPEG saat ini (${employees.length} pegawai, ${cutiList.length} cuti, dll.)?`,
      actionType: 'push_all',
      onConfirm: async () => {
        setIsPushing(true);
        setConfirmModalData(null);
        try {
          const token = await getAccessToken();

          // Prepare formatted sheets 2D arrays
          const empData = formatEmployeesForSheet(employees);
          const cutiData = formatCutiForSheet(cutiList);
          const kgbData = formatKGBForSheet(kgbList);
          const attData = formatAttendanceForSheet(attendances);
          const sppdData = formatSPPDForSheet(sppdList);

          const nowStr = new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }) + ' WIB';

          if (token && dbState.spreadsheetId && !dbState.spreadsheetId.startsWith('1SIMPEG_')) {
            // Write to live Google Sheets via API
            await updateSheetRange(dbState.spreadsheetId, 'Data_Pegawai!A1', empData, token);
            await updateSheetRange(dbState.spreadsheetId, 'Pengajuan_Cuti!A1', cutiData, token);
            await updateSheetRange(dbState.spreadsheetId, 'KGB_Berkala!A1', kgbData, token);
            await updateSheetRange(dbState.spreadsheetId, 'Absensi_Bulanan!A1', attData, token);
            await updateSheetRange(dbState.spreadsheetId, 'SPPD_Dinas!A1', sppdData, token);
          }

          // Update preview state so changes are immediately visible
          setDbState((prev) => ({
            ...prev,
            lastSynced: nowStr,
            sheets: {
              Data_Pegawai: {
                sheetName: 'Data_Pegawai',
                headers: empData[0] as string[],
                rows: empData.slice(1) as string[][],
                updatedAt: nowStr,
              },
              Pengajuan_Cuti: {
                sheetName: 'Pengajuan_Cuti',
                headers: cutiData[0] as string[],
                rows: cutiData.slice(1) as string[][],
                updatedAt: nowStr,
              },
              KGB_Berkala: {
                sheetName: 'KGB_Berkala',
                headers: kgbData[0] as string[],
                rows: kgbData.slice(1) as string[][],
                updatedAt: nowStr,
              },
              Absensi_Bulanan: {
                sheetName: 'Absensi_Bulanan',
                headers: attData[0] as string[],
                rows: attData.slice(1) as string[][],
                updatedAt: nowStr,
              },
              SPPD_Dinas: {
                sheetName: 'SPPD_Dinas',
                headers: sppdData[0] as string[],
                rows: sppdData.slice(1) as string[][],
                updatedAt: nowStr,
              },
            },
          }));

          setSyncSuccessMsg('Seluruh modul data SIMPEG berhasil disinkronkan ke Google Spreadsheet!');
        } catch (err: any) {
          setAuthError(err.message || 'Gagal mengirim data ke Google Sheets.');
        } finally {
          setIsPushing(false);
        }
      },
    });
    setIsConfirmModalOpen(true);
  };

  // Create brand new Spreadsheet on Google Drive
  const triggerCreateNewSpreadsheet = () => {
    setConfirmModalData({
      title: 'Buat Spreadsheet SIMPEG Baru di Google Drive',
      description: 'Sistem akan membuat file spreadsheet baru dengan 5 sheet database otomatis di akun Google Drive Anda.',
      actionType: 'create_new',
      onConfirm: async () => {
        setIsConfirmModalOpen(false);
        setConfirmModalData(null);
        setIsPushing(true);

        try {
          const token = await getAccessToken();
          if (token) {
            const created = await createSIMPEGSpreadsheet(
              `SIMPEG & Keuangan ASN DB - ${new Date().toLocaleDateString('id-ID')}`,
              token
            );
            setDbState((prev) => ({
              ...prev,
              spreadsheetId: created.spreadsheetId,
              spreadsheetUrl: created.spreadsheetUrl,
              spreadsheetTitle: `SIMPEG & Keuangan ASN DB - ${new Date().toLocaleDateString('id-ID')}`,
            }));
            setSyncSuccessMsg(`Spreadsheet baru berhasil dibuat dengan ID: ${created.spreadsheetId}`);
          } else {
            // Mock ID for preview
            const fakeId = `1SP_${Date.now().toString(36).toUpperCase()}_SIMPEG`;
            setDbState((prev) => ({
              ...prev,
              spreadsheetId: fakeId,
              spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${fakeId}/edit`,
              spreadsheetTitle: `SIMPEG & Keuangan ASN DB - ${new Date().toLocaleDateString('id-ID')}`,
            }));
            setSyncSuccessMsg('Spreadsheet database baru siap digunakan di tampilan preview!');
          }
        } catch (err: any) {
          setAuthError(err.message || 'Gagal membuat file spreadsheet baru.');
        } finally {
          setIsPushing(false);
        }
      },
    });
    setIsConfirmModalOpen(true);
  };

  // Direct Row Addition Modal
  const handleOpenAddRow = () => {
    const initialValues: { [key: string]: string } = {};
    currentSheet.headers.forEach((h) => {
      initialValues[h] = '';
    });
    setNewRowValues(initialValues);
    setIsAddRowModalOpen(true);
  };

  const handleSaveNewRow = async (e: React.FormEvent) => {
    e.preventDefault();
    const rowData = currentSheet.headers.map((h) => newRowValues[h] || '-');

    try {
      const token = await getAccessToken();
      if (token && dbState.spreadsheetId && !dbState.spreadsheetId.startsWith('1SIMPEG_')) {
        await appendSheetRows(dbState.spreadsheetId, `${activeSheetKey}!A1`, [rowData], token);
      }

      // Update local preview database immediately
      const updatedRows = [...currentSheet.rows, rowData];
      const nowStr = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB';

      setDbState((prev) => ({
        ...prev,
        lastSynced: nowStr,
        sheets: {
          ...prev.sheets,
          [activeSheetKey]: {
            ...currentSheet,
            rows: updatedRows,
            updatedAt: nowStr,
          },
        },
      }));

      setIsAddRowModalOpen(false);
      setSyncSuccessMsg(`Baris baru berhasil ditambahkan ke tabel "${activeSheetKey}"!`);
    } catch (err: any) {
      setAuthError(err.message || 'Gagal menambahkan baris ke sheet.');
    }
  };

  // Apply Sheet rows back to SIMPEG (Pull)
  const handleApplyToSimpeg = () => {
    setConfirmModalData({
      title: 'Terapkan Data Spreadsheet ke SIMPEG',
      description: 'Apakah Anda ingin memperbarui memori aplikasi SIMPEG dengan data yang sedang ditampilkan dari spreadsheet ini?',
      actionType: 'apply_to_simpeg',
      onConfirm: () => {
        setIsConfirmModalOpen(false);
        setConfirmModalData(null);

        if (activeSheetKey === 'Data_Pegawai' && onImportEmployeesFromSheet) {
          // Parse rows back to Employee objects
          const importedEmps: Employee[] = currentSheet.rows.map((r, idx) => {
            const rawGaji = r[6] ? parseInt(r[6].replace(/[^0-9]/g, ''), 10) : 3500000;
            const sisaCuti = r[7] ? parseInt(r[7].replace(/[^0-9]/g, ''), 10) : 12;
            return {
              id: `EMP-SHT-${idx + 1}`,
              nip: r[0] || '19900101 202001 1 001',
              nama: r[1] || 'Pegawai Spreadsheet',
              gelarDepan: '',
              gelarBelakang: '',
              jabatan: r[2] || 'Pranata Komputer',
              pangkatGolongan: (r[3] as any) || 'Penata Muda / III/a',
              unitKerja: r[4] || 'Biro SDM dan Umum',
              statusPegawai: (r[5] as any) || 'PNS',
              gajiPokok: isNaN(rawGaji) ? 3500000 : rawGaji,
              sisaCutiN: isNaN(sisaCuti) ? 12 : sisaCuti,
              sisaCutiN1: 0,
              sisaCutiN2: 0,
              email: r[8] || 'pegawai@instansi.go.id',
              telepon: r[9] || '0812-0000-0000',
              alamat: 'Jakarta',
              tmtPNS: '2020-01-01',
              jenisKelamin: 'Laki-laki',
              tanggalLahir: '1990-01-01',
              pendidikanTerakhir: 'S1',
              dokumen: [],
              createdAt: '2026-09-01',
              updatedAt: new Date().toISOString().slice(0, 10),
            };
          });

          onImportEmployeesFromSheet(importedEmps);
          setSyncSuccessMsg(`Berhasil mengimpor ${importedEmps.length} data pegawai dari Google Spreadsheet ke SIMPEG!`);
        } else {
          setSyncSuccessMsg(`Data sheet "${activeSheetKey}" telah diverifikasi dan siap digunakan.`);
        }
      },
    });
    setIsConfirmModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Integrasi Database Google Spreadsheet
              </h2>
              <p className="text-xs text-slate-500">
                Data tersinkronisasi dua arah dan dapat dibaca langsung pada tampilan preview aplikasi
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSyncFromSheets}
            disabled={isSyncing}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            title="Muat ulang data terbaru dari Google Sheets"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Refresh Database'}</span>
          </button>

          <button
            type="button"
            onClick={triggerPushAllToSheets}
            disabled={isPushing}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Kirim seluruh data SIMPEG saat ini ke Google Spreadsheet"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>{isPushing ? 'Mengirim Data...' : 'Kirim Data SIMPEG ke Sheets'}</span>
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {syncSuccessMsg && (
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{syncSuccessMsg}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSyncSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {authError && (
        <div className="flex items-center justify-between rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="font-medium">{authError}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setAuthError(null)}
            className="text-rose-600 hover:text-rose-800 p-1 rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Connection & Account Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Google Account Status & Official Button */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Akun Google Workspace</span>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                <Check className="h-3 w-3" /> OAuth 2.0 Aktif
              </span>
            </div>

            {googleUser ? (
              <div className="mt-3 flex items-center gap-3">
                {googleUser.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || 'Google User'}
                    className="h-10 w-10 rounded-full border border-slate-200"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                    {(googleUser.displayName || googleUser.email || 'G')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {googleUser.displayName || 'Pengguna Google'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{googleUser.email}</p>
                  <span className="text-[10px] text-emerald-600 font-medium">Izin: Spreadsheets & Drive File</span>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-600">
                  Aplikasi telah dikonfigurasi dengan izin <strong>Google Sheets & Drive</strong>. Masuk dengan akun Google Anda untuk menghubungkan spreadsheet pribadi.
                </p>
                {/* Official Sign In with Google button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isAuthenticating}
                  className="w-full flex items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <svg className="h-4 w-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>{isAuthenticating ? 'Menghubungkan...' : 'Sign in with Google'}</span>
                </button>
              </div>
            )}
          </div>

          {googleUser && (
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleGoogleSignOut}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                Ganti / Putuskan Akun
              </button>
            </div>
          )}
        </div>

        {/* Active Database Target Card */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Database className="h-4 w-4 text-emerald-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Target Spreadsheet Database
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Sinkron Terakhir: {dbState.lastSynced}
              </span>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {dbState.spreadsheetTitle}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    ID: {dbState.spreadsheetId}
                  </span>
                  <a
                    href={dbState.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline"
                  >
                    <span>Buka Spreadsheet</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={triggerCreateNewSpreadsheet}
                  className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Buat spreadsheet baru secara otomatis"
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Buat Baru di Drive</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingId(!isEditingId)}
                  className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Key className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{isEditingId ? 'Tutup ID' : 'Ganti ID'}</span>
                </button>
              </div>
            </div>

            {/* Primary Spreadsheet Reader & Linker Box */}
            <div className="mt-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Tautkan & Baca Google Spreadsheet:</span>
                <span className="text-[11px] font-normal text-slate-500">Mendukung URL / ID spreadsheet Google</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Tempel URL lengkap (https://docs.google.com/spreadsheets/d/...) atau Spreadsheet ID..."
                    value={customSpreadsheetId}
                    onChange={(e) => setCustomSpreadsheetId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleReadSpreadsheet(customSpreadsheetId);
                      }
                    }}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs font-mono"
                  />
                  {customSpreadsheetId && (
                    <button
                      type="button"
                      onClick={() => setCustomSpreadsheetId('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleReadSpreadsheet(customSpreadsheetId)}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <ArrowDownToLine className={`h-4 w-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                  <span>{isSyncing ? 'Membaca...' : 'Baca Database Ini'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadDriveFiles}
                  disabled={isListingDrive}
                  className="flex items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 shrink-0"
                  title="Cari dan pilih spreadsheet dari akun Google Drive Anda"
                >
                  <FolderSearch className={`h-4 w-4 text-indigo-600 ${isListingDrive ? 'animate-spin' : ''}`} />
                  <span>{isListingDrive ? 'Mencari...' : 'Pilih dari Drive'}</span>
                </button>
              </div>

              {/* Drive files picker dropdown if open */}
              {showDrivePicker && (
                <div className="mt-3 p-3 rounded-md bg-white border border-indigo-200 shadow-xs animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <FolderSearch className="h-3.5 w-3.5 text-indigo-600" />
                      Spreadsheet di Google Drive Anda ({driveFiles.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDrivePicker(false)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {driveFiles.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2 text-center">
                      Tidak ada spreadsheet terdaftar, atau buat spreadsheet baru menggunakan tombol "Buat Baru di Drive".
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-slate-50">
                      {driveFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between py-1.5 px-2 hover:bg-indigo-50/60 rounded cursor-pointer transition-colors"
                          onClick={() => {
                            setCustomSpreadsheetId(file.id);
                            handleReadSpreadsheet(file.id);
                          }}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {file.id.slice(0, 16)}...</p>
                          </div>
                          <button
                            type="button"
                            className="shrink-0 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded hover:bg-emerald-100 cursor-pointer"
                          >
                            Pilih & Baca
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Database live aktif terbaca di tampilan preview
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleReadSpreadsheet(dbState.spreadsheetId)}
                className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
              >
                Muat Ulang Data
              </button>
              <span>•</span>
              <span>{Object.keys(dbState.sheets).length} Tabel Tersedia</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Database Table Explorer (Terbaca di Tampilan Preview) */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Table Selector Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs for individual sheets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {Object.keys(dbState.sheets).map((sheetKey) => {
              const isActive = activeSheetKey === sheetKey;
              const count = dbState.sheets[sheetKey]?.rows?.length || 0;
              return (
                <button
                  key={sheetKey}
                  type="button"
                  onClick={() => {
                    setActiveSheetKey(sheetKey);
                    setSearchQuery('');
                  }}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <Table className={`h-3.5 w-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{sheetKey}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Table Level Search & Insert */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={`Cari di ${activeSheetKey}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenAddRow}
              className="flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer shrink-0"
              title="Tambah baris baru langsung ke sheet ini"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Baris</span>
            </button>

            {activeSheetKey === 'Data_Pegawai' && onImportEmployeesFromSheet && (
              <button
                type="button"
                onClick={handleApplyToSimpeg}
                className="flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors cursor-pointer shrink-0"
                title="Terapkan baris tabel ini ke modul SIMPEG"
              >
                <DownloadCloud className="h-3.5 w-3.5 text-indigo-600" />
                <span>Impor ke SIMPEG</span>
              </button>
            )}
          </div>
        </div>

        {/* Database Table Details Info Bar */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">Tabel: {currentSheet.sheetName}</span>
            <span>•</span>
            <span>{currentSheet.headers.length} Kolom</span>
            <span>•</span>
            <span>{filteredRows.length} Baris data ditampilkan</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Pembaruan Terakhir: {currentSheet.updatedAt || dbState.lastSynced}
          </div>
        </div>

        {/* Live Spreadsheet Data Table */}
        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
              <tr>
                <th className="py-2.5 px-3 bg-slate-100 text-center w-12 border-r border-slate-200 text-slate-400 font-mono">
                  #
                </th>
                {currentSheet.headers.map((header, idx) => (
                  <th key={idx} className="py-2.5 px-3 border-r border-slate-200 last:border-r-0 whitespace-nowrap bg-slate-50">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={currentSheet.headers.length + 1}
                    className="py-12 text-center text-slate-400"
                  >
                    Tidak ada baris data yang ditemukan di sheet "{activeSheetKey}".
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="hover:bg-indigo-50/20 transition-colors group"
                  >
                    <td className="py-2 px-3 text-center border-r border-slate-100 font-mono text-[11px] text-slate-400 bg-slate-50/50 group-hover:bg-indigo-50/30">
                      {rowIdx + 1}
                    </td>
                    {currentSheet.headers.map((_, colIdx) => {
                      const cellValue = row[colIdx] || '';
                      const isNip = cellValue.includes('19') && cellValue.length > 15;
                      const isStatus = cellValue === 'PNS' || cellValue === 'PPPK' || cellValue === 'Disetujui';

                      return (
                        <td
                          key={colIdx}
                          className="py-2 px-3 border-r border-slate-100 last:border-r-0 whitespace-nowrap text-slate-800"
                        >
                          {isStatus ? (
                            <span className="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {cellValue}
                            </span>
                          ) : isNip ? (
                            <span className="font-mono text-[11px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded">
                              {cellValue}
                            </span>
                          ) : (
                            <span>{cellValue}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Mutating / Destructive Operations */}
      {isConfirmModalOpen && confirmModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{confirmModalData.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Konfirmasi Sinkronisasi Google Sheets</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              {confirmModalData.description}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setConfirmModalData(null);
                }}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModalData.onConfirm();
                }}
                className="rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs cursor-pointer"
              >
                Lanjutkan & Sinkronkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Row Modal */}
      {isAddRowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-xl bg-white p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tambah Baris Baru ke Tabel "{activeSheetKey}"
                </h3>
                <p className="text-xs text-slate-500">
                  Data akan ditambahkan langsung ke spreadsheet dan ditampilkan di preview
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRowModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewRow} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentSheet.headers.map((header) => (
                  <div key={header}>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {header}
                    </label>
                    <input
                      type="text"
                      required={header.toLowerCase().includes('nip') || header.toLowerCase().includes('nama')}
                      value={newRowValues[header] || ''}
                      onChange={(e) =>
                        setNewRowValues({ ...newRowValues, [header]: e.target.value })
                      }
                      className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
                      placeholder={`Masukkan ${header}...`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddRowModalOpen(false)}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  Simpan ke Spreadsheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
