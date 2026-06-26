'use client';
import BranchLayout from '@/components/shared/BranchLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Application, AppDoc, FormTemplateData } from '@/components/applications/ApplicationFormShared';
import ApplicationFormBody from '@/components/applications/ApplicationFormBody';
import ApplicationStarter from '@/components/applications/ApplicationStarter';
import NewApplicationHero from '@/components/applications/NewApplicationHero';

export default function BranchApplicantsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const isBranchAdmin = user?.roles?.some(r => r === 'branch_admin' || r === 'branch_manager');
  useEffect(() => {
    if (user && !isBranchAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isBranchAdmin, router]);

  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const [showNew,   setShowNew]   = useState(false);

  const queryKey = ['branch-applications'];

  const { data: appsData } = useQuery<{ data: Application[] }>({
    queryKey,
    queryFn: () => api.get('/applications').then(r => r.data),
    enabled: !!isBranchAdmin,
  });
  const apps = appsData?.data ?? [];

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

  if (!user || !isBranchAdmin) return null;

  // ── Application edit view ─────────────────────────────────────────────────
  if (activeApp !== null) {
    return (
      <BranchLayout title="Applications">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <ApplicationFormBody
            app={activeApp} template={template ?? null}
            onSaved={updateApps} onSubmitted={updateApps}
            onDocUploaded={handleDocUploaded} onDocDeleted={handleDocDeleted}
            onClose={() => setActiveApp(null)}
          />
        </div>
      </BranchLayout>
    );
  }

  return (
    <BranchLayout title="Applications">

      {/* ── New Application form (centered) ── */}
      {showNew ? (
        <div className="flex justify-center">
          <div className="w-full max-w-[860px]">
            <NewApplicationHero />
            <div className="bg-white rounded-[14px] border border-slate-200 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
              <ApplicationStarter role="branch" onCreated={handleCreated} onCancel={() => setShowNew(false)} queryKey="branch-applications" />
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

    </BranchLayout>
  );
}
