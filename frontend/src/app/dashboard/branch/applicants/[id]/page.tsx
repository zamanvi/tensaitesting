'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
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
  pool_type: string;
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
  student: { id: number; name: string; email: string; phone: string | null } | null;
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

// Fix: extract YYYY-MM-DD from any ISO date string to avoid timezone shifts
function toDateInput(val: string | null | undefined): string {
  if (!val) return '';
  return val.slice(0, 10); // "2025-04-01T00:00:00Z" → "2025-04-01"
}

// Fix: display date safely without UTC-shift
function fmtDate(val: string | null | undefined): string | null {
  if (!val) return null;
  const [y, m, d] = val.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

// Title-case status for display
function fmtStatus(s: string): string {
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

function SubmitButton({ id, qc, ja, bn }: { id: number; qc: ReturnType<typeof useQueryClient>; ja: boolean; bn: boolean }) {
  const [submitBtnErr, setSubmitBtnErr] = useState('');
  const submit = useMutation({
    mutationFn: () => api.post(`/branch-admin/leads/${id}/submit`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branch-lead', String(id)] });
      qc.invalidateQueries({ queryKey: ['branch-leads'] });
      setSubmitBtnErr('');
    },
    onError: (e: unknown) => {
      const ex = e as { response?: { data?: { message?: string } } };
      setSubmitBtnErr(ex.response?.data?.message ?? 'Failed.');
    },
  });
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => submit.mutate()}
        disabled={submit.isPending}
        className="text-[10px] font-semibold px-3 py-1 rounded-full bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 transition-colors">
        {submit.isPending ? '…' : (ja ? '提出する' : bn ? 'সাবমিট করুন' : 'Submit to Admin')}
      </button>
      {submitBtnErr && <p className="text-[10px] text-red-500">{submitBtnErr}</p>}
    </div>
  );
}


export default function BranchApplicantDetailPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const qc = useQueryClient();
  const { lang } = useLang();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const isBranchAdmin = user?.roles?.some(r => r === 'branch_admin' || r === 'branch_manager');
  useEffect(() => {
    if (user && !isBranchAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isBranchAdmin, router]);

  const { data: countryData = {}, isSuccess: countriesLoaded } = useCountryData();

  const initializedLeadId = useRef<number | null>(null);

  const [activeSection, setActiveSection] = useState<'overview' | 'info' | 'docs'>('overview');
  const [infoForm, setInfoForm] = useState<InfoForm>(EMPTY_INFO);
  const [citiesChecked, setCitiesChecked] = useState<string[]>([]);
  const [citiesOther, setCitiesOther] = useState('');
  const [showOther, setShowOther] = useState(false);
  const [infoErr, setInfoErr] = useState('');
  const [infoSuccess, setInfoSuccess] = useState(false);
  const [docFiles, setDocFiles] = useState<Partial<Record<DocKey, string>>>({});

  // Fix: scroll to top whenever section changes — essential on mobile
  function goToSection(s: 'overview' | 'info' | 'docs') {
    setActiveSection(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ['branch-lead', id],
    queryFn: () => api.get(`/branch-admin/leads/${id}`).then(r => r.data),
    enabled: !!isBranchAdmin && !!id,
  });

  useEffect(() => {
    // Wait until both lead and countryData fetch are complete before initializing
    if (!lead || !countriesLoaded) return;
    // Guard: don't re-initialize same lead when countryData cache refreshes mid-edit
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
        // Reset city selections when country changes
        setCitiesChecked([]);
        setCitiesOther('');
        setShowOther(false);
      }
      setInfoForm(f => ({ ...f, [field]: e.target.value }));
    };

  function toggleCity(city: string) {
    setCitiesChecked(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  }

  const updateInfo = useMutation({
    mutationFn: () => {
      return api.patch(`/branch-admin/leads/${id}`, {
        target_country:              infoForm.target_country || null,
        target_course:               infoForm.target_course || null,
        target_intake:               infoForm.target_intake || null,
        preferred_cities:            [
          ...citiesChecked,
          ...citiesOther.split(',').map(c => c.trim()).filter(Boolean),
        ],
        city_type:                   infoForm.city_type,
        preferred_institution:       infoForm.preferred_institution || null,
        jlpt_nat_score:              infoForm.jlpt_nat_score || null,
        jlpt_nat_result_date:        infoForm.jlpt_nat_result_date || null,
        expected_jlpt_nat_exam_date: infoForm.expected_jlpt_nat_exam_date || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branch-lead', id] });
      qc.invalidateQueries({ queryKey: ['branch-leads'] });
      initializedLeadId.current = null; // allow re-init from fresh lead data after refetch
      setInfoSuccess(true);
      setTimeout(() => setInfoSuccess(false), 3500);
      setInfoErr('');
      goToSection('overview');
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = err.response?.data?.errors;
      setInfoErr(errs ? Object.values(errs).flat().join(' ') : err.response?.data?.message ?? 'Failed.');
    },
  });

  if (!user || !isBranchAdmin) return null;

  // Fix: include lead code + student name in page title
  const title = lead
    ? `${lead.lead_code} — ${lead.student?.name ?? ''}`
    : (ja ? '申請詳細' : bn ? 'আবেদন বিস্তারিত' : 'Application');

  if (isLoading) {
    return (
      <DashboardLayout title={title}>
        <div className="text-center py-16 text-slate-400 text-sm">
          {ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout title={title}>
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-slate-400 text-sm mb-4">{ja ? '申請が見つかりません。' : bn ? 'আবেদন পাওয়া যায়নি।' : 'Application not found.'}</p>
          <Link href="/dashboard/branch/applicants"
            className="inline-block text-sm font-semibold text-green-700 underline underline-offset-2">
            {ja ? '← 一覧に戻る' : bn ? '← তালিকায় ফিরুন' : '← Back to list'}
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const infoComplete = !!lead.target_country;
  const docsLocked   = !infoComplete;
  const hasCity      = (lead.preferred_cities?.length ?? 0) > 0;
  const hasJlpt      = !!lead.jlpt_nat_score;

  const docsStarted = Object.keys(docFiles).length > 0;
  const doneCount   = (infoComplete ? 1 : 0) + (docsStarted ? 1 : 0);
  const progressPct = doneCount * 50;

  // Fix: show summary only when actual application fields are set, not just phone
  const anythingFilled = !!(
    lead.target_country || lead.target_course || lead.target_intake ||
    hasCity || lead.preferred_institution || lead.jlpt_nat_score
  );

  const docs: { key: DocKey; label: string; hint: string; required: boolean }[] = [
    {
      key: 'passport',
      label: ja ? 'パスポートコピー' : bn ? 'পাসপোর্টের কপি' : 'Passport copy',
      hint:  ja ? 'JPG, PNG または PDF — 最大5MB' : bn ? 'JPG, PNG বা PDF — সর্বোচ্চ ৫MB' : 'JPG, PNG or PDF — max 5MB',
      required: true,
    },
    {
      key: 'certs',
      label: ja ? '学歴証明書' : bn ? 'একাডেমিক সার্টিফিকেট' : 'Academic certificates',
      hint:  ja ? 'SSC / HSC または学位証明書' : bn ? 'SSC/HSC বা ডিগ্রি সার্টিফিকেট' : 'SSC, HSC or degree certificates',
      required: true,
    },
    {
      key: 'lang',
      label: ja ? 'JLPT / NAT スコアシート' : bn ? 'ভাষার স্কোর শিট' : 'Language score sheet',
      hint:  ja ? '任意' : bn ? 'ঐচ্ছিক' : 'Optional',
      required: false,
    },
    {
      key: 'trans',
      label: ja ? '成績証明書' : bn ? 'ট্রান্সক্রিপ্ট' : 'Transcripts',
      hint:  ja ? '任意 — マークシートなど' : bn ? 'ঐচ্ছিক — মার্কশিট' : 'Optional — mark sheets',
      required: false,
    },
  ];

  return (
    <DashboardLayout title={title}>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-5 flex-wrap">
        <Link href="/dashboard/branch/applicants" className="hover:text-green-700 transition-colors">
          {ja ? '申請一覧' : bn ? 'আবেদন' : 'Applications'}
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-600 truncate max-w-[160px]">{lead.lead_code}</span>
      </div>

      {/* ── HEADER CARD ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          {/* Left: student info */}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 text-base leading-tight break-words">
              {lead.student?.name ?? '—'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 break-all">{lead.student?.email ?? ''}</p>
            {lead.student?.phone && (
              <p className="text-xs text-slate-400 mt-0.5">{lead.student.phone}</p>
            )}
          </div>
          {/* Right: status + submission + code */}
          <div className="flex-shrink-0 text-right flex flex-col items-end gap-1">
            <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full ${STATUS_COLORS[lead.status] ?? 'bg-slate-100 text-slate-500'}`}>
              {fmtStatus(lead.status)}
            </span>
            {lead.submission_status && lead.submission_status !== 'draft' && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${{
                submitted: 'bg-amber-100 text-amber-700',
                accepted:  'bg-green-100 text-green-700',
                rejected:  'bg-red-100 text-red-600',
              }[lead.submission_status] ?? 'bg-slate-100 text-slate-500'}`}>
                {fmtStatus(lead.submission_status)}
              </span>
            )}
            {lead.submission_status === 'draft' && (
              <SubmitButton id={lead.id} qc={qc} ja={ja} bn={bn} />
            )}
            <p className="text-[11px] text-slate-400 font-mono">{lead.lead_code}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap font-medium">
            {ja ? `ステップ ${doneCount} / 2` : bn ? `ধাপ ${doneCount} / ২` : `Step ${doneCount} of 2`}
          </span>
        </div>

        {/* Save success toast */}
        {infoSuccess && (
          <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
            <span className="flex-shrink-0">✓</span>
            <span>{ja ? '情報を保存しました。' : bn ? 'তথ্য সংরক্ষিত হয়েছে।' : 'Info saved successfully.'}</span>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════
          OVERVIEW
      ════════════════════════════════════════ */}
      {activeSection === 'overview' && (
        <>
          {/* Fix: add pt-4 on grid so top badges don't clip into header card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-8 pt-3 mb-5">

            {/* ── Card 1: Fill up info ── */}
            <div className={`bg-white rounded-2xl border shadow-sm p-5 relative ${infoComplete ? 'border-green-200' : 'border-slate-100'}`}>
              {/* Pill badge */}
              <div className={`absolute -top-3 left-4 text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                infoComplete
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {infoComplete
                  ? (ja ? '✓ 完了' : bn ? '✓ সম্পন্ন' : '✓ Complete')
                  : (ja ? '未記入' : bn ? 'অসম্পন্ন' : 'Pending')}
              </div>

              {/* Card header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-lg ${infoComplete ? 'bg-green-100' : 'bg-slate-100'}`}>
                  📋
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {ja ? '情報入力' : bn ? 'তথ্য পূরণ করুন' : 'Fill up info'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {ja ? '個人・学歴・渡航先' : bn ? 'ব্যক্তিগত, একাডেমিক ও গন্তব্য' : 'Personal, academic & destination'}
                  </p>
                </div>
              </div>

              {/* Checklist — Fix: personal info row shows data, no misleading ✓/○ */}
              <div className="space-y-2 mb-4">
                {/* Personal */}
                <div className="flex items-start gap-2 text-[11px]">
                  <span className="flex-shrink-0 text-slate-300 mt-0.5">○</span>
                  <div className="min-w-0 break-words">
                    <span className="text-slate-500 font-semibold">{ja ? '個人情報' : bn ? 'ব্যক্তিগত তথ্য' : 'Personal info'}</span>
                    <span className="text-slate-400 ml-1">
                      — {lead.student?.name ?? '—'}
                      {lead.student?.phone ? `, ${lead.student.phone}` : (
                        <span className="text-amber-500"> ({ja ? '電話なし' : bn ? 'ফোন নম্বর নেই' : 'no phone'})</span>
                      )}
                    </span>
                  </div>
                </div>
                {/* Academic */}
                <div className="flex items-start gap-2 text-[11px]">
                  <span className={`flex-shrink-0 mt-0.5 font-bold ${hasJlpt ? 'text-green-600' : 'text-slate-300'}`}>
                    {hasJlpt ? '✓' : '○'}
                  </span>
                  <div className="min-w-0 break-words">
                    <span className="text-slate-500 font-semibold">{ja ? 'JLPT / NAT' : bn ? 'একাডেমিক / JLPT' : 'Academic / JLPT'}</span>
                    <span className="text-slate-400 ml-1">
                      — {lead.jlpt_nat_score ?? (ja ? '未入力' : bn ? 'নেই' : 'not set')}
                    </span>
                  </div>
                </div>
                {/* Destination */}
                <div className="flex items-start gap-2 text-[11px]">
                  <span className={`flex-shrink-0 mt-0.5 font-bold ${infoComplete ? 'text-green-600' : 'text-slate-300'}`}>
                    {infoComplete ? '✓' : '○'}
                  </span>
                  <div className="min-w-0 break-words">
                    <span className="text-slate-500 font-semibold">{ja ? '渡航先' : bn ? 'গন্তব্য' : 'Destination'}</span>
                    <span className="text-slate-400 ml-1">
                      — {lead.target_country
                        ? [lead.target_country, lead.target_course, hasCity ? lead.preferred_cities!.join(', ') : null].filter(Boolean).join(' · ')
                        : (ja ? '未入力' : bn ? 'নেই' : 'not set')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => goToSection('info')}
                className="w-full py-2.5 bg-green-700 hover:bg-green-800 active:bg-green-900 text-white text-xs font-bold rounded-xl transition-colors"
              >
                {infoComplete
                  ? (ja ? '✎ 編集する' : bn ? '✎ সম্পাদনা করুন' : '✎ Edit info')
                  : (ja ? '+ 入力を開始する' : bn ? '+ তথ্য পূরণ শুরু করুন' : '+ Start filling info')}
              </button>
            </div>

            {/* ── Card 2: Upload documents ── */}
            <div className={`bg-white rounded-2xl border shadow-sm p-5 relative ${docsLocked ? 'opacity-50 border-slate-100' : 'border-slate-100'}`}>
              {/* Pill badge */}
              <div className={`absolute -top-3 left-4 text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                docsLocked
                  ? 'bg-slate-100 text-slate-500 border-slate-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {docsLocked
                  ? (ja ? 'ロック中' : bn ? 'লক' : 'Locked')
                  : (ja ? '未完了' : bn ? 'অসম্পন্ন' : 'Pending')}
              </div>

              {/* Card header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-100 text-lg">
                  📁
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {ja ? '書類アップロード' : bn ? 'ডকুমেন্ট আপলোড' : 'Upload documents'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {ja ? 'パスポート、証明書など' : bn ? 'পাসপোর্ট, সার্টিফিকেট ইত্যাদি' : 'Passport, certs & transcripts'}
                  </p>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-2 mb-4">
                {docs.map(d => {
                  const filed = !!docFiles[d.key];
                  return (
                    <div key={d.key} className="flex items-center gap-2 text-[11px]">
                      <span className={`flex-shrink-0 font-bold ${filed ? 'text-green-600' : 'text-slate-300'}`}>
                        {filed ? '✓' : '○'}
                      </span>
                      <span className={`break-words ${filed ? 'text-slate-600' : 'text-slate-500'}`}>{d.label}</span>
                      {!d.required && (
                        <span className="text-slate-400 flex-shrink-0">
                          ({ja ? '任意' : bn ? 'ঐচ্ছিক' : 'optional'})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                disabled={docsLocked}
                onClick={() => goToSection('docs')}
                className={`w-full py-2.5 text-xs font-bold rounded-xl transition-colors ${
                  docsLocked
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-green-700 hover:bg-green-800 active:bg-green-900 text-white'
                }`}
              >
                {docsLocked
                  ? (ja ? '🔒 ステップ1を先に完了してください' : bn ? '🔒 প্রথমে ধাপ ১ সম্পন্ন করুন' : '🔒 Complete step 1 first')
                  : (ja ? '+ 書類をアップロード' : bn ? '+ ডকুমেন্ট আপলোড করুন' : '+ Upload documents')}
              </button>
            </div>
          </div>

          {/* Ready notice — shown when both sections complete */}
          {infoComplete && docsStarted && (
            <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-[11px] text-green-700 mb-3">
              <span className="flex-shrink-0 mt-0.5">✓</span>
              <span>
                {ja
                  ? 'この申請は完了しています。管理者が審査を開始します。'
                  : bn
                  ? 'এই আবেদন সম্পন্ন হয়েছে। অ্যাডমিন শীঘ্রই পর্যালোচনা শুরু করবেন।'
                  : 'Application is complete — admin will begin review shortly.'}
              </span>
            </div>
          )}

          {/* Always-visible notice */}
          <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11px] text-slate-500 mb-5">
            <span className="flex-shrink-0 mt-0.5">ℹ️</span>
            <span>
              {ja
                ? '両方のセクションを完了しないと、この申請書は管理者に審査されたり、大学に表示されたりすることはありません。'
                : bn
                ? 'উভয় সেকশন সম্পন্ন না হলে এই আবেদন অ্যাডমিন পর্যালোচনা করতে বা প্রতিষ্ঠানে দেখাতে পারবে না।'
                : 'Both sections must be complete before this application can be reviewed by admin or shown to institutions.'}
            </span>
          </div>

          {/* Fix: show summary whenever any field is filled, not only when infoComplete */}
          {anythingFilled && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  {ja ? '申請概要' : bn ? 'আবেদনের সারসংক্ষেপ' : 'Application summary'}
                </p>
                <button
                  onClick={() => goToSection('info')}
                  className="text-xs text-green-700 font-semibold hover:underline"
                >
                  {ja ? '編集' : bn ? 'সম্পাদনা' : 'Edit'}
                </button>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4 text-xs">
                {([
                  {
                    label: ja ? '渡航先' : bn ? 'দেশ' : 'Country',
                    value: lead.target_country,
                  },
                  {
                    label: ja ? 'コース' : bn ? 'কোর্স' : 'Course',
                    value: lead.target_course,
                  },
                  {
                    label: ja ? '都市 / タイプ' : bn ? 'শহর / ধরন' : 'City / type',
                    value: hasCity
                      ? `${lead.preferred_cities!.join(', ')} (${lead.city_type === 'must'
                          ? (ja ? '必須' : bn ? 'আবশ্যক' : 'must')
                          : (ja ? '希望' : bn ? 'পছন্দের' : 'preferred')})`
                      : null,
                  },
                  {
                    label: ja ? '希望大学' : bn ? 'পছন্দের প্রতিষ্ঠান' : 'Preferred institution',
                    value: lead.preferred_institution,
                  },
                  {
                    label: ja ? '入学予定日' : bn ? 'ভর্তির তারিখ' : 'Target intake',
                    // Fix: use safe date display
                    value: fmtDate(lead.target_intake),
                  },
                  {
                    label: ja ? 'JLPTスコア' : bn ? 'JLPT স্কোর' : 'JLPT / NAT',
                    value: lead.jlpt_nat_score,
                  },
                  {
                    // Fix: JLPT dates now appear in summary
                    label: ja ? '結果発表日' : bn ? 'ফলাফল তারিখ' : 'JLPT result date',
                    value: fmtDate(lead.jlpt_nat_result_date),
                  },
                  {
                    label: ja ? '受験予定日' : bn ? 'পরীক্ষার তারিখ' : 'Expected exam date',
                    value: fmtDate(lead.expected_jlpt_nat_exam_date),
                  },
                  {
                    label: ja ? '電話番号' : bn ? 'ফোন' : 'Phone',
                    value: lead.student?.phone,
                  },
                  {
                    label: ja ? '登録日' : bn ? 'যোগ করার তারিখ' : 'Added',
                    // Fix: created_at is a full ISO datetime, safe to use Date()
                    value: new Date(lead.created_at).toLocaleDateString(),
                  },
                // Fix: skip rows with no value — keeps summary clean, no cluttered '—' rows
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

      {/* ════════════════════════════════════════
          FILL UP INFO FORM
      ════════════════════════════════════════ */}
      {activeSection === 'info' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-5">

          {/* Locked notice when accepted */}
          {lead.submission_status === 'accepted' && (
            <div className="px-5 py-3 bg-green-50 border-b border-green-100 text-xs text-green-700 font-semibold">
              🔒 {ja ? 'この申請は承認済みのため編集できません。' : bn ? 'এই আবেদন গৃহীত হয়েছে, সম্পাদনা করা যাবে না।' : 'This applicant has been accepted and cannot be edited.'}
            </div>
          )}

          {/* Form header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">
              {ja ? '情報入力' : bn ? 'তথ্য পূরণ করুন' : 'Fill up info'}
            </h2>
            <button
              onClick={() => { goToSection('overview'); setInfoErr(''); }}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1"
            >
              {ja ? '← 戻る' : bn ? '← ফিরুন' : '← Back'}
            </button>
          </div>

          <div className="p-5">
            {infoErr && (
              <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-start gap-2">
                <span className="flex-shrink-0">⚠️</span>
                <span>{infoErr}</span>
              </div>
            )}

            {/* ── Section A: Personal info (read-only display) ── */}
            <div className="mb-6">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                {ja ? '個人情報' : bn ? 'ব্যক্তিগত তথ্য' : 'Personal info'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                  <p className="text-[10px] text-slate-400 mb-0.5">{ja ? '氏名' : bn ? 'নাম' : 'Full name'}</p>
                  <p className="text-sm font-semibold text-slate-700 break-words">{lead.student?.name ?? '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                  <p className="text-[10px] text-slate-400 mb-0.5">{ja ? 'メール' : bn ? 'ইমেইল' : 'Email'}</p>
                  <p className="text-sm font-semibold text-slate-700 break-all">{lead.student?.email ?? '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                  <p className="text-[10px] text-slate-400 mb-0.5">{ja ? '電話番号' : bn ? 'ফোন' : 'Phone'}</p>
                  <p className={`text-sm font-semibold ${lead.student?.phone ? 'text-slate-700' : 'text-amber-500'}`}>
                    {lead.student?.phone ?? (ja ? '未登録' : bn ? 'নেই' : 'Not set')}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                {ja
                  ? '個人情報は学生プロフィールで管理されます。変更は管理者にお問い合わせください。'
                  : bn
                  ? 'ব্যক্তিগত তথ্য শিক্ষার্থীর প্রোফাইলে পরিচালিত হয়। পরিবর্তনের জন্য অ্যাডমিনকে জানান।'
                  : 'Personal info is managed on the student profile. Contact admin to update it.'}
              </p>
            </div>

            {/* Fix: section divider */}
            <div className="border-t border-slate-100 mb-6" />

            {/* ── Section B: Academic / JLPT ── */}
            <div className="mb-6">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                {ja ? '学歴 / JLPT · NAT' : bn ? 'একাডেমিক / JLPT · NAT' : 'Academic / JLPT · NAT'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="jlpt_score" className="block text-xs font-semibold text-slate-500 mb-1">
                    {ja ? 'スコア' : bn ? 'JLPT / NAT স্কোর' : 'JLPT / NAT score'}
                    <span className="ml-1 font-normal text-slate-400">({ja ? '任意' : bn ? 'ঐচ্ছিক' : 'optional'})</span>
                  </label>
                  <input
                    id="jlpt_score"
                    className={inputCls}
                    placeholder={ja ? '例：N3、NAT5級' : bn ? 'যেমন: N3, NAT 5' : 'e.g. N3, NAT 5, N2 — 85pts'}
                    value={infoForm.jlpt_nat_score}
                    onChange={set('jlpt_nat_score')}
                  />
                </div>
                <div>
                  <label htmlFor="jlpt_result" className="block text-xs font-semibold text-slate-500 mb-1">
                    {ja ? '結果発表日' : bn ? 'ফলাফল তারিখ' : 'Result date'}
                    <span className="ml-1 font-normal text-slate-400">({ja ? '取得済みの場合' : bn ? 'পরীক্ষা দেওয়া হলে' : 'if already taken'})</span>
                  </label>
                  <input
                    id="jlpt_result"
                    className={inputCls}
                    type="date"
                    value={infoForm.jlpt_nat_result_date}
                    onChange={set('jlpt_nat_result_date')}
                  />
                </div>
                <div>
                  <label htmlFor="jlpt_exam" className="block text-xs font-semibold text-slate-500 mb-1">
                    {ja ? '受験予定日' : bn ? 'পরীক্ষার প্রত্যাশিত তারিখ' : 'Expected exam date'}
                    <span className="ml-1 font-normal text-slate-400">({ja ? '未受験の場合' : bn ? 'এখনো দেননি হলে' : 'if not yet taken'})</span>
                  </label>
                  <input
                    id="jlpt_exam"
                    className={inputCls}
                    type="date"
                    value={infoForm.expected_jlpt_nat_exam_date}
                    onChange={set('expected_jlpt_nat_exam_date')}
                  />
                </div>
              </div>
            </div>

            {/* Fix: section divider */}
            <div className="border-t border-slate-100 mb-6" />

            {/* ── Section C: Destination preference ── */}
            <div className="mb-6">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                {ja ? '渡航先の希望' : bn ? 'গন্তব্য পছন্দ' : 'Destination preference'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="target_country" className="block text-xs font-semibold text-slate-500 mb-1">
                    {ja ? '渡航先' : bn ? 'লক্ষ্য দেশ' : 'Target country'}
                    <span className="ml-1 text-red-400 font-bold">*</span>
                  </label>
                  <select
                    id="target_country"
                    className={selectCls}
                    value={infoForm.target_country}
                    onChange={set('target_country')}
                  >
                    <option value="">{ja ? '選択してください' : bn ? 'বেছে নিন' : 'Select country'}</option>
                    {/* Fallback: show existing value if admin removed it from settings */}
                    {infoForm.target_country && !Object.keys(countryData).includes(infoForm.target_country) && (
                      <option value={infoForm.target_country}>{infoForm.target_country}</option>
                    )}
                    {Object.keys(countryData).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="target_course" className="block text-xs font-semibold text-slate-500 mb-1">
                    {ja ? 'コース' : bn ? 'কোর্স' : 'Course'}
                    <span className="ml-1 font-normal text-slate-400">({ja ? '任意' : bn ? 'ঐচ্ছিক' : 'optional'})</span>
                  </label>
                  <input
                    id="target_course"
                    className={inputCls}
                    placeholder={ja ? '例：日本語学校' : bn ? 'যেমন: জাপানি ভাষা' : 'e.g. Japanese Language'}
                    value={infoForm.target_course}
                    onChange={set('target_course')}
                  />
                </div>
                <div className="sm:col-span-2">
                  <p className="block text-xs font-semibold text-slate-500 mb-2">
                    {ja ? '希望都市' : bn ? 'পছন্দের শহর' : 'City preference'}
                    <span className="ml-1 font-normal text-slate-400">({ja ? '任意' : bn ? 'ঐচ্ছিক' : 'optional'})</span>
                  </p>
                  {(() => {
                    const cities = countryData[infoForm.target_country] ?? [];
                    if (!infoForm.target_country) {
                      return (
                        <p className="text-xs text-slate-400 italic">
                          {ja ? '先に国を選択してください' : bn ? 'আগে দেশ বেছে নিন' : 'Select a country first'}
                        </p>
                      );
                    }
                    if (cities.length === 0) {
                      return (
                        <p className="text-xs text-slate-400 italic">
                          {ja ? 'この国の都市はまだ設定されていません。' : bn ? 'এই দেশের শহর এখনো সেট করা হয়নি।' : 'No cities configured for this country yet.'}
                        </p>
                      );
                    }
                    const anyCitySelected = citiesChecked.length > 0 || showOther;
                    return (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-x-5 gap-y-2">
                          {cities.map(city => (
                            <label key={city} className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                              <input
                                type="checkbox"
                                checked={citiesChecked.includes(city)}
                                onChange={() => toggleCity(city)}
                                className="accent-green-700 w-3.5 h-3.5"
                              />
                              {city}
                            </label>
                          ))}
                          {/* Other option — always present */}
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500 select-none italic">
                            <input
                              type="checkbox"
                              checked={showOther}
                              onChange={e => { setShowOther(e.target.checked); if (!e.target.checked) setCitiesOther(''); }}
                              className="accent-green-700 w-3.5 h-3.5"
                            />
                            {ja ? 'その他' : bn ? 'অন্যান্য' : 'Other'}
                          </label>
                        </div>
                        {showOther && (
                          <input
                            className={inputCls}
                            placeholder={ja ? '都市名をカンマ区切りで入力' : bn ? 'কমা দিয়ে শহরের নাম লিখুন' : 'Type city names, comma-separated'}
                            value={citiesOther}
                            onChange={e => setCitiesOther(e.target.value)}
                          />
                        )}
                        {/* City type — shown only when a city is selected */}
                        {anyCitySelected && (
                          <div className="flex items-center gap-1 pt-1">
                            <span className="text-[11px] text-slate-400 mr-2">
                              {ja ? '優先度：' : bn ? 'ধরন:' : 'Type:'}
                            </span>
                            {(['preferred', 'must'] as const).map(t => (
                              <label key={t} className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 select-none mr-4">
                                <input
                                  type="radio"
                                  name="city_type_edit"
                                  value={t}
                                  checked={infoForm.city_type === t}
                                  onChange={() => setInfoForm(f => ({ ...f, city_type: t }))}
                                  className="accent-green-700"
                                />
                                {t === 'preferred'
                                  ? (ja ? '希望（柔軟）' : bn ? 'পছন্দের' : 'Preferred')
                                  : (ja ? '必須' : bn ? 'আবশ্যক' : 'Must')}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <label htmlFor="pref_inst" className="block text-xs font-semibold text-slate-500 mb-1">
                    {ja ? '希望大学・学校' : bn ? 'পছন্দের প্রতিষ্ঠান' : 'Preferred institution'}
                    <span className="ml-1 font-normal text-slate-400">({ja ? '任意' : bn ? 'ঐচ্ছিক' : 'optional'})</span>
                  </label>
                  <input
                    id="pref_inst"
                    className={inputCls}
                    placeholder={ja ? '例：東京大学' : bn ? 'যেমন: টোকিও বিশ্ববিদ্যালয়' : 'e.g. Tokyo University'}
                    value={infoForm.preferred_institution}
                    onChange={set('preferred_institution')}
                  />
                </div>
                <div>
                  <label htmlFor="intake" className="block text-xs font-semibold text-slate-500 mb-1">
                    {ja ? '入学予定日' : bn ? 'লক্ষ্য ভর্তির তারিখ' : 'Target intake'}
                    <span className="ml-1 font-normal text-slate-400">({ja ? '任意' : bn ? 'ঐচ্ছিক' : 'optional'})</span>
                  </label>
                  <input
                    id="intake"
                    className={inputCls}
                    type="date"
                    value={infoForm.target_intake}
                    onChange={set('target_intake')}
                  />
                </div>
              </div>
            </div>

            {/* Save / Cancel */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={() => updateInfo.mutate()}
                disabled={updateInfo.isPending || !infoForm.target_country || lead.submission_status === 'accepted'}
                className="flex-1 py-3 bg-green-700 hover:bg-green-800 active:bg-green-900 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
              >
                {updateInfo.isPending
                  ? (ja ? '保存中...' : bn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                  : (ja ? '情報を保存する' : bn ? 'তথ্য সংরক্ষণ করুন' : 'Save info')}
              </button>
              <button
                onClick={() => { goToSection('overview'); setInfoErr(''); }}
                className="sm:w-auto w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          UPLOAD DOCUMENTS
      ════════════════════════════════════════ */}
      {activeSection === 'docs' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-5">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">
              {ja ? '書類アップロード' : bn ? 'ডকুমেন্ট আপলোড' : 'Upload documents'}
            </h2>
            <button
              onClick={() => goToSection('overview')}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1"
            >
              {ja ? '← 戻る' : bn ? '← ফিরুন' : '← Back'}
            </button>
          </div>

          <div className="p-5 space-y-3">
            {docs.map(doc => (
              <div
                key={doc.key}
                className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-semibold text-slate-700">{doc.label}</p>
                    {doc.required && (
                      <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100 flex-shrink-0">
                        {ja ? '必須' : bn ? 'আবশ্যক' : 'Required'}
                      </span>
                    )}
                  </div>
                  {/* Fix: show selected filename under hint */}
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {docFiles[doc.key]
                      ? <span className="text-green-600 font-medium">✓ {docFiles[doc.key]}</span>
                      : doc.hint}
                  </p>
                </div>
                <label
                  className="flex-shrink-0 cursor-pointer px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl hover:border-green-400 hover:text-green-700 active:bg-slate-50 transition-colors text-slate-600"
                >
                  {docFiles[doc.key]
                    ? (ja ? '変更' : bn ? 'পরিবর্তন' : 'Change')
                    : (ja ? 'ファイルを選択' : bn ? 'ফাইল বেছে নিন' : 'Choose file')}
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) setDocFiles(prev => ({ ...prev, [doc.key]: file.name }));
                    }}
                  />
                </label>
              </div>
            ))}

            {/* Coming-soon notice */}
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-700">
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <span>
                {ja
                  ? 'ドキュメントのストレージ統合は近日公開予定です。現在はファイルを選択できますが、サーバーには保存されません。'
                  : bn
                  ? 'ডকুমেন্ট আপলোড স্টোরেজ ইন্টিগ্রেশন শীঘ্রই আসছে। এখন ফাইল বেছে নেওয়া যাবে কিন্তু সার্ভারে সংরক্ষণ হবে না।'
                  : 'Document storage integration coming soon. Files can be selected but are not yet saved to the server.'}
              </span>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
