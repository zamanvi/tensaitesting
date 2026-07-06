'use client';
import StudentLayout from '@/components/shared/StudentLayout';
import StudentInfoForm from '@/components/student/StudentInfoForm';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function StudentInfoPage() {
  const { lang } = useLang();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['student-profile-info'],
    queryFn: () => api.get('/student/profile').then(r => r.data),
    staleTime: 30_000,
  });

  const title =
    lang === 'bn' ? 'আপনার সকল তথ্য জমা দিন' :
    lang === 'ja' ? '全情報を提出する' :
    'Submit Your Information';

  if (isLoading) {
    return (
      <StudentLayout title={title}>
        <div className="py-16 flex justify-center">
          <span className="w-7 h-7 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title={title}>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-5">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
          <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-slate-800">{title}</p>
            <p className="text-xs text-slate-400">
              {lang === 'bn'
                ? 'ব্যক্তিগত, পারিবারিক, ঠিকানা, শিক্ষা ও স্পনসরের তথ্য সম্পূর্ণ করুন।'
                : lang === 'ja'
                ? '個人・家族・住所・学歴・保証人の情報を入力してください。'
                : 'Complete your personal, family, address, education and sponsor details.'}
            </p>
          </div>
        </div>
      </div>

      {/* The form */}
      <StudentInfoForm
        initialProfile={data?.profile ?? undefined}
        onSaved={() => refetch()}
      />

    </StudentLayout>
  );
}
