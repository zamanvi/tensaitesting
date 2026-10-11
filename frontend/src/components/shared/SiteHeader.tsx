'use client';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type NavKey = 'home' | 'about' | 'team' | 'gallery' | 'branches' | 'feed' | 'mobility' | 'contact';

const ADMIN_URL = 'https://tensai-production-3af6.up.railway.app/admin';

export default function SiteHeader({ active }: { active?: NavKey }) {
  const { t, lang, toggle } = useLang();
  const l = t.landing;
  const a = t.about;
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.roles?.some((r) => r === 'admin' || r === 'super_admin');
  const dashboardHref = user ? (isAdmin ? ADMIN_URL : `/dashboard/${user.gateway_type}`) : null;

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleLabel = lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English';
  const toggleAriaLabel = lang === 'en'
    ? 'Switch to Bangla'
    : lang === 'bn'
    ? '日本語に切り替える'
    : 'Switch to English';

  // Same six links, same order, on every page — this is the whole point of
  // this component: no route should show a subset of the site's nav.
  // `wide` links only join the desktop strip from 1100px up: below that the bar
  // is already full and one more link would push "Get Started" off the edge.
  // They are always present in the mobile menu.
  const NAV_LINKS: { key: NavKey; href: string; label: string; wide?: boolean }[] = [
    { key: 'about',    href: '/about',    label: a.navAbout },
    { key: 'team',     href: '/team',     label: a.navTeam },
    { key: 'gallery',  href: '/gallery',  label: a.navGallery },
    { key: 'branches', href: '/branches', label: ja ? '支局' : bn ? 'শাখা' : 'Branches' },
    { key: 'feed',     href: '/feed',     label: ja ? 'ガイド' : bn ? 'গাইড' : 'Guide' },
    { key: 'mobility', href: '/mobility', label: bn ? 'দক্ষ কর্মী মোবিলিটি' : 'Skilled Worker Mobility', wide: true },
    { key: 'contact', href: '/contact',  label: ja ? 'お問い合わせ' : bn ? 'যোগাযোগ' : 'Contact' },
  ];

  const linkClass = (key: NavKey, wide = false) =>
    `text-sm px-2 py-1 hidden ${wide ? 'min-[1100px]:inline whitespace-nowrap' : 'md:inline'} transition-colors ${
      active === key ? 'font-semibold text-green-400 border-b border-green-500/50' : 'text-white/50 hover:text-white'
    }`;

  const mobileLinkClass = (key: NavKey) =>
    `text-sm px-3 py-2.5 rounded-xl transition-all ${
      active === key ? 'font-semibold text-green-400 bg-green-500/[0.08]' : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
    }`;

  return (
    <nav
      aria-label={ja ? 'メインナビゲーション' : bn ? 'প্রধান নেভিগেশন' : 'Main navigation'}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-nav' : 'bg-transparent'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image src="/tensai-logo.png" alt="Tensai" width={36} height={36} className="rounded-full object-contain" priority />
          <div>
            <div className="text-base font-bold text-white tracking-tight leading-none">Tensai</div>
            <div className="text-[9px] text-white/35 tracking-wider leading-none mt-0.5 hidden sm:block">
              {ja ? 'グローバルキャリアへの道' : bn ? 'বৈশ্বিক ক্যারিয়ারের পথ' : 'THE WAY OF GLOBAL CAREER'}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={toggleAriaLabel}
            className="text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10 text-white/60 hover:border-green-500/40 hover:text-green-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
          >
            {toggleLabel}
          </button>
          {NAV_LINKS.map((n) => (
            <Link key={n.key} href={n.href} className={linkClass(n.key, n.wide)}>{n.label}</Link>
          ))}
          {dashboardHref ? (
            <Link
              href={dashboardHref}
              target={isAdmin ? '_blank' : undefined}
              rel={isAdmin ? 'noopener noreferrer' : undefined}
              className="text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full font-semibold transition-all glow-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300 hidden sm:inline"
            >
              {ja ? 'ダッシュボード' : bn ? 'ড্যাশবোর্ড' : 'Dashboard'}
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-white/65 hover:text-white transition-colors px-3 py-1.5 hidden sm:inline">{l.login}</Link>
              <Link
                href="/auth/register"
                className="text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full font-semibold transition-all glow-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300 hidden sm:inline"
              >
                {l.getStarted}
              </Link>
            </>
          )}
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
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

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0d1117]/95 backdrop-blur-md border-t border-white/[0.08] px-4 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((n) => (
            <Link key={n.key} href={n.href} onClick={() => setMobileOpen(false)} className={mobileLinkClass(n.key)}>{n.label}</Link>
          ))}
          <div className="border-t border-white/[0.08] mt-2 pt-3 flex gap-2">
            {dashboardHref ? (
              <Link
                href={dashboardHref}
                target={isAdmin ? '_blank' : undefined}
                rel={isAdmin ? 'noopener noreferrer' : undefined}
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-full font-semibold transition-all"
              >
                {ja ? 'ダッシュボード' : bn ? 'ড্যাশবোর্ড' : 'Dashboard'}
              </Link>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm text-white/70 hover:text-white border border-white/10 hover:border-white/25 px-4 py-2.5 rounded-full transition-all">{l.login}</Link>
                <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-full font-semibold transition-all">{l.getStarted}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
