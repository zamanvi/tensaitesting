'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useQueries } from '@tanstack/react-query';
import Link from 'next/link';

export default function StudentDashboard() {
  const { t, lang } = useLang();
  const { user } = useAuthStore();
  const s = t.studentDash;

  const [profileQ, leadsQ, interviewsQ] = useQueries({
    queries: [
      { queryKey: ['student-profile'], queryFn: () => api.get('/student/profile').then(r => r.data), staleTime: 60_000 },
      { queryKey: ['student-leads'], queryFn: () => api.get('/student/leads').then(r => r.data), staleTime: 30_000 },
      { queryKey: ['student-interviews'], queryFn: () => api.get('/student/interviews').then(r => r.data), staleTime: 30_000 },
    ],
  });

  const profileScore = profileQ.data?.eligibility_score ?? profileQ.data?.student_profile?.eligibility_score ?? 0;
  const leadsCount = leadsQ.data?.total ?? leadsQ.data?.meta?.total ?? (Array.isArray(leadsQ.data?.data) ? leadsQ.data.data.length : 0);
  const interviewsArr = Array.isArray(interviewsQ.data?.data) ? interviewsQ.data.data : Array.isArray(interviewsQ.data) ? interviewsQ.data : [];
  const interviewsCount = interviewsArr.length;

  const STEPS = [
    { label: lang === 'bn' ? 'কাগজপত্র আপলোড' : lang === 'ja' ? '書類をアップロード' : 'Upload Documents', desc: lang === 'bn' ? 'পাসপোর্ট, NID, সার্টিফিকেট ও ভাষা সার্টিফিকেট আপলোড করুন' : lang === 'ja' ? 'パスポート、NID、証明書、語学証明書をアップロード' : 'Upload your passport, NID, certificates and language documents', href: '/dashboard/student/profile/documents', icon: '📄' },
  ];

  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <DashboardLayout>
      {firstName && (
        <p className="text-slate-500 text-sm mb-5">
          {lang === 'bn' ? 'স্বাগতম, ' : lang === 'ja' ? 'おかえりなさい、' : 'Welcome back, '}
          <span className="font-semibold text-slate-800">{firstName}</span>
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
        <StatCard label={s.profileScore} value={`${profileScore}%`} sub={s.profileScoreSub} color="green" loading={profileQ.isLoading} />
        <StatCard label={s.applications} value={String(leadsCount)} sub={s.applicationsSub} color="emerald" loading={leadsQ.isLoading} />
        <StatCard label={s.interviews} value={String(interviewsCount)} sub={s.interviewsSub} color="amber" loading={interviewsQ.isLoading} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 mb-5 sm:mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900">{s.completeProfile}</h2>
          <span className="text-xs text-slate-400 font-medium">{profileScore}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(profileScore, 100)}%` }}
          />
        </div>
        <div className="space-y-2 sm:space-y-3">
          {STEPS.map((step) => (
            <Link key={step.label} href={step.href}
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-slate-100 rounded-xl hover:border-green-200 transition-colors group"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center text-base sm:text-lg group-hover:bg-green-50 shrink-0">
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 text-sm">{step.label}</div>
                <div className="text-xs text-slate-500 line-clamp-2">{step.desc}</div>
              </div>
              <span className="text-xs text-green-700 font-medium group-hover:underline shrink-0">{s.start}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Fill-up Information (separate section below Upload Documents) ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 mb-5 sm:mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-900">
              {lang === 'bn' ? 'তথ্য পূরণ' : lang === 'ja' ? '情報入力' : 'Fill-up Information'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'bn' ? 'ব্যক্তিগত, পরিবার, শিক্ষা ও জাপান সম্পর্কিত তথ্য' : lang === 'ja' ? '個人・家族・学歴・日本関連情報' : 'Personal, family, education & Japan-related details'}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/student/profile/info"
          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-slate-100 rounded-xl hover:border-green-200 transition-colors group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center text-base sm:text-lg group-hover:bg-green-50 shrink-0">
            📝
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-900 text-sm">
              {lang === 'bn' ? 'তথ্য পূরণ করুন' : lang === 'ja' ? '情報を入力する' : 'Fill-up Info'}
            </div>
            <div className="text-xs text-slate-500 line-clamp-2">
              {lang === 'bn' ? 'আপনার সমস্ত ব্যক্তিগত ও শিক্ষাগত তথ্য পূরণ করুন' : lang === 'ja' ? 'すべての個人情報と学歴を入力してください' : 'Complete all your personal and educational information'}
            </div>
          </div>
          <span className="text-xs text-green-700 font-medium group-hover:underline shrink-0">{s.start}</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link href="/dashboard/student/profile" className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-green-200 transition-all">
          <div className="text-2xl mb-2">👤</div>
          <div className="font-semibold text-sm">{t.nav.profile}</div>
          <div className="text-xs text-slate-500 mt-1">{lang === 'bn' ? 'যোগাযোগ, ঠিকানা ও তথ্য' : lang === 'ja' ? '連絡先・住所・情報' : 'Contact, address & info'}</div>
        </Link>
        <Link href="/dashboard/student/profile/info" className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-green-200 transition-all">
          <div className="text-2xl mb-2">📝</div>
          <div className="font-semibold text-sm">{lang === 'bn' ? 'তথ্য পূরণ' : lang === 'ja' ? '情報入力' : 'Fill-up Info'}</div>
          <div className="text-xs text-slate-500 mt-1">{lang === 'bn' ? 'ব্যক্তিগত ও শিক্ষাগত তথ্য' : lang === 'ja' ? '個人・学歴情報' : 'Personal & education details'}</div>
        </Link>
        <Link href="/dashboard/student/leads" className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-green-200 transition-all">
          <div className="text-2xl mb-2">📋</div>
          <div className="font-semibold text-sm">{s.myApplications}</div>
          <div className="text-xs text-slate-500 mt-1">{s.myApplicationsSub}</div>
        </Link>
        <Link href="/dashboard/student/interviews" className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-green-200 transition-all">
          <div className="text-2xl mb-2">🎙️</div>
          <div className="font-semibold text-sm">{s.interviews}</div>
          <div className="text-xs text-slate-500 mt-1">{s.upcomingPast}</div>
        </Link>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, sub, color, loading }: { label: string; value: string; sub: string; color: string; loading?: boolean }) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 text-green-800',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <div className={`rounded-2xl p-4 sm:p-5 ${colors[color]}`}>
      <div className="text-2xl font-bold">{loading ? '…' : value}</div>
      <div className="font-semibold text-sm mt-1">{label}</div>
      <div className="text-xs opacity-70 mt-0.5">{sub}</div>
    </div>
  );
}
