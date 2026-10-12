'use client';
import StudentLayout from '@/components/shared/StudentLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

interface CvState {
  enabled: boolean;
  paused: boolean;
  stage: 'filling' | 'review' | 'sent' | null;
  missing: string[];
  application: { id: number; application_code: string; progress: number; status: string } | null;
  assistant: { used: number; limit: number; remaining: number } | null;
}

const WA_ICON = (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.04 21.5h-.01a9.47 9.47 0 01-4.83-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.44 9.44 0 01-1.45-5.04c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.91.99 6.7 2.78a9.4 9.4 0 012.77 6.7c0 5.23-4.25 9.46-9.46 9.46zM20.52 3.45A11.38 11.38 0 0012.04.1C5.74.1.62 5.22.62 11.52c0 2.01.53 3.98 1.53 5.71L.5 23.5l6.41-1.68a11.4 11.4 0 005.12 1.3h.01c6.3 0 11.42-5.12 11.42-11.42 0-3.05-1.19-5.92-3.34-8.07z" />
  </svg>
);

export default function StudentCVPage() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const ja = lang === 'ja'; const bn = lang === 'bn';
  const t = (en: string, ja_: string, bn_: string) => ja ? ja_ : bn ? bn_ : en;

  const isStudent = user?.gateway_type === 'student';

  const { data: cv, isLoading, isError } = useQuery<CvState>({
    queryKey: ['student-cv'],
    queryFn: () => api.get('/student/cv').then(r => r.data),
    enabled: !!isStudent,
  });

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ['public-settings'],
    queryFn: () => api.get('/settings/public').then(r => r.data),
    staleTime: 5 * 60_000,
  });

  const qc = useQueryClient();
  const [consent, setConsent] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const submitCv = useMutation({
    mutationFn: () => api.post('/student/cv/submit', { consent: true }).then(r => r.data as CvState),
    onSuccess: (data) => { setSubmitError(''); qc.setQueryData(['student-cv'], data); },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSubmitError(msg ?? t('Could not send. Please try again.', '送信できませんでした。もう一度お試しください。', 'পাঠানো যায়নি। আবার চেষ্টা করুন।'));
    },
  });

  const waDigits = (settings?.support_whatsapp ?? '').replace(/\D+/g, '');
  const waText = t(
    'Hello, I would like to open the My CV assistant on my account.',
    'こんにちは。アカウントの「マイCV」アシスタントを開きたいです。',
    'আসসালামু আলাইকুম, আমি আমার একাউন্টে "আমার সিভি" অ্যাসিস্ট্যান্ট চালু করতে চাই।'
  );
  const waHref = waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent(waText)}` : null;

  const initials = (user?.name ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const progress = cv?.application?.progress ?? 0;

  return (
    <StudentLayout title={t('My CV', '私の履歴書', 'আমার সিভি')}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Profile hero ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-green-700 to-emerald-600 px-6 py-8 text-center relative">
            <div className="relative inline-block mb-3">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={`${user?.name ?? 'User'} profile photo`} className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg mx-auto" />
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
          </div>
        </div>

        {isLoading && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-10 text-center text-sm text-slate-400">
            {t('Loading…', '読み込み中…', 'লোড হচ্ছে…')}
          </div>
        )}

        {isError && (
          <div className="bg-white rounded-2xl border border-rose-200 shadow-sm px-6 py-8 text-center text-sm text-rose-600">
            {t('Could not load this section. Please try again later.', 'このセクションを読み込めませんでした。後でもう一度お試しください。', 'এই অংশটি লোড করা যায়নি। একটু পরে আবার চেষ্টা করুন।')}
          </div>
        )}

        {/* ── Not opened yet (or paused): assistant introduction + WhatsApp ── */}
        {cv && !cv.enabled && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-8">
              <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-base font-black text-slate-800 mb-2 text-center">
                {cv.paused
                  ? t('Your CV assistant is paused', 'CVアシスタントは一時停止中です', 'আপনার সিভি অ্যাসিস্ট্যান্ট এখন বন্ধ আছে')
                  : t('My job-search assistant', '仕事探しアシスタント', 'আমার চাকরি খুঁজে পাওয়ার অ্যাসিস্ট্যান্ট')}
              </p>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed text-center">
                {cv.paused
                  ? t(
                      'Your CV is safe. Please contact us on WhatsApp to switch the assistant back on.',
                      'CVは保存されています。アシスタントを再開するにはWhatsAppでご連絡ください。',
                      'আপনার সিভি সুরক্ষিত আছে। অ্যাসিস্ট্যান্ট আবার চালু করতে WhatsApp-এ যোগাযোগ করুন।'
                    )
                  : t(
                      'This AI assistant asks you a few simple questions and builds a clear CV for you. With help from our team, your CV is checked and presented for suitable work. If you would like to use it, contact us on WhatsApp and we will switch it on for your account.',
                      'このAIアシスタントは、簡単な質問に答えるだけで、わかりやすいCVを作成します。スタッフのサポートのもとCVを確認し、合う仕事に向けて提示します。ご利用希望の方はWhatsAppでご連絡ください。アカウントで有効にします。',
                      'এই এআই (AI) অ্যাসিস্ট্যান্ট আপনাকে কয়েকটি সহজ প্রশ্ন করে একটি পরিষ্কার সিভি বানিয়ে দেবে। এডমিনের সহযোগিতায় আপনার সিভি যাচাই করে উপযুক্ত কাজের জন্য উপস্থাপন করা হবে। ব্যবহার করতে রাজি থাকলে নিচের WhatsApp নাম্বারে যোগাযোগ করুন, আমরা আপনার একাউন্টে এটি চালু করে দেব।'
                    )}
              </p>

              {!cv.paused && (
                <ol className="mt-6 space-y-3 max-w-md mx-auto">
                  {[
                    t('Message us on WhatsApp.', 'WhatsAppでご連絡ください。', 'WhatsApp-এ আমাদের জানান।'),
                    t('We switch the assistant on for your account.', 'アカウントでアシスタントを有効にします。', 'আমরা আপনার একাউন্টে অ্যাসিস্ট্যান্ট চালু করে দিই।'),
                    t('Answer the assistant’s simple questions. Your CV is built as you go.', 'アシスタントの簡単な質問に答えると、CVが出来上がります。', 'অ্যাসিস্ট্যান্টের সহজ প্রশ্নের উত্তর দিন, সিভি তৈরি হয়ে যাবে।'),
                    t('Our team checks it and, with your permission, presents it to suitable employers and partners.', 'スタッフが確認し、ご本人の許可のもと、合う雇用主やパートナーに提示します。', 'আমাদের টিম সিভি দেখে ঠিক করে দেয় এবং আপনার অনুমতি নিয়ে উপযুক্ত নিয়োগকর্তা বা অংশীদারের কাছে উপস্থাপন করে।'),
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}

              {waHref ? (
                <a href={waHref} target="_blank" rel="noopener noreferrer"
                  className="mt-6 flex items-center justify-center gap-2 w-full sm:w-auto sm:mx-auto sm:inline-flex px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white text-sm font-black transition-colors">
                  {WA_ICON}
                  {t('Contact us on WhatsApp', 'WhatsAppで連絡する', 'WhatsApp-এ যোগাযোগ করুন')}
                  {settings?.support_whatsapp ? <span className="font-semibold opacity-90">· {settings.support_whatsapp}</span> : null}
                </a>
              ) : null}

              <p className="mt-5 text-xs text-slate-400 text-center leading-relaxed max-w-md mx-auto">
                {t(
                  'We are a consultancy. We help you prepare and present your profile; we cannot promise a job or a visa. Your CV is not shown to anyone without your permission.',
                  '当社はコンサルタント会社です。プロフィールの準備と提示をお手伝いしますが、仕事やビザをお約束することはできません。ご本人の許可なくCVを他の人に見せることはありません。',
                  'আমরা একটি পরামর্শদাতা প্রতিষ্ঠান। প্রোফাইল তৈরি ও উপস্থাপনে সাহায্য করি; চাকরি বা ভিসার নিশ্চয়তা দিতে পারি না। আপনার অনুমতি ছাড়া আপনার সিভি কাউকে দেখানো হয় না।'
                )}
              </p>
            </div>
          </div>
        )}

        {/* ── Opened by staff: CV status and the way into the form ── */}
        {cv?.enabled && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-7">
              <p className="text-base font-black text-slate-800 mb-1">
                {t('Your CV', 'あなたのCV', 'আপনার সিভি')}
              </p>
              <p className="text-sm text-slate-500 leading-relaxed">
                {progress >= 100
                  ? t('Your CV is complete. You can still update it any time.', 'CVは完成しています。いつでも更新できます。', 'আপনার সিভি সম্পূর্ণ হয়েছে। চাইলে যেকোনো সময় হালনাগাদ করতে পারবেন।')
                  : t('Your assistant is on. Answer step by step; your answers are saved as you go and our team will check your CV.', 'アシスタントが有効です。順番に回答してください。回答は自動的に保存され、スタッフがCVを確認します。', 'আপনার অ্যাসিস্ট্যান্ট চালু হয়েছে। ধাপে ধাপে উত্তর দিন; আপনার উত্তর নিজে থেকেই সংরক্ষিত হবে এবং আমাদের টিম আপনার সিভি যাচাই করে দেবে।')}
              </p>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
                  <span>{t('Completed', '入力済み', 'সম্পন্ন')}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Stage: with our team for review / checked / still filling */}
              {cv.stage === 'review' && (
                <div className="mt-5 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800 leading-relaxed">
                  {t(
                    'Your CV has been sent to our team. We will check it and contact you if anything needs to be corrected.',
                    'CVをスタッフに送信しました。確認し、修正が必要な場合はご連絡します。',
                    'আপনার সিভি আমাদের টিমের কাছে গেছে। আমরা দেখে নেব, কিছু ঠিক করার থাকলে আপনাকে জানাব।'
                  )}
                </div>
              )}
              {cv.stage === 'sent' && (
                <div className="mt-5 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-800 leading-relaxed">
                  {t(
                    'Our team has checked your CV and added it to our list. If your details change, you can update your CV and tell us.',
                    'スタッフがCVを確認し、リストに追加しました。情報が変わった場合はCVを更新してお知らせください。',
                    'আমাদের টিম আপনার সিভি দেখে আমাদের তালিকায় যুক্ত করেছে। তথ্য বদলালে সিভি হালনাগাদ করে আমাদের জানান।'
                  )}
                </div>
              )}

              {cv.stage === 'filling' && cv.application && (
                <div className="mt-5 rounded-xl border border-slate-200 px-4 py-4">
                  {cv.missing.length > 0 ? (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {t('Still needed before you can send it:', '送信前に必要な項目:', 'পাঠানোর আগে এগুলো দিতে হবে:')}{' '}
                      <span className="font-semibold text-slate-700">{cv.missing.map(m => m.split(' / ')[0]).join(', ')}</span>
                    </p>
                  ) : (
                    <>
                      <label className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed cursor-pointer">
                        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                          className="mt-1 w-4 h-4 accent-green-600 shrink-0" />
                        <span>
                          {t(
                            'I agree that Tensai Consultancy may check my CV and, with my permission, present it to suitable employers and partners.',
                            'Tensai Consultancyが私のCVを確認し、私の許可のもとで合う雇用主やパートナーに提示することに同意します。',
                            'আমি সম্মতি দিচ্ছি যে Tensai Consultancy আমার সিভি যাচাই করবে এবং আমার অনুমতি নিয়ে উপযুক্ত নিয়োগকর্তা বা অংশীদারের কাছে উপস্থাপন করতে পারবে।'
                          )}
                        </span>
                      </label>
                      <button
                        onClick={() => submitCv.mutate()}
                        disabled={!consent || submitCv.isPending}
                        className="mt-4 w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-black transition-colors">
                        {submitCv.isPending
                          ? t('Sending…', '送信中…', 'পাঠানো হচ্ছে…')
                          : t('Send my CV for review', 'レビュー用にCVを送信', 'রিভিউয়ের জন্য সিভি পাঠান')}
                      </button>
                    </>
                  )}
                  {submitError && <p className="mt-3 text-xs text-rose-600">{submitError}</p>}
                </div>
              )}

              {cv.application && (
                <Link href={`/dashboard/student/leads?app=${cv.application.id}`}
                  className="mt-6 flex items-center justify-center w-full sm:w-auto sm:inline-flex px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-black transition-colors">
                  {progress > 0
                    ? t('Continue my CV', 'CVを続ける', 'সিভি চালিয়ে যান')
                    : t('Start my CV', 'CVを始める', 'সিভি শুরু করুন')}
                </Link>
              )}
            </div>
          </div>
        )}

      </div>
    </StudentLayout>
  );
}
