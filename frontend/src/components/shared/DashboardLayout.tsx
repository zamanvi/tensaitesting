'use client';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Props {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: Props) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, toggle } = useLang();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted && !user) router.push('/auth/login'); }, [mounted, user, router]);
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  if (!mounted || !user) return null;

  const NAV_LINKS: Record<string, { label: string; href: string }[]> = {
    student: [
      { label: t.nav.overview, href: '/dashboard/student' },
      { label: t.nav.applications, href: '/dashboard/student/leads' },
      { label: t.nav.documents, href: '/dashboard/student/profile/documents' },
      { label: t.nav.interviews, href: '/dashboard/student/interviews' },
    ],
    agency: [
      { label: t.nav.overview, href: '/dashboard/agency' },
      { label: t.nav.privateVault, href: '/dashboard/agency/vault' },
      { label: t.nav.openPool, href: '/dashboard/agency/pool' },
    ],
    institution: [
      { label: t.nav.overview, href: '/dashboard/institution' },
      { label: t.nav.browseStudents, href: '/dashboard/institution/browse' },
      { label: t.nav.interviews, href: '/dashboard/institution/interviews' },
    ],
    affiliate: [
      { label: t.nav.overview, href: '/dashboard/affiliate' },
      { label: t.nav.referrals, href: '/dashboard/affiliate/referrals' },
    ],
  };

  const links = NAV_LINKS[user.gateway_type] ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Left: logo + desktop links */}
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <Link href={`/dashboard/${user.gateway_type}`} className="font-bold text-indigo-700 shrink-0">
              Tensai
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
                    pathname === l.href
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: lang toggle + name + logout + hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggle}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors shrink-0"
            >
              {lang === 'en' ? '日本語' : 'English'}
            </button>
            <span className="text-sm text-slate-500 hidden sm:inline truncate max-w-32">{user.name}</span>
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="text-sm text-slate-500 hover:text-red-500 transition-colors hidden sm:inline"
            >
              {t.common.logout}
            </button>
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-slate-100"
              aria-label="Menu"
            >
              <span className={`block w-5 h-0.5 bg-slate-600 transition-transform ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
              <span className={`block w-5 h-0.5 bg-slate-600 transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-slate-600 transition-transform ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`block px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  pathname === l.href
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t border-slate-100 pt-3 mt-2 flex items-center justify-between">
              <span className="text-sm text-slate-500 truncate">{user.name}</span>
              <button
                onClick={() => { logout(); router.push('/'); }}
                className="text-sm text-red-500 font-medium"
              >
                {t.common.logout}
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {title && <h1 className="text-lg sm:text-xl font-bold text-slate-900 mb-5 sm:mb-6">{title}</h1>}
        {children}
      </main>
    </div>
  );
}
