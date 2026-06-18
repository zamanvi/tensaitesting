'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Application, AppDoc, FormTemplateData,
  ProgressBar,
} from '@/components/applications/ApplicationFormShared';
import ApplicationFormBody from '@/components/applications/ApplicationFormBody';

const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 bg-white transition-all placeholder:text-slate-300';
const lbl = 'block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide';

const EMPTY = { templateId: '' };

export default function StudentApplicationPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const qc       = useQueryClient();

  const isStudent = user?.gateway_type === 'student';
  useEffect(() => {
    if (user && !isStudent) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isStudent, router]);

  const [showCreate,  setShowCreate]  = useState(false);
  const [createForm,  setCreateForm]  = useState(EMPTY);
  const [createErr,   setCreateErr]   = useState('');

  // Students have at most 1 application
  const { data: appsData, isLoading } = useQuery<{ data: Application[] }>({
    queryKey: ['student-application'],
    queryFn: () => api.get('/applications').then(r => r.data),
    enabled: !!isStudent,
  });
  const apps = appsData?.data ?? [];
  const myApp = apps[0] ?? null;

  const { data: template } = useQuery<FormTemplateData | null>({
    queryKey: ['form-template', myApp?.form_template?.country],
    queryFn: () => myApp?.form_template?.country
      ? api.get(`/form-templates/${encodeURIComponent(myApp.form_template!.country)}`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!myApp?.form_template?.country,
    staleTime: 300_000,
  });

  const { data: templates = [] } = useQuery<{ id: number; name: string; country: string }[]>({
    queryKey: ['form-templates-list'],
    queryFn: () => api.get('/form-templates').then(r => r.data),
    enabled: !!isStudent && !myApp,
  });

  const createMut = useMutation({
    mutationFn: () => api.post('/applications', {
      form_template_id: parseInt(createForm.templateId),
      student_name:     user?.name ?? 'Student',
      student_email:    user?.email ?? undefined,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['student-application'] });
      setShowCreate(false);
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string } } };
      setCreateErr(ax.response?.data?.message ?? 'Failed.');
    },
  });

  function updateApp(updated: Application) {
    qc.setQueryData(['student-application'], (old: { data: Application[] } | undefined) => ({
      ...old,
      data: (old?.data ?? []).map(a => a.id === updated.id ? { ...a, ...updated } : a),
    }));
  }

  function handleDocUploaded(doc: AppDoc, progress: number) {
    qc.setQueryData(['student-application'], (old: { data: Application[] } | undefined) => ({
      ...old,
      data: (old?.data ?? []).map(a =>
        a.id === myApp?.id
          ? { ...a, progress, documents: [...a.documents.filter(d => d.doc_type !== doc.doc_type), doc] }
          : a
      ),
    }));
  }

  function handleDocDeleted(docId: number, progress: number) {
    qc.setQueryData(['student-application'], (old: { data: Application[] } | undefined) => ({
      ...old,
      data: (old?.data ?? []).map(a =>
        a.id === myApp?.id
          ? { ...a, progress, documents: a.documents.filter(d => d.id !== docId) }
          : a
      ),
    }));
  }

  if (!user || !isStudent) return null;

  return (
    <DashboardLayout title="My Application">

      {isLoading ? (
        <div className="py-20 text-center"><span className="w-8 h-8 border-3 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" /></div>
      ) : myApp ? (
        /* ── Has application: show form ── */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Status banner if submitted */}
          {myApp.status !== 'draft' && (
            <div className={`px-6 py-3 text-sm font-semibold flex items-center gap-2 ${myApp.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-b border-emerald-100' : myApp.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-b border-rose-100' : 'bg-amber-50 text-amber-700 border-b border-amber-100'}`}>
              {myApp.status === 'accepted' ? '✅ Your application was accepted!' :
               myApp.status === 'rejected' ? '❌ Your application was rejected. Contact support.' :
               '⏳ Your application is under review.'}
            </div>
          )}
          <ApplicationFormBody
            app={myApp}
            template={template ?? null}
            onSaved={updateApp}
            onSubmitted={updateApp}
            onDocUploaded={handleDocUploaded}
            onDocDeleted={handleDocDeleted}
          />
        </div>
      ) : (
        /* ── No application yet: create ── */
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl">🌏</div>
              <h2 className="text-xl font-black text-white mb-1">Start Your Application</h2>
              <p className="text-green-100 text-sm">Fill in your study abroad application form</p>
            </div>

            <div className="p-6">
              {createErr && <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600">⚠️ {createErr}</div>}

              <div className="mb-5">
                <label className={lbl}>Select Country / Program *</label>
                <select className={inp} value={createForm.templateId}
                  onChange={e => setCreateForm(p => ({ ...p, templateId: e.target.value }))}>
                  <option value="">Choose your destination…</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.country} — {t.name}</option>)}
                </select>
              </div>

              <button onClick={() => createMut.mutate()}
                disabled={createMut.isPending || !createForm.templateId}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2 text-sm">
                {createMut.isPending && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                🚀 Start Application
              </button>

              <p className="text-center text-xs text-slate-400 mt-4">
                You can save your progress and come back anytime before submitting.
              </p>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}