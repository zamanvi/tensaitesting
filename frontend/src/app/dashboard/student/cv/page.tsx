'use client';
import StudentLayout from '@/components/shared/StudentLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

const CV_SECTIONS = [
  {
    id: 'personal',
    en: 'Personal Information', ja: '個人情報', bn: 'ব্যক্তিগত তথ্য',
    desc: { en: 'Name, date of birth, nationality, contact details', ja: '氏名、生年月日、国籍、連絡先', bn: 'নাম, জন্মতারিখ, জাতীয়তা, যোগাযোগ' },
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    color: 'text-green-600',
  },
  {
    id: 'objective',
    en: 'Career Objective', ja: '志望動機', bn: 'ক্যারিয়ার উদ্দেশ্য',
    desc: { en: 'A brief statement about your goals and aspirations', ja: '目標と志望動機を簡潔に記述', bn: 'আপনার লক্ষ্য ও আকাঙ্ক্ষার সংক্ষিপ্ত বিবরণ' },
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    color: 'text-emerald-600',
  },
  {
    id: 'education',
    en: 'Education', ja: '学歴', bn: 'শিক্ষাগত যোগ্যতা',
    desc: { en: 'Schools, colleges, universities and qualifications', ja: '学校、大学、資格', bn: 'স্কুল, কলেজ, বিশ্ববিদ্যালয় ও যোগ্যতা' },
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>,
    color: 'text-blue-500',
  },
  {
    id: 'experience',
    en: 'Work Experience', ja: '職歴', bn: 'কর্মঅভিজ্ঞতা',
    desc: { en: 'Jobs, internships and professional roles', ja: '仕事、インターンシップ、職種', bn: 'চাকরি, ইন্টার্নশিপ এবং পেশাদার ভূমিকা' },
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    color: 'text-amber-500',
  },
  {
    id: 'skills',
    en: 'Skills', ja: 'スキル', bn: 'দক্ষতা',
    desc: { en: 'Technical, professional and soft skills', ja: '技術、専門、ソフトスキル', bn: 'প্রযুক্তিগত, পেশাদার এবং সফট স্কিলস' },
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
    color: 'text-purple-500',
  },
  {
    id: 'languages',
    en: 'Languages', ja: '言語', bn: 'ভাষাদক্ষতা',
    desc: { en: 'Languages you speak and proficiency level', ja: '話せる言語と習熟度', bn: 'আপনি যে ভাষায় কথা বলেন এবং দক্ষতার স্তর' },
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>,
    color: 'text-cyan-500',
  },
  {
    id: 'certifications',
    en: 'Certifications', ja: '資格・認定', bn: 'সার্টিফিকেশন',
    desc: { en: 'Professional certifications and courses completed', ja: '専門資格と修了コース', bn: 'পেশাদার সার্টিফিকেট এবং সম্পন্ন কোর্স' },
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
    color: 'text-rose-500',
  },
  {
    id: 'references',
    en: 'References', ja: '推薦者', bn: 'রেফারেন্স',
    desc: { en: 'Professional or academic references', ja: '職業的または学術的な推薦者', bn: 'পেশাদার বা একাডেমিক রেফারেন্স' },
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    color: 'text-slate-500',
  },
];

export default function StudentCVPage() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const ja = lang === 'ja'; const bn = lang === 'bn';
  const t = (en: string, ja_: string, bn_: string) => ja ? ja_ : bn ? bn_ : en;

  const initials = (user?.name ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const completedSections = 0;
  const totalSections = CV_SECTIONS.length;
  const progress = Math.round((completedSections / totalSections) * 100);

  return (
    <StudentLayout title={t('My CV', '私の履歴書', 'আমার সিভি')}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── CV Profile Hero ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-green-700 to-emerald-600 px-6 py-8 text-center relative">
            {/* Avatar */}
            <div className="relative inline-block mb-3">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg mx-auto" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white/20 border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl font-black mx-auto">
                  {initials}
                </div>
              )}
              <Link href="/dashboard/student/settings"
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-white rounded-lg shadow flex items-center justify-center hover:bg-slate-50 transition-colors"
                title={t('Edit profile photo', '写真を編集', 'ছবি পরিবর্তন করুন')}
              >
                <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </Link>
            </div>
            <h2 className="text-xl font-black text-white">{user?.name ?? '—'}</h2>
            <p className="text-green-100 text-sm mt-0.5">{user?.email ?? ''}</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-xs text-green-200 font-semibold">
                {t('CV Completion', 'CV完成度', 'সিভি সম্পূর্ণতা')}
              </span>
              <span className="text-xs font-black text-white bg-white/20 px-2 py-0.5 rounded-full">{progress}%</span>
            </div>
            <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden mx-auto max-w-xs">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Download / Preview buttons */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/40">
            <p className="text-xs text-slate-500">
              {t('Fill all sections to complete your CV', 'すべてのセクションを入力してCVを完成させましょう', 'সব সেকশন পূরণ করে সিভি সম্পূর্ণ করুন')}
            </p>
            <button disabled className="flex items-center gap-1.5 px-3.5 py-2 bg-green-700 text-white text-xs font-bold rounded-xl opacity-50 cursor-not-allowed">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              {t('Download PDF', 'PDFダウンロード', 'PDF ডাউনলোড')}
            </button>
          </div>
        </div>

        {/* ── CV Sections ── */}
        <div className="space-y-3">
          {CV_SECTIONS.map((section) => {
            const label = ja ? section.ja : bn ? section.bn : section.en;
            const desc  = ja ? section.desc.ja : bn ? section.desc.bn : section.desc.en;
            return (
              <div key={section.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                  <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
                  <span className={`shrink-0 ${section.color}`}>{section.icon}</span>
                  <span className="text-sm font-bold text-slate-800 flex-1">{label}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                    {t('Empty', '未入力', 'খালি')}
                  </span>
                </div>
                <div className="px-5 py-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                  <button
                    className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 border border-green-200 text-green-700 hover:bg-green-50 text-xs font-bold rounded-xl transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    {t('Add', '追加', 'যোগ করুন')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Coming Soon notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <p className="text-sm font-bold text-amber-800">
              {t('CV Builder — Coming Soon', 'CV作成機能 — 近日公開', 'সিভি বিল্ডার — শীঘ্রই আসছে')}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {t('The full CV editor with PDF export will be available soon. Sections are being set up.', 'PDFエクスポート付きCVエディタは近日公開予定です。', 'PDF এক্সপোর্ট সহ সিভি এডিটর শীঘ্রই পাওয়া যাবে।')}
            </p>
          </div>
        </div>

      </div>
    </StudentLayout>
  );
}
