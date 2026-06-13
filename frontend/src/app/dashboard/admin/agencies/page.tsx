'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/context/LanguageContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AgencyProfile {
  id: number;
  user_id: number;
  agency_name: string;
  agency_name_bn: string | null;
  contact_person_name: string;
  contact_person_phone: string;
  address: string;
  city: string;
  registration_number: string | null;
  trade_license: string | null;
  website: string | null;
  description: string | null;
  vetting_status: 'pending' | 'under_review' | 'approved' | 'rejected';
  slot_number: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  logo: string | null;
  user?: { id: number; name: string; email: string; status: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending:      'bg-amber-100 text-amber-700',
  under_review: 'bg-blue-100 text-blue-700',
  approved:     'bg-emerald-100 text-emerald-700',
  rejected:     'bg-red-100 text-red-700',
};

const VETTING_LABEL: Record<string, { en: string; ja: string; bn: string }> = {
  pending:      { en: 'Pending',      ja: '審査待ち',   bn: 'পেন্ডিং' },
  under_review: { en: 'Under Review', ja: '審査中',     bn: 'পর্যালোচনাধীন' },
  approved:     { en: 'Approved',     ja: '承認済み',   bn: 'অনুমোদিত' },
  rejected:     { en: 'Rejected',     ja: '却下',       bn: 'প্রত্যাখ্যাত' },
};

export default function AdminAgenciesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const { lang } = useLang();

  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const isAdmin = user?.roles?.some(r => r === 'admin' || r === 'super_admin');

  useEffect(() => {
    if (user && !isAdmin) router.replace('/dashboard/' + user.gateway_type);
  }, [user, isAdmin, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-agencies'],
    queryFn: () => api.get('/admin/agencies').then(r => r.data),
    enabled: !!isAdmin,
  });

  const approveMutation = useMutation({
    mutationFn: (agencyId: number) => api.post(`/admin/agencies/${agencyId}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-agencies'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ agencyId, reason }: { agencyId: number; reason: string }) =>
      api.post(`/admin/agencies/${agencyId}/reject`, { rejection_reason: reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-agencies'] });
      setRejectId(null);
      setRejectReason('');
    },
  });

  const agencies: AgencyProfile[] = data?.agencies ?? data ?? [];
  const filtered = selectedFilter === 'all'
    ? agencies
    : agencies.filter(a => a.vetting_status === selectedFilter);

  const title = lang === 'ja' ? 'エージェンシー審査' : lang === 'bn' ? 'এজেন্সি অ্যাপ্রুভাল' : 'Agency Vetting';

  return (
    <DashboardLayout title={title}>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {['all', 'pending', 'under_review', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setSelectedFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedFilter === f
                ? 'bg-green-700 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-green-300'
            }`}
          >
            {f === 'all'
              ? (lang === 'ja' ? 'すべて' : lang === 'bn' ? 'সব' : 'All')
              : f === 'pending'
              ? (lang === 'ja' ? '審査待ち' : lang === 'bn' ? 'পেন্ডিং' : 'Pending')
              : f === 'under_review'
              ? (lang === 'ja' ? '審査中' : lang === 'bn' ? 'পর্যালোচনাধীন' : 'Under Review')
              : f === 'approved'
              ? (lang === 'ja' ? '承認済' : lang === 'bn' ? 'অনুমোদিত' : 'Approved')
              : (lang === 'ja' ? '却下' : lang === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected')
            }
            {f !== 'all' && (
              <span className="ml-1.5 bg-white/30 rounded-full px-1.5 py-0.5 text-[10px]">
                {agencies.filter(a => a.vetting_status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          {lang === 'ja' ? '読み込み中...' : lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-3">🏢</div>
          <p className="text-slate-500 text-sm font-medium">
            {selectedFilter === 'all'
              ? (lang === 'ja' ? 'エージェンシーはまだありません' : lang === 'bn' ? 'এখনো কোনো এজেন্সি নেই' : 'No agencies have registered yet')
              : (lang === 'ja' ? `「${selectedFilter}」のエージェンシーがありません` : lang === 'bn' ? 'এই ফিল্টারে কোনো এজেন্সি নেই' : `No agencies with status "${selectedFilter.replace('_', ' ')}"`)}
          </p>
          <p className="text-slate-400 text-xs mt-1">
            {lang === 'ja' ? 'フィルターを変更するか、エージェンシーの登録をお待ちください。' : lang === 'bn' ? 'ফিল্টার পরিবর্তন করুন বা নতুন এজেন্সির নিবন্ধনের অপেক্ষা করুন।' : 'Try a different filter or wait for agencies to complete registration.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(agency => (
            <div key={agency.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-slate-900 text-base">{agency.agency_name}</h2>
                    {agency.agency_name_bn && (
                      <span className="text-slate-500 text-sm">({agency.agency_name_bn})</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[agency.vetting_status]}`}>
                      {VETTING_LABEL[agency.vetting_status]?.[lang as 'en'|'ja'|'bn'] ?? agency.vetting_status.replace('_', ' ')}
                    </span>
                    {agency.slot_number && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        Slot #{agency.slot_number}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-slate-500">
                    <span>👤 {agency.contact_person_name} · {agency.contact_person_phone}</span>
                    <span>📍 {agency.city}, {agency.address}</span>
                    {agency.user && <span>✉️ {agency.user.email}</span>}
                    {agency.registration_number && <span>🏢 Reg: {agency.registration_number}</span>}
                    {agency.trade_license && <span>📄 TL: {agency.trade_license}</span>}
                    {agency.website && (
                      <a href={agency.website} target="_blank" rel="noreferrer" className="text-green-700 hover:underline truncate">
                        🌐 {agency.website}
                      </a>
                    )}
                  </div>
                  {agency.description && (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">{agency.description}</p>
                  )}
                  {agency.rejection_reason && (
                    <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                      <strong>Rejection reason:</strong> {agency.rejection_reason}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                {agency.vetting_status !== 'approved' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => approveMutation.mutate(agency.user_id)}
                      disabled={approveMutation.isPending}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {lang === 'ja' ? '承認' : lang === 'bn' ? 'অনুমোদন' : 'Approve'}
                    </button>
                    <button
                      onClick={() => { setRejectId(agency.user_id); setRejectReason(''); }}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors border border-red-100"
                    >
                      {lang === 'ja' ? '却下' : lang === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectId !== null && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
            <h3 className="font-bold text-slate-900 mb-3">
              {lang === 'ja' ? '却下理由を入力' : lang === 'bn' ? 'প্রত্যাখ্যানের কারণ' : 'Rejection Reason'}
            </h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
              placeholder={lang === 'ja' ? '例: 登録番号が無効です。書類を再提出してください。' : lang === 'bn' ? 'যেমন: নিবন্ধন নম্বর অসম্পূর্ণ। সঠিক কাগজপত্র পুনরায় জমা দিন।' : 'e.g. Registration number is invalid. Please resubmit with correct documents.'}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              {lang === 'ja' ? 'この理由はエージェンシーのダッシュボードに表示されます。' : lang === 'bn' ? 'এই কারণটি এজেন্সির ড্যাশবোর্ডে দেখানো হবে।' : 'This reason will be shown to the agency in their dashboard.'}
            </p>
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => setRejectId(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {lang === 'ja' ? 'キャンセル' : lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={() => rejectMutation.mutate({ agencyId: rejectId!, reason: rejectReason })}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                {lang === 'ja' ? '却下する' : lang === 'bn' ? 'প্রত্যাখ্যান করুন' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
