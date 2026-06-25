'use client';
import BranchLayout from '@/components/shared/BranchLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Application, AppDoc, FormTemplateData } from '@/components/applications/ApplicationFormShared';
import ApplicationFormBody from '@/components/applications/ApplicationFormBody';
import ApplicationStarter from '@/components/applications/ApplicationStarter';

const STATUS_STYLE: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-500',
  submitted: 'bg-amber-100 text-amber-700',
  accepted:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-rose-100 text-rose-600',
};

export default function BranchApplicantsPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const qc       = useQueryClient();

  const isBranchAdmin = user?.roles?.some(r => r === 'branch_admin' || r === 'branch_manager');
  useEffect(() => {
    if (user && !isBranchAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isBranchAdmin, router]);

  const [activeAppId, setActiveAppId] = useState<number | null>(null);
  const [showStarter, setShowStarter] = useState(false);
  const [tableTab,    setTableTab]    = useState<'draft' | 'submitted'>('submitted');
  const [search,      setSearch]      = useState('');

  const { data: appsData, isLoading } = useQuery<{ data: Application[] }>({
    queryKey: ['branch-applications'],
    queryFn: () => api.get('/applications').then(r => r.data),
    enabled: !!isBranchAdmin,
  });
  const apps = appsData?.data ?? [];
  const activeApp = apps.find(a => a.id === activeAppId) ?? null;

  const { data: template } = useQuery<FormTemplateData | null>({
    queryKey: ['form-template', activeApp?.form_template_id],
    queryFn: () => activeApp?.form_template_id
      ? api.get(`/form-templates/${activeApp.form_template_id}`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!activeApp?.form_template_id,
    staleTime: 300_000,
  });

  function handleCreated(app: Application) {
    setActiveAppId(app.id);
    setShowStarter(false);
  }

  function updateApps(updated: Application) {
    qc.setQueryData(['branch-applications'], (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a => a.id === updated.id ? { ...a, ...updated } : a),
    }));
  }

  function handleDocUploaded(doc: AppDoc, progress: number) {
    qc.setQueryData(['branch-applications'], (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === activeAppId
          ? { ...a, progress, documents: [...a.documents.filter(d => d.doc_type !== doc.doc_type), doc] }
          : a
      ),
    }));
  }

  function handleDocDeleted(docId: number, progress: number) {
    qc.setQueryData(['branch-applications'], (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === activeAppId
          ? { ...a, progress, documents: a.documents.filter(d => d.id !== docId) }
          : a
      ),
    }));
  }

  if (!user || !isBranchAdmin) return null;

  const q         = search.toLowerCase();
  const submitted = apps.filter(a => a.status !== 'draft').filter(a =>
    !q || a.student_name?.toLowerCase().includes(q) || a.student_email?.toLowerCase().includes(q) ||
    a.application_code?.toLowerCase().includes(q) || a.form_template?.country?.toLowerCase().includes(q)
  );
  const drafts    = apps.filter(a => a.status === 'draft').filter(a =>
    !q || a.student_name?.toLowerCase().includes(q) || a.student_email?.toLowerCase().includes(q) ||
    a.application_code?.toLowerCase().includes(q) || a.form_template?.country?.toLowerCase().includes(q)
  );

  return (
    <BranchLayout title="Applications">

      {activeAppId === null ? (
        <>
          {/* New Application — full admin-style layout */}
          {showStarter ? (
            <div className="mb-6 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Hero banner — exact match admin */}
              <div className="relative bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 px-8 py-8 overflow-hidden">
                {/* decorative circles */}
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute right-16 bottom-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-green-200 bg-white/10 border border-white/20 px-3 py-1 rounded-full mb-3">
                    🔒 NEW APPLICATION
                  </span>
                  <h2 className="text-2xl font-black text-white leading-tight">Create a New Student Application</h2>
                  <p className="text-green-100 text-xs mt-2 mb-5 max-w-lg">
                    Select a country form, fill in the student&apos;s details, and save to continue editing the full application.
                  </p>
                  {/* Step indicators */}
                  <div className="flex flex-wrap items-center gap-1 text-[11px]">
                    {[
                      { n: 1, label: 'Select Country Form' },
                      { n: 2, label: 'Fill Student Info' },
                      { n: 3, label: 'Education & Documents' },
                      { n: 4, label: 'Save & Continue' },
                    ].map((step, i, arr) => (
                      <span key={step.n} className="flex items-center gap-1">
                        <span className="flex items-center gap-1.5 bg-white/15 border border-white/25 text-white font-bold px-3 py-1.5 rounded-full">
                          <span className="w-4 h-4 bg-white/25 rounded-full text-[9px] flex items-center justify-center font-black">{step.n}</span>
                          {step.label}
                        </span>
                        {i < arr.length - 1 && <span className="text-white/40 font-bold mx-0.5">›</span>}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Cancel button */}
                <button onClick={() => setShowStarter(false)}
                  className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-bold rounded-xl transition-all">
                  ✕ Cancel
                </button>
              </div>
              <ApplicationStarter role="branch" onCreated={handleCreated} queryKey="branch-applications" />
            </div>
          ) : (
            /* Collapsed header */
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
              <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-white">Student Applications</h2>
                  <p className="text-green-100 text-xs mt-0.5">Manage and track student applications for your branch</p>
                </div>
                <button onClick={() => setShowStarter(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold bg-white text-green-800 hover:bg-green-50 transition-all shadow-md">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  New Application
                </button>
              </div>
              <div className="px-6 py-7 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl">📝</div>
                <p className="text-sm font-semibold text-slate-600">
                  {isLoading ? 'Loading…' : apps.length === 0
                    ? "No applications yet — click 'New Application' to begin"
                    : 'Select an application from the list below, or start a new one'}
                </p>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <h3 className="font-black text-slate-900 text-sm">All Applications</h3>
                <p className="text-xs text-slate-400 mt-0.5">{apps.length} total</p>
              </div>
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 w-48 bg-slate-50"
                  placeholder="Search name, code, country…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {/* Tabs */}
              <div className="flex gap-1.5">
                {(['submitted', 'draft'] as const).map(t => (
                  <button key={t} onClick={() => setTableTab(t)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${tableTab === t ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {t === 'submitted' ? `✓ Submitted (${submitted.length})` : `⏳ Draft (${drafts.length})`}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="py-20 text-center"><span className="w-8 h-8 border-3 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" /></div>
            ) : (tableTab === 'submitted' ? submitted : drafts).length === 0 ? (
              <div className="py-20 text-center">
                <div className="text-4xl mb-3">{tableTab === 'submitted' ? '📬' : '📝'}</div>
                <p className="text-sm font-semibold text-slate-500">No applications yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 text-xs font-bold text-slate-400 uppercase tracking-wide">
                      <th className="text-left px-6 py-3">Code</th>
                      <th className="text-left px-4 py-3">Student</th>
                      <th className="text-left px-4 py-3">Progress</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Country</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Intake</th>
                      <th className="text-left px-4 py-3 hidden lg:table-cell">Status</th>
                      <th className="text-left px-4 py-3 hidden lg:table-cell">Updated</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(tableTab === 'submitted' ? submitted : drafts).map(app => (
                      <tr key={app.id} onClick={() => setActiveAppId(app.id)}
                        className="hover:bg-slate-50 cursor-pointer group transition-colors">
                        <td className="px-6 py-4"><span className="font-mono text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">{app.application_code}</span></td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-800 text-xs">{app.student_name}</p>
                          <p className="text-[11px] text-slate-400">{app.student_email}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${app.progress >= 80 ? 'bg-emerald-500' : app.progress >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${app.progress}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-600">{app.progress}%</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[app.status] ?? ''}`}>{app.status}</span>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500 hidden sm:table-cell">{app.form_template?.country ?? '—'}</td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          {app.form_data?.intake
                            ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{app.form_data.intake}</span>
                            : <span className="text-[10px] text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[app.status] ?? ''}`}>{app.status}</span>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-400 hidden lg:table-cell">{new Date(app.updated_at).toLocaleDateString()}</td>
                        <td className="px-4 py-4"><span className="text-xs font-bold text-green-700 group-hover:text-green-900">Open →</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Interviews Section ── */}
          <div id="interviews" className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-6">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm">Interviews</h3>
              <p className="text-xs text-slate-400 mt-0.5">Scheduled interviews for students submitted by your branch</p>
            </div>
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">🗓️</div>
              <p className="text-sm font-semibold text-slate-500">Coming soon</p>
            </div>
          </div>
        </>
      ) : activeApp ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <ApplicationFormBody
            app={activeApp} template={template ?? null}
            onSaved={updateApps} onSubmitted={updateApps}
            onDocUploaded={handleDocUploaded} onDocDeleted={handleDocDeleted}
            onClose={() => setActiveAppId(null)}
          />
        </div>
      ) : null}
    </BranchLayout>
  );
}