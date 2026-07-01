'use client';
import { useEffect, useState } from 'react';
import AgencyLayout from '@/components/shared/AgencyLayout';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import ApplicationFormBody from '@/components/applications/ApplicationFormBody';
import { Application, AppDoc, FormTemplateData } from '@/components/applications/ApplicationFormShared';

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

export default function AgencySelectedPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const qc       = useQueryClient();
  const isAgency = user?.gateway_type === 'agency';

  const [activeAppId, setActiveAppId] = useState<number | null>(null);

  useEffect(() => {
    if (user && !isAgency) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isAgency, router]);

  const queryKey = ['agency-applications'];

  const { data: appsData, isLoading } = useQuery<{ data: Application[] }>({
    queryKey,
    queryFn: () => api.get('/applications').then(r => r.data),
    staleTime: 60_000,
    enabled: !!isAgency,
  });

  const allApps = appsData?.data ?? [];
  const selected = allApps.filter(a => a.status === 'accepted');
  const activeApp = selected.find(a => a.id === activeAppId) ?? null;

  const { data: template, isLoading: templateLoading } = useQuery<FormTemplateData | null>({
    queryKey: ['form-template', activeApp?.form_template_id],
    queryFn: () => activeApp?.form_template_id
      ? api.get(`/form-templates/${activeApp.form_template_id}`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!activeApp?.form_template_id,
    staleTime: 300_000,
  });

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

  return (
    <AgencyLayout>
      <div className="max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-[0.15em] font-semibold mb-2">
              Agency Portal
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Selected
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Applications that have been accepted and approved.
            </p>
          </div>
          {selected.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {selected.length} Accepted
            </span>
          )}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-sm">Accepted Applications</h3>
              <p className="text-xs text-slate-400 mt-0.5">Applicants whose applications were accepted</p>
            </div>
            {selected.length > 0 && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl">
                {selected.length} total
              </span>
            )}
          </div>

          {/* Body */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <span className="w-8 h-8 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading…</p>
            </div>
          ) : selected.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3 text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">No accepted applications yet</p>
                <p className="text-xs text-slate-400 mt-1">Accepted applications will appear here once admin approves them.</p>
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
                    {selected.map(app => (
                      <tr key={app.id}
                        onClick={() => setActiveAppId(app.id)}
                        className="hover:bg-emerald-50/40 cursor-pointer transition-colors group">
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
                              <div className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${app.progress ?? 0}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-600 tabular-nums">{app.progress ?? 0}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                            Accepted
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[11px] text-slate-400 whitespace-nowrap">
                          {timeAgo(app.created_at)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-700 text-slate-400 transition-colors">
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
                {selected.map(app => (
                  <div key={app.id}
                    onClick={() => setActiveAppId(app.id)}
                    className="px-4 py-4 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors active:bg-slate-100">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-bold text-slate-900 truncate">{app.student_name}</p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">Accepted</span>
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
                  <span className="font-bold text-slate-600">{selected.length}</span> accepted application{selected.length !== 1 ? 's' : ''}
                  {allApps.length > selected.length && (
                    <> · <span className="font-bold text-slate-600">{allApps.length}</span> total across all statuses</>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </AgencyLayout>
  );
}
