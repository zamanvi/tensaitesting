'use client';
import BranchesFooter from '@/components/branches/BranchesFooter';
import SiteHeader from '@/components/shared/SiteHeader';
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
  phone_2: string | null;
  whatsapp: string | null;
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
      <SiteHeader active="branches" />

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

                  {/* Action Cards */}
                  <div className="mt-auto pt-4 -mx-5 -mb-5 px-5 py-4 bg-gradient-to-r from-white/[0.02] to-white/[0.01] border-t border-white/[0.06] flex gap-2">
                    {/* Phone 1 */}
                    {branch.phone && (
                      <a href={`tel:${branch.phone.replace(/[^\d+]/g, '')}`}
                        onClick={(e) => e.preventDefault()}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] hover:border-green-500/40 text-white rounded-lg transition-all duration-200 group/phone"
                        title={branch.phone}>
                        <svg className="w-3.5 h-3.5 text-white/60 group-hover/phone:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-[11px] font-semibold truncate group-hover/phone:text-green-300 transition-colors">{branch.phone}</span>
                      </a>
                    )}

                    {/* Phone 2 */}
                    {branch.phone_2 && (
                      <a href={`tel:${branch.phone_2.replace(/[^\d+]/g, '')}`}
                        onClick={(e) => e.preventDefault()}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] hover:border-green-500/40 text-white rounded-lg transition-all duration-200 group/phone"
                        title={branch.phone_2}>
                        <svg className="w-3.5 h-3.5 text-white/60 group-hover/phone:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-[11px] font-semibold truncate group-hover/phone:text-green-300 transition-colors">{branch.phone_2}</span>
                      </a>
                    )}

                    {/* WhatsApp */}
                    {branch.whatsapp && (
                      <a href={`https://wa.me/${branch.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center px-3 py-2.5 bg-green-600/20 hover:bg-green-600/40 border border-green-500/30 hover:border-green-400/60 text-green-300 hover:text-green-200 rounded-lg transition-all duration-200 group/wa"
                        title="WhatsApp">
                        <svg className="w-4 h-4 transition-transform group-hover/wa:scale-110" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </a>
                    )}
                  </div>

                  {/* View Details Link */}
                  <div className="px-5 py-3 -mx-5 -mb-5 border-t border-white/[0.06] text-center">
                    <span className="text-xs text-green-400 font-semibold group-hover:text-green-300 transition-colors flex items-center justify-center gap-1.5">
                      {ja ? '詳しく見る' : bn ? 'বিস্তারিত দেখুন' : 'View details'}
                      <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
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
