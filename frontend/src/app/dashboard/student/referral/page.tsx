'use client';
import StudentLayout from '@/components/shared/StudentLayout';
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
  enrolled:   'bg-emerald-100 text-emerald-700',
  processing: 'bg-amber-100 text-amber-700',
  pending:    'bg-slate-100 text-slate-500',
};

const STATUS_DOT: Record<string, string> = {
  enrolled:   'bg-emerald-500',
  processing: 'bg-amber-500',
  pending:    'bg-slate-400',
};

export default function StudentReferralPage() {
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

  const { data: referralsData, isLoading: referralsLoading, isError: referralsError } = useQuery({
    queryKey: ['student-referrals'],
    queryFn: () => api.get('/student/referrals').then(r => r.data),
    staleTime: 60_000,
  });

  const { data: settingsData } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => api.get('/settings/public').then(r => r.data),
    staleTime: 5 * 60_000,
  });

  const referrals: Referral[] = referralsData?.data ?? [];
  const fees: Record<string, number> = settingsData?.referral_fees ?? {};

  const earned = referrals
    .filter(r => r.status === 'enrolled')
    .reduce((sum, r) => sum + (r.target_country ? (fees[r.target_country] ?? 0) : 0), 0);

  const pendingAmt = referrals
    .filter(r => r.status !== 'enrolled')
    .reduce((sum, r) => sum + (r.target_country ? (fees[r.target_country] ?? 0) : 0), 0);

  function fmtFee(country: string | null) {
    if (!country) return '—';
    const f = fees[country];
    return f ? `৳${f.toLocaleString()}` : '—';
  }

  function statusLabel(status: string) {
    if (status === 'enrolled')   return ja ? '完了' : bn ? 'সম্পন্ন' : 'Enrolled';
    if (status === 'processing') return ja ? '処理中' : bn ? 'প্রক্রিয়াধীন' : 'Processing';
    return ja ? '待機中' : bn ? 'অপেক্ষায়' : 'Pending';
  }

  const hasFees = Object.keys(fees).length > 0;
  const title   = ja ? '紹介' : bn ? 'রেফারেল' : 'Referral';

  return (
    <StudentLayout title={title}>
      <div className="space-y-5">

        {/* ── Hero banner ── */}
        <div className="bg-gradient-to-br from-green-700 to-emerald-600 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-6 sm:px-8 sm:py-7 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-black text-white leading-tight">
                {ja ? 'Tensai 紹介プログラム' : bn ? 'Tensai রেফারেল প্রোগ্রাম' : 'Tensai Referral Program'}
              </h2>
              <p className="text-green-100 text-sm mt-1 leading-relaxed">
                {ja
                  ? '友人を紹介してコミッションを獲得しましょう。'
                  : bn
                  ? 'বন্ধুদের রেফার করুন এবং কমিশন উপার্জন করুন।'
                  : 'Refer friends to Tensai and earn a commission when they complete their journey.'}
              </p>
            </div>
            {referrals.length > 0 && (
              <div className="flex flex-wrap gap-3 shrink-0">
                <div className="text-center bg-white/15 rounded-xl px-4 py-2.5">
                  <p className="text-2xl font-black text-white">{referrals.length}</p>
                  <p className="text-[11px] text-green-200 mt-0.5">{ja ? '紹介数' : bn ? 'রেফারেল' : 'Referrals'}</p>
                </div>
                <div className="text-center bg-white/15 rounded-xl px-4 py-2.5">
                  <p className="text-xl font-black text-white">{earned > 0 ? `৳${earned.toLocaleString()}` : '৳0'}</p>
                  <p className="text-[11px] text-green-200 mt-0.5">{ja ? '獲得済み' : bn ? 'অর্জিত' : 'Earned'}</p>
                </div>
                {pendingAmt > 0 && (
                  <div className="text-center bg-white/15 rounded-xl px-4 py-2.5">
                    <p className="text-xl font-black text-amber-200">{`৳${pendingAmt.toLocaleString()}`}</p>
                    <p className="text-[11px] text-green-200 mt-0.5">{ja ? '保留中' : bn ? 'অপেক্ষায়' : 'Pending'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Main two-column layout on desktop ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left column */}
          <div className="lg:col-span-1 space-y-5">

            {/* Referral link card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="text-sm font-semibold text-slate-800">
                  {ja ? 'あなたの紹介リンク' : bn ? 'আপনার রেফারেল লিংক' : 'Your Referral Link'}
                </span>
              </div>
              <div className="px-5 py-5">
                {!revealed ? (
                  <div className="text-center py-2">
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      {ja ? '紹介リンクを取得して友人に共有しましょう。' : bn ? 'আপনার রেফারেল লিংক পান এবং শেয়ার করুন।' : 'Get your unique link and share it with friends to start earning.'}
                    </p>
                    <button onClick={() => setRevealed(true)}
                      className="w-full min-h-[44px] py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold text-sm transition-colors shadow-sm">
                      {ja ? '紹介リンクを取得する' : bn ? 'রেফারেল লিংক পান' : 'Get my referral link'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Code */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                        {ja ? 'あなたのコード' : bn ? 'আপনার কোড' : 'Your Code'}
                      </p>
                      <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
                        <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        <span className="font-mono text-sm font-black text-green-800 tracking-wider">{code || '—'}</span>
                      </div>
                    </div>
                    {/* Link */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                        {ja ? '紹介リンク' : bn ? 'রেফারেল লিংক' : 'Referral Link'}
                      </p>
                      <div className="flex gap-2">
                        <input readOnly value={referralLink}
                          className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-500 bg-slate-50 focus:outline-none" />
                        <button onClick={copyLink}
                          className={`shrink-0 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                            copied ? 'bg-emerald-100 text-emerald-800' : 'bg-green-700 hover:bg-green-800 text-white'
                          }`}>
                          {copied
                            ? (ja ? '✓ コピー済み' : bn ? '✓ কপি হয়েছে' : '✓ Copied')
                            : (ja ? 'コピー' : bn ? 'কপি' : 'Copy')}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">
                        {ja ? '登録時に自動的に記録されます。' : bn ? 'নিবন্ধনের সময় স্বয়ংক্রিয়ভাবে রেকর্ড হবে।' : 'Automatically recorded when your friend registers.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-slate-800">
                  {ja ? 'どのように機能するか' : bn ? 'কীভাবে কাজ করে' : 'How it works'}
                </span>
              </div>
              <div className="px-5 py-5">
                <div className="relative">
                  {/* vertical connector line */}
                  <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-slate-100" />
                  <div className="space-y-5 relative">
                    {[
                      {
                        num: '1',
                        title: ja ? 'リンクをシェア' : bn ? 'লিংক শেয়ার করুন' : 'Share your link',
                        desc:  ja ? '友人にあなたの紹介リンクを送る' : bn ? 'বন্ধুকে রেফারেল লিংক পাঠান' : 'Send your referral link to a friend',
                      },
                      {
                        num: '2',
                        title: ja ? '友人が登録' : bn ? 'বন্ধু নিবন্ধন করেন' : 'Friend registers',
                        desc:  ja ? 'Tensaiに登録しエージェンシーとマッチング' : bn ? 'বন্ধু Tensai-এ যোগ দেন' : 'Your friend signs up and gets matched with an agency',
                      },
                      {
                        num: '3',
                        title: ja ? 'コミッション獲得' : bn ? 'কমিশন পান' : 'You earn commission',
                        desc:  ja ? '入学完了後にコミッションが支払われます' : bn ? 'ভর্তি সম্পন্ন হলে কমিশন পাবেন' : 'Paid out after enrollment completes',
                      },
                    ].map(step => (
                      <div key={step.num} className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-green-700 text-white font-black text-xs flex items-center justify-center shrink-0 z-10">
                          {step.num}
                        </div>
                        <div className="pt-1">
                          <p className="text-sm font-bold text-slate-800 leading-tight">{step.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Fee schedule */}
            {hasFees && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                  <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
                  <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-800">
                    {ja ? '国別コミッション' : bn ? 'দেশ অনুযায়ী কমিশন' : 'Commission Rates'}
                  </span>
                </div>
                <div className="divide-y divide-slate-50">
                  {Object.entries(fees).map(([country, fee]) => (
                    <div key={country} className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm text-slate-700">{country}</span>
                      <span className="text-sm font-bold text-green-700">৳{fee.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column — My Referrals */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-sm font-semibold text-slate-800 flex-1">
                  {ja ? '私の紹介一覧' : bn ? 'আমার রেফারেলসমূহ' : 'My Referrals'}
                </span>
                {referrals.length > 0 && (
                  <span className="text-xs font-bold bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">
                    {referrals.length}
                  </span>
                )}
              </div>

              {referralsLoading ? (
                <div className="py-16 flex justify-center">
                  <span className="w-6 h-6 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
                </div>
              ) : referralsError ? (
                <div className="py-16 text-center px-6">
                  <p className="text-sm font-bold text-rose-500">
                    {ja ? 'データの読み込みに失敗しました' : bn ? 'ডেটা লোড করা যায়নি' : 'Failed to load referrals'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {ja ? 'ページを更新してください。' : bn ? 'পেজ রিফ্রেশ করুন।' : 'Please refresh the page and try again.'}
                  </p>
                </div>
              ) : referrals.length === 0 ? (
                <div className="py-16 text-center px-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-slate-500">
                    {ja ? 'まだ紹介がありません' : bn ? 'এখনো কোনো রেফারেল নেই' : 'No referrals yet'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {ja ? 'あなたの紹介リンクを友人にシェアしましょう。' : bn ? 'আপনার রেফারেল লিংক শেয়ার করুন।' : 'Share your referral link to get started.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">{ja ? '名前' : bn ? 'নাম' : 'Name'}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{ja ? '国' : bn ? 'দেশ' : 'Country'}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{ja ? 'ステータス' : bn ? 'স্ট্যাটাস' : 'Status'}</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">{ja ? 'コミッション' : bn ? 'কমিশন' : 'Commission'}</th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">{ja ? '登録日' : bn ? 'তারিখ' : 'Joined'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {referrals.map(r => (
                          <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-3.5">
                              <p className="font-semibold text-slate-800 text-sm">{r.name}</p>
                              <p className="text-xs text-slate-400 truncate max-w-[160px]">{r.email}</p>
                            </td>
                            <td className="px-4 py-3.5 text-sm text-slate-600">{r.target_country ?? '—'}</td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_BADGE[r.status] ?? STATUS_BADGE.pending}`}>
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[r.status] ?? STATUS_DOT.pending}`} />
                                {statusLabel(r.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold text-sm">
                              {r.status === 'enrolled'
                                ? <span className="text-green-700">{fmtFee(r.target_country)}</span>
                                : <span className="text-slate-400">{fmtFee(r.target_country)}</span>}
                            </td>
                            <td className="px-5 py-3.5 text-right text-xs text-slate-400 whitespace-nowrap">
                              {new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {earned > 0 && (
                        <tfoot>
                          <tr className="border-t-2 border-slate-200 bg-green-50/50">
                            <td colSpan={3} className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
                              {ja ? '合計獲得済み' : bn ? 'মোট অর্জিত' : 'Total Earned'}
                            </td>
                            <td className="px-4 py-3 text-right font-black text-green-700 text-sm">
                              ৳{earned.toLocaleString()}
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="sm:hidden divide-y divide-slate-50">
                    {referrals.map(r => (
                      <div key={r.id} className="px-4 py-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{r.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{r.email}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${STATUS_BADGE[r.status] ?? STATUS_BADGE.pending}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[r.status] ?? STATUS_DOT.pending}`} />
                            {statusLabel(r.status)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{r.target_country ?? '—'}</span>
                          <span className={r.status === 'enrolled' ? 'font-bold text-green-700' : 'text-slate-400'}>
                            {fmtFee(r.target_country)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </p>
                      </div>
                    ))}
                    {earned > 0 && (
                      <div className="px-4 py-3 bg-green-50/60 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                          {ja ? '合計' : bn ? 'মোট অর্জিত' : 'Total Earned'}
                        </span>
                        <span className="text-sm font-black text-green-700">৳{earned.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
