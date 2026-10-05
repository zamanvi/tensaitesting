'use client';

import { useLang } from '@/context/LanguageContext';

// One calm statement, shown ONCE in the visitor's own language (it used to appear twice for
// English and Japanese visitors: the Bangla line plus its translation underneath). The Bangla
// wording is the original brand statement, unchanged; the English is its translation, unchanged.
export default function EmotionalStorySection() {
  const { lang } = useLang();
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const statement = bn
    ? 'অজানা পথের ভয় ভুলে, বিদেশ যাত্রার পথটাকে সত্যি আর মসৃণ করতে— Tensai সবসময় আপনার আপন সারথি।'
    : ja
    // Japanese is a draft translation of the same sentence — to be reviewed.
    ? '未知の道への不安は手放しましょう。海外への旅を本当に安全でスムーズにするために——Tensaiは、いつもあなたの信頼できる伴走者として、一歩ずつ導きます。'
    : (
      <>
        Forget the fear of unknown paths. To make your journey abroad truly smooth and{' '}
        <span className="whitespace-nowrap">safe&mdash;</span>Tensai is always your trusted companion, guiding you every step of the way.
      </>
    );

  return (
    <section className="px-4 py-14 sm:py-20 border-t border-white/[0.05]">
      <div className="max-w-3xl mx-auto text-center">
        <p className="t-eyebrow mb-5">
          {ja ? '私たちの使命' : bn ? 'আমাদের লক্ষ্য' : 'Our Mission'}
        </p>

        <p className="text-balance text-xl sm:text-2xl md:text-3xl font-semibold leading-[1.65] text-[color:var(--t-strong)]">
          {statement}
        </p>
      </div>
    </section>
  );
}
