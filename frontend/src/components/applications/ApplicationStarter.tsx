'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Application, inp, lbl } from './ApplicationFormShared';

interface ListTemplate { id: number; name: string; country: string; visa_type?: string; }

interface Props {
  role: 'branch' | 'agency' | 'admin' | 'student';
  studentName?: string;
  studentEmail?: string;
  onCreated: (app: Application) => void;
  queryKey: string;
}

export default function ApplicationStarter({ role, studentName, onCreated, queryKey }: Props) {
  const qc = useQueryClient();

  const { data: templates = [], isLoading } = useQuery<ListTemplate[]>({
    queryKey: ['form-templates-list'],
    queryFn: () => api.get('/form-templates').then(r => r.data),
    staleTime: 60_000,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name,       setName]       = useState(studentName ?? '');
  const [err,        setErr]        = useState('');

  const needStudent = role !== 'student';
  const canCreate   = !!selectedId && (needStudent ? !!name.trim() : true);

  const createMut = useMutation({
    mutationFn: () => api.post('/applications', {
      form_template_id: selectedId,
      student_name:     needStudent ? name.trim() : (studentName ?? ''),
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      onCreated(res.data.application);
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = ax.response?.data?.errors;
      setErr(errs ? Object.values(errs).flat().join(' ') : ax.response?.data?.message ?? 'Failed.');
    },
  });

  if (isLoading) return (
    <div className="py-10 text-center">
      <span className="w-5 h-5 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" />
    </div>
  );

  if (templates.length === 0) return (
    <div className="py-10 text-center px-6">
      <p className="text-sm text-slate-500">No published forms yet. Ask admin to publish a form first.</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {err && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600">⚠️ {err}</div>
      )}

      {/* Country Form — same as admin */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className={lbl}>
              Country Form <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedId ?? ''}
              onChange={e => setSelectedId(e.target.value ? Number(e.target.value) : null)}
              className={inp + ' cursor-pointer'}>
              <option value="">Select country / visa type...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.country} — {t.name}{t.visa_type ? ` (${t.visa_type})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Branch/Agency need student name */}
          {needStudent && (
            <div>
              <label className={lbl}>
                Student Name <span className="text-red-500">*</span>
              </label>
              <input
                className={inp}
                placeholder="e.g. Ahmed Rahman"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Action bar — same as admin */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm">
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <span className="text-slate-400">ℹ️</span>
          After saving, you can fill in all remaining fields on the edit page.
        </p>
        <button
          onClick={() => createMut.mutate()}
          disabled={createMut.isPending || !canCreate}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-lg disabled:opacity-40 transition-all shadow-sm">
          {createMut.isPending
            ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating…</>
            : <>✓ Create Application</>}
        </button>
      </div>
    </div>
  );
}
