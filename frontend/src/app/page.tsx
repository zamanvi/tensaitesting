'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://tensai-production-3af6.up.railway.app/api';

interface GalleryItem {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  category: string;
}

export default function HomePage() {
  const { t, lang, toggle } = useLang();
  const l = t.landing;
  const [featured, setFeatured] = useState<GalleryItem[]>([]);

  useEffect(() => {
    fetch(`${API}/gallery/featured`)
      .then((r) => r.json())
      .then((data) => setFeatured(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

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
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/tensai-logo.png" alt="Tensai" width={40} height={40} className="rounded-full object-contain" />
            <div>
              <div className="text-xl font-bold text-green-800 tracking-tight leading-none">Tensai</div>
              <div className="text-[10px] text-slate-400 tracking-wide leading-none mt-0.5 hidden sm:block">The Way of Global Career</div>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggle}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-800 transition-colors"
            >
              {lang === 'en' ? '日本語' : 'English'}
            </button>
            <Link href="/about" className="text-sm text-slate-600 hover:text-green-800 transition-colors px-2 py-1 hidden sm:inline">
              {l.about}
            </Link>
            <Link href="/gallery" className="text-sm text-slate-600 hover:text-green-800 transition-colors px-2 py-1 hidden sm:inline">
              {l.gallery}
            </Link>
            <Link href="/auth/login" className="text-sm text-slate-600 hover:text-green-800 transition-colors px-2 py-1">
              {l.login}
            </Link>
            <Link href="/auth/register" className="text-sm bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-full font-medium transition-colors">
              {l.getStarted}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 pt-14 sm:pt-20 pb-12 sm:pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          {l.badge}
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-5 sm:mb-6">
          {l.heroTitle}<br className="hidden sm:block" />{' '}
          <span className="text-green-700">{l.heroHighlight}</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto mb-8 sm:mb-10 px-2">
          {l.heroSub}
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 px-4 sm:px-0">
          <Link href="/auth/register?type=student" className="bg-green-700 hover:bg-green-800 text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-colors text-center">
            {l.ctaStudent}
          </Link>
          <Link href="/auth/register?type=agency" className="border border-slate-200 hover:border-green-300 text-slate-700 px-8 py-3.5 rounded-full font-semibold text-sm transition-colors text-center">
            {l.ctaAgency}
          </Link>
          <Link href="/auth/register?type=institution" className="border border-slate-200 hover:border-green-300 text-slate-700 px-8 py-3.5 rounded-full font-semibold text-sm transition-colors text-center">
            {l.ctaInstitution}
          </Link>
        </div>
      </section>

      {/* Gateway Cards */}
      <section className="max-w-7xl mx-auto px-4 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {GATEWAYS.map((g) => (
            <Link key={g.type} href={`/auth/register?type=${g.type}`}
              className="group bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 hover:border-green-200 hover:shadow-md transition-all flex sm:block gap-4 items-start"
            >
              <div className="text-3xl shrink-0">{g.icon}</div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1 sm:mb-2 sm:mt-4">{g.title}</h3>
                <p className="text-sm text-slate-500">{g.desc}</p>
                <div className="mt-3 sm:mt-4 text-xs text-green-700 font-semibold group-hover:underline">{l.getAccess}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust Features */}
      <section className="bg-slate-900 text-white py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">{l.whyTitle}</h2>
          <p className="text-slate-400 text-sm sm:text-base text-center max-w-2xl mx-auto mb-10 sm:mb-12">{l.whySub}</p>
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

      {/* Gallery / Success Stories */}
      <section className="max-w-7xl mx-auto px-4 py-14 sm:py-20">
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
              📸 {l.gallery}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{l.gallery}</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-md">{l.gallerySub}</p>
          </div>
          <Link href="/gallery" className="text-sm font-semibold text-green-700 hover:underline shrink-0">
            {l.galleryViewAll}
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Placeholder skeleton cards when empty */}
            {[
              { emoji: '🎓', label: 'Student Journeys' },
              { emoji: '🏆', label: 'Milestones' },
              { emoji: '🌏', label: 'Japan Placements' },
              { emoji: '🤝', label: 'Agency Partners' },
            ].map((p) => (
              <div key={p.label} className="aspect-square rounded-2xl bg-gradient-to-br from-green-50 to-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-2 text-center p-4">
                <div className="text-4xl">{p.emoji}</div>
                <div className="text-sm font-medium text-slate-600">{p.label}</div>
                <div className="text-xs text-slate-400">Coming soon</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((item) => (
              <Link key={item.id} href="/gallery"
                className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-100 hover:border-green-200 hover:shadow-lg transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-white font-semibold text-xs leading-tight">{item.title}</p>
                  {item.description && (
                    <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{item.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/gallery"
            className="inline-flex items-center gap-2 border border-slate-200 hover:border-green-300 text-slate-700 hover:text-green-800 px-6 py-2.5 rounded-full text-sm font-medium transition-colors"
          >
            📸 Browse Full Gallery
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 sm:py-8 text-center text-sm text-slate-400">
        <div className="mb-3 flex items-center justify-center gap-4">
          <Link href="/about" className="hover:text-green-700 transition-colors">{l.about}</Link>
          <Link href="/terms" className="hover:text-green-700 transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-green-700 transition-colors">Privacy</Link>
        </div>
        {l.footer}
      </footer>
    </div>
  );
}
