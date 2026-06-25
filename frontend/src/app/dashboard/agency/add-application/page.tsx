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

const STEPS = [
  { n: 1, label: 'Select Country Form' },
  { n: 2, label: 'Fill Student Info' },
  { n: 3, label: 'Education & Documents' },
  { n: 4, label: 'Save & Continue' },
];

export default function AgencyAddApplicationPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const qc       = useQueryClient();

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
  const [tableTab,    setTableTab]    = useState<'submitted' | 'draft'>('submitted');
  const [search,      setSearch]      = useState('');

  const { data: appsData, isLoading } = useQuery<{ data: Application[] }>({
    queryKey: ['agency-applications'],
    queryFn: () => api.get('/applications').then(r => r.data),
    enabled: !!isAgency && !!approved,
  });
  const apps      = appsData?.data ?? [];
  const activeApp = apps.find(a => a.id === activeAppId) ?? null;

  const { data: template } = useQuery<FormTemplateData | null>({
    queryKey: ['form-template', activeApp?.form_template_id],
    queryFn: () => activeApp?.form_template_id
      ? api.get(`/form-templates/${activeApp.form_template_id}`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!activeApp?.form_template_id,
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

  /* ── Not approved ── */
  if (profileData && !approved) return (
    <DashboardLayout title="Applications">
      <div className="max-w-lg mx-auto mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">⏳</div>
        <p className="font-bold text-slate-900 mb-2">Agency Approval Required</p>
        <p className="text-sm text-slate-600 mb-4">Your agency profile must be approved before you can submit applications.</p>
        <Link href="/dashboard/agency/profile" className="inline-block px-5 py-2.5 bg-green-700 text-white text-sm font-bold rounded-xl">View Profile</Link>
      </div>
    </DashboardLayout>
  );

  /* ── Application edit view ── */
  if (activeAppId !== null && activeApp) return (
    <DashboardLayout title="Applications">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <ApplicationFormBody
          app={activeApp} template={template ?? null}
          onSaved={updateApps} onSubmitted={updateApps}
          onDocUploaded={handleDocUploaded} onDocDeleted={handleDocDeleted}
          onClose={() => setActiveAppId(null)}
        />
      </div>
    </DashboardLayout>
  );

  const q         = search.toLowerCase();
  const submitted = apps.filter(a => a.status !== 'draft').filter(a =>
    !q || a.student_name?.toLowerCase().includes(q) || a.student_email?.toLowerCase().includes(q) ||
    a.application_code?.toLowerCase().includes(q) || a.form_template?.country?.toLowerCase().includes(q)
  );
  const drafts = apps.filter(a => a.status === 'draft').filter(a =>
    !q || a.student_name?.toLowerCase().includes(q) || a.student_email?.toLowerCase().includes(q) ||
    a.application_code?.toLowerCase().includes(q) || a.form_template?.country?.toLowerCase().includes(q)
  );
  const list = tableTab === 'submitted' ? submitted : drafts;

  return (
    <DashboardLayout title="Applications">

      {/* ── New Application hero + form ── */}
      {showStarter && (
        <div className="mb-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="relative bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 px-5 sm:px-8 py-7 sm:py-9 overflow-hidden">
            <div className="absolute right-0 top-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
            <div className="absolute right-12 bottom-0 w-36 h-36 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />
            <button onClick={() => setShowStarter(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-bold rounded-xl transition-all z-10">
              ✕ Cancel
            </button>
            <div className="relative z-10 pr-20">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-green-200 bg-white/10 border border-white/20 px-3 py-1 rounded-full mb-3">
                🔒 NEW APPLICATION
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Create a New Student Application
              </h2>
              <p className="text-green-100 text-xs mt-1.5 mb-5 max-w-md">
                Select a country form, fill in the student&apos;s details, and save to continue editing the full application.
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {STEPS.map((step, i) => (
                  <span key={step.n} className="flex items-center gap-1">
                    <span className="flex items-center gap-1.5 bg-white/15 border border-white/25 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      <span className="w-4 h-4 bg-white/30 rounded-full text-[9px] flex items-center justify-center font-black flex-shrink-0">{step.n}</span>
                      <span className="hidden sm:inline">{step.label}</span>
                    </span>
                    {i < STEPS.length - 1 && <span className="text-white/30 text-xs">›</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <ApplicationStarter role="agency" onCreated={handleCreated} queryKey="agency-applications" />
        </div>
      )}

      {/* ── Applications table ── */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-5">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">All Applications</h3>
              <p className="text-xs text-slate-400 mt-0.5">{apps.length} total</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 bg-slate-50 w-44"
                  placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {!showStarter && (
                <button onClick={() => setShowStarter(true)}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-green-700 hover:bg-green-800 text-white transition-all shadow-sm">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">New Application</span>
                  <span className="sm:hidden">New</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile search */}
          <div className="sm:hidden relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500/30 bg-slate-50"
              placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5">
            {(['submitted', 'draft'] as const).map(t => (
              <button key={t} onClick={() => setTableTab(t)}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-colors ${tableTab === t ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {t === 'submitted' ? `✓ Submitted (${submitted.length})` : `⏳ Draft (${drafts.length})`}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <span className="w-7 h-7 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" />
          </div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center px-6">
            <div className="text-4xl mb-3">{tableTab === 'submitted' ? '📬' : '📝'}</div>
            <p className="text-sm font-semibold text-slate-500">
              {search ? 'No results found' : tableTab === 'submitted' ? 'No submitted applications yet' : 'No draft applications'}
            </p>
            {!search && !showStarter && (
              <button onClick={() => setShowStarter(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-all">
                + New Application
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="text-left px-4 sm:px-6 py-3">Student</th>
                  <th className="text-left px-3 py-3">Progress</th>
                  <th className="text-left px-3 py-3 hidden sm:table-cell">Country</th>
                  <th className="text-left px-3 py-3 hidden md:table-cell">Intake</th>
                  <th className="text-left px-3 py-3">Status</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {list.map(app => (
                  <tr key={app.id} onClick={() => setActiveAppId(app.id)}
                    className="hover:bg-slate-50/80 cursor-pointer group transition-colors">
                    <td className="px-4 sm:px-6 py-3.5">
                      <p className="font-bold text-slate-800 text-xs leading-tight">{app.student_name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{app.application_code}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                          <div className={`h-full rounded-full transition-all ${app.progress >= 80 ? 'bg-emerald-500' : app.progress >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                            style={{ width: `${app.progress}%` }} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 flex-shrink-0">{app.progress}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-500 hidden sm:table-cell">
                      {app.form_template?.country ?? '—'}
                    </td>
                    <td className="px-3 py-3.5 hidden md:table-cell">
                      {app.form_data?.intake
                        ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 whitespace-nowrap">{app.form_data.intake}</span>
                        : <span className="text-[10px] text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_STYLE[app.status] ?? ''}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span className="text-xs font-bold text-green-700 group-hover:text-green-900 whitespace-nowrap">Open →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </DashboardLayout>
  );
}
