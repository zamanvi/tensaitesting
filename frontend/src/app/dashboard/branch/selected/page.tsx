'use client';
import BranchLayout from '@/components/shared/BranchLayout';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';

interface SelectedApp {
  id: number;
  lead_code: string;
  target_country: string;
  target_city: string | null;
  target_course: string | null;
  target_intake: string | null;
  last_education: string | null;
  gpa: string | null;
  selected_at: string;
  updated_at: string | null;
  status: 'selected' | 'accepted' | 'rejected' | 'processing' | 'complete' | 'incomplete' | 'cancelled';
  student_name: string | null;
  institution_name: string | null;
  institution_country: string | null;
  connect_name: string | null;
  connect_email: string | null;
  connect_whatsapp: string | null;
  connect_phone: string | null;
}

export default function BranchSelectedPage() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const router = useRouter();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const isBranchAdmin = user?.roles?.some(r => r === 'branch_admin' || r === 'branch_manager');

  useEffect(() => {
    if (user && !isBranchAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isBranchAdmin, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['branch-selected'],
    queryFn: () => api.get('/branch-admin/selected-applications').then(r => r.data),
    enabled: !!isBranchAdmin,
    staleTime: 30_000,
  });

  const apps: SelectedApp[] = data?.data ?? [];

  if (!user || !isBranchAdmin) return null;

  const STATUS_CLS: Record<string, { bar: string; badge: string; label: string }> = {
    selected:   { bar: 'bg-indigo-50 text-indigo-700',   badge: 'bg-indigo-100 text-indigo-700',   label: ja ? '選択済み'     : bn ? 'নির্বাচিত'         : 'Selected' },
    accepted:   { bar: 'bg-amber-50 text-amber-700',     badge: 'bg-amber-100 text-amber-700',     label: ja ? '承認済み'     : bn ? 'গৃহীত'             : 'Accepted' },
    processing: { bar: 'bg-blue-50 text-blue-700',       badge: 'bg-blue-100 text-blue-700',       label: ja ? '手続き進行中' : bn ? 'প্রক্রিয়া চলমান'  : 'Processing' },
    complete:   { bar: 'bg-emerald-50 text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', label: ja ? '手続き完了'   : bn ? 'প্রক্রিয়া সম্পন্ন' : 'Complete' },
    incomplete: { bar: 'bg-orange-50 text-orange-700',   badge: 'bg-orange-100 text-orange-700',   label: ja ? '手続き未完了' : bn ? 'প্রক্রিয়া অসম্পূর্ণ': 'Incomplete' },
    rejected:   { bar: 'bg-red-50 text-red-600',         badge: 'bg-red-100 text-red-600',         label: ja ? '却下'         : bn ? 'প্রত্যাখ্যাত'      : 'Rejected' },
    cancelled:  { bar: 'bg-slate-50 text-slate-400',     badge: 'bg-slate-100 text-slate-400',     label: ja ? 'キャンセル'   : bn ? 'বাতিল'             : 'Cancelled' },
  };

  return (
    <BranchLayout>
      <div className="max-w-4xl">

        <h1 className="text-2xl font-bold text-slate-800 mb-5">
          {ja ? '進行中の申請' : bn ? 'চলমান আবেদন' : 'Applications In Progress'}
        </h1>

        {isLoading ? (
          <div className="text-center py-16 text-slate-400 text-sm animate-pulse">
            {ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}
          </div>
        ) : apps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
            <div className="text-5xl mb-3">📂</div>
            <p className="font-semibold text-slate-600 mb-1">
              {ja ? '選択済み申請はありません' : bn ? 'কোনো নির্বাচিত আবেদন নেই' : 'No selected applications yet'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {ja ? '機関がこのブランチの学生を選択すると表示されます。' : bn ? 'প্রতিষ্ঠান এই শাখার শিক্ষার্থী নির্বাচন করলে এখানে দেখাবে।' : 'Applications selected by institutions from this branch will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map(app => {
              const cls = STATUS_CLS[app.status] ?? STATUS_CLS.selected;
              return (
                <div key={app.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                  {/* Status bar */}
                  <div className={`px-5 py-2 flex items-center justify-between text-xs font-semibold ${cls.bar}`}>
                    <span>{cls.label}</span>
                    {(app.updated_at ?? app.selected_at) && (
                      <span className="font-normal opacity-70">
                        {new Date(app.updated_at ?? app.selected_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </span>
                    )}
                  </div>

                  {/* Journey stepper */}
                  {!['rejected','cancelled','incomplete'].includes(app.status) && (
                    <JourneyStepper status={app.status} ja={ja} bn={bn} />
                  )}

                  <div className="p-4 sm:p-5">
                    <div className="flex flex-wrap gap-4">

                      {/* Application info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{app.lead_code}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls.badge}`}>{cls.label}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                          {app.student_name && <InfoRow label={ja ? '学生' : bn ? 'শিক্ষার্থী' : 'Student'} value={app.student_name} />}
                          <InfoRow label={ja ? '国' : bn ? 'দেশ' : 'Country'} value={app.target_country.charAt(0).toUpperCase() + app.target_country.slice(1)} />
                          {app.target_city && <InfoRow label={ja ? '都市' : bn ? 'শহর' : 'City'} value={app.target_city} />}
                          {app.target_course && <InfoRow label={ja ? 'コース' : bn ? 'কোর্স' : 'Course'} value={app.target_course} />}
                          {app.target_intake && <InfoRow label={ja ? '入学' : bn ? 'ইনটেক' : 'Intake'} value={new Date(app.target_intake).toLocaleDateString(undefined, { dateStyle: 'medium' })} />}
                          {app.last_education && <InfoRow label={ja ? '学歴' : bn ? 'শিক্ষা' : 'Education'} value={app.last_education} />}
                          {app.gpa && <InfoRow label="GPA" value={app.gpa} />}
                        </div>
                      </div>

                      {/* Institution info */}
                      {app.institution_name && (
                        <div className="shrink-0 min-w-[180px] bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs space-y-1">
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">
                            {ja ? '選択した機関' : bn ? 'নির্বাচনকারী প্রতিষ্ঠান' : 'Selected by'}
                          </p>
                          <p className="font-bold text-slate-800">{app.institution_name}</p>
                          {app.institution_country && <p className="text-slate-500">{app.institution_country.charAt(0).toUpperCase() + app.institution_country.slice(1)}</p>}
                          {app.connect_name && (
                            <div className="pt-1 mt-1 border-t border-amber-100 space-y-0.5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                                {ja ? '担当者' : bn ? 'যোগাযোগ' : 'Contact'}
                              </p>
                              {app.connect_name     && <div className="flex gap-1.5"><span>👤</span><span className="text-slate-600 truncate">{app.connect_name}</span></div>}
                              {app.connect_email    && <div className="flex gap-1.5"><span>✉️</span><span className="text-slate-600 truncate">{app.connect_email}</span></div>}
                              {app.connect_whatsapp && <div className="flex gap-1.5"><span>💬</span><span className="text-slate-600 truncate">{app.connect_whatsapp}</span></div>}
                              {app.connect_phone    && <div className="flex gap-1.5"><span>📞</span><span className="text-slate-600 truncate">{app.connect_phone}</span></div>}
                            </div>
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
      </div>
    </BranchLayout>
  );
}

const JOURNEY_STEPS = [
  { key: 'selected',   en: 'Selected',   ja: '選択済み',  bn: 'নির্বাচিত' },
  { key: 'accepted',   en: 'Accepted',   ja: '承認済み',  bn: 'গৃহীত' },
  { key: 'processing', en: 'Processing', ja: '手続き中',  bn: 'প্রক্রিয়া' },
  { key: 'complete',   en: 'Enrolled',   ja: '入学確定',  bn: 'ভর্তি সম্পন্ন' },
] as const;

function JourneyStepper({ status, ja, bn }: { status: string; ja: boolean; bn: boolean }) {
  const idx = JOURNEY_STEPS.findIndex(s => s.key === status);
  const label = (s: typeof JOURNEY_STEPS[number]) => ja ? s.ja : bn ? s.bn : s.en;
  return (
    <div className="px-5 pb-3 pt-1">
      <div className="flex items-start gap-0">
        {JOURNEY_STEPS.map((step, i) => {
          const done = i < idx, cur = i === idx, future = i > idx;
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0
                  ${done ? 'bg-emerald-500 text-white' : cur ? 'bg-green-700 text-white ring-4 ring-green-700/20' : 'bg-slate-100 text-slate-300'}`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-[8px] font-semibold whitespace-nowrap text-center leading-tight
                  ${done ? 'text-emerald-600' : cur ? 'text-green-700' : 'text-slate-300'}`}>
                  {label(step)}
                </span>
              </div>
              {i < 3 && <div className={`flex-1 h-0.5 mx-1 mb-3 rounded-full ${done ? 'bg-emerald-400' : 'bg-slate-100'}`} />}
            </div>
          );
        })}
      </div>
    </div>
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
