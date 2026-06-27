'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Application, FormTemplateData, isFieldVisible, colSpan, inp, lbl, SectionHead } from './ApplicationFormShared';

interface ListTemplate { id: number; name: string; country: string; visa_type?: string; }

interface Props {
  role?: string;
  onCreated: (app: Application) => void;
  onCancel?: () => void;
  queryKey: string;
}

const EDU_LABELS: Record<string, string> = {
  ssc: 'SSC / O-Level', hsc: 'HSC / A-Level', diploma: 'Diploma',
  bachelors: "Bachelor's Degree", masters: "Master's Degree",
  phd: 'PhD / Doctorate', other: 'Other',
};

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
  const [openEdu, setOpenEdu] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState('');

  function set(key: string, val: string) { setFormData(p => ({ ...p, [key]: val })); }
  function si(k: keyof typeof studentInfo, v: string) { setStudentInfo(p => ({ ...p, [k]: v })); }

  const { data: template, isLoading: loadingTemplate } = useQuery<FormTemplateData | null>({
    queryKey: ['form-template', selectedId],
    queryFn: () => selectedId ? api.get(`/form-templates/${selectedId}`).then(r => r.data) : Promise.resolve(null),
    enabled: !!selectedId,
    staleTime: 300_000,
  });

  const createMut = useMutation({
    mutationFn: () => api.post('/applications', {
      form_template_id: selectedId,
      student_name:      studentInfo.student_name      || null,
      student_email:     studentInfo.student_email     || null,
      student_phone:     studentInfo.student_phone     || null,
      whatsapp_no:       studentInfo.whatsapp_no       || null,
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

  const eduList = template?.educations?.filter(e => e.requirement !== 'none') ?? [];

  return (
    <div>
      {err && (
        <div className="px-5 sm:px-8 pt-5">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600">⚠️ {err}</div>
        </div>
      )}

      {/* ── Country Form ── */}
      <div className="px-5 sm:px-8 py-5 bg-green-50/60 border-b border-slate-100">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Country Form <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={selectedId ?? ''}
            onChange={e => { setSelectedId(e.target.value ? Number(e.target.value) : null); setFormData({}); }}
            className="w-full border border-slate-200 rounded-xl px-3 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 bg-white appearance-none cursor-pointer">
            <option value="">Select country / visa type…</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.country} — {t.name}{t.visa_type ? ` (${t.visa_type})` : ''}</option>
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
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Loading ── */}
      {selectedId && loadingTemplate && (
        <div className="py-8 text-center border-b border-slate-100">
          <span className="w-5 h-5 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" />
        </div>
      )}

      {/* ── Full form after template loads ── */}
      {template && (
        <>
          {/* Personal Information */}
          <div className="border-b border-slate-100">
            <div className="px-5 sm:px-8 py-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Personal Information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className={lbl}>Full Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <input className={`${inp} pl-10`} placeholder="Student full name"
                      value={studentInfo.student_name} onChange={e => si('student_name', e.target.value)} />
                  </div>
                </div>
                {/* Email */}
                <div>
                  <label className={lbl}>Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input className={`${inp} pl-10`} type="email" placeholder="email@example.com"
                      value={studentInfo.student_email} onChange={e => si('student_email', e.target.value)} />
                  </div>
                </div>
                {/* Contact */}
                <div>
                  <label className={lbl}>Contact Number <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </span>
                    <input className={`${inp} pl-10`} type="tel" placeholder="+880..."
                      value={studentInfo.student_phone} onChange={e => si('student_phone', e.target.value)} />
                  </div>
                </div>
                {/* WhatsApp */}
                <div>
                  <label className={lbl}>WhatsApp Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 text-sm font-bold">W</span>
                    <input className={`${inp} pl-10`} type="tel" placeholder="+880..."
                      value={studentInfo.whatsapp_no} onChange={e => si('whatsapp_no', e.target.value)} />
                  </div>
                </div>
                {/* DOB */}
                <div>
                  <label className={lbl}>Date of Birth</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input className={`${inp} pl-10`} type="date"
                      value={formData.birth_date ?? ''} onChange={e => set('birth_date', e.target.value)} />
                  </div>
                </div>
                {/* Passport */}
                <div>
                  <label className={lbl}>Passport Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    </span>
                    <input className={`${inp} pl-10`} placeholder="e.g. AB1234567"
                      value={formData.passport_no ?? ''} onChange={e => set('passport_no', e.target.value)} />
                  </div>
                </div>

                {/* Intake */}
                {template.intake_options?.length > 0 && (
                  <div className="sm:col-span-2">
                    <label className={lbl}>Select Intake</label>
                    <select className={inp} value={formData.intake ?? ''} onChange={e => set('intake', e.target.value)}>
                      <option value="">Choose intake...</option>
                      {template.intake_options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                )}

                {/* Permanent Address */}
                <div className="sm:col-span-2">
                  <label className={lbl}>Permanent Address</label>
                  <textarea className={`${inp} resize-none`} rows={3} placeholder="House, Road, Area, City, Postcode"
                    value={studentInfo.permanent_address} onChange={e => si('permanent_address', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic template groups */}
          {template.groups.map((group) => (
            <div key={group.id} className="border-b border-slate-100 px-5 sm:px-8 py-5">
              <SectionHead title={group.label} subtitle={group.hint} />
              <div className="space-y-6 mt-4">
                {group.boxes.map((box, bi) => {
                  const visible = box.fields.filter(f => isFieldVisible(f, formData) && f.field_type !== 'file');
                  if (visible.length === 0) return null;
                  return (
                    <div key={box.id} className={bi > 0 ? 'pt-4 border-t border-slate-100' : ''}>
                      {box.name && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{box.name}</p>}
                      <div className="grid grid-cols-6 gap-4">
                        {visible.map(field => (
                          <div key={field.field_key} className={colSpan(field.box_size)}>
                            <label className={lbl}>{field.label}{field.is_required && <span className="text-red-500 ml-0.5">*</span>}</label>
                            {field.field_type === 'select' ? (
                              <select className={inp} value={formData[field.field_key] ?? ''} onChange={e => set(field.field_key, e.target.value)}>
                                <option value="">{field.placeholder || 'Select…'}</option>
                                {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : field.field_type === 'textarea' ? (
                              <textarea className={`${inp} resize-none`} rows={3} placeholder={field.placeholder}
                                value={formData[field.field_key] ?? ''} onChange={e => set(field.field_key, e.target.value)} />
                            ) : (
                              <input className={inp}
                                type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                                placeholder={field.placeholder} value={formData[field.field_key] ?? ''}
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
            </div>
          ))}

          {/* Education Certificates */}
          {eduList.length > 0 && (
            <div className="border-b border-slate-100 px-5 sm:px-8 py-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-sm">🎓</span>
                </div>
                <p className="text-sm font-bold text-slate-800">Education Certificates</p>
              </div>
              <div className="space-y-3">
                {eduList.map(edu => {
                  const label = EDU_LABELS[edu.level] ?? edu.level;
                  const mandatory = edu.requirement === 'mandatory';
                  const dk = `edu_${edu.level}`;
                  const open = !!openEdu[edu.level];
                  return (
                    <div key={edu.level} className="border border-slate-200 rounded-xl overflow-hidden">
                      <button type="button" onClick={() => setOpenEdu(p => ({ ...p, [edu.level]: !open }))}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mandatory ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                            {mandatory ? '🔴 Mandatory' : '📎 Optional'}
                          </span>
                          <span className="text-sm font-semibold text-slate-700">{label}</span>
                        </div>
                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {open && (
                        <div className="px-4 py-4 bg-white">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                            <div>
                              <label className={lbl}>Institution / Board</label>
                              <input className={inp} placeholder="e.g. Dhaka Education Board"
                                value={formData[`${dk}_institution`] ?? ''} onChange={e => set(`${dk}_institution`, e.target.value)} />
                            </div>
                            <div>
                              <label className={lbl}>GPA / Grade</label>
                              <input className={inp} placeholder="e.g. 5.00 / A+"
                                value={formData[`${dk}_gpa`] ?? ''} onChange={e => set(`${dk}_gpa`, e.target.value)} />
                            </div>
                            <div>
                              <label className={lbl}>Passing Year</label>
                              <input className={inp} placeholder="e.g. 2022"
                                value={formData[`${dk}_year`] ?? ''} onChange={e => set(`${dk}_year`, e.target.value)} />
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400">📎 Certificate upload available after creating the application.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Action bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 sm:px-6 py-[18px] bg-white">
        <p className="text-[12.5px] text-slate-500">
          {template ? 'Fill in the details above, then save.' : 'Select a country form to begin.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          {onCancel && (
            <button onClick={onCancel}
              className="px-[18px] py-[9px] rounded-[9px] border border-slate-200 bg-white text-[13.5px] font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all text-center">
              Cancel
            </button>
          )}
          <button onClick={() => createMut.mutate()}
            disabled={createMut.isPending || !selectedId || !template}
            className="flex items-center justify-center gap-2 px-7 py-[10px] rounded-[9px] text-[14px] font-bold text-white disabled:opacity-40 transition-all"
            style={{ background: '#16a34a', boxShadow: '0 2px 8px rgba(22,163,74,.3)' }}>
            {createMut.isPending
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
              : <><svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg> Save & Continue</>}
          </button>
        </div>
      </div>
    </div>
  );
}
