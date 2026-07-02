'use client';
import { useEffect, useState } from 'react';
import AgencyLayout from '@/components/shared/AgencyLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ApplicationStarter from '@/components/applications/ApplicationStarter';
import ApplicationFormBody from '@/components/applications/ApplicationFormBody';
import NewApplicationHero from '@/components/applications/NewApplicationHero';
import { Application, AppDoc, FormTemplateData } from '@/components/applications/ApplicationFormShared';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d ago` : new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  draft:     { cls: 'bg-slate-100 text-slate-500',   label: 'Draft'     },
  submitted: { cls: 'bg-amber-100 text-amber-700',   label: 'Submitted' },
  accepted:  { cls: 'bg-emerald-100 text-emerald-700', label: 'Accepted' },
  rejected:  { cls: 'bg-rose-100 text-rose-600',     label: 'Rejected'  },
};

export default function AgencyDashboard() {
  const { lang } = useLang();
  const ja = lang === 'ja';
  const bn = lang === 'bn';
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const isAgency = user?.gateway_type === 'agency';

  const [showNew,     setShowNew]     = useState(false);
  const [activeAppId, setActiveAppId] = useState<number | null>(null);

  useEffect(() => {
    if (user && !isAgency) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isAgency, router]);

  const { data: agencyProfile } = useQuery({
    queryKey: ['agency-profile'],
    queryFn: () => api.get('/agency/profile').then(r => r.data.profile),
    enabled: !!isAgency,
  });

  const queryKey = ['agency-applications'];

  const { data: appsData, isLoading } = useQuery<{ data: Application[] }>({
    queryKey,
    queryFn: () => api.get('/applications').then(r => r.data),
    staleTime: 60_000,
    enabled: !!isAgency,
  });

  const apps      = appsData?.data ?? [];
  const activeApp = apps.find(a => a.id === activeAppId) ?? null;

  const { data: template, isLoading: templateLoading } = useQuery<FormTemplateData | null>({
    queryKey: ['form-template', activeApp?.form_template_id],
    queryFn: () => activeApp?.form_template_id
      ? api.get(`/form-templates/${activeApp.form_template_id}`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!activeApp?.form_template_id,
    staleTime: 300_000,
  });

  const total     = apps.length;
  const draft     = apps.filter(a => a.status === 'draft').length;
  const submitted = apps.filter(a => a.status === 'submitted').length;
  const accepted  = apps.filter(a => a.status === 'accepted').length;
  const live      = apps.filter(a => a.live_to_school).length;

  const liveMutation = useMutation({
    mutationFn: (appId: number) => api.post(`/applications/${appId}/live-to-school`).then(r => r.data),
    onSuccess: (data: Application) => {
      qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
        ...old, data: (old?.data ?? []).map(a => a.id === data.id ? { ...a, ...data } : a),
      }));
    },
    onError: () => qc.invalidateQueries({ queryKey }),
  });

  function handleCreated(app: Application) {
    qc.invalidateQueries({ queryKey });
    setShowNew(false);
    setActiveAppId(app.id);
  }

  function updateApps(updated: Application) {
    qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a => a.id === updated.id ? { ...a, ...updated } : a),
    }));
  }

  function handleDocUploaded(doc: AppDoc, progress: number) {
    qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === activeAppId
          ? { ...a, progress, documents: [...(a.documents ?? []).filter(d => d.doc_type !== doc.doc_type), doc] }
          : a
      ),
    }));
  }

  function handleDocDeleted(docId: number, progress: number) {
    qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === activeAppId
          ? { ...a, progress, documents: (a.documents ?? []).filter(d => d.id !== docId) }
          : a
      ),
    }));
  }

  if (!user || !isAgency) return null;

  // ── Active form view ─────────────────────────────────────────────────────────
  if (activeAppId !== null && activeApp) {
    return (
      <AgencyLayout>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <ApplicationFormBody
            app={activeApp} template={template ?? null} templateLoading={templateLoading}
            onSaved={updateApps} onSubmitted={updateApps}
            onDocUploaded={handleDocUploaded} onDocDeleted={handleDocDeleted}
            onClose={() => setActiveAppId(null)}
          />
        </div>
      </AgencyLayout>
    );
  }

  // ── New application inline form ──────────────────────────────────────────────
  if (showNew) {
    return (
      <AgencyLayout>
        <div className="max-w-[860px]">
          <button
            onClick={() => setShowNew(false)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {ja ? '戻る' : bn ? 'পিছনে' : 'Back'}
          </button>
          <NewApplicationHero />
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <ApplicationStarter role="agency" onCreated={handleCreated} onCancel={() => setShowNew(false)} queryKey="agency-applications" />
          </div>
        </div>
      </AgencyLayout>
    );
  }

  // ── Profile status banner ────────────────────────────────────────────────────
  const profileStatus = !agencyProfile ? 'none' : agencyProfile.vetting_status;
  type BannerVariant = { accent: string; iconCls: string; iconPath: string; title: string; desc: string; cta?: string };
  const BANNERS: Record<string, BannerVariant> = {
    none: {
      accent: 'border-l-amber-400 bg-amber-50',
      iconCls: 'text-amber-500',
      iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      title: ja ? 'プロフィールを完成させてください' : bn ? 'প্রোফাইল সম্পন্ন করুন' : 'Complete your agency profile',
      desc:  ja ? 'プロフィールを送信してフルアクセスをリクエストしてください。' : bn ? 'পূর্ণ অ্যাক্সেসের জন্য প্রোফাইল জমা দিন।' : 'Submit your profile for admin review to unlock full platform access.',
      cta:   ja ? 'プロフィールを設定 →' : bn ? 'প্রোফাইল সেটআপ করুন →' : 'Set up profile →',
    },
    pending: {
      accent: 'border-l-blue-400 bg-blue-50',
      iconCls: 'text-blue-500',
      iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      title: ja ? '審査中です' : bn ? 'পর্যালোচনাধীন' : 'Profile under review',
      desc:  ja ? '通常24〜48時間以内に完了します。' : bn ? 'সাধারণত ২৪–৪৮ ঘণ্টার মধ্যে সম্পন্ন হয়।' : 'Admin is reviewing your profile. Usually takes 24–48 hours.',
    },
    under_review: {
      accent: 'border-l-violet-400 bg-violet-50',
      iconCls: 'text-violet-500',
      iconPath: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      title: ja ? '詳細審査中です' : bn ? 'বিস্তারিত যাচাই চলছে' : 'Detailed review in progress',
      desc:  ja ? '追加確認が行われています。まもなくご連絡します。' : bn ? 'অতিরিক্ত যাচাই চলছে। শীঘ্রই যোগাযোগ করা হবে।' : 'Additional verification in progress. You will be contacted soon.',
    },
    rejected: {
      accent: 'border-l-rose-400 bg-rose-50',
      iconCls: 'text-rose-500',
      iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      title: ja ? 'プロフィールが却下されました' : bn ? 'প্রোফাইল প্রত্যাখ্যাত' : 'Profile rejected',
      desc:  agencyProfile?.rejection_reason ?? (ja ? 'サポートにお問い合わせください。' : bn ? 'সাপোর্টে যোগাযোগ করুন।' : 'Contact support for details.'),
      cta:   ja ? '修正して再提出 →' : bn ? 'সংশোধন করে পুনরায় জমা দিন →' : 'Revise & resubmit →',
    },
  };
  const banner = profileStatus !== 'approved' ? BANNERS[profileStatus] ?? null : null;

  // ── Stats config ─────────────────────────────────────────────────────────────
  const STATS = [
    { label: ja ? '合計' : bn ? 'মোট'        : 'Total',     value: total,     dot: 'bg-slate-400',    num: 'text-slate-900'   },
    { label: ja ? '下書き' : bn ? 'ড্রাফট'   : 'Draft',     value: draft,     dot: 'bg-slate-400',    num: 'text-slate-600'   },
    { label: ja ? '提出済み' : bn ? 'সাবমিট'  : 'Submitted', value: submitted, dot: 'bg-amber-400',    num: 'text-amber-700'   },
    { label: ja ? '承認済み' : bn ? 'অনুমোদিত': 'Accepted',  value: accepted,  dot: 'bg-emerald-500',  num: 'text-emerald-700' },
    { label: ja ? 'ライブ'  : bn ? 'লাইভ'     : 'Live',      value: live,      dot: 'bg-green-500',    num: 'text-green-700'   },
  ];

  // ── Main overview ────────────────────────────────────────────────────────────
  return (
    <AgencyLayout>
      <div className="max-w-5xl space-y-6">

        {/* Profile banner */}
        {banner && (
          <div className={`flex items-start justify-between gap-4 rounded-2xl border border-l-4 px-5 py-4 ${banner.accent}`}>
            <div className="flex items-start gap-3">
              <svg className={`w-5 h-5 shrink-0 mt-0.5 ${banner.iconCls}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={banner.iconPath} />
              </svg>
              <div>
                <p className="text-sm font-bold text-slate-900">{banner.title}</p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{banner.desc}</p>
              </div>
            </div>
            {banner.cta && (
              <Link href="/dashboard/agency/profile"
                className="shrink-0 text-xs font-bold text-green-700 hover:text-green-800 whitespace-nowrap mt-0.5 transition-colors">
                {banner.cta}
              </Link>
            )}
          </div>
        )}

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-[0.15em] font-semibold mb-1">
              {ja ? 'エージェンシーポータル' : bn ? 'এজেন্সি পোর্টাল' : 'Agency Portal'}
            </p>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {ja ? 'ダッシュボード' : bn ? 'ড্যাশবোর্ড' : 'Dashboard'}
            </h1>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-700 hover:bg-green-800 active:bg-green-900 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
            </svg>
            {ja ? '新規申請' : bn ? 'নতুন আবেদন' : 'New Application'}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {STATS.map(s => (
            <Link key={s.label} href="/dashboard/agency/applicants"
              className="bg-white rounded-2xl border border-slate-100 px-4 py-4 hover:border-green-200 hover:shadow-sm transition-all group">
              <p className={`text-2xl font-black leading-none mb-2 ${isLoading ? 'text-slate-300 animate-pulse' : s.num}`}>
                {isLoading ? '—' : s.value}
              </p>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{s.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Two-column: Recent Applications + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Recent Applications */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <div>
                <h2 className="font-black text-slate-900 text-sm">
                  {ja ? '最近の申請' : bn ? 'সাম্প্রতিক আবেদন' : 'Recent Applications'}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {ja ? '最新6件' : bn ? 'সর্বশেষ ৬টি' : 'Latest 6 · toggle Live to add to Lead Live'}
                </p>
              </div>
              <Link href="/dashboard/agency/applicants"
                className="text-xs font-bold text-green-700 hover:text-green-800 transition-colors">
                {ja ? 'すべて見る →' : bn ? 'সব দেখুন →' : 'View all →'}
              </Link>
            </div>

            {isLoading ? (
              <div className="py-14 flex flex-col items-center gap-3">
                <span className="w-7 h-7 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
                <p className="text-xs text-slate-400">{ja ? '読込中...' : bn ? 'লোড হচ্ছে...' : 'Loading…'}</p>
              </div>
            ) : apps.length === 0 ? (
              <div className="py-14 flex flex-col items-center gap-3 text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    {ja ? 'まだ申請がありません' : bn ? 'এখনো কোনো আবেদন নেই' : 'No applications yet'}
                  </p>
                  <button onClick={() => setShowNew(true)}
                    className="text-xs font-semibold text-green-700 hover:text-green-800 mt-1.5 transition-colors">
                    {ja ? '最初の申請を作成 →' : bn ? 'প্রথম আবেদন তৈরি করুন →' : 'Create your first →'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-50">
                  {apps.slice(0, 6).map(app => {
                    const badge = STATUS_BADGE[app.status] ?? { cls: 'bg-slate-100 text-slate-500', label: app.status };
                    return (
                      <div key={app.id}
                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group">

                        {/* Main clickable area */}
                        <button
                          onClick={() => setActiveAppId(app.id)}
                          className="flex-1 min-w-0 flex items-center gap-3 text-left">
                          {/* Avatar initial */}
                          <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-green-100 flex items-center justify-center shrink-0 transition-colors">
                            <span className="text-xs font-black text-slate-500 group-hover:text-green-700 transition-colors">
                              {app.student_name?.charAt(0)?.toUpperCase() ?? '?'}
                            </span>
                          </div>

                          {/* Name + meta */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-800 truncate">{app.student_name}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                                {badge.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                              {app.form_template?.country ?? '—'}
                              {' · '}
                              <span className="font-mono">{app.application_code}</span>
                              {' · '}
                              {timeAgo(app.created_at)}
                            </p>
                          </div>

                          {/* Progress bar */}
                          <div className="hidden sm:flex items-center gap-2 shrink-0">
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  (app.progress ?? 0) >= 80 ? 'bg-emerald-500' :
                                  (app.progress ?? 0) >= 30 ? 'bg-amber-400' : 'bg-rose-400'
                                }`}
                                style={{ width: `${app.progress ?? 0}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-400 w-7 tabular-nums">
                              {app.progress ?? 0}%
                            </span>
                          </div>
                        </button>

                        {/* Live toggle */}
                        <button
                          onClick={() => liveMutation.mutate(app.id)}
                          disabled={liveMutation.isPending}
                          title={app.live_to_school ? 'Remove from Lead Live' : 'Add to Lead Live'}
                          className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all disabled:opacity-40 ${
                            app.live_to_school
                              ? 'bg-green-100 text-green-700 border-green-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                              : 'bg-white text-slate-400 border-slate-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${app.live_to_school ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                          Live
                        </button>

                        {/* Chevron */}
                        <button
                          onClick={() => setActiveAppId(app.id)}
                          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-slate-300 group-hover:text-slate-500 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {apps.length > 6 && (
                  <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/40">
                    <Link href="/dashboard/agency/applicants"
                      className="text-xs font-bold text-green-700 hover:text-green-800 transition-colors">
                      +{apps.length - 6} more · View all →
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-2.5">
            <h2 className="text-sm font-black text-slate-900 px-1 mb-3">
              {ja ? 'クイックアクション' : bn ? 'দ্রুত অ্যাকশন' : 'Quick Actions'}
            </h2>

            {([
              {
                label: ja ? '新規申請を作成' : bn ? 'নতুন আবেদন তৈরি' : 'New Application',
                desc:  ja ? '学生申請を開始' : bn ? 'আবেদন শুরু করুন' : 'Start a new student application',
                icon: 'M12 4v16m8-8H4',
                accent: 'bg-green-50 text-green-700',
                action: () => setShowNew(true), href: null,
              },
              {
                label: ja ? 'すべての申請' : bn ? 'সব আবেদন' : 'All Applications',
                desc:  ja ? '申請リスト・検索・フィルター' : bn ? 'তালিকা, অনুসন্ধান ও ফিল্টার' : 'Full list with search & filters',
                icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
                accent: 'bg-slate-100 text-slate-600',
                action: null, href: '/dashboard/agency/applicants',
              },
              {
                label: ja ? 'リードライブ' : bn ? 'লিড লাইভ' : 'Lead Live',
                desc:  ja ? 'ライブマークした申請' : bn ? 'লাইভ চিহ্নিত আবেদন' : `${live} application${live !== 1 ? 's' : ''} currently live`,
                icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
                accent: 'bg-green-100 text-green-700',
                action: null, href: '/dashboard/agency/pool',
              },
              {
                label: ja ? '選考済み' : bn ? 'নির্বাচিত' : 'Selected',
                desc:  ja ? '承認・選考されたアプリケーション' : bn ? 'অনুমোদিত আবেদন' : `${accepted} accepted application${accepted !== 1 ? 's' : ''}`,
                icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                accent: 'bg-emerald-100 text-emerald-700',
                action: null, href: '/dashboard/agency/selected',
              },
              {
                label: ja ? 'プロフィール設定' : bn ? 'প্রোফাইল সেটিং' : 'Agency Profile',
                desc:  ja ? 'プロフィールを更新・提出' : bn ? 'প্রোফাইল আপডেট করুন' : 'Update and submit for review',
                icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
                accent: 'bg-slate-100 text-slate-600',
                action: null, href: '/dashboard/agency/profile',
              },
            ] as const).map(item => {
              const inner = (
                <>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.accent}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800">{item.label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.desc}</p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              );
              const cls = 'w-full flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all text-left';
              return item.href
                ? <Link key={item.label} href={item.href} className={cls}>{inner}</Link>
                : <button key={item.label} onClick={item.action!} className={cls}>{inner}</button>;
            })}
          </div>

        </div>
      </div>
    </AgencyLayout>
  );
}
