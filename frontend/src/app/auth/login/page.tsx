"use client";
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from "@/store/authStore";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const FEATURES = [
  { icon: '🔒', en: 'OCR-locked documents',      ja: 'OCRロック書類',        bn: 'OCR লক ডকুমেন্ট' },
  { icon: '🤖', en: 'AI eligibility scoring',     ja: 'AI適性スコア',         bn: 'AI যোগ্যতা স্কোর' },
  { icon: '📊', en: 'Real-time visa tracking',    ja: 'ビザリアルタイム追跡',  bn: 'রিয়েল-টাইম ভিসা ট্র্যাকিং' },
  { icon: '💼', en: '৳20,000 per referral',       ja: '紹介で৳20,000',        bn: 'রেফারেলে ৳২০,০০০' },
];

export default function LoginPage() {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState("");
  const { login, isLoading }            = useAuthStore();
  const router                          = useRouter();
  const { t, lang, toggle }             = useLang();
  const a  = t.auth;
  const l  = t.landing;
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      if (user?.status === 'pending') {
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}&gateway=${user.gateway_type}`);
        return;
      }
      const isAdmin = user?.roles?.some((r: string) => r === 'admin' || r === 'super_admin');
      router.push(isAdmin ? '/dashboard/admin/gallery' : `/dashboard/${user?.gateway_type}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || a.invalidCredentials);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* LEFT — dark brand panel, lg+ only */}
      <div className="hidden lg:flex flex-col justify-between w-[400px] xl:w-[460px] bg-[#0d1117] px-10 py-10 relative overflow-hidden shrink-0">

        {/* Glow orbs */}
        <div className="absolute top-[-80px] left-[-60px] w-[300px] h-[300px] rounded-full bg-green-500/10 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-60px] right-[-40px] w-[240px] h-[240px] rounded-full bg-cyan-500/8 blur-[80px] pointer-events-none" />
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 flex flex-col gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image src="/tensai-logo.png" alt="Tensai" width={40} height={40} className="rounded-xl object-contain" />
            <div>
              <div className="text-xl font-black text-white tracking-tight leading-none">Tensai</div>
              <div className="text-[9px] text-slate-500 tracking-widest uppercase mt-0.5">The Way of Global Career</div>
            </div>
          </Link>

          {/* Headline */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">
                {ja ? 'ようこそ' : bn ? 'স্বাগতম' : 'Welcome back'}
              </span>
            </div>
            <h2 className="text-2xl xl:text-3xl font-black text-white leading-tight">
              {ja ? 'グローバルキャリアへ\nようこそ' : bn ? 'গ্লোবাল ক্যারিয়ারে\nস্বাগতম' : 'Your global career\nstarts here'}
            </h2>
          </div>

          {/* Features — short pills */}
          <ul className="space-y-2.5">
            {FEATURES.map((f) => (
              <li key={f.en} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/4 border border-white/6">
                <span className="text-base shrink-0">{f.icon}</span>
                <span className="text-sm text-slate-300 font-medium">
                  {ja ? f.ja : bn ? f.bn : f.en}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Social proof */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {(['R','K','Y','S'] as const).map((c, i) => (
              <div key={c} className="w-8 h-8 rounded-full border-2 border-[#0d1117] flex items-center justify-center text-white text-xs font-bold"
                style={{ background: ['#16a34a','#0891b2','#7c3aed','#ea580c'][i] }}>
                {c}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            {ja ? '信頼されたプラットフォーム' : bn ? 'বিশ্বস্ত প্ল্যাটফর্ম' : 'Trusted by thousands'}
          </p>
        </div>
      </div>

      {/* RIGHT — form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 overflow-y-auto">

        {/* Mobile logo */}
        <Link href="/" className="flex lg:hidden items-center gap-2.5 mb-8">
          <Image src="/tensai-logo.png" alt="Tensai" width={36} height={36} className="rounded-xl object-contain" />
          <div>
            <div className="text-lg font-black text-green-800 tracking-tight leading-none">Tensai</div>
            <div className="text-[9px] text-slate-400 tracking-widest mt-0.5 uppercase">The Way of Global Career</div>
          </div>
        </Link>

        {/* Card */}
        <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Sign In / Create Account tabs */}
          <div className="flex border-b border-slate-100">
            <div className="flex-1 py-3.5 text-center text-sm font-bold text-green-700 border-b-2 border-green-600">
              {a.signIn}
            </div>
            <Link href="/auth/register" className="flex-1 py-3.5 text-center text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
              {a.createAccount}
            </Link>
          </div>

          <div className="px-6 py-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-medium">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{a.email}</label>
                <input
                  type="text" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/40 transition-all"
                  placeholder="you@email.com" required autoComplete="email"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-600">{a.password}</label>
                  <Link href="/auth/forgot-password" className="text-[11px] text-green-700 hover:underline">{a.forgotPassword}</Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/40 transition-all"
                    placeholder="••••••••" required autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none rounded">
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-sm shadow-green-700/20">
                {isLoading ? a.signingIn : a.signIn}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-slate-400">
              {a.noAccount}{' '}
              <Link href="/auth/register" className="text-green-700 font-semibold hover:underline">{a.register}</Link>
            </p>
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
          <span className="text-[11px] text-slate-400">{l.footer}</span>
        </div>
      </div>
    </div>
  );
}
