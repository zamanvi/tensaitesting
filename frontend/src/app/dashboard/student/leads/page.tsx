'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Application, AppDoc, FormTemplateData } from '@/components/applications/ApplicationFormShared';
import ApplicationFormBody from '@/components/applications/ApplicationFormBody';
import ApplicationStarter from '@/components/applications/ApplicationStarter';

export default function StudentApplicationPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const qc       = useQueryClient();

  const isStudent = user?.gateway_type === 'student';
  useEffect(() => {
    if (user && !isStudent) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isStudent, router]);

  const { data: appsData, isLoading } = useQuery<{ data: Application[] }>({
    queryKey: ['student-application'],
    queryFn: () => api.get('/applications').then(r => r.data),
    enabled: !!isStudent,
  });
  const myApp = appsData?.data?.[0] ?? null;

  const { data: template } = useQuery<FormTemplateData | null>({
    queryKey: ['form-template', myApp?.form_template_id],
    queryFn: () => myApp?.form_template_id
      ? api.get(`/form-templates/${myApp.form_template_id}`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!myApp?.form_template_id,
    staleTime: 300_000,
  });

  function handleCreated(_app: Application) {
    qc.invalidateQueries({ queryKey: ['student-application'] });
  }

  function updateApp(updated: Application) {
    qc.setQueryData(['student-application'], (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a => a.id === updated.id ? { ...a, ...updated } : a),
    }));
  }

  function handleDocUploaded(doc: AppDoc, progress: number) {
    qc.setQueryData(['student-application'], (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === myApp?.id ? { ...a, progress, documents: [...(a.documents ?? []).filter(d => d.doc_type !== doc.doc_type), doc] } : a
      ),
    }));
  }

  function handleDocDeleted(docId: number, progress: number) {
    qc.setQueryData(['student-application'], (old: { data: Application[] } | undefined) => ({
      ...old, data: (old?.data ?? []).map(a =>
        a.id === myApp?.id ? { ...a, progress, documents: (a.documents ?? []).filter(d => d.id !== docId) } : a
      ),
    }));
  }

  if (!user || !isStudent) return null;

  return (
    <DashboardLayout title="My Application">
      {isLoading ? (
        <div className="py-20 text-center"><span className="w-8 h-8 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" /></div>
      ) : myApp ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {myApp.status !== 'draft' && (
            <div className={`px-6 py-3 text-sm font-semibold flex items-center gap-2 border-b ${
              myApp.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
              myApp.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
              'bg-amber-50 text-amber-700 border-amber-100'}`}>
              {myApp.status === 'accepted' ? '✅ Your application was accepted!' :
               myApp.status === 'rejected' ? '❌ Your application was not accepted. Please contact your branch or agency for next steps.' :
               '⏳ Your application has been submitted and is under review by the admin team.'}
            </div>
          )}
          <ApplicationFormBody
            app={myApp} template={template ?? null}
            onSaved={updateApp} onSubmitted={updateApp}
            onDocUploaded={handleDocUploaded} onDocDeleted={handleDocDeleted}
          />
        </div>
      ) : (
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl">🌏</div>
              <h2 className="text-xl font-black text-white mb-1">Start Your Application</h2>
              <p className="text-green-100 text-sm">Choose your destination country and fill in your personal details</p>
            </div>
            <ApplicationStarter
              role="student"
              studentName={user.name}
              studentEmail={user.email}
              onCreated={handleCreated}
              queryKey="student-application"
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}