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
import NewApplicationHero from '@/components/applications/NewApplicationHero';

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

  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const [showNew,   setShowNew]   = useState(false);

  const queryKey = ['agency-applications'];

  const { data: template } = useQuery<FormTemplateData | null>({
    queryKey: ['form-template', activeApp?.form_template_id],
    queryFn: () => activeApp?.form_template_id
      ? api.get(`/form-templates/${activeApp.form_template_id}`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!activeApp?.form_template_id,
    staleTime: 300_000,
  });

  function handleCreated(app: Application) {
    qc.invalidateQueries({ queryKey });
    setShowNew(false);
    setActiveApp(app);
  }

  function updateApps(updated: Application) {
    setActiveApp(prev => prev ? { ...prev, ...updated } : prev);
    qc.setQueryData(queryKey, (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a => a.id === updated.id ? { ...a, ...updated } : a),
    }));
  }

  function handleDocUploaded(doc: AppDoc, progress: number) {
    setActiveApp(prev => prev ? { ...prev, progress, documents: [...(prev.documents ?? []).filter(d => d.doc_type !== doc.doc_type), doc] } : prev);
  }

  function handleDocDeleted(docId: number, progress: number) {
    setActiveApp(prev => prev ? { ...prev, progress, documents: (prev.documents ?? []).filter(d => d.id !== docId) } : prev);
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
  if (activeApp !== null) return (
    <DashboardLayout title="Applications">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <ApplicationFormBody
          app={activeApp} template={template ?? null}
          onSaved={updateApps} onSubmitted={updateApps}
          onDocUploaded={handleDocUploaded} onDocDeleted={handleDocDeleted}
          onClose={() => setActiveApp(null)}
        />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Applications">

      {/* ── New Application form (centered) ── */}
      {showNew ? (
        <div className="flex justify-center">
          <div className="w-full max-w-[860px]">
            <NewApplicationHero />
            <div className="rounded-b-xl border border-t-0 border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
              <ApplicationStarter role="agency" onCreated={handleCreated} onCancel={() => setShowNew(false)} queryKey="agency-applications" />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-5 py-3 bg-green-700 hover:bg-green-600 text-white rounded-2xl font-bold text-sm shadow-md shadow-green-700/20 transition-all">
            + New Application
          </button>
        </div>
      )}

    </DashboardLayout>
  );
}
