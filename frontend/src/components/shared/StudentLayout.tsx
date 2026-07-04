'use client';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface Notification {
  id: number; type: string; title: string; body: string;
  action_url: string | null; is_read: boolean; created_at: string;
}

interface Props { children: React.ReactNode; title?: string; }

const NAV = [
  {
    label: { en: 'My Application', ja: '申請', bn: 'আবেদন' },
    shortLabel: { en: 'Apply', ja: '申請', bn: 'আবেদন' },
    href: '/dashboard/student/leads',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: { en: 'My Experience', ja: '体験', bn: 'অভিজ্ঞতা' },
    shortLabel: { en: 'Story', ja: '体験', bn: 'স্টোরি' },
    href: '/dashboard/student/experience',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: { en: 'My CV', ja: '履歴書', bn: 'আমার সিভি' },
    shortLabel: { en: 'CV', ja: 'CV', bn: 'সিভি' },
    href: '/dashboard/student/cv',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    label: { en: 'Referral', ja: '紹介', bn: 'রেফারেল' },
    shortLabel: { en: 'Refer', ja: '紹介', bn: 'রেফার' },
    href: '/dashboard/student/referral',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: { en: 'Settings', ja: '設定', bn: 'সেটিংস' },
    shortLabel: { en: 'More', ja: '設定', bn: 'আরো' },
    href: '/dashboard/student/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function StudentLayout({ children, title }: Props) {
  const { user, logout, fetchMe } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { lang, toggle, t } = useLang();
  const qc = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    staleTime: 120_000,
    refetchInterval: 120_000,
    enabled: !!mounted,
  });
  const notifications: Notification[] = notifData?.notifications ?? [];
  const unreadCount: number = notifData?.unread_count ?? 0;

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await api.post('/student/account/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchMe();
    } catch {
      // silent — settings page shows errors
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  }

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted && !user) router.push('/auth/login'); }, [mounted, user, router]);
  useEffect(() => { setUserMenuOpen(false); setNotifOpen(false); }, [pathname]);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <div className="hidden md:flex w-60 shrink-0 bg-white border-r border-slate-200 flex-col">
          <div className="h-16 border-b border-slate-200 px-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200 animate-pulse" />
            <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="p-3 space-y-1">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-9 bg-slate-100 rounded-lg animate-pulse" />)}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-14 bg-white border-b border-slate-200" />
          <div className="flex-1 p-6 space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  const initials = (user.name ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`${mobile ? 'flex' : 'hidden md:flex'} flex-col w-60 bg-white border-r border-slate-200 h-full`}>

      {/* Logo */}
      <Link
        href="/dashboard/student/leads"
        className="h-16 px-5 flex items-center gap-3 border-b border-slate-200 hover:bg-slate-50 transition-colors shrink-0"
      >
        <Image src="/tensai-logo.png" alt="Tensai" width={32} height={32} className="rounded-lg object-contain shrink-0" />
        <span className="font-bold text-green-800 text-base tracking-tight">Tensai</span>
      </Link>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        <p className="px-3 pt-1 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {lang === 'ja' ? 'メニュー' : lang === 'bn' ? 'মেনু' : 'Menu'}
        </p>
        <nav className="space-y-0.5">
          {NAV.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const label = lang === 'ja' ? item.label.ja : lang === 'bn' ? item.label.bn : item.label.en;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-green-50 text-green-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-green-600 rounded-r" />}
                <span className={active ? 'text-green-700' : 'text-slate-400'}>{item.icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User block at bottom — with avatar upload */}
      <div className="border-t border-slate-200 px-3 py-3 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="relative shrink-0 group">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-9 h-9 rounded-xl object-cover border border-slate-200" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-green-700 flex items-center justify-center text-white text-xs font-bold select-none">
                {initials}
              </div>
            )}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="Change photo"
            >
              {avatarUploading
                ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              }
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{user.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-60 shrink-0 sticky top-0 h-screen">
        <Sidebar />
      </div>

      {/* Right side */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 h-14 flex items-center px-4 sm:px-6 gap-3">

          {/* Mobile: logo */}
          <Link href="/dashboard/student/leads" className="md:hidden flex items-center gap-2">
            <Image src="/tensai-logo.png" alt="Tensai" width={26} height={26} className="rounded-lg object-contain" />
            <span className="font-bold text-green-800 text-sm">Tensai</span>
          </Link>

          <div className="flex-1" />

          {/* Lang toggle */}
          <button
            onClick={toggle}
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:border-green-300 hover:text-green-700 transition-colors shrink-0"
          >
            {lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English'}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen(o => !o); if (!notifOpen && unreadCount > 0) markAllRead.mutate(); }}
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-40">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">
                    {lang === 'ja' ? '通知' : lang === 'bn' ? 'বিজ্ঞপ্তি' : 'Notifications'}
                  </span>
                  {notifications.length > 0 && <span className="text-xs text-slate-400">{notifications.length} total</span>}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-400 text-sm">
                      {lang === 'ja' ? '通知はありません' : lang === 'bn' ? 'কোনো বিজ্ঞপ্তি নেই' : 'No notifications yet'}
                    </div>
                  ) : notifications.map(n => (
                    <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-green-50/50' : ''}`}>
                      {n.action_url
                        ? <Link href={n.action_url} onClick={() => setNotifOpen(false)} className="block">
                            <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                          </Link>
                        : <>
                            <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                          </>}
                      {!n.is_read && <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mt-1" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-slate-100 transition-colors"
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
                  {initials}
                </div>
              )}
              <span className="hidden sm:block text-sm text-slate-700 font-medium truncate max-w-28">{user.name}</span>
              <svg className={`w-3 h-3 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-40">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                </div>
                <Link href="/" onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  {lang === 'bn' ? 'হোম' : lang === 'ja' ? 'ホーム' : 'Home'}
                </Link>
                <button
                  onClick={async () => { setUserMenuOpen(false); await logout(); router.push('/'); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-slate-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t.common.logout}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-auto">
          {title && (
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-5 tracking-tight">{title}</h1>
          )}
          {children}
        </main>

        {/* Footer — desktop only */}
        <footer className="hidden md:block bg-white border-t border-slate-200 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-400">{t.landing.footer}</span>
            <div className="flex items-center gap-5 text-xs text-slate-400">
              <Link href="/privacy" className="hover:text-slate-600 transition-colors">{t.landing.privacy}</Link>
              <Link href="/terms" className="hover:text-slate-600 transition-colors">{t.landing.terms}</Link>
              <a href="mailto:support@tensaiconsultancy.com" className="hover:text-slate-600 transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile bottom navigation — 5 items, icons only with tiny labels */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-stretch h-14">
          {NAV.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const short = lang === 'ja' ? item.shortLabel.ja : lang === 'bn' ? item.shortLabel.bn : item.shortLabel.en;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? 'text-green-700' : 'text-slate-400'
                }`}
              >
                <span className={`p-1 rounded-lg transition-colors ${active ? 'bg-green-50' : ''}`}>
                  {item.icon}
                </span>
                <span className="text-[9px] font-bold leading-none">{short}</span>
                {active && <span className="absolute top-0 left-2 right-2 h-0.5 bg-green-600 rounded-b" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
