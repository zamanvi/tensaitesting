"use client";
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const { t, lang, toggle } = useLang();
  const a = t.auth;
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Link href="/" className="text-2xl font-bold text-green-800">Tensai</Link>
            <button
              onClick={toggle}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-800 transition-colors"
            >
              {lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English'}
            </button>
          </div>
          <p className="text-slate-500 mt-2 text-sm">{a.forgotTitle}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          {sent ? (
            <div className="text-center">
              <div className=”text-4xl mb-4”>📧</div>
              <h2 className="font-bold text-slate-900 mb-2">{a.checkEmail}</h2>
              <p className="text-sm text-slate-500 mb-6">{a.checkEmailDesc}</p>
              <Link href="/auth/login" className="text-green-700 font-medium hover:underline text-sm">
                {a.backToLogin}
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{error}</div>
              )}
              <p className="text-sm text-slate-600 mb-5">{a.forgotDesc}</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email" placeholder={a.emailAddress} required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="submit" disabled={loading}
                  className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
                >
                  {loading ? a.sending : a.sendResetLink}
                </button>
              </form>
              <p className="text-center text-sm text-slate-500 mt-5">
                <Link href="/auth/login" className="text-green-700 font-medium hover:underline">{a.backToLogin}</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

