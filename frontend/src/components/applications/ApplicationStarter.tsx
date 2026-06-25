'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Application } from './ApplicationFormShared';

const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 bg-white transition-all placeholder:text-slate-300';
const lbl = 'block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide uppercase';

interface Template {
  id: number; name: string; country: string; visa_type?: string;
  intake_options?: string[]; educations?: { level: string; requirement: string }[];
  groups?: unknown[];
}

const FLAG: Record<string, string> = {
  japan: '🇯🇵', uk: '🇬🇧', usa: '🇺🇸', 'united states': '🇺🇸',
  canada: '🇨🇦', australia: '🇦🇺', germany: '🇩🇪', france: '🇫🇷',
  'south korea': '🇰🇷', korea: '🇰🇷', china: '🇨🇳', malaysia: '🇲🇾',
  singapore: '🇸🇬', 'new zealand': '🇳🇿', ireland: '🇮🇪',
  netherlands: '🇳🇱', sweden: '🇸🇪', bangladesh: '🇧🇩', india: '🇮🇳',
};

interface Props {
  role: 'branch' | 'agency' | 'admin' | 'student';
  studentName?: string;
  studentEmail?: string;
  onCreated: (app: Application) => void;
  queryKey: string;
}

function SectionCard({ n, icon, title, subtitle, children }: {
  n: number; icon?: string; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
        <div className="w-7 h-7 rounded-xl bg-green-700 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
          {n}
        </div>
        <div>
          <p className="text-sm font-black text-slate-900">{icon} {title}</p>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export default function ApplicationStarter({ role, studentName, studentEmail, onCreated, queryKey }: Props) {
  const qc = useQueryClient();

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ['form-templates-list'],
    queryFn: () => api.get('/form-templates').then(r => r.data),
    staleTime: 60_000,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [intake,     setIntake]     = useState('');

  const { data: selectedDetail, isFetching: detailLoading } = useQuery<Template>({
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

  const selected = templates.find(t => t.id === selectedId) ?? null;
  const needStudentInfo = role !== 'student';
  const canStart = !!selectedId && !!name.trim();

  const intakeOptions = (selectedDetail?.intake_options ?? []) as string[];
  const eduCount = (selectedDetail?.educations ?? []).filter(e => e.requirement !== 'none').length;
  const groupCount = (selectedDetail?.groups ?? []).length;

  const startMut = useMutation({
    mutationFn: () => api.post('/applications', {
      form_template_id: selectedId,
      student_name:      name.trim(),
      student_email:     email.trim() || undefined,
      student_phone:     phone.trim() || undefined,
      whatsapp_no:       whatsapp.trim() || undefined,
      permanent_address: address.trim() || undefined,
      form_data: {
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
      setErr(errs ? Object.values(errs).flat().join(' ') : ax.response?.data?.message ?? 'Failed to start application.');
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <span className="w-6 h-6 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-3xl mb-3">📋</div>
        <p className="text-sm font-semibold text-slate-600">No application forms published yet</p>
        <p className="text-xs text-slate-400 mt-1">Ask the admin to publish a form first</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      {err && (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600">⚠️ {err}</div>
      )}

      {/* Step 1 — Country Form */}
      <SectionCard n={1} icon="🌏" title="Select Country Form" subtitle="Choose the destination country and visa type">
        <select
          value={selectedId ?? ''}
          onChange={e => { setSelectedId(e.target.value ? Number(e.target.value) : null); setIntake(''); }}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 bg-white transition-all text-slate-700">
          <option value="">— Select a form —</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>
              {t.country} — {t.name}{t.visa_type ? ` (${t.visa_type})` : ''}
            </option>
          ))}
        </select>

        {/* Template info card */}
        {selectedId && (
          <div className="mt-4">
            {detailLoading ? (
              <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
                <span className="w-4 h-4 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
                Loading form details…
              </div>
            ) : selected && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-2xl leading-none">{FLAG[selected.country?.toLowerCase()] ?? '🌍'}</span>
                  <span className="font-black text-slate-800 text-sm">{selected.country}</span>
                  {selected.visa_type && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-500">
                      {selected.visa_type}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-700 mb-1.5">{selected.name}</p>
                <div className="flex gap-3 flex-wrap">
                  {groupCount > 0 && (
                    <span className="text-[11px] text-slate-500">📋 {groupCount} custom section{groupCount !== 1 ? 's' : ''}</span>
                  )}
                  {eduCount > 0 && (
                    <span className="text-[11px] text-slate-500">🎓 {eduCount} education certificate{eduCount !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Intake pills */}
        {intakeOptions.length > 0 && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-800 mb-2.5">📅 Select Target Intake</p>
            <div className="flex flex-wrap gap-2">
              {intakeOptions.map(opt => (
                <button key={opt} type="button"
                  onClick={() => setIntake(prev => prev === opt ? '' : opt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    intake === opt
                      ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                      : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-100'
                  }`}>
                  {opt}
                </button>
              ))}
            </div>
            {intake && <p className="text-[11px] text-blue-700 font-semibold mt-2">✓ Selected: {intake}</p>}
          </div>
        )}
      </SectionCard>

      {/* Step 2 — Personal Information (show after template selected) */}
      {selectedId && (
        <SectionCard n={2} icon="👤" title="Student Information" subtitle="Contact details and identification">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {needStudentInfo && (
              <div className="sm:col-span-2">
                <label className={lbl}>Full Name *</label>
                <input className={inp} placeholder="e.g. Ahmed Rahman" value={name}
                  onChange={e => setName(e.target.value)} />
              </div>
            )}
            {needStudentInfo && (
              <div>
                <label className={lbl}>Email Address</label>
                <input className={inp} type="email" placeholder="student@email.com" value={email}
                  onChange={e => setEmail(e.target.value)} />
              </div>
            )}
            <div>
              <label className={lbl}>Contact Number</label>
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
              <input className={inp} type="date" value={dob}
                onChange={e => setDob(e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Passport Number</label>
              <input className={inp} placeholder="e.g. AB1234567" value={passport}
                onChange={e => setPassport(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Permanent Address</label>
              <input className={inp} placeholder="House, Road, Area, City" value={address}
                onChange={e => setAddress(e.target.value)} />
            </div>
          </div>
        </SectionCard>
      )}

      {/* Step 3 — Save & Continue */}
      {selectedId && (
        <SectionCard n={3} icon="🚀" title="Save & Continue" subtitle="Create the application and fill in full details">
          <div className="flex items-center gap-3">
            <button
              onClick={() => startMut.mutate()}
              disabled={startMut.isPending || !canStart}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-bold rounded-2xl disabled:opacity-50 transition-all shadow-sm">
              {startMut.isPending
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating…</>
                : '🚀 Open Full Application Form'}
            </button>
            {!name.trim() && <p className="text-xs text-slate-400">Fill student name to continue</p>}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
