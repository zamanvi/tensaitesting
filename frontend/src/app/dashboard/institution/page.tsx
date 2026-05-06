'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import Link from 'next/link';

export default function InstitutionDashboard() {
  const { t } = useLang();
  const id = t.institutionDash;

  const STATS = [
    { label: id.verifiedCandidates, value: '0', icon: '👨‍🎓' },
    { label: id.shortlisted, value: '0', icon: '⭐' },
    { label: id.interviews, value: '0', icon: '📅' },
    { label: id.enrolled, value: '0', icon: '🎓' },
  ];

  const STEPS = [
    { step: '1', title: id.step1Title, desc: id.step1Desc },
    { step: '2', title: id.step2Title, desc: id.step2Desc },
    { step: '3', title: id.step3Title, desc: id.step3Desc },
    { step: '4', title: id.step4Title, desc: id.step4Desc },
  ];

  return (
    <DashboardLayout>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5">
            <div className="text-xl mb-2">{s.icon}</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 mb-5 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="font-bold text-slate-900">{id.browseTitle}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{id.browseSub}</p>
          </div>
          <Link href="/dashboard/institution/browse"
            className="bg-indigo-600 text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors text-center shrink-0"
          >
            {id.browseCta}
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
        <h2 className="font-bold text-slate-900 mb-4">{id.howTitle}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STEPS.map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2">
                {s.step}
              </div>
              <div className="font-semibold text-sm text-slate-900">{s.title}</div>
              <div className="text-xs text-slate-500 mt-1">{s.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
          {id.privacyNote}
        </div>
      </div>
    </DashboardLayout>
  );
}
