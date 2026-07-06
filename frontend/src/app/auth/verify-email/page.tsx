'use client';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function VerifyEmailForm() {
  const { t, lang, toggle } = useLang();
  const a = t.auth;
  const l = t.landing;
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { email: emailParam, code });
      setDone(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || a.verifyInvalid);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendSent(false);
    try {
      await api.post('/auth/resend-verification', { email: emailParam });
      setResendSent(true);
    } finally {
      setResending(false);
    }
  };

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
              <h1 className="text-lg font-black text-slate-900">{a.verifyTitle}</h1>
              <p className="text-slate-400 text-xs mt-1">{a.verifyDesc}</p>
              {emailParam && (
                <p className="text-xs text-green-700 font-semibold mt-2 bg-green-50 border border-green-100 rounded-lg px-3 py-1.5 inline-block">{emailParam}</p>
              )}
            </div>

            {done ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="font-bold text-slate-900 mb-1">{a.verifySuccess}</h2>
                <p className="text-sm text-slate-500">{a.verifySuccessDesc}</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-medium">{error}</div>
                )}
                {resendSent && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-100 text-green-700 text-xs rounded-xl font-medium">{a.resendSent}</div>
                )}

                <form onSubmit={handleVerify} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{a.verifyCode}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="000000"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-center tracking-[0.5em] text-lg font-mono placeholder:text-slate-300 placeholder:tracking-normal placeholder:text-sm placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-green-500/40 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-sm shadow-green-700/20 mt-1"
                  >
                    {loading ? a.verifying : a.verifyBtn}
                  </button>
                </form>

                <div className="mt-5 flex flex-col items-center gap-2">
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="text-xs text-green-700 font-semibold hover:underline disabled:opacity-50 transition-colors"
                  >
                    {resending ? a.sending : a.resendCode}
                  </button>
                  <Link href="/auth/login" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                    {a.backToLogin}
                  </Link>
                </div>
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
