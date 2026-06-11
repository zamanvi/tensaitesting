'use client';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

interface Props {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: Props) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, toggle } = useLang();
  const qc = useQueryClient();
  // Read affiliate type from cache (populated by affiliate dashboard/profile queries)
  const affiliateDash = qc.getQueryData<{ affiliate_type?: string }>(['affiliate-dashboard']);
  const affiliateType = affiliateDash?.affiliate_type ?? null;
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled: !!mounted,
  });
  const notifications: Notification[] = notifData?.notifications ?? [];
  const unreadCount: number = notifData?.unread_count ?? 0;

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted && !user) router.push('/auth/login'); }, [mounted, user, router]);
  useEffect(() => { setMenuOpen(false); setUserMenuOpen(false); setNotifOpen(false); }, [pathname]);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const NAV_LINKS: Record<string, { label: string; href: string }[]> = useMemo(() => ({
    admin: [
      { label: lang === 'ja' ? 'ギャラリー管理' : lang === 'bn' ? 'গ্যালারি ম্যানেজ' : 'Gallery', href: '/dashboard/admin/gallery' },
      { label: lang === 'ja' ? 'ユーザー管理' : lang === 'bn' ? 'ইউজার ম্যানেজ' : 'Users', href: '/dashboard/admin/users' },
      { label: lang === 'ja' ? 'エージェンシー審査' : lang === 'bn' ? 'এজেন্সি অ্যাপ্রুভাল' : 'Agency Vetting', href: '/dashboard/admin/agencies' },
    ],
    student: [
      { label: t.nav.overview, href: '/dashboard/student' },
      { label: t.nav.profile, href: '/dashboard/student/profile' },
      { label: t.nav.applications, href: '/dashboard/student/leads' },
      { label: t.nav.documents, href: '/dashboard/student/profile/documents' },
      { label: lang === 'ja' ? '情報入力' : lang === 'bn' ? 'তথ্য পূরণ' : 'Fill-up Info', href: '/dashboard/student/profile/info' },
      { label: t.nav.interviews, href: '/dashboard/student/interviews' },
    ],
    agency: [
      { label: t.nav.overview, href: '/dashboard/agency' },
      { label: lang === 'ja' ? 'プロフィール' : lang === 'bn' ? 'প্রোফাইল' : 'Agency Profile', href: '/dashboard/agency/profile' },
      { label: t.nav.privateVault, href: '/dashboard/agency/vault' },
    ],
    institution: [
      { label: t.nav.overview, href: '/dashboard/institution' },
      { label: lang === 'ja' ? '応募一覧' : lang === 'bn' ? 'আবেদন তালিকা' : 'Applications', href: '/dashboard/institution/leads' },
      { label: t.nav.browseStudents, href: '/dashboard/institution/browse' },
      { label: t.nav.interviews, href: '/dashboard/institution/interviews' },
      { label: t.nav.institutionProfile, href: '/dashboard/institution/profile' },
    ],
    branch_admin: [
      { label: lang === 'ja' ? '支局管理' : lang === 'bn' ? 'শাখা ড্যাশবোর্ড' : 'Branch Dashboard', href: '/dashboard/branch' },
    ],
    affiliate: [
      { label: t.nav.overview, href: '/dashboard/affiliate' },
      { label: lang === 'ja' ? 'プロフィール' : lang === 'bn' ? 'প্রোফাইল' : 'Profile & Payout', href: '/dashboard/affiliate/profile' },
      // Local-only
      ...(affiliateType === 'local' ? [
        { label: lang === 'ja' ? '紹介学生' : lang === 'bn' ? 'স্টুডেন্টস' : 'Students', href: '/dashboard/affiliate/students' },
      ] : []),
      // Global-only
      ...(affiliateType === 'global' ? [
        { label: lang === 'ja' ? '機関管理' : lang === 'bn' ? 'প্রতিষ্ঠান' : 'Institutions', href: '/dashboard/affiliate/institutions' },
        { label: lang === 'ja' ? '従業員管理' : lang === 'bn' ? 'কর্মী' : 'Employees', href: '/dashboard/affiliate/employees' },
      ] : []),
      // Both
      { label: lang === 'ja' ? 'コミッション' : lang === 'bn' ? 'কমিশন' : 'Commissions', href: '/dashboard/affiliate/commissions' },
      // Local upgrade link
      ...(affiliateType === 'local' ? [
        { label: lang === 'ja' ? 'グローバルへ' : lang === 'bn' ? 'আপগ্রেড' : 'Upgrade', href: '/dashboard/affiliate/upgrade' },
      ] : []),
    ],
  }), [lang, t, affiliateType]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted || !user) return null;

  const userInitial = user.name?.charAt(0).toUpperCase() ?? '?';
  const isAdmin = user.roles?.some(r => r === 'admin' || r === 'super_admin') ?? false;
  const isBranchAdmin = user.roles?.some(r => r === 'branch_admin' || r === 'branch_manager') ?? false;
  const links = isAdmin ? NAV_LINKS.admin : isBranchAdmin ? NAV_LINKS.branch_admin : (NAV_LINKS[user.gateway_type] ?? []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between">

          {/* Left: logo + desktop nav */}
          <div className="flex items-center min-w-0">
            <Link href={isAdmin ? '/dashboard/admin/gallery' : isBranchAdmin ? '/dashboard/branch' : `/dashboard/${user.gateway_type}`} className="flex items-center gap-2 shrink-0 mr-4">
              <Image src="/tensai-logo.png" alt="Tensai" width={30} height={30} className="rounded-full object-contain" />
              <span className="font-bold text-green-800 tracking-tight">Tensai</span>
            </Link>
            <div className="hidden md:flex items-center h-14">
              {links.map((l) => {
                const active = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`relative flex items-center h-full px-3 text-sm transition-colors whitespace-nowrap ${
                      active ? 'text-green-800 font-medium' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {l.label}
                    {active && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-green-600 rounded-t-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: lang toggle + notifications + user avatar + hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggle}
              className="text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200 text-slate-500 hover:border-green-300 hover:text-green-700 transition-colors shrink-0"
            >
              {lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English'}
            </button>

            {/* Notification bell */}
            <div className="relative hidden sm:block" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(o => !o); if (!notifOpen && unreadCount > 0) markAllRead.mutate(); }}
                className="relative p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                aria-label={lang === 'ja' ? '通知' : lang === 'bn' ? 'বিজ্ঞপ্তি' : 'Notifications'}
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-30">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">
                      {lang === 'ja' ? '通知' : lang === 'bn' ? 'বিজ্ঞপ্তি' : 'Notifications'}
                    </span>
                    {notifications.length > 0 && (
                      <span className="text-xs text-slate-400">{notifications.length} {lang === 'ja' ? '件' : lang === 'bn' ? 'টি' : 'total'}</span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-slate-400 text-sm">
                        {lang === 'ja' ? '通知はありません' : lang === 'bn' ? 'কোনো বিজ্ঞপ্তি নেই' : 'No notifications yet'}
                      </div>
                    ) : notifications.map((n) => (
                      <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-green-50/50' : ''}`}>
                        {n.action_url ? (
                          <Link href={n.action_url} onClick={() => setNotifOpen(false)} className="block">
                            <div className="text-xs font-semibold text-slate-800">{n.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</div>
                            <div className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
                          </Link>
                        ) : (
                          <>
                            <div className="text-xs font-semibold text-slate-800">{n.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</div>
                            <div className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
                          </>
                        )}
                        {!n.is_read && <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mt-1" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User dropdown — desktop */}
            <div className="relative hidden sm:block" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full pl-1 pr-2.5 py-1 hover:bg-slate-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
                  {userInitial}
                </div>
                <span className="text-sm text-slate-700 font-medium truncate max-w-36">{user.name}</span>
                <svg
                  className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden z-30">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">{user.email}</div>
                  </div>
                  {/* Home link */}
                  <Link
                    href="/"
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    {lang === 'bn' ? 'হোম' : lang === 'ja' ? 'ホーム' : 'Home'}
                  </Link>
                  <button
                    onClick={async () => { setUserMenuOpen(false); await logout(); router.push('/'); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-slate-100"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t.common.logout}
                  </button>
                </div>
              )}
            </div>

            {/* Hamburger — mobile */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              aria-label={lang === 'ja' ? 'メニュー' : lang === 'bn' ? 'মেনু' : 'Menu'}
              aria-expanded={menuOpen}
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
                    ? 'bg-green-50 text-green-800 font-medium'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t border-slate-100 pt-3 mt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-sm font-bold shrink-0 select-none">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{user.name}</div>
                  <div className="text-xs text-slate-400 truncate">{user.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link href="/" className="text-sm text-slate-500 font-medium hover:text-green-700 transition-colors">
                  {lang === 'bn' ? 'হোম' : lang === 'ja' ? 'ホーム' : 'Home'}
                </Link>
                <button
                  onClick={async () => { await logout(); router.push('/'); }}
                  className="text-sm text-red-500 font-medium"
                >
                  {t.common.logout}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8">
        {title && <h1 className="text-lg sm:text-xl font-bold text-slate-900 mb-5 sm:mb-6">{title}</h1>}
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Image src="/tensai-logo.png" alt="Tensai" width={16} height={16} className="rounded-full object-contain opacity-50" />
            <span className="text-xs text-slate-400">{t.landing.footer}</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-400">
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms</Link>
            <a href="mailto:support@tensaiconsultancy.com" className="hover:text-slate-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
