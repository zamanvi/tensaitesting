'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SelectedApplication {
  id: number;
  lead_code: string;
  target_country: string;
  target_city: string | null;
  city_type: 'fixed' | 'preferred';
  target_course: string | null;
  target_intake: string | null;
  last_education: string | null;
  gpa: string | null;
  age: number | null;
  selected_at: string;
  status: 'selected' | 'accepted' | 'cancelled';
  // contact info submitted at selection time
  connect_name: string | null;
  connect_email: string | null;
  connect_whatsapp: string | null;
  connect_phone: string | null;
}

export default function InstitutionSelectedPage() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  useEffect(() => {
    if (user && user.gateway_type !== 'institution') router.replace(`/dashboard/${user.gateway_type}`);
  }, [user, router]);

  const [unselectingId, setUnselectingId] = useState<number | null>(null);
  const [acceptedId, setAcceptedId]       = useState<number | null>(null);
  const [actionErr, setActionErr]         = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['institution-selected'],
    queryFn: () => api.get('/institution/selected-applications').then(r => r.data),
    staleTime: 30_000,
  });

  const selected: SelectedApplication[] = data?.data ?? [];

  const accept = useMutation({
    mutationFn: (id: number) => api.post(`/institution/accept-application/${id}`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['institution-selected'] });
      setAcceptedId(id);
      setTimeout(() => setAcceptedId(null), 5000);
    },
    onError: () => setActionErr(ja ? '操作に失敗しました。' : bn ? 'ব্যর্থ হয়েছে।' : 'Action failed.'),
  });

  const unselect = useMutation({
    mutationFn: (id: number) => api.post(`/institution/unselect-application/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['institution-selected'] });
      setUnselectingId(null);
    },
    onError: () => setActionErr(ja ? '操作に失敗しました。' : bn ? 'ব্যর্থ হয়েছে।' : 'Action failed.'),
  });

  if (!user || user.gateway_type !== 'institution') return null;

  return (
    <DashboardLayout title={ja ? '選択済み申請' : bn ? 'নির্বাচিত আবেদন' : 'Selected Applications'}>

      {actionErr && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">⚠️ {actionErr}</div>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-sm animate-pulse">
          {ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}
        </div>
      ) : selected.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
          <div className="text-5xl mb-3">📂</div>
          <p className="font-semibold text-slate-600 mb-1">
            {ja ? '選択済み申請はありません' : bn ? 'কোনো নির্বাচিত আবেদন নেই' : 'No selected applications yet'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {ja ? '申請一覧から候補者を選択してください。' : bn ? 'Applications পেজ থেকে প্রার্থী নির্বাচন করুন।' : 'Go to Applications and select candidates you\'re interested in.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {selected.map(app => {
            const isAccepted  = app.status === 'accepted';
            const isCancelled = app.status === 'cancelled';
            return (
              <div key={app.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-colors ${
                isAccepted ? 'border-emerald-200' : isCancelled ? 'border-slate-200 opacity-60' : 'border-indigo-100'
              }`}>

                {/* Status bar */}
                <div className={`px-5 py-2 flex items-center gap-2 text-xs font-semibold ${
                  isAccepted ? 'bg-emerald-50 text-emerald-700' : isCancelled ? 'bg-slate-50 text-slate-400' : 'bg-indigo-50 text-indigo-700'
                }`}>
                  {isAccepted
                    ? <>✓ {ja ? '承認済み — Tensaiが対応中です' : bn ? 'গৃহীত — Tensai প্রক্রিয়াকরণ করছে' : 'Accepted — Tensai is processing this'}</>
                    : isCancelled
                    ? <>{ja ? 'キャンセル済み' : bn ? 'বাতিল করা হয়েছে' : 'Cancelled'}</>
                    : <>{ja ? '選択済み — 承認待ち' : bn ? 'নির্বাচিত — গ্রহণের অপেক্ষায়' : 'Selected — awaiting your acceptance'}</>
                  }
                </div>

                {/* Main card content */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap gap-4">

                    {/* Application info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{app.lead_code}</span>
                        {app.city_type && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${app.city_type === 'fixed' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                            {app.city_type === 'fixed' ? (ja ? '都市固定' : bn ? 'ফিক্সড সিটি' : 'Fixed City') : (ja ? '都市希望' : bn ? 'পছন্দের সিটি' : 'Preferred City')}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {ja ? '選択日: ' : bn ? 'নির্বাচন: ' : 'Selected: '}
                          {new Date(app.selected_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                        <InfoRow label={ja ? '国' : bn ? 'দেশ' : 'Country'} value={app.target_country} />
                        {app.target_city && <InfoRow label={ja ? '都市' : bn ? 'শহর' : 'City'} value={app.target_city} />}
                        {app.target_course && <InfoRow label={ja ? 'コース' : bn ? 'কোর্স' : 'Course'} value={app.target_course} />}
                        {app.target_intake && <InfoRow label={ja ? '入学' : bn ? 'ইনটেক' : 'Intake'} value={new Date(app.target_intake).toLocaleDateString(undefined, { dateStyle: 'medium' })} />}
                        {app.last_education && <InfoRow label={ja ? '学歴' : bn ? 'শিক্ষা' : 'Education'} value={app.last_education} />}
                        {app.gpa && <InfoRow label="GPA" value={app.gpa} />}
                        {app.age && <InfoRow label={ja ? '年齢' : bn ? 'বয়স' : 'Age'} value={`${app.age} ${ja ? '歳' : bn ? 'বছর' : 'yrs'}`} />}
                      </div>
                    </div>

                    {/* Contact info submitted at selection */}
                    {(app.connect_name || app.connect_email) && (
                      <div className="shrink-0 min-w-[180px] bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                          {ja ? '担当者情報' : bn ? 'যোগাযোগ তথ্য' : 'Your Contact Info'}
                        </p>
                        {app.connect_name && <ContactRow icon="👤" value={app.connect_name} />}
                        {app.connect_email && <ContactRow icon="✉️" value={app.connect_email} />}
                        {app.connect_whatsapp && <ContactRow icon="💬" value={app.connect_whatsapp} />}
                        {app.connect_phone && <ContactRow icon="📞" value={app.connect_phone} />}
                      </div>
                    )}
                  </div>

                  {/* 24hr hint + actions */}
                  {!isCancelled && (
                    <div className="mt-4 pt-4 border-t border-slate-100">

                      {/* 24hr hint */}
                      {!isAccepted && (
                        <div className="flex items-start gap-2 mb-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                          <span className="text-base shrink-0">⏰</span>
                          <p className="text-xs text-amber-800 font-medium leading-relaxed">
                            {ja
                              ? 'このアプリケーションを承認すると、Tensaiのマネージャーが24時間以内にご担当者にご連絡いたします。'
                              : bn
                              ? 'এটি গ্রহণ করলে Tensai-এর একজন ম্যানেজার ২৪ ঘণ্টার মধ্যে আপনার যোগাযোগকারীর সাথে যোগাযোগ করবেন।'
                              : 'Once you accept, a Tensai manager will contact your representative within 24 hours to proceed.'}
                          </p>
                        </div>
                      )}

                      {/* Accepted state */}
                      {isAccepted ? (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <span className="text-base">✅</span>
                          <p className="text-xs text-emerald-800 font-semibold">
                            {ja
                              ? 'Tensaiのマネージャーが近日中にご連絡いたします。しばらくお待ちください。'
                              : bn
                              ? 'Tensai ম্যানেজার শীঘ্রই আপনার সাথে যোগাযোগ করবেন। অনুগ্রহ করে অপেক্ষা করুন।'
                              : 'A Tensai manager will contact you soon. Please wait for their call or message.'}
                          </p>
                        </div>
                      ) : (
                        /* Accept + Cancel buttons */
                        <div className="flex flex-wrap items-center gap-2">
                          {acceptedId === app.id ? (
                            <span className="text-xs font-semibold text-emerald-600">✓ {ja ? '承認しました！' : bn ? 'গৃহীত হয়েছে!' : 'Accepted!'}</span>
                          ) : (
                            <button
                              onClick={() => accept.mutate(app.id)}
                              disabled={accept.isPending}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                              {accept.isPending ? '...' : (ja ? '✓ 承認する' : bn ? '✓ গ্রহণ করুন' : '✓ Accept')}
                            </button>
                          )}

                          {unselectingId === app.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => unselect.mutate(app.id)}
                                disabled={unselect.isPending}
                                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                              >
                                {unselect.isPending ? '...' : (ja ? '確認' : bn ? 'নিশ্চিত' : 'Confirm Cancel')}
                              </button>
                              <button onClick={() => setUnselectingId(null)}
                                className="px-3 py-2.5 text-xs text-slate-500 border border-slate-200 rounded-xl hover:border-slate-300">
                                {ja ? '戻る' : bn ? 'ফিরুন' : 'Back'}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setUnselectingId(app.id)}
                              className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl transition-colors"
                            >
                              {ja ? '✕ キャンセル' : bn ? '✕ বাতিল করুন' : '✕ Cancel Selection'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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
