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

const STATUS_BADGE: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-500',
  submitted: 'bg-amber-100 text-amber-700',
  accepted:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-rose-100 text-rose-600',
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

  const apps = appsData?.data ?? [];
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
  const submitted = apps.filter(a => a.status === 'submitted').length;
  const accepted  = apps.filter(a => a.status === 'accepted').length;
  const draft     = apps.filter(a => a.status === 'draft').length;

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
        a.id === activeAppId ? { ...a, progress, documents: [...(a.documents ?? []).filter(d => d.doc_type !== doc.doc_type), doc] } : a
      ),
    }));
  }

  const liveMutation = useMutation({
    mutationFn: (appId: number) => api.post(`/applications/${appId}/live-to-school`).then(r => r.data),
    onSuccess: (data: { application: Application }) => {
      qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
        ...old, data: (old?.data ?? []).map(a => a.id === data.application.id ? { ...a, ...data.application } : a),
      }));
    },
  });

  function handleDocDeleted(docId: number, progress: number) {
    qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === activeAppId ? { ...a, progress, documents: (a.documents ?? []).filter(d => d.id !== docId) } : a
      ),
    }));
  }

  if (!user || !isAgency) return null;

  const profileBanners: Record<string, { bg: string; icon: string; title: string; desc: string; cta?: string }> = {
    none:         { bg: 'bg-amber-50 border-amber-300',   icon: '📋', title: 'Complete Your Agency Profile',    desc: 'Submit your profile for admin review to unlock full platform access.', cta: 'Set Up Profile →' },
    pending:      { bg: 'bg-blue-50 border-blue-200',     icon: '⏳', title: 'Profile Under Review',            desc: 'Admin is reviewing your profile. Usually takes 24–48 hours.' },
    under_review: { bg: 'bg-purple-50 border-purple-200', icon: '🔍', title: 'Detailed Review In Progress',     desc: 'Additional verification in progress. You will be contacted soon.' },
    rejected:     { bg: 'bg-red-50 border-red-200',       icon: '❌', title: 'Profile Rejected',                desc: agencyProfile?.rejection_reason ?? 'Contact support for details.', cta: 'Revise & Resubmit →' },
  };

  const profileStatus = !agencyProfile ? 'none' : agencyProfile.vetting_status;
  const banner = profileStatus !== 'approved' ? profileBanners[profileStatus] : null;

  const STATS = [
    { label: ja ? '合計申請' : bn ? 'মোট আবেদন'   : 'Total',     value: isLoading ? '…' : String(total),     color: 'text-slate-900',   bg: 'bg-slate-50',   icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: ja ? '下書き'   : bn ? 'ড্রাফট'       : 'Draft',     value: isLoading ? '…' : String(draft),     color: 'text-slate-600',   bg: 'bg-slate-50',   icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { label: ja ? '提出済み' : bn ? 'সাবমিট'       : 'Submitted', value: isLoading ? '…' : String(submitted), color: 'text-amber-700',   bg: 'bg-amber-50',   icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { label: ja ? '承認済み' : bn ? 'অনুমোদিত'    : 'Accepted',  value: isLoading ? '…' : String(accepted),  color: 'text-emerald-700', bg: 'bg-emerald-50', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

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
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {ja ? '戻る' : bn ? 'পিছনে' : 'Back'}
          </button>
          <NewApplicationHero />
          <div className="bg-white rounded-[14px] border border-slate-200 overflow-hidden shadow-sm">
            <ApplicationStarter role="agency" onCreated={handleCreated} onCancel={() => setShowNew(false)} queryKey="agency-applications" />
          </div>
        </div>
      </AgencyLayout>
    );
  }

  // ── Main overview ────────────────────────────────────────────────────────────
  return (
    <AgencyLayout>

      {/* Profile status banner */}
      {banner && (
        <div className={`rounded-2xl border p-4 mb-6 flex items-start justify-between gap-3 ${banner.bg}`}>
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">{banner.icon}</span>
            <div>
              <p className="font-bold text-sm text-slate-900">{banner.title}</p>
              <p className="text-xs text-slate-600 mt-0.5">{banner.desc}</p>
            </div>
          </div>
          {banner.cta && (
            <Link href="/dashboard/agency/profile" className="shrink-0 text-xs font-bold text-green-700 hover:text-green-800 whitespace-nowrap">
              {banner.cta}
            </Link>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {ja ? 'ダッシュボード' : bn ? 'ড্যাশবোর্ড' : 'Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {ja ? 'エージェンシーの概要' : bn ? 'এজেন্সির সারসংক্ষেপ' : 'Agency overview'}
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-green-700/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {ja ? '新規申請' : bn ? 'নতুন আবেদন' : '+ Add Applicant'}
        </button>
      </div>

      {/* Stats — 4 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {STATS.map(s => (
          <Link key={s.label} href="/dashboard/agency/applicants"
            className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-green-200 hover:shadow-md transition-all group">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <svg className={`w-4.5 h-4.5 ${s.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={s.icon} />
              </svg>
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">{s.value}</p>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mt-1.5">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Two-column section: Recent Applications + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Applications — spans 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h2 className="font-black text-slate-900 text-sm">
              {ja ? '最近の申請' : bn ? 'সাম্প্রতিক আবেদন' : 'Recent Applications'}
            </h2>
            <Link href="/dashboard/agency/applicants"
              className="text-xs font-semibold text-green-700 hover:text-green-800">
              {ja ? 'すべて見る' : bn ? 'সব দেখুন' : 'View all →'}
            </Link>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <span className="w-6 h-6 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
            </div>
          ) : apps.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-1">
                <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-slate-400">
                {ja ? 'まだ申請がありません' : bn ? 'এখনো কোনো আবেদন নেই' : 'No applications yet'}
              </p>
              <button onClick={() => setShowNew(true)}
                className="text-xs font-semibold text-green-700 hover:text-green-800 mt-1">
                {ja ? '最初の申請を作成 →' : bn ? 'প্রথম আবেদন তৈরি করুন →' : 'Create your first application →'}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {apps.slice(0, 6).map(app => (
                <div key={app.id} className="flex items-center gap-2 px-5 py-3.5 hover:bg-green-50/40 transition-colors group">
                  <button onClick={() => setActiveAppId(app.id)} className="flex-1 min-w-0 flex items-center gap-3 text-left">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{app.student_name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[app.status] ?? 'bg-slate-100 text-slate-500'}`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {app.form_template?.country ?? '—'} · <span className="font-mono">{app.application_code}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${(app.progress ?? 0) >= 80 ? 'bg-emerald-500' : (app.progress ?? 0) >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                          style={{ width: `${app.progress ?? 0}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 w-8 tabular-nums">{app.progress ?? 0}%</span>
                    </div>
                  </button>
                  {/* Live toggle */}
                  <button
                    onClick={() => liveMutation.mutate(app.id)}
                    disabled={liveMutation.isPending}
                    title={app.live_to_school ? 'Remove from Lead Live' : 'Add to Lead Live'}
                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors disabled:opacity-50 ${
                      app.live_to_school
                        ? 'bg-green-100 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${app.live_to_school ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                    Live
                  </button>
                  <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-green-600 transition-colors shrink-0 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24" onClick={() => setActiveAppId(app.id)}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
              {apps.length > 6 && (
                <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-50">
                  <Link href="/dashboard/agency/applicants"
                    className="text-xs font-semibold text-green-700 hover:text-green-800">
                    +{apps.length - 6} more — View all applications →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions — 1 col */}
        <div className="space-y-3">
          <h2 className="font-black text-slate-900 text-sm px-1">
            {ja ? 'クイックアクション' : bn ? 'দ্রুত অ্যাকশন' : 'Quick Actions'}
          </h2>

          {[
            { label: ja ? '新規申請を作成' : bn ? 'নতুন আবেদন তৈরি' : 'New Application', desc: ja ? '学生申請を開始' : bn ? 'নতুন ছাত্রের আবেদন শুরু করুন' : 'Start a new student application', icon: 'M12 4v16m8-8H4', action: () => setShowNew(true), href: null },
            { label: ja ? 'すべての申請を見る' : bn ? 'সব আবেদন দেখুন' : 'View Applications', desc: ja ? '申請リストと詳細' : bn ? 'আবেদনের তালিকা ও বিস্তারিত' : 'Full list with search & filters', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', action: null, href: '/dashboard/agency/applicants' },
            { label: ja ? 'リードライブ' : bn ? 'লিড লাইভ' : 'Lead Live',   desc: ja ? 'ライブマークした申請' : bn ? 'লাইভ চিহ্নিত আবেদন' : 'Applications marked as live', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', action: null, href: '/dashboard/agency/pool' },
            { label: ja ? 'プロフィール設定' : bn ? 'প্রোফাইল সেটিং' : 'Agency Profile',   desc: ja ? 'プロフィールを更新・提出' : bn ? 'প্রোফাইল আপডেট ও জমা দিন' : 'Update and submit for review', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', action: null, href: '/dashboard/agency/profile' },
          ].map(item => {
            const inner = (
              <>
                <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-green-50 flex items-center justify-center shrink-0 transition-colors">
                  <svg className="w-4 h-4 text-slate-500 group-hover:text-green-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-green-800 transition-colors">{item.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
                <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-green-600 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            );
            const cls = 'w-full flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-slate-100 hover:border-green-200 hover:shadow-sm transition-all group text-left';
            return item.href
              ? <Link key={item.label} href={item.href} className={cls}>{inner}</Link>
              : <button key={item.label} onClick={item.action!} className={cls}>{inner}</button>;
          })}
        </div>

      </div>
    </AgencyLayout>
  );
}
