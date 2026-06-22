'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Application, AppDoc, FormTemplateData } from '@/components/applications/ApplicationFormShared';
import ApplicationFormBody from '@/components/applications/ApplicationFormBody';
import ApplicationStarter from '@/components/applications/ApplicationStarter';

const STATUS_STYLE: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-500',
  submitted: 'bg-amber-100 text-amber-700',
  accepted:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-rose-100 text-rose-600',
};

export default function AgencyAddApplicationPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const isAgency = user?.gateway_type === 'agency';
  useEffect(() => {
    if (user && !isAgency) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isAgency, router]);

  const { data: profileData } = useQuery({
    queryKey: ['agency-profile'],
    queryFn: () => api.get('/agency/profile').then(r => r.data.profile),
    enabled: !!isAgency,
  });
  const approved = profileData?.vetting_status === 'approved';

  const [activeAppId, setActiveAppId] = useState<number | null>(null);
  const [showStarter, setShowStarter] = useState(false);

  const { data: appsData, isLoading } = useQuery<{ data: Application[] }>({
    queryKey: ['agency-applications'],
    queryFn: () => api.get('/applications').then(r => r.data),
    enabled: !!isAgency && !!approved,
  });
  const apps = appsData?.data ?? [];
  const activeApp = apps.find(a => a.id === activeAppId) ?? null;

  const { data: template } = useQuery<FormTemplateData | null>({
    queryKey: ['form-template', activeApp?.form_template?.country],
    queryFn: () => activeApp?.form_template?.country
      ? api.get(`/form-templates/${encodeURIComponent(activeApp.form_template!.country)}`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!activeApp?.form_template?.country,
    staleTime: 300_000,
  });

  function handleCreated(app: Application) { setActiveAppId(app.id); setShowStarter(false); }

  function updateApps(updated: Application) {
    qc.setQueryData(['agency-applications'], (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a => a.id === updated.id ? { ...a, ...updated } : a),
    }));
  }

  function handleDocUploaded(doc: AppDoc, progress: number) {
    qc.setQueryData(['agency-applications'], (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === activeAppId ? { ...a, progress, documents: [...a.documents.filter(d => d.doc_type !== doc.doc_type), doc] } : a
      ),
    }));
  }

  function handleDocDeleted(docId: number, progress: number) {
    qc.setQueryData(['agency-applications'], (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === activeAppId ? { ...a, progress, documents: a.documents.filter(d => d.id !== docId) } : a
      ),
    }));
  }

  if (!user || !isAgency) return null;

  if (profileData && !approved) {
    return (
      <DashboardLayout title="Applications">
        <div className="max-w-lg mx-auto mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="font-bold text-slate-900 mb-2">Agency Approval Required</p>
          <p className="text-sm text-slate-600 mb-4">Your agency profile must be approved before you can submit applications.</p>
          <Link href="/dashboard/agency/profile" className="inline-block px-5 py-2.5 bg-green-700 text-white text-sm font-bold rounded-xl">View Profile</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Applications">
      {activeAppId === null ? (
        <>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">My Applications</h2>
                <p className="text-green-100 text-xs mt-1">Select a country form and fill in student details — submit when complete</p>
              </div>
              <button onClick={() => setShowStarter(s => !s)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-md ${showStarter ? 'bg-white/20 text-white' : 'bg-white text-green-800 hover:bg-green-50'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={showStarter ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'} />
                </svg>
                {showStarter ? 'Cancel' : 'New Application'}
              </button>
            </div>
            {showStarter ? (
              <ApplicationStarter role="agency" onCreated={handleCreated} queryKey="agency-applications" />
            ) : (
              <div className="px-6 py-8 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-3 text-2xl">📝</div>
                <p className="text-sm font-semibold text-slate-600">
                  {isLoading ? 'Loading…' : apps.length === 0 ? 'No applications yet — click New Application' : 'Select an existing application or start a new one'}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm">All Applications <span className="font-normal text-slate-400 ml-1">({apps.length})</span></h3>
            </div>
            {isLoading ? (
              <div className="py-20 text-center"><span className="w-8 h-8 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" /></div>
            ) : apps.length === 0 ? (
              <div className="py-20 text-center"><p className="text-sm text-slate-400">No applications yet</p></div>
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
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {apps.map(app => (
                      <tr key={app.id} onClick={() => setActiveAppId(app.id)} className="hover:bg-slate-50 cursor-pointer group transition-colors">
                        <td className="px-6 py-4"><span className="font-mono text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">{app.application_code}</span></td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-800 text-xs">{app.student_name}</p>
                          <p className="text-[11px] text-slate-400">{app.student_email}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${app.progress >= 80 ? 'bg-emerald-500' : app.progress >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${app.progress}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-600">{app.progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500 hidden sm:table-cell">{app.form_template?.country ?? '—'}</td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[app.status] ?? ''}`}>{app.status}</span>
                        </td>
                        <td className="px-4 py-4"><span className="text-xs font-bold text-green-700 group-hover:text-green-900">Open →</span></td>
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
    </DashboardLayout>
  );
}