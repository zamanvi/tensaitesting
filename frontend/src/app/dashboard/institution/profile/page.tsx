'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const MONTHS = [
  { value: 1,  en: 'January',   ja: '1月',  bn: 'জানুয়ারি' },
  { value: 2,  en: 'February',  ja: '2月',  bn: 'ফেব্রুয়ারি' },
  { value: 3,  en: 'March',     ja: '3月',  bn: 'মার্চ' },
  { value: 4,  en: 'April',     ja: '4月',  bn: 'এপ্রিল' },
  { value: 5,  en: 'May',       ja: '5月',  bn: 'মে' },
  { value: 6,  en: 'June',      ja: '6月',  bn: 'জুন' },
  { value: 7,  en: 'July',      ja: '7月',  bn: 'জুলাই' },
  { value: 8,  en: 'August',    ja: '8月',  bn: 'আগস্ট' },
  { value: 9,  en: 'September', ja: '9月',  bn: 'সেপ্টেম্বর' },
  { value: 10, en: 'October',   ja: '10月', bn: 'অক্টোবর' },
  { value: 11, en: 'November',  ja: '11月', bn: 'নভেম্বর' },
  { value: 12, en: 'December',  ja: '12月', bn: 'ডিসেম্বর' },
];

const QUALIFICATIONS = ['SSC', 'HSC', 'Diploma', 'Bachelor\'s', 'Master\'s', 'N5', 'N4', 'N3', 'N2'];

interface ProfileForm {
  institution_name: string;
  institution_name_local: string;
  institution_type: string;
  country: string;
  city: string;
  address: string;
  website: string;
  description: string;
  tuition_fee_min: string;
  tuition_fee_max: string;
  currency: string;
  intake_months: number[];
  accepted_qualifications: string[];
}

const blank: ProfileForm = {
  institution_name: '', institution_name_local: '', institution_type: 'university',
  country: 'Japan', city: '', address: '', website: '', description: '',
  tuition_fee_min: '', tuition_fee_max: '', currency: 'JPY',
  intake_months: [], accepted_qualifications: [],
};

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400';

export default function InstitutionProfilePage() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const [form, setForm]   = useState<ProfileForm>(blank);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['institution-profile'],
    queryFn: () => api.get('/institution/profile').then(r => r.data.profile),
  });

  useEffect(() => {
    if (data) {
      setForm({
        institution_name: data.institution_name ?? '',
        institution_name_local: data.institution_name_local ?? '',
        institution_type: data.institution_type ?? 'university',
        country: data.country ?? 'Japan',
        city: data.city ?? '',
        address: data.address ?? '',
        website: data.website ?? '',
        description: data.description ?? '',
        tuition_fee_min: data.tuition_fee_min ?? '',
        tuition_fee_max: data.tuition_fee_max ?? '',
        currency: data.currency ?? 'JPY',
        intake_months: data.intake_months ?? [],
        accepted_qualifications: data.accepted_qualifications ?? [],
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (fd: FormData) => api.post('/institution/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ['institution-profile'] });
      setTimeout(() => setSaved(false), 4000);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = e.response?.data?.errors;
      setError(errs ? Object.values(errs).flat().join(' ') : e.response?.data?.message ?? 'Failed to save.');
    },
  });

  function set(k: keyof ProfileForm, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function toggleMonth(m: number) {
    setForm(f => ({
      ...f,
      intake_months: f.intake_months.includes(m) ? f.intake_months.filter(x => x !== m) : [...f.intake_months, m],
    }));
  }

  function toggleQual(q: string) {
    setForm(f => ({
      ...f,
      accepted_qualifications: f.accepted_qualifications.includes(q) ? f.accepted_qualifications.filter(x => x !== q) : [...f.accepted_qualifications, q],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaved(false);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach(i => fd.append(`${k}[]`, String(i)));
      else if (v !== null && v !== undefined && v !== '') fd.append(k, String(v));
    });
    mutation.mutate(fd);
  }

  const status = data?.status ?? null;

  const STATUS_BANNER: Record<string, { bg: string; icon: string; title: string; desc: string }> = {
    pending:   { bg: 'bg-amber-50 border-amber-200',   icon: '⏳', title: ja ? '審査待ち' : bn ? 'পর্যালোচনা অপেক্ষায়' : 'Under Review', desc: ja ? '管理者がプロフィールを確認中です。通常24〜48時間かかります。' : bn ? 'অ্যাডমিন যাচাই করছেন। সাধারণত ২৪-৪৮ ঘন্টা লাগে।' : 'Admin is reviewing your profile. Usually takes 24–48 hours.' },
    active:    { bg: 'bg-emerald-50 border-emerald-200', icon: '✅', title: ja ? '認証済み ✓' : bn ? 'অনুমোদিত ✓' : 'Verified & Active ✓', desc: ja ? 'エージェンシーからの学生申請が届きます。' : bn ? 'এজেন্সি থেকে শিক্ষার্থীর আবেদন আসবে।' : 'You will receive student applications from agencies.' },
    suspended: { bg: 'bg-red-50 border-red-200',       icon: '❌', title: ja ? 'アカウント停止中' : bn ? 'অ্যাকাউন্ট স্থগিত' : 'Account Suspended', desc: ja ? 'サポートにお問い合わせください。' : bn ? 'সাপোর্টে যোগাযোগ করুন।' : 'Contact support for assistance.' },
  };

  const banner = status ? STATUS_BANNER[status] : null;

  if (isLoading) {
    return <DashboardLayout><div className="text-center py-16 text-slate-400 text-sm">{ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}</div></DashboardLayout>;
  }

  return (
    <DashboardLayout title={ja ? '教育機関プロフィール' : bn ? 'প্রতিষ্ঠানের প্রোফাইল' : 'Institution Profile'}>

      {/* Status banner */}
      {banner && (
        <div className={`rounded-2xl border p-4 mb-6 flex items-start gap-3 ${banner.bg}`}>
          <span className="text-xl shrink-0">{banner.icon}</span>
          <div>
            <p className="font-bold text-sm text-slate-900">{banner.title}</p>
            <p className="text-xs text-slate-600 mt-0.5">{banner.desc}</p>
          </div>
        </div>
      )}

      {/* No profile yet */}
      {!data && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <span className="text-xl">🏫</span>
          <div>
            <p className="font-bold text-sm text-slate-900">
              {ja ? 'プロフィールを完成させてください' : bn ? 'প্রোফাইল পূরণ করুন' : 'Complete Your Institution Profile'}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {ja ? 'プロフィールを提出することで、管理者の審査が始まります。承認後、エージェンシーからの学生申請を受け取れます。' : bn ? 'প্রোফাইল জমা দিলে অ্যাডমিন যাচাই শুরু হবে। অনুমোদনের পর এজেন্সি থেকে শিক্ষার্থীর আবেদন পাবেন।' : 'Submit your profile to start admin verification. Once approved, agencies can send student applications.'}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
            {ja ? '機関情報' : bn ? 'প্রতিষ্ঠানের তথ্য' : 'Institution Information'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? '機関名 (英語)' : bn ? 'প্রতিষ্ঠানের নাম (ইংরেজি)' : 'Institution Name (English)'} <span className="text-red-400">*</span>
              </label>
              <input className={inputCls} placeholder="e.g. Tokyo Language Academy" value={form.institution_name} onChange={e => set('institution_name', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? '機関名 (現地語)' : bn ? 'প্রতিষ্ঠানের নাম (স্থানীয় ভাষায়)' : 'Institution Name (Local)'}
              </label>
              <input className={inputCls} placeholder="東京語学院" value={form.institution_name_local} onChange={e => set('institution_name_local', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? '機関タイプ' : bn ? 'প্রতিষ্ঠানের ধরন' : 'Institution Type'}
              </label>
              <select className={inputCls} value={form.institution_type} onChange={e => set('institution_type', e.target.value)}>
                <option value="university">{ja ? '大学' : bn ? 'বিশ্ববিদ্যালয়' : 'University'}</option>
                <option value="college">{ja ? '短大・専門大学院' : bn ? 'কলেজ' : 'College'}</option>
                <option value="language_school">{ja ? '語学学校' : bn ? 'ভাষা শিক্ষালয়' : 'Language School'}</option>
                <option value="vocational">{ja ? '専門学校' : bn ? 'বৃত্তিমূলক বিদ্যালয়' : 'Vocational School'}</option>
                <option value="employer">{ja ? '雇用主' : bn ? 'নিয়োগকর্তা' : 'Employer'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? '国' : bn ? 'দেশ' : 'Country'} <span className="text-red-400">*</span>
              </label>
              <input className={inputCls} placeholder="Japan" value={form.country} onChange={e => set('country', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? '市区町村' : bn ? 'শহর' : 'City'} <span className="text-red-400">*</span>
              </label>
              <input className={inputCls} placeholder="e.g. Tokyo" value={form.city} onChange={e => set('city', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? 'ウェブサイト' : bn ? 'ওয়েবসাইট' : 'Website'}
              </label>
              <input className={inputCls} type="url" placeholder="https://" value={form.website} onChange={e => set('website', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? '住所' : bn ? 'ঠিকানা' : 'Address'} <span className="text-red-400">*</span>
              </label>
              <input className={inputCls} placeholder="Full address" value={form.address} onChange={e => set('address', e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? '説明' : bn ? 'বিবরণ' : 'Description'}
              </label>
              <textarea className={`${inputCls} resize-none`} rows={3}
                placeholder={ja ? '機関について説明してください...' : bn ? 'প্রতিষ্ঠান সম্পর্কে বলুন...' : 'Describe your institution...'}
                value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Intake Months */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
            {ja ? '入学月' : bn ? 'ভর্তির মাস' : 'Intake Months'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {MONTHS.map(m => (
              <button key={m.value} type="button"
                onClick={() => toggleMonth(m.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  form.intake_months.includes(m.value)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                }`}
              >{ja ? m.ja : bn ? m.bn : m.en}</button>
            ))}
          </div>
        </div>

        {/* Qualifications */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
            {ja ? '受け入れ可能な学歴・日本語レベル' : bn ? 'গৃহীত যোগ্যতা' : 'Accepted Qualifications'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {QUALIFICATIONS.map(q => (
              <button key={q} type="button"
                onClick={() => toggleQual(q)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  form.accepted_qualifications.includes(q)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                }`}
              >{q}</button>
            ))}
          </div>
        </div>

        {/* Tuition Fees */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
            {ja ? '学費情報' : bn ? 'টিউশন ফি' : 'Tuition Fees'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? '最低学費' : bn ? 'সর্বনিম্ন ফি' : 'Min Fee'}
              </label>
              <input className={inputCls} type="number" min="0" placeholder="0"
                value={form.tuition_fee_min} onChange={e => set('tuition_fee_min', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? '最高学費' : bn ? 'সর্বোচ্চ ফি' : 'Max Fee'}
              </label>
              <input className={inputCls} type="number" min="0" placeholder="0"
                value={form.tuition_fee_max} onChange={e => set('tuition_fee_max', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? '通貨' : bn ? 'মুদ্রা' : 'Currency'}
              </label>
              <select className={inputCls} value={form.currency} onChange={e => set('currency', e.target.value)}>
                <option value="JPY">JPY</option>
                <option value="USD">USD</option>
                <option value="BDT">BDT</option>
                <option value="KRW">KRW</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <span className="shrink-0">⚠️</span> {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
            <span>✓</span>
            {ja ? 'プロフィールを保存しました。管理者の審査をお待ちください。' : bn ? 'প্রোফাইল সংরক্ষিত। অ্যাডমিন যাচাইয়ের অপেক্ষায় আছেন।' : 'Profile saved. Awaiting admin review.'}
          </div>
        )}

        {status !== 'active' && (
          <button type="submit" disabled={mutation.isPending}
            className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
              mutation.isPending ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm'
            }`}>
            {mutation.isPending
              ? (ja ? '保存中...' : bn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
              : (data ? (ja ? 'プロフィールを更新' : bn ? 'প্রোফাইল আপডেট করুন' : 'Update & Resubmit') : (ja ? 'プロフィールを提出' : bn ? 'প্রোফাইল জমা দিন' : 'Submit Profile for Review'))}
          </button>
        )}
      </form>
    </DashboardLayout>
  );
}
