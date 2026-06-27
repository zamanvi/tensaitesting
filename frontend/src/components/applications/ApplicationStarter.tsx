'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Application } from './ApplicationFormShared';

interface ListTemplate { id: number; name: string; country: string; visa_type?: string; }

interface Props {
  role: 'branch' | 'agency' | 'admin' | 'student';
  studentName?: string;
  studentEmail?: string;
  onCreated: (app: Application) => void;
  onCancel?: () => void;
  queryKey: string;
}

export default function ApplicationStarter({ onCreated, onCancel, queryKey }: Props) {
  const qc = useQueryClient();

  const { data: templates = [], isLoading } = useQuery<ListTemplate[]>({
    queryKey: ['form-templates-list'],
    queryFn: () => api.get('/form-templates').then(r => r.data),
    staleTime: 60_000,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [err,        setErr]        = useState('');

  const canCreate = !!selectedId;

  const createMut = useMutation({
    mutationFn: () => api.post('/applications', {
      form_template_id: selectedId,
      student_name: '',
    }),
    onSuccess: (res) => {
      console.log('[Starter] onSuccess:', res.data);
      qc.invalidateQueries({ queryKey: [queryKey] });
      const app = res.data?.application ?? res.data;
      console.log('[Starter] app:', app);
      if (app?.id) onCreated(app);
      else setErr('Created but response missing application id. Check console.');
    },
    onError: (e: unknown) => {
      console.error('[Starter] onError:', e);
      const ax = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = ax.response?.data?.errors;
      const msg = errs ? Object.values(errs).flat().join(' ') : ax.response?.data?.message ?? 'Failed.';
      setErr(msg);
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
    <div className="divide-y divide-slate-100">
      {err && <div className="px-5 sm:px-8 pt-5"><div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600">⚠️ {err}</div></div>}

      {/* Country Form — green tint card */}
      <div className="px-5 sm:px-8 py-5 sm:py-6 bg-green-50/60">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Country Form <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1">
          <select
            value={selectedId ?? ''}
            onChange={e => setSelectedId(e.target.value ? Number(e.target.value) : null)}
            className="w-full border border-slate-200 rounded-xl px-3 py-3 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 bg-white transition-all cursor-pointer appearance-none">
            <option value="">Select country / visa type…</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.country} — {t.name}{t.visa_type ? ` (${t.visa_type})` : ''}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {selectedId && (
            <button type="button" onClick={() => setSelectedId(null)}
              className="absolute inset-y-0 right-8 flex items-center px-1 text-slate-400 hover:text-slate-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>


      {/* Action bar — matches .cap-actions from blade */}
      <div className="mx-0 mt-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 sm:px-6 py-[18px] border-t border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-[12.5px] text-slate-500">
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          After saving, you can fill in all remaining fields on the edit page.
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5">
          {onCancel && (
            <button onClick={onCancel}
              className="px-[18px] py-[9px] rounded-[9px] border border-slate-200 bg-white text-[13.5px] font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all text-center">
              Cancel
            </button>
          )}
          <button
            onClick={() => createMut.mutate()}
            disabled={createMut.isPending || !canCreate}
            className="flex items-center justify-center gap-2 px-7 py-[10px] rounded-[9px] text-[14px] font-bold text-white disabled:opacity-40 transition-all"
            style={{ background: '#16a34a', boxShadow: '0 2px 8px rgba(22,163,74,.3)' }}>
            {createMut.isPending
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating…</>
              : <><svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg> Create Application</>}
          </button>
        </div>
      </div>
    </div>
  );
}
