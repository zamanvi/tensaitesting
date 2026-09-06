'use client';

import { useLang } from '@/context/LanguageContext';
import Link from 'next/link';

export default function EmotionalStorySection() {
  // A Bangla-reading visitor doesn't need the English gloss right below it —
  // that was making everyone read the same one sentence twice. Kept for
  // en/ja visitors, who do need it to understand the Bangla headline above.
  const { lang } = useLang();

  return (
    <section className="relative flex items-center justify-center py-10 sm:py-16 px-4 overflow-hidden">
      {/* Soft background gradient & orbs */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d1117] via-[#0d1117]/95 to-[#0d1117] pointer-events-none" />

      {/* Large soft blur orbs for emotional atmosphere */}
      <div className="absolute top-0 right-[15%] w-[600px] h-[600px] bg-green-600/8 rounded-full blur-[200px] pointer-events-none animate-pulse" style={{ animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[180px] pointer-events-none animate-pulse" style={{ animation: 'pulse 10s cubic-bezier(0.4, 0, 0.6, 1) infinite 1s' }} />
      <div className="absolute top-[40%] left-[5%] w-[400px] h-[400px] bg-violet-600/4 rounded-full blur-[150px] pointer-events-none" />

      {/* Soft grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.008] pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '100px 100px',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto w-full">

        {/* Top accent line */}
        <div className="flex items-center justify-center mb-6 sm:mb-12">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-green-500/30" />
          <span className="mx-4 text-green-500/50 text-xs font-semibold tracking-widest">OUR MISSION</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-green-500/30" />
        </div>

        {/* Main emotional statement - BENGALI */}
        <div lang="bn" className="text-center mb-4 sm:mb-8 animate-fade-up">
          <p className="text-xl sm:text-2xl md:text-3xl font-bold leading-[1.5] bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mb-2 sm:mb-3">
            অজানা পথের ভয় ভুলে,
          </p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold leading-[1.5] bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mb-4 sm:mb-8">
            বিদেশ যাত্রার পথটাকে সত্যি আর মসৃণ করতে—
          </p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold leading-[1.5] bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mb-6 sm:mb-12">
            Tensai সবসময় আপনার আপন সারথি।
          </p>
        </div>

        {/* English translation with softer styling */}
        {lang !== 'bn' && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-8 md:p-10 backdrop-blur-sm mb-6 sm:mb-12">
            <p className="text-center text-white/70 text-sm sm:text-lg leading-relaxed font-light">
              <span className="text-white/40 text-xs uppercase tracking-widest block mb-2 sm:mb-3">English Translation</span>
              "Forget the fear of unknown paths. To make your journey abroad truly smooth and safe—<span className="text-green-400 font-semibold">Tensai is always your trusted companion</span>, guiding you every step of the way."
            </p>
          </div>
        )}

        {/* What this means section */}
        <div className="grid sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-12">
          {[
            { icon: '🛡️', title: 'Trust', desc: 'No fraud, no fake profiles—just verified paths forward' },
            { icon: '🤝', title: 'Partnership', desc: 'We walk alongside you, not ahead or behind' },
            { icon: '✨', title: 'Clarity', desc: 'Every step transparent, every decision backed by data' },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 sm:p-6 text-center hover:bg-white/[0.05] hover:border-green-500/20 transition-all duration-300 group"
            >
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
              <h3 className="font-bold text-white text-xs sm:text-sm mb-1 sm:mb-2">{item.title}</h3>
              <p className="text-[11px] sm:text-xs text-white/50 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-white/40 text-xs sm:text-sm mb-4 sm:mb-6">
            Ready to start your global journey with confidence?
          </p>
          <Link href="/auth/register" className="group relative inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-gradient-to-r from-green-600 to-green-500 text-white font-bold text-sm hover:from-green-500 hover:to-green-400 transition-all duration-300 glow-green hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300 active:scale-95">
            <span>Begin Your Journey</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {/* Bottom accent line */}
        <div className="flex items-center justify-center mt-8 sm:mt-16">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-violet-500/20" />
          <span className="mx-4 text-white/20 text-xs">✦</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-violet-500/20" />
        </div>
      </div>
    </section>
  );
}
