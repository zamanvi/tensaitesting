'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

/* ── types ───────────────────────────────────────────────────────────────── */
interface DashBase {
  affiliate_type: 'local' | 'global';
  type_confirmed: boolean;
  affiliate_code: string;
  affiliate_link: string;
  performance_level: string;
  total_earned: number;
  pending_payout: number;
}
interface LocalDash extends DashBase {
  total_referrals: number;
  converted_referrals: number;
  conversion_rate: number;
  commission_per_student: number;
  recent_referrals: { id: number; name: string; status: string; joined_at: string }[];
}
interface GlobalDash extends DashBase {
  managed_institutions_count: number;
  selected_students_count: number;
  visa_approved_count: number;
  recent_institutions: { id: number; name: string; country: string; status: string; students_count: number; visa_approved_count: number }[];
}

const LEVEL_COLORS: Record<string, string> = {
  platinum: 'bg-indigo-100 text-indigo-700',
  gold:     'bg-amber-100 text-amber-700',
  silver:   'bg-slate-200 text-slate-600',
  bronze:   'bg-orange-100 text-orange-700',
};

/* ── main component ─────────────────────────────────────────────────────── */
export default function AffiliateDashboard() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: dash, isLoading } = useQuery<DashBase>({
    queryKey: ['affiliate-dashboard'],
    queryFn: () => api.get('/affiliate/dashboard').then(r => r.data),
  });

  const setTypeMutation = useMutation({
    mutationFn: (type: 'local' | 'global') =>
      api.post('/affiliate/set-type', { affiliate_type: type }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['affiliate-dashboard'] }),
  });

  function copyLink() {
    if (!dash?.affiliate_link) return;
    navigator.clipboard.writeText(dash.affiliate_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const ja = lang === 'ja';
  const bn = lang === 'bn';

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}
        </div>
      </DashboardLayout>
    );
  }

  /* ── Type selection screen (onboarding) ──────────────────────────────── */
  if (dash && !dash.type_confirmed) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto py-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🤝</div>
            <h1 className="text-2xl font-black text-slate-900">
              {ja ? 'アフィリエイトタイプを選択' : bn ? 'অ্যাফিলিয়েট ধরন বেছে নিন' : 'Choose Your Affiliate Type'}
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              {ja ? 'あなたの役割に合ったタイプを選択してください。' : bn ? 'আপনার কাজের ধরন অনুযায়ী সঠিক ধরনটি বেছে নিন।' : 'Select the type that best matches how you work with Tensai.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Local */}
            <button
              onClick={() => setTypeMutation.mutate('local')}
              disabled={setTypeMutation.isPending}
              className="group text-left bg-white border-2 border-slate-100 hover:border-indigo-400 rounded-2xl p-6 transition-all hover:shadow-md"
            >
              <div className="text-3xl mb-3">🎓</div>
              <h2 className="font-bold text-slate-900 text-lg mb-2">
                {ja ? 'スチューデントアフィリエイト' : bn ? 'স্টুডেন্ট অ্যাফিলিয়েট' : 'Student Affiliate'}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                {ja
                  ? '日本留学を希望する学生をTensaiコンサルタンシーに紹介します。学生が入学するたびに固定コミッションを獲得。'
                  : bn
                  ? 'জাপানে পড়তে আগ্রহী শিক্ষার্থীদের Tensai কনসালটেন্সিতে পাঠান। প্রতিটি ভর্তিতে নির্দিষ্ট কমিশন পান।'
                  : 'Refer students interested in studying in Japan to Tensai. Earn a fixed commission for every student who gets enrolled.'}
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">✓ {ja ? '学生紹介' : bn ? 'শিক্ষার্থী রেফার' : 'Student Referrals'}</span>
                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">✓ {ja ? '入学毎固定報酬' : bn ? 'প্রতি এনরোলমেন্টে পেমেন্ট' : 'Per-Enrollment Pay'}</span>
              </div>
            </button>

            {/* Global */}
            <button
              onClick={() => setTypeMutation.mutate('global')}
              disabled={setTypeMutation.isPending}
              className="group text-left bg-white border-2 border-slate-100 hover:border-amber-400 rounded-2xl p-6 transition-all hover:shadow-md"
            >
              <div className="text-3xl mb-3">🌐</div>
              <h2 className="font-bold text-slate-900 text-lg mb-2">
                {ja ? 'インスティテューションアフィリエイト' : bn ? 'ইনস্টিটিউশনস অ্যাফিলিয়েট' : 'Institutions Affiliate'}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                {ja
                  ? '学校・教育機関またはTensaiの従業員を管理します。機関への入学ごとにパーセンテージのコミッションを獲得。'
                  : bn
                  ? 'স্কুল/শিক্ষা প্রতিষ্ঠান অথবা Tensai কর্মীদের ম্যানেজ করুন। প্রতিটি প্রতিষ্ঠানে ভর্তিতে % কমিশন পান।'
                  : 'Manage schools/institutions or employees for Tensai. Earn a percentage commission per student enrolled at your institutions.'}
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium">✓ {ja ? '機関管理' : bn ? 'প্রতিষ্ঠান ম্যানেজ' : 'Manage Institutions'}</span>
                <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium">✓ {ja ? '従業員管理' : bn ? 'কর্মী ম্যানেজ' : 'Manage Employees'}</span>
                <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium">✓ {ja ? '収益シェア' : bn ? '% কমিশন' : '% Commission'}</span>
              </div>
            </button>
          </div>

          {setTypeMutation.isPending && (
            <p className="text-center text-sm text-slate-400 mt-4">
              {ja ? '設定中...' : bn ? 'সেট করা হচ্ছে...' : 'Setting up your account...'}
            </p>
          )}
        </div>
      </DashboardLayout>
    );
  }

  /* ── LOCAL dashboard ─────────────────────────────────────────────────── */
  if (dash?.affiliate_type === 'local') {
    const d = dash as LocalDash;
    return (
      <DashboardLayout>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <h1 className="font-bold text-slate-900">
              {ja ? 'スチューデントアフィリエイト' : bn ? 'স্টুডেন্ট অ্যাফিলিয়েট' : 'Student Affiliate'}
            </h1>
            {d.performance_level && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${LEVEL_COLORS[d.performance_level] ?? LEVEL_COLORS.bronze}`}>
                {d.performance_level}
              </span>
            )}
          </div>
          <Link href="/dashboard/affiliate/profile" className="text-xs text-indigo-600 hover:underline">
            {ja ? '設定' : bn ? 'সেটিংস' : 'Settings'}
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <Stat icon="👥" label={ja ? '紹介数' : bn ? 'মোট রেফারেল' : 'Total Referrals'} value={String(d.total_referrals ?? 0)} color="indigo" />
          <Stat icon="✅" label={ja ? '成約' : bn ? 'কনভার্টেড' : 'Converted'} value={String(d.converted_referrals ?? 0)} color="emerald" />
          <Stat icon="📈" label={ja ? '成約率' : bn ? 'কনভার্সন রেট' : 'Conv. Rate'} value={`${Math.round(d.conversion_rate ?? 0)}%`} color="amber" />
          <Stat icon="৳" label={ja ? '総収益' : bn ? 'মোট আয়' : 'Total Earned'} value={`৳${Number(d.total_earned).toLocaleString()}`} color="purple" />
        </div>

        {/* Referral link hero */}
        <ReferralHero affiliateCode={d.affiliate_code} affiliateLink={d.affiliate_link} pendingPayout={d.pending_payout} copied={copied} onCopy={copyLink} lang={lang} />

        {/* Commission info */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-xl shrink-0">💰</div>
          <div className="flex-1">
            <p className="font-bold text-sm text-slate-900">
              {ja ? `1人入学につき ৳${Number(d.commission_per_student).toLocaleString()}` : bn ? `প্রতি শিক্ষার্থী ভর্তিতে ৳${Number(d.commission_per_student).toLocaleString()}` : `৳${Number(d.commission_per_student).toLocaleString()} per enrolled student`}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {ja ? 'Tensai経由で入学が確定した学生に対して支払われます。' : bn ? 'Tensai-এর মাধ্যমে ভর্তি নিশ্চিত হলে পেমেন্ট করা হয়।' : 'Paid once a student you referred is confirmed enrolled through Tensai.'}
            </p>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          <QuickLink href="/dashboard/affiliate/students" icon="👥" label={ja ? '紹介した学生' : bn ? 'রেফার করা শিক্ষার্থী' : 'Referred Students'} color="indigo" />
          <QuickLink href="/dashboard/affiliate/commissions" icon="💳" label={ja ? '収益履歴' : bn ? 'কমিশন ইতিহাস' : 'Commission History'} color="emerald" />
          <QuickLink href="/dashboard/affiliate/profile" icon="⚙️" label={ja ? 'プロフィール' : bn ? 'প্রোফাইল' : 'Profile'} color="slate" />
        </div>

        {/* Recent referrals */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 text-sm">
              {ja ? '最近の紹介' : bn ? 'সাম্প্রতিক রেফারেল' : 'Recent Referrals'}
            </h2>
            <Link href="/dashboard/affiliate/students" className="text-xs text-indigo-600 hover:underline">
              {ja ? 'すべて見る' : bn ? 'সব দেখুন' : 'View all'} →
            </Link>
          </div>
          {d.recent_referrals?.length === 0 ? (
            <EmptyReferrals onCopy={copyLink} copied={copied} lang={lang} />
          ) : (
            <div className="divide-y divide-slate-50">
              {d.recent_referrals?.map(r => (
                <div key={r.id} className="flex items-center gap-3 py-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{r.name}</p>
                    <p className="text-xs text-slate-400">{new Date(r.joined_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upgrade CTA */}
        <div className="mt-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-sm text-slate-900">🌐 {ja ? '機関アフィリエイトにアップグレード' : bn ? 'ইনস্টিটিউশন অ্যাফিলিয়েটে আপগ্রেড করুন' : 'Upgrade to Institution Affiliate'}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {ja ? '機関・従業員を管理してより高い収益を得ましょう。' : bn ? 'প্রতিষ্ঠান ও কর্মী ম্যানেজ করে বেশি আয় করুন।' : 'Manage institutions & employees for higher recurring commissions.'}
            </p>
          </div>
          <Link href="/dashboard/affiliate/upgrade" className="shrink-0 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
            {ja ? '申請する' : bn ? 'আবেদন করুন' : 'Apply →'}
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  /* ── GLOBAL dashboard ────────────────────────────────────────────────── */
  const d = dash as GlobalDash;
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌐</span>
          <h1 className="font-bold text-slate-900">
            {ja ? 'インスティテューションアフィリエイト' : bn ? 'ইনস্টিটিউশনস অ্যাফিলিয়েট' : 'Institutions Affiliate'}
          </h1>
          {d?.performance_level && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${LEVEL_COLORS[d.performance_level] ?? LEVEL_COLORS.bronze}`}>
              {d.performance_level}
            </span>
          )}
        </div>
        <Link href="/dashboard/affiliate/profile" className="text-xs text-amber-600 hover:underline">
          {ja ? '設定' : bn ? 'সেটিংস' : 'Settings'}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat icon="🏫" label={ja ? '紹介機関数' : bn ? 'রেফার্ড প্রতিষ্ঠান' : 'Referred Institutions'} value={String(d?.managed_institutions_count ?? 0)} color="amber" />
        <Stat icon="🎓" label={ja ? '選択された学生' : bn ? 'সিলেক্টেড শিক্ষার্থী' : 'Selected Students'} value={String(d?.selected_students_count ?? 0)} color="indigo" />
        <Stat icon="✅" label={ja ? 'ビザ承認数' : bn ? 'ভিসা অনুমোদিত' : 'Visa Approved'} value={String(d?.visa_approved_count ?? 0)} color="emerald" />
        <Stat icon="৳" label={ja ? '総収益' : bn ? 'মোট আয়' : 'Total Earned'} value={`৳${Number(d?.total_earned ?? 0).toLocaleString()}`} color="purple" />
      </div>

      {/* Referral link */}
      {d?.affiliate_link && (
        <ReferralHero affiliateCode={d.affiliate_code} affiliateLink={d.affiliate_link} pendingPayout={d.pending_payout} copied={copied} onCopy={copyLink} lang={lang} />
      )}

      {/* Commission info — read-only, rates are set by admin per country/visa/intake */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">💰</div>
        <div>
          <p className="font-bold text-sm text-slate-900">
            {ja ? 'コミッションはAdminが設定します' : bn ? 'কমিশন অ্যাডমিন কর্তৃক নির্ধারিত' : 'Commission rates set by admin'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {ja ? '国・ビザ種別・期ごとに設定された料金で、ビザ承認ごとにコミッションが発生します。' : bn ? 'দেশ, ভিসা ক্যাটাগরি ও ইনটেক অনুযায়ী নির্ধারিত হারে ভিসা অনুমোদন হলে কমিশন পাবেন।' : 'Rates are configured per country, visa type, and intake period. You earn commission each time a referred student gets visa approved.'}
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <QuickLink href="/dashboard/affiliate/referral" icon="🔗" label={ja ? '紹介リンク' : bn ? 'রেফারেল লিংক' : 'My Referrals'} color="amber" />
        <QuickLink href="/dashboard/affiliate/commissions" icon="💳" label={ja ? '収益' : bn ? 'আয়' : 'Commissions'} color="emerald" />
        <QuickLink href="/dashboard/affiliate/profile" icon="⚙️" label={ja ? 'プロフィール' : bn ? 'প্রোফাইল' : 'Profile'} color="slate" />
      </div>

      {/* Recent referred institutions */}
      {(d?.recent_institutions?.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 text-sm">🏫 {ja ? '紹介した機関' : bn ? 'রেফার্ড প্রতিষ্ঠান' : 'Referred Institutions'}</h2>
            <Link href="/dashboard/affiliate/referral" className="text-xs text-amber-600 hover:underline">{ja ? 'すべて見る' : bn ? 'সব দেখুন' : 'View all'} →</Link>
          </div>
          <div className="space-y-2">
            {d.recent_institutions.map(inst => (
              <div key={inst.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-lg shrink-0">🏫</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-900 truncate">{inst.name}</p>
                  <p className="text-xs text-slate-400">
                    {inst.country} · {inst.students_count} {ja ? '名学生' : bn ? 'জন শিক্ষার্থী' : 'students'}
                    {inst.visa_approved_count > 0 && ` · ${inst.visa_approved_count} ${ja ? 'ビザ承認' : bn ? 'ভিসা অনুমোদিত' : 'visa approved'}`}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${inst.status === 'active' ? 'bg-emerald-100 text-emerald-700' : inst.status === 'prospect' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                  {inst.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {d?.managed_institutions_count === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <div className="text-4xl mb-3">🔗</div>
          <p className="font-semibold text-slate-700 mb-1">
            {ja ? '機関にリンクを共有しましょう' : bn ? 'প্রতিষ্ঠানে আপনার লিংক শেয়ার করুন' : 'Share your referral link with institutions'}
          </p>
          <p className="text-xs text-slate-400 mb-4">
            {ja ? '学校がリンクから登録すると、自動的に紹介として記録されます。' : bn ? 'স্কুল আপনার লিংক দিয়ে নিবন্ধিত হলে স্বয়ংক্রিয়ভাবে রেকর্ড হবে।' : 'When schools register via your link, they are automatically recorded as your referral.'}
          </p>
          <Link href="/dashboard/affiliate/referral" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors">
            {ja ? '紹介リンクを取得' : bn ? 'রেফারেল লিংক পান' : 'Get My Referral Link'}
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}

/* ── shared sub-components ───────────────────────────────────────────────── */

function Stat({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const c: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
  };
  return (
    <div className={`rounded-2xl p-4 border ${c[color]}`}>
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs font-medium mt-0.5 opacity-70 leading-tight">{label}</div>
    </div>
  );
}

function QuickLink({ href, icon, label, color }: { href: string; icon: string; label: string; color: string }) {
  const c: Record<string, string> = {
    indigo: 'hover:border-indigo-200 hover:bg-indigo-50',
    amber: 'hover:border-amber-200 hover:bg-amber-50',
    emerald: 'hover:border-emerald-200 hover:bg-emerald-50',
    slate: 'hover:border-slate-200 hover:bg-slate-50',
  };
  return (
    <Link href={href} className={`bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center gap-1 transition-all ${c[color]}`}>
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-semibold text-slate-700 text-center leading-tight">{label}</span>
    </Link>
  );
}

function ReferralHero({ affiliateCode, affiliateLink, pendingPayout, copied, onCopy, lang }: {
  affiliateCode: string; affiliateLink: string; pendingPayout: number;
  copied: boolean; onCopy: () => void; lang: string;
}) {
  const ja = lang === 'ja'; const bn = lang === 'bn';
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl p-5 mb-5">
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
      <div className="relative">
        <p className="text-xs opacity-70 uppercase tracking-widest mb-1">
          {ja ? 'あなたのコード' : bn ? 'আপনার কোড' : 'Your Code'}
        </p>
        <p className="text-2xl font-black tracking-widest mb-3">{affiliateCode}</p>
        <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2.5 text-xs border border-white/10">
          <span className="flex-1 opacity-75 font-mono break-all min-w-0 text-[10px] sm:text-xs">{affiliateLink}</span>
          <button onClick={onCopy} className={`shrink-0 px-3 py-1.5 rounded-lg font-semibold transition-all ${copied ? 'bg-emerald-400 text-white' : 'bg-white text-indigo-700 hover:bg-indigo-50'}`}>
            {copied ? '✓' : (ja ? 'コピー' : bn ? 'কপি' : 'Copy')}
          </button>
        </div>
        {pendingPayout > 0 && (
          <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-300/30 text-amber-100 text-xs px-3 py-1 rounded-full">
            ⏳ ৳{Number(pendingPayout).toLocaleString()} {ja ? '支払い待ち' : bn ? 'পেমেন্ট বাকি' : 'pending payout'}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyReferrals({ onCopy, copied, lang }: { onCopy: () => void; copied: boolean; lang: string }) {
  const ja = lang === 'ja'; const bn = lang === 'bn';
  return (
    <div className="text-center py-8">
      <div className="text-3xl mb-2">🔗</div>
      <p className="text-sm text-slate-400 mb-4">
        {ja ? 'まだ紹介はありません。リンクを共有しましょう！' : bn ? 'এখনো কোনো রেফারেল নেই। লিংক শেয়ার করুন!' : 'No referrals yet. Share your link!'}
      </p>
      <button onClick={onCopy} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors">
        {copied ? '✓ Copied!' : (ja ? 'リンクをコピー' : bn ? 'লিংক কপি করুন' : 'Copy Your Link')}
      </button>
    </div>
  );
}
