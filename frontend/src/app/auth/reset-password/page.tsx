"use client";
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function ResetPasswordForm() {
  const { t, lang, toggle } = useLang();
  const a = t.auth;
  const l = t.landing;
  const ja = lang === 'ja';
  const bn = lang === 'bn';
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [form, setForm] = useState({ email: emailParam, password: '', password_confirmation: '' });
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password_confirmation) {
      setError(a.passwordMismatch);
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { ...form, token });
      setDone(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || a.resetFailed);
    } finally {
      setLoading(false);
    }
  };

  const EyeOn = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
  const EyeOff = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full flex flex-col items-center">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-8">
          <Image src="/tensai-logo.png" alt="Tensai" width={36} height={36} className="rounded-full object-contain" />
          <div>
            <div className="text-lg font-black text-green-800 tracking-tight leading-none">Tensai</div>
            <div className="text-[9px] text-slate-400 tracking-widest mt-0.5 uppercase">The Way of Global Career</div>
          </div>
        </Link>

        {/* Card */}
        <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-6">
            <div className="mb-5">
              <h1 className="text-lg font-black text-slate-900">{a.resetTitle}</h1>
              <p className="text-slate-400 text-xs mt-1">
                {ja ? '新しいパスワードを設定してください' : bn ? 'নতুন পাসওয়ার্ড সেট করুন' : 'Set a new password for your account'}
              </p>
            </div>

            {done ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="font-bold text-slate-900 mb-1">{a.resetSuccess}</h2>
                <p className="text-sm text-slate-500">{a.resetSuccessDesc}</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-medium">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{a.email}</label>
                    <input
                      type="email" placeholder="you@example.com" required
                      value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      {a.newPassword} <span className="text-slate-400 font-normal">({ja ? '8文字以上' : bn ? 'কমপক্ষে ৮ অক্ষর' : 'min 8 chars'})</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'} placeholder="••••••••" required minLength={8}
                        value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                        className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/40 transition-all"
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none rounded">
                        {showPw ? <EyeOff /> : <EyeOn />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{a.confirmPassword}</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'} placeholder="••••••••" required
                        value={form.password_confirmation} onChange={(e) => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
                        className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/40 transition-all"
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none rounded">
                        {showConfirm ? <EyeOff /> : <EyeOn />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit" disabled={loading}
                    className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-sm shadow-green-700/20 mt-1"
                  >
                    {loading ? a.resetting : a.resetPassword}
                  </button>
                </form>
                <p className="text-center text-xs text-slate-400 mt-5">
                  <Link href="/auth/login" className="text-green-700 font-semibold hover:underline">{a.backToLogin}</Link>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 mt-6">
          <button onClick={toggle} className="text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200 text-slate-500 hover:border-green-300 hover:text-green-700 transition-colors">
            {lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English'}
          </button>
          <span className="text-slate-300 text-xs">·</span>
          <Link href="/terms"   className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors">{l.terms}</Link>
          <Link href="/privacy" className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors">{l.privacy}</Link>
        </div>

      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
