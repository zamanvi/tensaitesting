'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface PlatformLead {
  lead_id: number;
  lead_code: string;
  candidate_id: string;
  target_country: string;
  target_course: string | null;
  target_intake: string | null;
  preferred_cities: string[];
  jlpt_nat_score: string | null;
  gender: string | null;
  nationality: string | null;
  highest_qualification: string | null;
  gpa: number | null;
  passing_year: number | null;
  jlpt_level: string | null;
  nat_level: string | null;
  ielts_score: number | null;
  age: number | null;
  eligibility_score: number;
}

interface ContactForm {
  message: string;
  proposed_course: string;
  proposed_intake: string;
}

const JLPT_OPTIONS = ['N1', 'N2', 'N3', 'N4', 'N5'];
const NAT_OPTIONS  = ['1', '2', '3', '4', '5'];
const CITY_OPTIONS = ['東京', '大阪', '名古屋', '札幌', '福岡', '神戸', '京都', '横浜', '仙台', '広島', '那覇', 'Other'];

const SCORE_COLOR = (s: number) =>
  s >= 80 ? 'bg-emerald-100 text-emerald-700' :
  s >= 60 ? 'bg-green-100 text-green-700' :
  s >= 40 ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-500';

export default function BrowsePlatformLeads() {
  const { lang } = useLang();
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const [filters, setFilters] = useState({
    jlpt_level: '', nat_level: '', min_gpa: '', gender: '', preferred_city: '', target_course: '',
  });
  const [applied, setApplied] = useState(filters);

  const [contactLead, setContactLead]   = useState<PlatformLead | null>(null);
  const [contactForm, setContactForm]   = useState<ContactForm>({ message: '', proposed_course: '', proposed_intake: '' });
  const [contactDone, setContactDone]   = useState('');
  const [contactError, setContactError] = useState('');
  const [sentLeads, setSentLeads]       = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['institution-browse', applied],
    queryFn: () => {
      const params = new URLSearchParams();
      if (applied.jlpt_level)     params.set('jlpt_level',     applied.jlpt_level);
      if (applied.nat_level)      params.set('nat_level',      applied.nat_level);
      if (applied.min_gpa)        params.set('min_gpa',        applied.min_gpa);
      if (applied.gender)         params.set('gender',         applied.gender);
      if (applied.preferred_city) params.set('preferred_city', applied.preferred_city);
      if (applied.target_course)  params.set('target_course',  applied.target_course);
      return api.get(`/institution/students?${params}`).then(r => r.data);
    },
  });

  const contactMutation = useMutation({
    mutationFn: () => api.post(`/institution/contact-request/${contactLead!.lead_id}`, contactForm),
    onSuccess: (res) => {
      setContactDone(res.data.reference ?? '');
      setSentLeads(prev => new Set(prev).add(contactLead!.lead_id));
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setContactError(err.response?.data?.message ?? (ja ? '送信に失敗しました。' : bn ? 'পাঠাতে ব্যর্থ।' : 'Failed to send. Please try again.'));
    },
  });

  const leads: PlatformLead[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  function openContact(lead: PlatformLead) {
    setContactLead(lead);
    setContactForm({ message: '', proposed_course: lead.target_course ?? '', proposed_intake: '' });
    setContactDone('');
    setContactError('');
  }

  function closeContact() {
    setContactLead(null);
    setContactDone('');
    setContactError('');
  }

  function resetFilters() {
    const empty = { jlpt_level: '', nat_level: '', min_gpa: '', gender: '', preferred_city: '', target_course: '' };
    setFilters(empty);
    setApplied(empty);
  }

  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

  return (
    <DashboardLayout title={ja ? '学生プール' : bn ? 'শিক্ষার্থী পুল' : 'Student Pool'}>

      {/* Info banner */}
      <div className="mb-5 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm text-blue-800 flex items-start gap-3">
        <span className="text-xl shrink-0">🏫</span>
        <div>
          <p className="font-semibold">
            {ja ? 'プラットフォームの学生一覧' : bn ? 'প্ল্যাটফর্মের সকল শিক্ষার্থী' : 'All platform students'}
          </p>
          <p className="text-xs text-blue-600 mt-0.5">
            {ja
              ? '興味のある候補者に「Tensaiに連絡」を押すと、管理者が仲介します。個人情報は管理者承認後に開示されます。'
              : bn
              ? 'পছন্দের প্রার্থীতে "Tensai-এ যোগাযোগ" করুন — অ্যাডমিন অনুমোদনের পর ব্যক্তিগত তথ্য প্রকাশ হবে।'
              : 'Contact Tensai for any candidate you\'re interested in — personal details are shared only after admin approval.'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <select className={inputCls} value={filters.jlpt_level}
            onChange={e => setFilters(f => ({ ...f, jlpt_level: e.target.value }))}>
            <option value="">{ja ? 'JLPT全て' : bn ? 'সব JLPT' : 'All JLPT'}</option>
            {JLPT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <select className={inputCls} value={filters.nat_level}
            onChange={e => setFilters(f => ({ ...f, nat_level: e.target.value }))}>
            <option value="">{ja ? 'NAT全て' : bn ? 'সব NAT' : 'All NAT'}</option>
            {NAT_OPTIONS.map(o => <option key={o} value={o}>NAT-{o}</option>)}
          </select>

          <input className={inputCls} type="number" min="0" max="4" step="0.1"
            placeholder={ja ? '最低GPA' : bn ? 'সর্বনিম্ন GPA' : 'Min GPA'}
            value={filters.min_gpa}
            onChange={e => setFilters(f => ({ ...f, min_gpa: e.target.value }))} />

          <select className={inputCls} value={filters.gender}
            onChange={e => setFilters(f => ({ ...f, gender: e.target.value }))}>
            <option value="">{ja ? '性別全て' : bn ? 'সব লিঙ্গ' : 'All Genders'}</option>
            <option value="male">{ja ? '男性' : bn ? 'পুরুষ' : 'Male'}</option>
            <option value="female">{ja ? '女性' : bn ? 'মহিলা' : 'Female'}</option>
            <option value="other">{ja ? 'その他' : bn ? 'অন্যান্য' : 'Other'}</option>
          </select>

          <select className={inputCls} value={filters.preferred_city}
            onChange={e => setFilters(f => ({ ...f, preferred_city: e.target.value }))}>
            <option value="">{ja ? '都市全て' : bn ? 'সব শহর' : 'All Cities'}</option>
            {CITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <input className={inputCls}
            placeholder={ja ? 'コース名で検索' : bn ? 'কোর্স নাম খুঁজুন' : 'Search by course'}
            value={filters.target_course}
            onChange={e => setFilters(f => ({ ...f, target_course: e.target.value }))} />
        </div>

        <div className="flex gap-2 mt-3">
          <button onClick={() => setApplied(filters)}
            className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-xl transition-colors">
            {ja ? '絞り込む' : bn ? 'ফিল্টার করুন' : 'Apply Filters'}
          </button>
          <button onClick={resetFilters}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-xl transition-colors">
            {ja ? 'リセット' : bn ? 'রিসেট' : 'Reset'}
          </button>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-semibold text-slate-600 mb-1">
            {ja ? '該当する学生が見つかりません' : bn ? 'কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No students found'}
          </p>
          <p className="text-xs text-slate-400">
            {ja ? 'フィルターを変更してみてください。' : bn ? 'ফিল্টার পরিবর্তন করে দেখুন।' : 'Try adjusting your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map(lead => {
            const alreadySent = sentLeads.has(lead.lead_id);
            return (
              <div key={lead.lead_id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-green-100 transition-all">
                <div className="flex flex-wrap items-start justify-between gap-3">

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-bold text-slate-900">{lead.candidate_id}</span>
                      {lead.eligibility_score > 0 && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SCORE_COLOR(lead.eligibility_score)}`}>
                          ★ {lead.eligibility_score}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {lead.gender       && <span>👤 {lead.gender}{lead.age ? `, ${lead.age}y` : ''}</span>}
                      {lead.nationality  && <span>🌍 {lead.nationality}</span>}
                      {lead.highest_qualification && <span>🎓 {lead.highest_qualification}{lead.gpa ? ` (GPA ${lead.gpa})` : ''}</span>}
                      {lead.jlpt_level   && <span className="font-semibold text-indigo-600">JLPT {lead.jlpt_level}</span>}
                      {lead.nat_level    && <span className="font-semibold text-purple-600">NAT-{lead.nat_level}</span>}
                      {!lead.jlpt_level && !lead.nat_level && lead.jlpt_nat_score && <span>🎌 {lead.jlpt_nat_score}</span>}
                      {lead.ielts_score  && <span>IELTS {lead.ielts_score}</span>}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-1.5">
                      {lead.target_country && <span>✈️ {lead.target_country}</span>}
                      {lead.target_course  && <span>📚 {lead.target_course}</span>}
                      {lead.target_intake  && (
                        <span>📅 {new Date(lead.target_intake).toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-GB', { year: 'numeric', month: 'short' })}</span>
                      )}
                      {lead.preferred_cities?.length > 0 && (
                        <span>📍 {lead.preferred_cities.slice(0, 3).join(', ')}{lead.preferred_cities.length > 3 ? ` +${lead.preferred_cities.length - 3}` : ''}</span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {alreadySent ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl">
                        ✓ {ja ? '申請済み' : bn ? 'অনুরোধ পাঠানো হয়েছে' : 'Request Sent'}
                      </span>
                    ) : (
                      <button onClick={() => openContact(lead)}
                        className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-colors">
                        {ja ? '📩 Tensaiに連絡' : bn ? '📩 Tensai-এ যোগাযোগ' : '📩 Contact Tensai'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contact Request Modal */}
      {contactLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">
                  {ja ? 'Tensaiへの連絡申請' : bn ? 'Tensai-এ যোগাযোগের অনুরোধ' : 'Contact Tensai'}
                </h3>
                <button onClick={closeContact} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 mb-4 text-sm">
                <div className="font-semibold text-slate-800">{contactLead.candidate_id}</div>
                <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-slate-500">
                  {contactLead.jlpt_level && <span className="text-indigo-600 font-semibold">JLPT {contactLead.jlpt_level}</span>}
                  {contactLead.nat_level  && <span className="text-purple-600 font-semibold">NAT-{contactLead.nat_level}</span>}
                  {contactLead.highest_qualification && <span>{contactLead.highest_qualification}</span>}
                  {contactLead.target_country && <span>✈️ {contactLead.target_country}</span>}
                </div>
              </div>

              {contactDone ? (
                <div className="text-center py-6">
                  <div className="text-5xl mb-3">✅</div>
                  <p className="font-bold text-green-700 mb-1">
                    {ja ? '申請を送信しました！' : bn ? 'অনুরোধ পাঠানো হয়েছে!' : 'Request Sent!'}
                  </p>
                  <p className="text-xs text-slate-500 mb-1">
                    {ja ? '管理者が確認後、ご連絡します。' : bn ? 'অ্যাডমিন পর্যালোচনার পর আপনার সাথে যোগাযোগ করবে।' : 'Our team will review and follow up shortly.'}
                  </p>
                  <p className="text-xs font-mono text-slate-400 mt-2">Ref: {contactDone}</p>
                  <button onClick={closeContact}
                    className="mt-4 px-5 py-2 bg-green-700 text-white text-sm font-semibold rounded-xl hover:bg-green-800">
                    {ja ? '閉じる' : bn ? 'বন্ধ করুন' : 'Close'}
                  </button>
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); contactMutation.mutate(); }} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                      {ja ? 'メッセージ' : bn ? 'বার্তা' : 'Message'} <span className="text-red-400">*</span>
                    </label>
                    <textarea rows={4} required
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      placeholder={ja
                        ? 'この候補者に興味を持った理由、提供できるプログラムなど...'
                        : bn
                        ? 'এই প্রার্থীতে আগ্রহী হওয়ার কারণ, প্রোগ্রামের বিবরণ...'
                        : "Why you're interested in this candidate, what program you offer..."}
                      value={contactForm.message}
                      onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                      {ja ? '提案するコース（任意）' : bn ? 'প্রস্তাবিত কোর্স (ঐচ্ছিক)' : 'Proposed Course (optional)'}
                    </label>
                    <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder={ja ? '例: 日本語コース' : bn ? 'যেমন: জাপানিজ ভাষা কোর্স' : 'e.g. Japanese Language Course'}
                      value={contactForm.proposed_course}
                      onChange={e => setContactForm(f => ({ ...f, proposed_course: e.target.value }))} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                      {ja ? '入学時期（任意）' : bn ? 'ভর্তির সময় (ঐচ্ছিক)' : 'Proposed Intake (optional)'}
                    </label>
                    <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder={ja ? '例: 2026年4月' : bn ? 'যেমন: এপ্রিল ২০২৬' : 'e.g. April 2026'}
                      value={contactForm.proposed_intake}
                      onChange={e => setContactForm(f => ({ ...f, proposed_intake: e.target.value }))} />
                  </div>

                  {contactError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">⚠️ {contactError}</p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={contactMutation.isPending}
                      className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors">
                      {contactMutation.isPending ? '...' : (ja ? '申請を送信' : bn ? 'অনুরোধ পাঠান' : 'Send Request')}
                    </button>
                    <button type="button" onClick={closeContact}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold">
                      {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
