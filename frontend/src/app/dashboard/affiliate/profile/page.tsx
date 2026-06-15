'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface ProfileForm {
  country: string;
  bio: string;
  organization_name: string;
  designation: string;
  website: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  bkash_number: string;
  nagad_number: string;
}

const blank: ProfileForm = {
  country: '', bio: '', organization_name: '', designation: '', website: '',
  bank_name: '', bank_account_number: '', bank_account_name: '',
  bkash_number: '', nagad_number: '',
};

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400';

export default function AffiliateProfilePage() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const [form, setForm]   = useState<ProfileForm>(blank);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['affiliate-profile'],
    queryFn: () => api.get('/affiliate/profile').then(r => r.data),
  });

  const profile = data?.profile;
  const isGlobal = profile?.affiliate_type === 'global';

  useEffect(() => {
    if (profile) setForm({
      country:              profile.country ?? '',
      bio:                  profile.bio ?? '',
      organization_name:    profile.organization_name ?? '',
      designation:          profile.designation ?? '',
      website:              profile.website ?? '',
      bank_name:            profile.bank_name ?? '',
      bank_account_number:  profile.bank_account_number ?? '',
      bank_account_name:    profile.bank_account_name ?? '',
      bkash_number:         profile.bkash_number ?? '',
      nagad_number:         profile.nagad_number ?? '',
    });
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (payload: ProfileForm) => api.post('/affiliate/profile', payload),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ['affiliate-profile'] });
      qc.invalidateQueries({ queryKey: ['affiliate-dashboard'] });
      setTimeout(() => setSaved(false), 4000);
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = err.response?.data?.errors;
      setError(errs ? Object.values(errs).flat().join(' ') : err.response?.data?.message ?? 'Failed to save.');
    },
  });

  function set(k: keyof ProfileForm, v: string) { setForm(f => ({ ...f, [k]: v })); }
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); setError(''); setSaved(false); mutation.mutate(form); }

  const hasPayoutInfo = !!(profile?.bank_account_number || profile?.bkash_number || profile?.nagad_number);

  if (isLoading) {
    return <DashboardLayout><div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl" />)}</div></DashboardLayout>;
  }

  return (
    <DashboardLayout title={ja ? 'プロフィール設定' : bn ? 'প্রোফাইল সেটিংস' : 'Profile Settings'}>

      {/* Type badge */}
      {profile?.affiliate_type && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold mb-5 ${profile.affiliate_type === 'global' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
          {profile.affiliate_type === 'global' ? '🌐' : '🎓'}
          {profile.affiliate_type === 'global'
            ? (ja ? 'インスティテューションアフィリエイト' : bn ? 'ইনস্টিটিউশনস অ্যাফিলিয়েট' : 'Institutions Affiliate')
            : (ja ? 'スチューデントアフィリエイト' : bn ? 'স্টুডেন্ট অ্যাফিলিয়েট' : 'Student Affiliate')}
          {profile.performance_level && (
            <span className="opacity-70 capitalize">· {profile.performance_level}</span>
          )}
        </div>
      )}

      {/* Payout warning */}
      {!hasPayoutInfo && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
          <span className="text-xl shrink-0">💳</span>
          <div>
            <p className="font-bold text-sm text-slate-900">
              {ja ? '支払い情報を追加してください' : bn ? 'পেমেন্ট তথ্য যোগ করুন' : 'Add Payout Details'}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {ja ? 'コミッションを受け取るには銀行口座またはモバイルバンキング情報が必要です。' : bn ? 'কমিশন পেতে ব্যাংক বা মোবাইল ব্যাংকিং তথ্য যোগ করুন।' : 'Add bank account or bKash/Nagad to receive commissions.'}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
            {ja ? '基本情報' : bn ? 'মূল তথ্য' : 'Basic Information'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                {ja ? '国・地域' : bn ? 'দেশ / অঞ্চল' : 'Country / Region'}
              </label>
              <input className={inputCls} placeholder="Bangladesh" value={form.country} onChange={e => set('country', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                {ja ? '自己紹介' : bn ? 'পরিচিতি' : 'Short Bio'}
              </label>
              <textarea className={`${inputCls} resize-none`} rows={3}
                placeholder={ja ? 'あなた自身について...' : bn ? 'নিজের সম্পর্কে সংক্ষেপে...' : 'A brief intro about yourself...'}
                value={form.bio} onChange={e => set('bio', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Global-only: Organization Info */}
        {isGlobal && (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 text-sm border-b border-amber-100 pb-3 mb-4">
              🌐 {ja ? '組織情報' : bn ? 'প্রতিষ্ঠান তথ্য' : 'Organization Info'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {ja ? '組織名' : bn ? 'প্রতিষ্ঠানের নাম' : 'Organization Name'}
                </label>
                <input className={inputCls} placeholder={ja ? '例: Asia Education Partners' : bn ? 'যেমন: Asia Education Partners' : 'e.g. Asia Education Partners'} value={form.organization_name} onChange={e => set('organization_name', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {ja ? '役職' : bn ? 'পদবি' : 'Your Designation'}
                </label>
                <input className={inputCls} placeholder={ja ? '例: 地域ディレクター' : bn ? 'যেমন: রিজিওনাল ডিরেক্টর' : 'e.g. Regional Director'} value={form.designation} onChange={e => set('designation', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {ja ? 'ウェブサイト' : bn ? 'ওয়েবসাইট' : 'Website'}
                </label>
                <input type="url" className={inputCls} placeholder="https://yourorg.com" value={form.website} onChange={e => set('website', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Bank Account */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
            🏦 {ja ? '銀行口座' : bn ? 'ব্যাংক অ্যাকাউন্ট' : 'Bank Account'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? '銀行名' : bn ? 'ব্যাংকের নাম' : 'Bank Name'}</label>
              <input className={inputCls} placeholder="Dutch-Bangla Bank" value={form.bank_name} onChange={e => set('bank_name', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? '口座番号' : bn ? 'অ্যাকাউন্ট নম্বর' : 'Account Number'}</label>
              <input className={inputCls} placeholder="XXXXXXXXXXXXXXXX" value={form.bank_account_number} onChange={e => set('bank_account_number', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? '口座名義人' : bn ? 'অ্যাকাউন্টধারীর নাম' : 'Account Holder Name'}</label>
              <input className={inputCls} placeholder={ja ? '口座名義人氏名' : bn ? 'নাম যেমন ব্যাংকে আছে' : 'Name as on bank account'} value={form.bank_account_name} onChange={e => set('bank_account_name', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Mobile Banking */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
            📱 {ja ? 'モバイルバンキング' : bn ? 'মোবাইল ব্যাংকিং' : 'Mobile Banking'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'bkash_number' as const, label: 'bKash' },
              { key: 'nagad_number' as const, label: 'Nagad' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-xs text-slate-500 font-medium shrink-0">+88</span>
                  <input type="tel" className="flex-1 border border-slate-200 rounded-r-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
                    placeholder="01XXXXXXXXX"
                    value={form[key].replace(/^\+88/, '')}
                    onChange={e => set(key, e.target.value ? `+88${e.target.value.replace(/^\+88/, '')}` : '')}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {ja ? '少なくとも1つの支払い方法を登録することをお勧めします。' : bn ? 'কমিশন পেতে অন্তত একটি পেমেন্ট পদ্ধতি যোগ করুন।' : 'Add at least one payment method to receive commission payouts.'}
          </p>
        </div>

        {/* Error / Success */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <span>⚠️</span> {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
            ✓ {ja ? 'プロフィールを保存しました。' : bn ? 'প্রোফাইল সংরক্ষিত হয়েছে।' : 'Profile saved successfully.'}
          </div>
        )}

        <button type="submit" disabled={mutation.isPending}
          className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
            mutation.isPending ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm'
          }`}>
          {mutation.isPending
            ? (ja ? '保存中...' : bn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
            : (ja ? 'プロフィールを保存' : bn ? 'প্রোফাইল সেভ করুন' : 'Save Profile')}
        </button>
      </form>
    </DashboardLayout>
  );
}
