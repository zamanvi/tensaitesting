'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface Lead {
  id: number;
  lead_code: string;
  status: string;
  target_country: string;
  target_course: string | null;
  is_published: boolean;
  student: { name: string };
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-slate-100 text-slate-700',
  shortlisted: 'bg-amber-100 text-amber-700',
  interview_scheduled: 'bg-blue-100 text-blue-700',
  enrolled: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-red-100 text-red-700',
};

export default function PrivateVault() {
  const queryClient = useQueryClient();
  const { t } = useLang();
  const av = t.agencyVault;
  const statuses = t.statuses;

  const { data, isLoading } = useQuery({
    queryKey: ['agency-vault'],
    queryFn: () => api.get('/agency/leads/private-vault').then((r) => r.data),
  });

  const publish = useMutation({
    mutationFn: (leadId: number) => api.post(`/agency/leads/${leadId}/publish`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agency-vault'] }),
  });

  const leads: Lead[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  return (
    <DashboardLayout title={av.title}>
      <div className="mb-4 p-3 sm:p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-800">
        🔒 {av.banner}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">{t.common.loading}</div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 sm:p-16 text-center text-slate-400">
          <div className="text-4xl mb-3">🔒</div>
          <div className="font-medium text-slate-600">{av.emptyTitle}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-mono text-xs text-slate-400">{lead.lead_code}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {statuses[lead.status as keyof typeof statuses] ?? lead.status.replace(/_/g, ' ')}
                </span>
                {lead.is_published && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">{av.published}</span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <div className="font-semibold text-sm text-slate-900 min-w-0">
                  <span className="truncate block">
                    {lead.student?.name}{lead.target_country ? ` — ${lead.target_country}` : ''}
                    {lead.target_course ? ` (${lead.target_course})` : ''}
                  </span>
                </div>
                {!lead.is_published && (
                  <button
                    onClick={() => publish.mutate(lead.id)}
                    disabled={publish.isPending}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 text-center"
                  >
                    {av.publishBtn}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
