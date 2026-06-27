'use client';
import { useRef, useState } from 'react';
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
  const [formData,   setFormData]   = useState<Record<string, string>>(app.form_data ?? {});
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

  const progress   = liveProgress;
  const isEditable = !['accepted', 'rejected'].includes(app.status);
  const canSubmit  = progress >= 50 && isEditable;
  const docs       = app.documents ?? [];

  function set(key: string, val: string) {
    setFormData(p => ({ ...p, [key]: val }));
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
      setMsg('Saved ✓'); setTimeout(() => setMsg(''), 2500);
    } catch { setErr('Save failed.'); }
    setSaving(false);
  }

  async function handleSubmit() {
    setSubmitting(true); setErr('');
    try {
      const res = await api.post(`/applications/${app.id}/submit`);
      onSubmitted(res.data);
      setMsg('Submitted successfully ✓');
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } } };
      setErr(ax.response?.data?.message ?? 'Submit failed.');
    }
    setSubmitting(false);
  }

  return (
    <div>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {onClose && (
              <button onClick={onClose} className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0">
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
              <span className="hidden sm:inline text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full flex-shrink-0">✓ SUBMITTED</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {msg && <span className="hidden sm:inline text-xs font-bold text-emerald-600 animate-pulse">{msg}</span>}
            {err && <span className="hidden sm:inline text-xs text-rose-500">{err}</span>}
            {isEditable && (
              <button onClick={handleSave} disabled={saving}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg sm:rounded-xl disabled:opacity-50 transition-colors">
                {saving ? '…' : '💾 Save'}
              </button>
            )}
            {canSubmit && (
              <button onClick={handleSubmit} disabled={submitting}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs font-bold rounded-lg sm:rounded-xl disabled:opacity-50 transition-all shadow-sm flex items-center gap-1">
                {submitting && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                <span className="hidden sm:inline">🚀 Submit</span>
                <span className="inline sm:hidden">Submit</span>
              </button>
            )}
          </div>
        </div>
        <ProgressBar value={progress} />
        {msg && <p className="text-[11px] font-bold text-emerald-600 animate-pulse mt-1 sm:hidden">{msg}</p>}
      </div>

      {/* Form body */}
      <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-10">

        {/* Student info */}
        <section>
          <SectionHead n={1} title="Student Information" subtitle={isEditable ? 'Contact details can be updated and saved' : undefined} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name — always read-only */}
            <div>
              <label className={lbl}>Full Name</label>
              <input className={`${inp} bg-slate-50`} value={app.student_name} readOnly />
            </div>
            {/* Country — always read-only */}
            <div>
              <label className={lbl}>Target Country</label>
              <input className={`${inp} bg-slate-50`} value={app.form_template?.country ?? ''} readOnly />
            </div>
            {/* Editable contact fields */}
            <div>
              <label className={lbl}>Email Address</label>
              <input className={inp} type="email" value={studentInfo.student_email}
                readOnly={!isEditable}
                onChange={e => setStudentInfo(p => ({ ...p, student_email: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Contact Phone</label>
              <input className={inp} type="tel" value={studentInfo.student_phone}
                readOnly={!isEditable}
                onChange={e => setStudentInfo(p => ({ ...p, student_phone: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>WhatsApp Number</label>
              <input className={inp} type="tel" value={studentInfo.whatsapp_no}
                readOnly={!isEditable}
                onChange={e => setStudentInfo(p => ({ ...p, whatsapp_no: e.target.value }))} />
            </div>
            {/* DOB from form_data */}
            <div>
              <label className={lbl}>Date of Birth</label>
              <input className={inp} type="date"
                value={formData.birth_date ?? ''}
                readOnly={!isEditable}
                onChange={e => set('birth_date', e.target.value)} />
            </div>
            {/* Passport from form_data */}
            <div>
              <label className={lbl}>Passport Number</label>
              <input className={inp} placeholder="e.g. AB1234567"
                value={formData.passport_no ?? ''}
                readOnly={!isEditable}
                onChange={e => set('passport_no', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Permanent Address</label>
              <textarea className={`${inp} resize-none`} rows={2}
                value={studentInfo.permanent_address}
                readOnly={!isEditable}
                onChange={e => setStudentInfo(p => ({ ...p, permanent_address: e.target.value }))} />
            </div>
          </div>
        </section>

        <hr className="border-slate-100" />

        {/* Dynamic template groups (exclude 'Application Form Info' and empty groups) */}
        {template && template.groups.filter(g => g.label !== 'Application Form Info').filter(g =>
          g.boxes.some(b => b.fields.length > 0)
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

        {/* Intake picker */}
        {template && template.intake_options?.length > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-4">
            <p className="text-xs font-bold text-green-800 mb-3">📅 Select Intake — {app.form_template?.country}</p>
            <div className="flex flex-wrap gap-2">
              {template.intake_options.map(opt => (
                <button key={opt} type="button"
                  onClick={() => isEditable && set('intake', opt)}
                  disabled={!isEditable}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${formData.intake === opt ? 'bg-green-700 text-white border-green-700 shadow-sm' : 'bg-white border-green-200 text-green-700 hover:bg-green-100'} disabled:opacity-60 disabled:cursor-default`}>
                  {opt}
                </button>
              ))}
            </div>
            {formData.intake && (
              <p className="text-[11px] text-green-700 font-semibold mt-2">✓ Selected: {formData.intake}</p>
            )}
          </div>
        )}

        {/* Education Certificates */}
        {template && template.educations?.length > 0 && (
          <section>
            <SectionHead
              icon="🎓"
              title="Education Certificates"
              subtitle="Upload your academic certificates and transcripts"
            />
            <div className="space-y-4">
              {template.educations.filter(e => e.requirement !== 'none').map((edu) => {
                const levelLabels: Record<string, string> = {
                  ssc: 'SSC / O-Level', hsc: 'HSC / A-Level', diploma: 'Diploma',
                  bachelors: "Bachelor's Degree", masters: "Master's Degree",
                  phd: 'PhD / Doctorate', other: 'Other',
                };
                const label = levelLabels[edu.level] ?? edu.level;
                const mandatory = edu.requirement === 'mandatory';
                const docKey = `edu_${edu.level}`;
                const existingDoc = docs.find(d => d.field_key === docKey || d.doc_type === docKey);

                return (
                  <div key={edu.level} className={`rounded-2xl border p-4 ${mandatory ? 'border-red-100 bg-red-50/40' : 'border-amber-100 bg-amber-50/40'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mandatory ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                        {mandatory ? '🔴 Required' : '📎 Optional'}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{label}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
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
                      <InlineDoc
                        fieldKey={docKey}
                        fieldLabel={`${label} Certificate`}
                        appId={app.id}
                        mandatory={mandatory}
                        existingDoc={existingDoc}
                        onUploaded={onDocUploaded}
                        onDeleted={onDocDeleted}
                      />
                    )}
                    {!isEditable && existingDoc && (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mt-1">
                        <span className="text-emerald-600 text-xs font-semibold">📄 {existingDoc.original_name}</span>
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
              <div className="flex-1 py-3 sm:py-3.5 bg-slate-50 border border-dashed border-slate-200 text-slate-400 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold text-center flex items-center justify-center">
                Submit unlocks at 50% — currently {progress}%
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
      </div>
    </div>
  );
}