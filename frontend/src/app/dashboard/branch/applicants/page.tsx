'use client';
import BranchLayout from '@/components/shared/BranchLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Application, AppDoc, FormTemplateData } from '@/components/applications/ApplicationFormShared';
import ApplicationFormBody from '@/components/applications/ApplicationFormBody';
import ApplicationStarter from '@/components/applications/ApplicationStarter';
import NewApplicationHero from '@/components/applications/NewApplicationHero';

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  draft:       'bg-slate-100 text-slate-500',
  submitted:   'bg-amber-100 text-amber-700',
  pool:        'bg-slate-100 text-slate-600',
  selected:    'bg-indigo-100 text-indigo-700',
  accepted:    'bg-amber-100 text-amber-700',
  processing:  'bg-blue-100 text-blue-700',
  complete:    'bg-emerald-100 text-emerald-700',
  incomplete:  'bg-orange-100 text-orange-700',
  rejected:    'bg-rose-100 text-rose-600',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function BranchApplicantsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const isBranchAdmin = user?.roles?.some(r => r === 'branch_admin' || r === 'branch_manager');
  useEffect(() => {
    if (user && !isBranchAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isBranchAdmin, router]);

  const [activeAppId, setActiveAppId] = useState<number | null>(null);
  const [showNew,     setShowNew]     = useState(false);
  const [search,      setSearch]      = useState('');
  const [confirmLiveId, setConfirmLiveId] = useState<number | null>(null);

  const queryKey = ['branch-applications'];

  const { data: appsData, isLoading } = useQuery<{ data: Application[] }>({
    queryKey,
    queryFn: () => api.get('/applications').then(r => r.data),
    enabled: !!isBranchAdmin,
  });

  const apps = appsData?.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(a =>
      a.student_name?.toLowerCase().includes(q) ||
      a.student_email?.toLowerCase().includes(q) ||
      a.application_code?.toLowerCase().includes(q) ||
      a.form_template?.country?.toLowerCase().includes(q)
    );
  }, [apps, search]);

  const activeApp = apps.find(a => a.id === activeAppId) ?? null;

  const { data: template, isLoading: templateLoading } = useQuery<FormTemplateData | null>({
    queryKey: ['form-template', activeApp?.form_template_id],
    queryFn: () => activeApp?.form_template_id
      ? api.get(`/form-templates/${activeApp.form_template_id}`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!activeApp?.form_template_id,
    staleTime: 300_000,
  });

  const liveToSchoolMutation = useMutation({
    mutationFn: (appId: number) => api.post(`/applications/${appId}/live-to-school`).then(r => r.data),
    onSuccess: (updated: Application) => {
      qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
        ...old, data: (old?.data ?? []).map(a => a.id === updated.id ? { ...a, ...updated } : a),
      }));
      setConfirmLiveId(null);
    },
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

  if (!user || !isBranchAdmin) return null;

  // ── Active form view ────────────────────────────────────────────────────────
  if (activeAppId !== null && activeApp) {
    return (
      <BranchLayout title="Applications">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <ApplicationFormBody
            app={activeApp} template={template ?? null} templateLoading={templateLoading}
            onSaved={updateApps} onSubmitted={updateApps}
            onDocUploaded={handleDocUploaded} onDocDeleted={handleDocDeleted}
            onClose={() => setActiveAppId(null)}
          />
        </div>
      </BranchLayout>
    );
  }

  const total = apps.length;

  return (
    <BranchLayout title="Applications">

      {/* ── New Application ── */}
      <div className="mb-6">
        {!showNew ? (
          <button onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-2xl font-bold text-sm shadow-md shadow-green-700/20 transition-all focus:outline-none focus:ring-2 focus:ring-green-500/40">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Application
          </button>
        ) : (
          <div className="max-w-[860px]">
            <NewApplicationHero />
            <div className="bg-white rounded-[14px] border border-slate-200 overflow-hidden shadow-sm">
              <ApplicationStarter role="branch" onCreated={handleCreated} onCancel={() => setShowNew(false)} queryKey="branch-applications" />
            </div>
          </div>
        )}
      </div>

      {/* ── Live-to-School confirm dialog ── */}
      {confirmLiveId !== null && (() => {
        const app = apps.find(a => a.id === confirmLiveId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Send Live to School?</p>
                  <p className="text-xs text-slate-500 mt-0.5">{app?.student_name}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                This will forward the application to the school and make it visible to the admin team. This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmLiveId(null)}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => liveToSchoolMutation.mutate(confirmLiveId)}
                  disabled={liveToSchoolMutation.isPending}
                  className="flex-1 px-4 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-bold transition-colors disabled:opacity-50">
                  {liveToSchoolMutation.isPending ? 'Sending…' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Table card ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Header: title + search */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <h3 className="font-black text-slate-900 text-sm">Branch Applications</h3>
              <p className="text-xs text-slate-400 mt-0.5">All applications submitted by your branch</p>
            </div>
            <div className="relative w-full sm:w-64">
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
              </svg>
              <input
                type="search" placeholder="Search name, code, country…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 transition-all placeholder:text-slate-300"
              />
            </div>
            {search && (
              <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-green-50 border border-green-200 text-green-700 shrink-0">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Table body */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center gap-3">
            <span className="w-8 h-8 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading applications…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-500">{search ? 'No results found' : 'No applications yet'}</p>
              <p className="text-xs text-slate-400 mt-1">
                {search ? `No match for "${search}"` : 'Click "New Application" above to get started.'}
              </p>
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
                    <th className="text-left px-4 py-3">Live to School</th>
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
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">{app.form_template?.name ?? ''}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${app.progress >= 80 ? 'bg-emerald-500' : app.progress >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                              style={{ width: `${app.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600 tabular-nums">{app.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[app.status] ?? 'bg-slate-100 text-slate-500'}`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        {app.live_to_school ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Live
                          </span>
                        ) : app.status === 'submitted' ? (
                          <button
                            onClick={() => setConfirmLiveId(app.id)}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-green-700 hover:text-white text-slate-500 transition-all border border-transparent hover:border-green-700">
                            Send Live
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-300">—</span>
                        )}
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
                    <span className={`text-xs font-black ${app.progress >= 80 ? 'text-emerald-600' : app.progress >= 50 ? 'text-amber-600' : 'text-rose-500'}`}>
                      {app.progress}%
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
                    <div className="flex items-center gap-2 mt-1.5">
                      {app.live_to_school ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Live
                        </span>
                      ) : app.status === 'submitted' ? (
                        <button
                          onClick={e => { e.stopPropagation(); setConfirmLiveId(app.id); }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          Send Live
                        </button>
                      ) : null}
                      <span className="text-[11px] text-slate-400">{timeAgo(app.created_at)}</span>
                    </div>
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
    </BranchLayout>
  );
}
