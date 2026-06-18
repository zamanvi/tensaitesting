'use client';
import BranchLayout from '@/components/shared/BranchLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Application, AppDoc, FormTemplateData,
  ProgressBar, compressImage,
} from '@/components/applications/ApplicationFormShared';
import ApplicationFormBody from '@/components/applications/ApplicationFormBody';

const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 bg-white transition-all placeholder:text-slate-300';
const lbl = 'block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide';

const STATUS_STYLE: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-500',
  submitted: 'bg-amber-100 text-amber-700',
  accepted:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-rose-100 text-rose-600',
};

const EMPTY = { name: '', email: '', phone: '', templateId: '' };

export default function BranchApplicantsPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const qc       = useQueryClient();

  const isBranchAdmin = user?.roles?.some(r => r === 'branch_admin' || r === 'branch_manager');
  useEffect(() => {
    if (user && !isBranchAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isBranchAdmin, router]);

  const [activeAppId, setActiveAppId] = useState<number | null>(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [createForm,  setCreateForm]  = useState(EMPTY);
  const [createErr,   setCreateErr]   = useState('');
  const [tableTab,    setTableTab]    = useState<'draft' | 'submitted'>('submitted');

  // Fetch all applications for this branch
  const { data: appsData, isLoading } = useQuery<{ data: Application[] }>({
    queryKey: ['branch-applications'],
    queryFn: () => api.get('/applications').then(r => r.data),
    enabled: !!isBranchAdmin,
  });
  const apps = appsData?.data ?? [];

  // Active app
  const activeApp = apps.find(a => a.id === activeAppId) ?? null;

  // Fetch template for active app
  const { data: template } = useQuery<FormTemplateData | null>({
    queryKey: ['form-template', activeApp?.form_template?.country],
    queryFn: () => activeApp?.form_template?.country
      ? api.get(`/form-templates/${encodeURIComponent(activeApp.form_template!.country)}`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!activeApp?.form_template?.country,
    staleTime: 300_000,
  });

  // Published templates for create dropdown
  const { data: templates = [] } = useQuery<{ id: number; name: string; country: string }[]>({
    queryKey: ['form-templates-list'],
    queryFn: () => api.get('/form-templates').then(r => r.data),
    enabled: !!isBranchAdmin,
  });

  const createMut = useMutation({
    mutationFn: () => api.post('/applications', {
      form_template_id: parseInt(createForm.templateId),
      student_name:     createForm.name,
      student_email:    createForm.email || undefined,
      student_phone:    createForm.phone || undefined,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['branch-applications'] });
      setActiveAppId(res.data.application.id);
      setShowCreate(false);
      setCreateForm(EMPTY);
      setCreateErr('');
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = ax.response?.data?.errors;
      setCreateErr(errs ? Object.values(errs).flat().join(' ') : ax.response?.data?.message ?? 'Failed.');
    },
  });

  function handleDocUploaded(doc: AppDoc, progress: number) {
    qc.setQueryData(['branch-applications'], (old: { data: Application[] } | undefined) => ({
      ...old,
      data: (old?.data ?? []).map(a =>
        a.id === activeAppId
          ? { ...a, progress, documents: [...a.documents.filter(d => d.doc_type !== doc.doc_type), doc] }
          : a
      ),
    }));
  }

  function handleDocDeleted(docId: number, progress: number) {
    qc.setQueryData(['branch-applications'], (old: { data: Application[] } | undefined) => ({
      ...old,
      data: (old?.data ?? []).map(a =>
        a.id === activeAppId
          ? { ...a, progress, documents: a.documents.filter(d => d.id !== docId) }
          : a
      ),
    }));
  }

  function handleSaved(updated: Application) {
    qc.setQueryData(['branch-applications'], (old: { data: Application[] } | undefined) => ({
      ...old,
      data: (old?.data ?? []).map(a => a.id === updated.id ? { ...a, ...updated } : a),
    }));
  }

  function handleSubmitted(updated: Application) {
    handleSaved(updated);
  }

  if (!user || !isBranchAdmin) return null;

  const submitted = apps.filter(a => a.status === 'submitted' || a.status === 'accepted' || a.status === 'rejected');
  const drafts    = apps.filter(a => a.status === 'draft');

  return (
    <BranchLayout title="Applications">

      {activeAppId === null ? (
        <>
          {/* ── Header card ── */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">Application Forms</h2>
                  <p className="text-green-100 text-xs mt-1">Create or continue student application forms</p>
                </div>
                <button onClick={() => setShowCreate(s => !s)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-md ${showCreate ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white text-green-800 hover:bg-green-50'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={showCreate ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'} />
                  </svg>
                  {showCreate ? 'Cancel' : 'New Application'}
                </button>
              </div>
            </div>

            {showCreate && (
              <div className="px-6 py-6 bg-slate-50/60 border-b border-slate-100">
                {createErr && (
                  <div className="mb-4 flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-600">
                    <span className="shrink-0">⚠️</span> {createErr}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Application Form (Country) *</label>
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
                  className="mt-5 flex items-center gap-2 px-6 py-3 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-2xl disabled:opacity-50 transition-all shadow-sm">
                  {createMut.isPending && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  🚀 Create & Open Form
                </button>
              </div>
            )}

            {!showCreate && (
              <div className="px-6 py-8 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-3 text-2xl">📝</div>
                <p className="text-sm font-semibold text-slate-600">
                  {isLoading ? 'Loading…' : apps.length === 0
                    ? 'No applications yet — click New Application to start'
                    : 'Select an application from the table below to continue editing'}
                </p>
              </div>
            )}
          </div>

          {/* ── Table ── */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm">All Applications</h3>
                <p className="text-xs text-slate-400 mt-0.5">{apps.length} total · click to continue editing</p>
              </div>
              <div className="flex gap-1.5">
                {(['submitted', 'draft'] as const).map(t => (
                  <button key={t} onClick={() => setTableTab(t)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${tableTab === t ? 'bg-green-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {t === 'submitted' ? `✓ Submitted (${submitted.length})` : `⏳ In Progress (${drafts.length})`}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="py-20 text-center">
                <span className="w-8 h-8 border-3 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" />
              </div>
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
                      <th className="text-left px-4 py-3 hidden md:table-cell">Form</th>
                      <th className="text-left px-4 py-3 hidden lg:table-cell">Updated</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(tableTab === 'submitted' ? submitted : drafts).map(app => (
                      <tr key={app.id} onClick={() => setActiveAppId(app.id)}
                        className="hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer group">
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">{app.application_code}</span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-800 text-xs">{app.student_name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{app.student_email}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${app.progress >= 80 ? 'bg-emerald-500' : app.progress >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                style={{ width: `${app.progress}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-600">{app.progress}%</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[app.status] ?? 'bg-slate-100 text-slate-500'}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500 hidden sm:table-cell">{app.form_template?.country ?? '—'}</td>
                        <td className="px-4 py-4 text-xs text-slate-400 hidden md:table-cell">{app.form_template?.name ?? '—'}</td>
                        <td className="px-4 py-4 text-xs text-slate-400 hidden lg:table-cell">
                          {new Date(app.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-bold text-green-700 group-hover:text-green-900 transition-colors">Open →</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : activeApp ? (
        /* ── Active form ── */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <ApplicationFormBody
            app={activeApp}
            template={template ?? null}
            onSaved={handleSaved}
            onSubmitted={handleSubmitted}
            onDocUploaded={handleDocUploaded}
            onDocDeleted={handleDocDeleted}
            onClose={() => setActiveAppId(null)}
          />
        </div>
      ) : null}

    </BranchLayout>
  );
}