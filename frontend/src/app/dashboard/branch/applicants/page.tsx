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
  const [starterKey, setStarterKey] = useState(0);
  const queryKey = ['branch-applications'];

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

  // ── Create form — always visible, no button ────────────────────────────────
  return (
    <BranchLayout title="Applications">
      <div className="mx-auto max-w-[860px]">
        <NewApplicationHero />
        <div className="overflow-hidden">
          <ApplicationStarter key={starterKey} onCreated={handleCreated} queryKey="branch-applications"
            onCancel={() => setStarterKey(k => k + 1)} />
        </div>
      </div>
    </BranchLayout>
  );
}
