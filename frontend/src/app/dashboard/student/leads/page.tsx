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

// ── Status timeline steps ──────────────────────────────────────────────────────

const STEPS = [
  { key: 'draft',     label: 'Draft',        hint: 'Application saved' },
  { key: 'submitted', label: 'Submitted',     hint: 'Sent for review' },
  { key: 'review',    label: 'Under Review',  hint: 'Admin is reviewing' },
  { key: 'decision',  label: 'Decision',      hint: 'Awaiting outcome' },
];

function stepIndex(status: string) {
  if (status === 'draft')     return 0;
  if (status === 'submitted') return 2;
  if (status === 'accepted' || status === 'rejected') return 3;
  return 1;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function StudentApplicationPage() {
  const { user }  = useAuthStore();
  const router    = useRouter();
  const qc        = useQueryClient();
  const [editing, setEditing] = useState(false);

  const isStudent = user?.gateway_type === 'student';
  useEffect(() => {
    if (user && !isStudent) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isStudent, router]);

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

  function handleCreated(app: Application) {
    qc.setQueryData(queryKey, { data: [app] });
    qc.invalidateQueries({ queryKey });
    setEditing(true);
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

  function handleDocDeleted(docId: number, progress: number) {
    qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === myApp?.id ? { ...a, progress, documents: (a.documents ?? []).filter(d => d.id !== docId) } : a
      ),
    }));
  }

  if (!user || !isStudent) return null;

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout title="My Application">
        <div className="py-24 flex items-center justify-center">
          <span className="w-8 h-8 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  // ── FLOW STATE 1: No application yet ─────────────────────────────────────────
  if (!myApp) {
    return (
      <DashboardLayout title="My Application">
        <div className="max-w-lg mx-auto">
          {/* Hero */}
          <div className="bg-gradient-to-br from-green-700 to-emerald-600 rounded-3xl px-8 py-10 text-center mb-4 shadow-lg shadow-green-700/20">
            <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-white mb-2">Start Your Application</h2>
            <p className="text-green-100 text-sm leading-relaxed">
              Choose your destination country and program, then fill in your details. You can save as draft and come back anytime.
            </p>
          </div>

          {/* Checklist hint */}
          <div className="bg-white border border-slate-100 rounded-2xl px-5 py-4 mb-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">What you will need</p>
            <div className="space-y-2">
              {['Valid passport', 'Educational certificates', 'Passport-size photo', 'Language test results (if any)'].map(item => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />
                  <span className="text-xs text-slate-600">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Starter form */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <ApplicationStarter role="student" onCreated={handleCreated} queryKey="student-application" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── FLOW STATE 2: Draft — editing open ───────────────────────────────────────
  if (myApp.status === 'draft' && editing) {
    return (
      <DashboardLayout title="My Application">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <ApplicationFormBody
            app={myApp} template={template ?? null} templateLoading={templateLoading}
            onSaved={updated => { updateApp(updated); }}
            onSubmitted={updated => { updateApp(updated); setEditing(false); }}
            onDocUploaded={handleDocUploaded} onDocDeleted={handleDocDeleted}
            onClose={() => setEditing(false)}
          />
        </div>
      </DashboardLayout>
    );
  }

  // ── FLOW STATE 3: Draft — overview card ──────────────────────────────────────
  if (myApp.status === 'draft') {
    return (
      <DashboardLayout title="My Application">
        <div className="max-w-lg mx-auto space-y-4">

          {/* Application card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Application</span>
                  <p className="font-mono text-sm text-white font-bold mt-0.5">{myApp.application_code}</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-600 text-slate-300">Draft</span>
              </div>
              <div className="mt-4">
                <p className="text-base font-black text-white">{myApp.student_name}</p>
                <p className="text-sm text-slate-400 mt-0.5">
                  {myApp.form_template?.country ?? '—'} · {myApp.form_template?.name ?? ''}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600">Application progress</span>
                <span className={`text-xs font-black tabular-nums ${myApp.progress >= 80 ? 'text-emerald-600' : myApp.progress >= 50 ? 'text-amber-600' : 'text-rose-500'}`}>
                  {myApp.progress}%
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${myApp.progress >= 80 ? 'bg-emerald-500' : myApp.progress >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                  style={{ width: `${myApp.progress}%` }}
                />
              </div>
              {myApp.progress < 100 && (
                <p className="text-[11px] text-slate-400 mt-2">
                  {myApp.progress < 50 ? 'Keep going — fill in your details and upload your documents.' : 'Almost there — a few sections left to complete.'}
                </p>
              )}
            </div>

            <div className="px-6 pb-5">
              <button
                onClick={() => setEditing(true)}
                className="w-full py-3 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-green-700/20 focus:outline-none focus:ring-2 focus:ring-green-500/40">
                Continue Application
              </button>
            </div>
          </div>

          {/* Info note */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-700 font-medium">
              Your application is saved as a draft. Complete all sections and submit when ready — the admin team will review it.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── FLOW STATE 4: Submitted / Under Review ───────────────────────────────────
  if (myApp.status === 'submitted') {
    const activeStep = stepIndex(myApp.status);
    return (
      <DashboardLayout title="My Application">
        <div className="max-w-lg mx-auto space-y-4">

          {/* Status card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-5 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-100 mb-1">Application Ongoing</p>
              <p className="text-lg font-black">{myApp.student_name}</p>
              <p className="text-sm text-amber-100 mt-0.5">{myApp.form_template?.country} · {myApp.form_template?.name}</p>
              <p className="font-mono text-xs text-amber-200 mt-2">{myApp.application_code}</p>
            </div>

            {/* Timeline */}
            <div className="px-6 py-6">
              <div className="relative">
                {/* Track line */}
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-100" />
                <div
                  className="absolute top-4 left-4 h-0.5 bg-amber-400 transition-all duration-700"
                  style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }}
                />
                <div className="relative flex justify-between">
                  {STEPS.map((step, i) => {
                    const done   = i < activeStep;
                    const active = i === activeStep;
                    return (
                      <div key={step.key} className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all z-10 ${
                          done   ? 'bg-amber-400 border-amber-400' :
                          active ? 'bg-white border-amber-400 shadow-md shadow-amber-100' :
                                   'bg-white border-slate-200'
                        }`}>
                          {done ? (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className={`w-2 h-2 rounded-full ${active ? 'bg-amber-400 animate-pulse' : 'bg-slate-200'}`} />
                          )}
                        </div>
                        <div className="text-center">
                          <p className={`text-[10px] font-bold ${active ? 'text-amber-600' : done ? 'text-slate-500' : 'text-slate-300'}`}>{step.label}</p>
                          <p className="text-[9px] text-slate-300 mt-0.5 hidden sm:block">{step.hint}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 pb-5 border-t border-slate-50 pt-4">
              <p className="text-xs text-slate-500 text-center">
                Your application is under review. You will be notified once a decision is made.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── FLOW STATE 5: Accepted — Selected by School ───────────────────────────────
  if (myApp.status === 'accepted') {
    return (
      <DashboardLayout title="My Application">
        <div className="max-w-lg mx-auto space-y-4">

          {/* Success card */}
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-6 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-white">Congratulations!</h3>
              <p className="text-green-100 text-sm mt-1">Your application has been selected</p>
            </div>

            <div className="px-6 py-5">
              <p className="text-xs text-slate-500 mb-1">Selected for</p>
              <p className="font-bold text-slate-900">{myApp.form_template?.country} — {myApp.form_template?.name}</p>
              <p className="font-mono text-xs text-slate-400 mt-0.5">{myApp.application_code}</p>
            </div>

            {/* Admission manager contact */}
            <div className="mx-6 mb-6 bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-xs font-bold text-green-800 uppercase tracking-wider mb-3">Contact Your Admission Manager</p>

              {template?.admission_manager_name ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Admission Manager</p>
                      <p className="text-sm font-bold text-slate-800">{template.admission_manager_name}</p>
                    </div>
                  </div>

                  {template.admission_manager_phone && (
                    <a href={`tel:${template.admission_manager_phone}`}
                      className="flex items-center gap-3 hover:bg-green-100 rounded-lg p-1 -mx-1 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Phone</p>
                        <p className="text-sm font-bold text-green-700">{template.admission_manager_phone}</p>
                      </div>
                    </a>
                  )}

                  {template.admission_manager_whatsapp && (
                    <a href={`https://wa.me/${template.admission_manager_whatsapp.replace(/\D/g, '')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 hover:bg-green-100 rounded-lg p-1 -mx-1 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-green-700" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">WhatsApp</p>
                        <p className="text-sm font-bold text-green-700">{template.admission_manager_whatsapp}</p>
                      </div>
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Contact details will be provided by your branch or agency shortly.</p>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── FLOW STATE 6: Rejected ────────────────────────────────────────────────────
  return (
    <DashboardLayout title="My Application">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-6 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-white">Application Not Selected</h3>
            <p className="text-rose-100 text-sm mt-1">{myApp.form_template?.country} — {myApp.form_template?.name}</p>
          </div>
          <div className="px-6 py-5 text-center">
            <p className="text-sm text-slate-600">
              We are sorry — your application was not selected at this time. Please contact your branch or agency for guidance on next steps.
            </p>
            <p className="font-mono text-xs text-slate-400 mt-3">{myApp.application_code}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
