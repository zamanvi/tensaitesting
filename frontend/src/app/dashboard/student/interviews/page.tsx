'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface Interview {
  id: number;
  status: string;
  medium: string;
  scheduled_at: string | null;
  meeting_link: string | null;
  lead: { lead_code: string };
  institution: { name: string };
}

const STATUS_COLORS: Record<string, string> = {
  requested: 'bg-slate-100 text-slate-600',
  arranged: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-red-100 text-red-700',
};

export default function StudentInterviews() {
  const { t } = useLang();
  const si = t.studentInterviews;
  const statuses = t.statuses;

  const { data, isLoading } = useQuery({
    queryKey: ['student-interviews'],
    queryFn: () => api.get('/student/interviews').then((r) => r.data),
  });

  const interviews: Interview[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  return (
    <DashboardLayout title={si.title}>
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">{t.common.loading}</div>
      ) : interviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 sm:p-16 text-center text-slate-400">
          <div className="text-4xl mb-3">🎙️</div>
          <div className="font-medium text-slate-600">{si.emptyTitle}</div>
          <div className="text-sm mt-1">{si.emptyDesc}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((iv) => (
            <div key={iv.id} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-semibold text-sm text-slate-900">
                  {iv.institution?.name ?? 'Institution'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[iv.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {statuses[iv.status as keyof typeof statuses] ?? iv.status.replace(/_/g, ' ')}
                </span>
                <span className="ml-auto font-mono text-xs text-slate-400">{iv.lead?.lead_code}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>{iv.medium === 'online' ? si.online : si.inPerson}</span>
                {iv.scheduled_at && (
                  <span>📅 {new Date(iv.scheduled_at).toLocaleString(undefined, {
                    dateStyle: 'medium', timeStyle: 'short',
                  })}</span>
                )}
                {iv.meeting_link && (
                  <a href={iv.meeting_link} target="_blank" rel="noreferrer"
                    className="text-indigo-600 hover:underline font-medium"
                  >
                    {si.joinMeeting}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
