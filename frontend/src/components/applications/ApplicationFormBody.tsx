'use client';
import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import {
  Application, AppDoc, FormTemplateData,
  DynamicField, InlineDoc, ProgressBar,
  isFieldVisible, colSpan, EDU_LABELS,
  inp, lbl,
} from './ApplicationFormShared';

interface Props {
  app: Application;
  template: FormTemplateData | null;
  templateLoading?: boolean;
  onSaved: (app: Application) => void;
  onSubmitted: (app: Application) => void;
  onDocUploaded: (doc: AppDoc, progress: number) => void;
  onDocDeleted: (docId: number, progress: number) => void;
  onClose?: () => void;
  hideSubmit?: boolean;
}

// Accessible confirm dialog with focus trap + Escape key
function ConfirmDialog({ message, detail, confirmLabel, onConfirm, onCancel, danger }: {
  message: string; detail?: string; confirmLabel: string;
  onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <h2 id="dlg-title" className="text-sm font-bold text-slate-900 mb-1">{message}</h2>
        {detail && <p className="text-xs text-slate-500 mb-5 leading-relaxed">{detail}</p>}
        <div className="flex gap-2.5">
          <button ref={cancelRef} onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400/40">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all focus:outline-none focus:ring-2 ${danger ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400/60' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500/60'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationFormBody({
  app, template, templateLoading = true, onSaved, onSubmitted, onDocUploaded, onDocDeleted, onClose, hideSubmit = false,
}: Props) {
  const toFormData = (src: Application) =>
    Object.fromEntries(Object.entries(src.form_data ?? {}).map(([k, v]) => [k, v == null ? '' : String(v)]));
  const toStudentInfo = (src: Application) => ({
    student_name:      src.student_name ?? '',
    student_email:     src.student_email ?? '',
    student_phone:     src.student_phone ?? '',
    whatsapp_no:       src.whatsapp_no ?? '',
    permanent_address: src.permanent_address ?? '',
  });

  const [formData,     setFormData]     = useState<Record<string, string>>(() => toFormData(app));
  const [studentInfo,  setStudentInfo]  = useState(() => toStudentInfo(app));
  const [saving,       setSaving]       = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [saveMsg,      setSaveMsg]      = useState('');
  const [err,          setErr]          = useState('');
  const [liveProgress, setLiveProgress] = useState(app.progress);
  const [hasChanges,   setHasChanges]   = useState(false);
  const [confirm,      setConfirm]      = useState<'submit' | 'close' | null>(null);

  // Reset when a different application is loaded
  const prevAppId = useRef(app.id);
  useEffect(() => {
    if (app.id !== prevAppId.current) {
      prevAppId.current = app.id;
      setFormData(toFormData(app));
      setStudentInfo(toStudentInfo(app));
      setHasChanges(false);
      setSaveMsg('');
      setErr('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.id]);

  useEffect(() => { setLiveProgress(app.progress); }, [app.progress]);

  const draftKey = `app_draft_${app.id}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const { formData: fd, studentInfo: si } = JSON.parse(saved);
        if (fd) { setFormData(fd); setHasChanges(true); }
        if (si) { setStudentInfo(si); setHasChanges(true); }
      }
    } catch (e) { console.error('Draft restore error:', e); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.id]);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hasChanges) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify({ formData, studentInfo })); } catch { /* ignore */ }
    }, 3000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, studentInfo]);

  const progress   = liveProgress;
  const isEditable = !['accepted', 'rejected'].includes(app.status);
  const canSubmit  = progress >= 50 && isEditable;
  const docs       = app.documents ?? [];

  function set(key: string, val: string) {
    setFormData(p => ({ ...p, [key]: val }));
    setHasChanges(true);
  }

  async function handleSave() {
    setSaving(true); setErr('');
    try {
      const res = await api.patch(`/applications/${app.id}`, { form_data: formData, ...studentInfo, student_name: studentInfo.student_name.trim() || null });
      onSaved(res.data);
      if (res.data?.progress !== undefined) setLiveProgress(res.data.progress);
      setHasChanges(false);
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      setSaveMsg('Saved successfully'); setTimeout(() => setSaveMsg(''), 3000);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string }; status?: number } };
      const errMsg = ax.response?.status === 422 ? 'Validation error — check your inputs.'
        : ax.response?.data?.message ?? 'Save failed — please try again.';
      setErr(errMsg); setTimeout(() => setErr(''), 6000);
    }
    setSaving(false);
  }

  async function doSubmit() {
    setConfirm(null);
    setSubmitting(true); setErr('');
    try {
      const res = await api.post(`/applications/${app.id}/submit`);
      onSubmitted(res.data);
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      setSaveMsg('Submitted successfully');
      setTimeout(() => setSaveMsg(''), 4000);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } } };
      setErr(ax.response?.data?.message ?? 'Submit failed — please try again.');
      setTimeout(() => setErr(''), 6000);
    }
    setSubmitting(false);
  }

  function handleClose() {
    if (hasChanges) { setConfirm('close'); return; }
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    onClose?.();
  }

  function doClose() {
    setConfirm(null);
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    onClose?.();
  }

  return (
    <div>
      {/* ── Confirm dialogs ── */}
      {confirm === 'submit' && (
        <ConfirmDialog
          message="Submit this application?"
          detail="After submitting, the form will be locked for review. You can still resubmit if needed."
          confirmLabel="Submit"
          onConfirm={doSubmit}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'close' && (
        <ConfirmDialog
          message="You have unsaved changes"
          detail="Going back will discard your current changes. Save first to keep them."
          confirmLabel="Discard & go back"
          danger
          onConfirm={doClose}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {onClose && (
              <button onClick={handleClose} aria-label="Go back to applications list"
                className="w-11 h-11 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-green-500/40">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-black text-slate-900 truncate" title={app.student_name}>{app.student_name}</p>
              <p className="text-xs text-slate-400 truncate">{app.application_code} · {app.form_template?.country ?? ''}</p>
            </div>
            {app.status === 'draft'     && <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full flex-shrink-0">Draft</span>}
            {app.status === 'submitted' && <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full flex-shrink-0">Submitted</span>}
            {app.status === 'accepted'  && <span className="text-xs font-bold px-2.5 py-1 bg-green-100 text-green-700 rounded-full flex-shrink-0">Accepted</span>}
            {app.status === 'rejected'  && <span className="text-xs font-bold px-2.5 py-1 bg-rose-100 text-rose-600 rounded-full flex-shrink-0">Rejected</span>}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {isEditable && (
              <button onClick={handleSave} disabled={saving || submitting} aria-label="Save progress"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/40">
                {saving
                  ? <span className="w-3.5 h-3.5 border-2 border-slate-400/40 border-t-slate-600 rounded-full animate-spin" />
                  : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>}
                <span className="hidden sm:inline">{saving ? 'Saving…' : 'Save'}</span>
              </button>
            )}
            {canSubmit && !hideSubmit && (
              <button onClick={() => setConfirm('submit')} disabled={submitting || saving} aria-label="Submit application"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 min-h-[44px] bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/60">
                {submitting
                  ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                <span className="hidden sm:inline">{submitting ? 'Submitting…' : 'Submit'}</span>
              </button>
            )}
          </div>
        </div>
        {progress === 0
          ? <p className="text-xs text-slate-400">Fill in the form below to track your progress.</p>
          : <ProgressBar value={progress} />
        }
        {saveMsg && <p aria-live="polite" className="text-xs font-semibold text-green-600 mt-1.5 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {saveMsg}
        </p>}
        {err && <p aria-live="assertive" className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {err}
        </p>}
        {hasChanges && !saving && !saveMsg && (
          <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Unsaved changes — click Save to keep your work.
          </p>
        )}
      </div>

      {/* ── Template loading / error ── */}
      {!template && templateLoading && (
        <div className="px-4 sm:px-6 py-10 space-y-4 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="bg-slate-100 rounded-xl h-24" />)}
          <p className="text-center text-xs text-slate-400">Loading form template…</p>
        </div>
      )}
      {!template && !templateLoading && (
        <div className="px-4 sm:px-6 py-10">
          <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4">
            <svg className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-rose-800">Form template unavailable</p>
              <p className="text-xs text-rose-600 mt-1">The template for this application could not be loaded. It may have been removed by an administrator. You can still view saved data above, but editing is unavailable.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Form body ── */}
      {template && (
        <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-10">

          {/* Personal Information */}
          <section className="bg-green-50/50 border border-green-100 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-green-100 bg-green-100/50">
              <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
              <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-semibold text-slate-800">Personal Information</span>
            </div>
            <div className="px-4 sm:px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </span>
                    <input className={`${inp} pl-10 ${!isEditable ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                      value={studentInfo.student_name} readOnly={!isEditable}
                      onChange={isEditable ? e => { setStudentInfo(p => ({ ...p, student_name: e.target.value })); setHasChanges(true); } : undefined} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </span>
                    <input className={`${inp} pl-10 ${!isEditable ? 'bg-slate-50 cursor-not-allowed' : ''}`} type="text"
                      value={studentInfo.student_email} readOnly={!isEditable}
                      onChange={isEditable ? e => { setStudentInfo(p => ({ ...p, student_email: e.target.value })); setHasChanges(true); } : undefined} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Contact Number <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </span>
                    <input className={`${inp} pl-10 ${!isEditable ? 'bg-slate-50 cursor-not-allowed' : ''}`} type="tel"
                      aria-required="true" value={studentInfo.student_phone} readOnly={!isEditable}
                      onChange={isEditable ? e => { setStudentInfo(p => ({ ...p, student_phone: e.target.value })); setHasChanges(true); } : undefined} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>WhatsApp Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </span>
                    <input className={`${inp} pl-10 ${!isEditable ? 'bg-slate-50 cursor-not-allowed' : ''}`} type="tel"
                      value={studentInfo.whatsapp_no} readOnly={!isEditable}
                      onChange={isEditable ? e => { setStudentInfo(p => ({ ...p, whatsapp_no: e.target.value })); setHasChanges(true); } : undefined} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Date of Birth</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </span>
                    <input className={`${inp} pl-10 ${!isEditable ? 'bg-slate-50 cursor-not-allowed' : ''}`} type="date"
                      value={formData.birth_date ?? ''} readOnly={!isEditable}
                      onChange={isEditable ? e => set('birth_date', e.target.value) : undefined} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Passport Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                    </span>
                    <input className={`${inp} pl-10 ${!isEditable ? 'bg-slate-50 cursor-not-allowed' : ''}`} placeholder="e.g. AB1234567"
                      value={formData.passport_no ?? ''} readOnly={!isEditable}
                      onChange={isEditable ? e => set('passport_no', e.target.value) : undefined} />
                  </div>
                </div>
                {template.intake_options?.length > 0 && (
                  <div>
                    <label className={lbl}>Select Intake</label>
                    <select className={`${inp} ${!isEditable ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                      value={formData.intake ?? ''} disabled={!isEditable}
                      onChange={e => set('intake', e.target.value)}>
                      <option value="">Choose intake…</option>
                      {template.intake_options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className={lbl}>Permanent Address</label>
                  <textarea className={`${inp} resize-none ${!isEditable ? 'bg-slate-50 cursor-not-allowed' : ''}`} rows={2}
                    placeholder="House, Road, Area, City, Postcode" value={studentInfo.permanent_address}
                    readOnly={!isEditable}
                    onChange={isEditable ? e => { setStudentInfo(p => ({ ...p, permanent_address: e.target.value })); setHasChanges(true); } : undefined} />
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Dynamic template groups */}
          {template.groups.filter(g => g.label !== 'Application Form Info').filter(g =>
            g.boxes.some(b => b.fields.some(f => isFieldVisible(f, formData)))
          ).map((group) => (
            <section key={group.id} className="bg-green-50/50 border border-green-100 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-green-100 bg-green-100/50">
                <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
                <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <span className="text-sm font-semibold text-slate-800">{group.label}</span>
                  {group.hint && <p className="text-xs text-slate-400 mt-0.5">{group.hint}</p>}
                </div>
              </div>
              <div className="px-4 sm:px-6 py-5 space-y-6">
                {group.boxes.map((box, bi) => {
                  const visibleFields = box.fields.filter(f => isFieldVisible(f, formData));
                  if (visibleFields.length === 0) return null;
                  return (
                    <div key={box.id} className={bi > 0 ? 'pt-4 border-t border-slate-100' : ''}>
                      {box.name && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{box.name}</p>}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        {visibleFields.map(field => (
                          <div key={field.field_key} className={colSpan(field.box_size)}>
                            <DynamicField
                              field={field} appId={app.id}
                              value={formData[field.field_key] ?? ''}
                              existingDoc={docs.find(d => d.field_key === field.field_key || d.doc_type === field.field_key)}
                              onDocUploaded={onDocUploaded} onDocDeleted={onDocDeleted}
                              onChange={val => set(field.field_key, val)}
                            />
                          </div>
                        ))}
                      </div>
                      {box.requires_document && box.doc_key && isEditable && (
                        <InlineDoc
                          fieldKey={box.doc_key}
                          fieldLabel={box.doc_label || box.name || 'Document'}
                          appId={app.id}
                          mandatory={box.document_required}
                          existingDoc={docs.find(d => d.field_key === box.doc_key || d.doc_type === box.doc_key)}
                          onUploaded={onDocUploaded}
                          onDeleted={onDocDeleted}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Education Certificates */}
          {template.educations?.length > 0 && (
            <section className="bg-green-50/50 border border-green-100 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-green-100 bg-green-100/50">
                <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
                <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                <span className="text-sm font-semibold text-slate-800">Education Certificates</span>
              </div>
              <div className="px-4 sm:px-6 py-5 space-y-3">
                {(template.educations ?? []).filter(e => e.requirement !== 'none').map((edu) => {
                  const label     = EDU_LABELS[edu.level] ?? edu.level;
                  const mandatory = edu.requirement === 'mandatory';
                  const docKey    = `edu_${edu.level}`;
                  const existingDoc = docs.find(d => d.field_key === docKey || d.doc_type === docKey);
                  return (
                    <div key={edu.level} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2.5 px-4 py-3 bg-green-100/50 border-b border-green-100">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${mandatory ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                          {mandatory ? 'Required' : 'Optional'}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">{label}</span>
                      </div>
                      <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className={lbl}>Institution / Board</label>
                          <input className={`${inp} ${!isEditable ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                            placeholder="e.g. Dhaka Education Board"
                            value={formData[`${docKey}_institution`] ?? ''}
                            onChange={isEditable ? e => set(`${docKey}_institution`, e.target.value) : undefined}
                            readOnly={!isEditable} />
                        </div>
                        <div>
                          <label className={lbl}>GPA / Grade</label>
                          <input className={`${inp} ${!isEditable ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                            placeholder="e.g. 5.00 / A+"
                            value={formData[`${docKey}_gpa`] ?? ''}
                            onChange={isEditable ? e => set(`${docKey}_gpa`, e.target.value) : undefined}
                            readOnly={!isEditable} />
                        </div>
                        <div>
                          <label className={lbl}>Passing Year</label>
                          <input className={`${inp} ${!isEditable ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                            placeholder="e.g. 2022"
                            value={formData[`${docKey}_year`] ?? ''}
                            onChange={isEditable ? e => set(`${docKey}_year`, e.target.value) : undefined}
                            readOnly={!isEditable} />
                        </div>
                      </div>
                      {isEditable && (
                        <div className="px-4 pb-4">
                          <InlineDoc fieldKey={docKey} fieldLabel={`${label} Certificate`}
                            appId={app.id} mandatory={mandatory}
                            existingDoc={existingDoc}
                            onUploaded={onDocUploaded} onDeleted={onDocDeleted} />
                        </div>
                      )}
                      {!isEditable && existingDoc && (
                        <div className="px-4 pb-4">
                          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                            <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-green-700 text-xs font-semibold truncate">{existingDoc.original_name}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Bottom actions */}
          {isEditable && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-2">
              <button onClick={handleSave} disabled={saving || submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400/40">
                {saving
                  ? <span className="w-4 h-4 border-2 border-slate-400/40 border-t-slate-700 rounded-full animate-spin" />
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>}
                {saving ? 'Saving…' : 'Save Progress'}
              </button>
              {!hideSubmit && (canSubmit ? (
                <button onClick={() => setConfirm('submit')} disabled={submitting || saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/60">
                  {submitting
                    ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                  Submit Application
                </button>
              ) : (
                <div className="flex-1 py-3.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center flex flex-col items-center justify-center gap-0.5">
                  <span className="text-xs font-semibold text-slate-400">Submit unlocks at 50% completion</span>
                  <span className="text-xs text-slate-400">You are at {progress}% — fill required fields to continue</span>
                </div>
              ))}
            </div>
          )}

          {/* Accepted / Rejected notice */}
          {!isEditable && (
            <div className={`rounded-2xl px-5 py-4 text-center ${app.status === 'accepted' ? 'bg-green-50 border border-green-200' : 'bg-rose-50 border border-rose-200'}`}>
              <div className={`flex items-center justify-center gap-2 mb-1 ${app.status === 'accepted' ? 'text-green-700' : 'text-rose-700'}`}>
                {app.status === 'accepted'
                  ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                <p className="text-sm font-bold">
                  {app.status === 'accepted' ? 'Application Accepted — congratulations!' : 'Application Rejected'}
                </p>
              </div>
              <p className="text-xs text-slate-400">This application is locked and can no longer be edited.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
