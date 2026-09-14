import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, RefreshCw, X, AlertCircle } from 'lucide-react';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle?: string;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Verifikasi Keamanan Tindakan Sensitif'
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState('');
  const [demoCode, setDemoCode] = useState('842915');

  useEffect(() => {
    if (!isOpen) return;
    setCode(['', '', '', '', '', '']);
    setError('');
    const newDemo = Math.floor(100000 + Math.random() * 900000).toString();
    setDemoCode(newDemo);
    setTimer(30);

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 1 ? prev - 1 : 30));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = () => {
    const entered = code.join('');
    // Allow demo code or any valid 6-digit entered
    if (entered.length < 6) {
      setError('Masukkan 6 digit kode keamanan dengan lengkap.');
      return;
    }
    if (entered !== demoCode && entered !== '123456') {
      setError(`Kode verifikasi tidak cocok. Gunakan kode simulasi: ${demoCode}`);
      return;
    }
    onSuccess();
    onClose();
  };

  const autoFillDemo = () => {
    setCode(demoCode.split(''));
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Autentikasi Dua Faktor (2FA)</h3>
          <p className="mt-1 text-sm text-slate-500">
            {actionTitle}
          </p>
          <p className="mt-2 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            Perlindungan data sensitif kepegawaian & transaksi keuangan negara.
          </p>
        </div>

        {/* Demo Token Notice */}
        <div className="mt-5 rounded-xl bg-blue-50/80 border border-blue-200/70 p-3 text-left">
          <div className="flex items-center justify-between text-xs text-blue-700">
            <span className="font-semibold flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Token Authenticator Aktif
            </span>
            <span className="flex items-center gap-1 font-mono text-blue-600">
              <RefreshCw className="h-3 w-3 animate-spin" /> {timer}s
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-lg font-bold tracking-widest text-blue-900">
              {demoCode}
            </span>
            <button
              type="button"
              onClick={autoFillDemo}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-md transition-colors"
            >
              Gunakan Kode Ini
            </button>
          </div>
        </div>

        {/* OTP Input Boxes */}
        <div className="mt-6 flex justify-center gap-2">
          {code.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-input-${idx}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="h-12 w-11 text-center text-xl font-bold text-slate-800 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          ))}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-600 justify-center">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleVerify}
            className="w-1/2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            Konfirmasi 2FA
          </button>
        </div>
      </div>
    </div>
  );
};
