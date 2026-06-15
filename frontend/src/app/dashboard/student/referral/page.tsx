'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';

export default function StudentReferralPage() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const code = user?.affiliate_code ?? '';
  const referralLink = code ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/register?ref=${code}` : '';

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const title = ja ? '紹介' : bn ? 'রেফারেল' : 'Referral';

  return (
    <DashboardLayout title={title}>
      <div className="max-w-xl space-y-5">

        {/* Info card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
          <div className="text-3xl mb-3">🤝</div>
          <h2 className="font-bold text-slate-900 text-base mb-2">
            {ja ? 'Tensai紹介プログラム' : bn ? 'Tensai রেফারেল প্রোগ্রাম' : 'Tensai Referral Program'}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            {ja
              ? '友人や知人をTensaiに紹介して、彼らが日本留学を実現したとき、あなたにコミッションが支払われます。紹介された方がエージェンシーに登録され留学が完了した時点で報酬が確定します。'
              : bn
              ? 'আপনার পরিচিতদের Tensai-এ রেফার করুন। তারা সফলভাবে জাপান যাত্রা সম্পন্ন করলে আপনি কমিশন পাবেন। রেফারড ব্যক্তি এজেন্সিতে নিবন্ধিত হলে এবং ভর্তি প্রক্রিয়া সম্পন্ন হলে পুরস্কার নিশ্চিত হয়।'
              : 'Refer friends or acquaintances to Tensai. When they successfully complete their Japan study journey, you earn a commission. Reward is confirmed once the referred person registers with an agency and completes enrollment.'}
          </p>

          {/* Commission highlight */}
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl mb-5">
            <div className="text-2xl">💰</div>
            <div>
              <div className="font-bold text-green-800 text-sm">
                {ja ? '1紹介あたり ৳20,000' : bn ? 'প্রতি রেফারেলে ৳২০,০০০' : '৳20,000 per successful referral'}
              </div>
              <div className="text-xs text-green-700 mt-0.5">
                {ja ? '入学完了時に支払い' : bn ? 'ভর্তি সম্পন্ন হলে পরিশোধ' : 'Paid on enrollment completion'}
              </div>
            </div>
          </div>

          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold text-sm transition-colors"
            >
              {ja ? '紹介リンクを取得する' : bn ? 'রেফারেল লিংক পান' : 'Get my referral link'}
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {ja ? 'あなたのコード' : bn ? 'আপনার কোড' : 'Your code'}
                </label>
                <div className="font-mono text-sm font-bold text-green-800 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
                  {code || '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {ja ? '紹介リンク' : bn ? 'রেফারেল লিংক' : 'Referral link'}
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={referralLink}
                    className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 bg-slate-50 focus:outline-none"
                  />
                  <button
                    onClick={copyLink}
                    className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      copied
                        ? 'bg-green-100 text-green-800'
                        : 'bg-green-700 hover:bg-green-800 text-white'
                    }`}
                  >
                    {copied ? (ja ? 'コピー済み ✓' : bn ? 'কপি হয়েছে ✓' : 'Copied ✓') : (ja ? 'コピー' : bn ? 'কপি' : 'Copy')}
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                {ja ? 'このリンクを友人にシェアしてください。登録時に自動的にあなたの紹介として記録されます。'
                  : bn ? 'এই লিংকটি বন্ধুদের সাথে শেয়ার করুন। নিবন্ধনের সময় স্বয়ংক্রিয়ভাবে আপনার রেফারেল হিসেবে রেকর্ড হবে।'
                  : 'Share this link with friends. When they register, it is automatically recorded as your referral.'}
              </p>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
          <h3 className="font-bold text-slate-900 text-sm mb-4">
            {ja ? 'どのように機能するか' : bn ? 'কীভাবে কাজ করে' : 'How it works'}
          </h3>
          <div className="space-y-4">
            {[
              {
                num: '01',
                title: ja ? 'リンクをシェア' : bn ? 'লিংক শেয়ার করুন' : 'Share your link',
                desc: ja ? '友人にあなたの紹介リンクを送る' : bn ? 'বন্ধুকে আপনার রেফারেল লিংক পাঠান' : 'Send your referral link to a friend',
              },
              {
                num: '02',
                title: ja ? '友人が登録' : bn ? 'বন্ধু নিবন্ধন করেন' : 'Friend registers',
                desc: ja ? '友人がTensaiに登録し、エージェンシーとマッチング' : bn ? 'বন্ধু Tensai-এ নিবন্ধিত হন ও এজেন্সির সাথে মিলিত হন' : 'Your friend signs up and gets matched with an agency',
              },
              {
                num: '03',
                title: ja ? 'コミッション獲得' : bn ? 'কমিশন পান' : 'You earn commission',
                desc: ja ? '友人の入学完了後、৳20,000が支払われます' : bn ? 'বন্ধুর ভর্তি সম্পন্ন হলে আপনি ৳২০,০০০ পাবেন' : 'After enrollment completes, ৳20,000 is paid to you',
              },
            ].map(step => (
              <div key={step.num} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-800 font-bold text-xs flex items-center justify-center shrink-0">
                  {step.num}
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900">{step.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
