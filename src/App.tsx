import React, { useState, useEffect } from 'react';
import { 
  Employee, 
  MonthlyAttendance, 
  KGBRecord, 
  KenaikanPangkatRecord, 
  CutiBKNRecord, 
  PakSkpRecord, 
  PerjalananDinasRecord, 
  LemburRecord, 
  PerbendaharaanRecord, 
  UangMakanRecord,
  NotificationItem, 
  SyncLog, 
  UserSession 
} from './types';
import { 
  initialEmployees, 
  initialAttendances, 
  initialKGB, 
  initialKP, 
  initialCutiBKN, 
  initialPakSkp, 
  initialSPPD, 
  initialLembur, 
  initialPerbendaharaan, 
  initialUangMakan,
  initialNotifications, 
  initialSyncLogs, 
  initialUserSession 
} from './data/initialData';
import { 
  fetchLivePegawaiSpreadsheet, 
  convertSpreadsheetToEmployees, 
  PEGAWAI_SPREADSHEET_ID 
} from './data/pegawaiSpreadsheetData';

import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DatabaseIntegrationNavbar } from './components/DatabaseIntegrationNavbar';
import { SheetTabsNavbar } from './components/SheetTabsNavbar';
import { TwoFactorModal } from './components/TwoFactorModal';
import { SSOModal } from './components/SSOModal';
import { SyncModal } from './components/SyncModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { QuickMenuEditModal } from './components/QuickMenuEditModal';

// 8 Dedicated Google Sheets Views (Sesuai Struktur 8 Sheet Database)
import { Sheet1DataPegawaiView } from './views/sheets/Sheet1DataPegawaiView';
import { Sheet2PengajuanCutiView } from './views/sheets/Sheet2PengajuanCutiView';
import { Sheet3AbsensiBulananView } from './views/sheets/Sheet3AbsensiBulananView';
import { Sheet4KgbBerkalaView } from './views/sheets/Sheet4KgbBerkalaView';
import { Sheet5SppdDinasView } from './views/sheets/Sheet5SppdDinasView';
import { Sheet6UangMakanView } from './views/sheets/Sheet6UangMakanView';
import { Sheet7LemburAsnView } from './views/sheets/Sheet7LemburAsnView';
import { Sheet8PerbendaharaanView } from './views/sheets/Sheet8PerbendaharaanView';

// Standard Views
import { DashboardView } from './views/DashboardView';
import { GoogleSheetsView } from './views/GoogleSheetsView';
import { exportEmployeeListPDF, exportToExcel } from './utils/exportUtils';
import { 
  fetchLiveDataPegawai, 
  fetchLiveAbsensiBulanan, 
  TARGET_SPREADSHEET_ID 
} from './utils/googleSheetsLiveReader';
import { 
  sendToUniversalWebhook, 
  isUniversalAutoSyncEnabled, 
  getUniversalWebhookUrl,
  WebhookModuleKey
} from './utils/universalSheetWebhook';

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>('sheets_db');
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Core Data Lists (Terintegrasi ke Google Spreadsheet ID: 1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const cached = localStorage.getItem('pegawai_spreadsheet_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return convertSpreadsheetToEmployees(parsed);
        }
      }
    } catch (e) {
      console.warn('Error reading pegawai cache', e);
    }
    return initialEmployees;
  });

  // Auto-sync database pegawai live dari Google Spreadsheet ID: 1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M
  useEffect(() => {
    let isMounted = true;
    fetchLivePegawaiSpreadsheet(PEGAWAI_SPREADSHEET_ID)
      .then((fresh) => {
        if (isMounted && fresh && fresh.length > 0) {
          localStorage.setItem('pegawai_spreadsheet_cache', JSON.stringify(fresh));
          const converted = convertSpreadsheetToEmployees(fresh);
          setEmployees(converted);
        }
      })
      .catch((err) => {
        console.warn('Background sync with live employee spreadsheet:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);
  const [attendances, setAttendances] = useState<MonthlyAttendance[]>(initialAttendances);
  const [kgbList, setKgbList] = useState<KGBRecord[]>(initialKGB);
  const [kpList, setKpList] = useState<KenaikanPangkatRecord[]>(initialKP);
  const [cutiList, setCutiList] = useState<CutiBKNRecord[]>(initialCutiBKN);
  const [pakSkpList, setPakSkpList] = useState<PakSkpRecord[]>(initialPakSkp as any);
  const [sppdList, setSppdList] = useState<PerjalananDinasRecord[]>(() => {
    try {
      const cached = localStorage.getItem('sppd_spreadsheet_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading sppd cache', e);
    }
    return initialSPPD;
  });
  const [lemburList, setLemburList] = useState<LemburRecord[]>(initialLembur);
  const [perbendaharaanList, setPerbendaharaanList] = useState<PerbendaharaanRecord[]>(initialPerbendaharaan);
  const [uangMakanList, setUangMakanList] = useState<UangMakanRecord[]>(initialUangMakan);

  // System & Security State
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(initialSyncLogs);
  const [currentUser, setCurrentUser] = useState<UserSession>(initialUserSession);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('04 Maret 2026 08:30 WIB');

  // Modals & Drawers
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [pending2FAAction, setPending2FAAction] = useState<{ title: string; action: () => void } | null>(null);
  const [isSSOModalOpen, setIsSSOModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  // Akses Edit pada tiap-tiap menu navigation bar
  const [isQuickEditModalOpen, setIsQuickEditModalOpen] = useState(false);
  const [quickEditTargetTab, setQuickEditTargetTab] = useState<NavTab>('pegawai');
  const [isEditModeActive, setIsEditModeActive] = useState(true);

  const handleOpenEditModalForTab = (tab: NavTab) => {
    setQuickEditTargetTab(tab);
    setIsQuickEditModalOpen(true);
  };

  // Real-time Notification Dispatcher
  const triggerNotification = (
    title: string, 
    message: string, 
    category: NotificationItem['category'], 
    type: NotificationItem['type'] = 'info',
    targetTab?: string
  ) => {
    const newNotif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      title,
      judul: title,
      message,
      pesan: message,
      category,
      type,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      targetTab
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // 2FA Security Request Handler
  const handleRequest2FA = (title: string, callback: () => void) => {
    if (!currentUser.is2FAEnabled) {
      callback();
      return;
    }
    setPending2FAAction({ title, action: callback });
    setIs2FAModalOpen(true);
  };

  const handle2FASuccess = () => {
    if (pending2FAAction) {
      pending2FAAction.action();
      triggerNotification(
        'Otorisasi 2FA Berhasil',
        `Tindakan "${pending2FAAction.title}" telah diverifikasi oleh pemegang hak akses.`,
        'KEAMANAN',
        'success'
      );
      setPending2FAAction(null);
    }
    setIs2FAModalOpen(false);
  };

  // Manual Trigger Sync Simulation
  const handleTriggerSync = async (): Promise<void> => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    
    const now = new Date();
    const timeStr = `${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
    setLastSyncTime(timeStr);

    const newLog: SyncLog = {
      id: `SYNC-${Date.now().toString().slice(-4)}`,
      timestamp: now.toISOString().slice(0, 19).replace('T', ' '),
      source: 'SIMPEG Pusat & SIASN BKN v4.2',
      entitiesSynced: {
        pegawai: employees.length,
        kehadiran: attendances.length,
        cuti: cutiList.length,
        keuangan: perbendaharaanList.length,
      },
      status: 'Sukses',
      durationMs: 1120,
      pesan: 'Sinkronisasi manual berhasil diselesaikan. Semua record terverifikasi konsisten dengan basis data pusat.',
      keterangan: 'Sinkronisasi manual berhasil diselesaikan.'
    };

    setSyncLogs((prev) => [newLog, ...prev]);
    setIsSyncing(false);
    triggerNotification(
      'Sinkronisasi SDM Selesai',
      `Basis data telah diperbarui secara langsung dengan SIMPEG Pusat (BKN).`,
      'SINKRONISASI',
      'success'
    );
  };

  // Quick Audit Export
  const handleQuickExport = () => {
    exportEmployeeListPDF(employees, 'REKAPITULASI DATA PEGAWAI & AUDIT SIMPEG');
    triggerNotification(
      'Ekspor Dokumen Audit',
      'Laporan rekapitulasi audit kepegawaian berhasil diunduh dalam format PDF.',
      'KEPEGAWAIAN',
      'info'
    );
  };

  // Notification Drawer Actions
  const handleMarkNotifAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllNotifRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearNotif = () => {
    setNotifications([]);
  };

  // --- Helper Auto-Sync Universal Webhook Google Sheets ---
  const triggerAutoSyncWebhook = (moduleKey: WebhookModuleKey, action: 'append' | 'update', item: any) => {
    const url = getUniversalWebhookUrl();
    if (!isUniversalAutoSyncEnabled() || !url || !url.startsWith('http')) return;
    sendToUniversalWebhook({ moduleKey, action, item }).then((res) => {
      if (!res.success) {
        console.warn(`[UniversalWebhook] Auto-sync (${moduleKey}) ditunda:`, res.message);
      }
    }).catch((err) => {
      console.warn(`[UniversalWebhook] Auto-sync (${moduleKey}) error:`, err?.message || err);
    });
  };

  // --- CRUD Handlers: Pegawai ---
  const handleAddEmployee = (emp: Employee) => {
    setEmployees((prev) => [emp, ...prev]);
    triggerAutoSyncWebhook('pegawai', 'append', emp);
    triggerNotification(
      'Pegawai Baru Terdaftar',
      `Data pegawai ${emp.nama} (${emp.nip}) berhasil ditambahkan ke sistem.`,
      'KEPEGAWAIAN',
      'success',
      'pegawai'
    );
  };

  const handleUpdateEmployee = (emp: Employee) => {
    setEmployees((prev) => prev.map((e) => (e.id === emp.id ? emp : e)));
    triggerAutoSyncWebhook('pegawai', 'update', emp);
    triggerNotification(
      'Pembaruan Data Pegawai',
      `Data biodata/dokumen pegawai ${emp.nama} telah diperbarui.`,
      'KEPEGAWAIAN',
      'info',
      'pegawai'
    );
  };

  const handleDeleteEmployee = (empId: string) => {
    const target = employees.find((e) => e.id === empId);
    setEmployees((prev) => prev.filter((e) => e.id !== empId));
    triggerNotification(
      'Penghapusan Pegawai',
      `Data pegawai ${target?.nama || empId} telah dihapus dari sistem.`,
      'KEPEGAWAIAN',
      'warning',
      'pegawai'
    );
  };

  // --- CRUD Handlers: Absensi ---
  const handleAddAttendance = (item: MonthlyAttendance) => {
    setAttendances((prev) => [item, ...prev]);
    triggerAutoSyncWebhook('absensi', 'append', item);
    triggerNotification(
      'Rekap Presensi Diupload',
      `Rekap absensi bulanan periode ${item.namaBulan} telah berhasil diproses.`,
      'KEPEGAWAIAN',
      'success',
      'absensi'
    );
  };

  const handleUpdateAttendance = (item: MonthlyAttendance) => {
    setAttendances((prev) => prev.map((a) => (a.id === item.id ? item : a)));
  };

  const handleDeleteAttendance = (id: string) => {
    setAttendances((prev) => prev.filter((a) => a.id !== id));
  };

  // --- CRUD Handlers: KGB ---
  const handleAddKGB = (record: KGBRecord) => {
    setKgbList((prev) => [record, ...prev]);
    triggerAutoSyncWebhook('kgb', 'append', record);
    triggerNotification(
      'Usulan KGB Diajukan',
      `Kenaikan Gaji Berkala untuk ${record.employeeName} berhasil didaftarkan.`,
      'KEPEGAWAIAN',
      'success',
      'kgb'
    );
  };

  const handleUpdateKGB = (record: KGBRecord) => {
    setKgbList((prev) => prev.map((k) => (k.id === record.id ? record : k)));
    triggerAutoSyncWebhook('kgb', 'update', record);
    triggerNotification(
      'Status KGB Diperbarui',
      `Usulan KGB ${record.employeeName} sekarang berstatus: ${record.status}.`,
      'KEPEGAWAIAN',
      'info',
      'kgb'
    );
  };

  const handleDeleteKGB = (id: string) => {
    setKgbList((prev) => prev.filter((k) => k.id !== id));
  };

  // --- CRUD Handlers: Kenaikan Pangkat ---
  const handleAddKP = (record: KenaikanPangkatRecord) => {
    setKpList((prev) => [record, ...prev]);
    triggerNotification(
      'Usulan KP Masuk',
      `Usulan kenaikan pangkat untuk ${record.employeeName} (${record.periode}) diajukan.`,
      'KEPEGAWAIAN',
      'info',
      'kp'
    );
  };

  const handleUpdateKP = (record: KenaikanPangkatRecord) => {
    setKpList((prev) => prev.map((kp) => (kp.id === record.id ? record : kp)));
  };

  const handleDeleteKP = (id: string) => {
    setKpList((prev) => prev.filter((kp) => kp.id !== id));
  };

  // --- CRUD Handlers: Cuti BKN ---
  const handleAddCuti = (record: CutiBKNRecord) => {
    setCutiList((prev) => [record, ...prev]);
    triggerAutoSyncWebhook('cuti', 'append', record);
    triggerNotification(
      'Permohonan Cuti BKN',
      `Permohonan cuti baru No: ${record.noPermohonan} (${record.jenisCuti}) diajukan oleh ${record.employeeName}.`,
      'KEPEGAWAIAN',
      'info',
      'cuti'
    );
  };

  const handleUpdateCuti = (record: CutiBKNRecord) => {
    setCutiList((prev) => prev.map((c) => (c.id === record.id ? record : c)));
    triggerAutoSyncWebhook('cuti', 'update', record);
    triggerNotification(
      'Keputusan Cuti BKN',
      `Permohonan cuti ${record.employeeName} telah berstatus: ${record.statusFinal}.`,
      'KEPEGAWAIAN',
      record.statusFinal === 'Disetujui' ? 'success' : 'warning',
      'cuti'
    );
  };

  const handleDeleteCuti = (id: string) => {
    setCutiList((prev) => prev.filter((c) => c.id !== id));
  };

  // --- CRUD Handlers: PAK & SKP ---
  const handleAddPakSkp = (record: PakSkpRecord) => {
    setPakSkpList((prev) => [record, ...prev]);
    triggerNotification(
      'Dokumen Kinerja Baru',
      `Berkas ${record.tipe} tahun ${record.tahunKinerja} milik ${record.employeeName} disimpan.`,
      'KEPEGAWAIAN',
      'success',
      'pak_skp'
    );
  };

  const handleUpdatePakSkp = (record: PakSkpRecord) => {
    setPakSkpList((prev) => prev.map((r) => (r.id === record.id ? record : r)));
  };

  const handleDeletePakSkp = (id: string) => {
    setPakSkpList((prev) => prev.filter((r) => r.id !== id));
  };

  // --- CRUD Handlers: SPPD ---
  const handleAddSPPD = (record: PerjalananDinasRecord) => {
    setSppdList((prev) => [record, ...prev]);
    triggerAutoSyncWebhook('sppd', 'append', record);
    triggerNotification(
      'Penerbitan SPPD',
      `Surat Tugas & SPPD ${record.nomorSPD || record.nomorSPPD} telah dibuat.`,
      'KEUANGAN',
      'success',
      'sppd'
    );
  };

  const handleUpdateSPPD = (record: PerjalananDinasRecord) => {
    setSppdList((prev) => prev.map((s) => (s.id === record.id ? record : s)));
    triggerAutoSyncWebhook('sppd', 'update', record);
    triggerNotification(
      'Status SPPD Diperbarui',
      `Berkas SPPD ${record.nomorSPD || record.nomorSPPD} berstatus: ${record.status}.`,
      'KEUANGAN',
      'info',
      'sppd'
    );
  };

  const handleDeleteSPPD = (id: string) => {
    setSppdList((prev) => prev.filter((s) => s.id !== id));
  };

  const handleBatchSyncSPPD = (records: PerjalananDinasRecord[]) => {
    setSppdList(records);
    localStorage.setItem('sppd_spreadsheet_cache', JSON.stringify(records));
    triggerNotification(
      'Sinkronisasi Google Spreadsheet',
      `${records.length} data SPD berhasil disinkronkan dengan Google Spreadsheet (ID: 1EvZNlseIxD1S6qhMG7epF4K0_22fHDA1WCgMsecWO5M, gid: 271751341).`,
      'KEUANGAN',
      'success',
      'sppd'
    );
  };

  // --- CRUD Handlers: Lembur ---
  const handleAddLembur = (record: LemburRecord) => {
    setLemburList((prev) => [record, ...prev]);
    triggerAutoSyncWebhook('lembur', 'append', record);
    triggerNotification(
      'Perintah Lembur Terbit',
      `Surat perintah lembur untuk ${record.namaPegawai || record.employeeName} telah diajukan.`,
      'KEUANGAN',
      'info',
      'lembur'
    );
  };

  const handleUpdateLembur = (record: LemburRecord) => {
    setLemburList((prev) => prev.map((l) => (l.id === record.id ? record : l)));
    triggerAutoSyncWebhook('lembur', 'update', record);
  };

  const handleDeleteLembur = (id: string) => {
    setLemburList((prev) => prev.filter((l) => l.id !== id));
  };

  // --- CRUD Handlers: Perbendaharaan ---
  const handleAddPerbendaharaan = (record: PerbendaharaanRecord) => {
    setPerbendaharaanList((prev) => [record, ...prev]);
    triggerAutoSyncWebhook('perbendaharaan', 'append', record);
    triggerNotification(
      'Dokumen Pembayaran Kas Terbit',
      `Dokumen ${record.jenis} (${record.nomorDokumen}) berhasil diterbitkan.`,
      'KEUANGAN',
      'success',
      'perbendaharaan'
    );
  };

  const handleUpdatePerbendaharaan = (record: PerbendaharaanRecord) => {
    setPerbendaharaanList((prev) => prev.map((p) => (p.id === record.id ? record : p)));
    triggerAutoSyncWebhook('perbendaharaan', 'update', record);
    triggerNotification(
      'Pencairan Anggaran Kas',
      `Dokumen ${record.nomorDokumen} berstatus: ${record.status}.`,
      'KEUANGAN',
      record.status === 'Cair ke Rekening' ? 'success' : 'info',
      'perbendaharaan'
    );
  };

  const handleDeletePerbendaharaan = (id: string) => {
    setPerbendaharaanList((prev) => prev.filter((p) => p.id !== id));
  };

  // --- CRUD Handlers: Uang Makan Pegawai ASN (Rekapan Per Bulan) ---
  const handleAddUangMakan = (record: UangMakanRecord) => {
    setUangMakanList((prev) => [record, ...prev]);
    triggerAutoSyncWebhook('uang_makan', 'append', record);
    triggerNotification(
      'Rekapitulasi Uang Makan',
      `Rekapan uang makan periode ${record.bulan} berhasil ditambahkan ke sistem.`,
      'KEUANGAN',
      'success',
      'uang_makan'
    );
  };

  const handleUpdateUangMakan = (record: UangMakanRecord) => {
    setUangMakanList((prev) => prev.map((u) => (u.id === record.id ? record : u)));
    triggerAutoSyncWebhook('uang_makan', 'update', record);
    triggerNotification(
      'Pembaruan Uang Makan',
      `Rekapan uang makan periode ${record.bulan} diperbarui (Status: ${record.status}).`,
      'KEUANGAN',
      'info',
      'uang_makan'
    );
  };

  const handleDeleteUangMakan = (id: string) => {
    setUangMakanList((prev) => prev.filter((u) => u.id !== id));
  };

  // Notification badge counts
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const pendingCutiCount = cutiList.filter((c) => c.statusFinal.includes('Menunggu')).length;
  const pendingKgbCount = kgbList.filter((k) => k.status === 'Menunggu Verifikasi' || k.status === 'Diverifikasi').length;

  // Live Refresh State for Read-Only Sheets (Sheet 1 & 3)
  const [isRefreshingLive, setIsRefreshingLive] = useState(false);

  const handleRefreshLiveSheets = async () => {
    setIsRefreshingLive(true);
    try {
      const [resPegawai, resAbsensi] = await Promise.all([
        fetchLiveDataPegawai(TARGET_SPREADSHEET_ID),
        fetchLiveAbsensiBulanan(TARGET_SPREADSHEET_ID),
      ]);
      setEmployees(resPegawai.rows);
      setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
      triggerNotification(
        'Sinkronisasi Live Sheet',
        `Berhasil membaca data langsung: ${resPegawai.rowCount} Pegawai dan ${resAbsensi.rowCount} Log Presensi dari Google Spreadsheet.`,
        'SINKRONISASI',
        'success',
        'sheets_db'
      );
    } catch (err: any) {
      console.error('Error refreshing live sheets:', err);
    } finally {
      setIsRefreshingLive(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans text-slate-800 antialiased selection:bg-indigo-600 selection:text-white">
      {/* 1. NAVBAR KHUSUS INTEGRASI DATABASE (TERPISAH DARI SEMUA NAVBAR) */}
      <DatabaseIntegrationNavbar
        onOpenDatabaseManager={() => setCurrentTab('sheets_db')}
        onRefreshLiveSheets={handleRefreshLiveSheets}
        onOpenEditModal={handleOpenEditModalForTab}
        isRefreshing={isRefreshingLive}
        lastSyncTime={lastSyncTime}
        currentTab={currentTab}
      />

      {/* 2. Top Header Navbar (Profil, SSO, 2FA, Search & Quick Export) */}
      <Navbar
        currentSession={currentUser}
        unreadNotifsCount={unreadNotifsCount}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        onOpenSSO={() => setIsSSOModalOpen(true)}
        onOpenSync={() => setIsSyncModalOpen(true)}
        onOpenSheetsDB={() => setCurrentTab('sheets_db')}
        onOpenQuickEdit={() => handleOpenEditModalForTab(currentTab)}
        onOpen2FA={() => {
          setPending2FAAction(null);
          setIs2FAModalOpen(true);
        }}
        onToggleSidebarMobile={() => setIsSidebarMobileOpen((prev) => !prev)}
        lastSyncTime={lastSyncTime}
        onQuickExport={handleQuickExport}
        searchQuery={globalSearch}
        setSearchQuery={setGlobalSearch}
      />

      {/* 3. NAVBAR NAVIGASI KHUSUS 8 SHEET SPREADSHEET (BACA SHEET & INPUT DATA) */}
      <SheetTabsNavbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenEditModal={handleOpenEditModalForTab}
        isEditModeActive={isEditModeActive}
        onToggleEditMode={() => setIsEditModeActive((prev) => !prev)}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Nav Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'sync') {
              setIsSyncModalOpen(true);
            } else if (tab === 'keamanan') {
              setIs2FAModalOpen(true);
            } else {
              setCurrentTab(tab);
            }
          }}
          onOpenEditModal={handleOpenEditModalForTab}
          counts={{
            totalPegawai: employees.length,
            cutiPending: pendingCutiCount,
            kgbPending: pendingKgbCount,
            sp2dCount: perbendaharaanList.length,
          }}
          isMobileOpen={isSidebarMobileOpen}
          onCloseMobile={() => setIsSidebarMobileOpen(false)}
        />

        {/* Center Content Area & Sleek Footer */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-8 space-y-6">
            {/* Dasbor Eksekutif Utama */}
            {currentTab === 'dashboard' && (
              <DashboardView
                employees={employees}
                attendances={attendances}
                cutiList={cutiList}
                perbendaharaanList={perbendaharaanList}
                kgbList={kgbList}
                sppdList={sppdList}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onOpenSync={() => setIsSyncModalOpen(true)}
              />
            )}

            {/* SHEET 1: DATA PEGAWAI (MODE: BACA LANGSUNG DARI SHEET) */}
            {currentTab === 'pegawai' && (
              <Sheet1DataPegawaiView />
            )}

            {/* SHEET 2: PENGAJUAN CUTI (MODE: INPUT DATA) */}
            {currentTab === 'cuti' && (
              <Sheet2PengajuanCutiView
                cutiList={cutiList}
                onAddCuti={handleAddCuti}
              />
            )}

            {/* SHEET 3: ABSENSI BULANAN (MODE: BACA LANGSUNG DARI SHEET) */}
            {currentTab === 'absensi' && (
              <Sheet3AbsensiBulananView />
            )}

            {/* SHEET 4: KGB BERKALA (MODE: INPUT DATA) */}
            {currentTab === 'kgb' && (
              <Sheet4KgbBerkalaView
                kgbList={kgbList}
                onAddKgb={handleAddKGB}
              />
            )}

            {/* SHEET 5: SPPD DINAS (MODE: INPUT DATA) */}
            {currentTab === 'sppd' && (
              <Sheet5SppdDinasView
                sppdList={sppdList}
                onAddSppd={handleAddSPPD}
              />
            )}

            {/* SHEET 6: UANG MAKAN (MODE: INPUT DATA) */}
            {currentTab === 'uang_makan' && (
              <Sheet6UangMakanView />
            )}

            {/* SHEET 7: LEMBUR ASN (MODE: INPUT DATA) */}
            {currentTab === 'lembur' && (
              <Sheet7LemburAsnView />
            )}

            {/* SHEET 8: PERBENDAHARAAN (MODE: INPUT DATA) */}
            {currentTab === 'perbendaharaan' && (
              <Sheet8PerbendaharaanView />
            )}

            {/* INTEGRASI DATABASE GOOGLE SHEETS & APPS SCRIPT CODE.GS */}
            {currentTab === 'sheets_db' && (
              <GoogleSheetsView
                employees={employees}
                cutiList={cutiList}
                kgbList={kgbList}
                attendances={attendances}
                sppdList={sppdList}
                onImportEmployeesFromSheet={(imported) => {
                  setEmployees(imported);
                  triggerNotification(
                    'Impor Google Sheets',
                    `Sebanyak ${imported.length} data pegawai berhasil disinkronkan dari spreadsheet ke sistem SIMPEG.`,
                    'KEPEGAWAIAN',
                    'success',
                    'pegawai'
                  );
                }}
                onRequest2FA={handleRequest2FA}
              />
            )}
          </main>

          {/* Sleek Theme Footer */}
          <footer className="h-10 bg-white border-t border-slate-200 px-4 md:px-8 flex items-center justify-between text-[11px] text-slate-400 font-medium shrink-0">
            <div>
              Status Sinkronisasi SDM: <span className="text-emerald-500 font-semibold">Aktif & Terintegrasi</span>
            </div>
            <div className="hidden sm:block">
              Powered by Corporate SSO Architecture &bull; BKN SIASN & Kemenkeu SAKTI
            </div>
          </footer>
        </div>
      </div>

      {/* 2FA Verification Modal */}
      <TwoFactorModal
        isOpen={is2FAModalOpen}
        onClose={() => {
          setIs2FAModalOpen(false);
          setPending2FAAction(null);
        }}
        onSuccess={handle2FASuccess}
        actionTitle={pending2FAAction?.title}
      />

      {/* SSO Account Switcher Modal */}
      <SSOModal
        isOpen={isSSOModalOpen}
        onClose={() => setIsSSOModalOpen(false)}
        currentSession={currentUser}
        onSwitchSession={(newSession) => {
          setCurrentUser(newSession);
          triggerNotification(
            'Beralih Akun SSO Berhasil',
            `Saat ini aktif sebagai ${newSession.name} (${newSession.role}) melalui ${newSession.ssoProvider}.`,
            'KEAMANAN',
            'success'
          );
        }}
      />

      {/* SDM Database Sync Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncLogs={syncLogs}
        onTriggerSync={handleTriggerSync}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
      />

      {/* Real-Time Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotifAsRead}
        onMarkAllAsRead={handleMarkAllNotifRead}
        onClearAll={handleClearNotif}
        onNavigateTab={(tab) => {
          setCurrentTab(tab as NavTab);
          setIsNotifDrawerOpen(false);
        }}
      />

      {/* Universal Quick Menu Edit Modal (Akses Edit pada tiap-tiap menu navigation bar) */}
      <QuickMenuEditModal
        isOpen={isQuickEditModalOpen}
        onClose={() => setIsQuickEditModalOpen(false)}
        targetTab={quickEditTargetTab}
        onNavigateTab={(tab) => {
          setCurrentTab(tab);
          setIsQuickEditModalOpen(false);
        }}
        onAddEmployee={handleAddEmployee}
        onAddCuti={handleAddCuti}
        onAddAttendance={handleAddAttendance}
        onAddKgb={handleAddKGB}
        onAddSppd={handleAddSPPD}
        onAddUangMakan={handleAddUangMakan}
        onAddLembur={handleAddLembur}
        onAddPerbendaharaan={handleAddPerbendaharaan}
      />
    </div>
  );
}
