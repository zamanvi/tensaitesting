"use client";
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function RegisterForm() {
  const searchParams = useSearchParams();
  const defaultType = searchParams.get("type") || "student";
  const { t, lang, toggle } = useLang();
  const a = t.auth;

  const gateways = [
    { value: "student", label: a.studentLabel, desc: a.studentDesc, icon: "🎓" },
    { value: "agency", label: a.agencyLabel, desc: a.agencyDesc, icon: "🏢" },
    { value: "institution", label: a.institutionLabel, desc: a.institutionDesc, icon: "🌐" },
    { value: "affiliate", label: a.affiliateLabel, desc: a.affiliateDesc, icon: "💼" },
  ];

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", password_confirmation: "",
    gateway_type: defaultType, affiliate_code: "",
  });
  const [error, setError] = useState("");
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.password_confirmation) {
      setError(a.passwordMismatch);
      return;
    }
    try {
      await register(form);
      router.push(`/dashboard/${form.gateway_type}`);
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Link href="/" className="text-2xl font-bold text-indigo-700">Tensai</Link>
            <button
              onClick={toggle}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
            >
              {lang === 'en' ? '日本語' : 'English'}
            </button>
          </div>
          <p className="text-slate-500 mt-2 text-sm">{a.registerTitle}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
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
                  className={`p-3 rounded-xl border text-left text-sm transition-all ${form.gateway_type === g.value ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                >
                  <span className="text-lg">{g.icon}</span>
                  <div className="font-medium mt-1">{g.label}</div>
                  <div className="text-xs opacity-70">{g.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text" placeholder={a.fullName} required
              value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="email" placeholder={a.emailAddress} required
              value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="tel" placeholder={a.phone}
              value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password" placeholder={a.password} required
              value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password" placeholder={a.confirmPassword} required
              value={form.password_confirmation} onChange={(e) => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text" placeholder={a.affiliateCode}
              value={form.affiliate_code} onChange={(e) => setForm(f => ({ ...f, affiliate_code: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit" disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              {isLoading ? a.creatingAccount : a.createAccount}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            {a.alreadyRegistered}{" "}
            <Link href="/auth/login" className="text-indigo-600 font-medium hover:underline">{a.signInLink}</Link>
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
