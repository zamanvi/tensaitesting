'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface Lead {
  id: number;
  lead_code: string;
  status: string;
  created_at: string;
  student: { name: string; email: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  new:         'bg-slate-100 text-slate-600',
  contacted:   'bg-blue-100 text-blue-700',
  shortlisted: 'bg-amber-100 text-amber-700',
  applied:     'bg-indigo-100 text-indigo-700',
  interview:   'bg-purple-100 text-purple-700',
  enrolled:    'bg-emerald-100 text-emerald-700',
  rejected:    'bg-red-100 text-red-700',
  withdrawn:   'bg-gray-100 text-gray-500',
};

export default function InstitutionLeadsPage() {
  const { lang } = useLang();
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const { data, isLoading } = useQuery({
    queryKey: ['institution-leads'],
    queryFn: () => api.get('/institution/leads').then(r => r.data),
    staleTime: 30_000,
  });

  const leads: Lead[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  const title = ja ? '応募一覧' : bn ? 'আবেদন তালিকা' : 'My Applications';

  return (
    <DashboardLayout title={title}>
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          {ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 sm:p-16 text-center">
          <div className="text-4xl mb-3">📋</div>
          <div className="font-medium text-slate-600">
            {ja ? '割り当てられた申請はまだありません' : bn ? 'এখনো কোনো আবেদন নেই' : 'No applications assigned yet'}
          </div>
          <div className="text-sm text-slate-400 mt-1">
            {ja ? 'エージェンシーがあなたの機関に学生を割り当てると、ここに表示されます。' : bn ? 'এজেন্সি শিক্ষার্থী নিযুক্ত করলে এখানে দেখাবে।' : 'Applications from agencies will appear here once assigned to your institution.'}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-slate-900">
                  {lead.student?.name ?? (ja ? '学生' : bn ? 'শিক্ষার্থী' : 'Student')}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[lead.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {lead.status.replace(/_/g, ' ')}
                </span>
                <span className="ml-auto font-mono text-xs text-slate-400">{lead.lead_code}</span>
              </div>
              {lead.student?.email && (
                <div className="text-xs text-slate-400">{lead.student.email}</div>
              )}
              <div className="text-xs text-slate-400 mt-1">
                {new Date(lead.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
