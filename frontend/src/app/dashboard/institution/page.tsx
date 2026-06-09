'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useQueries, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InstitutionDashboard() {
  const { t, lang } = useLang();
  const id = t.institutionDash;
  const { user } = useAuthStore();
  const router = useRouter();

  const isInstitution = user?.gateway_type === 'institution';

  // All hooks must be called unconditionally before any early returns
  const { data: instProfile } = useQuery({
    queryKey: ['institution-profile'],
    queryFn: () => api.get('/institution/profile').then(r => r.data.profile),
    enabled: isInstitution,
  });

  const [leadsQ, interviewsQ] = useQueries({
    queries: [
      { queryKey: ['institution-leads'], queryFn: () => api.get('/institution/leads').then(r => r.data), enabled: isInstitution },
      { queryKey: ['institution-interviews'], queryFn: () => api.get('/institution/interviews').then(r => r.data), enabled: isInstitution },
    ],
  });

  useEffect(() => {
    if (user && !isInstitution) {
      router.replace(`/dashboard/${user.gateway_type}`);
    }
  }, [user, isInstitution, router]);

  if (user && !isInstitution) return null;

  const leads = Array.isArray(leadsQ.data?.data) ? leadsQ.data.data : Array.isArray(leadsQ.data) ? leadsQ.data : [];
  const interviews = Array.isArray(interviewsQ.data) ? interviewsQ.data : [];
  const loading = leadsQ.isLoading || interviewsQ.isLoading;

  const shortlisted = leads.filter((l: { status: string }) => l.status === 'shortlisted').length;
  const enrolled = leads.filter((l: { status: string }) => l.status === 'enrolled').length;

  const STATS = [
    { label: id.verifiedCandidates, value: loading ? '…' : String(leads.length), icon: '👨‍🎓' },
    { label: id.shortlisted, value: loading ? '…' : String(shortlisted), icon: '⭐' },
    { label: id.interviews, value: loading ? '…' : String(interviews.length), icon: '📅' },
    { label: id.enrolled, value: loading ? '…' : String(enrolled), icon: '🎓' },
  ];

  const STEPS = [
    { step: '1', title: id.step1Title, desc: id.step1Desc },
    { step: '2', title: id.step2Title, desc: id.step2Desc },
    { step: '3', title: id.step3Title, desc: id.step3Desc },
    { step: '4', title: id.step4Title, desc: id.step4Desc },
  ];

  const profileStatus = !instProfile ? 'none' : instProfile.status;
  const instBanners: Record<string, { bg: string; icon: string; title: string; desc: string; cta?: string }> = {
    none:      { bg: 'bg-indigo-50 border-indigo-200',   icon: '🏫', title: lang === 'ja' ? 'プロフィールを完成させてください' : lang === 'bn' ? 'প্রোফাইল পূরণ করুন' : 'Complete Your Institution Profile', desc: lang === 'ja' ? '管理者の審査を受けて、エージェンシーからの学生申請を受け取りましょう。' : lang === 'bn' ? 'প্রোফাইল জমা দিয়ে অনুমোদন পান এবং এজেন্সি থেকে আবেদন গ্রহণ করুন।' : 'Submit your profile for admin review to start receiving student applications.', cta: lang === 'ja' ? 'プロフィールを設定 →' : lang === 'bn' ? 'প্রোফাইল সেটআপ করুন →' : 'Set Up Profile →' },
    pending:   { bg: 'bg-amber-50 border-amber-200',     icon: '⏳', title: lang === 'ja' ? 'プロフィール審査中' : lang === 'bn' ? 'প্রোফাইল যাচাই হচ্ছে' : 'Profile Under Review', desc: lang === 'ja' ? '管理者がプロフィールを確認しています。通常24〜48時間かかります。' : lang === 'bn' ? 'অ্যাডমিন যাচাই করছেন। সাধারণত ২৪-৪৮ ঘন্টা লাগে।' : 'Admin is reviewing your profile. Usually takes 24–48 hours.' },
    suspended: { bg: 'bg-red-50 border-red-200',         icon: '❌', title: lang === 'ja' ? 'アカウント停止中' : lang === 'bn' ? 'অ্যাকাউন্ট স্থগিত' : 'Account Suspended', desc: lang === 'ja' ? 'サポートにお問い合わせください。' : lang === 'bn' ? 'সাপোর্টে যোগাযোগ করুন।' : 'Contact support for assistance.', cta: lang === 'ja' ? 'プロフィールを確認 →' : lang === 'bn' ? 'প্রোফাইল দেখুন →' : 'View Profile →' },
  };

  const instBanner = profileStatus !== 'active' ? instBanners[profileStatus] : null;

  return (
    <DashboardLayout>
      {instBanner && (
        <div className={`rounded-2xl border p-4 mb-5 flex items-start justify-between gap-3 ${instBanner.bg}`}>
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">{instBanner.icon}</span>
            <div>
              <p className="font-bold text-sm text-slate-900">{instBanner.title}</p>
              <p className="text-xs text-slate-600 mt-0.5">{instBanner.desc}</p>
            </div>
          </div>
          {instBanner.cta && (
            <Link href="/dashboard/institution/profile" className="shrink-0 text-xs font-bold text-indigo-600 hover:text-indigo-800 whitespace-nowrap">
              {instBanner.cta}
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5">
            <div className="text-xl mb-2">{s.icon}</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 mb-5 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="font-bold text-slate-900">{id.browseTitle}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{id.browseSub}</p>
          </div>
          <Link href="/dashboard/institution/browse"
            className="bg-indigo-600 text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors text-center shrink-0"
          >
            {id.browseCta}
          </Link>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <Link href="/dashboard/institution/leads" className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-indigo-200 transition-all">
          <div className="text-2xl mb-2">📋</div>
          <div className="font-semibold text-sm">{lang === 'ja' ? '応募一覧' : lang === 'bn' ? 'আবেদন তালিকা' : 'My Applications'}</div>
          <div className="text-xs text-slate-500 mt-1">{lang === 'ja' ? '割り当てられた学生の申請を確認' : lang === 'bn' ? 'নিযুক্ত শিক্ষার্থীর আবেদন দেখুন' : 'View all assigned student applications'}</div>
        </Link>
        <Link href="/dashboard/institution/interviews" className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-indigo-200 transition-all">
          <div className="text-2xl mb-2">🎙️</div>
          <div className="font-semibold text-sm">{t.nav.interviews}</div>
          <div className="text-xs text-slate-500 mt-1">{lang === 'ja' ? '面接スケジュールを管理' : lang === 'bn' ? 'ইন্টারভিউ শিডিউল পরিচালনা' : 'Manage interview schedule'}</div>
        </Link>
        <Link href="/dashboard/institution/profile" className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-indigo-200 transition-all">
          <div className="text-2xl mb-2">🏫</div>
          <div className="font-semibold text-sm">{t.nav.institutionProfile}</div>
          <div className="text-xs text-slate-500 mt-1">{lang === 'ja' ? '機関情報を更新' : lang === 'bn' ? 'প্রতিষ্ঠানের তথ্য আপডেট করুন' : 'Update institution details'}</div>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
        <h2 className="font-bold text-slate-900 mb-4">{id.howTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2">
                {s.step}
              </div>
              <div className="font-semibold text-sm text-slate-900">{s.title}</div>
              <div className="text-xs text-slate-500 mt-1">{s.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
          {id.privacyNote}
        </div>
      </div>
    </DashboardLayout>
  );
}
