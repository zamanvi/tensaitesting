'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const BLANK = {
  student_name: '', student_email: '', student_phone: '',
  target_country: '', target_course: '', target_intake: '',
  last_education: '', gpa: '',
  jlpt_nat_score: '', jlpt_nat_result_date: '', expected_jlpt_nat_exam_date: '',
  preferred_cities: [] as string[],
  city_type: 'preferred' as 'fixed' | 'preferred',
  fixed_city: '',
  notes: '',
};

const PRESET_CITIES = [
  { en: 'Tokyo', ja: '東京', bn: 'টোকিও' },
  { en: 'Osaka', ja: '大阪', bn: 'ওসাকা' },
  { en: 'Kyoto', ja: '京都', bn: 'কিয়োটো' },
  { en: 'Nagoya', ja: '名古屋', bn: 'নাগোয়া' },
  { en: 'Sapporo', ja: '札幌', bn: 'সাপ্পোরো' },
  { en: 'Fukuoka', ja: '福岡', bn: 'ফুকুওকা' },
  { en: 'Yokohama', ja: '横浜', bn: 'ইয়োকোহামা' },
  { en: 'Kobe', ja: '神戸', bn: 'কোবে' },
  { en: 'Hiroshima', ja: '広島', bn: 'হিরোশিমা' },
  { en: 'Sendai', ja: '仙台', bn: 'সেন্দাই' },
  { en: 'Nara', ja: '奈良', bn: 'নারা' },
  { en: 'Okinawa', ja: '沖縄', bn: 'ওকিনাওয়া' },
];

const EDU_LEVELS = ['SSC', 'HSC', 'Diploma', "Bachelor's", "Master's", 'Other'];

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-slate-400';
const labelCls = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5';

export default function AgencyAddApplicationPage() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const isAgency = user?.gateway_type === 'agency';
  useEffect(() => {
    if (user && !isAgency) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isAgency, router]);

  // Check vetting status — only approved agencies can add
  const { data: profileData } = useQuery({
    queryKey: ['agency-profile'],
    queryFn: () => api.get('/agency/profile').then(r => r.data.profile),
    enabled: !!isAgency,
  });
  const approved = profileData?.vetting_status === 'approved';

  const [form, setForm] = useState({ ...BLANK });
  const [cityInput, setCityInput] = useState('');
  const [savedId, setSavedId] = useState<number | null>(null);
  const [error, setError] = useState('');

  function set<K extends keyof typeof BLANK>(k: K, v: typeof BLANK[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function toggleCity(cityEn: string) {
    setForm(f => ({
      ...f,
      preferred_cities: f.preferred_cities.includes(cityEn)
        ? f.preferred_cities.filter(c => c !== cityEn)
        : [...f.preferred_cities, cityEn],
    }));
  }

  function addCustomCity() {
    const val = cityInput.trim();
    if (val && !form.preferred_cities.includes(val)) {
      setForm(f => ({ ...f, preferred_cities: [...f.preferred_cities, val] }));
    }
    setCityInput('');
  }

  const save = useMutation({
    mutationFn: (payload: typeof BLANK) => api.post('/agency/leads', payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['agency-vault'] });
      setSavedId(res.data?.lead?.id ?? res.data?.id ?? 1);
      setError('');
      setForm({ ...BLANK });
      setCityInput('');
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = err.response?.data?.errors;
      setError(errs ? Object.values(errs).flat().join(' ') : err.response?.data?.message ?? (ja ? '保存に失敗しました。' : bn ? 'সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to save.'));
    },
  });

  if (!user || !isAgency) return null;

  // Not approved guard
  if (profileData && !approved) {
    return (
      <DashboardLayout title={ja ? '申請を追加' : bn ? 'আবেদন যোগ করুন' : 'Add Application'}>
        <div className="max-w-lg mx-auto mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="font-bold text-slate-900 mb-2">
            {ja ? '代理店の承認が必要です' : bn ? 'এজেন্সি অনুমোদন প্রয়োজন' : 'Agency Approval Required'}
          </p>
          <p className="text-sm text-slate-600 mb-4">
            {ja ? 'アプリケーションを追加するには、管理者によるプロフィールの承認が必要です。' : bn ? 'আবেদন যোগ করতে অ্যাডমিন কর্তৃক প্রোফাইল অনুমোদন প্রয়োজন।' : 'Your agency profile must be approved by admin before you can add applications.'}
          </p>
          <Link href="/dashboard/agency/profile" className="inline-block px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-xl transition-colors">
            {ja ? 'プロフィールを確認' : bn ? 'প্রোফাইল দেখুন' : 'View Profile'}
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Success state
  if (savedId) {
    return (
      <DashboardLayout title={ja ? '申請を追加' : bn ? 'আবেদন যোগ করুন' : 'Add Application'}>
        <div className="max-w-lg mx-auto mt-10 bg-white border border-emerald-200 rounded-2xl p-10 text-center shadow-sm">
          <div className="text-5xl mb-4">✅</div>
          <p className="font-bold text-slate-900 text-lg mb-2">
            {ja ? '申請を保存しました！' : bn ? 'আবেদন সংরক্ষিত হয়েছে!' : 'Application Saved!'}
          </p>
          <p className="text-sm text-slate-500 mb-6">
            {ja
              ? '申請は「マイアプリケーション」に下書きとして保存されました。準備ができたら公開してください。'
              : bn
              ? 'আবেদনটি "আমার আবেদন"-এ ড্রাফট হিসেবে সংরক্ষিত হয়েছে। প্রস্তুত হলে পাবলিশ করুন।'
              : 'The application has been saved as a draft in My Applications. Publish it when you\'re ready to submit to admin.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard/agency/vault" className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-xl transition-colors">
              {ja ? 'マイアプリケーションを見る' : bn ? 'আমার আবেদন দেখুন' : 'View My Applications'}
            </Link>
            <button onClick={() => setSavedId(null)} className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:border-slate-300 transition-colors">
              {ja ? 'もう1件追加' : bn ? 'আরো একটি যোগ করুন' : 'Add Another'}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={ja ? '申請を追加' : bn ? 'আবেদন যোগ করুন' : 'Add Application'}>
      <div className="max-w-2xl space-y-5">

        {/* Info banner */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
          <span className="text-lg shrink-0">ℹ️</span>
          <p className="text-xs text-blue-800 leading-relaxed">
            {ja
              ? '学生の申請情報を入力してください。保存後は「マイアプリケーション」に下書きとして保存されます。公開ボタンを押すと管理者の申請ストアに送信されます。'
              : bn
              ? 'শিক্ষার্থীর আবেদনের তথ্য পূরণ করুন। সেভ হলে "আমার আবেদন"-এ ড্রাফট হিসেবে থাকবে। পাবলিশ করলে অ্যাডমিনের আবেদন স্টোরে যাবে।'
              : 'Fill in the student\'s application details below. After saving, it will sit as a draft in My Applications. When ready, publish it to submit to the admin application store.'}
          </p>
        </div>

        {/* ── Student Info ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
            👤 {ja ? '学生情報' : bn ? 'শিক্ষার্থীর তথ্য' : 'Student Information'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>{ja ? '氏名 *' : bn ? 'পূর্ণ নাম *' : 'Full Name *'}</label>
              <input className={inputCls} placeholder={ja ? '例: 田中 花子' : bn ? 'যেমন: রহিম আলী' : 'e.g. Ahmed Rahman'}
                value={form.student_name} onChange={e => set('student_name', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>{ja ? 'メールアドレス *' : bn ? 'ইমেইল *' : 'Email Address *'}</label>
              <input type="email" className={inputCls} placeholder="student@email.com"
                value={form.student_email} onChange={e => set('student_email', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>{ja ? '電話番号' : bn ? 'ফোন নম্বর' : 'Phone Number'}</label>
              <input type="tel" className={inputCls} placeholder="+8801XXXXXXXXX"
                value={form.student_phone} onChange={e => set('student_phone', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>{ja ? '最終学歴' : bn ? 'সর্বশেষ শিক্ষা' : 'Last Education'}</label>
              <select className={inputCls} value={form.last_education} onChange={e => set('last_education', e.target.value)}>
                <option value="">{ja ? '選択...' : bn ? 'বেছে নিন...' : 'Select...'}</option>
                {EDU_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>GPA / {ja ? '成績' : bn ? 'ফলাফল' : 'Result'}</label>
              <input className={inputCls} placeholder={ja ? '例: 4.50 / 5.00' : bn ? 'যেমন: 4.50 / 5.00' : 'e.g. 4.50 / 5.00'}
                value={form.gpa} onChange={e => set('gpa', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Target ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
            🎯 {ja ? '渡航先・コース' : bn ? 'গন্তব্য ও কোর্স' : 'Destination & Course'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{ja ? '渡航先の国 *' : bn ? 'গন্তব্য দেশ *' : 'Target Country *'}</label>
              <input className={inputCls} placeholder={ja ? '例: Japan' : bn ? 'যেমন: Japan' : 'e.g. Japan'}
                value={form.target_country} onChange={e => set('target_country', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>{ja ? '希望コース' : bn ? 'কোর্স' : 'Target Course'}</label>
              <input className={inputCls} placeholder={ja ? '例: 日本語学校' : bn ? 'যেমন: ভাষা কোর্স' : 'e.g. Language School'}
                value={form.target_course} onChange={e => set('target_course', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>{ja ? '希望入学時期' : bn ? 'ইনটেক তারিখ' : 'Target Intake Date'}</label>
              <input type="date" className={inputCls}
                value={form.target_intake} onChange={e => set('target_intake', e.target.value)} />
            </div>
          </div>

          {/* City preference */}
          <div className="mt-4">
            <label className={labelCls}>{ja ? '都市の希望タイプ' : bn ? 'শহর পছন্দের ধরন' : 'City Preference Type'}</label>
            <div className="flex gap-3 mb-4">
              {[
                { k: 'preferred', en: 'Preferred City (flexible)', ja: '希望都市（柔軟）', bn: 'পছন্দের শহর (নমনীয়)' },
                { k: 'fixed',     en: 'Fixed City (exact match)', ja: '固定都市（完全一致）', bn: 'নির্দিষ্ট শহর (সঠিক মিল)' },
              ].map(opt => (
                <button key={opt.k} type="button"
                  onClick={() => set('city_type', opt.k as 'fixed' | 'preferred')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                    form.city_type === opt.k
                      ? opt.k === 'fixed' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                  {ja ? opt.ja : bn ? opt.bn : opt.en}
                </button>
              ))}
            </div>

            {form.city_type === 'fixed' ? (
              <div>
                <label className={labelCls}>{ja ? '固定都市名 *' : bn ? 'নির্দিষ্ট শহর *' : 'Fixed City *'}</label>
                <input className={inputCls}
                  placeholder={ja ? '例: Tokyo' : bn ? 'যেমন: Tokyo' : 'e.g. Tokyo'}
                  value={form.fixed_city} onChange={e => set('fixed_city', e.target.value)} />
                <p className="text-[11px] text-red-500 mt-1.5">
                  {ja ? '固定都市の申請はその都市の機関にのみ表示されます。' : bn ? 'ফিক্সড সিটি আবেদন শুধুমাত্র সেই শহরের প্রতিষ্ঠানকে দেখাবে।' : 'Fixed city applications will only show to institutions in that exact city.'}
                </p>
              </div>
            ) : (
              <div>
                <label className={labelCls}>{ja ? '希望都市（複数選択可）' : bn ? 'পছন্দের শহর (একাধিক)' : 'Preferred Cities (select multiple)'}</label>
                {form.preferred_cities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {form.preferred_cities.map((c, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                        {c}
                        <button type="button" onClick={() => setForm(f => ({ ...f, preferred_cities: f.preferred_cities.filter((_, idx) => idx !== i) }))} className="opacity-70 hover:opacity-100 text-sm leading-none">×</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mb-3">
                  {PRESET_CITIES.map(city => {
                    const label = ja ? city.ja : bn ? city.bn : city.en;
                    const sel = form.preferred_cities.includes(city.en);
                    return (
                      <button key={city.en} type="button" onClick={() => toggleCity(city.en)}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                          sel ? 'bg-green-50 border-green-400 text-green-700' : 'bg-white border-slate-200 text-slate-600 hover:border-green-300'
                        }`}>
                        <span className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center ${sel ? 'bg-green-600 border-green-600' : 'border-slate-300'}`}>
                          {sel && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </span>
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input className={inputCls} placeholder={ja ? '他の都市を追加...' : bn ? 'অন্য শহর যোগ করুন...' : 'Add other city...'}
                    value={cityInput} onChange={e => setCityInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomCity(); } }} />
                  <button type="button" onClick={addCustomCity} className="shrink-0 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors">
                    {ja ? '追加' : bn ? 'যোগ' : 'Add'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── JLPT / NAT ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
            📝 JLPT / NAT {ja ? '情報' : bn ? 'তথ্য' : 'Information'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>{ja ? 'JLPT / NATスコア' : bn ? 'JLPT / NAT স্কোর' : 'JLPT / NAT Score'}</label>
              <input className={inputCls} placeholder={ja ? '例: N3, NAT 3級, N2合格' : bn ? 'যেমন: N3, NAT 3級' : 'e.g. N3, NAT 3級, Passed N2'}
                value={form.jlpt_nat_score} onChange={e => set('jlpt_nat_score', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>{ja ? '結果発表日' : bn ? 'ফলাফল প্রকাশের তারিখ' : 'Result Publish Date'}</label>
              <input type="date" className={inputCls}
                value={form.jlpt_nat_result_date} onChange={e => set('jlpt_nat_result_date', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>{ja ? '予定受験日' : bn ? 'প্রত্যাশিত পরীক্ষার তারিখ' : 'Expected Exam Date'}</label>
              <input type="date" className={inputCls}
                value={form.expected_jlpt_nat_exam_date} onChange={e => set('expected_jlpt_nat_exam_date', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Notes ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
            📌 {ja ? '備考・メモ' : bn ? 'নোট / মন্তব্য' : 'Notes / Remarks'}
          </h3>
          <textarea className={`${inputCls} resize-none`} rows={3}
            placeholder={ja ? 'エージェント用メモ（管理者にのみ表示されます）' : bn ? 'এজেন্সির নোট (শুধুমাত্র অ্যাডমিন দেখবেন)' : 'Internal notes for admin (not visible to student or institutions)'}
            value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">⚠️ {error}</div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={() => { setError(''); save.mutate(form); }}
            disabled={save.isPending || !form.student_name.trim() || !form.student_email.trim() || !form.target_country.trim()}
            className="flex-1 py-3.5 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {save.isPending
              ? (ja ? '保存中...' : bn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
              : (ja ? '下書きとして保存する' : bn ? 'ড্রাফট হিসেবে সেভ করুন' : 'Save as Draft')}
          </button>
          <Link href="/dashboard/agency/vault"
            className="px-5 py-3.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:border-slate-300 text-center transition-colors">
            {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
