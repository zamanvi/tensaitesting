'use client';

import { useLang } from '@/context/LanguageContext';

// One calm statement. The Bangla line is the headline (wording unchanged), set as a single
// flowing paragraph in one color; the English translation is a plain, muted caption under it
// for visitors who need it. No colored phrases, no italics, no glow — the eyebrow label is the
// only accent.
export default function EmotionalStorySection() {
  const { lang } = useLang();
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  return (
    <section className="px-4 py-14 sm:py-20 border-t border-white/[0.05]">
      <div className="max-w-3xl mx-auto text-center">
        <p className="t-eyebrow mb-5">
          {ja ? '私たちの使命' : bn ? 'আমাদের লক্ষ্য' : 'Our Mission'}
        </p>

        <p
          lang="bn"
          className="text-balance text-2xl sm:text-3xl font-semibold leading-[1.65] text-[color:var(--t-strong)]"
        >
          অজানা পথের ভয় ভুলে, বিদেশ যাত্রার পথটাকে সত্যি আর মসৃণ করতে— Tensai সবসময় আপনার আপন সারথি।
        </p>

        {lang !== 'bn' && (
          <p className="t-body max-w-2xl mx-auto mt-6">
            <span className="sr-only">English translation: </span>
            Forget the fear of unknown paths. To make your journey abroad truly smooth and <span className="whitespace-nowrap">safe&mdash;</span>Tensai is always your trusted companion, guiding you every step of the way.
          </p>
        )}
      </div>
    </section>
  );
}
