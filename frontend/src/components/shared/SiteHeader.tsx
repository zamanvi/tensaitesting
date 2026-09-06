'use client';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import { PUBLIC_API } from '@/lib/publicApi';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type NavKey = 'home' | 'about' | 'team' | 'gallery' | 'branches' | 'feed' | 'contact';

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
  // Company-wide only (Admin → Site Settings → Social Media Links) — the
  // header is identical on every page, so it can't sensibly show a specific
  // branch's own Facebook page. A branch's own page shows its own link.
  const [social, setSocial] = useState<{ facebook_url?: string; youtube_url?: string }>({});

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetch(`${PUBLIC_API}/settings/public`)
      .then(r => r.json())
      .then(d => setSocial({ facebook_url: d.facebook_url, youtube_url: d.youtube_url }))
      .catch(() => {});
  }, []);

  const toggleLabel = lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English';
  const toggleAriaLabel = lang === 'en'
    ? 'Switch to Bangla'
    : lang === 'bn'
    ? '日本語に切り替える'
    : 'Switch to English';

  // Same six links, same order, on every page — this is the whole point of
  // this component: no route should show a subset of the site's nav.
  const NAV_LINKS: { key: NavKey; href: string; label: string }[] = [
    { key: 'about',    href: '/about',    label: a.navAbout },
    { key: 'team',     href: '/team',     label: a.navTeam },
    { key: 'gallery',  href: '/gallery',  label: a.navGallery },
    { key: 'branches', href: '/branches', label: ja ? '支局' : bn ? 'শাখা' : 'Branches' },
    { key: 'feed',     href: '/feed',     label: ja ? 'ガイド' : bn ? 'গাইড' : 'Guide' },
    { key: 'contact',  href: '/contact',  label: ja ? 'お問い合わせ' : bn ? 'যোগাযোগ' : 'Contact' },
  ];

  const linkClass = (key: NavKey) =>
    `text-sm px-2 py-1 hidden md:inline transition-colors ${
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
          {social.facebook_url && (
            <a
              href={social.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full border border-white/10 text-white/50 hover:border-green-500/40 hover:text-green-400 transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z"/></svg>
            </a>
          )}
          {social.youtube_url && (
            <a
              href={social.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full border border-white/10 text-white/50 hover:border-green-500/40 hover:text-green-400 transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.51 3.5 12 3.5 12 3.5s-7.51 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.87.55 9.38.55 9.38.55s7.51 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81ZM9.6 15.5V8.5l6.42 3.5-6.42 3.5Z"/></svg>
            </a>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label={toggleAriaLabel}
            className="text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10 text-white/60 hover:border-green-500/40 hover:text-green-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
          >
            {toggleLabel}
          </button>
          {NAV_LINKS.map((n) => (
            <Link key={n.key} href={n.href} className={linkClass(n.key)}>{n.label}</Link>
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
          {(social.facebook_url || social.youtube_url) && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.08]">
              {social.facebook_url && (
                <a href={social.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                  className="flex items-center justify-center w-9 h-9 rounded-full border border-white/10 text-white/50 hover:border-green-500/40 hover:text-green-400 transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z"/></svg>
                </a>
              )}
              {social.youtube_url && (
                <a href={social.youtube_url} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                  className="flex items-center justify-center w-9 h-9 rounded-full border border-white/10 text-white/50 hover:border-green-500/40 hover:text-green-400 transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.51 3.5 12 3.5 12 3.5s-7.51 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.87.55 9.38.55 9.38.55s7.51 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81ZM9.6 15.5V8.5l6.42 3.5-6.42 3.5Z"/></svg>
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
