'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

const STEP_COLORS = [
  'from-indigo-500 to-indigo-600',
  'from-violet-500 to-violet-600',
  'from-blue-500 to-blue-600',
  'from-emerald-500 to-emerald-600',
];

export default function StudentDashboard() {
  const { t } = useLang();
  const { user } = useAuthStore();
  const s = t.studentDash;

  const STEPS = [
    { label: s.uploadPassport, desc: s.uploadPassportDesc, href: '/dashboard/student/profile/documents', icon: '🪪', done: false },
    { label: s.academicDocs, desc: s.academicDocsDesc, href: '/dashboard/student/profile/documents', icon: '📚', done: false },
    { label: s.languageScores, desc: s.languageScoresDesc, href: '/dashboard/student/profile/documents', icon: '🗣️', done: false },
    { label: s.profileVerified, desc: s.profileVerifiedDesc, href: '#', icon: '✅', done: false },
  ];

  const completedSteps = STEPS.filter((s) => s.done).length;
  const progressPct = Math.round((completedSteps / STEPS.length) * 100);

  return (
    <DashboardLayout>
      {/* Welcome hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white rounded-2xl p-6 mb-6">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-1">Student Portal</p>
            <h1 className="text-xl sm:text-2xl font-bold mb-1">
              Welcome, {user?.name?.split(' ')[0] ?? 'Student'} 👋
            </h1>
            <p className="text-indigo-200 text-sm">Complete your profile to get discovered by top institutions.</p>
          </div>
          <Link
            href="/dashboard/student/profile/documents"
            className="shrink-0 bg-white text-indigo-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            Upload Documents →
          </Link>
        </div>

        {/* Progress bar */}
        <div className="relative mt-5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-indigo-200">Profile completion</span>
            <span className="font-bold">{progressPct}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-indigo-200 text-xs mt-1.5">{completedSteps} of {STEPS.length} steps done</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
        <StatCard label={s.profileScore} value={`${progressPct}%`} icon="📊" color="indigo" />
        <StatCard label={s.applications} value="0" icon="📋" color="emerald" />
        <StatCard label={s.interviews} value="0" icon="🎙️" color="amber" />
      </div>

      {/* Profile steps */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 mb-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-slate-900">{s.completeProfile}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Follow steps to get verified</p>
          </div>
          <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
            {completedSteps}/{STEPS.length}
          </span>
        </div>

        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <Link key={step.label} href={step.href}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all group ${
                step.done
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40'
              }`}
            >
              {/* Step number / icon */}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${STEP_COLORS[i]} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}>
                {step.done ? '✓' : i + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm ${step.done ? 'text-emerald-700 line-through' : 'text-slate-900'}`}>
                  {step.label}
                </div>
                <div className="text-xs text-slate-500 truncate mt-0.5">{step.desc}</div>
              </div>

              {step.done ? (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">Done</span>
              ) : (
                <span className="text-xs font-semibold text-indigo-600 group-hover:underline shrink-0">{s.start}</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/student/leads"
          className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-xl mb-3 group-hover:bg-indigo-200 transition-colors">📋</div>
          <div className="font-semibold text-slate-900 text-sm">{s.myApplications}</div>
          <div className="text-xs text-slate-400 mt-1">{s.myApplicationsSub}</div>
        </Link>
        <Link
          href="/dashboard/student/interviews"
          className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-violet-200 hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-xl mb-3 group-hover:bg-violet-200 transition-colors">🎙️</div>
          <div className="font-semibold text-slate-900 text-sm">{s.interviews}</div>
          <div className="text-xs text-slate-400 mt-1">{s.upcomingPast}</div>
        </Link>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
  };
  return (
    <div className={`rounded-2xl p-4 border ${colors[color]}`}>
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs font-medium opacity-75 mt-0.5 leading-tight">{label}</div>
    </div>
  );
}
