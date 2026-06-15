'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/context/LanguageContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { CountryData } from '@/hooks/useCountryData';

const inputCls = 'border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white';

const VISA_CATEGORIES = [
  { key: 'student_visa',  en: 'Student Visa',   ja: '学生ビザ',     bn: 'স্টুডেন্ট ভিসা' },
  { key: 'work_visa',     en: 'Work Visa',       ja: '就労ビザ',     bn: 'ওয়ার্ক ভিসা' },
  { key: 'business_visa', en: 'Business Visa',   ja: 'ビジネスビザ', bn: 'বিজনেস ভিসা' },
  { key: 'visitor_visa',  en: 'Visitor Visa',    ja: '観光ビザ',     bn: 'ভিজিটর ভিসা' },
];
type InstitutionFees = Record<string, Record<string, string>>;

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const { lang } = useLang();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const isAdmin = user?.roles?.some(r => r === 'admin' || r === 'super_admin');
  useEffect(() => {
    if (user && !isAdmin) router.replace('/dashboard');
  }, [user, isAdmin, router]);

  const [countries, setCountries] = useState<CountryData>({});
  const [referralFees, setReferralFees] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newCountry, setNewCountry] = useState('');
  const [newCities, setNewCities] = useState<Record<string, string>>({});
  const [saveOk, setSaveOk] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [feesSaveOk, setFeesSaveOk] = useState(false);
  const [feesSaveErr, setFeesSaveErr] = useState('');
  const [instFees, setInstFees] = useState<InstitutionFees>({});
  const [instFeesSaveOk, setInstFeesSaveOk] = useState(false);
  const [instFeesSaveErr, setInstFeesSaveErr] = useState('');

  const { data, isLoading } = useQuery<{ target_countries: CountryData; referral_fees?: Record<string, number>; institution_referral_fees?: Record<string, Record<string, number>> }>({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then(r => r.data),
    enabled: !!isAdmin,
  });

  useEffect(() => {
    if (data) {
      setCountries(data.target_countries ?? {});
      const fees = data.referral_fees ?? {};
      const feesStr: Record<string, string> = {};
      for (const k of Object.keys(fees)) feesStr[k] = String(fees[k]);
      setReferralFees(feesStr);

      // Institution fees: convert numbers to strings for inputs
      const iFeesRaw = data.institution_referral_fees ?? {};
      const iFeesStr: InstitutionFees = {};
      for (const country of Object.keys(iFeesRaw)) {
        iFeesStr[country] = {};
        for (const visa of Object.keys(iFeesRaw[country])) {
          iFeesStr[country][visa] = String(iFeesRaw[country][visa]);
        }
      }
      setInstFees(iFeesStr);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => api.patch('/admin/settings', { target_countries: countries }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['public-countries'] });
      setSaveOk(true);
      setSaveErr('');
      setTimeout(() => setSaveOk(false), 3000);
    },
    onError: () => setSaveErr(ja ? '保存に失敗しました。' : bn ? 'সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to save.'),
  });

  const saveFees = useMutation({
    mutationFn: () => {
      const fees: Record<string, number> = {};
      for (const [k, v] of Object.entries(referralFees)) {
        const n = parseInt(v, 10);
        if (!isNaN(n) && n > 0) fees[k] = n;
      }
      return api.patch('/admin/settings', { referral_fees: fees });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['public-settings'] });
      setFeesSaveOk(true);
      setFeesSaveErr('');
      setTimeout(() => setFeesSaveOk(false), 3000);
    },
    onError: () => setFeesSaveErr(ja ? '保存に失敗しました。' : bn ? 'সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to save.'),
  });

  const saveInstFees = useMutation({
    mutationFn: () => {
      const fees: Record<string, Record<string, number>> = {};
      for (const [country, visas] of Object.entries(instFees)) {
        fees[country] = {};
        for (const [visa, val] of Object.entries(visas)) {
          const n = parseInt(val, 10);
          if (!isNaN(n) && n > 0) fees[country][visa] = n;
        }
      }
      return api.patch('/admin/settings', { institution_referral_fees: fees });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['public-settings'] });
      setInstFeesSaveOk(true);
      setInstFeesSaveErr('');
      setTimeout(() => setInstFeesSaveOk(false), 3000);
    },
    onError: () => setInstFeesSaveErr(ja ? '保存に失敗しました。' : bn ? 'সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to save.'),
  });

  function setInstFee(country: string, visa: string, val: string) {
    setInstFees(f => ({ ...f, [country]: { ...(f[country] ?? {}), [visa]: val } }));
  }

  function addCountry() {
    const name = newCountry.trim();
    if (!name || countries[name]) return;
    setCountries(c => ({ ...c, [name]: [] }));
    setExpanded(name);
    setNewCountry('');
  }

  function removeCountry(name: string) {
    const label = ja ? `「${name}」を削除しますか？` : bn ? `"${name}" মুছে ফেলবেন?` : `Remove "${name}" and all its cities?`;
    if (!window.confirm(label)) return;
    setCountries(c => { const n = { ...c }; delete n[name]; return n; });
    if (expanded === name) setExpanded(null);
  }

  function addCity(country: string) {
    const city = (newCities[country] ?? '').trim();
    if (!city) return;
    setCountries(c => ({
      ...c,
      [country]: c[country].includes(city) ? c[country] : [...c[country], city],
    }));
    setNewCities(n => ({ ...n, [country]: '' }));
  }

  function removeCity(country: string, city: string) {
    setCountries(c => ({ ...c, [country]: c[country].filter(ci => ci !== city) }));
  }

  if (!user || !isAdmin) return null;

  const countryList = Object.keys(countries);

  return (
    <DashboardLayout title={ja ? '設定' : bn ? 'সেটিংস' : 'Settings'}>
      <div className="max-w-2xl space-y-5">

        {/* ── Target Countries & Cities ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">
              {ja ? '渡航先・都市管理' : bn ? 'গন্তব্য দেশ ও শহর পরিচালনা' : 'Target Countries & Cities'}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {ja
                ? 'ここで追加した国・都市が申請フォームに表示されます。'
                : bn
                ? 'এখানে যোগ করা দেশ ও শহর আবেদন ফর্মে দেখাবে।'
                : 'Countries and cities added here appear in application forms.'}
            </p>
          </div>

          <div className="p-5 space-y-3">
            {isLoading ? (
              <p className="text-xs text-slate-400 text-center py-6">
                {ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}
              </p>
            ) : countryList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                {ja ? '国が追加されていません。' : bn ? 'কোনো দেশ যোগ করা হয়নি।' : 'No countries added yet.'}
              </p>
            ) : (
              countryList.map(country => (
                <div key={country} className="border border-slate-100 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
                    <button
                      onClick={() => setExpanded(e => e === country ? null : country)}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-green-700 transition-colors flex-1 text-left"
                    >
                      <span className="text-slate-400 text-xs">{expanded === country ? '▾' : '▸'}</span>
                      {country}
                      <span className="text-[10px] font-normal text-slate-400 ml-1">
                        ({countries[country].length} {ja ? '都市' : bn ? 'শহর' : 'cities'})
                      </span>
                    </button>
                    <button
                      onClick={() => removeCountry(country)}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 transition-colors"
                    >
                      {ja ? '削除' : bn ? 'মুছুন' : 'Remove'}
                    </button>
                  </div>

                  {expanded === country && (
                    <div className="p-4 border-t border-slate-100">
                      <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
                        {countries[country].length === 0 ? (
                          <span className="text-xs text-slate-400 italic">
                            {ja ? 'まだ都市がありません' : bn ? 'কোনো শহর নেই' : 'No cities yet'}
                          </span>
                        ) : (
                          countries[country].map(city => (
                            <span key={city} className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-medium px-2.5 py-1 rounded-full">
                              {city}
                              <button
                                onClick={() => removeCity(country, city)}
                                className="text-green-400 hover:text-red-500 leading-none transition-colors"
                              >✕</button>
                            </span>
                          ))
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          className={inputCls + ' flex-1'}
                          placeholder={ja ? '都市名を入力' : bn ? 'শহরের নাম লিখুন' : 'City name'}
                          value={newCities[country] ?? ''}
                          onChange={e => setNewCities(n => ({ ...n, [country]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCity(country))}
                        />
                        <button
                          onClick={() => addCity(country)}
                          className="px-3 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-colors"
                        >
                          {ja ? '追加' : bn ? 'যোগ' : 'Add'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            <div className="flex gap-2 pt-1">
              <input
                className={inputCls + ' flex-1 disabled:opacity-40'}
                placeholder={ja ? '新しい国名 (例: South Korea)' : bn ? 'নতুন দেশের নাম' : 'New country name (e.g. South Korea)'}
                value={newCountry}
                onChange={e => setNewCountry(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCountry())}
                disabled={isLoading}
              />
              <button
                onClick={addCountry}
                disabled={isLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap disabled:opacity-40"
              >
                {ja ? '+ 国を追加' : bn ? '+ দেশ যোগ' : '+ Add country'}
              </button>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending || isLoading}
              className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors"
            >
              {save.isPending
                ? (ja ? '保存中...' : bn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                : (ja ? '変更を保存する' : bn ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save changes')}
            </button>
            {saveOk && <span className="text-xs text-green-700 font-semibold">✓ {ja ? '保存しました' : bn ? 'সংরক্ষিত হয়েছে' : 'Saved'}</span>}
            {saveErr && <span className="text-xs text-red-500">{saveErr}</span>}
          </div>
        </div>

        {/* ── Referral Fee Settings ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">
              {ja ? '紹介料設定（国別）' : bn ? 'রেফারেল ফি সেটিংস (দেশ অনুযায়ী)' : 'Referral Fee by Country'}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {ja
                ? '各国への紹介が成功した場合に支払うコミッション金額を設定します。'
                : bn
                ? 'প্রতিটি দেশে সফল রেফারেলের জন্য কত টাকা কমিশন দেওয়া হবে তা সেট করুন।'
                : 'Set the commission amount paid per successful referral for each destination country.'}
            </p>
          </div>

          <div className="p-5">
            {isLoading ? (
              <p className="text-xs text-slate-400 text-center py-6">
                {ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}
              </p>
            ) : countryList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                {ja ? '先に国を追加してください。' : bn ? 'আগে দেশ যোগ করুন।' : 'Add countries above first.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-slate-100">
                      <th className="pb-2 text-xs font-semibold text-slate-500 pr-4">
                        {ja ? '国' : bn ? 'দেশ' : 'Country'}
                      </th>
                      <th className="pb-2 text-xs font-semibold text-slate-500">
                        {ja ? 'コミッション（৳）' : bn ? 'কমিশন (৳)' : 'Commission (৳)'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {countryList.map(country => (
                      <tr key={country}>
                        <td className="py-2.5 pr-4 font-medium text-slate-700">{country}</td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-sm">৳</span>
                            <input
                              type="number"
                              min="0"
                              step="500"
                              className={inputCls + ' w-36 py-1.5'}
                              placeholder="0"
                              value={referralFees[country] ?? ''}
                              onChange={e => setReferralFees(f => ({ ...f, [country]: e.target.value }))}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
            <button
              onClick={() => saveFees.mutate()}
              disabled={saveFees.isPending || isLoading || countryList.length === 0}
              className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors"
            >
              {saveFees.isPending
                ? (ja ? '保存中...' : bn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                : (ja ? 'フィーを保存する' : bn ? 'ফি সংরক্ষণ করুন' : 'Save Fees')}
            </button>
            {feesSaveOk && <span className="text-xs text-green-700 font-semibold">✓ {ja ? '保存しました' : bn ? 'সংরক্ষিত হয়েছে' : 'Saved'}</span>}
            {feesSaveErr && <span className="text-xs text-red-500">{feesSaveErr}</span>}
          </div>
        </div>

        {/* ── Institution Referral Fee Matrix ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">
              {ja ? '機関紹介料（国別・ビザ種別）' : bn ? 'ইনস্টিটিউশন রেফারেল ফি (দেশ × ভিসা ক্যাটাগরি)' : 'Institution Referral Fee (Country × Visa Category)'}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {ja
                ? '機関が紹介した各国・ビザ種別ごとの手数料を設定します。'
                : bn
                ? 'ইনস্টিটিউশন রেফারেলের জন্য প্রতিটি দেশ ও ভিসা ক্যাটাগরি অনুযায়ী ফি নির্ধারণ করুন।'
                : 'Set the commission paid to institutions per successful referral, by country and visa category.'}
            </p>
          </div>

          <div className="p-5">
            {isLoading ? (
              <p className="text-xs text-slate-400 text-center py-6">
                {ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}
              </p>
            ) : countryList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                {ja ? '先に国を追加してください。' : bn ? 'আগে দেশ যোগ করুন।' : 'Add countries above first.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 border border-slate-100 min-w-[110px]">
                        {ja ? '国 / ビザ' : bn ? 'দেশ / ভিসা' : 'Country / Visa'}
                      </th>
                      {VISA_CATEGORIES.map(v => (
                        <th key={v.key} className="px-3 py-2.5 text-xs font-semibold text-slate-500 border border-slate-100 text-center min-w-[120px]">
                          {ja ? v.ja : bn ? v.bn : v.en}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {countryList.map(country => (
                      <tr key={country} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2.5 font-medium text-slate-700 border border-slate-100 bg-slate-50 text-xs">
                          {country}
                        </td>
                        {VISA_CATEGORIES.map(v => (
                          <td key={v.key} className="px-2 py-2 border border-slate-100 text-center">
                            <div className="flex items-center gap-1 justify-center">
                              <span className="text-slate-400 text-xs shrink-0">৳</span>
                              <input
                                type="number"
                                min="0"
                                step="500"
                                className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                placeholder="0"
                                value={instFees[country]?.[v.key] ?? ''}
                                onChange={e => setInstFee(country, v.key, e.target.value)}
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
            <button
              onClick={() => saveInstFees.mutate()}
              disabled={saveInstFees.isPending || isLoading || countryList.length === 0}
              className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors"
            >
              {saveInstFees.isPending
                ? (ja ? '保存中...' : bn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                : (ja ? '機関料金を保存する' : bn ? 'ইনস্টিটিউশন ফি সংরক্ষণ করুন' : 'Save Institution Fees')}
            </button>
            {instFeesSaveOk && <span className="text-xs text-green-700 font-semibold">✓ {ja ? '保存しました' : bn ? 'সংরক্ষিত হয়েছে' : 'Saved'}</span>}
            {instFeesSaveErr && <span className="text-xs text-red-500">{instFeesSaveErr}</span>}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
