"use client";
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const { t, lang, toggle } = useLang();
  const a = t.auth;
  const l = t.landing;
  const ja = lang === 'ja';
  const bn = lang === 'bn';
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || a.resetFailed);
    } finally {
      setLoading(false);
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
              <h1 className="text-lg font-black text-slate-900">{a.forgotTitle}</h1>
              <p className="text-slate-400 text-xs mt-1">{a.forgotDesc}</p>
            </div>

            {sent ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h2 className="font-bold text-slate-900 mb-1">{a.checkEmail}</h2>
                <p className="text-sm text-slate-500 mb-6">{a.checkEmailDesc}</p>
                <Link href="/auth/login" className="text-sm text-green-700 font-semibold hover:underline">
                  {a.backToLogin}
                </Link>
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
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/40 transition-all"
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      {ja ? '登録時に使用したメールアドレスを入力してください。' : bn ? 'নিবন্ধনের সময় ব্যবহৃত ইমেইল ঠিকানা দিন।' : 'Use the email address you registered with.'}
                    </p>
                  </div>
                  <button
                    type="submit" disabled={loading}
                    className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-sm shadow-green-700/20 mt-1"
                  >
                    {loading ? a.sending : a.sendResetLink}
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
