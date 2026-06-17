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

interface BranchInfo {
  name: string;
  city: string | null;
  country: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  google_maps_url: string | null;
  working_hours: Record<string, string> | null;
  social_links: Record<string, string> | null;
}

const NAV = [
  { label: 'Dashboard',    href: '/dashboard/branch',            icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Applications', href: '/dashboard/branch/applicants', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Team',         href: '/dashboard/branch/team',       icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Gallery',      href: '/dashboard/branch/gallery',    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Settings',     href: '/dashboard/branch/settings',   icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export default function BranchLayout({ children, title }: Props) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data: branchInfo } = useQuery<BranchInfo>({
    queryKey: ['branch-settings'],
    queryFn: () => api.get('/branch-admin/settings').then(r => r.data),
    staleTime: 300_000,
    enabled: !!mounted,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    staleTime: 120_000,
    refetchInterval: 120_000,
    enabled: !!mounted,
  });
  const unreadCount: number = notifData?.unread_count ?? 0;
  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted && !user) router.push('/auth/branch-login'); }, [mounted, user, router]);
  useEffect(() => { setSidebarOpen(false); setUserMenuOpen(false); }, [pathname]);
  useEffect(() => {
    function h(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
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
        <Link href="/dashboard/branch" className="flex items-center gap-3">
          <Image src="/tensai-logo.png" alt="Tensai" width={30} height={30} className="rounded-full object-contain shrink-0" />
          <div>
            <div className="text-sm font-bold text-slate-900 leading-tight">Tensai</div>
            <div className="text-[9px] text-slate-400 tracking-widest uppercase">Branch Portal</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">Branch</p>
        <ul className="space-y-0.5">
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard/branch' && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-green-50 text-green-800 border border-green-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <svg className={`w-4 h-4 shrink-0 ${active ? 'text-green-700' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                  </svg>
                  {item.label}
                  {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-slate-100" ref={userMenuRef}>
        <button
          onClick={() => setUserMenuOpen(o => !o)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
        >
          <div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 truncate">{user.name}</div>
            <div className="text-[10px] text-slate-400 truncate">Branch Manager</div>
          </div>
          <svg className={`w-3 h-3 text-slate-400 shrink-0 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              onClick={async () => { await logout(); router.push('/auth/branch-login'); }}
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

      {/* Main content */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 sticky top-0 z-10 h-14 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {title && <h1 className="text-base font-bold text-slate-900">{title}</h1>}
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button
              onClick={() => { if (unreadCount > 0) markAllRead.mutate(); }}
              className="relative p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Mobile user avatar */}
            <div className="md:hidden w-7 h-7 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold">
              {initial}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 py-6">
          {children}
        </main>

        <footer className="border-t border-slate-100 bg-white mt-auto">
          {branchInfo && (
            <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6 border-b border-slate-50">

              {/* Branch identity */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-green-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">T</div>
                  <span className="text-sm font-bold text-slate-800">{branchInfo.name}</span>
                </div>
                {(branchInfo.city || branchInfo.country) && (
                  <p className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                    <span>📍</span>{[branchInfo.city, branchInfo.country].filter(Boolean).join(', ')}
                  </p>
                )}
                {branchInfo.address && (
                  <p className="text-xs text-slate-400 leading-relaxed">{branchInfo.address}</p>
                )}
              </div>

              {/* Contact */}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Contact</p>
                <div className="space-y-1.5">
                  {branchInfo.phone && (
                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                      <span className="text-slate-400">📞</span>{branchInfo.phone}
                    </p>
                  )}
                  {branchInfo.whatsapp && (
                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                      <span className="text-slate-400">💬</span>{branchInfo.whatsapp}
                    </p>
                  )}
                  {branchInfo.google_maps_url && (
                    <a href={branchInfo.google_maps_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-green-700 hover:underline flex items-center gap-1.5">
                      <span>🗺️</span>View on Google Maps
                    </a>
                  )}
                  {!branchInfo.phone && !branchInfo.whatsapp && !branchInfo.google_maps_url && (
                    <p className="text-xs text-slate-300">No contact info set.</p>
                  )}
                </div>
              </div>

              {/* Working hours + social */}
              <div>
                {branchInfo.working_hours && Object.keys(branchInfo.working_hours).length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Working Hours</p>
                    <div className="space-y-1 mb-3">
                      {Object.entries(branchInfo.working_hours).map(([day, hrs]) => (
                        <div key={day} className="flex justify-between text-xs text-slate-600">
                          <span className="text-slate-400">{day}</span>
                          <span>{hrs}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {branchInfo.social_links && Object.keys(branchInfo.social_links).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(branchInfo.social_links).map(([platform, url]) => (
                      <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] font-medium px-2.5 py-1 rounded-full border border-slate-200 text-slate-500 hover:border-green-300 hover:text-green-700 transition-colors">
                        {platform}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="px-6 py-3">
            <p className="text-[11px] text-slate-400 text-center">© 2026 Tensai. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
