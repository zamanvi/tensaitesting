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

  const VALUES = [
    { icon: '🛡️', title: 'Trust', desc: 'No fraud, no fake profiles—just verified paths forward' },
    { icon: '🤝', title: 'Partnership', desc: 'We walk alongside you, not ahead or behind' },
    { icon: '✨', title: 'Clarity', desc: 'Every step transparent, every decision backed by data' },
  ];

  return (
    <section className="relative px-4 py-10 sm:py-14 overflow-hidden border-t border-white/[0.05]">
      {/* Soft background glow */}
      <div className="absolute top-0 right-[15%] w-[420px] h-[420px] bg-green-600/8 rounded-full blur-[160px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-[10%] w-[360px] h-[360px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 max-w-3xl mx-auto w-full text-center">
        <p className="text-green-400/80 text-xs font-semibold tracking-[0.25em] uppercase mb-4 sm:mb-5">
          {ja ? '私たちの使命' : bn ? 'আমাদের লক্ষ্য' : 'Our Mission'}
        </p>

        {/* Main emotional statement - BENGALI */}
        <div lang="bn" className="mb-3 sm:mb-4 animate-fade-up">
          <p className="text-xl sm:text-2xl md:text-3xl font-bold leading-[1.5] bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
            অজানা পথের ভয় ভুলে,
          </p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold leading-[1.5] bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
            বিদেশ যাত্রার পথটাকে সত্যি আর মসৃণ করতে—
          </p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold leading-[1.5] bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
            Tensai সবসময় আপনার আপন সারথি।
          </p>
        </div>

        {/* English gloss — a caption under the headline, only for visitors who need it */}
        {lang !== 'bn' && (
          <p className="max-w-2xl mx-auto text-sm sm:text-base leading-relaxed text-white/65 italic">
            <span className="sr-only">English translation: </span>
            &ldquo;Forget the fear of unknown paths. To make your journey abroad truly smooth and safe&mdash;<span className="text-green-400 font-semibold not-italic">Tensai is always your trusted companion</span>, guiding you every step of the way.&rdquo;
          </p>
        )}

        {/* The three values — a light row, no boxes */}
        <div className="grid sm:grid-cols-3 gap-5 sm:gap-8 mt-8 sm:mt-10 text-center">
          {VALUES.map((v) => (
            <div key={v.title}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-lg" aria-hidden="true">{v.icon}</span>
                <h3 className="font-bold text-white text-sm">{v.title}</h3>
              </div>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-[16rem] mx-auto">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
