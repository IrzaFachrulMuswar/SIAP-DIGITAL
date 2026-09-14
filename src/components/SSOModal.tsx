import React from 'react';
import { X, KeyRound, CheckCircle2, UserCheck, ArrowRight, ShieldCheck, Building2 } from 'lucide-react';
import { UserSession } from '../types';

interface SSOModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: UserSession;
  onSwitchSession: (newSession: UserSession) => void;
}

const mockSSOAccounts: UserSession[] = [
  {
    isLoggedIn: true,
    name: 'Drs. H. Bambang Suhartono, M.Si.',
    nip: '19750814 200003 1 002',
    email: 'bambang.suhartono@instansi.go.id',
    role: 'ADMIN_SDM',
    jabatan: 'Kepala Bagian Kepegawaian & Tata Usaha',
    unitKerja: 'Biro Sumber Daya Manusia dan Umum',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    ssoProvider: 'SSO Pusat Kepegawaian ASN BKN',
    is2FAEnabled: true,
    is2FAVerified: true,
  },
  {
    isLoggedIn: true,
    name: 'Siti Nurhaliza, S.E., M.Ak.',
    nip: '19890918 201402 2 003',
    email: 'siti.nurhaliza@instansi.go.id',
    role: 'BENDAHARA_KEUANGAN',
    jabatan: 'Analis Pengelolaan Keuangan APBN / PPK',
    unitKerja: 'Bagian Perbendaharaan dan Gaji',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    ssoProvider: 'SSO Portal SAKTI Kemenkeu & Corporate',
    is2FAEnabled: true,
    is2FAVerified: true,
  },
  {
    isLoggedIn: true,
    name: 'Dr. Rahmat Hidayat, S.Kom., M.T.',
    nip: '19820412 200801 1 005',
    email: 'rahmat.hidayat@instansi.go.id',
    role: 'PEGAWAI',
    jabatan: 'Pranata Komputer Ahli Madya',
    unitKerja: 'Pusat Data dan Informasi Kepegawaian',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    ssoProvider: 'SSO Portal Mandiri ASN',
    is2FAEnabled: false,
    is2FAVerified: false,
  }
];

export const SSOModal: React.FC<SSOModalProps> = ({
  isOpen,
  onClose,
  currentSession,
  onSwitchSession,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Integrasi Single Sign-On (SSO)</h3>
            <p className="text-xs text-slate-500">
              Otentikasi Terpusat Identitas ASN & Korporat Perusahaan
            </p>
          </div>
        </div>

        {/* Current Active SSO Session */}
        <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider text-slate-600">Sesi SSO Saat Ini</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-medium text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" /> Terhubung
            </span>
          </div>
          <div className="flex items-center gap-3">
            <img
              src={currentSession.avatar}
              alt={currentSession.name}
              className="h-11 w-11 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-800 truncate">{currentSession.name}</h4>
              <p className="text-xs text-slate-500 font-mono">NIP: {currentSession.nip}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {currentSession.role === 'ADMIN_SDM' ? 'Administrator Kepegawaian' : currentSession.role === 'BENDAHARA_KEUANGAN' ? 'Pejabat Keuangan / PPK' : 'Pegawai ASN'}
                </span>
                {currentSession.is2FAEnabled && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <ShieldCheck className="h-3 w-3" /> 2FA Aktif
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Switch Account Simulator */}
        <div className="mt-5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
            Ganti Profil SSO Pengguna:
          </label>
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {mockSSOAccounts.map((account) => {
              const isSelected = account.nip === currentSession.nip;
              return (
                <div
                  key={account.nip}
                  onClick={() => {
                    onSwitchSession(account);
                    onClose();
                  }}
                  className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-400'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={account.avatar}
                      alt={account.name}
                      className="h-10 w-10 rounded-full object-cover border border-slate-200"
                    />
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600">
                        {account.name}
                      </p>
                      <p className="text-[11px] text-slate-500">{account.jabatan}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {account.ssoProvider}
                      </p>
                    </div>
                  </div>

                  <div className="pl-3">
                    {isSelected ? (
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security details */}
        <div className="mt-5 rounded-xl bg-slate-100 p-3 text-[11px] text-slate-600 flex items-start gap-2">
          <KeyRound className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
          <span>
            Protokol OpenID Connect / SAML 2.0 aktif. Token autentikasi disinkronkan secara aman dengan Pusat Komputer ASN BKN & Portal Keuangan SAKTI.
          </span>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
