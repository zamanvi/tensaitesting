'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface Lead {
  id: number;
  lead_code: string;
  status: string;
  created_at: string;
  target_course?: string | null;
  target_intake?: string | null;
  student: {
    name: string;
    email: string;
    eligibility_score?: number | null;
    jlpt_level?: string | null;
    nat_level?: string | null;
    gpa?: number | null;
    highest_qualification?: string | null;
  } | null;
  agency_name?: string | null;
}

const STATUS_META: Record<string, { color: string; dot: string; en: string; ja: string; bn: string }> = {
  new:         { color: 'bg-slate-100 text-slate-600',    dot: 'bg-slate-400',   en: 'New',         ja: '新規',     bn: 'নতুন' },
  contacted:   { color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-400',    en: 'Contacted',   ja: '連絡済み', bn: 'যোগাযোগ' },
  shortlisted: { color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-400',   en: 'Shortlisted', ja: '選考中',   bn: 'শর্টলিস্টেড' },
  applied:     { color: 'bg-indigo-100 text-indigo-700',  dot: 'bg-indigo-400',  en: 'Applied',     ja: '申請済み', bn: 'আবেদন হয়েছে' },
  interview:   { color: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-400',  en: 'Interview',   ja: '面接',     bn: 'ইন্টারভিউ' },
  enrolled:    { color: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-500', en: 'Enrolled',    ja: '入学済み', bn: 'ভর্তি হয়েছে' },
  rejected:    { color: 'bg-red-100 text-red-600',        dot: 'bg-red-400',     en: 'Rejected',    ja: '却下',     bn: 'প্রত্যাখ্যাত' },
  withdrawn:   { color: 'bg-gray-100 text-gray-500',      dot: 'bg-gray-300',    en: 'Withdrawn',   ja: '取り下げ', bn: 'প্রত্যাহার' },
};

const SCORE_COLOR = (s: number) =>
  s >= 80 ? 'bg-emerald-100 text-emerald-700' :
  s >= 60 ? 'bg-green-100 text-green-700' :
  s >= 40 ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-500';

export default function InstitutionLeadsPage() {
  const { lang, t } = useLang();
  const statuses = t.statuses;
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const [filter, setFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['institution-leads'],
    queryFn: () => api.get('/institution/leads').then(r => r.data),
    staleTime: 30_000,
  });

  const allLeads: Lead[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  // Build filter tabs from distinct statuses present in data
  const statusCounts: Record<string, number> = { all: allLeads.length };
  for (const l of allLeads) statusCounts[l.status] = (statusCounts[l.status] ?? 0) + 1;

  const displayed = filter === 'all' ? allLeads : allLeads.filter(l => l.status === filter);

  const title = ja ? '応募一覧' : bn ? 'আবেদন তালিকা' : 'Applications';

  return (
    <DashboardLayout title={title}>

      {/* Status summary row */}
      {!isLoading && allLeads.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {Object.entries(STATUS_META)
            .filter(([key]) => (statusCounts[key] ?? 0) > 0)
            .map(([key, meta]) => (
              <button key={key} onClick={() => setFilter(key === filter ? 'all' : key)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  filter === key
                    ? 'border-green-300 bg-green-50 ring-1 ring-green-300'
                    : 'border-slate-100 bg-white hover:border-slate-200'
                }`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-700 truncate">
                    {ja ? meta.ja : bn ? meta.bn : meta.en}
                  </div>
                  <div className="text-lg font-black text-slate-900 leading-tight">{statusCounts[key]}</div>
                </div>
              </button>
            ))}
        </div>
      )}

      {/* Filter tabs (text-only for all+active) */}
      {!isLoading && allLeads.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filter === 'all' ? 'bg-green-700 text-white border-green-700' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}>
            {ja ? `すべて (${allLeads.length})` : bn ? `সব (${allLeads.length})` : `All (${allLeads.length})`}
          </button>
          {Object.entries(statusCounts)
            .filter(([key]) => key !== 'all' && STATUS_META[key])
            .map(([key, count]) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  filter === key ? 'bg-green-700 text-white border-green-700' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}>
                {ja ? STATUS_META[key].ja : bn ? STATUS_META[key].bn : STATUS_META[key].en} ({count})
              </button>
            ))}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          {ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}
        </div>
      ) : allLeads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 sm:p-16 text-center">
          <div className="text-4xl mb-3">📋</div>
          <div className="font-medium text-slate-600">
            {ja ? '割り当てられた申請はまだありません' : bn ? 'এখনো কোনো আবেদন নেই' : 'No applications assigned yet'}
          </div>
          <div className="text-sm text-slate-400 mt-1">
            {ja ? 'エージェンシーがあなたの機関に学生を割り当てると、ここに表示されます。'
              : bn ? 'এজেন্সি শিক্ষার্থী নিযুক্ত করলে এখানে দেখাবে।'
              : 'Applications from agencies will appear here once assigned to your institution.'}
          </div>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm">
          {ja ? '該当する申請がありません' : bn ? 'এই ফিল্টারে কোনো আবেদন নেই' : 'No applications in this stage'}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((lead) => {
            const meta = STATUS_META[lead.status];
            const statusLabel = statuses[lead.status as keyof typeof statuses] ?? (meta ? (ja ? meta.ja : bn ? meta.bn : meta.en) : lead.status.replace(/_/g, ' '));
            const score = lead.student?.eligibility_score;
            return (
              <div key={lead.id} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">
                <div className="flex flex-wrap items-start gap-2 mb-2">
                  {/* Student name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm text-slate-900">
                        {lead.student?.name ?? (ja ? '学生' : bn ? 'শিক্ষার্থী' : 'Student')}
                      </span>
                      {score != null && (
                        <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${SCORE_COLOR(score)}`}>
                          AI {score}%
                        </span>
                      )}
                    </div>
                    {lead.student?.email && (
                      <div className="text-xs text-slate-400">{lead.student.email}</div>
                    )}
                  </div>

                  {/* Status badge */}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${meta?.color ?? 'bg-slate-100 text-slate-600'}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Academic tags */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {lead.student?.jlpt_level && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] font-medium rounded-md">JLPT {lead.student.jlpt_level}</span>
                  )}
                  {lead.student?.nat_level && (
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[11px] font-medium rounded-md">NAT {lead.student.nat_level}</span>
                  )}
                  {lead.student?.gpa != null && (
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[11px] font-medium rounded-md">GPA {lead.student.gpa}</span>
                  )}
                  {lead.student?.highest_qualification && (
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[11px] rounded-md">{lead.student.highest_qualification}</span>
                  )}
                </div>

                {/* Bottom row: lead code + course + agency + date */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span className="font-mono">{lead.lead_code}</span>
                  {lead.target_course && <span>{lead.target_course}</span>}
                  {lead.target_intake && (
                    <span>{ja ? '入学:' : bn ? 'ইনটেক:' : 'Intake:'} {new Date(lead.target_intake).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                  )}
                  {lead.agency_name && <span>{ja ? '経由:' : bn ? 'এজেন্সি:' : 'via'} {lead.agency_name}</span>}
                  <span className="ml-auto">{new Date(lead.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
