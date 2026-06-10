'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import StudentInfoForm from '@/components/student/StudentInfoForm';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function StudentInfoPage() {
  const { lang } = useLang();

  const { data, refetch } = useQuery({
    queryKey: ['student-profile-info'],
    queryFn: () => api.get('/student/profile').then(r => r.data),
    staleTime: 30_000,
  });

  const title =
    lang === 'bn' ? 'আপনার সকল তথ্য জমা দিন' :
    lang === 'ja' ? '全情報を提出する' :
    'Submit Your Information';

  return (
    <DashboardLayout title={title}>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 mb-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl shrink-0">📋</div>
        <div>
          <h2 className="font-bold text-slate-900 text-base">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn'
              ? 'ব্যক্তিগত, পারিবারিক, ঠিকানা, শিক্ষা ও স্পনসরের তথ্য সম্পূর্ণ করুন। এই তথ্য আপনার ভিসা আবেদনে ব্যবহার হবে।'
              : lang === 'ja'
              ? '個人・家族・住所・学歴・保証人の情報を入力してください。ビザ申請に使用されます。'
              : 'Complete your personal, family, address, educational background and sponsor details. This information will be used in your visa application.'}
          </p>
        </div>
      </div>

      {/* The form */}
      <StudentInfoForm
        initialProfile={data?.profile ?? undefined}
        onSaved={() => refetch()}
      />

    </DashboardLayout>
  );
}
