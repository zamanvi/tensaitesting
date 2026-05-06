'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import Link from 'next/link';

export default function StudentDashboard() {
  const { t } = useLang();
  const s = t.studentDash;

  const STEPS = [
    { label: s.uploadPassport, desc: s.uploadPassportDesc, href: '/dashboard/student/profile/documents', icon: '🪪' },
    { label: s.academicDocs, desc: s.academicDocsDesc, href: '/dashboard/student/profile/documents', icon: '📚' },
    { label: s.languageScores, desc: s.languageScoresDesc, href: '/dashboard/student/profile/documents', icon: '🗣️' },
    { label: s.profileVerified, desc: s.profileVerifiedDesc, href: '#', icon: '✅' },
  ];

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
        <StatCard label={s.profileScore} value="0%" sub={s.profileScoreSub} color="indigo" />
        <StatCard label={s.applications} value="0" sub={s.applicationsSub} color="emerald" />
        <StatCard label={s.interviews} value="0" sub={s.interviewsSub} color="amber" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 mb-5 sm:mb-6">
        <h2 className="font-bold text-slate-900 mb-4">{s.completeProfile}</h2>
        <div className="space-y-2 sm:space-y-3">
          {STEPS.map((step) => (
            <Link key={step.label} href={step.href}
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-slate-100 rounded-xl hover:border-indigo-200 transition-colors group"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center text-base sm:text-lg group-hover:bg-indigo-50 shrink-0">
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 text-sm">{step.label}</div>
                <div className="text-xs text-slate-500 truncate">{step.desc}</div>
              </div>
              <span className="text-xs text-indigo-600 font-medium group-hover:underline shrink-0">{s.start}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Link href="/dashboard/student/leads" className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-indigo-200 transition-all">
          <div className="text-2xl mb-2">📋</div>
          <div className="font-semibold text-sm">{s.myApplications}</div>
          <div className="text-xs text-slate-500 mt-1">{s.myApplicationsSub}</div>
        </Link>
        <Link href="/dashboard/student/interviews" className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-indigo-200 transition-all">
          <div className="text-2xl mb-2">🎙️</div>
          <div className="font-semibold text-sm">{s.interviews}</div>
          <div className="text-xs text-slate-500 mt-1">{s.upcomingPast}</div>
        </Link>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <div className={`rounded-2xl p-4 sm:p-5 ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="font-semibold text-sm mt-1">{label}</div>
      <div className="text-xs opacity-70 mt-0.5">{sub}</div>
    </div>
  );
}
