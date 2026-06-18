'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Application, AppDoc, FormTemplateData,
} from '@/components/applications/ApplicationFormShared';
import ApplicationFormBody from '@/components/applications/ApplicationFormBody';

const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 bg-white transition-all placeholder:text-slate-300';
const lbl = 'block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide';

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

const EMPTY = { name: '', email: '', phone: '', templateId: '' };

export default function AdminApplicantsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const isAdmin = user?.roles?.some(r => ['admin', 'super_admin'].includes(r));
  useEffect(() => {
    if (user && !isAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isAdmin, router]);

  const [activeAppId, setActiveAppId] = useState<number | null>(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [createForm,  setCreateForm]  = useState(EMPTY);
  const [createErr,   setCreateErr]   = useState('');
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

  const { data: templates = [] } = useQuery<{ id: number; name: string; country: string }[]>({
    queryKey: ['form-templates-list'],
    queryFn: () => api.get('/form-templates').then(r => r.data),
    enabled: !!isAdmin,
  });

  const createMut = useMutation({
    mutationFn: () => api.post('/applications', {
      form_template_id: parseInt(createForm.templateId),
      student_name:     createForm.name,
      student_email:    createForm.email || undefined,
      student_phone:    createForm.phone || undefined,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-applications'] });
      setActiveAppId(res.data.application.id);
      setShowCreate(false);
      setCreateForm(EMPTY);
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      setCreateErr(ax.response?.data?.message ?? 'Failed.');
    },
  });

  function updateApps(updated: Application) {
    qc.setQueryData(['admin-applications', statusFilter], (old: { data: Application[] } | undefined) => ({
      ...old,
      data: (old?.data ?? []).map(a => a.id === updated.id ? { ...a, ...updated } : a),
    }));
  }

  function handleDocUploaded(doc: AppDoc, progress: number) {
    qc.setQueryData(['admin-applications', statusFilter], (old: { data: Application[] } | undefined) => ({
      ...old,
      data: (old?.data ?? []).map(a =>
        a.id === activeAppId
          ? { ...a, progress, documents: [...a.documents.filter(d => d.doc_type !== doc.doc_type), doc] }
          : a
      ),
    }));
  }

  function handleDocDeleted(docId: number, progress: number) {
    qc.setQueryData(['admin-applications', statusFilter], (old: { data: Application[] } | undefined) => ({
      ...old,
      data: (old?.data ?? []).map(a =>
        a.id === activeAppId
          ? { ...a, progress, documents: a.documents.filter(d => d.id !== docId) }
          : a
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

  return (
    <DashboardLayout title="All Applications">

      {activeAppId === null ? (
        <>
          {/* Create button + filter bar */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <button onClick={() => setShowCreate(s => !s)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm ${showCreate ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-green-700 text-white hover:bg-green-800'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={showCreate ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'} />
              </svg>
              {showCreate ? 'Cancel' : 'Create Application'}
            </button>

            {(['', 'draft', 'submitted', 'accepted', 'rejected'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-green-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-green-400'}`}>
                {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}

            <span className="ml-auto text-xs text-slate-400">{apps.length} total</span>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
              <h3 className="font-bold text-slate-800 text-sm mb-4">Create New Application (Admin)</h3>
              {createErr && <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600">⚠️ {createErr}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Application Form *</label>
                  <select className={inp} value={createForm.templateId} onChange={e => setCreateForm(p => ({ ...p, templateId: e.target.value }))}>
                    <option value="">Select form…</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.country} — {t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Student Name *</label>
                  <input className={inp} placeholder="Full name" value={createForm.name}
                    onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Email</label>
                  <input className={inp} type="email" placeholder="student@email.com" value={createForm.email}
                    onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Phone</label>
                  <input className={inp} type="tel" placeholder="+880 1XXX XXXXXX" value={createForm.phone}
                    onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <button onClick={() => createMut.mutate()}
                disabled={createMut.isPending || !createForm.name || !createForm.templateId}
                className="mt-5 flex items-center gap-2 px-6 py-3 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-2xl disabled:opacity-50">
                {createMut.isPending && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                🚀 Create & Open Form
              </button>
            </div>
          )}

          {/* All Applications Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="py-20 text-center"><span className="w-8 h-8 border-3 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" /></div>
              ) : apps.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-sm text-slate-400">No applications found</p>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </>
      ) : activeApp ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <ApplicationFormBody
            app={activeApp}
            template={template ?? null}
            onSaved={updateApps}
            onSubmitted={updateApps}
            onDocUploaded={handleDocUploaded}
            onDocDeleted={handleDocDeleted}
            onClose={() => setActiveAppId(null)}
          />
        </div>
      ) : null}

    </DashboardLayout>
  );
}