"use client";
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from "@/store/authStore";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function RegisterForm() {
  const searchParams = useSearchParams();
  const defaultType = searchParams.get("type") || "student";
  const refCode = searchParams.get("ref") || "";
  const { t, lang, toggle } = useLang();
  const a = t.auth;

  const gateways = [
    { value: "student", label: a.studentLabel, desc: a.studentDesc, icon: "ðŸŽ“" },
    { value: "agency", label: a.agencyLabel, desc: a.agencyDesc, icon: "ðŸ¢" },
    { value: "institution", label: a.institutionLabel, desc: a.institutionDesc, icon: "ðŸŒ" },
    { value: "affiliate", label: a.affiliateLabel, desc: a.affiliateDesc, icon: "ðŸ’¼" },
  ];

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", password_confirmation: "",
    gateway_type: defaultType, affiliate_code: refCode,
  });
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError(a.passwordTooShort);
      return;
    }
    if (form.password !== form.password_confirmation) {
      setError(a.passwordMismatch);
      return;
    }
    if (!agreedTerms) {
      setError(a.agreeTermsRequired);
      return;
    }
    try {
      await register(form);
      router.push(`/auth/verify-email?email=${encodeURIComponent(form.email)}&gateway=${form.gateway_type}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errors = axiosErr.response?.data?.errors;
      if (errors) {
        setError(Object.values(errors).flat().join(" "));
      } else {
        setError(axiosErr.response?.data?.message || a.registrationFailed);
      }
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
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
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Tab switcher */}
          <div className="grid grid-cols-2 border-b border-slate-100">
            <Link href="/auth/login" className="py-3.5 text-center text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
              {a.signIn}
            </Link>
            <div className="py-3.5 text-center text-sm font-semibold text-green-700 border-b-2 border-green-600">
              {a.createAccount}
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{error}</div>
            )}

            {/* Gateway selector */}
            <div className="mb-6">
              <p className="text-sm font-medium text-slate-700 mb-3">{a.iAm}</p>
              <div className="grid grid-cols-2 gap-2">
                {gateways.map((g) => (
                  <button key={g.value} type="button"
                    onClick={() => setForm(f => ({ ...f, gateway_type: g.value }))}
                    className={`p-3 rounded-xl border text-left text-sm transition-all ${form.gateway_type === g.value ? "border-green-500 bg-green-50 text-green-800" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                  >
                    <span className="text-lg">{g.icon}</span>
                    <div className="font-medium mt-1">{g.label}</div>
                    <div className="text-xs opacity-70">{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">{a.fullName}</label>
                <input
                  type="text" placeholder={a.fullName} required
                  value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">{a.emailAddress}</label>
                <input
                  type="email" placeholder="you@example.com" required
                  value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">{a.phone}</label>
                <input
                  type="tel" placeholder="+880..."
                  value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">{a.password} <span className="text-slate-400 font-normal">(min 8 chars)</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" required
                    value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">{a.confirmPassword}</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" required
                    value={form.password_confirmation} onChange={(e) => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
                    className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">{a.affiliateCode}</label>
                <input
                  type="text" placeholder="e.g. TNS-XXXX"
                  value={form.affiliate_code} onChange={(e) => setForm(f => ({ ...f, affiliate_code: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Terms checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-green-700 shrink-0"
                />
                <span className="text-xs text-slate-500 leading-relaxed">
                  {a.agreeTerms}{' '}
                  <Link href="/terms" target="_blank" className="text-green-700 hover:underline">Terms</Link>
                  {' & '}
                  <Link href="/privacy" target="_blank" className="text-green-700 hover:underline">Privacy</Link>
                </span>
              </label>

              <button
                type="submit" disabled={isLoading}
                className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                {isLoading ? a.creatingAccount : a.createAccount}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              {a.alreadyRegistered}{' '}
              <Link href="/auth/login" className="text-green-700 font-medium hover:underline">{a.signInLink}</Link>
            </p>
          </div>
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

