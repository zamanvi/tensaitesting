'use client';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppDoc {
  id: number; doc_type: string; field_key: string; label: string;
  url: string; original_name: string; file_size: number; mime_type: string;
}

export interface TemplateField {
  id: number; field_key: string; label: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file';
  box_size: 'small' | 'middle' | 'full';
  is_required: boolean; requires_document: boolean; document_required?: boolean;
  options: string[]; placeholder: string; helper_text: string;
  conditional_field_key?: string;
  conditional_operator?: 'is' | 'is_not' | 'is_empty' | 'is_not_empty';
  conditional_value?: string;
}

export interface TemplateBox {
  id: number; name: string; requires_document: boolean;
  fields: TemplateField[];
}

export interface TemplateGroup {
  id: number; label: string; hint?: string;
  boxes: TemplateBox[];
}

export interface FormTemplateData {
  id: number; country: string; name: string;
  intake_options: string[];
  groups: TemplateGroup[];
}

export interface Application {
  id: number; application_code: string;
  form_template_id: number;
  form_template: { id: number; name: string; country: string; intake_options: string[] } | null;
  student_name: string; student_email: string; student_phone: string;
  form_data: Record<string, string>;
  progress: number; status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  submitted_by_role: string;
  submitter_name?: string;
  submitter_email?: string;
  branch_id: number | null;
  branch_name?: string;
  submitted_at: string | null; created_at: string; updated_at: string;
  documents: AppDoc[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export async function compressImage(file: File): Promise<File> {
  return new Promise(resolve => {
    if (!file.type.startsWith('image/')) { resolve(file); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
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

export const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 bg-white transition-all placeholder:text-slate-300';
export const lbl = 'block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide';

// ── Progress bar ──────────────────────────────────────────────────────────────

export function ProgressBar({ value }: { value: number }) {
  const pct   = Math.min(100, Math.max(0, value));
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400';
  const label = pct >= 80 ? 'text-emerald-700' : pct >= 50 ? 'text-amber-700' : 'text-rose-500';
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Form Progress</span>
          {pct >= 50 && <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Ready to Submit</span>}
        </div>
        <span className={`text-base font-black ${label}`}>{pct}%</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div className={`h-full rounded-full transition-all duration-700 ease-out ${color} relative overflow-hidden`} style={{ width: `${pct}%` }}>
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>
      {pct < 50 && (
        <p className="text-[11px] text-slate-400 mt-1.5">
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

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('doc_type', fieldKey);
    fd.append('field_key', fieldKey);
    fd.append('label', fieldLabel);
    fd.append('file', await compressImage(file));
    try {
      const res = await api.post(`/applications/${appId}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onUploaded(res.data.document, res.data.progress);
    } catch { /* noop */ }
    setUploading(false); e.target.value = '';
  }

  async function handleDelete() {
    if (!existingDoc) return; setDeleting(true);
    try {
      const res = await api.delete(`/applications/${appId}/documents/${existingDoc.id}`);
      onDeleted(existingDoc.id, res.data.progress);
    } catch { /* noop */ }
    setDeleting(false);
  }

  return (
    <div className="mt-2">
      <input ref={ref} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
      {existingDoc ? (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          <div className="w-8 h-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center shrink-0 text-xs font-bold overflow-hidden">
            {existingDoc.mime_type?.startsWith('image/')
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={existingDoc.url} alt="" className="w-full h-full object-cover" />
              : <span className="text-red-400">PDF</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-emerald-800 truncate">{existingDoc.original_name}</p>
            <p className="text-[10px] text-slate-400">{existingDoc.file_size ? `${Math.round(existingDoc.file_size / 1024)} KB` : ''}</p>
          </div>
          <button onClick={() => ref.current?.click()} disabled={uploading} className="text-[10px] font-bold text-emerald-700 px-2 py-1 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50">Replace</button>
          <button onClick={handleDelete} disabled={deleting} className="text-[10px] font-bold text-rose-500 px-2 py-1 bg-white border border-rose-100 rounded-lg hover:bg-rose-50">{deleting ? '…' : '✕'}</button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
          className={`flex items-center gap-2 w-full px-3 py-2.5 border border-dashed rounded-xl transition-colors text-left group ${mandatory ? 'border-red-300 bg-red-50/60 hover:bg-red-100/60' : 'border-amber-300 bg-amber-50/60 hover:bg-amber-100/60'}`}>
          {uploading
            ? <span className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin shrink-0" />
            : <span className="text-amber-500 text-sm shrink-0">📎</span>}
          <span className={`text-[11px] font-semibold ${mandatory ? 'text-red-700' : 'text-amber-700'}`}>
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
          : <span className="font-normal text-slate-300 ml-1 text-[10px]">(optional)</span>}
      </label>

      {field.field_type === 'select' ? (
        <select className={inp} value={value} onChange={e => onChange(e.target.value)}>
          <option value="">{field.placeholder || 'Select…'}</option>
          {(field.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : field.field_type === 'textarea' ? (
        <textarea className={`${inp} resize-none`} rows={3} value={value}
          placeholder={field.placeholder ?? ''} onChange={e => onChange(e.target.value)} />
      ) : (
        <input className={inp}
          type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
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
  if (size === 'small') return 'col-span-6 sm:col-span-2';
  if (size === 'full')  return 'col-span-6';
  return 'col-span-6 sm:col-span-3';
}