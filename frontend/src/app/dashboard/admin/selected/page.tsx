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

const STATUS_BADGE: Record<SelectionStatus, string> = {
  selected:   'bg-indigo-100 text-indigo-700',
  accepted:   'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  complete:   'bg-emerald-100 text-emerald-700',
  incomplete: 'bg-orange-100 text-orange-700',
  rejected:   'bg-red-100 text-red-600',
  cancelled:  'bg-slate-100 text-slate-400',
};

const STATUS_LABEL: Record<SelectionStatus, { en: string; ja: string; bn: string }> = {
  selected:   { en: 'Selected',   ja: '選択済み',   bn: 'নির্বাচিত' },
  accepted:   { en: 'Accepted',   ja: '承認済み',   bn: 'গৃহীত' },
  processing: { en: 'Processing', ja: '手続き中',   bn: 'প্রক্রিয়াধীন' },
  complete:   { en: 'Complete',   ja: '完了',       bn: 'সম্পন্ন' },
  incomplete: { en: 'Incomplete', ja: '未完了',     bn: 'অসম্পূর্ণ' },
  rejected:   { en: 'Rejected',   ja: '却下',       bn: 'প্রত্যাখ্যাত' },
  cancelled:  { en: 'Cancelled',  ja: 'キャンセル', bn: 'বাতিল' },
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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function cap(s: string | null): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type BtnColor = 'blue' | 'green' | 'orange' | 'red' | 'indigo' | 'ghost';

function ActionBtn({ color, onClick, disabled, children }: {
  color: BtnColor; onClick: () => void; disabled: boolean; children: React.ReactNode;
}) {
  const cls: Record<BtnColor, string> = {
    blue:   'bg-blue-600 hover:bg-blue-700 text-white',
    green:  'bg-emerald-600 hover:bg-emerald-700 text-white',
    orange: 'border border-orange-200 text-orange-600 hover:border-orange-300 hover:text-orange-700',
    red:    'border border-red-100 text-red-500 hover:border-red-300 hover:text-red-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    ghost:  'border border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap ${cls[color]}`}>
      {children}
    </button>
  );
}

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

  const ok  = (msg: string) => { setActionOk(msg);  setActionErr(''); setTimeout(() => setActionOk(''), 4000); };
  const err = () => { setActionErr(t('Action failed. Please try again.', '操作に失敗しました。', 'ব্যর্থ হয়েছে।')); setTimeout(() => setActionErr(''), 4000); };
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin-selected'] }); setConfirmAction(null); };

  const unselect        = useMutation({ mutationFn: (id: number) => api.post(`/admin/selected-applications/${id}/unselect`),         onSuccess: () => { refresh(); ok(t('Application returned to pool.',  'プールに戻しました。',       'পুলে ফেরত গেছে।')); },      onError: err });
  const startProcessing = useMutation({ mutationFn: (id: number) => api.post(`/admin/selected-applications/${id}/start-processing`), onSuccess: () => { refresh(); ok(t('Processing started.',            '手続きを開始しました。',     'প্রক্রিয়া শুরু হয়েছে।')); }, onError: err });
  const markComplete    = useMutation({ mutationFn: (id: number) => api.post(`/admin/selected-applications/${id}/mark-complete`),    onSuccess: () => { refresh(); ok(t('Marked as complete.',            '完了としてマークしました。', 'সম্পন্ন হয়েছে।')); },         onError: err });
  const markIncomplete  = useMutation({ mutationFn: (id: number) => api.post(`/admin/selected-applications/${id}/mark-incomplete`),  onSuccess: () => { refresh(); ok(t('Marked as incomplete.',          '未完了としてマーク。',       'অসম্পূর্ণ হয়েছে।')); },       onError: err });
  const adminReject     = useMutation({ mutationFn: (id: number) => api.post(`/admin/selected-applications/${id}/reject`),           onSuccess: () => { refresh(); ok(t('Selection rejected.',             '選択を却下しました。',       'প্রত্যাখ্যাত হয়েছে।')); },  onError: err });
  const adminRevive     = useMutation({ mutationFn: (id: number) => api.post(`/admin/selected-applications/${id}/revive`),           onSuccess: () => { refresh(); ok(t('Application revived.',            '申請を再開しました。',       'পুনরুদ্ধার হয়েছে।')); },     onError: err });

  if (!user || !isAdmin) return null;

  const confirmApp = confirmAction ? apps.find(a => a.id === confirmAction.id) : null;

  const rowActions = (app: SelectedApp) => (
    <div className="flex flex-wrap gap-1.5">
      {app.status === 'accepted' && (
        <ActionBtn color="blue" onClick={() => startProcessing.mutate(app.id)} disabled={startProcessing.isPending}>
          {t('▶ Process', '▶ 開始', '▶ শুরু')}
        </ActionBtn>
      )}
      {app.status === 'processing' && (
        <>
          <ActionBtn color="green" onClick={() => markComplete.mutate(app.id)} disabled={markComplete.isPending}>
            {t('✓ Complete', '✓ 完了', '✓ সম্পন্ন')}
          </ActionBtn>
          <ActionBtn color="orange" onClick={() => setConfirmAction({ id: app.id, type: 'incomplete' })} disabled={false}>
            {t('⚠ Incomplete', '⚠ 未完了', '⚠ অসম্পূর্ণ')}
          </ActionBtn>
        </>
      )}
      {['selected', 'accepted'].includes(app.status) && (
        <ActionBtn color="red" onClick={() => setConfirmAction({ id: app.id, type: 'reject' })} disabled={false}>
          {t('✕ Reject', '✕ 却下', '✕ প্রত্যাখ্যান')}
        </ActionBtn>
      )}
      {['cancelled', 'rejected', 'incomplete'].includes(app.status) && (
        <ActionBtn color="indigo" onClick={() => adminRevive.mutate(app.id)} disabled={adminRevive.isPending}>
          {t('↩ Revive', '↩ 再開', '↩ পুনরুদ্ধার')}
        </ActionBtn>
      )}
      {app.status !== 'complete' && (
        <ActionBtn color="ghost" onClick={() => setConfirmAction({ id: app.id, type: 'unselect' })} disabled={false}>
          {t('⊘ Cancel', '⊘ 解除', '⊘ বাতিল')}
        </ActionBtn>
      )}
    </div>
  );

  return (
    <DashboardLayout title={t('Selected Applications', '選択済み申請', 'নির্বাচিত আবেদন')}>

      {/* Confirm modal */}
      {confirmAction && confirmApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <p className="text-sm font-semibold text-slate-800 mb-1">
              {confirmAction.type === 'reject'
                ? t('Reject this selection?',       'この選択を却下しますか？',   'এই সিলেকশন প্রত্যাখ্যান করবেন?')
                : confirmAction.type === 'incomplete'
                ? t('Mark as incomplete?',           '未完了としてマークしますか？', 'অসম্পূর্ণ চিহ্নিত করবেন?')
                : t('Force-cancel this selection?', '選択を強制解除しますか？',    'জোর করে বাতিল করবেন?')}
            </p>
            <p className="text-xs text-slate-500 mb-5">
              {confirmApp.lead_code} — {confirmApp.student_name}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (confirmAction.type === 'reject')          adminReject.mutate(confirmAction.id);
                  else if (confirmAction.type === 'incomplete') markIncomplete.mutate(confirmAction.id);
                  else                                          unselect.mutate(confirmAction.id);
                }}
                disabled={adminReject.isPending || markIncomplete.isPending || unselect.isPending}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl disabled:opacity-50">
                {t('Confirm', '確認', 'নিশ্চিত')}
              </button>
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 py-2 border border-slate-200 text-slate-600 text-sm rounded-xl hover:border-slate-300">
                {t('Cancel', 'キャンセル', 'বাতিল')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5 space-y-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('Search by code, student, country or institution…', 'コード・学生・国・機関名で検索…', 'কোড, শিক্ষার্থী, দেশ বা প্রতিষ্ঠান খুঁজুন…')}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(({ k, en, ja, bn }) => (
            <button key={k}
              onClick={() => setStatusFilter(k as typeof statusFilter)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === k ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {L === 'ja' ? ja : L === 'bn' ? bn : en}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {actionOk && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 font-medium">✓ {actionOk}</div>
      )}
      {actionErr && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">⚠️ {actionErr}</div>
      )}

      <div className="text-xs text-slate-500 mb-3 px-1">
        {filtered.length} {t(`application${filtered.length !== 1 ? 's' : ''}`, '件', 'টি')}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-sm animate-pulse">
          {t('Loading…', '読み込み中…', 'লোড হচ্ছে…')}
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
        <>
          {/* ── Desktop table ── */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    {[
                      t('App Code', 'コード', 'কোড'),
                      t('Student', '学生', 'শিক্ষার্থী'),
                      t('Institution', '機関', 'প্রতিষ্ঠান'),
                      t('Contact Person', '担当者', 'যোগাযোগ'),
                      t('Status', 'ステータス', 'স্ট্যাটাস'),
                      t('Selected', '選択日', 'নির্বাচন'),
                      t('Actions', '操作', 'অ্যাকশন'),
                    ].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(app => (
                    <tr key={app.id} className={`hover:bg-slate-50/60 transition-colors ${app.status === 'cancelled' ? 'opacity-60' : ''}`}>

                      {/* App Code */}
                      <td className="px-4 py-3 align-top">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded whitespace-nowrap">
                          {app.lead_code}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">
                          {cap(app.target_country)}{app.target_course ? ` · ${app.target_course}` : ''}
                        </div>
                      </td>

                      {/* Student */}
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-slate-800">{app.student_name ?? '—'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(app.selected_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </div>
                      </td>

                      {/* Institution */}
                      <td className="px-4 py-3 align-top max-w-[180px]">
                        <div className="font-medium text-slate-800 truncate">{app.institution?.name ?? '—'}</div>
                        {app.connect_email && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">{app.connect_email}</div>
                        )}
                      </td>

                      {/* Contact Person */}
                      <td className="px-4 py-3 align-top max-w-[160px]">
                        {app.connect_name ? (
                          <>
                            <div className="font-medium text-slate-700 truncate">{app.connect_name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 space-y-px">
                              {app.connect_whatsapp && <div className="truncate">💬 {app.connect_whatsapp}</div>}
                              {app.connect_phone    && <div className="truncate">📞 {app.connect_phone}</div>}
                            </div>
                          </>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[app.status]}`}>
                          {STATUS_LABEL[app.status][L]}
                        </span>
                      </td>

                      {/* Selected timeago */}
                      <td className="px-4 py-3 align-top whitespace-nowrap text-xs text-slate-500">
                        {timeAgo(app.selected_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 align-top">
                        {rowActions(app)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile cards ── */}
          <div className="md:hidden space-y-3">
            {filtered.map(app => (
              <div key={app.id} className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${app.status === 'cancelled' ? 'opacity-60' : ''}`}>
                <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {app.lead_code}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[app.status]}`}>
                    {STATUS_LABEL[app.status][L]}
                  </span>
                </div>
                <div className="p-4 space-y-1.5 text-sm">
                  {app.student_name && <div className="font-semibold text-slate-800">👤 {app.student_name}</div>}
                  <div className="text-slate-600 font-medium">{app.institution?.name}</div>
                  {app.target_country && (
                    <div className="text-xs text-slate-400">{cap(app.target_country)}{app.target_course ? ` · ${app.target_course}` : ''}</div>
                  )}
                  {app.connect_name && (
                    <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                      <div>👤 {app.connect_name}</div>
                      {app.connect_whatsapp && <div>💬 {app.connect_whatsapp}</div>}
                      {app.connect_phone    && <div>📞 {app.connect_phone}</div>}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400">{timeAgo(app.selected_at)}</div>
                </div>
                <div className="px-4 pb-4">
                  {rowActions(app)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
