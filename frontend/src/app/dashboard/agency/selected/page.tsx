'use client';
import { useEffect, useState } from 'react';
import AgencyLayout from '@/components/shared/AgencyLayout';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import ApplicationFormBody from '@/components/applications/ApplicationFormBody';
import { Application, AppDoc, FormTemplateData } from '@/components/applications/ApplicationFormShared';

type L = 'en' | 'ja' | 'bn';

const STATUS_BADGE: Record<string, { cls: string; label: Record<L, string> }> = {
  selected:   { cls: 'bg-indigo-100 text-indigo-700',   label: { en: 'Selected',   ja: '選択済み',  bn: 'নির্বাচিত' } },
  accepted:   { cls: 'bg-amber-100 text-amber-700',     label: { en: 'Accepted',   ja: '承認済み',  bn: 'গৃহীত' } },
  processing: { cls: 'bg-blue-100 text-blue-700',       label: { en: 'Processing', ja: '手続き中',  bn: 'প্রক্রিয়াধীন' } },
  complete:   { cls: 'bg-emerald-100 text-emerald-700', label: { en: 'Complete',   ja: '完了',      bn: 'সম্পন্ন' } },
  incomplete: { cls: 'bg-orange-100 text-orange-700',   label: { en: 'Incomplete', ja: '未完了',    bn: 'অসম্পূর্ণ' } },
};

function timeAgo(dateStr: string, lang: L): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return lang === 'ja' ? 'たった今' : lang === 'bn' ? 'এইমাত্র' : 'just now';
  if (m < 60) return lang === 'ja' ? `${m}分前` : lang === 'bn' ? `${m}মি আগে` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === 'ja' ? `${h}時間前` : lang === 'bn' ? `${h}ঘ আগে` : `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return lang === 'ja' ? `${d}日前` : lang === 'bn' ? `${d}দিন আগে` : `${d}d ago`;
  return new Date(dateStr).toLocaleDateString(lang === 'ja' ? 'ja-JP' : lang === 'bn' ? 'en-GB' : 'en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

function cap(s: string | null | undefined) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'; }

export default function AgencySelectedPage() {
  const { user } = useAuthStore();
  const { lang } = useLang();
  const router   = useRouter();
  const qc       = useQueryClient();
  const isAgency = user?.gateway_type === 'agency';
  const L: L     = lang === 'ja' ? 'ja' : lang === 'bn' ? 'bn' : 'en';
  const t = (en: string, ja: string, bn: string) => L === 'ja' ? ja : L === 'bn' ? bn : en;

  const [activeAppId, setActiveAppId] = useState<number | null>(null);

  useEffect(() => {
    if (user && !isAgency) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isAgency, router]);

  const queryKey = ['agency-applications'];

  const { data: appsData, isLoading } = useQuery<{ data: Application[] }>({
    queryKey,
    queryFn: () => api.get('/applications').then(r => r.data),
    staleTime: 60_000,
    enabled: !!isAgency,
  });

  const allApps = appsData?.data ?? [];
  const selected = allApps.filter(a =>
    ['selected', 'accepted', 'processing', 'complete', 'incomplete'].includes(a.status)
  );
  const activeApp = selected.find(a => a.id === activeAppId) ?? null;

  const { data: template, isLoading: templateLoading } = useQuery<FormTemplateData | null>({
    queryKey: ['form-template', activeApp?.form_template_id],
    queryFn: () => activeApp?.form_template_id
      ? api.get(`/form-templates/${activeApp.form_template_id}`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!activeApp?.form_template_id,
    staleTime: 300_000,
  });

  function updateApps(updated: Application) {
    qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a => a.id === updated.id ? { ...a, ...updated } : a),
    }));
  }

  function handleDocUploaded(doc: AppDoc, progress: number) {
    qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === activeAppId ? { ...a, progress, documents: [...(a.documents ?? []).filter(d => d.doc_type !== doc.doc_type), doc] } : a
      ),
    }));
  }

  function handleDocDeleted(docId: number, progress: number) {
    qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === activeAppId ? { ...a, progress, documents: (a.documents ?? []).filter(d => d.id !== docId) } : a
      ),
    }));
  }

  if (!user || !isAgency) return null;

  // ── Active form view ──────────────────────────────────────────────────────────
  if (activeAppId !== null && activeApp) {
    return (
      <AgencyLayout>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <ApplicationFormBody
            app={activeApp} template={template ?? null} templateLoading={templateLoading}
            onSaved={updateApps} onSubmitted={updateApps}
            onDocUploaded={handleDocUploaded} onDocDeleted={handleDocDeleted}
            onClose={() => setActiveAppId(null)}
          />
        </div>
      </AgencyLayout>
    );
  }

  return (
    <AgencyLayout>
      <div className="max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-[0.15em] font-semibold mb-2">
              {t('Agency Portal', 'エージェントポータル', 'এজেন্সি পোর্টাল')}
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {t('In Progress', '進行中', 'চলমান আবেদন')}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {t('Applications selected by an institution or currently being processed.', '機関が選択中または現在手続き中の申請。', 'প্রতিষ্ঠান কর্তৃক নির্বাচিত বা বর্তমানে প্রক্রিয়াধীন আবেদন।')}
            </p>
          </div>
          {selected.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {selected.length} {t('In Progress', '進行中', 'চলমান')}
            </span>
          )}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-sm">{t('Applications In Progress', '進行中の申請', 'চলমান আবেদনসমূহ')}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{t('Applications selected by an institution or currently being processed', '機関が選択中または手続き中の申請', 'প্রতিষ্ঠান কর্তৃক নির্বাচিত বা প্রক্রিয়াধীন আবেদন')}</p>
            </div>
            {selected.length > 0 && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl">
                {selected.length} {t('total', '件', 'টি')}
              </span>
            )}
          </div>

          {/* Body */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <span className="w-8 h-8 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
              <p className="text-xs text-slate-400">{t('Loading…', '読み込み中…', 'লোড হচ্ছে…')}</p>
            </div>
          ) : selected.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3 text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">{t('No applications in progress yet', '進行中の申請はありません', 'এখনো কোনো চলমান আবেদন নেই')}</p>
                <p className="text-xs text-slate-400 mt-1">{t('Applications will appear here once an institution selects them.', '機関が申請を選択するとここに表示されます。', 'প্রতিষ্ঠান আবেদন নির্বাচন করলে এখানে দেখাবে।')}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="text-left px-5 py-3">{t('Code', 'コード', 'কোড')}</th>
                      <th className="text-left px-4 py-3">{t('Student', '学生', 'শিক্ষার্থী')}</th>
                      <th className="text-left px-4 py-3">{t('Country / Form', '国 / フォーム', 'দেশ / ফর্ম')}</th>
                      <th className="text-left px-4 py-3">{t('Progress', '進捗', 'অগ্রগতি')}</th>
                      <th className="text-left px-4 py-3">{t('Status', 'ステータス', 'অবস্থা')}</th>
                      <th className="text-left px-4 py-3">{t('Updated', '更新日', 'আপডেট')}</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selected.map(app => {
                      const badge = STATUS_BADGE[app.status] ?? STATUS_BADGE.accepted;
                      return (
                        <tr key={app.id}
                          onClick={() => setActiveAppId(app.id)}
                          className="hover:bg-emerald-50/40 cursor-pointer transition-colors group">
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-1 rounded-lg group-hover:bg-white transition-colors">
                              {app.application_code}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center shrink-0 transition-colors">
                                <span className="text-xs font-black text-emerald-600">
                                  {app.student_name?.charAt(0)?.toUpperCase() ?? '?'}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 text-xs">{app.student_name}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">{app.student_email || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-xs font-semibold text-slate-700">{cap(app.form_template?.country)}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[160px]">{app.form_template?.name ?? ''}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-emerald-500"
                                  style={{ width: `${app.progress ?? 0}%` }} />
                              </div>
                              <span className="text-xs font-bold text-slate-600 tabular-nums">{app.progress ?? 0}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label[L]}</span>
                          </td>
                          <td className="px-4 py-3.5 text-[11px] text-slate-400 whitespace-nowrap">
                            {timeAgo(app.updated_at ?? app.created_at, L)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-700 text-slate-400 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-slate-50">
                {selected.map(app => {
                  const badge = STATUS_BADGE[app.status] ?? STATUS_BADGE.accepted;
                  return (
                    <div key={app.id}
                      onClick={() => setActiveAppId(app.id)}
                      className="px-4 py-4 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors active:bg-slate-100">
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <span className="text-sm font-black text-emerald-600">
                          {app.student_name?.charAt(0)?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-bold text-slate-900 truncate">{app.student_name}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${badge.cls}`}>{badge.label[L]}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{cap(app.form_template?.country)} · {app.application_code}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(app.updated_at ?? app.created_at, L)}</p>
                      </div>
                      <svg className="w-4 h-4 text-slate-300 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-5 sm:px-6 py-3 border-t border-slate-50 bg-slate-50/50">
                <p className="text-[11px] text-slate-400">
                  <span className="font-bold text-slate-600">{selected.length}</span> {t(`application${selected.length !== 1 ? 's' : ''} in progress`, '件進行中', 'টি চলমান')}
                  {allApps.length > selected.length && (
                    <> · <span className="font-bold text-slate-600">{allApps.length}</span> {t('total across all statuses', '件合計', 'টি মোট')}</>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </AgencyLayout>
  );
}
