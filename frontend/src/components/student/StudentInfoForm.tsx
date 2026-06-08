'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { useLang } from '@/context/LanguageContext';

/* ── types ─────────────────────────────────────────────────────── */
interface Address {
  vill: string; po: string; post_code: string; ps: string; zilla: string;
}
interface Sibling {
  name: string; profession: string; dob: string; mobile: string;
}
interface FamilyInfo {
  father: { name: string; profession: string; dob: string; mobile: string; tin: string };
  mother: { name: string; profession: string; dob: string; mobile: string; tin: string };
  siblings: Sibling[];
}
interface EduEntry {
  name: string;
  address: Address;
  admission_date: string;
  end_date: string;
}
interface EducationHistory {
  primary: EduEntry;
  high_school: EduEntry;
  college: EduEntry;
  university: EduEntry;
  masters: EduEntry;
}
interface SponsorInfo { name: string; relation: string; mobile: string; }

/* ── helpers ────────────────────────────────────────────────────── */
const emptyAddress = (): Address => ({ vill: '', po: '', post_code: '', ps: '', zilla: '' });
const emptyEdu = (): EduEntry => ({ name: '', address: emptyAddress(), admission_date: '', end_date: '' });
const emptySibling = (): Sibling => ({ name: '', profession: '', dob: '', mobile: '' });

function blankFamily(): FamilyInfo {
  return {
    father: { name: '', profession: '', dob: '', mobile: '', tin: '' },
    mother: { name: '', profession: '', dob: '', mobile: '', tin: '' },
    siblings: [emptySibling(), emptySibling(), emptySibling(), emptySibling()],
  };
}
function blankEdu(): EducationHistory {
  return { primary: emptyEdu(), high_school: emptyEdu(), college: emptyEdu(), university: emptyEdu(), masters: emptyEdu() };
}

/* ── sub-components ─────────────────────────────────────────────── */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-slate-100 pb-3 mb-4">
      <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-slate-300';
const selectCls = `${inputCls} appearance-none cursor-pointer`;

function AddressFields({ value, onChange, prefix }: {
  value: Address;
  onChange: (v: Address) => void;
  prefix: string;
}) {
  const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: e.target.value });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
      <Field label="Village / Vill">
        <input className={inputCls} placeholder="e.g. Mirzapur" value={value.vill} onChange={set('vill')} id={`${prefix}-vill`} />
      </Field>
      <Field label="P.O. (Post Office)">
        <input className={inputCls} placeholder="e.g. Tongi" value={value.po} onChange={set('po')} id={`${prefix}-po`} />
      </Field>
      <Field label="Post Code">
        <input className={inputCls} placeholder="e.g. 1710" value={value.post_code} onChange={set('post_code')} id={`${prefix}-pc`} />
      </Field>
      <Field label="P.S. (Police Station)">
        <input className={inputCls} placeholder="e.g. Gazipur Sadar" value={value.ps} onChange={set('ps')} id={`${prefix}-ps`} />
      </Field>
      <div className="col-span-2">
        <Field label="Zilla (District)">
          <input className={inputCls} placeholder="e.g. Gazipur" value={value.zilla} onChange={set('zilla')} id={`${prefix}-zilla`} />
        </Field>
      </div>
    </div>
  );
}

function PhoneInput({ value, onChange, id }: { value: string; onChange: (v: string) => void; id?: string }) {
  return (
    <div className="flex">
      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-sm text-slate-500 font-medium shrink-0">+88</span>
      <input
        id={id}
        type="tel"
        className="flex-1 border border-slate-200 rounded-r-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-slate-300"
        placeholder="01XXXXXXXXX"
        value={value.replace(/^\+88/, '')}
        onChange={(e) => onChange(e.target.value ? `+88${e.target.value.replace(/^\+88/, '')}` : '')}
      />
    </div>
  );
}

/* ── main component ─────────────────────────────────────────────── */
interface Props {
  initialProfile?: Record<string, unknown>;
  onSaved?: () => void;
}

export default function StudentInfoForm({ initialProfile, onSaved }: Props) {
  const { lang } = useLang();

  // Personal
  const [bloodGroup, setBloodGroup] = useState<string>((initialProfile?.blood_group as string) ?? '');
  const [dob, setDob]               = useState<string>((initialProfile?.date_of_birth as string) ?? '');
  const [mobile, setMobile]         = useState<string>((initialProfile?.mobile_number as string) ?? '');
  const [whatsapp, setWhatsapp]     = useState<string>((initialProfile?.whatsapp_number as string) ?? '');

  // Family
  const [family, setFamily] = useState<FamilyInfo>(() => {
    const fi = initialProfile?.family_info as FamilyInfo | null;
    if (!fi) return blankFamily();
    return {
      father: { ...{ name: '', profession: '', dob: '', mobile: '', tin: '' }, ...fi.father },
      mother: { ...{ name: '', profession: '', dob: '', mobile: '', tin: '' }, ...fi.mother },
      siblings: Array.from({ length: 4 }, (_, i) => ({ ...emptySibling(), ...(fi.siblings?.[i] ?? {}) })),
    };
  });

  // Addresses
  const [permAddr, setPermAddr] = useState<Address>(() => ({ ...emptyAddress(), ...((initialProfile?.permanent_address as Address) ?? {}) }));
  const [presAddr, setPresAddr] = useState<Address>(() => ({ ...emptyAddress(), ...((initialProfile?.present_address as Address) ?? {}) }));
  const [sameAddress, setSameAddress] = useState(false);

  // Education
  const [edu, setEdu] = useState<EducationHistory>(() => {
    const eh = initialProfile?.education_history as EducationHistory | null;
    if (!eh) return blankEdu();
    return {
      primary:     { ...emptyEdu(), ...eh.primary,     address: { ...emptyAddress(), ...eh.primary?.address } },
      high_school: { ...emptyEdu(), ...eh.high_school, address: { ...emptyAddress(), ...eh.high_school?.address } },
      college:     { ...emptyEdu(), ...eh.college,     address: { ...emptyAddress(), ...eh.college?.address } },
      university:  { ...emptyEdu(), ...eh.university,  address: { ...emptyAddress(), ...eh.university?.address } },
      masters:     { ...emptyEdu(), ...eh.masters,     address: { ...emptyAddress(), ...eh.masters?.address } },
    };
  });

  // Sponsor
  const [sponsor, setSponsor] = useState<SponsorInfo>(() => ({ ...{ name: '', relation: '', mobile: '' }, ...((initialProfile?.sponsor_info as SponsorInfo) ?? {}) }));

  // Form state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function setFather(k: keyof typeof family.father, v: string) {
    setFamily(f => ({ ...f, father: { ...f.father, [k]: v } }));
  }
  function setMother(k: keyof typeof family.mother, v: string) {
    setFamily(f => ({ ...f, mother: { ...f.mother, [k]: v } }));
  }
  function setSibling(i: number, k: keyof Sibling, v: string) {
    setFamily(f => {
      const siblings = [...f.siblings];
      siblings[i] = { ...siblings[i], [k]: v };
      return { ...f, siblings };
    });
  }
  function setEduField(key: keyof EducationHistory, k: keyof EduEntry, v: string) {
    setEdu(e => ({ ...e, [key]: { ...e[key], [k]: v } }));
  }
  function setEduAddr(key: keyof EducationHistory, addr: Address) {
    setEdu(e => ({ ...e, [key]: { ...e[key], address: addr } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await api.put('/student/profile', {
        blood_group: bloodGroup || null,
        date_of_birth: dob || null,
        mobile_number: mobile || null,
        whatsapp_number: whatsapp || null,
        family_info: family,
        permanent_address: permAddr,
        present_address: sameAddress ? permAddr : presAddr,
        education_history: edu,
        sponsor_info: sponsor,
      });
      setSaved(true);
      onSaved?.();
      setTimeout(() => setSaved(false), 4000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const t = {
    save: lang === 'bn' ? 'তথ্য সংরক্ষণ করুন' : lang === 'ja' ? '保存する' : 'Save Information',
    saving: lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : lang === 'ja' ? '保存中...' : 'Saving...',
    savedMsg: lang === 'bn' ? '✓ সফলভাবে সংরক্ষিত হয়েছে।' : lang === 'ja' ? '✓ 保存しました。' : '✓ Information saved successfully.',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Personal Information ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <SectionHeader
          title={lang === 'bn' ? 'শিক্ষার্থীর ব্যক্তিগত তথ্য' : lang === 'ja' ? '学生の個人情報' : "Student's Personal Information"}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Blood Group">
            <select className={selectCls} value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}>
              <option value="">— Select —</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </Field>
          <Field label="Date of Birth">
            <input type="date" className={inputCls} value={dob} onChange={e => setDob(e.target.value)} />
          </Field>
          <Field label="Mobile Number" required>
            <PhoneInput value={mobile} onChange={setMobile} id="student-mobile" />
          </Field>
          <Field label="WhatsApp Number">
            <PhoneInput value={whatsapp} onChange={setWhatsapp} id="student-whatsapp" />
          </Field>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          {lang === 'bn'
            ? 'নাম ও ইমেইল প্রোফাইল পেইজে আপডেট করুন।'
            : lang === 'ja'
            ? '氏名・メールアドレスはプロフィールページで更新できます。'
            : 'Name and Email are managed from your Profile page.'}
        </p>
      </div>

      {/* ── Family Information ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <SectionHeader
          title={lang === 'bn' ? 'পারিবারিক তথ্য' : lang === 'ja' ? '家族情報' : 'Family Information'}
        />

        {/* Father */}
        <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-3">
          {lang === 'bn' ? 'পিতার তথ্য' : lang === 'ja' ? '父の詳細' : "Father's Details"}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <Field label="Father's Name">
            <input className={inputCls} placeholder="Father's full name" value={family.father.name} onChange={e => setFather('name', e.target.value)} />
          </Field>
          <Field label="Profession">
            <input className={inputCls} placeholder="e.g. Farmer, Businessman, Service" value={family.father.profession} onChange={e => setFather('profession', e.target.value)} />
          </Field>
          <Field label="Date of Birth">
            <input type="date" className={inputCls} value={family.father.dob} onChange={e => setFather('dob', e.target.value)} />
          </Field>
          <Field label="Mobile Number">
            <PhoneInput value={family.father.mobile} onChange={v => setFather('mobile', v)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="TIN Number">
              <input className={inputCls} placeholder="TIN (if available)" value={family.father.tin} onChange={e => setFather('tin', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Mother */}
        <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-3">
          {lang === 'bn' ? 'মাতার তথ্য' : lang === 'ja' ? '母の詳細' : "Mother's Details"}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <Field label="Mother's Name">
            <input className={inputCls} placeholder="Mother's full name" value={family.mother.name} onChange={e => setMother('name', e.target.value)} />
          </Field>
          <Field label="Profession">
            <input className={inputCls} placeholder="e.g. Housewife, Teacher, Business" value={family.mother.profession} onChange={e => setMother('profession', e.target.value)} />
          </Field>
          <Field label="Date of Birth">
            <input type="date" className={inputCls} value={family.mother.dob} onChange={e => setMother('dob', e.target.value)} />
          </Field>
          <Field label="Mobile Number">
            <PhoneInput value={family.mother.mobile} onChange={v => setMother('mobile', v)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="TIN Number">
              <input className={inputCls} placeholder="TIN (if available)" value={family.mother.tin} onChange={e => setMother('tin', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Siblings */}
        <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-3">
          {lang === 'bn' ? 'ভাই-বোন (সর্বোচ্চ ৪ জন)' : lang === 'ja' ? '兄弟姉妹（最大4人）' : 'Siblings (up to 4)'}
        </p>
        <div className="space-y-4">
          {family.siblings.map((s, i) => (
            <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <p className="text-xs font-semibold text-slate-400 mb-3">
                {lang === 'bn' ? `ভাই/বোন ${i + 1}` : lang === 'ja' ? `兄弟姉妹 ${i + 1}` : `Sibling ${i + 1}`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Name">
                  <input className={inputCls} placeholder="Sibling's full name" value={s.name} onChange={e => setSibling(i, 'name', e.target.value)} />
                </Field>
                <Field label="Profession">
                  <input className={inputCls} placeholder="e.g. Student, Service, Business" value={s.profession} onChange={e => setSibling(i, 'profession', e.target.value)} />
                </Field>
                <Field label="Date of Birth">
                  <input type="date" className={inputCls} value={s.dob} onChange={e => setSibling(i, 'dob', e.target.value)} />
                </Field>
                <Field label="Mobile Number">
                  <PhoneInput value={s.mobile} onChange={v => setSibling(i, 'mobile', v)} />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Address Details ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <SectionHeader
          title={lang === 'bn' ? 'ঠিকানার বিবরণ' : lang === 'ja' ? '住所詳細' : 'Address Details'}
        />

        <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">
          {lang === 'bn' ? 'স্থায়ী ঠিকানা' : lang === 'ja' ? '永住所' : 'Permanent Address'}
        </p>
        <AddressFields value={permAddr} onChange={setPermAddr} prefix="perm" />

        <div className="flex items-center gap-2 my-4">
          <input
            type="checkbox"
            id="same-address"
            checked={sameAddress}
            onChange={e => setSameAddress(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
          />
          <label htmlFor="same-address" className="text-xs text-slate-500 cursor-pointer">
            {lang === 'bn' ? 'বর্তমান ঠিকানা স্থায়ী ঠিকানার মতো' : lang === 'ja' ? '現住所は永住所と同じ' : 'Present address same as permanent address'}
          </label>
        </div>

        {!sameAddress && (
          <>
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">
              {lang === 'bn' ? 'বর্তমান ঠিকানা' : lang === 'ja' ? '現住所' : 'Present Address'}
            </p>
            <AddressFields value={presAddr} onChange={setPresAddr} prefix="pres" />
          </>
        )}
      </div>

      {/* ── Educational Background ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <SectionHeader
          title={lang === 'bn' ? 'শিক্ষাগত পটভূমি' : lang === 'ja' ? '学歴' : 'Educational Background'}
        />

        {(
          [
            { key: 'primary' as const,     label: 'Primary School',           endLabel: 'Completing Date' },
            { key: 'high_school' as const, label: 'High School',              endLabel: 'S.S.C Result Publication Date' },
            { key: 'college' as const,     label: 'Vocational / College',     endLabel: 'H.S.C / College Result Publication Date' },
            { key: 'university' as const,  label: 'University',               endLabel: 'University Result Publication Date' },
            { key: 'masters' as const,     label: 'Masters (University)',     endLabel: 'Masters Result Publication Date' },
          ] as const
        ).map(({ key, label, endLabel }, idx) => (
          <div key={key} className={idx > 0 ? 'mt-6 pt-6 border-t border-slate-100' : ''}>
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-3">{label}</p>
            <div className="space-y-4">
              <Field label="Institution Name">
                <input className={inputCls} placeholder={`${label} name`} value={edu[key].name} onChange={e => setEduField(key, 'name', e.target.value)} />
              </Field>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">Address</p>
                <AddressFields value={edu[key].address} onChange={addr => setEduAddr(key, addr)} prefix={`edu-${key}`} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Admission Date">
                  <input type="date" className={inputCls} value={edu[key].admission_date} onChange={e => setEduField(key, 'admission_date', e.target.value)} />
                </Field>
                <Field label={endLabel}>
                  <input type="date" className={inputCls} value={edu[key].end_date} onChange={e => setEduField(key, 'end_date', e.target.value)} />
                </Field>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Sponsor Information ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <SectionHeader
          title={lang === 'bn' ? 'স্পনসরের তথ্য' : lang === 'ja' ? '保証人情報' : 'Sponsor Information'}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Sponsor Name">
            <input className={inputCls} placeholder="Sponsor's full name" value={sponsor.name} onChange={e => setSponsor(s => ({ ...s, name: e.target.value }))} />
          </Field>
          <Field label="Relation with Applicant">
            <input className={inputCls} placeholder="e.g. Father, Elder Brother, Uncle" value={sponsor.relation} onChange={e => setSponsor(s => ({ ...s, relation: e.target.value }))} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Mobile Number">
              <PhoneInput value={sponsor.mobile} onChange={v => setSponsor(s => ({ ...s, mobile: v }))} id="sponsor-mobile" />
            </Field>
          </div>
        </div>
      </div>

      {/* ── Save ── */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <span className="shrink-0">⚠️</span> {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
          <span>✓</span> {t.savedMsg}
        </div>
      )}
      <button
        type="submit"
        disabled={saving}
        className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
          saving ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800 text-white shadow-sm'
        }`}
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            {t.saving}
          </span>
        ) : t.save}
      </button>
    </form>
  );
}
