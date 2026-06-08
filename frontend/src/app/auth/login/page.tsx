"use client";
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from "@/store/authStore";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState("");
  const { login, isLoading }            = useAuthStore();
  const router                          = useRouter();
  const { t, lang, toggle }             = useLang();
  const a = t.auth;
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      router.push(`/dashboard/${user?.gateway_type}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || a.invalidCredentials);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — dark branding ───────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] bg-[#0d1117] flex-col justify-between p-10 relative overflow-hidden shrink-0">
        {/* Orbs */}
        <div className="absolute top-[20%] left-[10%] w-80 h-80 bg-green-600/12 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[15%] right-[5%] w-60 h-60 bg-cyan-500/7 rounded-full blur-[80px] pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <Image src="/tensai-logo.png" alt="Tensai" width={40} height={40} className="rounded-full object-contain" />
          <div>
            <div className="text-lg font-bold text-white tracking-tight leading-none">Tensai</div>
            <div className="text-[9px] text-white/35 tracking-wider mt-0.5">THE WAY OF GLOBAL CAREER</div>
          </div>
        </Link>

        {/* Middle content */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-fluid-3xl font-black text-white leading-tight mb-3">
              {ja ? 'グローバルキャリアへ' : bn ? 'বৈশ্বিক ক্যারিয়ারের পথে' : 'Welcome back'}
            </h2>
            <p className="text-white/45 text-sm leading-relaxed">
              {ja
                ? 'あなたのアカウントにログインして、日本留学への旅を続けましょう。'
                : bn
                ? 'আপনার অ্যাকাউন্টে লগইন করুন এবং জাপানে পড়াশোনার যাত্রা চালিয়ে যান।'
                : 'Sign in to continue your journey. Your verified profile and documents are waiting.'}
            </p>
          </div>

          {/* Trust signals */}
          <div className="space-y-3">
            {[
              { icon: '🔒', text: ja ? 'AES-256 暗号化' : bn ? 'AES-256 এনক্রিপ্টেড' : 'AES-256 encrypted session' },
              { icon: '🛡️', text: ja ? 'OCR書類ロック済み' : bn ? 'OCR ডকুমেন্ট লকড' : 'OCR-locked documents' },
              { icon: '✅', text: ja ? 'AIスコア保護' : bn ? 'AI স্কোর সুরক্ষিত' : 'AI eligibility score protected' },
            ].map((s) => (
              <div key={s.text} className="flex items-center gap-3 text-xs text-white/50">
                <span>{s.icon}</span>
                <span>{s.text}</span>
              </div>
            ))}
          </div>

          {/* BD → JP badge */}
          <div className="glass-card rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">{'🇧🇩'}</span>
            <span className="text-white/30 text-sm">→</span>
            <span className="text-2xl">{'🇯🇵'}</span>
            <div className="ml-1">
              <div className="text-white text-xs font-bold leading-tight">BD → Japan Corridor</div>
              <div className="text-white/35 text-[10px]">
                {ja ? 'アクティブ & 拡大中' : bn ? 'সক্রিয় ও সম্প্রসারিত' : 'Active & expanding'}
              </div>
            </div>
            <span className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-white/20 text-[10px]">{`© 2026 Tensai. All rights reserved.`}</p>
        </div>
      </div>

      {/* ── Right panel — form ───────────────────────────── */}
      <div className="flex-1 bg-slate-50 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/tensai-logo.png" alt="Tensai" width={38} height={38} className="rounded-full object-contain" />
              <span className="text-xl font-bold text-green-800">Tensai</span>
            </Link>
            <button onClick={toggle} className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-800 transition-colors">
              {lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English'}
            </button>
          </div>

          {/* Desktop lang toggle */}
          <div className="hidden lg:flex justify-end mb-6">
            <button onClick={toggle} className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-500 hover:border-green-300 hover:text-green-800 transition-colors">
              {lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English'}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Tab switcher */}
            <div className="flex border-b border-slate-100">
              <div className="flex-1 py-3.5 text-center text-sm font-semibold text-green-700 border-b-2 border-green-600">{a.signIn}</div>
              <Link href="/auth/register" className="flex-1 py-3.5 text-center text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">{a.createAccount}</Link>
            </div>

            <div className="p-7">
              <div className="mb-6">
                <h1 className="text-lg font-black text-slate-900">{a.loginTitle}</h1>
                <p className="text-slate-400 text-xs mt-1">{ja ? 'アカウントにアクセスする' : bn ? 'আপনার অ্যাকাউন্টে প্রবেশ করুন' : 'Access your Tensai account'}</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{a.email}</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="you@example.com" required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{a.password}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                      placeholder="••••••••" required
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showPassword ? 'Hide' : 'Show'}>
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Link href="/auth/forgot-password" className="text-xs text-green-700 hover:underline">{a.forgotPassword}</Link>
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-green-700/20">
                  {isLoading ? a.signingIn : a.signIn}
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-slate-500">
                {a.noAccount}{' '}
                <Link href="/auth/register" className="text-green-700 font-semibold hover:underline">{a.register}</Link>
              </p>
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-400 mt-5">
            <Link href="/terms" className="hover:underline">Terms</Link>
            {' · '}
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            {' · © 2026 Tensai'}
          </p>
        </div>
      </div>
    </div>
  );
}
