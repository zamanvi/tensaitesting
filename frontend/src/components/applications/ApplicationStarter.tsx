'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Application, FormTemplateData, isFieldVisible, colSpan, inp, lbl, EDU_LABELS } from './ApplicationFormShared';

interface ListTemplate { id: number; name: string; country: string; visa_type?: string; }

interface Props {
  role?: string;
  onCreated: (app: Application) => void;
  onCancel?: () => void;
  queryKey: string;
}

export default function ApplicationStarter({ onCreated, onCancel, queryKey }: Props) {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [studentInfo, setStudentInfo] = useState({ student_name: '', student_email: '', student_phone: '', whatsapp_no: '', permanent_address: '' });
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [openEdu, setOpenEdu] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState('');

  function set(k: string, v: string) { setFormData(p => ({ ...p, [k]: v })); }
  function si(k: keyof typeof studentInfo, v: string) { setStudentInfo(p => ({ ...p, [k]: v })); }

  const { data: templates = [], isLoading: loadingTemplates, isError: templatesError } = useQuery<ListTemplate[]>({
    queryKey: ['form-templates-list'],
    queryFn: () => api.get('/form-templates').then(r => r.data),
    staleTime: 60_000,
  });

  const { data: template, isLoading: loadingTemplate } = useQuery<FormTemplateData | null>({
    queryKey: ['starter-template', selectedId],
    queryFn: () => api.get(`/form-templates/${selectedId}`).then(r => r.data),
    enabled: !!selectedId,
    staleTime: 300_000,
  });

  function validate() {
    if (!selectedId) { setErr('Please select a Country Form first.'); return false; }
    if (!studentInfo.student_name.trim()) { setErr('Full Name is required.'); return false; }
    if (!studentInfo.student_phone.trim()) { setErr('Contact Number is required.'); return false; }
    return true;
  }

  const createMut = useMutation({
    mutationFn: () => api.post('/applications', {
      form_template_id: selectedId,
      student_name:      studentInfo.student_name      || null,
      student_email:     studentInfo.student_email.trim() || null,
      student_phone:     studentInfo.student_phone     || null,
      whatsapp_no:       studentInfo.whatsapp_no       || null,
      permanent_address: studentInfo.permanent_address || null,
      form_data:         formData,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      const app = res.data?.application ?? res.data;
      if (app?.id) {
        onCreated(app);
      } else {
        setErr('Application created but no ID returned. Please refresh and try again.');
      }
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string } } };
      setErr(ax.response?.data?.message ?? 'Failed to create — please try again.');
    },
  });

  const visibleEdu = (template?.educations ?? []).filter(e => e.requirement !== 'none');

  return (
    <div className="px-4 sm:px-6 py-5 space-y-4">

      {/* ── Country / Program selector ── */}
      <div className="bg-green-50/50 border border-green-100 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-green-100 bg-green-100/50">
          <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
          <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold text-slate-800">Country &amp; Program</span>
        </div>
        <div className="px-5 py-4">
          <label className={lbl}>Select Destination <span className="text-rose-400">*</span></label>
          {templatesError ? (
            <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mt-1">
              <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs font-semibold text-rose-700">Could not load country forms — check your connection and refresh.</p>
            </div>
          ) : !loadingTemplates && templates.length === 0 ? (
            <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-1">
              <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-semibold text-amber-700">No country forms available yet. Please contact your administrator.</p>
            </div>
          ) : (
            <select
              className={inp}
              value={selectedId ?? ''}
              disabled={loadingTemplates}
              onChange={e => { const v = Number(e.target.value); setSelectedId(v || null); setErr(''); }}
            >
              <option value="">Select country / visa type…</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.country} — {t.name}{t.visa_type ? ` (${t.visa_type})` : ''}
                </option>
              ))}
            </select>
          )}
          <p className="text-xs text-slate-400 mt-2">After saving, you can fill in all remaining fields on the edit page.</p>
        </div>
      </div>

      {/* ── Loading skeleton ── */}
      {selectedId && loadingTemplate && (
        <div className="space-y-3 animate-pulse">
          {[1, 2].map(i => <div key={i} className="bg-slate-100 rounded-xl h-20" />)}
          <div className="flex items-center gap-2 text-xs text-slate-400 justify-center py-2">
            <span className="w-3.5 h-3.5 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
            Loading form…
          </div>
        </div>
      )}

      {/* ── Personal Information ── */}
      {template && !loadingTemplate && (
        <div className="bg-green-50/50 border border-green-100 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-green-100 bg-green-100/50">
            <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
            <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-semibold text-slate-800">Personal Information</span>
          </div>
          <div className="px-5 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Full Name <span className="text-rose-400">*</span></label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </span>
                  <input className={`${inp} pl-10`} placeholder="Student full name" aria-required="true"
                    value={studentInfo.student_name} onChange={e => si('student_name', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={lbl}>Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </span>
                  <input className={`${inp} pl-10`} type="email" placeholder="email@example.com"
                    value={studentInfo.student_email} onChange={e => si('student_email', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={lbl}>Contact Number <span className="text-rose-400">*</span></label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </span>
                  <input className={`${inp} pl-10`} type="tel" placeholder="+880..." aria-required="true"
                    value={studentInfo.student_phone} onChange={e => si('student_phone', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={lbl}>WhatsApp Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </span>
                  <input className={`${inp} pl-10`} type="tel" placeholder="+880..."
                    value={studentInfo.whatsapp_no} onChange={e => si('whatsapp_no', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={lbl}>Date of Birth</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </span>
                  <input className={`${inp} pl-10`} type="date"
                    value={formData.birth_date ?? ''} onChange={e => set('birth_date', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={lbl}>Passport Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                  </span>
                  <input className={`${inp} pl-10`} placeholder="e.g. AB1234567"
                    value={formData.passport_no ?? ''} onChange={e => set('passport_no', e.target.value)} />
                </div>
              </div>
              {template.intake_options?.length > 0 && (
                <div>
                  <label className={lbl}>Select Intake</label>
                  <select className={inp} value={formData.intake ?? ''} onChange={e => set('intake', e.target.value)}>
                    <option value="">Choose intake…</option>
                    {(template.intake_options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              )}
              <div className="sm:col-span-2">
                <label className={lbl}>Permanent Address</label>
                <textarea className={`${inp} resize-none`} rows={2} placeholder="House, Road, Area, City, Postcode"
                  value={studentInfo.permanent_address} onChange={e => si('permanent_address', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Dynamic template groups ── */}
      {template && !loadingTemplate && template.groups.filter(g => g.label !== 'Application Form Info').filter(g =>
        g.boxes.some(b => b.fields.some(f => isFieldVisible(f, formData) && f.field_type !== 'file'))
      ).map(group => (
        <div key={group.id} className="bg-green-50/50 border border-green-100 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-green-100 bg-green-100/50">
            <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
            <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-semibold text-slate-800">{group.label}</span>
            {group.hint && <span className="text-xs text-slate-400 hidden sm:inline">{group.hint}</span>}
          </div>
          <div className="px-5 py-5 space-y-4">
            {group.boxes.map(box => {
              const visible = box.fields.filter(f => isFieldVisible(f, formData) && f.field_type !== 'file');
              if (visible.length === 0) return null;
              return (
                <div key={box.id}>
                  {box.name && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{box.name}</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {visible.map(field => (
                      <div key={field.field_key} className={colSpan(field.box_size)}>
                        <label className={lbl}>
                          {field.label}{field.is_required && <span className="text-rose-400 ml-0.5">*</span>}
                        </label>
                        {field.field_type === 'select' ? (
                          <select className={inp} value={formData[field.field_key] ?? ''} onChange={e => set(field.field_key, e.target.value)}>
                            <option value="">{field.placeholder || 'Select…'}</option>
                            {(field.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : field.field_type === 'textarea' ? (
                          <textarea className={`${inp} resize-none`} rows={3} value={formData[field.field_key] ?? ''}
                            placeholder={field.placeholder ?? ''} onChange={e => set(field.field_key, e.target.value)} />
                        ) : (
                          <input className={inp}
                            type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : field.field_type === 'email' ? 'email' : field.field_type === 'tel' ? 'tel' : 'text'}
                            value={formData[field.field_key] ?? ''} placeholder={field.placeholder ?? ''}
                            onChange={e => set(field.field_key, e.target.value)} />
                        )}
                        {field.helper_text && <p className="text-xs text-slate-400 mt-1">{field.helper_text}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── Education Certificates ── */}
      {template && !loadingTemplate && visibleEdu.length > 0 && (
        <div className="bg-green-50/50 border border-green-100 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-green-100 bg-green-100/50">
            <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
            <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
            <span className="text-sm font-semibold text-slate-800">Education Certificates</span>
          </div>
          <div className="px-5 py-4 space-y-3">
            {visibleEdu.map((edu, i) => {
              const label     = EDU_LABELS[edu.level] ?? edu.level;
              const mandatory = edu.requirement === 'mandatory';
              const isOpen    = openEdu[edu.level] ?? (i === 0);
              const docKey    = `edu_${edu.level}`;
              return (
                <div key={edu.level} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenEdu(p => ({ ...p, [edu.level]: !(p[edu.level] ?? (i === 0)) }))}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-green-500/40"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium text-slate-800">{label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mandatory ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                        {mandatory ? 'Required' : 'Optional'}
                      </span>
                    </div>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-100">
                      <div className="px-4 pt-4 pb-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className={lbl}>Institution / Board</label>
                          <input className={inp} placeholder="e.g. Dhaka Education Board"
                            value={formData[`${docKey}_institution`] ?? ''} onChange={e => set(`${docKey}_institution`, e.target.value)} />
                        </div>
                        <div>
                          <label className={lbl}>GPA / Grade</label>
                          <input className={inp} placeholder="e.g. 5.00 / A+"
                            value={formData[`${docKey}_gpa`] ?? ''} onChange={e => set(`${docKey}_gpa`, e.target.value)} />
                        </div>
                        <div>
                          <label className={lbl}>Passing Year</label>
                          <input className={inp} placeholder="e.g. 2022"
                            value={formData[`${docKey}_year`] ?? ''} onChange={e => set(`${docKey}_year`, e.target.value)} />
                        </div>
                      </div>
                      <div className="px-4 pb-4">
                        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <p className="text-xs text-slate-500">
                            <span className="font-semibold">Certificate uploads</span> are available after saving the application.
                            {mandatory && <span className="text-rose-600 font-semibold ml-1">This document is required before submitting.</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Action bar ── */}
      {template && !loadingTemplate && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-100">
          {err
            ? <p aria-live="assertive" className="text-xs text-rose-500 font-semibold flex items-center gap-1">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {err}
              </p>
            : <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                After saving, you can fill in all remaining fields.
              </p>
          }
          <div className="flex items-center gap-2.5">
            {onCancel && (
              <button type="button" onClick={onCancel}
                className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400/40">
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={() => { if (validate()) createMut.mutate(); }}
              disabled={createMut.isPending}
              className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/60"
            >
              {createMut.isPending
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
              {createMut.isPending ? 'Creating…' : 'Create Application'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
