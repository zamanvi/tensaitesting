'use client';
import AgencyLayout from '@/components/shared/AgencyLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AgencyProfile {
  id?: number;
  agency_name: string;
  agency_name_bn: string;
  contact_person_name: string;
  contact_person_phone: string;
  address: string;
  city: string;
  registration_number: string;
  trade_license: string;
  website: string;
  description: string;
  vetting_status?: string;
  rejection_reason?: string;
  slot_number?: number;
  approved_at?: string;
  target_countries: string[];
  service_types: string[];
}

const COUNTRIES: { value: string; en: string; ja: string; bn: string }[] = [
  { value: 'Japan',       en: 'Japan',       ja: '日本',           bn: 'জাপান' },
  { value: 'South Korea', en: 'South Korea', ja: '韓国',           bn: 'দক্ষিণ কোরিয়া' },
  { value: 'Canada',      en: 'Canada',      ja: 'カナダ',         bn: 'কানাডা' },
  { value: 'Australia',   en: 'Australia',   ja: 'オーストラリア', bn: 'অস্ট্রেলিয়া' },
  { value: 'Germany',     en: 'Germany',     ja: 'ドイツ',         bn: 'জার্মানি' },
  { value: 'UK',          en: 'UK',          ja: 'イギリス',       bn: 'যুক্তরাজ্য' },
  { value: 'Malaysia',    en: 'Malaysia',    ja: 'マレーシア',     bn: 'মালয়েশিয়া' },
];

const SERVICES: { value: string; en: string; ja: string; bn: string }[] = [
  { value: 'Visa Processing',        en: 'Visa Processing',        ja: 'ビザ申請',         bn: 'ভিসা প্রসেসিং' },
  { value: 'University Admission',   en: 'University Admission',   ja: '大学入学',         bn: 'বিশ্ববিদ্যালয় ভর্তি' },
  { value: 'Language Training',      en: 'Language Training',      ja: '語学トレーニング', bn: 'ভাষা প্রশিক্ষণ' },
  { value: 'Accommodation',          en: 'Accommodation',          ja: '宿泊手配',         bn: 'আবাসন ব্যবস্থা' },
  { value: 'Air Ticketing',          en: 'Air Ticketing',          ja: '航空券手配',       bn: 'এয়ার টিকেটিং' },
  { value: 'Pre-Departure Briefing', en: 'Pre-Departure Briefing', ja: '出国前説明会',     bn: 'প্রি-ডিপার্চার ব্রিফিং' },
];

const blank: AgencyProfile = {
  agency_name: '', agency_name_bn: '', contact_person_name: '',
  contact_person_phone: '', address: '', city: '',
  registration_number: '', trade_license: '', website: '',
  description: '', target_countries: [], service_types: [],
};

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-slate-400';

export default function AgencyProfilePage() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  // Auth guard
  useEffect(() => {
    if (user && user.gateway_type !== 'agency') router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, router]);

  const [form,  setForm]  = useState<AgencyProfile>(blank);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['agency-profile'],
    queryFn: () => api.get('/agency/profile').then(r => r.data.profile),
    enabled: !!user,
  });

  useEffect(() => {
    if (data) setForm({ ...blank, ...data, target_countries: data.target_countries ?? [], service_types: data.service_types ?? [] });
  }, [data]);

  const mutation = useMutation({
    mutationFn: (fd: FormData) => api.post('/agency/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => {
      setSaved(true);
      setError('');
      qc.invalidateQueries({ queryKey: ['agency-profile'] });
      setTimeout(() => setSaved(false), 4000);
    },
    onError: (err: unknown) => {
      setSaved(false);
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = e.response?.data?.errors;
      setError(errs ? Object.values(errs).flat().join(' ') : e.response?.data?.message ?? 'Failed to save.');
    },
  });

  function set(k: keyof AgencyProfile, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function toggleArr(k: 'target_countries' | 'service_types', val: string) {
    setForm(f => {
      const arr = f[k] as string[];
      return { ...f, [k]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaved(false);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach(i => fd.append(`${k}[]`, i));
      else if (v !== null && v !== undefined) fd.append(k, String(v));
    });
    mutation.mutate(fd);
  }

  if (!user || user.gateway_type !== 'agency') return null;

  const status = data?.vetting_status ?? null;
  const isApproved = status === 'approved';

  const STATUS_BANNER: Record<string, { bg: string; icon: string; title: string; desc: string }> = {
    pending:      { bg: 'bg-amber-50 border-amber-200',   icon: '⏳', title: ja ? '審査待ち' : bn ? 'পর্যালোচনা অপেক্ষায়' : 'Under Review', desc: ja ? '管理者がプロフィールを確認中です。通常24-48時間かかります。' : bn ? 'অ্যাডমিন যাচাই করছেন। ২৪-৪৮ ঘন্টা লাগে।' : 'Admin is reviewing your profile. Usually takes 24–48 hours.' },
    under_review: { bg: 'bg-blue-50 border-blue-200',     icon: '🔍', title: ja ? '詳細審査中' : bn ? 'বিস্তারিত যাচাই চলছে' : 'In Detailed Review', desc: ja ? '追加確認が行われています。' : bn ? 'আরও যাচাই চলছে।' : 'Additional verification in progress. You will be contacted soon.' },
    approved:     { bg: 'bg-emerald-50 border-emerald-200', icon: '✅', title: ja ? '承認済み ✓' : bn ? 'অনুমোদিত ✓' : 'Approved ✓', desc: ja ? `スロット #${data?.slot_number} — フルアクセス有効` : bn ? `স্লট #${data?.slot_number} — সম্পূর্ণ অ্যাক্সেস সক্রিয়।` : `Slot #${data?.slot_number} — Full platform access active.` },
    rejected:     { bg: 'bg-red-50 border-red-200',       icon: '❌', title: ja ? '申請却下' : bn ? 'আবেদন প্রত্যাখ্যাত' : 'Application Rejected', desc: data?.rejection_reason ?? '' },
  };

  const banner = status ? STATUS_BANNER[status] : null;

  return (
    <AgencyLayout title={ja ? 'エージェンシープロフィール' : bn ? 'এজেন্সি প্রোফাইল' : 'Agency Profile'}>

      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {ja ? 'エージェンシープロフィール' : bn ? 'এজেন্সি প্রোফাইল' : 'Agency Profile'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {ja ? 'プロフィールを完成させて管理者の審査を受けてください' : bn ? 'প্রোফাইল পূরণ করুন এবং অ্যাডমিন অনুমোদনের জন্য জমা দিন' : 'Complete your profile and submit for admin review to unlock full access'}
        </p>
      </div>

      {/* Status banner */}
      {banner && (
        <div className={`rounded-2xl border p-4 mb-6 flex items-start gap-3 ${banner.bg}`}>
          <span className="text-xl shrink-0">{banner.icon}</span>
          <div>
            <p className="font-bold text-sm text-slate-900">{banner.title}</p>
            <p className="text-xs text-slate-600 mt-0.5">{banner.desc}</p>
            {status === 'rejected' && (
              <p className="text-xs text-red-600 font-medium mt-1">
                {ja ? '情報を修正して再提出できます。' : bn ? 'তথ্য সংশোধন করে পুনরায় জমা দিতে পারেন।' : 'You can correct the information and resubmit below.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* No profile yet */}
      {!isLoading && !data && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <span className="text-xl">📋</span>
          <div>
            <p className="font-bold text-sm text-slate-900">
              {ja ? 'プロフィールを完成させてください' : bn ? 'প্রোফাইল পূরণ করুন' : 'Complete Your Agency Profile'}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {ja ? 'プロフィールを提出することで、管理者の審査が始まります。' : bn ? 'প্রোফাইল জমা দিলে অ্যাডমিন যাচাই শুরু হবে।' : 'Submit your profile to start admin vetting. Once approved, you get full platform access.'}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <span className="w-8 h-8 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Agency Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
              🏢 {ja ? 'エージェンシー情報' : bn ? 'এজেন্সির তথ্য' : 'Agency Information'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                  {ja ? 'エージェンシー名 (英語)' : bn ? 'এজেন্সির নাম (ইংরেজি)' : 'Agency Name (English)'} <span className="text-red-400">*</span>
                </label>
                <input className={inputCls} placeholder="e.g. Global Study Consultancy"
                  value={form.agency_name} onChange={e => set('agency_name', e.target.value)} required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                  {ja ? 'エージェンシー名 (ベンガル語)' : bn ? 'এজেন্সির নাম (বাংলা)' : 'Agency Name (Bangla)'}
                </label>
                <input className={inputCls} placeholder="বাংলায় নাম"
                  value={form.agency_name_bn} onChange={e => set('agency_name_bn', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                  {ja ? '登録番号' : bn ? 'রেজিস্ট্রেশন নম্বর' : 'Registration Number'}
                </label>
                <input className={inputCls} placeholder="e.g. REG-2024-XXXXX"
                  value={form.registration_number} onChange={e => set('registration_number', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                  {ja ? 'トレードライセンス番号' : bn ? 'ট্রেড লাইসেন্স নম্বর' : 'Trade License Number'}
                </label>
                <input className={inputCls} placeholder="e.g. TL-XXXXXXXX"
                  value={form.trade_license} onChange={e => set('trade_license', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                  {ja ? 'ウェブサイト' : bn ? 'ওয়েবসাইট' : 'Website'}
                </label>
                <input className={inputCls} type="url" placeholder="https://yourwebsite.com"
                  value={form.website} onChange={e => set('website', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                  {ja ? '説明' : bn ? 'বিবরণ' : 'Description'}
                </label>
                <textarea className={`${inputCls} resize-none`} rows={3}
                  placeholder={ja ? 'エージェンシーについて説明してください...' : bn ? 'আপনার এজেন্সি সম্পর্কে বলুন...' : 'Tell us about your agency...'}
                  value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Contact & Location */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
              📍 {ja ? '連絡先・所在地' : bn ? 'যোগাযোগ ও অবস্থান' : 'Contact & Location'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                  {ja ? '担当者名' : bn ? 'যোগাযোগের ব্যক্তির নাম' : 'Contact Person Name'} <span className="text-red-400">*</span>
                </label>
                <input className={inputCls} placeholder="Full name"
                  value={form.contact_person_name} onChange={e => set('contact_person_name', e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                  {ja ? '担当者電話番号' : bn ? 'যোগাযোগের ফোন নম্বর' : 'Contact Phone'} <span className="text-red-400">*</span>
                </label>
                <input type="tel" className={inputCls} placeholder="+8801XXXXXXXXX"
                  value={form.contact_person_phone} onChange={e => set('contact_person_phone', e.target.value)} required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                  {ja ? '住所' : bn ? 'ঠিকানা' : 'Office Address'} <span className="text-red-400">*</span>
                </label>
                <input className={inputCls} placeholder="Street address, area"
                  value={form.address} onChange={e => set('address', e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                  {ja ? '市区町村' : bn ? 'শহর' : 'City'} <span className="text-red-400">*</span>
                </label>
                <input className={inputCls} placeholder="e.g. Dhaka"
                  value={form.city} onChange={e => set('city', e.target.value)} required />
              </div>
            </div>
          </div>

          {/* Target Countries */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
              🌏 {ja ? '対象国' : bn ? 'টার্গেট দেশ' : 'Target Countries'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map(c => (
                <button key={c.value} type="button" onClick={() => toggleArr('target_countries', c.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    form.target_countries.includes(c.value)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-slate-200 text-slate-600 hover:border-green-300 hover:bg-green-50'
                  }`}>
                  {ja ? c.ja : bn ? c.bn : c.en}
                </button>
              ))}
            </div>
            {form.target_countries.length === 0 && (
              <p className="text-[11px] text-slate-400 mt-2">{ja ? '少なくとも1か国選択してください' : bn ? 'অন্তত একটি দেশ বেছে নিন' : 'Select at least one country'}</p>
            )}
          </div>

          {/* Services */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
              ⚙️ {ja ? 'サービス内容' : bn ? 'সেবাসমূহ' : 'Services Offered'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map(s => (
                <button key={s.value} type="button" onClick={() => toggleArr('service_types', s.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    form.service_types.includes(s.value)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-slate-200 text-slate-600 hover:border-green-300 hover:bg-green-50'
                  }`}>
                  {ja ? s.ja : bn ? s.bn : s.en}
                </button>
              ))}
            </div>
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
              {ja ? 'プロフィールを保存しました。管理者の審査をお待ちください。' : bn ? 'প্রোফাইল সংরক্ষিত। অ্যাডমিন যাচাইয়ের অপেক্ষায়।' : 'Profile saved. Awaiting admin review.'}
            </div>
          )}

          {/* Submit — always visible; label changes when approved */}
          <button type="submit" disabled={mutation.isPending}
            className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
              mutation.isPending ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800 text-white shadow-sm'
            }`}>
            {mutation.isPending
              ? (ja ? '保存中...' : bn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
              : isApproved
                ? (ja ? 'プロフィールを更新' : bn ? 'প্রোফাইল আপডেট করুন' : 'Update Profile')
                : data
                  ? (ja ? 'プロフィールを更新・再提出' : bn ? 'আপডেট করে পুনরায় জমা দিন' : 'Update & Resubmit')
                  : (ja ? 'プロフィールを提出' : bn ? 'প্রোফাইল জমা দিন' : 'Submit Profile for Review')}
          </button>

        </form>
      )}
    </AgencyLayout>
  );
}
