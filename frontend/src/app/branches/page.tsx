'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://tensai-production-3af6.up.railway.app/api';

interface Branch {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  city: string;
  country: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  stats: Record<string, string> | null;
}

export default function BranchesPage() {
  const { t, lang, toggle } = useLang();
  const l = t.landing;
  const a = t.about;
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading]   = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    fetch(`${API}/branches`)
      .then(r => r.json())
      .then(d => setBranches(Array.isArray(d) ? d : []))
      .catch(() => setBranches([]))
      .finally(() => setLoading(false));
  }, []);

  const title   = ja ? '支局一覧' : bn ? 'আমাদের শাখাসমূহ' : 'Our Branches';
  const subtitle = ja ? '全国の支局からサポートを受けられます。' : bn ? 'সারা দেশে আমাদের শাখা অফিস থেকে সেবা নিন।' : 'Get support from our branch offices across the country.';

  return (
    <div className="min-h-screen bg-[#0d1117]">

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0d1117]/95 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/tensai-logo.png" alt="Tensai" width={36} height={36} className="rounded-full object-contain" />
            <div>
              <div className="text-base font-bold text-white tracking-tight leading-none">Tensai</div>
              <div className="text-[9px] text-white/35 tracking-wider leading-none mt-0.5 hidden sm:block">THE WAY OF GLOBAL CAREER</div>
            </div>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={toggle} className="text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10 text-white/60 hover:border-green-500/40 hover:text-green-400 transition-all">
              {lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English'}
            </button>
            <Link href="/about"    className="text-sm text-white/50 hover:text-white transition-colors px-2 py-1 hidden md:inline">{a.navAbout}</Link>
            <Link href="/team"     className="text-sm text-white/50 hover:text-white transition-colors px-2 py-1 hidden md:inline">{a.navTeam}</Link>
            <Link href="/gallery"  className="text-sm text-white/50 hover:text-white transition-colors px-2 py-1 hidden md:inline">{a.navGallery}</Link>
            <Link href="/branches" className="text-sm font-semibold text-green-400 px-2 py-1 hidden md:inline border-b border-green-500/50">{ja ? '支局' : bn ? 'শাখা' : 'Branches'}</Link>
            <Link href="/auth/login" className="text-sm text-white/65 hover:text-white transition-colors px-3 py-1.5 hidden sm:inline">{l.login}</Link>
            <Link href="/auth/register" className="text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full font-semibold transition-all hidden sm:inline">{l.getStarted}</Link>
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
              aria-label="Menu"
            >
              {mobileOpen
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
              }
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden bg-[#0d1117]/95 backdrop-blur-md border-t border-white/[0.08] px-4 py-4 flex flex-col gap-1">
            <Link href="/about"    onClick={() => setMobileOpen(false)} className="text-sm text-white/60 hover:text-white px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-all">{a.navAbout}</Link>
            <Link href="/team"     onClick={() => setMobileOpen(false)} className="text-sm text-white/60 hover:text-white px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-all">{a.navTeam}</Link>
            <Link href="/gallery"  onClick={() => setMobileOpen(false)} className="text-sm text-white/60 hover:text-white px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-all">{a.navGallery}</Link>
            <Link href="/branches" onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-green-400 px-3 py-2.5 rounded-xl bg-green-500/[0.08]">{ja ? '支局' : bn ? 'শাখা' : 'Branches'}</Link>
            <div className="border-t border-white/[0.08] mt-2 pt-3 flex gap-2">
              <Link href="/auth/login"    onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm text-white/70 border border-white/10 px-4 py-2.5 rounded-full">{l.login}</Link>
              <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-full font-semibold">{l.getStarted}</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative px-4 pt-32 pb-12 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {ja ? '全国展開' : bn ? 'সারাদেশে' : 'Nationwide'}
          </div>
          <h1 className="text-fluid-hero font-black text-white tracking-tight mb-4 leading-[1.06]">{title}</h1>
          <p className="text-fluid-base text-white/45 max-w-lg mx-auto leading-relaxed">{subtitle}</p>
        </div>
      </section>

      {/* Branch Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-2xl bg-white/[0.04] border border-white/[0.06] h-80 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && branches.length === 0 && (
          <div className="text-center py-20 max-w-lg mx-auto">
            <div className="text-5xl mb-5">🏢</div>
            <h2 className="text-white font-bold text-lg mb-2">
              {ja ? '支局は近日公開' : bn ? 'শাখা তথ্য শীঘ্রই আসছে' : 'Branch offices coming soon'}
            </h2>
            <p className="text-white/40 text-sm mb-6 leading-relaxed">
              {ja
                ? 'Tensaiは全国に支局ネットワークを構築中です。あなたの都市にも間もなく開設します。'
                : bn
                ? 'টেনসাই সারা দেশে শাখা অফিসের নেটওয়ার্ক তৈরি করছে। শীঘ্রই আপনার শহরেও আসছে।'
                : 'Tensai is building a nationwide branch office network. We will be in your city soon — register now to get notified.'}
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all"
            >
              {ja ? '今すぐ登録 →' : bn ? 'এখনই নিবন্ধন করুন →' : 'Register to get notified →'}
            </Link>
          </div>
        )}

        {!loading && branches.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map(branch => (
              <Link key={branch.id} href={`/branches/${branch.slug}`}
                className="group relative rounded-2xl overflow-hidden border border-white/[0.08] hover:border-green-500/30 transition-all bg-white/[0.02] hover:bg-white/[0.04]">

                {/* Cover image */}
                <div className="h-44 bg-gradient-to-br from-green-900/30 to-slate-900/50 overflow-hidden">
                  {branch.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={branch.cover_image_url} alt={branch.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🏢</div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    {branch.logo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={branch.logo_url} alt="" className="w-7 h-7 rounded-full object-cover border border-white/10" />
                    )}
                    <h3 className="font-bold text-white text-sm">{branch.name}</h3>
                  </div>
                  <p className="text-green-400 text-xs font-medium mb-3">📍 {branch.city}{branch.country && branch.country !== 'Bangladesh' ? `, ${branch.country}` : ''}</p>

                  {branch.tagline && (
                    <p className="text-white/45 text-xs leading-relaxed mb-4 line-clamp-2">{branch.tagline}</p>
                  )}

                  {/* Stats */}
                  {branch.stats && Object.keys(branch.stats).length > 0 && (
                    <div className="flex gap-3 mb-4">
                      {Object.entries(branch.stats).slice(0, 3).map(([key, val]) => (
                        <div key={key} className="text-center">
                          <div className="text-green-400 font-bold text-sm">{val}</div>
                          <div className="text-white/30 text-[9px]">{key}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-white/45 space-y-0.5">
                      {branch.phone && <div>📞 {branch.phone}</div>}
                      {branch.address && <div className="line-clamp-1">🏠 {branch.address}</div>}
                    </div>
                    <span className="text-xs text-green-400 font-semibold group-hover:translate-x-1 transition-transform">
                      {ja ? '詳細 →' : bn ? 'বিস্তারিত →' : 'View →'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-4 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/tensai-logo.png" alt="Tensai" width={28} height={28} className="rounded-full object-contain" />
            <span className="text-sm font-bold text-white/75">Tensai</span>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/38">
            <Link href="/about"    className="hover:text-white/65 transition-colors">{a.navAbout}</Link>
            <Link href="/team"     className="hover:text-white/65 transition-colors">{a.navTeam}</Link>
            <Link href="/gallery"  className="hover:text-white/65 transition-colors">{a.navGallery}</Link>
            <Link href="/branches" className="text-green-400 font-medium">{ja ? '支局' : bn ? 'শাখা' : 'Branches'}</Link>
          </div>
          <p className="text-xs text-white/30">{l.footer}</p>
        </div>
      </footer>
    </div>
  );
}
