'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Application, FormTemplateData,
  DynamicField, isFieldVisible, colSpan,
  inp, lbl,
} from './ApplicationFormShared';

const FLAG: Record<string, string> = {
  japan: '🇯🇵', uk: '🇬🇧', usa: '🇺🇸', 'united states': '🇺🇸',
  canada: '🇨🇦', australia: '🇦🇺', germany: '🇩🇪', france: '🇫🇷',
  'south korea': '🇰🇷', korea: '🇰🇷', china: '🇨🇳', malaysia: '🇲🇾',
  singapore: '🇸🇬', 'new zealand': '🇳🇿', ireland: '🇮🇪',
  netherlands: '🇳🇱', sweden: '🇸🇪', bangladesh: '🇧🇩', india: '🇮🇳',
};

const EDU_LABELS: Record<string, string> = {
  ssc: 'SSC / O-Level', hsc: 'HSC / A-Level', diploma: 'Diploma',
  bachelors: "Bachelor's Degree", masters: "Master's Degree",
  phd: 'PhD / Doctorate', other: 'Other',
};

interface ListTemplate { id: number; name: string; country: string; visa_type?: string; }

interface Props {
  role: 'branch' | 'agency' | 'admin' | 'student';
  studentName?: string;
  studentEmail?: string;
  onCreated: (app: Application) => void;
  queryKey: string;
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

export default function ApplicationStarter({ role, studentName, studentEmail, onCreated, queryKey }: Props) {
  const qc = useQueryClient();

  const { data: templates = [], isLoading } = useQuery<ListTemplate[]>({
    queryKey: ['form-templates-list'],
    queryFn: () => api.get('/form-templates').then(r => r.data),
    staleTime: 60_000,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [intake,     setIntake]     = useState('');
  const [formData,   setFormData]   = useState<Record<string, string>>({});
  const [name,       setName]       = useState(studentName ?? '');
  const [email,      setEmail]      = useState(studentEmail ?? '');
  const [phone,      setPhone]      = useState('');
  const [whatsapp,   setWhatsapp]   = useState('');
  const [dob,        setDob]        = useState('');
  const [passport,   setPassport]   = useState('');
  const [address,    setAddress]    = useState('');
  const [err,        setErr]        = useState('');

  const { data: detail, isFetching: detailLoading } = useQuery<FormTemplateData>({
    queryKey: ['form-template-detail', selectedId],
    queryFn:  () => api.get(`/form-templates/${selectedId}`).then(r => r.data),
    enabled:  !!selectedId,
    staleTime: 300_000,
  });

  const selected    = templates.find(t => t.id === selectedId) ?? null;
  const needStudent = role !== 'student';
  const canCreate   = !!selectedId && (needStudent ? !!name.trim() : true);

  function setField(key: string, val: string) {
    setFormData(p => ({ ...p, [key]: val }));
  }

  const createMut = useMutation({
    mutationFn: () => api.post('/applications', {
      form_template_id:  selectedId,
      student_name:      needStudent ? name.trim() : (studentName ?? ''),
      student_email:     email.trim()    || undefined,
      student_phone:     phone.trim()    || undefined,
      whatsapp_no:       whatsapp.trim() || undefined,
      permanent_address: address.trim()  || undefined,
      form_data: {
        ...formData,
        ...(dob      ? { birth_date: dob }      : {}),
        ...(passport ? { passport_no: passport } : {}),
        ...(intake   ? { intake }                : {}),
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

  const intakeOptions = (detail?.intake_options ?? []) as string[];
  const educations    = (detail?.educations ?? []).filter(e => e.requirement !== 'none');

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {err && <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600">⚠️ {err}</div>}

      {/* ── Step 1: Select form (shown only when nothing selected) ── */}
      {!selectedId && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <label className={lbl}>Country Form <span className="text-red-500">*</span></label>
          <select
            value=""
            onChange={e => {
              if (e.target.value) { setSelectedId(Number(e.target.value)); setIntake(''); setFormData({}); }
            }}
            className={inp + ' cursor-pointer mt-1'}>
            <option value="">Select country / visa type...</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.country} — {t.name}{t.visa_type ? ` (${t.visa_type})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Loading spinner ── */}
      {selectedId && detailLoading && (
        <div className="py-10 text-center">
          <span className="w-6 h-6 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" />
          <p className="text-xs text-slate-400 mt-2">Loading template…</p>
        </div>
      )}

      {/* ── Selected form header (replaces dropdown after selection) ── */}
      {selectedId && !detailLoading && selected && detail && (
        <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">{FLAG[selected.country?.toLowerCase()] ?? '🌍'}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-black text-slate-800 text-sm">{selected.country}</span>
                {selected.visa_type && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-white border border-slate-300 rounded-full text-slate-500">{selected.visa_type}</span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">{selected.name}</p>
            </div>
          </div>
          <button onClick={() => { setSelectedId(null); setIntake(''); setFormData({}); }}
            className="flex-shrink-0 text-xs font-semibold text-slate-400 hover:text-rose-500 px-2 py-1 rounded-lg hover:bg-rose-50 transition-all">
            ✕ Change
          </button>
        </div>
      )}

      {/* ── Intake ── */}
      {intakeOptions.length > 0 && (
        <Card title="Target Intake">
          <div className="flex flex-wrap gap-2">
            {intakeOptions.map(opt => (
              <button key={opt} type="button"
                onClick={() => setIntake(p => p === opt ? '' : opt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  intake === opt ? 'bg-green-700 text-white border-green-700' : 'bg-white border-slate-300 text-slate-700 hover:border-green-400 hover:bg-green-50'
                }`}>
                {opt}
              </button>
            ))}
          </div>
          {intake && <p className="text-xs text-green-700 font-medium mt-2">✓ {intake}</p>}
        </Card>
      )}

      {/* ── Personal Information ── */}
      {detail && (
        <Card title="Personal Information" subtitle="Student contact and identification">
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
              <label className={lbl}>Contact Number</label>
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
            <div className="sm:col-span-2">
              <label className={lbl}>Permanent Address</label>
              <input className={inp} placeholder="House, Road, Area, City" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
          </div>
        </Card>
      )}

      {/* ── Custom Template Sections ── */}
      {detail && detail.groups.map(group => (
        <Card key={group.id} title={group.label} subtitle={group.hint}>
          <div className="space-y-6">
            {group.boxes.map((box, bi) => {
              const visible = box.fields.filter(f => isFieldVisible(f, formData));
              if (!visible.length) return null;
              return (
                <div key={box.id} className={bi > 0 ? 'pt-5 border-t border-slate-100' : ''}>
                  {box.name && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{box.name}</p>}
                  <div className="grid grid-cols-6 gap-4">
                    {visible.map(field => (
                      <div key={field.field_key} className={colSpan(field.box_size)}>
                        <DynamicField
                          field={field} appId={0}
                          value={formData[field.field_key] ?? ''}
                          existingDoc={undefined}
                          onDocUploaded={() => {}} onDocDeleted={() => {}}
                          onChange={val => setField(field.field_key, val)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      {/* ── Education Certificates ── */}
      {educations.length > 0 && (
        <Card title="Education Certificates" subtitle="Academic certificates and transcripts">
          <div className="space-y-4">
            {educations.map(edu => {
              const label     = EDU_LABELS[edu.level] ?? edu.level;
              const mandatory = edu.requirement === 'mandatory';
              const docKey    = `edu_${edu.level}`;
              return (
                <div key={edu.level} className={`rounded-xl border p-4 ${mandatory ? 'border-red-100 bg-red-50/30' : 'border-slate-200 bg-slate-50/40'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mandatory ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                      {mandatory ? 'Required' : 'Optional'}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={lbl}>Institution / Board</label>
                      <input className={inp} placeholder="e.g. Dhaka Education Board"
                        value={formData[`${docKey}_institution`] ?? ''}
                        onChange={e => setField(`${docKey}_institution`, e.target.value)} />
                    </div>
                    <div>
                      <label className={lbl}>GPA / Grade</label>
                      <input className={inp} placeholder="e.g. 5.00 / A+"
                        value={formData[`${docKey}_gpa`] ?? ''}
                        onChange={e => setField(`${docKey}_gpa`, e.target.value)} />
                    </div>
                    <div>
                      <label className={lbl}>Passing Year</label>
                      <input className={inp} placeholder="e.g. 2022"
                        value={formData[`${docKey}_year`] ?? ''}
                        onChange={e => setField(`${docKey}_year`, e.target.value)} />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">📎 Certificate upload available after creating the application</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Action bar ── */}
      {detail && (
        <div className="flex justify-end bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm">
          <button
            onClick={() => createMut.mutate()}
            disabled={createMut.isPending || !canCreate}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-lg disabled:opacity-40 transition-all">
            {createMut.isPending
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating…</>
              : '✓ Create Application'}
          </button>
        </div>
      )}
    </div>
  );
}
