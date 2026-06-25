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

export default function ApplicationStarter({ role, studentName, studentEmail, onCreated, onCancel, queryKey }: Props) {
  const qc = useQueryClient();

  const { data: templates = [], isLoading } = useQuery<ListTemplate[]>({
    queryKey: ['form-templates-list'],
    queryFn: () => api.get('/form-templates').then(r => r.data),
    staleTime: 60_000,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name,       setName]       = useState(studentName ?? '');
  const [email,      setEmail]      = useState(studentEmail ?? '');
  const [phone,      setPhone]      = useState('');
  const [whatsapp,   setWhatsapp]   = useState('');
  const [dob,        setDob]        = useState('');
  const [passport,   setPassport]   = useState('');
  const [err,        setErr]        = useState('');

  const needStudent = role !== 'student';
  const canCreate   = !!selectedId && (needStudent ? !!name.trim() : true);

  const createMut = useMutation({
    mutationFn: () => api.post('/applications', {
      form_template_id: selectedId,
      student_name:     needStudent ? name.trim() : (studentName ?? ''),
      student_email:    email.trim()    || undefined,
      student_phone:    phone.trim()    || undefined,
      whatsapp_no:      whatsapp.trim() || undefined,
      form_data: {
        ...(dob      ? { birth_date: dob }      : {}),
        ...(passport ? { passport_no: passport } : {}),
      },
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
    <div className="divide-y divide-slate-100">
      {err && <div className="px-5 sm:px-8 pt-5 pb-0"><div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600">⚠️ {err}</div></div>}

      {/* ── Country Form ── */}
      <div className="px-5 sm:px-8 py-5 sm:py-6">
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

      {/* ── Personal Information (shows after template selected) ── */}
      {selectedId && (
        <div className="px-5 sm:px-8 py-5 sm:py-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-semibold text-slate-700">Personal Information</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {needStudent && (
              <div className="sm:col-span-2">
                <label className={lbl}>Full Name <span className="text-red-500">*</span></label>
                <input className={inp} placeholder="e.g. Ahmed Rahman" value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}
            {needStudent && (
              <div>
                <label className={lbl}>Email Address</label>
                <input className={inp} type="email" placeholder="student@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            )}
            <div>
              <label className={lbl}>Contact Number <span className="text-red-500">*</span></label>
              <input className={inp} type="tel" placeholder="+880 1XXX XXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <label className={lbl}>WhatsApp Number</label>
              <input className={inp} type="tel" placeholder="+880 1XXX XXXXXX" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Date of Birth</label>
              <input className={inp} type="date" value={dob} onChange={e => setDob(e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Passport Number</label>
              <input className={inp} placeholder="e.g. AB1234567" value={passport} onChange={e => setPassport(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Action bar ── */}
      <div className="px-5 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          After saving, you can fill in all remaining fields on the edit page.
        </p>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onCancel && (
            <button onClick={onCancel}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all">
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
