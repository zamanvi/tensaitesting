'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface InstitutionReferral {
  id: number;
  name: string;
  country: string | null;
  joined_at: string;
  students_count: number;       // total students registered under this institution
  visa_approved_count: number;  // students who got visa approved
  commission_per_approval: number; // fixed or % commission per visa approval
  total_commission: number;     // visa_approved_count × commission_per_approval
  status: 'prospect' | 'active' | 'inactive' | string;
}

const STATUS_BADGE: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  prospect: 'bg-amber-100 text-amber-700',
  inactive: 'bg-slate-100 text-slate-500',
};

export default function AffiliateReferralPage() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Pull affiliate_code from authStore or from cached dashboard data
  const dashCache = qc.getQueryData<{ affiliate_code?: string; affiliate_link?: string; affiliate_type?: string }>(['affiliate-dashboard']);
  // Global-only — redirect local affiliates
  useEffect(() => {
    if (dashCache?.affiliate_type === 'local') router.replace('/dashboard/affiliate');
    else if (user && user.gateway_type !== 'affiliate') router.replace(`/dashboard/${user.gateway_type}`);
  }, [dashCache?.affiliate_type, user, router]);

  const code = dashCache?.affiliate_code ?? user?.affiliate_code ?? '';
  const referralLink = code
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/register?type=affiliate&ref=${code}`
    : '';

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const { data, isLoading } = useQuery({
    queryKey: ['affiliate-institution-referrals'],
    queryFn: () => api.get('/affiliate/institution-referrals').then(r => r.data),
    staleTime: 60_000,
  });

  const referrals: InstitutionReferral[] = data?.data ?? [];

  const totalInstitutions = referrals.length;
  const totalStudents = referrals.reduce((s, r) => s + r.students_count, 0);
  const totalVisaApproved = referrals.reduce((s, r) => s + r.visa_approved_count, 0);
  const totalEarned = referrals.reduce((s, r) => s + r.total_commission, 0);

  function statusLabel(s: string) {
    if (s === 'active')   return ja ? 'アクティブ' : bn ? 'সক্রিয়' : 'Active';
    if (s === 'prospect') return ja ? '見込み'     : bn ? 'সম্ভাব্য' : 'Prospect';
    return ja ? '非アクティブ' : bn ? 'নিষ্ক্রিয়' : 'Inactive';
  }

  const title = ja ? '紹介' : bn ? 'রেফারেল' : 'Referral';

  return (
    <DashboardLayout title={title}>
      <div className="max-w-3xl space-y-5">

        {/* ── Referral link card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
          <div className="text-3xl mb-3">🔗</div>
          <h2 className="font-bold text-slate-900 text-base mb-2">
            {ja ? '機関紹介リンク' : bn ? 'ইনস্টিটিউশন রেফারেল লিংক' : 'Institution Referral Link'}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-5">
            {ja
              ? 'このリンクを学校・機関に共有してください。機関がこのリンクから登録し、学生のビザが承認されるとコミッションが発生します。'
              : bn
              ? 'এই লিংকটি স্কুল বা প্রতিষ্ঠানের সাথে শেয়ার করুন। তারা এই লিংক দিয়ে নিবন্ধিত হলে এবং শিক্ষার্থীদের ভিসা অনুমোদিত হলে আপনি কমিশন পাবেন।'
              : 'Share this link with schools and institutions. When they register via your link and their students get visa approved, you earn commission.'}
          </p>

          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold text-sm transition-colors"
            >
              {ja ? '紹介リンクを取得する' : bn ? 'রেফারেল লিংক পান' : 'Get my referral link'}
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {ja ? 'あなたの紹介コード' : bn ? 'আপনার রেফারেল কোড' : 'Your referral code'}
                </label>
                <div className="font-mono text-sm font-bold text-green-800 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
                  {code || '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {ja ? '機関登録リンク' : bn ? 'প্রতিষ্ঠান নিবন্ধন লিংক' : 'Institution registration link'}
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={referralLink}
                    className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 bg-slate-50 focus:outline-none"
                  />
                  <button
                    onClick={copyLink}
                    className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      copied ? 'bg-green-100 text-green-800' : 'bg-green-700 hover:bg-green-800 text-white'
                    }`}
                  >
                    {copied ? (ja ? 'コピー済み ✓' : bn ? 'কপি হয়েছে ✓' : 'Copied ✓') : (ja ? 'コピー' : bn ? 'কপি' : 'Copy')}
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                {ja
                  ? '機関がこのリンクから登録すると、自動的にあなたの紹介として記録されます。'
                  : bn
                  ? 'প্রতিষ্ঠান এই লিংক দিয়ে নিবন্ধিত হলে স্বয়ংক্রিয়ভাবে আপনার রেফারেল হিসেবে রেকর্ড হবে।'
                  : 'When an institution registers via this link, they are automatically recorded as your referral.'}
              </p>
            </div>
          )}
        </div>

        {/* ── Summary stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: ja ? '紹介機関数' : bn ? 'মোট প্রতিষ্ঠান' : 'Institutions',
              value: totalInstitutions,
              cls: 'text-slate-900',
              bg: 'bg-white',
            },
            {
              label: ja ? '登録学生数' : bn ? 'মোট শিক্ষার্থী' : 'Total Students',
              value: totalStudents,
              cls: 'text-slate-900',
              bg: 'bg-white',
            },
            {
              label: ja ? 'ビザ承認数' : bn ? 'ভিসা অনুমোদিত' : 'Visa Approved',
              value: totalVisaApproved,
              cls: 'text-green-700',
              bg: 'bg-green-50',
            },
            {
              label: ja ? '獲得コミッション' : bn ? 'মোট কমিশন' : 'Total Earned',
              value: totalEarned > 0 ? `৳${totalEarned.toLocaleString()}` : '৳0',
              cls: 'text-green-700',
              bg: 'bg-green-50',
            },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl border border-slate-100 shadow-sm p-4 text-center`}>
              <div className={`text-xl font-bold ${stat.cls}`}>{stat.value}</div>
              <div className="text-[11px] text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Institutions table ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              {ja ? '紹介機関一覧' : bn ? 'রেফার্ড প্রতিষ্ঠান তালিকা' : 'Referred Institutions'}
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              {totalInstitutions} {ja ? '機関' : bn ? 'টি প্রতিষ্ঠান' : 'institutions'}
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              {ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-3">🏫</div>
              <div className="text-sm font-medium text-slate-500 mb-1">
                {ja ? 'まだ紹介機関がありません' : bn ? 'এখনো কোনো প্রতিষ্ঠান রেফার করা হয়নি' : 'No institutions referred yet'}
              </div>
              <div className="text-xs">
                {ja ? '紹介リンクを学校・機関にシェアしましょう。' : bn ? 'স্কুল বা প্রতিষ্ঠানে রেফারেল লিংক শেয়ার করুন।' : 'Share your referral link with schools and institutions.'}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                      {ja ? '機関名' : bn ? 'প্রতিষ্ঠানের নাম' : 'Institution'}
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500">
                      {ja ? '国' : bn ? 'দেশ' : 'Country'}
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 text-center">
                      {ja ? '登録学生' : bn ? 'শিক্ষার্থী' : 'Students'}
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 text-center">
                      {ja ? 'ビザ承認' : bn ? 'ভিসা অনুমোদিত' : 'Visa Approved'}
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 text-center">
                      {ja ? 'ステータス' : bn ? 'স্ট্যাটাস' : 'Status'}
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 text-right">
                      {ja ? 'コミッション' : bn ? 'কমিশন' : 'Commission'}
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 text-right">
                      {ja ? '登録日' : bn ? 'যোগদান' : 'Joined'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {referrals.map(r => {
                    const convRate = r.students_count > 0
                      ? Math.round((r.visa_approved_count / r.students_count) * 100)
                      : 0;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-medium text-slate-800">{r.name}</div>
                        </td>
                        <td className="px-3 py-3 text-slate-600 text-sm">{r.country ?? '—'}</td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-semibold text-slate-700">{r.students_count}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-semibold text-green-700">{r.visa_approved_count}</span>
                            {r.students_count > 0 && (
                              <span className="text-[10px] text-slate-400">{convRate}%</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status] ?? STATUS_BADGE.prospect}`}>
                            {statusLabel(r.status)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          {r.total_commission > 0 ? (
                            <span className="font-bold text-green-700">৳{r.total_commission.toLocaleString()}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                          {r.commission_per_approval > 0 && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              ৳{r.commission_per_approval.toLocaleString()} {ja ? '/承認' : bn ? '/অনুমোদন' : '/approval'}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right text-xs text-slate-400">
                          {new Date(r.joined_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {totalEarned > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-slate-100 bg-slate-50">
                      <td colSpan={5} className="px-5 py-3 text-xs font-semibold text-slate-500">
                        {ja ? '合計獲得コミッション' : bn ? 'মোট অর্জিত কমিশন' : 'Total commission earned'}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-green-700">
                        ৳{totalEarned.toLocaleString()}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
