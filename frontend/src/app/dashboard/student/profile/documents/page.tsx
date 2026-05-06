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
  const { t } = useLang();
  const sd = t.studentDocs;
  const docTypes = t.docTypes;

  const DOC_TYPES = [
    { value: 'passport', label: docTypes.passport },
    { value: 'nid', label: docTypes.nid },
    { value: 'ssc_certificate', label: docTypes.ssc_certificate },
    { value: 'hsc_certificate', label: docTypes.hsc_certificate },
    { value: 'degree_certificate', label: docTypes.degree_certificate },
    { value: 'transcript', label: docTypes.transcript },
    { value: 'jlpt_certificate', label: docTypes.jlpt_certificate },
    { value: 'ielts_certificate', label: docTypes.ielts_certificate },
  ];

  const [docType, setDocType] = useState('passport');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, refetch } = useQuery({
    queryKey: ['ocr-jobs'],
    queryFn: () => api.get('/student/profile').then((r) => r.data.ocr_jobs ?? []),
  });

  const jobs: OcrJob[] = data ?? [];

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('document_type', docType);
      await api.post('/student/ocr/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fileRef.current!.value = '';
      refetch();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setUploadError(err.response?.data?.message ?? 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function requestReview(jobId: number) {
    await api.post('/student/ocr/review-request', { job_id: jobId });
    refetch();
  }

  return (
    <DashboardLayout title={sd.title}>
      {/* Upload card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 mb-5 sm:mb-6">
        <h2 className="font-bold text-slate-900 mb-4">{sd.uploadCard}</h2>
        <div className="flex flex-col gap-3">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-white"
          >
            {DOC_TYPES.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-sm"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? sd.uploading : sd.uploadBtn}
          </button>
        </div>
        {uploadError && <p className="text-red-600 text-sm mt-3">{uploadError}</p>}
        <p className="text-xs text-slate-400 mt-3">{sd.uploadHint}</p>
      </div>

      {/* Jobs list */}
      <div className="space-y-3">
        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
            <div className="text-3xl mb-2">📄</div>
            {sd.empty}
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-slate-900">
                      {docTypes[job.document_type as keyof typeof docTypes] ?? job.document_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[job.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {job.status.replace(/_/g, ' ')}
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
