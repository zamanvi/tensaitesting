"use client";
import { useAuthStore } from "@/store/authStore";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function BranchLoginInner() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const branchName = searchParams.get("branch") ?? "Tensai Branch";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(username, password);
      router.push("/dashboard/branch");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message ?? "Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* LEFT: Dark brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] xl:w-[480px] bg-[#0d1117] px-10 py-10 relative overflow-hidden shrink-0">

        {/* Ambient glow orbs */}
        <div className="absolute top-[-80px] left-[-60px] w-[320px] h-[320px] rounded-full bg-green-500/10 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-60px] right-[-40px] w-[260px] h-[260px] rounded-full bg-cyan-500/8 blur-[80px] pointer-events-none" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Top: logo + welcome */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 mb-10">
            <Image src="/tensai-logo.png" alt="Tensai" width={40} height={40} className="rounded-full object-contain" />
            <div>
              <div className="text-xl font-black text-white tracking-tight leading-none">Tensai</div>
              <div className="text-[9px] text-slate-500 tracking-widest uppercase mt-0.5">The Way of Global Career</div>
            </div>
          </Link>

          {/* Welcome badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Branch Portal</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight mb-3">
            Welcome to<br />
            <span className="text-green-400">{branchName}</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Sign in with your manager credentials to access the branch dashboard.
          </p>

          {/* Divider */}
          <div className="mt-8 border-t border-white/5 pt-8 space-y-4">
            {[
              { icon: '📋', text: 'Manage student applications' },
              { icon: '👥', text: 'Track your team members' },
              { icon: '📊', text: 'View real-time statistics' },
              { icon: '⚙️', text: 'Update branch information' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-base leading-none shrink-0">{item.icon}</span>
                <span className="text-sm text-slate-300">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-xs text-slate-600">
            © 2026 Tensai. Branch Manager Portal.
          </p>
        </div>
      </div>

      {/* RIGHT: Form panel */}
      <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center px-4 py-10 overflow-y-auto">

        {/* Mobile-only logo */}
        <Link href="/" className="flex lg:hidden items-center gap-2.5 mb-6">
          <Image src="/tensai-logo.png" alt="Tensai" width={36} height={36} className="rounded-full object-contain" />
          <div>
            <div className="text-lg font-black text-green-800 tracking-tight leading-none">Tensai</div>
            <div className="text-[9px] text-slate-400 tracking-widest mt-0.5 uppercase">Branch Portal</div>
          </div>
        </Link>

        {/* Mobile welcome banner */}
        <div className="lg:hidden w-full max-w-md mb-5 p-4 bg-green-700 rounded-2xl text-white text-center">
          <p className="text-xs text-green-200 mb-0.5">Welcome to</p>
          <p className="text-lg font-black">{branchName}</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Card header — no tabs */}
          <div className="px-7 pt-7 pb-5 border-b border-slate-50">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-green-600 uppercase tracking-widest">Branch Manager</span>
            </div>
            <h1 className="text-xl font-black text-slate-900">Sign in to your account</h1>
            <p className="text-slate-400 text-xs mt-1">
              Use your manager name and password
            </p>
          </div>

          <div className="p-7">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Manager Name</label>
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  placeholder="Enter your manager name"
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none">
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

              <button type="submit" disabled={isLoading}
                className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-green-700/20 mt-2">
                {isLoading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              Contact your system admin if you need help accessing your account.
            </p>
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link href="/auth/login" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            ← Student / Agency login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BranchLoginPage() {
  return (
    <Suspense>
      <BranchLoginInner />
    </Suspense>
  );
}
