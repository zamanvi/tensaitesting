'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Application, AppDoc, FormTemplateData } from '@/components/applications/ApplicationFormShared';
import ApplicationFormBody from '@/components/applications/ApplicationFormBody';
import ApplicationStarter from '@/components/applications/ApplicationStarter';

const STATUS_COLOR: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-500',
  submitted: 'bg-amber-100 text-amber-700',
  accepted:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-rose-100 text-rose-600',
};

const ROLE_BADGE: Record<string, string> = {
  admin:        'bg-purple-100 text-purple-700',
  branch_admin: 'bg-blue-100 text-blue-700',
  agency:       'bg-amber-100 text-amber-700',
  student:      'bg-teal-100 text-teal-700',
};

const ROLE_LABEL: Record<string, string> = {
  admin:        '🏛 Admin',
  branch_admin: '🏢 Branch',
  agency:       '🏪 Agency',
  student:      '👤 Student',
};

export default function AdminApplicantsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const isAdmin = user?.roles?.some(r => ['admin', 'super_admin'].includes(r));
  useEffect(() => {
    if (user && !isAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isAdmin, router]);

  // null = list view, number = open that application
  const [activeAppId,  setActiveAppId]  = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: appsData, isLoading } = useQuery<{ data: Application[] }>({
    queryKey: ['admin-applications', statusFilter],
    queryFn: () => api.get('/applications', { params: statusFilter ? { status: statusFilter } : {} }).then(r => r.data),
    enabled: !!isAdmin,
  });
  const apps = appsData?.data ?? [];
  const activeApp = apps.find(a => a.id === activeAppId) ?? null;

  const { data: template } = useQuery<FormTemplateData | null>({
    queryKey: ['form-template', activeApp?.form_template?.country],
    queryFn: () => activeApp?.form_template?.country
      ? api.get(`/form-templates/${encodeURIComponent(activeApp.form_template!.country)}`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!activeApp?.form_template?.country,
    staleTime: 300_000,
  });

  function handleCreated(app: Application) {
    qc.invalidateQueries({ queryKey: ['admin-applications', statusFilter] });
    setActiveAppId(app.id);
  }

  function updateApps(updated: Application) {
    qc.setQueryData(['admin-applications', statusFilter], (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a => a.id === updated.id ? { ...a, ...updated } : a),
    }));
  }

  function handleDocUploaded(doc: AppDoc, progress: number) {
    qc.setQueryData(['admin-applications', statusFilter], (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === activeAppId ? { ...a, progress, documents: [...a.documents.filter(d => d.doc_type !== doc.doc_type), doc] } : a
      ),
    }));
  }

  function handleDocDeleted(docId: number, progress: number) {
    qc.setQueryData(['admin-applications', statusFilter], (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === activeAppId ? { ...a, progress, documents: a.documents.filter(d => d.id !== docId) } : a
      ),
    }));
  }

  async function handleStatusChange(appId: number, status: string) {
    try {
      const res = await api.patch(`/admin/applications/${appId}/status`, { status });
      updateApps(res.data);
    } catch { /* noop */ }
  }

  if (!user || !isAdmin) return null;

  // ── Active form view ──────────────────────────────────────────────────────
  if (activeAppId !== null && activeApp) {
    return (
      <DashboardLayout title="All Applications">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <ApplicationFormBody
            app={activeApp} template={template ?? null}
            onSaved={updateApps} onSubmitted={updateApps}
            onDocUploaded={handleDocUploaded} onDocDeleted={handleDocDeleted}
            onClose={() => setActiveAppId(null)}
          />
        </div>
      </DashboardLayout>
    );
  }

  // ── List view: form on top + all applications table below ─────────────────
  return (
    <DashboardLayout title="All Applications">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TOP: Admin can create/fill an application                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-6">
          <h2 className="text-lg font-black text-white">Create Application</h2>
          <p className="text-green-100 text-xs mt-1">Select the published form, enter student details and fill the application</p>
        </div>
        <ApplicationStarter role="admin" onCreated={handleCreated} queryKey="admin-applications" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* BOTTOM: All applications from everyone                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Table header + filters */}
        <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div>
            <h3 className="font-black text-slate-900 text-sm">All Applications</h3>
            <p className="text-xs text-slate-400 mt-0.5">Every submission from branch, agency, student and admin</p>
          </div>
          <div className="ml-auto flex flex-wrap gap-1.5">
            {(['', 'draft', 'submitted', 'accepted', 'rejected'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-green-700 text-white' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-green-400'}`}>
                {s === '' ? `All (${apps.length})` : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <span className="w-8 h-8 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" />
          </div>
        ) : apps.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm font-semibold text-slate-500">No applications yet</p>
            <p className="text-xs text-slate-400 mt-1">Applications submitted by any role will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Code</th>
                  <th className="text-left px-4 py-3">Student</th>
                  <th className="text-left px-4 py-3">Submitted by</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Country / Form</th>
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
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{app.application_code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 text-xs">{app.student_name}</p>
                      <p className="text-[11px] text-slate-400">{app.student_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_BADGE[app.submitted_by_role] ?? 'bg-slate-100 text-slate-500'}`}>
                        {ROLE_LABEL[app.submitted_by_role] ?? app.submitted_by_role}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-xs font-medium text-slate-700">{app.form_template?.country ?? '—'}</p>
                      <p className="text-[11px] text-slate-400">{app.form_template?.name ?? ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${app.progress >= 80 ? 'bg-emerald-500' : app.progress >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                            style={{ width: `${app.progress}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{app.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={app.status}
                        onClick={e => e.stopPropagation()}
                        onChange={e => handleStatusChange(app.id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${STATUS_COLOR[app.status] ?? ''}`}>
                        <option value="draft">draft</option>
                        <option value="submitted">submitted</option>
                        <option value="accepted">accepted</option>
                        <option value="rejected">rejected</option>
                      </select>
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

    </DashboardLayout>
  );
}