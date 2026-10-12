'use client';
import CvPreviewCard from '@/components/cv/CvPreviewCard';
import type { CvLang, CvPreviewSection } from '@/components/cv/cvTypes';
import { useLang } from '@/context/LanguageContext';
import { PUBLIC_API } from '@/lib/publicApi';
import { useEffect, useState } from 'react';

interface PublicCv {
  ref: string | null;
  name: string | null;
  headline: string | null;
  summary: string | null;
  sections: CvPreviewSection[];
}

interface Contact { support_whatsapp?: string; cv_whatsapp?: string; support_email?: string }

// The CV a staff member sends to an employer or partner. No sign-in, no contact
// details of the candidate: employers get in touch through Tensai, quoting the
// reference number.
export default function CvPublicClient({ token }: { token: string }) {
  const { lang, toggle } = useLang();
  const t = (en: string, ja: string, bn: string) => (lang === 'ja' ? ja : lang === 'bn' ? bn : en);

  const [cv, setCv] = useState<PublicCv | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'gone'>('loading');
  const [contact, setContact] = useState<Contact>({});

  useEffect(() => {
    let live = true;
    fetch(`${PUBLIC_API}/public/cv/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async r => {
        if (!live) return;
        if (!r.ok) { setState('gone'); return; }
        setCv(await r.json());
        setState('ok');
      })
      .catch(() => { if (live) setState('gone'); });

    fetch(`${PUBLIC_API}/settings/public`)
      .then(r => (r.ok ? r.json() : {}))
      .then(s => { if (live) setContact(s); })
      .catch(() => {});

    return () => { live = false; };
  }, [token]);

  const wa = (contact.cv_whatsapp || contact.support_whatsapp || '').replace(/\D+/g, '');
  const langName = lang === 'ja' ? '日本語' : lang === 'bn' ? 'বাংলা' : 'English';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="print:hidden bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <p className="text-sm font-black text-green-700">Tensai Consultancy</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggle}
              className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
              {langName}
            </button>
            {state === 'ok' && (
              <button type="button" onClick={() => window.print()}
                className="px-3 py-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold">
                {t('Print / Save PDF', '印刷 / PDF保存', 'প্রিন্ট / PDF')}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {state === 'loading' && (
          <div className="bg-white rounded-2xl border border-slate-200 px-6 py-12 text-center text-sm text-slate-400">
            {t('Loading…', '読み込み中…', 'লোড হচ্ছে…')}
          </div>
        )}

        {state === 'gone' && (
          <div className="bg-white rounded-2xl border border-slate-200 px-6 py-12 text-center">
            <p className="text-base font-black text-slate-800">
              {t('This CV link is not available', 'このCVリンクは利用できません', 'এই সিভির লিংকটি পাওয়া যাচ্ছে না')}
            </p>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              {t(
                'The link may have been switched off. Please ask the person who sent it to you.',
                'リンクが無効になった可能性があります。送信者にお問い合わせください。',
                'লিংকটি বন্ধ করে দেওয়া হয়ে থাকতে পারে। যিনি পাঠিয়েছেন তাঁকে জিজ্ঞাসা করুন।'
              )}
            </p>
          </div>
        )}

        {state === 'ok' && cv && (
          <>
            <CvPreviewCard
              lang={lang as CvLang}
              audience="public"
              preview={{ name: cv.name, headline: cv.headline, summary: cv.summary, sections: cv.sections }}
              reference={cv.ref}
            />

            <section className="bg-white rounded-2xl border border-slate-200 px-6 py-5">
              <h2 className="text-sm font-black text-slate-800">
                {t('To contact this candidate', 'この候補者に連絡するには', 'এই প্রার্থীর সাথে যোগাযোগ করতে')}
              </h2>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                {t(
                  'Please contact Tensai Consultancy and quote the reference number. We arrange the introduction.',
                  'Tensai Consultancyに参照番号をお伝えのうえご連絡ください。ご紹介の手配をいたします。',
                  'অনুগ্রহ করে Tensai Consultancy-র সাথে যোগাযোগ করুন এবং রেফারেন্স নম্বরটি জানান। পরিচয় করিয়ে দেওয়ার ব্যবস্থা আমরা করব।'
                )}
                {cv.ref && <> <span className="font-black text-slate-900">{cv.ref}</span></>}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 print:hidden">
                {wa && (
                  <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`CV reference ${cv.ref ?? ''}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white text-sm font-black">
                    WhatsApp
                  </a>
                )}
                {contact.support_email && (
                  <a href={`mailto:${contact.support_email}?subject=${encodeURIComponent(`CV reference ${cv.ref ?? ''}`)}`}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-bold text-slate-700">
                    {contact.support_email}
                  </a>
                )}
              </div>
            </section>

            <p className="text-[11px] text-slate-400 leading-relaxed text-center px-4">
              {t(
                'Shared with the candidate’s permission by Tensai Consultancy, a consultancy. The details were given by the candidate and checked by our team; Tensai does not guarantee employment or visas.',
                '本人の許可のもと、コンサルタント会社Tensai Consultancyが共有しています。内容は本人が提供し、当社スタッフが確認しています。雇用やビザを保証するものではありません。',
                'প্রার্থীর অনুমতি নিয়ে পরামর্শদাতা প্রতিষ্ঠান Tensai Consultancy এটি শেয়ার করেছে। তথ্যগুলো প্রার্থী নিজে দিয়েছেন এবং আমাদের টিম দেখেছে; Tensai চাকরি বা ভিসার নিশ্চয়তা দেয় না।'
              )}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
