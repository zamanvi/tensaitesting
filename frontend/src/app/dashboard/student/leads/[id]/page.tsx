'use client';
import StudentLayout from '@/components/shared/StudentLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/context/LanguageContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCountryData } from '@/hooks/useCountryData';

interface Lead {
  id: number;
  lead_code: string;
  status: string;
  submission_status: 'draft' | 'submitted' | 'accepted' | 'rejected' | null;
  target_country: string | null;
  target_course: string | null;
  target_intake: string | null;
  preferred_cities: string[] | null;
  city_type: 'preferred' | 'must';
  preferred_institution: string | null;
  jlpt_nat_score: string | null;
  jlpt_nat_result_date: string | null;
  expected_jlpt_nat_exam_date: string | null;
  created_at: string;
  assignedAgency: { id: number; name: string } | null;
  assignedInstitution: { id: number; name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  new:                 'bg-blue-100 text-blue-700',
  profile_complete:    'bg-sky-100 text-sky-700',
  under_review:        'bg-amber-100 text-amber-700',
  shortlisted:         'bg-orange-100 text-orange-700',
  interview_scheduled: 'bg-purple-100 text-purple-700',
  interviewed:         'bg-indigo-100 text-indigo-700',
  offer_received:      'bg-teal-100 text-teal-700',
  accepted:            'bg-emerald-100 text-emerald-700',
  visa_processing:     'bg-cyan-100 text-cyan-700',
  visa_approved:       'bg-green-100 text-green-700',
  visa_rejected:       'bg-red-100 text-red-700',
  enrolled:            'bg-green-200 text-green-800',
  closed:              'bg-slate-100 text-slate-500',
  on_hold:             'bg-yellow-100 text-yellow-700',
};

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white';
const selectCls = inputCls;

function toDateInput(val: string | null | undefined): string {
  if (!val) return '';
  return val.slice(0, 10);
}

function fmtDate(val: string | null | undefined): string | null {
  if (!val) return null;
  const [y, m, d] = val.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function fmtStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

type InfoForm = {
  target_country: string;
  target_course: string;
  target_intake: string;
  city_type: 'preferred' | 'must';
  preferred_institution: string;
  jlpt_nat_score: string;
  jlpt_nat_result_date: string;
  expected_jlpt_nat_exam_date: string;
};

const EMPTY_INFO: InfoForm = {
  target_country: '', target_course: '', target_intake: '',
  city_type: 'preferred', preferred_institution: '',
  jlpt_nat_score: '', jlpt_nat_result_date: '', expected_jlpt_nat_exam_date: '',
};

type DocKey = 'passport' | 'certs' | 'lang' | 'trans';

export default function StudentLeadDetailPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const qc = useQueryClient();
  const { lang } = useLang();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const isStudent = user?.gateway_type === 'student';
  useEffect(() => {
    if (user && !isStudent) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isStudent, router]);

  const { data: countryData = {}, isSuccess: countriesLoaded } = useCountryData();
  const initializedLeadId = useRef<number | null>(null);

  const [submitErr, setSubmitErr] = useState('');

  const [activeSection, setActiveSection] = useState<'overview' | 'info' | 'docs'>('overview');
  const [infoForm, setInfoForm] = useState<InfoForm>(EMPTY_INFO);
  const [citiesChecked, setCitiesChecked] = useState<string[]>([]);
  const [citiesOther, setCitiesOther] = useState('');
  const [showOther, setShowOther] = useState(false);
  const [infoErr, setInfoErr] = useState('');
  const [infoSuccess, setInfoSuccess] = useState(false);

  // Warn before unload when user has unsaved info-form changes
  const [infoHasChanges, setInfoHasChanges] = useState(false);
  useEffect(() => {
    if (!infoHasChanges) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [infoHasChanges]);

  function goToSection(s: 'overview' | 'info' | 'docs') {
    setActiveSection(s);
    if (s !== 'info') setInfoHasChanges(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ['student-lead', id],
    queryFn: () => api.get(`/student/leads/${id}`).then(r => r.data),
    enabled: !!isStudent && !!id,
  });

  useEffect(() => {
    if (!lead || !countriesLoaded) return;
    if (initializedLeadId.current === lead.id) return;

    const knownCities = countryData[lead.target_country ?? ''] ?? [];
    const savedCities = lead.preferred_cities ?? [];
    setCitiesChecked(savedCities.filter(c => knownCities.includes(c)));
    setCitiesOther(savedCities.filter(c => !knownCities.includes(c)).join(', '));
    setShowOther(savedCities.some(c => !knownCities.includes(c)));
    setInfoForm({
      target_country:              lead.target_country ?? '',
      target_course:               lead.target_course ?? '',
      target_intake:               toDateInput(lead.target_intake),
      city_type:                   lead.city_type ?? 'preferred',
      preferred_institution:       lead.preferred_institution ?? '',
      jlpt_nat_score:              lead.jlpt_nat_score ?? '',
      jlpt_nat_result_date:        toDateInput(lead.jlpt_nat_result_date),
      expected_jlpt_nat_exam_date: toDateInput(lead.expected_jlpt_nat_exam_date),
    });
    initializedLeadId.current = lead.id;
  }, [lead, countryData, countriesLoaded]);

  const set = (field: keyof InfoForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (field === 'target_country') {
        setCitiesChecked([]); setCitiesOther(''); setShowOther(false);
      }
      setInfoForm(f => ({ ...f, [field]: e.target.value }));
      setInfoHasChanges(true);
    };

  function toggleCity(city: string) {
    setCitiesChecked(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
    setInfoHasChanges(true);
  }

  const updateInfo = useMutation({
    mutationFn: () => api.patch(`/student/leads/${id}`, {
      target_country:              infoForm.target_country || null,
      target_course:               infoForm.target_course || null,
      target_intake:               infoForm.target_intake || null,
      preferred_cities: [
        ...citiesChecked,
        ...citiesOther.split(',').map(c => c.trim()).filter(Boolean),
      ],
      city_type:                   infoForm.city_type,
      preferred_institution:       infoForm.preferred_institution || null,
      jlpt_nat_score:              infoForm.jlpt_nat_score || null,
      jlpt_nat_result_date:        infoForm.jlpt_nat_result_date || null,
      expected_jlpt_nat_exam_date: infoForm.expected_jlpt_nat_exam_date || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-lead', id] });
      qc.invalidateQueries({ queryKey: ['student-leads'] });
      initializedLeadId.current = null;
      setInfoSuccess(true);
      setTimeout(() => setInfoSuccess(false), 3500);
      setInfoErr('');
      setInfoHasChanges(false);
      goToSection('overview');
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = err.response?.data?.errors;
      setInfoErr(errs ? Object.values(errs).flat().join(' ') : err.response?.data?.message ?? 'Failed.');
    },
  });

  const submitApp = useMutation({
    mutationFn: () => api.post(`/student/leads/${id}/submit`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-lead', id] });
      qc.invalidateQueries({ queryKey: ['student-leads'] });
      setSubmitErr('');
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setSubmitErr(err.response?.data?.message ?? (ja ? '送信に失敗しました。' : bn ? 'জমা দিতে ব্যর্থ হয়েছে।' : 'Failed to submit.'));
    },
  });

  if (!user || !isStudent) return null;

  const title = lead
    ? `${lead.lead_code}`
    : (ja ? '申請詳細' : bn ? 'আবেদন বিস্তারিত' : 'Application');

  if (isLoading) {
    return (
      <StudentLayout title={title}>
        <div className="text-center py-16 text-slate-400 text-sm">
          {ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}
        </div>
      </StudentLayout>
    );
  }

  if (!lead) {
    return (
      <StudentLayout title={title}>
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-slate-400 text-sm mb-4">
            {ja ? '申請が見つかりません。' : bn ? 'আবেদন পাওয়া যায়নি।' : 'Application not found.'}
          </p>
          <Link href="/dashboard/student/leads"
            className="text-sm font-semibold text-green-700 underline underline-offset-2">
            {ja ? '← 一覧に戻る' : bn ? '← তালিকায় ফিরুন' : '← Back to list'}
          </Link>
        </div>
      </StudentLayout>
    );
  }

  const infoComplete  = !!lead.target_country;
  // State machine based on submission_status (set by backend on submit/accept/reject)
  const isSubmittable = !lead.submission_status || lead.submission_status === 'draft';
  const isUnderReview = lead.submission_status === 'submitted';
  const isOnGoing     = lead.submission_status === 'accepted';
  const isRejected    = lead.submission_status === 'rejected';
  const isSubmitted   = !isSubmittable;
  // Docs editable when filling (draft) or on going (accepted)
  const docsEditable  = isSubmittable || isOnGoing;
  const docsLocked    = !infoComplete || !docsEditable;
  const hasCity       = (lead.preferred_cities?.length ?? 0) > 0;
  const hasJlpt       = !!lead.jlpt_nat_score;
  const docsStarted   = false; // doc upload not yet implemented on this page
  // 50% gate = info complete (docs shown as checklist prep, not a server-side gate yet)
  const progressPct   = isSubmittable
    ? (infoComplete ? 50 : 0)
    : 50;
  const canSubmit     = isSubmittable && infoComplete;
  const anythingFilled = !!(lead.target_country || lead.target_course || lead.target_intake || hasCity || lead.preferred_institution || lead.jlpt_nat_score);

  const docs: { key: DocKey; label: string; hint: string; required: boolean }[] = [
    { key: 'passport', label: ja ? 'パスポートコピー' : bn ? 'পাসপোর্টের কপি' : 'Passport copy',        hint: ja ? 'JPG, PNG または PDF — 最大5MB' : bn ? 'JPG, PNG বা PDF — সর্বোচ্চ ৫MB' : 'JPG, PNG or PDF — max 5MB', required: true },
    { key: 'certs',    label: ja ? '学歴証明書' : bn ? 'একাডেমিক সার্টিফিকেট' : 'Academic certificates', hint: ja ? 'SSC / HSC または学位証明書' : bn ? 'SSC/HSC বা ডিগ্রি সার্টিফিকেট' : 'SSC, HSC or degree certificates', required: true },
    { key: 'lang',     label: ja ? 'JLPT / NAT スコアシート' : bn ? 'ভাষার স্কোর শিট' : 'Language score sheet', hint: ja ? '任意' : bn ? 'ঐচ্ছিক' : 'Optional', required: false },
    { key: 'trans',    label: ja ? '成績証明書' : bn ? 'ট্রান্সক্রিপ্ট' : 'Transcripts',                hint: ja ? '任意 — マークシートなど' : bn ? 'ঐচ্ছিক — মার্কশিট' : 'Optional — mark sheets', required: false },
  ];

  return (
    <StudentLayout title={title}>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-5 flex-wrap">
        <Link href="/dashboard/student" className="hover:text-green-700 transition-colors">
          {ja ? '申請一覧' : bn ? 'আবেদন' : 'Applications'}
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-600">{lead.lead_code}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 text-base">
              {lead.target_country
                ? `${lead.target_country}${lead.target_course ? ` — ${lead.target_course}` : ''}`
                : (ja ? '渡航先未設定' : bn ? 'গন্তব্য নির্ধারিত হয়নি' : 'Destination not set')}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{lead.lead_code}</p>
            {lead.assignedAgency && (
              <p className="text-xs text-slate-400 mt-1">
                {ja ? '担当エージェンシー:' : bn ? 'এজেন্সি:' : 'Agency:'} {lead.assignedAgency.name}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full ${STATUS_COLORS[lead.status] ?? 'bg-slate-100 text-slate-500'}`}>
              {fmtStatus(lead.status)}
            </span>
          </div>
        </div>

        {infoSuccess && (
          <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
            <span>✓</span>
            <span>{ja ? '情報を保存しました。' : bn ? 'তথ্য সংরক্ষিত হয়েছে।' : 'Info saved successfully.'}</span>
          </div>
        )}
      </div>

      {/* ── OVERVIEW ── */}
      {activeSection === 'overview' && (
        <>
          {/* ── Status banners ── */}
          {isUnderReview && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4 mb-5">
              <span className="text-xl shrink-0">🔍</span>
              <div>
                <p className="font-bold text-amber-800 text-sm mb-0.5">
                  {ja ? '申請を受け付けました' : bn ? 'আবেদন পর্যালোচনাধীন' : 'Application under review'}
                </p>
                <p className="text-xs text-amber-700">
                  {ja ? '担当者が内容を確認しています。追加情報が必要な場合は電話でご連絡します。'
                    : bn ? 'আমাদের টিম আপনার আবেদন যাচাই করছে। প্রয়োজনে ফোনে যোগাযোগ করা হবে।'
                    : 'Our team is reviewing your application. If anything is needed, we will contact you by phone.'}
                </p>
              </div>
            </div>
          )}

          {isRejected && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-4 mb-5">
              <span className="text-xl shrink-0">✕</span>
              <div>
                <p className="font-bold text-red-800 text-sm mb-0.5">
                  {ja ? '申請が却下されました' : bn ? 'আবেদন প্রত্যাখ্যাত হয়েছে' : 'Application Rejected'}
                </p>
                <p className="text-xs text-red-700">
                  {ja ? '詳しくはご担当者にお問い合わせください。'
                    : bn ? 'বিস্তারিত জানতে আমাদের সাথে যোগাযোগ করুন।'
                    : 'Please contact our team for more information.'}
                </p>
              </div>
            </div>
          )}

          {isOnGoing && (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-4 mb-5">
              <span className="text-xl shrink-0">🚀</span>
              <div>
                <p className="font-bold text-green-800 text-sm mb-0.5">
                  {ja ? 'おめでとうございます！申請が進行中です' : bn ? 'অভিনন্দন! আবেদন চলমান রয়েছে' : 'Congratulations! Your application is On Going'}
                </p>
                <p className="text-xs text-green-700">
                  {ja ? '書類を随時追加・更新できます。最新の状態を保ってください。'
                    : bn ? 'আপনি যেকোনো সময় ডকুমেন্ট আপডেট বা যোগ করতে পারবেন। সব কিছু আপডেট রাখুন।'
                    : 'You can still add or update documents at any time. Keep everything up to date.'}
                </p>
              </div>
            </div>
          )}

          {/* ── Progress checklist (only when new/filling) ── */}
          {isSubmittable && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {ja ? '申請の準備' : bn ? 'আবেদনের প্রস্তুতি' : 'Application Checklist'}
                </p>
                <span className={`text-sm font-bold ${progressPct >= 50 ? 'text-green-700' : 'text-slate-400'}`}>
                  {progressPct}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressPct >= 50 ? 'bg-green-500' : 'bg-amber-400'}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="space-y-3">
                {/* Info row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${infoComplete ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                      {infoComplete ? '✓' : '1'}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        {ja ? '学歴・渡航先情報' : bn ? 'একাডেমিক ও গন্তব্য তথ্য' : 'Academic & destination info'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {infoComplete
                          ? [lead.target_country, lead.target_course].filter(Boolean).join(' — ')
                          : (ja ? '未入力' : bn ? 'পূরণ করা হয়নি' : 'Not filled yet')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => goToSection('info')}
                    className="text-xs font-semibold text-green-700 hover:text-green-800 shrink-0 ml-3"
                  >
                    {infoComplete ? (ja ? '編集' : bn ? 'সম্পাদনা' : 'Edit') : (ja ? '入力する' : bn ? 'পূরণ করুন' : 'Fill in')}
                  </button>
                </div>

                {/* Docs row — visual prep checklist, not a submit gate */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${docsStarted ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                      {docsStarted ? '✓' : '📁'}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        {ja ? '書類を準備する' : bn ? 'ডকুমেন্ট প্রস্তুত করুন' : 'Prepare documents'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {ja ? 'パスポート・証明書など（近日公開）' : bn ? 'পাসপোর্ট, সার্টিফিকেট ইত্যাদি (শীঘ্রই)' : 'Passport, certificates, etc. (coming soon)'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => goToSection('docs')}
                    disabled={!infoComplete}
                    className={`text-xs font-semibold shrink-0 ml-3 ${infoComplete ? 'text-green-700 hover:text-green-800' : 'text-slate-300 cursor-not-allowed'}`}
                  >
                    {docsStarted ? (ja ? '更新' : bn ? 'আপডেট' : 'Update') : (ja ? '選択する' : bn ? 'বেছে নিন' : 'Select')}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                {submitErr && (
                  <div className="mb-3 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                    <span className="shrink-0">⚠️</span><span>{submitErr}</span>
                  </div>
                )}
                <button
                  onClick={() => canSubmit && submitApp.mutate()}
                  disabled={!canSubmit || submitApp.isPending}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
                    canSubmit
                      ? 'bg-green-700 hover:bg-green-800 text-white'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {submitApp.isPending
                    ? (ja ? '送信中…' : bn ? 'জমা দেওয়া হচ্ছে…' : 'Submitting…')
                    : canSubmit
                      ? (ja ? '申請を提出する →' : bn ? 'আবেদন জমা দিন →' : 'Submit Application →')
                      : (ja ? '50%完了後に提出できます' : bn ? '৫০% সম্পন্ন হলে জমা দিতে পারবেন' : 'Complete 50% to submit')}
                </button>
                {canSubmit && (
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    {ja ? '提出後も編集できます。' : bn ? 'জমা দেওয়ার পরেও তথ্য সম্পাদনা করা যাবে।' : 'You can still edit your application after submitting.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Docs update section for On Going */}
          {isOnGoing && (
            <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 text-sm">
                  {ja ? '書類の更新' : bn ? 'ডকুমেন্ট আপডেট' : 'Update Documents'}
                </h3>
                <button onClick={() => goToSection('docs')} className="text-xs font-semibold text-green-700 hover:text-green-800">
                  {ja ? '+ 追加 / 変更' : bn ? '+ যোগ / পরিবর্তন' : '+ Add / Change'}
                </button>
              </div>
              <div className="space-y-2">
                {docs.map(d => {
                  return (
                    <div key={d.key} className="flex items-center gap-2 text-[11px]">
                      <span className="shrink-0 font-bold text-slate-300">○</span>
                      <span className="text-slate-400">{d.label}</span>
                      {!d.required && <span className="text-slate-400">({ja ? '任意' : bn ? 'ঐচ্ছিক' : 'optional'})</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info note for other submitted states */}
          {isSubmitted && !isOnGoing && !isUnderReview && (
            <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11px] text-slate-500 mb-5">
              <span className="shrink-0">ℹ️</span>
              <span>{ja ? '申請は処理中です。' : bn ? 'আবেদন প্রক্রিয়াধীন রয়েছে।' : 'Your application is being processed.'}</span>
            </div>
          )}

          {/* Application summary */}
          {anythingFilled && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ja ? '申請概要' : bn ? 'আবেদনের সারসংক্ষেপ' : 'Application summary'}</p>
                {isSubmittable && <button onClick={() => goToSection('info')} className="text-xs text-green-700 font-semibold hover:underline">{ja ? '編集' : bn ? 'সম্পাদনা' : 'Edit'}</button>}
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4 text-xs">
                {([
                  { label: ja ? '渡航先' : bn ? 'দেশ' : 'Country',             value: lead.target_country },
                  { label: ja ? 'コース' : bn ? 'কোর্স' : 'Course',             value: lead.target_course },
                  { label: ja ? '都市 / タイプ' : bn ? 'শহর / ধরন' : 'City / type', value: hasCity ? `${lead.preferred_cities!.join(', ')} (${lead.city_type === 'must' ? (ja ? '必須' : bn ? 'আবশ্যক' : 'must') : (ja ? '希望' : bn ? 'পছন্দের' : 'preferred')})` : null },
                  { label: ja ? '希望大学' : bn ? 'পছন্দের প্রতিষ্ঠান' : 'Preferred institution', value: lead.preferred_institution },
                  { label: ja ? '入学予定日' : bn ? 'ভর্তির তারিখ' : 'Target intake', value: fmtDate(lead.target_intake) },
                  { label: ja ? 'JLPT / NAT' : bn ? 'JLPT স্কোর' : 'JLPT / NAT', value: lead.jlpt_nat_score },
                  { label: ja ? '結果発表日' : bn ? 'ফলাফল তারিখ' : 'JLPT result date', value: fmtDate(lead.jlpt_nat_result_date) },
                  { label: ja ? '受験予定日' : bn ? 'পরীক্ষার তারিখ' : 'Expected exam date', value: fmtDate(lead.expected_jlpt_nat_exam_date) },
                  { label: ja ? '電話番号' : bn ? 'ফোন' : 'Phone', value: null },
                  { label: ja ? '登録日' : bn ? 'যোগ করার তারিখ' : 'Added', value: new Date(lead.created_at).toLocaleDateString() },
                ] as { label: string; value: string | null | undefined }[])
                  .filter(row => !!row.value)
                  .map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-slate-400 mb-0.5">{label}</p>
                      <p className="font-semibold text-slate-700 break-words">{value}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── FILL UP INFO FORM ── */}
      {activeSection === 'info' && !isSubmitted && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-5">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">{ja ? '情報入力' : bn ? 'তথ্য পূরণ করুন' : 'Fill up info'}</h2>
            <button onClick={() => { goToSection('overview'); setInfoErr(''); }}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1">
              {ja ? '← 戻る' : bn ? '← ফিরুন' : '← Back'}
            </button>
          </div>

          <div className="p-5">
            {infoErr && (
              <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-start gap-2">
                <span className="flex-shrink-0">⚠️</span><span>{infoErr}</span>
              </div>
            )}

            {/* Academic / JLPT */}
            <div className="mb-6">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">{ja ? '学歴 / JLPT · NAT' : bn ? 'একাডেমিক / JLPT · NAT' : 'Academic / JLPT · NAT'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {ja ? 'スコア' : bn ? 'JLPT / NAT স্কোর' : 'JLPT / NAT score'}
                    <span className="ml-1 font-normal text-slate-400">({ja ? '任意' : bn ? 'ঐচ্ছিক' : 'optional'})</span>
                  </label>
                  <input className={inputCls} placeholder={ja ? '例：N3、NAT5級' : bn ? 'যেমন: N3, NAT 5' : 'e.g. N3, NAT 5, N2 — 85pts'}
                    value={infoForm.jlpt_nat_score} onChange={set('jlpt_nat_score')} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {ja ? '結果発表日' : bn ? 'ফলাফল তারিখ' : 'Result date'}
                    <span className="ml-1 font-normal text-slate-400">({ja ? '取得済みの場合' : bn ? 'পরীক্ষা দেওয়া হলে' : 'if already taken'})</span>
                  </label>
                  <input className={inputCls} type="date" value={infoForm.jlpt_nat_result_date} onChange={set('jlpt_nat_result_date')} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {ja ? '受験予定日' : bn ? 'পরীক্ষার প্রত্যাশিত তারিখ' : 'Expected exam date'}
                    <span className="ml-1 font-normal text-slate-400">({ja ? '未受験の場合' : bn ? 'এখনো দেননি হলে' : 'if not yet taken'})</span>
                  </label>
                  <input className={inputCls} type="date" value={infoForm.expected_jlpt_nat_exam_date} onChange={set('expected_jlpt_nat_exam_date')} />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 mb-6" />

            {/* Destination */}
            <div className="mb-6">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">{ja ? '渡航先の希望' : bn ? 'গন্তব্য পছন্দ' : 'Destination preference'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {ja ? '渡航先' : bn ? 'লক্ষ্য দেশ' : 'Target country'}
                    <span className="ml-1 text-red-400 font-bold">*</span>
                  </label>
                  <select className={selectCls} value={infoForm.target_country} onChange={set('target_country')}>
                    <option value="">{ja ? '選択してください' : bn ? 'বেছে নিন' : 'Select country'}</option>
                    {infoForm.target_country && !Object.keys(countryData).includes(infoForm.target_country) && (
                      <option value={infoForm.target_country}>{infoForm.target_country}</option>
                    )}
                    {Object.keys(countryData).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {ja ? 'コース' : bn ? 'কোর্স' : 'Course'}
                    <span className="ml-1 font-normal text-slate-400">({ja ? '任意' : bn ? 'ঐচ্ছিক' : 'optional'})</span>
                  </label>
                  <input className={inputCls} placeholder={ja ? '例：日本語学校' : bn ? 'যেমন: জাপানি ভাষা' : 'e.g. Japanese Language'}
                    value={infoForm.target_course} onChange={set('target_course')} />
                </div>

                {/* City preference */}
                <div className="sm:col-span-2">
                  <p className="block text-xs font-semibold text-slate-500 mb-2">
                    {ja ? '希望都市' : bn ? 'পছন্দের শহর' : 'City preference'}
                    <span className="ml-1 font-normal text-slate-400">({ja ? '任意' : bn ? 'ঐচ্ছিক' : 'optional'})</span>
                  </p>
                  {(() => {
                    const cities = countryData[infoForm.target_country] ?? [];
                    if (!infoForm.target_country) {
                      return <p className="text-xs text-slate-400 italic">{ja ? '先に国を選択してください' : bn ? 'আগে দেশ বেছে নিন' : 'Select a country first'}</p>;
                    }
                    if (cities.length === 0) {
                      return <p className="text-xs text-slate-400 italic">{ja ? 'この国の都市はまだ設定されていません。' : bn ? 'এই দেশের শহর এখনো সেট করা হয়নি।' : 'No cities configured for this country yet.'}</p>;
                    }
                    const anyCitySelected = citiesChecked.length > 0 || showOther;
                    return (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-x-5 gap-y-2">
                          {cities.map(city => (
                            <label key={city} className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                              <input type="checkbox" checked={citiesChecked.includes(city)} onChange={() => toggleCity(city)} className="accent-green-700 w-3.5 h-3.5" />
                              {city}
                            </label>
                          ))}
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500 select-none italic">
                            <input type="checkbox" checked={showOther} onChange={e => { setShowOther(e.target.checked); if (!e.target.checked) setCitiesOther(''); }} className="accent-green-700 w-3.5 h-3.5" />
                            {ja ? 'その他' : bn ? 'অন্যান্য' : 'Other'}
                          </label>
                        </div>
                        {showOther && (
                          <input className={inputCls}
                            placeholder={ja ? '都市名をカンマ区切りで入力' : bn ? 'কমা দিয়ে শহরের নাম লিখুন' : 'Type city names, comma-separated'}
                            value={citiesOther} onChange={e => setCitiesOther(e.target.value)} />
                        )}
                        {anyCitySelected && (
                          <div className="flex items-center gap-1 pt-1">
                            <span className="text-[11px] text-slate-400 mr-2">{ja ? '優先度：' : bn ? 'ধরন:' : 'Type:'}</span>
                            {(['preferred', 'must'] as const).map(t => (
                              <label key={t} className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 select-none mr-4">
                                <input type="radio" name="city_type_student" value={t} checked={infoForm.city_type === t}
                                  onChange={() => setInfoForm(f => ({ ...f, city_type: t }))} className="accent-green-700" />
                                {t === 'preferred' ? (ja ? '希望（柔軟）' : bn ? 'পছন্দের' : 'Preferred') : (ja ? '必須' : bn ? 'আবশ্যক' : 'Must')}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {ja ? '希望大学・学校' : bn ? 'পছন্দের প্রতিষ্ঠান' : 'Preferred institution'}
                    <span className="ml-1 font-normal text-slate-400">({ja ? '任意' : bn ? 'ঐচ্ছিক' : 'optional'})</span>
                  </label>
                  <input className={inputCls} placeholder={ja ? '例：東京大学' : bn ? 'যেমন: টোকিও বিশ্ববিদ্যালয়' : 'e.g. Tokyo University'}
                    value={infoForm.preferred_institution} onChange={set('preferred_institution')} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {ja ? '入学予定日' : bn ? 'লক্ষ্য ভর্তির তারিখ' : 'Target intake'}
                    <span className="ml-1 font-normal text-slate-400">({ja ? '任意' : bn ? 'ঐচ্ছিক' : 'optional'})</span>
                  </label>
                  <input className={inputCls} type="date" value={infoForm.target_intake} onChange={set('target_intake')} />
                </div>
              </div>
            </div>

            {/* Save / Cancel */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button onClick={() => updateInfo.mutate()} disabled={updateInfo.isPending || !infoForm.target_country}
                className="flex-1 py-3 bg-green-700 hover:bg-green-800 active:bg-green-900 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
                {updateInfo.isPending ? (ja ? '保存中...' : bn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (ja ? '情報を保存する' : bn ? 'তথ্য সংরক্ষণ করুন' : 'Save info')}
              </button>
              <button onClick={() => { goToSection('overview'); setInfoErr(''); }}
                className="sm:w-auto w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
                {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── UPLOAD DOCUMENTS ── */}
      {activeSection === 'docs' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-5">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">{ja ? '書類アップロード' : bn ? 'ডকুমেন্ট আপলোড' : 'Upload documents'}</h2>
            <button onClick={() => goToSection('overview')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1">
              {ja ? '← 戻る' : bn ? '← ফিরুন' : '← Back'}
            </button>
          </div>
          <div className="p-5 space-y-3">
            {/* Document list — labels only, no fake upload inputs */}
            {docs.map(doc => (
              <div key={doc.key} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-semibold text-slate-700">{doc.label}</p>
                    {doc.required && (
                      <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100 shrink-0">
                        {ja ? '必須' : bn ? 'আবশ্যক' : 'Required'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{doc.hint}</p>
                </div>
              </div>
            ))}
            {/* Coming soon notice — no fake file inputs */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-xs font-bold text-blue-800">
                  {ja ? 'ドキュメントアップロード — 近日公開' : bn ? 'ডকুমেন্ট আপলোড — শীঘ্রই আসছে' : 'Document upload — coming soon'}
                </p>
                <p className="text-[11px] text-blue-600 mt-0.5">
                  {ja ? 'この機能は現在準備中です。準備が整い次第お知らせします。' : bn ? 'এই ফিচারটি শীঘ্রই যোগ হবে। প্রস্তুত হলে আপনাকে জানানো হবে।' : 'This feature is being prepared. You will be notified when it is ready.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </StudentLayout>
  );
}
