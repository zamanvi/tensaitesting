'use client';
import { useLang } from '@/context/LanguageContext';
import Link from 'next/link';

export default function HomePage() {
  const { t, lang, toggle } = useLang();
  const l = t.landing;

  const GATEWAYS = [
    { type: 'student', icon: '🎓', title: l.gateways.studentTitle, desc: l.gateways.studentDesc },
    { type: 'agency', icon: '🏢', title: l.gateways.agencyTitle, desc: l.gateways.agencyDesc },
    { type: 'institution', icon: '🌐', title: l.gateways.institutionTitle, desc: l.gateways.institutionDesc },
    { type: 'affiliate', icon: '💼', title: l.gateways.affiliateTitle, desc: l.gateways.affiliateDesc },
  ];

  const FEATURES = [
    { icon: '🔒', title: l.features.f1Title, desc: l.features.f1Desc },
    { icon: '🤝', title: l.features.f2Title, desc: l.features.f2Desc },
    { icon: '🛡️', title: l.features.f3Title, desc: l.features.f3Desc },
    { icon: '📋', title: l.features.f4Title, desc: l.features.f4Desc },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-slate-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <span className="text-xl font-bold text-indigo-700 tracking-tight">Tensai</span>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggle}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
            >
              {lang === 'en' ? '日本語' : 'English'}
            </button>
            <Link href="/auth/login" className="text-sm text-slate-600 hover:text-indigo-700 transition-colors px-2 py-1">
              {l.login}
            </Link>
            <Link href="/auth/register" className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-medium transition-colors">
              {l.getStarted}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 pt-14 sm:pt-20 pb-12 sm:pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          {l.badge}
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-5 sm:mb-6">
          {l.heroTitle}<br className="hidden sm:block" />{' '}
          <span className="text-indigo-600">{l.heroHighlight}</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto mb-8 sm:mb-10 px-2">
          {l.heroSub}
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 px-4 sm:px-0">
          <Link href="/auth/register?type=student" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-colors text-center">
            {l.ctaStudent}
          </Link>
          <Link href="/auth/register?type=agency" className="border border-slate-200 hover:border-indigo-300 text-slate-700 px-8 py-3.5 rounded-full font-semibold text-sm transition-colors text-center">
            {l.ctaAgency}
          </Link>
          <Link href="/auth/register?type=institution" className="border border-slate-200 hover:border-indigo-300 text-slate-700 px-8 py-3.5 rounded-full font-semibold text-sm transition-colors text-center">
            {l.ctaInstitution}
          </Link>
        </div>
      </section>

      {/* Gateway Cards */}
      <section className="max-w-7xl mx-auto px-4 pb-16 sm:pb-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {GATEWAYS.map((g) => (
            <Link key={g.type} href={`/auth/register?type=${g.type}`}
              className="group bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 lg:p-6 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col"
            >
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{g.icon}</div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1">{g.title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">{g.desc}</p>
              </div>
              <div className="mt-3 text-xs text-indigo-600 font-semibold group-hover:underline">{l.getAccess}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust Features */}
      <section className="bg-slate-900 text-white py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-12">{l.whyTitle}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="text-center">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">{f.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 sm:py-8 text-center text-sm text-slate-400">
        {l.footer}
      </footer>
    </div>
  );
}
