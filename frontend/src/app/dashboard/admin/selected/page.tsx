'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type SelectionStatus = 'selected' | 'accepted' | 'rejected' | 'processing' | 'complete' | 'incomplete' | 'cancelled';

interface SelectedApp {
  id: number;
  lead_code: string;
  student_name: string | null;
  target_country: string | null;
  target_city: string | null;
  target_course: string | null;
  target_intake: string | null;
  last_education: string | null;
  gpa: string | null;
  selected_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  processing_at: string | null;
  completed_at: string | null;
  status: SelectionStatus;
  connect_name: string | null;
  connect_email: string | null;
  connect_whatsapp: string | null;
  connect_phone: string | null;
  institution: {
    id: number;
    name: string;
    country: string | null;
    email: string;
  };
}

const STATUS_BAR: Record<SelectionStatus, { en: string; ja: string; bn: string; cls: string }> = {
  selected:   { en: 'Selected — awaiting institution acceptance', ja: '選択済み — 承認待ち', bn: 'নির্বাচিত — প্রতিষ্ঠানের গ্রহণ বাকি', cls: 'bg-indigo-50 text-indigo-700' },
  accepted:   { en: 'Accepted by institution — Tensai manager to coordinate', ja: '承認済み — Tensaiが調整中', bn: 'প্রতিষ্ঠান গ্রহণ করেছে — Tensai ম্যানেজার যোগাযোগ করবেন', cls: 'bg-amber-50 text-amber-700' },
  processing: { en: 'Processing Ongoing', ja: '手続き進行中', bn: 'প্রক্রিয়া চলমান', cls: 'bg-blue-50 text-blue-700' },
  complete:   { en: 'Processing Complete', ja: '手続き完了', bn: 'প্রক্রিয়া সম্পন্ন', cls: 'bg-emerald-50 text-emerald-700' },
  incomplete: { en: 'Processing Incomplete', ja: '手続き未完了', bn: 'প্রক্রিয়া অসম্পূর্ণ', cls: 'bg-orange-50 text-orange-700' },
  rejected:   { en: 'Rejected by institution', ja: '機関により却下', bn: 'প্রতিষ্ঠান প্রত্যাখ্যান করেছে', cls: 'bg-red-50 text-red-600' },
  cancelled:  { en: 'Cancelled', ja: 'キャンセル済み', bn: 'বাতিল করা হয়েছে', cls: 'bg-slate-50 text-slate-400' },
};

const STATUS_FILTERS: { k: SelectionStatus | 'all'; en: string; ja: string; bn: string }[] = [
  { k: 'all',        en: 'All',        ja: 'すべて',    bn: 'সব' },
  { k: 'selected',   en: 'Selected',   ja: '選択済み',  bn: 'নির্বাচিত' },
  { k: 'accepted',   en: 'Accepted',   ja: '承認済み',  bn: 'গৃহীত' },
  { k: 'processing', en: 'Processing', ja: '手続き中',  bn: 'প্রক্রিয়াধীন' },
  { k: 'complete',   en: 'Complete',   ja: '完了',      bn: 'সম্পন্ন' },
  { k: 'incomplete', en: 'Incomplete', ja: '未完了',    bn: 'অসম্পূর্ণ' },
  { k: 'rejected',   en: 'Rejected',   ja: '却下',      bn: 'প্রত্যাখ্যাত' },
  { k: 'cancelled',  en: 'Cancelled',  ja: 'キャンセル', bn: 'বাতিল' },
];

export default function AdminSelectedPage() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const L = lang === 'ja' ? 'ja' : lang === 'bn' ? 'bn' : 'en';
  const t = (en: string, ja: string, bn: string) => L === 'ja' ? ja : L === 'bn' ? bn : en;

  const isAdmin = user?.roles?.some(r => r === 'admin' || r === 'super_admin');
  useEffect(() => {
    if (user && !isAdmin) router.replace('/dashboard');
  }, [user, isAdmin, router]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SelectionStatus | 'all'>('all');
  const [confirmAction, setConfirmAction] = useState<{ id: number; type: 'reject' | 'incomplete' | 'unselect' } | null>(null);
  const [actionOk, setActionOk] = useState('');
  const [actionErr, setActionErr] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-selected'],
    queryFn: () => api.get('/admin/selected-applications').then(r => r.data),
    enabled: !!isAdmin,
    staleTime: 30_000,
  });

  const apps: SelectedApp[] = data?.data ?? [];

  const filtered = apps.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        (a.lead_code ?? '').toLowerCase().includes(s) ||
        (a.student_name ?? '').toLowerCase().includes(s) ||
        (a.target_country ?? '').toLowerCase().includes(s) ||
        (a.institution?.name ?? '').toLowerCase().includes(s)
      );
    }
    return true;
  });

  const ok = (msg: string) => { setActionOk(msg); setActionErr(''); setTimeout(() => setActionOk(''), 4000); };
  const err = () => { setActionErr(t('Action failed. Please try again.', '操作に失敗しました。', 'ব্যর্থ হয়েছে।')); setTimeout(() => setActionErr(''), 4000); };
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin-selected'] }); setConfirmAction(null); };

  const unselect = useMutation({
    mutationFn: (id: number) => api.post(`/admin/selected-applications/${id}/unselect`),
    onSuccess: () => { refresh(); ok(t('Application unselected and returned to the pool.', '申請をプールに戻しました。', 'আবেদন পুলে ফেরত গেছে।')); },
    onError: err,
  });
  const startProcessing = useMutation({
    mutationFn: (id: number) => api.post(`/admin/selected-applications/${id}/start-processing`),
    onSuccess: () => { refresh(); ok(t('Processing started.', '手続きを開始しました。', 'প্রক্রিয়া শুরু হয়েছে।')); },
    onError: err,
  });
  const markComplete = useMutation({
    mutationFn: (id: number) => api.post(`/admin/selected-applications/${id}/mark-complete`),
    onSuccess: () => { refresh(); ok(t('Marked as complete.', '完了としてマークしました。', 'সম্পন্ন হিসেবে চিহ্নিত হয়েছে।')); },
    onError: err,
  });
  const markIncomplete = useMutation({
    mutationFn: (id: number) => api.post(`/admin/selected-applications/${id}/mark-incomplete`),
    onSuccess: () => { refresh(); ok(t('Marked as incomplete.', '未完了としてマークしました。', 'অসম্পূর্ণ হিসেবে চিহ্নিত হয়েছে।')); },
    onError: err,
  });
  const adminReject = useMutation({
    mutationFn: (id: number) => api.post(`/admin/selected-applications/${id}/reject`),
    onSuccess: () => { refresh(); ok(t('Selection rejected.', '選択を却下しました。', 'সিলেকশন প্রত্যাখ্যাত হয়েছে।')); },
    onError: err,
  });
  const adminRevive = useMutation({
    mutationFn: (id: number) => api.post(`/admin/selected-applications/${id}/revive`),
    onSuccess: () => { refresh(); ok(t('Application revived.', '申請を再開しました。', 'আবেদন পুনরুদ্ধার হয়েছে।')); },
    onError: err,
  });

  if (!user || !isAdmin) return null;

  return (
    <DashboardLayout title={t('Selected Applications', '選択済み申請', 'নির্বাচিত আবেদন')}>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5 space-y-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('Search by code, student, country or institution...', 'コード・学生・国・機関名で検索...', 'কোড, শিক্ষার্থী, দেশ বা প্রতিষ্ঠান খুঁজুন...')}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(({ k, en, ja, bn }) => (
            <button key={k}
              onClick={() => setStatusFilter(k as typeof statusFilter)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === k ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {L === 'ja' ? ja : L === 'bn' ? bn : en}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {actionOk && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 font-medium">
          ✓ {actionOk}
        </div>
      )}
      {actionErr && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          ⚠️ {actionErr}
        </div>
      )}

      <div className="text-xs text-slate-500 mb-3 px-1">
        {filtered.length} {t(`application${filtered.length !== 1 ? 's' : ''}`, '件', 'টি')}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-sm animate-pulse">
          {t('Loading...', '読み込み中...', 'লোড হচ্ছে...')}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
          <div className="text-4xl mb-3">📂</div>
          <p className="font-medium text-slate-500 mb-1">
            {t('No selected applications', '選択済み申請はありません', 'কোনো নির্বাচিত আবেদন নেই')}
          </p>
          <p className="text-xs">
            {t('Applications selected by institutions will appear here.', '機関が申請を選択すると、ここに表示されます。', 'প্রতিষ্ঠান আবেদন নির্বাচন করলে এখানে দেখাবে।')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => {
            const bar = STATUS_BAR[app.status] ?? STATUS_BAR.selected;
            const isCancelled = app.status === 'cancelled';
            return (
              <div key={app.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isCancelled ? 'opacity-70' : ''}`}>

                {/* Status bar */}
                <div className={`px-5 py-2 flex items-center gap-2 text-xs font-semibold ${bar.cls}`}>
                  {bar[L]}
                </div>

                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start gap-4">

                    {/* Application info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{app.lead_code}</span>
                        {app.student_name && (
                          <span className="text-xs font-semibold text-slate-700">👤 {app.student_name}</span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {t('Selected: ', '選択日: ', 'নির্বাচন: ')}
                          {new Date(app.selected_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs mb-3">
                        {app.target_country && <InfoRow label={t('Country', '国', 'দেশ')} value={app.target_country.charAt(0).toUpperCase() + app.target_country.slice(1)} />}
                        {app.target_city && <InfoRow label={t('City', '都市', 'শহর')} value={app.target_city} />}
                        {app.target_course && <InfoRow label={t('Course', 'コース', 'কোর্স')} value={app.target_course} />}
                        {app.last_education && <InfoRow label={t('Education', '学歴', 'শিক্ষা')} value={app.last_education} />}
                        {app.gpa && <InfoRow label="GPA" value={app.gpa} />}
                        {app.target_intake && <InfoRow label={t('Intake', 'インテーク', 'ইনটেক')} value={new Date(app.target_intake).toLocaleDateString(undefined, { dateStyle: 'medium' })} />}
                        {app.accepted_at && <InfoRow label={t('Accepted', '承認日', 'গ্রহণ')} value={new Date(app.accepted_at).toLocaleDateString(undefined, { dateStyle: 'medium' })} />}
                        {app.processing_at && <InfoRow label={t('Processing', '手続開始', 'প্রক্রিয়া শুরু')} value={new Date(app.processing_at).toLocaleDateString(undefined, { dateStyle: 'medium' })} />}
                        {app.completed_at && <InfoRow label={t('Completed', '完了日', 'সম্পন্ন')} value={new Date(app.completed_at).toLocaleDateString(undefined, { dateStyle: 'medium' })} />}
                      </div>
                    </div>

                    {/* Right column: institution + contact */}
                    <div className="shrink-0 space-y-2 min-w-[180px]">
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs">
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">
                          {t('Selected by', '選択した機関', 'নির্বাচনকারী প্রতিষ্ঠান')}
                        </p>
                        <p className="font-bold text-slate-800 truncate">{app.institution?.name}</p>
                        {app.institution?.country && <p className="text-slate-500 mt-0.5">{app.institution.country}</p>}
                        <p className="text-slate-400 truncate mt-0.5">{app.institution?.email}</p>
                      </div>
                      {(app.connect_name || app.connect_email) && (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                            {t('Their Contact', '担当者', 'যোগাযোগ')}
                          </p>
                          {app.connect_name && <div className="flex gap-1.5"><span>👤</span><span className="text-slate-600 truncate">{app.connect_name}</span></div>}
                          {app.connect_email && <div className="flex gap-1.5"><span>✉️</span><span className="text-slate-600 truncate">{app.connect_email}</span></div>}
                          {app.connect_whatsapp && <div className="flex gap-1.5"><span>💬</span><span className="text-slate-600 truncate">{app.connect_whatsapp}</span></div>}
                          {app.connect_phone && <div className="flex gap-1.5"><span>📞</span><span className="text-slate-600 truncate">{app.connect_phone}</span></div>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Workflow actions */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    {/* Confirm overlay */}
                    {confirmAction?.id === app.id && (
                      <div className="flex items-center gap-2 mb-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-xs text-red-700 font-medium flex-1">
                          {confirmAction.type === 'reject'
                            ? t('Reject this selection? Institution can revive within 30 days.', 'この選択を却下しますか？30日以内に再開可能。', 'এই সিলেকশন প্রত্যাখ্যান করবেন? প্রতিষ্ঠান ৩০ দিনে পুনরুদ্ধার করতে পারবে।')
                            : confirmAction.type === 'incomplete'
                            ? t('Mark as incomplete? Process returns to pool.', '未完了としてマークしますか？', 'অসম্পূর্ণ চিহ্নিত করবেন? প্রক্রিয়া পুলে ফিরবে।')
                            : t('Force-cancel this selection? Application returns to pool.', '選択を強制解除しますか？', 'জোর করে বাতিল করবেন? আবেদন পুলে ফিরবে।')}
                        </p>
                        <button
                          onClick={() => {
                            if (confirmAction.type === 'reject') adminReject.mutate(app.id);
                            else if (confirmAction.type === 'incomplete') markIncomplete.mutate(app.id);
                            else unselect.mutate(app.id);
                          }}
                          disabled={adminReject.isPending || markIncomplete.isPending || unselect.isPending}
                          className="shrink-0 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg disabled:opacity-50">
                          {t('Confirm', '確認', 'নিশ্চিত')}
                        </button>
                        <button onClick={() => setConfirmAction(null)}
                          className="shrink-0 px-3 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:border-slate-300">
                          {t('Back', '戻る', 'ফিরুন')}
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {/* selected → Reject */}
                      {app.status === 'selected' && confirmAction?.id !== app.id && (
                        <button onClick={() => setConfirmAction({ id: app.id, type: 'reject' })}
                          className="px-3 py-1.5 text-xs font-bold text-red-500 hover:text-red-700 border border-red-100 hover:border-red-300 rounded-lg transition-colors">
                          {t('✕ Reject', '✕ 却下', '✕ প্রত্যাখ্যান')}
                        </button>
                      )}

                      {/* accepted → Start Processing + Reject */}
                      {app.status === 'accepted' && confirmAction?.id !== app.id && (
                        <>
                          <button onClick={() => startProcessing.mutate(app.id)} disabled={startProcessing.isPending}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
                            {startProcessing.isPending ? '...' : t('▶ Start Processing', '▶ 手続き開始', '▶ প্রক্রিয়া শুরু করুন')}
                          </button>
                          <button onClick={() => setConfirmAction({ id: app.id, type: 'reject' })}
                            className="px-3 py-1.5 text-xs font-bold text-red-500 hover:text-red-700 border border-red-100 hover:border-red-300 rounded-lg transition-colors">
                            {t('✕ Reject', '✕ 却下', '✕ প্রত্যাখ্যান')}
                          </button>
                        </>
                      )}

                      {/* processing → Mark Complete + Mark Incomplete */}
                      {app.status === 'processing' && confirmAction?.id !== app.id && (
                        <>
                          <button onClick={() => markComplete.mutate(app.id)} disabled={markComplete.isPending}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
                            {markComplete.isPending ? '...' : t('✓ Mark Complete', '✓ 完了', '✓ সম্পন্ন করুন')}
                          </button>
                          <button onClick={() => setConfirmAction({ id: app.id, type: 'incomplete' })}
                            className="px-3 py-1.5 text-xs font-bold text-orange-500 hover:text-orange-700 border border-orange-100 hover:border-orange-300 rounded-lg transition-colors">
                            {t('⚠ Mark Incomplete', '⚠ 未完了', '⚠ অসম্পূর্ণ করুন')}
                          </button>
                        </>
                      )}

                      {/* cancelled/rejected/incomplete → Revive */}
                      {['cancelled', 'rejected', 'incomplete'].includes(app.status) && confirmAction?.id !== app.id && (
                        <button onClick={() => adminRevive.mutate(app.id)} disabled={adminRevive.isPending}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
                          {adminRevive.isPending ? '...' : t('↩ Revive', '↩ 再開', '↩ পুনরুদ্ধার')}
                        </button>
                      )}

                      {/* Force unselect — available for all non-complete */}
                      {app.status !== 'complete' && confirmAction?.id !== app.id && (
                        <button onClick={() => setConfirmAction({ id: app.id, type: 'unselect' })}
                          className="ml-auto px-3 py-1.5 text-[11px] font-medium text-slate-400 hover:text-red-500 border border-slate-100 hover:border-red-100 rounded-lg transition-colors">
                          {t('Force Cancel', '強制解除', 'জোর বাতিল')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <span className="text-slate-400 shrink-0">{label}:</span>
      <span className="font-semibold text-slate-700 truncate">{value}</span>
    </div>
  );
}
