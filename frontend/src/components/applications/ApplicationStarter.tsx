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
  onCancel?: () => void;
  queryKey: string;
}

export default function ApplicationStarter({ role, studentName, onCreated, onCancel, queryKey }: Props) {
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
      <p className="text-sm text-slate-500">No published forms yet.</p>
    </div>
  );

  return (
    <div className="p-5 sm:p-8 space-y-4">
      {err && <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600">⚠️ {err}</div>}

      {/* Country Form */}
      <div>
        <label className={lbl}>Country Form <span className="text-red-500">*</span></label>
        <select
          value={selectedId ?? ''}
          onChange={e => setSelectedId(e.target.value ? Number(e.target.value) : null)}
          className={inp + ' cursor-pointer mt-1'}>
          <option value="">Select country / visa type…</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>
              {t.country} — {t.name}{t.visa_type ? ` (${t.visa_type})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Student Name (branch/agency/admin only) */}
      {needStudent && (
        <div>
          <label className={lbl}>Student Name <span className="text-red-500">*</span></label>
          <input
            className={inp}
            placeholder="e.g. Ahmed Rahman"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
      )}

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          After saving, you can fill in all remaining fields on the edit page.
        </p>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onCancel && (
            <button onClick={onCancel}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all">
              Cancel
            </button>
          )}
          <button
            onClick={() => createMut.mutate()}
            disabled={createMut.isPending || !canCreate}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-lg disabled:opacity-40 transition-all">
            {createMut.isPending
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating…</>
              : '✓ Create Application'}
          </button>
        </div>
      </div>
    </div>
  );
}
