'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface Student {
  id: number;
  name: string;
  gateway_type: string;
  status: string;
  joined_at: string;
  converted: boolean;
  lead_status: string | null;
  lead_code: string | null;
}

const LEAD_STATUS_COLOR: Record<string, string> = {
  new:                  'bg-slate-100 text-slate-600',
  profile_complete:     'bg-blue-100 text-blue-700',
  under_review:         'bg-amber-100 text-amber-700',
  shortlisted:          'bg-indigo-100 text-indigo-700',
  interview_scheduled:  'bg-violet-100 text-violet-700',
  interviewed:          'bg-purple-100 text-purple-700',
  offer_received:       'bg-cyan-100 text-cyan-700',
  accepted:             'bg-teal-100 text-teal-700',
  visa_processing:      'bg-blue-100 text-blue-700',
  visa_approved:        'bg-green-100 text-green-700',
  visa_rejected:        'bg-red-100 text-red-700',
  enrolled:             'bg-emerald-100 text-emerald-700',
  closed:               'bg-slate-200 text-slate-500',
  on_hold:              'bg-orange-100 text-orange-700',
};

export default function AffiliateStudentsPage() {
  const { lang } = useLang();
  const { user }  = useAuthStore();
  const qc = useQueryClient();
  const affiliateType = (qc.getQueryData<{ affiliate_type?: string }>(['affiliate-dashboard']))?.affiliate_type;
  if (affiliateType && affiliateType !== 'local') {
    if (typeof window !== 'undefined') window.location.replace('/dashboard/affiliate');
    return null;
  }
  const [copied, setCopied] = useState(false);
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const refCode = user?.affiliate_code ?? '';
  const refLink = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/register?ref=${refCode}`
    : `/auth/register?ref=${refCode}`;

  const { data: dash } = useQuery({
    queryKey: ['affiliate-dashboard'],
    queryFn: () => api.get('/affiliate/dashboard').then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['affiliate-referrals'],
    queryFn: () => api.get('/affiliate/referrals').then(r => r.data),
  });

  const students: Student[] = Array.isArray(data?.data) ? data.data : [];

  function copyLink() {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DashboardLayout title={ja ? '紹介した学生' : bn ? 'রেফার করা শিক্ষার্থী' : 'Referred Students'}>

      {/* Stats */}
      {dash && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: ja ? '合計紹介' : bn ? 'মোট রেফারেল' : 'Total Referred', value: dash.total_referrals ?? 0, color: 'bg-indigo-50 text-indigo-700' },
            { label: ja ? '成約済み' : bn ? 'কনভার্টেড' : 'Converted', value: dash.converted_referrals ?? 0, color: 'bg-emerald-50 text-emerald-700' },
            { label: ja ? '成約率' : bn ? 'কনভার্সন' : 'Conv. Rate', value: `${Math.round(dash.conversion_rate ?? 0)}%`, color: 'bg-amber-50 text-amber-700' },
            { label: ja ? '総収益' : bn ? 'মোট আয়' : 'Total Earned', value: `৳${Number(dash.total_earned ?? 0).toLocaleString()}`, color: 'bg-purple-50 text-purple-700' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs font-medium mt-0.5 opacity-80">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Referral link */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          {ja ? 'あなたの紹介リンク' : bn ? 'আপনার রেফারেল লিংক' : 'Your Referral Link'}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-mono break-all select-all">
            {refLink}
          </div>
          <button
            onClick={copyLink}
            className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              copied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {copied ? '✓ Copied' : (ja ? 'コピー' : bn ? 'কপি করুন' : 'Copy Link')}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {ja ? 'コード: ' : bn ? 'কোড: ' : 'Code: '}
          <span className="font-mono font-semibold text-slate-600">{refCode}</span>
        </p>
      </div>

      {/* Students list */}
      <div className="bg-white rounded-2xl border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">
            {ja ? '紹介した学生一覧' : bn ? 'রেফার করা শিক্ষার্থীর তালিকা' : 'All Referred Students'}
          </h2>
          {students.length > 0 && (
            <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">
              {students.length}
            </span>
          )}
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-3xl mb-2">🎓</div>
              <p className="font-medium text-slate-700 mb-1">
                {ja ? 'まだ紹介した学生はいません' : bn ? 'এখনো কোনো শিক্ষার্থী রেফার করেননি' : 'No students referred yet'}
              </p>
              <p className="text-xs text-slate-400 mb-4">
                {ja ? '紹介リンクを共有して学生を招待しましょう。' : bn ? 'রেফারেল লিংক শেয়ার করে শিক্ষার্থীদের আমন্ত্রণ জানান।' : 'Share your referral link to invite students.'}
              </p>
              <button onClick={copyLink} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
                {ja ? 'リンクをコピー' : bn ? 'লিংক কপি করুন' : 'Copy Your Link'}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {students.map(s => (
                <div key={s.id} className="flex flex-wrap items-center gap-3 py-3.5">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {s.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">{s.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-slate-400 capitalize">{s.gateway_type}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{new Date(s.joined_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {/* Lead pipeline status */}
                    {s.lead_status && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEAD_STATUS_COLOR[s.lead_status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {s.lead_status.replace(/_/g, ' ')}
                      </span>
                    )}
                    {/* Converted */}
                    {s.converted && (
                      <span className="text-xs font-semibold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                        ✓ {ja ? '成約' : bn ? 'কনভার্টেড' : 'Converted'}
                      </span>
                    )}
                    {/* User status */}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Commission info banner */}
      <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
        <span className="text-xl shrink-0">💡</span>
        <p className="text-xs text-slate-600 leading-relaxed">
          {ja
            ? `学生があなたのリンクから登録し、Tensaiを通じて入学が確定すると固定コミッション（৳${Number(dash?.commission_per_student ?? 5000).toLocaleString()}）が支払われます。`
            : bn
            ? `শিক্ষার্থী আপনার লিংক দিয়ে রেজিস্ট্রেশন করে Tensai-এর মাধ্যমে ভর্তি নিশ্চিত হলে আপনি ৳${Number(dash?.commission_per_student ?? 5000).toLocaleString()} কমিশন পাবেন।`
            : `You earn ৳${Number(dash?.commission_per_student ?? 5000).toLocaleString()} for each student who registers via your link and gets enrolled through Tensai.`}
        </p>
      </div>
    </DashboardLayout>
  );
}
