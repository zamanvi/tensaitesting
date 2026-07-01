'use client';
import { useEffect } from 'react';
import AgencyLayout from '@/components/shared/AgencyLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Application {
  id: number;
  application_code: string;
  student_name: string;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  form_template?: { country?: string };
  created_at: string;
}

const STATUS_BADGE: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-500',
  submitted: 'bg-amber-100 text-amber-700',
  accepted:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-rose-100 text-rose-600',
};

export default function AgencyDashboard() {
  const { t, lang } = useLang();
  const a = t.agencyDash;
  const ja = lang === 'ja';
  const bn = lang === 'bn';
  const { user } = useAuthStore();
  const router = useRouter();
  const isAgency = user?.gateway_type === 'agency';

  useEffect(() => {
    if (user && !isAgency) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isAgency, router]);

  const { data: agencyProfile } = useQuery({
    queryKey: ['agency-profile'],
    queryFn: () => api.get('/agency/profile').then(r => r.data.profile),
    enabled: !!isAgency,
  });

  const { data: appsData, isLoading } = useQuery<{ data: Application[] }>({
    queryKey: ['agency-applications'],
    queryFn: () => api.get('/applications').then(r => r.data),
    staleTime: 60_000,
    enabled: !!isAgency,
  });

  if (!user || !isAgency) return null;

  const apps = appsData?.data ?? [];
  const total     = apps.length;
  const active    = apps.filter(a => a.status === 'submitted').length;
  const accepted  = apps.filter(a => a.status === 'accepted').length;

  const STATS = [
    {
      label: ja ? '合計申請' : bn ? 'মোট আবেদন' : 'Total Applications',
      value: isLoading ? '…' : String(total),
      icon: '📋',
      href: '/dashboard/agency/applicants',
    },
    {
      label: ja ? '提出済み' : bn ? 'সাবমিট হয়েছে' : 'Submitted',
      value: isLoading ? '…' : String(active),
      icon: '👥',
      href: '/dashboard/agency/applicants',
    },
    {
      label: ja ? '承認済み' : bn ? 'অনুমোদিত' : 'Accepted',
      value: isLoading ? '…' : String(accepted),
      icon: '✅',
      href: '/dashboard/agency/applicants',
    },
  ];

  // Profile status banner config
  const profileBanners: Record<string, { bg: string; icon: string; title: string; desc: string; cta?: string }> = {
    none:         { bg: 'bg-amber-50 border-amber-300',   icon: '📋', title: ja ? 'プロフィールを完成させてください' : bn ? 'প্রোফাইল পূরণ করুন' : 'Complete Your Agency Profile', desc: ja ? 'プラットフォームへのフルアクセスには審査が必要です。' : bn ? 'সম্পূর্ণ অ্যাক্সেসের জন্য প্রোফাইল জমা দিন।' : 'Submit your profile for admin review to unlock full platform access.', cta: ja ? 'プロフィールを設定する →' : bn ? 'প্রোফাইল সেটআপ করুন →' : 'Set Up Profile →' },
    pending:      { bg: 'bg-blue-50 border-blue-200',     icon: '⏳', title: ja ? 'プロフィール審査中' : bn ? 'প্রোফাইল যাচাই হচ্ছে' : 'Profile Under Review', desc: ja ? '管理者が確認中です。通常24〜48時間かかります。' : bn ? 'অ্যাডমিন যাচাই করছেন। ২৪-৪৮ ঘন্টা লাগে।' : 'Admin is reviewing your profile. Usually takes 24–48 hours.' },
    under_review: { bg: 'bg-purple-50 border-purple-200', icon: '🔍', title: ja ? '詳細審査中' : bn ? 'বিস্তারিত যাচাই চলছে' : 'Detailed Review In Progress', desc: ja ? '追加確認が行われています。' : bn ? 'আরও যাচাই চলছে।' : 'Additional verification in progress. You will be contacted soon.' },
    rejected:     { bg: 'bg-red-50 border-red-200',       icon: '❌', title: ja ? '審査が却下されました' : bn ? 'প্রোফাইল প্রত্যাখ্যাত' : 'Profile Rejected', desc: agencyProfile?.rejection_reason ?? (ja ? 'サポートにお問い合わせください。' : bn ? 'সাপোর্টে যোগাযোগ করুন।' : 'Contact support for details.'), cta: ja ? 'プロフィールを修正して再提出 →' : bn ? 'প্রোফাইল সংশোধন করুন →' : 'Revise & Resubmit →' },
  };

  const profileStatus = !agencyProfile ? 'none' : agencyProfile.vetting_status;
  const banner = profileStatus !== 'approved' ? profileBanners[profileStatus] : null;

  return (
    <AgencyLayout>
      {/* Profile status banner */}
      {banner && (
        <div className={`rounded-2xl border p-4 mb-5 flex items-start justify-between gap-3 ${banner.bg}`}>
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">{banner.icon}</span>
            <div>
              <p className="font-bold text-sm text-slate-900">{banner.title}</p>
              <p className="text-xs text-slate-600 mt-0.5">{banner.desc}</p>
            </div>
          </div>
          {banner.cta && (
            <Link href="/dashboard/agency/profile" className="shrink-0 text-xs font-bold text-green-700 hover:text-green-800 whitespace-nowrap">
              {banner.cta}
            </Link>
          )}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div />
        <Link
          href="/dashboard/agency/applicants"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-green-700/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {ja ? '新規申請' : bn ? 'নতুন আবেদন' : '+ Add Applicant'}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {STATS.map(s => (
          <Link key={s.label} href={s.href}
            className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-green-200 hover:shadow-md transition-all">
            <div className="text-xl mb-2">{s.icon}</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1 leading-tight">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent Applications preview */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900 text-sm">
            {ja ? '最近の申請' : bn ? 'সাম্প্রতিক আবেদন' : 'Recent Applications'}
          </h2>
          <Link href="/dashboard/agency/applicants"
            className="text-xs text-green-700 hover:underline font-semibold">
            {t.common.viewAll}
          </Link>
        </div>

        {isLoading ? (
          <div className="py-6 flex justify-center">
            <span className="w-6 h-6 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : apps.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-400">
              {ja ? 'まだ申請がありません' : bn ? 'এখনো কোনো আবেদন নেই' : 'No applications yet.'}
            </p>
            <Link href="/dashboard/agency/applicants"
              className="mt-3 inline-block text-xs font-semibold text-green-700 hover:text-green-800">
              {ja ? '最初の申請を作成 →' : bn ? 'প্রথম আবেদন তৈরি করুন →' : 'Create your first application →'}
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {apps.slice(0, 5).map(app => (
              <Link key={app.id} href="/dashboard/agency/applicants"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-white flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{app.student_name}</p>
                  <p className="text-[11px] text-slate-400">
                    {app.form_template?.country ?? '—'} · <span className="font-mono">{app.application_code}</span>
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[app.status] ?? 'bg-slate-100 text-slate-500'}`}>
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </span>
              </Link>
            ))}
            {apps.length > 5 && (
              <p className="text-xs text-slate-400 text-center pt-1">
                +{apps.length - 5} {ja ? 'more' : bn ? 'আরো' : 'more'}
              </p>
            )}
          </div>
        )}
      </div>
    </AgencyLayout>
  );
}
