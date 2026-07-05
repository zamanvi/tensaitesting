'use client';
import api from '@/lib/api';
import { useRef, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppDoc {
  id: number; doc_type: string; field_key: string; label: string;
  url: string; original_name: string; file_size: number; mime_type: string;
}

export interface TemplateField {
  id: number; field_key: string; label: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file' | 'email' | 'tel';
  box_size: 'small' | 'middle' | 'full';
  is_required: boolean; requires_document: boolean; document_required?: boolean;
  options: string[]; placeholder: string; helper_text: string;
  conditional_field_key?: string;
  conditional_operator?: 'is' | 'is_not' | 'is_empty' | 'is_not_empty';
  conditional_value?: string;
}

export interface TemplateBox {
  id: number; name: string;
  requires_document: boolean; document_required?: boolean;
  doc_key?: string; doc_label?: string;
  fields: TemplateField[];
}

export interface TemplateGroup {
  id: number; label: string; hint?: string;
  boxes: TemplateBox[];
}

export interface TemplateEducation {
  level: string;
  requirement: 'mandatory' | 'optional' | 'none';
}

export interface FormTemplateData {
  id: number; country: string; visa_type?: string; name: string;
  intake_options: string[];
  groups: TemplateGroup[];
  educations: TemplateEducation[];
  admission_manager_name?: string;
  admission_manager_phone?: string;
  admission_manager_whatsapp?: string;
}

export interface Application {
  id: number; application_code: string;
  form_template_id: number;
  form_template: { id: number; name: string; country: string; visa_type?: string; intake_options: string[] } | null;
  student_name: string; student_email: string; student_phone: string;
  whatsapp_no?: string; permanent_address?: string;
  form_data: Record<string, string | number | null>;
  progress: number; status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  submitted_by_role: string;
  submitter_name?: string;
  submitter_email?: string;
  branch_id: number | null;
  branch_name?: string;
  submitted_at: string | null;
  live_to_school: boolean;
  live_to_school_at: string | null;
  created_at: string; updated_at: string;
  documents?: AppDoc[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export async function compressImage(file: File): Promise<File> {
  return new Promise(resolve => {
    if (!file.type.startsWith('image/')) { resolve(file); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.onload = () => {
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height / width) * MAX); width = MAX; }
        else { width = Math.round((width / height) * MAX); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        resolve(new File([blob!], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.82);
    };
    img.src = url;
  });
}

export const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const MAX_DOC_BYTES = 10 * 1024 * 1024;

export const EDU_LABELS: Record<string, string> = {
  ssc: 'SSC / O-Level', hsc: 'HSC / A-Level', diploma: 'Diploma',
  bachelors: "Bachelor's Degree", masters: "Master's Degree",
  phd: 'PhD / Doctorate', other: 'Other',
};

export const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 bg-white transition-all placeholder:text-slate-300';
export const lbl = 'block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide';

// ── Progress bar ──────────────────────────────────────────────────────────────

export function ProgressBar({ value }: { value: number }) {
  const pct   = Math.min(100, Math.max(0, value));
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400';
  const label = pct >= 80 ? 'text-green-700' : pct >= 50 ? 'text-amber-700' : 'text-rose-500';
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Form Progress</span>
          {pct >= 50 && <span className="text-xs font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Ready to Submit</span>}
        </div>
        <span className={`text-base font-black ${label}`}>{pct}%</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div className={`h-full rounded-full transition-all duration-700 ease-out ${color} relative overflow-hidden`} style={{ width: `${pct}%` }}>
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>
      {pct < 50 && (
        <p className="text-xs text-slate-400 mt-1.5">
          Fill <strong className="text-slate-600">{50 - pct}%</strong> more to unlock Submit
        </p>
      )}
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────

export function SectionHead({ n, title, subtitle, icon }: { n?: number; title: string; subtitle?: string; icon?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm">
        {icon ?? n}
      </div>
      <div className="pt-0.5">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Inline document upload ────────────────────────────────────────────────────

export function InlineDoc({
  fieldKey, fieldLabel, appId, mandatory, existingDoc, onUploaded, onDeleted,
}: {
  fieldKey: string; fieldLabel: string; appId: number; mandatory?: boolean;
  existingDoc?: AppDoc;
  onUploaded: (doc: AppDoc, progress: number) => void;
  onDeleted:  (docId: number, progress: number) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [uploadErr, setUploadErr] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (!ALLOWED_DOC_TYPES.includes(file.type)) {
      setUploadErr('Only JPG, PNG, WebP, or PDF files are accepted.');
      setTimeout(() => setUploadErr(''), 5000);
      e.target.value = ''; return;
    }
    if (file.size > MAX_DOC_BYTES) {
      setUploadErr('File must be under 10 MB.');
      setTimeout(() => setUploadErr(''), 5000);
      e.target.value = ''; return;
    }
    setUploading(true); setUploadErr('');
    const fd = new FormData();
    fd.append('doc_type', fieldKey);
    fd.append('field_key', fieldKey);
    fd.append('label', fieldLabel);
    fd.append('file', await compressImage(file));
    try {
      const res = await api.post(`/applications/${appId}/documents`, fd, {
        headers: { 'Content-Type': undefined },
      });
      onUploaded(res.data.document, res.data.progress);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } } };
      const msg = ax.response?.data?.message ?? 'Upload failed — please try again.';
      setUploadErr(msg);
      setTimeout(() => setUploadErr(''), 8000);
    }
    setUploading(false); e.target.value = '';
  }

  async function handleDelete() {
    if (!existingDoc) return; setDeleting(true);
    try {
      const res = await api.delete(`/applications/${appId}/documents/${existingDoc.id}`);
      onDeleted(existingDoc.id, res.data.progress);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } } };
      setUploadErr(ax.response?.data?.message ?? 'Delete failed — please try again.');
      setTimeout(() => setUploadErr(''), 8000);
    }
    setDeleting(false);
  }

  return (
    <div className="mt-2">
      <input ref={ref} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
      {uploadErr && <p aria-live="assertive" className="text-xs text-rose-500 mb-1">{uploadErr}</p>}
      {existingDoc ? (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
          <div className="w-9 h-9 rounded-lg bg-white border border-green-200 flex items-center justify-center shrink-0 overflow-hidden">
            {existingDoc.mime_type?.startsWith('image/')
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={existingDoc.url} alt={existingDoc.original_name} className="w-full h-full object-cover" />
              : <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-green-800 truncate">{existingDoc.original_name}</p>
            <p className="text-xs text-slate-400">{existingDoc.file_size ? `${Math.round(existingDoc.file_size / 1024)} KB` : ''}</p>
          </div>
          <button onClick={() => ref.current?.click()} disabled={uploading} aria-label="Replace document"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-xs font-bold text-green-700 px-2.5 bg-white border border-green-200 rounded-lg hover:bg-green-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/40">
            Replace
          </button>
          <button onClick={handleDelete} disabled={deleting} aria-label="Delete document"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-white border border-rose-100 rounded-lg hover:bg-rose-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400/40">
            {deleting
              ? <span className="w-3.5 h-3.5 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
              : <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
          className={`flex items-center gap-2.5 w-full px-3 py-3 border border-dashed rounded-xl transition-colors text-left min-h-[44px] ${mandatory ? 'border-rose-300 bg-rose-50/60 hover:bg-rose-100/60' : 'border-amber-300 bg-amber-50/60 hover:bg-amber-100/60'} focus:outline-none focus:ring-2 focus:ring-green-500/40`}>
          {uploading
            ? <span className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin shrink-0" />
            : <svg className={`w-4 h-4 shrink-0 ${mandatory ? 'text-rose-400' : 'text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>}
          <span className={`text-xs font-semibold ${mandatory ? 'text-rose-700' : 'text-amber-700'}`}>
            {uploading ? 'Uploading…' : `Upload ${fieldLabel}${mandatory ? ' (Required)' : ''}`}
          </span>
        </button>
      )}
    </div>
  );
}

// ── Dynamic field ─────────────────────────────────────────────────────────────

export function DynamicField({
  field, value, onChange, appId, existingDoc, onDocUploaded, onDocDeleted,
}: {
  field: TemplateField; value: string; onChange: (val: string) => void;
  appId: number; existingDoc?: AppDoc;
  onDocUploaded: (doc: AppDoc, progress: number) => void;
  onDocDeleted:  (docId: number, progress: number) => void;
}) {
  return (
    <div>
      <label className={lbl}>
        {field.label}
        {field.is_required
          ? <span className="text-rose-400 ml-0.5">*</span>
          : <span className="font-normal text-slate-300 ml-1 text-xs">(optional)</span>}
      </label>

      {field.field_type === 'file' ? null
      : field.field_type === 'select' ? (
        <select className={inp} value={value} onChange={e => onChange(e.target.value)}>
          <option value="">{field.placeholder || 'Select…'}</option>
          {(field.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : field.field_type === 'textarea' ? (
        <textarea className={`${inp} resize-none`} rows={3} value={value}
          placeholder={field.placeholder ?? ''} onChange={e => onChange(e.target.value)} />
      ) : (
        <input className={inp}
          type={
            field.field_type === 'number' ? 'number' :
            field.field_type === 'date'   ? 'date' :
            field.field_type === 'email'  ? 'email' :
            field.field_type === 'tel'    ? 'tel' :
            'text'
          }
          value={value} placeholder={field.placeholder ?? ''} onChange={e => onChange(e.target.value)} />
      )}

      {field.helper_text && <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{field.helper_text}</p>}

      {field.requires_document && (
        <InlineDoc
          fieldKey={field.field_key}
          fieldLabel={field.label}
          appId={appId}
          mandatory={field.document_required}
          existingDoc={existingDoc}
          onUploaded={onDocUploaded}
          onDeleted={onDocDeleted}
        />
      )}
    </div>
  );
}

// ── isVisible ─────────────────────────────────────────────────────────────────

export function isFieldVisible(field: TemplateField, formData: Record<string, string>): boolean {
  if (!field.conditional_field_key || !field.conditional_operator) return true;
  const cur = formData[field.conditional_field_key] ?? '';
  switch (field.conditional_operator) {
    case 'is':           return cur === (field.conditional_value ?? '');
    case 'is_not':       return cur !== (field.conditional_value ?? '');
    case 'is_empty':     return !cur;
    case 'is_not_empty': return !!cur;
    default:             return true;
  }
}

export function colSpan(size: TemplateField['box_size']) {
  // grid: cols-1 / sm:cols-2 / md:cols-4
  if (size === 'small') return 'col-span-1 md:col-span-1';
  if (size === 'full')  return 'col-span-1 sm:col-span-2 md:col-span-4';
  return 'col-span-1 md:col-span-2';
}