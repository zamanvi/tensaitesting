'use client';
import { CvLang, CvPreviewData, pickLang } from './cvTypes';

type CardPreview = Omit<CvPreviewData, 'progress'> & { progress?: number };

// The CV as a reader sees it. Staff see exactly the same layout in the admin
// panel ("Preview CV"), built from the same data on the server.
export default function CvPreviewCard({
  preview, lang, audience = 'owner', reference = null,
}: { preview: CardPreview; lang: CvLang; audience?: 'owner' | 'public'; reference?: string | null }) {
  const t = (en: string, ja: string, bn: string) => (lang === 'ja' ? ja : lang === 'bn' ? bn : en);
  const empty = preview.sections.length === 0 && !preview.headline && !preview.summary;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b-2 border-green-600">
        <p className="text-xl font-black text-slate-900 break-words">{preview.name || '—'}</p>
        {preview.headline && <p className="text-sm font-semibold text-green-700 mt-0.5 break-words">{preview.headline}</p>}
        {reference && (
          <p className="mt-2 text-[11px] font-bold tracking-wider text-slate-400">
            {t('REFERENCE', '参照番号', 'রেফারেন্স')}: <span className="text-slate-700">{reference}</span>
          </p>
        )}
      </div>

      <div className="px-6 py-5 space-y-5">
        {empty && (
          <p className="text-sm text-slate-400 leading-relaxed">
            {t(
              'Your CV will appear here as you answer the questions.',
              '質問に答えると、ここにCVが表示されます。',
              'প্রশ্নের উত্তর দিলে আপনার সিভি এখানে দেখা যাবে।'
            )}
          </p>
        )}

        {preview.summary && (
          <section>
            <h3 className="text-[11px] font-black tracking-wider uppercase text-slate-400">
              {t('Profile', 'プロフィール', 'পরিচিতি')}
            </h3>
            <p className="mt-1 text-sm text-slate-700 leading-relaxed">{preview.summary}</p>
          </section>
        )}

        {preview.sections.map(section => (
          <section key={section.title}>
            <h3 className="text-[11px] font-black tracking-wider uppercase text-slate-400 border-b border-slate-100 pb-1">
              {pickLang(section.title, lang)}
            </h3>
            <dl className="mt-2 space-y-2">
              {section.items.map(item => (
                <div key={item.key} className="grid grid-cols-5 gap-3 text-sm">
                  <dt className="col-span-2 text-slate-400 leading-snug">{pickLang(item.label, lang)}</dt>
                  <dd className="col-span-3 text-slate-800 whitespace-pre-line break-words">
                    {item.type === 'select' ? pickLang(item.value, lang) : item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      {audience === 'owner' && (
        <p className="px-6 py-3 bg-slate-50 text-[11px] text-slate-400 leading-relaxed">
          {t(
            'Your phone number, e-mail and passport details are not part of this CV.',
            '電話番号、メールアドレス、パスポート情報はこのCVには含まれません。',
            'আপনার ফোন নাম্বার, ইমেইল ও পাসপোর্টের তথ্য এই সিভিতে থাকে না।'
          )}
        </p>
      )}
    </div>
  );
}
