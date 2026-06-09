'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

interface OcrJob {
  id: number;
  document_type: string;
  status: string;
  confidence_score: number | null;
  created_at: string;
  failure_reason: string | null;
}

const STATUS_CONFIG: Record<string, { color: string; icon: string }> = {
  queued:           { color: 'bg-slate-100 text-slate-600',    icon: '⏳' },
  processing:       { color: 'bg-blue-100 text-blue-700',      icon: '🔄' },
  completed:        { color: 'bg-emerald-100 text-emerald-700', icon: '✓' },
  failed:           { color: 'bg-red-100 text-red-600',        icon: '✗' },
  review_requested: { color: 'bg-amber-100 text-amber-700',    icon: '👁' },
  manually_approved:{ color: 'bg-purple-100 text-purple-700',  icon: '✓' },
};

const SAFE_DOC_ICONS: Record<string, string> = {
  passport: '📕', nid_student: '📋', birth_certificate_student: '📄',
  student_photo: '📸', sponsor_photo: '📸', father_birth_certificate: '📄',
  father_nid: '📋', mother_birth_certificate: '📄', mother_nid: '📋',
  ssc_certificate: '📗', ssc_marksheet: '📊', hsc_certificate: '📗',
  hsc_marksheet: '📊', degree_certificate: '📗', transcript: '📊',
  jlpt_certificate: '📘', jlpt_marksheet: '📊', nat_certificate: '📘',
  nat_marksheet: '📊', ielts_certificate: '📘',
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_IMAGE_DIM  = 1200; // px — max width or height
const IMAGE_QUALITY  = 0.82; // JPEG quality after resize

async function compressImage(file: File): Promise<File> {
  // PDFs pass through unchanged
  if (file.type === 'application/pdf') return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Only resize if larger than MAX_IMAGE_DIM
      if (width <= MAX_IMAGE_DIM && height <= MAX_IMAGE_DIM) {
        resolve(file); // no resize needed
        return;
      }

      if (width > height) {
        height = Math.round((height / width) * MAX_IMAGE_DIM);
        width  = MAX_IMAGE_DIM;
      } else {
        width  = Math.round((width / height) * MAX_IMAGE_DIM);
        height = MAX_IMAGE_DIM;
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
          resolve(compressed);
        },
        'image/jpeg',
        IMAGE_QUALITY,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export default function DocumentsPage() {
  const { t, lang } = useLang();
  const { user } = useAuthStore();
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

  const REQUIRED_DOCS = ['passport','nid_student','birth_certificate_student','ssc_certificate','ssc_marksheet','hsc_certificate','hsc_marksheet'];

  const [adminWhatsapp, setAdminWhatsapp] = useState('8801826192179');
  const [adminPhone, setAdminPhone]       = useState('+8801826192179');

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    fetch(`${base}/settings/public`)
      .then(r => r.json())
      .then(d => {
        if (d.support_whatsapp) setAdminWhatsapp(d.support_whatsapp);
        if (d.support_phone)    setAdminPhone(d.support_phone);
      }).catch(() => {});
  }, []);

  const [docType, setDocType]           = useState('passport');
  const [uploading, setUploading]       = useState(false);
  const [uploadError, setUploadError]   = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragOver, setDragOver]         = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [helpSent, setHelpSent]         = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, refetch } = useQuery({
    queryKey: ['student-profile-docs'],
    queryFn: () => api.get('/student/profile').then(r => r.data),
    staleTime: 30_000,
  });
  const jobs: OcrJob[] = data?.ocr_jobs ?? [];

  const NO_FILE  = lang === 'bn' ? 'আগে একটি ফাইল বেছে নিন।' : lang === 'ja' ? 'ファイルを選択してください。' : 'Please select a file first.';
  const DROP_HINT = lang === 'bn' ? 'ফাইল এখানে ড্রপ করুন অথবা ক্লিক করুন' : lang === 'ja' ? 'ここにドロップ、またはクリック' : 'Drop file here or click to browse';
  const FILE_HINT = lang === 'bn' ? 'JPG, PNG বা PDF — সর্বোচ্চ ১০MB' : lang === 'ja' ? 'JPG・PNG・PDF — 最大10MB' : 'JPG, PNG or PDF — max 10MB';

  function pickFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError(lang === 'bn' ? 'শুধুমাত্র JPG, PNG বা PDF ফাইল গ্রহণযোগ্য।' : lang === 'ja' ? 'JPG・PNG・PDFのみ受け付けます。' : 'Only JPG, PNG or PDF files are accepted.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(lang === 'bn' ? 'ফাইল ১০MB-এর বেশি হতে পারবে না।' : lang === 'ja' ? 'ファイルは10MB以下にしてください。' : 'File must be under 10MB.');
      return;
    }
    setSelectedFile(file);
    setUploadError('');
    setUploadSuccess(false);
  }

  async function handleUpload() {
    if (!selectedFile) { setUploadError(NO_FILE); return; }
    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);
    setUploadFailed(false);
    setHelpSent(false);
    try {
      const compressed = await compressImage(selectedFile);
      const form = new FormData();
      form.append('file', compressed);
      form.append('document_type', docType);
      const token = localStorage.getItem('tensai_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${baseUrl}/student/ocr/upload`, {
        method: 'POST',
        headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: form,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.message || `Upload failed (HTTP ${res.status})`);
      }
      if (fileRef.current) fileRef.current.value = '';
      setSelectedFile(null);
      setUploadSuccess(true);
      refetch();
    } catch (e: unknown) {
      setUploadError((e as Error).message || 'Upload failed.');
      setUploadFailed(true);
    } finally {
      setUploading(false);
    }
  }

  async function logHelpRequest() {
    try {
      await api.post('/student/help-request', { document_type: docType, contact_via: 'whatsapp' });
      setHelpSent(true);
    } catch {}
    // Open WhatsApp regardless
    const docLabel = getDocLabel(docType);
    const msg = encodeURIComponent(
      `Hi Tensai Support,\n\nI need help uploading my document.\n\nName: ${user?.name ?? ''}\nEmail: ${user?.email ?? ''}\nDocument: ${docLabel}\n\nPlease assist me.`
    );
    window.open(`https://wa.me/${adminWhatsapp}?text=${msg}`, '_blank');
  }

  async function requestReview(jobId: number) {
    await api.post('/student/ocr/review-request', { job_id: jobId });
    refetch();
  }

  const getDocLabel = (type: string) =>
    ALL_DOCS.find(d => d.value === type)?.label ??
    type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const getDocIcon = (type: string) => SAFE_DOC_ICONS[type] ?? '📄';


  return (
    <DashboardLayout title={sd.title}>

      {/* Required docs progress */}
      {(() => {
        const uploadedTypes = new Set(jobs.map(j => j.document_type));
        const doneCount = REQUIRED_DOCS.filter(d => uploadedTypes.has(d)).length;
        const total = REQUIRED_DOCS.length;
        const pct = Math.round((doneCount / total) * 100);
        const done = doneCount >= total;
        return (
          <div className={`rounded-2xl border p-4 mb-5 ${done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {done
                    ? (lang === 'bn' ? '✓ প্রয়োজনীয় সব কাগজপত্র আপলোড হয়েছে!' : lang === 'ja' ? '✓ 必要書類をすべてアップロード済み！' : '✓ All required documents uploaded!')
                    : (lang === 'bn' ? 'প্রোফাইল অগ্রগতি' : lang === 'ja' ? 'プロフィール進捗' : 'Profile Progress')}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'bn'
                    ? `${doneCount}টি আপলোড হয়েছে — ${total - doneCount}টি বাকি আছে`
                    : lang === 'ja'
                    ? `${doneCount}件アップロード済み — 残り${total - doneCount}件`
                    : `${doneCount} of ${total} required documents uploaded${done ? '' : ` — ${total - doneCount} remaining`}`}
                </p>
              </div>
              <span className={`text-xl font-black shrink-0 ${done ? 'text-emerald-600' : 'text-slate-700'}`}>{pct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-emerald-500' : 'bg-green-600'}`} style={{ width: `${pct}%` }} />
            </div>
            {!done && (
              <p className="text-xs text-slate-400 mt-2">
                {lang === 'bn'
                  ? '📋 প্রয়োজনীয়: পাসপোর্ট, NID, জন্ম সনদ, SSC ও HSC সার্টিফিকেট ও মার্কশিট'
                  : lang === 'ja'
                  ? '📋 必要書類: パスポート、NID、出生証明書、SSC・HSC証明書・マークシート'
                  : '📋 Required: Passport, NID, Birth Certificate, SSC & HSC certificates and marksheets'}
              </p>
            )}
            {done && (
              <p className="text-xs text-emerald-600 mt-1">
                {lang === 'bn' ? 'আপনি চাইলে আরও অতিরিক্ত কাগজপত্রও আপলোড করতে পারেন।' : lang === 'ja' ? '追加書類もアップロードできます。' : 'You can still upload additional documents if needed.'}
              </p>
            )}
          </div>
        );
      })()}

      {/* Upload Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">

        {/* Card header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-900 text-sm">
            {lang === 'bn' ? 'নতুন কাগজপত্র আপলোড করুন' : lang === 'ja' ? '書類をアップロード' : 'Upload New Document'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'bn' ? 'OCR স্বয়ংক্রিয়ভাবে তথ্য পড়বে ও যাচাই করবে।' : lang === 'ja' ? 'OCRが自動でデータを読み取り検証します。' : 'OCR will automatically read and verify your document data.'}
          </p>
        </div>

        <div className="p-5 space-y-5">

          {/* Document type selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
              {lang === 'bn' ? 'কাগজপত্রের ধরন' : lang === 'ja' ? '書類の種類' : 'Document Type'}
            </label>
            <div className="relative">
              <select
                value={docType}
                onChange={(e) => { setDocType(e.target.value); setUploadError(''); setUploadSuccess(false); }}
                className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none cursor-pointer"
              >
                {GROUPS.map((g) => (
                  <optgroup key={g.label} label={`── ${g.label} ──`}>
                    {g.docs.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                {getDocIcon(docType)}
              </span>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Drag & drop zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
              {lang === 'bn' ? 'ফাইল' : lang === 'ja' ? 'ファイル' : 'File'}
            </label>
            <label
              className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all ${
                dragOver
                  ? 'border-green-400 bg-green-50'
                  : selectedFile
                  ? 'border-green-300 bg-green-50/40'
                  : 'border-slate-200 hover:border-green-300 hover:bg-slate-50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) pickFile(file);
              }}
            >
              {selectedFile ? (
                <>
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
                    {selectedFile.type.includes('pdf') ? '📄' : '🖼️'}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-800 max-w-xs truncate">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setSelectedFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    {lang === 'bn' ? 'সরিয়ে দিন' : lang === 'ja' ? '削除' : 'Remove'}
                  </button>
                </>
              ) : (
                <>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-colors ${dragOver ? 'bg-green-100' : 'bg-slate-100'}`}>
                    📤
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-700">{DROP_HINT}</p>
                    <p className="text-xs text-slate-400 mt-1">{FILE_HINT}</p>
                  </div>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
              />
            </label>
          </div>

          {/* Error / success */}
          {uploadError && (
            <div className="rounded-xl overflow-hidden border border-red-200">
              <div className="flex items-start gap-2 p-3 bg-red-50 text-sm text-red-700">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <div>
                  <p className="font-semibold mb-0.5">
                    {lang === 'bn' ? 'আপলোড হয়নি' : lang === 'ja' ? 'アップロード失敗' : 'Upload failed'}
                  </p>
                  <p className="text-xs text-red-600">{uploadError}</p>
                </div>
              </div>
              {uploadFailed && (
                <div className="bg-red-50 border-t border-red-100 px-3 pb-3 pt-2">
                  <p className="text-xs text-red-700 font-medium mb-2">
                    {lang === 'bn'
                      ? '👇 নিচের বাটনে ক্লিক করুন — আপনার নাম ও কাগজপত্রের তথ্য স্বয়ংক্রিয়ভাবে পাঠানো হবে।'
                      : lang === 'ja'
                      ? '👇 下のボタンをクリックしてください。お名前と書類情報が自動的に送信されます。'
                      : '👇 Click the button below — your name and document details will be sent to our team automatically.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={logHelpRequest}
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      {lang === 'bn' ? 'WhatsApp-এ সাহায্য নিন' : lang === 'ja' ? 'WhatsAppで連絡' : 'Contact via WhatsApp'}
                    </button>
                    <a href={`tel:${adminPhone}`}
                      className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-green-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                      📞 {lang === 'bn' ? 'কল করুন' : lang === 'ja' ? '電話する' : 'Call Support'}
                    </a>
                  </div>
                  {helpSent && (
                    <p className="text-xs text-green-700 font-medium mt-2">
                      ✓ {lang === 'bn' ? 'অনুরোধ রেকর্ড হয়েছে। অ্যাডমিন শীঘ্রই যোগাযোগ করবেন।' : lang === 'ja' ? 'リクエストを記録しました。まもなくご連絡します。' : 'Request logged. Admin will contact you shortly.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {uploadSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
              <span>✓</span> {sd.uploadSuccess}
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
              selectedFile && !uploading
                ? 'bg-green-700 hover:bg-green-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                {sd.uploading}
              </span>
            ) : sd.uploadBtn}
          </button>

          <p className="text-xs text-slate-400 text-center">{sd.uploadHint}</p>
        </div>
      </div>

      {/* Uploaded documents */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800 text-sm">
          {lang === 'bn' ? 'আপলোড করা কাগজপত্র' : lang === 'ja' ? 'アップロード済み書類' : 'Uploaded Documents'}
        </h3>
        {jobs.length > 0 && (
          <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full">
            {jobs.length}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
            <div className="text-4xl mb-3">📂</div>
            <p className="text-sm font-medium text-slate-600 mb-1">{sd.empty}</p>
            <p className="text-xs text-slate-400">
              {lang === 'bn' ? 'উপরের ফর্ম ব্যবহার করে আপলোড করুন।' : lang === 'ja' ? '上のフォームからアップロードしてください。' : 'Use the form above to upload your first document.'}
            </p>
          </div>
        ) : (
          jobs.map((job) => {
            const sc = STATUS_CONFIG[job.status] ?? { color: 'bg-slate-100 text-slate-600', icon: '•' };
            const confidence = job.confidence_score !== null ? Math.round(job.confidence_score * 100) : null;
            return (
              <div key={job.id} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 hover:border-slate-200 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3">
                  {/* Doc icon */}
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0">
                    {getDocIcon(job.document_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="font-semibold text-sm text-slate-900">{getDocLabel(job.document_type)}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sc.color}`}>
                        {sc.icon} {t.statuses[job.status as keyof typeof t.statuses] ?? job.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Confidence score bar */}
                    {confidence !== null && (
                      <div className="mt-2 mb-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400">{sd.confidence}</span>
                          <span className={`text-xs font-bold ${confidence >= 80 ? 'text-emerald-600' : confidence >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                            {confidence}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${confidence >= 80 ? 'bg-emerald-500' : confidence >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${confidence}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {job.failure_reason && (
                      <p className="text-xs text-red-500 mt-1">{job.failure_reason}</p>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-xs text-slate-400">{new Date(job.created_at).toLocaleDateString()}</span>
                    {job.status === 'failed' && (
                      <button
                        onClick={() => requestReview(job.id)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                      >
                        {sd.requestReview}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CTA banner to info form */}
      <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-lg shrink-0">📋</div>
          <div>
            <p className="font-bold text-sm text-slate-900">
              {lang === 'bn' ? 'আপনার সকল তথ্য জমা দিন' : lang === 'ja' ? '全情報を提出する' : 'Submit Your All Info'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'ব্যক্তিগত, পারিবারিক, ঠিকানা, শিক্ষা ও স্পনসরের তথ্য পূরণ করুন।'
                : lang === 'ja'
                ? '個人・家族・住所・学歴・保証人の情報を入力してください。'
                : 'Fill in your personal, family, address, education and sponsor details.'}
            </p>
          </div>
        </div>
        <a href="/dashboard/student/profile/info"
          className="shrink-0 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap">
          {lang === 'bn' ? 'তথ্য দিন →' : lang === 'ja' ? '入力する →' : 'Fill In →'}
        </a>
      </div>

    </DashboardLayout>
  );
}
