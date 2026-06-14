'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/context/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface Lead {
  id: number;
  lead_code: string;
  status: string;
  target_country: string | null;
  target_course: string | null;
  target_intake: string | null;
  is_published: boolean;
  created_at: string;
  student: { id: number; name: string; email: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  new:         'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  approved:    'bg-emerald-100 text-emerald-700',
  rejected:    'bg-red-100 text-red-700',
  completed:   'bg-slate-100 text-slate-600',
};

export default function BranchLeadsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { lang } = useLang();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const isBranchAdmin = user?.roles?.includes('branch_admin');
  useEffect(() => {
    if (user && !isBranchAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isBranchAdmin, router]);

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['branch-leads'],
    queryFn: () => api.get('/branch-admin/leads').then(r => r.data),
    enabled: !!isBranchAdmin,
  });

  if (!user || !isBranchAdmin) return null;

  const title = ja ? '申請者一覧' : bn ? 'আবেদনকারী' : 'Applicants';

  return (
    <DashboardLayout title={title}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {ja ? `${leads.length} 件の申請者` : bn ? `${leads.length} জন আবেদনকারী` : `${leads.length} applicant${leads.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          {ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-slate-400 text-sm">
            {ja ? 'まだ申請者がいません。' : bn ? 'এখনো কোনো আবেদনকারী নেই।' : 'No applicants from this branch yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500">
                  <th className="text-left px-5 py-3">{ja ? 'コード' : bn ? 'কোড' : 'Code'}</th>
                  <th className="text-left px-4 py-3">{ja ? '学生' : bn ? 'স্টুডেন্ট' : 'Student'}</th>
                  <th className="text-left px-4 py-3">{ja ? 'ステータス' : bn ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">{ja ? '渡航先' : bn ? 'গন্তব্য' : 'Country'}</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">{ja ? 'コース' : bn ? 'কোর্স' : 'Course'}</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">{ja ? '登録日' : bn ? 'তারিখ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{lead.lead_code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 text-xs">{lead.student?.name ?? '—'}</p>
                      <p className="text-[11px] text-slate-400">{lead.student?.email ?? ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[lead.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{lead.target_country ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{lead.target_course ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
