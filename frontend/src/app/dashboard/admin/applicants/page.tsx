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

const ROLE_FILTERS = [
  { key: '', label: 'All Sources' },
  { key: 'branch_admin', label: '🏢 Branch' },
  { key: 'agency',       label: '🏪 Agency' },
  { key: 'student',      label: '👤 Student' },
  { key: 'admin',        label: '🏛 Admin' },
];

const STATUS_FILTERS = ['', 'draft', 'submitted', 'accepted', 'rejected'] as const;

export default function AdminApplicantsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const isAdmin = user?.roles?.some(r => ['admin', 'super_admin'].includes(r));
  useEffect(() => {
    if (user && !isAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isAdmin, router]);

  const [activeAppId,   setActiveAppId]   = useState<number | null>(null);
  const [statusFilter,  setStatusFilter]  = useState('');
  const [roleFilter,    setRoleFilter]    = useState('');
  const [showNew,       setShowNew]       = useState(false);

  const queryKey = ['admin-applications', statusFilter, roleFilter];

  const { data: appsData, isLoading } = useQuery<{ data: Application[] }>({
    queryKey,
    queryFn: () => {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (roleFilter)   params.role   = roleFilter;
      return api.get('/applications', { params }).then(r => r.data);
    },
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

  const submittedCount = apps.filter(a => a.status === 'submitted').length;
  const acceptedCount  = apps.filter(a => a.status === 'accepted').length;

  return (
    <DashboardLayout title="All Applications">

      {/* ── New Application button / expand ── */}
      <div className="mb-5">
        {!showNew ? (
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-5 py-3 bg-green-700 hover:bg-green-600 text-white rounded-2xl font-bold text-sm shadow-md shadow-green-700/20 transition-all">
            + New Application
          </button>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">New Application</h2>
                <p className="text-green-100 text-xs mt-0.5">Select a published form, enter student details and fill the application</p>
              </div>
              <button onClick={() => setShowNew(false)}
                className="text-white/60 hover:text-white text-xl leading-none transition-colors">✕</button>
            </div>
            <ApplicationStarter role="admin" onCreated={handleCreated} queryKey="admin-applications" />
          </div>
        )}
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total',     value: apps.length,     color: 'text-slate-800', bg: 'bg-slate-50' },
          { label: 'Submitted', value: submittedCount,  color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Accepted',  value: acceptedCount,   color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Rejected',  value: apps.filter(a => a.status === 'rejected').length, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3 border border-slate-100`}>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── All applications table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Header + filters */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div>
              <h3 className="font-black text-slate-900 text-sm">All Applications</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Branch, agency (submitted only), student and admin — all in one place
              </p>
            </div>
          </div>

          {/* Source filter */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {ROLE_FILTERS.map(f => (
              <button key={f.key} onClick={() => setRoleFilter(f.key)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${roleFilter === f.key ? 'bg-green-700 text-white' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-green-400'}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-slate-800 text-white' : 'bg-slate-50 border border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                {s === '' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
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
            <p className="text-xs text-slate-400 mt-1">
              Agency drafts are hidden until submitted. Other applications appear immediately.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Code</th>
                  <th className="text-left px-4 py-3">Student</th>
                  <th className="text-left px-4 py-3">Source</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Country / Form</th>
                  <th className="text-left px-4 py-3">Progress</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {apps.map(app => {
                  const sourceLabel = app.submitted_by_role === 'branch_admin'
                    ? (app.branch_name ?? 'Branch')
                    : app.submitted_by_role === 'agency'
                    ? (app.submitter_name ?? 'Agency')
                    : app.submitted_by_role === 'student'
                    ? (app.submitter_name ?? 'Student')
                    : 'Admin';

                  return (
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
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_BADGE[app.submitted_by_role] ?? 'bg-slate-100 text-slate-500'}`}>
                          {ROLE_LABEL[app.submitted_by_role] ?? app.submitted_by_role}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[120px]">{sourceLabel}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-xs font-medium text-slate-700">{app.form_template?.country ?? '—'}</p>
                        <p className="text-[11px] text-slate-400">{app.form_template?.name ?? ''}</p>
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
                        <select
                          value={app.status}
                          onClick={e => e.stopPropagation()}
                          onChange={e => handleStatusChange(app.id, e.target.value)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${STATUS_COLOR[app.status] ?? ''}`}>
                          <option value="draft">Draft</option>
                          <option value="submitted">Submitted</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </DashboardLayout>
  );
}
