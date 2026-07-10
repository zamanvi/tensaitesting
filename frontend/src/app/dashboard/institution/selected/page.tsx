'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type SelectionStatus = 'selected' | 'cancelled' | 'accepted' | 'rejected' | 'processing' | 'complete' | 'incomplete';

interface SelectedApplication {
  id: number;
  lead_code: string;
  target_country: string;
  target_city: string | null;
  city_type: 'fixed' | 'preferred' | null;
  target_course: string | null;
  target_intake: string | null;
  last_education: string | null;
  gpa: string | null;
  age: number | null;
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
}

// ── hint texts ────────────────────────────────────────────────────────────────
const HINTS: Record<SelectionStatus, { en: string; ja: string; bn: string }> = {
  selected: {
    en: 'You have selected this application. Click Accept so a Tensai manager can reach out to your team.',
    ja: 'この申請を選択しました。承認すると、Tensaiのマネージャーがご連絡いたします。',
    bn: 'আপনি এই আবেদন সিলেক্ট করেছেন। Accept করুন যাতে Tensai ম্যানেজার আপনার সাথে যোগাযোগ করতে পারেন।',
  },
  cancelled: {
    en: 'You cancelled this selection. You can revive it within 30 days to start the process again.',
    ja: 'この選択をキャンセルしました。30日以内であれば、再度開始することができます。',
    bn: 'আপনি এই সিলেকশন বাতিল করেছেন। ৩০ দিনের মধ্যে Revive করে পুনরায় শুরু করতে পারবেন।',
  },
  accepted: {
    en: 'Your acceptance is confirmed. A Tensai manager will contact your representative within 24 hours to discuss next steps.',
    ja: 'ご承認ありがとうございます。24時間以内にTensaiのマネージャーが担当者にご連絡いたします。',
    bn: 'আপনার গ্রহণ নিশ্চিত হয়েছে। ২৪ ঘণ্টার মধ্যে একজন Tensai ম্যানেজার আপনার প্রতিনিধির সাথে যোগাযোগ করবেন।',
  },
  rejected: {
    en: 'This application was rejected. You can revive it within 30 days if you wish to reconsider.',
    ja: 'この申請は却下されました。30日以内であれば、再度申請を再開することができます。',
    bn: 'এই আবেদন প্রত্যাখ্যাত হয়েছে। ৩০ দিনের মধ্যে Revive করে পুনরায় সুযোগ নিতে পারবেন।',
  },
  processing: {
    en: 'Processing is underway. Tensai is actively coordinating with your team to move forward.',
    ja: '手続きが進行中です。Tensaiがあなたのチームとともに進めています。',
    bn: 'প্রক্রিয়া চলমান রয়েছে। Tensai আপনার টিমের সাথে সমন্বয় করে এগিয়ে যাচ্ছে।',
  },
  complete: {
    en: 'The enrollment process is complete. The student has been successfully placed with your institution.',
    ja: '入学手続きが完了しました。学生の受け入れが正式に確定しました。',
    bn: 'ভর্তি প্রক্রিয়া সম্পন্ন হয়েছে। শিক্ষার্থী সফলভাবে নিযুক্ত হয়েছে।',
  },
  incomplete: {
    en: 'The process was not completed. You may revive this application within 30 days to start again.',
    ja: '手続きが完了しませんでした。30日以内に申請を再開することができます。',
    bn: 'প্রক্রিয়া অসম্পূর্ণ রয়ে গেছে। ৩০ দিনের মধ্যে Revive করে পুনরায় চেষ্টা করতে পারবেন।',
  },
};

const STATUS_BAR: Record<SelectionStatus, { label: { en: string; ja: string; bn: string }; cls: string }> = {
  selected:   { label: { en: 'Selected — awaiting your acceptance', ja: '選択済み — 承認をお待ちしています', bn: 'নির্বাচিত — আপনার গ্রহণের অপেক্ষায়' }, cls: 'bg-indigo-50 text-indigo-700' },
  cancelled:  { label: { en: 'Cancelled', ja: 'キャンセル済み', bn: 'বাতিল করা হয়েছে' }, cls: 'bg-slate-50 text-slate-400' },
  accepted:   { label: { en: 'Accepted — Tensai manager will contact you within 24h', ja: '承認済み — 24時間以内にTensaiより連絡します', bn: 'গৃহীত — ২৪ ঘণ্টার মধ্যে Tensai যোগাযোগ করবে' }, cls: 'bg-amber-50 text-amber-700' },
  rejected:   { label: { en: 'Rejected', ja: '却下されました', bn: 'প্রত্যাখ্যাত হয়েছে' }, cls: 'bg-red-50 text-red-600' },
  processing: { label: { en: 'Processing Ongoing', ja: '手続き進行中', bn: 'প্রক্রিয়া চলমান' }, cls: 'bg-blue-50 text-blue-700' },
  complete:   { label: { en: 'Processing Complete', ja: '手続き完了', bn: 'প্রক্রিয়া সম্পন্ন' }, cls: 'bg-emerald-50 text-emerald-700' },
  incomplete: { label: { en: 'Processing Incomplete', ja: '手続き未完了', bn: 'প্রক্রিয়া অসম্পূর্ণ' }, cls: 'bg-orange-50 text-orange-700' },
};

function isRevivable(app: SelectedApplication): boolean {
  if (!['cancelled', 'rejected', 'incomplete'].includes(app.status)) return false;
  const ts = app.rejected_at ?? app.selected_at;
  if (!ts) return false;
  const days = (Date.now() - new Date(ts).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 30;
}

export default function InstitutionSelectedPage() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const L = lang === 'ja' ? 'ja' : lang === 'bn' ? 'bn' : 'en';

  useEffect(() => {
    if (user && user.gateway_type !== 'institution') router.replace(`/dashboard/${user.gateway_type}`);
  }, [user, router]);

  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [confirmType, setConfirmType]   = useState<'cancel' | 'reject' | null>(null);
  const [actionErr, setActionErr]       = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['institution-selected'],
    queryFn: () => api.get('/institution/selected-applications').then(r => r.data),
    staleTime: 30_000,
  });

  const selected: SelectedApplication[] = data?.data ?? [];

  const onError = () => setActionErr(
    L === 'ja' ? '操作に失敗しました。もう一度お試しください。'
    : L === 'bn' ? 'ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'
    : 'Action failed. Please try again.'
  );

  const accept  = useMutation({ mutationFn: (id: number) => api.post(`/institution/accept-application/${id}`),   onSuccess: () => { qc.invalidateQueries({ queryKey: ['institution-selected'] }); setActionErr(''); }, onError });
  const reject  = useMutation({ mutationFn: (id: number) => api.post(`/institution/reject-application/${id}`),   onSuccess: () => { qc.invalidateQueries({ queryKey: ['institution-selected'] }); setConfirmingId(null); setConfirmType(null); setActionErr(''); }, onError });
  const cancel  = useMutation({ mutationFn: (id: number) => api.post(`/institution/unselect-application/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['institution-selected'] }); setConfirmingId(null); setConfirmType(null); setActionErr(''); }, onError });
  const revive  = useMutation({ mutationFn: (id: number) => api.post(`/institution/revive-application/${id}`),   onSuccess: () => { qc.invalidateQueries({ queryKey: ['institution-selected'] }); setActionErr(''); }, onError });

  if (!user || user.gateway_type !== 'institution') return null;

  const t = (en: string, ja: string, bn: string) => L === 'ja' ? ja : L === 'bn' ? bn : en;

  return (
    <DashboardLayout title={t('Selected Applications', '選択済み申請', 'নির্বাচিত আবেদন')}>

      {actionErr && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">⚠️ {actionErr}</div>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-sm animate-pulse">
          {t('Loading...', '読み込み中...', 'লোড হচ্ছে...')}
        </div>
      ) : selected.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
          <div className="text-5xl mb-3">📂</div>
          <p className="font-semibold text-slate-600 mb-1">
            {t('No selected applications yet', '選択済み申請はありません', 'কোনো নির্বাচিত আবেদন নেই')}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {t("Go to Application Pool and select candidates you're interested in.", '申請一覧から候補者を選択してください。', 'Application Pool থেকে আগ্রহী প্রার্থী নির্বাচন করুন।')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {selected.map(app => {
            const bar     = STATUS_BAR[app.status];
            const hint    = HINTS[app.status];
            const revivable = isRevivable(app);

            return (
              <div key={app.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden`}>

                {/* Status bar */}
                <div className={`px-5 py-2 flex items-center gap-2 text-xs font-semibold ${bar.cls}`}>
                  {bar.label[L]}
                </div>

                {/* Card body */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap gap-4">

                    {/* Application info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{app.lead_code}</span>
                        {app.city_type && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${app.city_type === 'fixed' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                            {app.city_type === 'fixed' ? t('Fixed City', '都市固定', 'ফিক্সড সিটি') : t('Preferred City', '都市希望', 'পছন্দের সিটি')}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {t('Selected: ', '選択日: ', 'নির্বাচন: ')}
                          {new Date(app.selected_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                        {app.target_country && <InfoRow label={t('Country', '国', 'দেশ')} value={app.target_country.charAt(0).toUpperCase() + app.target_country.slice(1)} />}
                        {app.target_city    && <InfoRow label={t('City', '都市', 'শহর')} value={app.target_city} />}
                        {app.target_course  && <InfoRow label={t('Course', 'コース', 'কোর্স')} value={app.target_course} />}
                        {app.target_intake  && <InfoRow label={t('Intake', '入学', 'ইনটেক')} value={new Date(app.target_intake).toLocaleDateString(undefined, { dateStyle: 'medium' })} />}
                        {app.last_education && <InfoRow label={t('Education', '学歴', 'শিক্ষা')} value={app.last_education} />}
                        {app.gpa            && <InfoRow label="GPA" value={app.gpa} />}
                        {app.age            && <InfoRow label={t('Age', '年齢', 'বয়স')} value={`${app.age} ${t('yrs', '歳', 'বছর')}`} />}
                      </div>
                    </div>

                    {/* Contact info */}
                    {(app.connect_name || app.connect_email) && (
                      <div className="shrink-0 min-w-[180px] bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                          {t('Your Contact Info', '担当者情報', 'যোগাযোগ তথ্য')}
                        </p>
                        {app.connect_name     && <ContactRow icon="👤" value={app.connect_name} />}
                        {app.connect_email    && <ContactRow icon="✉️" value={app.connect_email} />}
                        {app.connect_whatsapp && <ContactRow icon="💬" value={app.connect_whatsapp} />}
                        {app.connect_phone    && <ContactRow icon="📞" value={app.connect_phone} />}
                      </div>
                    )}
                  </div>

                  {/* Hint + actions */}
                  <div className="mt-4 pt-4 border-t border-slate-100">

                    {/* Hint text */}
                    <div className="flex items-start gap-2 mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <span className="text-base shrink-0">ℹ️</span>
                      <p className="text-xs text-amber-800 font-medium leading-relaxed">{hint[L]}</p>
                    </div>

                    {/* Action buttons by status */}
                    {app.status === 'selected' && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => accept.mutate(app.id)}
                          disabled={accept.isPending}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                        >
                          {accept.isPending ? '...' : t('✓ Accept', '✓ 承認する', '✓ গ্রহণ করুন')}
                        </button>
                        {confirmingId === app.id && confirmType === 'cancel' ? (
                          <div className="flex gap-2">
                            <button onClick={() => cancel.mutate(app.id)} disabled={cancel.isPending}
                              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl disabled:opacity-50">
                              {cancel.isPending ? '...' : t('Confirm Cancel', '確認', 'নিশ্চিত করুন')}
                            </button>
                            <button onClick={() => { setConfirmingId(null); setConfirmType(null); }}
                              className="px-3 py-2.5 text-xs text-slate-500 border border-slate-200 rounded-xl hover:border-slate-300">
                              {t('Back', '戻る', 'ফিরুন')}
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setConfirmingId(app.id); setConfirmType('cancel'); }}
                            className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl transition-colors">
                            {t('✕ Cancel Selection', '✕ キャンセル', '✕ বাতিল করুন')}
                          </button>
                        )}
                      </div>
                    )}

                    {app.status === 'accepted' && (
                      <div className="flex flex-wrap gap-2">
                        <span className="px-4 py-2.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl font-semibold">
                          ⏳ {t('Awaiting Tensai manager contact', 'Tensaiマネージャーからの連絡をお待ちください', 'Tensai ম্যানেজারের যোগাযোগের অপেক্ষায়')}
                        </span>
                        {confirmingId === app.id && confirmType === 'reject' ? (
                          <div className="flex gap-2">
                            <button onClick={() => reject.mutate(app.id)} disabled={reject.isPending}
                              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl disabled:opacity-50">
                              {reject.isPending ? '...' : t('Confirm Reject', '確認', 'নিশ্চিত করুন')}
                            </button>
                            <button onClick={() => { setConfirmingId(null); setConfirmType(null); }}
                              className="px-3 py-2.5 text-xs text-slate-500 border border-slate-200 rounded-xl hover:border-slate-300">
                              {t('Back', '戻る', 'ফিরুন')}
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setConfirmingId(app.id); setConfirmType('reject'); }}
                            className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl transition-colors">
                            {t('✕ Reject', '✕ 却下する', '✕ প্রত্যাখ্যান করুন')}
                          </button>
                        )}
                      </div>
                    )}

                    {app.status === 'processing' && (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                        <span className="text-base">🔄</span>
                        <span className="text-xs text-blue-700 font-semibold">
                          {t('Processing is underway — Tensai will keep you updated.', '手続きが進行中です — Tensaiより随時ご連絡いたします。', 'প্রক্রিয়া চলমান — Tensai আপনাকে আপডেট রাখবে।')}
                        </span>
                      </div>
                    )}

                    {app.status === 'complete' && (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <span className="text-base">✅</span>
                        <span className="text-xs text-emerald-700 font-semibold">
                          {t('Enrollment complete. Thank you for choosing Tensai.', '入学手続きが完了しました。Tensaiをご利用いただきありがとうございます。', 'ভর্তি সম্পন্ন। Tensai ব্যবহার করার জন্য ধন্যবাদ।')}
                        </span>
                      </div>
                    )}

                    {(app.status === 'rejected' || app.status === 'cancelled' || app.status === 'incomplete') && revivable && (
                      <button
                        onClick={() => revive.mutate(app.id)}
                        disabled={revive.isPending}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                      >
                        {revive.isPending ? '...' : t('↩ Revive Application', '↩ 申請を再開する', '↩ আবেদন Revive করুন')}
                      </button>
                    )}

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

function ContactRow({ icon, value }: { icon: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs shrink-0">{icon}</span>
      <span className="text-slate-600 truncate">{value}</span>
    </div>
  );
}
