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
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newCountry, setNewCountry] = useState('');
  const [newCities, setNewCities] = useState<Record<string, string>>({});
  const [saveOk, setSaveOk] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const { data, isLoading } = useQuery<{ target_countries: CountryData }>({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then(r => r.data),
    enabled: !!isAdmin,
  });

  useEffect(() => {
    if (data) setCountries(data.target_countries ?? {});
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

      <div className="max-w-2xl">

        {/* ── Target Countries & Cities ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-5">
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
                  {/* Country header */}
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

                  {/* Expanded city editor */}
                  {expanded === country && (
                    <div className="p-4 border-t border-slate-100">
                      {/* City chips */}
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
                              >
                                ✕
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      {/* Add city */}
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

            {/* Add country */}
            <div className="flex gap-2 pt-1">
              <input
                className={inputCls + ' flex-1'}
                placeholder={ja ? '新しい国名 (例: South Korea)' : bn ? 'নতুন দেশের নাম' : 'New country name (e.g. South Korea)'}
                value={newCountry}
                onChange={e => setNewCountry(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCountry())}
              />
              <button
                onClick={addCountry}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
              >
                {ja ? '+ 国を追加' : bn ? '+ দেশ যোগ' : '+ Add country'}
              </button>
            </div>
          </div>

          {/* Save bar */}
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
            {saveOk && (
              <span className="text-xs text-green-700 font-semibold">
                ✓ {ja ? '保存しました' : bn ? 'সংরক্ষিত হয়েছে' : 'Saved'}
              </span>
            )}
            {saveErr && <span className="text-xs text-red-500">{saveErr}</span>}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
