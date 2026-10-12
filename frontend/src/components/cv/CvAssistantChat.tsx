'use client';
import api from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { CvLang, CvState, pickLang } from './cvTypes';

// One question at a time, taken from the Job CV form. Every answer is saved
// straight away, so the person can leave and come back to the same place.
export default function CvAssistantChat({
  cv, lang, onState,
}: { cv: CvState; lang: CvLang; onState: (next: CvState) => void }) {
  const t = (en: string, ja: string, bn: string) => (lang === 'ja' ? ja : lang === 'bn' ? bn : en);
  const interview = cv.interview;
  const q = interview?.question ?? null;

  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  // A new question starts with an empty box.
  useEffect(() => { setValue(''); setError(''); }, [q?.key]);

  const send = useMutation({
    mutationFn: (v: string) => api.post('/student/cv/answer', { field_key: q!.key, value: v }).then(r => r.data as CvState),
    onSuccess: next => { setError(''); onState(next); },
    onError: (e: unknown) => {
      const res = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      setError(
        res?.errors?.value?.[0] ?? res?.message ??
        t('Could not save. Please try again.', '保存できませんでした。もう一度お試しください。', 'সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।')
      );
    },
  });

  const summarize = useMutation({
    mutationFn: () => api.post('/student/cv/polish').then(r => r.data as CvState),
    onSuccess: next => { setError(''); onState(next); },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? t('Could not write the summary now.', '今は概要を作成できません。', 'এখন সারসংক্ষেপ লেখা যায়নি।'));
    },
  });

  if (!interview) return null;

  const busy = send.isPending || summarize.isPending;
  const done = interview.total > 0 ? Math.min(interview.answered, interview.total) : 0;
  const assistant = cv.assistant;

  const inp = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between gap-3">
        <p className="text-sm font-black text-green-800">
          {t('Your CV assistant', 'CVアシスタント', 'আপনার সিভি অ্যাসিস্ট্যান্ট')}
        </p>
        <p className="text-xs font-semibold text-green-700">
          {done} / {interview.total}
        </p>
      </div>

      <div className="px-5 py-5">
        {q ? (
          <div>
            <p className="text-[11px] font-black tracking-wider uppercase text-slate-400">{pickLang(q.group, lang)}</p>
            <div className="mt-2 rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 text-sm text-slate-800 leading-relaxed">
              {pickLang(q.label, lang)}
              {q.required && <span className="text-rose-500"> *</span>}
              {q.hint && <span className="block mt-1 text-xs text-slate-400">{q.hint}</span>}
            </div>

            <div className="mt-4">
              {q.type === 'select' ? (
                <div className="flex flex-wrap gap-2">
                  {q.options.map(o => (
                    <button key={o} type="button" disabled={busy}
                      onClick={() => send.mutate(o)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-green-500 hover:bg-green-50 text-sm font-semibold text-slate-700 transition-colors disabled:opacity-50">
                      {pickLang(o, lang)}
                    </button>
                  ))}
                </div>
              ) : q.type === 'textarea' ? (
                <textarea className={`${inp} resize-none`} rows={4} value={value} maxLength={1000}
                  placeholder={q.placeholder ?? t('Type your answer…', '回答を入力…', 'আপনার উত্তর লিখুন…')}
                  onChange={e => setValue(e.target.value)} />
              ) : (
                <input className={inp} value={value}
                  type={q.type === 'date' ? 'date' : q.type === 'number' ? 'number' : q.type === 'tel' ? 'tel' : q.type === 'email' ? 'email' : 'text'}
                  maxLength={200}
                  placeholder={q.placeholder ?? t('Type your answer…', '回答を入力…', 'আপনার উত্তর লিখুন…')}
                  onChange={e => setValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && value.trim() && !busy) send.mutate(value); }} />
              )}
            </div>

            {q.type !== 'select' && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button type="button" disabled={busy || !value.trim()} onClick={() => send.mutate(value)}
                  className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-black transition-colors">
                  {send.isPending ? t('Saving…', '保存中…', 'সংরক্ষণ হচ্ছে…') : t('Next', '次へ', 'পরবর্তী')}
                </button>
                {!q.required && (
                  <button type="button" disabled={busy} onClick={() => send.mutate('')}
                    className="px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
                    {t('Skip', 'スキップ', 'এড়িয়ে যান')}
                  </button>
                )}
              </div>
            )}
            {q.type === 'select' && !q.required && (
              <button type="button" disabled={busy} onClick={() => send.mutate('')}
                className="mt-3 text-sm font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-50">
                {t('Skip', 'スキップ', 'এড়িয়ে যান')}
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm font-black text-slate-800">
              {t('All questions are done.', 'すべての質問が終わりました。', 'সব প্রশ্নের উত্তর দেওয়া হয়েছে।')}
            </p>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">
              {t(
                'Check your CV on the right (or in the Preview tab). You can change any answer from the form.',
                'CVを確認してください。回答はフォームからいつでも変更できます。',
                'আপনার সিভি দেখে নিন (প্রিভিউ ট্যাবে)। যেকোনো উত্তর ফর্ম থেকে বদলাতে পারবেন।'
              )}
            </p>
          </div>
        )}

        {/* English summary for employers: only when staff have configured it. */}
        {assistant?.summary_available && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button type="button" disabled={busy || assistant.remaining <= 0} onClick={() => summarize.mutate()}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50 text-sm font-bold text-slate-700 transition-colors disabled:opacity-50">
              {summarize.isPending
                ? t('Writing…', '作成中…', 'লেখা হচ্ছে…')
                : cv.preview?.summary
                  ? t('Write the English summary again', '英語の概要を作り直す', 'ইংরেজি সারসংক্ষেপ আবার লিখুন')
                  : t('Write my English summary', '英語の概要を作成', 'আমার ইংরেজি সারসংক্ষেপ লিখুন')}
            </button>
            <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
              {t(
                'Uses only your job details, not your name or contact details. Our team checks it before anything is shared.',
                '仕事に関する情報のみを使用し、名前や連絡先は使いません。共有前にスタッフが確認します。',
                'শুধু আপনার কাজের তথ্য ব্যবহার হয়, নাম বা যোগাযোগের তথ্য নয়। কিছু শেয়ার করার আগে আমাদের টিম দেখে নেয়।'
              )}
            </p>
          </div>
        )}

        {error && <p className="mt-4 text-xs text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
