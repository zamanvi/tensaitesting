'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Application, FormTemplateData, isFieldVisible, colSpan, inp, lbl, SectionHead } from './ApplicationFormShared';

interface ListTemplate { id: number; name: string; country: string; visa_type?: string; }

interface Props {
  role?: string;
  studentName?: string;
  onCreated: (app: Application) => void;
  onCancel?: () => void;
  queryKey: string;
}

export default function ApplicationStarter({ onCreated, onCancel, queryKey }: Props) {
  const qc = useQueryClient();

  const { data: templates = [], isLoading: loadingTemplates } = useQuery<ListTemplate[]>({
    queryKey: ['form-templates-list'],
    queryFn: () => api.get('/form-templates').then(r => r.data),
    staleTime: 60_000,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [studentInfo, setStudentInfo] = useState({
    student_name: '', student_email: '', student_phone: '',
    whatsapp_no: '', permanent_address: '',
  });
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [err, setErr]     = useState('');

  function set(key: string, val: string) {
    setFormData(p => ({ ...p, [key]: val }));
  }

  // Fetch template when selected
  const { data: template, isLoading: loadingTemplate } = useQuery<FormTemplateData | null>({
    queryKey: ['form-template', selectedId],
    queryFn: () => selectedId
      ? api.get(`/form-templates/${selectedId}`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!selectedId,
    staleTime: 300_000,
  });

  const createMut = useMutation({
    mutationFn: () => api.post('/applications', {
      form_template_id: selectedId,
      student_name:      studentInfo.student_name || null,
      student_email:     studentInfo.student_email || null,
      student_phone:     studentInfo.student_phone || null,
      whatsapp_no:       studentInfo.whatsapp_no   || null,
      permanent_address: studentInfo.permanent_address || null,
      form_data:         formData,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      const app = res.data?.application ?? res.data;
      if (app?.id) onCreated(app);
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = ax.response?.data?.errors;
      setErr(errs ? Object.values(errs).flat().join(' ') : ax.response?.data?.message ?? 'Failed.');
    },
  });

  if (loadingTemplates) return (
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
    <div>
      {err && (
        <div className="px-5 sm:px-8 pt-5">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600">⚠️ {err}</div>
        </div>
      )}

      {/* ── Country Form select ── */}
      <div className="px-5 sm:px-8 py-5 sm:py-6 bg-green-50/60 border-b border-slate-100">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Country Form <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1">
          <select
            value={selectedId ?? ''}
            onChange={e => {
              setSelectedId(e.target.value ? Number(e.target.value) : null);
              setFormData({});
            }}
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
            <button type="button" onClick={() => { setSelectedId(null); setFormData({}); }}
              className="absolute inset-y-0 right-8 flex items-center px-1 text-slate-400 hover:text-slate-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Template loading spinner ── */}
      {selectedId && loadingTemplate && (
        <div className="py-8 text-center">
          <span className="w-5 h-5 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" />
        </div>
      )}

      {/* ── Full form — shown when template loaded ── */}
      {template && (
        <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-10">

          {/* Student Information */}
          <section>
            <SectionHead n={1} title="Personal Information" subtitle="Fill in the student's contact details" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Full Name</label>
                <input className={inp} placeholder="e.g. Ahmed Rahman"
                  value={studentInfo.student_name}
                  onChange={e => setStudentInfo(p => ({ ...p, student_name: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}>Target Country</label>
                <input className={`${inp} bg-slate-50`} value={template.country} readOnly />
              </div>
              <div>
                <label className={lbl}>Email Address</label>
                <input className={inp} type="email" placeholder="e.g. ahmed@email.com"
                  value={studentInfo.student_email}
                  onChange={e => setStudentInfo(p => ({ ...p, student_email: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}>Contact Phone</label>
                <input className={inp} type="tel" placeholder="+880..."
                  value={studentInfo.student_phone}
                  onChange={e => setStudentInfo(p => ({ ...p, student_phone: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}>WhatsApp Number</label>
                <input className={inp} type="tel" placeholder="+880..."
                  value={studentInfo.whatsapp_no}
                  onChange={e => setStudentInfo(p => ({ ...p, whatsapp_no: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}>Date of Birth</label>
                <input className={inp} type="date"
                  value={formData.birth_date ?? ''}
                  onChange={e => set('birth_date', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Passport Number</label>
                <input className={inp} placeholder="e.g. AB1234567"
                  value={formData.passport_no ?? ''}
                  onChange={e => set('passport_no', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}>Permanent Address</label>
                <textarea className={`${inp} resize-none`} rows={2} placeholder="Full permanent address"
                  value={studentInfo.permanent_address}
                  onChange={e => setStudentInfo(p => ({ ...p, permanent_address: e.target.value }))} />
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Dynamic template groups */}
          {template.groups.map((group, gi) => (
            <div key={group.id}>
              <section>
                <SectionHead n={gi + 2} title={group.label} subtitle={group.hint} />
                <div className="space-y-6">
                  {group.boxes.map((box, bi) => {
                    const visibleFields = box.fields.filter(f =>
                      isFieldVisible(f, formData) && f.field_type !== 'file'
                    );
                    if (visibleFields.length === 0) return null;
                    return (
                      <div key={box.id} className={bi > 0 ? 'pt-4 border-t border-slate-100' : ''}>
                        {box.name && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{box.name}</p>}
                        <div className="grid grid-cols-6 gap-4">
                          {visibleFields.map(field => (
                            <div key={field.field_key} className={colSpan(field.box_size)}>
                              <label className={lbl}>
                                {field.label}{field.is_required && <span className="text-red-500 ml-0.5">*</span>}
                              </label>
                              {field.field_type === 'select' ? (
                                <select className={inp} value={formData[field.field_key] ?? ''}
                                  onChange={e => set(field.field_key, e.target.value)}>
                                  <option value="">{field.placeholder || 'Select…'}</option>
                                  {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : field.field_type === 'textarea' ? (
                                <textarea className={`${inp} resize-none`} rows={3}
                                  placeholder={field.placeholder}
                                  value={formData[field.field_key] ?? ''}
                                  onChange={e => set(field.field_key, e.target.value)} />
                              ) : (
                                <input className={inp}
                                  type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                                  placeholder={field.placeholder}
                                  value={formData[field.field_key] ?? ''}
                                  onChange={e => set(field.field_key, e.target.value)} />
                              )}
                              {field.helper_text && <p className="text-[11px] text-slate-400 mt-1">{field.helper_text}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
              <hr className="border-slate-100 mt-8" />
            </div>
          ))}

          {/* Intake picker */}
          {template.intake_options?.length > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-4">
              <p className="text-xs font-bold text-green-800 mb-3">📅 Select Intake — {template.country}</p>
              <div className="flex flex-wrap gap-2">
                {template.intake_options.map(opt => (
                  <button key={opt} type="button"
                    onClick={() => set('intake', opt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${formData.intake === opt ? 'bg-green-700 text-white border-green-700 shadow-sm' : 'bg-white border-green-200 text-green-700 hover:bg-green-100'}`}>
                    {opt}
                  </button>
                ))}
              </div>
              {formData.intake && <p className="text-[11px] text-green-700 font-semibold mt-2">✓ Selected: {formData.intake}</p>}
            </div>
          )}

          {/* Education note */}
          {template.educations?.some(e => e.requirement !== 'none') && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4">
              <p className="text-xs font-bold text-amber-800 mb-1">🎓 Education Documents</p>
              <p className="text-xs text-amber-700">After creating the application, you can upload education certificates on the next page.</p>
            </div>
          )}

        </div>
      )}

      {/* ── Action bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 sm:px-6 py-[18px] border-t border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-[12.5px] text-slate-500">
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {template ? 'Fill in details above, then create.' : 'Select a country form to begin.'}
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
            disabled={createMut.isPending || !selectedId || !template}
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
