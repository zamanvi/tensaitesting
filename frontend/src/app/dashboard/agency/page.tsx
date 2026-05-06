'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import Link from 'next/link';

export default function AgencyDashboard() {
  const { t } = useLang();
  const a = t.agencyDash;

  const STATS = [
    { label: a.privateVault, value: '0', icon: '🔒', href: '/dashboard/agency/vault' },
    { label: a.openPool, value: '0', icon: '🌐', href: '/dashboard/agency/pool' },
    { label: a.activeLeads, value: '0', icon: '👥', href: '/dashboard/agency/vault' },
    { label: a.commissionsDue, value: '৳0', icon: '💰', href: '#' },
  ];

  const B2B_ITEMS = [
    { title: a.publishTitle, desc: a.publishDesc },
    { title: a.forwardTitle, desc: a.forwardDesc },
    { title: a.referralTitle, desc: a.referralDesc },
  ];

  return (
    <DashboardLayout>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {STATS.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-indigo-200 transition-all">
            <div className="text-xl mb-2">{s.icon}</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1 leading-tight">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-5 sm:mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900">🔒 {a.privateVault}</h2>
            <Link href="/dashboard/agency/vault" className="text-xs text-indigo-600 hover:underline">{t.common.viewAll}</Link>
          </div>
          <p className="text-sm text-slate-500 mb-4">{a.vaultDesc}</p>
          <div className="text-center py-6 text-slate-300 text-sm">{a.vaultEmpty}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900">🌐 {a.openPool}</h2>
            <Link href="/dashboard/agency/pool" className="text-xs text-indigo-600 hover:underline">{t.common.browse}</Link>
          </div>
          <p className="text-sm text-slate-500 mb-4">{a.poolDesc}</p>
          <div className="text-center py-6 text-slate-300 text-sm">{a.poolEmpty}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
        <h2 className="font-bold text-slate-900 mb-1">🤝 {a.b2bTitle}</h2>
        <p className="text-sm text-slate-500 mb-4">{a.b2bDesc}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {B2B_ITEMS.map((item) => (
            <div key={item.title} className="p-3 sm:p-4 bg-slate-50 rounded-xl text-sm">
              <div className="font-semibold text-slate-700 mb-1">{item.title}</div>
              <div className="text-slate-500 text-xs">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
