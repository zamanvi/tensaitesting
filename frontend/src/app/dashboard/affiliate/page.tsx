'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useState } from 'react';

export default function AffiliateDashboard() {
  const { user } = useAuthStore();
  const { t } = useLang();
  const a = t.affiliateDash;
  const [copied, setCopied] = useState(false);

  const affiliateCode = user?.affiliate_code ?? '';
  const affiliateLink = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/register?ref=${affiliateCode}`
    : `/auth/register?ref=${affiliateCode}`;

  function copyLink() {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DashboardLayout>
      {/* Affiliate code card */}
      <div className="bg-indigo-600 text-white rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8">
        <div className="text-sm font-medium opacity-80 mb-1">{a.yourCode}</div>
        <div className="text-2xl sm:text-3xl font-bold tracking-wider mb-3">{affiliateCode}</div>
        <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2.5 sm:p-3 text-xs">
          <span className="opacity-70 flex-1 truncate min-w-0">{affiliateLink}</span>
          <button
            onClick={copyLink}
            className="bg-white text-indigo-600 px-3 py-1.5 rounded-lg font-semibold text-xs hover:bg-indigo-50 transition-colors shrink-0"
          >
            {copied ? t.common.copied : t.common.copy}
          </button>
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white border-2 border-indigo-200 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xl">🎓</span>
            <span className="font-bold text-indigo-700">{a.associateTitle}</span>
            <span className="ml-auto text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{a.active}</span>
          </div>
          <p className="text-sm text-slate-500 mb-4">{a.associateDesc}</p>
          <div className="text-2xl font-bold text-indigo-700">{a.associateRate}</div>
          <div className="text-xs text-slate-500">{a.associateRateSub}</div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xl">🌐</span>
            <span className="font-bold text-slate-700">{a.partnerTitle}</span>
            <span className="ml-auto text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">{a.upgrade}</span>
          </div>
          <p className="text-sm text-slate-500 mb-4">{a.partnerDesc}</p>
          <div className="text-2xl font-bold text-amber-600">{a.partnerRate}</div>
          <div className="text-xs text-slate-500">{a.partnerRateSub}</div>
          <Link href="/dashboard/affiliate/upgrade"
            className="mt-4 block text-center text-xs text-amber-700 font-semibold border border-amber-200 rounded-lg py-2 hover:bg-amber-50 transition-colors"
          >
            {a.applyPartner}
          </Link>
        </div>
      </div>

      {/* Earnings */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 mb-5 sm:mb-6">
        <h2 className="font-bold text-slate-900 mb-4">{a.earningsTitle}</h2>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: a.totalReferrals, value: '0' },
            { label: a.converted, value: '0' },
            { label: a.totalEarned, value: '৳0' },
          ].map((e) => (
            <div key={e.label} className="text-center p-3 sm:p-4 bg-slate-50 rounded-xl">
              <div className="text-lg sm:text-xl font-bold text-slate-900">{e.value}</div>
              <div className="text-xs text-slate-500 mt-1 leading-tight">{e.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral history teaser */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900">{a.historyTitle}</h2>
          <Link href="/dashboard/affiliate/referrals" className="text-xs text-indigo-600 hover:underline">{t.common.viewAll}</Link>
        </div>
        <div className="text-center py-8 text-slate-300 text-sm">{a.historyEmpty}</div>
      </div>
    </DashboardLayout>
  );
}
