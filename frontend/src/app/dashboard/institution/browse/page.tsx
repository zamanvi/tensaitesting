'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface StudentCard {
  id: number;
  student_id: number;
  student_name: string;
  full_name_japanese: string | null;
  gender: string | null;
  nationality: string | null;
  highest_qualification: string | null;
  gpa: number | null;
  passing_year: number | null;
  jlpt_level: string | null;
  nat_level: string | null;
  ielts_score: number | null;
  eligibility_score: number;
}

interface InterviewForm {
  preferred_date: string;
  medium: string;
  notes: string;
}

const JLPT_OPTIONS = ['N1', 'N2', 'N3', 'N4', 'N5'];
const NAT_OPTIONS  = ['1', '2', '3', '4', '5'];
const MEDIUMS = [
  { value: 'zoom',        en: 'Zoom',        ja: 'Zoom',         bn: 'Zoom' },
  { value: 'google_meet', en: 'Google Meet', ja: 'Google Meet',  bn: 'Google Meet' },
  { value: 'teams',       en: 'MS Teams',    ja: 'MS Teams',     bn: 'MS Teams' },
  { value: 'phone',       en: 'Phone',       ja: '電話',          bn: 'ফোন' },
  { value: 'in_person',   en: 'In Person',   ja: '対面',          bn: 'সরাসরি' },
];

export default function BrowseStudents() {
  const { t, lang } = useLang();
  const ib = t.institutionBrowse;
  const qc = useQueryClient();
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const [filters, setFilters] = useState({ jlpt_level: '', nat_level: '', min_gpa: '', gender: '', qualification: '' });
  const [applied, setApplied] = useState(filters);

  // Toast message
  const [toast, setToast]     = useState('');

  // Interview request modal state
  const [ivModal, setIvModal]         = useState<{ studentId: number; leadId: number } | null>(null);
  const [ivForm, setIvForm]           = useState<InterviewForm>({ preferred_date: '', medium: 'zoom', notes: '' });
  const [ivError, setIvError]         = useState('');
  const [ivSent, setIvSent]           = useState(false);

  // Map of student_id → lead_id for already-shortlisted students
  const [shortlistedMap, setShortlistedMap] = useState<Record<number, number>>({});

  // Load existing leads once to pre-populate shortlisted state
  useQuery({
    queryKey: ['institution-leads-map'],
    queryFn: async () => {
      const r = await api.get('/institution/leads');
      const leads: { student_id: number; id: number }[] =
        Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : [];
      const map: Record<number, number> = {};
      leads.forEach(l => { map[l.student_id] = l.id; });
      setShortlistedMap(map);
      return map;
    },
    staleTime: 60_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['browse-students', applied],
    queryFn: () => {
      const params = Object.fromEntries(Object.entries(applied).filter(([, v]) => v));
      return api.get('/institution/students', { params }).then(r => r.data);
    },
    staleTime: 60_000,
  });

  // Shortlist mutation
  const shortlist = useMutation({
    mutationFn: (studentId: number) => api.post(`/institution/shortlist/${studentId}`),
    onSuccess: (res, studentId) => {
      const lead = res.data?.lead;
      if (lead?.id) {
        setShortlistedMap(m => ({ ...m, [studentId]: lead.id }));
        qc.invalidateQueries({ queryKey: ['institution-leads'] });
        qc.invalidateQueries({ queryKey: ['institution-leads-map'] });
        qc.invalidateQueries({ queryKey: ['institution-dashboard'] });
      }
      showToast(ib.shortlistedMsg(studentId));
    },
    onError: (err: unknown, studentId) => {
      const e = err as { response?: { data?: { message?: string; lead?: { id: number } } } };
      // 409 = already shortlisted — still capture lead ID if returned
      if (e.response?.data?.lead?.id) {
        setShortlistedMap(m => ({ ...m, [studentId]: e.response!.data!.lead!.id }));
      }
      showToast(e.response?.data?.message ?? 'Failed to shortlist.');
    },
  });

  // Interview request mutation
  const requestInterview = useMutation({
    mutationFn: ({ leadId, payload }: { leadId: number; payload: InterviewForm }) =>
      api.post(`/institution/interview-request/${leadId}`, payload),
    onSuccess: () => {
      setIvSent(true);
      qc.invalidateQueries({ queryKey: ['institution-interviews'] });
      setTimeout(() => { setIvModal(null); setIvSent(false); setIvForm({ preferred_date: '', medium: 'zoom', notes: '' }); }, 2500);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setIvError(e.response?.data?.message ?? 'Failed to send request.');
    },
  });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  function openIvModal(studentId: number, leadId: number) {
    setIvModal({ studentId, leadId });
    setIvForm({ preferred_date: '', medium: 'zoom', notes: '' });
    setIvError('');
    setIvSent(false);
  }

  function submitInterview(e: React.FormEvent) {
    e.preventDefault();
    setIvError('');
    if (!ivModal) return;
    requestInterview.mutate({ leadId: ivModal.leadId, payload: ivForm });
  }

  const students: StudentCard[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  // Tomorrow's date for min on date picker
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return (
    <DashboardLayout title={ib.title}>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
        {ib.privacyBanner}
      </div>

      {toast && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">{toast}</div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 mb-5 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          <select value={filters.jlpt_level} onChange={e => setFilters({ ...filters, jlpt_level: e.target.value })}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 w-full focus:outline-none focus:ring-2 focus:ring-indigo-300">
            <option value="">{ib.jlptAny}</option>
            {JLPT_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filters.nat_level} onChange={e => setFilters({ ...filters, nat_level: e.target.value })}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 w-full focus:outline-none focus:ring-2 focus:ring-indigo-300">
            <option value="">{ib.natAny}</option>
            {NAT_OPTIONS.map(l => <option key={l} value={l}>NAT {l}</option>)}
          </select>
          <select value={filters.gender} onChange={e => setFilters({ ...filters, gender: e.target.value })}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 w-full focus:outline-none focus:ring-2 focus:ring-indigo-300">
            <option value="">{ib.genderAny}</option>
            <option value="male">{ib.male}</option>
            <option value="female">{ib.female}</option>
            <option value="other">{ib.other}</option>
          </select>
          <input type="number" min="0" max="5" step="0.1" placeholder={ib.minGpa}
            value={filters.min_gpa} onChange={e => setFilters({ ...filters, min_gpa: e.target.value })}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 w-full focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <input type="text" placeholder={ib.qualKeyword}
            value={filters.qualification} onChange={e => setFilters({ ...filters, qualification: e.target.value })}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 w-full focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <button onClick={() => setApplied({ ...filters })}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors w-full">
            {t.common.search}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">{t.common.loading}</div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400">
          <div className="text-4xl mb-3">🎓</div>
          <div className="font-medium">{ib.noStudents}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {students.map(s => {
            const existingLeadId = shortlistedMap[s.student_id];
            const isShortlisted  = existingLeadId != null;
            const isPending      = shortlist.isPending && shortlist.variables === s.student_id;

            return (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">{s.student_name}</div>
                    {s.full_name_japanese && <div className="text-xs text-slate-400">{s.full_name_japanese}</div>}
                    {s.nationality && <div className="text-xs text-slate-400">{s.nationality}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-indigo-700">{s.eligibility_score}</div>
                    <div className="text-xs text-slate-400">{t.common.score}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {s.jlpt_level  && <Chip label={`JLPT ${s.jlpt_level}`}  color="indigo" />}
                  {s.nat_level   && <Chip label={`NAT ${s.nat_level}`}    color="amber" />}
                  {s.ielts_score && <Chip label={`IELTS ${s.ielts_score}`} color="emerald" />}
                  {s.gpa         && <Chip label={`GPA ${s.gpa}`}          color="slate" />}
                  {s.highest_qualification && <Chip label={s.highest_qualification} color="slate" />}
                </div>

                {isShortlisted ? (
                  <div className="space-y-2">
                    {/* Already shortlisted — show status + interview button */}
                    <div className="w-full py-2 rounded-xl text-sm font-medium text-center bg-emerald-50 text-emerald-700 border border-emerald-100">
                      ✓ {ja ? 'ショートリスト済み' : bn ? 'শর্টলিস্টেড' : 'Shortlisted'}
                    </div>
                    <button
                      onClick={() => openIvModal(s.student_id, existingLeadId)}
                      className="w-full py-2 rounded-xl text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors"
                    >
                      🎙️ {ja ? '面接をリクエスト' : bn ? 'ইন্টারভিউ রিকোয়েস্ট' : 'Request Interview'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => shortlist.mutate(s.student_id)}
                    disabled={isPending}
                    className="w-full py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isPending ? ib.shortlisting : ib.shortlistBtn}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Interview Request Modal */}
      {ivModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">
                🎙️ {ja ? '面接リクエスト' : bn ? 'ইন্টারভিউ রিকোয়েস্ট' : 'Request Interview'}
              </h3>
              <button onClick={() => setIvModal(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>

            {ivSent ? (
              <div className="py-8 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-semibold text-slate-800">
                  {ja ? 'リクエストを送信しました！' : bn ? 'রিকোয়েস্ট পাঠানো হয়েছে!' : 'Request sent!'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {ja ? 'Tensaiチームが調整します。' : bn ? 'Tensai টিম ব্যবস্থা নেবে।' : 'The Tensai team will arrange the interview.'}
                </p>
              </div>
            ) : (
              <form onSubmit={submitInterview} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                    {ja ? '希望日' : bn ? 'পছন্দের তারিখ' : 'Preferred Date'} <span className="text-red-400">*</span>
                  </label>
                  <input type="date" required min={tomorrowStr}
                    value={ivForm.preferred_date}
                    onChange={e => setIvForm(f => ({ ...f, preferred_date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                    {ja ? '面接形式' : bn ? 'মাধ্যম' : 'Medium'} <span className="text-red-400">*</span>
                  </label>
                  <select required value={ivForm.medium}
                    onChange={e => setIvForm(f => ({ ...f, medium: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {MEDIUMS.map(m => (
                      <option key={m.value} value={m.value}>
                        {ja ? m.ja : bn ? m.bn : m.en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                    {ja ? 'メモ（任意）' : bn ? 'নোট (ঐচ্ছিক)' : 'Notes (optional)'}
                  </label>
                  <textarea rows={2} value={ivForm.notes}
                    onChange={e => setIvForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder={ja ? '特記事項があればご記入ください...' : bn ? 'কোনো বিশেষ নির্দেশনা থাকলে লিখুন...' : 'Any special requirements or notes...'}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                {ivError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">⚠️ {ivError}</div>
                )}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setIvModal(null)}
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
                    {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={requestInterview.isPending}
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
                    {requestInterview.isPending
                      ? (ja ? '送信中...' : bn ? 'পাঠানো হচ্ছে...' : 'Sending...')
                      : (ja ? '送信' : bn ? 'পাঠান' : 'Send Request')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    indigo:  'bg-indigo-50 text-indigo-700',
    amber:   'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    slate:   'bg-slate-100 text-slate-600',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>{label}</span>;
}
