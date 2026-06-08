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
  const a = t.auth;
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  /* Fix: use proper emoji literals — not mojibake */
  const gateways = [
    { value: "student",     label: a.studentLabel,     desc: a.studentDesc,     icon: '🎓' },
    { value: "agency",      label: a.agencyLabel,      desc: a.agencyDesc,      icon: '🏢' },
    { value: "institution", label: a.institutionLabel, desc: a.institutionDesc, icon: '🏫' },
    { value: "affiliate",   label: a.affiliateLabel,   desc: a.affiliateDesc,   icon: '💼' },
  ];

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", password_confirmation: "",
    gateway_type: defaultType, affiliate_code: refCode,
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
    if (form.password.length < 8)                        { setError(a.passwordTooShort); return; }
    if (form.password !== form.password_confirmation)    { setError(a.passwordMismatch);  return; }
    if (!agreedTerms)                                    { setError(a.agreeTermsRequired); return; }
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

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — dark branding ───────────────────── */}
      <div className="hidden lg:flex lg:w-[38%] bg-[#0d1117] flex-col justify-between p-10 relative overflow-hidden shrink-0">
        <div className="absolute top-[15%] left-[5%]  w-80 h-80 bg-green-600/12 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[0%] w-60 h-60 bg-cyan-500/7  rounded-full blur-[80px]  pointer-events-none" />

        <Link href="/" className="flex items-center gap-3 relative z-10">
          <Image src="/tensai-logo.png" alt="Tensai" width={40} height={40} className="rounded-full object-contain" />
          <div>
            <div className="text-lg font-bold text-white tracking-tight leading-none">Tensai</div>
            <div className="text-[9px] text-white/35 tracking-wider mt-0.5">THE WAY OF GLOBAL CAREER</div>
          </div>
        </Link>

        <div className="relative z-10 space-y-5">
          <div>
            <h2 className="text-fluid-3xl font-black text-white leading-tight mb-3">
              {ja ? '今日から始めよう' : bn ? 'আজই শুরু করুন' : 'Join Tensai today'}
            </h2>
            <p className="text-white/45 text-sm leading-relaxed">
              {ja
                ? '4つのゲートウェイから選択し、数分でアカウントを作成。日本への扉が開きます。'
                : bn
                ? '৪টি গেটওয়ে থেকে বেছে নিন এবং মিনিটের মধ্যে অ্যাকাউন্ট তৈরি করুন।'
                : 'Choose your gateway, create your account in minutes, and start your verified journey to Japan.'}
            </p>
          </div>

          {/* Gateway preview */}
          <div className="space-y-2">
            {gateways.map((g) => (
              <div
                key={g.value}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all ${
                  form.gateway_type === g.value
                    ? 'bg-green-500/12 border border-green-500/25'
                    : 'opacity-40'
                }`}
              >
                <span className="text-lg">{g.icon}</span>
                <span className="text-white text-xs font-semibold">{g.label}</span>
              </div>
            ))}
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2.5 text-xs text-white/38">
            <span className="mt-0.5">🔒</span>
            <span>
              {ja
                ? 'すべてのデータはAES-256で暗号化。書類はOCRでロック。'
                : bn
                ? 'সব তথ্য AES-256 এনক্রিপ্টেড। কাগজপত্র OCR লকড।'
                : 'All data AES-256 encrypted. Documents OCR-locked on verification.'}
            </span>
          </div>
        </div>

        <p className="relative z-10 text-white/18 text-[10px]">{`© 2026 Tensai. All rights reserved.`}</p>
      </div>

      {/* ── Right panel — form ───────────────────────────── */}
      <div className="flex-1 bg-slate-50 flex items-start justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-3 mb-7 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/tensai-logo.png" alt="Tensai" width={38} height={38} className="rounded-full object-contain" />
              <span className="text-xl font-bold text-green-800">Tensai</span>
            </Link>
            <button onClick={toggle} className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-800 transition-colors">
              {lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English'}
            </button>
          </div>

          {/* Desktop lang toggle */}
          <div className="hidden lg:flex justify-end mb-5">
            <button onClick={toggle} className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-500 hover:border-green-300 hover:text-green-800 transition-colors">
              {lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English'}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Tab switcher */}
            <div className="flex border-b border-slate-100">
              <Link href="/auth/login" className="flex-1 py-3.5 text-center text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">{a.signIn}</Link>
              <div className="flex-1 py-3.5 text-center text-sm font-semibold text-green-700 border-b-2 border-green-600">{a.createAccount}</div>
            </div>

            <div className="p-7">
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
                <p className="text-xs font-semibold text-slate-600 mb-2.5">{a.iAm}</p>
                <div className="grid grid-cols-2 gap-2">
                  {gateways.map((g) => (
                    <button key={g.value} type="button"
                      onClick={() => setForm(f => ({ ...f, gateway_type: g.value }))}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        form.gateway_type === g.value
                          ? 'border-green-500 bg-green-50 text-green-800 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg block mb-1">{g.icon}</span>
                      <div className="font-semibold text-[11px]">{g.label}</div>
                      <div className="text-[10px] opacity-60 leading-tight mt-0.5">{g.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{a.fullName}</label>
                  <input type="text" placeholder={a.fullName} required value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
                </div>
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{a.emailAddress}</label>
                  <input type="email" placeholder="you@example.com" required value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
                </div>
                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{a.phone}</label>
                  <input type="tel" placeholder="+8801XXXXXXXXX" value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
                </div>
                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    {a.password} <span className="text-slate-400 font-normal">(min 8)</span>
                  </label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" required
                      value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full px-4 py-2.5 pr-11 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
                    <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
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
                      className="w-full px-4 py-2.5 pr-11 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
                {/* Affiliate code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    {a.affiliateCode} <span className="text-slate-400 font-normal">({ja ? '任意' : bn ? 'ঐচ্ছিক' : 'optional'})</span>
                  </label>
                  <input type="text" placeholder="e.g. TNS-XXXX" value={form.affiliate_code}
                    onChange={(e) => setForm(f => ({ ...f, affiliate_code: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
                </div>

                {/* Terms checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-green-700 shrink-0" />
                  <span className="text-xs text-slate-500 leading-relaxed">
                    {a.agreeTerms}{' '}
                    <Link href="/terms" target="_blank" className="text-green-700 hover:underline">Terms</Link>
                    {' & '}
                    <Link href="/privacy" target="_blank" className="text-green-700 hover:underline">Privacy</Link>
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

          <p className="text-center text-[10px] text-slate-400 mt-4">
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

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
