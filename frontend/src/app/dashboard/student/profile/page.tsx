'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const DIVISIONS = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh'] as const;
const QUALIFICATIONS = ['SSC', 'HSC', 'Diploma', 'Bachelor', 'Master', 'PhD', 'Other'] as const;

interface ProfileData {
  full_name?: string;
  full_name_japanese?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  religion?: string;
  street_address?: string;
  district?: string;
  division?: string;
  postal_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  highest_qualification?: string;
  gpa?: string | number;
  institution_name?: string;
  passing_year?: string | number;
  is_data_locked?: boolean;
}

export default function StudentProfilePage() {
  const { t } = useLang();
  const { user } = useAuthStore();
  const p = t.studentProfile;

  const { data, isLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => api.get('/student/profile').then((r) => r.data),
    staleTime: 60_000,
  });

  const profile: ProfileData = data?.profile ?? {};
  const locked = profile.is_data_locked ?? false;

  const [form, setForm] = useState<ProfileData>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (data?.profile) {
      setForm({
        full_name: data.profile.full_name ?? '',
        full_name_japanese: data.profile.full_name_japanese ?? '',
        date_of_birth: data.profile.date_of_birth ?? '',
        gender: data.profile.gender ?? '',
        nationality: data.profile.nationality ?? '',
        religion: data.profile.religion ?? '',
        street_address: data.profile.street_address ?? '',
        district: data.profile.district ?? '',
        division: data.profile.division ?? '',
        postal_code: data.profile.postal_code ?? '',
        emergency_contact_name: data.profile.emergency_contact_name ?? '',
        emergency_contact_phone: data.profile.emergency_contact_phone ?? '',
        emergency_contact_relation: data.profile.emergency_contact_relation ?? '',
        highest_qualification: data.profile.highest_qualification ?? '',
        gpa: data.profile.gpa ?? '',
        institution_name: data.profile.institution_name ?? '',
        passing_year: data.profile.passing_year ?? '',
      });
    }
  }, [data]);

  function set(key: keyof ProfileData, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    setSavedMsg('');
    setErrorMsg('');
    try {
      await api.put('/student/profile', form);
      setSavedMsg(p.saved);
      setTimeout(() => setSavedMsg(''), 4000);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setErrorMsg(err.response?.data?.message ?? 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title={p.title}>
        <div className="text-center py-16 text-slate-400 text-sm">{t.common.loading}</div>
      </DashboardLayout>
    );
  }

  const inputCls = (disabled?: boolean) =>
    `w-full border rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-white transition-colors placeholder:text-slate-400 ${
      disabled
        ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
        : 'border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent'
    }`;

  return (
    <DashboardLayout title={p.title}>

      {locked && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
          🔒 {p.locked}
        </div>
      )}

      {/* Personal Info */}
      <Section title={p.personalInfo}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={p.fullName}>
            <input className={inputCls(locked)} disabled={locked} value={form.full_name ?? ''} onChange={(e) => set('full_name', e.target.value)} />
          </Field>
          <Field label={p.fullNameJapanese}>
            <input className={inputCls(locked)} disabled={locked} value={form.full_name_japanese ?? ''} onChange={(e) => set('full_name_japanese', e.target.value)} placeholder="例：田中 太郎（カタカナ）" />
          </Field>
          <Field label={p.dateOfBirth}>
            <input type="date" className={inputCls(locked)} disabled={locked} value={form.date_of_birth ?? ''} onChange={(e) => set('date_of_birth', e.target.value)} />
          </Field>
          <Field label={p.gender}>
            <select className={inputCls(locked)} disabled={locked} value={form.gender ?? ''} onChange={(e) => set('gender', e.target.value)}>
              <option value="">—</option>
              <option value="male">{p.genderMale}</option>
              <option value="female">{p.genderFemale}</option>
              <option value="other">{p.genderOther}</option>
            </select>
          </Field>
          <Field label={p.nationality}>
            <input className={inputCls(locked)} disabled={locked} value={form.nationality ?? ''} onChange={(e) => set('nationality', e.target.value)} placeholder="e.g. Bangladeshi" />
          </Field>
          <Field label={p.religion}>
            <input className={inputCls(locked)} disabled={locked} value={form.religion ?? ''} onChange={(e) => set('religion', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Contact & Address */}
      <Section title={p.contactAddress}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={`${p.phone} 🔒`}>
            <input className={inputCls(true)} disabled value={user?.phone ?? ''} placeholder="—" />
            <p className="text-xs text-slate-400 mt-1">{p.phoneNote}</p>
          </Field>
          <div /> {/* spacer */}
          <Field label={p.streetAddress} className="sm:col-span-2">
            <input className={inputCls(locked)} disabled={locked} value={form.street_address ?? ''} onChange={(e) => set('street_address', e.target.value)} placeholder="House no., Road, Area" />
          </Field>
          <Field label={p.district}>
            <input className={inputCls(locked)} disabled={locked} value={form.district ?? ''} onChange={(e) => set('district', e.target.value)} placeholder="e.g. Dhaka, Chittagong" />
          </Field>
          <Field label={p.division}>
            <select className={inputCls(locked)} disabled={locked} value={form.division ?? ''} onChange={(e) => set('division', e.target.value)}>
              <option value="">{p.selectDivision}</option>
              {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label={p.postalCode}>
            <input className={inputCls(locked)} disabled={locked} value={form.postal_code ?? ''} onChange={(e) => set('postal_code', e.target.value)} placeholder="e.g. 1207" maxLength={10} />
          </Field>
        </div>
      </Section>

      {/* Emergency Contact */}
      <Section title={p.emergencyContact}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={p.emergencyName}>
            <input className={inputCls(locked)} disabled={locked} value={form.emergency_contact_name ?? ''} onChange={(e) => set('emergency_contact_name', e.target.value)} />
          </Field>
          <Field label={p.emergencyPhone}>
            <input className={inputCls(locked)} disabled={locked} value={form.emergency_contact_phone ?? ''} onChange={(e) => set('emergency_contact_phone', e.target.value)} placeholder="+8801XXXXXXXXX" />
          </Field>
          <Field label={p.emergencyRelation}>
            <input className={inputCls(locked)} disabled={locked} value={form.emergency_contact_relation ?? ''} onChange={(e) => set('emergency_contact_relation', e.target.value)} placeholder={p.emergencyRelation} />
          </Field>
        </div>
      </Section>

      {/* Academic Info */}
      <Section title={p.academicInfo}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={p.highestQualification}>
            <select className={inputCls(locked)} disabled={locked} value={form.highest_qualification ?? ''} onChange={(e) => set('highest_qualification', e.target.value)}>
              <option value="">—</option>
              {QUALIFICATIONS.map((q) => <option key={q} value={q}>{q}</option>)}
            </select>
          </Field>
          <Field label={p.gpa}>
            <input type="number" step="0.01" min="0" max="5" className={inputCls(locked)} disabled={locked} value={form.gpa ?? ''} onChange={(e) => set('gpa', e.target.value)} placeholder="e.g. 3.75 (out of 4.00)" />
          </Field>
          <Field label={p.institutionName}>
            <input className={inputCls(locked)} disabled={locked} value={form.institution_name ?? ''} onChange={(e) => set('institution_name', e.target.value)} />
          </Field>
          <Field label={p.passingYear}>
            <input type="number" min="1990" max="2030" className={inputCls(locked)} disabled={locked} value={form.passing_year ?? ''} onChange={(e) => set('passing_year', e.target.value)} placeholder="e.g. 2023" />
          </Field>
        </div>
      </Section>

      {/* Save bar */}
      {!locked && (
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 disabled:opacity-50 transition-colors"
          >
            {saving ? p.saving : p.saveBtn}
          </button>
          {savedMsg && <span className="text-sm text-emerald-600">{savedMsg}</span>}
          {errorMsg && <span className="text-sm text-red-500">{errorMsg}</span>}
        </div>
      )}

    </DashboardLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 mb-5">
      <h2 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
