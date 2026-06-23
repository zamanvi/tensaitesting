'use client';
import BranchLayout from '@/components/shared/BranchLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Application, AppDoc, FormTemplateData } from '@/components/applications/ApplicationFormShared';

interface Interview {
  id: number;
  scheduled_at: string | null;
  medium: string;
  status: string;
  result: string | null;
  meeting_link: string | null;
  student: { id: number; name: string; email: string } | null;
  institution: { id: number; name: string } | null;
}

const INTERVIEW_STATUS: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-600',
};

const MEDIUM_LABEL: Record<string, string> = {
  zoom: '🎥 Zoom', google_meet: '🎥 Meet', teams: '🎥 Teams',
  phone: '📞 Phone', in_person: '🏢 In Person',
};
import ApplicationFormBody from '@/components/applications/ApplicationFormBody';
import ApplicationStarter from '@/components/applications/ApplicationStarter';

const STATUS_STYLE: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-500',
  submitted: 'bg-amber-100 text-amber-700',
  accepted:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-rose-100 text-rose-600',
};

export default function BranchApplicantsPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const qc       = useQueryClient();

  const isBranchAdmin = user?.roles?.some(r => r === 'branch_admin' || r === 'branch_manager');
  useEffect(() => {
    if (user && !isBranchAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isBranchAdmin, router]);

  const [activeAppId, setActiveAppId] = useState<number | null>(null);
  const [showStarter, setShowStarter] = useState(false);
  const [tableTab,    setTableTab]    = useState<'draft' | 'submitted'>('submitted');

  const { data: interviews = [], isLoading: interviewsLoading } = useQuery<Interview[]>({
    queryKey: ['branch-interviews'],
    queryFn: () => api.get('/branch-admin/interviews').then(r => r.data),
    enabled: !!isBranchAdmin,
  });

  const { data: appsData, isLoading } = useQuery<{ data: Application[] }>({
    queryKey: ['branch-applications'],
    queryFn: () => api.get('/applications').then(r => r.data),
    enabled: !!isBranchAdmin,
  });
  const apps = appsData?.data ?? [];
  const activeApp = apps.find(a => a.id === activeAppId) ?? null;

  const { data: template } = useQuery<FormTemplateData | null>({
    queryKey: ['form-template', activeApp?.form_template_id],
    queryFn: () => activeApp?.form_template_id
      ? api.get(`/form-templates/${activeApp.form_template_id}`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!activeApp?.form_template_id,
    staleTime: 300_000,
  });

  function handleCreated(app: Application) {
    setActiveAppId(app.id);
    setShowStarter(false);
  }

  function updateApps(updated: Application) {
    qc.setQueryData(['branch-applications'], (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a => a.id === updated.id ? { ...a, ...updated } : a),
    }));
  }

  function handleDocUploaded(doc: AppDoc, progress: number) {
    qc.setQueryData(['branch-applications'], (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === activeAppId
          ? { ...a, progress, documents: [...a.documents.filter(d => d.doc_type !== doc.doc_type), doc] }
          : a
      ),
    }));
  }

  function handleDocDeleted(docId: number, progress: number) {
    qc.setQueryData(['branch-applications'], (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === activeAppId
          ? { ...a, progress, documents: a.documents.filter(d => d.id !== docId) }
          : a
      ),
    }));
  }

  if (!user || !isBranchAdmin) return null;

  const submitted = apps.filter(a => a.status !== 'draft');
  const drafts    = apps.filter(a => a.status === 'draft');

  return (
    <BranchLayout title="Applications">

      {activeAppId === null ? (
        <>
          {/* Header */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Student Applications</h2>
                <p className="text-green-100 text-xs mt-1">Select a country form and fill student details — submit when ready</p>
              </div>
              <button onClick={() => setShowStarter(s => !s)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-md ${showStarter ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white text-green-800 hover:bg-green-50'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={showStarter ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'} />
                </svg>
                {showStarter ? 'Cancel' : 'New Application'}
              </button>
            </div>

            {showStarter ? (
              <ApplicationStarter role="branch" onCreated={handleCreated} queryKey="branch-applications" />
            ) : (
              <div className="px-6 py-8 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-3 text-2xl">📝</div>
                <p className="text-sm font-semibold text-slate-600">
                  {isLoading ? 'Loading…' : apps.length === 0
                    ? 'No applications yet — click 'New Application' to begin'
                    : 'Select an application from the list below, or start a new one'}
                </p>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm">All Applications</h3>
                <p className="text-xs text-slate-400 mt-0.5">{apps.length} total</p>
              </div>
              <div className="flex gap-1.5">
                {(['submitted', 'draft'] as const).map(t => (
                  <button key={t} onClick={() => setTableTab(t)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${tableTab === t ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {t === 'submitted' ? `✓ Submitted (${submitted.length})` : `⏳ Draft (${drafts.length})`}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="py-20 text-center"><span className="w-8 h-8 border-3 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" /></div>
            ) : (tableTab === 'submitted' ? submitted : drafts).length === 0 ? (
              <div className="py-20 text-center">
                <div className="text-4xl mb-3">{tableTab === 'submitted' ? '📬' : '📝'}</div>
                <p className="text-sm font-semibold text-slate-500">No applications yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 text-xs font-bold text-slate-400 uppercase tracking-wide">
                      <th className="text-left px-6 py-3">Code</th>
                      <th className="text-left px-4 py-3">Student</th>
                      <th className="text-left px-4 py-3">Progress</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Country</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Status</th>
                      <th className="text-left px-4 py-3 hidden lg:table-cell">Updated</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(tableTab === 'submitted' ? submitted : drafts).map(app => (
                      <tr key={app.id} onClick={() => setActiveAppId(app.id)}
                        className="hover:bg-slate-50 cursor-pointer group transition-colors">
                        <td className="px-6 py-4"><span className="font-mono text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">{app.application_code}</span></td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-800 text-xs">{app.student_name}</p>
                          <p className="text-[11px] text-slate-400">{app.student_email}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${app.progress >= 80 ? 'bg-emerald-500' : app.progress >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${app.progress}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-600">{app.progress}%</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[app.status] ?? ''}`}>{app.status}</span>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500 hidden sm:table-cell">{app.form_template?.country ?? '—'}</td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[app.status] ?? ''}`}>{app.status}</span>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-400 hidden lg:table-cell">{new Date(app.updated_at).toLocaleDateString()}</td>
                        <td className="px-4 py-4"><span className="text-xs font-bold text-green-700 group-hover:text-green-900">Open →</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Interviews Section ── */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-6">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm">Interviews</h3>
                <p className="text-xs text-slate-400 mt-0.5">Scheduled interviews for students submitted by your branch</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">{interviews.length} total</span>
            </div>

            {interviewsLoading ? (
              <div className="py-16 text-center"><span className="w-7 h-7 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" /></div>
            ) : interviews.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-4xl mb-3">🗓️</div>
                <p className="text-sm font-semibold text-slate-500">No interviews scheduled yet</p>
                <p className="text-xs text-slate-400 mt-1">Interviews will appear here once admin schedules them for your students</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 text-xs font-bold text-slate-400 uppercase tracking-wide">
                      <th className="text-left px-6 py-3">Student</th>
                      <th className="text-left px-4 py-3">Institution</th>
                      <th className="text-left px-4 py-3">Scheduled</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Medium</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Result</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {interviews.map(iv => (
                      <tr key={iv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 text-xs">{iv.student?.name ?? '—'}</p>
                          <p className="text-[11px] text-slate-400">{iv.student?.email ?? ''}</p>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-600">{iv.institution?.name ?? '—'}</td>
                        <td className="px-4 py-4 text-xs text-slate-600">
                          {iv.scheduled_at
                            ? new Date(iv.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                            : <span className="text-slate-300">TBD</span>}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500 hidden sm:table-cell">
                          {MEDIUM_LABEL[iv.medium] ?? iv.medium}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${INTERVIEW_STATUS[iv.status] ?? 'bg-slate-100 text-slate-500'}`}>
                            {iv.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500 hidden md:table-cell">
                          {iv.result ?? <span className="text-slate-300">Pending</span>}
                        </td>
                        <td className="px-4 py-4">
                          {iv.meeting_link && (
                            <a href={iv.meeting_link} target="_blank" rel="noreferrer"
                              className="text-xs font-bold text-green-700 hover:text-green-900 whitespace-nowrap">
                              Join →
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : activeApp ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <ApplicationFormBody
            app={activeApp} template={template ?? null}
            onSaved={updateApps} onSubmitted={updateApps}
            onDocUploaded={handleDocUploaded} onDocDeleted={handleDocDeleted}
            onClose={() => setActiveAppId(null)}
          />
        </div>
      ) : null}
    </BranchLayout>
  );
}