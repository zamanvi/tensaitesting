'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/context/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Applicant {
  id: number;
  lead_code: string;
  status: string;
  submission_status: 'draft' | 'submitted' | 'accepted' | 'rejected' | null;
  pool_type: string;
  target_country: string | null;
  target_course: string | null;
  target_intake: string | null;
  created_at: string;
  source_branch_id: number | null;
  source_agency_id: number | null;
  source_affiliate_id: number | null;
  student: { id: number; name: string; email: string; referred_by: number | null; referrer: { id: number; name: string } | null } | null;
  sourceBranch: { id: number; name: string } | null;
  sourceAgency: { id: number; name: string } | null;
  sourceAffiliate: { id: number; name: string } | null;
}

interface Paginated { data: Applicant[]; total: number; last_page: number; current_page: number }

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

function SourceBadge({ applicant }: { applicant: Applicant }) {
  if (applicant.sourceBranch) {
    return (
      <Link href={`/dashboard/admin/branches`} onClick={e => e.stopPropagation()}
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
        🏢 {applicant.sourceBranch.name}
      </Link>
    );
  }
  if (applicant.sourceAgency) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
        🏪 {applicant.sourceAgency.name}
      </span>
    );
  }
  if (applicant.sourceAffiliate) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
        🔗 {applicant.sourceAffiliate.name}
      </span>
    );
  }
  if (applicant.student?.referrer) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
        🔗 {applicant.student.referrer.name}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
      Admin
    </span>
  );
}

const SOURCE_FILTERS = ['all', 'pending_review', 'branch', 'affiliate', 'agency', 'admin'] as const;

export default function AdminApplicantsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { lang } = useLang();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const isAdmin = user?.roles?.some(r => ['admin', 'super_admin'].includes(r));
  useEffect(() => {
    if (user && !isAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isAdmin, router]);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  const { data, isLoading } = useQuery<Paginated>({
    queryKey: ['admin-applicants', page, statusFilter, sourceFilter],
    queryFn: () => api.get('/admin/leads', {
      params: {
        page,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(sourceFilter === 'pending_review'
          ? { source: 'branch', submission_status: 'submitted' }
          : sourceFilter !== 'all' ? { source: sourceFilter } : {}),
      },
    }).then(r => r.data),
    enabled: !!isAdmin,
  });

  const applicants = data?.data ?? [];

  if (!user || !isAdmin) return null;

  const title = ja ? '申請者管理' : bn ? 'আবেদনকারী ম্যানেজ' : 'Applicants';

  const sourceLabel = (f: string) => {
    if (ja) return { all: 'すべて', pending_review: '⏳ 審査待ち', branch: '支局', affiliate: 'アフィリエイト', agency: 'エージェンシー', admin: '管理者' }[f] ?? f;
    if (bn) return { all: 'সব', pending_review: '⏳ রিভিউ পেন্ডিং', branch: 'শাখা', affiliate: 'অ্যাফিলিয়েট', agency: 'এজেন্সি', admin: 'অ্যাডমিন' }[f] ?? f;
    return { all: 'All', pending_review: '⏳ Pending Review', branch: 'Branch', affiliate: 'Affiliate', agency: 'Agency (Pool)', admin: 'Admin' }[f] ?? f;
  };

  return (
    <DashboardLayout title={title}>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {SOURCE_FILTERS.map(f => (
          <button key={f}
            onClick={() => { setSourceFilter(f); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${sourceFilter === f ? 'bg-green-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-green-400'}`}>
            {sourceLabel(f)}
          </button>
        ))}
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="ml-auto px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">{ja ? 'すべてのステータス' : bn ? 'সব স্ট্যাটাস' : 'All Statuses'}</option>
          {['new','profile_complete','under_review','shortlisted','interview_scheduled','interviewed',
            'offer_received','accepted','visa_processing','visa_approved','visa_rejected','enrolled','closed','on_hold']
            .map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Summary */}
      <p className="text-xs text-slate-500 mb-3">
        {isLoading ? '…' : `${data?.total ?? 0} ${ja ? '件' : bn ? 'টি' : 'total'}`}
      </p>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-sm">{ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}</div>
      ) : applicants.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-slate-400 text-sm">{ja ? '申請者が見つかりません。' : bn ? 'কোনো আবেদনকারী নেই।' : 'No applicants found.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500">
                  <th className="text-left px-5 py-3">{ja ? 'コード' : bn ? 'কোড' : 'Code'}</th>
                  <th className="text-left px-4 py-3">{ja ? '学生' : bn ? 'শিক্ষার্থী' : 'Student'}</th>
                  <th className="text-left px-4 py-3">{ja ? 'ソース' : bn ? 'উৎস' : 'Source'}</th>
                  <th className="text-left px-4 py-3">{ja ? 'ステータス' : bn ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">{ja ? '渡航先' : bn ? 'গন্তব্য' : 'Country'}</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">{ja ? 'コース' : bn ? 'কোর্স' : 'Course'}</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">{ja ? '登録日' : bn ? 'তারিখ' : 'Added'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {applicants.map(a => (
                  <tr key={a.id}
                    onClick={() => router.push(`/dashboard/admin/applicants/${a.id}`)}
                    className="hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer">
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{a.lead_code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 text-xs">{a.student?.name ?? '—'}</p>
                      <p className="text-[11px] text-slate-400">{a.student?.email ?? ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <SourceBadge applicant={a} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${STATUS_COLORS[a.status] ?? 'bg-slate-100 text-slate-500'}`}>
                          {a.status.replace(/_/g, ' ')}
                        </span>
                        {a.submission_status === 'submitted' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 w-fit">
                            {ja ? '審査待ち' : bn ? 'রিভিউ পেন্ডিং' : 'Pending Review'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{a.target_country ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{a.target_course ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">{new Date(a.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {(data?.last_page ?? 1) > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">{ja ? `ページ ${page} / ${data?.last_page}` : bn ? `পেজ ${page} / ${data?.last_page}` : `Page ${page} of ${data?.last_page}`}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
                  {ja ? '前へ' : bn ? 'আগে' : 'Prev'}
                </button>
                <button onClick={() => setPage(p => Math.min(data?.last_page ?? 1, p + 1))} disabled={page === (data?.last_page ?? 1)}
                  className="px-3 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
                  {ja ? '次へ' : bn ? 'পরে' : 'Next'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </DashboardLayout>
  );
}
