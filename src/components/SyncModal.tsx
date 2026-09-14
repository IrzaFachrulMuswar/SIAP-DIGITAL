import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, Database, Clock, Server, ArrowDownUp, Check } from 'lucide-react';
import { SyncLog } from '../types';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncLogs: SyncLog[];
  onTriggerSync: () => Promise<void>;
  isSyncing: boolean;
  lastSyncTime: string;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  syncLogs,
  onTriggerSync,
  isSyncing,
  lastSyncTime,
}) => {
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState('15');
  const [pingSuccess, setPingSuccess] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  if (!isOpen) return null;

  const handlePing = () => {
    setIsPinging(true);
    setPingSuccess(false);
    setTimeout(() => {
      setIsPinging(false);
      setPingSuccess(true);
      setTimeout(() => setPingSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Sinkronisasi Database SIMPEG SDM</h3>
            <p className="text-xs text-slate-500">
              Integrasi Otomatis & Pertukaran Data Dua Arah dengan Server Kepegawaian Pusat (SIASN BKN)
            </p>
          </div>
        </div>

        {/* Server & API Status */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-teal-800 flex items-center gap-1.5">
                <Server className="h-4 w-4 text-teal-600" /> Endpoint SIMPEG Host
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-ping" /> Online 200 OK
              </span>
            </div>
            <p className="mt-1 text-xs font-mono text-teal-950 truncate">
              api.siasn.bkn.go.id/v4.2/sync-sdm
            </p>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-teal-700">
              <span>Latensi: ~42ms</span>
              <button
                type="button"
                onClick={handlePing}
                disabled={isPinging}
                className="text-[11px] font-semibold underline hover:text-teal-900 flex items-center gap-1"
              >
                {isPinging ? <RefreshCw className="h-3 w-3 animate-spin" /> : pingSuccess ? <Check className="h-3 w-3 text-emerald-600" /> : null}
                {pingSuccess ? 'Terhubung!' : 'Uji Koneksi Ping'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-500" /> Waktu Sinkronisasi Terakhir
              </span>
              <span className="text-[10px] font-mono text-slate-400">Status 100% Konsisten</span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-800">
              {lastSyncTime}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Auto-sync:</span>
              <div className="flex items-center gap-2">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-5 w-9 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-teal-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                </label>
                <select
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(e.target.value)}
                  disabled={!autoSync}
                  className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700 outline-none"
                >
                  <option value="15">Tiap 15 Menit</option>
                  <option value="30">Tiap 30 Menit</option>
                  <option value="60">Tiap 1 Jam</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Trigger CTA */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white shadow-md">
          <div>
            <h4 className="text-sm font-bold flex items-center gap-2">
              <ArrowDownUp className="h-4 w-4" /> Sinkronisasi Dua Arah Sekarang
            </h4>
            <p className="text-xs text-blue-100 mt-0.5">
              Menyelaraskan data pegawai, presensi, SKP, pengajuan cuti, dan SP2D terbaru.
            </p>
          </div>
          <button
            type="button"
            onClick={onTriggerSync}
            disabled={isSyncing}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-blue-700 shadow hover:bg-blue-50 transition-all disabled:opacity-75 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Menyelaraskan...' : 'Sinkronkan Sekarang'}
          </button>
        </div>

        {/* Logs Table */}
        <div className="mt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Riwayat Log Sinkronisasi Otomatis:
          </h4>
          <div className="rounded-xl border border-slate-200 overflow-hidden max-h-48 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                <tr>
                  <th className="py-2 px-3">Waktu</th>
                  <th className="py-2 px-3">Sumber Data</th>
                  <th className="py-2 px-3">Entitas</th>
                  <th className="py-2 px-3">Durasi</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {syncLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-[11px] whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{log.source}</td>
                    <td className="py-2 px-3 text-[11px] text-slate-600">
                      {log.entitiesSynced.pegawai} Pegawai, {log.entitiesSynced.cuti} Cuti, {log.entitiesSynced.keuangan} Keuangan
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px]">{log.durationMs}ms</td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
