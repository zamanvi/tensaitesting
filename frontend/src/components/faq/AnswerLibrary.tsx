'use client';
import api from '@/lib/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

type Lang = 'en' | 'bn' | 'ja';

interface FaqItem {
  id: number;
  category: string;
  question: string;
  answer: string;
  source_url: string | null;
  verified_on: string | null;
}

interface FaqList {
  categories: { key: string; label: string }[];
  items: FaqItem[];
}

interface AskResult {
  outcome: 'matched' | 'suggested' | 'none';
  question_id: number;
  item: FaqItem | null;
  suggestions: { id: number; question: string }[];
}

// Category names in the three site languages (the API sends English labels).
const CATEGORY_LABELS: Record<string, Record<Lang, string>> = {
  ssw_basics:  { en: 'SSW basics', ja: 'SSWの基本', bn: 'SSW-এর মূল বিষয়' },
  language:    { en: 'Japanese language tests', ja: '日本語試験', bn: 'জাপানি ভাষা পরীক্ষা' },
  skills_test: { en: 'Skills tests', ja: '技能試験', bn: 'দক্ষতা পরীক্ষা' },
  caregiver:   { en: 'Caregiver (nursing care)', ja: '介護', bn: 'কেয়ারগিভার (নার্সিং কেয়ার)' },
  driver:      { en: 'Driver (automobile transport)', ja: 'ドライバー（自動車運送業）', bn: 'ড্রাইভার (অটোমোবাইল ট্রান্সপোর্ট)' },
  process:     { en: 'Process and paperwork', ja: '手続きと書類', bn: 'প্রক্রিয়া ও কাগজপত্র' },
  safety:      { en: 'Fees and staying safe', ja: '費用と安全', bn: 'খরচ ও সতর্কতা' },
  tensai:      { en: 'About our service and CV', ja: '当社のサービスとCV', bn: 'আমাদের সেবা ও সিভি' },
};

// Questions and answers that the Tensai team has checked against their
// sources. Nothing here is written by an AI. The whole section stays hidden
// until staff have verified at least one entry.
export default function AnswerLibrary({ lang, waHref }: { lang: Lang; waHref: string | null }) {
  const t = (en: string, ja: string, bn: string) => (lang === 'ja' ? ja : lang === 'bn' ? bn : en);

  const { data } = useQuery<FaqList>({
    queryKey: ['student-faq', lang],
    queryFn: () => api.get('/student/faq', { params: { lang } }).then(r => r.data),
    staleTime: 5 * 60_000,
  });

  const [text, setText] = useState('');
  const [result, setResult] = useState<AskResult | null>(null);
  const [shown, setShown] = useState<FaqItem | null>(null);   // an entry picked from suggestions
  const [open, setOpen] = useState<number | null>(null);
  const [rated, setRated] = useState<Record<number, boolean>>({});

  const items = data?.items ?? [];
  const byId = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);

  const ask = useMutation({
    mutationFn: (q: string) => api.post('/student/faq/ask', { question: q, lang }).then(r => r.data as AskResult),
    onSuccess: r => { setResult(r); setShown(null); },
  });

  const rate = useMutation({
    mutationFn: (v: { item_id: number; helpful: boolean; question_id?: number }) => api.post('/student/faq/feedback', v),
  });

  if (items.length === 0) return null;   // nothing verified yet: show nothing

  const answerItem = shown ?? result?.item ?? null;

  function submit() {
    const q = text.trim();
    if (q.length >= 3 && !ask.isPending) ask.mutate(q);
  }

  const renderItem = (item: FaqItem, questionId?: number) => {
    return (
      <div key={item.id} className="rounded-2xl border border-green-100 bg-green-50/50 px-4 py-4">
        <p className="text-sm font-black text-slate-800">{item.question}</p>
        <p className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-line">{item.answer}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-400">
          {item.verified_on && <span>{t('Checked by our team on', 'スタッフ確認日', 'আমাদের টিম যাচাই করেছে')} {item.verified_on}</span>}
          {item.source_url && (
            <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
              {t('Source', '情報源', 'সূত্র')}
            </a>
          )}
        </div>
        {rated[item.id] === undefined ? (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-500">{t('Was this helpful?', 'お役に立ちましたか？', 'এটি কি কাজে লেগেছে?')}</span>
            {[true, false].map(v => (
              <button key={String(v)} type="button"
                onClick={() => { setRated(r => ({ ...r, [item.id]: v })); rate.mutate({ item_id: item.id, helpful: v, question_id: questionId }); }}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:border-green-500 text-xs font-bold text-slate-600">
                {v ? t('Yes', 'はい', 'হ্যাঁ') : t('No', 'いいえ', 'না')}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">{t('Thank you.', 'ありがとうございます。', 'ধন্যবাদ।')}</p>
        )}
      </div>
    );
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" aria-labelledby="faq-title">
      <div className="px-6 py-5 border-b border-slate-100">
        <h2 id="faq-title" className="text-base font-black text-slate-800">
          {t('Questions and answers', 'よくある質問', 'প্রশ্ন ও উত্তর')}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
          {t('Answers checked by our team. No automatic guesses.', 'スタッフが確認した回答です。自動の推測はありません。', 'আমাদের টিমের যাচাই-করা উত্তর। কোনো স্বয়ংক্রিয় অনুমান নয়।')}
        </p>
      </div>

      <div className="px-6 py-5 space-y-4">
        <form onSubmit={e => { e.preventDefault(); submit(); }} className="flex gap-2">
          <input value={text} onChange={e => setText(e.target.value)} maxLength={300}
            placeholder={t('Type your question…', '質問を入力…', 'আপনার প্রশ্ন লিখুন…')}
            className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500" />
          <button type="submit" disabled={text.trim().length < 3 || ask.isPending}
            className="px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-black transition-colors">
            {ask.isPending ? '…' : t('Search', '検索', 'খুঁজুন')}
          </button>
        </form>
        <p className="text-[11px] text-slate-400">
          {t('Please do not write phone, passport or ID numbers here.', '電話番号・パスポート番号・ID番号は書かないでください。', 'এখানে ফোন, পাসপোর্ট বা আইডি নম্বর লিখবেন না।')}
        </p>

        {/* Result */}
        {answerItem && renderItem(answerItem, shown ? undefined : result?.question_id)}

        {result && !answerItem && result.outcome === 'suggested' && (
          <div>
            <p className="text-sm font-bold text-slate-700">{t('Did you mean one of these?', 'こちらのどれかですか？', 'আপনি কি এগুলোর কোনোটি জানতে চান?')}</p>
            <div className="mt-2 flex flex-col gap-2">
              {result.suggestions.map(s => (
                <button key={s.id} type="button" onClick={() => { const it = byId.get(s.id); if (it) setShown(it); }}
                  className="text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50 text-sm text-slate-700 transition-colors">
                  {s.question}
                </button>
              ))}
            </div>
          </div>
        )}

        {result && !answerItem && (result.outcome === 'none' || (result.outcome === 'suggested' && result.suggestions.length === 0)) && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
            <p className="text-sm font-bold text-amber-900">
              {t('We do not have a checked answer for this yet.', 'この質問にはまだ確認済みの回答がありません。', 'এই প্রশ্নের যাচাই-করা উত্তর আমাদের কাছে এখনো নেই।')}
            </p>
            <p className="mt-1 text-xs text-amber-800 leading-relaxed">
              {t('Our team will see your question. You can also ask us directly.', 'スタッフがあなたの質問を確認します。直接お問い合わせいただくこともできます。', 'আমাদের টিম আপনার প্রশ্নটি দেখবে। চাইলে সরাসরিও জিজ্ঞেস করতে পারেন।')}
            </p>
            {waHref && (
              <a href={waHref} target="_blank" rel="noopener noreferrer"
                className="mt-3 inline-flex px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white text-xs font-black">
                {t('Ask on WhatsApp', 'WhatsAppで質問', 'WhatsApp-এ জিজ্ঞেস করুন')}
              </a>
            )}
          </div>
        )}

        {/* Browse */}
        <div className="pt-2">
          <p className="text-[11px] font-black tracking-wider uppercase text-slate-400">
            {t('Browse all', 'すべて見る', 'সব দেখুন')}
          </p>
          <div className="mt-2 space-y-4">
            {(data?.categories ?? []).map(c => {
              const inCat = items.filter(i => i.category === c.key);
              if (inCat.length === 0) return null;
              return (
                <div key={c.key}>
                  <p className="text-xs font-bold text-slate-500">{CATEGORY_LABELS[c.key]?.[lang] ?? c.label}</p>
                  <div className="mt-1 divide-y divide-slate-100 rounded-xl border border-slate-100">
                    {inCat.map(i => (
                      <div key={i.id}>
                        <button type="button" onClick={() => setOpen(open === i.id ? null : i.id)} aria-expanded={open === i.id}
                          className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-start justify-between gap-3">
                          <span>{i.question}</span>
                          <span className="text-slate-300 shrink-0">{open === i.id ? '−' : '+'}</span>
                        </button>
                        {open === i.id && (
                          <div className="px-4 pb-4">
                            {renderItem(i)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
