'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Application, FormTemplateData, isFieldVisible, colSpan } from './ApplicationFormShared';

interface ListTemplate { id: number; name: string; country: string; visa_type?: string; }

interface Props {
  role?: string;
  studentName?: string;
  studentEmail?: string;
  onCreated: (app: Application) => void;
  onCancel?: () => void;
  queryKey: string;
}

// Admin-exact input/label styles (matches Filament v3 default)
const fi = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all';
const fl = 'block text-sm font-medium text-gray-700 mb-1';

const EDU_LABELS: Record<string, string> = {
  ssc: 'SSC / O-Level', hsc: 'HSC / A-Level', diploma: 'Diploma',
  bachelors: "Bachelor's Degree", masters: "Master's Degree",
  phd: 'PhD / Doctorate', other: 'Other',
};

export default function ApplicationStarter({ onCreated, onCancel, queryKey }: Props) {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [studentInfo, setStudentInfo] = useState({ student_name: '', student_email: '', student_phone: '', whatsapp_no: '', permanent_address: '' });
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [openEdu, setOpenEdu] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState('');

  function set(k: string, v: string) { setFormData(p => ({ ...p, [k]: v })); }
  function si(k: keyof typeof studentInfo, v: string) { setStudentInfo(p => ({ ...p, [k]: v })); }

  const { data: templates = [], isLoading: loadingTemplates } = useQuery<ListTemplate[]>({
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
    if (!studentInfo.student_name.trim()) { setErr('Full Name is required.'); return false; }
    if (!studentInfo.student_phone.trim()) { setErr('Contact Number is required.'); return false; }
    return true;
  }

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
    onError: () => setErr('Failed to create. Please try again.'),
  });

  const visibleEdu = (template?.educations ?? []).filter(e => e.requirement !== 'none');

  return (
    <div className="p-6 space-y-5 bg-white">

      {/* ── Country Form card ── */}
      <div className="bg-[#f0fdf4] border border-green-100 rounded-xl overflow-hidden">
        <div className="px-6 py-4">
          <label className={fl}>Country Form <span className="text-red-500">*</span></label>
          <select
            className={fi}
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
          <p className="text-xs text-green-700/60 mt-2">After saving, you can fill in all remaining fields on the edit page.</p>
        </div>
      </div>

      {/* ── Loading ── */}
      {selectedId && loadingTemplate && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
          <span className="w-4 h-4 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin" />
          Loading form…
        </div>
      )}

      {/* ── Personal Information card ── */}
      {template && (
        <div className="bg-[#f0fdf4] border border-green-100 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-green-100">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">Personal Information</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className={fl}>Full Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </span>
                  <input className={`${fi} pl-10`} placeholder="Student full name"
                    value={studentInfo.student_name} onChange={e => si('student_name', e.target.value)} />
                </div>
              </div>
              {/* Email */}
              <div>
                <label className={fl}>Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </span>
                  <input className={`${fi} pl-10`} type="email" placeholder="email@example.com"
                    value={studentInfo.student_email} onChange={e => si('student_email', e.target.value)} />
                </div>
              </div>
              {/* Contact */}
              <div>
                <label className={fl}>Contact Number <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </span>
                  <input className={`${fi} pl-10`} type="tel" placeholder="+880..."
                    value={studentInfo.student_phone} onChange={e => si('student_phone', e.target.value)} />
                </div>
              </div>
              {/* WhatsApp */}
              <div>
                <label className={fl}>WhatsApp Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </span>
                  <input className={`${fi} pl-10`} type="tel" placeholder="+880..."
                    value={studentInfo.whatsapp_no} onChange={e => si('whatsapp_no', e.target.value)} />
                </div>
              </div>
              {/* DOB */}
              <div>
                <label className={fl}>Date of Birth</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </span>
                  <input className={`${fi} pl-10`} type="date"
                    value={formData.birth_date ?? ''} onChange={e => set('birth_date', e.target.value)} />
                </div>
              </div>
              {/* Passport */}
              <div>
                <label className={fl}>Passport Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                  </span>
                  <input className={`${fi} pl-10`} placeholder="e.g. AB1234567"
                    value={formData.passport_no ?? ''} onChange={e => set('passport_no', e.target.value)} />
                </div>
              </div>
              {/* Intake */}
              {template.intake_options?.length > 0 && (
                <div>
                  <label className={fl}>Select Intake</label>
                  <select className={fi} value={formData.intake ?? ''} onChange={e => set('intake', e.target.value)}>
                    <option value="">Choose intake…</option>
                    {template.intake_options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              )}
              {/* Permanent Address */}
              <div className="sm:col-span-2">
                <label className={fl}>Permanent Address</label>
                <textarea className={`${fi} resize-none`} rows={2} placeholder="House, Road, Area, City, Postcode"
                  value={studentInfo.permanent_address} onChange={e => si('permanent_address', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Dynamic template groups ── */}
      {template && template.groups.filter(g => g.label !== 'Application Form Info').filter(g =>
        g.boxes.some(b => b.fields.some(f => isFieldVisible(f, formData) && f.field_type !== 'file'))
      ).map(group => (
        <div key={group.id} className="bg-[#f0fdf4] border border-green-100 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-green-100">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">{group.label}</span>
            {group.hint && <span className="text-xs text-gray-400">{group.hint}</span>}
          </div>
          <div className="p-6 space-y-4">
            {group.boxes.map(box => {
              const visible = box.fields.filter(f => isFieldVisible(f, formData) && f.field_type !== 'file');
              if (visible.length === 0) return null;
              return (
                <div key={box.id}>
                  {box.name && <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{box.name}</p>}
                  <div className="grid grid-cols-6 gap-4">
                    {visible.map(field => (
                      <div key={field.field_key} className={colSpan(field.box_size)}>
                        <label className={fl}>
                          {field.label}{field.is_required && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        {field.field_type === 'select' ? (
                          <select className={fi} value={formData[field.field_key] ?? ''} onChange={e => set(field.field_key, e.target.value)}>
                            <option value="">{field.placeholder || 'Select…'}</option>
                            {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : field.field_type === 'textarea' ? (
                          <textarea className={`${fi} resize-none`} rows={3} value={formData[field.field_key] ?? ''}
                            placeholder={field.placeholder ?? ''} onChange={e => set(field.field_key, e.target.value)} />
                        ) : (
                          <input className={fi}
                            type={
                              field.field_type === 'number' ? 'number' :
                              field.field_type === 'date'   ? 'date' :
                              field.field_type === 'email'  ? 'email' :
                              field.field_type === 'tel'    ? 'tel' :
                              'text'
                            }
                            value={formData[field.field_key] ?? ''} placeholder={field.placeholder ?? ''}
                            onChange={e => set(field.field_key, e.target.value)} />
                        )}
                        {field.helper_text && <p className="text-xs text-gray-400 mt-1">{field.helper_text}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── Education Certificates card ── */}
      {template && visibleEdu.length > 0 && (
        <div className="bg-[#f0fdf4] border border-green-100 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-green-100">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">Education Certificates</span>
          </div>
          <div className="p-6 space-y-3">
            {visibleEdu.map((edu, i) => {
              const label = EDU_LABELS[edu.level] ?? edu.level;
              const badge = edu.requirement === 'mandatory' ? 'Mandatory' : 'Optional';
              const badgeColor = edu.requirement === 'mandatory' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500';
              const isOpen = openEdu[edu.level] ?? (i === 0);
              return (
                <div key={edu.level} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button type="button" onClick={() => setOpenEdu(p => ({ ...p, [edu.level]: !p[edu.level] }))}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                      <span className="text-sm font-medium text-gray-800">{label}</span>
                    </div>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="border-t border-gray-100">
                      {/* 3 text fields — same layout as admin */}
                      <div className="px-4 pt-4 pb-3 grid grid-cols-3 gap-3">
                        <div>
                          <label className={fl}>Institution / Board</label>
                          <input className={fi} placeholder="e.g. Dhaka Board"
                            value={formData[`edu_${i}_institution`] ?? ''} onChange={e => set(`edu_${i}_institution`, e.target.value)} />
                        </div>
                        <div>
                          <label className={fl}>GPA / Grade</label>
                          <input className={fi} placeholder="e.g. 5.00"
                            value={formData[`edu_${i}_gpa`] ?? ''} onChange={e => set(`edu_${i}_gpa`, e.target.value)} />
                        </div>
                        <div>
                          <label className={fl}>Passing Year</label>
                          <input className={fi} placeholder="e.g. 2020"
                            value={formData[`edu_${i}_year`] ?? ''} onChange={e => set(`edu_${i}_year`, e.target.value)} />
                        </div>
                      </div>
                      {/* Certificate upload placeholder — matches admin layout, enabled after save */}
                      <div className="px-4 pb-4">
                        <label className={`${fl} flex items-center gap-1.5`}>
                          Certificate / Transcript
                          {edu.requirement === 'mandatory' && (
                            <span className="text-red-500 text-xs font-normal">— Must be uploaded before submitting</span>
                          )}
                        </label>
                        <div className="flex items-center gap-2 w-full px-4 py-3 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-400 text-sm">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                          </svg>
                          Upload available after saving — click Save &amp; Continue below
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

      {/* ── Error ── */}
      {err && <p className="text-sm text-red-500">{err}</p>}

      {/* ── Action bar ── */}
      {template && (
        <div className="flex items-center justify-between pt-2">
          {onCancel && (
            <button type="button" onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          )}
          <button type="button" onClick={() => { if (validate()) createMut.mutate(); }} disabled={createMut.isPending}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors shadow-sm">
            {createMut.isPending
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            Save & Continue
          </button>
        </div>
      )}
    </div>
  );
}
