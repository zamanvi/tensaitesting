'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';

interface OcrJob {
  id: number;
  document_type: string;
  status: string;
  confidence_score: number | null;
  created_at: string;
  failure_reason: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  queued: 'bg-slate-100 text-slate-600',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  review_requested: 'bg-amber-100 text-amber-700',
  manually_approved: 'bg-purple-100 text-purple-700',
};

export default function DocumentsPage() {
  const { t, lang } = useLang();
  const sd = t.studentDocs;
  const docTypes = t.docTypes;

  const GROUPS = [
    {
      label: lang === 'bn' ? 'পরিচয় ও পারিবারিক কাগজপত্র' : lang === 'ja' ? '本人確認・家族書類' : 'Identity & Family Documents',
      docs: [
        { value: 'passport',                  label: docTypes.passport },
        { value: 'nid_student',               label: docTypes.nid_student },
        { value: 'birth_certificate_student', label: docTypes.birth_certificate_student },
        { value: 'student_photo',             label: docTypes.student_photo },
        { value: 'sponsor_photo',             label: docTypes.sponsor_photo },
        { value: 'father_birth_certificate',  label: docTypes.father_birth_certificate },
        { value: 'father_nid',                label: docTypes.father_nid },
        { value: 'mother_birth_certificate',  label: docTypes.mother_birth_certificate },
        { value: 'mother_nid',                label: docTypes.mother_nid },
      ],
    },
    {
      label: lang === 'bn' ? 'একাডেমিক কাগজপত্র' : lang === 'ja' ? '学術書類' : 'Academic Documents',
      docs: [
        { value: 'ssc_certificate',    label: docTypes.ssc_certificate },
        { value: 'ssc_marksheet',      label: docTypes.ssc_marksheet },
        { value: 'hsc_certificate',    label: docTypes.hsc_certificate },
        { value: 'hsc_marksheet',      label: docTypes.hsc_marksheet },
        { value: 'degree_certificate', label: docTypes.degree_certificate },
        { value: 'transcript',         label: docTypes.transcript },
      ],
    },
    {
      label: lang === 'bn' ? 'ভাষা সার্টিফিকেট' : lang === 'ja' ? '語学証明書' : 'Language Certificates',
      docs: [
        { value: 'jlpt_certificate',  label: docTypes.jlpt_certificate },
        { value: 'jlpt_marksheet',    label: docTypes.jlpt_marksheet },
        { value: 'nat_certificate',   label: docTypes.nat_certificate },
        { value: 'nat_marksheet',     label: docTypes.nat_marksheet },
        { value: 'ielts_certificate', label: docTypes.ielts_certificate },
      ],
    },
  ];

  const ALL_DOCS = GROUPS.flatMap(g => g.docs);

  const [docType, setDocType] = useState('passport');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const NO_FILE_MSG = lang === 'bn' ? 'আগে একটি ফাইল বেছে নিন।' : lang === 'ja' ? 'ファイルを選択してください。' : 'Please select a file first.';
  const FILE_HINT  = lang === 'bn' ? 'ছবি অথবা PDF (সর্বোচ্চ ১০MB)' : lang === 'ja' ? '画像またはPDF（最大10MB）' : 'Image or PDF (max 10MB)';

  const { data, refetch } = useQuery({
    queryKey: ['ocr-jobs'],
    queryFn: () => api.get('/student/profile').then((r) => r.data.ocr_jobs ?? []),
  });

  const jobs: OcrJob[] = data ?? [];

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setUploadError(NO_FILE_MSG); return; }
    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('document_type', docType);
      const token = localStorage.getItem('tensai_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${baseUrl}/student/ocr/upload`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `Upload failed (HTTP ${res.status})`);
      }
      if (fileRef.current) fileRef.current.value = '';
      setSelectedFileName('');
      setUploadSuccess(true);
      refetch();
    } catch (e: unknown) {
      setUploadError((e as Error).message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function requestReview(jobId: number) {
    await api.post('/student/ocr/review-request', { job_id: jobId });
    refetch();
  }

  const getDocLabel = (type: string) =>
    ALL_DOCS.find(d => d.value === type)?.label ??
    type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <DashboardLayout title={sd.title}>

      {/* Upload Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 mb-6">

        {/* Step 1 — Select document type */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            {lang === 'bn' ? 'ধাপ ১ — কাগজপত্রের ধরন বেছে নিন' : lang === 'ja' ? 'ステップ1 — 書類の種類を選択' : 'Step 1 — Select document type'}
          </label>
          <select
            value={docType}
            onChange={(e) => { setDocType(e.target.value); setUploadError(''); setUploadSuccess(false); }}
            className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {GROUPS.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.docs.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Step 2 — Choose file */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            {lang === 'bn' ? 'ধাপ ২ — ফাইল বেছে নিন' : lang === 'ja' ? 'ステップ2 — ファイルを選択' : 'Step 2 — Choose file'}
          </label>
          <label className="w-full flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl px-4 py-4 cursor-pointer hover:border-green-400 hover:bg-green-50/20 transition-colors">
            <span className="text-2xl">📎</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-700 truncate">
                {selectedFileName || (lang === 'bn' ? 'ফাইল বেছে নিন' : lang === 'ja' ? 'ファイルを選択' : 'Choose file')}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{FILE_HINT}</div>
            </div>
            {selectedFileName && (
              <span className="text-xs text-green-700 font-medium shrink-0">✓</span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                setSelectedFileName(e.target.files?.[0]?.name || '');
                setUploadError('');
                setUploadSuccess(false);
              }}
            />
          </label>
        </div>

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-3 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {uploading ? sd.uploading : sd.uploadBtn}
        </button>

        {uploadError && <p className="text-red-600 text-sm mt-3">{uploadError}</p>}
        {uploadSuccess && <p className="text-emerald-600 text-sm mt-3 font-medium">✓ {sd.uploadSuccess}</p>}
        <p className="text-xs text-slate-400 mt-3">{sd.uploadHint}</p>
      </div>

      {/* Uploaded documents list */}
      <h3 className="font-bold text-slate-700 text-sm mb-3">
        {lang === 'bn' ? 'আপলোড করা কাগজপত্র' : lang === 'ja' ? 'アップロード済み書類' : 'Uploaded Documents'}
        {jobs.length > 0 && <span className="ml-2 text-xs font-normal text-slate-400">({jobs.length})</span>}
      </h3>
      <div className="space-y-3">
        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400">
            <div className="text-3xl mb-2">📄</div>
            <p className="text-sm">{sd.empty}</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-slate-900">
                      {getDocLabel(job.document_type)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[job.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {t.statuses[job.status as keyof typeof t.statuses] ?? job.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {job.confidence_score !== null && (
                    <div className="text-xs text-slate-500">{sd.confidence} {Math.round(job.confidence_score * 100)}%</div>
                  )}
                  {job.failure_reason && (
                    <div className="text-xs text-red-500 mt-0.5">{job.failure_reason}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs text-slate-400">{new Date(job.created_at).toLocaleDateString()}</span>
                  {job.status === 'failed' && (
                    <button
                      onClick={() => requestReview(job.id)}
                      className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 whitespace-nowrap"
                    >
                      {sd.requestReview}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
