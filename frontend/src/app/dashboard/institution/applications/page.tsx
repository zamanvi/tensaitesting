'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Anonymized — no student name/contact
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
  jlpt_nat_result_date: string | null;
  submission_status: string | null;
  already_selected: boolean;
}

const EDU_LEVELS = ['SSC', 'HSC', 'Diploma', "Bachelor's", "Master's"];
const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];

const selectCls = 'border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';

export default function InstitutionApplicationsPage() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  useEffect(() => {
    if (user && user.gateway_type !== 'institution') router.replace(`/dashboard/${user.gateway_type}`);
  }, [user, router]);

  const [filters, setFilters] = useState({
    education: '',
    jlpt: '',
    course: '',
    intake_from: '',
    intake_to: '',
    age_min: '',
    age_max: '',
  });
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const [selectOk, setSelectOk] = useState<number | null>(null);

  function setF(k: keyof typeof filters, v: string) {
    setFilters(f => ({ ...f, [k]: v }));
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
    mutationFn: (id: number) => api.post(`/institution/select-application/${id}`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['institution-browse'] });
      qc.invalidateQueries({ queryKey: ['institution-selected'] });
      setSelectingId(null);
      setSelectOk(id);
      setTimeout(() => setSelectOk(null), 3000);
    },
    onError: () => setSelectingId(null),
  });

  const title = ja ? '申請一覧' : bn ? 'আবেদন তালিকা' : 'Applications';

  return (
    <DashboardLayout title={title}>

      {/* No profile / no country warning */}
      {!isLoading && !institutionCountry && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <span className="text-xl shrink-0">⚠️</span>
          <div>
            <p className="font-bold text-sm text-slate-900">
              {ja ? '国情報が未設定です' : bn ? 'দেশের তথ্য নেই' : 'Country not set in your profile'}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {ja ? 'プロフィールで国を設定してください。国が一致する申請のみ表示されます。' : bn ? 'প্রোফাইলে আপনার দেশ সেট করুন। শুধুমাত্র ম্যাচিং দেশের আবেদন দেখা যাবে।' : 'Set your country in Profile first. Only applications matching your country will be shown.'}
            </p>
          </div>
        </div>
      )}

      {/* Match info banner */}
      {(institutionCountry || institutionCity) && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3">
          <span className="text-lg shrink-0">📍</span>
          <p className="text-xs text-indigo-800 font-medium">
            {ja
              ? `表示中: ${institutionCountry}${institutionCity ? ` › ${institutionCity}` : ''} に一致する申請のみ。固定都市の申請は都市が完全一致の場合のみ表示されます。`
              : bn
              ? `দেখাচ্ছে: ${institutionCountry}${institutionCity ? ` › ${institutionCity}` : ''} ম্যাচ করা আবেদন। ফিক্সড সিটি আবেদন শুধুমাত্র শহর মিলে গেলে দেখাবে।`
              : `Showing applications matched to ${institutionCountry}${institutionCity ? ` › ${institutionCity}` : ''}. Fixed-city applications only appear when city matches exactly.`}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {ja ? 'フィルター' : bn ? 'ফিল্টার' : 'Filters'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Education level */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              {ja ? '最終学歴' : bn ? 'শেষ শিক্ষা' : 'Last Education'}
            </label>
            <select className={selectCls + ' w-full'} value={filters.education} onChange={e => setF('education', e.target.value)}>
              <option value="">{ja ? 'すべて' : bn ? 'সব' : 'All'}</option>
              {EDU_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* JLPT/NAT */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              {ja ? 'JLPT / NAT' : bn ? 'JLPT / NAT' : 'JLPT / NAT'}
            </label>
            <select className={selectCls + ' w-full'} value={filters.jlpt} onChange={e => setF('jlpt', e.target.value)}>
              <option value="">{ja ? 'すべて' : bn ? 'সব' : 'All'}</option>
              {JLPT_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Course */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              {ja ? 'コース' : bn ? 'কোর্স' : 'Course'}
            </label>
            <input
              className={selectCls + ' w-full'}
              placeholder={ja ? '例: 日本語' : bn ? 'যেমন: ভাষা' : 'e.g. Language'}
              value={filters.course}
              onChange={e => setF('course', e.target.value)}
            />
          </div>

          {/* Age range */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              {ja ? '年齢' : bn ? 'বয়স' : 'Age'}
            </label>
            <div className="flex gap-1 items-center">
              <input type="number" min="16" max="60" className={selectCls + ' w-full'} placeholder="Min"
                value={filters.age_min} onChange={e => setF('age_min', e.target.value)} />
              <span className="text-slate-300 text-xs shrink-0">—</span>
              <input type="number" min="16" max="60" className={selectCls + ' w-full'} placeholder="Max"
                value={filters.age_max} onChange={e => setF('age_max', e.target.value)} />
            </div>
          </div>

          {/* Intake from */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              {ja ? '入学日（開始）' : bn ? 'ইনটেক থেকে' : 'Intake From'}
            </label>
            <input type="date" className={selectCls + ' w-full'} value={filters.intake_from}
              onChange={e => setF('intake_from', e.target.value)} />
          </div>

          {/* Intake to */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              {ja ? '入学日（終了）' : bn ? 'ইনটেক পর্যন্ত' : 'Intake To'}
            </label>
            <input type="date" className={selectCls + ' w-full'} value={filters.intake_to}
              onChange={e => setF('intake_to', e.target.value)} />
          </div>

          {/* Clear */}
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ education: '', jlpt: '', course: '', intake_from: '', intake_to: '', age_min: '', age_max: '' })}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors"
            >
              {ja ? 'リセット' : bn ? 'রিসেট' : 'Reset filters'}
            </button>
          </div>
        </div>
      </div>

      {/* Count */}
      <div className="text-xs text-slate-500 mb-3 px-1">
        {applications.length} {ja ? '件の申請' : bn ? 'টি আবেদন' : `application${applications.length !== 1 ? 's' : ''}`}
        {ja ? 'が一致しました' : bn ? ' মিলেছে' : ' matched'}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          {ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-medium text-slate-500 mb-1">
            {ja ? '一致する申請がありません' : bn ? 'কোনো ম্যাচিং আবেদন নেই' : 'No matching applications'}
          </p>
          <p className="text-xs">
            {ja ? 'フィルターを変更するか、後でもう一度お試しください。' : bn ? 'ফিল্টার পরিবর্তন করুন অথবা পরে আবার দেখুন।' : 'Try adjusting filters or check back later.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <div key={app.id} className={`bg-white rounded-2xl border shadow-sm p-4 sm:p-5 transition-colors ${app.already_selected ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100'}`}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0">

                  {/* Top row */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-xs text-slate-400">{app.lead_code}</span>
                    {/* City type badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${app.city_type === 'fixed' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                      {app.city_type === 'fixed'
                        ? (ja ? '都市固定' : bn ? 'ফিক্সড সিটি' : 'Fixed City')
                        : (ja ? '都市希望' : bn ? 'পছন্দের সিটি' : 'Preferred City')}
                    </span>
                    {app.already_selected && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        ✓ {ja ? '選択済み' : bn ? 'নির্বাচিত' : 'Selected'}
                      </span>
                    )}
                  </div>

                  {/* Info grid — anonymized */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                    <InfoRow label={ja ? '国' : bn ? 'দেশ' : 'Country'} value={app.target_country} />
                    {app.target_city && <InfoRow label={ja ? '都市' : bn ? 'শহর' : 'City'} value={app.target_city} />}
                    {app.target_course && <InfoRow label={ja ? 'コース' : bn ? 'কোর্স' : 'Course'} value={app.target_course} />}
                    {app.target_intake && <InfoRow label={ja ? '入学予定' : bn ? 'ইনটেক' : 'Intake'} value={new Date(app.target_intake).toLocaleDateString(undefined, { dateStyle: 'medium' })} />}
                    {app.age && <InfoRow label={ja ? '年齢' : bn ? 'বয়স' : 'Age'} value={`${app.age} ${ja ? '歳' : bn ? 'বছর' : 'yrs'}`} />}
                    {app.last_education && <InfoRow label={ja ? '最終学歴' : bn ? 'শেষ শিক্ষা' : 'Last Education'} value={app.last_education} />}
                    {app.gpa && <InfoRow label={ja ? 'GPA / 成績' : bn ? 'GPA / ফলাফল' : 'GPA / Result'} value={app.gpa} />}
                    {app.jlpt_nat_score && <InfoRow label="JLPT / NAT" value={app.jlpt_nat_score} />}
                  </div>
                </div>

                {/* Select button */}
                <div className="shrink-0 self-center">
                  {app.already_selected ? (
                    <div className="text-xs font-semibold text-indigo-600 px-3 py-2">✓ {ja ? '選択済み' : bn ? 'নির্বাচিত' : 'Selected'}</div>
                  ) : (
                    <button
                      onClick={() => { setSelectingId(app.id); select.mutate(app.id); }}
                      disabled={select.isPending && selectingId === app.id}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {select.isPending && selectingId === app.id
                        ? '...'
                        : (ja ? '選択する' : bn ? 'নির্বাচন করুন' : 'Select')}
                    </button>
                  )}
                  {selectOk === app.id && (
                    <p className="text-[10px] text-indigo-600 font-semibold text-center mt-1">
                      ✓ {ja ? '追加しました' : bn ? 'যোগ হয়েছে' : 'Added'}
                    </p>
                  )}
                </div>
              </div>
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
