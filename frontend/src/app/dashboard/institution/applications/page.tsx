'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AnonApplication {
  id: number;
  application_code: string;
  country: string | null;
  form_name: string | null;
  intake: string | null;
  progress: number;
  status: string;
  submitted_at: string | null;
  highest_qualification: string | null;
  gpa: string | null;
  jlpt_level: string | null;
  nat_level: string | null;
  already_selected: boolean;
}

interface ContactForm {
  name: string;
  email: string;
  whatsapp: string;
  phone: string;
}

const blank: ContactForm = { name: '', email: '', whatsapp: '', phone: '' };
const EDU_LEVELS = ['SSC', 'HSC', 'Diploma', "Bachelor's", "Master's"];
const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];
const selectCls = 'border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';
const inputCls  = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400';

export default function InstitutionApplicationsPage() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  useEffect(() => {
    if (user && user.gateway_type !== 'institution') router.replace(`/dashboard/${user.gateway_type}`);
  }, [user, router]);

  const [filters, setFilters] = useState({ education: '', jlpt: '' });
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const [contact, setContact] = useState<ContactForm>(blank);
  const [contactErr, setContactErr] = useState('');
  const [doneId, setDoneId] = useState<number | null>(null);

  function setF(k: keyof typeof filters, v: string) { setFilters(f => ({ ...f, [k]: v })); }
  function setC(k: keyof ContactForm, v: string) { setContact(c => ({ ...c, [k]: v })); }

  const params: Record<string, string> = {};
  if (filters.education) params.education = filters.education;
  if (filters.jlpt)      params.jlpt      = filters.jlpt;

  const { data, isLoading } = useQuery({
    queryKey: ['institution-browse', params],
    queryFn: () => api.get('/institution/browse-applications', { params }).then(r => r.data),
    staleTime: 30_000,
  });

  const applications: AnonApplication[] = data?.data ?? [];
  const institutionCountry: string = data?.institution_country ?? '';

  const select = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ContactForm }) =>
      api.post(`/institution/select-application/${id}`, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['institution-browse'] });
      qc.invalidateQueries({ queryKey: ['institution-selected'] });
      setSelectingId(null);
      setContact(blank);
      setDoneId(id);
      setTimeout(() => setDoneId(null), 3000);
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = err.response?.data?.errors;
      setContactErr(errs ? Object.values(errs).flat().join(' ') : err.response?.data?.message ?? (ja ? '選択に失敗しました。' : bn ? 'নির্বাচন ব্যর্থ হয়েছে।' : 'Selection failed.'));
    },
  });

  function handleSelect(e: React.FormEvent) {
    e.preventDefault();
    if (!selectingId) return;
    if (!contact.name.trim() || !contact.email.trim()) {
      setContactErr(ja ? '名前とメールは必須です。' : bn ? 'নাম ও ইমেইল আবশ্যক।' : 'Name and email are required.');
      return;
    }
    setContactErr('');
    select.mutate({ id: selectingId, payload: contact });
  }

  return (
    <DashboardLayout title={ja ? '申請プール' : bn ? 'আবেদন ভান্ডার' : 'Application Pool'}>

      {/* No country warning */}
      {!isLoading && !institutionCountry && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <span className="text-xl shrink-0">⚠️</span>
          <div>
            <p className="font-bold text-sm text-slate-900">
              {ja ? '国情報が未設定です' : bn ? 'দেশের তথ্য নেই' : 'Country not set in your profile'}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {ja ? 'プロフィールで国を設定してください。' : bn ? 'প্রোফাইলে দেশ সেট করুন।' : 'Set your country in Profile first. Only matching applications will show.'}
            </p>
          </div>
        </div>
      )}

      {/* Match banner */}
      {institutionCountry && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3">
          <span className="text-lg shrink-0">📍</span>
          <p className="text-xs text-indigo-800 font-medium">
            {ja ? `表示中: ${institutionCountry} に一致する申請のみ`
              : bn ? `দেখাচ্ছে: ${institutionCountry} ম্যাচ করা আবেদন`
              : `Showing submitted applications matched to ${institutionCountry}`}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {ja ? 'フィルター' : bn ? 'ফিল্টার' : 'Filters'}
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">{ja ? '最終学歴' : bn ? 'শেষ শিক্ষা' : 'Education'}</label>
            <select className={selectCls} value={filters.education} onChange={e => setF('education', e.target.value)}>
              <option value="">{ja ? 'すべて' : bn ? 'সব' : 'All'}</option>
              {EDU_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">JLPT</label>
            <select className={selectCls} value={filters.jlpt} onChange={e => setF('jlpt', e.target.value)}>
              <option value="">{ja ? 'すべて' : bn ? 'সব' : 'All'}</option>
              {JLPT_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <button onClick={() => setFilters({ education: '', jlpt: '' })}
            className="py-2 px-4 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors">
            {ja ? 'リセット' : bn ? 'রিসেট' : 'Reset'}
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-500 mb-3 px-1">
        {applications.length} {ja ? '件の申請が一致しました' : bn ? 'টি আবেদন মিলেছে' : `application${applications.length !== 1 ? 's' : ''} matched`}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-sm">{ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}</div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-medium text-slate-500 mb-1">{ja ? '一致する申請がありません' : bn ? 'কোনো ম্যাচিং আবেদন নেই' : 'No matching applications'}</p>
          <p className="text-xs">{ja ? 'フィルターを変更するか、後でもう一度お試しください。' : bn ? 'ফিল্টার পরিবর্তন করুন বা পরে দেখুন।' : 'Try adjusting filters or check back later.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="text-left px-5 py-3">{ja ? 'コード' : bn ? 'কোড' : 'Code'}</th>
                  <th className="text-left px-4 py-3">{ja ? '国 / フォーム' : bn ? 'দেশ / ফর্ম' : 'Country / Form'}</th>
                  <th className="text-left px-4 py-3">{ja ? '学歴' : bn ? 'শিক্ষা' : 'Education'}</th>
                  <th className="text-left px-4 py-3">GPA</th>
                  <th className="text-left px-4 py-3">JLPT/NAT</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {applications.map(app => (
                  <>
                    <tr key={app.id} className={`transition-colors ${app.already_selected ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{app.application_code}</span>
                          {app.already_selected && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">✓ {ja ? '選択済み' : bn ? 'নির্বাচিত' : 'Selected'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-semibold text-slate-700">{app.country ?? '—'}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">{app.form_name ?? ''}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">{app.highest_qualification ?? '—'}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">{app.gpa ?? '—'}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {[app.jlpt_level, app.nat_level].filter(Boolean).join(' / ') || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {app.already_selected ? (
                          <span className="text-xs font-semibold text-indigo-500">✓ {ja ? '選択済み' : bn ? 'নির্বাচিত' : 'Selected'}</span>
                        ) : doneId === app.id ? (
                          <span className="text-xs font-semibold text-emerald-600">✓ {ja ? '選択しました' : bn ? 'নির্বাচিত!' : 'Selected!'}</span>
                        ) : (
                          <button onClick={() => { setSelectingId(selectingId === app.id ? null : app.id); setContact(blank); setContactErr(''); }}
                            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                              selectingId === app.id
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}>
                            {selectingId === app.id ? (ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel') : (ja ? '選択する' : bn ? 'নির্বাচন করুন' : 'Select')}
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Inline contact form */}
                    {selectingId === app.id && (
                      <tr key={`form-${app.id}`}>
                        <td colSpan={6} className="px-5 py-4 bg-indigo-50/60 border-b border-indigo-100">
                          <p className="font-bold text-slate-800 text-sm mb-1">
                            {ja ? '担当者の連絡先を入力してください' : bn ? 'দায়িত্বশীল ব্যক্তির তথ্য দিন' : 'Who should Tensai contact?'}
                          </p>
                          <p className="text-xs text-indigo-600 font-semibold mb-3">
                            {ja ? '⏰ Tensaiのマネージャーが24時間以内にご連絡いたします。' : bn ? '⏰ Tensai ম্যানেজার ২৪ ঘণ্টার মধ্যে যোগাযোগ করবেন।' : '⏰ A Tensai manager will contact this person within 24 hours.'}
                          </p>
                          <form onSubmit={handleSelect} className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                                  {ja ? '担当者氏名 *' : bn ? 'দায়িত্বশীল ব্যক্তির নাম *' : 'Contact Person Name *'}
                                </label>
                                <input className={inputCls} value={contact.name} onChange={e => setC('name', e.target.value)}
                                  placeholder={ja ? '例: 山田 太郎' : bn ? 'যেমন: রহিম উদ্দিন' : 'e.g. John Smith'} />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                                  {ja ? 'メール *' : bn ? 'ইমেইল *' : 'Email *'}
                                </label>
                                <input type="email" className={inputCls} value={contact.email} onChange={e => setC('email', e.target.value)}
                                  placeholder="contact@school.com" />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">WhatsApp</label>
                                <input type="tel" className={inputCls} value={contact.whatsapp} onChange={e => setC('whatsapp', e.target.value)}
                                  placeholder="+81 90-0000-0000" />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                                  {ja ? '電話番号' : bn ? 'ফোন' : 'Phone'}
                                </label>
                                <input type="tel" className={inputCls} value={contact.phone} onChange={e => setC('phone', e.target.value)}
                                  placeholder="+81 3-0000-0000" />
                              </div>
                            </div>
                            {contactErr && <p className="text-xs text-red-600 font-medium">⚠️ {contactErr}</p>}
                            <div className="flex gap-2 pt-1">
                              <button type="submit" disabled={select.isPending}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
                                {select.isPending ? '...' : (ja ? '選択を確定する' : bn ? 'নির্বাচন নিশ্চিত করুন' : 'Confirm Selection')}
                              </button>
                              <button type="button" onClick={() => { setSelectingId(null); setContact(blank); setContactErr(''); }}
                                className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors">
                                {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-50">
            {applications.map(app => (
              <div key={app.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{app.application_code}</span>
                    {app.already_selected && (
                      <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">✓ {ja ? '選択済み' : bn ? 'নির্বাচিত' : 'Selected'}</span>
                    )}
                  </div>
                  {!app.already_selected && doneId !== app.id && (
                    <button onClick={() => { setSelectingId(selectingId === app.id ? null : app.id); setContact(blank); setContactErr(''); }}
                      className="shrink-0 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl">
                      {ja ? '選択する' : bn ? 'নির্বাচন' : 'Select'}
                    </button>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-700">{app.country ?? '—'}</p>
                <p className="text-[11px] text-slate-400">{app.form_name ?? ''}</p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  {app.highest_qualification && <span>{app.highest_qualification}</span>}
                  {app.gpa && <span>GPA {app.gpa}</span>}
                  {(app.jlpt_level || app.nat_level) && <span>{[app.jlpt_level, app.nat_level].filter(Boolean).join('/')}</span>}
                </div>

                {/* Mobile contact form */}
                {selectingId === app.id && (
                  <form onSubmit={handleSelect} className="mt-3 space-y-2">
                    <input className={inputCls} value={contact.name} onChange={e => setC('name', e.target.value)}
                      placeholder={ja ? '担当者氏名 *' : bn ? 'নাম *' : 'Contact name *'} />
                    <input type="email" className={inputCls} value={contact.email} onChange={e => setC('email', e.target.value)}
                      placeholder="Email *" />
                    <input type="tel" className={inputCls} value={contact.whatsapp} onChange={e => setC('whatsapp', e.target.value)}
                      placeholder="WhatsApp" />
                    {contactErr && <p className="text-xs text-red-600">⚠️ {contactErr}</p>}
                    <div className="flex gap-2">
                      <button type="submit" disabled={select.isPending}
                        className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl disabled:opacity-50">
                        {select.isPending ? '...' : (ja ? '確定' : bn ? 'নিশ্চিত' : 'Confirm')}
                      </button>
                      <button type="button" onClick={() => setSelectingId(null)}
                        className="px-3 py-2 text-xs text-slate-500 border border-slate-200 rounded-xl">
                        {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
