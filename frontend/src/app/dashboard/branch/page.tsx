'use client';
import { useEffect } from 'react';
import BranchLayout from '@/components/shared/BranchLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Branch {
  id: number;
  name: string;
  slug: string;
  city: string | null;
  country: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  email: string | null;
}

interface Application {
  id: number;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
}

export default function BranchAdminDashboard() {
  const { lang } = useLang();
  const ja = lang === 'ja';
  const bn = lang === 'bn';
  const { user } = useAuthStore();
  const router = useRouter();

  const isBranchAdmin = user?.roles?.some(r => r === 'branch_admin' || r === 'branch_manager');

  useEffect(() => {
    if (user && !isBranchAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isBranchAdmin, router]);

  const { data: branch, isLoading } = useQuery<Branch>({
    queryKey: ['my-branch'],
    queryFn: () => api.get('/branch-admin/my-branch').then(r => r.data),
    enabled: !!isBranchAdmin,
  });

  const { data: appsData } = useQuery<{ data: Application[] }>({
    queryKey: ['branch-applications'],
    queryFn: () => api.get('/applications').then(r => r.data),
    enabled: !!isBranchAdmin,
    staleTime: 300_000,
  });

  if (!user || !isBranchAdmin) return null;

  const apps = appsData?.data ?? [];
  const total     = apps.length;
  const draft     = apps.filter(a => a.status === 'draft').length;
  const submitted = apps.filter(a => a.status === 'submitted').length;
  const accepted  = apps.filter(a => a.status === 'accepted').length;

  const stats = [
    { label: ja ? '合計' : bn ? 'মোট' : 'Total',         value: total,     iconBg: 'bg-slate-100',   iconColor: 'text-slate-500',   icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: ja ? '下書き' : bn ? 'ড্রাফট' : 'Draft',     value: draft,     iconBg: 'bg-amber-50',    iconColor: 'text-amber-500',   icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { label: ja ? '選択済' : bn ? 'সাবমিট' : 'Submitted', value: submitted, iconBg: 'bg-blue-50',     iconColor: 'text-blue-500',    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: ja ? '承認済' : bn ? 'অনুমোদিত' : 'Accepted', value: accepted,  iconBg: 'bg-green-50',    iconColor: 'text-green-600',   icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  const quickLinks = [
    { label: ja ? '申請を見る' : bn ? 'আবেদন দেখুন' : 'View Applications', href: '/dashboard/branch/applicants', icon: '📋', desc: ja ? '申請者を管理' : bn ? 'আবেদনকারী পরিচালনা' : 'Manage student applications and submit to admin' },
    { label: ja ? 'チームを管理' : bn ? 'টিম পরিচালনা' : 'Manage Team',      href: '/dashboard/branch/team',       icon: '👤', desc: ja ? 'スタッフを追加・編集' : bn ? 'স্টাফ যোগ ও সম্পাদনা' : 'Add team members and manage roles' },
    { label: ja ? 'ギャラリー' : bn ? 'গ্যালারি' : 'Gallery',                href: '/dashboard/branch/gallery',    icon: '🖼️', desc: ja ? '写真を管理' : bn ? 'ছবি পরিচালনা' : 'Upload and manage branch gallery images' },
    { label: ja ? '設定' : bn ? 'সেটিংস' : 'Settings',                       href: '/dashboard/branch/settings',   icon: '⚙️', desc: ja ? '支局情報を更新' : bn ? 'শাখার তথ্য আপডেট' : 'Update contact details, hours and social links' },
  ];

  return (
    <BranchLayout>
      <div className="max-w-5xl space-y-6 sm:space-y-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-[0.15em] font-semibold mb-2">
              {ja ? '管理中の支局' : bn ? 'আপনার শাখা' : 'Your Branch'}
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {isLoading ? <span className="text-slate-300">…</span> : branch?.name ?? '—'}
            </h1>
            {branch?.city && (
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <span>📍</span>
                {branch.city}{branch.country ? `, ${branch.country}` : ''}
              </p>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-green-50 border border-green-100 text-xs font-semibold text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {ja ? 'アクティブ' : bn ? 'সক্রিয়' : 'Active'}
          </span>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
          {stats.map(s => (
            <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 hover:shadow-lg hover:border-slate-200 transition-all duration-200">
              <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center mb-4`}>
                <svg className={`w-5 h-5 ${s.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={s.icon} />
                </svg>
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.1em] mb-1">{s.label}</p>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 leading-none">{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Quick links ── */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
            {quickLinks.map(q => (
              <Link key={q.href} href={q.href}
                className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 hover:shadow-lg hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-200 group">
                <div className="text-2xl mb-4">{q.icon}</div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-green-700 transition-colors leading-tight">{q.label}</div>
                <div className="text-xs text-slate-400 mt-1.5 leading-relaxed">{q.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Contact info card (read-only) ── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-900 text-base">
              {ja ? '連絡先情報' : bn ? 'যোগাযোগের তথ্য' : 'Contact Information'}
            </h2>
            <Link href="/dashboard/branch/settings"
              className="text-xs font-semibold text-green-700 hover:text-green-800 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 border border-green-100 transition-colors">
              {ja ? '設定で編集' : bn ? 'সেটিংসে সম্পাদনা' : 'Edit in Settings →'}
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: ja ? '電話番号' : bn ? 'ফোন' : 'Phone',   value: branch?.phone,    icon: '📞' },
                { label: 'WhatsApp',                                 value: branch?.whatsapp, icon: '💬' },
                { label: ja ? '住所' : bn ? 'ঠিকানা' : 'Address',  value: branch?.address,  icon: '📍' },
              ].map(item => (
                <div key={item.label} className="flex gap-3 p-3 rounded-xl bg-slate-50">
                  <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 mb-0.5">{item.label}</p>
                    <p className="text-sm text-slate-800 font-medium truncate">
                      {item.value || <span className="text-slate-300 font-normal">{ja ? '未設定' : bn ? 'সেট করা হয়নি' : 'Not set'}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </BranchLayout>
  );
}
