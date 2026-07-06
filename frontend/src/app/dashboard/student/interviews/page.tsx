'use client';
import StudentLayout from '@/components/shared/StudentLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { STATUS_COLORS, MEDIUM_LABEL } from '@/lib/constants';

interface Interview {
  id: number;
  status: string;
  medium: string;
  scheduled_at: string | null;
  meeting_link: string | null;
  lead: { lead_code: string };
  institution: { name: string };
}


export default function StudentInterviews() {
  const { t } = useLang();
  const si = t.studentInterviews;
  const statuses = t.statuses;

  const { data, isLoading } = useQuery({
    queryKey: ['student-interviews'],
    queryFn: () => api.get('/student/interviews').then((r) => r.data),
    staleTime: 30_000,
  });

  const interviews: Interview[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  return (
    <StudentLayout title={si.title}>
      {isLoading ? (
        <div className="py-16 flex justify-center">
          <span className="w-7 h-7 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      ) : interviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div className="font-bold text-sm text-slate-500">{si.emptyTitle}</div>
          <div className="text-xs text-slate-400 mt-1">{si.emptyDesc}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((iv) => (
            <div key={iv.id} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-semibold text-sm text-slate-900 truncate">
                  {iv.institution?.name ?? 'Institution'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${STATUS_COLORS[iv.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {statuses[iv.status as keyof typeof statuses] ?? iv.status.replace(/_/g, ' ')}
                </span>
                <span className="font-mono text-xs text-slate-400 shrink-0">{iv.lead?.lead_code}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>{MEDIUM_LABEL[iv.medium] ?? iv.medium}</span>
                {iv.scheduled_at && (
                  <span>📅 {new Date(iv.scheduled_at).toLocaleString(undefined, {
                    dateStyle: 'medium', timeStyle: 'short',
                  })}</span>
                )}
                {iv.meeting_link && (
                  <a href={iv.meeting_link} target="_blank" rel="noreferrer"
                    className="text-green-700 hover:text-green-800 font-semibold hover:underline"
                  >
                    {si.joinMeeting}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </StudentLayout>
  );
}
