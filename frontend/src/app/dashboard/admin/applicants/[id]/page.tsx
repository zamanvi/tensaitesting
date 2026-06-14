'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/context/LanguageContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  sourceBranch: { id: number; name: string } | null;
  sourceAgency: { id: number; name: string } | null;
  sourceAffiliate: { id: number; name: string } | null;
  assignedAgency: { id: number; name: string } | null;
  assignedInstitution: { id: number; name: string } | null;
}

interface AgencyProfile { id: number; vetting_status: string; user: { id: number; name: string; email: string } }

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

const ALL_STATUSES = [
  'new','profile_complete','under_review','shortlisted','interview_scheduled',
  'interviewed','offer_received','accepted','visa_processing','visa_approved',
  'visa_rejected','enrolled','closed','on_hold',
];

function fmtDate(val: string | null | undefined): string {
  if (!val) return '—';
  const [y, m, d] = val.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function fmtStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const selectCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white';

export default function AdminApplicantDetailPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const qc = useQueryClient();
  const { lang } = useLang();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const isAdmin = user?.roles?.some(r => ['admin', 'super_admin'].includes(r));
  useEffect(() => {
    if (user && !isAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isAdmin, router]);

  const [statusVal, setStatusVal] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [statusOk, setStatusOk] = useState(false);
  const [agencyOk, setAgencyOk] = useState(false);

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ['admin-lead', id],
    queryFn: () => api.get(`/admin/leads/${id}`).then(r => r.data),
    enabled: !!isAdmin && !!id,
  });

  const { data: agencies = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['admin-agencies'],
    queryFn: () => api.get('/admin/agencies', { params: { status: 'approved' } })
      .then(r => (r.data as AgencyProfile[])
        .filter(a => a.vetting_status === 'approved')
        .map(a => ({ id: a.user.id, name: a.user.name }))),
    enabled: !!isAdmin,
  });

  useEffect(() => {
    if (lead) {
      setStatusVal(lead.status);
      setAgencyId(lead.assignedAgency?.id?.toString() ?? '');
    }
  }, [lead]);

  const updateStatus = useMutation({
    mutationFn: () => api.put(`/admin/leads/${id}/status`, { status: statusVal }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-lead', id] });
      qc.invalidateQueries({ queryKey: ['admin-applicants'] });
      setStatusOk(true);
      setTimeout(() => setStatusOk(false), 3000);
    },
  });

  const assignAgency = useMutation({
    mutationFn: () => api.put(`/admin/leads/${id}/assign-agency`, { agency_id: parseInt(agencyId) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-lead', id] });
      setAgencyOk(true);
      setTimeout(() => setAgencyOk(false), 3000);
    },
  });

  const acceptSub = useMutation({
    mutationFn: () => api.put(`/admin/leads/${id}/accept-submission`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-lead', id] });
      qc.invalidateQueries({ queryKey: ['admin-applicants'] });
    },
  });

  const rejectSub = useMutation({
    mutationFn: () => api.put(`/admin/leads/${id}/reject-submission`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-lead', id] });
      qc.invalidateQueries({ queryKey: ['admin-applicants'] });
    },
  });

  if (!user || !isAdmin) return null;

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
          <p className="text-slate-400 text-sm mb-4">
            {ja ? '申請が見つかりません。' : bn ? 'আবেদন পাওয়া যায়নি।' : 'Application not found.'}
          </p>
          <Link href="/dashboard/admin/applicants"
            className="text-sm font-semibold text-green-700 underline underline-offset-2">
            {ja ? '← 一覧に戻る' : bn ? '← তালিকায় ফিরুন' : '← Back to list'}
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const hasCity = (lead.preferred_cities?.length ?? 0) > 0;

  function sourceLabel() {
    if (lead!.sourceBranch) return `🏢 ${lead!.sourceBranch.name}`;
    if (lead!.sourceAgency) return `🏪 ${lead!.sourceAgency.name}`;
    if (lead!.sourceAffiliate) return `🔗 ${lead!.sourceAffiliate.name}`;
    return ja ? '管理者' : bn ? 'অ্যাডমিন' : 'Admin';
  }

  const infoRows = [
    { label: ja ? '渡航先' : bn ? 'দেশ' : 'Country',           value: lead.target_country },
    { label: ja ? 'コース' : bn ? 'কোর্স' : 'Course',           value: lead.target_course },
    { label: ja ? '希望都市' : bn ? 'পছন্দের শহর' : 'Cities',   value: hasCity ? lead.preferred_cities!.join(', ') : null },
    { label: ja ? '都市タイプ' : bn ? 'শহরের ধরন' : 'City type', value: hasCity ? (lead.city_type === 'must' ? (ja ? '必須' : bn ? 'আবশ্যক' : 'Must') : (ja ? '希望' : bn ? 'পছন্দের' : 'Preferred')) : null },
    { label: ja ? '希望大学' : bn ? 'পছন্দের প্রতিষ্ঠান' : 'Institution', value: lead.preferred_institution },
    { label: ja ? '入学予定日' : bn ? 'ভর্তির তারিখ' : 'Target intake', value: fmtDate(lead.target_intake) !== '—' ? fmtDate(lead.target_intake) : null },
    { label: ja ? 'JLPT / NAT' : bn ? 'JLPT স্কোর' : 'JLPT / NAT', value: lead.jlpt_nat_score },
    { label: ja ? '結果日' : bn ? 'ফলাফল তারিখ' : 'Result date', value: fmtDate(lead.jlpt_nat_result_date) !== '—' ? fmtDate(lead.jlpt_nat_result_date) : null },
    { label: ja ? '受験予定日' : bn ? 'পরীক্ষার তারিখ' : 'Exam date', value: fmtDate(lead.expected_jlpt_nat_exam_date) !== '—' ? fmtDate(lead.expected_jlpt_nat_exam_date) : null },
  ].filter(r => !!r.value);

  return (
    <DashboardLayout title={title}>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-5 flex-wrap">
        <Link href="/dashboard/admin/applicants" className="hover:text-green-700 transition-colors">
          {ja ? '申請者一覧' : bn ? 'আবেদনকারী' : 'Applicants'}
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-600 truncate max-w-[160px]">{lead.lead_code}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left column: student + application info ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Student card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              {ja ? '学生情報' : bn ? 'শিক্ষার্থীর তথ্য' : 'Student'}
            </p>
            <p className="font-bold text-slate-900 text-base">{lead.student?.name ?? '—'}</p>
            <p className="text-xs text-slate-400 mt-0.5 break-all">{lead.student?.email ?? ''}</p>
            {lead.student?.phone && <p className="text-xs text-slate-400 mt-0.5">{lead.student.phone}</p>}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[lead.status] ?? 'bg-slate-100 text-slate-500'}`}>
                {fmtStatus(lead.status)}
              </span>
              {lead.submission_status === 'submitted' && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {ja ? '提出済み — 審査待ち' : bn ? 'সাবমিট হয়েছে — রিভিউ পেন্ডিং' : 'Pending Review'}
                </span>
              )}
              {lead.submission_status === 'accepted' && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
                  {ja ? '承認済み' : bn ? 'গৃহীত' : 'Accepted'}
                </span>
              )}
              {lead.submission_status === 'rejected' && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-600">
                  {ja ? '却下' : bn ? 'প্রত্যাখ্যাত' : 'Rejected'}
                </span>
              )}
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {sourceLabel()}
              </span>
              {lead.assignedAgency && (
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-700">
                  {ja ? '担当:' : bn ? 'এজেন্সি:' : 'Agency:'} {lead.assignedAgency.name}
                </span>
              )}
              <span className="text-[10px] text-slate-400 ml-auto font-mono">{lead.lead_code}</span>
            </div>

            {/* Accept / Reject — only when submitted */}
            {lead.submission_status === 'submitted' && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => acceptSub.mutate()}
                  disabled={acceptSub.isPending || rejectSub.isPending}
                  className="flex-1 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors">
                  {acceptSub.isPending ? '…' : (ja ? '✓ 承認する' : bn ? '✓ গ্রহণ করুন' : '✓ Accept')}
                </button>
                <button
                  onClick={() => rejectSub.mutate()}
                  disabled={acceptSub.isPending || rejectSub.isPending}
                  className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl disabled:opacity-50 border border-red-100 transition-colors">
                  {rejectSub.isPending ? '…' : (ja ? '✕ 却下する' : bn ? '✕ প্রত্যাখ্যান করুন' : '✕ Reject')}
                </button>
              </div>
            )}
          </div>

          {/* Application info */}
          {infoRows.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  {ja ? '申請情報' : bn ? 'আবেদনের তথ্য' : 'Application info'}
                </p>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4 text-xs">
                {infoRows.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-slate-400 mb-0.5">{label}</p>
                    <p className="font-semibold text-slate-700 break-words">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center text-slate-400 text-sm">
              {ja ? '申請情報がまだ入力されていません。' : bn ? 'আবেদনের তথ্য এখনো পূরণ হয়নি।' : 'Application info not filled yet.'}
            </div>
          )}
        </div>

        {/* ── Right column: status + agency management ── */}
        <div className="space-y-5">

          {/* Status */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              {ja ? 'ステータス変更' : bn ? 'স্ট্যাটাস পরিবর্তন' : 'Update status'}
            </p>
            <select
              className={selectCls}
              value={statusVal}
              onChange={e => setStatusVal(e.target.value)}
            >
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{fmtStatus(s)}</option>
              ))}
            </select>
            <button
              onClick={() => updateStatus.mutate()}
              disabled={updateStatus.isPending || statusVal === lead.status}
              className="mt-3 w-full py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors"
            >
              {updateStatus.isPending
                ? (ja ? '更新中...' : bn ? 'আপডেট হচ্ছে...' : 'Updating...')
                : (ja ? 'ステータスを更新' : bn ? 'স্ট্যাটাস আপডেট করুন' : 'Update status')}
            </button>
            {statusOk && (
              <p className="mt-2 text-xs text-green-700 font-semibold text-center">
                ✓ {ja ? '更新しました' : bn ? 'আপডেট হয়েছে' : 'Status updated'}
              </p>
            )}
          </div>

          {/* Assign agency */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              {ja ? 'エージェンシー割り当て' : bn ? 'এজেন্সি অ্যাসাইন' : 'Assign agency'}
            </p>
            <select
              className={selectCls}
              value={agencyId}
              onChange={e => setAgencyId(e.target.value)}
            >
              <option value="">{ja ? '未割り当て' : bn ? 'অ্যাসাইন নেই' : 'None'}</option>
              {agencies.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <button
              onClick={() => assignAgency.mutate()}
              disabled={assignAgency.isPending || !agencyId || agencyId === (lead.assignedAgency?.id?.toString() ?? '')}
              className="mt-3 w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors"
            >
              {assignAgency.isPending
                ? (ja ? '割り当て中...' : bn ? 'অ্যাসাইন হচ্ছে...' : 'Assigning...')
                : (ja ? 'エージェンシーを割り当て' : bn ? 'এজেন্সি অ্যাসাইন করুন' : 'Assign agency')}
            </button>
            {agencyOk && (
              <p className="mt-2 text-xs text-green-700 font-semibold text-center">
                ✓ {ja ? '割り当てました' : bn ? 'অ্যাসাইন হয়েছে' : 'Agency assigned'}
              </p>
            )}
          </div>

          {/* Meta info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3 text-xs">
            <div>
              <p className="text-slate-400 mb-0.5">{ja ? '登録日' : bn ? 'যোগ করার তারিখ' : 'Added'}</p>
              <p className="font-semibold text-slate-700">{new Date(lead.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-0.5">{ja ? 'プールタイプ' : bn ? 'পুল টাইপ' : 'Pool type'}</p>
              <p className="font-semibold text-slate-700 capitalize">{lead.pool_type}</p>
            </div>
            {lead.assignedInstitution && (
              <div>
                <p className="text-slate-400 mb-0.5">{ja ? '担当機関' : bn ? 'প্রতিষ্ঠান' : 'Institution'}</p>
                <p className="font-semibold text-slate-700">{lead.assignedInstitution.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
}
