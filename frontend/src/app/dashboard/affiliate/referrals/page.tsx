'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface Referral {
  id: number;
  name: string;
  gateway_type: string;
  status: string;
  joined_at: string;
  converted: boolean;
}

export default function AffiliateReferrals() {
  const { user } = useAuthStore();
  const { t, lang } = useLang();
  const ar = t.affiliateReferrals;
  const [copied, setCopied] = useState(false);

  const refCode = user?.affiliate_code ?? '';
  const refLink = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/register?ref=${refCode}`
    : `/auth/register?ref=${refCode}`;

  const { data: dashboard } = useQuery({
    queryKey: ['affiliate-dashboard'],
    queryFn: () => api.get('/affiliate/dashboard').then((r) => r.data),
  });

  const { data: referralsData, isLoading } = useQuery({
    queryKey: ['affiliate-referrals'],
    queryFn: () => api.get('/affiliate/referrals').then((r) => r.data),
  });

  const referrals: Referral[] = Array.isArray(referralsData?.data) ? referralsData.data : [];

  function copyLink() {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DashboardLayout title={ar.title}>
      {/* Stats */}
      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <StatCard label={ar.totalReferrals} value={dashboard.total_referrals ?? 0} color="indigo" />
          <StatCard label={ar.converted} value={dashboard.converted_referrals ?? 0} color="emerald" />
          <StatCard label={ar.conversionRate} value={`${dashboard.conversion_rate ?? 0}%`} color="amber" />
          <StatCard label={ar.totalEarned} value={`৳${Number(dashboard.total_earned ?? 0).toLocaleString()}`} color="purple" />
        </div>
      )}

      {/* Referral link */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 mb-5 sm:mb-6">
        <div className="font-semibold text-sm text-slate-900 mb-2">{ar.linkTitle}</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 font-mono break-all min-w-0 select-all">
            {refLink}
          </div>
          <button
            onClick={copyLink}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shrink-0"
          >
            {copied ? ar.copied : ar.copyLink}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {ar.code} <span className="font-mono font-semibold">{refCode}</span>
        </p>
      </div>

      {/* Referrals list */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
        <h2 className="font-bold text-slate-900 mb-4">{ar.peopleReferred}</h2>
        {isLoading ? (
          <div className="text-center py-8 text-slate-400">{t.common.loading}</div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">{ar.noReferrals}</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {referrals.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-2 py-3">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm text-slate-900">{r.name}</span>
                  <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-600">{r.gateway_type}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {r.status}
                  </span>
                  {r.converted && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-600 text-white">
                      {lang === 'ja' ? 'コンバート済 ✓' : lang === 'bn' ? 'কনভার্টেড ✓' : 'Converted ✓'}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{new Date(r.joined_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className={`rounded-2xl p-3 sm:p-4 ${colors[color]}`}>
      <div className="text-xl sm:text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium mt-1 opacity-80 leading-tight">{label}</div>
    </div>
  );
}
