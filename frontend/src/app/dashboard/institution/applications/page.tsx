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
  lead_code: string;
  target_country: string;
  target_city: string | null;
  city_type: 'fixed' | 'preferred';
  target_course: string | null;
  target_intake: string | null;
  age: number | null;
  last_education: string | null;
  gpa: string | null;
  jlpt_nat_score: string | null;
  submission_status: string | null;
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

  const [filters, setFilters] = useState({ education: '', jlpt: '', course: '', intake_from: '', intake_to: '', age_min: '', age_max: '' });
  // selectingId = which card has the form open
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const [contact, setContact] = useState<ContactForm>(blank);
  const [contactErr, setContactErr] = useState('');
  const [doneId, setDoneId] = useState<number | null>(null);

  function setF(k: keyof typeof filters, v: string) { setFilters(f => ({ ...f, [k]: v })); }
  function setC(k: keyof ContactForm, v: string) { setContact(c => ({ ...c, [k]: v })); }

  function openForm(id: number) {
    setSelectingId(id);
    setContact(blank);
    setContactErr('');
  }

  function closeForm() {
    setSelectingId(null);
    setContact(blank);
    setContactErr('');
  }

  const params: Record<string, string> = {};
  if (filters.education)   params.education   = filters.education;
  if (filters.jlpt)        params.jlpt        = filters.jlpt;
  if (filters.course)      params.course      = filters.course;
  if (filters.intake_from) params.intake_from = filters.intake_from;
  if (filters.intake_to)   params.intake_to   = filters.intake_to;
  if (filters.age_min)     params.age_min     = filters.age_min;
  if (filters.age_max)     params.age_max     = filters.age_max;

  const { data, isLoading } = useQuery({
    queryKey: ['institution-browse', params],
    queryFn: () => api.get('/institution/browse-applications', { params }).then(r => r.data),
    staleTime: 30_000,
  });

  const applications: AnonApplication[] = data?.data ?? [];
  const institutionCountry: string = data?.institution_country ?? '';
  const institutionCity: string = data?.institution_city ?? '';

  const select = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ContactForm }) =>
      api.post(`/institution/select-application/${id}`, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['institution-browse'] });
      qc.invalidateQueries({ queryKey: ['institution-selected'] });
      closeForm();
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
    <DashboardLayout title={ja ? '申請一覧' : bn ? 'আবেদন তালিকা' : 'Applications'}>

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
      {(institutionCountry || institutionCity) && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3">
          <span className="text-lg shrink-0">📍</span>
          <p className="text-xs text-indigo-800 font-medium">
            {ja
              ? `表示中: ${institutionCountry}${institutionCity ? ` › ${institutionCity}` : ''} に一致する申請のみ`
              : bn
              ? `দেখাচ্ছে: ${institutionCountry}${institutionCity ? ` › ${institutionCity}` : ''} ম্যাচ করা আবেদন`
              : `Showing applications matched to ${institutionCountry}${institutionCity ? ` › ${institutionCity}` : ''}`}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {ja ? 'フィルター' : bn ? 'ফিল্টার' : 'Filters'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">{ja ? '最終学歴' : bn ? 'শেষ শিক্ষা' : 'Last Education'}</label>
            <select className={selectCls + ' w-full'} value={filters.education} onChange={e => setF('education', e.target.value)}>
              <option value="">{ja ? 'すべて' : bn ? 'সব' : 'All'}</option>
              {EDU_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">JLPT / NAT</label>
            <select className={selectCls + ' w-full'} value={filters.jlpt} onChange={e => setF('jlpt', e.target.value)}>
              <option value="">{ja ? 'すべて' : bn ? 'সব' : 'All'}</option>
              {JLPT_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">{ja ? 'コース' : bn ? 'কোর্স' : 'Course'}</label>
            <input className={selectCls + ' w-full'} placeholder={ja ? '例: 日本語' : bn ? 'যেমন: ভাষা' : 'e.g. Language'}
              value={filters.course} onChange={e => setF('course', e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">{ja ? '年齢' : bn ? 'বয়স' : 'Age'}</label>
            <div className="flex gap-1 items-center">
              <input type="number" min="16" max="60" className={selectCls + ' w-full'} placeholder="Min" value={filters.age_min} onChange={e => setF('age_min', e.target.value)} />
              <span className="text-slate-300 text-xs shrink-0">—</span>
              <input type="number" min="16" max="60" className={selectCls + ' w-full'} placeholder="Max" value={filters.age_max} onChange={e => setF('age_max', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">{ja ? '入学日（開始）' : bn ? 'ইনটেক থেকে' : 'Intake From'}</label>
            <input type="date" className={selectCls + ' w-full'} value={filters.intake_from} onChange={e => setF('intake_from', e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">{ja ? '入学日（終了）' : bn ? 'ইনটেক পর্যন্ত' : 'Intake To'}</label>
            <input type="date" className={selectCls + ' w-full'} value={filters.intake_to} onChange={e => setF('intake_to', e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={() => setFilters({ education: '', jlpt: '', course: '', intake_from: '', intake_to: '', age_min: '', age_max: '' })}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors">
              {ja ? 'リセット' : bn ? 'রিসেট' : 'Reset filters'}
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-500 mb-3 px-1">
        {applications.length} {ja ? '件の申請が一致しました' : bn ? 'টি আবেদন মিলেছে' : `application${applications.length !== 1 ? 's' : ''} matched`}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-sm">{ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}</div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-medium text-slate-500 mb-1">{ja ? '一致する申請がありません' : bn ? 'কোনো ম্যাচিং আবেদন নেই' : 'No matching applications'}</p>
          <p className="text-xs">{ja ? 'フィルターを変更するか、後でもう一度お試しください。' : bn ? 'ফিল্টার পরিবর্তন করুন বা পরে আবার দেখুন।' : 'Try adjusting filters or check back later.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <div key={app.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
              app.already_selected ? 'border-indigo-200 bg-indigo-50/20' : selectingId === app.id ? 'border-indigo-300' : 'border-slate-100'
            }`}>

              {/* Card body */}
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono text-xs text-slate-400">{app.lead_code}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${app.city_type === 'fixed' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                        {app.city_type === 'fixed' ? (ja ? '都市固定' : bn ? 'ফিক্সড সিটি' : 'Fixed City') : (ja ? '都市希望' : bn ? 'পছন্দের সিটি' : 'Preferred City')}
                      </span>
                      {app.already_selected && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                          ✓ {ja ? '選択済み' : bn ? 'নির্বাচিত' : 'Selected'}
                        </span>
                      )}
                    </div>
                    {/* Info */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                      <InfoRow label={ja ? '国' : bn ? 'দেশ' : 'Country'} value={app.target_country} />
                      {app.target_city && <InfoRow label={ja ? '都市' : bn ? 'শহর' : 'City'} value={app.target_city} />}
                      {app.target_course && <InfoRow label={ja ? 'コース' : bn ? 'কোর্স' : 'Course'} value={app.target_course} />}
                      {app.target_intake && <InfoRow label={ja ? '入学' : bn ? 'ইনটেক' : 'Intake'} value={new Date(app.target_intake).toLocaleDateString(undefined, { dateStyle: 'medium' })} />}
                      {app.age && <InfoRow label={ja ? '年齢' : bn ? 'বয়স' : 'Age'} value={`${app.age} ${ja ? '歳' : bn ? 'বছর' : 'yrs'}`} />}
                      {app.last_education && <InfoRow label={ja ? '学歴' : bn ? 'শিক্ষা' : 'Education'} value={app.last_education} />}
                      {app.gpa && <InfoRow label="GPA" value={app.gpa} />}
                      {app.jlpt_nat_score && <InfoRow label="JLPT/NAT" value={app.jlpt_nat_score} />}
                    </div>
                  </div>

                  {/* Select button / already selected */}
                  <div className="shrink-0 self-center text-right">
                    {app.already_selected ? (
                      <span className="text-xs font-semibold text-indigo-600">✓ {ja ? '選択済み' : bn ? 'নির্বাচিত' : 'Selected'}</span>
                    ) : selectingId === app.id ? null : (
                      <button
                        onClick={() => openForm(app.id)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
                      >
                        {ja ? '選択する' : bn ? 'নির্বাচন করুন' : 'Select'}
                      </button>
                    )}
                    {doneId === app.id && (
                      <p className="text-[10px] text-indigo-600 font-semibold mt-1">✓ {ja ? '選択しました' : bn ? 'নির্বাচিত হয়েছে' : 'Selected!'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Inline contact form — opens when clicking Select */}
              {selectingId === app.id && (
                <div className="border-t border-indigo-100 bg-indigo-50/40 p-4 sm:p-5">
                  <p className="font-bold text-slate-800 text-sm mb-1">
                    {ja ? '担当者の連絡先を入力してください' : bn ? 'যোগাযোগকারীর তথ্য দিন' : 'Provide your contact details'}
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    {ja
                      ? 'Tensaiのマネージャーがこの連絡先に24時間以内にご連絡いたします。選択を確定するには以下の情報が必要です。'
                      : bn
                      ? 'Tensai ম্যানেজার ২৪ ঘণ্টার মধ্যে এই যোগাযোগে ফোন দেবেন। নির্বাচন নিশ্চিত করতে নিচের তথ্য আবশ্যক।'
                      : 'A Tensai manager will contact you within 24 hours. These details are required to confirm your selection.'}
                  </p>
                  <form onSubmit={handleSelect} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                          {ja ? '担当者名 *' : bn ? 'যোগাযোগকারীর নাম *' : 'Contact Person *'}
                        </label>
                        <input className={inputCls} placeholder={ja ? '例: 山田 太郎' : bn ? 'যেমন: রহিম উদ্দিন' : 'e.g. John Smith'}
                          value={contact.name} onChange={e => setC('name', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                          {ja ? 'メールアドレス *' : bn ? 'ইমেইল *' : 'Email Address *'}
                        </label>
                        <input type="email" className={inputCls} placeholder="contact@school.com"
                          value={contact.email} onChange={e => setC('email', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">WhatsApp</label>
                        <input type="tel" className={inputCls} placeholder="+81 90-0000-0000"
                          value={contact.whatsapp} onChange={e => setC('whatsapp', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                          {ja ? '電話番号' : bn ? 'ফোন নম্বর' : 'Phone Number'}
                        </label>
                        <input type="tel" className={inputCls} placeholder="+81 3-0000-0000"
                          value={contact.phone} onChange={e => setC('phone', e.target.value)} />
                      </div>
                    </div>
                    {contactErr && <p className="text-xs text-red-600 font-medium">⚠️ {contactErr}</p>}
                    <div className="flex gap-2 pt-1">
                      <button type="submit" disabled={select.isPending}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
                        {select.isPending ? '...' : (ja ? '選択を確定する' : bn ? 'নির্বাচন নিশ্চিত করুন' : 'Confirm Selection')}
                      </button>
                      <button type="button" onClick={closeForm}
                        className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors">
                        {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <span className="text-slate-400 shrink-0">{label}:</span>
      <span className="font-semibold text-slate-700 truncate">{value}</span>
    </div>
  );
}
