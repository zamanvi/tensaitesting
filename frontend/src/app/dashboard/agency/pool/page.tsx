'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface PoolLead {
  id: number;
  lead_code: string;
  status: string;
  target_country: string;
  target_course: string | null;
  unlock_fee: number;
  is_locked: boolean;
  student_summary: {
    jlpt_level: string | null;
    nat_level: string | null;
    gpa: number | null;
    highest_qualification: string | null;
  } | null;
}

export default function OpenPool() {
  const queryClient = useQueryClient();
  const { t } = useLang();
  const ap = t.agencyPool;
  const statuses = t.statuses;

  const { data, isLoading } = useQuery({
    queryKey: ['open-pool'],
    queryFn: () => api.get('/agency/leads/open-pool').then((r) => r.data),
  });

  const unlock = useMutation({
    mutationFn: (leadId: number) => api.post(`/agency/leads/${leadId}/unlock`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['open-pool'] }),
  });

  const leads: PoolLead[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  return (
    <DashboardLayout title={ap.title}>
      <div className="mb-4 p-3 sm:p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
        🌐 {ap.banner}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">{t.common.loading}</div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 sm:p-16 text-center text-slate-400">
          <div className="text-4xl mb-3">🌐</div>
          <div className="font-medium text-slate-600">{ap.emptyTitle}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-mono text-xs text-slate-400">{lead.lead_code}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  {statuses[lead.status as keyof typeof statuses] ?? lead.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="font-semibold text-sm text-slate-900 mb-1">
                {lead.target_country}{lead.target_course ? ` — ${lead.target_course}` : ''}
              </div>

              {lead.student_summary && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {lead.student_summary.jlpt_level && (
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs">JLPT {lead.student_summary.jlpt_level}</span>
                  )}
                  {lead.student_summary.nat_level && (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs">NAT {lead.student_summary.nat_level}</span>
                  )}
                  {lead.student_summary.gpa && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">GPA {lead.student_summary.gpa}</span>
                  )}
                  {lead.student_summary.highest_qualification && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{lead.student_summary.highest_qualification}</span>
                  )}
                </div>
              )}

              {lead.is_locked ? (
                <button
                  onClick={() => unlock.mutate(lead.id)}
                  disabled={unlock.isPending}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {ap.unlockBtn} — ৳{(lead.unlock_fee ?? 10000).toLocaleString()}
                </button>
              ) : (
                <span className="inline-block px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">
                  {ap.unlocked}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
