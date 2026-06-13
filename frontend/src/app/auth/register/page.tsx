"use client";
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from "@/store/authStore";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function RegisterForm() {
  const searchParams = useSearchParams();
  const defaultType  = searchParams.get("type") || "student";
  const refCode      = searchParams.get("ref")  || "";
  const { t, lang, toggle } = useLang();
  const a  = t.auth;
  const l  = t.landing;
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const gateways = [
    { value: "student",     label: a.studentLabel,     desc: a.studentDesc,     icon: '\u{1F393}' },
    { value: "agency",      label: a.agencyLabel,      desc: a.agencyDesc,      icon: '\u{1F3E2}' },
    { value: "institution", label: a.institutionLabel, desc: a.institutionDesc, icon: '\u{1F3EB}' },
    { value: "affiliate",   label: a.affiliateLabel,   desc: a.affiliateDesc,   icon: '\u{1F4BC}' },
  ];

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", password_confirmation: "",
    gateway_type: defaultType, affiliate_code: refCode,
    affiliate_type: "" as "" | "local" | "global",
  });
  const [agreedTerms, setAgreedTerms]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [error, setError]               = useState("");
  const { register, isLoading }         = useAuthStore();
  const router                          = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8)                                         { setError(a.passwordTooShort);  return; }
    if (form.password !== form.password_confirmation)                     { setError(a.passwordMismatch);   return; }
    if (!agreedTerms)                                                     { setError(a.agreeTermsRequired); return; }
    if (form.gateway_type === 'affiliate' && !form.affiliate_type)        { setError(ja ? 'アフィリエイトタイプを選択してください。' : bn ? 'অ্যাফিলিয়েট ধরন বেছে নিন।' : 'Please select your affiliate type.'); return; }
    try {
      await register(form);
      router.push(`/auth/verify-email?email=${encodeURIComponent(form.email)}&gateway=${form.gateway_type}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errors = axiosErr.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(" ") : axiosErr.response?.data?.message || a.registrationFailed);
    }
  };

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  const TRUST_POINTS = [
    {
      icon: '🔒',
      title: ja ? 'OCRロック書類' : bn ? 'OCR-লকড ডকুমেন্ট' : 'OCR-Locked Documents',
      desc: ja ? 'アップロード後に改ざん不可' : bn ? 'আপলোডের পর টেম্পার-প্রুফ' : 'Tamper-proof once uploaded',
    },
    {
      icon: '🤖',
      title: ja ? 'AI適格性スコア' : bn ? 'AI যোগ্যতা স্কোর' : 'AI Eligibility Score',
      desc: ja ? '自動計算・機関と即座にマッチング' : bn ? 'স্বয়ংক্রিয় স্কোর ও ম্যাচিং' : 'Auto-scored, matched with institutions',
    },
    {
      icon: '💰',
      title: ja ? 'エスクロー決済保護' : bn ? 'এসক্রো পেমেন্ট সুরক্ষা' : 'Escrow Payment Protection',
      desc: ja ? '入学確定後にのみ費用が支払われる' : bn ? 'ভর্তি নিশ্চিতের পরেই ফি প্রদান' : 'Fees only released on confirmed placement',
    },
    {
      icon: '🌐',
      title: ja ? '完全な透明性' : bn ? 'সম্পূর্ণ স্বচ্ছতা' : 'Full Transparency',
      desc: ja ? 'すべてのステップが正式に記録・監査可能' : bn ? 'প্রতিটি ধাপ আনুষ্ঠানিকভাবে রেকর্ড ও যাচাইযোগ্য' : 'Every step formally recorded and auditable',
    },
  ];

  return (
    <div className="min-h-screen flex">

      {/* ── Left: Brand panel (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] xl:w-[480px] bg-[#0d1117] px-10 py-10 relative overflow-hidden shrink-0">
        {/* Ambient glow */}
        <div className="absolute top-[20%] left-[-30%] w-80 h-80 bg-green-600/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-20%] w-60 h-60 bg-cyan-500/8 rounded-full blur-[80px] pointer-events-none" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.018] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 mb-14">
            <Image src="/tensai-logo.png" alt="Tensai" width={36} height={36} className="rounded-full object-contain" />
            <div>
              <div className="text-base font-bold text-white tracking-tight leading-none">Tensai</div>
              <div className="text-[9px] text-white/35 tracking-wider leading-none mt-0.5 uppercase">The Way of Global Career</div>
            </div>
          </Link>

          <div className="mb-10">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] font-semibold px-3 py-1 rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
              {ja ? '現在受付中' : bn ? 'এখন নিবন্ধন চলছে' : 'Now accepting registrations'}
            </div>
            <h2 className="text-2xl font-black text-white leading-tight mb-3">
              {ja ? '信頼された\nエコシステムに\n参加する' : bn ? 'বিশ্বস্ত\nইকোসিস্টেমে\nযোগ দিন' : 'Join the\nverified\necosystem'}
            </h2>
            <p className="text-white/45 text-sm leading-relaxed">
              {ja
                ? '詐欺ゼロ、完全透明、AI検証済みのグローバル留学インフラ。'
                : bn
                ? 'প্রতারণামুক্ত, সম্পূর্ণ স্বচ্ছ, AI যাচাইকৃত — বৈশ্বিক শিক্ষা অবকাঠামো।'
                : 'Zero fraud, full transparency, AI-verified — global education infrastructure.'}
            </p>
          </div>

          <ul className="space-y-4">
            {TRUST_POINTS.map((p) => (
              <li key={p.title} className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-base shrink-0">{p.icon}</span>
                <div>
                  <p className="text-white text-sm font-semibold leading-tight">{p.title}</p>
                  <p className="text-white/38 text-xs mt-0.5 leading-relaxed">{p.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <div className="border-t border-white/[0.07] pt-5 flex items-center gap-3">
            <div className="flex -space-x-2">
              {['R','K','Y','S'].map((l, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500/30 to-cyan-500/20 border-2 border-[#0d1117] flex items-center justify-center text-[10px] font-bold text-green-300">
                  {l}
                </div>
              ))}
            </div>
            <p className="text-white/38 text-xs leading-snug">
              {ja ? '信頼されたプラットフォームに参加' : bn ? 'বিশ্বস্ত প্ল্যাটফর্মে যোগ দিন' : 'Join a trusted platform'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center px-4 py-10 overflow-y-auto">

      {/* Logo (mobile only) */}
      <Link href="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
        <Image src="/tensai-logo.png" alt="Tensai" width={40} height={40} className="rounded-full object-contain" />
        <div>
          <div className="text-xl font-black text-green-800 tracking-tight leading-none">Tensai</div>
          <div className="text-[9px] text-slate-400 tracking-widest mt-0.5 uppercase">The Way of Global Career</div>
        </div>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <Link href="/auth/login" className="flex-1 py-3.5 text-center text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">{a.signIn}</Link>
          <div className="flex-1 py-3.5 text-center text-sm font-semibold text-green-700 border-b-2 border-green-600">{a.createAccount}</div>
        </div>

        <div className="p-7">
          {/* Header */}
          <div className="mb-5">
            <h1 className="text-lg font-black text-slate-900">{a.createAccount}</h1>
            <p className="text-slate-400 text-xs mt-1">
              {ja ? '数分で完了します' : bn ? 'কয়েক মিনিটেই সম্পন্ন হবে' : 'Takes just a few minutes'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{error}</div>
          )}

          {/* Gateway selector */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-slate-700 mb-2.5">{a.iAm}</p>
            <div className="grid grid-cols-2 gap-2">
              {gateways.map((g) => (
                <button key={g.value} type="button"
                  onClick={() => setForm(f => ({ ...f, gateway_type: g.value, affiliate_type: '' }))}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    form.gateway_type === g.value
                      ? 'border-green-500 bg-green-50 text-green-800 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg block mb-1">{g.icon}</span>
                  <div className="font-semibold text-xs">{g.label}</div>
                  <div className="text-[11px] opacity-70 leading-tight mt-0.5">{g.desc}</div>
                </button>
              ))}
            </div>

          {/* Affiliate sub-type selector — shown only when Affiliate is selected */}
          {form.gateway_type === 'affiliate' && (
            <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-xs font-semibold text-slate-600 mb-2.5">
                {ja ? 'アフィリエイトタイプを選択' : bn ? 'অ্যাফিলিয়েট ধরন বেছে নিন' : 'Choose your affiliate type'} <span className="text-red-400">*</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, affiliate_type: 'local' }))}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    form.affiliate_type === 'local'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="text-lg block mb-1">🎓</span>
                  <div className="font-semibold">
                    {ja ? 'ローカル' : bn ? 'লোকাল' : 'Local'}
                  </div>
                  <div className="text-[11px] opacity-70 leading-tight mt-0.5">
                    {ja ? '学生を紹介・固定報酬' : bn ? 'শিক্ষার্থী রেফার করুন' : 'Refer students, earn fixed fee'}
                  </div>
                </button>
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, affiliate_type: 'global' }))}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    form.affiliate_type === 'global'
                      ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="text-lg block mb-1">🌐</span>
                  <div className="font-semibold">
                    {ja ? 'グローバル' : bn ? 'গ্লোবাল' : 'Global'}
                  </div>
                  <div className="text-[11px] opacity-70 leading-tight mt-0.5">
                    {ja ? '機関・従業員を管理・%報酬' : bn ? 'প্রতিষ্ঠান ম্যানেজ করুন' : 'Manage institutions, earn % fee'}
                  </div>
                </button>
              </div>
            </div>
          )}
          {/* Referral code captured silently from ?ref= URL param — no visible input */}
          {form.affiliate_code && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-xl">
              <span className="text-green-600 text-sm">🔗</span>
              <p className="text-xs text-green-700 font-medium">
                {ja ? '紹介リンクから登録しています' : bn ? 'রেফারেল লিংক থেকে নিবন্ধন করছেন' : 'Registering via referral link'}
              </p>
            </div>
          )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">{a.fullName}</label>
              <input type="text" placeholder={a.fullName} required value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
            </div>
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">{a.emailAddress}</label>
              <input type="email" placeholder="you@example.com" required value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
            </div>
            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {a.phone} <span className="text-slate-400 font-normal">({ja ? '任意' : bn ? 'ঐচ্ছিক' : 'optional'})</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-sm text-slate-500 font-medium shrink-0">+88</span>
                <input type="tel" placeholder="01XXXXXXXXX"
                  value={form.phone.replace(/^\+88/, '')}
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value ? `+88${e.target.value.replace(/^\+88/, '')}` : '' }))}
                  className="flex-1 border border-slate-200 rounded-r-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-slate-400" />
              </div>
            </div>
            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {a.password} <span className="text-slate-400 font-normal">({ja ? '8文字以上' : bn ? 'কমপক্ষে ৮ অক্ষর' : 'min 8 chars'})</span>
              </label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" required
                  value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2.5 pr-11 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? (ja ? 'パスワードを隠す' : bn ? 'পাসওয়ার্ড লুকান' : 'Hide password') : (ja ? 'パスワードを表示' : bn ? 'পাসওয়ার্ড দেখুন' : 'Show password')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 rounded">
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">{a.confirmPassword}</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} placeholder="••••••••" required
                  value={form.password_confirmation} onChange={(e) => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
                  className="w-full px-4 py-2.5 pr-11 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  aria-label={showConfirm ? (ja ? 'パスワードを隠す' : bn ? 'পাসওয়ার্ড লুকান' : 'Hide password') : (ja ? 'パスワードを表示' : bn ? 'পাসওয়ার্ড দেখুন' : 'Show password')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 rounded">
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-green-700 shrink-0" />
              <span className="text-xs text-slate-500 leading-relaxed">
                {a.agreeTerms}{' '}
                <Link href="/terms" target="_blank" className="text-green-700 hover:underline">{l.terms}</Link>
                {' & '}
                <Link href="/privacy" target="_blank" className="text-green-700 hover:underline">{l.privacy}</Link>
              </span>
            </label>

            <button type="submit" disabled={isLoading}
              className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-green-700/20 mt-1">
              {isLoading ? a.creatingAccount : a.createAccount}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            {a.alreadyRegistered}{' '}
            <Link href="/auth/login" className="text-green-700 font-semibold hover:underline">{a.signInLink}</Link>
          </p>
        </div>
      </div>

      {/* Footer row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-6">
        <button onClick={toggle} className="text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200 text-slate-500 hover:border-green-300 hover:text-green-700 transition-colors">
          {lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English'}
        </button>
        <span className="text-slate-300 text-xs">·</span>
        <Link href="/terms"   className="text-[11px] text-slate-400 hover:underline">{l.terms}</Link>
        <Link href="/privacy" className="text-[11px] text-slate-400 hover:underline">{l.privacy}</Link>
        <span className="text-[11px] text-slate-400">{l.footer}</span>
      </div>

      </div>{/* end right panel */}
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
