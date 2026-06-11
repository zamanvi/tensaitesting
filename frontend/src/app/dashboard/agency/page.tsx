'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Lead { id: number; status: string; is_published: boolean }

const EMPTY_FORM = {
  student_name: '', student_email: '', student_phone: '',
  target_country: '', target_course: '', target_intake: '',
  jlpt_nat_score: '', jlpt_nat_result_date: '', expected_jlpt_nat_exam_date: '',
  preferred_cities: [] as string[],
};

export default function AgencyDashboard() {
  const { t, lang } = useLang();      // lang here — not after the guard
  const a = t.agencyDash;
  const ja = lang === 'ja';
  const bn = lang === 'bn';
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const router = useRouter();
  const isAgency = user?.gateway_type === 'agency';

  // All hooks BEFORE any conditional return
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cityInput, setCityInput] = useState('');

  const { data: agencyProfile } = useQuery({
    queryKey: ['agency-profile'],
    queryFn: () => api.get('/agency/profile').then(r => r.data.profile),
    enabled: isAgency,
  });

  const vaultQ = useQuery({
    queryKey: ['agency-vault'],
    queryFn: () => api.get('/agency/leads/private-vault').then(r => r.data),
    staleTime: 30_000,
    enabled: isAgency,
  });

  useEffect(() => {
    if (user && !isAgency) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isAgency, router]);

  const addLead = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) => api.post('/agency/leads', data),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['agency-vault'] });
      setTimeout(() => {
        setShowModal(false);
        setForm(EMPTY_FORM);
        setFormError('');
        setSuccess(false);
      }, 2000);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = e.response?.data?.errors;
      setFormError(errs ? Object.values(errs).flat().join(' ') : e.response?.data?.message || 'Failed to create lead.');
    },
  });

  if (!user) return null;
  if (!isAgency) return null;

  const vaultLeads: Lead[] = Array.isArray(vaultQ.data?.data) ? vaultQ.data.data : Array.isArray(vaultQ.data) ? vaultQ.data : [];
  const activeCount = vaultLeads.filter(l => !['closed', 'enrolled'].includes(l.status)).length;
  const loading = vaultQ.isLoading;

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError('');
    addLead.mutate(form);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setFormError('');
    setSuccess(false);
    setCityInput('');
  };

  const STATS = [
    { label: a.privateVault, value: loading ? '…' : String(vaultLeads.length), icon: '🔒', href: '/dashboard/agency/vault' },
    { label: a.activeLeads, value: loading ? '…' : String(activeCount), icon: '👥', href: '/dashboard/agency/vault' },
    { label: a.commissionsDue, value: '৳0', icon: '💰', href: '#' },
  ];

  // Profile status banner config
  const profileBanners: Record<string, { bg: string; icon: string; title: string; desc: string; cta?: string }> = {
    none:         { bg: 'bg-amber-50 border-amber-300',   icon: '📋', title: ja ? 'プロフィールを完成させてください' : bn ? 'প্রোফাইল পূরণ করুন' : 'Complete Your Agency Profile', desc: ja ? 'プラットフォームへのフルアクセスには審査が必要です。プロフィールを提出してください。' : bn ? 'সম্পূর্ণ অ্যাক্সেসের জন্য প্রোফাইল জমা দিন এবং অনুমোদনের অপেক্ষা করুন।' : 'Submit your profile for admin review to unlock full platform access.', cta: ja ? 'プロフィールを設定する →' : bn ? 'প্রোফাইল সেটআপ করুন →' : 'Set Up Profile →' },
    pending:      { bg: 'bg-blue-50 border-blue-200',     icon: '⏳', title: ja ? 'プロフィール審査中' : bn ? 'প্রোফাইল যাচাই হচ্ছে' : 'Profile Under Review', desc: ja ? '管理者がプロフィールを確認しています。通常24〜48時間かかります。' : bn ? 'অ্যাডমিন প্রোফাইল যাচাই করছেন। সাধারণত ২৪-৪৮ ঘন্টা লাগে।' : 'Admin is reviewing your profile. Usually takes 24–48 hours.' },
    under_review: { bg: 'bg-purple-50 border-purple-200', icon: '\u{1F50D}', title: ja ? '詳細審査中' : bn ? 'বিস্তারিত যাচাই চলছে' : 'Detailed Review In Progress', desc: ja ? '追加確認が行われています。間もなく連絡があります。' : bn ? 'আরও যাচাই চলছে, শীঘ্রই যোগাযোগ করা হবে।' : 'Additional verification in progress. You will be contacted soon.' },
    rejected:     { bg: 'bg-red-50 border-red-200',       icon: '❌', title: ja ? '審査が却下されました' : bn ? 'প্রোফাইল প্রত্যাখ্যাত' : 'Profile Rejected', desc: agencyProfile?.rejection_reason ?? (ja ? '理由についてサポートにお問い合わせください。' : bn ? 'কারণ জানতে সাপোর্টে যোগাযোগ করুন।' : 'Contact support for details.'), cta: ja ? 'プロフィールを修正して再提出 →' : bn ? 'প্রোফাইল সংশোধন করুন →' : 'Revise & Resubmit →' },
  };

  const profileStatus = !agencyProfile ? 'none' : agencyProfile.vetting_status;
  const showBanner = profileStatus !== 'approved';
  const banner = showBanner ? profileBanners[profileStatus] : null;

  return (
    <DashboardLayout>
      {/* Profile status banner */}
      {banner && (
        <div className={`rounded-2xl border p-4 mb-5 flex items-start justify-between gap-3 ${banner.bg}`}>
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">{banner.icon}</span>
            <div>
              <p className="font-bold text-sm text-slate-900">{banner.title}</p>
              <p className="text-xs text-slate-600 mt-0.5">{banner.desc}</p>
            </div>
          </div>
          {banner.cta && (
            <Link href="/dashboard/agency/profile" className="shrink-0 text-xs font-bold text-green-700 hover:text-green-800 whitespace-nowrap">
              {banner.cta}
            </Link>
          )}
        </div>
      )}

      {/* Header row with Add Lead CTA */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div />
        <div className="relative group">
          <button
            onClick={() => { if (profileStatus === 'approved') setShowModal(true); }}
            disabled={profileStatus !== 'approved'}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              profileStatus === 'approved'
                ? 'bg-green-700 hover:bg-green-800 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {a.addLeadBtn}
          </button>
          {profileStatus !== 'approved' && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
              {ja
                ? '代理店が承認されると利用可能になります'
                : bn
                ? 'এজেন্সি অনুমোদিত হলে উপলব্ধ হবে'
                : 'Available once your agency is approved'}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {STATS.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-green-200 transition-all">
            <div className="text-xl mb-2">{s.icon}</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1 leading-tight">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-5 sm:mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900">🔒 {a.privateVault}</h2>
            <Link href="/dashboard/agency/vault" className="text-xs text-green-700 hover:underline">{t.common.viewAll}</Link>
          </div>
          <p className="text-sm text-slate-500 mb-4">{a.vaultDesc}</p>
          {loading ? (
            <div className="text-center py-6 text-slate-300 text-sm">…</div>
          ) : vaultLeads.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">{a.vaultEmpty}</div>
          ) : (
            <div className="space-y-2">
              {vaultLeads.slice(0, 3).map(l => (
                <div key={l.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${l.is_published ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-600'}`}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: l.is_published ? '#16a34a' : '#94a3b8' }} />
                  <span className="flex-1 font-medium">{l.status.replace(/_/g, ' ')}</span>
                  <span>{l.is_published ? '🌐' : '🔒'}</span>
                </div>
              ))}
              {vaultLeads.length > 3 && <p className="text-xs text-slate-400 text-center pt-1">+{vaultLeads.length - 3} more</p>}
            </div>
          )}
        </div>

        </div>
      </div>

      {/* Add Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900 text-base">{a.addLeadTitle}</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
              </div>

              {success ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">✅</div>
                  <div className="font-semibold text-green-700 text-sm">{a.addLeadSuccess}</div>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                    {a.addLeadNote}
                  </div>

                  {formError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">{formError}</div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="text" required
                      placeholder={a.addLeadStudentName}
                      value={form.student_name}
                      onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="email" required
                      placeholder={a.addLeadStudentEmail}
                      value={form.student_email}
                      onChange={e => setForm(f => ({ ...f, student_email: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="tel"
                      placeholder={a.addLeadStudentPhone}
                      value={form.student_phone}
                      onChange={e => setForm(f => ({ ...f, student_phone: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text" required
                      placeholder={a.addLeadCountry}
                      value={form.target_country}
                      onChange={e => setForm(f => ({ ...f, target_country: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder={a.addLeadCourse}
                      value={form.target_course}
                      onChange={e => setForm(f => ({ ...f, target_course: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">{a.addLeadIntake}</label>
                      <input
                        type="date"
                        value={form.target_intake}
                        onChange={e => setForm(f => ({ ...f, target_intake: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    {/* ── JLPT / NAT fields ── */}
                    <div className="border-t border-slate-100 pt-3 mt-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                        {ja ? 'JLPT / NAT 情報' : bn ? 'JLPT / NAT তথ্য' : 'JLPT / NAT Info'}
                      </p>

                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder={ja ? 'JLPT/NATスコア (例: N3, NAT 3級)' : bn ? 'JLPT/NAT স্কোর (যেমন: N3, NAT 3級)' : 'JLPT/NAT Score (e.g. N3, NAT 3級)'}
                          value={form.jlpt_nat_score}
                          onChange={e => setForm(f => ({ ...f, jlpt_nat_score: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />

                        <div>
                          <label className="block text-xs text-slate-500 mb-1">
                            {ja ? 'JLPT/NAT 結果発表日' : bn ? 'JLPT/NAT ফলাফল প্রকাশের তারিখ' : 'JLPT/NAT Result Publish Date'}
                          </label>
                          <input
                            type="date"
                            value={form.jlpt_nat_result_date}
                            onChange={e => setForm(f => ({ ...f, jlpt_nat_result_date: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-slate-500 mb-1">
                            {ja ? '予定JLPT/NAT受験日' : bn ? 'প্রত্যাশিত JLPT/NAT পরীক্ষার তারিখ' : 'Expected JLPT/NAT Exam Date'}
                          </label>
                          <input
                            type="date"
                            value={form.expected_jlpt_nat_exam_date}
                            onChange={e => setForm(f => ({ ...f, expected_jlpt_nat_exam_date: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>

                        {/* Preferred cities — preset + custom */}
                        <div>
                          <label className="block text-xs text-slate-500 mb-2">
                            {ja ? '希望都市（複数選択可）' : bn ? 'পছন্দের শহর (একাধিক বেছে নিন)' : 'Preferred City (select multiple)'}
                          </label>

                          {/* Selected tags */}
                          {form.preferred_cities.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {form.preferred_cities.map((city, i) => (
                                <span key={i} className="inline-flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                                  {city}
                                  <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, preferred_cities: f.preferred_cities.filter((_, idx) => idx !== i) }))}
                                    className="opacity-70 hover:opacity-100 leading-none ml-0.5 text-sm"
                                  >×</button>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Preset city checkboxes */}
                          <div className="grid grid-cols-2 gap-1.5 mb-3">
                            {[
                              { en: 'Tokyo',     ja: '東京',   bn: 'টোকিও' },
                              { en: 'Osaka',     ja: '大阪',   bn: 'ওসাকা' },
                              { en: 'Kyoto',     ja: '京都',   bn: 'কিয়োটো' },
                              { en: 'Nagoya',    ja: '名古屋',  bn: 'নাগোয়া' },
                              { en: 'Sapporo',   ja: '札幌',   bn: 'সাপ্পোরো' },
                              { en: 'Fukuoka',   ja: '福岡',   bn: 'ফুকুওকা' },
                              { en: 'Yokohama',  ja: '横浜',   bn: 'ইয়োকোহামা' },
                              { en: 'Kobe',      ja: '神戸',   bn: 'কোবে' },
                              { en: 'Hiroshima', ja: '広島',   bn: 'হিরোশিমা' },
                              { en: 'Sendai',    ja: '仙台',   bn: 'সেন্দাই' },
                              { en: 'Nara',      ja: '奈良',   bn: 'নারা' },
                              { en: 'Okinawa',   ja: '沖縄',   bn: 'ওকিনাওয়া' },
                            ].map(city => {
                              const label = ja ? city.ja : bn ? city.bn : city.en;
                              const selected = form.preferred_cities.includes(city.en);
                              return (
                                <button
                                  key={city.en}
                                  type="button"
                                  onClick={() => setForm(f => ({
                                    ...f,
                                    preferred_cities: selected
                                      ? f.preferred_cities.filter(c => c !== city.en)
                                      : [...f.preferred_cities, city.en],
                                  }))}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                                    selected
                                      ? 'bg-green-50 border-green-400 text-green-700'
                                      : 'bg-white border-slate-200 text-slate-600 hover:border-green-300 hover:bg-green-50/50'
                                  }`}
                                >
                                  <span className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${selected ? 'bg-green-600 border-green-600 text-white' : 'border-slate-300'}`}>
                                    {selected && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                  </span>
                                  {label}
                                  {ja && city.en !== city.ja && <span className="text-slate-400 text-[10px] ml-auto">{city.en}</span>}
                                </button>
                              );
                            })}
                          </div>

                          {/* Custom city input */}
                          <div className="flex gap-2 border-t border-slate-100 pt-3">
                            <input
                              type="text"
                              value={cityInput}
                              onChange={e => setCityInput(e.target.value)}
                              placeholder={ja ? '他の都市を追加...' : bn ? 'অন্য শহর যোগ করুন...' : 'Add other city...'}
                              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const val = cityInput.trim();
                                  if (val && !form.preferred_cities.includes(val)) {
                                    setForm(f => ({ ...f, preferred_cities: [...f.preferred_cities, val] }));
                                  }
                                  setCityInput('');
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const val = cityInput.trim();
                                if (val && !form.preferred_cities.includes(val)) {
                                  setForm(f => ({ ...f, preferred_cities: [...f.preferred_cities, val] }));
                                  setCityInput('');
                                }
                              }}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                            >
                              {ja ? '追加' : bn ? 'যোগ' : 'Add'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={addLead.isPending}
                        className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        {addLead.isPending ? '…' : a.addLeadSubmit}
                      </button>
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                      >
                        {t.common.cancel}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
