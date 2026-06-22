'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface InstReferral {
  id: number;
  name: string;
  email: string;
  target_country: string | null;
  visa_category: string | null;
  status: 'pending' | 'enrolled' | 'processing' | string;
  created_at: string;
}

const STATUS_BADGE: Record<string, string> = {
  enrolled:   'bg-green-100 text-green-700',
  processing: 'bg-amber-100 text-amber-700',
  pending:    'bg-slate-100 text-slate-600',
};

const VISA_LABELS: Record<string, { en: string; ja: string; bn: string }> = {
  student_visa:  { en: 'Student Visa',  ja: '学生ビザ',     bn: 'স্টুডেন্ট ভিসা' },
  work_visa:     { en: 'Work Visa',     ja: '就労ビザ',     bn: 'ওয়ার্ক ভিসা' },
  business_visa: { en: 'Business Visa', ja: 'ビジネスビザ', bn: 'বিজনেস ভিসা' },
  visitor_visa:  { en: 'Visitor Visa',  ja: '観光ビザ',     bn: 'ভিজিটর ভিসা' },
};

export default function InstitutionReferralPage() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const code = user?.affiliate_code ?? '';
  const referralLink = code
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/register?ref=${code}`
    : '';

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const { data: referralsData, isLoading } = useQuery({
    queryKey: ['institution-referrals'],
    queryFn: () => api.get('/institution/referrals').then(r => r.data),
    staleTime: 60_000,
  });

  const { data: settingsData } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => api.get('/settings/public').then(r => r.data),
    staleTime: 5 * 60_000,
  });

  const referrals: InstReferral[] = referralsData?.data ?? [];
  // institution_referral_fees: { Japan: { student_visa: 30000, work_visa: 40000 } }
  const fees: Record<string, Record<string, number>> = settingsData?.institution_referral_fees ?? {};

  function getFee(country: string | null, visa: string | null): number {
    if (!country || !visa) return 0;
    return fees[country]?.[visa] ?? 0;
  }

  function fmtFee(country: string | null, visa: string | null): string {
    const f = getFee(country, visa);
    return f > 0 ? `৳${f.toLocaleString()}` : '—';
  }

  function visaLabel(key: string | null): string {
    if (!key) return '—';
    const v = VISA_LABELS[key];
    if (!v) return key;
    return ja ? v.ja : bn ? v.bn : v.en;
  }

  function statusLabel(status: string) {
    if (status === 'enrolled') return ja ? '完了' : bn ? 'সম্পন্ন' : 'Enrolled';
    if (status === 'processing') return ja ? '処理中' : bn ? 'প্রক্রিয়াধীন' : 'Processing';
    return ja ? '待機中' : bn ? 'অপেক্ষায়' : 'Pending';
  }

  const earned = referrals
    .filter(r => r.status === 'enrolled')
    .reduce((sum, r) => sum + getFee(r.target_country, r.visa_category), 0);

  const pending = referrals
    .filter(r => r.status !== 'enrolled')
    .reduce((sum, r) => sum + getFee(r.target_country, r.visa_category), 0);

  // Build fee schedule rows: all non-empty country+visa combos
  const feeSchedule: { country: string; visa: string; amount: number }[] = [];
  for (const [country, visas] of Object.entries(fees)) {
    for (const [visa, amount] of Object.entries(visas)) {
      if (amount > 0) feeSchedule.push({ country, visa, amount });
    }
  }
  feeSchedule.sort((a, b) => a.country.localeCompare(b.country) || a.visa.localeCompare(b.visa));

  const title = ja ? '紹介' : bn ? 'রেফারেল' : 'Referral';

  return (
    <DashboardLayout title={title}>
      <div className="max-w-2xl space-y-5">

        {/* ── Referral link card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
          <div className="text-3xl mb-3">🏫</div>
          <h2 className="font-bold text-slate-900 text-base mb-2">
            {ja ? '機関紹介プログラム' : bn ? 'ইনস্টিটিউশন রেফারেল প্রোগ্রাম' : 'Institution Referral Program'}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            {ja
              ? '貴機関で紹介した学生が入学・就労ビザを取得した際に、国別・ビザ種別に応じた紹介手数料が支払われます。'
              : bn
              ? 'আপনার ইনস্টিটিউশন থেকে রেফার করা শিক্ষার্থীরা ভর্তি বা ভিসা পেলে, দেশ ও ভিসা ক্যাটাগরি অনুযায়ী কমিশন পাবেন।'
              : 'Earn referral commissions when students you refer successfully obtain their visa and enroll. Rates vary by destination country and visa category.'}
          </p>

          {/* Earnings summary */}
          {referrals.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-slate-900">{referrals.length}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {ja ? '紹介数' : bn ? 'মোট রেফারেল' : 'Total Referrals'}
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <div className="text-base font-bold text-green-700 truncate">
                  {earned > 0 ? `৳${earned.toLocaleString()}` : '৳0'}
                </div>
                <div className="text-[11px] text-green-600 mt-0.5">
                  {ja ? '獲得済み' : bn ? 'অর্জিত' : 'Earned'}
                </div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <div className="text-base font-bold text-amber-700 truncate">
                  {pending > 0 ? `৳${pending.toLocaleString()}` : '৳0'}
                </div>
                <div className="text-[11px] text-amber-600 mt-0.5">
                  {ja ? '保留中' : bn ? 'অপেক্ষায়' : 'Pending'}
                </div>
              </div>
            </div>
          )}

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
                  {ja ? 'あなたの紹介コード' : bn ? 'আপনার কোড' : 'Your referral code'}
                </label>
                <div className="font-mono text-sm font-bold text-green-800 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
                  {code || '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {ja ? '紹介リンク' : bn ? 'রেফারেল লিংক' : 'Referral link'}
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
                  ? 'このリンクを通じて登録した学生は自動的に貴機関の紹介として記録されます。'
                  : bn
                  ? 'এই লিংকের মাধ্যমে নিবন্ধিত শিক্ষার্থীরা স্বয়ংক্রিয়ভাবে আপনার রেফারেল হিসেবে রেকর্ড হবে।'
                  : 'Students who register via this link are automatically recorded as your institution\'s referrals.'}
              </p>
            </div>
          )}
        </div>

        {/* ── My Referrals table ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              {ja ? '紹介一覧' : bn ? 'রেফারেল তালিকা' : 'My Referrals'}
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              {referrals.length} {ja ? '件' : bn ? 'জন' : 'total'}
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              {ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-sm font-medium text-slate-500">
                {ja ? 'まだ紹介がありません' : bn ? 'এখনো কোনো রেফারেল নেই' : 'No referrals yet'}
              </div>
              <div className="text-xs mt-1">
                {ja ? '紹介リンクを使って学生を紹介しましょう。' : bn ? 'রেফারেল লিংক শেয়ার করে শিক্ষার্থী রেফার করুন।' : 'Share your referral link to refer students.'}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                      {ja ? '名前' : bn ? 'নাম' : 'Name'}
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500">
                      {ja ? '国' : bn ? 'দেশ' : 'Country'}
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500">
                      {ja ? 'ビザ種別' : bn ? 'ভিসা ক্যাটাগরি' : 'Visa Type'}
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500">
                      {ja ? 'ステータス' : bn ? 'স্ট্যাটাস' : 'Status'}
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 text-right">
                      {ja ? 'コミッション' : bn ? 'কমিশন' : 'Commission'}
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 text-right">
                      {ja ? '登録日' : bn ? 'তারিখ' : 'Joined'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {referrals.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-800 text-sm">{r.name}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[140px]">{r.email}</div>
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-600">{r.target_country ?? '—'}</td>
                      <td className="px-3 py-3 text-sm text-slate-600">{visaLabel(r.visa_category)}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status] ?? STATUS_BADGE.pending}`}>
                          {statusLabel(r.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-sm">
                        {r.status === 'enrolled' ? (
                          <span className="text-green-700">{fmtFee(r.target_country, r.visa_category)}</span>
                        ) : (
                          <span className="text-slate-400">{fmtFee(r.target_country, r.visa_category)}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-slate-400">
                        {new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {earned > 0 && (
                  <tfoot>
                    <tr className="border-t border-slate-100 bg-slate-50">
                      <td colSpan={4} className="px-5 py-3 text-xs font-semibold text-slate-500">
                        {ja ? '合計獲得済み' : bn ? 'মোট অর্জিত' : 'Total earned'}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-green-700">
                        ৳{earned.toLocaleString()}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>

        {/* ── Fee schedule matrix ── */}
        {feeSchedule.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {ja ? '国別・ビザ種別コミッション一覧' : bn ? 'দেশ ও ভিসা অনুযায়ী কমিশন' : 'Commission Schedule'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {ja ? '入学・ビザ取得完了時に支払われる金額です。' : bn ? 'ভর্তি বা ভিসা সম্পন্ন হলে পাবেন।' : 'Paid on successful visa approval and enrollment.'}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                      {ja ? '国' : bn ? 'দেশ' : 'Country'}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">
                      {ja ? 'ビザ種別' : bn ? 'ভিসা ক্যাটাগরি' : 'Visa Type'}
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">
                      {ja ? 'コミッション' : bn ? 'কমিশন' : 'Commission'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {feeSchedule.map(({ country, visa, amount }) => (
                    <tr key={`${country}-${visa}`} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-700">{country}</td>
                      <td className="px-3 py-3 text-slate-600">{visaLabel(visa)}</td>
                      <td className="px-5 py-3 text-right font-bold text-green-700">
                        ৳{amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
