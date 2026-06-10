'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AffiliateUpgradePage() {
  const { lang } = useLang();
  const router = useRouter();
  const qc = useQueryClient();
  const affiliateType = (qc.getQueryData<{ affiliate_type?: string }>(['affiliate-dashboard']))?.affiliate_type;
  const isLocal = !affiliateType || affiliateType === 'local';

  const [orgName, setOrgName]     = useState('');
  const [reason, setReason]       = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.post('/affiliate/upgrade-request', { organization_name: orgName, reason }),
    onSuccess: () => setSubmitted(true),
  });

  useEffect(() => {
    if (affiliateType && affiliateType !== 'local') router.replace('/dashboard/affiliate');
  }, [affiliateType, router]);

  const ja = lang === 'ja'; const bn = lang === 'bn';

  if (!isLocal) return null;

  return (
    <DashboardLayout title={ja ? 'インスティテューションに申請' : bn ? 'ইনস্টিটিউশনসে আবেদন' : 'Apply for Institutions Affiliate'}>

      {submitted ? (
        <div className="max-w-md mx-auto py-12 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-black text-slate-900 mb-2">
            {ja ? '申請を受け付けました！' : bn ? 'আবেদন পাওয়া গেছে!' : 'Application Received!'}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {ja ? '2〜3営業日以内にご連絡します。' : bn ? '২-৩ কার্যদিবসের মধ্যে যোগাযোগ করা হবে।' : 'Our team will review and contact you within 2–3 business days.'}
          </p>
          <Link href="/dashboard/affiliate" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors">
            {ja ? 'ダッシュボードへ' : bn ? 'ড্যাশবোর্ডে ফিরুন' : 'Back to Dashboard'}
          </Link>
        </div>
      ) : (
        <div className="max-w-lg mx-auto">
          {/* Benefits */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🌐</span>
              <h2 className="font-bold text-slate-900">{ja ? 'インスティテューションの特典' : bn ? 'ইনস্টিটিউশনসের সুবিধা' : 'Institutions Affiliate Benefits'}</h2>
            </div>
            {[
              { icon: '🏫', text: ja ? '学校・機関をTensaiのために管理' : bn ? 'স্কুল ও প্রতিষ্ঠান ম্যানেজ করুন' : 'Manage schools & institutions for Tensai' },
              { icon: '👤', text: ja ? 'フィールドエージェントを管理' : bn ? 'ফিল্ড এজেন্ট ম্যানেজ করুন' : 'Manage field agents & employees' },
              { icon: '💰', text: ja ? '入学ごとに%コミッション' : bn ? 'প্রতি ভর্তিতে % কমিশন' : 'Earn % commission per enrollment' },
              { icon: '📈', text: ja ? '高収益・長期パートナーシップ' : bn ? 'বেশি আয় ও দীর্ঘমেয়াদী সম্পর্ক' : 'Higher earnings & long-term partnership' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-700 mt-2">
                <span>{item.icon}</span><span>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-800 mb-4">{ja ? '申請フォーム' : bn ? 'আবেদন ফর্ম' : 'Application Form'}</h3>
            <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {ja ? '組織名（任意）' : bn ? 'প্রতিষ্ঠানের নাম (ঐচ্ছিক)' : 'Organization Name (optional)'}
                </label>
                <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400"
                  placeholder={ja ? '例: Asia Education Group' : bn ? 'যেমন: Asia Education Group' : 'e.g. Asia Education Group'}
                  value={orgName} onChange={e => setOrgName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {ja ? '申請理由（任意）' : bn ? 'আবেদনের কারণ (ঐচ্ছিক)' : 'Why upgrade? (optional)'}
                </label>
                <textarea rows={4} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400 resize-none"
                  placeholder={ja ? '管理予定の機関や経験について...' : bn ? 'কোন প্রতিষ্ঠান ম্যানেজ করতে চান বা অভিজ্ঞতা লিখুন...' : 'Describe institutions you plan to manage or your experience...'}
                  value={reason} onChange={e => setReason(e.target.value)} />
              </div>
              {mutation.isError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
                  ⚠️ {ja ? '送信失敗。再試行してください。' : bn ? 'পাঠাতে ব্যর্থ। আবার চেষ্টা করুন।' : 'Submission failed. Please try again.'}
                </p>
              )}
              <div className="flex gap-3">
                <Link href="/dashboard/affiliate" className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl text-center">
                  {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
                </Link>
                <button type="submit" disabled={mutation.isPending}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-white text-sm font-bold rounded-xl transition-colors">
                  {mutation.isPending ? '...' : (ja ? '申請する' : bn ? 'আবেদন করুন' : 'Submit Application')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
