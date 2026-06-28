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
      className="relative rounded-t-2xl overflow-hidden px-4 sm:px-8 md:px-10 py-7 sm:py-8"
      style={{ background: 'linear-gradient(135deg, #052e1c 0%, #064e3b 45%, #065f46 100%)' }}
    >
      {/* Ambient orbs */}
      <div className="absolute -top-16 -right-16 w-48 sm:w-64 h-48 sm:h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,.18) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-20 -left-8 w-44 sm:w-56 h-44 sm:h-56 rounded-full pointer-events-none"
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

        {/* Title */}
        <h1 className="text-[22px] sm:text-[26px] font-black text-white leading-[1.12] tracking-[-0.02em] mb-6">
          Create a New Student Application
        </h1>

        {/* Steps — mobile: numbered dots row; sm+: full label box */}
        {/* Mobile compact */}
        <div className="flex sm:hidden items-center gap-2">
          {STEPS.map((step, i) => (
            <div key={step.n} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{ background: 'rgba(0,0,0,.2)', border: '1px solid rgba(255,255,255,.1)' }}>
                <span className="w-[17px] h-[17px] rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
                  style={{ background: 'rgba(167,243,208,.2)', border: '1px solid rgba(167,243,208,.35)', color: 'rgb(167,243,208)' }}>
                  {step.n}
                </span>
                <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: 'rgba(255,255,255,.75)' }}>
                  {step.label.split(' ')[0]}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="rgba(255,255,255,.2)" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
        {/* Desktop full-width box */}
        <div className="hidden sm:flex w-full rounded-xl items-stretch overflow-hidden"
          style={{ background: 'rgba(0,0,0,.18)', border: '1px solid rgba(255,255,255,.1)' }}>
          {STEPS.map((step, i) => (
            <div key={step.n} className="flex-1 flex items-center gap-2.5 px-4 py-3 relative">
              {i > 0 && (
                <div className="absolute left-0 top-2 bottom-2 w-px" style={{ background: 'rgba(255,255,255,.1)' }} />
              )}
              <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                style={{ background: 'rgba(167,243,208,.2)', border: '1px solid rgba(167,243,208,.35)', color: 'rgb(167,243,208)' }}>
                {step.n}
              </span>
              <span className="text-[11px] font-semibold leading-tight" style={{ color: 'rgba(255,255,255,.78)' }}>
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
