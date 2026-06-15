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
const cellInput = 'w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-green-500 bg-white';

const VISA_CATEGORIES = [
  { key: 'student_visa',  en: 'Student Visa',   ja: '学生ビザ',     bn: 'স্টুডেন্ট ভিসা' },
  { key: 'work_visa',     en: 'Work Visa',       ja: '就労ビザ',     bn: 'ওয়ার্ক ভিসা' },
  { key: 'business_visa', en: 'Business Visa',   ja: 'ビジネスビザ', bn: 'বিজনেস ভিসা' },
  { key: 'visitor_visa',  en: 'Visitor Visa',    ja: '観光ビザ',     bn: 'ভিজিটর ভিসা' },
];

interface FeeRow {
  id: number;
  country: string;
  visa_category: string;
  intake: string;
  service_charge: string;
  student_commission: string;
  institution_commission: string;
}

const blankRow: Omit<FeeRow, 'id'> = {
  country: '',
  visa_category: 'student_visa',
  intake: '',
  service_charge: '',
  student_commission: '',
  institution_commission: '',
};

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

  // ── Countries & Cities ─────────────────────────────────────────────────
  const [countries, setCountries] = useState<CountryData>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newCountry, setNewCountry] = useState('');
  const [newCities, setNewCities] = useState<Record<string, string>>({});
  const [saveOk, setSaveOk] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  // ── Fee Schedule ───────────────────────────────────────────────────────
  const [feeRows, setFeeRows] = useState<FeeRow[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRow, setNewRow] = useState<Omit<FeeRow, 'id'>>({ ...blankRow });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<FeeRow | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [feeSaveOk, setFeeSaveOk] = useState(false);
  const [feeSaveErr, setFeeSaveErr] = useState('');
  const [nextId, setNextId] = useState(1000); // client-side temp id for new rows

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then(r => r.data),
    enabled: !!isAdmin,
  });

  useEffect(() => {
    if (!data) return;
    setCountries(data.target_countries ?? {});

    // Load fee_schedules array
    const schedules: FeeRow[] = (data.fee_schedules ?? []).map((r: Omit<FeeRow, 'id'> & { id?: number }, i: number) => ({
      id: r.id ?? i,
      country: r.country ?? '',
      visa_category: r.visa_category ?? 'student_visa',
      intake: r.intake ?? '',
      service_charge: String(r.service_charge ?? ''),
      student_commission: String(r.student_commission ?? ''),
      institution_commission: String(r.institution_commission ?? ''),
    }));
    setFeeRows(schedules);
    if (schedules.length > 0) {
      setNextId(Math.max(...schedules.map(r => r.id)) + 1);
    }
  }, [data]);

  // ── Countries mutations ────────────────────────────────────────────────
  const saveCountries = useMutation({
    mutationFn: () => api.patch('/admin/settings', { target_countries: countries }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['public-countries'] });
      setSaveOk(true); setSaveErr('');
      setTimeout(() => setSaveOk(false), 3000);
    },
    onError: () => setSaveErr(ja ? '保存に失敗しました。' : bn ? 'সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to save.'),
  });

  // ── Fee Schedule mutations ─────────────────────────────────────────────
  const saveFeeSchedule = useMutation({
    mutationFn: (rows: FeeRow[]) => {
      const payload = rows.map(r => ({
        id: r.id,
        country: r.country,
        visa_category: r.visa_category,
        intake: r.intake,
        service_charge: parseFloat(r.service_charge) || 0,
        student_commission: parseFloat(r.student_commission) || 0,
        institution_commission: parseFloat(r.institution_commission) || 0,
      }));
      return api.patch('/admin/settings', { fee_schedules: payload });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['public-settings'] });
      setFeeSaveOk(true); setFeeSaveErr('');
      setTimeout(() => setFeeSaveOk(false), 3000);
    },
    onError: () => setFeeSaveErr(ja ? '保存に失敗しました。' : bn ? 'সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to save.'),
  });

  // ── Countries helpers ──────────────────────────────────────────────────
  const countryList = Object.keys(countries);

  function addCountry() {
    const name = newCountry.trim();
    if (!name || countries[name]) return;
    setCountries(c => ({ ...c, [name]: [] }));
    setExpanded(name);
    setNewCountry('');
  }

  function removeCountry(name: string) {
    if (!window.confirm(ja ? `「${name}」を削除しますか？` : bn ? `"${name}" মুছবেন?` : `Remove "${name}" and all its cities?`)) return;
    setCountries(c => { const n = { ...c }; delete n[name]; return n; });
    if (expanded === name) setExpanded(null);
  }

  function addCity(country: string) {
    const city = (newCities[country] ?? '').trim();
    if (!city) return;
    setCountries(c => ({ ...c, [country]: c[country].includes(city) ? c[country] : [...c[country], city] }));
    setNewCities(n => ({ ...n, [country]: '' }));
  }

  function removeCity(country: string, city: string) {
    setCountries(c => ({ ...c, [country]: c[country].filter(ci => ci !== city) }));
  }

  // ── Fee row helpers ────────────────────────────────────────────────────
  function addRow() {
    if (!newRow.country || !newRow.intake) return;
    const row: FeeRow = { ...newRow, id: nextId };
    const updated = [...feeRows, row];
    setFeeRows(updated);
    setNextId(n => n + 1);
    setNewRow({ ...blankRow });
    setShowAddForm(false);
    saveFeeSchedule.mutate(updated);
  }

  function startEdit(row: FeeRow) {
    setEditingId(row.id);
    setEditRow({ ...row });
  }

  function saveEdit() {
    if (!editRow) return;
    const updated = feeRows.map(r => r.id === editRow.id ? editRow : r);
    setFeeRows(updated);
    setEditingId(null);
    setEditRow(null);
    saveFeeSchedule.mutate(updated);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditRow(null);
  }

  function deleteRow(id: number) {
    const updated = feeRows.filter(r => r.id !== id);
    setFeeRows(updated);
    setDeletingId(null);
    saveFeeSchedule.mutate(updated);
  }

  function visaLabel(key: string) {
    const v = VISA_CATEGORIES.find(c => c.key === key);
    if (!v) return key;
    return ja ? v.ja : bn ? v.bn : v.en;
  }

  if (!user || !isAdmin) return null;

  return (
    <DashboardLayout title={ja ? '設定' : bn ? 'সেটিংস' : 'Settings'}>
      <div className="max-w-5xl space-y-6">

        {/* ── Target Countries & Cities ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">
              {ja ? '渡航先・都市管理' : bn ? 'গন্তব্য দেশ ও শহর' : 'Target Countries & Cities'}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {ja ? 'ここで追加した国・都市が申請フォームに表示されます。' : bn ? 'এখানে যোগ করা দেশ ও শহর আবেদন ফর্মে দেখাবে।' : 'Countries and cities added here appear in application forms.'}
            </p>
          </div>

          <div className="p-5 space-y-3">
            {isLoading ? (
              <p className="text-xs text-slate-400 text-center py-6">{ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}</p>
            ) : countryList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">{ja ? '国が追加されていません。' : bn ? 'কোনো দেশ যোগ করা হয়নি।' : 'No countries added yet.'}</p>
            ) : countryList.map(country => (
              <div key={country} className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
                  <button
                    onClick={() => setExpanded(e => e === country ? null : country)}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-green-700 transition-colors flex-1 text-left"
                  >
                    <span className="text-slate-400 text-xs">{expanded === country ? '▾' : '▸'}</span>
                    {country}
                    <span className="text-[10px] font-normal text-slate-400 ml-1">({countries[country].length} {ja ? '都市' : bn ? 'শহর' : 'cities'})</span>
                  </button>
                  <button onClick={() => removeCountry(country)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 transition-colors">
                    {ja ? '削除' : bn ? 'মুছুন' : 'Remove'}
                  </button>
                </div>
                {expanded === country && (
                  <div className="p-4 border-t border-slate-100">
                    <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
                      {countries[country].length === 0
                        ? <span className="text-xs text-slate-400 italic">{ja ? 'まだ都市がありません' : bn ? 'কোনো শহর নেই' : 'No cities yet'}</span>
                        : countries[country].map(city => (
                          <span key={city} className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-medium px-2.5 py-1 rounded-full">
                            {city}
                            <button onClick={() => removeCity(country, city)} className="text-green-400 hover:text-red-500 leading-none transition-colors">✕</button>
                          </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        className={inputCls + ' flex-1'}
                        placeholder={ja ? '都市名を入力' : bn ? 'শহরের নাম লিখুন' : 'City name'}
                        value={newCities[country] ?? ''}
                        onChange={e => setNewCities(n => ({ ...n, [country]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCity(country))}
                      />
                      <button onClick={() => addCity(country)} className="px-3 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-colors">
                        {ja ? '追加' : bn ? 'যোগ' : 'Add'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="flex gap-2 pt-1">
              <input
                className={inputCls + ' flex-1'}
                placeholder={ja ? '新しい国名 (例: South Korea)' : bn ? 'নতুন দেশের নাম' : 'New country (e.g. South Korea)'}
                value={newCountry}
                onChange={e => setNewCountry(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCountry())}
                disabled={isLoading}
              />
              <button onClick={addCountry} disabled={isLoading} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap disabled:opacity-40">
                {ja ? '+ 国を追加' : bn ? '+ দেশ যোগ' : '+ Add country'}
              </button>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
            <button
              onClick={() => saveCountries.mutate()}
              disabled={saveCountries.isPending || isLoading}
              className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors"
            >
              {saveCountries.isPending ? (ja ? '保存中...' : bn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (ja ? '変更を保存する' : bn ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save changes')}
            </button>
            {saveOk && <span className="text-xs text-green-700 font-semibold">✓ {ja ? '保存しました' : bn ? 'সংরক্ষিত হয়েছে' : 'Saved'}</span>}
            {saveErr && <span className="text-xs text-red-500">{saveErr}</span>}
          </div>
        </div>

        {/* ── Fee Schedule Matrix ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                {ja ? '料金スケジュール（国別・ビザ別・期別）' : bn ? 'ফি সময়সূচি (দেশ × ভিসা × ইনটেক)' : 'Fee Schedule (Country × Visa × Intake)'}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {ja
                  ? 'サービス料、学生アフィリエイトと機関アフィリエイトのコミッションを国・ビザ種別・期間ごとに設定します。'
                  : bn
                  ? 'প্রতিটি দেশ, ভিসা ক্যাটাগরি ও ইনটেক অনুযায়ী সার্ভিস চার্জ এবং উভয় চ্যানেলের কমিশন সেট করুন।'
                  : 'Set service charge and affiliate commissions for both channels per country, visa type, and intake period.'}
              </p>
            </div>
            {!showAddForm && (
              <button
                onClick={() => { setShowAddForm(true); setNewRow({ ...blankRow, country: countryList[0] ?? '' }); }}
                className="shrink-0 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                + {ja ? '行を追加' : bn ? 'সারি যোগ করুন' : 'Add Row'}
              </button>
            )}
          </div>

          {/* Add new row form */}
          {showAddForm && (
            <div className="p-5 bg-green-50 border-b border-green-100">
              <p className="text-xs font-bold text-slate-700 mb-3">
                {ja ? '新しい料金行を追加' : bn ? 'নতুন ফি সারি যোগ করুন' : 'Add New Fee Row'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    {ja ? '国 *' : bn ? 'দেশ *' : 'Country *'}
                  </label>
                  <select
                    className={inputCls + ' w-full'}
                    value={newRow.country}
                    onChange={e => setNewRow(r => ({ ...r, country: e.target.value }))}
                  >
                    <option value="">{ja ? '選択...' : bn ? 'বেছে নিন...' : 'Select...'}</option>
                    {countryList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    {ja ? 'ビザ種別 *' : bn ? 'ভিসা ক্যাটাগরি *' : 'Visa Category *'}
                  </label>
                  <select
                    className={inputCls + ' w-full'}
                    value={newRow.visa_category}
                    onChange={e => setNewRow(r => ({ ...r, visa_category: e.target.value }))}
                  >
                    {VISA_CATEGORIES.map(v => (
                      <option key={v.key} value={v.key}>{ja ? v.ja : bn ? v.bn : v.en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    {ja ? '期間・インテーク *' : bn ? 'ইনটেক / সময়কাল *' : 'Intake / Period *'}
                  </label>
                  <input
                    className={inputCls + ' w-full'}
                    placeholder={ja ? '例: April 2025' : bn ? 'যেমন: April 2025' : 'e.g. April 2025'}
                    value={newRow.intake}
                    onChange={e => setNewRow(r => ({ ...r, intake: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    {ja ? 'サービス料 (৳)' : bn ? 'সার্ভিস চার্জ (৳)' : 'Service Charge (৳)'}
                  </label>
                  <input
                    type="number" min="0" step="500"
                    className={inputCls + ' w-full'}
                    placeholder="0"
                    value={newRow.service_charge}
                    onChange={e => setNewRow(r => ({ ...r, service_charge: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    {ja ? '学生アフィリエイト (৳)' : bn ? 'স্টুডেন্ট কমিশন (৳)' : 'Student Affiliate (৳)'}
                  </label>
                  <input
                    type="number" min="0" step="500"
                    className={inputCls + ' w-full'}
                    placeholder="0"
                    value={newRow.student_commission}
                    onChange={e => setNewRow(r => ({ ...r, student_commission: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    {ja ? '機関アフィリエイト (৳)' : bn ? 'ইনস্টিটিউশন কমিশন (৳)' : 'Institution Affiliate (৳)'}
                  </label>
                  <input
                    type="number" min="0" step="500"
                    className={inputCls + ' w-full'}
                    placeholder="0"
                    value={newRow.institution_commission}
                    onChange={e => setNewRow(r => ({ ...r, institution_commission: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addRow}
                  disabled={!newRow.country || !newRow.intake || saveFeeSchedule.isPending}
                  className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {saveFeeSchedule.isPending ? '...' : (ja ? '追加する' : bn ? 'যোগ করুন' : 'Add Row')}
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setNewRow({ ...blankRow }); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors"
                >
                  {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">{ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}</div>
            ) : feeRows.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-sm font-medium text-slate-500 mb-1">
                  {ja ? '料金行がまだありません' : bn ? 'এখনো কোনো ফি সারি নেই' : 'No fee rows yet'}
                </p>
                <p className="text-xs text-slate-400">
                  {ja ? '「行を追加」ボタンから追加してください。' : bn ? '"সারি যোগ করুন" বোতাম দিয়ে শুরু করুন।' : 'Click "Add Row" above to get started.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {ja ? '国' : bn ? 'দেশ' : 'Country'}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {ja ? 'ビザ種別' : bn ? 'ভিসা' : 'Visa Type'}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {ja ? '期間・インテーク' : bn ? 'ইনটেক' : 'Intake / Period'}
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-blue-600 whitespace-nowrap">
                      {ja ? 'サービス料 ৳' : bn ? 'সার্ভিস চার্জ ৳' : 'Service Charge ৳'}
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-indigo-600 whitespace-nowrap">
                      {ja ? '学生アフィリエイト ৳' : bn ? 'স্টুডেন্ট কমিশন ৳' : 'Student Affiliate ৳'}
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-amber-600 whitespace-nowrap">
                      {ja ? '機関アフィリエイト ৳' : bn ? 'ইনস্টিটিউশন কমিশন ৳' : 'Institution Affiliate ৳'}
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 whitespace-nowrap">
                      {ja ? '操作' : bn ? 'অ্যাকশন' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {feeRows.map(row => {
                    const isEditing = editingId === row.id;
                    const r = isEditing && editRow ? editRow : row;
                    return (
                      <tr key={row.id} className={`hover:bg-slate-50 transition-colors ${isEditing ? 'bg-green-50/40' : ''}`}>
                        {/* Country */}
                        <td className="px-4 py-3 font-semibold text-slate-800 text-sm whitespace-nowrap">
                          {isEditing ? (
                            <select className={cellInput} value={r.country} onChange={e => setEditRow(er => er ? { ...er, country: e.target.value } : er)}>
                              {countryList.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          ) : row.country}
                        </td>
                        {/* Visa */}
                        <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">
                          {isEditing ? (
                            <select className={cellInput} value={r.visa_category} onChange={e => setEditRow(er => er ? { ...er, visa_category: e.target.value } : er)}>
                              {VISA_CATEGORIES.map(v => <option key={v.key} value={v.key}>{ja ? v.ja : bn ? v.bn : v.en}</option>)}
                            </select>
                          ) : visaLabel(row.visa_category)}
                        </td>
                        {/* Intake */}
                        <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">
                          {isEditing ? (
                            <input className={cellInput + ' text-left'} value={r.intake} onChange={e => setEditRow(er => er ? { ...er, intake: e.target.value } : er)} />
                          ) : (
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-semibold">{row.intake}</span>
                          )}
                        </td>
                        {/* Service charge */}
                        <td className="px-3 py-3 text-center">
                          {isEditing ? (
                            <input type="number" min="0" step="500" className={cellInput} value={r.service_charge} onChange={e => setEditRow(er => er ? { ...er, service_charge: e.target.value } : er)} />
                          ) : (
                            <span className="font-semibold text-blue-700">৳{Number(row.service_charge || 0).toLocaleString()}</span>
                          )}
                        </td>
                        {/* Student commission */}
                        <td className="px-3 py-3 text-center">
                          {isEditing ? (
                            <input type="number" min="0" step="500" className={cellInput} value={r.student_commission} onChange={e => setEditRow(er => er ? { ...er, student_commission: e.target.value } : er)} />
                          ) : (
                            <span className="font-semibold text-indigo-700">৳{Number(row.student_commission || 0).toLocaleString()}</span>
                          )}
                        </td>
                        {/* Institution commission */}
                        <td className="px-3 py-3 text-center">
                          {isEditing ? (
                            <input type="number" min="0" step="500" className={cellInput} value={r.institution_commission} onChange={e => setEditRow(er => er ? { ...er, institution_commission: e.target.value } : er)} />
                          ) : (
                            <span className="font-semibold text-amber-700">৳{Number(row.institution_commission || 0).toLocaleString()}</span>
                          )}
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 items-center">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={saveEdit}
                                  disabled={saveFeeSchedule.isPending}
                                  className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {saveFeeSchedule.isPending ? '...' : (ja ? '保存' : bn ? 'সেভ' : 'Save')}
                                </button>
                                <button onClick={cancelEdit} className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg transition-colors">
                                  {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
                                </button>
                              </>
                            ) : deletingId === row.id ? (
                              <>
                                <button onClick={() => deleteRow(row.id)} className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg transition-colors">
                                  {ja ? '確認' : bn ? 'নিশ্চিত' : 'Confirm'}
                                </button>
                                <button onClick={() => setDeletingId(null)} className="px-2 py-1.5 text-[10px] text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg">✕</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEdit(row)} className="px-3 py-1.5 text-[10px] font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors">
                                  {ja ? '編集' : bn ? 'সম্পাদনা' : 'Edit'}
                                </button>
                                <button onClick={() => setDeletingId(row.id)} className="px-2.5 py-1.5 text-[10px] font-semibold text-red-400 hover:text-red-600 border border-red-100 hover:border-red-200 rounded-lg transition-colors">
                                  {ja ? '削除' : bn ? 'মুছুন' : 'Delete'}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          {feeRows.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
              <span className="text-[11px] text-slate-400">
                {feeRows.length} {ja ? '行' : bn ? 'টি সারি' : `row${feeRows.length !== 1 ? 's' : ''}`}
                {' · '}
                {ja ? '各行を編集して即座に保存されます。' : bn ? 'প্রতিটি সারি সম্পাদনা করলে সাথে সাথে সেভ হবে।' : 'Each row saves immediately on edit.'}
              </span>
              {feeSaveOk && <span className="text-xs text-green-700 font-semibold">✓ {ja ? '保存しました' : bn ? 'সংরক্ষিত হয়েছে' : 'Saved'}</span>}
              {feeSaveErr && <span className="text-xs text-red-500">{feeSaveErr}</span>}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
