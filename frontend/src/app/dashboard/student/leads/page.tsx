'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface Lead {
  id: number;
  lead_code: string;
  status: string;
  target_country: string;
  target_course: string | null;
  target_intake: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-slate-100 text-slate-700',
  shortlisted: 'bg-amber-100 text-amber-700',
  interview_scheduled: 'bg-blue-100 text-blue-700',
  interviewed: 'bg-indigo-100 text-indigo-700',
  offer_received: 'bg-purple-100 text-purple-700',
  enrolled: 'bg-emerald-100 text-emerald-700',
  visa_rejected: 'bg-red-100 text-red-700',
  closed: 'bg-red-100 text-red-700',
};

export default function StudentLeads() {
  const { t } = useLang();
  const sl = t.studentLeads;
  const statuses = t.statuses;

  const { data, isLoading } = useQuery({
    queryKey: ['student-leads'],
    queryFn: () => api.get('/student/leads').then((r) => r.data),
  });

  const leads: Lead[] = data?.data ?? [];

  return (
    <DashboardLayout title={sl.title}>
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">{t.common.loading}</div>
      ) : leads.length === 0 ? (
        <EmptyState icon="📋" title={sl.emptyTitle} desc={sl.emptyDesc} />
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-mono text-xs text-slate-400">{lead.lead_code}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {statuses[lead.status as keyof typeof statuses] ?? lead.status.replace(/_/g, ' ')}
                </span>
                <span className="ml-auto text-xs text-slate-400">
                  {new Date(lead.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="font-semibold text-sm text-slate-900">
                {lead.target_country}{lead.target_course ? ` — ${lead.target_course}` : ''}
              </div>
              {lead.target_intake && (
                <div className="text-xs text-slate-500 mt-1">
                  {sl.intake} {new Date(lead.target_intake).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
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
