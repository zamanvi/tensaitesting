'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Application } from './ApplicationFormShared';

const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 bg-white transition-all placeholder:text-slate-300';
const lbl = 'block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide';

interface Template { id: number; name: string; country: string; visa_type?: string; intake_options?: string[]; educations?: { level: string; requirement: string }[]; }

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

export default function ApplicationStarter({ role, studentName, studentEmail, onCreated, queryKey }: Props) {
  const qc = useQueryClient();

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ['form-templates-list'],
    queryFn: () => api.get('/form-templates').then(r => r.data),
    staleTime: 60_000,
  });

  // Fetch full template detail (with educations + groups) when one is selected
  const { data: selectedDetail } = useQuery<Template & { groups?: unknown[] }>({
    queryKey: ['form-template-detail', selectedId],
    queryFn: () => api.get(`/form-templates/${selectedId}`).then(r => r.data),
    enabled: !!selectedId,
    staleTime: 300_000,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [intake,     setIntake]     = useState('');
  const [name,       setName]       = useState(studentName ?? '');
  const [email,      setEmail]      = useState(studentEmail ?? '');
  const [phone,      setPhone]      = useState('');
  const [whatsapp,   setWhatsapp]   = useState('');
  const [dob,        setDob]        = useState('');
  const [passport,   setPassport]   = useState('');
  const [address,    setAddress]    = useState('');
  const [err,        setErr]        = useState('');

  const selected = templates.find(t => t.id === selectedId) ?? null;

  // Group templates by country for display
  const byCountry = templates.reduce<Record<string, Template[]>>((acc, t) => {
    (acc[t.country] ??= []).push(t);
    return acc;
  }, {});

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

  const needStudentInfo = role !== 'student';
  const canStart = !!selectedId && !!name.trim();

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <span className="w-6 h-6 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="text-3xl mb-3">📋</div>
        <p className="text-sm font-semibold text-slate-600">No application forms published yet</p>
        <p className="text-xs text-slate-400 mt-1">Ask the admin to publish a form first</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-lg">
      {err && <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600">⚠️ {err}</div>}

      <div className="space-y-4">
        {/* Template selector — grouped by country */}
        <div>
          <label className={lbl}>Select Application Form *</label>
          <div className="space-y-2">
            {Object.entries(byCountry).map(([country, forms]) => (
              <div key={country}>
                {/* Country header when multiple forms exist */}
                {Object.keys(byCountry).length > 1 || forms.length > 1 ? (
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-0.5">
                    🌏 {country}
                  </p>
                ) : null}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {forms.map(t => (
                    <button key={t.id} type="button"
                      onClick={() => { setSelectedId(t.id); setIntake(''); }}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-left ${
                        selectedId === t.id
                          ? 'bg-green-700 text-white border-green-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-green-400 hover:bg-green-50'
                      }`}>
                      <span className="block font-bold">{t.name}</span>
                      {t.visa_type && (
                        <span className={`text-[10px] font-normal ${selectedId === t.id ? 'text-green-100' : 'text-slate-400'}`}>
                          {t.visa_type}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Template info card */}
          {selected && (
            <div className="mt-3 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4">
              <div className="flex flex-wrap items-start gap-3">
                {/* Flag + country */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl leading-none">
                      {FLAG[selected.country?.toLowerCase()] ?? '🌍'}
                    </span>
                    <span className="font-black text-slate-800 text-sm">{selected.country}</span>
                    {selected.visa_type && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-500">
                        {selected.visa_type}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-700 mt-1">{selected.name}</p>
                  <div className="flex gap-3 mt-1.5 flex-wrap">
                    {selectedDetail?.groups && (
                      <span className="text-[11px] text-slate-500">
                        📋 {(selectedDetail.groups as unknown[]).length} custom section{(selectedDetail.groups as unknown[]).length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {selectedDetail?.educations && selectedDetail.educations.filter(e => e.requirement !== 'none').length > 0 && (
                      <span className="text-[11px] text-slate-500">
                        🎓 {selectedDetail.educations.filter(e => e.requirement !== 'none').length} education certificate{selectedDetail.educations.filter(e => e.requirement !== 'none').length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Intake pills */}
          {selected && (selected.intake_options ?? []).length > 0 && (
            <div className="mt-3">
              <label className={lbl}>Select Intake</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(selected.intake_options ?? []).map(opt => (
                  <button key={opt} type="button"
                    onClick={() => setIntake(prev => prev === opt ? '' : opt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      intake === opt
                        ? 'bg-green-700 text-white border-green-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-green-400 hover:bg-green-50'
                    }`}>
                    📅 {opt}
                  </button>
                ))}
              </div>
              {intake && <p className="text-[11px] text-green-700 font-semibold mt-1.5">✓ Selected: {intake}</p>}
            </div>
          )}
        </div>

        {/* Student info */}
        {needStudentInfo && (
          <div>
            <label className={lbl}>Student Name *</label>
            <input className={inp} placeholder="e.g. Ahmed Rahman" value={name}
              onChange={e => setName(e.target.value)} />
          </div>
        )}

        {/* Contact details — branch/agency fill all; student fills contact + whatsapp + address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {needStudentInfo && (
            <div>
              <label className={lbl}>Student Email</label>
              <input className={inp} type="email" placeholder="student@email.com" value={email}
                onChange={e => setEmail(e.target.value)} />
            </div>
          )}
          <div>
            <label className={lbl}>Contact Phone</label>
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

        <button onClick={() => startMut.mutate()}
          disabled={startMut.isPending || !canStart}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-bold rounded-2xl disabled:opacity-50 transition-all shadow-sm">
          {startMut.isPending && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          🚀 Open Application Form
        </button>
      </div>
    </div>
  );
}
