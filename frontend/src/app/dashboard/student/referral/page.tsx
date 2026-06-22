'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface Referral {
  id: number;
  name: string;
  email: string;
  target_country: string | null;
  status: 'pending' | 'enrolled' | 'processing' | string;
  created_at: string;
}

const STATUS_BADGE: Record<string, string> = {
  enrolled:   'bg-green-100 text-green-700',
  processing: 'bg-amber-100 text-amber-700',
  pending:    'bg-slate-100 text-slate-600',
};

export default function StudentReferralPage() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const code = user?.affiliate_code ?? '';
  const referralLink = code ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/register?ref=${code}` : '';

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  // Fetch referrals list
  const { data: referralsData, isLoading: referralsLoading } = useQuery({
    queryKey: ['student-referrals'],
    queryFn: () => api.get('/student/referrals').then(r => r.data),
    staleTime: 60_000,
  });

  // Fetch public settings for fee schedule
  const { data: settingsData } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => api.get('/settings/public').then(r => r.data),
    staleTime: 5 * 60_000,
  });

  const referrals: Referral[] = referralsData?.data ?? [];
  const fees: Record<string, number> = settingsData?.referral_fees ?? {};

  // Earnings summary
  const earned = referrals
    .filter(r => r.status === 'enrolled')
    .reduce((sum, r) => sum + (r.target_country ? (fees[r.target_country] ?? 0) : 0), 0);

  const pending = referrals
    .filter(r => r.status !== 'enrolled')
    .reduce((sum, r) => sum + (r.target_country ? (fees[r.target_country] ?? 0) : 0), 0);

  function fmtFee(country: string | null) {
    if (!country) return '—';
    const f = fees[country];
    if (!f) return '—';
    return `৳${f.toLocaleString()}`;
  }

  function statusLabel(status: string) {
    if (status === 'enrolled') return ja ? '完了' : bn ? 'সম্পন্ন' : 'Enrolled';
    if (status === 'processing') return ja ? '処理中' : bn ? 'প্রক্রিয়াধীন' : 'Processing';
    return ja ? '待機中' : bn ? 'অপেক্ষায়' : 'Pending';
  }

  const title = ja ? '紹介' : bn ? 'রেফারেল' : 'Referral';
  const hasFees = Object.keys(fees).length > 0;

  return (
    <DashboardLayout title={title}>
      <div className="max-w-2xl space-y-5">

        {/* ── Referral link card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
          <div className="text-3xl mb-3">🤝</div>
          <h2 className="font-bold text-slate-900 text-base mb-2">
            {ja ? 'Tensai紹介プログラム' : bn ? 'Tensai রেফারেল প্রোগ্রাম' : 'Tensai Referral Program'}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            {ja
              ? '友人や知人をTensaiに紹介して、留学が完了したときにコミッションを獲得しましょう。'
              : bn
              ? 'আপনার পরিচিতদের Tensai-এ রেফার করুন এবং তাদের পড়াশোনা সম্পন্ন হলে কমিশন পান।'
              : 'Refer friends to Tensai and earn a commission when they successfully complete their study abroad journey.'}
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
                  {ja ? 'あなたのコード' : bn ? 'আপনার কোড' : 'Your code'}
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
                  ? 'このリンクを友人にシェアしてください。登録時に自動的にあなたの紹介として記録されます。'
                  : bn
                  ? 'এই লিংকটি বন্ধুদের সাথে শেয়ার করুন। নিবন্ধনের সময় স্বয়ংক্রিয়ভাবে আপনার রেফারেল হিসেবে রেকর্ড হবে।'
                  : 'Share this link with friends. When they register, it is automatically recorded as your referral.'}
              </p>
            </div>
          )}
        </div>

        {/* ── My Referrals table ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              {ja ? '私の紹介一覧' : bn ? 'আমার রেফারেলসমূহ' : 'My Referrals'}
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              {referrals.length} {ja ? '件' : bn ? 'জন' : 'total'}
            </span>
          </div>

          {referralsLoading ? (
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
                {ja ? 'あなたの紹介リンクを友人にシェアしましょう。' : bn ? 'আপনার রেফারেল লিংক শেয়ার করুন।' : 'Share your referral link to get started.'}
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
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status] ?? STATUS_BADGE.pending}`}>
                          {statusLabel(r.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-sm">
                        {r.status === 'enrolled' ? (
                          <span className="text-green-700">{fmtFee(r.target_country)}</span>
                        ) : (
                          <span className="text-slate-400">{fmtFee(r.target_country)}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-slate-400">
                        {new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {referrals.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-slate-100 bg-slate-50">
                      <td colSpan={3} className="px-5 py-3 text-xs font-semibold text-slate-500">
                        {ja ? '合計獲得済み' : bn ? 'মোট অর্জিত' : 'Total earned'}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-green-700">
                        {earned > 0 ? `৳${earned.toLocaleString()}` : '—'}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>

        {/* ── Fee schedule ── */}
        {hasFees && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {ja ? '国別コミッション一覧' : bn ? 'দেশ অনুযায়ী কমিশন' : 'Commission by Country'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {ja
                  ? '入学完了時に支払われる金額です。'
                  : bn
                  ? 'ভর্তি সম্পন্ন হলে এই পরিমাণ কমিশন পাবেন।'
                  : 'Amount paid on enrollment completion.'}
              </p>
            </div>
            <div className="divide-y divide-slate-50">
              {Object.entries(fees).map(([country, fee]) => (
                <div key={country} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm font-medium text-slate-700">{country}</span>
                  <span className="text-sm font-bold text-green-700">৳{fee.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── How it works ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
          <h3 className="font-bold text-slate-900 text-sm mb-4">
            {ja ? 'どのように機能するか' : bn ? 'কীভাবে কাজ করে' : 'How it works'}
          </h3>
          <div className="space-y-4">
            {[
              {
                num: '01',
                title: ja ? 'リンクをシェア' : bn ? 'লিংক শেয়ার করুন' : 'Share your link',
                desc: ja ? '友人にあなたの紹介リンクを送る' : bn ? 'বন্ধুকে আপনার রেফারেল লিংক পাঠান' : 'Send your referral link to a friend',
              },
              {
                num: '02',
                title: ja ? '友人が登録' : bn ? 'বন্ধু নিবন্ধন করেন' : 'Friend registers',
                desc: ja ? '友人がTensaiに登録し、エージェンシーとマッチング' : bn ? 'বন্ধু Tensai-এ নিবন্ধিত হন ও এজেন্সির সাথে মিলিত হন' : 'Your friend signs up and gets matched with an agency',
              },
              {
                num: '03',
                title: ja ? 'コミッション獲得' : bn ? 'কমিশন পান' : 'You earn commission',
                desc: ja ? '友人の入学完了後、コミッションが支払われます' : bn ? 'বন্ধুর ভর্তি সম্পন্ন হলে কমিশন পাবেন' : 'After enrollment completes, your commission is paid out',
              },
            ].map(step => (
              <div key={step.num} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-800 font-bold text-xs flex items-center justify-center shrink-0">
                  {step.num}
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900">{step.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
