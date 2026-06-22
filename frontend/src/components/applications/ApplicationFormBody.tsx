'use client';
import { useRef, useState } from 'react';
import api from '@/lib/api';
import {
  Application, AppDoc, FormTemplateData, TemplateField,
  DynamicField, InlineDoc, SectionHead, ProgressBar,
  ProgressBar as PB, compressImage, isFieldVisible, colSpan,
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

// ── Inline editable contact fields ───────────────────────────────────────────

function WhatsAppField({ app, isEditable, onSaved }: { app: Application; isEditable: boolean; onSaved: (a: Application) => void }) {
  const [val, setVal] = useState(app.whatsapp_no ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (val === (app.whatsapp_no ?? '')) return;
    setSaving(true);
    try { const res = await api.patch(`/applications/${app.id}`, { whatsapp_no: val }); onSaved(res.data); }
    catch { /* noop */ }
    setSaving(false);
  }

  if (!isEditable) return <input className={`${inp} bg-slate-50`} value={val} readOnly />;
  return (
    <input className={inp} type="tel" placeholder="+880 1XXXXXXXXX" value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={save}
      disabled={saving} />
  );
}

function AddressField({ app, isEditable, onSaved }: { app: Application; isEditable: boolean; onSaved: (a: Application) => void }) {
  const [val, setVal] = useState(app.permanent_address ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (val === (app.permanent_address ?? '')) return;
    setSaving(true);
    try { const res = await api.patch(`/applications/${app.id}`, { permanent_address: val }); onSaved(res.data); }
    catch { /* noop */ }
    setSaving(false);
  }

  if (!isEditable) return <textarea className={`${inp} bg-slate-50 resize-none`} rows={2} value={val} readOnly />;
  return (
    <textarea className={`${inp} resize-none`} rows={2}
      placeholder="House, Road, Area, City, Postcode"
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={save}
      disabled={saving} />
  );
}

export default function ApplicationFormBody({
  app, template, onSaved, onSubmitted, onDocUploaded, onDocDeleted, onClose,
}: Props) {
  const [formData, setFormData] = useState<Record<string, string>>(app.form_data ?? {});
  const [saving,   setSaving]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const progress   = app.progress;
  const isEditable = !['accepted', 'rejected'].includes(app.status);
  const canSubmit  = progress >= 50 && isEditable;
  const docs       = app.documents ?? [];

  function set(key: string, val: string) {
    setFormData(p => ({ ...p, [key]: val }));
  }

  async function handleSave() {
    setSaving(true); setErr('');
    try {
      const res = await api.patch(`/applications/${app.id}`, { form_data: formData });
      onSaved(res.data);
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
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-100 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {onClose && (
              <button onClick={onClose} className="w-9 h-9 rounded-2xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <p className="text-sm font-black text-slate-900">{app.student_name}</p>
              <p className="text-[11px] text-slate-400">{app.application_code} · {app.form_template?.country ?? ''}</p>
            </div>
            {app.status === 'submitted' && (
              <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full">✓ SUBMITTED</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {msg && <span className="text-xs font-bold text-emerald-600 animate-pulse">{msg}</span>}
            {err && <span className="text-xs text-rose-500">{err}</span>}
            {isEditable && (
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : '💾 Save'}
              </button>
            )}
            {canSubmit && (
              <button onClick={handleSubmit} disabled={submitting}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-all shadow-sm flex items-center gap-1.5">
                {submitting && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                🚀 Submit Application
              </button>
            )}
          </div>
        </div>
        <ProgressBar value={progress} />
      </div>

      {/* Form body */}
      <div className="px-6 py-8 space-y-10">

        {/* Student info */}
        <section>
          <SectionHead n={1} title="Student Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Full Name</label>
              <input className={`${inp} bg-slate-50`} value={app.student_name} readOnly />
            </div>
            <div>
              <label className={lbl}>Email</label>
              <input className={`${inp} bg-slate-50`} value={app.student_email ?? ''} readOnly />
            </div>
            <div>
              <label className={lbl}>Contact Phone</label>
              <input className={`${inp} bg-slate-50`} value={app.student_phone ?? ''} readOnly />
            </div>
            <div>
              <label className={lbl}>WhatsApp Number</label>
              <WhatsAppField app={app} isEditable={isEditable} onSaved={onSaved} />
            </div>
            <div>
              <label className={lbl}>Target Country</label>
              <input className={`${inp} bg-slate-50`} value={app.form_template?.country ?? ''} readOnly />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Permanent Address</label>
              <AddressField app={app} isEditable={isEditable} onSaved={onSaved} />
            </div>
          </div>
        </section>

        <hr className="border-slate-100" />

        {/* Dynamic template groups */}
        {template && template.groups.map((group, gi) => (
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
            <p className="text-xs font-bold text-green-800 mb-3">📅 Available Intakes for {app.form_template?.country}</p>
            <div className="flex flex-wrap gap-2">
              {template.intake_options.map(opt => (
                <button key={opt} type="button"
                  onClick={() => set('target_intake', opt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${formData.target_intake === opt ? 'bg-green-700 text-white border-green-700' : 'bg-white border-green-200 text-green-700 hover:bg-green-100'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom actions */}
        {isEditable && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : '💾 Save Progress'}
            </button>
            {canSubmit ? (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl text-sm font-bold disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2">
                {submitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {app.status === 'submitted' ? '🔄 Resubmit Application' : '🚀 Submit Application'}
              </button>
            ) : (
              <div className="flex-1 py-3.5 bg-slate-50 border border-dashed border-slate-200 text-slate-400 rounded-2xl text-sm font-semibold text-center">
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