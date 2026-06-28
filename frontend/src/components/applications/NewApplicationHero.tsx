'use client';

const STEPS = [
  { n: 1, label: 'Select Country Form' },
  { n: 2, label: 'Fill Student Info' },
  { n: 3, label: 'Education & Documents' },
  { n: 4, label: 'Save & Continue' },
];

export default function NewApplicationHero() {
  return (
    <div
      className="relative rounded-t-2xl overflow-hidden px-8 sm:px-12 py-10 sm:py-12"
      style={{ background: 'linear-gradient(135deg, #052e1c 0%, #064e3b 45%, #065f46 100%)' }}
    >
      {/* Ambient orbs */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,.18) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-20 -left-8 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(5,150,105,.12) 0%, transparent 70%)' }} />
      {/* Subtle grid texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)' }}>
          <svg width="12" height="12" fill="none" stroke="rgba(167,243,208,1)" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-[.12em]" style={{ color: 'rgba(167,243,208,.95)' }}>
            New Application
          </span>
        </div>

        {/* Title */}
        <h1 className="text-[26px] sm:text-[30px] font-black text-white leading-[1.1] tracking-[-0.02em] mb-3">
          Create a New Student<br className="hidden sm:block" /> Application
        </h1>
        <p className="text-[13px] sm:text-[14px] leading-relaxed mb-8 max-w-[420px] font-light"
          style={{ color: 'rgba(255,255,255,.55)' }}>
          Select a country form, fill in the student&apos;s details, and save to continue editing the full application.
        </p>

        {/* Steps */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-1.5">
          {STEPS.map((step, i) => (
            <div key={step.n} className="flex items-center gap-1.5">
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.11)' }}>
                <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                  style={{ background: 'rgba(167,243,208,.2)', border: '1px solid rgba(167,243,208,.3)', color: 'rgb(167,243,208)' }}>
                  {step.n}
                </span>
                <span className="hidden sm:inline text-[11.5px] font-semibold tracking-[-0.01em]"
                  style={{ color: 'rgba(255,255,255,.8)' }}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <svg className="hidden sm:block w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="rgba(255,255,255,.2)" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
