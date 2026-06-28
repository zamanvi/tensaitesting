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
      className="relative rounded-t-2xl overflow-hidden px-8 sm:px-10 py-7 sm:py-8"
      style={{ background: 'linear-gradient(135deg, #052e1c 0%, #064e3b 45%, #065f46 100%)' }}
    >
      {/* Ambient orbs */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,.18) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-20 -left-8 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(5,150,105,.12) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)' }}>
          <svg width="11" height="11" fill="none" stroke="rgba(167,243,208,1)" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-[.12em]" style={{ color: 'rgba(167,243,208,.95)' }}>
            New Application
          </span>
        </div>

        {/* Title + subtitle — full width, two-column layout */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-10 mb-6">
          <h1 className="text-[22px] sm:text-[26px] font-black text-white leading-[1.12] tracking-[-0.02em] sm:flex-shrink-0">
            Create a New Student Application
          </h1>
          <p className="mt-2 sm:mt-0 text-[12.5px] leading-relaxed font-light w-full"
            style={{ color: 'rgba(255,255,255,.5)' }}>
            Select a country form, fill in the student&apos;s details, and save to continue editing the full application.
          </p>
        </div>

        {/* Steps — premium box row, full width */}
        <div className="w-full rounded-xl flex items-stretch overflow-hidden"
          style={{ background: 'rgba(0,0,0,.18)', border: '1px solid rgba(255,255,255,.1)' }}>
          {STEPS.map((step, i) => (
            <div key={step.n} className="flex-1 flex items-center gap-2.5 px-4 py-3 relative">
              {/* divider */}
              {i > 0 && (
                <div className="absolute left-0 top-2 bottom-2 w-px" style={{ background: 'rgba(255,255,255,.1)' }} />
              )}
              <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                style={{ background: 'rgba(167,243,208,.2)', border: '1px solid rgba(167,243,208,.35)', color: 'rgb(167,243,208)' }}>
                {step.n}
              </span>
              <span className="text-[11px] font-semibold leading-tight"
                style={{ color: 'rgba(255,255,255,.78)' }}>
                {step.label}
              </span>
              {i < STEPS.length - 1 && (
                <svg className="w-3 h-3 flex-shrink-0 ml-auto" fill="none" stroke="rgba(255,255,255,.2)" viewBox="0 0 24 24">
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
