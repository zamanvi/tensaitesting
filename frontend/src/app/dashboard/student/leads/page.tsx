'use client';
import StudentLayout from '@/components/shared/StudentLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/context/LanguageContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUiStore } from '@/store/uiStore';
import { Application, AppDoc, FormTemplateData } from '@/components/applications/ApplicationFormShared';
import ApplicationFormBody from '@/components/applications/ApplicationFormBody';
import ApplicationStarter from '@/components/applications/ApplicationStarter';

const STATUS_CLS: Record<string, { dot: string; badge: string }> = {
  draft:       { dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-500' },
  submitted:   { dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700' },
  pool:        { dot: 'bg-slate-500',   badge: 'bg-slate-100 text-slate-600' },
  selected:    { dot: 'bg-indigo-500',  badge: 'bg-indigo-100 text-indigo-700' },
  accepted:    { dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700' },
  processing:  { dot: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700' },
  complete:    { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  incomplete:  { dot: 'bg-orange-500',  badge: 'bg-orange-100 text-orange-700' },
  rejected:    { dot: 'bg-rose-500',    badge: 'bg-rose-100 text-rose-600' },
};

export default function StudentApplicationPage() {
  const { t } = useLang();
  const sl = t.studentLeads;
  const { user } = useAuthStore();
  const router   = useRouter();
  const qc       = useQueryClient();

  const isStudent = user?.gateway_type === 'student';
  useEffect(() => {
    if (user && !isStudent) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isStudent, router]);

  const { appTab: tab, setAppTab: setTab } = useUiStore();
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const queryKey = ['student-applications'];

  const { data: appsData, isLoading } = useQuery<{ data: Application[] }>({
    queryKey,
    queryFn: () => api.get('/applications').then(r => r.data),
    enabled: !!isStudent,
  });

  const apps        = appsData?.data ?? [];
  const selectedApp = apps.find(a => a.id === selectedAppId) ?? null;

  const { data: template, isLoading: templateLoading } = useQuery<FormTemplateData | null>({
    queryKey: ['form-template', selectedApp?.form_template_id],
    queryFn: () => selectedApp?.form_template_id
      ? api.get(`/form-templates/${selectedApp.form_template_id}`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!selectedApp?.form_template_id,
    staleTime: 300_000,
  });

  // Reset edit mode whenever the selected app changes
  useEffect(() => { setEditMode(false); }, [selectedAppId]);

  function handleCreated(app: Application) {
    qc.invalidateQueries({ queryKey });
    qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
      ...old, data: [...(old?.data ?? []), app],
    }));
    setSelectedAppId(app.id);
    setTab('ongoing');
  }

  function updateApp(updated: Application) {
    qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a => a.id === updated.id ? { ...a, ...updated } : a),
    }));
  }

  function handleDocUploaded(doc: AppDoc, progress: number) {
    if (!selectedApp) return;
    qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === selectedApp.id
          ? { ...a, progress, documents: [...(a.documents ?? []).filter(d => d.doc_type !== doc.doc_type), doc] }
          : a
      ),
    }));
  }

  function handleDocDeleted(docId: number, progress: number) {
    if (!selectedApp) return;
    qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === selectedApp.id
          ? { ...a, progress, documents: (a.documents ?? []).filter(d => d.id !== docId) }
          : a
      ),
    }));
  }

  const deleteApp = useMutation({
    mutationFn: (id: number) => api.delete(`/applications/${id}`),
    onSuccess: (_, deletedId) => {
      const remaining = apps.filter(a => a.id !== deletedId);
      qc.setQueryData(queryKey, { data: remaining });
      qc.invalidateQueries({ queryKey });
      setConfirmDelete(false);
      setSelectedAppId(null);
    },
  });

  if (!user || !isStudent) return null;

  // ── Delete confirm dialog ─────────────────────────────────────────────────
  const deleteDialog = confirmDelete && selectedApp && (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-slate-900 text-center mb-1">{sl.deleteTitle}</h2>
        <p className="text-xs text-slate-500 text-center mb-5 leading-relaxed">{sl.deleteDesc}</p>
        <div className="flex gap-2.5">
          <button onClick={() => setConfirmDelete(false)}
            className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            {sl.cancelEdit}
          </button>
          <button onClick={() => deleteApp.mutate(selectedApp.id)} disabled={deleteApp.isPending}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
            {deleteApp.isPending && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {deleteApp.isPending ? sl.deleting : sl.deleteBtn}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Non-draft detail cards ────────────────────────────────────────────────
  function renderDetail(app: Application) {
    const steps = [sl.stepSubmitted, sl.stepUnderReview, sl.stepDecision];
    const backBtn = (
      <button
        onClick={() => setSelectedAppId(null)}
        className="md:hidden mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {sl.backToList}
      </button>
    );

    if (app.status === 'submitted') {
      const activeStep = 1;
      return (
        <div>
          {backBtn}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-amber-100 uppercase tracking-wider mb-1">{sl.underReview}</p>
                  <p className="text-base font-black text-white truncate">{app.student_name}</p>
                  <p className="text-sm text-amber-100 truncate">{app.form_template?.country} · {app.form_template?.name}</p>
                  <p className="font-mono text-xs text-amber-200 mt-1 truncate">{app.application_code}</p>
                </div>
                <button
                  onClick={() => setEditMode(true)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-colors mt-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {sl.editBtn}
                </button>
              </div>
            </div>
            <div className="px-6 sm:px-10 py-8">
              <div className="relative">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-100" />
                <div className="absolute top-4 left-4 h-0.5 bg-amber-400"
                  style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }} />
                <div className="relative flex justify-between">
                  {steps.map((step, i) => {
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
              <p className="text-xs text-slate-400 text-center mt-8">{sl.reviewMsg}</p>
            </div>
          </div>
        </div>
      );
    }

    if (app.status === 'accepted') {
      return (
        <div>
          {backBtn}
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-7 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-white">{sl.congratulations}</h3>
              <p className="text-green-100 text-sm mt-1">{sl.applicationSelected}</p>
              <p className="font-mono text-xs text-green-200 mt-2">{app.application_code}</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm font-bold text-slate-800 mb-0.5">{app.form_template?.country} — {app.form_template?.name}</p>
              <div className="mt-5 bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-xs font-bold text-green-800 uppercase tracking-wider mb-3">{sl.contactAdmission}</p>
                {template?.admission_manager_name ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">{sl.admissionManagerLabel}</p>
                        <p className="text-sm font-bold text-slate-800">{template.admission_manager_name}</p>
                      </div>
                    </div>
                    {template.admission_manager_phone && (
                      <a href={`tel:${template.admission_manager_phone}`} className="flex items-center gap-3 hover:bg-green-100 rounded-lg px-1 py-1 -mx-1 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <div><p className="text-[10px] text-slate-400">{sl.phoneLabel}</p><p className="text-sm font-bold text-green-700">{template.admission_manager_phone}</p></div>
                      </a>
                    )}
                    {template.admission_manager_whatsapp && (
                      <a href={`https://wa.me/${template.admission_manager_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:bg-green-100 rounded-lg px-1 py-1 -mx-1 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-green-700" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </div>
                        <div><p className="text-[10px] text-slate-400">{sl.whatsappLabel}</p><p className="text-sm font-bold text-green-700">{template.admission_manager_whatsapp}</p></div>
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">{sl.contactDetailsLater}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Pool / processing statuses
    const processingStatuses: Record<string, { icon: string; headerCls: string; titleKey: keyof typeof sl; hintKey: keyof typeof sl }> = {
      pool:        { icon: '🔍', headerCls: 'from-slate-500 to-slate-600',   titleKey: 'statusPool',               hintKey: 'poolHint' },
      selected:    { icon: '👁️',  headerCls: 'from-indigo-500 to-indigo-600', titleKey: 'statusInstitutionSelected', hintKey: 'institutionSelectedHint' },
      accepted:    { icon: '✅', headerCls: 'from-amber-500 to-amber-600',   titleKey: 'statusAccepted',           hintKey: 'acceptedHint' },
      processing:  { icon: '🔄', headerCls: 'from-blue-600 to-blue-700',     titleKey: 'statusProcessing',         hintKey: 'processingHint' },
      complete:    { icon: '🎓', headerCls: 'from-emerald-600 to-green-600', titleKey: 'statusComplete',           hintKey: 'completeHint' },
      incomplete:  { icon: '⚠️', headerCls: 'from-orange-500 to-orange-600', titleKey: 'statusIncomplete',         hintKey: 'incompleteHint' },
    };

    if (processingStatuses[app.status]) {
      const s = processingStatuses[app.status];
      return (
        <div>
          {backBtn}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className={`bg-gradient-to-r ${s.headerCls} px-6 py-6 text-center`}>
              <div className="text-4xl mb-3">{s.icon}</div>
              <h3 className="text-base font-black text-white">{sl[s.titleKey] as string}</h3>
              <p className="text-white/80 text-xs mt-1">{app.form_template?.country} · {app.form_template?.name}</p>
              <p className="font-mono text-[10px] text-white/60 mt-1">{app.application_code}</p>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
                <span className="text-base shrink-0">ℹ️</span>
                <p className="text-sm text-amber-800 leading-relaxed">{sl[s.hintKey] as string}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Rejected / not selected
    return (
      <div>
        {backBtn}
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-7 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-white">{sl.notSelected}</h3>
            <p className="text-rose-100 text-sm mt-1">{app.form_template?.country} — {app.form_template?.name}</p>
          </div>
          <div className="px-6 py-6">
            <p className="text-sm text-slate-600 leading-relaxed text-center">{sl.rejectedHint}</p>
            <p className="font-mono text-xs text-slate-400 mt-4 text-center">{app.application_code}</p>
          </div>
        </div>
      </div>
    );
  }

  const statusLabel = (status: string) => {
    if (status === 'draft')       return sl.statusDraft;
    if (status === 'submitted')   return sl.statusSubmitted;
    if (status === 'pool')        return sl.statusPool;
    if (status === 'selected')    return sl.statusInstitutionSelected;
    if (status === 'accepted')    return sl.statusAccepted;
    if (status === 'processing')  return sl.statusProcessing;
    if (status === 'complete')    return sl.statusComplete;
    if (status === 'incomplete')  return sl.statusIncomplete;
    if (status === 'rejected')    return sl.statusNotSelected;
    return status;
  };

  return (
    <StudentLayout title={sl.pageTitle}>
      {deleteDialog}

      {/* ── Tab 1: Ongoing Applications ──────────────────────────────────────── */}
      {tab === 'ongoing' && (
        isLoading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <span className="w-7 h-7 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
            <p className="text-xs text-slate-400">{t.common.loading}</p>
          </div>
        ) : apps.length > 0 ? (
          <div className="flex flex-col md:flex-row gap-4 md:gap-5 items-start">

            {/* ── App list (hidden on mobile when detail open) ── */}
            <aside className={`w-full md:w-72 shrink-0 ${selectedApp ? 'hidden md:block' : 'block'}`}>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{sl.yourApplications}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{apps.length}</span>
                </div>

                {/* App cards */}
                <div className="divide-y divide-slate-50">
                  {apps.map(app => {
                    const sc = STATUS_CLS[app.status] ?? STATUS_CLS.draft;
                    const isSelected = selectedApp?.id === app.id;
                    return (
                      <button key={app.id} onClick={() => setSelectedAppId(app.id)}
                        className={`w-full text-left px-4 py-4 transition-colors border-l-2 group ${
                          isSelected
                            ? 'border-l-green-600 bg-green-50/40'
                            : 'border-l-transparent hover:bg-slate-50/70'
                        }`}
                      >
                        {/* Badge row */}
                        <div className="flex items-center justify-between mb-2.5">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sc.dot}`} />
                            {statusLabel(app.status)}
                          </span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                          )}
                        </div>

                        {/* Name + country */}
                        <p className="text-sm font-bold text-slate-800 leading-snug truncate mb-0.5">
                          {app.student_name || <span className="text-slate-400 italic">—</span>}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{app.form_template?.country ?? '—'}</p>
                        <p className="text-[11px] text-slate-400 truncate mb-3">{app.form_template?.name}</p>

                        {/* Progress bar */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-slate-400 font-medium">{sl.progressLabel}</span>
                          <span className={`text-[10px] font-black tabular-nums ${
                            app.progress >= 80 ? 'text-emerald-600' :
                            app.progress >= 50 ? 'text-amber-600' : 'text-rose-500'
                          }`}>{app.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${
                            app.progress >= 80 ? 'bg-emerald-500' :
                            app.progress >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                          }`} style={{ width: `${app.progress}%` }} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Delete draft button */}
                {selectedApp?.status === 'draft' && (
                  <div className="px-4 py-3 border-t border-slate-100">
                    <button onClick={() => setConfirmDelete(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors border border-rose-100">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {sl.deleteDraft}
                    </button>
                  </div>
                )}
              </div>
            </aside>

            {/* ── Detail panel (hidden on mobile when nothing selected) ── */}
            <div className={`flex-1 min-w-0 ${!selectedApp ? 'hidden md:flex md:items-center md:justify-center' : 'block'}`}>
              {/* Desktop empty state */}
              {!selectedApp && (
                <div className="w-full flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mb-5">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-slate-500 mb-1">{sl.noAppSelected}</p>
                  <p className="text-xs text-slate-400">{sl.pickFromList}</p>
                </div>
              )}

              {/* Draft form — also shown when editing a submitted app */}
              {selectedApp && (selectedApp.status === 'draft' || editMode) && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {editMode && selectedApp.status !== 'draft' && (
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-amber-50">
                      <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <p className="text-xs font-semibold text-amber-700 flex-1">{sl.editingSubmitted}</p>
                      <button onClick={() => setEditMode(false)} className="text-xs text-amber-600 hover:text-amber-800 font-bold">{sl.cancelEdit}</button>
                    </div>
                  )}
                  <ApplicationFormBody
                    app={selectedApp}
                    template={template ?? null}
                    templateLoading={templateLoading}
                    onSaved={updateApp}
                    onSubmitted={updated => { updateApp(updated); setEditMode(false); }}
                    onDocUploaded={handleDocUploaded}
                    onDocDeleted={handleDocDeleted}
                    onClose={() => { setEditMode(false); if (selectedApp.status === 'draft') setSelectedAppId(null); }}
                    hideSubmit={editMode && selectedApp.status !== 'draft'}
                  />
                </div>
              )}

              {/* Submitted / accepted / rejected cards */}
              {selectedApp && selectedApp.status !== 'draft' && !editMode && renderDetail(selectedApp)}
            </div>
          </div>

        ) : (
          /* Empty state — no apps at all */
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-20 h-20 rounded-3xl bg-green-50 border border-green-100 flex items-center justify-center mb-6 shadow-sm shadow-green-100">
              <svg className="w-9 h-9 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">{sl.noAppsYet}</h3>
            <p className="text-sm text-slate-400 mb-8 max-w-xs leading-relaxed">{sl.noAppsYetDesc}</p>
            <button
              onClick={() => setTab('new')}
              className="px-7 py-3 bg-green-700 hover:bg-green-600 text-white text-sm font-bold rounded-2xl transition-colors shadow-md shadow-green-700/20"
            >
              {sl.newApplicationBtn}
            </button>
          </div>
        )
      )}

      {/* ── Tab 2: New Application ────────────────────────────────────────────── */}
      {tab === 'new' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-green-700 to-emerald-600 px-6 py-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-black text-white leading-tight">{sl.startTitle}</h2>
              <p className="text-green-100 text-sm mt-0.5">{sl.startDesc}</p>
            </div>
          </div>
          <ApplicationStarter
            role="student"
            onCreated={handleCreated}
            onCancel={apps.length > 0 ? () => setTab('ongoing') : undefined}
            queryKey="student-applications"
          />
        </div>
      )}

    </StudentLayout>
  );
}
