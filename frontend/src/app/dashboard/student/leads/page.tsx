'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { STATUS_COLORS } from '@/lib/constants';

interface Lead {
  id: number;
  lead_code: string;
  status: string;
  target_country: string;
  target_course: string | null;
  target_intake: string | null;
  created_at: string;
  agency_name?: string | null;
}

const PIPELINE_STAGES = [
  { key: 'new',                  en: 'New',               ja: '新規',         bn: 'নতুন',          color: 'bg-slate-200 text-slate-700',   dot: 'bg-slate-400' },
  { key: 'contacted',            en: 'Contacted',         ja: '連絡済み',     bn: 'যোগাযোগ হয়েছে', color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-400' },
  { key: 'shortlisted',          en: 'Shortlisted',       ja: '選考中',       bn: 'শর্টলিস্টেড',   color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400' },
  { key: 'applied',              en: 'Applied',           ja: '申請済み',     bn: 'আবেদন হয়েছে',   color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-400' },
  { key: 'interview',            en: 'Interview',         ja: '面接',         bn: 'ইন্টারভিউ',     color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
  { key: 'interview_scheduled',  en: 'Interview',         ja: '面接',         bn: 'ইন্টারভিউ',     color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
  { key: 'enrolled',             en: 'Enrolled',          ja: '入学済み',     bn: 'ভর্তি হয়েছে',   color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  { key: 'offer_received',       en: 'Offer Received',    ja: 'オファー受領', bn: 'অফার পেয়েছেন', color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  { key: 'visa_processing',      en: 'Visa Processing',   ja: 'ビザ申請中',   bn: 'ভিসা প্রক্রিয়া', color: 'bg-cyan-100 text-cyan-700',   dot: 'bg-cyan-500' },
  { key: 'visa_approved',        en: 'Visa Approved',     ja: 'ビザ承認',     bn: 'ভিসা অনুমোদন', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
];
const TERMINAL_STAGES = ['rejected', 'withdrawn', 'closed', 'visa_rejected', 'on_hold'];

// Ordered pipeline for progress bar (simplified 6-step view)
const PROGRESS_KEYS = ['new', 'contacted', 'shortlisted', 'applied', 'interview', 'enrolled'];
const PROGRESS_INDEX: Record<string, number> = {
  new: 0, contacted: 1, shortlisted: 2, applied: 3,
  interview: 4, interview_scheduled: 4, interviewed: 4,
  offer_received: 5, visa_processing: 5, visa_approved: 5, enrolled: 5,
};

function progressLabel(status: string, lang: string): string {
  const stage = PIPELINE_STAGES.find(s => s.key === status);
  if (!stage) return status.replace(/_/g, ' ');
  return lang === 'ja' ? stage.ja : lang === 'bn' ? stage.bn : stage.en;
}

export default function StudentLeads() {
  const { t, lang } = useLang();
  const sl = t.studentLeads;
  const statuses = t.statuses;
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const [filter, setFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['student-leads'],
    queryFn: () => api.get('/student/leads').then((r) => r.data),
    staleTime: 30_000,
  });

  const allLeads: Lead[] = data?.data ?? [];

  // Pipeline summary counts (active stages only)
  const activeCounts: Record<string, number> = {};
  for (const l of allLeads) {
    if (!TERMINAL_STAGES.includes(l.status)) {
      activeCounts[l.status] = (activeCounts[l.status] ?? 0) + 1;
    }
  }
  const terminalCount = allLeads.filter(l => TERMINAL_STAGES.includes(l.status)).length;

  const displayed = filter === 'all' ? allLeads : filter === 'closed' ? allLeads.filter(l => TERMINAL_STAGES.includes(l.status)) : allLeads.filter(l => l.status === filter);

  const filterTabs = [
    { key: 'all', label: ja ? 'すべて' : bn ? 'সব' : 'All', count: allLeads.length },
    ...PIPELINE_STAGES.filter(s => (activeCounts[s.key] ?? 0) > 0).reduce<typeof PIPELINE_STAGES>((acc, s) => {
      if (!acc.find(x => x.key === s.key)) acc.push(s);
      return acc;
    }, []).map(s => ({ key: s.key, label: lang === 'ja' ? s.ja : lang === 'bn' ? s.bn : s.en, count: activeCounts[s.key] ?? 0 })),
    ...(terminalCount > 0 ? [{ key: 'closed', label: ja ? '終了' : bn ? 'বন্ধ' : 'Closed', count: terminalCount }] : []),
  ];

  return (
    <DashboardLayout title={sl.title}>

      {/* Pipeline progress summary */}
      {!isLoading && allLeads.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 mb-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            {ja ? 'パイプライン概要' : bn ? 'পাইপলাইন সারসংক্ষেপ' : 'Application Pipeline'}
          </p>
          <div className="flex items-center gap-1 sm:gap-2">
            {PROGRESS_KEYS.map((key, i) => {
              const count = allLeads.filter(l => (PROGRESS_INDEX[l.status] ?? -1) === i).length;
              const stage = PIPELINE_STAGES.find(s => s.key === key)!;
              const label = ja ? stage.ja : bn ? stage.bn : stage.en;
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className={`w-full h-2 rounded-full ${count > 0 ? stage.dot : 'bg-slate-100'}`} />
                  <span className="hidden sm:block text-[10px] text-slate-400 truncate w-full text-center">{label}</span>
                  {count > 0 && <span className={`text-xs font-bold ${count > 0 ? 'text-slate-700' : 'text-slate-300'}`}>{count}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {!isLoading && allLeads.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filterTabs.map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                filter === tab.key
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}>
              {tab.label}
              <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${filter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">{t.common.loading}</div>
      ) : allLeads.length === 0 ? (
        <EmptyState icon="📋" title={sl.emptyTitle} desc={sl.emptyDesc} />
      ) : displayed.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm">
          {ja ? '該当する申請がありません' : bn ? 'এই ফিল্টারে কোনো আবেদন নেই' : 'No applications in this stage'}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((lead) => {
            const progIdx = PROGRESS_INDEX[lead.status] ?? -1;
            const isTerminal = TERMINAL_STAGES.includes(lead.status);
            const statusLabel = statuses[lead.status as keyof typeof statuses] ?? progressLabel(lead.status, lang);
            return (
              <div key={lead.id} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">

                {/* Top row */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-slate-400">{lead.lead_code}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {statusLabel}
                  </span>
                  <span className="ml-auto text-xs text-slate-400">
                    {new Date(lead.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                </div>

                {/* Target */}
                <div className="font-semibold text-sm text-slate-900 mb-1">
                  {lead.target_country}{lead.target_course ? ` — ${lead.target_course}` : ''}
                </div>

                {/* Intake + agency */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
                  {lead.target_intake && (
                    <span className="text-xs text-slate-500">
                      {sl.intake} {new Date(lead.target_intake).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  )}
                  {lead.agency_name && (
                    <span className="text-xs text-slate-400">
                      {ja ? '経由:' : bn ? 'এজেন্সি:' : 'via'} {lead.agency_name}
                    </span>
                  )}
                </div>

                {/* Mini progress bar (only for active leads) */}
                {!isTerminal && progIdx >= 0 && (
                  <div className="mt-3 flex items-center gap-0.5">
                    {PROGRESS_KEYS.map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= progIdx ? 'bg-green-500' : 'bg-slate-100'}`} />
                    ))}
                    <span className="ml-2 text-[10px] text-slate-400 shrink-0">
                      {progIdx + 1}/{PROGRESS_KEYS.length}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-10 sm:p-16 text-center text-slate-400">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-medium text-slate-600">{title}</div>
      <div className="text-sm mt-1">{desc}</div>
    </div>
  );
}
