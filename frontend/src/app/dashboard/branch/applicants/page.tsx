'use client';
import BranchLayout from '@/components/shared/BranchLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useCountryData } from '@/hooks/useCountryData';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AppDoc {
  id: number; doc_type: string; label: string;
  url: string; original_name: string; file_size: number; mime_type: string;
}

// ── Template types ─────────────────────────────────────────────────────────────

interface TemplateField {
  id: number; field_key: string; label: string; section: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file';
  is_required: boolean; requires_document: boolean;
  options: string[]; placeholder: string; helper_text: string;
}

interface FormTemplate {
  id: number; country: string; name: string;
  intake_options: string[];
  fields: TemplateField[];
}

interface AppForm {
  id: number; lead_id: number; lead_code: string;
  status: 'draft' | 'submitted'; progress: number;
  submitted_at: string | null; created_at: string; updated_at: string;
  // student
  student_name: string; student_email: string; student_phone: string;
  // personal
  date_of_birth: string; gender: string; nationality: string;
  address: string; passport_number: string; passport_expiry: string;
  // academic
  last_qualification: string; institution_name: string;
  board_university: string; gpa_grade: string; passing_year: number;
  // language
  jlpt_level: string; jlpt_score: string; jlpt_exam_date: string;
  english_proficiency: string; english_score: string;
  // study
  target_country: string; target_course: string; target_intake: string;
  preferred_institution: string; preferred_cities: string[];
  // sponsor
  sponsor_name: string; sponsor_relationship: string;
  sponsor_occupation: string; sponsor_monthly_income: string;
  // docs
  documents: AppDoc[];
  // custom template fields
  custom_data: Record<string, string>;
}

// ── Image compression (client-side) ───────────────────────────────────────────

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

const NAME_PREFIXES  = ['Mr.', 'Ms.', 'Mrs.', 'Md.', 'Dr.', 'Prof.'];
const QUALIFICATIONS = ['SSC', 'HSC', 'Diploma', 'Bachelor', 'Masters', 'PhD', 'Other'];
const JLPT_LEVELS    = ['N1', 'N2', 'N3', 'N4', 'N5', 'None', 'Preparing'];
const ENGLISH_TESTS  = ['IELTS', 'TOEFL', 'Duolingo', 'None'];
const SPONSOR_RELS   = ['Father', 'Mother', 'Spouse', 'Sibling', 'Self', 'Other'];

const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white transition-colors';
const lbl = 'block text-xs font-semibold text-slate-500 mb-1.5';

const DOC_SLOTS: { type: string; label: string; accept: string; hint: string }[] = [
  { type: 'photo',         label: 'Passport-Size Photo',   accept: 'image/*', hint: 'JPG/PNG, white background' },
  { type: 'passport',      label: 'Passport Copy',         accept: 'image/*,application/pdf', hint: 'All pages, clear scan' },
  { type: 'certificate',   label: 'Academic Certificate',  accept: 'image/*,application/pdf', hint: 'Latest certificate' },
  { type: 'transcript',    label: 'Academic Transcript',   accept: 'image/*,application/pdf', hint: 'Mark sheet / grade sheet' },
  { type: 'language_cert', label: 'Language Certificate',  accept: 'image/*,application/pdf', hint: 'JLPT / IELTS / TOEFL' },
  { type: 'nid',           label: 'NID / Birth Certificate',accept: 'image/*,application/pdf', hint: 'National ID or birth certificate' },
  { type: 'bank_statement',label: 'Bank Statement',        accept: 'image/*,application/pdf', hint: 'Last 6 months (sponsor)' },
  { type: 'sponsor',       label: 'Sponsor Document',      accept: 'image/*,application/pdf', hint: 'Job cert / income proof' },
];

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-600">Form Completion</span>
        <span className={`text-sm font-bold ${value >= 50 ? 'text-green-700' : 'text-slate-500'}`}>{value}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
      {value < 50 && (
        <p className="text-[11px] text-slate-400 mt-1">Fill at least <strong>50%</strong> to submit application</p>
      )}
    </div>
  );
}

// ── Document upload slot ───────────────────────────────────────────────────────

function DocSlot({
  slot, doc, formId, onUploaded, onDeleted,
}: {
  slot: typeof DOC_SLOTS[0];
  doc?: AppDoc;
  formId: number;
  onUploaded: (doc: AppDoc, progress: number) => void;
  onDeleted: (docId: number, progress: number) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const processed = await compressImage(file);
    const fd = new FormData();
    fd.append('doc_type', slot.type);
    fd.append('label', slot.label);
    fd.append('file', processed);
    try {
      const res = await api.post(`/branch-admin/application-forms/${formId}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploaded(res.data.document, res.data.progress);
    } catch { /* ignore */ }
    setUploading(false);
    e.target.value = '';
  }

  async function handleDelete() {
    if (!doc) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/branch-admin/application-forms/${formId}/documents/${doc.id}`);
      onDeleted(doc.id, res.data.progress);
    } catch { /* ignore */ }
    setDeleting(false);
  }

  const isImg = doc?.mime_type?.startsWith('image/');

  return (
    <div className={`relative rounded-2xl border-2 transition-all ${doc ? 'border-green-300 bg-green-50/50' : 'border-dashed border-slate-200 bg-slate-50 hover:border-green-300 hover:bg-green-50/30'}`}>
      <input ref={ref} type="file" accept={slot.accept} className="hidden" onChange={handleFile} />

      {doc ? (
        <div className="p-3 flex items-start gap-3">
          {/* Thumbnail or icon */}
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-green-200 flex items-center justify-center shrink-0">
            {isImg
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={doc.url} alt="" className="w-full h-full object-cover" />
              : <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path d="M4 18h12a1 1 0 001-1V7l-5-5H4a1 1 0 00-1 1v14a1 1 0 001 1zm7-14l4 4h-4V4z"/></svg>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-green-800">{slot.label}</p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">{doc.original_name}</p>
            <p className="text-[10px] text-slate-400">{doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : ''}</p>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <button onClick={() => ref.current?.click()} disabled={uploading}
              className="text-[10px] font-semibold px-2 py-1 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors">
              Replace
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="text-[10px] font-semibold px-2 py-1 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
              {deleting ? '…' : 'Remove'}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
          className="w-full p-4 flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
            {uploading
              ? <span className="w-4 h-4 border-2 border-slate-400 border-t-green-600 rounded-full animate-spin" />
              : <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
            }
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">{slot.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{slot.hint}</p>
          </div>
        </button>
      )}
    </div>
  );
}

// ── Section heading ────────────────────────────────────────────────────────────

function SectionHead({ n, title, subtitle }: { n: number; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-8 h-8 rounded-full bg-green-700 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</div>
      <div>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

// ── Dynamic field renderer ────────────────────────────────────────────────────

function DynamicField({
  field, value, onChange, formId, existingDoc, onDocUploaded, onDocDeleted,
}: {
  field: TemplateField;
  value: string;
  onChange: (val: string) => void;
  formId: number;
  existingDoc?: AppDoc;
  onDocUploaded: (doc: AppDoc, progress: number) => void;
  onDocDeleted:  (docId: number, progress: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting,  setDeleting]  = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const processed = await compressImage(file);
    const fd = new FormData();
    fd.append('doc_type', field.field_key);
    fd.append('label',    field.label);
    fd.append('file',     processed);
    try {
      const res = await api.post(`/branch-admin/application-forms/${formId}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onDocUploaded(res.data.document, res.data.progress);
    } catch { /* ignore */ }
    setUploading(false);
    e.target.value = '';
  }

  async function handleDelete() {
    if (!existingDoc) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/branch-admin/application-forms/${formId}/documents/${existingDoc.id}`);
      onDocDeleted(existingDoc.id, res.data.progress);
    } catch { /* ignore */ }
    setDeleting(false);
  }

  return (
    <div>
      <label className={lbl}>
        {field.label}
        {field.is_required
          ? <span className="text-red-400 ml-0.5">*</span>
          : <span className="font-normal text-slate-300 ml-1">(optional)</span>}
        {field.requires_document && (
          <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">📎 doc required</span>
        )}
      </label>

      {/* Input */}
      {field.field_type === 'select' ? (
        <select className={inp} value={value} onChange={e => onChange(e.target.value)} required={field.is_required}>
          <option value="">{field.placeholder || 'Select…'}</option>
          {(field.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : field.field_type === 'textarea' ? (
        <textarea className={`${inp} resize-none`} rows={3} value={value} placeholder={field.placeholder ?? ''}
          onChange={e => onChange(e.target.value)} required={field.is_required} />
      ) : (
        <input className={inp}
          type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
          value={value} placeholder={field.placeholder ?? ''}
          onChange={e => onChange(e.target.value)} required={field.is_required} />
      )}

      {field.helper_text && <p className="text-[11px] text-slate-400 mt-1">{field.helper_text}</p>}

      {/* Inline document upload — only when requires_document */}
      {field.requires_document && (
        <div className="mt-2">
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
          {existingDoc ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              <div className="w-7 h-7 rounded-lg bg-white border border-green-200 flex items-center justify-center shrink-0">
                {existingDoc.mime_type?.startsWith('image/')
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={existingDoc.url} alt="" className="w-full h-full object-cover rounded-lg" />
                  : <span className="text-[10px] text-red-400 font-bold">PDF</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-green-800 truncate">{existingDoc.original_name}</p>
                <p className="text-[10px] text-slate-400">{existingDoc.file_size ? `${Math.round(existingDoc.file_size / 1024)} KB` : ''}</p>
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="text-[10px] font-bold text-green-700 hover:text-green-900 px-2 py-1 bg-white border border-green-200 rounded-lg transition-colors shrink-0">
                Replace
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="text-[10px] font-bold text-red-500 hover:text-red-700 px-2 py-1 bg-white border border-red-100 rounded-lg transition-colors shrink-0">
                {deleting ? '…' : '✕'}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 w-full px-3 py-2 border border-dashed border-amber-300 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors text-left">
              {uploading
                ? <span className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin shrink-0" />
                : <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
              }
              <span className="text-[11px] font-semibold text-amber-700">
                {uploading ? 'Uploading…' : `Upload ${field.label} Document`}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Template section ──────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  personal:  'Personal Information',
  academic:  'Academic Background',
  language:  'Language Proficiency',
  study:     'Study Goals & Intake',
  sponsor:   'Sponsor & Financial',
  documents: 'Documents Upload',
};

const SECTION_SUBTITLES: Record<string, string> = {
  personal:  'Country-specific personal details required',
  academic:  'Academic requirements for this country',
  language:  'Language test requirements',
  study:     'Target program and intake details',
  sponsor:   'Financial sponsorship details',
  documents: 'Additional documents required for this country',
};

// ── Status badge ──────────────────────────────────────────────────────────────

const SUB_COLORS: Record<string, string> = {
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

  // ── State ──
  const [tableTab,     setTableTab]     = useState<TableTab>('submitted');
  const [activeFormId, setActiveFormId] = useState<number | null>(null); // null = create new
  const [createForm,   setCreateForm]   = useState(EMPTY_CREATE);
  const [createErr,    setCreateErr]    = useState('');
  const [showCreate,   setShowCreate]   = useState(false);

  // Fields for the detailed form (edit existing)
  const [fields,     setFields]     = useState<Partial<AppForm>>({});
  const [customData, setCustomData] = useState<Record<string, string>>({});
  const [saveMsg,    setSaveMsg]    = useState('');
  const [saveErr,    setSaveErr]    = useState('');

  // ── Queries ──
  const { data: forms = [], isLoading: formsLoading } = useQuery<AppForm[]>({
    queryKey: ['application-forms'],
    queryFn: () => api.get('/branch-admin/application-forms').then(r => r.data),
    enabled: !!isBranchAdmin,
  });

  const activeForm = forms.find(f => f.id === activeFormId) ?? null;

  // ── Template query (depends on active form's country) ──
  const activeCountry = activeForm?.target_country ?? '';
  const { data: template } = useQuery<FormTemplate | null>({
    queryKey: ['form-template', activeCountry],
    queryFn: () => activeCountry
      ? api.get(`/form-templates/${encodeURIComponent(activeCountry)}`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!activeCountry,
    staleTime: 300_000,
  });

  // Load active form fields when switching
  useEffect(() => {
    if (activeForm) {
      setFields(activeForm);
      setCustomData(activeForm.custom_data ?? {});
    } else {
      setFields({});
      setCustomData({});
    }
  }, [activeFormId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mutations ──
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
      setSaveMsg('Saved ✓'); setTimeout(() => setSaveMsg(''), 2000);
      setSaveErr('');
    },
    onError: () => setSaveErr('Save failed. Try again.'),
  });

  const submitMut = useMutation({
    mutationFn: () => api.post(`/branch-admin/application-forms/${activeFormId}/submit`),
    onSuccess: (res) => {
      qc.setQueryData(['application-forms'], (old: AppForm[] | undefined) =>
        old?.map(f => f.id === res.data.form.id ? res.data.form : f) ?? []);
      setSaveMsg('Submitted successfully! ✓');
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

  return (
    <BranchLayout title="Applications">

      {/* ── Active form or picker ── */}
      {!activeFormId ? (
        /* Pick existing or create new */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Application Form</h2>
              <p className="text-xs text-slate-400 mt-0.5">Select an existing application to continue, or start a new one</p>
            </div>
            <button onClick={() => setShowCreate(s => !s)}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-xl transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Application
            </button>
          </div>

          {showCreate && (
            <div className="px-6 py-5 border-b border-slate-100 bg-green-50/40">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Start New Application</h3>
              {createErr && <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">⚠️ {createErr}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Student Name *</label>
                  <div className="flex gap-2">
                    <select className="border border-slate-200 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white w-[88px] shrink-0"
                      value={createForm.prefix} onChange={e => setCreateForm(p => ({ ...p, prefix: e.target.value }))}>
                      <option value="">Title</option>
                      {NAME_PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <input className={inp} placeholder="Full name" value={createForm.name}
                      onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Email *</label>
                  <input className={inp} type="email" placeholder="student@example.com" value={createForm.email}
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
                  <label className={lbl}>Target Intake</label>
                  <input className={inp} type="date" min={new Date().toISOString().slice(0, 10)}
                    value={createForm.intake} onChange={e => setCreateForm(p => ({ ...p, intake: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => createMut.mutate()} disabled={createMut.isPending || !createForm.name || !createForm.email || !createForm.phone || !createForm.country}
                  className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2">
                  {createMut.isPending && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  Create & Start Filling
                </button>
                <button onClick={() => { setShowCreate(false); setCreateErr(''); setCreateForm(EMPTY_CREATE); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="px-6 py-4 text-sm text-slate-400 text-center">
            {formsLoading ? 'Loading…' : forms.length === 0
              ? 'No applications yet. Click "New Application" to start.'
              : `${forms.length} application${forms.length > 1 ? 's' : ''} — select one from the table below to continue editing`}
          </div>
        </div>

      ) : (
        /* ── ACTIVE FORM ── */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6 overflow-hidden">

          {/* Sticky progress bar header */}
          <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveFormId(null)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <p className="text-sm font-bold text-slate-900">{activeForm?.student_name ?? '—'}</p>
                  <p className="text-xs text-slate-400">{activeForm?.lead_code} · {activeForm?.target_country}</p>
                </div>
                {activeForm?.status === 'submitted' && (
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full">SUBMITTED</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {saveMsg && <span className="text-xs font-semibold text-green-600">{saveMsg}</span>}
                {saveErr && <span className="text-xs text-red-500">{saveErr}</span>}
                <button onClick={() => saveMut.mutate(fields)} disabled={saveMut.isPending}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl disabled:opacity-50 transition-colors">
                  {saveMut.isPending ? 'Saving…' : 'Save Draft'}
                </button>
                {canSubmit && (
                  <button onClick={() => submitMut.mutate()} disabled={submitMut.isPending}
                    className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors flex items-center gap-1.5">
                    {submitMut.isPending && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                    Submit to Admin
                  </button>
                )}
              </div>
            </div>
            <ProgressBar value={progress} />
          </div>

          <div className="px-6 py-6 space-y-10">

            {/* ── Section 1: Personal Information ── */}
            <section>
              <SectionHead n={1} title="Personal Information" subtitle="Basic details about the student" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Full Name</label>
                  <input className={`${inp} bg-slate-50`} value={activeForm?.student_name ?? ''} readOnly />
                </div>
                <div>
                  <label className={lbl}>Email</label>
                  <input className={`${inp} bg-slate-50`} value={activeForm?.student_email ?? ''} readOnly />
                </div>
                <div>
                  <label className={lbl}>Phone</label>
                  <input className={inp} value={fields.student_phone ?? ''} onChange={f('student_phone')} placeholder="+880 1XXX XXXXXX" />
                </div>
                <div>
                  <label className={lbl}>Date of Birth</label>
                  <input className={inp} type="date" value={fields.date_of_birth ?? ''} onChange={f('date_of_birth')} />
                </div>
                <div>
                  <label className={lbl}>Gender</label>
                  <select className={inp} value={fields.gender ?? ''} onChange={f('gender')}>
                    <option value="">Select…</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Nationality</label>
                  <input className={inp} placeholder="e.g. Bangladeshi" value={fields.nationality ?? ''} onChange={f('nationality')} />
                </div>
                <div className="sm:col-span-2">
                  <label className={lbl}>Permanent Address</label>
                  <input className={inp} placeholder="House, Road, City" value={fields.address ?? ''} onChange={f('address')} />
                </div>
                <div>
                  <label className={lbl}>Passport Number</label>
                  <input className={inp} placeholder="e.g. BA0123456" value={fields.passport_number ?? ''} onChange={f('passport_number')} />
                </div>
                <div>
                  <label className={lbl}>Passport Expiry Date</label>
                  <input className={inp} type="date" value={fields.passport_expiry ?? ''} onChange={f('passport_expiry')} />
                </div>
              </div>
            </section>

            <div className="border-t border-slate-100" />

            {/* ── Section 2: Academic Background ── */}
            <section>
              <SectionHead n={2} title="Academic Background" subtitle="Education history and qualifications" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Last Qualification</label>
                  <select className={inp} value={fields.last_qualification ?? ''} onChange={f('last_qualification')}>
                    <option value="">Select…</option>
                    {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Institution / School Name</label>
                  <input className={inp} placeholder="e.g. Dhaka College" value={fields.institution_name ?? ''} onChange={f('institution_name')} />
                </div>
                <div>
                  <label className={lbl}>Board / University</label>
                  <input className={inp} placeholder="e.g. Dhaka Board / DU" value={fields.board_university ?? ''} onChange={f('board_university')} />
                </div>
                <div>
                  <label className={lbl}>GPA / Grade / Marks</label>
                  <input className={inp} placeholder="e.g. 4.50 / A+ / 85%" value={fields.gpa_grade ?? ''} onChange={f('gpa_grade')} />
                </div>
                <div>
                  <label className={lbl}>Passing Year</label>
                  <input className={inp} type="number" min={1990} max={2030} placeholder="e.g. 2022" value={fields.passing_year ?? ''} onChange={f('passing_year')} />
                </div>
              </div>
            </section>

            <div className="border-t border-slate-100" />

            {/* ── Section 3: Language Proficiency ── */}
            <section>
              <SectionHead n={3} title="Language Proficiency" subtitle="Japanese and English test scores" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>JLPT Level</label>
                  <select className={inp} value={fields.jlpt_level ?? ''} onChange={f('jlpt_level')}>
                    <option value="">Select…</option>
                    {JLPT_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>JLPT Score <span className="font-normal text-slate-300">(if applicable)</span></label>
                  <input className={inp} placeholder="e.g. 108/180" value={fields.jlpt_score ?? ''} onChange={f('jlpt_score')} />
                </div>
                <div>
                  <label className={lbl}>JLPT Exam Date <span className="font-normal text-slate-300">(if applicable)</span></label>
                  <input className={inp} type="date" value={fields.jlpt_exam_date ?? ''} onChange={f('jlpt_exam_date')} />
                </div>
                <div>
                  <label className={lbl}>English Proficiency</label>
                  <select className={inp} value={fields.english_proficiency ?? ''} onChange={f('english_proficiency')}>
                    <option value="">Select…</option>
                    {ENGLISH_TESTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>English Score <span className="font-normal text-slate-300">(if applicable)</span></label>
                  <input className={inp} placeholder="e.g. IELTS 6.5" value={fields.english_score ?? ''} onChange={f('english_score')} />
                </div>
              </div>
            </section>

            <div className="border-t border-slate-100" />

            {/* ── Section 4: Study Goals & Intake ── */}
            <section>
              <SectionHead n={4} title="Study Goals & Intake" subtitle="Target destination and course details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Target Country *</label>
                  <select className={inp} value={fields.target_country ?? ''} onChange={f('target_country')}>
                    <option value="">Select country…</option>
                    {countryList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Course / Program</label>
                  <input className={inp} placeholder="e.g. Japanese Language, N2" value={fields.target_course ?? ''} onChange={f('target_course')} />
                </div>
                <div>
                  <label className={lbl}>Target Intake Date</label>
                  <input className={inp} type="date" min={new Date().toISOString().slice(0, 10)}
                    value={fields.target_intake ?? ''} onChange={f('target_intake')} />
                </div>
                <div>
                  <label className={lbl}>Preferred Institution</label>
                  <input className={inp} placeholder="e.g. Tokyo Japanese School" value={fields.preferred_institution ?? ''} onChange={f('preferred_institution')} />
                </div>
              </div>
            </section>

            <div className="border-t border-slate-100" />

            {/* ── Section 5: Sponsor / Financial ── */}
            <section>
              <SectionHead n={5} title="Sponsor & Financial" subtitle="Who will financially support this student" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Sponsor Name</label>
                  <input className={inp} placeholder="Full name of sponsor" value={fields.sponsor_name ?? ''} onChange={f('sponsor_name')} />
                </div>
                <div>
                  <label className={lbl}>Relationship to Student</label>
                  <select className={inp} value={fields.sponsor_relationship ?? ''} onChange={f('sponsor_relationship')}>
                    <option value="">Select…</option>
                    {SPONSOR_RELS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Sponsor Occupation</label>
                  <input className={inp} placeholder="e.g. Business Owner, Govt. Employee" value={fields.sponsor_occupation ?? ''} onChange={f('sponsor_occupation')} />
                </div>
                <div>
                  <label className={lbl}>Monthly Income (approx.)</label>
                  <input className={inp} placeholder="e.g. BDT 50,000" value={fields.sponsor_monthly_income ?? ''} onChange={f('sponsor_monthly_income')} />
                </div>
              </div>
            </section>

            {/* ── Dynamic Template Sections ── */}
            {template && template.fields.length > 0 && (() => {
              // Group fields by section, exclude sections we already render above
              const STANDARD_SECTIONS = new Set(['personal', 'academic', 'language', 'study', 'sponsor']);
              const allSections = [...new Set(template.fields.map(f => f.section))];

              return allSections.map((section, si) => {
                const sectionFields = template.fields.filter(f => f.section === section);
                const isStandard = STANDARD_SECTIONS.has(section);

                // For standard sections, only show fields not already in the static form
                const STANDARD_KEYS = new Set([
                  'date_of_birth','gender','nationality','address','passport_number','passport_expiry',
                  'last_qualification','institution_name','board_university','gpa_grade','passing_year',
                  'jlpt_level','jlpt_score','jlpt_exam_date','english_proficiency','english_score',
                  'target_country','target_course','target_intake','preferred_institution',
                  'sponsor_name','sponsor_relationship','sponsor_occupation','sponsor_monthly_income',
                ]);

                const extraFields = isStandard
                  ? sectionFields.filter(f => !STANDARD_KEYS.has(f.field_key))
                  : sectionFields;

                if (extraFields.length === 0) return null;

                return (
                  <div key={section}>
                    <div className="border-t border-slate-100 mb-8" />
                    <section>
                      <div className="flex items-start gap-3 mb-5">
                        <div className="px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold shrink-0">
                          {activeCountry}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">
                            {SECTION_LABELS[section] ?? section} — {activeCountry} specific
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {SECTION_SUBTITLES[section] ?? 'Additional requirements for this country'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {extraFields.map(field => (
                          <div key={field.field_key} className={field.field_type === 'textarea' || field.requires_document ? 'sm:col-span-2' : ''}>
                            <DynamicField
                              field={field}
                              formId={activeFormId!}
                              value={customData[field.field_key] ?? (fields as Record<string, string>)[field.field_key] ?? ''}
                              existingDoc={docs.find(d => d.doc_type === field.field_key)}
                              onDocUploaded={handleDocUploaded}
                              onDocDeleted={handleDocDeleted}
                              onChange={val => {
                                if (field.field_key.startsWith('custom_')) {
                                  setCustomData(p => ({ ...p, [field.field_key]: val }));
                                } else {
                                  setFields(p => ({ ...p, [field.field_key]: val } as Partial<AppForm>));
                                }
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                );
              });
            })()}

            {/* intake options from template */}
            {template && template.intake_options?.length > 0 && !fields.target_intake && (
              <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 -mt-4">
                <p className="text-xs font-semibold text-green-800 mb-2">
                  Available Intakes for {activeCountry}
                </p>
                <div className="flex flex-wrap gap-2">
                  {template.intake_options.map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setFields(p => ({ ...p, target_intake: opt }))}
                      className="px-3 py-1 bg-white border border-green-200 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors">
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-slate-100" />

            {/* ── Section 6: Documents ── */}
            <section>
              <SectionHead n={6} title="Documents Upload" subtitle="Upload required files — images auto-compressed to ~300–500 KB" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DOC_SLOTS.map(slot => {
                  const existing = docs.find(d => d.doc_type === slot.type);
                  return (
                    <DocSlot key={slot.type} slot={slot} doc={existing}
                      formId={activeFormId!}
                      onUploaded={handleDocUploaded}
                      onDeleted={handleDocDeleted} />
                  );
                })}
              </div>
            </section>

            {/* ── Bottom action bar ── */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-2">
              <button onClick={() => saveMut.mutate(fields)} disabled={saveMut.isPending}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
                {saveMut.isPending ? 'Saving…' : '💾 Save Progress'}
              </button>
              {canSubmit ? (
                <button onClick={() => submitMut.mutate()} disabled={submitMut.isPending}
                  className="flex-1 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {submitMut.isPending && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  🚀 Submit Application to Admin
                </button>
              ) : (
                <div className="flex-1 py-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl text-sm font-bold text-center">
                  Submit available at 50% · currently {progress}%
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Applications Table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">All Applications</h3>
          <div className="flex gap-1">
            {(['submitted', 'draft'] as TableTab[]).map(t => (
              <button key={t} onClick={() => setTableTab(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${tableTab === t ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {t === 'submitted' ? `Submitted (${submitted.length})` : `In Progress (${drafts.length})`}
              </button>
            ))}
          </div>
        </div>

        {formsLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading…</div>
        ) : (tableTab === 'submitted' ? submitted : drafts).length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm">
              {tableTab === 'submitted' ? 'No submitted applications yet.' : 'No applications in progress.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500">
                  <th className="text-left px-5 py-3">Code</th>
                  <th className="text-left px-4 py-3">Student</th>
                  <th className="text-left px-4 py-3">Progress</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Country</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Intake</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Updated</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(tableTab === 'submitted' ? submitted : drafts).map(form => (
                  <tr key={form.id}
                    onClick={() => setActiveFormId(form.id)}
                    className="hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer">
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{form.lead_code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800 text-xs">{form.student_name}</p>
                      <p className="text-[11px] text-slate-400">{form.student_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${form.progress >= 80 ? 'bg-green-500' : form.progress >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${form.progress}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-600">{form.progress}%</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${SUB_COLORS[form.status]}`}>
                        {form.status === 'submitted' ? 'Submitted' : 'In Progress'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{form.target_country || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell">
                      {form.target_intake ? new Date(form.target_intake).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">
                      {new Date(form.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-green-700 whitespace-nowrap">Continue →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </BranchLayout>
  );
}
