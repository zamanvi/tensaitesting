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
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const gatewayParam = searchParams.get('gateway') || 'student';

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/tensai-logo.png" alt="Tensai" width={40} height={40} className="rounded-full object-contain" />
              <span className="text-2xl font-bold text-green-800">Tensai</span>
            </Link>
            <button
              onClick={toggle}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-800 transition-colors"
            >
              {lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English'}
            </button>
          </div>
          <p className="text-slate-500 mt-2 text-sm">{a.verifyTitle}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          {done ? (
            <div className="text-center">
              <div className="text-4xl mb-4">âœ…</div>
              <h2 className="font-bold text-slate-900 mb-2">{a.verifySuccess}</h2>
              <p className="text-sm text-slate-500">{a.verifySuccessDesc}</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600 mb-1">{a.verifyDesc}</p>
              {emailParam && (
                <p className="text-xs text-green-700 font-medium mb-5">{emailParam}</p>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{error}</div>
              )}
              {resendSent && (
                <div className="mb-4 p-3 bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl">{a.resendSent}</div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder={a.verifyCode}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-center tracking-widest text-lg font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
                >
                  {loading ? a.verifying : a.verifyBtn}
                </button>
              </form>

              <div className="mt-5 text-center space-y-2">
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-sm text-green-700 hover:underline disabled:opacity-50"
                >
                  {resending ? a.sending : a.resendCode}
                </button>
                <div>
                  <Link href="/auth/login" className="text-sm text-slate-400 hover:text-slate-600">
                    {a.backToLogin}
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}

