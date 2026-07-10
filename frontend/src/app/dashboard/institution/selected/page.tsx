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
  student_name: string | null;
  target_country: string;
  target_city: string | null;
  city_type: 'fixed' | 'preferred' | null;
  target_course: string | null;
  target_intake: string | null;
  last_education: string | null;
  gpa: string | null;
  jlpt_level: string | null;
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

const HINTS: Record<SelectionStatus, { en: string; ja: string; bn: string }> = {
  selected: {
    en: 'You have selected this application. Click Accept so a Tensai manager can reach out to your team.',
    ja: 'この申請を選択しました。承認すると、Tensaiのマネージャーがご連絡いたします。',
    bn: 'আপনি এই আবেদন সিলেক্ট করেছেন। গ্রহণ করুন যাতে Tensai ম্যানেজার আপনার সাথে যোগাযোগ করতে পারেন।',
  },
  cancelled: {
    en: 'You cancelled this selection. You can revive it within 30 days to start the process again.',
    ja: 'この選択をキャンセルしました。30日以内であれば、再度開始することができます。',
    bn: 'আপনি এই সিলেকশন বাতিল করেছেন। ৩০ দিনের মধ্যে পুনরুদ্ধার করে আবার শুরু করতে পারবেন।',
  },
  accepted: {
    en: 'Your acceptance is confirmed. A Tensai manager will contact your representative within 24 hours to discuss next steps.',
    ja: 'ご承認ありがとうございます。24時間以内にTensaiのマネージャーが担当者にご連絡いたします。',
    bn: 'আপনার গ্রহণ নিশ্চিত হয়েছে। ২৪ ঘণ্টার মধ্যে একজন Tensai ম্যানেজার আপনার প্রতিনিধির সাথে যোগাযোগ করবেন।',
  },
  rejected: {
    en: 'This application was rejected. You can revive it within 30 days if you wish to reconsider.',
    ja: 'この申請は却下されました。30日以内であれば、再度申請を再開することができます。',
    bn: 'এই আবেদন প্রত্যাখ্যাত হয়েছে। ৩০ দিনের মধ্যে পুনরুদ্ধার করে পুনরায় সুযোগ নিতে পারবেন।',
  },
  processing: {
    en: 'Processing is underway. Tensai is actively coordinating with your team to move forward.',
    ja: '手続きが進行中です。Tensaiがあなたのチームとともに進めています。',
    bn: 'প্রক্রিয়া চলমান রয়েছে। Tensai আপনার টিমের সাথে সমন্বয় করে এগিয়ে যাচ্ছে।',
  },
  complete: {
    en: 'The enrollment process is complete. The student has been successfully placed with your institution.',
    ja: '入学手続きが完了しました。学生の受け入れが正式に確定しました。',
    bn: 'ভর্তি প্রক্রিয়া সম্পন্ন হয়েছে। শিক্ষার্থী সফলভাবে আপনার প্রতিষ্ঠানে নিযুক্ত হয়েছে।',
  },
  incomplete: {
    en: 'The process was not completed. You may revive this application within 30 days to try again.',
    ja: '手続きが完了しませんでした。30日以内に申請を再開することができます。',
    bn: 'প্রক্রিয়া অসম্পূর্ণ রয়ে গেছে। ৩০ দিনের মধ্যে পুনরুদ্ধার করে আবার চেষ্টা করতে পারবেন।',
  },
};

const HINT_CLS: Record<SelectionStatus, string> = {
  selected:   'bg-amber-50 border-amber-100 text-amber-800',
  cancelled:  'bg-slate-50 border-slate-200 text-slate-600',
  accepted:   'bg-amber-50 border-amber-100 text-amber-800',
  rejected:   'bg-red-50 border-red-100 text-red-700',
  processing: 'bg-blue-50 border-blue-100 text-blue-800',
  complete:   'bg-emerald-50 border-emerald-100 text-emerald-800',
  incomplete: 'bg-orange-50 border-orange-100 text-orange-800',
};

const STATUS_HEADER: Record<SelectionStatus, {
  icon: string;
  label: { en: string; ja: string; bn: string };
  sub: { en: string; ja: string; bn: string };
  headerCls: string;
  contactCls: string;
}> = {
  selected:   {
    icon: '👁️',
    label: { en: 'You Selected This Applicant', ja: 'この申請を選択しました', bn: 'আপনি এই আবেদনকারী নির্বাচন করেছেন' },
    sub:   { en: 'Review and accept to begin the process', ja: '承認して手続きを開始してください', bn: 'গ্রহণ করুন প্রক্রিয়া শুরু করতে' },
    headerCls:  'from-indigo-600 to-indigo-700',
    contactCls: 'bg-indigo-50 border-indigo-100',
  },
  accepted:   {
    icon: '✅',
    label: { en: 'Accepted — Awaiting Tensai Coordination', ja: '承認済み — Tensaiが調整中', bn: 'গৃহীত — Tensai সমন্বয় করছে' },
    sub:   { en: 'A Tensai manager will contact you within 24 hours', ja: '24時間以内にTensaiマネージャーがご連絡します', bn: '২৪ ঘণ্টার মধ্যে Tensai ম্যানেজার যোগাযোগ করবেন' },
    headerCls:  'from-amber-500 to-amber-600',
    contactCls: 'bg-amber-50 border-amber-100',
  },
  processing: {
    icon: '🔄',
    label: { en: 'Processing Underway', ja: '手続き進行中', bn: 'প্রক্রিয়া চলমান' },
    sub:   { en: 'Tensai is actively coordinating with your team', ja: 'Tensaiがチームと連携して進めています', bn: 'Tensai আপনার টিমের সাথে সমন্বয় করছে' },
    headerCls:  'from-blue-600 to-blue-700',
    contactCls: 'bg-blue-50 border-blue-100',
  },
  complete:   {
    icon: '🎓',
    label: { en: 'Enrollment Complete', ja: '入学手続き完了', bn: 'ভর্তি সম্পন্ন' },
    sub:   { en: 'The student has been successfully placed with your institution', ja: '学生の受け入れが正式に確定しました', bn: 'শিক্ষার্থী সফলভাবে আপনার প্রতিষ্ঠানে নিযুক্ত হয়েছে' },
    headerCls:  'from-emerald-600 to-green-700',
    contactCls: 'bg-emerald-50 border-emerald-100',
  },
  rejected:   {
    icon: '✕',
    label: { en: 'Rejected', ja: '却下されました', bn: 'প্রত্যাখ্যাত হয়েছে' },
    sub:   { en: 'You may revive this application within 30 days', ja: '30日以内であれば再開可能です', bn: '৩০ দিনের মধ্যে পুনরুদ্ধার করা যাবে' },
    headerCls:  'from-red-500 to-red-600',
    contactCls: 'bg-red-50 border-red-100',
  },
  cancelled:  {
    icon: '—',
    label: { en: 'Cancelled', ja: 'キャンセル済み', bn: 'বাতিল করা হয়েছে' },
    sub:   { en: 'You may revive this application within 30 days', ja: '30日以内であれば再開可能です', bn: '৩০ দিনের মধ্যে পুনরুদ্ধার করা যাবে' },
    headerCls:  'from-slate-400 to-slate-500',
    contactCls: 'bg-slate-50 border-slate-200',
  },
  incomplete: {
    icon: '⚠️',
    label: { en: 'Processing Incomplete', ja: '手続き未完了', bn: 'প্রক্রিয়া অসম্পূর্ণ' },
    sub:   { en: 'You may revive this application within 30 days', ja: '30日以内であれば再開可能です', bn: '৩০ দিনের মধ্যে পুনরুদ্ধার করা যাবে' },
    headerCls:  'from-orange-500 to-orange-600',
    contactCls: 'bg-orange-50 border-orange-100',
  },
};

// STATUS_BAR removed — replaced by STATUS_HEADER above

function isRevivable(app: SelectedApplication): boolean {
  if (!['cancelled', 'rejected', 'incomplete'].includes(app.status)) return false;
  const ts = app.rejected_at ?? app.selected_at;
  if (!ts) return false;
  const days = (Date.now() - new Date(ts).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 30;
}

function cap(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

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
  const [successMsg, setSuccessMsg]     = useState('');
  const [actionErr, setActionErr]       = useState('');

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };

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

  const accept = useMutation({
    mutationFn: (id: number) => api.post(`/institution/accept-application/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['institution-selected'] });
      setActionErr('');
      showSuccess(L === 'ja' ? '承認しました。Tensaiのマネージャーが24時間以内にご連絡します。' : L === 'bn' ? 'সফলভাবে গ্রহণ করা হয়েছে। Tensai ম্যানেজার ২৪ ঘণ্টার মধ্যে যোগাযোগ করবেন।' : 'Accepted successfully. A Tensai manager will contact you within 24 hours.');
    },
    onError,
  });
  const reject = useMutation({
    mutationFn: (id: number) => api.post(`/institution/reject-application/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['institution-selected'] }); setConfirmingId(null); setConfirmType(null); setActionErr(''); },
    onError,
  });
  const cancel = useMutation({
    mutationFn: (id: number) => api.post(`/institution/unselect-application/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['institution-selected'] }); setConfirmingId(null); setConfirmType(null); setActionErr(''); },
    onError,
  });
  const revive = useMutation({
    mutationFn: (id: number) => api.post(`/institution/revive-application/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['institution-selected'] });
      setActionErr('');
      showSuccess(L === 'ja' ? '申請を再開しました。' : L === 'bn' ? 'আবেদন পুনরুদ্ধার করা হয়েছে।' : 'Application revived successfully.');
    },
    onError,
  });

  if (!user || user.gateway_type !== 'institution') return null;

  const t = (en: string, ja: string, bn: string) => L === 'ja' ? ja : L === 'bn' ? bn : en;

  return (
    <DashboardLayout title={t('Selected Applications', '選択済み申請', 'নির্বাচিত আবেদন')}>

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 font-medium">
          ✓ {successMsg}
        </div>
      )}
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
            const hdr            = STATUS_HEADER[app.status];
            const hint           = HINTS[app.status];
            const hintCls        = HINT_CLS[app.status];
            const revivable      = isRevivable(app);
            const revivableEligible = ['cancelled', 'rejected', 'incomplete'].includes(app.status);

            const fmtDate = (d: string) => new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' });

            return (
              <div key={app.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                {/* Colored header */}
                <div className={`bg-gradient-to-r ${hdr.headerCls} px-5 py-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{hdr.icon}</span>
                        <p className="text-sm font-black text-white leading-tight">{hdr.label[L]}</p>
                      </div>
                      <p className="text-xs text-white/75 leading-snug">{hdr.sub[L]}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[11px] text-white/60">{app.lead_code}</p>
                      <p className="text-[10px] text-white/50 mt-0.5">{t('Selected', '選択日', 'নির্বাচন')}: {fmtDate(app.selected_at)}</p>
                    </div>
                  </div>

                  {/* Timeline chips */}
                  {(app.accepted_at || app.processing_at || app.completed_at) && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/20">
                      {app.accepted_at   && <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">{t('Accepted', '承認', 'গৃহীত')}: {fmtDate(app.accepted_at)}</span>}
                      {app.processing_at && <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">{t('Processing', '手続開始', 'প্রক্রিয়া')}: {fmtDate(app.processing_at)}</span>}
                      {app.completed_at  && <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">{t('Completed', '完了', 'সম্পন্ন')}: {fmtDate(app.completed_at)}</span>}
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap gap-4">

                    {/* Application info */}
                    <div className="flex-1 min-w-0">
                      {app.student_name && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm">👤</span>
                          <span className="text-sm font-bold text-slate-800">{app.student_name}</span>
                        </div>
                      )}
                      {app.city_type && (
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-3 ${app.city_type === 'fixed' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                          {app.city_type === 'fixed' ? t('Fixed City', '都市固定', 'ফিক্সড সিটি') : t('Preferred City', '都市希望', 'পছন্দের সিটি')}
                        </span>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-2 text-xs">
                        {app.target_country && <InfoRow label={t('Country', '国', 'দেশ')} value={cap(app.target_country)} />}
                        {app.target_city    && <InfoRow label={t('City', '都市', 'শহর')} value={app.target_city} />}
                        {app.target_course  && <InfoRow label={t('Course', 'コース', 'কোর্স')} value={app.target_course} />}
                        {app.target_intake  && <InfoRow label={t('Intake', '入学', 'ইনটেক')} value={fmtDate(app.target_intake)} />}
                        {app.last_education && <InfoRow label={t('Education', '学歴', 'শিক্ষা')} value={app.last_education} />}
                        {app.gpa            && <InfoRow label="GPA" value={app.gpa} />}
                        {app.jlpt_level     && <InfoRow label="JLPT" value={app.jlpt_level} />}
                        {app.age            && <InfoRow label={t('Age', '年齢', 'বয়স')} value={`${app.age} ${t('yrs', '歳', 'বছর')}`} />}
                      </div>
                    </div>

                    {/* Contact info — color matches status */}
                    {(app.connect_name || app.connect_email) && (
                      <div className={`shrink-0 min-w-[190px] border rounded-xl p-3 text-xs space-y-1.5 ${hdr.contactCls}`}>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                          {t('Your Contact Info', '担当者情報', 'আপনার যোগাযোগ')}
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

                    {/* Hint */}
                    <div className={`flex items-start gap-2.5 mb-4 p-3.5 border rounded-xl ${hintCls}`}>
                      <span className="text-sm shrink-0 mt-px">ℹ️</span>
                      <p className="text-xs font-medium leading-relaxed">{hint[L]}</p>
                    </div>

                    {/* Actions — selected */}
                    {app.status === 'selected' && (
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => accept.mutate(app.id)} disabled={accept.isPending}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-emerald-600/20 disabled:opacity-50">
                          {accept.isPending ? '...' : t('✓ Accept Application', '✓ 承認する', '✓ আবেদন গ্রহণ করুন')}
                        </button>
                        {confirmingId === app.id && confirmType === 'cancel' ? (
                          <div className="flex gap-2">
                            <button onClick={() => cancel.mutate(app.id)} disabled={cancel.isPending}
                              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl disabled:opacity-50">
                              {cancel.isPending ? '...' : t('Confirm Cancel', '確認', 'নিশ্চিত করুন')}
                            </button>
                            <button onClick={() => { setConfirmingId(null); setConfirmType(null); }}
                              className="px-3 py-2.5 text-xs text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50">
                              {t('Back', '戻る', 'ফিরুন')}
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setConfirmingId(app.id); setConfirmType('cancel'); }}
                            className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl transition-colors">
                            {t('✕ Cancel Selection', '✕ キャンセル', '✕ বাতিল করুন')}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Actions — accepted */}
                    {app.status === 'accepted' && (
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                          <span className="text-xs text-amber-700 font-semibold">
                            {t('Awaiting Tensai manager contact', 'Tensaiマネージャーからの連絡をお待ちください', 'Tensai ম্যানেজারের যোগাযোগের অপেক্ষায়')}
                          </span>
                        </div>
                        {confirmingId === app.id && confirmType === 'reject' ? (
                          <div className="flex gap-2">
                            <button onClick={() => reject.mutate(app.id)} disabled={reject.isPending}
                              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl disabled:opacity-50">
                              {reject.isPending ? '...' : t('Confirm Reject', '確認', 'নিশ্চিত করুন')}
                            </button>
                            <button onClick={() => { setConfirmingId(null); setConfirmType(null); }}
                              className="px-3 py-2.5 text-xs text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50">
                              {t('Back', '戻る', 'ফিরুন')}
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setConfirmingId(app.id); setConfirmType('reject'); }}
                            className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl transition-colors">
                            {t('✕ Withdraw Acceptance', '✕ 承認を取り消す', '✕ গ্রহণ প্রত্যাহার করুন')}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Actions — processing */}
                    {app.status === 'processing' && (
                      <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                        <span className="text-xl shrink-0">🔄</span>
                        <div>
                          <p className="text-xs font-bold text-blue-800">{t('Processing is underway', '手続きが進行中です', 'প্রক্রিয়া চলমান রয়েছে')}</p>
                          <p className="text-[11px] text-blue-600 mt-0.5">{t('Tensai will keep you updated on every step.', 'Tensaiより随時ご連絡いたします。', 'Tensai প্রতিটি ধাপে আপনাকে আপডেট রাখবে।')}</p>
                        </div>
                      </div>
                    )}

                    {/* Actions — complete */}
                    {app.status === 'complete' && (
                      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <span className="text-xl shrink-0">🎓</span>
                        <div>
                          <p className="text-xs font-bold text-emerald-800">{t('Enrollment Complete', '入学手続き完了', 'ভর্তি সম্পন্ন')}</p>
                          <p className="text-[11px] text-emerald-600 mt-0.5">{t('Thank you for choosing Tensai.', 'Tensaiをご利用いただきありがとうございます。', 'Tensai ব্যবহার করার জন্য ধন্যবাদ।')}</p>
                        </div>
                      </div>
                    )}

                    {/* Revive or expired */}
                    {revivableEligible && (
                      <div className="mt-3">
                        {revivable ? (
                          <button onClick={() => revive.mutate(app.id)} disabled={revive.isPending}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50">
                            {revive.isPending ? '...' : t('↩ Revive Application', '↩ 申請を再開する', '↩ আবেদন পুনরুদ্ধার করুন')}
                          </button>
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            {t('Revival period has expired (30 days). Please contact Tensai to proceed.', '30日が経過し再開期限が切れました。Tensaiまでご連絡ください。', 'পুনরুদ্ধারের মেয়াদ শেষ (৩০ দিন)। এগিয়ে যেতে Tensai-এ যোগাযোগ করুন।')}
                          </p>
                        )}
                      </div>
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
