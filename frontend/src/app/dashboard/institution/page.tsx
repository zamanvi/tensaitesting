'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Stats {
  platform: {
    total_students: number;
    total_applications: number;
    pool_for_country: number;
    country: string | null;
  };
  my: {
    selected: number;
    pending: number;
    accepted: number;
    processing: number;
    complete: number;
  };
}

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K+';
  return n.toString();
}

export default function InstitutionHome() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const router = useRouter();
  const bn = lang === 'bn'; const ja = lang === 'ja';

  useEffect(() => {
    if (user && user.gateway_type !== 'institution') router.replace(`/dashboard/${user.gateway_type}`);
  }, [user, router]);

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['institution-stats'],
    queryFn: () => api.get('/institution/stats').then(r => r.data),
    staleTime: 60_000,
  });

  const t = (en: string, ja_: string, bn_: string) => ja ? ja_ : bn ? bn_ : en;

  const platformCards = [
    {
      label: t('Students on Tensai', 'Tensaiの学生数', 'টেনসাইতে শিক্ষার্থী'),
      value: stats ? fmt(stats.platform.total_students) : '—',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      ),
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      note: t('Active learners seeking abroad', '海外進学を目指す学習者', 'বিদেশে পড়তে আগ্রহী শিক্ষার্থী'),
    },
    {
      label: t('Applications Submitted', '提出済み申請', 'জমা পড়া আবেদন'),
      value: stats ? fmt(stats.platform.total_applications) : '—',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      ),
      color: 'from-green-500 to-emerald-600',
      bg: 'bg-green-50',
      text: 'text-green-600',
      note: t('Across all partner institutions', '全提携機関への申請', 'সকল প্রতিষ্ঠানে মোট আবেদন'),
    },
    {
      label: stats?.platform.country
        ? t(`Available in ${stats.platform.country}`, `${stats.platform.country}の利用可能数`, `${stats.platform.country}-তে উপলব্ধ`)
        : t('In Your Pool', 'あなたのプール', 'আপনার পুলে'),
      value: stats ? fmt(stats.platform.pool_for_country) : '—',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      ),
      color: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      note: t('Applications matching your country', 'あなたの国の申請', 'আপনার দেশের আবেদন'),
    },
  ];

  const myCards = [
    { label: t('Total Selected', '選考済み', 'মোট বাছাই'), value: stats?.my.selected ?? '—', color: 'text-slate-800' },
    { label: t('Pending Review', '審査待ち', 'পর্যালোচনা বাকি'), value: stats?.my.pending ?? '—', color: 'text-indigo-600' },
    { label: t('Accepted', '承認済み', 'গৃহীত'), value: stats?.my.accepted ?? '—', color: 'text-green-600' },
    { label: t('Processing', '処理中', 'প্রক্রিয়াধীন'), value: stats?.my.processing ?? '—', color: 'text-amber-600' },
    { label: t('Complete', '完了', 'সম্পন্ন'), value: stats?.my.complete ?? '—', color: 'text-emerald-600' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Welcome banner */}
        <div className="rounded-2xl bg-gradient-to-r from-[#0b1e11] to-[#16a34a] p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="relative">
            <p className="text-green-300 text-xs font-black tracking-widest uppercase mb-2">
              {t('Institution Dashboard', '機関ダッシュボード', 'ইনস্টিটিউশন ড্যাশবোর্ড')}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black mb-2">
              {t('Welcome to Tensai', 'Tensaiへようこそ', 'টেনসাইতে স্বাগতম')} 👋
            </h1>
            <p className="text-white/70 text-sm max-w-lg">
              {t(
                'Discover qualified students actively seeking admission to institutions like yours.',
                '入学を希望する優秀な学生を見つけましょう。',
                'আপনার মতো প্রতিষ্ঠানে ভর্তি হতে আগ্রহী যোগ্য শিক্ষার্থী খুঁজুন।'
              )}
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <Link href="/dashboard/institution/applications"
                className="h-9 px-5 bg-white text-green-800 text-sm font-black rounded-xl hover:bg-green-50 transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                {t('Browse Applications', '申請を見る', 'আবেদন দেখুন')}
              </Link>
              <Link href="/dashboard/institution/selected"
                className="h-9 px-5 bg-white/15 text-white text-sm font-bold rounded-xl border border-white/25 hover:bg-white/25 transition-colors flex items-center gap-1.5">
                {t('My Selected Students', '選考済み学生', 'বাছাইকৃত শিক্ষার্থী')}
              </Link>
            </div>
          </div>
        </div>

        {/* Platform stats — social proof */}
        <div>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
            {t('Platform Overview', 'プラットフォーム概要', 'প্ল্যাটফর্ম পরিসংখ্যান')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {platformCards.map((c, i) => (
              <div key={i} className={`rounded-2xl ${c.bg} border border-white p-5 shadow-sm`}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center mb-4 shadow-sm`}>
                  {c.icon}
                </div>
                <div className={`text-3xl font-black ${c.text} mb-1`}>
                  {isLoading ? <span className="inline-block w-12 h-7 bg-current/20 rounded animate-pulse" /> : c.value}
                </div>
                <div className="text-sm font-bold text-slate-700 mb-0.5">{c.label}</div>
                <div className="text-[11px] text-slate-400">{c.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* My activity */}
        <div>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
            {t('My Activity', '自分のアクティビティ', 'আমার কার্যক্রম')}
          </h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-100">
              {myCards.map((c, i) => (
                <div key={i} className="p-5 text-center">
                  <div className={`text-2xl sm:text-3xl font-black ${c.color} mb-1`}>
                    {isLoading ? <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" /> : c.value}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">{c.label}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 px-5 py-3 flex justify-end">
              <Link href="/dashboard/institution/selected"
                className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1">
                {t('View all selected students', '選考済み学生を見る', 'সব বাছাইকৃত শিক্ষার্থী দেখুন')}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Why Tensai — value proposition */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {t('Why Tensai', 'なぜTensaiか', 'কেন টেনসাই')}
            </p>
            <p className="text-sm font-bold text-slate-700">
              {t(
                "Bangladesh's first tech-enabled, asset-light recruitment network — with absolute peace of mind.",
                'バングラデシュ初のテクノロジー活用型採用ネットワーク — 完全な安心感とともに。',
                'বাংলাদেশের প্রথম টেক-চালিত রিক্রুটমেন্ট নেটওয়ার্ক — সম্পূর্ণ নিশ্চিন্তে।'
              )}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {[
              {
                icon: '♾️',
                color: 'bg-blue-50 text-blue-600',
                title: t('Lifetime Intake Coverage', '生涯インテークカバレッジ', 'আজীবন ইনটেক কভারেজ'),
                body: t(
                  'Once onboarded, enjoy a continuous, automated pipeline of qualified students for all your upcoming intakes — year after year.',
                  'オンボーディング後は、毎年すべてのインテークに向けた資格ある学生の継続的なパイプラインをお楽しみください。',
                  'একবার অনবোর্ড হলে, প্রতি বছর সব ইনটেকের জন্য যোগ্য শিক্ষার্থীর নিরবচ্ছিন্ন পাইপলাইন উপভোগ করুন।'
                ),
              },
              {
                icon: '🧑‍💼',
                color: 'bg-green-50 text-green-600',
                title: t('Dedicated Account Manager', '専任アカウントマネージャー', 'ডেডিকেটেড অ্যাকাউন্ট ম্যানেজার'),
                body: t(
                  'No automated bots. A dedicated human manager handles your custom criteria, interviews, and queries instantly.',
                  '自動ボットなし。専任の人間マネージャーがカスタム条件、面接、問い合わせを即座に対応します。',
                  'কোনো অটোমেটেড বট নয়। একজন ডেডিকেটেড মানব ম্যানেজার আপনার কাস্টম মানদণ্ড, ইন্টারভিউ ও প্রশ্নের তাৎক্ষণিক সমাধান দেন।'
                ),
              },
              {
                icon: '✅',
                color: 'bg-emerald-50 text-emerald-600',
                title: t('100% Paper Legality', '100%書類の合法性', '১০০% কাগজপত্রের বৈধতা'),
                body: t(
                  'Zero tolerance for fraud. Every file undergoes strict background and financial screening to completely eliminate visa risks.',
                  '詐欺ゼロトレランス。すべてのファイルは厳格な身元・財務審査を経てビザリスクを完全に排除します。',
                  'জালিয়াতির প্রতি শূন্য সহনশীলতা। প্রতিটি ফাইল কঠোর ব্যাকগ্রাউন্ড ও আর্থিক যাচাইয়ের মধ্য দিয়ে যায় — ভিসা ঝুঁকি সম্পূর্ণ দূর করতে।'
                ),
              },
              {
                icon: '🎯',
                color: 'bg-violet-50 text-violet-600',
                title: t('Pre-Verified Student Supply', '事前審査済み学生の供給', 'প্রি-ভেরিফাইড শিক্ষার্থী সরবরাহ'),
                body: t(
                  'Say goodbye to expensive marketing. Filter and shortlist a steady stream of pre-screened candidates from our nationwide franchise hubs.',
                  '高額なマーケティングとはお別れ。全国フランチャイズハブから事前審査済み候補者を絞り込み、ショートリストへ。',
                  'ব্যয়বহুল মার্কেটিংকে বিদায় বলুন। আমাদের দেশব্যাপী ফ্র্যাঞ্চাইজ হাব থেকে প্রি-স্ক্রিনড প্রার্থীদের ফিল্টার করুন।'
                ),
              },
            ].map((f, i) => (
              <div key={i} className="p-5 flex gap-4">
                <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center text-lg shrink-0`}>
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 mb-1">{f.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
            {t('Quick Access', 'クイックアクセス', 'দ্রুত অ্যাক্সেস')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/dashboard/institution/applications', icon: '🔍', label: t('Application Pool', '申請プール', 'আবেদন পুল') },
              { href: '/dashboard/institution/selected',     icon: '✅', label: t('Selected',          '選考済み',   'বাছাইকৃত') },
              { href: '/dashboard/institution/profile',      icon: '🏫', label: t('Our Profile',       'プロフィール', 'আমাদের প্রোফাইল') },
              { href: '/dashboard/institution/settings',     icon: '⚙️', label: t('Settings',          '設定',        'সেটিংস') },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-100
                  shadow-sm p-5 hover:border-green-200 hover:shadow-md transition-all duration-150 active:scale-95">
                <span className="text-2xl">{l.icon}</span>
                <span className="text-xs font-bold text-slate-600 text-center leading-tight">{l.label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
