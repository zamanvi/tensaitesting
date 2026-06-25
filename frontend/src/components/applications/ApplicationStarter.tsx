'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Application, FormTemplateData,
  DynamicField, isFieldVisible, colSpan,
  inp, lbl,
} from './ApplicationFormShared';

const req = <span className="text-red-500 ml-0.5">*</span>;

const FLAG: Record<string, string> = {
  japan: '🇯🇵', uk: '🇬🇧', usa: '🇺🇸', 'united states': '🇺🇸',
  canada: '🇨🇦', australia: '🇦🇺', germany: '🇩🇪', france: '🇫🇷',
  'south korea': '🇰🇷', korea: '🇰🇷', china: '🇨🇳', malaysia: '🇲🇾',
  singapore: '🇸🇬', 'new zealand': '🇳🇿', ireland: '🇮🇪',
  netherlands: '🇳🇱', sweden: '🇸🇪', bangladesh: '🇧🇩', india: '🇮🇳',
};

interface ListTemplate { id: number; name: string; country: string; visa_type?: string; }

interface Props {
  role: 'branch' | 'agency' | 'admin' | 'student';
  studentName?: string;
  studentEmail?: string;
  onCreated: (app: Application) => void;
  queryKey: string;
}

function FiCard({ icon, title, subtitle, children }: {
  icon?: string; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/60">
        {icon && <span className="text-slate-500">{icon}</span>}
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="px-4 sm:px-6 py-4 sm:py-5">{children}</div>
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

  // Full template detail — groups, fields, intake_options, educations
  const { data: detail, isFetching: detailLoading } = useQuery<FormTemplateData>({
    queryKey: ['form-template-detail', selectedId],
    queryFn: () => api.get(`/form-templates/${selectedId}`).then(r => r.data),
    enabled: !!selectedId,
    staleTime: 300_000,
  });

  const [name,     setName]     = useState(studentName ?? '');
  const [email,    setEmail]    = useState(studentEmail ?? '');
  const [phone,    setPhone]    = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [dob,      setDob]      = useState('');
  const [passport, setPassport] = useState('');
  const [address,  setAddress]  = useState('');
  const [err,      setErr]      = useState('');

  const selected    = templates.find(t => t.id === selectedId) ?? null;
  const needStudent = role !== 'student';
  const canStart    = !!selectedId && !!name.trim();

  function setField(key: string, val: string) {
    setFormData(p => ({ ...p, [key]: val }));
  }

  function handleSelectTemplate(id: number | null) {
    setSelectedId(id);
    setIntake('');
    setFormData({});
  }

  const startMut = useMutation({
    mutationFn: () => api.post('/applications', {
      form_template_id:  selectedId,
      student_name:      name.trim(),
      student_email:     email.trim() || undefined,
      student_phone:     phone.trim() || undefined,
      whatsapp_no:       whatsapp.trim() || undefined,
      permanent_address: address.trim() || undefined,
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
    <div className="py-12 text-center">
      <span className="w-6 h-6 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" />
    </div>
  );

  if (templates.length === 0) return (
    <div className="py-12 text-center px-6">
      <div className="text-3xl mb-3">📋</div>
      <p className="text-sm font-semibold text-slate-600">No application forms published yet</p>
      <p className="text-xs text-slate-400 mt-1">Ask the admin to publish a form first</p>
    </div>
  );

  const intakeOptions = detail?.intake_options ?? [];

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {err && <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600">⚠️ {err}</div>}

      {/* ── 1. Country Form ── */}
      <FiCard icon="🌏" title="Country Form">
        <div>
          <label className={lbl}>Country Form {req}</label>
          <select
            value={selectedId ?? ''}
            onChange={e => handleSelectTemplate(e.target.value ? Number(e.target.value) : null)}
            className={inp + ' cursor-pointer'}>
            <option value="">— Select a country form —</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.country} — {t.name}</option>
            ))}
          </select>
        </div>

        {/* Template info card */}
        {selectedId && (
          <div className="mt-4">
            {detailLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <span className="w-4 h-4 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
                Loading form details…
              </div>
            ) : selected && detail && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xl">{FLAG[selected.country?.toLowerCase()] ?? '🌍'}</span>
                  <span className="font-bold text-slate-800 text-sm">{selected.country}</span>
                  {selected.visa_type && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-500">
                      {selected.visa_type}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-800 mb-1.5">{selected.name}</p>
                <div className="flex flex-wrap gap-x-3 text-xs text-slate-500">
                  {detail.groups.length > 0 && (
                    <span>📋 {detail.groups.length} custom section{detail.groups.length !== 1 ? 's' : ''}</span>
                  )}
                  {detail.educations.filter(e => e.requirement !== 'none').length > 0 && (
                    <span>🎓 {detail.educations.filter(e => e.requirement !== 'none').length} education certificate{detail.educations.filter(e => e.requirement !== 'none').length !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Intake pills */}
        {intakeOptions.length > 0 && (
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <label className={lbl}>Target Intake</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {intakeOptions.map(opt => (
                <button key={opt} type="button"
                  onClick={() => setIntake(prev => prev === opt ? '' : opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    intake === opt
                      ? 'bg-green-700 text-white border-green-700 shadow-sm'
                      : 'bg-white border-slate-300 text-slate-700 hover:border-green-400 hover:bg-green-50'
                  }`}>
                  {opt}
                </button>
              ))}
            </div>
            {intake && <p className="text-xs text-green-700 font-medium mt-2">✓ {intake}</p>}
          </div>
        )}
      </FiCard>

      {/* ── 2. Personal Information ── */}
      {selectedId && (
        <FiCard icon="👤" title="Personal Information" subtitle="Student contact and identification details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {needStudent && (
              <div className="col-span-1 sm:col-span-2">
                <label className={lbl}>Full Name {req}</label>
                <input className={inp} placeholder="e.g. Ahmed Rahman" value={name}
                  onChange={e => setName(e.target.value)} />
              </div>
            )}
            {needStudent && (
              <div>
                <label className={lbl}>Email Address</label>
                <input className={inp} type="email" placeholder="student@email.com" value={email}
                  onChange={e => setEmail(e.target.value)} />
              </div>
            )}
            <div>
              <label className={lbl}>Contact Number {req}</label>
              <input className={inp} type="tel" placeholder="+880 1XXX XXXXXX" value={phone}
                onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <label className={lbl}>WhatsApp Number</label>
              <input className={inp} type="tel" placeholder="+880 1XXX XXXXXX" value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Date of Birth</label>
              <input className={inp} type="date" value={dob} onChange={e => setDob(e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Passport Number</label>
              <input className={inp} placeholder="e.g. AB1234567" value={passport}
                onChange={e => setPassport(e.target.value)} />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className={lbl}>Permanent Address</label>
              <input className={inp} placeholder="House, Road, Area, City" value={address}
                onChange={e => setAddress(e.target.value)} />
            </div>
          </div>
        </FiCard>
      )}

      {/* ── 3. Custom Template Sections (dynamic from admin) ── */}
      {detail && detail.groups.map((group, gi) => (
        <FiCard key={group.id} icon="📋" title={group.label} subtitle={group.hint}>
          <div className="space-y-6">
            {group.boxes.map((box, bi) => {
              const visibleFields = box.fields.filter(f => isFieldVisible(f, formData));
              if (visibleFields.length === 0) return null;
              return (
                <div key={box.id} className={bi > 0 ? 'pt-5 border-t border-slate-100' : ''}>
                  {box.name && (
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{box.name}</p>
                  )}
                  <div className="grid grid-cols-6 gap-4">
                    {visibleFields.map(field => (
                      <div key={field.field_key} className={colSpan(field.box_size)}>
                        <DynamicField
                          field={field}
                          appId={0}
                          value={formData[field.field_key] ?? ''}
                          existingDoc={undefined}
                          onDocUploaded={() => {}}
                          onDocDeleted={() => {}}
                          onChange={val => setField(field.field_key, val)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </FiCard>
      ))}

      {/* ── 4. Save & Continue ── */}
      {selectedId && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 px-4 sm:px-6 py-4 shadow-sm">
          <p className="text-sm text-slate-500">
            {canStart
              ? 'Ready — create the application and continue to full form'
              : <span className="text-amber-600">Fill in student name to continue</span>}
          </p>
          <button
            onClick={() => startMut.mutate()}
            disabled={startMut.isPending || !canStart}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-bold rounded-lg disabled:opacity-50 transition-all shadow-sm">
            {startMut.isPending
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating…</>
              : '🚀 Save & Continue'}
          </button>
        </div>
      )}
    </div>
  );
}
