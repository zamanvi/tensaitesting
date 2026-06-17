'use client';
import BranchLayout from '@/components/shared/BranchLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useCountryData } from '@/hooks/useCountryData';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AppDoc {
  id: number; doc_type: string; label: string;
  url: string; original_name: string; file_size: number; mime_type: string;
}

interface TemplateField {
  id: number; field_key: string; label: string; section: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file';
  box_size: 'small' | 'middle' | 'full';
  is_required: boolean; requires_document: boolean;
  options: string[]; placeholder: string; helper_text: string;
  conditional_field_key?: string;
  conditional_operator?: 'is' | 'is_not' | 'is_empty' | 'is_not_empty';
  conditional_value?: string;
}

interface TemplateGroup {
  id: number; label: string; hint?: string;
  fields: TemplateField[];
}

interface FormTemplate {
  id: number; country: string; name: string;
  intake_options: string[];
  groups: TemplateGroup[];
  fields: TemplateField[];
}

interface AppForm {
  id: number; lead_id: number; lead_code: string;
  status: 'draft' | 'submitted'; progress: number;
  submitted_at: string | null; created_at: string; updated_at: string;
  student_name: string; student_email: string; student_phone: string;
  date_of_birth: string; gender: string; nationality: string;
  address: string; passport_number: string; passport_expiry: string;
  last_qualification: string; institution_name: string;
  board_university: string; gpa_grade: string; passing_year: number;
  jlpt_level: string; jlpt_score: string; jlpt_exam_date: string;
  english_proficiency: string; english_score: string;
  target_country: string; target_course: string; target_intake: string;
  preferred_institution: string; preferred_cities: string[];
  sponsor_name: string; sponsor_relationship: string;
  sponsor_occupation: string; sponsor_monthly_income: string;
  documents: AppDoc[];
  custom_data: Record<string, string>;
}

// ── Image compression ─────────────────────────────────────────────────────────

async function compressImage(file: File): Promise<File> {
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

// ── Constants ─────────────────────────────────────────────────────────────────

const NAME_PREFIXES = ['Mr.', 'Ms.', 'Mrs.', 'Md.', 'Dr.', 'Prof.'];
const SPONSOR_RELS  = ['Father', 'Mother', 'Spouse', 'Sibling', 'Self', 'Other'];

const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 bg-white transition-all placeholder:text-slate-300';
const lbl = 'block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide';

const DOC_SLOTS: { type: string; label: string; accept: string; hint: string; icon: string }[] = [
  { type: 'photo',          label: 'Passport-Size Photo',    accept: 'image/*',                    hint: 'White background, JPG/PNG',         icon: '🪪' },
  { type: 'passport',       label: 'Passport Copy',          accept: 'image/*,application/pdf',    hint: 'All pages, clear scan',             icon: '📘' },
  { type: 'certificate',    label: 'Academic Certificate',   accept: 'image/*,application/pdf',    hint: 'Latest certificate',                icon: '🎓' },
  { type: 'transcript',     label: 'Academic Transcript',    accept: 'image/*,application/pdf',    hint: 'Mark sheet / grade sheet',          icon: '📋' },
  { type: 'language_cert',  label: 'Language Certificate',   accept: 'image/*,application/pdf',    hint: 'JLPT / IELTS / TOEFL',             icon: '🗣️' },
  { type: 'nid',            label: 'NID / Birth Certificate',accept: 'image/*,application/pdf',    hint: 'National ID or birth cert',         icon: '🪪' },
  { type: 'bank_statement', label: 'Bank Statement',         accept: 'image/*,application/pdf',    hint: 'Last 6 months (sponsor)',           icon: '🏦' },
  { type: 'sponsor',        label: 'Sponsor Document',       accept: 'image/*,application/pdf',    hint: 'Job cert / income proof',           icon: '📄' },
];

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
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

function SectionHead({ n, title, subtitle, icon }: { n?: number; title: string; subtitle?: string; icon?: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 text-white text-sm font-black flex items-center justify-center shrink-0 shadow-sm">
        {icon ?? n}
      </div>
      <div className="pt-0.5">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Inline document upload (for template fields) ──────────────────────────────

function InlineDoc({
  fieldKey, fieldLabel, formId, existingDoc, onUploaded, onDeleted,
}: {
  fieldKey: string; fieldLabel: string; formId: number;
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
    fd.append('label',    fieldLabel);
    fd.append('file',     await compressImage(file));
    try {
      const res = await api.post(`/branch-admin/application-forms/${formId}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onUploaded(res.data.document, res.data.progress);
    } catch { /* ignore */ }
    setUploading(false); e.target.value = '';
  }

  async function handleDelete() {
    if (!existingDoc) return; setDeleting(true);
    try {
      const res = await api.delete(`/branch-admin/application-forms/${formId}/documents/${existingDoc.id}`);
      onDeleted(existingDoc.id, res.data.progress);
    } catch { /* ignore */ }
    setDeleting(false);
  }

  return (
    <div className="mt-2">
      <input ref={ref} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
      {existingDoc ? (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          <div className="w-8 h-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center shrink-0 text-xs font-bold">
            {existingDoc.mime_type?.startsWith('image/')
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={existingDoc.url} alt="" className="w-full h-full object-cover rounded-lg" />
              : <span className="text-red-400">PDF</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-emerald-800 truncate">{existingDoc.original_name}</p>
            <p className="text-[10px] text-slate-400">{existingDoc.file_size ? `${Math.round(existingDoc.file_size / 1024)} KB` : ''}</p>
          </div>
          <button onClick={() => ref.current?.click()} disabled={uploading} className="text-[10px] font-bold text-emerald-700 px-2 py-1 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors">Replace</button>
          <button onClick={handleDelete} disabled={deleting} className="text-[10px] font-bold text-rose-500 px-2 py-1 bg-white border border-rose-100 rounded-lg hover:bg-rose-50 transition-colors">{deleting ? '…' : '✕'}</button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
          className="flex items-center gap-2 w-full px-3 py-2.5 border border-dashed border-amber-300 bg-amber-50/60 hover:bg-amber-100/60 rounded-xl transition-colors text-left group">
          {uploading
            ? <span className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin shrink-0" />
            : <span className="text-amber-500 text-sm shrink-0">📎</span>}
          <span className="text-[11px] font-semibold text-amber-700 group-hover:text-amber-900 transition-colors">
            {uploading ? 'Uploading…' : `Upload ${fieldLabel} Document`}
          </span>
        </button>
      )}
    </div>
  );
}

// ── Dynamic field ─────────────────────────────────────────────────────────────

function DynamicField({
  field, value, onChange, formId, existingDoc, onDocUploaded, onDocDeleted,
}: {
  field: TemplateField; value: string; onChange: (val: string) => void;
  formId: number; existingDoc?: AppDoc;
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
          formId={formId}
          existingDoc={existingDoc}
          onUploaded={onDocUploaded}
          onDeleted={onDocDeleted}
        />
      )}
    </div>
  );
}

// ── Standard doc upload slot ──────────────────────────────────────────────────

function DocSlot({ slot, doc, formId, onUploaded, onDeleted }: {
  slot: typeof DOC_SLOTS[0]; doc?: AppDoc; formId: number;
  onUploaded: (doc: AppDoc, progress: number) => void;
  onDeleted: (docId: number, progress: number) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('doc_type', slot.type);
    fd.append('label', slot.label);
    fd.append('file', await compressImage(file));
    try {
      const res = await api.post(`/branch-admin/application-forms/${formId}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onUploaded(res.data.document, res.data.progress);
    } catch { /* ignore */ }
    setUploading(false); e.target.value = '';
  }

  async function handleDelete() {
    if (!doc) return; setDeleting(true);
    try {
      const res = await api.delete(`/branch-admin/application-forms/${formId}/documents/${doc.id}`);
      onDeleted(doc.id, res.data.progress);
    } catch { /* ignore */ }
    setDeleting(false);
  }

  const isImg = doc?.mime_type?.startsWith('image/');
  const uploaded = !!doc;

  return (
    <div className={`rounded-2xl border-2 transition-all ${uploaded ? 'border-emerald-300 bg-emerald-50/40' : 'border-dashed border-slate-200 bg-slate-50/60 hover:border-green-300 hover:bg-green-50/30'}`}>
      <input ref={ref} type="file" accept={slot.accept} className="hidden" onChange={handleFile} />
      {uploaded ? (
        <div className="p-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-emerald-200 flex items-center justify-center shrink-0 text-xl">
            {isImg
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={doc!.url} alt="" className="w-full h-full object-cover" />
              : <span>📄</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-800">{slot.label}</p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">{doc!.original_name}</p>
            <p className="text-[10px] text-emerald-600 font-semibold">{doc!.file_size ? `${Math.round(doc!.file_size / 1024)} KB` : ''}</p>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <button onClick={() => ref.current?.click()} disabled={uploading}
              className="text-[10px] font-bold px-2 py-1 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors">Replace</button>
            <button onClick={handleDelete} disabled={deleting}
              className="text-[10px] font-bold px-2 py-1 bg-white border border-rose-200 text-rose-500 rounded-lg hover:bg-rose-50 transition-colors">{deleting ? '…' : 'Remove'}</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
          className="w-full p-4 flex items-center gap-3 text-left group">
          <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-xl group-hover:border-green-300 transition-colors shadow-sm">
            {uploading ? <span className="w-4 h-4 border-2 border-slate-300 border-t-green-600 rounded-full animate-spin" /> : slot.icon}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">{slot.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{slot.hint}</p>
          </div>
          <div className="ml-auto shrink-0">
            <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-green-100 flex items-center justify-center transition-colors">
              <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-500',
  submitted: 'bg-amber-100 text-amber-700',
};

// ── Main page ─────────────────────────────────────────────────────────────────

const EMPTY_CREATE = { prefix: '', name: '', email: '', phone: '', country: '', course: '', intake: '' };
type TableTab = 'submitted' | 'draft';

export default function BranchApplicantsPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const qc       = useQueryClient();
  const { data: countryData = {} } = useCountryData();
  const countryList = Object.keys(countryData);

  const isBranchAdmin = user?.roles?.some(r => r === 'branch_admin' || r === 'branch_manager');
  useEffect(() => {
    if (user && !isBranchAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isBranchAdmin, router]);

  const [tableTab,     setTableTab]     = useState<TableTab>('submitted');
  const [activeFormId, setActiveFormId] = useState<number | null>(null);
  const [createForm,   setCreateForm]   = useState(EMPTY_CREATE);
  const [createErr,    setCreateErr]    = useState('');
  const [showCreate,   setShowCreate]   = useState(false);
  const [fields,       setFields]       = useState<Partial<AppForm>>({});
  const [customData,   setCustomData]   = useState<Record<string, string>>({});
  const [saveMsg,      setSaveMsg]      = useState('');
  const [saveErr,      setSaveErr]      = useState('');

  const { data: forms = [], isLoading: formsLoading } = useQuery<AppForm[]>({
    queryKey: ['application-forms'],
    queryFn: () => api.get('/branch-admin/application-forms').then(r => r.data),
    enabled: !!isBranchAdmin,
  });

  const activeForm    = forms.find(f => f.id === activeFormId) ?? null;
  const activeCountry = activeForm?.target_country ?? '';

  const { data: template } = useQuery<FormTemplate | null>({
    queryKey: ['form-template', activeCountry],
    queryFn: () => activeCountry
      ? api.get(`/form-templates/${encodeURIComponent(activeCountry)}`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!activeCountry,
    staleTime: 300_000,
  });

  useEffect(() => {
    if (activeForm) { setFields(activeForm); setCustomData(activeForm.custom_data ?? {}); }
    else            { setFields({}); setCustomData({}); }
  }, [activeFormId]); // eslint-disable-line react-hooks/exhaustive-deps

  const createMut = useMutation({
    mutationFn: () => api.post('/branch-admin/application-forms', {
      student_name:   [createForm.prefix, createForm.name].filter(Boolean).join(' '),
      student_email:  createForm.email,
      student_phone:  createForm.phone,
      target_country: createForm.country,
      target_course:  createForm.course,
      target_intake:  createForm.intake || undefined,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['application-forms'] });
      setActiveFormId(res.data.id);
      setShowCreate(false);
      setCreateForm(EMPTY_CREATE);
      setCreateErr('');
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = ax.response?.data?.errors;
      setCreateErr(errs ? Object.values(errs).flat().join(' ') : ax.response?.data?.message ?? 'Failed.');
    },
  });

  const saveMut = useMutation({
    mutationFn: (data: Partial<AppForm>) =>
      api.patch(`/branch-admin/application-forms/${activeFormId}`, { ...data, custom_data: customData }),
    onSuccess: (res) => {
      qc.setQueryData(['application-forms'], (old: AppForm[] | undefined) =>
        old?.map(f => f.id === res.data.id ? res.data : f) ?? [res.data]);
      setSaveMsg('Saved ✓'); setTimeout(() => setSaveMsg(''), 2500);
      setSaveErr('');
    },
    onError: () => setSaveErr('Save failed. Try again.'),
  });

  const submitMut = useMutation({
    mutationFn: () => api.post(`/branch-admin/application-forms/${activeFormId}/submit`),
    onSuccess: (res) => {
      qc.setQueryData(['application-forms'], (old: AppForm[] | undefined) =>
        old?.map(f => f.id === res.data.form.id ? res.data.form : f) ?? []);
      setSaveMsg('Submitted to admin ✓');
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string } } };
      setSaveErr(ax.response?.data?.message ?? 'Submit failed.');
    },
  });

  const f = useCallback((key: keyof AppForm) => (
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setFields(prev => ({ ...prev, [key]: e.target.value }))
  ), []);

  function handleDocUploaded(doc: AppDoc, progress: number) {
    qc.setQueryData(['application-forms'], (old: AppForm[] | undefined) =>
      old?.map(form => form.id === activeFormId
        ? { ...form, progress, documents: [...form.documents.filter(d => d.doc_type !== doc.doc_type), doc] }
        : form) ?? []);
  }

  function handleDocDeleted(docId: number, progress: number) {
    qc.setQueryData(['application-forms'], (old: AppForm[] | undefined) =>
      old?.map(form => form.id === activeFormId
        ? { ...form, progress, documents: form.documents.filter(d => d.id !== docId) }
        : form) ?? []);
  }

  if (!user || !isBranchAdmin) return null;

  const progress  = activeForm?.progress ?? 0;
  const canSubmit = progress >= 50 && activeForm?.status === 'draft';
  const docs      = activeForm?.documents ?? [];
  const submitted = forms.filter(f => f.status === 'submitted');
  const drafts    = forms.filter(f => f.status === 'draft');

  // ── Conditional visibility check ──
  function isVisible(field: TemplateField): boolean {
    if (!field.conditional_field_key || !field.conditional_operator) return true;
    const cur = customData[field.conditional_field_key]
      ?? (fields as Record<string, string>)[field.conditional_field_key] ?? '';
    switch (field.conditional_operator) {
      case 'is':           return cur === (field.conditional_value ?? '');
      case 'is_not':       return cur !== (field.conditional_value ?? '');
      case 'is_empty':     return !cur;
      case 'is_not_empty': return !!cur;
      default:             return true;
    }
  }

  function colSpan(size: TemplateField['box_size']) {
    if (size === 'small') return 'col-span-6 sm:col-span-2';
    if (size === 'full')  return 'col-span-6';
    return 'col-span-6 sm:col-span-3';
  }

  function onFieldChange(field: TemplateField, val: string) {
    if (field.field_key.startsWith('custom_')) {
      setCustomData(p => ({ ...p, [field.field_key]: val }));
    } else {
      setFields(p => ({ ...p, [field.field_key]: val } as Partial<AppForm>));
    }
  }

  return (
    <BranchLayout title="Applications">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FORM AREA — always on top                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {activeFormId === null ? (

        /* ── No active form: starter card ── */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm mb-6 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">Application Form</h2>
                <p className="text-green-100 text-xs mt-1">Start a new student application or continue from the table below</p>
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

          {/* New application form */}
          {showCreate && (
            <div className="px-6 py-6 bg-slate-50/60 border-b border-slate-100">
              {createErr && (
                <div className="mb-4 flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-600">
                  <span className="shrink-0">⚠️</span> {createErr}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Student Name *</label>
                  <div className="flex gap-2">
                    <select className="border border-slate-200 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 bg-white w-[90px] shrink-0 transition-all"
                      value={createForm.prefix} onChange={e => setCreateForm(p => ({ ...p, prefix: e.target.value }))}>
                      <option value="">Title</option>
                      {NAME_PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <input className={inp} placeholder="Full name" value={createForm.name}
                      onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Email *</label>
                  <input className={inp} type="email" placeholder="student@email.com" value={createForm.email}
                    onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Phone *</label>
                  <input className={inp} type="tel" placeholder="+880 1XXX XXXXXX" value={createForm.phone}
                    onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Target Country *</label>
                  <select className={inp} value={createForm.country}
                    onChange={e => setCreateForm(p => ({ ...p, country: e.target.value }))}>
                    <option value="">Select country…</option>
                    {countryList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Course / Program</label>
                  <input className={inp} placeholder="e.g. Japanese Language" value={createForm.course}
                    onChange={e => setCreateForm(p => ({ ...p, course: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Target Intake <span className="font-normal text-slate-300 text-[10px]">(optional)</span></label>
                  <input className={inp} type="date" min={new Date().toISOString().slice(0, 10)}
                    value={createForm.intake} onChange={e => setCreateForm(p => ({ ...p, intake: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => createMut.mutate()}
                  disabled={createMut.isPending || !createForm.name || !createForm.email || !createForm.phone || !createForm.country}
                  className="flex items-center gap-2 px-6 py-3 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-2xl disabled:opacity-50 transition-all shadow-sm">
                  {createMut.isPending && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  🚀 Create & Open Form
                </button>
              </div>
            </div>
          )}

          {!showCreate && (
            <div className="px-6 py-8 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-3 text-2xl">📝</div>
              <p className="text-sm font-semibold text-slate-600">
                {formsLoading ? 'Loading applications…' : forms.length === 0
                  ? 'No applications yet — click New Application to start'
                  : 'Select an application from the table below to continue editing'}
              </p>
            </div>
          )}
        </div>

      ) : (

        /* ── Active form ── */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm mb-6 overflow-hidden">

          {/* Sticky header with progress */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-100 px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveFormId(null)}
                  className="w-9 h-9 rounded-2xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <p className="text-sm font-black text-slate-900">{activeForm?.student_name ?? '—'}</p>
                  <p className="text-[11px] text-slate-400 tracking-wide">{activeForm?.lead_code} · {activeForm?.target_country}</p>
                </div>
                {activeForm?.status === 'submitted' && (
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full">✓ SUBMITTED</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {saveMsg && <span className="text-xs font-bold text-emerald-600 animate-pulse">{saveMsg}</span>}
                {saveErr && <span className="text-xs text-rose-500">{saveErr}</span>}
                <button onClick={() => saveMut.mutate(fields)} disabled={saveMut.isPending}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl disabled:opacity-50 transition-colors">
                  {saveMut.isPending ? 'Saving…' : '💾 Save'}
                </button>
                {canSubmit && (
                  <button onClick={() => submitMut.mutate()} disabled={submitMut.isPending}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-all shadow-sm flex items-center gap-1.5">
                    {submitMut.isPending && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                    🚀 Submit to Admin
                  </button>
                )}
              </div>
            </div>
            <ProgressBar value={progress} />
          </div>

          {/* Form body */}
          <div className="px-6 py-8 space-y-10">

            {/* ── 1. Student Info ── */}
            <section>
              <SectionHead n={1} title="Student Information" subtitle="Basic contact details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Full Name</label>
                  <input className={`${inp} bg-slate-50 cursor-default`} value={activeForm?.student_name ?? ''} readOnly />
                </div>
                <div>
                  <label className={lbl}>Email</label>
                  <input className={`${inp} bg-slate-50 cursor-default`} value={activeForm?.student_email ?? ''} readOnly />
                </div>
                <div>
                  <label className={lbl}>Phone</label>
                  <input className={inp} value={fields.student_phone ?? ''} onChange={f('student_phone')} placeholder="+880 1XXX XXXXXX" />
                </div>
                <div>
                  <label className={lbl}>Target Country</label>
                  <input className={`${inp} bg-slate-50 cursor-default`} value={activeForm?.target_country ?? ''} readOnly />
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* ── Template Groups (dynamic from admin settings) ── */}
            {template && template.groups.length > 0 && template.groups.map((group, gi) => {
              const visibleFields = group.fields.filter(isVisible);
              if (visibleFields.length === 0) return null;
              return (
                <div key={group.id}>
                  <section>
                    <SectionHead n={gi + 2} title={group.label} subtitle={group.hint} />
                    <div className="grid grid-cols-6 gap-4">
                      {visibleFields.map(field => (
                        <div key={field.field_key} className={colSpan(field.box_size ?? 'middle')}>
                          <DynamicField
                            field={field}
                            formId={activeFormId!}
                            value={customData[field.field_key] ?? (fields as Record<string, string>)[field.field_key] ?? ''}
                            existingDoc={docs.find(d => d.doc_type === field.field_key)}
                            onDocUploaded={handleDocUploaded}
                            onDocDeleted={handleDocDeleted}
                            onChange={val => onFieldChange(field, val)}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                  <hr className="border-slate-100 mt-10" />
                </div>
              );
            })}

            {/* Legacy ungrouped fields fallback */}
            {template && template.groups.length === 0 && template.fields.length > 0 && (
              <section>
                <SectionHead title={`${activeCountry} — Additional Fields`} subtitle="Country-specific requirements" icon="🌐" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {template.fields.filter(isVisible).map(field => (
                    <div key={field.field_key} className={field.field_type === 'textarea' || field.requires_document ? 'sm:col-span-2' : ''}>
                      <DynamicField
                        field={field} formId={activeFormId!}
                        value={customData[field.field_key] ?? (fields as Record<string, string>)[field.field_key] ?? ''}
                        existingDoc={docs.find(d => d.doc_type === field.field_key)}
                        onDocUploaded={handleDocUploaded} onDocDeleted={handleDocDeleted}
                        onChange={val => onFieldChange(field, val)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Intake quick-pick */}
            {template && template.intake_options?.length > 0 && (
              <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-4">
                <p className="text-xs font-bold text-green-800 mb-3">📅 Available Intakes for {activeCountry}</p>
                <div className="flex flex-wrap gap-2">
                  {template.intake_options.map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setFields(p => ({ ...p, target_intake: opt }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${fields.target_intake === opt ? 'bg-green-700 text-white border-green-700' : 'bg-white border-green-200 text-green-700 hover:bg-green-100'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <hr className="border-slate-100" />

            {/* ── Documents ── */}
            <section>
              <SectionHead title="Documents Upload" subtitle="Images auto-compressed to ~300–500 KB for fast loading" icon="📁" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DOC_SLOTS.map(slot => (
                  <DocSlot key={slot.type} slot={slot}
                    doc={docs.find(d => d.doc_type === slot.type)}
                    formId={activeFormId!}
                    onUploaded={handleDocUploaded}
                    onDeleted={handleDocDeleted} />
                ))}
              </div>
            </section>

            {/* ── Bottom actions ── */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button onClick={() => saveMut.mutate(fields)} disabled={saveMut.isPending}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold disabled:opacity-50 transition-colors">
                {saveMut.isPending ? 'Saving…' : '💾 Save Progress'}
              </button>
              {canSubmit ? (
                <button onClick={() => submitMut.mutate()} disabled={submitMut.isPending}
                  className="flex-1 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl text-sm font-bold disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2">
                  {submitMut.isPending && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  🚀 Submit Application to Admin
                </button>
              ) : (
                <div className="flex-1 py-3.5 bg-slate-50 border border-dashed border-slate-200 text-slate-400 rounded-2xl text-sm font-semibold text-center">
                  Submit unlocks at 50% — currently {progress}%
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TABLE — only visible when no form is open                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {activeFormId === null && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-sm">All Applications</h3>
              <p className="text-xs text-slate-400 mt-0.5">{forms.length} total · click any row to continue editing</p>
            </div>
            <div className="flex gap-1.5">
              {(['submitted', 'draft'] as TableTab[]).map(t => (
                <button key={t} onClick={() => setTableTab(t)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${tableTab === t ? 'bg-green-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {t === 'submitted' ? `✓ Submitted (${submitted.length})` : `⏳ In Progress (${drafts.length})`}
                </button>
              ))}
            </div>
          </div>

          {formsLoading ? (
            <div className="py-20 text-center">
              <span className="w-8 h-8 border-3 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" />
            </div>
          ) : (tableTab === 'submitted' ? submitted : drafts).length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-4xl mb-3">{tableTab === 'submitted' ? '📬' : '📝'}</div>
              <p className="text-sm font-semibold text-slate-500">
                {tableTab === 'submitted' ? 'No submitted applications yet' : 'No applications in progress'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Click "New Application" above to get started</p>
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
                    <th className="text-left px-4 py-3 hidden md:table-cell">Intake</th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">Updated</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(tableTab === 'submitted' ? submitted : drafts).map(form => (
                    <tr key={form.id} onClick={() => setActiveFormId(form.id)}
                      className="hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer group">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">{form.lead_code}</span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-800 text-xs">{form.student_name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{form.student_email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${form.progress >= 80 ? 'bg-emerald-500' : form.progress >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                              style={{ width: `${form.progress}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-600">{form.progress}%</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[form.status]}`}>
                          {form.status === 'submitted' ? '✓ Submitted' : '⏳ In Progress'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500 hidden sm:table-cell">{form.target_country || '—'}</td>
                      <td className="px-4 py-4 text-xs text-slate-400 hidden md:table-cell">
                        {form.target_intake
                          ? (/^\d{4}-\d{2}-\d{2}/.test(form.target_intake)
                              ? new Date(form.target_intake).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
                              : form.target_intake)
                          : '—'}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400 hidden lg:table-cell">
                        {new Date(form.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-bold text-green-700 group-hover:text-green-900 transition-colors whitespace-nowrap">
                          Open →
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </BranchLayout>
  );
}
