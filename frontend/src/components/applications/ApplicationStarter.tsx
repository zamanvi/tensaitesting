'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Application, inp, lbl } from './ApplicationFormShared';

interface ListTemplate { id: number; name: string; country: string; visa_type?: string; }

interface Props {
  role?: string;
  studentName?: string;
  studentEmail?: string;
  onCreated: (app: Application) => void;
  onCancel?: () => void;
  queryKey: string;
}

export default function ApplicationStarter({ onCreated, onCancel, queryKey }: Props) {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [err, setErr] = useState('');

  const { data: templates = [], isLoading: loadingTemplates } = useQuery<ListTemplate[]>({
    queryKey: ['form-templates-list'],
    queryFn: () => api.get('/form-templates').then(r => r.data),
    staleTime: 60_000,
  });

  const createMut = useMutation({
    mutationFn: (id: number) => api.post('/applications', { form_template_id: id }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      const app = res.data?.application ?? res.data;
      if (app?.id) onCreated(app);
    },
    onError: () => setErr('Failed to create application. Please try again.'),
  });

  function handleSelect(id: number) {
    setSelectedId(id);
    setErr('');
    createMut.mutate(id);
  }

  return (
    <div className="px-5 sm:px-8 py-6 space-y-4">
      <div>
        <label className={lbl}>Country Form <span className="text-red-500">*</span></label>
        <select
          className={inp}
          value={selectedId ?? ''}
          disabled={createMut.isPending || loadingTemplates}
          onChange={e => { const v = Number(e.target.value); if (v) handleSelect(v); }}
        >
          <option value="">Select country / visa type…</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>
              {t.country} — {t.name}{t.visa_type ? ` (${t.visa_type})` : ''}
            </option>
          ))}
        </select>
      </div>

      {createMut.isPending && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="w-4 h-4 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" />
          Opening form…
        </div>
      )}

      {err && <p className="text-sm text-rose-500">{err}</p>}

      {onCancel && (
        <button type="button" onClick={onCancel}
          className="text-sm text-slate-400 hover:text-slate-600">
          Cancel
        </button>
      )}
    </div>
  );
}
