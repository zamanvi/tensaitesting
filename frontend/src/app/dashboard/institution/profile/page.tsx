'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

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

const QUALIFICATIONS = ['SSC', 'HSC', 'Diploma', "Bachelor's", "Master's", 'N5', 'N4', 'N3', 'N2'];

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
  required_jlpt: string;
  required_nat: string;
  commission_type: 'percentage' | 'flat';
  commission_value: string;
  commission_currency: string;
}

const blank: ProfileForm = {
  institution_name: '', institution_name_local: '', institution_type: 'university',
  country: 'Japan', city: '', address: '', website: '', description: '',
  tuition_fee_min: '', tuition_fee_max: '', currency: 'JPY',
  intake_months: [], accepted_qualifications: [],
  required_jlpt: '', required_nat: '',
  commission_type: 'percentage', commission_value: '', commission_currency: 'JPY',
};

export default function InstitutionProfilePage() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const [form, setForm]         = useState<ProfileForm>(blank);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');
  const logoInputRef            = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['institution-profile'],
    queryFn: () => api.get('/institution/profile').then(r => r.data.profile),
  });

  useEffect(() => {
    if (data) {
      setForm({
        institution_name:       data.institution_name       ?? '',
        institution_name_local: data.institution_name_local ?? '',
        institution_type:       data.institution_type       ?? 'university',
        country:                data.country                ?? 'Japan',
        city:                   data.city                   ?? '',
        address:                data.address                ?? '',
        website:                data.website                ?? '',
        description:            data.description            ?? '',
        tuition_fee_min:        data.tuition_fee_min        ?? '',
        tuition_fee_max:        data.tuition_fee_max        ?? '',
        currency:               data.currency               ?? 'JPY',
        intake_months:          data.intake_months          ?? [],
        accepted_qualifications:data.accepted_qualifications?? [],
        required_jlpt: data.required_language_scores?.jlpt  ?? '',
        required_nat:  data.required_language_scores?.nat   ?? '',
        commission_type:     data.commission_type     ?? 'percentage',
        commission_value:    data.commission_value    ?? '',
        commission_currency: data.commission_currency ?? 'JPY',
      });
      // Show saved logo if present, but only if no new file selected
      if (data.logo_url && !logoFile) setLogoPreview(data.logo_url);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (isLocked) return;
    setForm(f => ({
      ...f,
      intake_months: f.intake_months.includes(m) ? f.intake_months.filter(x => x !== m) : [...f.intake_months, m],
    }));
  }

  function toggleQual(q: string) {
    if (isLocked) return;
    setForm(f => ({
      ...f,
      accepted_qualifications: f.accepted_qualifications.includes(q)
        ? f.accepted_qualifications.filter(x => x !== q)
        : [...f.accepted_qualifications, q],
    }));
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaved(false);
    const fd = new FormData();
    // Build required_language_scores JSON from separate JLPT/NAT fields
    const langScores: Record<string, string> = {};
    if (form.required_jlpt) langScores.jlpt = form.required_jlpt;
    if (form.required_nat)  langScores.nat  = form.required_nat;
    if (Object.keys(langScores).length > 0) {
      fd.append('required_language_scores', JSON.stringify(langScores));
    }
    if (logoFile) fd.append('logo', logoFile);
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'required_jlpt' || k === 'required_nat') return;
      // for flat commission, commission_currency comes from form; for percentage, use tuition currency
      if (k === 'commission_currency' && form.commission_type === 'percentage') return;
      if (Array.isArray(v)) v.forEach(i => fd.append(`${k}[]`, String(i)));
      else if (v !== null && v !== undefined && v !== '') fd.append(k, String(v));
    });
    // For percentage type, store commission_currency same as tuition currency
    if (form.commission_type === 'percentage') fd.append('commission_currency', form.currency);
    mutation.mutate(fd);
  }

  const isLocked = false;

  // Locked input style
  const inputCls = (extra = '') =>
    `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400 transition-colors ${
      isLocked
        ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
        : 'border-slate-200 bg-white text-slate-800'
    } ${extra}`;


  if (isLoading) {
    return <DashboardLayout><div className="text-center py-16 text-slate-400 text-sm">{ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}</div></DashboardLayout>;
  }

  return (
    <DashboardLayout title={ja ? '教育機関プロフィール' : bn ? 'প্রতিষ্ঠানের প্রোফাইল' : 'Institution Profile'}>


      {/* No profile yet */}
      {!data && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
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

        {/* Logo Upload */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
            {ja ? '機関ロゴ' : bn ? 'প্রতিষ্ঠানের লোগো' : 'Institution Logo'}
          </h3>
          <div className="flex items-center gap-4">
            {/* Preview */}
            <div className="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
              {logoPreview
                ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                : <span className="text-3xl">🏫</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              {!isLocked ? (
                <>
                  <button type="button" onClick={() => logoInputRef.current?.click()}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-indigo-300 transition-colors">
                    {logoPreview
                      ? (ja ? 'ロゴを変更' : bn ? 'লোগো পরিবর্তন করুন' : 'Change Logo')
                      : (ja ? 'ロゴをアップロード' : bn ? 'লোগো আপলোড করুন' : 'Upload Logo')}
                  </button>
                  <p className="text-xs text-slate-400 mt-1">
                    {ja ? 'JPG、PNG、WEBP・最大2MB' : bn ? 'JPG, PNG, WEBP · সর্বোচ্চ ২MB' : 'JPG, PNG, WEBP · max 2MB'}
                  </p>
                  <input ref={logoInputRef} type="file" accept="image/jpg,image/jpeg,image/png,image/webp"
                    className="hidden" onChange={handleLogoChange} />
                </>
              ) : (
                <p className="text-xs text-slate-400">
                  {ja ? 'プロフィール承認後はロゴを変更できません。' : bn ? 'অনুমোদনের পর লোগো পরিবর্তন করা যাবে না।' : 'Logo cannot be changed after approval.'}
                </p>
              )}
            </div>
          </div>
        </div>

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
              <input className={inputCls()} placeholder={ja ? '例：東京語学院' : bn ? 'যেমন: ঢাকা ইন্টারন্যাশনাল স্কুল' : 'e.g. Tokyo Language Academy'}
                value={form.institution_name} onChange={e => set('institution_name', e.target.value)}
                required disabled={isLocked} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? '機関名 (現地語)' : bn ? 'প্রতিষ্ঠানের নাম (স্থানীয় ভাষায়)' : 'Institution Name (Local)'}
              </label>
              <input className={inputCls()} placeholder="東京語学院"
                value={form.institution_name_local} onChange={e => set('institution_name_local', e.target.value)}
                disabled={isLocked} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? '機関タイプ' : bn ? 'প্রতিষ্ঠানের ধরন' : 'Institution Type'}
              </label>
              <select className={inputCls()} value={form.institution_type}
                onChange={e => set('institution_type', e.target.value)} disabled={isLocked}>
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
              <select className={inputCls()} value={form.country}
                onChange={e => set('country', e.target.value)} required disabled={isLocked}>
                <option value="">{ja ? '国を選択' : bn ? 'দেশ নির্বাচন করুন' : 'Select country'}</option>
                {['Japan','South Korea','Germany','Canada','Australia','United Kingdom','United States',
                  'Malaysia','Singapore','New Zealand','France','Netherlands','Sweden','Denmark',
                  'Norway','Finland','Austria','Switzerland','Ireland','Portugal','Italy','Spain',
                  'Belgium','Czech Republic','Poland','Hungary','Romania','Bulgaria','Other'].map(c =>
                  <option key={c} value={c}>{c}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? '市区町村' : bn ? 'শহর' : 'City'} <span className="text-red-400">*</span>
              </label>
              <input className={inputCls()} placeholder={ja ? '例：東京' : bn ? 'যেমন: ঢাকা' : 'e.g. Tokyo'}
                value={form.city} onChange={e => set('city', e.target.value)}
                required disabled={isLocked} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? 'ウェブサイト' : bn ? 'ওয়েবসাইট' : 'Website'}
              </label>
              <input className={inputCls()} type="url" placeholder="https://"
                value={form.website} onChange={e => set('website', e.target.value)}
                disabled={isLocked} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? '住所' : bn ? 'ঠিকানা' : 'Address'} <span className="text-red-400">*</span>
              </label>
              <input className={inputCls()} placeholder={ja ? '住所を入力' : bn ? 'সম্পূর্ণ ঠিকানা' : 'Full address'}
                value={form.address} onChange={e => set('address', e.target.value)}
                required disabled={isLocked} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? '説明' : bn ? 'বিবরণ' : 'Description'}
              </label>
              <textarea className={`${inputCls()} resize-none`} rows={3}
                placeholder={ja ? '機関について説明してください...' : bn ? 'প্রতিষ্ঠান সম্পর্কে বলুন...' : 'Describe your institution...'}
                value={form.description} onChange={e => set('description', e.target.value)}
                disabled={isLocked} />
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
                disabled={isLocked}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  isLocked
                    ? form.intake_months.includes(m.value)
                      ? 'bg-slate-200 text-slate-500 border-slate-200 cursor-not-allowed'
                      : 'border-slate-100 text-slate-300 cursor-not-allowed'
                    : form.intake_months.includes(m.value)
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
                disabled={isLocked}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  isLocked
                    ? form.accepted_qualifications.includes(q)
                      ? 'bg-slate-200 text-slate-500 border-slate-200 cursor-not-allowed'
                      : 'border-slate-100 text-slate-300 cursor-not-allowed'
                    : form.accepted_qualifications.includes(q)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                }`}
              >{q}</button>
            ))}
          </div>
        </div>

        {/* Required Language Scores */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
            {ja ? '必要な語学レベル' : bn ? 'প্রয়োজনীয় ভাষা স্কোর' : 'Required Language Scores'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? '必要なJLPTレベル' : bn ? 'প্রয়োজনীয় JLPT' : 'Minimum JLPT Level'}
              </label>
              <select className={inputCls()} value={form.required_jlpt}
                onChange={e => set('required_jlpt', e.target.value)} disabled={isLocked}>
                <option value="">{ja ? '不問' : bn ? 'যেকোনো' : 'Not required'}</option>
                {['N1','N2','N3','N4','N5'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? '必要なNATレベル' : bn ? 'প্রয়োজনীয় NAT' : 'Minimum NAT Level'}
              </label>
              <select className={inputCls()} value={form.required_nat}
                onChange={e => set('required_nat', e.target.value)} disabled={isLocked}>
                <option value="">{ja ? '不問' : bn ? 'যেকোনো' : 'Not required'}</option>
                {['1','2','3','4','5'].map(l => <option key={l} value={l}>NAT {l}</option>)}
              </select>
            </div>
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
                {form.commission_type === 'percentage' && <span className="text-red-400 ml-1">*</span>}
              </label>
              <input className={inputCls()} type="number" min="0" placeholder="0"
                value={form.tuition_fee_min} onChange={e => set('tuition_fee_min', e.target.value)}
                required={form.commission_type === 'percentage'}
                disabled={isLocked} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? '最高学費' : bn ? 'সর্বোচ্চ ফি' : 'Max Fee'}
              </label>
              <input className={inputCls()} type="number" min="0" placeholder="0"
                value={form.tuition_fee_max} onChange={e => set('tuition_fee_max', e.target.value)}
                disabled={isLocked} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {ja ? '通貨' : bn ? 'মুদ্রা' : 'Currency'}
              </label>
              <select className={inputCls()} value={form.currency}
                onChange={e => set('currency', e.target.value)} disabled={isLocked}>
                {['JPY','USD','BDT','KRW','EUR','GBP','AUD','CAD','SGD','MYR'].map(c =>
                  <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {form.commission_type === 'percentage' && !form.tuition_fee_min && (
            <p className="mt-2 text-xs text-amber-600">
              ⚠️ {ja ? '％コミッションには最低学費が必要です。' : bn ? 'শতাংশ কমিশনের জন্য ন্যূনতম ফি আবশ্যক।' : 'Minimum tuition fee is required for percentage commission.'}
            </p>
          )}
        </div>

        {/* Agent Commission */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-1">
            {ja ? 'エージェントへの手数料' : bn ? 'এজেন্ট কমিশন' : 'Agent Commission'}
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            {ja ? 'エージェントが学生を紹介して入学した場合に支払うコミッション。' : bn ? 'এজেন্ট প্রতি ভর্তি শিক্ষার্থীর জন্য যে কমিশন পাবে।' : 'Commission you offer agents per successfully enrolled student.'}
          </p>

          {/* Type toggle */}
          <div className="flex gap-2 mb-4">
            {(['percentage', 'flat'] as const).map(type => (
              <button key={type} type="button"
                onClick={() => { if (!isLocked) set('commission_type', type); }}
                disabled={isLocked}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  form.commission_type === type
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-slate-200 text-slate-500 hover:border-indigo-300'
                } ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}>
                {type === 'percentage'
                  ? (ja ? '割合 (%)' : bn ? 'শতাংশ (%)' : 'Percentage (%)')
                  : (ja ? '固定額' : bn ? 'নির্দিষ্ট পরিমাণ' : 'Flat Amount')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {form.commission_type === 'percentage' ? (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                  {ja ? 'コミッション率 (%)' : bn ? 'কমিশন হার (%)' : 'Commission Rate (%)'}
                </label>
                <div className="flex items-center gap-2">
                  <input className={inputCls('max-w-[140px]')} type="number" min="0" max="100" step="0.5"
                    placeholder="10" value={form.commission_value}
                    onChange={e => set('commission_value', e.target.value)}
                    disabled={isLocked} />
                  <span className="text-slate-400 text-sm font-bold">%</span>
                  {form.commission_value && form.tuition_fee_min && (
                    <span className="ml-2 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                      ≈ {form.currency} {(parseFloat(form.tuition_fee_min) * parseFloat(form.commission_value) / 100).toLocaleString()} {ja ? '/入学者' : bn ? '/শিক্ষার্থী' : '/ enrolled student'}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                    {ja ? '固定コミッション額' : bn ? 'নির্দিষ্ট কমিশন পরিমাণ' : 'Flat Commission Amount'}
                  </label>
                  <input className={inputCls()} type="number" min="0" placeholder="50000"
                    value={form.commission_value} onChange={e => set('commission_value', e.target.value)}
                    disabled={isLocked} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                    {ja ? '通貨' : bn ? 'মুদ্রা' : 'Currency'}
                  </label>
                  <select className={inputCls()} value={form.commission_currency}
                    onChange={e => set('commission_currency', e.target.value)} disabled={isLocked}>
                    {['JPY','USD','BDT','KRW','EUR','GBP','AUD','CAD','SGD','MYR'].map(c =>
                      <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Live preview */}
          {form.commission_value && (
            <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600">
              <span className="font-bold text-slate-700">
                {ja ? 'エージェントには表示されます：' : bn ? 'এজেন্ট দেখবে:' : 'Agents will see:'}
              </span>{' '}
              {form.commission_type === 'percentage'
                ? `${form.commission_value}% ${ja ? 'の授業料' : bn ? 'টিউশন ফির' : 'of tuition fee'}`
                : `${form.commission_currency} ${parseFloat(form.commission_value || '0').toLocaleString()} ${ja ? '固定' : bn ? 'ফ্ল্যাট' : 'flat'}`}
              {' '}{ja ? '/入学者' : bn ? 'প্রতি শিক্ষার্থী' : 'per enrolled student'}
            </div>
          )}
        </div>

        {/* Feedback */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <span className="shrink-0">⚠️</span> {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
            <span>✓</span>
            {ja ? 'プロフィールを保存しました。' : bn ? 'প্রোফাইল সংরক্ষিত।' : 'Profile saved successfully.'}
          </div>
        )}

        {isLocked ? (
          <div className="w-full py-3.5 rounded-xl text-sm font-bold text-center bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed select-none">
            🔒 {ja ? 'プロフィールはロックされています' : bn ? 'প্রোফাইল লক করা আছে' : 'Profile Locked — Contact support to update'}
          </div>
        ) : (
          <button type="submit" disabled={mutation.isPending}
            className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
              mutation.isPending ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm'
            }`}>
            {mutation.isPending
              ? (ja ? '保存中...' : bn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
              : data
                ? (ja ? 'プロフィールを更新' : bn ? 'প্রোফাইল আপডেট করুন' : 'Update Profile')
                : (ja ? 'プロフィールを保存' : bn ? 'প্রোফাইল সংরক্ষণ করুন' : 'Save Profile')}
          </button>
        )}
      </form>
    </DashboardLayout>
  );
}
