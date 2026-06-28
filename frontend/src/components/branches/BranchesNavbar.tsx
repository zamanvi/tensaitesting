'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function BranchesNavbar() {
  const { t, lang, toggle } = useLang();
  const l = t.landing;
  const a = t.about;
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    const fn = () => {
      if (!ticking) {
        requestAnimationFrame(() => { setScrolled(window.scrollY > 20); ticking = false; });
        ticking = true;
      }
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0d1117]/95 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image src="/tensai-logo.png" alt="Tensai Logo" width={36} height={36} className="rounded-full object-contain" />
          <div>
            <div className="text-base font-bold text-white tracking-tight leading-none">Tensai</div>
            <div className="text-[9px] text-white/35 tracking-wider leading-none mt-0.5 hidden sm:block">THE WAY OF GLOBAL CAREER</div>
          </div>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={toggle} aria-label="Toggle language" className="text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10 text-white/60 hover:border-green-500/40 hover:text-green-400 transition-all">
            {lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English'}
          </button>
          <Link href="/about"    className="text-sm text-white/50 hover:text-white transition-colors px-2 py-1 hidden md:inline">{a.navAbout}</Link>
          <Link href="/team"     className="text-sm text-white/50 hover:text-white transition-colors px-2 py-1 hidden md:inline">{a.navTeam}</Link>
          <Link href="/gallery"  className="text-sm text-white/50 hover:text-white transition-colors px-2 py-1 hidden md:inline">{a.navGallery}</Link>
          <Link href="/branches" className="text-sm font-semibold text-green-400 px-2 py-1 hidden md:inline border-b border-green-500/50">{ja ? '支局' : bn ? 'শাখা' : 'Branches'}</Link>
          <Link href="/auth/login"    className="text-sm text-white/65 hover:text-white transition-colors px-3 py-1.5 hidden sm:inline">{l.login}</Link>
          <Link href="/auth/register" className="text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full font-semibold transition-all hidden sm:inline">{l.getStarted}</Link>
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="md:hidden p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
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
  );
}
