'use client';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

interface Props {
  children: React.ReactNode;
  title?: string;
}

const NAV = [
  {
    label: 'Overview',
    href: '/dashboard/agency',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    label: 'Applications',
    href: '/dashboard/agency/applicants',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    label: 'Private Vault',
    href: '/dashboard/agency/vault',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
  {
    label: 'Lead Pool',
    href: '/dashboard/agency/pool',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    label: 'Profile',
    href: '/dashboard/agency/profile',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  {
    label: 'Settings',
    href: '/dashboard/agency/settings',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
];

export default function AgencyLayout({ children, title }: Props) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    staleTime: 120_000,
    refetchInterval: 120_000,
    enabled: !!mounted,
  });
  const unreadCount: number = notifData?.unread_count ?? 0;
  const notifications: { id: number; title: string; body: string; action_url?: string; read_at: string | null }[] =
    notifData?.notifications ?? notifData?.data ?? [];
  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted && !user) router.push('/auth/login'); }, [mounted, user, router]);
  useEffect(() => { setSidebarOpen(false); setUserMenuOpen(false); setNotifOpen(false); }, [pathname]);
  useEffect(() => {
    function h(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <div className="w-56 bg-white border-r border-slate-100 shrink-0" />
        <div className="flex-1 p-8">
          <div className="h-6 w-40 bg-slate-200 rounded animate-pulse mb-6" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white rounded-xl border border-slate-100 animate-pulse mb-3" />
          ))}
        </div>
      </div>
    );
  }

  const initial = user.name?.charAt(0).toUpperCase() ?? '?';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-100">
        <Link href="/dashboard/agency" className="flex items-center gap-3">
          <Image src="/tensai-logo.png" alt="Tensai" width={30} height={30} className="rounded-full object-contain shrink-0" />
          <div>
            <div className="text-sm font-bold text-slate-900 leading-tight">Tensai</div>
            <div className="text-[10px] text-slate-400 tracking-wide uppercase">Agency Portal</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] px-3.5 mb-2">Navigation</p>
        <ul className="space-y-0.5">
          {NAV.map(item => {
            const exact = item.href === '/dashboard/agency';
            const active = exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 py-2.5 pr-3 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'pl-2.5 border-l-2 border-green-600 bg-green-50/60 text-green-700'
                      : 'pl-3.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <svg className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-green-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-100" ref={userMenuRef}>
        <button
          onClick={() => setUserMenuOpen(o => !o)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
        >
          <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 truncate">{user.name}</div>
            <div className="text-xs text-slate-400 truncate">Agency</div>
          </div>
          <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {userMenuOpen && (
          <div className="mt-1 bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
            <Link href="/" className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>
            <button
              onClick={async () => { await logout(); router.push('/auth/login'); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors border-t border-slate-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-100 shrink-0 fixed top-0 left-0 h-screen z-20">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-56 bg-white h-full shadow-xl flex flex-col z-40">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 sticky top-0 z-20 h-16 flex items-center justify-between px-5 sm:px-8 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="md:hidden p-2.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {title && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em] hidden sm:block">Agency Portal</p>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">{title}</h1>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifOpen(o => !o);
                  if (!notifOpen && unreadCount > 0) markAllRead.mutate();
                }}
                className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
              >
                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 z-10 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">Notifications</p>
                    {unreadCount > 0 && <span className="text-xs text-slate-400">{unreadCount} unread</span>}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-sm text-slate-400">No notifications yet</p>
                      </div>
                    ) : notifications.slice(0, 20).map(n => (
                      <div key={n.id} className={`px-4 py-3 ${!n.read_at ? 'bg-green-50/60' : ''}`}>
                        {n.action_url ? (
                          <Link href={n.action_url} onClick={() => setNotifOpen(false)} className="block">
                            <p className="text-xs font-semibold text-slate-800 leading-snug">{n.title}</p>
                            {n.body && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>}
                          </Link>
                        ) : (
                          <>
                            <p className="text-xs font-semibold text-slate-800 leading-snug">{n.title}</p>
                            {n.body && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile avatar */}
            <div className="md:hidden w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
              {initial}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-5 sm:px-8 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-100 bg-white mt-auto">
          <div className="px-6 py-4 flex items-center justify-between">
            <p className="text-xs text-slate-400">© 2026 Tensai. All rights reserved.</p>
            <p className="text-[11px] text-slate-400">Agency Portal</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
