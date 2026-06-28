'use client';
import BranchesFooter from '@/components/branches/BranchesFooter';
import BranchesNavbar from '@/components/branches/BranchesNavbar';
import { useLang } from '@/context/LanguageContext';
import { PUBLIC_API } from '@/lib/publicApi';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Branch {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  city: string;
  country: string;
  address: string | null;
  phone: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  stats: Record<string, string> | null;
}

export default function BranchesPage() {
  const { lang } = useLang();
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const [branches, setBranches]     = useState<Branch[]>([]);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const load = () => {
    setFetchError(false);
    setLoading(true);
    fetch(`${PUBLIC_API}/branches`)
      .then(r => r.json())
      .then(d => setBranches(Array.isArray(d) ? d : []))
      .catch(err => { console.error('Failed to load branches:', err); setFetchError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const title    = ja ? '支局一覧' : bn ? 'আমাদের শাখাসমূহ' : 'Our Branches';
  const subtitle = ja
    ? '全国の支局からサポートを受けられます。'
    : bn
    ? 'সারা দেশে আমাদের শাখা অফিস থেকে সেবা নিন।'
    : 'Get face-to-face guidance from verified consultants in your city.';

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      <BranchesNavbar />

      {/* Hero */}
      <section className="relative px-4 pt-32 pb-12 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {branches.length > 3
              ? (ja ? '全国展開中' : bn ? 'সারাদেশে সক্রিয়' : 'Active Nationwide')
              : (ja ? '拡大中' : bn ? 'বিস্তার হচ্ছে' : 'Growing Network')}
          </div>
          <h1 className="text-fluid-hero font-black text-white tracking-tight mb-4 leading-[1.06]">{title}</h1>
          <p className="text-fluid-base text-white/45 max-w-lg mx-auto leading-relaxed">{subtitle}</p>
        </div>
      </section>

      {/* Branch Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-20 flex-1 w-full">

        {/* Error */}
        {fetchError && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-white/50 text-sm mb-4">{ja ? '読み込みに失敗しました。' : bn ? 'লোড করতে ব্যর্থ হয়েছে।' : 'Failed to load branches.'}</p>
            <button onClick={load} className="text-xs text-green-400 border border-green-500/30 px-4 py-2 rounded-full hover:bg-green-500/10 transition-all">
              {ja ? '再試行' : bn ? 'আবার চেষ্টা করুন' : 'Try again'}
            </button>
          </div>
        )}

        {/* Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-2xl bg-white/[0.04] border border-white/[0.06] overflow-hidden animate-pulse">
                <div className="h-44 bg-white/[0.06]" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-white/[0.06] rounded w-2/3" />
                  <div className="h-3 bg-white/[0.04] rounded w-1/3" />
                  <div className="h-3 bg-white/[0.04] rounded w-full" />
                  <div className="h-3 bg-white/[0.04] rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !fetchError && branches.length === 0 && (
          <div className="text-center py-20 max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-white font-bold text-lg mb-2">
              {ja ? '支局は近日公開' : bn ? 'শাখা শীঘ্রই আসছে' : 'Coming to your city soon'}
            </h2>
            <p className="text-white/40 text-sm mb-8 leading-relaxed">
              {ja
                ? 'Tensaiは全国に支局ネットワークを構築中です。まずはオンラインで無料相談を受け付けています。'
                : bn
                ? 'টেনসাই সারা দেশে শাখা অফিসের নেটওয়ার্ক তৈরি করছে। এখনই রেজিস্ট্রেশন করুন এবং সর্বপ্রথম সুযোগ পান।'
                : "We're expanding fast. Register now and be first in line when we open near you."}
            </p>
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-full text-sm font-bold transition-all">
              {ja ? '今すぐ登録する' : bn ? 'এখনই রেজিস্ট্রেশন করুন' : 'Get early access'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        )}

        {/* Cards */}
        {!loading && !fetchError && branches.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map(branch => (
              <Link key={branch.id} href={`/branches/${branch.slug}`}
                className="group rounded-2xl overflow-hidden border border-white/[0.08] hover:border-green-500/30 transition-all duration-300 bg-white/[0.02] hover:bg-white/[0.04] flex flex-col">

                {/* Cover */}
                <div className="h-44 bg-gradient-to-br from-green-900/30 to-slate-900/50 overflow-hidden relative shrink-0">
                  {branch.cover_image_url ? (
                    <Image src={branch.cover_image_url} alt={branch.name} fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {branch.logo_url && (
                      <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/10 shrink-0">
                        <Image src={branch.logo_url} alt={`${branch.name} logo`} fill className="object-cover" sizes="28px" />
                      </div>
                    )}
                    <h3 className="font-bold text-white text-sm">{branch.name}</h3>
                  </div>

                  <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium mb-3">
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {branch.city}{branch.country && branch.country !== 'Bangladesh' ? `, ${branch.country}` : ''}
                  </div>

                  {branch.tagline && (
                    <p className="text-white/45 text-xs leading-relaxed mb-4 line-clamp-2">{branch.tagline}</p>
                  )}

                  {branch.stats && Object.keys(branch.stats).length > 0 && (
                    <div className="flex gap-3 mb-4">
                      {Object.entries(branch.stats).slice(0, 3).map(([key, val]) => (
                        <div key={key} className="text-center">
                          <div className="text-green-400 font-bold text-sm">{String(val)}</div>
                          <div className="text-white/30 text-[9px] truncate max-w-[60px]">{key}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-xs text-white/40 space-y-1 min-w-0">
                      {branch.phone && (
                        <div className="flex items-center gap-1.5 truncate">
                          <svg className="w-3 h-3 shrink-0 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="truncate">{branch.phone}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-green-400 font-semibold group-hover:translate-x-1 transition-transform shrink-0 ml-3 flex items-center gap-1">
                      {ja ? '詳しく見る' : bn ? 'বিস্তারিত দেখুন' : 'View details'}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <BranchesFooter />
    </div>
  );
}
