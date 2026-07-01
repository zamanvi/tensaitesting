'use client';
import { useEffect, useMemo, useState } from 'react';
import AgencyLayout from '@/components/shared/AgencyLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d ago` : new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}
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
  const { t, lang } = useLang();
  const a = t.agencyDash;
  const ja = lang === 'ja';
  const bn = lang === 'bn';
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const isAgency = user?.gateway_type === 'agency';

  const [showNew,      setShowNew]      = useState(false);
  const [activeAppId,  setActiveAppId]  = useState<number | null>(null);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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

  const { data: template, isLoading: templateLoading } = useQuery<FormTemplateData | null>({
    queryKey: ['form-template', activeAppId],
    queryFn: () => {
      const app = apps.find(a => a.id === activeAppId);
      return app?.form_template_id
        ? api.get(`/form-templates/${app.form_template_id}`).then(r => r.data)
        : Promise.resolve(null);
    },
    enabled: !!activeAppId,
    staleTime: 300_000,
  });

  if (!user || !isAgency) return null;

  const apps = appsData?.data ?? [];
  const total    = apps.length;
  const active   = apps.filter(a => a.status === 'submitted').length;
  const accepted = apps.filter(a => a.status === 'accepted').length;
  const activeApp = apps.find(a => a.id === activeAppId) ?? null;

  const filtered = useMemo(() => {
    let list = apps;
    if (statusFilter) list = list.filter(a => a.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(a =>
      a.student_name?.toLowerCase().includes(q) ||
      a.student_email?.toLowerCase().includes(q) ||
      a.application_code?.toLowerCase().includes(q) ||
      a.form_template?.country?.toLowerCase().includes(q)
    );
    return list;
  }, [apps, search, statusFilter]);

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

  function handleDocDeleted(docId: number, progress: number) {
    qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === activeAppId ? { ...a, progress, documents: (a.documents ?? []).filter(d => d.id !== docId) } : a
      ),
    }));
  }

  // ── Profile status banner config ──────────────────────────────────────────
  const profileBanners: Record<string, { bg: string; icon: string; title: string; desc: string; cta?: string }> = {
    none:         { bg: 'bg-amber-50 border-amber-300',   icon: '📋', title: ja ? 'プロフィールを完成させてください' : bn ? 'প্রোফাইল পূরণ করুন' : 'Complete Your Agency Profile', desc: ja ? 'プラットフォームへのフルアクセスには審査が必要です。' : bn ? 'সম্পূর্ণ অ্যাক্সেসের জন্য প্রোফাইল জমা দিন।' : 'Submit your profile for admin review to unlock full platform access.', cta: ja ? 'プロフィールを設定する →' : bn ? 'প্রোফাইল সেটআপ করুন →' : 'Set Up Profile →' },
    pending:      { bg: 'bg-blue-50 border-blue-200',     icon: '⏳', title: ja ? 'プロフィール審査中' : bn ? 'প্রোফাইল যাচাই হচ্ছে' : 'Profile Under Review', desc: ja ? '管理者が確認中です。通常24〜48時間かかります。' : bn ? 'অ্যাডমিন যাচাই করছেন। ২৪-৪৮ ঘন্টা লাগে।' : 'Admin is reviewing your profile. Usually takes 24–48 hours.' },
    under_review: { bg: 'bg-purple-50 border-purple-200', icon: '🔍', title: ja ? '詳細審査中' : bn ? 'বিস্তারিত যাচাই চলছে' : 'Detailed Review In Progress', desc: ja ? '追加確認が行われています。' : bn ? 'আরও যাচাই চলছে।' : 'Additional verification in progress. You will be contacted soon.' },
    rejected:     { bg: 'bg-red-50 border-red-200',       icon: '❌', title: ja ? '審査が却下されました' : bn ? 'প্রোফাইল প্রত্যাখ্যাত' : 'Profile Rejected', desc: agencyProfile?.rejection_reason ?? (ja ? 'サポートにお問い合わせください。' : bn ? 'সাপোর্টে যোগাযোগ করুন।' : 'Contact support for details.'), cta: ja ? 'プロフィールを修正して再提出 →' : bn ? 'প্রোফাইল সংশোধন করুন →' : 'Revise & Resubmit →' },
  };

  const profileStatus = !agencyProfile ? 'none' : agencyProfile.vetting_status;
  const banner = profileStatus !== 'approved' ? profileBanners[profileStatus] : null;

  const STATS = [
    { label: ja ? '合計申請' : bn ? 'মোট আবেদন' : 'Total Applications', value: isLoading ? '…' : String(total),    icon: '📋', href: '/dashboard/agency/applicants' },
    { label: ja ? '提出済み'  : bn ? 'সাবমিট'      : 'Submitted',          value: isLoading ? '…' : String(active),   icon: '👥', href: '/dashboard/agency/applicants' },
    { label: ja ? '承認済み'  : bn ? 'অনুমোদিত'    : 'Accepted',           value: isLoading ? '…' : String(accepted), icon: '✅', href: '/dashboard/agency/applicants' },
  ];

  // ── Active form view ──────────────────────────────────────────────────────
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

  return (
    <AgencyLayout>
      {/* Profile status banner */}
      {banner && (
        <div className={`rounded-2xl border p-4 mb-5 flex items-start justify-between gap-3 ${banner.bg}`}>
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

      {/* New Application inline form */}
      {showNew ? (
        <div className="mb-6 max-w-[860px]">
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
      ) : (
        <>
          {/* Header row with Add Applicant button */}
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <div />
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

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {STATS.map(s => (
              <Link key={s.label} href={s.href}
                className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-green-200 hover:shadow-md transition-all">
                <div className="text-xl mb-2">{s.icon}</div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1 leading-tight">{s.label}</div>
              </Link>
            ))}
          </div>

          {/* All Applications table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

            {/* Table header / toolbar */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <h3 className="font-black text-slate-900 text-sm">
                    {ja ? 'すべての申請' : bn ? 'সকল আবেদন' : 'All Applications'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {ja ? '代理店が管理する申請一覧' : bn ? 'এজেন্সির সকল আবেদনের তালিকা' : 'All applications managed by your agency'}
                  </p>
                </div>

                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>

                {/* Search */}
                <div className="relative w-full sm:w-60">
                  <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                  </svg>
                  <input
                    type="search" placeholder="Search name, code, country…"
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Body */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <span className="w-8 h-8 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
                <p className="text-xs text-slate-400">Loading…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-500">
                    {search || statusFilter ? 'No results found' : (ja ? 'まだ申請がありません' : bn ? 'এখনো কোনো আবেদন নেই' : 'No applications yet')}
                  </p>
                  {!search && !statusFilter && (
                    <button onClick={() => setShowNew(true)}
                      className="mt-2 text-xs font-semibold text-green-700 hover:text-green-800">
                      {ja ? '最初の申請を作成 →' : bn ? 'প্রথম আবেদন তৈরি করুন →' : 'Create your first application →'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="text-left px-5 py-3">Code</th>
                        <th className="text-left px-4 py-3">Student</th>
                        <th className="text-left px-4 py-3">Country / Form</th>
                        <th className="text-left px-4 py-3">Progress</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-left px-4 py-3">Date</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map(app => (
                        <tr key={app.id}
                          onClick={() => setActiveAppId(app.id)}
                          className="hover:bg-green-50/40 cursor-pointer transition-colors group">
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-1 rounded-lg group-hover:bg-white transition-colors">
                              {app.application_code}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-slate-800 text-xs">{app.student_name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{app.student_email || '—'}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-xs font-semibold text-slate-700">{app.form_template?.country ?? '—'}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[160px]">{app.form_template?.name ?? ''}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${app.progress >= 80 ? 'bg-emerald-500' : app.progress >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                  style={{ width: `${app.progress ?? 0}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-slate-600 tabular-nums">{app.progress ?? 0}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[app.status] ?? 'bg-slate-100 text-slate-500'}`}>
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-[11px] text-slate-400 whitespace-nowrap">
                            {timeAgo(app.created_at)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-green-100 group-hover:text-green-700 text-slate-400 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-slate-50">
                  {filtered.map(app => (
                    <div key={app.id}
                      onClick={() => setActiveAppId(app.id)}
                      className="px-4 py-4 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors active:bg-slate-100">
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        <span className={`text-xs font-black ${(app.progress ?? 0) >= 80 ? 'text-emerald-600' : (app.progress ?? 0) >= 50 ? 'text-amber-600' : 'text-rose-500'}`}>
                          {app.progress ?? 0}%
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-bold text-slate-900 truncate">{app.student_name}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[app.status]}`}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{app.form_template?.country ?? '—'} · {app.application_code}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(app.created_at)}</p>
                      </div>
                      <svg className="w-4 h-4 text-slate-300 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 sm:px-6 py-3 border-t border-slate-50 bg-slate-50/50">
                  <p className="text-[11px] text-slate-400">
                    Showing <span className="font-bold text-slate-600">{filtered.length}</span> of <span className="font-bold text-slate-600">{total}</span> applications
                  </p>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </AgencyLayout>
  );
}
