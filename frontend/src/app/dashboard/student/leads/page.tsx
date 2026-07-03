'use client';
import StudentLayout from '@/components/shared/StudentLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Application, AppDoc, FormTemplateData } from '@/components/applications/ApplicationFormShared';
import ApplicationFormBody from '@/components/applications/ApplicationFormBody';
import ApplicationStarter from '@/components/applications/ApplicationStarter';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Draft',        cls: 'bg-slate-100 text-slate-500' },
  submitted: { label: 'Submitted',    cls: 'bg-amber-100 text-amber-700' },
  accepted:  { label: 'Selected',     cls: 'bg-emerald-100 text-emerald-700' },
  rejected:  { label: 'Not Selected', cls: 'bg-rose-100 text-rose-600' },
};

const STEPS = ['Submitted', 'Under Review', 'Decision'];

export default function StudentApplicationPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const qc       = useQueryClient();

  const isStudent = user?.gateway_type === 'student';
  useEffect(() => {
    if (user && !isStudent) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isStudent, router]);

  const [view, setView] = useState<'start' | 'form' | 'detail'>('start');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const queryKey = ['student-application'];

  const { data: appsData, isLoading } = useQuery<{ data: Application[] }>({
    queryKey,
    queryFn: () => api.get('/applications').then(r => r.data),
    enabled: !!isStudent,
  });

  const myApp = appsData?.data?.[0] ?? null;

  const { data: template, isLoading: templateLoading } = useQuery<FormTemplateData | null>({
    queryKey: ['form-template', myApp?.form_template_id],
    queryFn: () => myApp?.form_template_id
      ? api.get(`/form-templates/${myApp.form_template_id}`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!myApp?.form_template_id,
    staleTime: 300_000,
  });

  // Auto-set view based on app state
  useEffect(() => {
    if (!myApp) { setView('start'); return; }
    if (myApp.status === 'draft') setView('form');
    else setView('detail');
  }, [myApp?.id, myApp?.status]);

  function handleCreated(app: Application) {
    qc.setQueryData(queryKey, { data: [app] });
    qc.invalidateQueries({ queryKey });
    setView('form');
  }

  function updateApp(updated: Application) {
    qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a => a.id === updated.id ? { ...a, ...updated } : a),
    }));
  }

  function handleDocUploaded(doc: AppDoc, progress: number) {
    qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === myApp?.id ? { ...a, progress, documents: [...(a.documents ?? []).filter(d => d.doc_type !== doc.doc_type), doc] } : a
      ),
    }));
  }

  const deleteApp = useMutation({
    mutationFn: (id: number) => api.delete(`/applications/${id}`),
    onSuccess: () => {
      qc.setQueryData(queryKey, { data: [] });
      qc.invalidateQueries({ queryKey });
      setView('start');
      setConfirmDelete(false);
    },
  });

  function handleDocDeleted(docId: number, progress: number) {
    qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === myApp?.id ? { ...a, progress, documents: (a.documents ?? []).filter(d => d.id !== docId) } : a
      ),
    }));
  }

  if (!user || !isStudent) return null;

  // ── Delete confirm dialog ────────────────────────────────────────────────────
  const deleteDialog = confirmDelete && myApp && (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-slate-900 text-center mb-1">Delete this application?</h2>
        <p className="text-xs text-slate-500 text-center mb-5 leading-relaxed">
          This will permanently delete your draft application and all uploaded documents. This cannot be undone.
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={() => setConfirmDelete(false)}
            className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteApp.mutate(myApp.id)}
            disabled={deleteApp.isPending}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {deleteApp.isPending
              ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : null}
            {deleteApp.isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Sidebar JSX ─────────────────────────────────────────────────────────────
  const sidebarJsx = (
    <aside className="w-full md:w-72 shrink-0">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-3">
          <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Applications</span>
        </div>

        {isLoading ? (
          <div className="py-8 flex justify-center">
            <span className="w-5 h-5 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : myApp ? (
          <>
            <button
              onClick={() => setView(myApp.status === 'draft' ? 'form' : 'detail')}
              className={`w-full text-left px-4 py-4 hover:bg-green-50/50 transition-colors border-l-2 ${
                view !== 'start' ? 'border-l-green-600 bg-green-50/30' : 'border-l-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-xs font-bold text-slate-800 leading-snug">{myApp.student_name}</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[myApp.status]?.cls}`}>
                  {STATUS_BADGE[myApp.status]?.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{myApp.form_template?.country ?? '—'}</p>
              <p className="text-[10px] text-slate-400 truncate">{myApp.form_template?.name}</p>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400">Progress</span>
                  <span className={`text-[10px] font-black tabular-nums ${myApp.progress >= 80 ? 'text-emerald-600' : myApp.progress >= 50 ? 'text-amber-600' : 'text-rose-500'}`}>
                    {myApp.progress}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${myApp.progress >= 80 ? 'bg-emerald-500' : myApp.progress >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                    style={{ width: `${myApp.progress}%` }}
                  />
                </div>
              </div>
            </button>
            {myApp.status === 'draft' && (
              <div className="px-4 py-3 border-t border-slate-100">
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors border border-rose-100"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Application
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="px-4 py-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-slate-400">No applications yet</p>
            <p className="text-[11px] text-slate-300 mt-0.5">Start one on the right</p>
          </div>
        )}
      </div>
    </aside>
  );

  // ── Detail view ──────────────────────────────────────────────────────────────
  const detailJsx = myApp && (() => {
    if (myApp.status === 'submitted') {
      const activeStep = 1;
      return (
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-5">
              <p className="text-xs font-bold text-amber-100 uppercase tracking-wider mb-1">Under Review</p>
              <p className="text-base font-black text-white">{myApp.student_name}</p>
              <p className="text-sm text-amber-100">{myApp.form_template?.country} · {myApp.form_template?.name}</p>
              <p className="font-mono text-xs text-amber-200 mt-1">{myApp.application_code}</p>
            </div>
            <div className="px-8 py-8">
              <div className="relative">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-100" />
                <div className="absolute top-4 left-4 h-0.5 bg-amber-400" style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }} />
                <div className="relative flex justify-between">
                  {STEPS.map((step, i) => {
                    const done = i < activeStep;
                    const cur  = i === activeStep;
                    return (
                      <div key={step} className="flex flex-col items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 ${
                          done ? 'bg-amber-400 border-amber-400' : cur ? 'bg-white border-amber-400 shadow-sm' : 'bg-white border-slate-200'
                        }`}>
                          {done
                            ? <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            : <div className={`w-2 h-2 rounded-full ${cur ? 'bg-amber-400 animate-pulse' : 'bg-slate-200'}`} />}
                        </div>
                        <p className={`text-xs font-bold ${cur ? 'text-amber-600' : done ? 'text-slate-500' : 'text-slate-300'}`}>{step}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center mt-8">
                Your application is under review. You will be notified once a decision is made.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (myApp.status === 'accepted') {
      return (
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-7 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-white">Congratulations!</h3>
              <p className="text-green-100 text-sm mt-1">Your application has been selected</p>
              <p className="font-mono text-xs text-green-200 mt-2">{myApp.application_code}</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm font-bold text-slate-800 mb-0.5">{myApp.form_template?.country} — {myApp.form_template?.name}</p>
              <div className="mt-5 bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-xs font-bold text-green-800 uppercase tracking-wider mb-3">Contact Admission Manager</p>
                {template?.admission_manager_name ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Admission Manager</p>
                        <p className="text-sm font-bold text-slate-800">{template.admission_manager_name}</p>
                      </div>
                    </div>
                    {template.admission_manager_phone && (
                      <a href={`tel:${template.admission_manager_phone}`} className="flex items-center gap-3 hover:bg-green-100 rounded-lg px-1 py-1 -mx-1 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <div><p className="text-[10px] text-slate-400">Phone</p><p className="text-sm font-bold text-green-700">{template.admission_manager_phone}</p></div>
                      </a>
                    )}
                    {template.admission_manager_whatsapp && (
                      <a href={`https://wa.me/${template.admission_manager_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:bg-green-100 rounded-lg px-1 py-1 -mx-1 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-green-700" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </div>
                        <div><p className="text-[10px] text-slate-400">WhatsApp</p><p className="text-sm font-bold text-green-700">{template.admission_manager_whatsapp}</p></div>
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Contact details will be provided by your branch or agency shortly.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-xl border border-rose-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-7 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-white">Application Not Selected</h3>
            <p className="text-rose-100 text-sm mt-1">{myApp.form_template?.country} — {myApp.form_template?.name}</p>
          </div>
          <div className="px-6 py-6 text-center">
            <p className="text-sm text-slate-600 leading-relaxed">
              We are sorry — your application was not selected at this time. Please contact your branch or agency for guidance on next steps.
            </p>
            <p className="font-mono text-xs text-slate-400 mt-4">{myApp.application_code}</p>
          </div>
        </div>
      </div>
    );
  })();

  return (
    <StudentLayout title="My Application">
      {deleteDialog}
      <div className="flex flex-col md:flex-row gap-5 items-start">
        {sidebarJsx}
        {view === 'start' && (
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-green-700 to-emerald-600 px-8 py-8 text-center">
                <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <h2 className="text-lg font-black text-white mb-1.5">Start Your Application</h2>
                <p className="text-green-100 text-sm leading-relaxed max-w-xs mx-auto">
                  Choose your destination and program — you can save as draft and continue anytime.
                </p>
              </div>
              <ApplicationStarter role="student" onCreated={handleCreated} queryKey="student-application" />
            </div>
          </div>
        )}
        {view === 'form' && myApp && (
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <ApplicationFormBody
                app={myApp} template={template ?? null} templateLoading={templateLoading}
                onSaved={updateApp}
                onSubmitted={updated => { updateApp(updated); setView('detail'); }}
                onDocUploaded={handleDocUploaded} onDocDeleted={handleDocDeleted}
              />
            </div>
          </div>
        )}
        {view === 'detail' && detailJsx}
      </div>
    </StudentLayout>
  );
}
