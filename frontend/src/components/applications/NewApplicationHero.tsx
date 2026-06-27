'use client';

/* Exact match of admin Blade .cap-hero CSS:
   background: linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)
   max-width: 860px per .cap container */

const STEPS = [
  { n: 1, label: 'Select Country Form' },
  { n: 2, label: 'Fill Student Info' },
  { n: 3, label: 'Education & Documents' },
  { n: 4, label: 'Save & Continue' },
];

export default function NewApplicationHero() {
  return (
    <div
      className="relative rounded-t-[20px] overflow-hidden px-6 sm:px-9 py-8 sm:py-[32px]"
      style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)' }}
    >
      {/* bg circles */}
      <div className="absolute -top-[50px] -right-[50px] w-[220px] h-[220px] rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,.06)' }} />
      <div className="absolute -bottom-[70px] -left-[30px] w-[180px] h-[180px] rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,.04)' }} />

      <div className="relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 mb-3 px-[13px] py-1 rounded-full text-[10.5px] font-bold uppercase tracking-[.08em]"
          style={{ background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.25)', color: 'rgba(255,255,255,.95)' }}>
          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          New Application
        </div>

        {/* Title */}
        <h1 className="text-[26px] font-extrabold text-white leading-tight mb-2">
          Create a New Student Application
        </h1>
        <p className="text-[13px] leading-relaxed mb-5 max-w-[480px]" style={{ color: 'rgba(255,255,255,.72)' }}>
          Select a country form, fill in the student&apos;s details, and save to continue editing the full application.
        </p>

        {/* Steps */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STEPS.map((step, i) => (
            <div key={step.n} className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 px-[13px] py-[6px] rounded-lg text-[11.5px] font-medium"
                style={{ background: 'rgba(255,255,255,.13)', border: '1px solid rgba(255,255,255,.18)', color: 'rgba(255,255,255,.88)' }}>
                <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,.28)' }}>
                  {step.n}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <span className="hidden sm:inline text-sm" style={{ color: 'rgba(255,255,255,.3)' }}>›</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
