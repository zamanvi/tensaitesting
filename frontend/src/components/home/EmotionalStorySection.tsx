'use client';

import { useLang } from '@/context/LanguageContext';

// Brand statement, kept as a compact band: the Bangla line is the headline,
// the English gloss is a one-line caption (not its own boxed block), and the
// three values are a light row instead of three cards — that content used to
// repeat what "Why Tensai" says right below, and its own CTA button repeated
// the hero's and the final one.
export default function EmotionalStorySection() {
  // A Bangla-reading visitor doesn't need the English gloss right below it —
  // that was making everyone read the same one sentence twice. Kept for
  // en/ja visitors, who do need it to understand the Bangla headline above.
  const { lang } = useLang();
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  return (
    <section className="relative px-4 py-12 sm:py-16 overflow-hidden border-t border-white/[0.05]">
      {/* Soft background glow */}
      <div className="absolute top-0 right-[15%] w-[420px] h-[420px] bg-green-600/8 rounded-full blur-[160px] pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 max-w-3xl mx-auto w-full text-center">
        <p className="t-eyebrow mb-4 sm:mb-5">
          {ja ? '私たちの使命' : bn ? 'আমাদের লক্ষ্য' : 'Our Mission'}
        </p>

        {/* Main emotional statement - BENGALI */}
        <div lang="bn" className="mb-3 sm:mb-4 animate-fade-up">
          <p className="text-balance text-xl sm:text-2xl md:text-3xl font-bold leading-[1.5] text-[color:var(--t-strong)]">
            অজানা পথের ভয় ভুলে,
          </p>
          <p className="text-balance text-xl sm:text-2xl md:text-3xl font-bold leading-[1.5] text-[color:var(--t-strong)]">
            বিদেশ যাত্রার পথটাকে সত্যি আর মসৃণ করতে—
          </p>
          <p className="text-balance text-xl sm:text-2xl md:text-3xl font-bold leading-[1.5] text-green-400">
            Tensai সবসময় আপনার আপন সারথি।
          </p>
        </div>

        {/* English gloss — a caption under the headline, only for visitors who need it */}
        {lang !== 'bn' && (
          <p className="max-w-2xl mx-auto t-body italic">
            <span className="sr-only">English translation: </span>
            &ldquo;Forget the fear of unknown paths. To make your journey abroad truly smooth and safe&mdash;<span className="text-green-400 font-semibold not-italic">Tensai is always your trusted companion</span>, guiding you every step of the way.&rdquo;
          </p>
        )}
      </div>
    </section>
  );
}
