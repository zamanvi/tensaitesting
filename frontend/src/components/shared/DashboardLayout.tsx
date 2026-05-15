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
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          {/* Left: logo + desktop links */}
          <div className="flex items-center gap-4 sm:gap-6 min-w-0 flex-1">
            <Link href={`/dashboard/${user.gateway_type}`} className="font-bold text-indigo-700 shrink-0 text-base">
              Tensai
            </Link>
            <div className="hidden md:flex items-center gap-0.5 overflow-x-auto">
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

          {/* Right */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggle}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors min-h-[36px]"
            >
              {lang === 'en' ? '日本語' : 'EN'}
            </button>
            <span className="text-sm text-slate-500 hidden sm:inline truncate max-w-[120px]">{user.name}</span>
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="text-sm text-slate-500 hover:text-red-500 transition-colors hidden sm:inline whitespace-nowrap"
            >
              {t.common.logout}
            </button>
            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden flex flex-col justify-center gap-1.5 w-10 h-10 rounded-lg hover:bg-slate-100 items-center"
              aria-label="Menu"
            >
              <span className={`block w-5 h-0.5 bg-slate-600 transition-all duration-200 ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
              <span className={`block w-5 h-0.5 bg-slate-600 transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-slate-600 transition-all duration-200 ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 shadow-lg">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center px-4 py-3 rounded-xl text-sm transition-colors min-h-[48px] ${
                  pathname === l.href
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t border-slate-100 pt-3 mt-2 flex items-center justify-between px-1">
              <span className="text-sm text-slate-500 truncate max-w-[60%]">{user.name}</span>
              <button
                onClick={() => { logout(); router.push('/'); }}
                className="text-sm text-red-500 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                {t.common.logout}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-5 sm:py-8 pb-8">
        {title && <h1 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6">{title}</h1>}
        {children}
      </main>
    </div>
  );
}
