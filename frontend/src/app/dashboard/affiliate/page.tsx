'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useQueries, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

interface Referral {
  id: number;
  name: string;
  gateway_type: string;
  status: string;
  joined_at: string;
  converted: boolean;
}

interface DashboardData {
  total_referrals: number;
  converted_referrals: number;
  conversion_rate: number;
  total_earned: number;
  pending_payout: number;
  earnings_by_status?: Record<string, { total: number; count: number }>;
}

export default function AffiliateDashboard() {
  const { user } = useAuthStore();
  const { t } = useLang();
  const a = t.affiliateDash;
  const [copied, setCopied] = useState(false);

  const { lang } = useLang();
  const affiliateCode = user?.affiliate_code ?? '';
  const affiliateLink = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/register?ref=${affiliateCode}`
    : `/auth/register?ref=${affiliateCode}`;

  function copyLink() {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const { data: affiliateProfile } = useQuery({
    queryKey: ['affiliate-profile'],
    queryFn: () => api.get('/affiliate/profile').then(r => r.data.profile),
  });

  const [dashQ, referralsQ] = useQueries({
    queries: [
      {
        queryKey: ['affiliate-dashboard'],
        queryFn: () => api.get('/affiliate/dashboard').then((r) => r.data as DashboardData),
      },
      {
        queryKey: ['affiliate-referrals-preview'],
        queryFn: () => api.get('/affiliate/referrals').then((r) => r.data),
      },
    ],
  });

  const dash = dashQ.data;
  const recentReferrals: Referral[] = Array.isArray(referralsQ.data?.data)
    ? referralsQ.data.data.slice(0, 5)
    : [];

  const conversionRate = dash ? Math.round(dash.conversion_rate ?? 0) : 0;
  const pendingPayout = dash?.pending_payout ?? 0;
  const totalEarned = dash?.total_earned ?? 0;

  const hasPayoutInfo = !!(affiliateProfile?.bank_account_number || affiliateProfile?.bkash_number || affiliateProfile?.nagad_number);

  return (
    <DashboardLayout>
      {/* Payout info banner */}
      {!hasPayoutInfo && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">💳</span>
            <div>
              <p className="font-bold text-sm text-slate-900">
                {lang === 'ja' ? '支払い情報を追加してください' : lang === 'bn' ? 'পেমেন্ট তথ্য যোগ করুন' : 'Add Payout Details'}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {lang === 'ja' ? 'コミッションを受け取るには銀行口座またはモバイルバンキング情報が必要です。' : lang === 'bn' ? 'কমিশন পেতে ব্যাংক বা মোবাইল ব্যাংকিং তথ্য যোগ করুন।' : 'Add your bank account or bKash/Nagad number to receive commission payouts.'}
              </p>
            </div>
          </div>
          <Link href="/dashboard/affiliate/profile" className="shrink-0 text-xs font-bold text-indigo-600 hover:text-indigo-800 whitespace-nowrap">
            {lang === 'ja' ? '設定する →' : lang === 'bn' ? 'সেটআপ করুন →' : 'Set Up →'}
          </Link>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon="👥" label={a.totalReferrals}
          value={dash ? String(dash.total_referrals ?? 0) : '—'}
          color="indigo" loading={dashQ.isLoading}
        />
        <StatCard
          icon="✅" label={a.converted}
          value={dash ? String(dash.converted_referrals ?? 0) : '—'}
          color="emerald" loading={dashQ.isLoading}
        />
        <StatCard
          icon="📈" label="Conversion"
          value={dash ? `${conversionRate}%` : '—'}
          color="amber" loading={dashQ.isLoading}
        />
        <StatCard
          icon="৳" label={a.totalEarned}
          value={dash ? `৳${Number(totalEarned).toLocaleString()}` : '—'}
          color="purple" loading={dashQ.isLoading}
        />
      </div>

      {/* Referral code hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl p-6 mb-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
        <div className="relative">
          <div className="text-xs font-semibold opacity-70 uppercase tracking-widest mb-1">{a.yourCode}</div>
          <div className="text-2xl sm:text-3xl font-bold tracking-widest mb-4 break-all">{affiliateCode}</div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl p-3 text-xs border border-white/10">
            <span className="opacity-75 flex-1 truncate min-w-0 font-mono">{affiliateLink}</span>
            <button
              onClick={copyLink}
              className={`shrink-0 px-4 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                copied
                  ? 'bg-emerald-400 text-white'
                  : 'bg-white text-indigo-700 hover:bg-indigo-50'
              }`}
            >
              {copied ? '✓ Copied!' : t.common.copy}
            </button>
          </div>
          {pendingPayout > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs px-3 py-1.5 rounded-full">
              <span>⏳</span>
              <span>৳{Number(pendingPayout).toLocaleString()} pending payout</span>
            </div>
          )}
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Associate tier */}
        <div className="bg-white border-2 border-indigo-100 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                <span className="font-bold text-slate-900">{a.associateTitle}</span>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">{a.active}</span>
            </div>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">{a.associateDesc}</p>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-black text-indigo-600">{a.associateRate}</span>
              <span className="text-xs text-slate-400 mb-1 leading-tight">{a.associateRateSub}</span>
            </div>
          </div>
        </div>

        {/* Global Partner tier */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-100/50 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌐</span>
                <span className="font-bold text-slate-900">{a.partnerTitle}</span>
              </div>
              <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">{a.upgrade}</span>
            </div>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">{a.partnerDesc}</p>
            <div className="flex items-end gap-1 mb-4">
              <span className="text-3xl font-black text-amber-600">{a.partnerRate}</span>
              <span className="text-xs text-slate-500 mb-1 leading-tight">{a.partnerRateSub}</span>
            </div>
            <Link
              href="/dashboard/affiliate/upgrade"
              className="block text-center text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-2.5 transition-colors"
            >
              {a.applyPartner}
            </Link>
          </div>
        </div>
      </div>

      {/* Recent referrals */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900">{a.historyTitle}</h2>
          <Link href="/dashboard/affiliate/referrals" className="text-xs text-indigo-600 hover:underline font-medium">
            {t.common.viewAll} →
          </Link>
        </div>

        {referralsQ.isLoading ? (
          <div className="text-center py-8 text-slate-400 text-sm">{t.common.loading}</div>
        ) : recentReferrals.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-3xl mb-2">🔗</div>
            <p className="text-sm text-slate-400">{a.historyEmpty}</p>
            <button
              onClick={copyLink}
              className="mt-4 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {copied ? '✓ Copied!' : 'Copy Your Link'}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentReferrals.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{r.name}</div>
                  <div className="text-xs text-slate-400 capitalize">{r.gateway_type} · {new Date(r.joined_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {r.converted && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded-full">Converted</span>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    r.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  icon, label, value, color, loading,
}: {
  icon: string; label: string; value: string; color: string; loading: boolean;
}) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  };
  return (
    <div className={`rounded-2xl p-4 border ${colors[color]}`}>
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-xl font-bold">{loading ? '…' : value}</div>
      <div className="text-xs font-medium mt-0.5 opacity-70 leading-tight">{label}</div>
    </div>
  );
}
