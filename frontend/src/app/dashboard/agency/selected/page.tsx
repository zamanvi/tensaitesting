'use client';
import AgencyLayout from '@/components/shared/AgencyLayout';

export default function AgencySelectedPage() {
  return (
    <AgencyLayout>
      <div className="max-w-5xl space-y-6">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-[0.15em] font-semibold mb-2">
            Selected Applicants
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Selected
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Applicants who have been selected and approved.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">No selected applicants yet.</p>
        </div>
      </div>
    </AgencyLayout>
  );
}
