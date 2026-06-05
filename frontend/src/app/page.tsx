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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetch(`${API}/gallery/featured`)
      .then((r) => r.json())
      .then((data) => setFeatured(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const GATEWAYS = [
    {
      type: 'student', icon: '🎓',
      title: l.gateways.studentTitle,
      desc: l.gateways.studentDesc,
      tag: lang === 'ja' ? 'Most Popular' : 'Most Popular',
      size: 'lg',
    },
    { type: 'agency', icon: '🏢', title: l.gateways.agencyTitle, desc: l.gateways.agencyDesc, tag: null, size: 'sm' },
    { type: 'institution', icon: '🏫', title: l.gateways.institutionTitle, desc: l.gateways.institutionDesc, tag: null, size: 'sm' },
    { type: 'affiliate', icon: '💼', title: l.gateways.affiliateTitle, desc: l.gateways.affiliateDesc, tag: null, size: 'sm' },
  ];

  const FEATURES = [
    { icon: '🔒', title: l.features.f1Title, desc: l.features.f1Desc, color: 'from-green-500/20 to-green-600/5' },
    { icon: '🤝', title: l.features.f2Title, desc: l.features.f2Desc, color: 'from-cyan-500/20 to-cyan-600/5' },
    { icon: '🛡️', title: l.features.f3Title, desc: l.features.f3Desc, color: 'from-violet-500/20 to-violet-600/5' },
    { icon: '📋', title: l.features.f4Title, desc: l.features.f4Desc, color: 'from-amber-500/20 to-amber-600/5' },
  ];

  const STATS = [
    { value: '100%', label: lang === 'ja' ? 'OCR認証' : 'OCR Verified' },
    { value: '0', label: lang === 'ja' ? '偽データ' : 'Fake Profiles' },
    { value: 'BD→JP', label: lang === 'ja' ? '最初のルート' : 'First Corridor' },
    { value: '4', label: lang === 'ja' ? 'ゲートウェイ' : 'Gateways' },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117]">

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-nav' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/tensai-logo.png" alt="Tensai" width={36} height={36} className="rounded-full object-contain" />
            <div>
              <div className="text-lg font-bold text-white tracking-tight leading-none">Tensai</div>
              <div className="text-[9px] text-white/40 tracking-wider leading-none mt-0.5 hidden sm:block">THE WAY OF GLOBAL CAREER</div>
            </div>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={toggle}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10 text-white/60 hover:border-green-500/40 hover:text-green-400 transition-all"
            >
              {lang === 'en' ? '日本語' : 'English'}
            </button>
            <Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors px-2 py-1 hidden sm:inline">
              {lang === 'ja' ? '私たちについて' : 'About'}
            </Link>
            <Link href="/gallery" className="text-sm text-white/60 hover:text-white transition-colors px-2 py-1 hidden sm:inline">
              {l.gallery}
            </Link>
            <Link href="/auth/login" className="text-sm text-white/70 hover:text-white transition-colors px-3 py-1.5">
              {l.login}
            </Link>
            <Link href="/auth/register" className="text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full font-semibold transition-all glow-green">
              {l.getStarted}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-mesh min-h-screen flex flex-col items-center justify-center px-4 pt-16 pb-20 text-center relative overflow-hidden">
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto animate-fade-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {l.badge}
          </div>

          {/* Headline */}
          <h1 className="text-fluid-hero font-black text-white tracking-tight mb-6">
            {l.heroTitle}<br />
            <span className="gradient-text">{l.heroHighlight}</span>
          </h1>

          {/* JP sub-label */}
          <p className="text-white/30 text-sm font-medium tracking-[0.3em] mb-5 uppercase">
            {lang === 'ja' ? 'グローバルキャリアへの道' : 'The Way of Global Career · 天才'}
          </p>

          <p className="text-fluid-lg text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            {l.heroSub}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <Link href="/auth/register?type=student"
              className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-full font-bold text-sm transition-all glow-green">
              {l.ctaStudent}
            </Link>
            <Link href="/auth/register?type=agency"
              className="w-full sm:w-auto glass-card text-white/80 hover:text-white px-8 py-4 rounded-full font-semibold text-sm transition-all">
              {l.ctaAgency}
            </Link>
            <Link href="/auth/register?type=institution"
              className="w-full sm:w-auto glass-card text-white/80 hover:text-white px-8 py-4 rounded-full font-semibold text-sm transition-all">
              {l.ctaInstitution}
            </Link>
          </div>

          {/* Stats strip */}
          <div className="inline-flex items-center gap-0 rounded-2xl overflow-hidden border border-white/8 divide-x divide-white/8">
            {STATS.map((s) => (
              <div key={s.label} className="px-5 py-3 bg-white/[0.03] text-center">
                <div className="text-white font-bold text-base">{s.value}</div>
                <div className="text-white/40 text-[10px] mt-0.5 whitespace-nowrap">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0d1117] to-transparent" />
      </section>

      {/* ── Gateway Bento Grid ── */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="text-center mb-10">
          <p className="text-white/30 text-xs font-semibold tracking-[0.3em] uppercase mb-3">
            {lang === 'ja' ? 'ゲートウェイを選択' : 'Choose Your Gateway'}
          </p>
          <h2 className="text-fluid-4xl font-bold text-white">
            {lang === 'ja' ? '誰のために作られたか' : 'Built for everyone in the ecosystem'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GATEWAYS.map((g) => (
            <Link key={g.type} href={`/auth/register?type=${g.type}`}
              className={`group glass-card card-hover-glow rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 relative overflow-hidden ${g.size === 'lg' ? 'lg:col-span-2 lg:row-span-1' : ''}`}
            >
              {g.tag && (
                <span className="absolute top-4 right-4 text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
                  {g.tag}
                </span>
              )}
              <div className="text-4xl">{g.icon}</div>
              <div>
                <h3 className="font-bold text-white mb-1.5">{g.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{g.desc}</p>
              </div>
              <div className="mt-auto text-xs text-green-400 font-semibold group-hover:gap-2 flex items-center gap-1 transition-all">
                {l.getAccess} <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Why Tensai ── */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-white/30 text-xs font-semibold tracking-[0.3em] uppercase mb-3">
              {lang === 'ja' ? 'なぜ天才か' : 'Why Tensai'}
            </p>
            <h2 className="text-fluid-4xl font-bold text-white mb-3">{l.whyTitle}</h2>
            <p className="text-fluid-base text-white/40 max-w-2xl mx-auto">{l.whySub}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-card rounded-2xl p-6 flex flex-col gap-4 card-hover-glow transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-white text-sm">{f.title}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BD → JP Corridor Banner ── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 via-transparent to-cyan-600/5 rounded-3xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-4 mb-6">
                <span className="text-4xl animate-float">🇧🇩</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 sm:w-24 h-px bg-gradient-to-r from-white/20 to-green-400/60" />
                  <span className="text-green-400 font-bold text-sm">✈️</span>
                  <div className="w-16 sm:w-24 h-px bg-gradient-to-r from-green-400/60 to-white/20" />
                </div>
                <span className="text-4xl animate-float" style={{ animationDelay: '2s' }}>🇯🇵</span>
              </div>
              <h3 className="text-fluid-3xl font-bold text-white mb-3">
                {lang === 'ja' ? 'バングラデシュから日本へ' : 'Bangladesh → Japan'}
              </h3>
              <p className="text-fluid-base text-white/50 max-w-xl mx-auto mb-7">
                {lang === 'ja'
                  ? '最初のルートはバングラデシュから日本。最も厳格な基準でシステムを構築し、世界に拡張する。'
                  : "Our first corridor. Japan demands the highest verification standards — we built a system that meets them, then expands globally."}
              </p>
              <Link href="/about" className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 hover:border-green-500/30 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all">
                {lang === 'ja' ? '私たちのストーリーを読む →' : 'Read Our Story →'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Gallery ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-white/30 text-xs font-semibold tracking-[0.3em] uppercase mb-2">📸 {l.gallery}</p>
            <h2 className="text-fluid-3xl font-bold text-white">{l.gallery}</h2>
            <p className="text-fluid-sm text-white/40 mt-1 max-w-md">{l.gallerySub}</p>
          </div>
          <Link href="/gallery" className="text-sm font-semibold text-green-400 hover:text-green-300 transition-colors shrink-0">
            {l.galleryViewAll}
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { emoji: '🎓', label: 'Student Journeys' },
              { emoji: '🏆', label: 'Milestones' },
              { emoji: '🌏', label: 'Japan Placements' },
              { emoji: '🤝', label: 'Agency Partners' },
            ].map((p) => (
              <div key={p.label} className="aspect-square rounded-2xl glass-card flex flex-col items-center justify-center gap-2 text-center p-4">
                <div className="text-4xl">{p.emoji}</div>
                <div className="text-sm font-medium text-white/60">{p.label}</div>
                <div className="text-xs text-white/30">Coming soon</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((item) => (
              <Link key={item.id} href="/gallery"
                className="group relative aspect-square rounded-2xl overflow-hidden border border-white/8 hover:border-green-500/30 transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image_url} alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-white font-semibold text-xs leading-tight">{item.title}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/gallery"
            className="inline-flex items-center gap-2 glass-card hover:border-green-500/30 text-white/70 hover:text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all">
            📸 Browse Full Gallery
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/tensai-logo.png" alt="Tensai" width={32} height={32} className="rounded-full object-contain opacity-80" />
              <span className="font-bold text-white/80">Tensai</span>
            </Link>
            <div className="flex items-center gap-5 text-sm text-white/40">
              <Link href="/about" className="hover:text-white/70 transition-colors">{lang === 'ja' ? '私たちについて' : 'About'}</Link>
              <Link href="/terms" className="hover:text-white/70 transition-colors">{lang === 'ja' ? '利用規約' : 'Terms'}</Link>
              <Link href="/privacy" className="hover:text-white/70 transition-colors">{lang === 'ja' ? 'プライバシー' : 'Privacy'}</Link>
              <Link href="/gallery" className="hover:text-white/70 transition-colors">{l.gallery}</Link>
            </div>
            <p className="text-xs text-white/25">{l.footer}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
