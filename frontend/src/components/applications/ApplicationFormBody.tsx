'use client';
import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import {
  Application, AppDoc, FormTemplateData, TemplateField,
  DynamicField, InlineDoc, SectionHead, ProgressBar,
  compressImage, isFieldVisible, colSpan,
  inp, lbl,
} from './ApplicationFormShared';

interface Props {
  app: Application;
  template: FormTemplateData | null;
  onSaved: (app: Application) => void;
  onSubmitted: (app: Application) => void;
  onDocUploaded: (doc: AppDoc, progress: number) => void;
  onDocDeleted: (docId: number, progress: number) => void;
  onClose?: () => void;
}


export default function ApplicationFormBody({
  app, template, onSaved, onSubmitted, onDocUploaded, onDocDeleted, onClose,
}: Props) {
  const [formData,   setFormData]   = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(app.form_data ?? {}).map(([k, v]) => [k, v == null ? '' : String(v)]))
  );
  const [studentInfo, setStudentInfo] = useState({
    student_email:     app.student_email ?? '',
    student_phone:     app.student_phone ?? '',
    whatsapp_no:       app.whatsapp_no ?? '',
    permanent_address: app.permanent_address ?? '',
  });
  const [saving,     setSaving]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg,        setMsg]        = useState('');
  const [err,        setErr]        = useState('');
  const [liveProgress, setLiveProgress] = useState(app.progress);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync progress when parent updates app after doc upload
  useEffect(() => { setLiveProgress(app.progress); }, [app.progress]);

  const draftKey = `app_draft_${app.id}`;

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const { formData: fd, studentInfo: si } = JSON.parse(saved);
        if (fd) { setFormData(fd); setHasChanges(true); }
        if (si) { setStudentInfo(si); setHasChanges(true); }
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.id]);

  // Auto-save draft to localStorage (debounced 3s)
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
      const res = await api.patch(`/applications/${app.id}`, {
        form_data: formData,
        ...studentInfo,
      });
      onSaved(res.data);
      if (res.data?.progress !== undefined) setLiveProgress(res.data.progress);
      setHasChanges(false);
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      setMsg('Saved ✓'); setTimeout(() => setMsg(''), 2500);
    } catch { setErr('Save failed — please try again.'); setTimeout(() => setErr(''), 6000); }
    setSaving(false);
  }

  async function handleSubmit() {
    if (!window.confirm('Submit this application?\n\nAfter submitting, you can still resubmit if needed, but the form will be locked for review.')) return;
    setSubmitting(true); setErr('');
    try {
      const res = await api.post(`/applications/${app.id}/submit`);
      onSubmitted(res.data);
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      setMsg('Submitted successfully ✓');
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } } };
      setErr(ax.response?.data?.message ?? 'Submit failed — please try again.');
      setTimeout(() => setErr(''), 6000);
    }
    setSubmitting(false);
  }

  function handleClose() {
    if (hasChanges && !window.confirm('You have unsaved changes. Discard them and go back?')) return;
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    onClose?.();
  }

  return (
    <div>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {onClose && (
              <button onClick={handleClose} aria-label="Go back"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{app.student_name}</p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">{app.application_code} · {app.form_template?.country ?? ''}</p>
            </div>
            {app.status === 'submitted' && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full flex-shrink-0">✓ SUBMITTED</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {isEditable && (
              <button onClick={handleSave} disabled={saving} aria-label="Save progress"
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg sm:rounded-xl disabled:opacity-50 transition-colors">
                {saving ? '…' : '💾 Save'}
              </button>
            )}
            {canSubmit && (
              <button onClick={handleSubmit} disabled={submitting} aria-label="Submit application"
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs font-bold rounded-lg sm:rounded-xl disabled:opacity-50 transition-all shadow-sm flex items-center gap-1">
                {submitting && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                🚀 Submit
              </button>
            )}
          </div>
        </div>
        {progress === 0
          ? <p className="text-xs text-slate-400">Fill in the form below to track your progress.</p>
          : <ProgressBar value={progress} />
        }
        {msg && <p aria-live="polite" className="text-[11px] font-bold text-emerald-600 mt-1">{msg}</p>}
        {err && <p aria-live="assertive" className="text-[11px] text-rose-500 mt-1">{err}</p>}
        {hasChanges && !saving && !msg && (
          <p className="text-[10px] text-amber-500 mt-0.5">Unsaved changes — click Save to keep your work.</p>
        )}
      </div>

      {/* Template loading skeleton */}
      {!template && (
        <div className="px-4 sm:px-6 py-10 space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-xl h-24" />
          ))}
          <p className="text-center text-xs text-gray-400">Loading form template…</p>
        </div>
      )}

      {/* Form body */}
      {template && <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-10">

        {/* Personal Information — exact admin layout */}
        <section className="bg-[#f0fdf4] border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">Personal Information</span>
          </div>
          <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className={lbl}>Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </span>
                <input className={`${inp} pl-10 bg-slate-50`} value={app.student_name ?? ''} readOnly />
              </div>
            </div>
            {/* Email */}
            <div>
              <label className={lbl}>Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </span>
                <input className={`${inp} pl-10`} type="email" value={studentInfo.student_email}
                  readOnly={!isEditable} onChange={e => { setStudentInfo(p => ({ ...p, student_email: e.target.value })); setHasChanges(true); }} />
              </div>
            </div>
            {/* Contact Number */}
            <div>
              <label className={lbl}>Contact Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </span>
                <input className={`${inp} pl-10`} type="tel" value={studentInfo.student_phone}
                  readOnly={!isEditable} onChange={e => { setStudentInfo(p => ({ ...p, student_phone: e.target.value })); setHasChanges(true); }} />
              </div>
            </div>
            {/* WhatsApp */}
            <div>
              <label className={lbl}>WhatsApp Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </span>
                <input className={`${inp} pl-10`} type="tel" value={studentInfo.whatsapp_no}
                  readOnly={!isEditable} onChange={e => { setStudentInfo(p => ({ ...p, whatsapp_no: e.target.value })); setHasChanges(true); }} />
              </div>
            </div>
            {/* Date of Birth */}
            <div>
              <label className={lbl}>Date of Birth</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </span>
                <input className={`${inp} pl-10`} type="date" value={formData.birth_date ?? ''}
                  readOnly={!isEditable} onChange={e => set('birth_date', e.target.value)} />
              </div>
            </div>
            {/* Passport */}
            <div>
              <label className={lbl}>Passport Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                </span>
                <input className={`${inp} pl-10`} placeholder="e.g. AB1234567" value={formData.passport_no ?? ''}
                  readOnly={!isEditable} onChange={e => set('passport_no', e.target.value)} />
              </div>
            </div>
            {/* Intake — dropdown like admin */}
            {template && template.intake_options?.length > 0 && (
              <div>
                <label className={lbl}>Select Intake</label>
                <select className={inp} value={formData.intake ?? ''} disabled={!isEditable}
                  onChange={e => set('intake', e.target.value)}>
                  <option value="">Choose intake…</option>
                  {(template.intake_options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            )}
            {/* Permanent Address */}
            <div className="sm:col-span-2">
              <label className={lbl}>Permanent Address</label>
              <textarea className={`${inp} resize-none`} rows={2} placeholder="House, Road, Area, City, Postcode"
                value={studentInfo.permanent_address} readOnly={!isEditable}
                onChange={e => { setStudentInfo(p => ({ ...p, permanent_address: e.target.value })); setHasChanges(true); }} />
            </div>
          </div>
          </div>
        </section>

        <hr className="border-slate-100" />

        {/* Dynamic template groups (exclude 'Application Form Info' and empty groups) */}
        {template && template.groups.filter(g => g.label !== 'Application Form Info').filter(g =>
          g.boxes.some(b => b.fields.some(f => isFieldVisible(f, formData)))
        ).map((group, gi) => (
          <div key={group.id}>
            <section>
              <SectionHead n={gi + 2} title={group.label} subtitle={group.hint} />
              <div className="space-y-6">
                {group.boxes.map((box, bi) => {
                  const visibleFields = box.fields.filter(f => isFieldVisible(f, formData));
                  if (visibleFields.length === 0) return null;
                  return (
                    <div key={box.id} className={bi > 0 ? 'pt-4 border-t border-slate-100' : ''}>
                      {box.name && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{box.name}</p>}
                      <div className="grid grid-cols-6 gap-4">
                        {visibleFields.map(field => (
                          <div key={field.field_key} className={colSpan(field.box_size)}>
                            <DynamicField
                              field={field}
                              appId={app.id}
                              value={formData[field.field_key] ?? ''}
                              existingDoc={docs.find(d => d.field_key === field.field_key || d.doc_type === field.field_key)}
                              onDocUploaded={onDocUploaded}
                              onDocDeleted={onDocDeleted}
                              onChange={val => set(field.field_key, val)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            <hr className="border-slate-100 mt-10" />
          </div>
        ))}


        {/* Education Certificates */}
        {template && template.educations?.length > 0 && (
          <section className="bg-[#f0fdf4] border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
              <span className="text-sm font-semibold text-gray-900">Education Certificates</span>
            </div>
            <div className="p-6 space-y-3">
              {(template.educations ?? []).filter(e => e.requirement !== 'none').map((edu, i) => {
                const levelLabels: Record<string, string> = {
                  ssc: 'SSC / O-Level', hsc: 'HSC / A-Level', diploma: 'Diploma',
                  bachelors: "Bachelor's Degree", masters: "Master's Degree",
                  phd: 'PhD / Doctorate', other: 'Other',
                };
                const label = levelLabels[edu.level] ?? edu.level;
                const mandatory = edu.requirement === 'mandatory';
                const docKey = `edu_${i}`;
                const existingDoc = docs.find(d => d.field_key === docKey || d.doc_type === docKey);

                const badgeColor = mandatory ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500';
                return (
                  <div key={edu.level} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
                        {mandatory ? 'Mandatory' : 'Optional'}
                      </span>
                      <span className="text-sm font-medium text-gray-800">{label}</span>
                    </div>
                    {/* Fields */}
                    <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={lbl}>Institution / Board</label>
                        <input className={inp} placeholder="e.g. Dhaka Education Board"
                          value={formData[`${docKey}_institution`] ?? ''}
                          onChange={e => set(`${docKey}_institution`, e.target.value)}
                          readOnly={!isEditable} />
                      </div>
                      <div>
                        <label className={lbl}>GPA / Grade</label>
                        <input className={inp} placeholder="e.g. 5.00 / A+"
                          value={formData[`${docKey}_gpa`] ?? ''}
                          onChange={e => set(`${docKey}_gpa`, e.target.value)}
                          readOnly={!isEditable} />
                      </div>
                      <div>
                        <label className={lbl}>Passing Year</label>
                        <input className={inp} placeholder="e.g. 2022"
                          value={formData[`${docKey}_year`] ?? ''}
                          onChange={e => set(`${docKey}_year`, e.target.value)}
                          readOnly={!isEditable} />
                      </div>
                    </div>
                    {isEditable && (
                      <div className="px-4 pb-4">
                        <InlineDoc
                          fieldKey={docKey}
                          fieldLabel={`${label} Certificate`}
                          appId={app.id}
                          mandatory={mandatory}
                          existingDoc={existingDoc}
                          onUploaded={onDocUploaded}
                          onDeleted={onDocDeleted}
                        />
                      </div>
                    )}
                    {!isEditable && existingDoc && (
                      <div className="px-4 pb-4">
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                          <span className="text-emerald-600 text-xs font-semibold">📄 {existingDoc.original_name}</span>
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
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 sm:py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-2xl text-sm font-bold disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : '💾 Save Progress'}
            </button>
            {canSubmit ? (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-3 sm:py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl sm:rounded-2xl text-sm font-bold disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2">
                {submitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {app.status === 'submitted' ? '🔄 Resubmit Application' : '🚀 Submit Application'}
              </button>
            ) : (
              <div className="flex-1 py-3 sm:py-3.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl sm:rounded-2xl text-center flex flex-col items-center justify-center gap-0.5"
                title={`Submit unlocks at 50% — currently ${progress}%`}>
                <span className="text-xs font-semibold text-slate-400">Submit unlocks at 50%</span>
                <span className="text-[11px] text-slate-400">Fill required fields &amp; upload education docs to reach {progress}% → 50%</span>
              </div>
            )}
          </div>
        )}

        {/* Accepted/Rejected — read only notice */}
        {!isEditable && (
          <div className={`rounded-2xl px-5 py-4 text-center ${app.status === 'accepted' ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
            <p className={`text-sm font-bold ${app.status === 'accepted' ? 'text-emerald-700' : 'text-rose-700'}`}>
              {app.status === 'accepted' ? '✅ Application Accepted — congratulations!' : '❌ Application Rejected'}
            </p>
            <p className="text-xs text-slate-400 mt-1">This application is locked and can no longer be edited.</p>
          </div>
        )}
      </div>}
    </div>
  );
}