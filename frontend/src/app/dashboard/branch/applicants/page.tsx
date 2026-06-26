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
import NewApplicationHero from '@/components/applications/NewApplicationHero';

const STATUS_COLOR: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-500',
  submitted: 'bg-amber-100 text-amber-700',
  accepted:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-rose-100 text-rose-600',
};

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

  const queryKey = ['branch-applications'];

  const { data: appsData, isLoading } = useQuery<{ data: Application[] }>({
    queryKey,
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
        a.id === activeAppId ? { ...a, progress, documents: [...a.documents.filter(d => d.doc_type !== doc.doc_type), doc] } : a
      ),
    }));
  }

  function handleDocDeleted(docId: number, progress: number) {
    qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === activeAppId ? { ...a, progress, documents: a.documents.filter(d => d.id !== docId) } : a
      ),
    }));
  }

  if (!user || !isBranchAdmin) return null;

  // ── Active form view ──────────────────────────────────────────────────────
  if (activeAppId !== null && activeApp) {
    return (
      <BranchLayout title="Applications">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <ApplicationFormBody
            app={activeApp} template={template ?? null}
            onSaved={updateApps} onSubmitted={updateApps}
            onDocUploaded={handleDocUploaded} onDocDeleted={handleDocDeleted}
            onClose={() => setActiveAppId(null)}
          />
        </div>
      </BranchLayout>
    );
  }

  const submittedCount = apps.filter(a => a.status === 'submitted').length;
  const acceptedCount  = apps.filter(a => a.status === 'accepted').length;

  return (
    <BranchLayout title="Applications">

      {/* ── New Application hero + form ── */}
      {showNew && (
        <div className="mb-5 max-w-[860px]">
          <NewApplicationHero />
          <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
            <ApplicationStarter role="branch" onCreated={handleCreated} onCancel={() => setShowNew(false)} queryKey="branch-applications" />
          </div>
        </div>
      )}

      {/* ── New Application button (shown when form is closed) ── */}
      {!showNew && (
        <div className="mb-5">
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-5 py-3 bg-green-700 hover:bg-green-600 text-white rounded-2xl font-bold text-sm shadow-md shadow-green-700/20 transition-all">
            + New Application
          </button>
        </div>
      )}

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total',     value: apps.length,                                    color: 'text-slate-800',   bg: 'bg-slate-50' },
          { label: 'Submitted', value: submittedCount,                                 color: 'text-amber-700',   bg: 'bg-amber-50' },
          { label: 'Accepted',  value: acceptedCount,                                  color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Rejected',  value: apps.filter(a => a.status === 'rejected').length, color: 'text-rose-600',  bg: 'bg-rose-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3 border border-slate-100`}>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Applications table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-black text-slate-900 text-sm">All Applications</h3>
          <p className="text-xs text-slate-400 mt-0.5">All applications submitted by your branch</p>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <span className="w-8 h-8 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" />
          </div>
        ) : apps.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm font-semibold text-slate-500">No applications yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Code</th>
                  <th className="text-left px-4 py-3">Student</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Country / Form</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Intake</th>
                  <th className="text-left px-4 py-3">Progress</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {apps.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {app.application_code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 text-xs">{app.student_name}</p>
                      <p className="text-[11px] text-slate-400">{app.student_email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs font-medium text-slate-700">{app.form_template?.country ?? '—'}</p>
                      <p className="text-[11px] text-slate-400">{app.form_template?.name ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {app.form_data?.intake
                        ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 whitespace-nowrap">{app.form_data.intake}</span>
                        : <span className="text-[10px] text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${app.progress >= 80 ? 'bg-emerald-500' : app.progress >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                            style={{ width: `${app.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{app.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLOR[app.status] ?? ''}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setActiveAppId(app.id)}
                        className="text-xs font-bold text-green-700 hover:text-green-900 whitespace-nowrap">
                        Open →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </BranchLayout>
  );
}
